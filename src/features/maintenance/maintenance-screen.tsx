import { Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconChecklist, IconTool } from "@tabler/icons-react";

import { LinkButton } from "@/components/ui/app-link";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { ScreenSection } from "@/components/ui/screen-section";
import { StatusPill } from "@/components/ui/status-pill";
import { VehicleAvatar } from "@/components/ui/vehicle-avatar";
import { formatCurrency, formatDate, getDueLabel } from "@/lib/format";
import { toggleMaintenanceRuleAction } from "@/server/maintenance-actions";
import { MaintenancePageData, MaintenanceRuleListItem } from "@/server/maintenance";

function MaintenanceRuleCard({ rule }: { rule: MaintenanceRuleListItem }) {
  return (
    <Paper key={rule.id} className="surface-card" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="start">
          <VehicleAvatar
            name={rule.title}
            subtitle={`${rule.vehicleName} - om de ${rule.intervalMonths} maanden`}
            photoUrl={rule.vehiclePhotoUrl}
            size={48}
          />
          <Group>
            <StatusPill status={rule.status} />
            <LinkButton href={`/maintenance/rules/${rule.id}/edit`} size="xs" variant="light" color="dark">
              Bewerken
            </LinkButton>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 3 }}>
          <div>
            <Text size="sm" c="dimmed">
              Laatst uitgevoerd
            </Text>
            <Text fw={700}>
              {rule.lastCompletedAt ? formatDate(rule.lastCompletedAt) : "Nog niet uitgevoerd"}
            </Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              Volgende datum
            </Text>
            <Text fw={700}>{formatDate(rule.nextDueDate)}</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              Timing
            </Text>
            <Text fw={700}>{getDueLabel(rule.nextDueDate)}</Text>
          </div>
        </SimpleGrid>

        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            {rule.description ?? "Geen extra notities"}
          </Text>
          <form action={toggleMaintenanceRuleAction}>
            <input type="hidden" name="ruleId" value={rule.id} />
            <input type="hidden" name="nextActive" value="false" />
            <ConfirmSubmitButton
              confirmMessage="Wil je dit onderhoudsplan deactiveren? Het blijft wel bewaard in de historiek."
              size="xs"
              variant="subtle"
              color="rose"
            >
              Deactiveren
            </ConfirmSubmitButton>
          </form>
        </Group>
      </Stack>
    </Paper>
  );
}

export function MaintenanceScreen({ data }: { data: MaintenancePageData }) {
  const overdueRules = data.rules.filter((rule) => rule.status === "overdue");
  const soonRules = data.rules.filter((rule) => rule.status === "soon");
  const okRules = data.rules.filter((rule) => rule.status === "ok");

  return (
    <Stack gap="xl">
      <Paper className="surface-card" withBorder>
        <Stack gap="md">
          <Text fw={700}>Nieuwe onderhoudsinvoer</Text>
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <LinkButton
              href="/maintenance/events/new"
              color="dark"
              leftSection={<IconTool size={18} stroke={2} />}
              className="home-action-button"
            >
              Onderhoud registreren
            </LinkButton>
            <LinkButton
              href="/maintenance/rules/new"
              variant="white"
              color="dark"
              leftSection={<IconChecklist size={18} stroke={2} />}
              className="home-action-button"
            >
              Onderhoudsplan toevoegen
            </LinkButton>
          </SimpleGrid>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, xs: 3 }}>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Te laat
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {data.overdueCount}
          </Text>
        </Paper>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Binnenkort
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {data.soonCount}
          </Text>
        </Paper>
        <Paper className="surface-card" withBorder>
          <Text size="sm" c="dimmed">
            Actieve plannen
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {data.activeCount}
          </Text>
        </Paper>
      </SimpleGrid>

      {data.rules.length ? (
        <>
          <ScreenSection title="Te laat">
            <Stack gap="md">
              {overdueRules.length ? (
                overdueRules.map((rule) => <MaintenanceRuleCard key={rule.id} rule={rule} />)
              ) : (
                <EmptyStateCard
                  title="Geen achterstallig onderhoud"
                  description="Zodra een onderhoudsplan over tijd gaat, verschijnt het hier bovenaan."
                />
              )}
            </Stack>
          </ScreenSection>

          <ScreenSection title="Binnenkort">
            <Stack gap="md">
              {soonRules.length ? (
                soonRules.map((rule) => <MaintenanceRuleCard key={rule.id} rule={rule} />)
              ) : (
                <EmptyStateCard
                  title="Geen onderhoud dat binnenkort verloopt"
                  description="Plannen die bijna aan de beurt zijn, komen hier terecht."
                />
              )}
            </Stack>
          </ScreenSection>

          <ScreenSection title="Op schema">
            <Stack gap="md">
              {okRules.length ? (
                okRules.map((rule) => <MaintenanceRuleCard key={rule.id} rule={rule} />)
              ) : (
                <EmptyStateCard
                  title="Nog geen plannen op schema"
                  description="Actieve plannen zonder directe aandacht verschijnen hier."
                />
              )}
            </Stack>
          </ScreenSection>
        </>
      ) : (
        <ScreenSection title="Onderhoudsplannen">
          <EmptyStateCard
            title="Nog geen onderhoudsplannen"
            description="Actieve onderhoudsplannen verschijnen hier zodra je ze toevoegt."
          />
        </ScreenSection>
      )}

      {data.inactiveRules.length ? (
        <ScreenSection title="Inactieve plannen">
          <Stack gap="md">
            {data.inactiveRules.map((rule) => (
              <Paper key={rule.id} className="surface-card" withBorder>
                <Stack gap="md">
                  <Group justify="space-between" align="start">
                    <VehicleAvatar
                      name={rule.title}
                      subtitle={`${rule.vehicleName} - gepauzeerd`}
                      photoUrl={rule.vehiclePhotoUrl}
                      size={48}
                    />
                    <Group>
                      <LinkButton href={`/maintenance/rules/${rule.id}/edit`} size="xs" variant="light" color="dark">
                        Bewerken
                      </LinkButton>
                      <form action={toggleMaintenanceRuleAction}>
                        <input type="hidden" name="ruleId" value={rule.id} />
                        <input type="hidden" name="nextActive" value="true" />
                        <Button type="submit" size="xs" variant="subtle" color="dark">
                          Heractiveren
                        </Button>
                      </form>
                    </Group>
                  </Group>

                  <SimpleGrid cols={{ base: 1, xs: 2 }}>
                    <div>
                      <Text size="sm" c="dimmed">
                        Volgende datum
                      </Text>
                      <Text fw={700}>{formatDate(rule.nextDueDate)}</Text>
                    </div>
                    <div>
                      <Text size="sm" c="dimmed">
                        Interval
                      </Text>
                      <Text fw={700}>Om de {rule.intervalMonths} maanden</Text>
                    </div>
                  </SimpleGrid>

                  <Text size="sm" c="dimmed">
                    {rule.description ?? "Geen extra notities"}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </ScreenSection>
      ) : null}

      <ScreenSection title="Recente onderhoudsbeurten">
        <Stack gap="md">
          {data.events.length ? (
            data.events.map((event) => (
              <Paper key={event.id} className="surface-card" withBorder>
                <Group justify="space-between" align="start" wrap="nowrap">
                  <Stack gap="sm">
                    <VehicleAvatar
                      name={event.title}
                      subtitle={`${event.vehicleName} - ${formatDate(event.performedAt)}`}
                      photoUrl={event.vehiclePhotoUrl}
                      size={48}
                    />
                    <Text size="sm" c="dimmed">
                      {event.workshopName ?? "Geen werkplaats"}
                    </Text>
                  </Stack>

                  <Stack gap={8} align="end">
                    <Text fw={700}>
                      {typeof event.costAmountEur === "number"
                        ? formatCurrency(event.costAmountEur)
                        : "Geen kost"}
                    </Text>
                    <LinkButton href={`/maintenance/events/${event.id}/edit`} size="xs" variant="light" color="dark">
                      Bewerken
                    </LinkButton>
                  </Stack>
                </Group>
              </Paper>
            ))
          ) : (
            <EmptyStateCard
              title="Nog geen onderhoudsbeurten"
              description="Geregistreerde onderhoudsbeurten verschijnen hier zodra je ze bewaart."
            />
          )}
        </Stack>
      </ScreenSection>
    </Stack>
  );
}
