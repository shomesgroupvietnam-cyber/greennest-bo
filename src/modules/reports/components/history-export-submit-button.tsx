"use client";

import React from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReportExportFormat, ReportExportTarget } from "@/modules/reports/types";

type HistoryExportSubmitButtonProps = {
  formId: string;
  format: ReportExportFormat;
  label: string;
  target: ReportExportTarget;
};

function setHiddenValue(form: HTMLFormElement, name: string, value: string) {
  const existing = form.elements.namedItem(name);
  const input =
    existing instanceof HTMLInputElement && existing.type === "hidden"
      ? existing
      : document.createElement("input");

  input.type = "hidden";
  input.name = name;
  input.value = value;

  if (!input.parentElement) {
    form.append(input);
  }
}

export function HistoryExportSubmitButton({
  formId,
  format,
  label,
  target,
}: HistoryExportSubmitButtonProps) {
  function prepareExport(button: HTMLButtonElement) {
    const form = button.form;

    if (!form) {
      return;
    }

    setHiddenValue(form, "target", target);
    setHiddenValue(form, "format", format);
  }

  return (
    <Button
      aria-label={label}
      form={formId}
      formAction="/reports/export"
      formMethod="get"
      onClick={(event) => prepareExport(event.currentTarget)}
      onMouseDown={(event) => prepareExport(event.currentTarget)}
      size="sm"
      type="submit"
      variant="outline"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
