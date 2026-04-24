export interface AppErrorOptions {
  code: string;
  message: string;
  fieldErrors?: Partial<Record<string, string>>;
  cause?: unknown;
}

export class AppError extends Error {
  code: string;
  fieldErrors?: Partial<Record<string, string>>;
  cause?: unknown;

  constructor({ code, message, fieldErrors, cause }: AppErrorOptions) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.cause = cause;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isNotFoundAppError(error: unknown) {
  return isAppError(error) && (error.code.endsWith("_NOT_FOUND") || error.code === "RESOURCE_NOT_FOUND");
}
