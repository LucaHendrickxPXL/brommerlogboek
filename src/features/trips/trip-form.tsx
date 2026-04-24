"use client";

import { Button, NativeSelect, SimpleGrid, Stack, TextInput, Textarea } from "@mantine/core";
import dayjs from "dayjs";
import { useActionState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { AppActionState, initialActionState } from "@/server/action-state";
import { VehicleOption } from "@/server/vehicles";

export interface TripFormValues {
  tripId?: string;
  vehicleId?: string;
  title?: string | null;
  tripDate?: string | null;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  startLocationName?: string | null;
  endLocationName?: string | null;
  notes?: string | null;
}

interface TripFormProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  vehicles: VehicleOption[];
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: TripFormValues;
  showPhotoUpload?: boolean;
}

export function TripForm({
  action,
  vehicles,
  mode,
  title,
  description,
  submitLabel,
  initialValues,
  showPhotoUpload = false,
}: TripFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const safeState = state ?? initialActionState;

  return (
    <Stack gap="xl">
      <Stack gap={6}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "2rem" }}>{title}</h1>
        <p style={{ margin: 0, color: "var(--mantine-color-dimmed)" }}>{description}</p>
      </Stack>

      <form action={formAction}>
        <Stack gap="lg">
          {mode === "edit" && initialValues?.tripId ? (
            <input type="hidden" name="tripId" value={initialValues.tripId} />
          ) : null}

          <FormFeedback message={safeState.message} />

          <div>
            <NativeSelect
              name="vehicleId"
              label="Brommer"
              data={vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: vehicle.name,
              }))}
              defaultValue={initialValues?.vehicleId ?? vehicles[0]?.id ?? ""}
              required
            />
            <FieldErrorText message={safeState.fieldErrors?.vehicleId} />
          </div>

          <div>
            <TextInput
              name="title"
              label="Titel"
              description="Optioneel. Laat leeg voor een automatische standaardtitel."
              defaultValue={initialValues?.title ?? ""}
              placeholder="Bijvoorbeeld avondrit of woon-werk"
            />
            <FieldErrorText message={safeState.fieldErrors?.title} />
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <div>
              <TextInput
                name="tripDate"
                label="Datum"
                type="date"
                defaultValue={initialValues?.tripDate ?? dayjs().format("YYYY-MM-DD")}
                required
              />
              <FieldErrorText message={safeState.fieldErrors?.tripDate} />
            </div>
            <div>
              <TextInput
                name="distanceKm"
                label="Afstand (km)"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0.1"
                defaultValue={initialValues?.distanceKm?.toString() ?? ""}
                required
              />
              <FieldErrorText message={safeState.fieldErrors?.distanceKm} />
            </div>
            <div>
              <TextInput
                name="durationMinutes"
                label="Duur (min)"
                type="number"
                inputMode="numeric"
                min="0"
                defaultValue={initialValues?.durationMinutes?.toString() ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.durationMinutes} />
            </div>
            <div>
              <TextInput
                name="startLocationName"
                label="Vertrek"
                defaultValue={initialValues?.startLocationName ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.startLocationName} />
            </div>
            <div>
              <TextInput
                name="endLocationName"
                label="Aankomst"
                defaultValue={initialValues?.endLocationName ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.endLocationName} />
            </div>
          </SimpleGrid>

          <div>
            <Textarea
              name="notes"
              label="Notities"
              minRows={4}
              autosize
              defaultValue={initialValues?.notes ?? ""}
            />
            <FieldErrorText message={safeState.fieldErrors?.notes} />
          </div>

          {showPhotoUpload ? (
            <div>
              <label>
                <span style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Ritfoto</span>
                <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" />
              </label>
              <FieldErrorText message={safeState.fieldErrors?.photo} />
            </div>
          ) : null}

          <Stack gap="sm">
            <Button type="submit" color="dark" loading={isPending}>
              {submitLabel}
            </Button>
            <LinkButton
              href={mode === "edit" && initialValues?.tripId ? `/trips/${initialValues.tripId}` : "/trips"}
              variant="subtle"
              color="dark"
            >
              Annuleren
            </LinkButton>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
}
