-- v66: flujo real prospecto -> cliente + checklist operativo.
-- Ejecutar después de v61.

alter table public.clients
  add column if not exists reservation_policy_accepted boolean not null default false,
  add column if not exists operation_stage text not null default 'commercial',
  add column if not exists operation_started_at timestamptz,
  add column if not exists file_created_at timestamptz;

create table if not exists public.operation_tasks (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'normal',
  due_date date,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.operation_tasks enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'operation_tasks'
  loop
    execute format('drop policy if exists %I on public.operation_tasks', pol.policyname);
  end loop;
end $$;

create policy "operation_tasks_select_scope"
on public.operation_tasks for select to authenticated
using (
  public.app_is_admin()
  or public.app_is_operations()
  or public.app_can_manage_commercial()
  or public.app_owns_client(client_id)
  or public.app_can_access_client(client_id)
);

create policy "operation_tasks_insert_team"
on public.operation_tasks for insert to authenticated
with check (public.app_is_admin() or public.app_is_operations() or public.app_can_manage_commercial());

create policy "operation_tasks_update_ops"
on public.operation_tasks for update to authenticated
using (public.app_is_admin() or public.app_is_operations() or public.app_can_manage_commercial())
with check (public.app_is_admin() or public.app_is_operations() or public.app_can_manage_commercial());

create policy "operation_tasks_delete_admin"
on public.operation_tasks for delete to authenticated
using (public.app_is_admin());

create index if not exists idx_operation_tasks_client_status on public.operation_tasks(client_id, status);
create index if not exists idx_clients_operation_stage on public.clients(operation_stage);
