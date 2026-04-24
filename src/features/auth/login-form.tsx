"use client";

import { Button, Group, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useActionState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { initialActionState } from "@/server/action-state";
import { loginUserAction } from "@/server/auth-actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginUserAction, initialActionState);

  return (
    <form action={formAction}>
      <Stack gap="md">
        <FormFeedback message={state.message} />

        <div>
          <TextInput name="email" label="E-mailadres" type="email" autoComplete="email" required />
          <FieldErrorText message={state.fieldErrors?.email} />
        </div>

        <div>
          <PasswordInput name="password" label="Wachtwoord" autoComplete="current-password" required />
          <FieldErrorText message={state.fieldErrors?.password} />
        </div>

        <Button type="submit" color="dark" loading={isPending}>
          Inloggen
        </Button>

        <Group gap={6} justify="center">
          <Text size="sm" c="dimmed">
            Nog geen account?
          </Text>
          <LinkButton href="/register" variant="subtle" color="dark" px={0}>
            Account aanmaken
          </LinkButton>
        </Group>
      </Stack>
    </form>
  );
}
