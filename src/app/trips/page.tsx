import { requireAppUser } from "@/server/auth";
import { listTripsForUser } from "@/server/trips";
import { listVehicleOptionsForUser } from "@/server/vehicles";
import { TripsScreen } from "@/features/trips/trips-screen";

export default async function TripsPage() {
  const user = await requireAppUser();
  const [trips, vehicles] = await Promise.all([
    listTripsForUser(user.id),
    listVehicleOptionsForUser(user.id),
  ]);

  return <TripsScreen trips={trips} vehicles={vehicles} />;
}
