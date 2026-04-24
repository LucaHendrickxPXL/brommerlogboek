export type DueStatus = "overdue" | "soon" | "ok";
export type FuelType = "95" | "98" | "diesel";
export type PaymentMethod = "cash" | "card" | "bank" | "other";
export type CostCategory =
  | "fuel"
  | "insurance"
  | "maintenance"
  | "taxes"
  | "parking"
  | "equipment"
  | "repair"
  | "other";

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  plateLabel: string;
  purchaseOdometerKm: number | null;
  monthlyCostEur: number;
  photoUrl?: string;
  accentLabel: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  title: string;
  tripDate: string;
  distanceKm: number;
  durationMinutes?: number;
  startLocationName: string;
  endLocationName: string;
  notes?: string;
  photoUrl?: string;
}

export interface CostEntry {
  id: string;
  vehicleId: string;
  category: CostCategory;
  title: string;
  amountEur: number;
  entryDate: string;
  vendorName?: string;
  locationName?: string;
  fuelType?: FuelType;
  paymentMethod?: PaymentMethod;
  isFullTank?: boolean;
  odometerKm?: number;
}

export interface MaintenanceRule {
  id: string;
  vehicleId: string;
  title: string;
  intervalMonths: number;
  lastCompletedAt?: string;
  nextDueDate: string;
  status: DueStatus;
}

export interface MaintenanceEvent {
  id: string;
  vehicleId: string;
  ruleId?: string;
  title: string;
  performedAt: string;
  workshopName?: string;
  costAmountEur?: number;
}
