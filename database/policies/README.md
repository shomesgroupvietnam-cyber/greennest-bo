# Row Level Security Policies

Store Supabase RLS policy SQL here.

Policies must enforce server-side data access rules, not rely only on UI hiding.

Policy design should reflect:

- Workspace membership.
- Project membership.
- Role permissions.
- External collaborator restrictions.
- Finance/document sensitivity.

Use `blueprint/12-auth-roles-permissions.md` as the source for access rules.

`001_mvp_rls.sql` is the application-table RLS baseline for Phase 1.5 and Sprint 8C. It includes helper functions for current app user, role, permission, project membership, task assignment and document ownership so external roles are isolated consistently with the app-level scope helpers. Document requirement templates are readable to users with `document.view` and manageable only by internal users with `document.update`; project-specific readiness still depends on scoped project/document reads in the app layer. Document approval updates require `document.approve` at the app layer and are allowed by the document update RLS helper for internal approvers. Knowledge Candidates are readable to Knowledge Center viewers, creatable only with `knowledge.create_candidate`, and updatable only by users with promote/review/approve permissions before they become Knowledge Items.

`002_project_document_storage.sql` prepares private Supabase Storage policies for the `project-documents` bucket. It should be applied only after the bucket exists and before enabling real upload/download flows.
