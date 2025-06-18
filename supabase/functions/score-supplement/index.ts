/// <reference lib="deno.ns" />
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// ---------- types ----------
interface Ingredient { name: string; dosage?: string; form?: string }
interface SupplementData {
  product_id: string; ingredients: Ingredient[]; brand: string; product_name: string;
  label_claims?: string[]; certifications?: string[]; warnings?: string[];
  reviews?: { positive: number; negative: number }
}

// Simplified AI Response Interface
interface SimplifiedAIResponse {
  pid: string; // product_id
  t: number;   // Transparency / Label Honesty (0-10)
  dose: number; // Clinical Dosing & Bioavailability (0-10)
  qual: number; // Quality & Certifications (0-10)
  risk: number; // Additives & Brand Risk (0-10)
  highlights: string[]; // 1-3 concise findings (max 80 chars each)
}

// Full SupplementScoreResponse (for later backend expansion, not directly used in AI response yet)
interface ScoreBreakdownDetail { score: number; reasons: string[]; weight: number }
interface SupplementScoreBreakdown {
  ingredient_transparency: ScoreBreakdownDetail; clinical_doses: ScoreBreakdownDetail;
  bioavailability: ScoreBreakdownDetail; third_party_testing: ScoreBreakdownDetail;
  additives_fillers: ScoreBreakdownDetail; label_accuracy: ScoreBreakdownDetail;
  manufacturing_standards: ScoreBreakdownDetail; brand_history: ScoreBreakdownDetail;
  consumer_sentiment: ScoreBreakdownDetail;
}
interface OverallAssessment {
  strengths: string[]; weaknesses: string[]; recommendations: string[];
  safety_rating: string; efficacy_rating: string; transparency_rating: string;
}
interface Source { type: string; source: string; url: string; relevance: string }
interface FullSupplementScoreResponse {
  product_id: string;
  product_name: string; // Add this line
  final_score: number; score_breakdown: SupplementScoreBreakdown;
  overall_assessment: OverallAssessment; sources: Source[]; timestamp: string;
  confidence_score: number; error?: string;
}


// ---------- helpers ----------
function clampScore(score: number, min: number, max: number): number {
  return Math.max(min, Math.min(score, max));
}

// NEW ROBUST JSON EXTRACTOR
function extractJson(raw: string): any | null {
  // 1. Try direct parse first (most common and efficient for clean JSON)
  try { return JSON.parse(raw); } catch (e) { /* console.log("Direct parse failed:", e.message); */ }

  // 2. Try greedy match for JSON object possibly wrapped in other text (e.g., "Here's the JSON: {...}")
  // [\s\S]* matches any character including newlines
  const greedy = raw.match(/{[\s\S]*}/);
  if (greedy) {
    try {
      return JSON.parse(greedy[0]);
    } catch (e) {
      // console.log("Greedy parse failed:", e.message);
    }
  }

  // 3. Try a simpler, single-level match if the greedy failed (e.g., for very short, non-nested JSON)
  const simple = raw.match(/({[^{}]*})/); // Matches first { ... } without nested braces
  if (simple) {
    try {
      return JSON.parse(simple[0]);
    } catch (e) {
      // console.log("Simple parse failed:", e.message);
    }
  }

  // If all attempts fail, log error and return null
  console.error("extractJson failed to find valid JSON. Raw head:", raw.slice(0,200));
  return null;
}
function expandToFull(r: SimplifiedAIResponse): FullSupplementScoreResponse {
  const map = {
    ingredient_transparency: r.t,
    label_accuracy:         r.t,
    clinical_doses:         r.dose,
    bioavailability:        r.dose,
    third_party_testing:    r.qual,
    manufacturing_standards:r.qual,
    additives_fillers:      r.risk,
    brand_history:          r.risk,
    consumer_sentiment:     r.risk,
  };

  const weights = {
    ingredient_transparency: 0.20,
    clinical_doses:          0.15,
    bioavailability:         0.10,
    third_party_testing:     0.15,
    additives_fillers:       0.10,
    label_accuracy:          0.10,
    manufacturing_standards: 0.10,
    brand_history:           0.05,
    consumer_sentiment:      0.05,
  };

  let final = 0;
  for (const k in Object.keys(map)) {
    final += map[k as keyof typeof map] * weights[k as keyof typeof weights] * 10; // 0-10 → 0-100
  }

  const fullScoreResp: FullSupplementScoreResponse = {
    product_id: r.pid,
    product_name: "", // Add this line
    final_score: Math.round(final),
    score_breakdown: Object.fromEntries(
      Object.entries(map).map(([k, v]) => [
        k, { score: v, reasons: [], weight: weights[k as keyof typeof weights] * 100 },
      ]),
    ) as any,
    overall_assessment: {
      strengths: r.highlights.slice(0, 1),
      weaknesses: [],
      recommendations: r.highlights.slice(1),
      safety_rating: "—",
      efficacy_rating: "—",
      transparency_rating: "—",
    },
    sources: [],
    timestamp: new Date().toISOString(),
    confidence_score: 0.9,
  };
  return fullScoreResp
}


// ---------- core ----------
async function scoreSupplement(supplementData: SupplementData): Promise<SimplifiedAIResponse> {
  console.log("SupplementData received:", JSON.stringify(supplementData, null, 2));
  const apiKey = Deno.env.get('EXPO_PUBLIC_OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OpenRouter API key not set');

  const data = supplementData;
  const scraped = null;
  const prompt = `
You are SupplementScoreAI.
Return ONLY minified JSON with keys:
  pid,t,dose,qual,risk,highlights
Rules:
• t, dose, qual, risk MUST be integers 0-10 (0 if unknown).
• highlights = 1-3 short bullets.
DATA:${JSON.stringify(data)}
SCRAPED:${scraped ?? "NONE"}
`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25-second timeout for the AI request

  let res: Response; // Declare 'res' here so it's accessible in the catch block if res.json() fails
  let aiRaw: string = ''; // Initialize aiRaw to be available for error logging

  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        temperature: 0,
        top_p: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
        // Attach original response to error for detailed logging in handler
        const error = new Error(`OpenRouter request failed with status ${res.status}: ${await res.text()}`);
        (error as any).status = res.status;
        (error as any).res = res; // Attach the response object
        throw error;
    }

    const data = await res.json();
    aiRaw = data?.choices?.[0]?.message?.content ?? '';

    // NEW LOGGING (as per "other, other AI" suggestion): To definitively check for truncation and content
    console.log("raw len:", aiRaw.length);
    console.log("head:", aiRaw.slice(0,500));
    console.log("tail:", aiRaw.slice(-500));


    const parsed = extractJson(aiRaw); // Use the new robust extractor

    // Early empty-object guard (adapted from "other, other AI" suggestion)
    if (!parsed || Object.keys(parsed).length === 0) {
      console.error("✖ empty/invalid JSON. raw len:", aiRaw.length);
      const error = new Error("AI returned empty or invalid JSON structure.");
      (error as any).status = 502;
      (error as any).rawResponse = aiRaw; // Attach the raw AI response text for full context
      throw error;
    }
    return parsed as SimplifiedAIResponse;

  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const error = new Error('OpenRouter request timed out after 25 seconds.');
      (error as any).status = 504;
      throw error;
    }
    // Re-throw the error for the handler to catch with its improved logging
    throw err;
  }
}

// ---------- handler ----------
async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('EXPO_PUBLIC_SUPABASE_URL')!,
      Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')!
    );

    const incoming: SupplementData = await req.json();
    const scoreResp = await scoreSupplement(incoming);
    const fullScoreResp: FullSupplementScoreResponse = {
     ...expandToFull(scoreResp),
     product_name: incoming.product_name,
   };

    const { error } = await supabase
      .from('scored_products')
      .upsert([fullScoreResp], { onConflict: 'product_id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      throw new Error(`DB upsert failed: ${error.message}`);
    }

    // TODO: Phase 2 - Implement the backend "Rubric Expander" here
    // const responseToStore = {
    //   product_id: scoreResp.pid,
    //   lean_score_t: scoreResp.t,
    //   lean_score_dose: scoreResp.dose,
    //   lean_score_qual: scoreResp.qual,
    //   lean_score_risk: scoreResp.risk,
    //   lean_highlights: scoreResp.highlights,
    //   timestamp: new Date().toISOString(),
    // };

    // const { error: simplifiedError } = await supabase
    //   .from('simplified_scored_products_test')
    //   .upsert([responseToStore], { onConflict: ['product_id'] });

    // if (simplifiedError) {
    //   console.error('Supabase upsert error:', simplifiedError);
    //   throw new Error(`DB upsert failed: ${simplifiedError.message}`);
    // }

    return new Response(JSON.stringify(fullScoreResp), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    // UPDATED: Full debug on error (as per "other, other AI" suggestion)
    let fullResponseText = 'N/A';
    let responseStatus: string | number = 'N/A';
    let responseHeaders = {};

    if (err instanceof Error && (err as any).res instanceof Response) {
      // If the error originated from the OpenRouter fetch (res.ok check)
      const originalRes = (err as any).res;
      responseStatus = originalRes.status;
      responseHeaders = Object.fromEntries([...originalRes.headers]);
      try {
        fullResponseText = await originalRes.clone().text(); // Use .clone() to re-read body
      } catch (cloneErr) {
        fullResponseText = `Error cloning/reading response body for logging: ${cloneErr}`;
      }
    } else if (err && typeof err === 'object' && 'rawResponse' in err) {
      // If the error was thrown internally from scoreSupplement (e.g., parsing error)
      fullResponseText = err.rawResponse;
    }

    let errorMessage = 'An unknown error occurred.';
    let errorDetails = 'No specific details available.';
    let statusCode = 500;

    if (err instanceof Error) {
      errorMessage = err.message;
      errorDetails = err.message;
      if (err.stack) {
        errorDetails = err.stack;
      }
      if ((err as any).status) {
        statusCode = (err as any).status;
      }
    } else if (typeof err === 'string') {
      errorMessage = err;
      errorDetails = err;
    } else if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = (err as any).message;
      errorDetails = JSON.stringify(err);
      if ((err as any).status) {
        statusCode = (err as any).status;
      }
    }
    if (!err) {
      errorMessage = 'An unexpected null/undefined error was caught.';
      errorDetails = 'The error object itself was null or undefined.';
    }

    // Console.error for full context
    console.error('❗ Error details:', {
      errorMessage,
      errorDetails,
      statusCode,
      fullResponseFromAI_length: fullResponseText.length,
      fullResponseFromAI_head: fullResponseText.slice(0, 500),
      fullResponseFromAI_tail: fullResponseText.slice(-500),
      aiResponseStatus: responseStatus,
      aiResponseHeaders: responseHeaders,
      originalError: err, // Log the raw error object too
    });

    return new Response(JSON.stringify({ error: errorMessage, details: errorDetails }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ---------- boot ----------
serve(handler);