import { Box } from "@mantine/core";

import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { LinkButton } from "@/components/ui/app-link";
import { MaintenanceEventForm } from "@/features/maintenance/maintenance-event-form";
import { MaintenanceEventQuickAddFlow } from "@/features/maintenance/maintenance-event-quick-add-flow";
import { requireAppUser } from "@/server/auth";
import { createMaintenanceEventAction } from "@/server/maintenance-actions";
import { listMaintenanceRuleOptionsForUser } from "@/server/maintenance";
import { listVehiclePickerCardsForUser } from "@/server/vehicles";

function readSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewMaintenanceEventPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string | string[] }>;
}) {
  const user = await requireAppUser();
  const [vehicleCards, rules] = await Promise.all([
    listVehiclePickerCardsForUser(user.id),
    listMaintenanceRuleOptionsForUser(user.id),
  ]);
  const vehicles = vehicleCards.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
  }));
  const { vehicleId: rawVehicleId } = await searchParams;
  const requestedVehicleId = vehicles.find((vehicle) => vehicle.id === readSingleSearchParam(rawVehicleId))?.id ?? "";
  const desktopSelectedVehicleId = requestedVehicleId || vehicles[0]?.id || "";
  const mobileSelectedVehicleId = requestedVehicleId || (vehicles.length === 1 ? vehicles[0]?.id ?? "" : "");

  if (vehicles.length === 0) {
    return (
      <EmptyStateCard
        title="Voeg eerst een brommer toe"
        description="Een onderhoudsbeurt moet altijd aan een brommer gekoppeld zijn."
        action={
          <LinkButton href="/garage/new" variant="light" color="dark">
            Brommer toevoegen
          </LinkButton>
        }
      />
    );
  }

  return (
    <>
      <Box hiddenFrom="md">
        <MaintenanceEventQuickAddFlow
          action={createMaintenanceEventAction}
          vehicles={vehicleCards}
          rules={rules}
          title="Onderhoud registreren"
          description="Kies brommer en onderhoud, en bevestig daarna snel."
          submitLabel="Onderhoud bewaren"
          initialValues={{
            vehicleId: mobileSelectedVehicleId,
          }}
        />
      </Box>

      <Box visibleFrom="md">
        <MaintenanceEventForm
          action={createMaintenanceEventAction}
          vehicles={vehicles}
          rules={rules}
          mode="create"
          title="Onderhoud registreren"
          description="Bewaar een uitgevoerde onderhoudsbeurt en koppel optioneel meteen de kost."
          submitLabel="Onderhoud bewaren"
          initialValues={{
            vehicleId: desktopSelectedVehicleId,
          }}
        />
      </Box>
    </>
  );
}
