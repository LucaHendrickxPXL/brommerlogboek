"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { withFlashToast } from "@/lib/flash-toast";
import { AppActionState, createErrorStateFromUnknown } from "@/server/action-state";
import { AppError } from "@/server/app-errors";
import { requireAppUser } from "@/server/auth";
import {
  archiveVehicleForUser,
  createVehicleForUser,
  deleteVehiclePhotoForUser,
  setVehiclePhotoForUser,
  updateVehicleForUser,
} from "@/server/vehicles";
import {
  deleteStoredFileByStorageKey,
  prepareImageUpload,
  storePreparedImageUpload,
} from "@/server/uploads";
import {
  readOptionalDate,
  readOptionalDecimal,
  readOptionalInteger,
  readOptionalText,
  readRequiredText,
} from "@/server/validation";

function revalidateVehicleSurfaces(vehicleId?: string) {
  revalidatePath("/");
  revalidatePath("/garage");
  revalidatePath("/trips");
  revalidatePath("/costs");
  revalidatePath("/maintenance");
  revalidatePath("/overview");
  revalidatePath("/new");
  revalidatePath("/trips/new");
  revalidatePath("/costs/new");
  revalidatePath("/costs/new/fuel");
  revalidatePath("/maintenance/rules/new");
  revalidatePath("/maintenance/events/new");

  if (vehicleId) {
    revalidatePath(`/garage/${vehicleId}`);
    revalidatePath(`/garage/${vehicleId}/edit`);
  }
}

function readVehicleInput(formData: FormData) {
  const currentYear = new Date().getFullYear() + 1;

  return {
    name: readRequiredText(formData, "name", "Naam", {
      minLength: 2,
      maxLength: 80,
      code: "VEHICLE_NAME_REQUIRED",
    }),
    brand: readOptionalText(formData, "brand", "Merk", {
      maxLength: 80,
    }),
    model: readOptionalText(formData, "model", "Model", {
      maxLength: 80,
    }),
    year: readOptionalInteger(formData, "year", "Bouwjaar", {
      min: 1900,
      max: currentYear,
      code: "VEHICLE_YEAR_INVALID",
    }),
    licensePlate: readOptionalText(formData, "licensePlate", "Nummerplaat", {
      maxLength: 40,
    }),
    engineCc: readOptionalInteger(formData, "engineCc", "Cilinderinhoud", {
      min: 1,
      max: 3000,
      code: "VEHICLE_ENGINE_CC_INVALID",
    }),
    purchaseDate: readOptionalDate(formData, "purchaseDate", "Aankoopdatum"),
    purchasePriceEur: readOptionalDecimal(formData, "purchasePriceEur", "Aankoopprijs", {
      min: 0,
      max: 100000,
      code: "VEHICLE_PURCHASE_PRICE_INVALID",
    }),
    purchaseOdometerKm: readOptionalInteger(formData, "purchaseOdometerKm", "Kilometerstand bij aankoop", {
      min: 0,
      max: 999999,
      code: "VEHICLE_PURCHASE_ODOMETER_INVALID",
    }),
    insuranceProvider: readOptionalText(formData, "insuranceProvider", "Verzekeraar", {
      maxLength: 120,
    }),
    insuranceCostMonthlyEur: readOptionalDecimal(
      formData,
      "insuranceCostMonthlyEur",
      "Maandelijkse verzekering",
      {
        min: 0,
        max: 5000,
        code: "VALIDATION_FAILED",
      },
    ),
    notes: readOptionalText(formData, "notes", "Notities", {
      maxLength: 1500,
    }),
  };
}

export async function createVehicleAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let vehicleId = "";
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    vehicleId = await createVehicleForUser(user.id, readVehicleInput(formData));

    revalidateVehicleSurfaces(vehicleId);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De brommer kon niet worden opgeslagen.", {
      action: "createVehicleAction",
      userId,
      entityId: vehicleId,
    });
  }

  redirect(withFlashToast(`/garage/${vehicleId}`, { message: "De brommer is toegevoegd." }));
}

export async function updateVehicleAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let vehicleId = "";
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    vehicleId = readRequiredText(formData, "vehicleId", "Brommer");
    await updateVehicleForUser(user.id, vehicleId, readVehicleInput(formData));

    revalidateVehicleSurfaces(vehicleId);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De brommer kon niet worden bijgewerkt.", {
      action: "updateVehicleAction",
      userId,
      entityId: vehicleId,
    });
  }

  redirect(withFlashToast(`/garage/${vehicleId}`, { message: "De brommer is bijgewerkt." }));
}

export async function archiveVehicleAction(formData: FormData) {
  const user = await requireAppUser();
  const vehicleId = readRequiredText(formData, "vehicleId", "Brommer");

  await archiveVehicleForUser(user.id, vehicleId);

  revalidateVehicleSurfaces(vehicleId);
  redirect(withFlashToast("/garage", { message: "De brommer is gearchiveerd.", tone: "info" }));
}

export async function setVehiclePhotoAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let userId = "";
  let vehicleId = "";
  let storedPhoto:
    | Awaited<ReturnType<typeof storePreparedImageUpload>>
    | null = null;

  try {
    const user = await requireAppUser();
    userId = user.id;
    vehicleId = readRequiredText(formData, "vehicleId", "Brommer");
    const preparedPhoto = await prepareImageUpload(formData.get("photo") as File | null);

    if (!preparedPhoto) {
      throw new AppError({
        code: "UPLOAD_MISSING_FILE",
        message: "Kies eerst een foto.",
        fieldErrors: {
          photo: "Kies eerst een foto.",
        },
      });
    }

    storedPhoto = await storePreparedImageUpload("vehicles", vehicleId, preparedPhoto);

    let replacedStorageKey: string | null = null;

    try {
      replacedStorageKey = await setVehiclePhotoForUser(user.id, vehicleId, storedPhoto);
    } catch (error) {
      await deleteStoredFileByStorageKey(storedPhoto.storageKey);
      throw error;
    }

    await deleteStoredFileByStorageKey(replacedStorageKey);

    revalidateVehicleSurfaces(vehicleId);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De brommerfoto kon niet worden opgeslagen.", {
      action: "setVehiclePhotoAction",
      userId,
      entityId: vehicleId,
    });
  }

  redirect(
    withFlashToast(`/garage/${vehicleId}`, {
      message: "De brommerfoto is opgeslagen.",
    }),
  );
}

export async function deleteVehiclePhotoAction(formData: FormData) {
  const user = await requireAppUser();
  const vehicleId = readRequiredText(formData, "vehicleId", "Brommer");
  const removedStorageKey = await deleteVehiclePhotoForUser(user.id, vehicleId);

  await deleteStoredFileByStorageKey(removedStorageKey);

  revalidateVehicleSurfaces(vehicleId);
  redirect(withFlashToast(`/garage/${vehicleId}`, { message: "De brommerfoto is verwijderd.", tone: "info" }));
}
