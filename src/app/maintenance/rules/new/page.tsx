import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { LinkButton } from "@/components/ui/app-link";
import { MaintenanceRuleForm } from "@/features/maintenance/maintenance-rule-form";
import { requireAppUser } from "@/server/auth";
import { createMaintenanceRuleAction } from "@/server/maintenance-actions";
import { listVehicleOptionsForUser } from "@/server/vehicles";

function readSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewMaintenanceRulePage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string | string[] }>;
}) {
  const user = await requireAppUser();
  const vehicles = await listVehicleOptionsForUser(user.id);
  const { vehicleId: rawVehicleId } = await searchParams;
  const selectedVehicleId =
    vehicles.find((vehicle) => vehicle.id === readSingleSearchParam(rawVehicleId))?.id ?? vehicles[0]?.id ?? "";

  if (vehicles.length === 0) {
    return (
      <EmptyStateCard
        title="Voeg eerst een brommer toe"
        description="Een onderhoudsplan moet altijd aan een brommer gekoppeld zijn."
        action={
          <LinkButton href="/garage/new" variant="light" color="dark">
            Brommer toevoegen
          </LinkButton>
        }
      />
    );
  }

  return (
    <MaintenanceRuleForm
      action={createMaintenanceRuleAction}
      vehicles={vehicles}
      mode="create"
      title="Onderhoudsplan toevoegen"
      description="Stel een terugkerend onderhoud in op basis van een vrij interval in maanden."
      submitLabel="Onderhoudsplan bewaren"
      initialValues={{
        vehicleId: selectedVehicleId,
      }}
    />
  );
}
