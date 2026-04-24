import { Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";

import { LinkButton } from "@/components/ui/app-link";
import { ScreenSection } from "@/components/ui/screen-section";
import { VehicleAvatar } from "@/components/ui/vehicle-avatar";
import { formatCompactDate, formatDuration, formatKilometers } from "@/lib/format";
import { TripDetailRecord } from "@/server/trips";
import { TripPhotoForm } from "@/features/trips/trip-photo-form";

export function TripDetailScreen({ trip }: { trip: TripDetailRecord }) {
  return (
    <Stack gap="xl">
      <Paper className="surface-card" withBorder>
        <Stack gap="lg">
          <Group justify="space-between" align="start">
            <VehicleAvatar
              name={trip.title}
              subtitle={`${trip.vehicleName} - ${formatCompactDate(trip.tripDate)}`}
              photoUrl={trip.vehiclePhotoUrl}
            />
            <Group>
              <LinkButton href={`/trips/${trip.id}/edit`} variant="light" color="dark">
                Bewerken
              </LinkButton>
              <LinkButton href="/trips" variant="subtle" color="dark">
                Terug naar ritten
              </LinkButton>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <div>
              <Text size="sm" c="dimmed">
                Afstand
              </Text>
              <Text fw={700}>{formatKilometers(trip.distanceKm)}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Duur
              </Text>
              <Text fw={700}>{formatDuration(trip.durationMinutes ?? undefined)}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Datum
              </Text>
              <Text fw={700}>{formatCompactDate(trip.tripDate)}</Text>
            </div>
          </SimpleGrid>

          <Text size="sm" c="dimmed">
            {(trip.startLocationName ?? "Onbekend vertrek")} naar {trip.endLocationName ?? "Onbekende aankomst"}
          </Text>
        </Stack>
      </Paper>

      <ScreenSection title="Ritfoto">
        <Paper className="surface-card" withBorder>
          <TripPhotoForm tripId={trip.id} photoUrl={trip.photoUrl} />
        </Paper>
      </ScreenSection>

      {trip.notes ? (
        <ScreenSection title="Notities">
          <Paper className="surface-card" withBorder>
            <Text>{trip.notes}</Text>
          </Paper>
        </ScreenSection>
      ) : null}
    </Stack>
  );
}
