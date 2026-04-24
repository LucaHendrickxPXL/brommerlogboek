import { notFound } from "next/navigation";

import { VehicleForm } from "@/features/garage/vehicle-form";
import { isNotFoundAppError } from "@/server/app-errors";
import { requireAppUser } from "@/server/auth";
import { updateVehicleAction } from "@/server/garage-actions";
import { getVehicleDetailForUser } from "@/server/vehicles";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const user = await requireAppUser();
  const { vehicleId } = await params;

  try {
    const data = await getVehicleDetailForUser(user.id, vehicleId);

    return (
      <VehicleForm
        action={updateVehicleAction}
        mode="edit"
        title="Brommer bewerken"
        description="Pas de kerninfo van je brommer aan zonder historische data te verliezen."
        submitLabel="Wijzigingen bewaren"
        initialValues={{
          vehicleId: data.vehicle.id,
          name: data.vehicle.name,
          brand: data.vehicle.brand,
          model: data.vehicle.model,
          year: data.vehicle.year,
          licensePlate: data.vehicle.licensePlate,
          engineCc: data.vehicle.engineCc,
          purchaseDate: data.vehicle.purchaseDate,
          purchasePriceEur: data.vehicle.purchasePriceEur,
          purchaseOdometerKm: data.vehicle.purchaseOdometerKm,
          insuranceProvider: data.vehicle.insuranceProvider,
          insuranceCostMonthlyEur: data.vehicle.insuranceCostMonthlyEur,
          notes: data.vehicle.notes,
        }}
      />
    );
  } catch (error) {
    if (isNotFoundAppError(error)) {
      notFound();
    }

    throw error;
  }
}
