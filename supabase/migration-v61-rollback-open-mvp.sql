-- v61 rollback opcional: volver temporalmente a políticas MVP abiertas.
-- Úsalo SOLO si alguna pantalla se bloquea mientras ajustamos RLS fino.
do $$
declare
  pol record;
  tbl text;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;

  foreach tbl in array array[
    'profiles','clients','tours','tour_clients','tour_collaborators',
    'itineraries','itinerary_days','itinerary_stops','client_itineraries',
    'documents','chat_rooms','chat_participants','chat_messages','notifications',
    'itinerary_day_documents','itinerary_day_collaborators',
    'tour_template_stops','hotels','proposal_versions','payments'
  ] loop
    if to_regclass('public.' || tbl) is not null then
      execute format('alter table public.%I enable row level security', tbl);
      execute format('create policy "authenticated_select_%s" on public.%I for select to authenticated using (true)', tbl, tbl);
      execute format('create policy "authenticated_insert_%s" on public.%I for insert to authenticated with check (true)', tbl, tbl);
      execute format('create policy "authenticated_update_%s" on public.%I for update to authenticated using (true) with check (true)', tbl, tbl);
      execute format('create policy "authenticated_delete_%s" on public.%I for delete to authenticated using (true)', tbl, tbl);
    end if;
  end loop;
end $$;
