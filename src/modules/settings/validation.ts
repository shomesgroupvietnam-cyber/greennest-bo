import { z } from "zod";

import { PERMISSIONS } from "@/lib/permissions/can";
import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_MODULES,
  KNOWLEDGE_SOURCE_TYPES
} from "@/modules/knowledge/types";
import type { PermissionAction } from "@/lib/permissions/can";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const sourceRegistryEntryInputSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3, "Domain la bat buoc.")
    .transform((value) => value.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase()),
  sourceCategory: z.enum(["government", "standards", "internal", "market", "reference"]),
  module: z.enum(Object.keys(KNOWLEDGE_MODULES) as [keyof typeof KNOWLEDGE_MODULES, ...Array<keyof typeof KNOWLEDGE_MODULES>]),
  sourceType: z.enum(Object.keys(KNOWLEDGE_SOURCE_TYPES) as [keyof typeof KNOWLEDGE_SOURCE_TYPES, ...Array<keyof typeof KNOWLEDGE_SOURCE_TYPES>]),
  confidence: z.enum(
    Object.keys(KNOWLEDGE_CONFIDENCE_LEVELS) as [
      keyof typeof KNOWLEDGE_CONFIDENCE_LEVELS,
      ...Array<keyof typeof KNOWLEDGE_CONFIDENCE_LEVELS>
    ]
  ),
  tags: z.array(z.string().trim().min(1)).default([]),
  enabled: z.boolean().optional().default(true),
  notes: optionalText
});

const permissionValues = PERMISSIONS as readonly [
  PermissionAction,
  ...PermissionAction[],
];

export const roleScopeSchema = z.enum(["system", "project", "external"]);

export const roleTemplateKeySchema = z
  .string()
  .trim()
  .min(2, "Role key la bat buoc.")
  .max(64, "Role key qua dai.")
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Role key chi duoc gom chu thuong, so va dau gach duoi.",
  );

export const permissionActionSchema = z.enum(permissionValues);

export const roleTemplateInputSchema = z.object({
  key: roleTemplateKeySchema,
  labelVi: z.string().trim().min(1, "Ten role la bat buoc."),
  description: optionalText,
  scope: roleScopeSchema.default("system"),
  permissionKeys: z.array(permissionActionSchema).optional().default([]),
});

export const roleTemplateRenameInputSchema = z.object({
  roleKey: roleTemplateKeySchema,
  labelVi: z.string().trim().min(1, "Ten role la bat buoc."),
  description: optionalText,
});

export const roleTemplateActiveInputSchema = z.object({
  roleKey: roleTemplateKeySchema,
  active: z.boolean(),
});

export const rolePermissionMappingInputSchema = z.object({
  roleKey: roleTemplateKeySchema,
  permissionKeys: z.array(permissionActionSchema).default([]),
});

function scopeValueSchema(options: { allowWildcard?: boolean } = {}) {
  return z
  .string()
  .trim()
  .min(1)
  .max(128)
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => !value || options.allowWildcard || value !== "*",
    "Wildcard chi duoc dung cho projectId hoac moduleId.",
  );
}

const optionalDateTimeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => !value || !Number.isNaN(new Date(value).getTime()),
    "Thoi gian khong hop le.",
  );

const scopeDimensionShape = {
  organizationId: scopeValueSchema(),
  projectId: scopeValueSchema({ allowWildcard: true }),
  axisId: scopeValueSchema(),
  workstreamId: scopeValueSchema(),
  moduleId: scopeValueSchema({ allowWildcard: true }),
  recordId: scopeValueSchema(),
};

function hasAnyScopeDimension(input: Partial<Record<keyof typeof scopeDimensionShape, string | undefined>>) {
  return Object.keys(scopeDimensionShape).some((key) => Boolean(input[key as keyof typeof scopeDimensionShape]));
}

function validateScopeAssignmentScope(
  input: {
    scopeType?: "scoped" | "global";
    startsAt?: string;
    endsAt?: string;
  } & Partial<Record<keyof typeof scopeDimensionShape, string | undefined>>,
  context: z.RefinementCtx,
) {
  if (input.scopeType !== "global" && !hasAnyScopeDimension(input)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Scope assignment phai co it nhat mot pham vi hoac scopeType global ro rang.",
      path: ["scopeType"],
    });
  }

  if (input.scopeType === "global" && hasAnyScopeDimension(input)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Global assignment khong duoc kem scope dimension.",
      path: ["scopeType"],
    });
  }

  if (input.startsAt && input.endsAt && new Date(input.startsAt).getTime() > new Date(input.endsAt).getTime()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Thoi gian ket thuc phai sau thoi gian bat dau.",
      path: ["endsAt"],
    });
  }
}

const scopeAssignmentBaseSchema = z.object({
  userId: z.string().trim().min(1, "User la bat buoc."),
  roleKey: roleTemplateKeySchema,
  permissionKeys: z.array(permissionActionSchema).min(1, "Can chon it nhat mot permission."),
  scopeType: z.enum(["scoped", "global"]).optional().default("scoped"),
  active: z.boolean().optional().default(true),
  startsAt: optionalDateTimeSchema,
  endsAt: optionalDateTimeSchema,
  ...scopeDimensionShape,
});

export const scopeAssignmentCreateInputSchema = scopeAssignmentBaseSchema.superRefine(validateScopeAssignmentScope);

export const scopeAssignmentUpdateInputSchema = scopeAssignmentBaseSchema.superRefine(validateScopeAssignmentScope);

export const scopeAssignmentDisableInputSchema = z.object({
  assignmentId: z.string().trim().min(1, "Assignment id la bat buoc."),
});

function validateDelegationScope(
  input: {
    startsAt?: string;
    endsAt?: string;
  } & Partial<Record<keyof typeof scopeDimensionShape, string | undefined>>,
  context: z.RefinementCtx,
) {
  if (!hasAnyScopeDimension(input)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Delegation phai co it nhat mot pham vi duoc uy quyen.",
      path: ["projectId"],
    });
  }

  if (input.startsAt && input.endsAt && new Date(input.startsAt).getTime() > new Date(input.endsAt).getTime()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Thoi gian ket thuc phai sau thoi gian bat dau.",
      path: ["endsAt"],
    });
  }
}

export const leadershipDelegationInputSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    principalUserId: z.string().trim().min(1, "Lanh dao uy quyen la bat buoc."),
    delegateUserId: z.string().trim().min(1, "Nguoi duoc uy quyen la bat buoc."),
    actionKeys: z.array(permissionActionSchema).min(1, "Can chon it nhat mot action."),
    active: z.boolean().optional().default(true),
    startsAt: optionalDateTimeSchema,
    endsAt: optionalDateTimeSchema,
    note: optionalText,
    ...scopeDimensionShape,
  })
  .superRefine(validateDelegationScope);

export const leadershipDelegationActiveInputSchema = z.object({
  delegationId: z.string().trim().min(1, "Delegation id la bat buoc."),
  active: z.boolean(),
});

export const approvalTargetTypeSchema = z.enum([
  "proposal",
  "finance",
  "investment",
  "contract",
  "general",
]);

export const approvalAuthorityLevelSchema = z.enum([
  "DEPARTMENT_HEAD",
  "PROJECT_DIRECTOR",
  "CEO",
  "CHAIRMAN",
]);

export const riskSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

const escalationRiskSeveritySchema = z.enum(["high", "critical"]);

const optionalAmountSchema = z
  .number({ invalid_type_error: "So tien phai la number." })
  .finite("So tien khong hop le.")
  .nonnegative("So tien khong duoc am.")
  .optional();

const policyKeySchema = z
  .string()
  .trim()
  .min(2, "Policy key la bat buoc.")
  .max(96, "Policy key qua dai.")
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Policy key chi duoc gom chu thuong, so va dau gach duoi.",
  );

export const approvalThresholdPolicyInputSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    policyKey: policyKeySchema,
    labelVi: z.string().trim().min(1, "Ten policy la bat buoc."),
    targetType: approvalTargetTypeSchema.default("proposal"),
    amountMin: optionalAmountSchema.default(0),
    amountMax: optionalAmountSchema,
    currency: z.literal("VND").optional().default("VND"),
    approvalLevel: approvalAuthorityLevelSchema,
    approverRoleKey: roleTemplateKeySchema,
    requiredPermissionKey: permissionActionSchema,
    escalateAfterDays: z
      .number({ invalid_type_error: "So ngay escalation phai la number." })
      .int("So ngay escalation phai la so nguyen.")
      .min(1, "So ngay escalation toi thieu la 1.")
      .max(30, "So ngay escalation toi da la 30.")
      .optional()
      .default(3),
    escalateOnRiskLevels: z.array(escalationRiskSeveritySchema).optional().default([]),
    active: z.boolean().optional(),
    priority: z
      .number({ invalid_type_error: "Priority phai la number." })
      .int("Priority phai la so nguyen.")
      .nonnegative("Priority khong duoc am.")
      .optional()
      .default(100),
    ...scopeDimensionShape,
  })
  .superRefine((input, context) => {
    if (
      input.amountMax !== undefined &&
      input.amountMin !== undefined &&
      input.amountMin > input.amountMax
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "amountMin phai nho hon hoac bang amountMax.",
        path: ["amountMax"],
      });
    }
  });

export const approvalThresholdPolicyActiveInputSchema = z.object({
  policyId: z.string().trim().min(1, "Policy id la bat buoc."),
  active: z.boolean(),
});

export const riskGroupInputSchema = z.object({
  id: z.string().trim().min(1).optional(),
  riskKey: policyKeySchema,
  labelVi: z.string().trim().min(1, "Ten nhom risk la bat buoc."),
  description: optionalText,
  defaultSeverity: riskSeveritySchema,
  moduleId: scopeValueSchema({ allowWildcard: true }),
  sortOrder: z
    .number({ invalid_type_error: "Sort order phai la number." })
    .int("Sort order phai la so nguyen.")
    .nonnegative("Sort order khong duoc am.")
    .optional()
    .default(100),
  isDefault: z.boolean().optional().default(false),
  active: z.boolean().optional(),
});

export const riskGroupActiveInputSchema = z.object({
  riskGroupId: z.string().trim().min(1, "Risk group id la bat buoc."),
  active: z.boolean(),
});
