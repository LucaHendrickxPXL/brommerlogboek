"use client";

import { Button, ButtonProps } from "@mantine/core";
import { MouseEvent, MouseEventHandler } from "react";

interface ConfirmSubmitButtonProps extends ButtonProps {
  confirmMessage: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  type,
  ...props
}: ConfirmSubmitButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (typeof window !== "undefined" && !window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  return <Button {...props} type={type ?? "submit"} onClick={handleClick} />;
}
