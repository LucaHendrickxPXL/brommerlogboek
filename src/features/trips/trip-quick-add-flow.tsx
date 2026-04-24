"use client";

import {
  Badge,
  Box,
  Button,
  Group,
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
  IconMotorbike,
  IconNotes,
  IconRouteAltLeft,
} from "@tabler/icons-react";
import { useActionState, useEffect, useState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import type { TripFormValues } from "@/features/trips/trip-form";
import { AppActionState, initialActionState } from "@/server/action-state";
import type { VehiclePickerCardOption } from "@/server/vehicles";

type TripQuickAddStep = "vehicle" | "distance" | "confirm";

interface TripQuickAddFlowProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  vehicles: VehiclePickerCardOption[];
  title: string;
  description: string;
  submitLabel: string;
  cancelHref?: string;
  initialValues?: TripFormValues;
}

const stepLabels: Record<TripQuickAddStep, string> = {
  vehicle: "Brommer",
  distance: "Afstand",
  confirm: "Bevestigen",
};

function parseDistance(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDistance(value: number | null) {
  if (value === null) {
    return "Nog niet ingevuld";
  }

  return `${new Intl.NumberFormat("nl-BE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value)} km`;
}

function getStartingStep(vehicles: VehiclePickerCardOption[], initialVehicleId?: string) {
  if (initialVehicleId || vehicles.length === 1) {
    return "distance" satisfies TripQuickAddStep;
  }

  return "vehicle" satisfies TripQuickAddStep;
}

export function TripQuickAddFlow({
  action,
  vehicles,
  title,
  description,
  submitLabel,
  cancelHref = "/trips",
  initialValues,
}: TripQuickAddFlowProps) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const safeState = state ?? initialActionState;
  const initialVehicleId = initialValues?.vehicleId ?? "";
  const [step, setStep] = useState<TripQuickAddStep>(getStartingStep(vehicles, initialVehicleId));
  const [vehicleId, setVehicleId] = useState(initialVehicleId || (vehicles.length === 1 ? vehicles[0]?.id || "" : ""));
  const [distanceInput, setDistanceInput] = useState(initialValues?.distanceKm?.toString() ?? "");
  const [tripDate, setTripDate] = useState(initialValues?.tripDate ?? dayjs().format("YYYY-MM-DD"));
  const [tripTitle, setTripTitle] = useState(initialValues?.title ?? "");
  const [durationMinutes, setDurationMinutes] = useState(initialValues?.durationMinutes?.toString() ?? "");
  const [startLocationName, setStartLocationName] = useState(initialValues?.startLocationName ?? "");
  const [endLocationName, setEndLocationName] = useState(initialValues?.endLocationName ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [clientDistanceError, setClientDistanceError] = useState<string>();
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [showTitleEditor, setShowTitleEditor] = useState(Boolean(initialValues?.title));
  const [showMoreDetails, setShowMoreDetails] = useState(
    Boolean(initialValues?.durationMinutes || initialValues?.startLocationName || initialValues?.endLocationName || initialValues?.notes),
  );

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  const parsedDistance = parseDistance(distanceInput);
  const activeFieldErrors = safeState.fieldErrors ?? {};
  const showIntro = step === "vehicle";

  useEffect(() => {
    if (!safeState.fieldErrors) {
      return;
    }

    if (safeState.fieldErrors.vehicleId) {
      setStep("vehicle");
    } else if (safeState.fieldErrors.distanceKm) {
      setStep("distance");
    } else if (safeState.fieldErrors.title) {
      setStep("confirm");
      setShowTitleEditor(true);
    } else {
      setStep("confirm");
    }

    if (safeState.fieldErrors.tripDate) {
      setShowDateEditor(true);
    }

    if (safeState.fieldErrors.durationMinutes || safeState.fieldErrors.startLocationName || safeState.fieldErrors.endLocationName || safeState.fieldErrors.notes) {
      setShowMoreDetails(true);
    }
  }, [safeState.fieldErrors]);

  function goBack() {
    if (step === "confirm") {
      setStep("distance");
      return;
    }

    if (step === "distance" && vehicles.length > 1) {
      setStep("vehicle");
    }
  }

  function goToConfirm() {
    if (!distanceInput.trim()) {
      setClientDistanceError("Afstand is verplicht.");
      return;
    }

    if (parsedDistance === null || parsedDistance < 0.1) {
      setClientDistanceError("Afstand moet minstens 0,1 km zijn.");
      return;
    }

    setClientDistanceError(undefined);
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
          <input type="hidden" name="distanceKm" value={distanceInput} />
          <input type="hidden" name="tripDate" value={tripDate} />
          <input type="hidden" name="title" value={tripTitle} />
          <input type="hidden" name="durationMinutes" value={durationMinutes} />
          <input type="hidden" name="startLocationName" value={startLocationName} />
          <input type="hidden" name="endLocationName" value={endLocationName} />
          <input type="hidden" name="notes" value={notes} />

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
                  Welke brommer heb je gebruikt?
                </Text>
                <Text c="dimmed" size="sm">
                  Kies eerst de brommer zodat de rit meteen op de juiste plek terechtkomt.
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
                      setStep("distance");
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

          {step === "distance" ? (
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
                  Hoeveel kilometer heb je gereden?
                </Text>
                <Text c="dimmed" size="sm">
                  Vul alleen de afstand in. De rest kan straks nog optioneel aangevuld worden.
                </Text>
              </Stack>

              <Paper withBorder radius="xl" p="xl" className="surface-card quick-add-amount-card">
                <Group gap="md" align="center" wrap="nowrap">
                  <ThemeIcon size={56} radius="xl" color="teal" variant="light">
                    <IconRouteAltLeft size={28} stroke={2} />
                  </ThemeIcon>
                  <TextInput
                    value={distanceInput}
                    onChange={(event) => {
                      setDistanceInput(event.currentTarget.value);
                      setClientDistanceError(undefined);
                    }}
                    placeholder="0,0"
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
                  <Text ff="var(--font-heading)" fw={800} fz="xl">
                    km
                  </Text>
                </Group>
              </Paper>

              <FieldErrorText message={clientDistanceError ?? activeFieldErrors.distanceKm} />

              <Paper withBorder radius="xl" p="md" className="quick-add-footer">
                <Group grow>
                  <Button
                    type="button"
                    variant="default"
                    color="dark"
                    leftSection={<IconArrowLeft size={16} stroke={1.8} />}
                    onClick={goBack}
                    disabled={vehicles.length <= 1}
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
                  Controleer je rit
                </Text>
                <Text c="dimmed" size="sm">
                  Snelle samenvatting voor je opslaat. Alleen aanvullen wat je echt nodig hebt.
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
                    <ThemeIcon size={46} radius="xl" color="dark" variant="light">
                      <IconRouteAltLeft size={22} stroke={2} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Afstand
                      </Text>
                      <Text fw={800} fz="xl" ff="var(--font-heading)">
                        {formatDistance(parsedDistance)}
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
                      <Text fw={700}>{dayjs(tripDate).format("DD/MM/YYYY")}</Text>
                    </Stack>
                  </Group>

                  {tripTitle ? (
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={46} radius="xl" color="dark" variant="light">
                        <IconNotes size={22} stroke={2} />
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">
                          Titel
                        </Text>
                        <Text fw={700}>{tripTitle}</Text>
                      </Stack>
                    </Group>
                  ) : null}
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
                        label="Datum"
                        type="date"
                        value={tripDate}
                        onChange={(event) => setTripDate(event.currentTarget.value)}
                        required
                      />
                      <FieldErrorText message={activeFieldErrors.tripDate} />
                    </Stack>
                  </Paper>
                ) : null}

                <Button
                  type="button"
                  variant="light"
                  color="dark"
                  rightSection={<IconNotes size={18} stroke={1.8} />}
                  onClick={() => setShowTitleEditor((value) => !value)}
                >
                  {tripTitle ? "Titel aanpassen" : "Titel toevoegen"}
                </Button>

                {showTitleEditor ? (
                  <Paper withBorder radius="xl" p="md" className="surface-card">
                    <Stack gap="xs">
                      <TextInput
                        label="Titel"
                        placeholder="Bijvoorbeeld avondrit of woon-werk"
                        value={tripTitle}
                        onChange={(event) => setTripTitle(event.currentTarget.value)}
                        maxLength={100}
                      />
                      <FieldErrorText message={activeFieldErrors.title} />
                    </Stack>
                  </Paper>
                ) : null}

                <Button
                  type="button"
                  variant="light"
                  color="dark"
                  rightSection={<IconRouteAltLeft size={18} stroke={1.8} />}
                  onClick={() => setShowMoreDetails((value) => !value)}
                >
                  Meer details
                </Button>

                {showMoreDetails ? (
                  <Paper withBorder radius="xl" p="md" className="surface-card">
                    <Stack gap="md">
                      <TextInput
                        label="Duur (min)"
                        placeholder="Optioneel"
                        inputMode="numeric"
                        value={durationMinutes}
                        onChange={(event) => setDurationMinutes(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.durationMinutes} />

                      <TextInput
                        label="Vertrek"
                        placeholder="Bijvoorbeeld thuis of werk"
                        value={startLocationName}
                        onChange={(event) => setStartLocationName(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.startLocationName} />

                      <TextInput
                        label="Aankomst"
                        placeholder="Bijvoorbeeld centrum of garage"
                        value={endLocationName}
                        onChange={(event) => setEndLocationName(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.endLocationName} />

                      <Textarea
                        label="Notitie"
                        placeholder="Iets dat je later nog wil onthouden."
                        minRows={3}
                        autosize
                        value={notes}
                        onChange={(event) => setNotes(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.notes} />
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
