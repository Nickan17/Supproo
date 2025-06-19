import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// This function tests the Firecrawl API.
// It calls the firecrawl-extract function to perform the scraping.
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

serve(async (_req) => {
  if (!FIRECRAWL_API_KEY) {
    return new Response('❌ FIRECRAWL_API_KEY environment variable is not set.', { status: 500 });
  }

  const url = 'https://www.transparentlabs.com/products/preseries-bulk-preworkout';

  try {
    const res = await fetch(`${new URL(_req.url).origin}/functions/v1/firecrawl-extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('❌ Firecrawl API Error:', detail);
      return new Response(
        JSON.stringify({ error: `Firecrawl ${res.status}`, detail }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await res.json();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('❌ Unexpected Function Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});