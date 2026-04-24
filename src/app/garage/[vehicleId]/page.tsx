import { notFound } from "next/navigation";

import { VehicleDetailScreen } from "@/features/garage/vehicle-detail-screen";
import { isNotFoundAppError } from "@/server/app-errors";
import { requireAppUser } from "@/server/auth";
import { getVehicleDetailForUser } from "@/server/vehicles";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const user = await requireAppUser();
  const { vehicleId } = await params;

  try {
    const data = await getVehicleDetailForUser(user.id, vehicleId);

    return <VehicleDetailScreen data={data} />;
  } catch (error) {
    if (isNotFoundAppError(error)) {
      notFound();
    }

    throw error;
  }
}
