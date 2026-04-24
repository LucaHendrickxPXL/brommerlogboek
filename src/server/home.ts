import { getCurrentMonthCostSummaryForUser } from "@/server/costs";
import { listMaintenanceRulesForUser } from "@/server/maintenance";
import { getTripHomeSummaryForUser } from "@/server/trips";
import { listGarageVehiclesForUser } from "@/server/vehicles";

export async function getHomePageData(userId: string) {
  const [garageVehicles, tripSummary, costSummary, maintenanceRules] = await Promise.all([
    listGarageVehiclesForUser(userId),
    getTripHomeSummaryForUser(userId),
    getCurrentMonthCostSummaryForUser(userId),
    listMaintenanceRulesForUser(userId),
  ]);

  const nextMaintenance = maintenanceRules[0] ?? null;

  return {
    currentMonthTotalCosts: costSummary.totalCosts,
    currentMonthFuelCosts: costSummary.fuelCosts,
    tripCount: tripSummary.totalCount,
    nextMaintenance,
    maintenanceBuckets: {
      overdue: maintenanceRules.filter((rule) => rule.status === "overdue"),
      soon: maintenanceRules.filter((rule) => rule.status === "soon"),
      ok: maintenanceRules.filter((rule) => rule.status === "ok"),
    },
    garageVehicles,
    recentTrips: tripSummary.recentTrips,
  };
}
