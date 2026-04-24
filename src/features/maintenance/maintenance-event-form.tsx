"use client";

import { Button, NativeSelect, SimpleGrid, Stack, TextInput, Textarea } from "@mantine/core";
import dayjs from "dayjs";
import { useActionState, useMemo, useState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { paymentMethodLabels, paymentMethods } from "@/lib/costs";
import { AppActionState, initialActionState } from "@/server/action-state";
import { MaintenanceRuleOption } from "@/server/maintenance";
import { VehicleOption } from "@/server/vehicles";

export interface MaintenanceEventFormValues {
  eventId?: string;
  vehicleId?: string;
  vehicleLabel?: string;
  maintenanceRuleId?: string | null;
  maintenanceRuleLabel?: string | null;
  title?: string | null;
  performedAt?: string | null;
  workshopName?: string | null;
  notes?: string | null;
  costAmountEur?: number | null;
  costVendorName?: string | null;
  costPaymentMethod?: string | null;
}

interface MaintenanceEventFormProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  vehicles?: VehicleOption[];
  rules?: MaintenanceRuleOption[];
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: MaintenanceEventFormValues;
}

export function MaintenanceEventForm({
  action,
  vehicles = [],
  rules = [],
  mode,
  title,
  description,
  submitLabel,
  initialValues,
}: MaintenanceEventFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const safeState = state ?? initialActionState;
  const [vehicleId, setVehicleId] = useState(initialValues?.vehicleId ?? vehicles[0]?.id ?? "");

  const filteredRules = useMemo(
    () => rules.filter((rule) => !vehicleId || rule.vehicleId === vehicleId),
    [rules, vehicleId],
  );

  return (
    <Stack gap="xl">
      <Stack gap={6}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "2rem" }}>{title}</h1>
        <p style={{ margin: 0, color: "var(--mantine-color-dimmed)" }}>{description}</p>
      </Stack>

      <form action={formAction}>
        <Stack gap="lg">
          {mode === "edit" && initialValues?.eventId ? (
            <input type="hidden" name="eventId" value={initialValues.eventId} />
          ) : null}

          <FormFeedback message={safeState.message} />

          {mode === "edit" ? (
            <div>
              <input type="hidden" name="vehicleId" value={initialValues?.vehicleId ?? ""} />
              <TextInput label="Brommer" value={initialValues?.vehicleLabel ?? ""} readOnly />
              <FieldErrorText message={safeState.fieldErrors?.vehicleId} />
            </div>
          ) : (
            <div>
              <NativeSelect
                name="vehicleId"
                label="Brommer"
                data={vehicles.map((vehicle) => ({
                  value: vehicle.id,
                  label: vehicle.name,
                }))}
                value={vehicleId}
                onChange={(event) => setVehicleId(event.currentTarget.value)}
                required
              />
              <FieldErrorText message={safeState.fieldErrors?.vehicleId} />
            </div>
          )}

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {mode === "edit" ? (
              <div>
                <TextInput
                  label="Onderhoudsplan"
                  value={initialValues?.maintenanceRuleLabel ?? "Geen gekoppeld plan"}
                  readOnly
                />
              </div>
            ) : (
              <div>
                <NativeSelect
                  name="maintenanceRuleId"
                  label="Onderhoudsplan"
                  data={[
                    { value: "", label: "Geen gekoppeld plan" },
                    ...filteredRules.map((rule) => ({
                      value: rule.id,
                      label: `${rule.title} (${rule.intervalMonths} mnd)`,
                    })),
                  ]}
                  defaultValue={initialValues?.maintenanceRuleId ?? ""}
                />
                <FieldErrorText message={safeState.fieldErrors?.maintenanceRuleId} />
              </div>
            )}
            <div>
              <TextInput name="title" label="Titel" defaultValue={initialValues?.title ?? ""} required />
              <FieldErrorText message={safeState.fieldErrors?.title} />
            </div>
            <div>
              <TextInput
                name="performedAt"
                label="Uitvoerdatum"
                type="date"
                defaultValue={initialValues?.performedAt ?? dayjs().format("YYYY-MM-DD")}
                required
              />
              <FieldErrorText message={safeState.fieldErrors?.performedAt} />
            </div>
            <div>
              <TextInput name="workshopName" label="Werkplaats" defaultValue={initialValues?.workshopName ?? ""} />
              <FieldErrorText message={safeState.fieldErrors?.workshopName} />
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

          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <div>
              <TextInput
                name="costAmountEur"
                label="Kostbedrag"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                defaultValue={initialValues?.costAmountEur?.toString() ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.costAmountEur} />
            </div>
            <div>
              <TextInput
                name="costVendorName"
                label="Leverancier"
                defaultValue={initialValues?.costVendorName ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.costVendorName} />
            </div>
            <div>
              <NativeSelect
                name="costPaymentMethod"
                label="Betaalmethode"
                data={[
                  { value: "", label: "Niet ingevuld" },
                  ...paymentMethods.map((paymentMethod) => ({
                    value: paymentMethod,
                    label: paymentMethodLabels[paymentMethod],
                  })),
                ]}
                defaultValue={initialValues?.costPaymentMethod ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.costPaymentMethod} />
            </div>
          </SimpleGrid>

          <Stack gap="sm">
            <Button type="submit" color="dark" loading={isPending}>
              {submitLabel}
            </Button>
            <LinkButton href="/maintenance" variant="subtle" color="dark">
              Annuleren
            </LinkButton>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
}
