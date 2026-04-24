import { AppError, isAppError } from "@/server/app-errors";
import { ErrorLogContext, logServerError } from "@/server/error-logging";

export interface AppActionState<FieldName extends string = string> {
  status: "idle" | "success" | "error";
  code?: string;
  message?: string;
  fieldErrors?: Partial<Record<FieldName, string>>;
}

export const initialActionState: AppActionState = {
  status: "idle",
};

export function createSuccessState(message: string): AppActionState {
  return {
    status: "success",
    message,
  };
}

export function createValidationError<FieldName extends string = string>(
  message: string,
  fieldErrors?: Partial<Record<FieldName, string>>,
  code = "VALIDATION_FAILED",
) {
  return new AppError({
    code,
    message,
    fieldErrors: fieldErrors ? { ...fieldErrors } : undefined,
  });
}

export function createErrorStateFromUnknown(
  error: unknown,
  fallbackMessage = "Er liep iets mis. Probeer het opnieuw.",
  context?: ErrorLogContext,
): AppActionState {
  if (isAppError(error)) {
    logServerError(error, context);

    return {
      status: "error",
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }

  logServerError(error, context);

  return {
    status: "error",
    code: "UNEXPECTED_ERROR",
    message: fallbackMessage,
  };
}
