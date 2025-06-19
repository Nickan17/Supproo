/// <reference types="https://deno.land/x/types@v0.3/index.d.ts" />
// This function resolves a UPC to a product URL and then scrapes the product data using Firecrawl.
// It calls the firecrawl-extract function to perform the scraping.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// import { delay } from 'https://deno.land/std@0.224.0/async/delay.ts'; // 'delay' is not used, can be removed
// Supabase client import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
// Environment variables (ensure these are set as Supabase secrets)
// Using standard Supabase env var names for clarity and consistency
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""; // Standard Supabase project URL env var
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""; // Standard Supabase service key env var
console.log("🧪 Environment Variables Loaded: FIRECRAWL_API_KEY:", !!Deno.env.get("FIRECRAWL_API_KEY"), "OPENROUTER_API_KEY:", !!OPENROUTER_API_KEY, "SUPABASE_URL:", !!SUPABASE_URL, "SUPABASE_SERVICE_ROLE_KEY:", !!SUPABASE_SERVICE_ROLE_KEY);
// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
// Helper function: upcVariants - Placed at top-level scope (correctly done in your provided code)
function upcVariants(raw: string): string[] {
  const cleaned = raw.replace(/\D/g, '');
  const ean13 = cleaned.padStart(13, '0');
  const upc12 = ean13.slice(1); // drop leading 0
  return Array.from(new Set([cleaned, upc12, ean13])); // unique list
}
// Global rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 5;
const requestCounts = new Map<string, { count: number; lastReset: number }>();
// Main Edge Function handler
serve(async (req: Request) => {
  const requestStartTime = new Date().toISOString();
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  console.log(`[${requestStartTime}] Request started from IP: ${clientIp}`);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // CORS for development/testing
  };
  try { // Outer try-catch for the entire request handling (for any uncaught errors)
    // Handle CORS OPTIONS request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    // Rate Limiting Logic
    const now = Date.now();
    const ipData = requestCounts.get(clientIp) || { count: 0, lastReset: now };
    if (now - ipData.lastReset > RATE_LIMIT_WINDOW_MS) {
      ipData.count = 1;
      ipData.lastReset = now;
    } else {
      ipData.count++;
    }
    requestCounts.set(clientIp, ipData);
    if (ipData.count > MAX_REQUESTS_PER_MINUTE) {
      console.log(`[${new Date().toISOString()}] Rate limit triggered for IP: ${clientIp}`);
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers });
    }
    // Check request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers });
    }
    // Check for required environment variables
    if (!Deno.env.get("FIRECRAWL_API_KEY")) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not set" }), { status: 500, headers });
    }
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not set" }), { status: 500, headers });
    }
    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ error: "SUPABASE_URL not set" }), { status: 500, headers });
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }), { status: 500, headers });
    }
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid JSON body", details: `${error}` }), { status: 400, headers });
    }
    const { upc } = requestBody;
    if (!upc || typeof upc !== 'string') {
      return new Response(JSON.stringify({ error: "Invalid UPC format. Expected { upc: string }" }), { status: 400, headers });
    }
    let finalUrl: string | null = null;
    let source: "openfoodfacts" | "openrouter" | "unknown" = "unknown";
    let openFoodData: any = null; // Store the full OFF response here
    let offProduct: any = null; // Store the product object itself
    let offStatus: number | null = null; // Store the top-level status
    // Variables for extracted OFF data
    let productName: string | null = null;
    let productBrand: string | null = null;
    // 1. Attempt to fetch product page URL from OpenFoodFacts using UPC variants
    for (const code of upcVariants(upc)) {
      try {
        console.log(`[${new Date().toISOString()}] Attempting OpenFoodFacts lookup for UPC variant: ${code}`);
        const openFoodFactsResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        if (openFoodFactsResponse.ok) {
          openFoodData = await openFoodFactsResponse.json(); // Assign full response
          offProduct = openFoodData.product; // Extract product object
          offStatus = openFoodData.status; // Extract top-level status
          console.log('📦 OpenFoodFacts raw response:', JSON.stringify(openFoodData, null, 2));
          if (offProduct && offStatus === 1 && offProduct.url) { // Check if OFF provides a direct URL
            finalUrl = offProduct.url;
            source = "openfoodfacts";
            console.log(`[${new Date().toISOString()}] OpenFoodFacts found direct URL for variant ${code}: ${finalUrl}`);
            break; // Exit loop if a valid product URL is found
          } else {
            console.log(`[${new Date().toISOString()}] OpenFoodFacts found product for variant ${code} but status is not 1 or no direct URL.`);
          }
        } else {
          console.warn(`[${new Date().toISOString()}] OpenFoodFacts API error for variant ${code}: ${openFoodFactsResponse.status} ${openFoodFactsResponse.statusText}`);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching from OpenFoodFacts for variant ${code}:`, error);
      }
    }
    // 2. Robustly extract productName and productBrand from offProduct if available
    if (offProduct && offStatus === 1) {
      productName =
        offProduct?.product_name ||
        offProduct?.product_name_en ||
        offProduct?.product_name_original ||
        offProduct?.generic_name ||
        null;
      productBrand =
        offProduct?.brands
          ?.split(/[;,]/)?.[0]
          ?.trim() || null;
      console.log("🟢 OFF extracted name:", productName);
      console.log("🟢 OFF extracted brand:", productBrand);
    }
    // 3. AI (OpenRouter) Call if finalUrl not found by OFF
    if (!finalUrl) {
      let promptContext: string = '';
      let includeRawOffJson: boolean = false;
      const isValidName = productName && productName.length > 4 && !productName.toLowerCase().includes("unknown");
      const isValidBrand = productBrand && productBrand.length > 2 && !productBrand.toLowerCase().includes("unknown");
      if (isValidName || isValidBrand) {
        promptContext += `Product Name: ${productName || 'N/A'}\n`;
        promptContext += `Brand: ${productBrand || 'N/A'}\n`;
        promptContext += `UPC: ${upc}`;
      } else if (offProduct && offStatus === 1) {
        includeRawOffJson = true;
        promptContext += `UPC: ${upc}\n\n`;
        promptContext += `OpenFoodFacts raw product JSON:\n<OFF_JSON>\n${JSON.stringify(offProduct, null, 2)}\n</OFF_JSON>`;
      } else {
        promptContext += `UPC: ${upc}`;
      }
      let aiPromptContent: string;
      aiPromptContent = `You are a supplement research assistant. Your task is to find the official product page URL for a supplement.
  ${promptContext}
  Instructions:
  1. Search for the product page on the brand's official website.
  2. If multiple links exist, choose the most relevant one for the product.
  3. If a valid URL appears in the citations or search results, return it.
  4. Only return "<url>NOT_FOUND</url>" if there is absolutely no product page found on the brand's website.
  5. Output only one result in this format:
  <url>https://brand.com/product</url>
  Do not include any other text or explanation.`;
      // Call OpenRouter API
      const openrouterRes = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "perplexity/sonar",
          messages: [
            { role: "system", content: "You are an expert web research assistant that returns only the requested URL." },
            { role: "user", content: aiPromptContent },
          ],
          temperature: 0.0,
        }),
      });
      if (!openrouterRes.ok) {
        console.error(`OpenRouter API error: ${openrouterRes.status} - ${await openrouterRes.text()}`);
        return new Response(JSON.stringify({ error: "Failed to communicate with AI service for URL lookup." }), { status: 500, headers });
      }
      const openrouterJson = await openrouterRes.json();
      const responseText = openrouterJson.choices?.[0]?.message?.content?.trim();
      console.log("🤖 OpenRouter raw response (including tags):", responseText);
      const urlMatch = responseText.match(/<url>\s*(https?:\/\/[^<\s]+)\s*<\/url>/i);
      if (urlMatch && urlMatch[1] && urlMatch[1].startsWith("http") && urlMatch[1] !== "NOT_FOUND") {
        finalUrl = urlMatch[1];
        source = "openrouter";
      } else {
        console.warn(`🤖 OpenRouter returned no valid URL within tags for UPC: ${upc}. Response: ${responseText}`);
      }
    }
    if (!finalUrl || !finalUrl.startsWith("http")) {
      return new Response(
        JSON.stringify({ error: "Could not resolve product URL from any source (client, OFF, or AI)." }),
        { status: 404, headers },
      );
    }
    try {
      new URL(finalUrl); // Validate the resolved URL
    } catch {
      return new Response(JSON.stringify({ error: "Resolved product URL is invalid.", product_url: finalUrl, upc, source }), { status: 400, headers });
    }
    // Validate URL accessibility with a HEAD request before scraping
    try {
      const headRes = await fetch(finalUrl, { method: "HEAD" });
      if (!headRes.ok || headRes.status === 404 || headRes.status === 410) {
        console.warn(`🛑 URL is unreachable or gone (status: ${headRes.status}): ${finalUrl}`);
        return new Response(
          JSON.stringify({ error: `Resolved product URL is not reachable (status: ${headRes.status}).`, product_url: finalUrl, upc, source }),
          { status: 404, headers },
        );
      }
    } catch (err) {
      console.error("🛑 Error validating final URL before scrape:", err);
      return new Response(
        JSON.stringify({ error: "Could not verify product URL before scrape.", product_url: finalUrl, upc, source }),
        { status: 502, headers },
      );
    }
        // Send the resolved URL to Firecrawl for full scraping
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25 seconds
    const fcRes = await fetch(`${new URL(req.url).origin}/functions/v1/firecrawl-extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: finalUrl }),
    });
    if (!fcRes.ok) {
      return new Response(
        JSON.stringify({ error: `Firecrawl ${fcRes.status}`, detail: await fcRes.text() }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
    const scrapeData = await fcRes.json();
    return new Response(
      JSON.stringify({ scrapeData, source, productUrl: finalUrl, upc }),
      { status: 200, headers }
    );
  } catch (err: any) {
    console.error("Error in process-upc handler:", err);
    return new Response(
      JSON.stringify({ error: err.message || String(err) }),
      { status: 500, headers }
    );
  }
}); // Correct closing for Deno.serve
