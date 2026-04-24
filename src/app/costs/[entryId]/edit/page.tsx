import { notFound, redirect } from "next/navigation";
import { Paper, Stack, Text } from "@mantine/core";

import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FuelEntryForm } from "@/features/costs/fuel-entry-form";
import { GeneralCostForm } from "@/features/costs/general-cost-form";
import { isNotFoundAppError } from "@/server/app-errors";
import { requireAppUser } from "@/server/auth";
import {
  deleteCostAction,
  updateFuelEntryAction,
  updateGeneralCostAction,
} from "@/server/cost-actions";
import { getCostDetailForUser } from "@/server/costs";
import { listVehicleOptionsForUser } from "@/server/vehicles";

export default async function EditCostPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const user = await requireAppUser();
  const { entryId } = await params;

  try {
    const entry = await getCostDetailForUser(user.id, entryId);

    if (entry.linkedMaintenanceEventId) {
      redirect(`/maintenance/events/${entry.linkedMaintenanceEventId}/edit`);
    }

    const vehicles = await listVehicleOptionsForUser(user.id, {
      includeVehicleId: entry.vehicleId,
    });

    if (entry.category === "fuel") {
      return (
        <Stack gap="xl">
          <FuelEntryForm
            action={updateFuelEntryAction}
            vehicles={vehicles}
            mode="edit"
            title="Tankbeurt bewerken"
            description="Pas bedrag, datum of brandstoftype aan zonder je historiek te verliezen."
            submitLabel="Wijzigingen bewaren"
            initialValues={{
              entryId: entry.id,
              vehicleId: entry.vehicleId,
              entryDate: entry.entryDate,
              fuelType: entry.fuelType ?? "95",
              amountEur: entry.amountEur,
              fuelStation: entry.fuelStation,
              paymentMethod: entry.paymentMethod,
              odometerKm: entry.odometerKm,
              isFullTank: entry.isFullTank,
              notes: entry.notes,
            }}
          />

          <Paper className="surface-card" withBorder>
            <Stack gap="sm">
              <Text fw={700}>Tankbeurt verwijderen</Text>
              <Text size="sm" c="dimmed">
                Deze tankbeurt verdwijnt uit je kostenhistoriek en uit alle totalen.
              </Text>
              <form action={deleteCostAction}>
                <input type="hidden" name="entryId" value={entry.id} />
                <ConfirmSubmitButton
                  confirmMessage="Wil je deze tankbeurt echt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
                  variant="light"
                  color="rose"
                >
                  Tankbeurt verwijderen
                </ConfirmSubmitButton>
              </form>
            </Stack>
          </Paper>
        </Stack>
      );
    }

    return (
      <Stack gap="xl">
        <GeneralCostForm
          action={updateGeneralCostAction}
          vehicles={vehicles}
          mode="edit"
          title="Kost bewerken"
          description="Pas categorie, bedrag of leverancier aan zonder je historiek te verliezen."
          submitLabel="Wijzigingen bewaren"
          initialValues={{
            entryId: entry.id,
            vehicleId: entry.vehicleId,
            entryDate: entry.entryDate,
            category: entry.category,
            title: entry.title,
            amountEur: entry.amountEur,
            vendorName: entry.vendorName,
            locationName: entry.locationName,
            paymentMethod: entry.paymentMethod,
            notes: entry.notes,
          }}
        />

        <Paper className="surface-card" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Kost verwijderen</Text>
            <Text size="sm" c="dimmed">
              Deze kost verdwijnt uit je historiek en uit alle totalen.
            </Text>
            <form action={deleteCostAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <ConfirmSubmitButton
                confirmMessage="Wil je deze kost echt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
                variant="light"
                color="rose"
              >
                Kost verwijderen
              </ConfirmSubmitButton>
            </form>
          </Stack>
        </Paper>
      </Stack>
    );
  } catch (error) {
    if (isNotFoundAppError(error)) {
      notFound();
    }

    throw error;
  }
}
