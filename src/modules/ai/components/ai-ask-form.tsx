import { Sparkles } from "lucide-react";
import React from "react";

import { submitAiQuestionAction } from "@/modules/ai/actions";
import { AI_ASSISTANT_PRESETS } from "@/modules/ai/services/ai-ux-service";
import type { Project } from "@/modules/projects/types";

type AiAskFormProps = {
  projects: Project[];
  canUseRag: boolean;
};

export function AiAskForm({ projects, canUseRag }: AiAskFormProps) {
  const defaultPreset = AI_ASSISTANT_PRESETS[3];

  return (
    <form action={submitAiQuestionAction} className="space-y-5 rounded-lg border bg-white p-5 shadow-sm">
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Chọn tình huống cần hỗ trợ
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {AI_ASSISTANT_PRESETS.map((preset) => (
            <label key={preset.key} className="min-h-28 rounded-lg border border-slate-200 p-3 text-sm hover:border-slate-400">
              <span className="flex items-center gap-2 font-semibold text-slate-950">
                <input name="preset" type="radio" value={preset.key} defaultChecked={preset.key === defaultPreset.key} />
                {preset.label}
              </span>
              <span className="mt-2 block text-slate-600">{preset.description}</span>
            </label>
          ))}
        </div>
      </section>

      <input name="mode" type="hidden" value="fast" />
      <input name="priority" type="hidden" value="normal" />

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Dự án
        <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" name="projectId" defaultValue="">
          <option value="">Tất cả dự án trong phạm vi</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Câu hỏi
        <textarea
          className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          name="prompt"
          placeholder={defaultPreset.promptHint}
          required
        />
      </label>

      <div className="flex flex-wrap gap-4 text-sm text-slate-700">
        {canUseRag ? (
          <label className="flex items-center gap-2">
            <input name="useRag" type="checkbox" defaultChecked />
            Dùng tri thức đã duyệt
          </label>
        ) : (
          <input name="useRag" type="hidden" value="off" />
        )}
        <label className="flex items-center gap-2">
          <input name="wantsActionProposal" type="checkbox" />
          Đề xuất việc cần làm
        </label>
      </div>

      <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" type="submit">
        Hỏi Trợ lý AI
      </button>
    </form>
  );
}
