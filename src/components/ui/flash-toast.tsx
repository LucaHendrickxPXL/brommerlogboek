"use client";

import { Notification, Portal, Transition } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconInfoCircle } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { FlashToastTone } from "@/lib/flash-toast";

interface ActiveToast {
  id: string;
  message: string;
  title?: string;
  tone: FlashToastTone;
}

function getToneConfig(tone: FlashToastTone) {
  switch (tone) {
    case "error":
      return {
        color: "red",
        icon: <IconAlertCircle size={18} stroke={2} />,
        title: "Er liep iets mis",
      };
    case "info":
      return {
        color: "blue",
        icon: <IconInfoCircle size={18} stroke={2} />,
        title: "Ter info",
      };
    default:
      return {
        color: "teal",
        icon: <IconCheck size={18} stroke={2} />,
        title: "Opgeslagen",
      };
  }
}

export function FlashToast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledToastIdRef = useRef<string | null>(null);
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);

  useEffect(() => {
    const toastId = searchParams.get("toastId");
    const message = searchParams.get("toast");

    if (!toastId || !message || handledToastIdRef.current === toastId) {
      return;
    }

    handledToastIdRef.current = toastId;

    const toneParam = searchParams.get("toastTone");
    const tone: FlashToastTone =
      toneParam === "error" || toneParam === "info" || toneParam === "success"
        ? toneParam
        : "success";

    setActiveToast({
      id: toastId,
      message,
      title: searchParams.get("toastTitle") ?? undefined,
      tone,
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("toast");
    nextParams.delete("toastTitle");
    nextParams.delete("toastTone");
    nextParams.delete("toastId");

    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!activeToast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setActiveToast((currentToast) =>
        currentToast?.id === activeToast.id ? null : currentToast,
      );
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [activeToast]);

  const toneConfig = activeToast ? getToneConfig(activeToast.tone) : null;

  return (
    <Portal>
      <div className="flash-toast-shell" aria-live="polite">
        <Transition mounted={Boolean(activeToast)} transition="slide-up" duration={180} timingFunction="ease">
          {(styles) => (
            <div style={styles}>
              {activeToast && toneConfig ? (
                <Notification
                  className="flash-toast"
                  color={toneConfig.color}
                  title={activeToast.title ?? toneConfig.title}
                  icon={toneConfig.icon}
                  withCloseButton
                  onClose={() => setActiveToast(null)}
                >
                  {activeToast.message}
                </Notification>
              ) : (
                <div />
              )}
            </div>
          )}
        </Transition>
      </div>
    </Portal>
  );
}
