import { Group, Stack, Text } from "@mantine/core";
import { PropsWithChildren, ReactNode } from "react";

interface ScreenSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function ScreenSection({
  title,
  description,
  action,
  children,
}: ScreenSectionProps) {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="end" wrap="wrap" gap="sm">
        <Stack gap={2} style={{ flex: "1 1 240px" }}>
          <Text ff="var(--font-heading)" fw={700} fz="xl">
            {title}
          </Text>
          {description ? (
            <Text c="dimmed" size="sm">
              {description}
            </Text>
          ) : null}
        </Stack>

        {action ? (
          action
        ) : null}
      </Group>

      {children}
    </Stack>
  );
}
