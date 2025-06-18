/// <reference lib="deno.ns" />
<<<<<<< HEAD
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed. Use POST with JSON { url:\"...\" }" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  const { url } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.startsWith("http")) {
    return new Response(JSON.stringify({ error: "Bad Request – missing url" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const fcBody = {
    urls: [url],
    prompt: "Extract ingredients (name, dosage, form), certifications, price per serving, label image URLs.",
    agent: { model: "FIRE-1" }  // explicit but optional
  };

  console.log("Firecrawl request payload:", JSON.stringify(fcBody, null, 2));
  const fcRes = await fetch("https://api.firecrawl.dev/v1/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${firecrawlKey}`,
    },
    body: JSON.stringify(fcBody),
  });

  if (!fcRes.ok) {
    const detail = await fcRes.text();
    console.error("Firecrawl API error:", fcRes.status, detail.slice(0, 200));
    return new Response(
      JSON.stringify({ error: `Firecrawl ${fcRes.status}`, detail }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const json = await fcRes.json();
  return new Response(JSON.stringify(json), { headers: { "Content-Type": "application/json" } });
=======
import { serve } from "https://deno.land/std@0.178.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY not set in environment variables." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const targetUrl = "https://www.transparentlabs.com/products/bulk-preworkout";
    const prompt = "Extract all visible ingredient data including dosages, supplement facts, quality certifications, and price per serving. Also return any supplement label image URLs.";

    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v0/extract", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: targetUrl,
        params: {
          extractorOptions: {
            mode: "llm",
            llmOptions: {
              prompt: prompt,
            },
          },
          usePuppeteer: false,
        },
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      return new Response(
        JSON.stringify({ error: `Firecrawl API error: ${firecrawlResponse.status} - ${errorText}` }),
        { status: firecrawlResponse.status, headers: { "Content-Type": "application/json" } },
      );
    }

    const firecrawlData = await firecrawlResponse.json();

    return new Response(
      JSON.stringify(firecrawlData),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
>>>>>>> 79faa5f2d00c2757087b0a559bab3cd4b4d2309f
});