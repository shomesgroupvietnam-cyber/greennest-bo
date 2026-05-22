"use client";

import { type FormEvent, useMemo, useState } from "react";
import { ZodError } from "zod";

import type { AppSessionUser } from "@/lib/auth/session";
import {
  createInvestmentPlanFromInput,
  defaultInvestmentPlanFormValues,
  investmentPlanToFormValues,
  parseInvestmentPlanFormValues,
  updateInvestmentPlanFromInput,
  updateInvestmentPlanStatus,
  type InvestmentPlanFormValues,
} from "@/modules/executive/services/investment-plan-service";
import type {
  ExecutiveAuditLogItem,
  ExecutiveDirective,
  ExecutiveLeadershipData,
  LeadershipApproval,
} from "@/modules/executive/types";

type InvestmentPlanPanelMode = "closed" | "create" | "edit" | "detail";

const approvalDecisionLabels: Record<LeadershipApproval["status"], string> = {
  pending: "Chờ duyệt",
  revision_required: "Yêu cầu sửa",
  approved: "Đã duyệt",
  rejected: "Không duyệt",
};

export function useExecutiveWorkspaceState({
  data,
  user,
}: {
  data: ExecutiveLeadershipData;
  user: AppSessionUser;
}) {
  const [plans, setPlans] = useState(data.strategicPlans);
  const [investmentPlanPanelMode, setInvestmentPlanPanelMode] =
    useState<InvestmentPlanPanelMode>("closed");
  const [selectedInvestmentPlanId, setSelectedInvestmentPlanId] = useState<
    string | null
  >(data.strategicPlans[0]?.id ?? null);
  const [investmentPlanFormValues, setInvestmentPlanFormValues] =
    useState<InvestmentPlanFormValues>(defaultInvestmentPlanFormValues);
  const [investmentPlanFormError, setInvestmentPlanFormError] = useState<
    string | null
  >(null);
  const [directives, setDirectives] = useState(data.directives);
  const [approvals, setApprovals] = useState(data.approvals);
  const [decisionLog, setDecisionLog] = useState(data.decisionLog);
  const [auditLog, setAuditLog] = useState(data.auditLog);
  const [directiveTitle, setDirectiveTitle] = useState(
    "Rà soát điều kiện pháp lý trước phiên họp lãnh đạo",
  );
  const [directiveReceiver, setDirectiveReceiver] = useState("Bộ phận pháp lý");
  const [directiveDueDate, setDirectiveDueDate] = useState("2026-05-28");
  const access = data.access;
  const readOnlyReason =
    "Vai trò hiện tại chỉ được xem, không được thực hiện thao tác này.";

  const openApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === "pending").length,
    [approvals],
  );
  const openDirectives = useMemo(
    () => directives.filter((directive) => directive.status !== "done").length,
    [directives],
  );
  const selectedInvestmentPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedInvestmentPlanId) ?? null,
    [plans, selectedInvestmentPlanId],
  );

  function appendAuditLog(
    entry: Omit<
      ExecutiveAuditLogItem,
      "id" | "actorId" | "actorName" | "createdAt"
    >,
  ) {
    setAuditLog((current) => [
      {
        id: `audit-${Date.now()}-${current.length + 1}`,
        actorId: user.id,
        actorName: user.fullName,
        createdAt: new Date().toISOString(),
        ...entry,
      },
      ...current,
    ]);
  }

  function openCreateInvestmentPlanForm() {
    if (!access.canCreatePlan) {
      return;
    }

    setSelectedInvestmentPlanId(null);
    setInvestmentPlanFormValues(defaultInvestmentPlanFormValues());
    setInvestmentPlanFormError(null);
    setInvestmentPlanPanelMode("create");
  }

  function openInvestmentPlanDetail(planId: string) {
    setSelectedInvestmentPlanId(planId);
    setInvestmentPlanFormError(null);
    setInvestmentPlanPanelMode("detail");
  }

  function openEditInvestmentPlanForm(planId: string) {
    if (!access.canCreatePlan) {
      return;
    }

    const plan = plans.find((item) => item.id === planId);

    if (!plan) {
      return;
    }

    setSelectedInvestmentPlanId(planId);
    setInvestmentPlanFormValues(investmentPlanToFormValues(plan));
    setInvestmentPlanFormError(null);
    setInvestmentPlanPanelMode("edit");
  }

  function closeInvestmentPlanPanel() {
    setInvestmentPlanPanelMode("closed");
    setInvestmentPlanFormError(null);
  }

  function updateInvestmentPlanFormField<
    K extends keyof InvestmentPlanFormValues,
  >(field: K, value: InvestmentPlanFormValues[K]) {
    setInvestmentPlanFormValues((current) => ({ ...current, [field]: value }));
    setInvestmentPlanFormError(null);
  }

  function submitInvestmentPlanForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!access.canCreatePlan) {
      return;
    }

    try {
      const input = parseInvestmentPlanFormValues(investmentPlanFormValues);

      if (investmentPlanPanelMode === "edit" && selectedInvestmentPlan) {
        const beforeStatus = selectedInvestmentPlan.status;
        const updated = updateInvestmentPlanFromInput({
          input,
          plan: selectedInvestmentPlan,
        });

        setPlans((current) =>
          current.map((plan) => (plan.id === updated.id ? updated : plan)),
        );
        setSelectedInvestmentPlanId(updated.id);
        setInvestmentPlanPanelMode("detail");
        appendAuditLog({
          action: "investment_plan.updated",
          entityType: "investment_plan",
          entityId: updated.id,
          projectId: updated.projectId,
          reason: "Cập nhật kế hoạch đầu tư từ form Ban lãnh đạo.",
          beforeStatus,
          afterStatus: updated.status,
        });
        return;
      }

      const plan = createInvestmentPlanFromInput({
        input,
        sequence: plans.length + 1,
        user,
      });

      setPlans((current) => [plan, ...current]);
      setSelectedInvestmentPlanId(plan.id);
      setInvestmentPlanPanelMode("detail");
      appendAuditLog({
        action: "investment_plan.created",
        entityType: "investment_plan",
        entityId: plan.id,
        reason: "Tạo kế hoạch đầu tư từ form Ban lãnh đạo.",
        afterStatus: plan.status,
      });
    } catch (error) {
      setInvestmentPlanFormError(
        error instanceof ZodError
          ? (error.issues[0]?.message ?? "Dữ liệu kế hoạch chưa hợp lệ.")
          : "Dữ liệu kế hoạch chưa hợp lệ.",
      );
    }
  }

  function markPlanReviewed(planId: string) {
    if (!access.canApprovePlan) {
      return;
    }

    const plan = plans.find((item) => item.id === planId);
    const nextStatus = plan?.status === "approved" ? "reviewing" : "approved";

    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId
          ? updateInvestmentPlanStatus({ plan, status: nextStatus })
          : plan,
      ),
    );

    if (plan) {
      appendAuditLog({
        action:
          nextStatus === "approved"
            ? "investment_plan.approved"
            : "investment_plan.review_requested",
        entityType: "investment_plan",
        entityId: plan.id,
        projectId: plan.projectId,
        reason:
          nextStatus === "approved"
            ? "Duyệt kế hoạch đầu tư."
            : "Chuyển kế hoạch về trạng thái review.",
        beforeStatus: plan.status,
        afterStatus: nextStatus,
      });
    }
  }

  function createDirective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!access.canCreateDirective) {
      return;
    }

    const directive: ExecutiveDirective = {
      id: `directive-mock-${Date.now()}`,
      projectId: "project-riverside",
      title: directiveTitle.trim() || "Chỉ đạo điều hành mới",
      content: directiveTitle.trim() || "Chỉ đạo điều hành mới",
      assignedTo: directiveReceiver.trim() || "Bộ phận phụ trách",
      createdBy: user.id,
      createdAt: "2026-05-21T08:00:00+07:00",
      projectName: "GreenNest Riverside",
      ownerName: user.fullName,
      receiverName: directiveReceiver.trim() || "Bộ phận phụ trách",
      dueDate: directiveDueDate,
      status: "open",
      priority: "high",
      taskCode: `TASK-LD-${String(directives.length + 1).padStart(3, "0")}`,
    };

    setDirectives((current) => [directive, ...current]);
    setDecisionLog((current) => [
      {
        id: `decision-directive-${Date.now()}`,
        entityType: "directive",
        entityId: directive.id,
        decision: `Ban hành chỉ đạo: ${directive.title}`,
        projectId: directive.projectId,
        decisionText: `Ban hành chỉ đạo: ${directive.title}`,
        decidedBy: user.fullName,
        decidedAt: "2026-05-21",
        source: "Chỉ đạo điều hành",
        reason: `Giao cho ${directive.receiverName}, theo dõi bằng ${directive.taskCode}.`,
        version: "v1",
        status: "follow_up",
      },
      ...current,
    ]);
    appendAuditLog({
      action: "directive.created",
      entityType: "directive",
      entityId: directive.id,
      projectId: directive.projectId,
      reason: `Giao cho ${directive.receiverName}, theo dõi bằng ${directive.taskCode}.`,
      afterStatus: directive.status,
    });
  }

  function handleApprovalDecision(
    approval: LeadershipApproval,
    status: LeadershipApproval["status"],
  ) {
    if (!access.canApproveProposal) {
      return;
    }

    const reason =
      status === "approved"
        ? "Đủ điều kiện phê duyệt cấp lãnh đạo."
        : status === "rejected"
          ? "Không đáp ứng điều kiện ra quyết định ở phiên bản hiện tại."
          : "Yêu cầu bổ sung hồ sơ, căn cứ và phương án xử lý rủi ro.";

    setApprovals((current) =>
      current.map((item) =>
        item.id === approval.id ? { ...item, status, reason } : item,
      ),
    );
    setDecisionLog((current) => [
      {
        id: `decision-approval-${Date.now()}`,
        entityType: "approval",
        entityId: approval.id,
        decision: `${approvalDecisionLabels[status]}: ${approval.title}`,
        projectId: approval.projectId,
        decisionText: `${approvalDecisionLabels[status]}: ${approval.title}`,
        decidedBy: user.fullName,
        decidedAt: "2026-05-21",
        source: approval.proposalCode,
        reason,
        version: approval.version,
        status: status === "approved" ? "effective" : "follow_up",
      },
      ...current,
    ]);
    appendAuditLog({
      action:
        status === "approved"
          ? "approval.approved"
          : status === "rejected"
            ? "approval.rejected"
            : "approval.revision_required",
      entityType: "approval",
      entityId: approval.id,
      projectId: approval.projectId,
      reason,
      beforeStatus: approval.status,
      afterStatus: status,
    });
  }

  function createMeetingAction(meetingTitle: string) {
    if (!access.canCreateMeetingAction) {
      return;
    }

    const directive: ExecutiveDirective = {
      id: `directive-meeting-${Date.now()}`,
      projectId: "project-city",
      title: `Action item sau họp: ${meetingTitle}`,
      content: `Action item sau họp: ${meetingTitle}`,
      assignedTo: "assistant-01",
      createdBy: user.id,
      createdAt: "2026-05-21T08:00:00+07:00",
      projectName: "GreenNest City",
      ownerName: user.fullName,
      receiverName: "Trợ lý lãnh đạo",
      dueDate: "2026-05-24",
      status: "open",
      priority: "normal",
      taskCode: `TASK-MTG-${String(directives.length + 1).padStart(3, "0")}`,
    };

    setDirectives((current) => [directive, ...current]);
    setDecisionLog((current) => [
      {
        id: `decision-meeting-${Date.now()}`,
        entityType: "meeting",
        entityId: directive.id,
        decision: `Sinh việc sau họp: ${meetingTitle}`,
        projectId: directive.projectId,
        decisionText: `Sinh việc sau họp: ${meetingTitle}`,
        decidedBy: user.fullName,
        decidedAt: "2026-05-21",
        source: "Họp lãnh đạo",
        reason: `Action item đã chuyển thành ${directive.taskCode}.`,
        version: "v1",
        status: "follow_up",
      },
      ...current,
    ]);
    appendAuditLog({
      action: "meeting.action_item_created",
      entityType: "meeting",
      entityId: directive.id,
      projectId: directive.projectId,
      reason: `Action item đã chuyển thành ${directive.taskCode}.`,
      afterStatus: "follow_up",
    });
  }

  return {
    access,
    approvals,
    auditLog,
    closeInvestmentPlanPanel,
    createDirective,
    createMeetingAction,
    decisionLog,
    directiveDueDate,
    directiveReceiver,
    directives,
    directiveTitle,
    handleApprovalDecision,
    investmentPlanFormError,
    investmentPlanFormValues,
    investmentPlanPanelMode,
    markPlanReviewed,
    openCreateInvestmentPlanForm,
    openEditInvestmentPlanForm,
    openInvestmentPlanDetail,
    openApprovals,
    openDirectives,
    plans,
    readOnlyReason,
    selectedInvestmentPlan,
    setDirectiveDueDate,
    setDirectiveReceiver,
    setDirectiveTitle,
    submitInvestmentPlanForm,
    updateInvestmentPlanFormField,
  };
}
