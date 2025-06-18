// supabase/functions/mock-upc/seed.ts

// SupplementData interface
interface Ingredient { name: string; dosage?: string; form?: string }
interface SupplementData {
  product_id: string; ingredients: Ingredient[]; brand: string; product_name: string;
  label_claims?: string[]; certifications?: string[]; warnings?: string[];
  reviews?: { positive: number; negative: number }
}

export const MAP: Record<string, SupplementData> = {
  // Gold Standard 100% Whey - Use the actual product data from your test_data_real.json
  "748927023075": {
    "product_id": "748927023075",
    "ingredients": [
      {"name": "Whey Protein Isolate", "dosage": "25g"},
      {"name": "BCAA Blend", "dosage": "5.5g"},
      {"name": "Digestive Enzymes", "dosage": "100mg"}
    ],
    "brand": "Optimum Nutrition",
    "product_name": "Gold Standard 100% Whey Protein",
    "label_claims": [
      "24g Protein Per Serving",
      "5.5g BCAAs",
      "Gluten-Free"
    ],
    "certifications": [
      "Informed-Sport Certified",
      "GMP Certified"
    ],
    "warnings": [],
    "reviews": {
      "positive": 150000,
      "negative": 5000
    }
  },
  // Add Gorilla Mode or another product's mock data here
  // "850017020269": {
  //   "product_id": "850017020269",
  //   "ingredients": [
  //     // ... Gorilla Mode ingredients and data ...
  //   ],
  //   "brand": "Gorilla Mind",
  //   "product_name": "Gorilla Mode Pre-Workout",
  //   "label_claims": [],
  //   "certifications": [],
  //   "warnings": ["Do not exceed recommended dosage"],
  //   "reviews": {"positive": 90000, "negative": 10000}
  // }
};