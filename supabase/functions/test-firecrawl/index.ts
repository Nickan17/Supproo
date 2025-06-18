import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

serve(async (_req) => {
  if (!FIRECRAWL_API_KEY) {
    return new Response('❌ FIRECRAWL_API_KEY environment variable is not set.', { status: 500 });
  }

<<<<<<< HEAD
  const url = 'https://www.transparentlabs.com/products/preseries-bulk-preworkout';

  const fcBody = {
    urls: [url],
    prompt: "Extract ingredients (name, dosage, form), certifications, price per serving, label image URLs.",
    agent: { model: "FIRE-1" }  // explicit but optional
  };

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "Missing FIRECRAWL_API_KEY secret" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const url = 'https://www.transparentlabs.com/products/preseries-bulk-preworkout';

    const fcBody = {
      urls: [url],
      prompt: "Extract ingredients (name, dosage, form), certifications, price per serving, label image URLs.",
      agent: { model: "FIRE-1" }
    };

    const res = await fetch("https://api.firecrawl.dev/v1/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify(fcBody),
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

=======
  const requestBody = {
    url: 'https://www.transparentlabs.com/products/preseries-bulk-preworkout',
    usePuppeteer: true
  };

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('❌ Firecrawl API Error:', result);
      return new Response(JSON.stringify({ error: result }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

>>>>>>> 79faa5f2d00c2757087b0a559bab3cd4b4d2309f
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
<<<<<<< HEAD
  } catch (err: any) {
=======
  } catch (err) {
>>>>>>> 79faa5f2d00c2757087b0a559bab3cd4b4d2309f
    console.error('❌ Unexpected Function Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});