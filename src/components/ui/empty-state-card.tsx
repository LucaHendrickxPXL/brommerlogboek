import { Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconInbox } from "@tabler/icons-react";
import { ReactNode } from "react";

interface EmptyStateCardProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyStateCard({
  title,
  description,
  action,
}: EmptyStateCardProps) {
  return (
    <Paper className="surface-card empty-state-card" withBorder p={{ base: "lg", sm: "xl" }}>
      <Stack gap="md" align="center">
        <ThemeIcon size={56} radius="xl" color="gray" variant="light">
          <IconInbox size={26} stroke={1.8} />
        </ThemeIcon>
        <Stack gap={4} align="center">
          <Text ff="var(--font-heading)" fw={700} fz="lg" ta="center">
            {title}
          </Text>
          <Text c="dimmed" size="sm" ta="center">
            {description}
          </Text>
        </Stack>
        {action ? (
          action
        ) : null}
      </Stack>
    </Paper>
  );
}
