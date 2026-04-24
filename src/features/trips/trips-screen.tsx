"use client";

import { Badge, Box, Button, Group, Image, NativeSelect, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconGasStation, IconPhoto, IconRouteAltLeft } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";

import { ActionTileLink } from "@/components/ui/action-tile-link";
import { LinkButton } from "@/components/ui/app-link";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { MobileFilterSheet } from "@/components/ui/mobile-filter-sheet";
import { ScreenSection } from "@/components/ui/screen-section";
import { VehicleAvatar } from "@/components/ui/vehicle-avatar";
import { formatCompactDate, formatDuration, formatKilometers } from "@/lib/format";
import { TripListItem } from "@/server/trips";
import { VehicleOption } from "@/server/vehicles";

type VehicleFilter = "all" | string;
type PeriodFilter = "all" | "this-month" | "last-30-days" | "last-3-months";

const periodFilterOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: "this-month", label: "Deze maand" },
  { value: "last-30-days", label: "Laatste 30 dagen" },
  { value: "last-3-months", label: "Laatste 3 maanden" },
  { value: "all", label: "Alles" },
];

function matchesPeriod(tripDate: string, periodFilter: PeriodFilter) {
  const date = dayjs(tripDate);

  if (periodFilter === "all") {
    return true;
  }

  if (periodFilter === "this-month") {
    return date.isSame(dayjs(), "month");
  }

  if (periodFilter === "last-30-days") {
    return !date.isBefore(dayjs().startOf("day").subtract(30, "day"), "day");
  }

  return date.isSame(dayjs(), "month") || date.isAfter(dayjs().startOf("month").subtract(2, "month"));
}

interface TripsScreenProps {
  trips: TripListItem[];
  vehicles: VehicleOption[];
}

export function TripsScreen({ trips, vehicles }: TripsScreenProps) {
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("this-month");

  const vehicleFilterLabel =
    vehicleFilter === "all"
      ? "Alle brommers"
      : vehicles.find((vehicle) => vehicle.id === vehicleFilter)?.name ?? "Alle brommers";
  const periodFilterLabel =
    periodFilterOptions.find((option) => option.value === periodFilter)?.label ?? "Deze maand";
  const hasCustomFilters = vehicleFilter !== "all" || periodFilter !== "this-month";

  const filteredTrips = trips.filter((trip) => {
    const matchesVehicle = vehicleFilter === "all" || trip.vehicleId === vehicleFilter;

    return matchesVehicle && matchesPeriod(trip.tripDate, periodFilter);
  });

  return (
    <Stack gap="xl">
      <Box hiddenFrom="md">
        <Paper className="surface-card" withBorder>
          <Stack gap="md">
            <Text fw={700}>Nieuwe rit</Text>
            <SimpleGrid cols={{ base: 1, xs: 2 }}>
              <ActionTileLink
                href="/trips/new"
                title="Rit toevoegen"
                description="Bewaar afstand, traject en optioneel een foto."
                icon={<IconRouteAltLeft size={22} stroke={2} />}
                color="teal"
              />
              <ActionTileLink
                href="/costs/new/fuel"
                title="Tankbeurt"
                description="Registreer meteen ook een snelle tankbeurt."
                icon={<IconGasStation size={22} stroke={2} />}
                color="amber"
              />
            </SimpleGrid>
          </Stack>
        </Paper>
      </Box>

      <SimpleGrid cols={{ base: 1, xs: 3 }}>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Ritten in selectie
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {filteredTrips.length}
          </Text>
        </Paper>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Afstand in selectie
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {formatKilometers(filteredTrips.reduce((total, trip) => total + trip.distanceKm, 0))}
          </Text>
        </Paper>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Met foto
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {filteredTrips.filter((trip) => trip.photoUrl).length}
          </Text>
        </Paper>
      </SimpleGrid>

      <ScreenSection
        title="Filters"
        action={
          <LinkButton href="/trips/new" variant="subtle" color="dark" visibleFrom="md">
            Rit toevoegen
          </LinkButton>
        }
      >
        <Stack gap="md">
          <Box hiddenFrom="md">
            <MobileFilterSheet
              title="Ritfilters"
              summary={`${vehicleFilterLabel} • ${periodFilterLabel}`}
              hasActiveFilters={hasCustomFilters}
              onClear={() => {
                setVehicleFilter("all");
                setPeriodFilter("this-month");
              }}
            >
              <Stack gap="md">
                <NativeSelect
                  label="Brommer"
                  data={[
                    { value: "all", label: "Alle brommers" },
                    ...vehicles.map((vehicle) => ({
                      value: vehicle.id,
                      label: vehicle.name,
                    })),
                  ]}
                  value={vehicleFilter}
                  onChange={(event) => setVehicleFilter(event.currentTarget.value)}
                />
                <NativeSelect
                  label="Periode"
                  data={periodFilterOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={periodFilter}
                  onChange={(event) => setPeriodFilter(event.currentTarget.value as PeriodFilter)}
                />
              </Stack>
            </MobileFilterSheet>
          </Box>

          <Box visibleFrom="md">
            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <NativeSelect
                label="Brommer"
                data={[
                  { value: "all", label: "Alle brommers" },
                  ...vehicles.map((vehicle) => ({
                    value: vehicle.id,
                    label: vehicle.name,
                  })),
                ]}
                value={vehicleFilter}
                onChange={(event) => setVehicleFilter(event.currentTarget.value)}
              />
              <NativeSelect
                label="Periode"
                data={periodFilterOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.currentTarget.value as PeriodFilter)}
              />
            </SimpleGrid>
          </Box>
        </Stack>
      </ScreenSection>

      <ScreenSection title="Ritten">
        <Stack gap="md">
          {filteredTrips.map((trip) => (
            <Paper key={trip.id} className="surface-card" withBorder>
              <Stack gap="md">
                {trip.photoUrl ? (
                  <div className="mini-photo">
                    <Image src={trip.photoUrl} alt={trip.title} radius="xl" h={184} fit="cover" />
                  </div>
                ) : null}

                <Group justify="space-between" align="start" wrap="nowrap">
                  <Stack gap="md" style={{ flex: 1 }}>
                    <VehicleAvatar
                      name={trip.title}
                      subtitle={`${trip.vehicleName} - ${formatCompactDate(trip.tripDate)}`}
                      photoUrl={trip.vehiclePhotoUrl}
                    />
                    <Badge
                      variant={trip.photoUrl ? "light" : "white"}
                      color={trip.photoUrl ? "amber" : "gray"}
                      leftSection={
                        trip.photoUrl ? (
                          <IconPhoto size={14} stroke={1.8} />
                        ) : (
                          <IconRouteAltLeft size={14} stroke={1.8} />
                        )
                      }
                    >
                      {trip.photoUrl ? "Met foto" : "Geen foto"}
                    </Badge>
                  </Stack>
                  <Stack gap="xs" align="end">
                    <LinkButton href={`/trips/${trip.id}`} variant="light" color="dark" size="xs">
                      Openen
                    </LinkButton>
                    <LinkButton href={`/trips/${trip.id}/edit`} variant="subtle" color="dark" size="xs">
                      Bewerken
                    </LinkButton>
                  </Stack>
                </Group>

                <SimpleGrid cols={{ base: 1, xs: 3 }}>
                  <div>
                    <Text size="sm" c="dimmed">
                      Traject
                    </Text>
                    <Text fw={700}>
                      {trip.startLocationName ?? "Onbekend"} naar {trip.endLocationName ?? "Onbekend"}
                    </Text>
                  </div>
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
                </SimpleGrid>

                {trip.notes ? (
                  <Text size="sm" c="dimmed">
                    {trip.notes}
                  </Text>
                ) : null}
              </Stack>
            </Paper>
          ))}

          {filteredTrips.length === 0 ? (
            <EmptyStateCard
              title={trips.length === 0 ? "Nog geen ritten" : "Geen ritten voor deze filter"}
              description={
                trips.length === 0
                  ? "Voeg je eerste rit toe om afstand en trajecten te bewaren."
                  : "Pas je filters aan of voeg een nieuwe rit toe."
              }
              action={
                trips.length === 0 ? (
                  <LinkButton href="/trips/new" variant="light" color="dark">
                    Rit toevoegen
                  </LinkButton>
                ) : undefined
              }
            />
          ) : null}
        </Stack>
      </ScreenSection>
    </Stack>
  );
}
