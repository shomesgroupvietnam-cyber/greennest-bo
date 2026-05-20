create table if not exists public.document_requirements (
  id uuid primary key default gen_random_uuid(),
  project_type text not null,
  requirement_code text not null,
  requirement_name text not null,
  doc_type text not null,
  required_phase text,
  legal_step_code text,
  is_required boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_type, requirement_code)
);

create index if not exists idx_document_requirements_project_type on public.document_requirements(project_type);
create index if not exists idx_document_requirements_doc_type on public.document_requirements(doc_type);
create index if not exists idx_document_requirements_legal_step_code on public.document_requirements(legal_step_code);

drop trigger if exists set_document_requirements_updated_at on public.document_requirements;
create trigger set_document_requirements_updated_at
before update on public.document_requirements
for each row execute function public.set_updated_at();

insert into public.document_requirements (
  id,
  project_type,
  requirement_code,
  requirement_name,
  doc_type,
  required_phase,
  legal_step_code,
  is_required,
  order_index
)
values
  ('10000000-0000-0000-0000-000000000101', 'default', 'DEFAULT-CONTRACT', 'Hop dong va phu luc lien quan', 'contract', 'Quan tri du an', null, true, 90),
  ('10000000-0000-0000-0000-000000000102', 'default', 'DEFAULT-ACCEPTANCE', 'Bien ban nghiem thu', 'acceptance_record', 'Nghiem thu', null, false, 100),
  ('10000000-0000-0000-0000-000000000201', 'Khu nha o thap tang', 'LOWRISE-LAND', 'Ho so phap ly quy dat', 'land_record', 'Chuan bi phap ly', 'land_survey', true, 1),
  ('10000000-0000-0000-0000-000000000202', 'Khu nha o thap tang', 'LOWRISE-INVESTMENT-PROPOSAL', 'Ho so de xuat dau tu', 'legal_submission', 'Chu truong dau tu', 'investment_proposal', true, 2),
  ('10000000-0000-0000-0000-000000000203', 'Khu nha o thap tang', 'LOWRISE-BASIC-DESIGN', 'Ban ve thiet ke co so', 'design_drawing', 'Thiet ke co so', 'basic_design', true, 3),
  ('10000000-0000-0000-0000-000000000204', 'Khu nha o thap tang', 'LOWRISE-CONSTRUCTION-PERMIT', 'Giay phep xay dung', 'construction_permit', 'Cap phep xay dung', 'construction_permit', true, 4),
  ('10000000-0000-0000-0000-000000000301', 'Chung cu trung tang', 'MIDRISE-LAND', 'Ho so phap ly quy dat', 'land_record', 'Chuan bi phap ly', 'land_survey', true, 1),
  ('10000000-0000-0000-0000-000000000302', 'Chung cu trung tang', 'MIDRISE-ENVIRONMENT', 'Ho so moi truong', 'legal_submission', 'Tham dinh moi truong', 'environmental_approval', true, 2)
on conflict (project_type, requirement_code) do update set
  requirement_name = excluded.requirement_name,
  doc_type = excluded.doc_type,
  required_phase = excluded.required_phase,
  legal_step_code = excluded.legal_step_code,
  is_required = excluded.is_required,
  order_index = excluded.order_index,
  updated_at = now();
