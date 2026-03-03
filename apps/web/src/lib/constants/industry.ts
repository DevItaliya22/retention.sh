/**
 * Industry options for onboarding. Used only in the welcome/onboarding flow.
 * Value is stored on Business.industries (array).
 */
export const INDUSTRIES = [
  { id: "retail", label: "Retail" },
  { id: "fashion", label: "Fashion & Apparel" },
  { id: "food-beverage", label: "Food & Beverage" },
  { id: "restaurant", label: "Restaurant / Café" },
  { id: "health-beauty", label: "Health & Beauty" },
  { id: "electronics", label: "Electronics" },
  { id: "grocery", label: "Grocery / Supermarket" },
  { id: "pharmacy", label: "Pharmacy" },
  { id: "hospitality", label: "Hospitality" },
  { id: "services", label: "Professional Services" },
  { id: "salon-spa", label: "Salon & Spa" },
  { id: "fitness", label: "Fitness & Gym" },
  { id: "other", label: "Other..." },
] as const;

export type IndustryId = (typeof INDUSTRIES)[number]["id"];
