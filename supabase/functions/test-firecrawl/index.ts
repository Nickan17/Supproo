import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

serve(async (_req) => {
  if (!FIRECRAWL_API_KEY) {
    return new Response('❌ FIRECRAWL_API_KEY environment variable is not set.', { status: 500 });
  }

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

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('❌ Unexpected Function Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});