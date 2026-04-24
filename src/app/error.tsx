"use client";

import { Button, Paper, Stack, Text } from "@mantine/core";

import { LinkButton } from "@/components/ui/app-link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Stack maw={640} mx="auto" py="xl" gap="xl">
      <Paper className="surface-card" withBorder>
        <Stack gap="md">
          <Text ff="var(--font-heading)" fw={800} fz={{ base: 28, sm: 34 }}>
            Er liep iets mis
          </Text>
          <Text c="dimmed">
            De pagina kon niet veilig geladen worden. Probeer opnieuw of ga terug naar je overzicht.
          </Text>
          {error.digest ? (
            <Text size="sm" c="dimmed">
              Referentie: {error.digest}
            </Text>
          ) : null}
          <Stack gap="sm">
            <Button onClick={reset} color="dark">
              Opnieuw proberen
            </Button>
            <LinkButton href="/" variant="subtle" color="dark">
              Naar Home
            </LinkButton>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
