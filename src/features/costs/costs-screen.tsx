"use client";

import { Box, Group, NativeSelect, Paper, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconGasStation, IconReceiptEuro } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { MobileFilterSheet } from "@/components/ui/mobile-filter-sheet";
import { ScreenSection } from "@/components/ui/screen-section";
import { VehicleAvatar } from "@/components/ui/vehicle-avatar";
import {
  categoryColors,
  categoryLabels,
  fuelTypeLabels,
  paymentMethodLabels,
} from "@/lib/costs";
import { CostCategory } from "@/lib/domain";
import { formatCompactDate, formatCurrency } from "@/lib/format";
import { CostsPageData } from "@/server/costs";

type VehicleFilter = "all" | string;
type CategoryFilter = "all" | CostCategory;
type PeriodFilter = "this-month" | "last-3-months" | "all";

const periodFilterOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: "this-month", label: "Deze maand" },
  { value: "last-3-months", label: "Laatste 3 maanden" },
  { value: "all", label: "Alles" },
];

function createEmptyCategoryTotals() {
  return {
    fuel: 0,
    insurance: 0,
    maintenance: 0,
    taxes: 0,
    parking: 0,
    equipment: 0,
    repair: 0,
    other: 0,
  } satisfies Record<CostCategory, number>;
}

function matchesPeriod(entryDate: string, periodFilter: PeriodFilter) {
  const date = dayjs(entryDate);

  if (periodFilter === "all") {
    return true;
  }

  if (periodFilter === "this-month") {
    return date.isSame(dayjs(), "month");
  }

  return date.isSame(dayjs(), "month") || date.isAfter(dayjs().startOf("month").subtract(2, "month"));
}

export function CostsScreen({ data }: { data: CostsPageData }) {
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("this-month");

  const vehicleFilterLabel =
    vehicleFilter === "all"
      ? "Alle brommers"
      : data.vehicles.find((vehicle) => vehicle.id === vehicleFilter)?.name ?? "Alle brommers";
  const categoryFilterLabel =
    categoryFilter === "all" ? "Alle categorieen" : categoryLabels[categoryFilter];
  const periodFilterLabel =
    periodFilterOptions.find((option) => option.value === periodFilter)?.label ?? "Deze maand";
  const hasCustomFilters =
    vehicleFilter !== "all" || categoryFilter !== "all" || periodFilter !== "this-month";

  const filteredEntries = data.entries.filter((entry) => {
    const matchesVehicle = vehicleFilter === "all" || entry.vehicleId === vehicleFilter;
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;

    return matchesVehicle && matchesCategory && matchesPeriod(entry.entryDate, periodFilter);
  });

  const totalsByCategory = createEmptyCategoryTotals();

  for (const entry of filteredEntries) {
    totalsByCategory[entry.category] += entry.amountEur;
  }

  const highestCategoryValue = Math.max(1, ...Object.values(totalsByCategory));
  const selectionTotal = filteredEntries.reduce((total, entry) => total + entry.amountEur, 0);
  const selectionFuelTotal = filteredEntries
    .filter((entry) => entry.category === "fuel")
    .reduce((total, entry) => total + entry.amountEur, 0);

  return (
    <Stack gap="xl">
      <Paper className="surface-card" withBorder>
        <Stack gap="md">
          <Text fw={700}>Nieuwe kost</Text>
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <LinkButton
              href="/costs/new/fuel"
              color="dark"
              leftSection={<IconGasStation size={18} stroke={2} />}
              className="home-action-button"
            >
              Tankbeurt toevoegen
            </LinkButton>
            <LinkButton
              href="/costs/new"
              variant="white"
              color="dark"
              leftSection={<IconReceiptEuro size={18} stroke={2} />}
              className="home-action-button"
            >
              Kost toevoegen
            </LinkButton>
          </SimpleGrid>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, xs: 3 }}>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Kosten in selectie
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {formatCurrency(selectionTotal)}
          </Text>
        </Paper>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Benzine in selectie
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {formatCurrency(selectionFuelTotal)}
          </Text>
        </Paper>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Aantal kosten
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {filteredEntries.length}
          </Text>
        </Paper>
      </SimpleGrid>

      <ScreenSection title="Filters">
        <Stack gap="md">
          <Box hiddenFrom="md">
            <MobileFilterSheet
              title="Kostenfilters"
              summary={`${vehicleFilterLabel} • ${categoryFilterLabel} • ${periodFilterLabel}`}
              hasActiveFilters={hasCustomFilters}
              onClear={() => {
                setVehicleFilter("all");
                setCategoryFilter("all");
                setPeriodFilter("this-month");
              }}
            >
              <Stack gap="md">
                <NativeSelect
                  label="Brommer"
                  data={[
                    { value: "all", label: "Alle brommers" },
                    ...data.vehicles.map((vehicle) => ({
                      value: vehicle.id,
                      label: vehicle.name,
                    })),
                  ]}
                  value={vehicleFilter}
                  onChange={(event) => setVehicleFilter(event.currentTarget.value)}
                />
                <NativeSelect
                  label="Categorie"
                  data={[
                    { value: "all", label: "Alle categorieen" },
                    ...(Object.keys(categoryLabels) as CostCategory[]).map((category) => ({
                      value: category,
                      label: categoryLabels[category],
                    })),
                  ]}
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.currentTarget.value as CategoryFilter)}
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
            <SimpleGrid cols={{ base: 1, md: 3 }}>
              <NativeSelect
                label="Brommer"
                data={[
                  { value: "all", label: "Alle brommers" },
                  ...data.vehicles.map((vehicle) => ({
                    value: vehicle.id,
                    label: vehicle.name,
                  })),
                ]}
                value={vehicleFilter}
                onChange={(event) => setVehicleFilter(event.currentTarget.value)}
              />
              <NativeSelect
                label="Categorie"
                data={[
                  { value: "all", label: "Alle categorieen" },
                  ...(Object.keys(categoryLabels) as CostCategory[]).map((category) => ({
                    value: category,
                    label: categoryLabels[category],
                  })),
                ]}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.currentTarget.value as CategoryFilter)}
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

      <ScreenSection title="Per categorie">
        <Stack gap="md">
          {filteredEntries.length ? (
            Object.entries(totalsByCategory)
              .filter(([, amount]) => amount > 0)
              .map(([category, amount]) => (
                <Paper key={category} className="surface-card" withBorder>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={700}>{categoryLabels[category as CostCategory]}</Text>
                      <Text fw={700}>{formatCurrency(amount)}</Text>
                    </Group>
                    <Progress
                      value={(amount / highestCategoryValue) * 100}
                      color={categoryColors[category as CostCategory]}
                      radius="xl"
                      size="lg"
                    />
                  </Stack>
                </Paper>
              ))
          ) : (
            <EmptyStateCard
              title="Geen kosten in selectie"
              description="Pas je filters aan of voeg een nieuwe kost toe."
            />
          )}
        </Stack>
      </ScreenSection>

      <ScreenSection title="Kosten">
        <Stack gap="md">
          {filteredEntries.length ? (
            filteredEntries.map((entry) => (
              <Paper key={entry.id} className="surface-card" withBorder>
                <Group justify="space-between" align="start" wrap="nowrap">
                  <Stack gap="sm">
                    <VehicleAvatar
                      name={entry.title}
                      subtitle={`${entry.vehicleName} - ${
                        entry.category === "fuel" && entry.fuelType
                          ? `Tankbeurt ${fuelTypeLabels[entry.fuelType]}`
                          : categoryLabels[entry.category]
                      }`}
                      photoUrl={entry.vehiclePhotoUrl}
                      size={48}
                    />
                    <Text size="sm" c="dimmed">
                      {entry.category === "fuel"
                        ? `${entry.fuelStation ?? "Tankbeurt"} - ${formatCompactDate(entry.entryDate)}`
                        : `${entry.vendorName ?? "Handmatige kost"} - ${formatCompactDate(entry.entryDate)}`}
                    </Text>
                  </Stack>

                  <Stack gap={2} align="end">
                    <Text fw={700}>{formatCurrency(entry.amountEur)}</Text>
                    {entry.category === "fuel" ? (
                      <Text size="sm" c="dimmed">
                        {entry.isFullTank
                          ? `Full tank${entry.fuelType ? ` - ${fuelTypeLabels[entry.fuelType]}` : ""}`
                          : entry.fuelType
                            ? fuelTypeLabels[entry.fuelType]
                            : "Tankbeurt"}
                      </Text>
                    ) : entry.locationName ? (
                      <Text size="sm" c="dimmed">
                        {entry.locationName}
                      </Text>
                    ) : entry.paymentMethod ? (
                      <Text size="sm" c="dimmed">
                        {paymentMethodLabels[entry.paymentMethod]}
                      </Text>
                    ) : null}
                    <LinkButton
                      href={
                        entry.linkedMaintenanceEventId
                          ? `/maintenance/events/${entry.linkedMaintenanceEventId}/edit`
                          : `/costs/${entry.id}/edit`
                      }
                      size="xs"
                      variant="light"
                      color="dark"
                    >
                      Bewerken
                    </LinkButton>
                  </Stack>
                </Group>
              </Paper>
            ))
          ) : (
            <EmptyStateCard
              title={data.entries.length === 0 ? "Nog geen kosten" : "Geen kosten voor deze filter"}
              description={
                data.entries.length === 0
                  ? "Je eerste tankbeurt of kost verschijnt hier zodra je die bewaart."
                  : "Pas je filters aan of voeg een nieuwe kost toe."
              }
              action={
                data.entries.length === 0 ? (
                  <LinkButton href="/costs/new" variant="light" color="dark">
                    Kost toevoegen
                  </LinkButton>
                ) : undefined
              }
            />
          )}
        </Stack>
      </ScreenSection>
    </Stack>
  );
}
