// This function is ready for cloud deployment using:
// npx supabase functions deploy process-upc --no-verify-jwt

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { delay } from 'https://deno.land/std@0.224.0/async/delay.ts';

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;
console.log("🧪 FIRECRAWL_API_KEY loaded:", !!FIRECRAWL_API_KEY);
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const SUPABASE_URL = Deno.env.get("BASE_URL")!;
const SERVICE_KEY = Deno.env.get("SERVICE_KEY")!;

const startTime = Date.now();
const requestCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 5;

serve(async (req: Request) => {
  console.log("🧪 FIRECRAWL_API_KEY loaded:", !!FIRECRAWL_API_KEY);
  const requestStartTime = new Date().toISOString();
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  console.log(`[${requestStartTime}] Request started from IP: ${clientIp}`);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers });
  }

  if (!FIRECRAWL_API_KEY) {
    return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not set" }), { status: 500, headers });
  }

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

  // New: Variables for extracted OFF data
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
  if (offProduct && offStatus === 1) { // Corrected status check using offStatus
    productName =
      offProduct?.product_name ||
      offProduct?.product_name_en || // Added fallback
      offProduct?.product_name_original || // Added fallback
      offProduct?.generic_name ||
      null;

    productBrand =
      offProduct?.brands
        ?.split(/[;,]/)?.[0]       // handle comma OR semicolon with regex
        ?.trim() || null;

    console.log("🟢 OFF extracted name:", productName);
    console.log("🟢 OFF extracted brand:", productBrand);
  }

  // 3. AI (OpenRouter) Call if finalUrl not found by OFF
  if (!finalUrl) { // Only call AI if finalUrl wasn't set by OFF
let promptContext: string = '';
let includeRawOffJson: boolean = false;

// 🧠 Sanity checks: treat weak name/brand as missing
const isValidName = productName && productName.length > 4 && !productName.toLowerCase().includes("unknown");
const isValidBrand = productBrand && productBrand.length > 2 && !productBrand.toLowerCase().includes("unknown");

if (isValidName || isValidBrand) {
  // ✅ Clean name/brand available – build lean context
  promptContext += `Product Name: ${productName || 'N/A'}\n`;
  promptContext += `Brand: ${productBrand || 'N/A'}\n`;
  promptContext += `UPC: ${upc}`;
} else if (offProduct && offStatus === 1) {
  // 🛟 Fallback: valid OFF product, but name/brand not extracted – give raw JSON
  includeRawOffJson = true;
  promptContext += `UPC: ${upc}\n\n`;
  promptContext += `OpenFoodFacts raw product JSON:\n<OFF_JSON>\n${JSON.stringify(offProduct, null, 2)}\n</OFF_JSON>`;
} else {
  // 🧼 Final fallback – no OFF data, just UPC
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
        model: "perplexity/sonar", // Or the preferred web-enhanced model
        messages: [
          { role: "system", content: "You are an expert web research assistant that returns only the requested URL." }, // Refined system message
          { role: "user", content: aiPromptContent },
        ],
        temperature: 0.0, // Changed to 0.0 for stricter formatting
      }),
    });

    if (!openrouterRes.ok) {
      console.error(`OpenRouter API error: ${openrouterRes.status} - ${await openrouterRes.text()}`);
      return new Response(JSON.stringify({ error: "Failed to communicate with AI service for URL lookup." }), { status: 500, headers });
    }

    const openrouterJson = await openrouterRes.json();
    const responseText = openrouterJson.choices?.[0]?.message?.content?.trim();

    console.log("🤖 OpenRouter raw response (including tags):", responseText);

    // Robustly parse the URL from within <url> tags
    const urlMatch = responseText.match(/<url>\s*(https?:\/\/[^<\s]+)\s*<\/url>/i); // Updated regex
    if (urlMatch && urlMatch[1] && urlMatch[1].startsWith("http") && urlMatch[1] !== "NOT_FOUND") {
      finalUrl = urlMatch[1];
      source = "openrouter"; // Indicate source is OpenRouter
    } else {
      console.warn(`🤖 OpenRouter returned no valid URL within tags for UPC: ${upc}. Response: ${responseText}`);
    }
  }

  // ✅ Additional guard before scraping (already present and correct)
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

  // ⭐ NEW: Validate URL accessibility with a HEAD request before scraping ⭐
  try {
    const headRes = await fetch(finalUrl, { method: "HEAD" });
    if (!headRes.ok || headRes.status === 404 || headRes.status === 410) { // Also check for 410 Gone
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
      { status: 502, headers }, // 502 Bad Gateway if external check fails
    );
  }

  // 3. Send the resolved URL to Firecrawl for full scraping
  try {
    const TIMEOUT_MS = 9000; // 9s max timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const FIRECRAWL_ENDPOINT = `${FIRECRAWL_BASE_URL}/v1/scrape`;
    const body = {
      url: finalUrl, // dynamically determined product page
      formats: ["html"]
    };

    let firecrawlResponse;
    try {
      console.log(`[${new Date().toISOString()}] Attempting Firecrawl scrape for URL: ${finalUrl}`);
      console.log("📦 Firecrawl Request Body:", JSON.stringify(body, null, 2));
      console.log("🔥 Final Firecrawl Request", {
        url: finalUrl,
        formats: ["html"],
        FIRECRAWL_API_KEY_PRESENT: !!FIRECRAWL_API_KEY,
      });
      firecrawlResponse = await fetch(FIRECRAWL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      console.error("⏱️ Firecrawl request timed out or failed:", err.message);
      return new Response(JSON.stringify({ error: "Firecrawl request timed out" }), {
        status: 504, headers
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!firecrawlResponse) {
      return new Response(JSON.stringify({ error: "Firecrawl API did not return a response." }), { status: 500, headers });
    }

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text(); // 🔍 Log raw Firecrawl error
      console.error("🔥 Firecrawl Response Error Body:", errorText);
      return new Response(JSON.stringify({ error: errorText }), {
        status: firecrawlResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log("RAW Firecrawl JSON:", JSON.stringify(firecrawlData, null, 2));

    if (!firecrawlData?.data) {
      return new Response(JSON.stringify({ error: "Firecrawl returned no data" }), { status: 502, headers });
    }

    const row = {
      upc,
      product_url: finalUrl,
      raw_html: firecrawlData.content.html,
      source: "firecrawl"
    };

console.log("🧪 Writing to table:", "raw_products");
    console.log(`[${new Date().toISOString()}] Inserting into Supabase raw_products table for UPC: ${upc}`);
    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/raw_products?on_conflict=product_url`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=representation,resolution=merge-duplicates",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(row),
    });

    let dbStatus = dbResponse.status;
    let dbError = null;
    if (!dbResponse.ok) {
      dbError = await dbResponse.text();
      console.error(`[${new Date().toISOString()}] Supabase insert error for UPC ${upc}: ${dbStatus} ${dbError}`);
    } else {
      console.log(`[${new Date().toISOString()}] Supabase insert successful for UPC: ${upc}, Status: ${dbStatus}`);
    }

    return new Response(
      JSON.stringify({
        status: 200,
        source: source,
        product_url: finalUrl,
        dbStatus: dbStatus,
        ...(dbError && { dbError: dbError }),
      }),
      { status: 200, headers },
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Internal server error for UPC ${upc}:`, error);
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes("Firecrawl API timeout")) {
        statusCode = 504;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return new Response(
      JSON.stringify({
        status: statusCode,
        source: source,
        product_url: finalUrl,
        error: errorMessage,
        details: `${error}`,
      }),
      { status: statusCode, headers },
    );
  }
function upcVariants(raw: string): string[] {
  const cleaned = raw.replace(/\D/g, '');
  const ean13   = cleaned.padStart(13, '0');
  const upc12   = ean13.slice(1);           // drop leading 0
  return Array.from(new Set([cleaned, upc12, ean13])); // unique list
}
});