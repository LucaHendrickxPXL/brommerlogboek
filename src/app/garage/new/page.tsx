import { VehicleForm } from "@/features/garage/vehicle-form";
import { requireAppUser } from "@/server/auth";
import { createVehicleAction } from "@/server/garage-actions";

export default async function NewVehiclePage() {
  await requireAppUser();

  return (
    <VehicleForm
      action={createVehicleAction}
      mode="create"
      title="Brommer toevoegen"
      description="Bewaar de basisinfo van je brommer zodat je kosten, ritten en onderhoud kunt koppelen."
      submitLabel="Brommer bewaren"
    />
  );
}
