import { describe, expect, it } from "vitest";

import {
  ensureMockNotificationOutboxItem,
  type NotificationRepository,
} from "@/lib/notifications/notification-service";
import type { NotificationOutboxItem } from "@/lib/notifications/types";

class InMemoryNotificationRepository implements NotificationRepository {
  private items: NotificationOutboxItem[] = [];

  async getByDedupeKey(dedupeKey: string) {
    return this.items.find((item) => item.dedupeKey === dedupeKey);
  }

  async list() {
    return this.items;
  }

  async upsert(item: NotificationOutboxItem) {
    const exists = this.items.some((current) => current.id === item.id);
    this.items = exists
      ? this.items.map((current) => (current.id === item.id ? item : current))
      : [item, ...this.items];

    return item;
  }
}

const baseInput = {
  nextAction: "Kiem tra approval qua han va lien he nguoi duyet.",
  policyId: "policy-a",
  policyLabel: "CEO approval",
  reason: "Qua han 4 ngay.",
  recipients: [
    {
      kind: "current_approver" as const,
      label: "Tong giam doc",
      userId: "approver-01",
    },
    {
      kind: "proposer" as const,
      label: "requester-01",
      userId: "requester-01",
    },
  ],
  severity: "critical" as const,
  scope: {
    moduleId: "proposal",
    projectId: "project-a",
    recordId: "proposal-a",
  },
  sourceId: "proposal-a",
  sourceType: "proposal" as const,
  title: "Approval qua han: DX-001",
  trigger: "long_overdue" as const,
};

describe("notification outbox service", () => {
  it("creates stable mock notification items and avoids duplicate writes", async () => {
    const repository = new InMemoryNotificationRepository();
    const first = await ensureMockNotificationOutboxItem(baseInput, {
      now: new Date("2026-05-29T00:00:00.000Z"),
      repository,
    });
    const second = await ensureMockNotificationOutboxItem(baseInput, {
      now: new Date("2026-05-29T00:05:00.000Z"),
      repository,
    });

    expect(first.changed).toBe(true);
    expect(first.changeType).toBe("created");
    expect(second.changed).toBe(false);
    expect(second.changeType).toBe("unchanged");
    expect(second.item.id).toBe(first.item.id);
    expect(await repository.list()).toHaveLength(1);
    expect(first.item).toMatchObject({
      channel: "mock",
      dedupeKey: "proposal:proposal-a:policy-a:long_overdue",
      moduleId: "proposal",
      projectId: "project-a",
      recordId: "proposal-a",
      status: "queued",
    });
  });

  it("updates an existing mock notification when escalation state changes", async () => {
    const repository = new InMemoryNotificationRepository();
    const first = await ensureMockNotificationOutboxItem(baseInput, {
      now: new Date("2026-05-29T00:00:00.000Z"),
      repository,
    });
    const updated = await ensureMockNotificationOutboxItem(
      {
        ...baseInput,
        reason: "Qua han 6 ngay.",
        severity: "overdue",
      },
      {
        now: new Date("2026-05-30T00:00:00.000Z"),
        repository,
      },
    );

    expect(updated.changed).toBe(true);
    expect(updated.changeType).toBe("updated");
    expect(updated.previous).toMatchObject({ severity: "critical" });
    expect(updated.item).toMatchObject({
      id: first.item.id,
      reason: "Qua han 6 ngay.",
      severity: "overdue",
      status: "updated",
    });
    expect(await repository.list()).toHaveLength(1);
  });
});
