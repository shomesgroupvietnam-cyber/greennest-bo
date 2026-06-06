"use client";

import React from "react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

type CommandCenterErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CommandCenterError({ reset }: CommandCenterErrorProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ErrorState
        action={
          <>
            <Button onClick={reset} type="button">
              Thu lai
            </Button>
          </>
        }
        backHref="/command-center"
        backLabel="Ve Command Center"
        description="Co loi tam thoi khi tai du lieu dieu hanh. Thu lai hoac quay ve Command Center."
        title="Khong the tai Command Center"
      />
    </main>
  );
}
