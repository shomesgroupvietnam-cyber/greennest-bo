-- Back-office managed source allowlist for Web Search / Knowledge intake.
-- Search results from domains not enabled here cannot be imported into Knowledge Candidate queue.

create table if not exists public.source_registry_entries (
  id text primary key,
  domain text not null unique,
  source_category text not null check (source_category in ('government', 'standards', 'internal', 'market', 'reference')),
  module text not null check (module in ('legal', 'design', 'construction', 'finance', 'documents', 'meetings', 'reports', 'project', 'general')),
  source_type text not null check (source_type in ('law', 'standard', 'template', 'policy', 'contract', 'technical_guideline', 'market', 'internal_note')),
  confidence text not null check (confidence in ('official', 'internal_approved', 'external_reference', 'unknown')),
  tags text[] not null default '{}',
  enabled boolean not null default true,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_source_registry_entries_domain on public.source_registry_entries(domain);
create index if not exists idx_source_registry_entries_enabled on public.source_registry_entries(enabled);
create index if not exists idx_source_registry_entries_module on public.source_registry_entries(module);

insert into public.source_registry_entries (
  id,
  domain,
  source_category,
  module,
  source_type,
  confidence,
  tags,
  enabled,
  notes
)
values
  ('source-registry-default-1', 'chinhphu.vn', 'government', 'legal', 'law', 'official', array['phap-ly', 'chinh-phu'], true, 'Default official government source.'),
  ('source-registry-default-2', 'moc.gov.vn', 'government', 'construction', 'standard', 'official', array['xay-dung', 'quy-chuan'], true, 'Default construction ministry source.'),
  ('source-registry-default-3', 'monre.gov.vn', 'government', 'legal', 'law', 'official', array['dat-dai', 'moi-truong'], true, 'Default land and environment source.'),
  ('source-registry-default-4', 'greennest.local', 'internal', 'documents', 'policy', 'internal_approved', array['noi-bo'], true, 'Default internal approved source.'),
  ('source-registry-default-5', 'example.com', 'reference', 'general', 'internal_note', 'external_reference', array['demo'], true, 'Default demo source.')
on conflict (domain) do nothing;

drop trigger if exists set_source_registry_entries_updated_at on public.source_registry_entries;
create trigger set_source_registry_entries_updated_at before update on public.source_registry_entries for each row execute function public.set_updated_at();
