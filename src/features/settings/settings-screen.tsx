import { Badge, Button, Paper, SimpleGrid, Stack, Text } from "@mantine/core";

import { ScreenSection } from "@/components/ui/screen-section";
import { ThemePreferenceForm } from "@/features/settings/theme-preference-form";
import { SessionUser } from "@/server/auth";
import { logoutUserAction } from "@/server/auth-actions";

export function SettingsScreen({ user }: { user: SessionUser }) {
  return (
    <Stack gap="xl">
      <ScreenSection title="Account">
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Paper className="surface-card" withBorder>
            <Stack gap="xs">
              <Badge variant="light" color="teal" w="fit-content">
                Profiel
              </Badge>
              <Text fw={700}>{user.displayName}</Text>
              <Text size="sm" c="dimmed">
                {user.email}
              </Text>
            </Stack>
          </Paper>

          <Paper className="surface-card" withBorder>
            <Stack gap="xs">
              <Badge variant="light" color="amber" w="fit-content">
                Sessie
              </Badge>
              <Text fw={700}>Actieve sessie</Text>
              <Text size="sm" c="dimmed">
                Je bent momenteel ingelogd in deze browser.
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>
      </ScreenSection>

      <ScreenSection title="Back-up en productie">
        <Paper className="surface-card" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Runtime</Text>
            <Text size="sm" c="dimmed">
              Postgres, uploads en deployconfig worden apart beheerd voor back-up en herstel.
            </Text>
          </Stack>
        </Paper>
      </ScreenSection>

      <ScreenSection title="Weergave">
        <Paper className="surface-card" withBorder>
          <Stack gap="sm">
            <Badge variant="light" color="dark" w="fit-content">
              Thema
            </Badge>
            <Text fw={700}>Kies je kleurmodus</Text>
            <Text size="sm" c="dimmed">
              Deze voorkeur wordt per account opgeslagen en volgt je keuze op elk toestel waar je inlogt.
            </Text>
            <ThemePreferenceForm initialValue={user.themePreference} />
          </Stack>
        </Paper>
      </ScreenSection>

      <ScreenSection title="Afmelden">
        <Paper className="surface-card" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Uitloggen</Text>
            <Text size="sm" c="dimmed">
              Hiermee sluit je deze sessie af en kom je terug op het loginscherm.
            </Text>
            <form action={logoutUserAction}>
              <Button type="submit" variant="light" color="dark">
                Uitloggen
              </Button>
            </form>
          </Stack>
        </Paper>
      </ScreenSection>
    </Stack>
  );
}
