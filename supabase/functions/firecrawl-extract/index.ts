/// <reference lib="deno.ns" />
// This function is the only one that directly calls the Firecrawl API.
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
});