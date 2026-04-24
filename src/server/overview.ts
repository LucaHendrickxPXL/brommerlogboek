import dayjs from "dayjs";

import { categoryLabels } from "@/lib/costs";
import { CostCategory } from "@/lib/domain";
import { getCostsPageData } from "@/server/costs";
import { listTripsForUser } from "@/server/trips";

export interface OverviewMonth {
  month: string;
  totalCostEur: number;
  distanceKm: number;
}

export interface OverviewPageData {
  months: OverviewMonth[];
  totalCosts: number;
  totalDistanceKm: number;
  costsByVehicle: Array<{
    vehicleId: string;
    vehicleName: string;
    totalCostEur: number;
  }>;
  costsByCategory: Array<{
    category: CostCategory;
    label: string;
    totalCostEur: number;
  }>;
  fuelMonths: Array<{
    month: string;
    fuelCostEur: number;
  }>;
}

function createEmptyCategoryTotals() {
  return {
    fuel: 0,
    insurance: 0,
    maintenance: 0,
    taxes: 0,
    parking: 0,
    equipment: 0,
    repair: 0,
    other: 0,
  } satisfies Record<CostCategory, number>;
}

export async function getOverviewPageData(userId: string): Promise<OverviewPageData> {
  const [costs, trips] = await Promise.all([
    getCostsPageData(userId),
    listTripsForUser(userId),
  ]);

  const monthKeys = Array.from({ length: 6 }, (_, index) =>
    dayjs().startOf("month").subtract(5 - index, "month").format("YYYY-MM-01"),
  );

  const monthMap = new Map<string, OverviewMonth>(
    monthKeys.map((month) => [
      month,
      {
        month,
        totalCostEur: 0,
        distanceKm: 0,
      },
    ]),
  );

  const entriesInWindow = costs.entries.filter((entry) =>
    monthMap.has(dayjs(entry.entryDate).startOf("month").format("YYYY-MM-01")),
  );
  const tripsInWindow = trips.filter((trip) =>
    monthMap.has(dayjs(trip.tripDate).startOf("month").format("YYYY-MM-01")),
  );

  for (const entry of entriesInWindow) {
    const monthKey = dayjs(entry.entryDate).startOf("month").format("YYYY-MM-01");
    const month = monthMap.get(monthKey);

    if (month) {
      month.totalCostEur += entry.amountEur;
    }
  }

  for (const trip of tripsInWindow) {
    const monthKey = dayjs(trip.tripDate).startOf("month").format("YYYY-MM-01");
    const month = monthMap.get(monthKey);

    if (month) {
      month.distanceKm += trip.distanceKm;
    }
  }

  const months = Array.from(monthMap.values());
  const vehicleTotals = new Map<string, { vehicleId: string; vehicleName: string; totalCostEur: number }>();
  const categoryTotals = createEmptyCategoryTotals();
  const fuelMonthMap = new Map(monthKeys.map((month) => [month, 0]));

  for (const entry of entriesInWindow) {
    const vehicleTotal = vehicleTotals.get(entry.vehicleId) ?? {
      vehicleId: entry.vehicleId,
      vehicleName: entry.vehicleName,
      totalCostEur: 0,
    };

    vehicleTotal.totalCostEur += entry.amountEur;
    vehicleTotals.set(entry.vehicleId, vehicleTotal);
    categoryTotals[entry.category] += entry.amountEur;

    if (entry.category === "fuel") {
      const monthKey = dayjs(entry.entryDate).startOf("month").format("YYYY-MM-01");
      fuelMonthMap.set(monthKey, (fuelMonthMap.get(monthKey) ?? 0) + entry.amountEur);
    }
  }

  return {
    months,
    totalCosts: months.reduce((total, month) => total + month.totalCostEur, 0),
    totalDistanceKm: months.reduce((total, month) => total + month.distanceKm, 0),
    costsByVehicle: Array.from(vehicleTotals.values()).sort((left, right) => right.totalCostEur - left.totalCostEur),
    costsByCategory: (Object.keys(categoryTotals) as CostCategory[])
      .map((category) => ({
        category,
        label: categoryLabels[category],
        totalCostEur: categoryTotals[category],
      }))
      .filter((item) => item.totalCostEur > 0)
      .sort((left, right) => right.totalCostEur - left.totalCostEur),
    fuelMonths: monthKeys.map((month) => ({
      month,
      fuelCostEur: fuelMonthMap.get(month) ?? 0,
    })),
  };
}
