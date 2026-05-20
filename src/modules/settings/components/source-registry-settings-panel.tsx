import { Globe2, ShieldCheck } from "lucide-react";
import type React from "react";

import { Button } from "@/components/ui/button";
import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_MODULES,
  KNOWLEDGE_SOURCE_TYPES,
  type ManagedSourceRegistryEntry
} from "@/modules/knowledge/types";
import {
  setSourceRegistryEntryEnabledAction,
  upsertSourceRegistryEntryAction
} from "@/modules/settings/actions";

const sourceCategories: Array<{ value: ManagedSourceRegistryEntry["sourceCategory"]; label: string }> = [
  { value: "government", label: "Co quan nha nuoc" },
  { value: "standards", label: "Tieu chuan/quy chuan" },
  { value: "internal", label: "Noi bo" },
  { value: "market", label: "Thi truong" },
  { value: "reference", label: "Tham khao" }
];

function SelectField({
  label,
  name,
  children
}: {
  label: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        name={name}
      >
        {children}
      </select>
    </label>
  );
}

export function SourceRegistrySettingsPanel({ entries }: { entries: ManagedSourceRegistryEntry[] }) {
  const activeCount = entries.filter((entry) => entry.enabled).length;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              Web Search Source Registry
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Quan ly domain duoc phep import vao Knowledge Candidate. Ket qua web search tu domain khong nam trong danh sach enabled se khong duoc dua vao thu vien noi bo.
            </p>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {activeCount}/{entries.length} nguon dang bat
          </div>
        </div>

        <form action={upsertSourceRegistryEntryAction} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Domain</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="domain"
              placeholder="vd: chinhphu.vn"
              required
            />
          </label>

          <SelectField label="Nhom nguon" name="sourceCategory">
            {sourceCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </SelectField>

          <SelectField label="Module mac dinh" name="module">
            {Object.entries(KNOWLEDGE_MODULES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>

          <SelectField label="Loai tri thuc" name="sourceType">
            {Object.entries(KNOWLEDGE_SOURCE_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>

          <SelectField label="Do tin cay" name="confidence">
            {Object.entries(KNOWLEDGE_CONFIDENCE_LEVELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>

          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Tags</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="tags"
              placeholder="phap-ly, chinh-phu"
            />
          </label>

          <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-3">
            <span>Ghi chu</span>
            <textarea
              className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="notes"
              placeholder="Ly do tin cay, pham vi su dung, nguoi phu trach kiem duyet..."
            />
          </label>

          <input type="hidden" name="enabled" value="true" />
          <div className="md:col-span-2 xl:col-span-3">
            <Button type="submit">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              Them / cap nhat source
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Danh sach domain</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Domain</th>
                <th className="px-3 py-2">Module</th>
                <th className="px-3 py-2">Loai</th>
                <th className="px-3 py-2">Do tin cay</th>
                <th className="px-3 py-2">Tags</th>
                <th className="px-3 py-2">Trang thai</th>
                <th className="px-3 py-2">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-3 py-2 font-medium text-slate-950">{entry.domain}</td>
                  <td className="px-3 py-2 text-slate-600">{KNOWLEDGE_MODULES[entry.module]}</td>
                  <td className="px-3 py-2 text-slate-600">{KNOWLEDGE_SOURCE_TYPES[entry.sourceType]}</td>
                  <td className="px-3 py-2 text-slate-600">{KNOWLEDGE_CONFIDENCE_LEVELS[entry.confidence]}</td>
                  <td className="px-3 py-2 text-slate-600">{entry.tags.join(", ") || "-"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        entry.enabled
                          ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
                          : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                      }
                    >
                      {entry.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <form action={setSourceRegistryEntryEnabledAction}>
                      <input type="hidden" name="entryId" value={entry.id} />
                      <input type="hidden" name="enabled" value={entry.enabled ? "false" : "true"} />
                      <Button type="submit" variant="outline" size="sm">
                        {entry.enabled ? "Tat" : "Bat"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
