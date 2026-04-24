import { Button, Paper, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import {
  IconArrowRight,
  IconGasStation,
  IconReceiptEuro,
  IconRouteAltLeft,
  IconTool,
} from "@tabler/icons-react";

import { LinkButton } from "@/components/ui/app-link";

const entryOptions = [
  {
    title: "Tankbeurt",
    description: "Brandstofkost registreren voor een brommer.",
    href: "/costs/new/fuel",
    targetLabel: "Tankbeurt toevoegen",
    icon: IconGasStation,
    color: "amber",
  },
  {
    title: "Rit",
    description: "Nieuwe rit toevoegen aan je tripoverzicht.",
    href: "/trips/new",
    targetLabel: "Rit toevoegen",
    icon: IconRouteAltLeft,
    color: "teal",
  },
  {
    title: "Kost",
    description: "Een losse kost bewaren, zoals verzekering of uitrusting.",
    href: "/costs/new",
    targetLabel: "Kost toevoegen",
    icon: IconReceiptEuro,
    color: "rose",
  },
  {
    title: "Onderhoud",
    description: "Onderhoud registreren of een plan bijwerken.",
    href: "/maintenance/events/new",
    targetLabel: "Onderhoud registreren",
    icon: IconTool,
    color: "teal",
  },
] as const;

export function NewEntryScreen() {
  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {entryOptions.map((option) => (
          <Paper key={option.title} className="surface-card" withBorder>
            <Stack gap="lg">
              <ThemeIcon size={52} radius="xl" color={option.color}>
                <option.icon size={24} stroke={2} />
              </ThemeIcon>

              <Stack gap={4}>
                <Text ff="var(--font-heading)" fw={700} fz="xl">
                  {option.title}
                </Text>
                <Text c="dimmed" size="sm">
                  {option.description}
                </Text>
              </Stack>

              <LinkButton
                href={option.href}
                color="dark"
                variant="white"
                rightSection={<IconArrowRight size={16} stroke={1.8} />}
              >
                {option.targetLabel}
              </LinkButton>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
