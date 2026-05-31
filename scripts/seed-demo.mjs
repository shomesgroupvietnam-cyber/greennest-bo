import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataDir = process.env.GREENNEST_MOCK_DATA_DIR ? path.resolve(process.env.GREENNEST_MOCK_DATA_DIR) : path.join(root, ".mock-data");
const acceptanceFixture = JSON.parse(
  await readFile(path.join(root, "tests", "fixtures", "module-one-acceptance.json"), "utf8")
);

const now = new Date(acceptanceFixture.baseNow);
const today = now.toISOString().slice(0, 10);

function isoOffset(days) {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  return value.toISOString();
}

function dateOffset(days) {
  return isoOffset(days).slice(0, 10);
}

const users = [
  { id: "mock-founder", fullName: "Nguyễn Minh Anh", email: "admin@greennest.vn", role: "admin" },
  { id: "ceo-01", fullName: "Đặng Quốc Bảo", email: "ceo@greennest.vn", role: "tong_giam_doc" },
  { id: "executive-01", fullName: "Trần Hoàng Nam", email: "pho.tgd@greennest.vn", role: "pho_tong_giam_doc" },
  { id: "project-director-01", fullName: "Hoàng Gia Khánh", email: "director@greennest.vn", role: "giam_doc_du_an" },
  { id: "pm-01", fullName: "Ngô Thanh Tâm", email: "pm@greennest.vn", role: "quan_ly_du_an" },
  { id: "lead-01", fullName: "Lê Quang Huy", email: "to.truong@greennest.vn", role: "to_truong" },
  { id: "legal-manager", fullName: "Phạm Thu Hà", email: "legal@greennest.vn", role: "phap_ly" },
  { id: "accountant", fullName: "Vũ Lan Chi", email: "accounting@greennest.vn", role: "ke_toan" },
  { id: "designer", fullName: "Đỗ Hải Yến", email: "design@greennest.vn", role: "thiet_ke" },
  { id: "technical-01", fullName: "Bùi Minh Khoa", email: "technical@greennest.vn", role: "ky_thuat" },
  { id: "construction-01", fullName: "Phan Đức Long", email: "construction@greennest.vn", role: "thi_cong" },
  { id: "assistant-01", fullName: "Trịnh Mai Anh", email: "assistant@greennest.vn", role: "thu_ky_tro_ly" },
  { id: "contractor-01", fullName: "Nguyễn Văn Nhà Thầu", email: "contractor@greennest.vn", role: "nha_thau" },
  { id: "consultant-01", fullName: "Lê Minh Tư Vấn", email: "consultant@greennest.vn", role: "tu_van" },
  { id: "viewer", fullName: "Người xem demo", email: "viewer@greennest.vn", role: "viewer" }
].map((user) => ({ ...user, createdAt: isoOffset(-20), updatedAt: isoOffset(-1) }));

users.push(
  ...[
    { id: "investment-01", fullName: "Tran Dau Tu", email: "investment@greennest.vn", role: "dau_tu_phat_trien" },
    { id: "finance-manager-01", fullName: "Le Tai Chinh", email: "finance.manager@greennest.vn", role: "quan_ly_tai_chinh" },
    { id: "hr-01", fullName: "Pham Nhan Su", email: "hr@greennest.vn", role: "hanh_chinh_nhan_su" },
    { id: "quality-01", fullName: "Do QA QC", email: "quality@greennest.vn", role: "qa_qc_chat_luong" },
    { id: "safety-01", fullName: "Nguyen An Toan", email: "safety@greennest.vn", role: "an_toan_lao_dong" },
    { id: "internal-audit-01", fullName: "Ho Kiem Toan", email: "internal.audit@greennest.vn", role: "kiem_toan_noi_bo" },
    { id: "contract-manager-01", fullName: "Vu Hop Dong", email: "contract.manager@greennest.vn", role: "quan_ly_hop_dong" }
  ].map((user) => ({ ...user, createdAt: isoOffset(-20), updatedAt: isoOffset(-1) }))
);

users.splice(
  0,
  users.length,
  ...acceptanceFixture.personas.map((persona) => ({
    id: persona.id,
    fullName: persona.fullName,
    email: persona.email,
    role: persona.role,
    status: "active",
    createdAt: isoOffset(-20),
    updatedAt: isoOffset(-1)
  }))
);

const projects = [
  {
    id: "demo-project-riverside",
    code: "GN-2026-001",
    name: "GreenNest Riverside",
    location: "TP. Thủ Đức, TP.HCM",
    area: 12500,
    projectType: "Khu nhà ở thấp tầng",
    investor: "GreenNest Investment",
    status: "active",
    ownerName: "Trần Hoàng Nam",
    ownerId: "executive-01",
    createdAt: isoOffset(-28),
    updatedAt: isoOffset(-1)
  },
  {
    id: "demo-project-garden",
    code: "GN-2026-002",
    name: "GreenNest Garden",
    location: "Bình Dương",
    area: 8200,
    projectType: "Chung cư trung tầng",
    investor: "GreenNest Investment",
    status: "planning",
    ownerName: "Phạm Thu Hà",
    ownerId: "legal-manager",
    createdAt: isoOffset(-18),
    updatedAt: isoOffset(-2)
  }
];

projects.splice(
  0,
  projects.length,
  ...acceptanceFixture.projectScenarios.map((project, index) => ({
    id: project.id,
    code: project.code,
    name: project.name,
    location: project.location,
    area: project.area,
    projectType: project.projectType,
    investor: project.investor,
    status: project.status,
    ownerName: project.ownerName,
    ownerId: project.ownerId,
    createdAt: isoOffset(-28 + index * 3),
    updatedAt: isoOffset(-1 - (index % 2))
  }))
);

const legalSteps = [
  ["land_survey", "Khảo sát quỹ đất"],
  ["planning_analysis", "Phân tích quy hoạch"],
  ["investment_proposal", "Hồ sơ đề xuất đầu tư"],
  ["investment_policy", "Chủ trương đầu tư"],
  ["planning_1_500", "Quy hoạch chi tiết 1/500"],
  ["basic_design", "Thiết kế cơ sở"],
  ["feasibility_report", "Báo cáo nghiên cứu khả thi"],
  ["environmental_approval", "Đánh giá môi trường"],
  ["fire_safety", "PCCC"],
  ["land_allocation", "Giao đất/thuê đất"],
  ["investor_recognition", "Chấp nhận chủ đầu tư"],
  ["construction_permit", "Giấy phép xây dựng"]
].flatMap(([stepCode, stepName], index) =>
  projects.map((project, projectIndex) => {
    const statusByIndex =
      projectIndex === 0 ? ["done", "done", "in_progress", "waiting_authority", "blocked"] : ["done", "in_progress", "not_started"];
    const status = statusByIndex[index % statusByIndex.length];

    return {
      id: `${project.id}-${stepCode}`,
      projectId: project.id,
      stepCode,
      stepName,
      status,
      assigneeId: "legal-manager",
      dueDate: dateOffset(index - 2),
      completedDate: status === "done" ? dateOffset(index - 8) : undefined,
      notes: status === "blocked" ? "Đang vướng phản hồi hồ sơ từ cơ quan thẩm định, cần bổ sung tài liệu trong tuần này." : undefined,
      relatedDocumentIds: index === 2 ? [`${project.id}-doc-investment-proposal`] : [],
      createdAt: isoOffset(-20 + index),
      updatedAt: isoOffset(-1)
    };
  })
);

const tasks = [
  {
    id: "demo-task-overdue-legal",
    projectId: "demo-project-riverside",
    title: "Bổ sung hồ sơ chủ trương đầu tư",
    description: "Hoàn thiện bộ hồ sơ theo yêu cầu phản hồi mới nhất.",
    assigneeId: "legal-manager",
    dueDate: dateOffset(-3),
    status: "blocked",
    priority: "urgent",
    category: "Pháp lý"
  },
  {
    id: "demo-task-upcoming-design",
    projectId: "demo-project-riverside",
    title: "Rà soát bản vẽ thiết kế cơ sở",
    description: "Kiểm tra xung đột giữa bản vẽ kiến trúc và hạ tầng kỹ thuật.",
    assigneeId: "designer",
    dueDate: dateOffset(3),
    status: "in_progress",
    priority: "high",
    category: "Thiết kế"
  },
  {
    id: "demo-task-team",
    projectId: "demo-project-garden",
    title: "Khảo sát hiện trạng khu đất",
    description: "Cập nhật ảnh hiện trạng, ranh đất và điểm đấu nối.",
    assigneeId: "department-head-01",
    dueDate: dateOffset(5),
    status: "todo",
    priority: "medium",
    category: "Hiện trường"
  },
  {
    id: "demo-task-contractor-package",
    projectId: "demo-project-riverside",
    title: "Cập nhật tiến độ gói thi công hàng rào",
    description: "Nhà thầu cập nhật tiến độ, ảnh hiện trường và vấn đề cần xử lý.",
    assigneeId: "contractor-01",
    dueDate: dateOffset(2),
    status: "in_progress",
    priority: "high",
    category: "Thi công"
  },
  {
    id: "demo-task-consultant-review",
    projectId: "demo-project-riverside",
    title: "Review bản vẽ hạ tầng kỹ thuật",
    description: "Tư vấn kiểm tra xung đột và phản hồi các điểm cần chỉnh.",
    assigneeId: "consultant-01",
    dueDate: dateOffset(4),
    status: "todo",
    priority: "medium",
    category: "Tư vấn"
  }
].map((task) => ({ ...task, createdAt: isoOffset(-7), updatedAt: isoOffset(-1) }));

tasks.push(
  {
    id: "demo-task-follow-up-riverside",
    projectId: "demo-project-riverside",
    title: "Theo doi action item sau hop dieu hanh Riverside",
    description: "Fixture follow-up task lien ket meeting/decision de nghiem thu Module 1 va cac module sau.",
    assigneeId: "assistant-01",
    dueDate: dateOffset(1),
    status: "todo",
    priority: "high",
    category: "Follow-up",
    createdAt: isoOffset(-4),
    updatedAt: isoOffset(-1)
  },
  {
    id: "demo-task-axis23-placeholder",
    projectId: "demo-project-axis23-lab",
    title: "Chuan bi placeholder Approval Center Axis 2/3",
    description: "Du lieu mock de cac story sau co fixture cho axis/module ngoai Module 1.",
    assigneeId: "pm-01",
    dueDate: dateOffset(6),
    status: "waiting",
    priority: "medium",
    category: "Approval Center",
    createdAt: isoOffset(-4),
    updatedAt: isoOffset(-1)
  }
);

const documents = [
  {
    id: "demo-project-riverside-doc-investment-proposal",
    projectId: "demo-project-riverside",
    title: "Hồ sơ đề xuất đầu tư Riverside",
    docType: "legal_submission",
    externalUrl: "https://example.com/greennest/riverside/de-xuat-dau-tu",
    version: "v2",
    status: "needs_update",
    ownerId: "legal-manager"
  },
  {
    id: "demo-project-riverside-doc-basic-design",
    projectId: "demo-project-riverside",
    title: "Bản vẽ thiết kế cơ sở",
    docType: "design_drawing",
    externalUrl: "https://example.com/greennest/riverside/thiet-ke-co-so",
    version: "v1",
    status: "in_review",
    ownerId: "designer"
  },
  {
    id: "demo-project-garden-doc-land",
    projectId: "demo-project-garden",
    title: "Tài liệu pháp lý quỹ đất",
    docType: "land_record",
    version: "v1",
    status: "missing",
    ownerId: "legal-manager"
  },
  {
    id: "demo-project-riverside-doc-contractor-method",
    projectId: "demo-project-riverside",
    title: "Biện pháp thi công hàng rào",
    docType: "contractor_submission",
    externalUrl: "https://example.com/greennest/riverside/bien-phap-thi-cong",
    version: "v1",
    status: "needs_update",
    ownerId: "contractor-01"
  },
  {
    id: "demo-project-riverside-doc-consultant-review",
    projectId: "demo-project-riverside",
    title: "Phiếu review hạ tầng kỹ thuật",
    docType: "consultant_review",
    externalUrl: "https://example.com/greennest/riverside/review-ha-tang",
    version: "v1",
    status: "in_review",
    ownerId: "consultant-01"
  }
].map((document) => ({
  ...document,
  approvalStatus:
    document.status === "complete"
      ? "approved"
      : document.status === "in_review"
        ? "pending"
        : document.status === "needs_update"
          ? "rejected"
          : "not_submitted",
  reviewerId: document.status === "needs_update" ? "project-director-01" : undefined,
  reviewedAt: document.status === "needs_update" ? isoOffset(-2) : undefined,
  approvalNotes: document.status === "needs_update" ? "Cần bổ sung/cập nhật trước khi được xem là hồ sơ hoàn tất." : undefined,
  createdAt: isoOffset(-10),
  updatedAt: isoOffset(-1)
}));

documents.push(
  {
    id: "demo-project-riverside-doc-finance-confidential",
    projectId: "demo-project-riverside",
    title: "Bang tong hop ngan sach Riverside",
    docType: "finance_budget",
    classification: "CONFIDENTIAL",
    externalUrl: "https://example.com/greennest/riverside/ngan-sach",
    version: "v1",
    status: "complete",
    ownerId: "finance-manager-01",
    approvalStatus: "approved",
    reviewerId: "ceo-01",
    reviewedAt: isoOffset(-2),
    createdAt: isoOffset(-9),
    updatedAt: isoOffset(-1)
  },
  {
    id: "demo-project-garden-doc-legal-risk",
    projectId: "demo-project-garden",
    title: "Canh bao rui ro phap ly Garden",
    docType: "legal_submission",
    classification: "RESTRICTED",
    version: "v1",
    status: "needs_update",
    ownerId: "legal-manager",
    approvalStatus: "rejected",
    reviewerId: "project-director-01",
    reviewedAt: isoOffset(-3),
    approvalNotes: "Ho so phap ly con thieu phan xac nhan quy hoach.",
    createdAt: isoOffset(-9),
    updatedAt: isoOffset(-1)
  },
  {
    id: "demo-project-axis23-doc-placeholder",
    projectId: "demo-project-axis23-lab",
    title: "Placeholder ho so cho Axis 2/3",
    docType: "approval_placeholder",
    classification: "INTERNAL",
    version: "v1",
    status: "draft",
    ownerId: "pm-01",
    approvalStatus: "not_submitted",
    createdAt: isoOffset(-8),
    updatedAt: isoOffset(-1)
  }
);

const documentVersions = documents.map((document) => ({
  id: `${document.id}-version-${document.version}`,
  documentId: document.id,
  version: document.version,
  fileUrl: document.fileUrl,
  externalUrl: document.externalUrl,
  uploadedBy: document.ownerId,
  uploadedAt: document.updatedAt,
  notes: `Trạng thái: ${document.status}; phê duyệt: ${document.approvalStatus}`
}));

const documentRequirements = [
  {
    id: "req-lowrise-land",
    projectType: projects[0].projectType,
    requirementCode: "LOWRISE-LAND",
    requirementName: "Hồ sơ pháp lý quỹ đất",
    docType: "land_record",
    requiredPhase: "Chuẩn bị pháp lý",
    legalStepCode: "land_survey",
    isRequired: true,
    orderIndex: 1
  },
  {
    id: "req-lowrise-investment-proposal",
    projectType: projects[0].projectType,
    requirementCode: "LOWRISE-INVESTMENT-PROPOSAL",
    requirementName: "Hồ sơ đề xuất đầu tư",
    docType: "legal_submission",
    requiredPhase: "Chủ trương đầu tư",
    legalStepCode: "investment_proposal",
    isRequired: true,
    orderIndex: 2
  },
  {
    id: "req-lowrise-basic-design",
    projectType: projects[0].projectType,
    requirementCode: "LOWRISE-BASIC-DESIGN",
    requirementName: "Bản vẽ thiết kế cơ sở",
    docType: "design_drawing",
    requiredPhase: "Thiết kế cơ sở",
    legalStepCode: "basic_design",
    isRequired: true,
    orderIndex: 3
  },
  {
    id: "req-lowrise-construction-permit",
    projectType: projects[0].projectType,
    requirementCode: "LOWRISE-CONSTRUCTION-PERMIT",
    requirementName: "Giấy phép xây dựng",
    docType: "construction_permit",
    requiredPhase: "Cấp phép xây dựng",
    legalStepCode: "construction_permit",
    isRequired: true,
    orderIndex: 4
  },
  {
    id: "req-midrise-land",
    projectType: projects[1].projectType,
    requirementCode: "MIDRISE-LAND",
    requirementName: "Hồ sơ pháp lý quỹ đất",
    docType: "land_record",
    requiredPhase: "Chuẩn bị pháp lý",
    legalStepCode: "land_survey",
    isRequired: true,
    orderIndex: 1
  },
  {
    id: "req-midrise-environment",
    projectType: projects[1].projectType,
    requirementCode: "MIDRISE-ENVIRONMENT",
    requirementName: "Hồ sơ môi trường",
    docType: "legal_submission",
    requiredPhase: "Thẩm định môi trường",
    legalStepCode: "environmental_approval",
    isRequired: true,
    orderIndex: 2
  },
  {
    id: "req-default-contract",
    projectType: "default",
    requirementCode: "DEFAULT-CONTRACT",
    requirementName: "Hợp đồng và phụ lục liên quan",
    docType: "contract",
    requiredPhase: "Quản trị dự án",
    isRequired: true,
    orderIndex: 90
  },
  {
    id: "req-default-acceptance",
    projectType: "default",
    requirementCode: "DEFAULT-ACCEPTANCE",
    requirementName: "Biên bản nghiệm thu",
    docType: "acceptance_record",
    requiredPhase: "Nghiệm thu",
    isRequired: false,
    orderIndex: 100
  }
].map((requirement) => ({ ...requirement, createdAt: isoOffset(-10), updatedAt: isoOffset(-1) }));

const meetings = [
  {
    id: "demo-meeting-riverside-weekly",
    projectId: "demo-project-riverside",
    title: "Họp điều phối Riverside tuần này",
    meetingDate: isoOffset(-1),
    summary:
      "Rà soát tiến độ pháp lý, hồ sơ thiết kế cơ sở và gói thi công hàng rào. Các điểm cần xử lý được tách thành action item để theo dõi.",
    createdBy: "assistant-01"
  },
  {
    id: "demo-meeting-garden-kickoff",
    projectId: "demo-project-garden",
    title: "Kickoff khảo sát GreenNest Garden",
    meetingDate: isoOffset(-3),
    summary: "Thống nhất phạm vi khảo sát hiện trạng, hồ sơ quỹ đất và đầu mối phối hợp ban đầu.",
    createdBy: "pm-01"
  }
].map((meeting) => ({ ...meeting, createdAt: isoOffset(-4), updatedAt: isoOffset(-1) }));

const riversideWeeklyMeeting = meetings.find((meeting) => meeting.id === "demo-meeting-riverside-weekly");
if (riversideWeeklyMeeting) {
  Object.assign(riversideWeeklyMeeting, {
    organizationId: acceptanceFixture.organizationId,
    projectIds: ["demo-project-riverside"],
    axisId: "axis-1",
    meetingType: "EXECUTIVE_OPERATIONAL_MEETING",
    visibility: "executive",
    participantScope: "project_team",
    status: "FOLLOW_UP_PENDING",
    startTime: isoOffset(-1),
    hostId: "ceo-01",
    participants: ["ceo-01", "project-director-01", "assistant-01", "legal-manager", "finance-manager-01"],
    externalParticipants: [],
    agenda: "Review phap ly, finance-sensitive budget va action item Module 1.",
    meetingMinutes: "Draft minutes: can bo sung ho so phap ly, cap nhat ngan sach va theo doi approval qua han.",
    aiSummary: {
      status: "DRAFT",
      content: "AI draft: Riverside co risk phap ly va mot approval dang qua han can executive follow-up."
    },
    followUpActions: [
      {
        id: "follow-up-riverside-legal",
        title: "Theo doi bo sung ho so phap ly",
        ownerId: "assistant-01",
        dueDate: dateOffset(1),
        relatedTaskId: "demo-task-follow-up-riverside",
        status: "open"
      }
    ],
    decisions: [
      {
        id: "decision-track-riverside-follow-up",
        decisionText: "Tach follow-up thanh task va bao cao CEO truoc buoi hop sau.",
        ownerId: "assistant-01",
        dueDate: dateOffset(1),
        status: "open",
        relatedTaskId: "demo-task-follow-up-riverside"
      }
    ],
    relatedApprovals: ["proposal-demo-overdue-approval"],
    relatedTasks: ["demo-task-follow-up-riverside"],
    auditLog: [
      {
        id: "audit-meeting-riverside-ai-draft",
        actorId: "assistant-01",
        action: "ai_summary.draft",
        createdAt: isoOffset(-1),
        note: "Demo-only AI summary draft."
      }
    ]
  });
}

const gardenKickoffMeeting = meetings.find((meeting) => meeting.id === "demo-meeting-garden-kickoff");
if (gardenKickoffMeeting) {
  Object.assign(gardenKickoffMeeting, {
    organizationId: acceptanceFixture.organizationId,
    projectIds: ["demo-project-garden"],
    axisId: "axis-1",
    departmentId: "legal",
    meetingType: "DEPARTMENT_INTERNAL_MEETING",
    visibility: "department",
    participantScope: "department",
    status: "COMPLETED",
    startTime: isoOffset(-3),
    hostId: "department-head-01",
    participants: ["department-head-01", "legal-manager", "viewer-01"],
    externalParticipants: [],
    agenda: "Khoi dong scope Garden va xac nhan ho so con thieu.",
    meetingMinutes: "Draft minutes: Garden co ho so dat missing va risk phap ly can xu ly.",
    aiSummary: { status: "DRAFT", content: "Garden can bo sung tai lieu phap ly quy dat." },
    followUpActions: [],
    decisions: [],
    relatedApprovals: [],
    relatedTasks: ["demo-task-team"],
    auditLog: []
  });
}

meetings.push({
  id: "demo-meeting-axis23-approval-placeholder",
  organizationId: acceptanceFixture.organizationId,
  projectId: "demo-project-axis23-lab",
  projectIds: ["demo-project-axis23-lab"],
  axisId: "axis-2",
  title: "Approval Center Axis 2/3 placeholder",
  meetingType: "PROJECT_MEETING",
  visibility: "project",
  participantScope: "project_team",
  status: "SCHEDULED",
  meetingDate: isoOffset(2),
  startTime: isoOffset(2),
  hostId: "pm-01",
  participants: ["pm-01", "assistant-01"],
  externalParticipants: [],
  agenda: "Placeholder cho Approval Center Axis 2/3.",
  attachments: [],
  aiSummary: { status: "DRAFT" },
  decisions: [],
  followUpActions: [],
  relatedApprovals: ["proposal-axis-2-placeholder", "proposal-axis-3-placeholder"],
  relatedTasks: ["demo-task-axis23-placeholder"],
  auditLog: [],
  summary: "Meeting placeholder cho module sau.",
  createdBy: "pm-01",
  createdAt: isoOffset(-2),
  updatedAt: isoOffset(-1)
});

const decisions = [
  {
    id: "demo-decision-riverside-legal",
    meetingId: "demo-meeting-riverside-weekly",
    projectId: "demo-project-riverside",
    decisionText: "Legal bổ sung hồ sơ chủ trương đầu tư theo phản hồi mới.",
    ownerId: "legal-manager",
    dueDate: dateOffset(2),
    status: "open"
  },
  {
    id: "demo-decision-riverside-contractor",
    meetingId: "demo-meeting-riverside-weekly",
    projectId: "demo-project-riverside",
    decisionText: "Nhà thầu cập nhật lại biện pháp thi công hàng rào.",
    ownerId: "contractor-01",
    dueDate: dateOffset(4),
    status: "in_progress",
    taskId: "demo-task-contractor-package"
  },
  {
    id: "demo-decision-garden-survey",
    meetingId: "demo-meeting-garden-kickoff",
    projectId: "demo-project-garden",
    decisionText: "Tổ trưởng hoàn tất ảnh hiện trạng và ranh đất.",
    ownerId: "department-head-01",
    dueDate: dateOffset(5),
    status: "open"
  }
].map((decision) => ({ ...decision, createdAt: isoOffset(-3), updatedAt: isoOffset(-1) }));

decisions.push({
  id: "demo-decision-riverside-follow-up",
  meetingId: "demo-meeting-riverside-weekly",
  projectId: "demo-project-riverside",
  decisionText: "Thu ky theo doi action item va cap nhat trang thai truoc buoi hop tiep theo.",
  ownerId: "assistant-01",
  dueDate: dateOffset(1),
  status: "open",
  taskId: "demo-task-follow-up-riverside",
  createdAt: isoOffset(-2),
  updatedAt: isoOffset(-1)
});

function isTaskDone(task) {
  return task.status === "done";
}

function isTaskOverdue(task) {
  return Boolean(task.dueDate) && task.dueDate < today && !isTaskDone(task);
}

function isTaskUpcoming(task) {
  if (!task.dueDate || isTaskDone(task)) {
    return false;
  }

  const due = new Date(`${task.dueDate}T00:00:00.000Z`);
  const current = new Date(`${today}T00:00:00.000Z`);
  const diffDays = Math.ceil((due.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 7;
}

function readinessItemStatus(requirement, matchingDocuments) {
  if (matchingDocuments.some((document) => document.status === "complete" && document.approvalStatus === "approved")) {
    return "complete";
  }

  if (matchingDocuments.some((document) => document.status === "needs_update" || document.approvalStatus === "rejected")) {
    return "needs_update";
  }

  if (matchingDocuments.length > 0) {
    return "submitted";
  }

  return requirement.isRequired ? "missing" : "optional_missing";
}

function buildReadiness(project, projectDocuments, projectLegalSteps) {
  const legalStepByCode = new Map(projectLegalSteps.map((step) => [step.stepCode, step.stepName]));
  const requirements = documentRequirements
    .filter((requirement) => requirement.projectType === "default" || requirement.projectType === project.projectType)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const items = requirements.map((requirement) => {
    const matchingDocuments = projectDocuments.filter((document) => document.docType === requirement.docType);

    return {
      requirement,
      matchingDocuments,
      status: readinessItemStatus(requirement, matchingDocuments),
      relatedLegalStepName: requirement.legalStepCode ? legalStepByCode.get(requirement.legalStepCode) : undefined
    };
  });
  const requiredItems = items.filter((item) => item.requirement.isRequired);
  const completedRequiredCount = requiredItems.filter((item) => item.status === "complete").length;

  return {
    projectId: project.id,
    projectType: project.projectType,
    requiredCount: requiredItems.length,
    completedRequiredCount,
    submittedRequiredCount: requiredItems.filter((item) => item.matchingDocuments.length > 0).length,
    missingRequirements: requiredItems.filter((item) => item.status === "missing"),
    needsUpdateRequirements: requiredItems.filter((item) => item.status === "needs_update"),
    items,
    completionRatio: requiredItems.length > 0 ? Math.round((completedRequiredCount / requiredItems.length) * 100) : 0
  };
}

function buildDemoReport(project) {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const projectDocuments = documents.filter((document) => document.projectId === project.id);
  const projectLegalSteps = legalSteps.filter((step) => step.projectId === project.id);
  const projectMeetings = meetings.filter((meeting) => meeting.projectId === project.id);
  const projectDecisions = decisions.filter((decision) => decision.projectId === project.id);
  const readiness = buildReadiness(project, projectDocuments, projectLegalSteps);
  const overdueTasks = projectTasks.filter(isTaskOverdue);
  const upcomingTasks = projectTasks.filter(isTaskUpcoming);
  const blockedLegalSteps = projectLegalSteps.filter((step) => step.status === "blocked");
  const waitingAuthorityLegalSteps = projectLegalSteps.filter((step) => step.status === "waiting_authority");
  const rejectedOrNeedsUpdateRecords = projectDocuments
    .filter((document) => document.status === "missing" || document.status === "needs_update" || document.approvalStatus === "rejected")
    .map((document) => ({
      id: document.id,
      title: document.title,
      docType: document.docType,
      status: document.status,
      approvalStatus: document.approvalStatus,
      ownerId: document.ownerId,
      version: document.version
    }));

  return {
    id: "demo-report-riverside-weekly",
    projectId: project.id,
    reportType: "weekly_project_summary",
    title: `Báo cáo tuần - ${project.name} - ${today}`,
    generatedBy: "assistant-01",
    generatedAt: isoOffset(0),
    snapshot: {
      project,
      summary: {
        totalTasks: projectTasks.length,
        overdueTasks: overdueTasks.length,
        upcomingTasks: upcomingTasks.length,
        missingDocuments: readiness.missingRequirements.length,
        needsUpdateDocuments: readiness.needsUpdateRequirements.length,
        rejectedDocuments: projectDocuments.filter((document) => document.approvalStatus === "rejected").length,
        documentReadinessRatio: readiness.completionRatio,
        blockedLegalSteps: blockedLegalSteps.length,
        waitingAuthorityLegalSteps: waitingAuthorityLegalSteps.length,
        meetings: projectMeetings.length,
        pendingDecisions: projectDecisions.filter((decision) => decision.status !== "done" && decision.status !== "cancelled").length
      },
      tasks: {
        overdue: overdueTasks,
        upcoming: upcomingTasks
      },
      documents: {
        missing: readiness.missingRequirements,
        needsUpdate: readiness.needsUpdateRequirements,
        rejectedOrNeedsUpdateRecords,
        readiness
      },
      legal: {
        blocked: blockedLegalSteps,
        waitingAuthority: waitingAuthorityLegalSteps
      },
      meetings: projectMeetings.map((meeting) => ({
        ...meeting,
        decisions: projectDecisions.filter((decision) => decision.meetingId === meeting.id)
      })),
      generatedFrom: {
        taskCount: projectTasks.length,
        documentCount: projectDocuments.length,
        legalStepCount: projectLegalSteps.length,
        meetingCount: projectMeetings.length,
        decisionCount: projectDecisions.length
      }
    }
  };
}

const reports = [buildDemoReport(projects[0])];

const projectMemberships = [
  { id: "membership-riverside-executive", projectId: "demo-project-riverside", userId: "executive-01", role: "pho_tong_giam_doc" },
  { id: "membership-riverside-director", projectId: "demo-project-riverside", userId: "project-director-01", role: "giam_doc_du_an" },
  { id: "membership-riverside-pm", projectId: "demo-project-riverside", userId: "pm-01", role: "quan_ly_du_an" },
  { id: "membership-riverside-legal", projectId: "demo-project-riverside", userId: "legal-manager", role: "phap_ly" },
  { id: "membership-riverside-design", projectId: "demo-project-riverside", userId: "designer", role: "thiet_ke" },
  { id: "membership-riverside-accounting", projectId: "demo-project-riverside", userId: "accountant", role: "ke_toan" },
  { id: "membership-riverside-technical", projectId: "demo-project-riverside", userId: "technical-01", role: "ky_thuat" },
  { id: "membership-riverside-construction", projectId: "demo-project-riverside", userId: "construction-01", role: "thi_cong" },
  { id: "membership-riverside-assistant", projectId: "demo-project-riverside", userId: "assistant-01", role: "thu_ky_tro_ly" },
  { id: "membership-riverside-contractor", projectId: "demo-project-riverside", userId: "contractor-01", role: "nha_thau" },
  { id: "membership-riverside-consultant", projectId: "demo-project-riverside", userId: "consultant-01", role: "tu_van" },
  { id: "membership-garden-lead", projectId: "demo-project-garden", userId: "department-head-01", role: "to_truong" },
  { id: "membership-garden-viewer", projectId: "demo-project-garden", userId: "viewer-01", role: "viewer" },
  { id: "membership-skyline-ceo", projectId: "demo-project-skyline", userId: "ceo-01", role: "tong_giam_doc" },
  { id: "membership-axis23-pm", projectId: "demo-project-axis23-lab", userId: "pm-01", role: "quan_ly_du_an" }
].map((membership) => ({ ...membership, createdAt: isoOffset(-12), updatedAt: isoOffset(-1) }));

const knowledgeItems = [
  {
    id: "knowledge-legal-land-law",
    title: "Luật Đất đai 2024 - ghi chú điều kiện pháp lý dự án nhà ở",
    sourceUrl: "https://example.com/legal/luat-dat-dai-2024",
    sourceType: "law",
    module: "legal",
    jurisdiction: "Việt Nam",
    effectiveDate: "2025-01-01",
    status: "approved",
    confidence: "official",
    tags: ["pháp lý", "đất đai", "dự án nhà ở"],
    summary: "Nguồn chuẩn để đối chiếu điều kiện pháp lý đất đai ở giai đoạn chuẩn bị dự án.",
    notes: "Demo seed, cần thay bằng nguồn chính thức trước khi dùng sản xuất.",
    createdBy: "legal-manager",
    reviewedBy: "legal-manager",
    approvedBy: "project-director-01",
    reviewedAt: isoOffset(-8),
    approvedAt: isoOffset(-7),
    isRagEligible: true
  },
  {
    id: "knowledge-design-checklist",
    title: "Checklist review thiết kế cơ sở GreenNest",
    sourceType: "template",
    module: "design",
    status: "pending_review",
    confidence: "internal_approved",
    tags: ["thiết kế", "review", "template"],
    summary: "Mẫu kiểm tra xung đột bản vẽ thiết kế cơ sở trước khi gửi phê duyệt.",
    createdBy: "designer",
    isRagEligible: false
  },
  {
    id: "knowledge-construction-site-diary",
    title: "Quy định cập nhật nhật ký công trường",
    sourceType: "policy",
    module: "construction",
    status: "approved",
    confidence: "internal_approved",
    tags: ["thi công", "nhật ký", "hiện trường"],
    summary: "Hướng dẫn nội bộ về tần suất, bằng chứng ảnh và trách nhiệm cập nhật nhật ký.",
    createdBy: "construction-01",
    reviewedBy: "technical-01",
    approvedBy: "project-director-01",
    reviewedAt: isoOffset(-10),
    approvedAt: isoOffset(-9),
    isRagEligible: true
  },
  {
    id: "knowledge-finance-payment-rule",
    title: "Nguyên tắc kiểm tra hồ sơ thanh toán nhà thầu",
    sourceType: "internal_note",
    module: "finance",
    status: "imported",
    confidence: "internal_approved",
    tags: ["tài chính", "thanh toán", "nhà thầu"],
    summary: "Tập hợp điều kiện cần kiểm tra trước khi chuyển hồ sơ sang bước duyệt chi.",
    createdBy: "accountant",
    isRagEligible: false
  },
  {
    id: "knowledge-document-storage-plan",
    title: "Kế hoạch lưu trữ hồ sơ dự án trên Supabase Storage",
    sourceType: "policy",
    module: "documents",
    status: "approved",
    confidence: "internal_approved",
    tags: ["hồ sơ", "storage", "supabase"],
    summary: "Quy ước bucket, đường dẫn và trách nhiệm kiểm soát phiên bản hồ sơ.",
    createdBy: "assistant-01",
    reviewedBy: "pm-01",
    approvedBy: "project-director-01",
    reviewedAt: isoOffset(-6),
    approvedAt: isoOffset(-5),
    isRagEligible: true
  },
  {
    id: "knowledge-report-weekly-template",
    title: "Mẫu cấu trúc báo cáo tuần dự án",
    sourceType: "template",
    module: "reports",
    status: "rejected",
    confidence: "internal_approved",
    tags: ["báo cáo", "tuần", "template"],
    summary: "Mẫu báo cáo cần chỉnh lại phần rủi ro và quyết định tồn đọng.",
    notes: "Bị từ chối vì thiếu phần quyết định/action item từ họp.",
    createdBy: "assistant-01",
    reviewedBy: "executive-01",
    reviewedAt: isoOffset(-2),
    isRagEligible: false
  }
].map((item) => ({ ...item, createdAt: isoOffset(-14), updatedAt: isoOffset(-1) }));

const knowledgeCandidates = [
  {
    id: "candidate-meeting-riverside-action",
    sourceType: "meeting",
    sourceRefId: "demo-meeting-riverside-weekly",
    module: "meetings",
    title: "Action item tá»« há»p Riverside cáº§n chuáº©n hoÃ¡ thÃ nh SOP",
    extractedText:
      "Cuá»™c há»p ghi nháº­n nhu cáº§u chuáº©n hoÃ¡ quy trÃ¬nh tÃ¡ch action item thÃ nh task vÃ  theo dÃµi ngÆ°á»i phá»¥ trÃ¡ch, deadline, tráº¡ng thÃ¡i.",
    submittedBy: "assistant-01",
    status: "candidate",
    notes: "Demo candidate: chÆ°a pháº£i tri thá»©c Ä‘Æ°á»£c duyá»‡t, khÃ´ng Ä‘Æ°á»£c index RAG.",
    createdAt: isoOffset(-2),
    updatedAt: isoOffset(-2)
  },
  {
    id: "candidate-web-legal-check",
    sourceType: "web_search",
    sourceRefId: "mock-search-legal-001",
    module: "legal",
    title: "Nguá»“n web search vá» há»“ sÆ¡ phÃ¡p lÃ½ cáº§n review",
    extractedText:
      "Káº¿t quáº£ search demo gợi ý cáº§n kiá»ƒm tra thÃªm thÃ nh pháº§n há»“ sÆ¡ phÃ¡p lÃ½ theo loáº¡i dá»± Ã¡n. Nguá»“n nÃ y pháº£i Ä‘Æ°á»£c pháº¡m vi hoÃ¡ vÃ  review trÆ°á»›c khi thÃ nh Knowledge Item.",
    submittedBy: "legal-manager",
    status: "pending_review",
    notes: "Demo web-search candidate, chÆ°a Ä‘Æ°á»£c coi lÃ  authoritative knowledge.",
    createdAt: isoOffset(-1),
    updatedAt: isoOffset(-1)
  },
  {
    id: "candidate-document-storage-note",
    sourceType: "document",
    sourceRefId: "demo-project-riverside-doc-basic-design",
    module: "documents",
    title: "Ghi chÃº upload/version tÆ° há»“ sÆ¡ thiáº¿t káº¿",
    extractedText:
      "Há»“ sÆ¡ thiáº¿t káº¿ cáº§n giá»¯ phiÃªn báº£n, ngÆ°á»i upload, reviewer vÃ  ghi chÃº phÃª duyá»‡t Ä‘á»ƒ truy váº¿t. Candidate nÃ y cáº§n PM review trÆ°á»›c khi promote.",
    submittedBy: "designer",
    status: "rejected",
    reviewedBy: "pm-01",
    reviewedAt: isoOffset(-1),
    notes: "Tá»« chá»‘i demo vÃ¬ trÃ¹ng vá»›i knowledge-document-storage-plan.",
    createdAt: isoOffset(-3),
    updatedAt: isoOffset(-1)
  }
];

function resolveKnowledgeAccessLevel(sourceType) {
  if (["law", "standard", "market"].includes(sourceType)) {
    return "public_read";
  }

  if (["template", "technical_guideline"].includes(sourceType)) {
    return "external_limited";
  }

  return "internal";
}

const knowledgeChunks = knowledgeItems
  .filter((item) => item.status === "approved" && item.isRagEligible)
  .flatMap((item) => {
    const chunkText = [
      `Tiêu đề: ${item.title}`,
      item.summary ? `Tóm tắt: ${item.summary}` : undefined,
      item.notes ? `Ghi chú: ${item.notes}` : undefined,
      item.jurisdiction ? `Phạm vi áp dụng: ${item.jurisdiction}` : undefined,
      item.tags?.length ? `Tags: ${item.tags.join(", ")}` : undefined
    ]
      .filter(Boolean)
      .join("\n\n");

    return [
      {
        id: `${item.id}-chunk-001`,
        knowledgeItemId: item.id,
        module: item.module,
        chunkText,
        chunkOrder: 0,
        sourceType: item.sourceType,
        status: item.status,
        effectiveDate: item.effectiveDate,
        expiresAt: item.expiryDate,
        accessLevel: resolveKnowledgeAccessLevel(item.sourceType),
        citation: {
          knowledgeItemId: item.id,
          knowledgeTitle: item.title,
          sourceUrl: item.sourceUrl,
          sourceFileId: item.sourceFileId,
          sourceType: item.sourceType,
          module: item.module,
          jurisdiction: item.jurisdiction,
          effectiveDate: item.effectiveDate,
          expiresAt: item.expiryDate
        },
        createdAt: isoOffset(-1),
        updatedAt: isoOffset(-1)
      }
    ];
  });

const sourceRegistryEntries = [
  {
    id: "source-registry-default-1",
    domain: "chinhphu.vn",
    sourceCategory: "government",
    module: "legal",
    sourceType: "law",
    confidence: "official",
    tags: ["phap-ly", "chinh-phu"],
    enabled: true,
    notes: "Default official government source.",
    createdAt: isoOffset(-14),
    updatedAt: isoOffset(-1)
  },
  {
    id: "source-registry-default-2",
    domain: "moc.gov.vn",
    sourceCategory: "government",
    module: "construction",
    sourceType: "standard",
    confidence: "official",
    tags: ["xay-dung", "quy-chuan"],
    enabled: true,
    notes: "Default construction ministry source.",
    createdAt: isoOffset(-14),
    updatedAt: isoOffset(-1)
  },
  {
    id: "source-registry-default-3",
    domain: "monre.gov.vn",
    sourceCategory: "government",
    module: "legal",
    sourceType: "law",
    confidence: "official",
    tags: ["dat-dai", "moi-truong"],
    enabled: true,
    notes: "Default land and environment source.",
    createdAt: isoOffset(-14),
    updatedAt: isoOffset(-1)
  },
  {
    id: "source-registry-default-4",
    domain: "greennest.local",
    sourceCategory: "internal",
    module: "documents",
    sourceType: "policy",
    confidence: "internal_approved",
    tags: ["noi-bo"],
    enabled: true,
    notes: "Default internal approved source.",
    createdAt: isoOffset(-14),
    updatedAt: isoOffset(-1)
  },
  {
    id: "source-registry-default-5",
    domain: "example.com",
    sourceCategory: "reference",
    module: "general",
    sourceType: "internal_note",
    confidence: "external_reference",
    tags: ["demo"],
    enabled: true,
    notes: "Default demo source.",
    createdAt: isoOffset(-14),
    updatedAt: isoOffset(-1)
  }
];

const knowledgeDiscoveryTopics = [
  {
    id: "discovery-topic-legal-weekly",
    module: "legal",
    query: "cap nhat quy dinh phap ly du an nha o",
    enabled: true,
    frequency: "weekly",
    ownerId: "legal-manager",
    reviewerId: "legal-manager",
    lastRunAt: isoOffset(-1),
    lastRunStatus: "partial",
    retryCount: 0,
    maxRetries: 3,
    createdBy: "mock-founder",
    updatedBy: "legal-manager",
    createdAt: isoOffset(-7),
    updatedAt: isoOffset(-1)
  },
  {
    id: "discovery-topic-construction-manual",
    module: "construction",
    query: "quy chuan xay dung thiet ke nha o",
    enabled: true,
    frequency: "manual",
    ownerId: "technical-01",
    reviewerId: "technical-01",
    lastRunStatus: "never_run",
    retryCount: 0,
    maxRetries: 3,
    createdBy: "mock-founder",
    updatedBy: "technical-01",
    createdAt: isoOffset(-4),
    updatedAt: isoOffset(-1)
  }
];

const knowledgeDiscoveryRunLogs = [
  {
    id: "discovery-run-legal-demo",
    topicId: "discovery-topic-legal-weekly",
    runBy: "legal-manager",
    query: "cap nhat quy dinh phap ly du an nha o",
    provider: "mock_web",
    providerMetadata: {
      provider: "mock_web",
      maxResults: 4,
      timeoutMs: 12000
    },
    status: "partial",
    resultCount: 4,
    importedCount: 1,
    skippedDuplicateCount: 1,
    skippedDisallowedCount: 2,
    retryCount: 0,
    maxRetries: 3,
    startedAt: isoOffset(-1),
    finishedAt: isoOffset(-1)
  }
];

const auditLogs = [
  {
    id: "audit-demo-seed",
    actorId: "mock-founder",
    entityType: "demo_seed",
    entityId: "sprint-8",
    action: "demo.seed",
    newValue: { seededAt: today },
    createdAt: isoOffset(0)
  }
];

const proposals = [
  {
    id: "proposal-demo-investment-01",
    code: "DX-INVESTMENT-DEMO",
    title: "De xuat danh gia co hoi GreenNest Riverside giai doan 2",
    type: "investment",
    projectId: "demo-project-riverside",
    module: "investment",
    requestedBy: "investment-01",
    ownerId: "finance-manager-01",
    status: "in_review",
    priority: "high",
    amount: 250000000,
    summary: "Can review so bo ve hieu qua dau tu, phap ly va nguon von truoc khi trinh ban dieu hanh.",
    aiReviewStatus: "not_checked",
    currentStepId: "proposal-step-demo-investment-01",
    createdAt: isoOffset(-2),
    updatedAt: isoOffset(-1)
  },
  {
    id: "proposal-demo-contract-01",
    code: "DX-CONTRACT-DEMO",
    title: "De xuat phu luc hop dong tu van thiet ke",
    type: "contract",
    projectId: "demo-project-riverside",
    module: "contract",
    requestedBy: "contract-manager-01",
    ownerId: "pm-01",
    status: "draft",
    priority: "normal",
    summary: "Bo sung pham vi review ban ve va thoi han ban giao ho so.",
    aiReviewStatus: "not_checked",
    createdAt: isoOffset(-1),
    updatedAt: isoOffset(-1)
  }
];

proposals.push(
  {
    id: "proposal-demo-overdue-approval",
    code: "DX-OVERDUE-DEMO",
    title: "De xuat phe duyet ngan sach bo sung Riverside qua han",
    type: "finance",
    projectId: "demo-project-riverside",
    module: "finance",
    requestedBy: "finance-manager-01",
    submittedBy: "finance-manager-01",
    ownerId: "ceo-01",
    status: "in_review",
    priority: "urgent",
    amount: 2100000000,
    dueDate: dateOffset(-2),
    summary: "Approval qua han de verify queue, escalation va finance visibility.",
    aiReviewStatus: "warning",
    aiReviewSummary: "Vuot nguong 2 ty, can Chu tich phe duyet.",
    currentStepId: "proposal-step-demo-overdue-approval",
    createdAt: isoOffset(-5),
    updatedAt: isoOffset(-1)
  },
  {
    id: "proposal-axis-2-placeholder",
    code: "DX-AXIS2-DEMO",
    title: "Placeholder approval Axis 2",
    type: "general",
    projectId: "demo-project-axis23-lab",
    module: "axis-2",
    requestedBy: "pm-01",
    submittedBy: "pm-01",
    ownerId: "executive-01",
    status: "draft",
    priority: "normal",
    amount: 10000000,
    summary: "Fixture placeholder cho Approval Center Axis 2.",
    aiReviewStatus: "not_checked",
    createdAt: isoOffset(-3),
    updatedAt: isoOffset(-1)
  },
  {
    id: "proposal-axis-3-placeholder",
    code: "DX-AXIS3-DEMO",
    title: "Placeholder approval Axis 3",
    type: "general",
    projectId: "demo-project-axis23-lab",
    module: "axis-3",
    requestedBy: "pm-01",
    submittedBy: "pm-01",
    ownerId: "executive-01",
    status: "draft",
    priority: "normal",
    amount: 15000000,
    summary: "Fixture placeholder cho Approval Center Axis 3.",
    aiReviewStatus: "not_checked",
    createdAt: isoOffset(-3),
    updatedAt: isoOffset(-1)
  },
  {
    id: "proposal-demo-on-behalf-ceo",
    code: "DX-ONBEHALF-DEMO",
    title: "Thu ky tao de xuat thay CEO trong scope Riverside",
    type: "general",
    projectId: "demo-project-riverside",
    module: "proposal",
    requestedBy: "ceo-01",
    submittedBy: "assistant-01",
    onBehalfOf: "ceo-01",
    delegationId: "delegation-assistant-ceo-riverside-proposal-create",
    ownerId: "ceo-01",
    status: "draft",
    priority: "high",
    amount: 18000000,
    summary: "Fixture positive delegation: assistant duoc tao proposal thay CEO nhung khong duoc approve.",
    aiReviewStatus: "not_checked",
    createdAt: isoOffset(-2),
    updatedAt: isoOffset(-1)
  }
);

const proposalSteps = [
  {
    id: "proposal-step-demo-investment-01",
    proposalId: "proposal-demo-investment-01",
    stepOrder: 1,
    approverRole: "quan_ly_du_an",
    status: "in_review",
    createdAt: isoOffset(-1),
    updatedAt: isoOffset(-1)
  }
];

proposalSteps.push({
  id: "proposal-step-demo-overdue-approval",
  proposalId: "proposal-demo-overdue-approval",
  stepOrder: 1,
  approverRole: "chu_tich",
  requiredPermission: "proposal.approve",
  thresholdPolicyId: "policy-approval-over-2b",
  thresholdLabel: "Tren 2 ty",
  approvalLevel: "CHAIRMAN",
  status: "in_review",
  createdAt: isoOffset(-4),
  updatedAt: isoOffset(-1)
});

const proposalLinks = [
  {
    id: "proposal-link-demo-investment-01",
    proposalId: "proposal-demo-investment-01",
    entityType: "project",
    entityId: "demo-project-riverside",
    relationType: "source",
    createdAt: isoOffset(-2)
  }
];

proposalLinks.push(
  {
    id: "proposal-link-demo-overdue-approval-budget",
    proposalId: "proposal-demo-overdue-approval",
    entityType: "document",
    entityId: "demo-project-riverside-doc-finance-confidential",
    relationType: "evidence",
    createdAt: isoOffset(-4)
  },
  {
    id: "proposal-link-on-behalf-delegation",
    proposalId: "proposal-demo-on-behalf-ceo",
    entityType: "delegation",
    entityId: "delegation-assistant-ceo-riverside-proposal-create",
    relationType: "source",
    createdAt: isoOffset(-2)
  }
);

const proposalDecisions = [
  {
    id: "proposal-decision-demo-investment-01",
    proposalId: "proposal-demo-investment-01",
    decision: "submitted",
    decidedBy: "investment-01",
    decidedAt: isoOffset(-1),
    notes: "Trinh review dau tu demo."
  }
];

proposalDecisions.push(
  {
    id: "proposal-decision-demo-overdue-submitted",
    proposalId: "proposal-demo-overdue-approval",
    stepId: "proposal-step-demo-overdue-approval",
    decision: "submitted",
    decidedBy: "finance-manager-01",
    decidedAt: isoOffset(-4),
    notes: "Trinh approval qua han de demo escalation."
  },
  {
    id: "proposal-decision-on-behalf-draft",
    proposalId: "proposal-demo-on-behalf-ceo",
    decision: "submitted",
    decidedBy: "assistant-01",
    decidedAt: isoOffset(-2),
    notes: "Demo on-behalf proposal create/submit by assistant."
  }
);

function withAuditTimestamps(item, createdOffset = -20) {
  return {
    ...item,
    createdAt: item.createdAt ?? isoOffset(createdOffset),
    updatedAt: item.updatedAt ?? isoOffset(-1),
    createdBy: item.createdBy ?? "mock-founder",
    updatedBy: item.updatedBy ?? "mock-founder"
  };
}

const rolePermissionCatalog = {
  roles: acceptanceFixture.rolePermissionCatalog.roles.map((role) => ({
    ...role,
    active: true,
    createdAt: isoOffset(-20),
    updatedAt: isoOffset(-1),
    updatedBy: "mock-founder"
  })),
  permissions: acceptanceFixture.rolePermissionCatalog.permissions
};

const scopeAssignments = acceptanceFixture.scopeAssignments.map((assignment) =>
  withAuditTimestamps(assignment)
);

const policySettings = {
  approvalThresholds: acceptanceFixture.policySettings.approvalThresholds.map((policy) =>
    withAuditTimestamps(policy)
  ),
  riskGroups: acceptanceFixture.policySettings.riskGroups.map((riskGroup) =>
    withAuditTimestamps(riskGroup)
  )
};

const leadershipDelegations = acceptanceFixture.leadershipDelegations.map((delegation) =>
  withAuditTimestamps(delegation, -10)
);

await mkdir(dataDir, { recursive: true });
await Promise.all([
  writeFile(path.join(dataDir, "role-permission-catalog.json"), `${JSON.stringify(rolePermissionCatalog, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "scope-assignments.json"), `${JSON.stringify({ assignments: scopeAssignments }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "policy-settings.json"), `${JSON.stringify(policySettings, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "leadership-delegations.json"), `${JSON.stringify({ delegations: leadershipDelegations }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "project-core.json"), `${JSON.stringify({ projects, legalSteps }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "task-management.json"), `${JSON.stringify({ tasks }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "document-center.json"), `${JSON.stringify({ documents, documentVersions }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "document-requirements.json"), `${JSON.stringify({ requirements: documentRequirements }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "meetings-decisions.json"), `${JSON.stringify({ meetings, decisions }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "reports.json"), `${JSON.stringify({ reports }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "knowledge-center.json"), `${JSON.stringify({ items: knowledgeItems, chunks: knowledgeChunks }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "knowledge-candidates.json"), `${JSON.stringify({ candidates: knowledgeCandidates }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "source-registry-settings.json"), `${JSON.stringify({ entries: sourceRegistryEntries }, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "external-search-logs.json"), `${JSON.stringify({ logs: [] }, null, 2)}\n`, "utf8"),
  writeFile(
    path.join(dataDir, "knowledge-discovery.json"),
    `${JSON.stringify({ topics: knowledgeDiscoveryTopics, runLogs: knowledgeDiscoveryRunLogs }, null, 2)}\n`,
    "utf8"
  ),
	  writeFile(
	    path.join(dataDir, "ai-jobs.json"),
	    `${JSON.stringify({ interactions: [], jobs: [], citations: [], actionProposals: [] }, null, 2)}\n`,
	    "utf8"
	  ),
  writeFile(
    path.join(dataDir, "proposals.json"),
    `${JSON.stringify({ proposals, steps: proposalSteps, links: proposalLinks, decisions: proposalDecisions }, null, 2)}\n`,
    "utf8"
  ),
	  writeFile(path.join(dataDir, "users.json"), `${JSON.stringify({ users, projectMemberships, auditLogs }, null, 2)}\n`, "utf8")
	]);

console.log(`Seeded GreenNest BuildFlow demo data into ${dataDir}`);
