import dayjs from "dayjs";
import "dayjs/locale/nl";

dayjs.locale("nl");

const currencyFormatter = new Intl.NumberFormat("nl-BE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat("nl-BE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatKilometers(value: number) {
  return `${decimalFormatter.format(value)} km`;
}

export function formatDate(value: string) {
  return dayjs(value).format("D MMM YYYY");
}

export function formatCompactDate(value: string) {
  return dayjs(value).format("ddd D MMM");
}

export function formatDuration(minutes?: number) {
  if (!minutes) {
    return "Op eigen tempo";
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (!hours) {
    return `${restMinutes} min`;
  }

  return `${hours} u ${restMinutes} min`;
}

export function getDueLabel(value: string) {
  const today = dayjs().startOf("day");
  const dueDate = dayjs(value).startOf("day");
  const diff = dueDate.diff(today, "day");

  if (diff < 0) {
    return `${Math.abs(diff)} dagen te laat`;
  }

  if (diff === 0) {
    return "Vandaag";
  }

  return `Binnen ${diff} dagen`;
}

export function formatMonthLabel(value: string) {
  return dayjs(value).format("MMM");
}
