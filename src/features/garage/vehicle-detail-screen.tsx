import { Box, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import {
  IconGasStation,
  IconReceiptEuro,
  IconRouteAltLeft,
  IconTool,
} from "@tabler/icons-react";

import { ActionTileLink } from "@/components/ui/action-tile-link";
import { LinkButton } from "@/components/ui/app-link";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatusPill } from "@/components/ui/status-pill";
import { VehicleAvatar } from "@/components/ui/vehicle-avatar";
import { categoryColors, categoryLabels, fuelTypeLabels } from "@/lib/costs";
import { formatCurrency, formatDate, formatKilometers } from "@/lib/format";
import { archiveVehicleAction } from "@/server/garage-actions";
import { VehicleDetailPageData } from "@/server/vehicles";
import { VehiclePhotoForm } from "@/features/garage/vehicle-photo-form";

function vehicleSubtitle(vehicle: VehicleDetailPageData["vehicle"]) {
  return [vehicle.brand, vehicle.model, vehicle.licensePlate].filter(Boolean).join(" - ") || "Geen extra info";
}

export function VehicleDetailScreen({ data }: { data: VehicleDetailPageData }) {
  const { vehicle } = data;
  const categoryEntries = Object.entries(data.costTotalsByCategory).filter(([, amount]) => amount > 0);
  const highestCategoryValue = Math.max(1, ...categoryEntries.map(([, amount]) => amount));

  return (
    <Stack gap="xl">
      <Paper className="surface-card" withBorder>
        <Stack gap="lg">
          <Group justify="space-between" align="start">
            <VehicleAvatar
              name={vehicle.name}
              subtitle={vehicleSubtitle(vehicle)}
              photoUrl={vehicle.photoUrl}
            />

            <Group>
              <LinkButton href={`/garage/${vehicle.id}/edit`} variant="light" color="dark">
                Bewerken
              </LinkButton>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 3 }}>
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

          {vehicle.nextMaintenanceStatus ? (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {vehicle.nextMaintenanceTitle ?? "Onderhoud"} gepland
              </Text>
              <StatusPill status={vehicle.nextMaintenanceStatus} />
            </Group>
          ) : null}
        </Stack>
      </Paper>

      <ScreenSection title="Snelle acties">
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }}>
          <ActionTileLink
            href={`/costs/new/fuel?vehicleId=${vehicle.id}`}
            title="Tankbeurt"
            description="Log brandstof en bedrag direct voor deze brommer."
            icon={<IconGasStation size={22} stroke={2} />}
            color="amber"
          />
          <ActionTileLink
            href={`/trips/new?vehicleId=${vehicle.id}`}
            title="Rit"
            description="Voeg een rit toe met afstand, traject en optioneel een foto."
            icon={<IconRouteAltLeft size={22} stroke={2} />}
            color="teal"
          />
          <ActionTileLink
            href={`/costs/new?vehicleId=${vehicle.id}`}
            title="Kost"
            description="Bewaar een losse kost zoals onderdelen of verzekering."
            icon={<IconReceiptEuro size={22} stroke={2} />}
            color="rose"
          />
          <ActionTileLink
            href={`/maintenance/events/new?vehicleId=${vehicle.id}`}
            title="Onderhoud"
            description="Registreer service, vervanging of een andere onderhoudsbeurt."
            icon={<IconTool size={22} stroke={2} />}
            color="teal"
          />
        </SimpleGrid>
      </ScreenSection>

      <ScreenSection title="Details">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Paper className="surface-card" withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Aankoop
              </Text>
              <Text fw={700}>
                {vehicle.purchaseDate ? formatDate(vehicle.purchaseDate) : "Niet ingevuld"}
              </Text>
              <Text c="dimmed" size="sm">
                {vehicle.purchasePriceEur !== null ? formatCurrency(vehicle.purchasePriceEur) : "Geen aankoopprijs"}
              </Text>
            </Stack>
          </Paper>

          <Paper className="surface-card" withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Verzekering
              </Text>
              <Text fw={700}>{vehicle.insuranceProvider ?? "Niet ingevuld"}</Text>
              <Text c="dimmed" size="sm">
                {vehicle.insuranceCostMonthlyEur !== null
                  ? `${formatCurrency(vehicle.insuranceCostMonthlyEur)} per maand`
                  : "Geen maandbedrag"}
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        {vehicle.notes ? (
          <Paper className="surface-card" withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Notities
              </Text>
              <Text>{vehicle.notes}</Text>
            </Stack>
          </Paper>
        ) : null}
      </ScreenSection>

      <ScreenSection title="Kostenverdeling">
        <Stack gap="md">
          {categoryEntries.length ? (
            categoryEntries.map(([category, amount]) => (
              <Paper key={category} className="surface-card" withBorder>
                <Stack gap="sm">
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
              </Paper>
            ))
          ) : (
            <Paper className="surface-card" withBorder>
              <Text c="dimmed">Nog geen kostenverdeling voor deze brommer.</Text>
            </Paper>
          )}
        </Stack>
      </ScreenSection>

      <ScreenSection title="Brommerfoto">
        <Paper className="surface-card" withBorder>
          <VehiclePhotoForm vehicleId={vehicle.id} photoUrl={vehicle.photoUrl} />
        </Paper>
      </ScreenSection>

      <ScreenSection title="Recente tankbeurten">
        <Stack gap="md">
          {data.recentFuelEntries.length ? (
            data.recentFuelEntries.map((entry) => (
              <Paper key={entry.id} className="surface-card" withBorder>
                <Group justify="space-between" align="start">
                  <Stack gap={4}>
                    <Text fw={700}>{entry.fuelStation ?? entry.title}</Text>
                    <Text size="sm" c="dimmed">
                      {entry.fuelType ? fuelTypeLabels[entry.fuelType] : "Tankbeurt"} - {formatDate(entry.entryDate)}
                    </Text>
                  </Stack>
                  <Text fw={700}>{formatCurrency(entry.amountEur)}</Text>
                </Group>
              </Paper>
            ))
          ) : (
            <Paper className="surface-card" withBorder>
              <Text c="dimmed">Nog geen tankbeurten voor deze brommer.</Text>
            </Paper>
          )}
        </Stack>
      </ScreenSection>

      <ScreenSection title="Recente ritten">
        <Stack gap="md">
          {data.recentTrips.length ? (
            data.recentTrips.map((trip) => (
              <Paper key={trip.id} className="surface-card" withBorder>
                <Group justify="space-between" align="start">
                  <Stack gap={4}>
                    <Text fw={700}>{trip.title}</Text>
                    <Text size="sm" c="dimmed">
                      {formatDate(trip.tripDate)}
                    </Text>
                  </Stack>
                  <Stack gap={6} align="end">
                    <Text fw={700}>{formatKilometers(trip.distanceKm)}</Text>
                    <LinkButton href={`/trips/${trip.id}`} size="xs" variant="light" color="dark">
                      Openen
                    </LinkButton>
                  </Stack>
                </Group>
              </Paper>
            ))
          ) : (
            <Paper className="surface-card" withBorder>
              <Text c="dimmed">Nog geen ritten voor deze brommer.</Text>
            </Paper>
          )}
        </Stack>
      </ScreenSection>

      <ScreenSection title="Recente kosten">
        <Stack gap="md">
          {data.recentCosts.length ? (
            data.recentCosts.map((entry) => (
              <Paper key={entry.id} className="surface-card" withBorder>
                <Group justify="space-between">
                  <Stack gap={4}>
                    <Text fw={700}>{entry.title}</Text>
                    <Text size="sm" c="dimmed">
                      {categoryLabels[entry.category as keyof typeof categoryLabels]} - {formatDate(entry.entryDate)}
                    </Text>
                  </Stack>
                  <Text fw={700}>{formatCurrency(entry.amountEur)}</Text>
                </Group>
              </Paper>
            ))
          ) : (
            <Paper className="surface-card" withBorder>
              <Text c="dimmed">Nog geen kosten voor deze brommer.</Text>
            </Paper>
          )}
        </Stack>
      </ScreenSection>

      <ScreenSection title="Onderhoudsplannen">
        <Stack gap="md">
          {data.maintenanceRules.length ? (
            data.maintenanceRules.map((rule) => (
              <Paper key={rule.id} className="surface-card" withBorder>
                <Group justify="space-between" align="start">
                  <Stack gap={4}>
                    <Text fw={700}>{rule.title}</Text>
                    <Text size="sm" c="dimmed">
                      Om de {rule.intervalMonths} maanden - {formatDate(rule.nextDueDate)}
                    </Text>
                  </Stack>
                  <Group>
                    <StatusPill status={rule.status} />
                    <LinkButton href={`/maintenance/rules/${rule.id}/edit`} size="xs" variant="light" color="dark">
                      Bewerken
                    </LinkButton>
                  </Group>
                </Group>
              </Paper>
            ))
          ) : (
            <Paper className="surface-card" withBorder>
              <Text c="dimmed">Nog geen onderhoudsplannen.</Text>
            </Paper>
          )}
        </Stack>
      </ScreenSection>

      <Paper className="surface-card" withBorder>
        <Stack gap="sm">
          <Text fw={700}>Brommer archiveren</Text>
          <Text size="sm" c="dimmed">
            De brommer verdwijnt uit je actieve garage, maar historische ritten en kosten blijven bewaard.
          </Text>
          <form action={archiveVehicleAction}>
            <input type="hidden" name="vehicleId" value={vehicle.id} />
            <ConfirmSubmitButton
              confirmMessage="Deze brommer verdwijnt uit je actieve garage, maar historiek blijft bewaard. Doorgaan?"
              variant="light"
              color="rose"
            >
              Archiveer brommer
            </ConfirmSubmitButton>
          </form>
        </Stack>
      </Paper>
    </Stack>
  );
}
