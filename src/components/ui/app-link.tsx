"use client";

import {
  Button,
  type ButtonProps,
  NavLink,
  type NavLinkProps,
  UnstyledButton,
  type UnstyledButtonProps,
} from "@mantine/core";
import NextLink from "next/link";
import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";

type AppLinkProps = ComponentPropsWithoutRef<typeof NextLink>;
type LinkBehaviorProps = Pick<AppLinkProps, "href" | "prefetch" | "replace" | "scroll">;

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { href, ...props },
  ref,
) {
  return <NextLink ref={ref} href={href} {...props} />;
});

type LinkButtonProps = Omit<ButtonProps, "component" | "href"> & LinkBehaviorProps;

export function LinkButton({ href, prefetch, replace, scroll, ...props }: LinkButtonProps) {
  return (
    <Button
      component={AppLink}
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      {...props}
    />
  );
}

type LinkNavLinkProps = Omit<NavLinkProps, "component" | "href"> & LinkBehaviorProps;

export function LinkNavLink({ href, prefetch, replace, scroll, ...props }: LinkNavLinkProps) {
  return (
    <NavLink
      component={AppLink}
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      {...props}
    />
  );
}

type LinkUnstyledButtonProps = Omit<UnstyledButtonProps, "component" | "href"> &
  LinkBehaviorProps & {
    children?: ReactNode;
  };

export function LinkUnstyledButton({
  href,
  prefetch,
  replace,
  scroll,
  ...props
}: LinkUnstyledButtonProps) {
  return (
    <UnstyledButton
      component={AppLink}
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      {...props}
    />
  );
}
