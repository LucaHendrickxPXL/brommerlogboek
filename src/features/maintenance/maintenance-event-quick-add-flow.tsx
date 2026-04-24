"use client";

import {
  Badge,
  Box,
  Button,
  Group,
  NativeSelect,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import dayjs from "dayjs";
import {
  IconArrowLeft,
  IconBike,
  IconCalendar,
  IconCheck,
  IconChecklist,
  IconCreditCard,
  IconMotorbike,
  IconNotes,
  IconReceiptEuro,
  IconSettings,
  IconTool,
} from "@tabler/icons-react";
import { useActionState, useEffect, useMemo, useState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import type { MaintenanceEventFormValues } from "@/features/maintenance/maintenance-event-form";
import { paymentMethodLabels, paymentMethods } from "@/lib/costs";
import { AppActionState, initialActionState } from "@/server/action-state";
import type { MaintenanceRuleOption } from "@/server/maintenance";
import type { VehiclePickerCardOption } from "@/server/vehicles";

type MaintenanceQuickAddStep = "vehicle" | "maintenance" | "title" | "confirm";
type MaintenanceSelectionMode = "none" | "rule" | "manual";

interface MaintenanceEventQuickAddFlowProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  vehicles: VehiclePickerCardOption[];
  rules: MaintenanceRuleOption[];
  title: string;
  description: string;
  submitLabel: string;
  cancelHref?: string;
  initialValues?: MaintenanceEventFormValues;
}

const stepLabels: Record<MaintenanceQuickAddStep, string> = {
  vehicle: "Brommer",
  maintenance: "Onderhoud",
  title: "Titel",
  confirm: "Bevestigen",
};

function getStartingStep(vehicles: VehiclePickerCardOption[], initialVehicleId?: string) {
  if (initialVehicleId || vehicles.length === 1) {
    return "maintenance" satisfies MaintenanceQuickAddStep;
  }

  return "vehicle" satisfies MaintenanceQuickAddStep;
}

function formatInterval(intervalMonths: number) {
  if (intervalMonths === 1) {
    return "Elke maand";
  }

  return `Elke ${intervalMonths} maanden`;
}

export function MaintenanceEventQuickAddFlow({
  action,
  vehicles,
  rules,
  title,
  description,
  submitLabel,
  cancelHref = "/maintenance",
  initialValues,
}: MaintenanceEventQuickAddFlowProps) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const safeState = state ?? initialActionState;
  const initialVehicleId = initialValues?.vehicleId ?? "";
  const [step, setStep] = useState<MaintenanceQuickAddStep>(getStartingStep(vehicles, initialVehicleId));
  const [vehicleId, setVehicleId] = useState(initialVehicleId || (vehicles.length === 1 ? vehicles[0]?.id || "" : ""));
  const [maintenanceRuleId, setMaintenanceRuleId] = useState(initialValues?.maintenanceRuleId ?? "");
  const [selectionMode, setSelectionMode] = useState<MaintenanceSelectionMode>(
    initialValues?.maintenanceRuleId ? "rule" : initialValues?.title ? "manual" : "none",
  );
  const [eventTitle, setEventTitle] = useState(initialValues?.title ?? "");
  const [performedAt, setPerformedAt] = useState(initialValues?.performedAt ?? dayjs().format("YYYY-MM-DD"));
  const [workshopName, setWorkshopName] = useState(initialValues?.workshopName ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [costAmountInput, setCostAmountInput] = useState(initialValues?.costAmountEur?.toString() ?? "");
  const [costVendorName, setCostVendorName] = useState(initialValues?.costVendorName ?? "");
  const [costPaymentMethod, setCostPaymentMethod] = useState(initialValues?.costPaymentMethod ?? "");
  const [clientTitleError, setClientTitleError] = useState<string>();
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [showWorkshopEditor, setShowWorkshopEditor] = useState(Boolean(initialValues?.workshopName));
  const [showNotesEditor, setShowNotesEditor] = useState(Boolean(initialValues?.notes));
  const [showCostEditor, setShowCostEditor] = useState(
    Boolean(initialValues?.costAmountEur || initialValues?.costVendorName || initialValues?.costPaymentMethod),
  );

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  const filteredRules = useMemo(
    () => rules.filter((rule) => !vehicleId || rule.vehicleId === vehicleId),
    [rules, vehicleId],
  );
  const selectedRule = filteredRules.find((rule) => rule.id === maintenanceRuleId) ?? null;
  const activeFieldErrors = safeState.fieldErrors ?? {};
  const showIntro = step === "vehicle";

  useEffect(() => {
    if (!safeState.fieldErrors) {
      return;
    }

    if (safeState.fieldErrors.vehicleId) {
      setStep("vehicle");
    } else if (safeState.fieldErrors.maintenanceRuleId) {
      setStep("maintenance");
    } else if (safeState.fieldErrors.title) {
      setStep("title");
    } else {
      setStep("confirm");
    }

    if (safeState.fieldErrors.performedAt) {
      setShowDateEditor(true);
    }

    if (safeState.fieldErrors.workshopName) {
      setShowWorkshopEditor(true);
    }

    if (safeState.fieldErrors.notes) {
      setShowNotesEditor(true);
    }

    if (safeState.fieldErrors.costAmountEur || safeState.fieldErrors.costVendorName || safeState.fieldErrors.costPaymentMethod) {
      setShowCostEditor(true);
    }
  }, [safeState.fieldErrors]);

  useEffect(() => {
    if (!maintenanceRuleId) {
      return;
    }

    if (!filteredRules.some((rule) => rule.id === maintenanceRuleId)) {
      setMaintenanceRuleId("");
      setSelectionMode("none");
    }
  }, [filteredRules, maintenanceRuleId]);

  function goBack() {
    if (step === "confirm") {
      if (selectedRule) {
        setStep("maintenance");
        return;
      }

      setStep("title");
      return;
    }

    if (step === "title") {
      setStep("maintenance");
      return;
    }

    if (step === "maintenance" && vehicles.length > 1) {
      setStep("vehicle");
    }
  }

  function goToConfirm() {
    if (eventTitle.trim().length < 2) {
      setClientTitleError("Titel moet minstens 2 tekens hebben.");
      return;
    }

    setClientTitleError(undefined);
    setStep("confirm");
  }

  function selectRule(rule: MaintenanceRuleOption) {
    setSelectionMode("rule");
    setMaintenanceRuleId(rule.id);
    setEventTitle(rule.title);
    setClientTitleError(undefined);
    setStep("confirm");
  }

  function selectManualMaintenance() {
    setSelectionMode("manual");
    setMaintenanceRuleId("");
    setEventTitle((current) => (selectionMode === "manual" ? current : ""));
    setClientTitleError(undefined);
    setStep("title");
  }

  return (
    <Stack gap="md">
      <Stack gap={2}>
        <Text component="h1" ff="var(--font-heading)" fz={{ base: 28, sm: 34 }} fw={800} lh={1.02}>
          {title}
        </Text>
        {showIntro ? (
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        ) : null}
      </Stack>

      <form action={formAction}>
        <Stack gap="lg" className="quick-add-screen">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <input type="hidden" name="maintenanceRuleId" value={maintenanceRuleId} />
          <input type="hidden" name="title" value={eventTitle} />
          <input type="hidden" name="performedAt" value={performedAt} />
          <input type="hidden" name="workshopName" value={workshopName} />
          <input type="hidden" name="notes" value={notes} />
          <input type="hidden" name="costAmountEur" value={costAmountInput} />
          <input type="hidden" name="costVendorName" value={costVendorName} />
          <input type="hidden" name="costPaymentMethod" value={costPaymentMethod} />

          <Stack gap="sm">
            <Group justify="space-between" align="center" wrap="nowrap">
              <LinkButton
                href={cancelHref}
                variant="subtle"
                color="dark"
                leftSection={<IconArrowLeft size={16} stroke={1.8} />}
                px={0}
              >
                Annuleren
              </LinkButton>
              <Text size="sm" c="dimmed" fw={600}>
                Snelle invoer op mobiel
              </Text>
            </Group>

            <Group gap="xs" wrap="wrap">
              {Object.entries(stepLabels).map(([value, label]) => {
                const stepIndex = Object.keys(stepLabels).indexOf(value);
                const currentIndex = Object.keys(stepLabels).indexOf(step);
                const isActive = value === step;
                const isComplete = stepIndex < currentIndex;

                return (
                  <Badge
                    key={value}
                    variant={isActive || isComplete ? "filled" : "light"}
                    color={isActive ? "teal" : isComplete ? "dark" : "gray"}
                    radius="xl"
                    size="lg"
                  >
                    {label}
                  </Badge>
                );
              })}
            </Group>
          </Stack>

          <FormFeedback message={safeState.message} />

          {step === "vehicle" ? (
            <Stack gap="md">
              <Stack gap={4}>
                <Text ff="var(--font-heading)" fw={800} fz="xl">
                  Voor welke brommer was dit onderhoud?
                </Text>
                <Text c="dimmed" size="sm">
                  Kies eerst de brommer zodat je plannen en historiek meteen juist blijven.
                </Text>
              </Stack>

              {vehicles.map((vehicle) => {
                const isSelected = vehicle.id === vehicleId;

                return (
                  <UnstyledButton
                    key={vehicle.id}
                    type="button"
                    className="quick-add-choice-card"
                    data-active={isSelected || undefined}
                    onClick={() => {
                      setVehicleId(vehicle.id);
                      setSelectionMode("none");
                      setMaintenanceRuleId("");
                      setEventTitle("");
                      setStep("maintenance");
                    }}
                  >
                    <Group align="flex-start" wrap="nowrap">
                      <Box
                        className="quick-add-choice-media"
                        style={
                          vehicle.photoUrl
                            ? {
                                backgroundImage: `url("${vehicle.photoUrl}")`,
                              }
                            : undefined
                        }
                      >
                        {vehicle.photoUrl ? null : (
                          <ThemeIcon size={46} radius="xl" color="teal" variant="light">
                            <IconMotorbike size={24} stroke={2} />
                          </ThemeIcon>
                        )}
                      </Box>

                      <Stack gap={6} style={{ flex: 1 }}>
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Stack gap={2}>
                            <Text ff="var(--font-heading)" fw={800} fz="lg">
                              {vehicle.name}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Jouw brommer"}
                            </Text>
                          </Stack>

                          {isSelected ? (
                            <ThemeIcon size={34} radius="xl" color="teal">
                              <IconCheck size={18} stroke={2.2} />
                            </ThemeIcon>
                          ) : null}
                        </Group>

                        {vehicle.licensePlate ? (
                          <Text size="sm" c="dimmed">
                            Kenteken: {vehicle.licensePlate}
                          </Text>
                        ) : null}
                      </Stack>
                    </Group>
                  </UnstyledButton>
                );
              })}

              <FieldErrorText message={activeFieldErrors.vehicleId} />
            </Stack>
          ) : null}

          {step === "maintenance" ? (
            <Stack gap="md">
              {selectedVehicle ? (
                <Paper withBorder radius="xl" p="md" className="surface-card">
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={44} radius="xl" color="teal" variant="light">
                        <IconBike size={22} stroke={2} />
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">
                          Gekozen brommer
                        </Text>
                        <Text fw={700}>{selectedVehicle.name}</Text>
                      </Stack>
                    </Group>

                    {vehicles.length > 1 ? (
                      <Button
                        type="button"
                        variant="subtle"
                        color="dark"
                        size="compact-md"
                        onClick={() => setStep("vehicle")}
                      >
                        Wijzigen
                      </Button>
                    ) : null}
                  </Group>
                </Paper>
              ) : null}

              <Stack gap={4}>
                <Text ff="var(--font-heading)" fw={800} fz="xl">
                  Welk onderhoud heb je uitgevoerd?
                </Text>
                <Text c="dimmed" size="sm">
                  Kies een actief plan om sneller te bewaren, of ga voor los onderhoud.
                </Text>
              </Stack>

              {filteredRules.length === 0 ? (
                <Paper withBorder radius="xl" p="md" className="surface-card">
                  <Text size="sm" c="dimmed">
                    Voor deze brommer zijn nog geen actieve onderhoudsplannen gevonden. Je kunt wel meteen los onderhoud registreren.
                  </Text>
                </Paper>
              ) : null}

              {filteredRules.map((rule) => {
                const isSelected = selectionMode === "rule" && maintenanceRuleId === rule.id;

                return (
                  <UnstyledButton
                    key={rule.id}
                    type="button"
                    className="quick-add-choice-card"
                    data-active={isSelected || undefined}
                    onClick={() => selectRule(rule)}
                  >
                    <Group align="center" wrap="nowrap">
                      <ThemeIcon size={56} radius="xl" color="rose" variant="light">
                        <IconChecklist size={26} stroke={2} />
                      </ThemeIcon>

                      <Stack gap={4} style={{ flex: 1 }}>
                        <Text ff="var(--font-heading)" fw={800} fz="lg">
                          {rule.title}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {formatInterval(rule.intervalMonths)}
                        </Text>
                      </Stack>

                      {isSelected ? (
                        <ThemeIcon size={34} radius="xl" color="teal">
                          <IconCheck size={18} stroke={2.2} />
                        </ThemeIcon>
                      ) : null}
                    </Group>
                  </UnstyledButton>
                );
              })}

              <UnstyledButton
                type="button"
                className="quick-add-choice-card"
                data-active={selectionMode === "manual" || undefined}
                onClick={selectManualMaintenance}
              >
                <Group align="center" wrap="nowrap">
                  <ThemeIcon size={56} radius="xl" color="dark" variant="light">
                    <IconTool size={26} stroke={2} />
                  </ThemeIcon>

                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text ff="var(--font-heading)" fw={800} fz="lg">
                      Los onderhoud
                    </Text>
                    <Text size="sm" c="dimmed">
                      Kies dit als het niet aan een bestaand plan gekoppeld is.
                    </Text>
                  </Stack>

                  {selectionMode === "manual" ? (
                    <ThemeIcon size={34} radius="xl" color="teal">
                      <IconCheck size={18} stroke={2.2} />
                    </ThemeIcon>
                  ) : null}
                </Group>
              </UnstyledButton>

              <FieldErrorText message={activeFieldErrors.maintenanceRuleId} />
            </Stack>
          ) : null}

          {step === "title" ? (
            <Stack gap="md">
              <Paper withBorder radius="xl" p="md" className="surface-card">
                <Stack gap={4}>
                  <Text size="sm" c="dimmed">
                    {selectedRule ? "Onderhoudsplan" : "Los onderhoud"}
                  </Text>
                  <Text fw={700}>{selectedRule ? selectedRule.title : selectedVehicle?.name ?? "Brommer"}</Text>
                </Stack>
              </Paper>

              <Stack gap={4}>
                <Text ff="var(--font-heading)" fw={800} fz="xl">
                  Welk onderhoud heb je uitgevoerd?
                </Text>
                <Text c="dimmed" size="sm">
                  Geef een korte omschrijving die later meteen duidelijk blijft.
                </Text>
              </Stack>

              <Paper withBorder radius="xl" p="lg" className="surface-card">
                <Stack gap="xs">
                  <TextInput
                    value={eventTitle}
                    onChange={(event) => {
                      setEventTitle(event.currentTarget.value);
                      setClientTitleError(undefined);
                    }}
                    autoFocus
                    placeholder="Bijvoorbeeld kettingset vervangen"
                    maxLength={120}
                  />
                  <FieldErrorText message={clientTitleError ?? activeFieldErrors.title} />
                </Stack>
              </Paper>

              <Paper withBorder radius="xl" p="md" className="quick-add-footer">
                <Group grow>
                  <Button
                    type="button"
                    variant="default"
                    color="dark"
                    leftSection={<IconArrowLeft size={16} stroke={1.8} />}
                    onClick={goBack}
                  >
                    Vorige
                  </Button>
                  <Button type="button" color="dark" onClick={goToConfirm}>
                    Verder
                  </Button>
                </Group>
              </Paper>
            </Stack>
          ) : null}

          {step === "confirm" ? (
            <Stack gap="md">
              <Stack gap={4}>
                <Text ff="var(--font-heading)" fw={800} fz="xl">
                  Controleer je onderhoud
                </Text>
                <Text c="dimmed" size="sm">
                  Alles staat klaar. Voeg alleen nog extra context of een optionele kost toe als dat nuttig is.
                </Text>
              </Stack>

              <Paper withBorder radius="xl" p="lg" className="surface-card">
                <Stack gap="md">
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={46} radius="xl" color="teal" variant="light">
                      <IconBike size={22} stroke={2} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Brommer
                      </Text>
                      <Text fw={700}>{selectedVehicle?.name ?? "Niet gekozen"}</Text>
                    </Stack>
                  </Group>

                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={46} radius="xl" color={selectedRule ? "rose" : "dark"} variant="light">
                      {selectedRule ? <IconChecklist size={22} stroke={2} /> : <IconTool size={22} stroke={2} />}
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Onderhoud
                      </Text>
                      <Text fw={700}>{selectedRule ? selectedRule.title : "Los onderhoud"}</Text>
                    </Stack>
                  </Group>

                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={46} radius="xl" color="dark" variant="light">
                      <IconNotes size={22} stroke={2} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Titel
                      </Text>
                      <Text fw={700}>{eventTitle || "Nog niet ingevuld"}</Text>
                    </Stack>
                  </Group>

                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={46} radius="xl" color="gray" variant="light">
                      <IconCalendar size={22} stroke={2} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Datum
                      </Text>
                      <Text fw={700}>{dayjs(performedAt).format("DD/MM/YYYY")}</Text>
                    </Stack>
                  </Group>
                </Stack>
              </Paper>

              <Stack gap="sm">
                <Button
                  type="button"
                  variant="light"
                  color="dark"
                  rightSection={<IconCalendar size={18} stroke={1.8} />}
                  onClick={() => setShowDateEditor((value) => !value)}
                >
                  Datum aanpassen
                </Button>

                {showDateEditor ? (
                  <Paper withBorder radius="xl" p="md" className="surface-card">
                    <Stack gap="xs">
                      <TextInput
                        label="Uitvoerdatum"
                        type="date"
                        value={performedAt}
                        onChange={(event) => setPerformedAt(event.currentTarget.value)}
                        required
                      />
                      <FieldErrorText message={activeFieldErrors.performedAt} />
                    </Stack>
                  </Paper>
                ) : null}

                <Button
                  type="button"
                  variant="light"
                  color="dark"
                  rightSection={<IconNotes size={18} stroke={1.8} />}
                  onClick={() => setStep("title")}
                >
                  Titel aanpassen
                </Button>

                <Button
                  type="button"
                  variant="light"
                  color="dark"
                  rightSection={<IconSettings size={18} stroke={1.8} />}
                  onClick={() => setShowWorkshopEditor((value) => !value)}
                >
                  {workshopName ? "Werkplaats aanpassen" : "Werkplaats toevoegen"}
                </Button>

                {showWorkshopEditor ? (
                  <Paper withBorder radius="xl" p="md" className="surface-card">
                    <Stack gap="xs">
                      <TextInput
                        label="Werkplaats"
                        placeholder="Bijvoorbeeld vaste garage"
                        value={workshopName}
                        onChange={(event) => setWorkshopName(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.workshopName} />
                    </Stack>
                  </Paper>
                ) : null}

                <Button
                  type="button"
                  variant="light"
                  color="dark"
                  rightSection={<IconNotes size={18} stroke={1.8} />}
                  onClick={() => setShowNotesEditor((value) => !value)}
                >
                  {notes ? "Notitie aanpassen" : "Notitie toevoegen"}
                </Button>

                {showNotesEditor ? (
                  <Paper withBorder radius="xl" p="md" className="surface-card">
                    <Stack gap="xs">
                      <Textarea
                        label="Notitie"
                        placeholder="Extra context die je later wil terugvinden."
                        minRows={3}
                        autosize
                        value={notes}
                        onChange={(event) => setNotes(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.notes} />
                    </Stack>
                  </Paper>
                ) : null}

                <Button
                  type="button"
                  variant="light"
                  color="dark"
                  rightSection={<IconReceiptEuro size={18} stroke={1.8} />}
                  onClick={() => setShowCostEditor((value) => !value)}
                >
                  {costAmountInput ? "Kost aanpassen" : "Kost toevoegen"}
                </Button>

                {showCostEditor ? (
                  <Paper withBorder radius="xl" p="md" className="surface-card">
                    <Stack gap="md">
                      <TextInput
                        label="Kostbedrag"
                        placeholder="0,00"
                        inputMode="decimal"
                        value={costAmountInput}
                        onChange={(event) => setCostAmountInput(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.costAmountEur} />

                      {costAmountInput.trim() ? (
                        <>
                          <TextInput
                            label="Leverancier"
                            placeholder="Bijvoorbeeld garage of onderdelenwinkel"
                            value={costVendorName}
                            onChange={(event) => setCostVendorName(event.currentTarget.value)}
                          />
                          <FieldErrorText message={activeFieldErrors.costVendorName} />

                          <NativeSelect
                            label="Betaalmethode"
                            leftSection={<IconCreditCard size={18} stroke={1.8} />}
                            data={[
                              { value: "", label: "Niet ingevuld" },
                              ...paymentMethods.map((method) => ({
                                value: method,
                                label: paymentMethodLabels[method],
                              })),
                            ]}
                            value={costPaymentMethod}
                            onChange={(event) => setCostPaymentMethod(event.currentTarget.value)}
                          />
                          <FieldErrorText message={activeFieldErrors.costPaymentMethod} />
                        </>
                      ) : null}
                    </Stack>
                  </Paper>
                ) : null}
              </Stack>

              <Paper withBorder radius="xl" p="md" className="quick-add-footer">
                <Group grow>
                  <Button
                    type="button"
                    variant="default"
                    color="dark"
                    leftSection={<IconArrowLeft size={16} stroke={1.8} />}
                    onClick={goBack}
                    disabled={isPending}
                  >
                    Vorige
                  </Button>
                  <Button type="submit" color="dark" loading={isPending}>
                    {submitLabel}
                  </Button>
                </Group>
              </Paper>
            </Stack>
          ) : null}
        </Stack>
      </form>
    </Stack>
  );
}
