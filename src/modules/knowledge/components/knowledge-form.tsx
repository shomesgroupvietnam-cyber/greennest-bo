import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_MODULES,
  KNOWLEDGE_SOURCE_TYPES,
  type KnowledgeItem
} from "@/modules/knowledge/types";

type KnowledgeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  item?: KnowledgeItem;
  submitLabel: string;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function KnowledgeForm({ action, item, submitLabel }: KnowledgeFormProps) {
  return (
    <form action={action} className="space-y-6 rounded-lg border bg-white p-5 shadow-sm">
      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
        Knowledge Center chỉ lưu metadata, tóm tắt và trạng thái phê duyệt trong sprint này. Embedding, MCP Web Search và AI trả lời sẽ được triển khai sau.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="title">
            Tên nguồn tri thức <span className="text-red-600">*</span>
          </label>
          <input className={fieldClass} defaultValue={item?.title} id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="module">
            Module <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={item?.module ?? "legal"} id="module" name="module" required>
            {Object.entries(KNOWLEDGE_MODULES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="sourceType">
            Loại nguồn <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={item?.sourceType ?? "internal_note"} id="sourceType" name="sourceType" required>
            {Object.entries(KNOWLEDGE_SOURCE_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="confidence">
            Độ tin cậy <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={item?.confidence ?? "unknown"} id="confidence" name="confidence" required>
            {Object.entries(KNOWLEDGE_CONFIDENCE_LEVELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="status">
            Trạng thái nhập
          </label>
          <select className={fieldClass} defaultValue={item?.status ?? "imported"} id="status" name="status">
            <option value="discovered">Mới phát hiện</option>
            <option value="imported">Đã nhập</option>
            <option value="pending_review">Gửi review ngay</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="jurisdiction">
            Phạm vi áp dụng
          </label>
          <input className={fieldClass} defaultValue={item?.jurisdiction} id="jurisdiction" name="jurisdiction" placeholder="VD: Việt Nam, TP.HCM" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="tags">
            Tags
          </label>
          <input className={fieldClass} defaultValue={item?.tags.join(", ")} id="tags" name="tags" placeholder="pháp lý, PCCC, thiết kế" />
          <p className="text-xs text-slate-500">Ngăn cách nhiều tag bằng dấu phẩy.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="effectiveDate">
            Ngày hiệu lực
          </label>
          <input className={fieldClass} defaultValue={item?.effectiveDate} id="effectiveDate" name="effectiveDate" type="date" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="expiryDate">
            Ngày hết hiệu lực
          </label>
          <input className={fieldClass} defaultValue={item?.expiryDate} id="expiryDate" name="expiryDate" type="date" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="sourceUrl">
            URL nguồn
          </label>
          <input className={fieldClass} defaultValue={item?.sourceUrl} id="sourceUrl" name="sourceUrl" placeholder="https://..." type="url" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="sourceFileId">
            Mã file nguồn
          </label>
          <input className={fieldClass} defaultValue={item?.sourceFileId} id="sourceFileId" name="sourceFileId" placeholder="Document ID hoặc Storage object ID tương lai" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="summary">
            Tóm tắt
          </label>
          <textarea className={`${fieldClass} min-h-28`} defaultValue={item?.summary} id="summary" name="summary" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="notes">
            Ghi chú nội bộ
          </label>
          <textarea className={`${fieldClass} min-h-24`} defaultValue={item?.notes} id="notes" name="notes" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">{submitLabel}</Button>
        <Button asChild type="button" variant="outline">
          <Link href={item ? `/knowledge/${item.id}` : "/knowledge"}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
