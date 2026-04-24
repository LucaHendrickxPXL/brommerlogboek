import { requireAppUser } from "@/server/auth";
import { getVehicleDetailForUser, listGarageVehiclesForUser } from "@/server/vehicles";
import { GarageScreen } from "@/features/garage/garage-screen";

function readSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GaragePage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string | string[] }>;
}) {
  const user = await requireAppUser();
  const vehicles = await listGarageVehiclesForUser(user.id);
  const { vehicleId: rawVehicleId } = await searchParams;
  const requestedVehicleId = readSingleSearchParam(rawVehicleId);
  const selectedVehicleId =
    vehicles.find((vehicle) => vehicle.id === requestedVehicleId)?.id ?? vehicles[0]?.id ?? null;
  const selectedVehicleData = selectedVehicleId
    ? await getVehicleDetailForUser(user.id, selectedVehicleId)
    : null;

  return (
    <GarageScreen
      vehicles={vehicles}
      selectedVehicleId={selectedVehicleId}
      selectedVehicleData={selectedVehicleData}
    />
  );
}
