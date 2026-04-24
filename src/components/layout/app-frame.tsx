"use client";

import {
  AppShell,
  Box,
  Group,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconArrowRight, IconBolt, IconPlus } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

import { navigationItems } from "@/components/layout/navigation";
import {
  LinkButton,
  LinkNavLink,
  LinkUnstyledButton,
} from "@/components/ui/app-link";

const pageTitleByPath = {
  "/": "",
  "/new": "",
  "/login": "",
  "/register": "",
  "/setup": "",
  "/garage": "Garage",
  "/trips": "Ritten",
  "/costs": "Kosten",
  "/maintenance": "Onderhoud",
  "/overview": "Overzicht",
  "/settings": "Instellingen",
} as const;

function getPageTitle(pathname: string) {
  return pageTitleByPath[pathname as keyof typeof pageTitleByPath] ?? pageTitleByPath["/"];
}

export function AppFrame({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const isPublicRoute = pathname === "/login" || pathname === "/register" || pathname === "/setup";

  if (isPublicRoute) {
    return <Box px={{ base: "sm", sm: "md" }}>{children}</Box>;
  }

  return (
    <AppShell
      className="page-shell"
      header={{ height: { base: 74, sm: 82 } }}
      navbar={{ width: 296, breakpoint: "md", collapsed: { mobile: true } }}
      footer={{ height: { base: 78, sm: 82 } }}
      padding={{ base: "sm", sm: "md" }}
    >
      <AppShell.Header className="app-header">
        <Group justify="space-between" h="100%" px={{ base: "sm", sm: "md" }}>
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={48} radius="xl" color="teal">
              <IconBolt size={24} stroke={2} />
            </ThemeIcon>
            <Box>
              <Text fw={800} size="lg" ff="var(--font-heading)">
                Brommerlogboek
              </Text>
            </Box>
          </Group>

          <LinkButton
            href="/new"
            leftSection={<IconPlus size={18} stroke={2} />}
            variant="light"
            visibleFrom="xs"
          >
            Nieuwe invoer
          </LinkButton>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <ScrollArea type="never" h="100%">
          <Stack gap={6}>
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <LinkNavLink
                  key={item.href}
                  href={item.href}
                  active={isActive}
                  label={item.label}
                  leftSection={<item.icon size={18} stroke={2} />}
                  rightSection={<IconArrowRight size={16} stroke={1.8} />}
                  variant="filled"
                  className="side-nav-link"
                />
              );
            })}
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack className="page-main-stack" gap="xl" maw={1120} mx="auto" pb={96}>
          {pageTitle ? (
            <Text component="h1" ff="var(--font-heading)" fz={{ base: 28, sm: 34 }} fw={800}>
              {pageTitle}
            </Text>
          ) : null}

          {children}
        </Stack>
      </AppShell.Main>

      <AppShell.Footer hiddenFrom="md" className="app-footer">
        <Group justify="space-between" align="stretch" px="xs" py="xs" h="100%" gap={4}>
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <LinkUnstyledButton
                key={item.href}
                href={item.href}
                className="bottom-nav-button"
                data-active={isActive || undefined}
              >
                <Stack gap={4} align="center" justify="center">
                  <item.icon size={18} stroke={2} />
                  <Text size="xs" fw={700}>
                    {item.shortLabel}
                  </Text>
                </Stack>
              </LinkUnstyledButton>
            );
          })}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
