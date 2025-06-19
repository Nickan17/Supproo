/// <reference lib="deno.ns" />
// This function takes a UPC, resolves it to a product, optionally scrapes the product page, and then scores the supplement.
// It calls the firecrawl-extract function to perform the scraping.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupplementData } from "../../_shared/types.ts";

const anon = Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY") ?? "";

function withHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(anon ? { authorization: `Bearer ${anon}`, apikey: anon } : {}),
  };
}
async function postJSON(url: string, body: unknown) {
  return fetch(url, { method: "POST", headers: withHeaders(), body: JSON.stringify(body) });
}

async function findOfficialWebsite(name: string): Promise<string | null> {
  const key = Deno.env.get("EXPO_PUBLIC_OPENROUTER_API_KEY");
  if (!key) return null;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENROUTER_SEARCH_MODEL") ?? "openai/gpt-4o-mini",
      temperature: 0,
      response_format: { type: "text" },
      messages: [{ role: "user", content: `Return ONLY the official product URL (https://…). If none, return NONE.\n${name}` }],
    }),
  });
  if (!res.ok) return null;
  const txt = (await res.json()).choices?.[0]?.message?.content?.trim();
  return txt?.startsWith("http") ? txt : null;
}

serve(async (req) => {
  let upc: string | null = null;
  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    upc = body.upc;
  } else {
    const params = new URL(req.url).searchParams;
    upc = params.get("upc");
  }

  if (!upc) return new Response(`{"error":"missing upc"}`, { status: 400, headers: { "Content-Type": "application/json" } });

  /** 1 — resolve-upc */
  const res1 = await fetch(`${new URL(req.url).origin}/functions/v1/resolve-upc?upc=${encodeURIComponent(upc)}`, {
    headers: withHeaders(),
  });
  if (!res1.ok) return new Response(await res1.text(), { status: res1.status, headers: { "Content-Type": "application/json" } });

  const data: SupplementData = await res1.json();

  /** 2 — optional scrape */
  let scraped: string | null = null;
  const site = await findOfficialWebsite(`${data.brand} ${data.product_name}`);
  if (site) {
    const fcRes = await fetch(`${new URL(req.url).origin}/functions/v1/firecrawl-extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: site }),
    });

    if (!fcRes.ok) {
      const detail = await fcRes.text();
      console.error("Firecrawl API error:", fcRes.status, detail.slice(0, 200));
      return new Response(
        JSON.stringify({ error: `Firecrawl ${fcRes.status}`, detail }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
    scraped = (await fcRes.json()).content ?? null;
  }

  /** 3 — score-supplement */
  const res3 = await postJSON(`${new URL(req.url).origin}/functions/v1/score-supplement`, { data, scraped });
  return new Response(await res3.text(), { status: res3.status, headers: { "Content-Type": "application/json" } });
});