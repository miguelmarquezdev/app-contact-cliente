-- V52: versiones editables antes de reenviar + soporte de actualización en tiempo real.
-- Ejecutar después de V51.

alter table public.proposal_versions add column if not exists previous_assignment_id uuid references public.client_itineraries(id) on delete set null;
alter table public.proposal_versions add column if not exists admin_note text;
alter table public.proposal_versions add column if not exists sent_at timestamptz;

-- Recomendado para Supabase Realtime. Si ya estaba agregado, ignora el error en algunos proyectos.
do $$
begin
  begin alter publication supabase_realtime add table public.clients; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.client_itineraries; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.proposal_versions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.itineraries; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.itinerary_days; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.itinerary_stops; exception when duplicate_object then null; end;
end $$;
