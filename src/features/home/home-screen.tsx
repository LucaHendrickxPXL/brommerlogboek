import { Badge, Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import {
  IconGasStation,
  IconReceiptEuro,
  IconRouteAltLeft,
  IconTool,
} from "@tabler/icons-react";

import { LinkButton } from "@/components/ui/app-link";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { MetricCard } from "@/components/ui/metric-card";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatusPill } from "@/components/ui/status-pill";
import { VehicleAvatar } from "@/components/ui/vehicle-avatar";
import {
  formatCompactDate,
  formatCurrency,
  formatDate,
  formatDuration,
  formatKilometers,
  getDueLabel,
} from "@/lib/format";
import { getHomePageData } from "@/server/home";

const quickActions = [
  {
    label: "Tankbeurt",
    href: "/costs/new/fuel",
    icon: IconGasStation,
  },
  {
    label: "Rit",
    href: "/trips/new",
    icon: IconRouteAltLeft,
  },
  {
    label: "Kost",
    href: "/costs/new",
    icon: IconReceiptEuro,
  },
  {
    label: "Onderhoud",
    href: "/maintenance/events/new",
    icon: IconTool,
  },
];

interface HomeScreenProps {
  data: Awaited<ReturnType<typeof getHomePageData>>;
}

export function HomeScreen({ data }: HomeScreenProps) {
  const attentionItems = [...data.maintenanceBuckets.overdue, ...data.maintenanceBuckets.soon];

  return (
    <Stack gap="xl">
      <Paper className="surface-card home-summary-card" withBorder>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Stack gap="lg">
            <Stack gap={6}>
              <Text ff="var(--font-heading)" fw={800} fz={{ base: 26, sm: 32 }}>
                Home
              </Text>
              <Text c="dimmed" maw={560}>
                Kosten, ritten en onderhoud voor vandaag.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, xs: 2 }}>
              {quickActions.map((action) => (
                <LinkButton
                  key={action.label}
                  href={action.href}
                  variant="white"
                  color="dark"
                  leftSection={<action.icon size={18} stroke={2} />}
                  className="home-action-button"
                  fullWidth
                >
                  {action.label}
                </LinkButton>
              ))}
            </SimpleGrid>
          </Stack>

          <Paper className="home-summary-panel" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="start">
                <Stack gap={2}>
                  <Text size="sm" c="dimmed" fw={600}>
                    Volgende onderhoud
                  </Text>
                  <Text ff="var(--font-heading)" fw={800} fz={24}>
                    {data.nextMaintenance ? formatDate(data.nextMaintenance.nextDueDate) : "Nog geen plan"}
                  </Text>
                </Stack>
                {data.nextMaintenance ? <StatusPill status={data.nextMaintenance.status} /> : null}
              </Group>

              <Text size="sm" c="dimmed">
                {data.nextMaintenance
                  ? `${data.nextMaintenance.title} - ${getDueLabel(data.nextMaintenance.nextDueDate)}`
                  : "Voeg later een onderhoudsplan toe om hier timing te zien."}
              </Text>

              <Group gap="sm">
                <Badge variant="light" color="rose">
                  {data.maintenanceBuckets.overdue.length} te laat
                </Badge>
                <Badge variant="light" color="amber">
                  {data.maintenanceBuckets.soon.length} binnenkort
                </Badge>
              </Group>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Paper>

      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
        <MetricCard
          label="Kosten deze maand"
          value={formatCurrency(data.currentMonthTotalCosts)}
          helper="Totaal"
          icon={IconReceiptEuro}
        />
        <MetricCard
          label="Benzine"
          value={formatCurrency(data.currentMonthFuelCosts)}
          helper="Deze maand"
          icon={IconGasStation}
          color="amber"
        />
        <MetricCard
          label="Volgende onderhoud"
          value={data.nextMaintenance ? formatDate(data.nextMaintenance.nextDueDate) : "Geen plan"}
          helper={data.nextMaintenance?.title ?? "Nog niets gepland"}
          icon={IconTool}
        />
        <MetricCard
          label="Recente ritten"
          value={String(data.tripCount)}
          helper="Totaal"
          icon={IconRouteAltLeft}
          color="rose"
        />
      </SimpleGrid>

      <ScreenSection title="Aandacht nu">
        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          {attentionItems.length ? (
            attentionItems.map((rule) => (
              <Paper key={rule.id} className="surface-card" withBorder>
                <Stack gap="md">
                  <Group justify="space-between" align="start">
                    <VehicleAvatar
                      name={rule.title}
                      subtitle={`${rule.vehicleName} - om de ${rule.intervalMonths} maanden`}
                      photoUrl={rule.vehiclePhotoUrl}
                    />
                    <StatusPill status={rule.status} />
                  </Group>
                  <Stack gap={4}>
                    <Text fw={700}>{rule.title}</Text>
                    <Text size="sm" c="dimmed">
                      Om de {rule.intervalMonths} maanden - {formatDate(rule.nextDueDate)}
                    </Text>
                  </Stack>
                </Stack>
              </Paper>
            ))
          ) : (
            <EmptyStateCard
              title="Geen onderhoud dat aandacht vraagt"
              description="Zodra een onderhoudsplan binnenkort verloopt of te laat is, zie je het hier."
            />
          )}
        </SimpleGrid>
      </ScreenSection>

      <ScreenSection
        title="Garage"
        action={
          <LinkButton
            href="/garage"
            variant="subtle"
            color="dark"
          >
            Garage openen
          </LinkButton>
        }
      >
        <SimpleGrid cols={{ base: 1, md: 3 }}>
          {data.garageVehicles.length ? (
            data.garageVehicles.map((vehicle) => (
              <Paper key={vehicle.id} className="surface-card" withBorder>
                <Stack gap="md">
                  <VehicleAvatar
                    name={vehicle.name}
                    subtitle={[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Brommer"}
                    photoUrl={vehicle.photoUrl}
                  />
                  <Group grow>
                    <div>
                      <Text size="sm" c="dimmed">
                        Maandkost
                      </Text>
                      <Text fw={700}>{formatCurrency(vehicle.monthlyCostEur)}</Text>
                    </div>
                    <div>
                      <Text size="sm" c="dimmed">
                        Volgende onderhoud
                      </Text>
                      <Text fw={700}>
                        {vehicle.nextMaintenanceDueDate ? formatDate(vehicle.nextMaintenanceDueDate) : "Geen plan"}
                      </Text>
                    </div>
                  </Group>
                </Stack>
              </Paper>
            ))
          ) : (
            <EmptyStateCard
              title="Nog geen brommers"
              description="Voeg eerst een brommer toe om ritten, kosten en onderhoud op te volgen."
              action={
                <LinkButton href="/garage/new" variant="light" color="dark">
                  Brommer toevoegen
                </LinkButton>
              }
            />
          )}
        </SimpleGrid>
      </ScreenSection>

      <ScreenSection
        title="Recente ritten"
        action={
          <LinkButton href="/trips" variant="subtle" color="dark">
            Alle ritten
          </LinkButton>
        }
      >
        <Stack gap="md">
          {data.recentTrips.length ? (
            data.recentTrips.map((trip) => (
              <Paper key={trip.id} className="surface-card" withBorder>
                <Group justify="space-between" align="start" wrap="nowrap">
                  <Stack gap={6}>
                    <VehicleAvatar
                      name={trip.title}
                      subtitle={`${trip.vehicleName} - ${formatCompactDate(trip.tripDate)}`}
                      photoUrl={trip.vehiclePhotoUrl}
                      size={48}
                    />
                    <Text size="sm" c="dimmed">
                      {(trip.startLocationName ?? "Onbekend vertrek")} naar {trip.endLocationName ?? "Onbekende aankomst"}
                    </Text>
                  </Stack>

                  <Stack gap={2} align="end">
                    <Text fw={700}>{formatKilometers(trip.distanceKm)}</Text>
                    <Text size="sm" c="dimmed">
                      {formatDuration(trip.durationMinutes ?? undefined)}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            ))
          ) : (
            <EmptyStateCard
              title="Nog geen ritten"
              description="Je eerste rit verschijnt hier zodra je die bewaart."
              action={
                <LinkButton href="/trips/new" variant="light" color="dark">
                  Rit toevoegen
                </LinkButton>
              }
            />
          )}
        </Stack>
      </ScreenSection>
    </Stack>
  );
}
