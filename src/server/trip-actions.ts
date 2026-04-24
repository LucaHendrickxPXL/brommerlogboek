"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { withFlashToast } from "@/lib/flash-toast";
import {
  AppActionState,
  createErrorStateFromUnknown,
} from "@/server/action-state";
import { AppError } from "@/server/app-errors";
import { requireAppUser } from "@/server/auth";
import {
  createTripForUser,
  deleteTripForUser,
  deleteTripPhotoForUser,
  getTripDetailForUser,
  setTripPhotoForUser,
  updateTripForUser,
} from "@/server/trips";
import {
  deleteStoredFileByStorageKey,
  prepareImageUpload,
  storePreparedImageUpload,
} from "@/server/uploads";
import {
  readOptionalInteger,
  readOptionalText,
  readRequiredDecimal,
  readRequiredDate,
  readRequiredText,
} from "@/server/validation";

function readTripInput(formData: FormData) {
  return {
    vehicleId: readRequiredText(formData, "vehicleId", "Brommer", {
      code: "TRIP_VEHICLE_REQUIRED",
    }),
    title: readOptionalText(formData, "title", "Titel", {
      maxLength: 100,
      code: "VALIDATION_FAILED",
    }),
    tripDate: readRequiredDate(formData, "tripDate", "Datum", {
      code: "VALIDATION_INVALID_DATE",
    }),
    distanceKm: readRequiredDecimal(formData, "distanceKm", "Afstand", {
      min: 0.1,
      code: "TRIP_DISTANCE_INVALID",
    }),
    durationMinutes: readOptionalInteger(formData, "durationMinutes", "Duur", {
      min: 0,
      max: 10000,
      code: "TRIP_DURATION_INVALID",
    }),
    startLocationName: readOptionalText(formData, "startLocationName", "Vertrek", {
      maxLength: 120,
    }),
    endLocationName: readOptionalText(formData, "endLocationName", "Aankomst", {
      maxLength: 120,
    }),
    notes: readOptionalText(formData, "notes", "Notities", {
      maxLength: 1500,
    }),
  };
}

function revalidateTripSurfaces(vehicleIds: string[] = [], tripIds: string[] = []) {
  revalidatePath("/");
  revalidatePath("/garage");
  revalidatePath("/trips");
  revalidatePath("/new");
  revalidatePath("/overview");

  for (const vehicleId of new Set(vehicleIds.filter(Boolean))) {
    revalidatePath(`/garage/${vehicleId}`);
  }

  for (const tripId of new Set(tripIds.filter(Boolean))) {
    revalidatePath(`/trips/${tripId}`);
    revalidatePath(`/trips/${tripId}/edit`);
  }
}

export async function createTripAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let tripId: string | null = null;
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    const input = readTripInput(formData);

    tripId = await createTripForUser(user.id, input);

    const preparedPhoto = await prepareImageUpload(formData.get("photo") as File | null);

    if (preparedPhoto) {
      const storedPhoto = await storePreparedImageUpload("trips", tripId, preparedPhoto);

      try {
        await setTripPhotoForUser(user.id, tripId, storedPhoto);
      } catch (error) {
        await deleteStoredFileByStorageKey(storedPhoto.storageKey);
        throw error;
      }
    }

    revalidateTripSurfaces([input.vehicleId], [tripId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De rit kon niet worden opgeslagen.", {
      action: "createTripAction",
      userId,
      entityId: tripId,
    });
  }

  redirect(withFlashToast(`/trips/${tripId}`, { message: "De rit is opgeslagen." }));
}

export async function updateTripAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  let tripId: string | null = null;
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
    tripId = readRequiredText(formData, "tripId", "Rit");
    const existingTrip = await getTripDetailForUser(user.id, tripId);
    const input = readTripInput(formData);

    await updateTripForUser(user.id, tripId, input);

    revalidateTripSurfaces([existingTrip.vehicleId, input.vehicleId], [tripId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De rit kon niet worden bijgewerkt.", {
      action: "updateTripAction",
      userId,
      entityId: tripId,
    });
  }

  redirect(withFlashToast(`/trips/${tripId}`, { message: "De rit is bijgewerkt." }));
}

export async function deleteTripAction(formData: FormData) {
  const user = await requireAppUser();
  const tripId = readRequiredText(formData, "tripId", "Rit");
  const result = await deleteTripForUser(user.id, tripId);

  await deleteStoredFileByStorageKey(result.photoStorageKey);

  revalidateTripSurfaces([result.vehicleId], [tripId]);
  redirect(withFlashToast("/trips", { message: "De rit is verwijderd.", tone: "info" }));
}

export async function setTripPhotoAction(
  _previousState: AppActionState | void,
  formData: FormData,
) {
  const tripId = readRequiredText(formData, "tripId", "Rit");
  let userId = "";

  try {
    const user = await requireAppUser();
    userId = user.id;
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

    const storedPhoto = await storePreparedImageUpload("trips", tripId, preparedPhoto);
    let replacedStorageKey: string | null = null;

    try {
      replacedStorageKey = await setTripPhotoForUser(user.id, tripId, storedPhoto);
    } catch (error) {
      await deleteStoredFileByStorageKey(storedPhoto.storageKey);
      throw error;
    }

    await deleteStoredFileByStorageKey(replacedStorageKey);

    revalidateTripSurfaces([], [tripId]);
  } catch (error) {
    return createErrorStateFromUnknown(error, "De ritfoto kon niet worden opgeslagen.", {
      action: "setTripPhotoAction",
      userId,
      entityId: tripId,
    });
  }

  redirect(withFlashToast(`/trips/${tripId}`, { message: "De ritfoto is opgeslagen." }));
}

export async function deleteTripPhotoAction(formData: FormData) {
  const user = await requireAppUser();
  const tripId = readRequiredText(formData, "tripId", "Rit");
  const removedStorageKey = await deleteTripPhotoForUser(user.id, tripId);

  await deleteStoredFileByStorageKey(removedStorageKey);

  revalidateTripSurfaces([], [tripId]);
  redirect(withFlashToast(`/trips/${tripId}`, { message: "De ritfoto is verwijderd.", tone: "info" }));
}
