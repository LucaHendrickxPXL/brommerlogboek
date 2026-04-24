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
  IconMapPin,
  IconMotorbike,
  IconNotes,
  IconReceiptEuro,
  IconSettings,
  IconTool,
} from "@tabler/icons-react";
import { useActionState, useEffect, useState } from "react";

import { LinkButton } from "@/components/ui/app-link";
import { FieldErrorText, FormFeedback } from "@/components/ui/form-feedback";
import type { GeneralCostFormValues } from "@/features/costs/general-cost-form";
import {
  categoryLabels,
  generalCostCategories,
  paymentMethodLabels,
  paymentMethods,
} from "@/lib/costs";
import { AppActionState, initialActionState } from "@/server/action-state";
import type { VehiclePickerCardOption } from "@/server/vehicles";

type CostQuickAddStep = "vehicle" | "category" | "amount" | "title" | "confirm";
type QuickAddCategory = (typeof generalCostCategories)[number] | "";

interface GeneralCostQuickAddFlowProps {
  action: (state: AppActionState | void, formData: FormData) => Promise<AppActionState | void>;
  vehicles: VehiclePickerCardOption[];
  title: string;
  description: string;
  submitLabel: string;
  cancelHref?: string;
  initialValues?: GeneralCostFormValues;
}

const categoryChoices = [
  {
    value: "insurance",
    label: categoryLabels.insurance,
    description: "Premie, polis of andere verzekeringskost.",
    icon: IconChecklist,
    color: "teal",
  },
  {
    value: "maintenance",
    label: categoryLabels.maintenance,
    description: "Regelmatig onderhoud of verbruikskost.",
    icon: IconTool,
    color: "rose",
  },
  {
    value: "taxes",
    label: categoryLabels.taxes,
    description: "Belastingen, taksen of keuring.",
    icon: IconReceiptEuro,
    color: "gray",
  },
  {
    value: "parking",
    label: categoryLabels.parking,
    description: "Parking, stalling of plaatsgebonden kost.",
    icon: IconMapPin,
    color: "gray",
  },
  {
    value: "equipment",
    label: categoryLabels.equipment,
    description: "Helm, slot of andere uitrusting.",
    icon: IconBike,
    color: "amber",
  },
  {
    value: "repair",
    label: categoryLabels.repair,
    description: "Herstelling na defect of onverwacht probleem.",
    icon: IconSettings,
    color: "rose",
  },
  {
    value: "other",
    label: categoryLabels.other,
    description: "Alles wat niet in een andere categorie past.",
    icon: IconNotes,
    color: "gray",
  },
] as const;

const titlePlaceholders: Record<(typeof generalCostCategories)[number], string> = {
  insurance: "Maandpremie scooterverzekering",
  maintenance: "Onderhoudsbeurt voorjaar",
  taxes: "Verkeersbelasting brommer",
  parking: "Parkeerkost centrum",
  equipment: "Nieuw slot voor de brommer",
  repair: "Nieuwe achterrem",
  other: "Korte omschrijving van de kost",
};

const stepLabels: Record<CostQuickAddStep, string> = {
  vehicle: "Brommer",
  category: "Categorie",
  amount: "Bedrag",
  title: "Titel",
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
    return "category" satisfies CostQuickAddStep;
  }

  return "vehicle" satisfies CostQuickAddStep;
}

export function GeneralCostQuickAddFlow({
  action,
  vehicles,
  title,
  description,
  submitLabel,
  cancelHref = "/costs",
  initialValues,
}: GeneralCostQuickAddFlowProps) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const safeState = state ?? initialActionState;
  const initialVehicleId = initialValues?.vehicleId ?? "";
  const [step, setStep] = useState<CostQuickAddStep>(getStartingStep(vehicles, initialVehicleId));
  const [vehicleId, setVehicleId] = useState(initialVehicleId || (vehicles.length === 1 ? vehicles[0]?.id || "" : ""));
  const [category, setCategory] = useState<QuickAddCategory>(initialValues?.category ?? "");
  const [amountInput, setAmountInput] = useState(initialValues?.amountEur?.toString() ?? "");
  const [costTitle, setCostTitle] = useState(initialValues?.title ?? "");
  const [entryDate, setEntryDate] = useState(initialValues?.entryDate ?? dayjs().format("YYYY-MM-DD"));
  const [vendorName, setVendorName] = useState(initialValues?.vendorName ?? "");
  const [locationName, setLocationName] = useState(initialValues?.locationName ?? "");
  const [paymentMethod, setPaymentMethod] = useState(initialValues?.paymentMethod ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [clientAmountError, setClientAmountError] = useState<string>();
  const [clientTitleError, setClientTitleError] = useState<string>();
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(
    Boolean(initialValues?.vendorName || initialValues?.locationName || initialValues?.paymentMethod || initialValues?.notes),
  );

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  const selectedCategory = categoryChoices.find((choice) => choice.value === category) ?? null;
  const parsedAmount = parseAmount(amountInput);
  const activeFieldErrors = safeState.fieldErrors ?? {};
  const showIntro = step === "vehicle";

  useEffect(() => {
    if (!safeState.fieldErrors) {
      return;
    }

    if (safeState.fieldErrors.vehicleId) {
      setStep("vehicle");
    } else if (safeState.fieldErrors.category) {
      setStep("category");
    } else if (safeState.fieldErrors.amountEur) {
      setStep("amount");
    } else if (safeState.fieldErrors.title) {
      setStep("title");
    } else {
      setStep("confirm");
    }

    if (safeState.fieldErrors.entryDate) {
      setShowDateEditor(true);
    }

    if (safeState.fieldErrors.vendorName || safeState.fieldErrors.locationName || safeState.fieldErrors.paymentMethod || safeState.fieldErrors.notes) {
      setShowMoreDetails(true);
    }
  }, [safeState.fieldErrors]);

  function goBack() {
    if (step === "confirm") {
      setStep("title");
      return;
    }

    if (step === "title") {
      setStep("amount");
      return;
    }

    if (step === "amount") {
      setStep("category");
      return;
    }

    if (step === "category" && vehicles.length > 1) {
      setStep("vehicle");
    }
  }

  function goToTitleStep() {
    if (!amountInput.trim()) {
      setClientAmountError("Bedrag is verplicht.");
      return;
    }

    if (parsedAmount === null || parsedAmount <= 0) {
      setClientAmountError("Bedrag moet groter zijn dan 0.");
      return;
    }

    setClientAmountError(undefined);
    setStep("title");
  }

  function goToConfirm() {
    if (costTitle.trim().length < 2) {
      setClientTitleError("Titel moet minstens 2 tekens hebben.");
      return;
    }

    setClientTitleError(undefined);
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
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="amountEur" value={amountInput} />
          <input type="hidden" name="title" value={costTitle} />
          <input type="hidden" name="entryDate" value={entryDate} />
          <input type="hidden" name="vendorName" value={vendorName} />
          <input type="hidden" name="locationName" value={locationName} />
          <input type="hidden" name="paymentMethod" value={paymentMethod} />
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
                  Voor welke brommer is deze kost?
                </Text>
                <Text c="dimmed" size="sm">
                  Kies eerst de brommer zodat de kost op de juiste historiek terechtkomt.
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
                      setStep("category");
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

          {step === "category" ? (
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
                  Wat voor kost is dit?
                </Text>
                <Text c="dimmed" size="sm">
                  Kies de categorie die het best past en ga meteen door.
                </Text>
              </Stack>

              {categoryChoices.map((choice) => {
                const isSelected = category === choice.value;

                return (
                  <UnstyledButton
                    key={choice.value}
                    type="button"
                    className="quick-add-choice-card"
                    data-active={isSelected || undefined}
                    onClick={() => {
                      setCategory(choice.value);
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

              <FieldErrorText message={activeFieldErrors.category} />
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
                    {selectedVehicle?.name ?? "Brommer"} - {selectedCategory?.label ?? "Categorie"}
                  </Text>
                </Stack>
              </Paper>

              <Stack gap={4}>
                <Text ff="var(--font-heading)" fw={800} fz="xl">
                  Wat heb je betaald?
                </Text>
                <Text c="dimmed" size="sm">
                  Vul alleen het bedrag in. De titel komt in de volgende stap.
                </Text>
              </Stack>

              <Paper withBorder radius="xl" p="xl" className="surface-card quick-add-amount-card">
                <Group gap="md" align="center" wrap="nowrap">
                  <Text ff="var(--font-heading)" fw={800} className="quick-add-currency">
                    EUR
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
                  <Button type="button" color="dark" onClick={goToTitleStep}>
                    Verder
                  </Button>
                </Group>
              </Paper>
            </Stack>
          ) : null}

          {step === "title" ? (
            <Stack gap="md">
              <Paper withBorder radius="xl" p="md" className="surface-card">
                <Stack gap={4}>
                  <Text size="sm" c="dimmed">
                    Categorie en bedrag staan klaar
                  </Text>
                  <Text fw={700}>
                    {selectedCategory?.label ?? "Categorie"} - {formatCurrency(parsedAmount)}
                  </Text>
                </Stack>
              </Paper>

              <Stack gap={4}>
                <Text ff="var(--font-heading)" fw={800} fz="xl">
                  Waar gaat deze kost over?
                </Text>
                <Text c="dimmed" size="sm">
                  Geef een korte, duidelijke omschrijving die later snel scanbaar blijft.
                </Text>
              </Stack>

              <Paper withBorder radius="xl" p="lg" className="surface-card">
                <Stack gap="xs">
                  <TextInput
                    value={costTitle}
                    onChange={(event) => {
                      setCostTitle(event.currentTarget.value);
                      setClientTitleError(undefined);
                    }}
                    autoFocus
                    placeholder={selectedCategory ? titlePlaceholders[selectedCategory.value] : "Korte omschrijving"}
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
                  Controleer je kost
                </Text>
                <Text c="dimmed" size="sm">
                  Alles staat klaar om op te slaan. Alleen de datum of extra details zijn nog optioneel.
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

                  {selectedCategory ? (
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={46} radius="xl" color={selectedCategory.color} variant="light">
                        <selectedCategory.icon size={22} stroke={2} />
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">
                          Categorie
                        </Text>
                        <Text fw={700}>{selectedCategory.label}</Text>
                      </Stack>
                    </Group>
                  ) : null}

                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={46} radius="xl" color="dark" variant="light">
                      <IconReceiptEuro size={22} stroke={2} />
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
                    <ThemeIcon size={46} radius="xl" color="dark" variant="light">
                      <IconNotes size={22} stroke={2} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Titel
                      </Text>
                      <Text fw={700}>{costTitle || "Nog niet ingevuld"}</Text>
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
                  onClick={() => setStep("title")}
                >
                  Titel aanpassen
                </Button>

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
                      <TextInput
                        label="Leverancier"
                        placeholder="Bijvoorbeeld garage of winkel"
                        value={vendorName}
                        onChange={(event) => setVendorName(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.vendorName} />

                      <TextInput
                        label="Locatie"
                        placeholder="Bijvoorbeeld centrum of webshop"
                        value={locationName}
                        onChange={(event) => setLocationName(event.currentTarget.value)}
                      />
                      <FieldErrorText message={activeFieldErrors.locationName} />

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
