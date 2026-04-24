"use client";

import { Button, Group, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useActionState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { initialActionState } from "@/server/action-state";
import { registerUserAction } from "@/server/auth-actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerUserAction, initialActionState);

  return (
    <form action={formAction}>
      <Stack gap="md">
        <FormFeedback message={state.message} />

        <div>
          <TextInput name="displayName" label="Naam" autoComplete="name" required />
          <FieldErrorText message={state.fieldErrors?.displayName} />
        </div>

        <div>
          <TextInput name="email" label="E-mailadres" type="email" autoComplete="email" required />
          <FieldErrorText message={state.fieldErrors?.email} />
        </div>

        <div>
          <PasswordInput name="password" label="Wachtwoord" autoComplete="new-password" required />
          <FieldErrorText message={state.fieldErrors?.password} />
        </div>

        <div>
          <PasswordInput
            name="passwordConfirmation"
            label="Bevestig wachtwoord"
            autoComplete="new-password"
            required
          />
          <FieldErrorText message={state.fieldErrors?.passwordConfirmation} />
        </div>

        <Button type="submit" color="dark" loading={isPending}>
          Account aanmaken
        </Button>

        <Group gap={6} justify="center">
          <Text size="sm" c="dimmed">
            Heb je al een account?
          </Text>
          <LinkButton href="/login" variant="subtle" color="dark" px={0}>
            Inloggen
          </LinkButton>
        </Group>
      </Stack>
    </form>
  );
}
