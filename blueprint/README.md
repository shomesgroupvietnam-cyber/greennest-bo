# GreenNest BuildFlow - Blueprint Index

This folder is the long-term source of truth for GreenNest BuildFlow. It is broader than MVP V1 and should guide Codex, Claude, designers, engineers and product owners through the full project lifecycle.

## Document Map

1. [00-product-vision.md](./00-product-vision.md)  
   Product vision, target users, principles, strategic scope and non-goals.

2. [01-domain-blueprint.md](./01-domain-blueprint.md)  
   Full domain model across legal, construction, operations, finance, meetings, reports and AI support.

3. [02-scalable-architecture.md](./02-scalable-architecture.md)  
   Scalable technical architecture from MVP to enterprise deployment.

4. [03-data-blueprint.md](./03-data-blueprint.md)  
   Data ownership, entity map, schema direction, audit model and reporting foundation.

5. [04-roadmap.md](./04-roadmap.md)  
   Delivery phases from foundation to full platform.

6. [05-agent-operating-guide.md](./05-agent-operating-guide.md)  
   Rules for Codex/Claude when implementing the project sprint by sprint.

7. [06-product-brief.md](./06-product-brief.md)  
   Short executive product brief for alignment, pitch and kickoff.

8. [07-platform-requirements.md](./07-platform-requirements.md)  
   Scalable functional and non-functional requirements beyond MVP.

9. [08-api-contract.md](./08-api-contract.md)  
   Initial API/resource contract for frontend-backend coordination.

10. [09-data-model.md](./09-data-model.md)  
   Scalable logical data model and entity relationships.

11. [10-decision-log.md](./10-decision-log.md)  
   Architecture and product decisions that must be preserved.

12. [11-task-backlog.md](./11-task-backlog.md)  
   High-level implementation task backlog by domain and phase.

13. [12-auth-roles-permissions.md](./12-auth-roles-permissions.md)  
   Scalable authentication, roles, permissions and role-specific screen model.

14. [13-role-workspaces.md](./13-role-workspaces.md)  
   Detailed role-specific workspaces, screens, navigation and implementation tasks.

15. [14-ai-assistant-strategy.md](./14-ai-assistant-strategy.md)  
   Unified AI Assistant, Knowledge Center, MCP Web Search, review/approve/RAG and module RAG strategy.

## How To Use

- Start from `docs/DOCS_INDEX.md` for the full documentation map.
- Use `docs/BMAD_DOCUMENTATION_MAP.md` to route daily requirement changes into BMad artifacts before implementation.
- Use this folder for high-level and scalable decisions.
- Use root-level `requirement.md`, `design.md`, `architecture.md`, and `milestone.md` only as MVP execution snapshots.
- Use `docs/DOCUMENTATION_STANDARD.md` to decide where new documentation belongs.
- Use `_bmad-output/planning-artifacts/` for working PRD/UX/architecture/epic artifacts and `_bmad-output/implementation-artifacts/` for specs, stories and reviews.
- When implementation conflicts with these documents, update the blueprint intentionally instead of letting code drift silently.
- Agents must read this index first, then open only the relevant document for their current task.

## Current Product Name

GreenNest BuildFlow

## Product Category

Web application for real estate development, construction investment and project lifecycle operations.

## Long-Term Positioning

GreenNest BuildFlow should become an operating system for housing development projects: one platform for legal readiness, design, construction, documents, cost, decisions, reporting and executive control.
