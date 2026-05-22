import { describe, expect, it } from "vitest";

import { DEFAULT_LEGAL_STEPS } from "@/constants/legal-steps";
import { ROLES } from "@/constants/roles";
import {
  DOCUMENT_APPROVAL_STATUSES,
  LEGAL_STATUSES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/constants/statuses";

const expectedRoleKeys = [
  "super_admin",
  "admin",
  "tong_giam_doc",
  "pho_tong_giam_doc",
  "giam_doc_du_an",
  "quan_ly_du_an",
  "to_truong",
  "phap_ly",
  "ke_toan",
  "thiet_ke",
  "ky_thuat",
  "thi_cong",
  "mua_hang",
  "dau_tu_phat_trien",
  "quan_ly_tai_chinh",
  "hanh_chinh_nhan_su",
  "qa_qc_chat_luong",
  "an_toan_lao_dong",
  "kiem_toan_noi_bo",
  "quan_ly_hop_dong",
  "thu_ky_tro_ly",
  "kiem_soat_noi_bo",
  "nha_thau",
  "tu_van",
  "viewer",
  "pending",
];

describe("foundation constants", () => {
  it("defines scalable roles, statuses, priorities and default legal steps", () => {
    expect(Object.keys(ROLES)).toEqual(expectedRoleKeys);
    expect(PROJECT_STATUSES.planning).toBe("Đang chuẩn bị");
    expect(TASK_STATUSES.blocked).toBe("Bị vướng");
    expect(TASK_PRIORITIES.urgent).toBe("Khẩn cấp");
    expect(LEGAL_STATUSES.waiting_authority).toBe("Chờ cơ quan");
    expect(DOCUMENT_APPROVAL_STATUSES.approved).toBe("Đã duyệt");
    expect(DEFAULT_LEGAL_STEPS).toHaveLength(12);
  });
});
