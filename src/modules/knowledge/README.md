# Knowledge Center Module

Governed source intake and review foundation for future AI/RAG.

Current scope:

- Knowledge item metadata.
- Manual source/import flow.
- Submit for review.
- Approve/reject.
- Mark expired/superseded.
- RAG eligibility flag for approved items only.
- Deterministic text chunk indexing for approved items.
- Retrieval service boundary with module/status/access filters and citation metadata.
- Embedding provider and vector retrieval adapter interfaces.
- Local/mock embedding provider and cosine ranking adapter for tests.
- OpenAI-compatible embedding provider boundary gated by `AI_EMBEDDING_PROVIDER` and `OPENAI_API_KEY`.
- Approved chunk embedding generation with skip/force re-embed support.
- Semantic retrieval path using stored chunk embeddings with deterministic fallback.
- MCP/Web Search intake foundation with mock fallback, Tavily adapter, BO-managed source registry allowlist, duplicate detection, candidate normalization and search logs.

Not implemented yet:

- Production pgvector ANN tuning and live staging validation.
- Scheduled crawler and provider-specific production monitoring.
- Advanced AI answer generation beyond the current Coordinator/provider MVP.

## Embedding Configuration

Local/test default:

```text
AI_EMBEDDING_PROVIDER=mock
```

OpenAI-compatible embeddings are opt-in:

```text
AI_EMBEDDING_PROVIDER=openai_compatible
AI_EMBEDDING_MODEL=text-embedding-3-small
AI_EMBEDDING_DIMENSIONS=1536
OPENAI_API_KEY=...
```

`AI_EMBEDDING_PROVIDER=auto` uses OpenAI-compatible embeddings only when `OPENAI_API_KEY` is configured; otherwise it falls back to mock embeddings. Semantic retrieval still applies module/status/access/source metadata filters before ranking.

## Web Search Intake Configuration

Local/test default:

```text
WEB_SEARCH_PROVIDER=mock
```

Tavily web search is opt-in:

```text
WEB_SEARCH_PROVIDER=tavily
WEB_SEARCH_API_KEY=...
WEB_SEARCH_MAX_RESULTS=6
WEB_SEARCH_TIMEOUT_MS=12000
```

`WEB_SEARCH_PROVIDER=auto` uses Tavily only when `WEB_SEARCH_API_KEY` is configured; otherwise it falls back to the mock provider. Search results are discovery candidates only. Import enforces the source registry allowlist, detects duplicate normalized URLs and creates `pending_review` Knowledge Candidates. Imported web results are not Knowledge Items, are not auto-approved and are not indexed into RAG.

Super admin/settings users manage the source registry from `/settings`. In mock mode the registry is stored in `.mock-data/source-registry-settings.json`; in Supabase mode it uses `public.source_registry_entries` with RLS restricted to source-registry/settings permissions.
