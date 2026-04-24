import {
  IconBike,
  IconChartHistogram,
  IconHome2,
  IconReceiptEuro,
  IconSettings,
  IconTool,
} from "@tabler/icons-react";

export const navigationItems = [
  {
    href: "/",
    label: "Home",
    shortLabel: "Home",
    icon: IconHome2,
  },
  {
    href: "/garage",
    label: "Garage",
    shortLabel: "Garage",
    icon: IconBike,
  },
  {
    href: "/trips",
    label: "Ritten",
    shortLabel: "Ritten",
    icon: IconBike,
  },
  {
    href: "/costs",
    label: "Kosten",
    shortLabel: "Kosten",
    icon: IconReceiptEuro,
  },
  {
    href: "/maintenance",
    label: "Onderhoud",
    shortLabel: "Service",
    icon: IconTool,
  },
  {
    href: "/overview",
    label: "Overzicht",
    shortLabel: "Stats",
    icon: IconChartHistogram,
  },
  {
    href: "/settings",
    label: "Instellingen",
    shortLabel: "Profiel",
    icon: IconSettings,
  },
] as const;
