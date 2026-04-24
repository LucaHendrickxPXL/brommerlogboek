import { Box } from "@mantine/core";

import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { LinkButton } from "@/components/ui/app-link";
import { GeneralCostForm } from "@/features/costs/general-cost-form";
import { GeneralCostQuickAddFlow } from "@/features/costs/general-cost-quick-add-flow";
import { requireAppUser } from "@/server/auth";
import { createGeneralCostAction } from "@/server/cost-actions";
import { listVehiclePickerCardsForUser } from "@/server/vehicles";

function readSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewCostPage({
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
        description="Een kost moet altijd aan een brommer gekoppeld zijn."
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
        <GeneralCostQuickAddFlow
          action={createGeneralCostAction}
          vehicles={vehicleCards}
          title="Kost toevoegen"
          description="Kies brommer, categorie en bedrag, en bewaar daarna snel."
          submitLabel="Kost bewaren"
          initialValues={{
            vehicleId: mobileSelectedVehicleId,
          }}
        />
      </Box>

      <Box visibleFrom="md">
        <GeneralCostForm
          action={createGeneralCostAction}
          vehicles={vehicles}
          mode="create"
          title="Kost toevoegen"
          description="Bewaar een gewone kost zoals verzekering, onderdelen of parking."
          submitLabel="Kost bewaren"
          initialValues={{
            vehicleId: desktopSelectedVehicleId,
          }}
        />
      </Box>
    </>
  );
}
