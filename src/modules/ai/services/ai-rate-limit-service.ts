import type { PermissionUser } from "@/lib/permissions/can";
import { isExternalRole } from "@/lib/permissions/access-scope";

import type { AiAskInput } from "../types";

export type AiRateLimitDecision = {
  allowed: true;
  key: string;
  policy: "mock_per_user_role_project";
  limitWindow: "placeholder";
};

export function buildAiRateLimitKey(user: PermissionUser, input: Pick<AiAskInput, "module" | "projectId">) {
  const externalBucket = isExternalRole(user.role) ? "external" : "internal";
  const projectBucket = input.projectId ?? "global";

  return `ai:${externalBucket}:role:${user.role}:user:${user.id}:project:${projectBucket}:module:${input.module}`;
}

export async function assertWithinAiRateLimit(
  user: PermissionUser,
  input: Pick<AiAskInput, "module" | "projectId">
): Promise<AiRateLimitDecision> {
  return {
    allowed: true,
    key: buildAiRateLimitKey(user, input),
    policy: "mock_per_user_role_project",
    limitWindow: "placeholder"
  };
}

