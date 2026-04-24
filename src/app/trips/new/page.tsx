import { Box } from "@mantine/core";

import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { LinkButton } from "@/components/ui/app-link";
import { TripForm } from "@/features/trips/trip-form";
import { TripQuickAddFlow } from "@/features/trips/trip-quick-add-flow";
import { requireAppUser } from "@/server/auth";
import { createTripAction } from "@/server/trip-actions";
import { listVehiclePickerCardsForUser } from "@/server/vehicles";

function readSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewTripPage({
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
        description="Een rit moet altijd aan een brommer gekoppeld zijn."
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
        <TripQuickAddFlow
          action={createTripAction}
          vehicles={vehicleCards}
          title="Rit toevoegen"
          description="Kies brommer en afstand, en bevestig daarna snel."
          submitLabel="Rit opslaan"
          initialValues={{
            vehicleId: mobileSelectedVehicleId,
          }}
        />
      </Box>

      <Box visibleFrom="md">
        <TripForm
          action={createTripAction}
          vehicles={vehicles}
          mode="create"
          title="Rit toevoegen"
          description="Voeg een rit toe met datum, afstand en optioneel traject of notities."
          submitLabel="Rit opslaan"
          initialValues={{
            vehicleId: desktopSelectedVehicleId,
          }}
          showPhotoUpload
        />
      </Box>
    </>
  );
}
