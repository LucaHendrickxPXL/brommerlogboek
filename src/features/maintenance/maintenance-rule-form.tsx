"use client";

import { Button, NativeSelect, SimpleGrid, Stack, TextInput, Textarea } from "@mantine/core";
import { useActionState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { AppActionState, initialActionState } from "@/server/action-state";
import { VehicleOption } from "@/server/vehicles";

export interface MaintenanceRuleFormValues {
  ruleId?: string;
  vehicleId?: string;
  title?: string | null;
  intervalMonths?: number | null;
  lastCompletedAt?: string | null;
  nextDueDate?: string | null;
  description?: string | null;
}

interface MaintenanceRuleFormProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  vehicles: VehicleOption[];
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: MaintenanceRuleFormValues;
}

export function MaintenanceRuleForm({
  action,
  vehicles,
  mode,
  title,
  description,
  submitLabel,
  initialValues,
}: MaintenanceRuleFormProps) {
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
          {mode === "edit" && initialValues?.ruleId ? (
            <input type="hidden" name="ruleId" value={initialValues.ruleId} />
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
              <TextInput name="title" label="Titel" defaultValue={initialValues?.title ?? ""} required />
              <FieldErrorText message={safeState.fieldErrors?.title} />
            </div>
            <div>
              <TextInput
                name="intervalMonths"
                label="Interval in maanden"
                type="number"
                inputMode="numeric"
                min="1"
                max="120"
                defaultValue={initialValues?.intervalMonths?.toString() ?? "6"}
                required
              />
              <FieldErrorText message={safeState.fieldErrors?.intervalMonths} />
            </div>
            <div>
              <TextInput
                name="lastCompletedAt"
                label="Laatst uitgevoerd"
                type="date"
                description="Optioneel. Als je dit invult, berekent de app automatisch de volgende datum."
                defaultValue={initialValues?.lastCompletedAt ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.lastCompletedAt} />
            </div>
            <div>
              <TextInput
                name="nextDueDate"
                label="Volgende datum"
                type="date"
                description="Verplicht als je 'Laatst uitgevoerd' leeg laat."
                defaultValue={initialValues?.nextDueDate ?? ""}
              />
              <FieldErrorText message={safeState.fieldErrors?.nextDueDate} />
            </div>
          </SimpleGrid>

          <div>
            <Textarea
              name="description"
              label="Notities"
              minRows={4}
              autosize
              defaultValue={initialValues?.description ?? ""}
            />
            <FieldErrorText message={safeState.fieldErrors?.description} />
          </div>

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
