import { Paper, Stack, Text } from "@mantine/core";
import { PropsWithChildren } from "react";

interface PublicAuthShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export function PublicAuthShell({ title, subtitle, children }: PublicAuthShellProps) {
  return (
    <Stack maw={460} mx="auto" py={{ base: 48, sm: 72 }} gap="xl">
      <Stack gap={6}>
        <Text ff="var(--font-heading)" fw={800} fz={{ base: 30, sm: 38 }}>
          {title}
        </Text>
        <Text c="dimmed">{subtitle}</Text>
      </Stack>

      <Paper className="surface-card" withBorder p="lg">
        {children}
      </Paper>
    </Stack>
  );
}
