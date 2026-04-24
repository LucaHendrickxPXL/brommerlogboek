import { Box, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import {
  IconBike,
  IconGasStation,
  IconReceiptEuro,
  IconRouteAltLeft,
  IconTool,
} from "@tabler/icons-react";

import { ActionTileLink } from "@/components/ui/action-tile-link";
import {
  LinkButton,
  LinkUnstyledButton,
} from "@/components/ui/app-link";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatusPill } from "@/components/ui/status-pill";
import { VehicleAvatar } from "@/components/ui/vehicle-avatar";
import { categoryColors, categoryLabels, fuelTypeLabels } from "@/lib/costs";
import { formatCurrency, formatDate, formatKilometers, getDueLabel } from "@/lib/format";
import { GarageVehicleSummary, VehicleDetailPageData } from "@/server/vehicles";

interface GarageScreenProps {
  vehicles: GarageVehicleSummary[];
  selectedVehicleId?: string | null;
  selectedVehicleData?: VehicleDetailPageData | null;
}

function VehiclePreviewPanel({ data }: { data: VehicleDetailPageData }) {
  const { vehicle } = data;
  const categoryEntries = Object.entries(data.costTotalsByCategory).filter(([, amount]) => amount > 0);
  const highestCategoryValue = Math.max(1, ...categoryEntries.map(([, amount]) => amount));

  return (
    <Stack gap="lg">
      <Paper className="surface-card" withBorder>
        <Stack gap="lg">
          <Group justify="space-between" align="start">
            <VehicleAvatar
              name={vehicle.name}
              subtitle={[vehicle.brand, vehicle.model, vehicle.licensePlate].filter(Boolean).join(" - ") || "Brommer"}
              photoUrl={vehicle.photoUrl}
            />
            <Group>
              {vehicle.nextMaintenanceStatus ? <StatusPill status={vehicle.nextMaintenanceStatus} /> : null}
              <LinkButton href={`/garage/${vehicle.id}`} variant="light" color="dark" size="xs">
                Open detail
              </LinkButton>
              <LinkButton href={`/garage/${vehicle.id}/edit`} variant="subtle" color="dark" size="xs">
                Bewerken
              </LinkButton>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, xl: 3 }}>
            <div>
              <Text size="sm" c="dimmed">
                Kilometerstand bij aankoop
              </Text>
              <Text fw={700}>
                {vehicle.purchaseOdometerKm !== null
                  ? formatKilometers(vehicle.purchaseOdometerKm)
                  : "Niet ingevuld"}
              </Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Kosten deze maand
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
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 2 }}>
            <LinkButton href={`/costs/new/fuel?vehicleId=${vehicle.id}`} color="dark" leftSection={<IconGasStation size={16} />}>
              Tankbeurt
            </LinkButton>
            <LinkButton href={`/trips/new?vehicleId=${vehicle.id}`} variant="white" color="dark" leftSection={<IconRouteAltLeft size={16} />}>
              Rit
            </LinkButton>
            <LinkButton href={`/costs/new?vehicleId=${vehicle.id}`} variant="white" color="dark" leftSection={<IconReceiptEuro size={16} />}>
              Kost
            </LinkButton>
            <LinkButton href={`/maintenance/events/new?vehicleId=${vehicle.id}`} variant="white" color="dark" leftSection={<IconTool size={16} />}>
              Onderhoud
            </LinkButton>
          </SimpleGrid>
        </Stack>
      </Paper>

      <Paper className="surface-card" withBorder>
        <Stack gap="md">
          <Text ff="var(--font-heading)" fw={700} fz="xl">
            Kostenverdeling
          </Text>
          {categoryEntries.length ? (
            categoryEntries.map(([category, amount]) => (
              <Stack key={category} gap="xs">
                <Group justify="space-between" align="center">
                  <Text fw={700}>{categoryLabels[category as keyof typeof categoryLabels]}</Text>
                  <Text fw={700}>{formatCurrency(amount)}</Text>
                </Group>
                <Box
                  h={10}
                  style={{
                    borderRadius: 999,
                    background: "rgba(23, 48, 42, 0.08)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    h="100%"
                    w={`${Math.max((amount / highestCategoryValue) * 100, 8)}%`}
                    style={{
                      borderRadius: 999,
                      background:
                        categoryColors[category as keyof typeof categoryColors] === "teal"
                          ? "linear-gradient(90deg, rgba(67, 171, 149, 0.9), rgba(23, 48, 42, 0.92))"
                          : categoryColors[category as keyof typeof categoryColors] === "amber"
                            ? "linear-gradient(90deg, rgba(255, 179, 71, 0.92), rgba(170, 112, 16, 0.96))"
                            : categoryColors[category as keyof typeof categoryColors] === "rose"
                              ? "linear-gradient(90deg, rgba(214, 96, 118, 0.88), rgba(113, 33, 53, 0.92))"
                              : "linear-gradient(90deg, rgba(120, 132, 128, 0.88), rgba(72, 82, 79, 0.94))",
                    }}
                  />
                </Box>
              </Stack>
            ))
          ) : (
            <Text c="dimmed">Nog geen kostenverdeling voor deze brommer.</Text>
          )}
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, xl: 2 }}>
        <Paper className="surface-card" withBorder>
          <Stack gap="md">
            <Text ff="var(--font-heading)" fw={700} fz="xl">
              Recente tankbeurten
            </Text>
            {data.recentFuelEntries.length ? (
              data.recentFuelEntries.map((entry) => (
                <Group key={entry.id} justify="space-between" align="start">
                  <Stack gap={2}>
                    <Text fw={700}>{entry.fuelStation ?? entry.title}</Text>
                    <Text size="sm" c="dimmed">
                      {entry.fuelType ? fuelTypeLabels[entry.fuelType] : "Tankbeurt"} - {formatDate(entry.entryDate)}
                    </Text>
                  </Stack>
                  <Text fw={700}>{formatCurrency(entry.amountEur)}</Text>
                </Group>
              ))
            ) : (
              <Text c="dimmed">Nog geen tankbeurten voor deze brommer.</Text>
            )}
          </Stack>
        </Paper>

        <Paper className="surface-card" withBorder>
          <Stack gap="md">
            <Text ff="var(--font-heading)" fw={700} fz="xl">
              Recente ritten
            </Text>
            {data.recentTrips.length ? (
              data.recentTrips.map((trip) => (
                <Group key={trip.id} justify="space-between" align="start">
                  <Stack gap={2}>
                    <Text fw={700}>{trip.title}</Text>
                    <Text size="sm" c="dimmed">
                      {formatDate(trip.tripDate)}
                    </Text>
                  </Stack>
                  <Text fw={700}>{formatKilometers(trip.distanceKm)}</Text>
                </Group>
              ))
            ) : (
              <Text c="dimmed">Nog geen ritten voor deze brommer.</Text>
            )}
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}

export function GarageScreen({
  vehicles,
  selectedVehicleId = null,
  selectedVehicleData = null,
}: GarageScreenProps) {
  const averageMonthlyCost =
    vehicles.length > 0
      ? vehicles.reduce((total, vehicle) => total + vehicle.monthlyCostEur, 0) / vehicles.length
      : 0;

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, xs: 3 }}>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Brommers actief
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {vehicles.length}
          </Text>
        </Paper>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Met foto
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {vehicles.filter((vehicle) => vehicle.photoUrl).length}
          </Text>
        </Paper>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Gemiddelde maandkost
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {formatCurrency(averageMonthlyCost)}
          </Text>
        </Paper>
      </SimpleGrid>

      {!vehicles.length ? (
        <ScreenSection
          title="Brommers"
          action={
            <LinkButton href="/garage/new" variant="subtle" color="dark">
              Brommer toevoegen
            </LinkButton>
          }
        >
          <EmptyStateCard
            title="Je garage is nog leeg"
            description="Voeg je eerste brommer toe om ritten, kosten en onderhoud te koppelen."
            action={
              <LinkButton href="/garage/new" variant="light" color="dark">
                Brommer toevoegen
              </LinkButton>
            }
          />
        </ScreenSection>
      ) : (
        <>
          <Box hiddenFrom="md">
            <Paper className="surface-card" withBorder>
              <Stack gap="md">
                <Text fw={700}>Garage acties</Text>
                <SimpleGrid cols={{ base: 1, xs: 2 }}>
                  <ActionTileLink
                    href="/garage/new"
                    title="Brommer toevoegen"
                    description="Zet een nieuwe brommer klaar voor ritten, kosten en onderhoud."
                    icon={<IconBike size={22} stroke={2} />}
                    color="teal"
                  />
                  <ActionTileLink
                    href="/costs/new/fuel"
                    title="Tankbeurt"
                    description="Start snel een tankbeurt en kies daarna de juiste brommer."
                    icon={<IconGasStation size={22} stroke={2} />}
                    color="amber"
                  />
                </SimpleGrid>
              </Stack>
            </Paper>
          </Box>

          <Box hiddenFrom="md">
            <ScreenSection title="Brommers">
              <Stack gap="md">
                {vehicles.map((vehicle) => (
                  <Paper key={vehicle.id} className="surface-card" withBorder>
                    <Stack gap="lg">
                      <Group justify="space-between" align="start">
                        <VehicleAvatar
                          name={vehicle.name}
                          subtitle={[vehicle.brand, vehicle.model, vehicle.licensePlate].filter(Boolean).join(" - ") || "Brommer"}
                          photoUrl={vehicle.photoUrl}
                        />
                        <LinkButton href={`/garage/${vehicle.id}`} variant="light" color="dark">
                          Openen
                        </LinkButton>
                      </Group>

                      <SimpleGrid cols={{ base: 1, xs: 3 }}>
                        <div>
                          <Text size="sm" c="dimmed">
                            Kilometerstand bij aankoop
                          </Text>
                          <Text fw={700}>
                            {vehicle.purchaseOdometerKm !== null
                              ? formatKilometers(vehicle.purchaseOdometerKm)
                              : "Niet ingevuld"}
                          </Text>
                        </div>
                        <div>
                          <Text size="sm" c="dimmed">
                            Kosten deze maand
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
                      </SimpleGrid>

                      <Group justify="space-between" align="center">
                        <Text size="sm" c="dimmed">
                          {vehicle.nextMaintenanceDueDate
                            ? `${vehicle.nextMaintenanceTitle ?? "Onderhoud"} - ${getDueLabel(vehicle.nextMaintenanceDueDate)}`
                            : "Nog geen actief onderhoudsplan"}
                        </Text>
                        {vehicle.nextMaintenanceStatus ? <StatusPill status={vehicle.nextMaintenanceStatus} /> : null}
                      </Group>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </ScreenSection>
          </Box>

          <Box visibleFrom="md">
            <ScreenSection title="Garage" description="Kies links een brommer en werk rechts verder zonder je context te verliezen.">
              <Group align="start" wrap="nowrap">
                <Stack style={{ flex: "0 0 340px" }} gap="md">
                  {vehicles.map((vehicle) => {
                    const isActive = vehicle.id === selectedVehicleId;

                    return (
                      <LinkUnstyledButton
                        key={vehicle.id}
                        href={`/garage?vehicleId=${vehicle.id}`}
                        scroll={false}
                        style={{ width: "100%" }}
                      >
                        <Paper
                          className="surface-card"
                          withBorder
                          style={
                            isActive
                              ? {
                                  borderColor: "rgba(67, 171, 149, 0.48)",
                                  boxShadow: "0 18px 40px rgba(67, 171, 149, 0.16)",
                                }
                              : undefined
                          }
                        >
                          <Stack gap="md">
                            <VehicleAvatar
                              name={vehicle.name}
                              subtitle={[vehicle.brand, vehicle.model, vehicle.licensePlate].filter(Boolean).join(" - ") || "Brommer"}
                              photoUrl={vehicle.photoUrl}
                              size={52}
                            />

                            <SimpleGrid cols={2}>
                              <div>
                                <Text size="sm" c="dimmed">
                                  Kosten deze maand
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
                            </SimpleGrid>

                            <Group justify="space-between" align="center">
                              <Text size="sm" c="dimmed">
                                {vehicle.purchaseOdometerKm !== null
                                  ? formatKilometers(vehicle.purchaseOdometerKm)
                                  : "Geen aankoopkilometerstand"}
                              </Text>
                              {vehicle.nextMaintenanceStatus ? <StatusPill status={vehicle.nextMaintenanceStatus} /> : null}
                            </Group>
                          </Stack>
                        </Paper>
                      </LinkUnstyledButton>
                    );
                  })}
                </Stack>

                <Box style={{ flex: 1, minWidth: 0 }}>
                  {selectedVehicleData ? (
                    <VehiclePreviewPanel data={selectedVehicleData} />
                  ) : (
                    <EmptyStateCard
                      title="Kies een brommer"
                      description="Selecteer links een brommer om de detailcontext te zien."
                    />
                  )}
                </Box>
              </Group>
            </ScreenSection>
          </Box>
        </>
      )}
    </Stack>
  );
}
