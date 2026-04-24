"use client";

import { Button, Group, SimpleGrid, Stack, TextInput, Textarea } from "@mantine/core";
import { useActionState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { AppActionState } from "@/server/action-state";

export interface VehicleFormValues {
  vehicleId?: string;
  name?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  licensePlate?: string | null;
  engineCc?: number | null;
  purchaseDate?: string | null;
  purchasePriceEur?: number | null;
  purchaseOdometerKm?: number | null;
  insuranceProvider?: string | null;
  insuranceCostMonthlyEur?: number | null;
  notes?: string | null;
}

interface VehicleFormProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: VehicleFormValues;
}

export function VehicleForm({
  action,
  mode,
  title,
  description,
  submitLabel,
  initialValues,
}: VehicleFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    status: "idle",
  } satisfies AppActionState);
  const safeState = state ?? { status: "idle" };

  return (
    <Stack gap="xl">
      <Stack gap={6}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "2rem" }}>{title}</h1>
        <p style={{ margin: 0, color: "var(--mantine-color-dimmed)" }}>{description}</p>
      </Stack>

      <form action={formAction}>
        <Stack gap="lg">
          {mode === "edit" && initialValues?.vehicleId ? (
            <input type="hidden" name="vehicleId" value={initialValues.vehicleId} />
          ) : null}

          <FormFeedback message={safeState.message} />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <div>
              <TextInput name="name" label="Naam" required defaultValue={initialValues?.name ?? ""} />
              <FieldErrorText message={safeState.fieldErrors?.name} />
            </div>
            <div>
              <TextInput name="licensePlate" label="Nummerplaat" defaultValue={initialValues?.licensePlate ?? ""} />
              <FieldErrorText message={safeState.fieldErrors?.licensePlate} />
            </div>
            <div>
              <TextInput name="brand" label="Merk" defaultValue={initialValues?.brand ?? ""} />
              <FieldErrorText message={safeState.fieldErrors?.brand} />
            </div>
            <div>
              <TextInput name="model" label="Model" defaultValue={initialValues?.model ?? ""} />
              <FieldErrorText message={safeState.fieldErrors?.model} />
            </div>
            <div>
              <TextInput
                name="year"
                label="Bouwjaar"
                type="number"
                inputMode="numeric"
                defaultValue={initialValues?.year?.toString() ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.year} />
            </div>
            <div>
              <TextInput
                name="engineCc"
                label="Cilinderinhoud (cc)"
                type="number"
                inputMode="numeric"
                defaultValue={initialValues?.engineCc?.toString() ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.engineCc} />
            </div>
            <div>
              <TextInput
                name="purchaseDate"
                label="Aankoopdatum"
                type="date"
                defaultValue={initialValues?.purchaseDate ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.purchaseDate} />
            </div>
            <div>
              <TextInput
                name="purchasePriceEur"
                label="Aankoopprijs"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                defaultValue={initialValues?.purchasePriceEur?.toString() ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.purchasePriceEur} />
            </div>
            <div>
              <TextInput
                name="purchaseOdometerKm"
                label="Kilometerstand bij aankoop"
                type="number"
                inputMode="numeric"
                min="0"
                defaultValue={initialValues?.purchaseOdometerKm?.toString() ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.purchaseOdometerKm} />
            </div>
            <div>
              <TextInput
                name="insuranceProvider"
                label="Verzekeraar"
                defaultValue={initialValues?.insuranceProvider ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.insuranceProvider} />
            </div>
            <div>
              <TextInput
                name="insuranceCostMonthlyEur"
                label="Maandelijkse verzekering"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                defaultValue={initialValues?.insuranceCostMonthlyEur?.toString() ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.insuranceCostMonthlyEur} />
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

          <Group justify="space-between">
            <LinkButton
              href={mode === "edit" && initialValues?.vehicleId ? `/garage/${initialValues.vehicleId}` : "/garage"}
              variant="subtle"
              color="dark"
            >
              Annuleren
            </LinkButton>
            <Button type="submit" color="dark" loading={isPending}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
