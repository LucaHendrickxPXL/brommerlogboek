import { Button, Paper, Stack, Text } from "@mantine/core";

import { LinkButton } from "@/components/ui/app-link";

export default function NotFound() {
  return (
    <Stack maw={640} mx="auto" py="xl" gap="xl">
      <Paper className="surface-card" withBorder>
        <Stack gap="md">
          <Text ff="var(--font-heading)" fw={800} fz={{ base: 28, sm: 34 }}>
            Niet gevonden
          </Text>
          <Text c="dimmed">
            Dit onderdeel bestaat niet meer of hoort niet bij jouw garage.
          </Text>
          <Stack gap="sm">
            <LinkButton href="/garage" color="dark">
              Naar Garage
            </LinkButton>
            <LinkButton href="/" variant="subtle" color="dark">
              Naar Home
            </LinkButton>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
