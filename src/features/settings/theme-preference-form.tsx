"use client";

import {
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { IconDeviceDesktop, IconMoonStars, IconSunHigh } from "@tabler/icons-react";
import { useActionState, useState } from "react";

import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { ThemePreference } from "@/lib/theme-preference";
import { initialActionState } from "@/server/action-state";
import { updateThemePreferenceAction } from "@/server/settings-actions";

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: typeof IconDeviceDesktop;
}> = [
  {
    value: "auto",
    label: "Systeem",
    description: "Volgt automatisch je toestel of browser.",
    icon: IconDeviceDesktop,
  },
  {
    value: "light",
    label: "Licht",
    description: "Helder en rustig voor overdag.",
    icon: IconSunHigh,
  },
  {
    value: "dark",
    label: "Donker",
    description: "Rustiger in de avond en op OLED-schermen.",
    icon: IconMoonStars,
  },
];

export function ThemePreferenceForm({ initialValue }: { initialValue: ThemePreference }) {
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const [state, formAction, isPending] = useActionState(updateThemePreferenceAction, initialActionState);

  return (
    <form action={formAction}>
      <Stack gap="md">
        <input type="hidden" name="themePreference" value={selectedValue} />

        <FormFeedback message={state.message} />

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {themeOptions.map((option) => {
            const isActive = selectedValue === option.value;

            return (
              <UnstyledButton
                key={option.value}
                type="button"
                className="theme-option-button"
                data-active={isActive || undefined}
                onClick={() => setSelectedValue(option.value)}
              >
                <Paper className="surface-card theme-option-card" withBorder>
                  <Group align="flex-start" wrap="nowrap">
                    <ThemeIcon size={46} radius="xl" color={isActive ? "teal" : "gray"} variant="light">
                      <option.icon size={24} stroke={2} />
                    </ThemeIcon>
                    <Stack gap={2} flex={1}>
                      <Text fw={700}>{option.label}</Text>
                      <Text size="sm" c="dimmed">
                        {option.description}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>

        <FieldErrorText message={state.fieldErrors?.themePreference} />

        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Huidige keuze: {themeOptions.find((option) => option.value === selectedValue)?.label ?? "Systeem"}
          </Text>
          <Button type="submit" color="dark" loading={isPending}>
            Thema opslaan
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
