# Supabase Storage Plan

## Buckets

| Bucket | Visibility | Purpose |
| --- | --- | --- |
| `project-documents` | Private | Project legal, design, contract, contractor and operating documents. |

`public-assets` can be added later for brand or public marketing assets. It is not required for the MVP.

## Object Path Convention

Use deterministic, project-scoped paths:

```text
projects/{projectId}/documents/{documentId}/v{version}/{fileName}
```

Example:

```text
projects/3b4b.../documents/8a7a.../v2/gp-xay-dung.pdf
```

The app boundary for this convention is `src/lib/storage/document-storage.ts`.

## Access Model

- The bucket must stay private.
- Reads require authenticated users with `document.view` and scoped project/document access.
- Writes require `document.update` or future upload-specific permission plus scoped project/document access.
- Approval metadata is stored on `documents`; file replacement must create a `document_versions` row.
- Public URLs must not be used for real project files.
- Use signed URLs for time-limited downloads/previews once real upload is implemented.

## Sprint 3 Readiness Status

Implemented now:

- Storage path helper boundary.
- Private bucket name constant.
- SQL policy readiness file: `database/policies/002_project_document_storage.sql`.
- UI copy states clearly that upload is not production-ready.

Deferred:

- Real upload widget and server action.
- Signed URL generation.
- File size/MIME validation.
- Upload/delete audit events.

## Setup Checklist

1. Apply database migrations and MVP RLS.
2. Create or upsert private bucket `project-documents`.
3. Apply `database/policies/002_project_document_storage.sql`.
4. Validate object paths use `projects/{projectId}/documents/{documentId}/v{version}/{fileName}`.
5. Add signed URL read flow before exposing private files in production.
