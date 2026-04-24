import { notFound } from "next/navigation";
import { Paper, Stack, Text } from "@mantine/core";

import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { TripForm } from "@/features/trips/trip-form";
import { isNotFoundAppError } from "@/server/app-errors";
import { requireAppUser } from "@/server/auth";
import { deleteTripAction, updateTripAction } from "@/server/trip-actions";
import { getTripDetailForUser } from "@/server/trips";
import { listVehicleOptionsForUser } from "@/server/vehicles";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const user = await requireAppUser();
  const { tripId } = await params;

  try {
    const trip = await getTripDetailForUser(user.id, tripId);
    const vehicles = await listVehicleOptionsForUser(user.id, {
      includeVehicleId: trip.vehicleId,
    });

    return (
      <Stack gap="xl">
        <TripForm
          action={updateTripAction}
          vehicles={vehicles}
          mode="edit"
          title="Rit bewerken"
          description="Pas datum, afstand en traject aan zonder je ritgeschiedenis kwijt te raken."
          submitLabel="Wijzigingen bewaren"
          initialValues={{
            tripId: trip.id,
            vehicleId: trip.vehicleId,
            title: trip.title,
            tripDate: trip.tripDate,
            distanceKm: trip.distanceKm,
            durationMinutes: trip.durationMinutes,
            startLocationName: trip.startLocationName,
            endLocationName: trip.endLocationName,
            notes: trip.notes,
          }}
        />

        <Paper className="surface-card" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Rit verwijderen</Text>
            <Text size="sm" c="dimmed">
              Deze rit verdwijnt uit je historiek. Een gekoppelde ritfoto wordt ook mee opgeruimd.
            </Text>
            <form action={deleteTripAction}>
              <input type="hidden" name="tripId" value={trip.id} />
              <ConfirmSubmitButton
                confirmMessage="Wil je deze rit echt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
                variant="light"
                color="rose"
              >
                Rit verwijderen
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
