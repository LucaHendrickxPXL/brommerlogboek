"use client";

import { Button, Image, Stack, Text } from "@mantine/core";
import { useActionState } from "react";

import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { initialActionState } from "@/server/action-state";
import { deleteTripPhotoAction, setTripPhotoAction } from "@/server/trip-actions";

interface TripPhotoFormProps {
  tripId: string;
  photoUrl?: string;
}

export function TripPhotoForm({ tripId, photoUrl }: TripPhotoFormProps) {
  const [state, formAction, isPending] = useActionState(setTripPhotoAction, initialActionState);
  const safeState = state ?? initialActionState;

  return (
    <Stack gap="md">
      {photoUrl ? (
        <div className="mini-photo">
          <Image src={photoUrl} alt="Ritfoto" h={220} fit="cover" />
        </div>
      ) : (
        <Text c="dimmed" size="sm">
          Nog geen ritfoto toegevoegd.
        </Text>
      )}

      <form action={formAction}>
        <Stack gap="sm">
          <input type="hidden" name="tripId" value={tripId} />
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
        <form action={deleteTripPhotoAction}>
          <input type="hidden" name="tripId" value={tripId} />
          <ConfirmSubmitButton
            confirmMessage="Wil je deze ritfoto verwijderen?"
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
