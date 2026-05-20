# Modules

Each module represents a business domain.

Current MVP modules:

- dashboard.
- projects.
- tasks.
- documents.
- legal.
- meetings.
- users.

Future modules:

- design.
- construction.
- finance.
- reports.
- ai.

Module rule:

- Keep UI in `components`.
- Keep business/data access orchestration in `services`.
- Keep shared domain types in `types.ts`.
- Do not import across modules casually; use service contracts or shared types.
