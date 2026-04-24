"use client";

import { Button, NativeSelect, SimpleGrid, Stack, TextInput, Textarea } from "@mantine/core";
import dayjs from "dayjs";
import { useActionState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import {
  categoryLabels,
  generalCostCategories,
  paymentMethodLabels,
  paymentMethods,
} from "@/lib/costs";
import { AppActionState, initialActionState } from "@/server/action-state";
import { VehicleOption } from "@/server/vehicles";
import { CostFormShell } from "@/features/costs/cost-form-shell";

export interface GeneralCostFormValues {
  entryId?: string;
  vehicleId?: string;
  entryDate?: string | null;
  category?: (typeof generalCostCategories)[number];
  title?: string | null;
  amountEur?: number | null;
  vendorName?: string | null;
  locationName?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

interface GeneralCostFormProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  vehicles: VehicleOption[];
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: GeneralCostFormValues;
}

export function GeneralCostForm({
  action,
  vehicles,
  mode,
  title,
  description,
  submitLabel,
  initialValues,
}: GeneralCostFormProps) {
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
                name="category"
                label="Categorie"
                data={generalCostCategories.map((category) => ({
                  value: category,
                  label: categoryLabels[category],
                }))}
                defaultValue={initialValues?.category ?? "insurance"}
                required
              />
              <FieldErrorText message={safeState.fieldErrors?.category} />
            </div>
            <div>
              <TextInput name="title" label="Titel" defaultValue={initialValues?.title ?? ""} required />
              <FieldErrorText message={safeState.fieldErrors?.title} />
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
              <TextInput name="vendorName" label="Leverancier" defaultValue={initialValues?.vendorName ?? ""} />
              <FieldErrorText message={safeState.fieldErrors?.vendorName} />
            </div>
            <div>
              <TextInput name="locationName" label="Locatie" defaultValue={initialValues?.locationName ?? ""} />
              <FieldErrorText message={safeState.fieldErrors?.locationName} />
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
