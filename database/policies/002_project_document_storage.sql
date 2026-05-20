-- Supabase Storage readiness for the private `project-documents` bucket.
-- Apply after creating the bucket and after `database/policies/001_mvp_rls.sql`.
-- Object names must follow:
-- projects/{projectId}/documents/{documentId}/v{version}/{fileName}

insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "project document objects readable by scoped users" on storage.objects;
create policy "project document objects readable by scoped users" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-documents'
    and public.current_user_has_permission('document.view')
    and public.current_user_can_read_project(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "project document objects writable by scoped document users" on storage.objects;
create policy "project document objects writable by scoped document users" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-documents'
    and public.current_user_has_permission('document.update')
    and public.current_user_can_read_project(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "project document objects replaceable by scoped document users" on storage.objects;
create policy "project document objects replaceable by scoped document users" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'project-documents'
    and public.current_user_has_permission('document.update')
    and public.current_user_can_read_project(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'project-documents'
    and public.current_user_has_permission('document.update')
    and public.current_user_can_read_project(((storage.foldername(name))[2])::uuid)
  );
