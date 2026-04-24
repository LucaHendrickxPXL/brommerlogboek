"use client";

import {
  Badge,
  Box,
  Button,
  Group,
  NativeSelect,
  Paper,
  Stack,
  Switch,
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
  IconCreditCard,
  IconDroplet,
  IconDropletHalf2,
  IconFlame,
  IconGasStation,
  IconMapPin,
  IconMotorbike,
  IconNotes,
  IconSettings,
} from "@tabler/icons-react";
import { useActionState, useEffect, useState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import { fuelTypeLabels, paymentMethodLabels, paymentMethods } from "@/lib/costs";
import { AppActionState, initialActionState } from "@/server/action-state";
import type { VehiclePickerCardOption } from "@/server/vehicles";
import type { FuelEntryFormValues } from "@/features/costs/fuel-entry-form";

type FuelQuickAddStep = "vehicle" | "fuel" | "amount" | "confirm";

interface FuelQuickAddFlowProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  vehicles: VehiclePickerCardOption[];
  title: string;
  description: string;
  submitLabel: string;
  cancelHref?: string;
  initialValues?: FuelEntryFormValues;
}

const fuelChoices = [
  {
    value: "95",
    label: "Euro 95",
    description: "De snelle standaardkeuze voor dagelijkse tankbeurten.",
    icon: IconDroplet,
    color: "amber",
  },
  {
    value: "98",
    label: "Euro 98",
    description: "Kies 98 wanneer je brommer daar beter op draait.",
    icon: IconFlame,
    color: "rose",
  },
  {
    value: "diesel",
    label: "Diesel",
    description: "Voor dieselbrommers of aangepaste klassiekers.",
    icon: IconDropletHalf2,
    color: "teal",
  },
] as const;

const stepLabels: Record<FuelQuickAddStep, string> = {
  vehicle: "Brommer",
  fuel: "Brandstof",
  amount: "Bedrag",
  confirm: "Bevestigen",
};

function parseAmount(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Nog niet ingevuld";
  }

  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getStartingStep(vehicles: VehiclePickerCardOption[], initialVehicleId?: string) {
  if (initialVehicleId || vehicles.length === 1) {
    return "fuel" satisfies FuelQuickAddStep;
  }

  return "vehicle" satisfies FuelQuickAddStep;
}

export function FuelQuickAddFlow({
  action,
  vehicles,
  title,
  description,
  submitLabel,
  cancelHref = "/costs",
  initialValues,
}: FuelQuickAddFlowProps) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const safeState = state ?? initialActionState;
  const initialVehicleId = initialValues?.vehicleId ?? "";
  const [step, setStep] = useState<FuelQuickAddStep>(getStartingStep(vehicles, initialVehicleId));
  const [vehicleId, setVehicleId] = useState(initialVehicleId || (vehicles.length === 1 ? vehicles[0]?.id || "" : ""));
  const [fuelType, setFuelType] = useState(initialValues?.fuelType ?? "95");
  const [amountInput, setAmountInput] = useState(initialValues?.amountEur?.toString() ?? "");
  const [entryDate, setEntryDate] = useState(initialValues?.entryDate ?? dayjs().format("YYYY-MM-DD"));
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [fuelStation, setFuelStation] = useState(initialValues?.fuelStation ?? "");
  const [paymentMethod, setPaymentMethod] = useState(initialValues?.paymentMethod ?? "");
  const [odometerKm, setOdometerKm] = useState(initialValues?.odometerKm?.toString() ?? "");
  const [isFullTank, setIsFullTank] = useState(Boolean(initialValues?.isFullTank));
  const [clientAmountError, setClientAmountError] = useState<string>();
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [showNotesEditor, setShowNotesEditor] = useState(Boolean(initialValues?.notes));
  const [showMoreDetails, setShowMoreDetails] = useState(
    Boolean(initialValues?.fuelStation || initialValues?.paymentMethod || initialValues?.odometerKm || initialValues?.isFullTank),
  );

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  const parsedAmount = parseAmount(amountInput);
  const activeFieldErrors = safeState.fieldErrors ?? {};
  const showIntro = step === "vehicle";

  useEffect(() => {
    if (!safeState.fieldErrors) {
      return;
    }

    if (safeState.fieldErrors.vehicleId) {
      setStep("vehicle");
    } else if (safeState.fieldErrors.fuelType) {
      setStep("fuel");
    } else if (safeState.fieldErrors.amountEur) {
      setStep("amount");
    } else {
      setStep("confirm");
    }

    if (safeState.fieldErrors.entryDate) {
      setShowDateEditor(true);
    }

    if (safeState.fieldErrors.notes) {
      setShowNotesEditor(true);
    }

    if (safeState.fieldErrors.fuelStation || safeState.fieldErrors.paymentMethod || safeState.fieldErrors.odometerKm) {
      setShowMoreDetails(true);
    }
  }, [safeState.fieldErrors]);

  function goBack() {
    if (step === "confirm") {
      setStep("amount");
      return;
    }

    if (step === "amount") {
      setStep("fuel");
      return;
    }

    if (step === "fuel" && vehicles.length > 1) {
      setStep("vehicle");
    }
  }

  function goToConfirm() {
    if (!amountInput.trim()) {
      setClientAmountError("Bedrag is verplicht.");
      return;
    }

    if (parsedAmount === null || parsedAmount <= 0) {
      setClientAmountError("Bedrag moet groter zijn dan 0.");
      return;
    }

    setClientAmountError(undefined);
    setStep("confirm");
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
          <input type="hidden" name="fuelType" value={fuelType} />
          <input type="hidden" name="amountEur" value={amountInput} />
          <input type="hidden" name="entryDate" value={entryDate} />
          <input type="hidden" name="notes" value={notes} />
          <input type="hidden" name="fuelStation" value={fuelStation} />
          <input type="hidden" name="paymentMethod" value={paymentMethod} />
          <input type="hidden" name="odometerKm" value={odometerKm} />
          {isFullTank ? <input type="hidden" name="isFullTank" value="on" /> : null}

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
                  Welke brommer heb je getankt?
                </Text>
                <Text c="dimmed" size="sm">
                  Kies eerst de brommer zodat de tankbeurt meteen op de juiste plek terechtkomt.
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
                      setStep("fuel");
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

          {step === "fuel" ? (
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
                  Welke brandstof heb je getankt?
                </Text>
                <Text c="dimmed" size="sm">
                  Tik op het juiste type en ga meteen door.
                </Text>
              </Stack>

              {fuelChoices.map((choice) => {
                const isSelected = fuelType === choice.value;

                return (
                  <UnstyledButton
                    key={choice.value}
                    type="button"
                    className="quick-add-choice-card"
                    data-active={isSelected || undefined}
                    onClick={() => {
                      setFuelType(choice.value);
                      setStep("amount");
                    }}
                  >
                    <Group align="center" wrap="nowrap">
                      <ThemeIcon size={56} radius="xl" color={choice.color} variant="light">
                        <choice.icon size={26} stroke={2} />
                      </ThemeIcon>

                      <Stack gap={4} style={{ flex: 1 }}>
                        <Text ff="var(--font-heading)" fw={800} fz="lg">
                          {choice.label}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {choice.description}
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

              <FieldErrorText message={activeFieldErrors.fuelType} />

              <Paper withBorder radius="xl" p="md" className="quick-add-footer">
                <Button
                  type="button"
                  variant="subtle"
                  color="dark"
                  leftSection={<IconArrowLeft size={16} stroke={1.8} />}
                  onClick={goBack}
                  fullWidth
                  disabled={vehicles.length <= 1}
                >
                  Andere brommer kiezen
                </Button>
              </Paper>
            </Stack>
          ) : null}

          {step === "amount" ? (
            <Stack gap="md">
              <Paper withBorder radius="xl" p="md" className="surface-card">
                <Stack gap={4}>
                  <Text size="sm" c="dimmed">
                    Bijna klaar
                  </Text>
                  <Text fw={700}>
                    {selectedVehicle?.name ?? "Brommer"} • {fuelTypeLabels[fuelType as keyof typeof fuelTypeLabels]}
                  </Text>
                </Stack>
              </Paper>

              <Stack gap={4}>
                <Text ff="var(--font-heading)" fw={800} fz="xl">
                  Wat heb je betaald?
                </Text>
                <Text c="dimmed" size="sm">
                  Vul enkel het totaalbedrag in. De rest kan straks nog optioneel aangevuld worden.
                </Text>
              </Stack>

              <Paper withBorder radius="xl" p="xl" className="surface-card quick-add-amount-card">
                <Group gap="md" align="center" wrap="nowrap">
                  <Text ff="var(--font-heading)" fw={800} className="quick-add-currency">
                    €
                  </Text>
                  <TextInput
                    value={amountInput}
                    onChange={(event) => {
                      setAmountInput(event.currentTarget.value);
                      setClientAmountError(undefined);
                    }}
                    placeholder="0,00"
                    inputMode="decimal"
                    autoFocus
                    variant="unstyled"
                    className="quick-add-amount-input"
                    styles={{
                      input: {
                        fontSize: "2.75rem",
                        fontWeight: 800,
                        fontFamily: "var(--font-heading)",
                        lineHeight: 1.1,
                        color: "var(--text-main)",
                      },
                    }}
                  />
                </Group>
              </Paper>

              <FieldErrorText message={clientAmountError ?? activeFieldErrors.amountEur} />

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
                  Controleer je tankbeurt
                </Text>
                <Text c="dimmed" size="sm">
                  Snelle samenvatting voor je opslaat. Alleen aanpassen wat nodig is.
                </Text>
              </Stack>

              <Paper withBorder radius="xl" p="lg" className="surface-card">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
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

                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={46} radius="xl" color="amber" variant="light">
                        <IconGasStation size={22} stroke={2} />
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">
                          Brandstof
                        </Text>
                        <Text fw={700}>{fuelTypeLabels[fuelType as keyof typeof fuelTypeLabels]}</Text>
                      </Stack>
                    </Group>

                    <Button type="button" variant="subtle" color="dark" size="compact-md" onClick={() => setStep("fuel")}>
                      Wijzigen
                    </Button>
                  </Group>

                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={46} radius="xl" color="dark" variant="light">
                      <IconCheck size={22} stroke={2} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Bedrag
                      </Text>
                      <Text fw={800} fz="xl" ff="var(--font-heading)">
                        {formatCurrency(parsedAmount)}
                      </Text>
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
                      <Text fw={700}>{dayjs(entryDate).format("DD/MM/YYYY")}</Text>
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
                        name="entryDatePreview"
                        label="Datum"
                        type="date"
                        value={entryDate}
                        onChange={(event) => setEntryDate(event.currentTarget.value)}
                        required
                      />
                      <FieldErrorText message={activeFieldErrors.entryDate} />
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
                        placeholder="Bijvoorbeeld prijsverschil, omweg of iets dat je wil onthouden."
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
                  rightSection={<IconSettings size={18} stroke={1.8} />}
                  onClick={() => setShowMoreDetails((value) => !value)}
                >
                  Meer details
                </Button>

                {showMoreDetails ? (
                  <Paper withBorder radius="xl" p="md" className="surface-card">
                    <Stack gap="md">
                      <Switch
                        checked={isFullTank}
                        onChange={(event) => setIsFullTank(event.currentTarget.checked)}
                        label="Full tank"
                      />

                      <TextInput
                        label="Tankstation"
                        placeholder="Bijvoorbeeld Q8, Esso of Total"
                        leftSection={<IconMapPin size={18} stroke={1.8} />}
                        value={fuelStation}
                        onChange={(event) => setFuelStation(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.fuelStation} />

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
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.paymentMethod} />

                      <TextInput
                        label="Kilometerstand"
                        placeholder="Optioneel"
                        inputMode="numeric"
                        value={odometerKm}
                        onChange={(event) => setOdometerKm(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.odometerKm} />
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
