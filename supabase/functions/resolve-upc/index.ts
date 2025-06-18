/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// The SupplementData interface (same as your scoring function)
interface Ingredient {
  name: string;
  dosage?: string;
  form?: string;
}

interface SupplementData {
  product_id: string;
  ingredients: Ingredient[];
  brand: string;
  product_name: string;
  label_claims?: string[];
  certifications?: string[];
  warnings?: string[];
  reviews?: { positive: number; negative: number };
}

async function fetchFromOpenFoodFacts(upc: string): Promise<SupplementData | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${upc}.json`;
    const resp = await fetch(url);
    if (!resp.ok) {
        console.error(`OpenFoodFacts API returned status: ${resp.status}`);
        return null;
    }
    const data = await resp.json();

    // OpenFoodFacts sometimes returns a status field for missing codes
    if (data.status !== 1 || !data.product) {
        console.warn(`UPC ${upc} not found or incomplete data in OpenFoodFacts.`);
        return null;
    }

    // Parse fields into your format (add fallbacks as needed)
    const product = data.product;
    return {
      product_id: product.code ?? upc,
      ingredients: (product.ingredients_text ? [{name: product.ingredients_text}] : (product.ingredients ?? []).map((ing: any) => ({
        name: ing.text ?? ing.name ?? "",
        dosage: undefined, // OFF usually doesn't give dosage, can improve later
        form: undefined
      }))),
      brand: product.brands ?? "Unknown",
      product_name: product.product_name ?? "Unknown",
      label_claims: product.labels_tags?.filter((tag: string) => tag.startsWith("en:")).map((tag: string) => tag.replace("en:", "")) ?? [],
      certifications: [], // OFF doesn't always have this; can scrape from ingredients_analysis_tags if present
      warnings: [],       // Not usually available
      reviews: { positive: 0, negative: 0 } // Optionally add better logic
    };
  } catch (e) {
    console.error("Error fetching from OpenFoodFacts:", e);
    return null;
  }
}

// DSLD API Integration
// Corrected base URL based on your provided sample calls for DSLD API
const DSLD_API_BASE_URL = "https://api.ods.od.nih.gov/dsld/v9";

async function fetchFromDSLD(upc: string): Promise<SupplementData | null> {
  // Ensure the environment variable is loaded for local testing if using .env
  // For Supabase deployment, it should be set via `supabase secrets set`
  console.log("Attempting to retrieve DSLD_API_KEY..."); // Added log
  const dSldApiKey = Deno.env.get('DSLD_API_KEY');
  if (!dSldApiKey) {
    console.warn("DSLD_API_KEY is not set. Cannot fetch data from DSLD.");
    return null;
  }

  // As per DSLD documentation: wrap the barcode in quotation marks ("")
  // then URL-encode the entire string (including the quotes).
  // Example: "80004843" becomes %2280004843%22
  const upcWithQuotes = `"${upc}"`; // Literal quotes around the UPC
  const finalEncodedUpc = encodeURIComponent(upcWithQuotes); // Then URL-encode the whole string

  const url = `${DSLD_API_BASE_URL}/search-filter?barcode=${finalEncodedUpc}`;
 
  try {
    console.log("Key present in DSLD fetch:", !!dSldApiKey); // Added log: shows true if key found, false if not
    console.log(`Fetching DSLD URL: ${url}`); // Changed to 'Fetching DSLD URL' to distinguish from previous log
    const response = await fetch(url, {
      headers: {
        'x-api-key': dSldApiKey, // This uses the key variable
        'Content-Type': 'application/json', // Though not always strictly needed for GET, good practice
        'User-Agent': 'Supproo/0.1 (+https://supproo.com)', // Added User-Agent header
      }
    });

    if (!response.ok) {
      console.error(`DSLD API error! Status: ${response.status}, Text: ${await response.text()}`);
      return null;
    }

    const data: any = await response.json(); // Use 'any' for now, as full DSLD response structure isn't known
    console.log("DSLD raw response for UPC:", JSON.stringify(data, null, 2));

    // DSLD /search-filter typically returns a list of labels/products.
    if (data && Array.isArray(data) && data.length > 0) {
      const label = data[0]; // Take the first product/label from the list

      // Map DSLD data to SupplementData. This mapping is speculative and might need adjustment
      // once you see actual DSLD JSON responses for a given UPC.
      return {
        product_id: upc, // Use the provided UPC as the product_id
        product_name: label.productName ?? label.brandName ?? `DSLD Product (${upc})`, // Prioritize specific product name, fallback to brand or generic
        ingredients: label.ingredientsList ?? label.ingredients ?? "Ingredients not found in DSLD.", // Common names for ingredient lists
        supplement_facts: label.supplementFacts ?? label.supplementFactsList ?? "Supplement facts not found in DSLD.", // Common names for supplement facts
        allergens: label.allergens ?? "Allergens not specified in DSLD.", // Assuming 'allergens' field
        claims: label.claims ?? "Claims not specified in DSLD.", // Assuming 'claims' field
        warnings: label.warnings ?? "Warnings not specified in DSLD.", // Assuming 'warnings' field
        certifications: label.certifications ?? "Certifications not specified in DSLD.", // Assuming 'certifications' field
        usage_instructions: label.directions ?? "Usage instructions not specified in DSLD.", // Assuming 'directions' or similar
        serving_size: label.servingSize ?? "Serving size not specified in DSLD.",
        other_details: JSON.stringify(label), // Catch-all for any other useful data from DSLD
      };
    }

    return null; // No data found in DSLD

  } catch (error) {
    console.error("Error fetching from DSLD:", error);
    return null;
  }
}

serve(async (req: Request) => {
  // Accept both GET and POST for testing
  const url = new URL(req.url);
  const upc = url.searchParams.get("upc") ||
    (req.method === "POST" ? (await req.json()).upc : undefined);

  if (!upc) {
    return new Response(JSON.stringify({ error: "No UPC provided" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Attempt to fetch data from DSLD first
  let data = await fetchFromDSLD(upc);

  // If DSLD doesn't return data, fallback to OpenFoodFacts
  if (!data) {
    console.log("Falling back to OpenFoodFacts for UPC:", upc);
    data = await fetchFromOpenFoodFacts(upc);
  }

  if (!data) {
    return new Response(
      JSON.stringify({
        error: `UPC '${upc}' not found or failed to fetch data from both DSLD and OpenFoodFacts.`,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 404,
      },
    );
  }

  console.log("Data from DSLD or OpenFoodFacts:", JSON.stringify(data, null, 2));
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});