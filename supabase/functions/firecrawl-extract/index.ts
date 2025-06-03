/// <reference lib="deno.ns" />
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
});