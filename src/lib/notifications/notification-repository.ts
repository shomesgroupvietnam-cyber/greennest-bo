import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type {
  NotificationOutboxItem,
  NotificationOutboxRecipient,
} from "@/lib/notifications/types";

type NotificationStore = {
  items: NotificationOutboxItem[];
};

export type NotificationRepository = {
  getByDedupeKey(dedupeKey: string): Promise<NotificationOutboxItem | undefined>;
  list(): Promise<NotificationOutboxItem[]>;
  upsert(item: NotificationOutboxItem): Promise<NotificationOutboxItem>;
};

const emptyStore: NotificationStore = { items: [] };

function sortItems(items: NotificationOutboxItem[]) {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function isWriteContention(error: unknown) {
  const code = (error as NodeJS.ErrnoException).code;

  return code === "EPERM" || code === "EBUSY" || code === "EACCES";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class JsonNotificationRepository implements NotificationRepository {
  constructor(
    private readonly filePath = path.join(
      process.cwd(),
      ".mock-data",
      "notification-outbox.json",
    ),
  ) {}

  async getByDedupeKey(dedupeKey: string) {
    const store = await this.readStore();

    return store.items.find((item) => item.dedupeKey === dedupeKey);
  }

  async list() {
    return sortItems((await this.readStore()).items);
  }

  async upsert(item: NotificationOutboxItem) {
    const store = await this.readStore();
    const exists = store.items.some((current) => current.id === item.id);

    await this.writeStore({
      items: exists
        ? store.items.map((current) => (current.id === item.id ? item : current))
        : [item, ...store.items],
    });

    return item;
  }

  private async readStore(): Promise<NotificationStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      if (!raw.trim()) {
        return emptyStore;
      }
      const parsed = JSON.parse(raw) as Partial<NotificationStore>;

      return {
        items: parsed.items ?? [],
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return emptyStore;
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: NotificationStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    const payload = `${JSON.stringify({ items: sortItems(store.items) }, null, 2)}\n`;

    await writeFile(tempPath, payload, "utf8");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await rename(tempPath, this.filePath);
        return;
      } catch (error) {
        if (!isWriteContention(error)) {
          await unlink(tempPath).catch(() => undefined);
          throw error;
        }

        if (attempt < 4) {
          await delay(20 * (attempt + 1));
          continue;
        }

        await writeFile(this.filePath, payload, "utf8");
        await unlink(tempPath).catch(() => undefined);
        return;
      }
    }
  }
}

type NotificationOutboxRow = {
  id: string;
  dedupe_key: string;
  channel: NotificationOutboxItem["channel"];
  source_type: NotificationOutboxItem["sourceType"];
  source_id: string;
  title: string;
  reason: string;
  next_action: string;
  severity: NotificationOutboxItem["severity"];
  trigger: NotificationOutboxItem["trigger"];
  status: NotificationOutboxItem["status"];
  policy_id: string | null;
  policy_label: string | null;
  recipients: NotificationOutboxRecipient[] | null;
  organization_id: string | null;
  project_id: string | null;
  axis_id: string | null;
  workstream_id: string | null;
  module_id: string | null;
  record_id: string | null;
  created_at: string;
  updated_at: string;
};

function toNotification(row: NotificationOutboxRow): NotificationOutboxItem {
  return {
    channel: row.channel,
    createdAt: row.created_at,
    dedupeKey: row.dedupe_key,
    id: row.id,
    nextAction: row.next_action,
    policyId: row.policy_id ?? undefined,
    policyLabel: row.policy_label ?? undefined,
    axisId: row.axis_id ?? undefined,
    moduleId: row.module_id ?? undefined,
    organizationId: row.organization_id ?? undefined,
    projectId: row.project_id ?? undefined,
    recordId: row.record_id ?? undefined,
    reason: row.reason,
    recipients: row.recipients ?? [],
    severity: row.severity,
    sourceId: row.source_id,
    sourceType: row.source_type,
    status: row.status,
    title: row.title,
    trigger: row.trigger,
    updatedAt: row.updated_at,
    workstreamId: row.workstream_id ?? undefined,
  };
}

function toRow(item: NotificationOutboxItem): NotificationOutboxRow {
  return {
    channel: item.channel,
    created_at: item.createdAt,
    dedupe_key: item.dedupeKey,
    id: item.id,
    next_action: item.nextAction,
    policy_id: item.policyId ?? null,
    policy_label: item.policyLabel ?? null,
    axis_id: item.axisId ?? null,
    module_id: item.moduleId ?? null,
    organization_id: item.organizationId ?? null,
    project_id: item.projectId ?? null,
    record_id: item.recordId ?? null,
    reason: item.reason,
    recipients: item.recipients,
    severity: item.severity,
    source_id: item.sourceId,
    source_type: item.sourceType,
    status: item.status,
    title: item.title,
    trigger: item.trigger,
    updated_at: item.updatedAt,
    workstream_id: item.workstreamId ?? null,
  };
}

export class SupabaseNotificationRepository implements NotificationRepository {
  async getByDedupeKey(dedupeKey: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("notification_outbox")
      .select("*")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toNotification(data as NotificationOutboxRow) : undefined;
  }

  async list() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("notification_outbox")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as NotificationOutboxRow[]).map(toNotification);
  }

  async upsert(item: NotificationOutboxItem) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("notification_outbox")
      .upsert(toRow(item), { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toNotification(data as NotificationOutboxRow);
  }
}

export const notificationRepository = selectRepository<NotificationRepository>({
  mock: new JsonNotificationRepository(),
  supabase: new SupabaseNotificationRepository(),
});
