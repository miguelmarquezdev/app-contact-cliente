-- Chat attachments and link previews
alter table public.chat_messages
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size bigint,
  add column if not exists link_url text;

-- Public bucket for chat files. You can also create it from Supabase Storage UI.
insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', true)
on conflict (id) do update set public = true;

-- Storage policies for authenticated users.
drop policy if exists "chat_files_select" on storage.objects;
drop policy if exists "chat_files_insert" on storage.objects;
drop policy if exists "chat_files_update" on storage.objects;
drop policy if exists "chat_files_delete" on storage.objects;

create policy "chat_files_select"
on storage.objects for select
to authenticated
using (bucket_id = 'chat-files');

create policy "chat_files_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'chat-files');

create policy "chat_files_update"
on storage.objects for update
to authenticated
using (bucket_id = 'chat-files')
with check (bucket_id = 'chat-files');

create policy "chat_files_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'chat-files');
