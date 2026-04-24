import { Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

import { LinkUnstyledButton } from "@/components/ui/app-link";

interface ActionTileLinkProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  color?: string;
}

export function ActionTileLink({
  href,
  title,
  description,
  icon,
  color = "teal",
}: ActionTileLinkProps) {
  return (
    <LinkUnstyledButton href={href} className="action-tile-link">
      <Paper className="surface-card action-tile-card" withBorder>
        <Group align="flex-start" wrap="nowrap" gap="md">
          <ThemeIcon size={52} radius="xl" color={color} variant="light">
            {icon}
          </ThemeIcon>

          <Stack gap={4} style={{ flex: 1 }}>
            <Text ff="var(--font-heading)" fw={700} fz="lg" lh={1.08}>
              {title}
            </Text>
            <Text c="dimmed" size="sm">
              {description}
            </Text>
          </Stack>
        </Group>
      </Paper>
    </LinkUnstyledButton>
  );
}
