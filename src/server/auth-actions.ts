"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  AppActionState,
  createErrorStateFromUnknown,
  createValidationError,
} from "@/server/action-state";
import {
  authenticateUser,
  registerUser,
  createSession,
  deleteCurrentSession,
} from "@/server/auth";
import { withFlashToast } from "@/lib/flash-toast";
import { readEmail, readPassword, readRequiredText } from "@/server/validation";

export async function registerUserAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  try {
    const displayName = readRequiredText(formData, "displayName", "Naam", {
      minLength: 2,
      maxLength: 80,
      code: "VALIDATION_REQUIRED_FIELD",
    });
    const email = readEmail(formData, "email", {
      code: "VALIDATION_INVALID_EMAIL",
    });
    const password = readPassword(formData, "password", {
      minLength: 10,
      code: "VALIDATION_FAILED",
    });
    const passwordConfirmation = readRequiredText(formData, "passwordConfirmation", "Bevestiging", {
      minLength: 10,
      maxLength: 128,
      code: "VALIDATION_FAILED",
    });

    if (password !== passwordConfirmation) {
      throw createValidationError("De wachtwoorden komen niet overeen.", {
        passwordConfirmation: "De wachtwoorden komen niet overeen.",
      });
    }

    const user = await registerUser({
      displayName,
      email,
      password,
    });

    await createSession(user.id, user.themePreference);
    revalidatePath("/", "layout");
  } catch (error) {
    return createErrorStateFromUnknown(error, "Je account kon niet worden aangemaakt.", {
      action: "registerUserAction",
    });
  }

  redirect(withFlashToast("/garage/new", { message: "Je account is klaar voor gebruik.", title: "Welkom" }));
}

export async function loginUserAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  try {
    const email = readEmail(formData, "email", {
      code: "VALIDATION_INVALID_EMAIL",
    });
    const password = readRequiredText(formData, "password", "Wachtwoord", {
      maxLength: 128,
      code: "VALIDATION_REQUIRED_FIELD",
    });

    const user = await authenticateUser(email, password);
    await createSession(user.id, user.themePreference);
    revalidatePath("/", "layout");
  } catch (error) {
    return createErrorStateFromUnknown(error, "Inloggen lukte niet.", {
      action: "loginUserAction",
    });
  }

  redirect(withFlashToast("/", { message: "Je bent ingelogd.", title: "Welkom terug" }));
}

export async function logoutUserAction() {
  await deleteCurrentSession();
  revalidatePath("/", "layout");
  redirect(withFlashToast("/login", { message: "Je bent uitgelogd.", tone: "info", title: "Afgemeld" }));
}
