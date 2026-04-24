import { createValidationError } from "@/server/action-state";

interface ValidationOptions {
  code?: string;
}

interface TextValidationOptions extends ValidationOptions {
  minLength?: number;
  maxLength?: number;
}

interface NumberValidationOptions extends ValidationOptions {
  min?: number;
  max?: number;
}

function getRawValue(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function parseDecimal(value: string) {
  return Number(value.replace(",", "."));
}

function isOneOf<T extends string>(value: string, allowedValues: readonly T[]): value is T {
  return allowedValues.includes(value as T);
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
}

export function readRequiredText(
  formData: FormData,
  name: string,
  label: string,
  options?: TextValidationOptions,
) {
  const value = getRawValue(formData, name);

  if (!value) {
    throw createValidationError(`${label} is verplicht.`, {
      [name]: `${label} is verplicht.`,
    }, options?.code);
  }

  if (options?.minLength && value.length < options.minLength) {
    throw createValidationError(`${label} is te kort.`, {
      [name]: `${label} moet minstens ${options.minLength} tekens hebben.`,
    }, options.code);
  }

  if (options?.maxLength && value.length > options.maxLength) {
    throw createValidationError(`${label} is te lang.`, {
      [name]: `${label} mag maximaal ${options.maxLength} tekens hebben.`,
    }, options.code);
  }

  return value;
}

export function readOptionalText(
  formData: FormData,
  name: string,
  label: string,
  options?: ValidationOptions & {
    maxLength?: number;
  },
) {
  const value = getRawValue(formData, name);

  if (!value) {
    return null;
  }

  if (options?.maxLength && value.length > options.maxLength) {
    throw createValidationError(`${label} is te lang.`, {
      [name]: `${label} mag maximaal ${options.maxLength} tekens hebben.`,
    }, options.code);
  }

  return value;
}

export function readEmail(formData: FormData, name: string, options?: ValidationOptions) {
  const value = readRequiredText(formData, name, "E-mailadres", {
    maxLength: 160,
    code: options?.code,
  }).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw createValidationError("Gebruik een geldig e-mailadres.", {
      [name]: "Gebruik een geldig e-mailadres.",
    }, options?.code ?? "VALIDATION_INVALID_EMAIL");
  }

  return value;
}

export function readPassword(
  formData: FormData,
  name: string,
  options?: ValidationOptions & {
    minLength?: number;
    maxLength?: number;
  },
) {
  const minimumLength = options?.minLength ?? 8;
  const value = readRequiredText(formData, name, "Wachtwoord", {
    minLength: minimumLength,
    maxLength: options?.maxLength ?? 128,
    code: options?.code,
  });

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw createValidationError(`Gebruik minstens ${minimumLength} tekens met letters en cijfers.`, {
      [name]: `Gebruik minstens ${minimumLength} tekens met letters en cijfers.`,
    }, options?.code);
  }

  return value;
}

export function readOptionalInteger(
  formData: FormData,
  name: string,
  label: string,
  options?: NumberValidationOptions,
) {
  const value = getRawValue(formData, name);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    throw createValidationError(`${label} moet een heel getal zijn.`, {
      [name]: `${label} moet een heel getal zijn.`,
    }, options?.code);
  }

  if (typeof options?.min === "number" && parsed < options.min) {
    throw createValidationError(`${label} is te laag.`, {
      [name]: `${label} moet minstens ${options.min} zijn.`,
    }, options.code);
  }

  if (typeof options?.max === "number" && parsed > options.max) {
    throw createValidationError(`${label} is te hoog.`, {
      [name]: `${label} mag maximaal ${options.max} zijn.`,
    }, options.code);
  }

  return parsed;
}

export function readRequiredInteger(
  formData: FormData,
  name: string,
  label: string,
  options?: NumberValidationOptions,
) {
  const value = readRequiredText(formData, name, label, { code: options?.code });
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    throw createValidationError(`${label} moet een heel getal zijn.`, {
      [name]: `${label} moet een heel getal zijn.`,
    }, options?.code);
  }

  if (typeof options?.min === "number" && parsed < options.min) {
    throw createValidationError(`${label} is te laag.`, {
      [name]: `${label} moet minstens ${options.min} zijn.`,
    }, options.code);
  }

  if (typeof options?.max === "number" && parsed > options.max) {
    throw createValidationError(`${label} is te hoog.`, {
      [name]: `${label} mag maximaal ${options.max} zijn.`,
    }, options.code);
  }

  return parsed;
}

export function readOptionalDecimal(
  formData: FormData,
  name: string,
  label: string,
  options?: NumberValidationOptions,
) {
  const value = getRawValue(formData, name);

  if (!value) {
    return null;
  }

  const parsed = parseDecimal(value);

  if (!Number.isFinite(parsed)) {
    throw createValidationError(`${label} moet een geldig bedrag zijn.`, {
      [name]: `${label} moet een geldig bedrag zijn.`,
    }, options?.code);
  }

  if (typeof options?.min === "number" && parsed < options.min) {
    throw createValidationError(`${label} is te laag.`, {
      [name]: `${label} moet minstens ${options.min} zijn.`,
    }, options.code);
  }

  if (typeof options?.max === "number" && parsed > options.max) {
    throw createValidationError(`${label} is te hoog.`, {
      [name]: `${label} mag maximaal ${options.max} zijn.`,
    }, options.code);
  }

  return parsed;
}

export function readRequiredDecimal(
  formData: FormData,
  name: string,
  label: string,
  options?: NumberValidationOptions,
) {
  const value = readRequiredText(formData, name, label, { code: options?.code });
  const parsed = parseDecimal(value);

  if (!Number.isFinite(parsed)) {
    throw createValidationError(`${label} moet een geldig bedrag zijn.`, {
      [name]: `${label} moet een geldig bedrag zijn.`,
    }, options?.code);
  }

  if (typeof options?.min === "number" && parsed < options.min) {
    throw createValidationError(`${label} is te laag.`, {
      [name]: `${label} moet minstens ${options.min} zijn.`,
    }, options.code);
  }

  if (typeof options?.max === "number" && parsed > options.max) {
    throw createValidationError(`${label} is te hoog.`, {
      [name]: `${label} mag maximaal ${options.max} zijn.`,
    }, options.code);
  }

  return parsed;
}

export function readRequiredDate(
  formData: FormData,
  name: string,
  label: string,
  options?: ValidationOptions,
) {
  const value = readRequiredText(formData, name, label, { code: options?.code });

  if (!isValidIsoDate(value)) {
    throw createValidationError(`${label} is ongeldig.`, {
      [name]: `${label} is ongeldig.`,
    }, options?.code ?? "VALIDATION_INVALID_DATE");
  }

  return value;
}

export function readOptionalDate(
  formData: FormData,
  name: string,
  label: string,
  options?: ValidationOptions,
) {
  const value = getRawValue(formData, name);

  if (!value) {
    return null;
  }

  if (!isValidIsoDate(value)) {
    throw createValidationError(`${label} is ongeldig.`, {
      [name]: `${label} is ongeldig.`,
    }, options?.code ?? "VALIDATION_INVALID_DATE");
  }

  return value;
}

export function readRequiredEnum<T extends string>(
  formData: FormData,
  name: string,
  label: string,
  allowedValues: readonly T[],
  options?: ValidationOptions,
) {
  const value = readRequiredText(formData, name, label, { code: options?.code });

  if (!isOneOf(value, allowedValues)) {
    throw createValidationError(`${label} is ongeldig.`, {
      [name]: `${label} is ongeldig.`,
    }, options?.code ?? "VALIDATION_ENUM_VALUE_INVALID");
  }

  return value;
}

export function readOptionalEnum<T extends string>(
  formData: FormData,
  name: string,
  label: string,
  allowedValues: readonly T[],
  options?: ValidationOptions,
) {
  const value = getRawValue(formData, name);

  if (!value) {
    return null;
  }

  if (!isOneOf(value, allowedValues)) {
    throw createValidationError(`${label} is ongeldig.`, {
      [name]: `${label} is ongeldig.`,
    }, options?.code ?? "VALIDATION_ENUM_VALUE_INVALID");
  }

  return value;
}

export function readCheckbox(formData: FormData, name: string) {
  return formData.get(name) === "on";
}
