import { Box } from "@mantine/core";

import { LinkButton } from "@/components/ui/app-link";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { FuelEntryForm } from "@/features/costs/fuel-entry-form";
import { FuelQuickAddFlow } from "@/features/costs/fuel-quick-add-flow";
import { requireAppUser } from "@/server/auth";
import { createFuelEntryAction } from "@/server/cost-actions";
import { listVehiclePickerCardsForUser } from "@/server/vehicles";

function readSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewFuelEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string | string[] }>;
}) {
  const user = await requireAppUser();
  const vehicleCards = await listVehiclePickerCardsForUser(user.id);
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
        description="Een tankbeurt moet altijd aan een brommer gekoppeld zijn."
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
        <FuelQuickAddFlow
          action={createFuelEntryAction}
          vehicles={vehicleCards}
          title="Tankbeurt toevoegen"
          description="Kies brommer, brandstof en bedrag."
          submitLabel="Tankbeurt opslaan"
          initialValues={{
            vehicleId: mobileSelectedVehicleId,
          }}
        />
      </Box>

      <Box visibleFrom="md">
        <FuelEntryForm
          action={createFuelEntryAction}
          vehicles={vehicles}
          mode="create"
          title="Tankbeurt toevoegen"
          description="Houd een tankbeurt snel bij met brandstoftype en totaalbedrag."
          submitLabel="Tankbeurt bewaren"
          initialValues={{
            vehicleId: desktopSelectedVehicleId,
          }}
        />
      </Box>
    </>
  );
}
