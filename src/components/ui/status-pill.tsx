import { Badge } from "@mantine/core";

import { DueStatus } from "@/lib/domain";

const dueStatusMap: Record<
  DueStatus,
  {
    color: "rose" | "amber" | "teal";
    label: string;
  }
> = {
  overdue: {
    color: "rose",
    label: "Te laat",
  },
  soon: {
    color: "amber",
    label: "Binnenkort",
  },
  ok: {
    color: "teal",
    label: "Op schema",
  },
};

export function StatusPill({ status }: { status: DueStatus }) {
  const config = dueStatusMap[status];

  return (
    <Badge color={config.color} variant="light">
      {config.label}
    </Badge>
  );
}
