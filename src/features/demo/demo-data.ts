import { CostCategory, CostEntry, MaintenanceEvent, MaintenanceRule, Trip, Vehicle } from "@/lib/domain";

export const vehicles: Vehicle[] = [
  {
    id: "vespa-sprint",
    name: "Vespa Sprint",
    brand: "Vespa",
    model: "Sprint 50",
    plateLabel: "1-SCT-042",
    purchaseOdometerKm: 2400,
    monthlyCostEur: 186.4,
    photoUrl: "/vehicles/vespa-sprint.svg",
    accentLabel: "Stadsfavoriet",
  },
  {
    id: "honda-pcx",
    name: "Honda PCX",
    brand: "Honda",
    model: "PCX 125",
    plateLabel: "1-MAX-218",
    purchaseOdometerKm: 11800,
    monthlyCostEur: 142.7,
    photoUrl: "/vehicles/honda-pcx.svg",
    accentLabel: "Commuter",
  },
  {
    id: "piaggio-zip",
    name: "Piaggio Zip",
    brand: "Piaggio",
    model: "Zip City",
    plateLabel: "1-ZIP-309",
    purchaseOdometerKm: 6400,
    monthlyCostEur: 94.9,
    accentLabel: "Snelle reserve",
  },
];

export const trips: Trip[] = [
  {
    id: "trip-coast",
    vehicleId: "vespa-sprint",
    title: "Kustrit na het werk",
    tripDate: "2026-04-20",
    distanceKm: 48.2,
    durationMinutes: 95,
    startLocationName: "Gent",
    endLocationName: "De Haan",
    notes: "Mooie avondlucht en weinig verkeer.",
    photoUrl: "/trips/coast-ride.svg",
  },
  {
    id: "trip-city",
    vehicleId: "piaggio-zip",
    title: "Avondrit centrum",
    tripDate: "2026-04-18",
    distanceKm: 14.6,
    durationMinutes: 36,
    startLocationName: "Brugge",
    endLocationName: "Brugge",
    notes: "Kort rondje door de binnenstad.",
  },
  {
    id: "trip-commute",
    vehicleId: "honda-pcx",
    title: "Woon-werk dinsdag",
    tripDate: "2026-04-16",
    distanceKm: 18.2,
    durationMinutes: 29,
    startLocationName: "Aalst",
    endLocationName: "Brussel",
  },
  {
    id: "trip-breakfast",
    vehicleId: "vespa-sprint",
    title: "Zondags ontbijtstop",
    tripDate: "2026-04-13",
    distanceKm: 27.4,
    durationMinutes: 58,
    startLocationName: "Gent",
    endLocationName: "Lochristi",
    notes: "Foto toegevoegd.",
  },
];

export const costEntries: CostEntry[] = [
  {
    id: "cost-fuel-vespa",
    vehicleId: "vespa-sprint",
    category: "fuel",
    title: "Tankbeurt Shell Express",
    amountEur: 18.6,
    entryDate: "2026-04-21",
    vendorName: "Shell Express",
    locationName: "Gentbrugge",
  },
  {
    id: "cost-insurance-vespa",
    vehicleId: "vespa-sprint",
    category: "insurance",
    title: "Verzekering april",
    amountEur: 39.4,
    entryDate: "2026-04-03",
    vendorName: "DVV",
  },
  {
    id: "cost-maintenance-piaggio",
    vehicleId: "piaggio-zip",
    category: "maintenance",
    title: "Nieuwe bougie en check",
    amountEur: 62,
    entryDate: "2026-04-18",
    vendorName: "Scooter Service Brugge",
  },
  {
    id: "cost-fuel-honda",
    vehicleId: "honda-pcx",
    category: "fuel",
    title: "Tankbeurt Q8",
    amountEur: 14.2,
    entryDate: "2026-04-15",
    vendorName: "Q8",
    locationName: "Aalst",
  },
  {
    id: "cost-equipment-vespa",
    vehicleId: "vespa-sprint",
    category: "equipment",
    title: "Nieuwe telefoonhouder",
    amountEur: 24.9,
    entryDate: "2026-04-07",
    vendorName: "Moto Planet",
  },
  {
    id: "cost-insurance-honda",
    vehicleId: "honda-pcx",
    category: "insurance",
    title: "Verzekering april",
    amountEur: 36.8,
    entryDate: "2026-04-03",
    vendorName: "AG Insurance",
  },
];

export const maintenanceRules: MaintenanceRule[] = [
  {
    id: "rule-vespa-service",
    vehicleId: "vespa-sprint",
    title: "Algemene service",
    intervalMonths: 6,
    lastCompletedAt: "2025-10-24",
    nextDueDate: "2026-04-24",
    status: "soon",
  },
  {
    id: "rule-vespa-tyres",
    vehicleId: "vespa-sprint",
    title: "Banden nazicht",
    intervalMonths: 6,
    lastCompletedAt: "2025-12-12",
    nextDueDate: "2026-06-12",
    status: "ok",
  },
  {
    id: "rule-honda-brakes",
    vehicleId: "honda-pcx",
    title: "Remmencontrole",
    intervalMonths: 6,
    lastCompletedAt: "2025-11-18",
    nextDueDate: "2026-05-18",
    status: "ok",
  },
  {
    id: "rule-piaggio-check",
    vehicleId: "piaggio-zip",
    title: "Algemene check-up",
    intervalMonths: 6,
    lastCompletedAt: "2025-10-18",
    nextDueDate: "2026-04-18",
    status: "overdue",
  },
];

export const maintenanceEvents: MaintenanceEvent[] = [
  {
    id: "event-piaggio-bougie",
    vehicleId: "piaggio-zip",
    ruleId: "rule-piaggio-check",
    title: "Bougie vervangen",
    performedAt: "2026-04-18",
    workshopName: "Scooter Service Brugge",
    costAmountEur: 62,
  },
  {
    id: "event-honda-brakes",
    vehicleId: "honda-pcx",
    ruleId: "rule-honda-brakes",
    title: "Remblokken nazicht",
    performedAt: "2025-11-18",
    workshopName: "Moto Care Aalst",
    costAmountEur: 48,
  },
  {
    id: "event-vespa-service",
    vehicleId: "vespa-sprint",
    ruleId: "rule-vespa-service",
    title: "Najaarsonderhoud",
    performedAt: "2025-10-24",
    workshopName: "Vespa House",
    costAmountEur: 94,
  },
];

export const monthlyOverview = [
  {
    month: "2026-01-01",
    totalCostEur: 118,
    distanceKm: 76,
  },
  {
    month: "2026-02-01",
    totalCostEur: 186,
    distanceKm: 128,
  },
  {
    month: "2026-03-01",
    totalCostEur: 141,
    distanceKm: 102,
  },
  {
    month: "2026-04-01",
    totalCostEur: 195.9,
    distanceKm: 108.4,
  },
];

export const vehicleById: Record<string, Vehicle> = Object.fromEntries(
  vehicles.map((vehicle) => [vehicle.id, vehicle]),
);

export function getVehicle(vehicleId: string) {
  const vehicle = vehicleById[vehicleId];

  if (!vehicle) {
    throw new Error(`Unknown vehicle: ${vehicleId}`);
  }

  return vehicle;
}

export function getUpcomingMaintenanceForVehicle(vehicleId: string) {
  return maintenanceRules
    .filter((rule) => rule.vehicleId === vehicleId)
    .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate))[0]!;
}

export const currentMonthCosts = costEntries.filter((entry) => entry.entryDate.startsWith("2026-04"));

export const currentMonthFuelCosts = currentMonthCosts
  .filter((entry) => entry.category === "fuel")
  .reduce((total, entry) => total + entry.amountEur, 0);

export const currentMonthTotalCosts = currentMonthCosts.reduce(
  (total, entry) => total + entry.amountEur,
  0,
);

export const costTotalsByCategory = currentMonthCosts.reduce<Record<CostCategory, number>>(
  (totals, entry) => {
    totals[entry.category] += entry.amountEur;
    return totals;
  },
  {
    fuel: 0,
    insurance: 0,
    maintenance: 0,
    taxes: 0,
    parking: 0,
    equipment: 0,
    repair: 0,
    other: 0,
  },
);

export const homeSummary = {
  currentMonthTotalCosts,
  currentMonthFuelCosts,
  tripCount: trips.length,
  nextMaintenance: maintenanceRules
    .slice()
    .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate))[0]!,
};

export const maintenanceBuckets = {
  overdue: maintenanceRules.filter((rule) => rule.status === "overdue"),
  soon: maintenanceRules.filter((rule) => rule.status === "soon"),
  ok: maintenanceRules.filter((rule) => rule.status === "ok"),
};
