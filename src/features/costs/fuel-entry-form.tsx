"use client";

import { Button, NativeSelect, SimpleGrid, Stack, Switch, TextInput, Textarea } from "@mantine/core";
import dayjs from "dayjs";
import { useActionState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { fuelTypeLabels, fuelTypes, paymentMethodLabels, paymentMethods } from "@/lib/costs";
import { AppActionState, initialActionState } from "@/server/action-state";
import { VehicleOption } from "@/server/vehicles";
import { CostFormShell } from "@/features/costs/cost-form-shell";

export interface FuelEntryFormValues {
  entryId?: string;
  vehicleId?: string;
  entryDate?: string | null;
  fuelType?: string | null;
  amountEur?: number | null;
  fuelStation?: string | null;
  paymentMethod?: string | null;
  odometerKm?: number | null;
  isFullTank?: boolean | null;
  notes?: string | null;
}

interface FuelEntryFormProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  vehicles: VehicleOption[];
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: FuelEntryFormValues;
}

export function FuelEntryForm({
  action,
  vehicles,
  mode,
  title,
  description,
  submitLabel,
  initialValues,
}: FuelEntryFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const safeState = state ?? initialActionState;

  return (
    <CostFormShell
      title={title}
      description={description}
    >
      <form action={formAction}>
        <Stack gap="lg">
          {mode === "edit" && initialValues?.entryId ? (
            <input type="hidden" name="entryId" value={initialValues.entryId} />
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

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <div>
              <TextInput
                name="entryDate"
                label="Datum"
                type="date"
                defaultValue={initialValues?.entryDate ?? dayjs().format("YYYY-MM-DD")}
                required
              />
              <FieldErrorText message={safeState.fieldErrors?.entryDate} />
            </div>
            <div>
              <NativeSelect
                name="fuelType"
                label="Brandstoftype"
                data={fuelTypes.map((fuelType) => ({
                  value: fuelType,
                  label: fuelTypeLabels[fuelType],
                }))}
                defaultValue={initialValues?.fuelType ?? "95"}
                required
              />
              <FieldErrorText message={safeState.fieldErrors?.fuelType} />
            </div>
            <div>
              <TextInput
                name="amountEur"
                label="Bedrag"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                defaultValue={initialValues?.amountEur?.toString() ?? ""}
                required
              />
              <FieldErrorText message={safeState.fieldErrors?.amountEur} />
            </div>
            <div>
              <TextInput name="fuelStation" label="Tankstation" defaultValue={initialValues?.fuelStation ?? ""} />
              <FieldErrorText message={safeState.fieldErrors?.fuelStation} />
            </div>
            <div>
              <NativeSelect
                name="paymentMethod"
                label="Betaalmethode"
                data={[
                  { value: "", label: "Niet ingevuld" },
                  ...paymentMethods.map((paymentMethod) => ({
                    value: paymentMethod,
                    label: paymentMethodLabels[paymentMethod],
                  })),
                ]}
                defaultValue={initialValues?.paymentMethod ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.paymentMethod} />
            </div>
            <div>
              <TextInput
                name="odometerKm"
                label="Kilometerstand"
                type="number"
                inputMode="numeric"
                min="0"
                defaultValue={initialValues?.odometerKm?.toString() ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.odometerKm} />
            </div>
          </SimpleGrid>

          <Switch name="isFullTank" label="Full tank" defaultChecked={Boolean(initialValues?.isFullTank)} />

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

          <Stack gap="sm">
            <Button type="submit" color="dark" loading={isPending}>
              {submitLabel}
            </Button>
            <LinkButton href="/costs" variant="subtle" color="dark">
              Annuleren
            </LinkButton>
          </Stack>
        </Stack>
      </form>
    </CostFormShell>
  );
}
