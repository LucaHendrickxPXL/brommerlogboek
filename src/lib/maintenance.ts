import dayjs from "dayjs";

import { DueStatus } from "@/lib/domain";

export function getDueStatus(value: string): DueStatus {
  const today = dayjs().startOf("day");
  const dueDate = dayjs(value).startOf("day");
  const diff = dueDate.diff(today, "day");

  if (diff < 0) {
    return "overdue";
  }

  if (diff <= 14) {
    return "soon";
  }

  return "ok";
}
