import { Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { TablerIcon } from "@tabler/icons-react";

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  color?: "teal" | "amber" | "rose";
  icon: TablerIcon;
}

export function MetricCard({
  label,
  value,
  helper,
  color = "teal",
  icon: Icon,
}: MetricCardProps) {
  return (
    <Paper className="surface-card metric-card" withBorder>
      <Stack gap="md">
        <ThemeIcon size={46} radius="xl" color={color}>
          <Icon size={22} stroke={2} />
        </ThemeIcon>
        <Stack gap={4}>
          <Text size="sm" c="dimmed" fw={600}>
            {label}
          </Text>
          <Text ff="var(--font-heading)" fw={800} fz={28}>
            {value}
          </Text>
          <Text size="sm" c="dimmed">
            {helper}
          </Text>
        </Stack>
      </Stack>
    </Paper>
  );
}
