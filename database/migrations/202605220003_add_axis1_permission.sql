insert into public.permissions (key, module, description)
values
  ('axis1.view', 'axis1', 'View Truc 1 Project Management development stages')
on conflict (key) do update
set module = excluded.module,
    description = excluded.description;

with axis1_role_permissions(role_key, permission_key) as (
  values
    ('super_admin', 'axis1.view'),
    ('admin', 'axis1.view'),
    ('tong_giam_doc', 'axis1.view'),
    ('pho_tong_giam_doc', 'axis1.view'),
    ('giam_doc_du_an', 'axis1.view'),
    ('quan_ly_du_an', 'axis1.view'),
    ('dau_tu_phat_trien', 'axis1.view'),
    ('kiem_soat_noi_bo', 'axis1.view')
)
insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from axis1_role_permissions
join public.roles on roles.key = axis1_role_permissions.role_key
join public.permissions on permissions.key = axis1_role_permissions.permission_key
on conflict (role_id, permission_id) do nothing;
