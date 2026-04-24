"use client";

import { Button, Image, Stack, Text } from "@mantine/core";
import { useActionState } from "react";

import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { initialActionState } from "@/server/action-state";
import { deleteVehiclePhotoAction, setVehiclePhotoAction } from "@/server/garage-actions";

interface VehiclePhotoFormProps {
  vehicleId: string;
  photoUrl?: string;
}

export function VehiclePhotoForm({ vehicleId, photoUrl }: VehiclePhotoFormProps) {
  const [state, formAction, isPending] = useActionState(setVehiclePhotoAction, initialActionState);
  const safeState = state ?? initialActionState;

  return (
    <Stack gap="md">
      {photoUrl ? (
        <div className="mini-photo">
          <Image src={photoUrl} alt="Brommerfoto" h={220} fit="cover" />
        </div>
      ) : (
        <Text c="dimmed" size="sm">
          Nog geen brommerfoto toegevoegd.
        </Text>
      )}

      <form action={formAction}>
        <Stack gap="sm">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <FormFeedback message={safeState.message} />
          <label>
            <Text size="sm" fw={600} mb={6}>
              Foto uploaden
            </Text>
            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" />
          </label>
          <FieldErrorText message={safeState.fieldErrors?.photo} />
          <Button type="submit" color="dark" loading={isPending}>
            {photoUrl ? "Foto vervangen" : "Foto toevoegen"}
          </Button>
        </Stack>
      </form>

      {photoUrl ? (
        <form action={deleteVehiclePhotoAction}>
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <ConfirmSubmitButton
            confirmMessage="Wil je deze brommerfoto verwijderen?"
            variant="subtle"
            color="rose"
          >
            Foto verwijderen
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </Stack>
  );
}
