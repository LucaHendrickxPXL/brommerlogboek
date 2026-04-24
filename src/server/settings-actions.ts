"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { withFlashToast } from "@/lib/flash-toast";
import { themePreferences } from "@/lib/theme-preference";
import { createErrorStateFromUnknown, type AppActionState } from "@/server/action-state";
import {
  requireAppUser,
  setThemePreferenceCookie,
  updateUserThemePreference,
} from "@/server/auth";
import { readRequiredEnum } from "@/server/validation";

export async function updateThemePreferenceAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  try {
    const user = await requireAppUser();
    const themePreference = readRequiredEnum(formData, "themePreference", "Thema", themePreferences, {
      code: "VALIDATION_ENUM_VALUE_INVALID",
    });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await updateUserThemePreference(user.id, themePreference);
    await setThemePreferenceCookie(themePreference, expiresAt);

    revalidatePath("/", "layout");
    revalidatePath("/settings");
  } catch (error) {
    return createErrorStateFromUnknown(error, "Je themavoorkeur kon niet worden opgeslagen.", {
      action: "updateThemePreferenceAction",
    });
  }

  redirect(withFlashToast("/settings", { message: "Je weergavevoorkeur is bijgewerkt." }));
}
