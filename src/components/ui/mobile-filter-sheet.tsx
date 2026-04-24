"use client";

import { Button, Drawer, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAdjustmentsHorizontal, IconFilterOff } from "@tabler/icons-react";
import { ReactNode, useState } from "react";

interface MobileFilterSheetProps {
  title: string;
  summary: string;
  children: ReactNode;
  hasActiveFilters?: boolean;
  onClear?: () => void;
}

export function MobileFilterSheet({
  title,
  summary,
  children,
  hasActiveFilters = false,
  onClear,
}: MobileFilterSheetProps) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Paper className="surface-card" withBorder p="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Group gap="sm" align="flex-start" wrap="nowrap" style={{ flex: 1 }}>
            <ThemeIcon size={42} radius="xl" color="teal" variant="light">
              <IconAdjustmentsHorizontal size={20} stroke={2} />
            </ThemeIcon>
            <Stack gap={2} style={{ flex: 1 }}>
              <Text fw={700}>Huidige filters</Text>
              <Text size="sm" c="dimmed">
                {summary}
              </Text>
            </Stack>
          </Group>

          <Button type="button" variant="white" color="dark" onClick={() => setOpened(true)}>
            Filteren
          </Button>
        </Group>

        {hasActiveFilters && onClear ? (
          <Button
            type="button"
            variant="subtle"
            color="dark"
            size="xs"
            leftSection={<IconFilterOff size={16} stroke={1.8} />}
            mt="sm"
            px={0}
            onClick={onClear}
          >
            Wis filters
          </Button>
        ) : null}
      </Paper>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        title={title}
        position="bottom"
        size="min(520px, 78dvh)"
        padding="lg"
        styles={{
          content: {
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          },
          header: {
            borderBottom: "1px solid rgba(41, 74, 68, 0.08)",
            marginBottom: 4,
          },
        }}
      >
        <Stack gap="lg">
          <Text size="sm" c="dimmed">
            Pas je selectie rustig aan zonder dat alle opties constant open op de pagina staan.
          </Text>

          {children}

          <Group grow>
            {hasActiveFilters && onClear ? (
              <Button
                type="button"
                variant="default"
                color="dark"
                leftSection={<IconFilterOff size={16} stroke={1.8} />}
                onClick={onClear}
              >
                Wis filters
              </Button>
            ) : null}
            <Button type="button" color="dark" onClick={() => setOpened(false)}>
              Klaar
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </>
  );
}
