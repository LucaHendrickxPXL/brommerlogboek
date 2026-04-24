import { CostCategory, FuelType, PaymentMethod } from "@/lib/domain";

export type GeneralCostCategory = Exclude<CostCategory, "fuel">;

export const categoryLabels: Record<CostCategory, string> = {
  fuel: "Benzine",
  insurance: "Verzekering",
  maintenance: "Onderhoud",
  taxes: "Belastingen",
  parking: "Parking",
  equipment: "Uitrusting",
  repair: "Herstelling",
  other: "Overig",
};

export const categoryColors: Record<CostCategory, "amber" | "teal" | "rose" | "gray"> = {
  fuel: "amber",
  insurance: "teal",
  maintenance: "rose",
  taxes: "gray",
  parking: "gray",
  equipment: "amber",
  repair: "rose",
  other: "gray",
};

export const generalCostCategories = [
  "insurance",
  "maintenance",
  "taxes",
  "parking",
  "equipment",
  "repair",
  "other",
] as const satisfies readonly GeneralCostCategory[];

export const fuelTypes = ["95", "98", "diesel"] as const satisfies readonly FuelType[];

export const fuelTypeLabels: Record<FuelType, string> = {
  "95": "95",
  "98": "98",
  diesel: "Diesel",
};

export const paymentMethods = ["cash", "card", "bank", "other"] as const satisfies readonly PaymentMethod[];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Kaart",
  bank: "Bank",
  other: "Andere",
};
