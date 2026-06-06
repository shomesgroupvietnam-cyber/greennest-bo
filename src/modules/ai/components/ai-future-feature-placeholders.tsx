import {
  BarChart3,
  Bot,
  LineChart,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import React from "react";

type ExecutiveAiFutureFeature = {
  description: string;
  icon: LucideIcon;
  statusLabel: string;
  title: string;
};

export const EXECUTIVE_AI_FUTURE_FEATURES: ExecutiveAiFutureFeature[] = [
  {
    description:
      "Placeholder chi doc scope MVP hien tai; chua co risk analysis tu dong.",
    icon: ShieldAlert,
    statusLabel: "Future enhancement - Risk",
    title: "AI Risk Analysis",
  },
  {
    description:
      "Placeholder cho KPI insight nang cao; MVP van dung dashboard/summary hien co.",
    icon: BarChart3,
    statusLabel: "Future enhancement - KPI",
    title: "AI KPI Analysis",
  },
  {
    description:
      "Mock copilot state de minh bach pham vi; chua co agent dieu hanh tu dong.",
    icon: Bot,
    statusLabel: "Future enhancement - Copilot",
    title: "AI Executive Copilot",
  },
  {
    description:
      "Placeholder cho du bao tien do/rui ro du an; khong tao prediction chinh thuc.",
    icon: LineChart,
    statusLabel: "Future enhancement - Prediction",
    title: "AI Project Prediction",
  },
];

export function AiFutureFeaturePlaceholders() {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Executive AI future placeholders
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Cac tinh nang AI nang cao duoc gan nhan ro la future enhancement.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          MVP placeholder
        </span>
      </div>

      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {EXECUTIVE_AI_FUTURE_FEATURES.map((feature) => {
          const Icon = feature.icon;

          return (
            <li
              className="min-h-28 rounded-lg border border-slate-200 p-3"
              key={feature.title}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-slate-100 p-2 text-slate-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    {feature.statusLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
