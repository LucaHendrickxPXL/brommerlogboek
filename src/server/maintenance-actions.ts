"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { withFlashToast } from "@/lib/flash-toast";
import { paymentMethods } from "@/lib/costs";
import { AppError } from "@/server/app-errors";
import { AppActionState, createErrorStateFromUnknown } from "@/server/action-state";
import { requireAppUser } from "@/server/auth";
import {
  createMaintenanceEventForUser,
  createMaintenanceRuleForUser,
  deleteMaintenanceEventForUser,
  getMaintenanceEventDetailForUser,
  getMaintenanceRuleDetailForUser,
  setMaintenanceRuleActiveForUser,
  updateMaintenanceEventForUser,
  updateMaintenanceRuleForUser,
} from "@/server/maintenance";
import {
  readOptionalDate,
  readOptionalDecimal,
  readOptionalEnum,
  readOptionalText,
  readRequiredDate,
  readRequiredInteger,
  readRequiredText,
} from "@/server/validation";

function readMaintenanceRuleInput(formData: FormData) {
  return {
    vehicleId: readRequiredText(formData, "vehicleId", "Brommer", {
      code: "VEHICLE_NOT_FOUND",
    }),
    title: readRequiredText(formData, "title", "Titel", {
      minLength: 2,
      maxLength: 120,
      code: "VALIDATION_FAILED",
    }),
    intervalMonths: readRequiredInteger(formData, "intervalMonths", "Interval", {
      min: 1,
      max: 120,
      code: "MAINTENANCE_INTERVAL_INVALID",
    }),
    lastCompletedAt: readOptionalDate(formData, "lastCompletedAt", "Laatst uitgevoerd"),
    nextDueDate: readOptionalDate(formData, "nextDueDate", "Volgende datum"),
    description: readOptionalText(formData, "description", "Notities", {
      maxLength: 1500,
    }),
  };
}

function readMaintenanceEventInput(formData: FormData) {
  return {
    title: readRequiredText(formData, "title", "Titel", {
      minLength: 2,
      maxLength: 120,
      code: "VALIDATION_FAILED",
    }),
    performedAt: readRequiredDate(formData, "performedAt", "Uitvoerdatum", {
      code: "VALIDATION_INVALID_DATE",
    }),
    workshopName: readOptionalText(formData, "workshopName", "Werkplaats", {
      maxLength: 120,
    }),
    notes: readOptionalText(formData, "notes", "Notities", {
      maxLength: 1500,
    }),
    costAmountEur: readOptionalDecimal(formData, "costAmountEur", "Kostbedrag", {
      min: 0.01,
      max: 100000,
      code: "MAINTENANCE_COST_INVALID",
    }),
    costVendorName: readOptionalText(formData, "costVendorName", "Leverancier", {
      maxLength: 120,
    }),
    costPaymentMethod: readOptionalEnum(formData, "costPaymentMethod", "Betaalmethode", paymentMethods),
  };
}

function readRequiredBooleanFlag(formData: FormData, fieldName: string, label: string) {
  const rawValue = formData.get(fieldName);

  if (rawValue !== "true" && rawValue !== "false") {
    throw new AppError({
      code: "VALIDATION_FAILED",
      message: `${label} is ongeldig.`,
      fieldErrors: {
        [fieldName]: `${label} is ongeldig.`,
      },
    });
  }

  return rawValue === "true";
}

function revalidateMaintenanceSurfaces(vehicleIds: string[] = [], ruleIds: string[] = []) {
  revalidatePath("/");
  revalidatePath("/garage");
  revalidatePath("/maintenance");
  revalidatePath("/costs");
  revalidatePath("/overview");
  revalidatePath("/new");

  for (const vehicleId of new Set(vehicleIds.filter(Boolean))) {
    revalidatePath(`/garage/${vehicleId}`);
  }

  for (const ruleId of new Set(ruleIds.filter(Boolean))) {
    revalidatePath(`/maintenance/rules/${ruleId}/edit`);
  }
}

export async function createMaintenanceRuleAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let vehicleId = "";
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    const input = readMaintenanceRuleInput(formData);
    vehicleId = input.vehicleId;
    const ruleId = await createMaintenanceRuleForUser(user.id, input);

    revalidateMaintenanceSurfaces([vehicleId], [ruleId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "Het onderhoudsplan kon niet worden opgeslagen.", {
      action: "createMaintenanceRuleAction",
      userId,
    });
  }

  redirect(withFlashToast("/maintenance", { message: "Het onderhoudsplan is opgeslagen." }));
}

export async function updateMaintenanceRuleAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let ruleId = "";
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    ruleId = readRequiredText(formData, "ruleId", "Onderhoudsplan");
    const existingRule = await getMaintenanceRuleDetailForUser(user.id, ruleId);
    const input = readMaintenanceRuleInput(formData);

    await updateMaintenanceRuleForUser(user.id, ruleId, input);

    revalidateMaintenanceSurfaces([existingRule.vehicleId, input.vehicleId], [ruleId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "Het onderhoudsplan kon niet worden bijgewerkt.", {
      action: "updateMaintenanceRuleAction",
      userId,
      entityId: ruleId,
    });
  }

  redirect(withFlashToast("/maintenance", { message: "Het onderhoudsplan is bijgewerkt." }));
}

export async function toggleMaintenanceRuleAction(formData: FormData) {
  const user = await requireAppUser();
  const ruleId = readRequiredText(formData, "ruleId", "Onderhoudsplan");
  const nextActive = readRequiredBooleanFlag(formData, "nextActive", "Status");
  const result = await setMaintenanceRuleActiveForUser(user.id, ruleId, nextActive);

  revalidateMaintenanceSurfaces([result.vehicleId], [ruleId]);
  redirect(
    withFlashToast("/maintenance", {
      message: nextActive ? "Het onderhoudsplan is opnieuw actief." : "Het onderhoudsplan is gepauzeerd.",
      tone: "info",
    }),
  );
}

export async function createMaintenanceEventAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let vehicleId = "";
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    vehicleId = readRequiredText(formData, "vehicleId", "Brommer");
    const input = readMaintenanceEventInput(formData);

    await createMaintenanceEventForUser(user.id, {
      vehicleId,
      maintenanceRuleId: readOptionalText(formData, "maintenanceRuleId", "Onderhoudsplan"),
      ...input,
    });

    revalidateMaintenanceSurfaces([vehicleId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De onderhoudsbeurt kon niet worden opgeslagen.", {
      action: "createMaintenanceEventAction",
      userId,
    });
  }

  redirect(withFlashToast("/maintenance", { message: "De onderhoudsbeurt is opgeslagen." }));
}

export async function updateMaintenanceEventAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let eventId = "";
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    eventId = readRequiredText(formData, "eventId", "Onderhoudsbeurt");
    const existingEvent = await getMaintenanceEventDetailForUser(user.id, eventId);
    const input = readMaintenanceEventInput(formData);

    const result = await updateMaintenanceEventForUser(user.id, eventId, input);

    revalidateMaintenanceSurfaces([existingEvent.vehicleId, result.vehicleId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De onderhoudsbeurt kon niet worden bijgewerkt.", {
      action: "updateMaintenanceEventAction",
      userId,
      entityId: eventId,
    });
  }

  redirect(withFlashToast("/maintenance", { message: "De onderhoudsbeurt is bijgewerkt." }));
}

export async function deleteMaintenanceEventAction(formData: FormData) {
  const user = await requireAppUser();
  const eventId = readRequiredText(formData, "eventId", "Onderhoudsbeurt");
  const result = await deleteMaintenanceEventForUser(user.id, eventId);

  revalidateMaintenanceSurfaces([result.vehicleId]);
  redirect(withFlashToast("/maintenance", { message: "De onderhoudsbeurt is verwijderd.", tone: "info" }));
}
