// supabase/_shared/types.ts

/** Basic shape shared across resolve-upc → score-supplement pipeline */
export interface Ingredient {
  name: string;
  dosage?: string;
  form?: string;
}

export interface SupplementData {
  product_id:   string;
  product_name: string;
  brand:        string;
  ingredients:  Ingredient[];

  /** optional fields — present if upstream sources provide them */
  label_claims?:   string[];
  certifications?: string[];
  warnings?:       string[];
  reviews?:        { positive: number; negative: number };
}