"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { withFlashToast } from "@/lib/flash-toast";
import {
  fuelTypes,
  generalCostCategories,
  paymentMethods,
} from "@/lib/costs";
import { AppActionState, createErrorStateFromUnknown } from "@/server/action-state";
import { requireAppUser } from "@/server/auth";
import {
  createFuelEntryForUser,
  createGeneralCostForUser,
  deleteCostForUser,
  getCostDetailForUser,
  updateFuelEntryForUser,
  updateGeneralCostForUser,
} from "@/server/costs";
import {
  readCheckbox,
  readOptionalEnum,
  readOptionalInteger,
  readOptionalText,
  readRequiredDate,
  readRequiredDecimal,
  readRequiredEnum,
  readRequiredText,
} from "@/server/validation";

function readFuelEntryInput(formData: FormData) {
  return {
    vehicleId: readRequiredText(formData, "vehicleId", "Brommer", {
      code: "COST_VEHICLE_MISMATCH",
    }),
    fuelType: readRequiredEnum(formData, "fuelType", "Brandstoftype", fuelTypes, {
      code: "FUEL_TYPE_INVALID",
    }),
    amountEur: readRequiredDecimal(formData, "amountEur", "Bedrag", {
      min: 0.01,
      code: "COST_AMOUNT_INVALID",
    }),
    entryDate: readRequiredDate(formData, "entryDate", "Datum", {
      code: "VALIDATION_INVALID_DATE",
    }),
    fuelStation: readOptionalText(formData, "fuelStation", "Tankstation", {
      maxLength: 120,
    }),
    paymentMethod: readOptionalEnum(formData, "paymentMethod", "Betaalmethode", paymentMethods),
    isFullTank: readCheckbox(formData, "isFullTank"),
    odometerKm: readOptionalInteger(formData, "odometerKm", "Kilometerstand", {
      min: 0,
      max: 999999,
      code: "VALIDATION_NEGATIVE_NUMBER",
    }),
    notes: readOptionalText(formData, "notes", "Notities", {
      maxLength: 1500,
    }),
  };
}

function readGeneralCostInput(formData: FormData) {
  const category = readRequiredEnum(formData, "category", "Categorie", generalCostCategories, {
    code: "COST_TYPE_INVALID",
  });

  return {
    vehicleId: readRequiredText(formData, "vehicleId", "Brommer", {
      code: "COST_VEHICLE_MISMATCH",
    }),
    category,
    title: readRequiredText(formData, "title", "Titel", {
      minLength: 2,
      maxLength: 120,
      code: "VALIDATION_FAILED",
    }),
    amountEur: readRequiredDecimal(formData, "amountEur", "Bedrag", {
      min: 0.01,
      code: "COST_AMOUNT_INVALID",
    }),
    entryDate: readRequiredDate(formData, "entryDate", "Datum", {
      code: "VALIDATION_INVALID_DATE",
    }),
    vendorName: readOptionalText(formData, "vendorName", "Leverancier", {
      maxLength: 120,
    }),
    locationName: readOptionalText(formData, "locationName", "Locatie", {
      maxLength: 120,
    }),
    paymentMethod: readOptionalEnum(formData, "paymentMethod", "Betaalmethode", paymentMethods),
    notes: readOptionalText(formData, "notes", "Notities", {
      maxLength: 1500,
    }),
  };
}

function revalidateCostSurfaces(vehicleIds: string[] = []) {
  revalidatePath("/");
  revalidatePath("/garage");
  revalidatePath("/costs");
  revalidatePath("/new");
  revalidatePath("/overview");

  for (const vehicleId of new Set(vehicleIds.filter(Boolean))) {
    revalidatePath(`/garage/${vehicleId}`);
  }
}

export async function createFuelEntryAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let userId = "";
  try {
    const user = await requireAppUser();
    userId = user.id;
    const input = readFuelEntryInput(formData);

    await createFuelEntryForUser(user.id, input);

    revalidateCostSurfaces([input.vehicleId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De tankbeurt kon niet worden opgeslagen.", {
      action: "createFuelEntryAction",
      userId,
    });
  }

  redirect(withFlashToast("/costs", { message: "De tankbeurt is opgeslagen." }));
}

export async function createGeneralCostAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let userId = "";
  try {
    const user = await requireAppUser();
    userId = user.id;
    const input = readGeneralCostInput(formData);

    await createGeneralCostForUser(user.id, input);

    revalidateCostSurfaces([input.vehicleId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De kost kon niet worden opgeslagen.", {
      action: "createGeneralCostAction",
      userId,
    });
  }

  redirect(withFlashToast("/costs", { message: "De kost is opgeslagen." }));
}

export async function updateFuelEntryAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let entryId = "";
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    entryId = readRequiredText(formData, "entryId", "Kost");
    const existingEntry = await getCostDetailForUser(user.id, entryId);
    const input = readFuelEntryInput(formData);

    const result = await updateFuelEntryForUser(user.id, entryId, input);

    revalidateCostSurfaces([existingEntry.vehicleId, result.vehicleId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De tankbeurt kon niet worden bijgewerkt.", {
      action: "updateFuelEntryAction",
      userId,
      entityId: entryId,
    });
  }

  redirect(withFlashToast("/costs", { message: "De tankbeurt is bijgewerkt." }));
}

export async function updateGeneralCostAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let entryId = "";
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    entryId = readRequiredText(formData, "entryId", "Kost");
    const existingEntry = await getCostDetailForUser(user.id, entryId);
    const input = readGeneralCostInput(formData);

    const result = await updateGeneralCostForUser(user.id, entryId, input);

    revalidateCostSurfaces([existingEntry.vehicleId, result.vehicleId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De kost kon niet worden bijgewerkt.", {
      action: "updateGeneralCostAction",
      userId,
      entityId: entryId,
    });
  }

  redirect(withFlashToast("/costs", { message: "De kost is bijgewerkt." }));
}

export async function deleteCostAction(formData: FormData) {
  const user = await requireAppUser();
  const entryId = readRequiredText(formData, "entryId", "Kost");
  const result = await deleteCostForUser(user.id, entryId);

  revalidateCostSurfaces([result.vehicleId]);
  redirect(
    withFlashToast("/costs", {
      message: result.category === "fuel" ? "De tankbeurt is verwijderd." : "De kost is verwijderd.",
      tone: "info",
    }),
  );
}
