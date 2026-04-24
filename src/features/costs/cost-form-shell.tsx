import { Stack } from "@mantine/core";
import { PropsWithChildren } from "react";

interface CostFormShellProps extends PropsWithChildren {
  title: string;
  description: string;
}

export function CostFormShell({ title, description, children }: CostFormShellProps) {
  return (
    <Stack gap="xl">
      <Stack gap={6}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "2rem" }}>{title}</h1>
        <p style={{ margin: 0, color: "var(--mantine-color-dimmed)" }}>{description}</p>
      </Stack>

      {children}
    </Stack>
  );
}
