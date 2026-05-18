"use client"

import { Button } from "@/components/ui/button";
import { ComponentProps, useTransition } from "react";

type Props = {
  action: () => void | Promise<void>;
  children: React.ReactNode;
  isActive: boolean;
} & ComponentProps<typeof Button>

export function TabButton({ action, children, isActive, ...props }: Props) {
  const [isPending, startTransition] = useTransition();
  if (isActive) {
    return <b>{children}</b>
  }
  if (isPending) {
    return <b className="pending">{children}</b>;
  }
  return (
    <Button {...props} onClick={async () => {
      startTransition(async () => {
        await action();
      });
    }}>
      {children}
    </Button>
  );
}
