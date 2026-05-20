# Permissions

Centralized authorization helpers live here.

Rules:

- Do not scatter role-name checks across UI components.
- Use permission keys like `project.create`, `finance.view`, `legal.update`.
- Resolve access from system role, workspace membership, project membership and resource ownership.
- Deny by default.
- Server-side actions must enforce permissions even if the UI hides unavailable actions.

The source of truth for role and permission design is `blueprint/12-auth-roles-permissions.md`.
