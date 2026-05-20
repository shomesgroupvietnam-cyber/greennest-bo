# AI Module

Permission-aware AI assistance module.

Source of truth:

- `blueprint/14-ai-assistant-strategy.md`

Capabilities:

- Project summaries.
- Meeting summaries.
- Action item extraction.
- Missing document suggestions.
- Risk suggestions.
- Module-level assistants for Legal, Documents, Tasks, Meetings, Reports, Design, Construction, Finance and Contractor workflows.

User-facing UX:

- `/ai` is labeled `Trợ lý AI`.
- The main form uses business presets and a project code/name dropdown.
- Fast processing is the default; job mode, priority and rate-limit details stay internal.
- Approved RAG is enabled by default only for roles with `ai.use_rag`.
- Action proposals are created only when the user explicitly chooses `Đề xuất việc cần làm`.
- AI result pages resolve project code/name when available, and proposal review pages use business labels while keeping raw payload JSON inside admin-only technical details.

Required architecture:

```text
Module AI UI
-> AI Assistant service
-> permission/scope resolver
-> structured data retriever
-> approved Knowledge Center RAG
-> cited answer
-> human-confirmed action
```

MCP Web Search is only for external source discovery/intake. Search results must go through review and approval before entering authoritative RAG.

AI must not mutate project data without explicit user confirmation.

## Provider Configuration

The Coordinator uses `src/modules/ai/services/ai-provider.ts`.

Local/test default:

```text
AI_PROVIDER=mock
```

OpenAI-compatible mode is opt-in:

```text
AI_PROVIDER=openai_compatible
AI_CHAT_MODEL=gpt-4.1-mini
AI_MAX_OUTPUT_TOKENS=700
AI_TEMPERATURE=0.2
AI_PROVIDER_TIMEOUT_MS=20000
AI_PROVIDER_MAX_RETRIES=2
OPENAI_API_KEY=...
```

`AI_PROVIDER=auto` falls back to mock when `OPENAI_API_KEY` is missing. Citations and action proposals are created by application retrieval/Coordinator logic, not by model text.

Provider calls are bounded by `AI_PROVIDER_TIMEOUT_MS` and retry transient failures by `AI_PROVIDER_MAX_RETRIES`.
Retryable HTTP responses include rate limits and temporary provider/server failures. Provider usage metadata is stored as
token/cost placeholders when the adapter returns it; pricing math remains a future production hardening step.
