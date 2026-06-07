import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  ensureMockNotificationOutboxItem,
  queueRiskEscalationNotification,
  type NotificationRepository,
} from "@/lib/notifications/notification-service";
import type { ApprovalEscalationState, ApprovalOverdueState } from "@/modules/executive/types";
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

  it("queues risk escalation notifications with risk source dedupe and safe recipients", async () => {
    const repository = new InMemoryNotificationRepository();
    const audits: Array<{ newValue?: unknown }> = [];
    const overdue: ApprovalOverdueState = {
      daysOverdue: 4,
      isOverdue: true,
      nextAction: "Kiem tra risk va nhac owner.",
      ownerLabel: "Owner One",
      reason: "Risk qua han 4 ngay.",
      severity: "critical",
    };
    const escalation: ApprovalEscalationState = {
      policyId: "policy-risk",
      policyLabel: "Risk escalation",
      reason: "Risk high nam trong policy escalation.",
      required: true,
      status: "none",
      targets: [
        {
          kind: "owner",
          label: "Owner One",
          scopeMatched: true,
          userId: "owner-01",
        },
        {
          kind: "policy_escalation",
          label: "tong_giam_doc",
          roleKey: "tong_giam_doc",
          scopeMatched: true,
        },
      ],
      thresholdDays: 3,
      trigger: "critical_overdue",
    };

    const result = await queueRiskEscalationNotification(
      {
        escalation,
        overdue,
        source: {
          ownerId: "owner-01",
          ownerLabel: "Owner One",
          scope: {
            moduleId: "risk",
            projectId: "project-a",
            recordId: "risk-a",
          },
          sourceId: "risk-a",
          title: "Risk phap ly qua han",
        },
        user: { id: "ceo-01", role: "tong_giam_doc" },
      },
      {
        auditWriter: async (input) => {
          audits.push(input);
          return {
            ...input,
            createdAt: "2026-06-02T00:00:00.000Z",
            id: `audit-${audits.length}`,
          };
        },
        notificationRepository: repository,
        now: new Date("2026-06-02T00:00:00.000Z"),
      },
    );
    const queued = await repository.list();

    expect(result.escalation).toMatchObject({
      notificationId: expect.any(String),
      status: "queued",
    });
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({
      dedupeKey: "risk:risk-a:policy-risk:critical_overdue",
      moduleId: "risk",
      projectId: "project-a",
      recordId: "risk-a",
      sourceId: "risk-a",
      sourceType: "risk",
      title: "Risk qua han: risk-a - Risk phap ly qua han",
    });
    expect(audits[0]?.newValue).toMatchObject({
      daysOverdue: 4,
      moduleId: "risk",
      ownerId: "owner-01",
      ownerLabel: "Owner One",
      projectId: "project-a",
      recordId: "risk-a",
      thresholdDays: 3,
    });
  });

  it("keeps notification source type contract aligned with risk notifications", async () => {
    const migration = await readFile(
      "database/migrations/202606070001_align_notification_outbox_source_types.sql",
      "utf8",
    );

    expect(migration).toContain("'risk'");
    expect(migration).toContain("notification_outbox");
    expect(migration).toContain("source_type");
  });
});
