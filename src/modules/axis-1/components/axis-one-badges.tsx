import {
  AXIS_ONE_DOCUMENT_STATUS_LABELS,
  AXIS_ONE_DOCUMENT_STATUS_TONES,
  AXIS_ONE_RISK_LABELS,
  AXIS_ONE_RISK_TONES,
  AXIS_ONE_STAGE_STATUS_LABELS,
  AXIS_ONE_STAGE_STATUS_TONES,
  AXIS_ONE_TASK_STATUS_LABELS,
} from "@/modules/axis-1/constants";
import type {
  AxisOneDocumentStatus,
  AxisOneRiskLevel,
  AxisOneStageStatus,
  AxisOneTaskStatus,
} from "@/modules/axis-1/types";

function Badge({ className, label }: { className: string; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

export function AxisOneStageStatusBadge({
  status,
}: {
  status: AxisOneStageStatus;
}) {
  return (
    <Badge
      className={AXIS_ONE_STAGE_STATUS_TONES[status]}
      label={AXIS_ONE_STAGE_STATUS_LABELS[status]}
    />
  );
}

export function AxisOneRiskBadge({ riskLevel }: { riskLevel: AxisOneRiskLevel }) {
  return (
    <Badge
      className={AXIS_ONE_RISK_TONES[riskLevel]}
      label={`Rủi ro ${AXIS_ONE_RISK_LABELS[riskLevel]}`}
    />
  );
}

export function AxisOneDocumentStatusBadge({
  status,
}: {
  status: AxisOneDocumentStatus;
}) {
  return (
    <Badge
      className={AXIS_ONE_DOCUMENT_STATUS_TONES[status]}
      label={AXIS_ONE_DOCUMENT_STATUS_LABELS[status]}
    />
  );
}

export function AxisOneTaskStatusBadge({
  status,
}: {
  status: AxisOneTaskStatus;
}) {
  return (
    <Badge className="bg-slate-100 text-slate-700" label={AXIS_ONE_TASK_STATUS_LABELS[status]} />
  );
}
