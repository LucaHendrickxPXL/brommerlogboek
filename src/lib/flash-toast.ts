export type FlashToastTone = "success" | "info" | "error";

export interface FlashToastPayload {
  message: string;
  title?: string;
  tone?: FlashToastTone;
}

function createFlashToastId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function withFlashToast(pathname: string, payload: FlashToastPayload) {
  const [basePath, queryString = ""] = pathname.split("?");
  const params = new URLSearchParams(queryString);

  params.set("toast", payload.message);
  params.set("toastTone", payload.tone ?? "success");
  params.set("toastId", createFlashToastId());

  if (payload.title) {
    params.set("toastTitle", payload.title);
  } else {
    params.delete("toastTitle");
  }

  const nextQueryString = params.toString();

  return nextQueryString ? `${basePath}?${nextQueryString}` : basePath;
}
