"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type PolicySubmitButtonProps = ButtonProps & {
  pendingChildren: ReactNode;
};

export function PolicySubmitButton({
  children,
  disabled,
  pendingChildren,
  ...props
}: PolicySubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      aria-busy={pending}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? pendingChildren : children}
    </Button>
  );
}
