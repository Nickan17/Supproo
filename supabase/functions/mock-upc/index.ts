// supabase/functions/mock-upc/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { MAP } from "./seed.ts"; // Import the mock data map

serve(req => {
  const upc = new URL(req.url).searchParams.get("upc") ?? "";
  const data = MAP[upc]; // Look up the UPC in our mock map

  if (data) {
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } else {
    return new Response(
      JSON.stringify({ error: `UPC '${upc}' not found in mock map.` }),
      {
        headers: { "Content-Type": "application/json" },
        status: 404,
      }
    );
  }
});