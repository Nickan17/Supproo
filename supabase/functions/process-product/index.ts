// This function is ready for cloud deployment using: npx supabase functions deploy process-product --env-file .env
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { delay } from 'https://deno.land/std@0.224.0/async/delay.ts'; // Add this import

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev";



const startTime = Date.now(); // For uptime tracking
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 5;

serve(async (req: Request) => {
  const requestStartTime = new Date().toISOString();
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  console.log(`[${requestStartTime}] Request started from IP: ${clientIp}`);

  // Define common headers for all responses (moved inside serve to ensure fresh headers per request)
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Allow all origins for local dev. For production, specify your app's domain.
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { // Use null for the body for 204 No Content
      status: 204, // Use 204 No Content status for successful preflights
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins for local dev
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS', // Crucial to include POST and OPTIONS
        'Access-Control-Max-Age': '86400', // Optional: caches preflight for 24 hours
      },
    });
  }

  const url = new URL(req.url);
  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    return new Response(
      JSON.stringify({ status: "ok", uptime: uptime }),
      { status: 200, headers: headers },
    );
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
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
      { status: 429, headers: headers },
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405, headers: headers },
    );
  }

  if (!FIRECRAWL_API_KEY) {
    return new Response(
      JSON.stringify({ error: "FIRECRAWL_API_KEY not set" }),
      { status: 500, headers: headers },
    );
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${new Date().toISOString()}] Invalid JSON body:`, errorMessage);
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", details: errorMessage }),
      { status: 400, headers: headers },
    );
  }

  const { productIdentifier, productUrl } = requestBody;

  // Validate productIdentifier
  if (productIdentifier !== undefined && typeof productIdentifier !== 'string') {
    return new Response(
      JSON.stringify({ error: "Invalid productIdentifier format.", details: "productIdentifier must be a string if present." }),
      { status: 400, headers: headers },
    );
  }

  // Validate productUrl
  if (!productUrl || typeof productUrl !== 'string' || productUrl.trim() === '') {
    return new Response(
      JSON.stringify({ error: "Invalid productUrl format.", details: "productUrl is required and must be a non-empty string." }),
      { status: 400, headers: headers },
    );
  }

  try {
    new URL(productUrl);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid productUrl format.", details: "productUrl must be a valid URL." }),
      { status: 400, headers: headers },
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v1/scrape";

    // FIX 2: Pass SCHEMA directly as an object, not stringified.
    const body = {
      url: productUrl
    };

    // Logging it as a string for debugging is fine

    const firecrawlResponse = await fetch(FIRECRAWL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify(body), // Only stringify the overall body once
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear the timeout if the fetch completes in time

    if (!firecrawlResponse.ok) {
      const apiErrorStatus = firecrawlResponse.status;
      let errorDetails: string | object = `Firecrawl API returned status ${apiErrorStatus}`;
      const contentType = firecrawlResponse.headers.get("Content-Type");

      if (contentType && contentType.includes("application/json")) {
        try {
          // Attempt to parse Firecrawl's JSON error, and INCLUDE THE SCHEMA for debugging
          const firecrawlJsonError = await firecrawlResponse.json();
          errorDetails = {
            firecrawlError: firecrawlJsonError
          };
          console.error(`[${new Date().toISOString()}] Firecrawl API error details (JSON):`, JSON.stringify(errorDetails, null, 2));
        } catch (jsonError) {
          console.error(`[${new Date().toISOString()}] Failed to parse Firecrawl error JSON: ${String(jsonError)}`);
          errorDetails = {
            firecrawlError: await firecrawlResponse.text() // Fallback to text
          };
          console.error(`[${new Date().toISOString()}] Firecrawl API error details (Text Fallback): ${JSON.stringify(errorDetails, null, 2)}`);
        }
      } else {
        errorDetails = {
          firecrawlError: await firecrawlResponse.text()
        };
        console.error(`[${new Date().toISOString()}] Firecrawl API error details (Text): ${JSON.stringify(errorDetails, null, 2)}`);
      }

      return new Response(
        JSON.stringify({
          error: "Firecrawl API error",
          status: apiErrorStatus,
          details: errorDetails,
        }),
        { status: apiErrorStatus, headers: headers },
      );
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log("RAW Firecrawl JSON:", JSON.stringify(firecrawlData, null, 2));

    if (firecrawlData.success === false) {
      console.error(`[${new Date().toISOString()}] Firecrawl API returned success: false for productIdentifier: ${productIdentifier || 'N/A'}`);
      return new Response(
        JSON.stringify(firecrawlData), // Return the Firecrawl error response directly
        { status: 502, headers: headers },
      );
    }

    if (!firecrawlData || firecrawlData.data === null || firecrawlData.data === undefined) {
      console.error(`[${new Date().toISOString()}] Firecrawl API returned no data for productIdentifier: ${productIdentifier || 'N/A'}`);
      return new Response(
        JSON.stringify({ error: "Firecrawl API returned no data" }),
        { status: 502, headers: headers },
      );
    }

    // Log only the domain, not the full URL
    const productUrlDomain = new URL(productUrl).hostname;
    console.log(`[${new Date().toISOString()}] Request ended for productIdentifier: ${productIdentifier || 'N/A'}, domain: ${productUrlDomain}`);

    // Return the extracted data directly
    return new Response(
      JSON.stringify({ productIdentifier: productIdentifier, data: firecrawlData.data }),
      { status: 200, headers: headers },
    );
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error(`[${new Date().toISOString()}] Firecrawl API timeout for productIdentifier: ${productIdentifier || 'N/A'}`);
      return new Response(
        JSON.stringify({ error: "Firecrawl API timeout" }),
        { status: 504, headers: headers },
      );
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${new Date().toISOString()}] Internal server error for productIdentifier: ${productIdentifier || 'N/A'}: ${errorMessage}`);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: headers }
    );
  }
});