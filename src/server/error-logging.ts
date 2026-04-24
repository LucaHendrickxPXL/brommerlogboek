import { isAppError } from "@/server/app-errors";

export interface ErrorLogContext {
  action?: string;
  userId?: string | null;
  entityId?: string | null;
  details?: Record<string, string | number | boolean | null | undefined>;
}

function shouldLogAppError(code: string) {
  return (
    code.startsWith("DB_") ||
    code.startsWith("STORAGE_") ||
    code.startsWith("UPLOAD_") ||
    code.startsWith("EXTERNAL_") ||
    code === "UNEXPECTED_ERROR"
  );
}

export function logServerError(error: unknown, context: ErrorLogContext = {}) {
  const appError = isAppError(error) ? error : null;
  const errorCode = appError?.code ?? "UNEXPECTED_ERROR";

  if (appError && !shouldLogAppError(errorCode)) {
    return;
  }

  console.error("server-error", {
    timestamp: new Date().toISOString(),
    action: context.action ?? "unknown",
    userId: context.userId ?? null,
    entityId: context.entityId ?? null,
    details: context.details ?? {},
    errorCode,
    message: appError?.message ?? (error instanceof Error ? error.message : "Unexpected error"),
    cause: appError?.cause ?? undefined,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
