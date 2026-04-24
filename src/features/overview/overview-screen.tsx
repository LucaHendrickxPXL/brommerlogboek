import { Box, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";

import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { ScreenSection } from "@/components/ui/screen-section";
import { categoryColors } from "@/lib/costs";
import { formatCurrency, formatKilometers, formatMonthLabel } from "@/lib/format";
import { OverviewPageData } from "@/server/overview";

export function OverviewScreen({ data }: { data: OverviewPageData }) {
  const maxCost = Math.max(1, ...data.months.map((item) => item.totalCostEur));
  const hasAnyData = data.totalCosts > 0 || data.totalDistanceKm > 0;
  const maxVehicleCost = Math.max(1, ...data.costsByVehicle.map((item) => item.totalCostEur));
  const maxCategoryCost = Math.max(1, ...data.costsByCategory.map((item) => item.totalCostEur));

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, xs: 2 }}>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Totaal kosten laatste 6 maanden
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {formatCurrency(data.totalCosts)}
          </Text>
        </Paper>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Totaal gereden afstand
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {formatKilometers(data.totalDistanceKm)}
          </Text>
        </Paper>
      </SimpleGrid>

      <ScreenSection title="Kosten per brommer">
        <Stack gap="md">
          {data.costsByVehicle.length ? (
            data.costsByVehicle.map((item) => (
              <Paper key={item.vehicleId} className="surface-card" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Text fw={700}>{item.vehicleName}</Text>
                    <Text fw={700}>{formatCurrency(item.totalCostEur)}</Text>
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
                      w={`${Math.max((item.totalCostEur / maxVehicleCost) * 100, 8)}%`}
                      style={{
                        borderRadius: 999,
                        background: "linear-gradient(90deg, rgba(67, 171, 149, 0.9), rgba(23, 48, 42, 0.92))",
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>
            ))
          ) : (
            <EmptyStateCard
              title="Nog geen brommerkosten"
              description="Zodra er kosten zijn, zie je hier hoe ze verdeeld zijn per brommer."
            />
          )}
        </Stack>
      </ScreenSection>

      <ScreenSection title="Kosten per categorie">
        <Stack gap="md">
          {data.costsByCategory.length ? (
            data.costsByCategory.map((item) => (
              <Paper key={item.category} className="surface-card" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Text fw={700}>{item.label}</Text>
                    <Text fw={700}>{formatCurrency(item.totalCostEur)}</Text>
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
                      w={`${Math.max((item.totalCostEur / maxCategoryCost) * 100, 8)}%`}
                      style={{
                        borderRadius: 999,
                        background:
                          item.category === "fuel"
                            ? "linear-gradient(90deg, rgba(255, 179, 71, 0.92), rgba(170, 112, 16, 0.96))"
                            : item.category === "maintenance"
                              ? "linear-gradient(90deg, rgba(214, 96, 118, 0.88), rgba(113, 33, 53, 0.92))"
                              : categoryColors[item.category] === "teal"
                                ? "linear-gradient(90deg, rgba(67, 171, 149, 0.9), rgba(23, 48, 42, 0.92))"
                                : "linear-gradient(90deg, rgba(120, 132, 128, 0.88), rgba(72, 82, 79, 0.94))",
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>
            ))
          ) : (
            <EmptyStateCard
              title="Nog geen categorieverdeling"
              description="Hier verschijnt de verdeling zodra je kosten bewaart."
            />
          )}
        </Stack>
      </ScreenSection>

      <ScreenSection title="Maandtrend">
        {hasAnyData ? (
          <Paper className="surface-card" withBorder>
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
              {data.months.map((item) => (
                <Stack key={item.month} gap="sm" align="center">
                  <Box
                    w="100%"
                    mih={180}
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      w={56}
                      h={`${Math.max((item.totalCostEur / maxCost) * 160, 28)}px`}
                      style={{
                        borderRadius: "22px 22px 12px 12px",
                        background:
                          "linear-gradient(180deg, rgba(67, 171, 149, 0.92), rgba(23, 48, 42, 0.94))",
                      }}
                    />
                  </Box>
                  <Text fw={700}>{formatMonthLabel(item.month)}</Text>
                  <Text size="sm" c="dimmed">
                    {formatCurrency(item.totalCostEur)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {formatKilometers(item.distanceKm)}
                  </Text>
                </Stack>
              ))}
            </SimpleGrid>
          </Paper>
        ) : (
          <EmptyStateCard
            title="Nog geen trenddata"
            description="Zodra je ritten en kosten bewaart, zie je hier je maandtrend."
          />
        )}
      </ScreenSection>

      <ScreenSection title="Benzinetrend">
        <Stack gap="md">
          {data.fuelMonths.some((item) => item.fuelCostEur > 0) ? (
            data.fuelMonths.map((item) => (
              <Paper key={item.month} className="surface-card" withBorder>
                <Group justify="space-between" align="center">
                  <Text fw={700}>{formatMonthLabel(item.month)}</Text>
                  <Text fw={700}>{formatCurrency(item.fuelCostEur)}</Text>
                </Group>
              </Paper>
            ))
          ) : (
            <EmptyStateCard
              title="Nog geen benzinetrend"
              description="Benzinekosten per maand verschijnen hier zodra je tankbeurten opslaat."
            />
          )}
        </Stack>
      </ScreenSection>

      <ScreenSection title="Kost per kilometer">
        <Stack gap="md">
          {hasAnyData ? (
            data.months.map((item) => (
              <Paper key={item.month} className="surface-card" withBorder>
                <Group justify="space-between" align="center">
                  <Text fw={700}>{formatMonthLabel(item.month)}</Text>
                  <Text fw={700}>
                    {item.distanceKm > 0 ? `${formatCurrency(item.totalCostEur / item.distanceKm)} / km` : "Geen afstand"}
                  </Text>
                </Group>
              </Paper>
            ))
          ) : (
            <EmptyStateCard
              title="Nog geen kost per kilometer"
              description="Daarvoor hebben we minstens een rit en een kost nodig."
            />
          )}
        </Stack>
      </ScreenSection>
    </Stack>
  );
}
