import Link from 'next/link'
import { ArrowRight, Clock, Compass, MessageCircle, Search, User } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { LogoutButton } from '@/components/logout-button'
import { StatCard } from '@/components/stat-card'
import { createClient } from '@/lib/supabase-server'


type CatalogTour = {
  id: string
  title: string
  route: string | null
  description: string | null
  category: string | null
  price_amount: number | null
  price_currency: string | null
  duration: string | null
  image_url: string | null
  featured: boolean | null
}

function categoryLabel(value?: string | null) {
  const map: Record<string, string> = {
    tailor_made: 'Tailor made',
    luxury: 'Luxury',
    adventure: 'Adventure',
    day_tours: 'Day tours',
    cultural: 'Cultural',
    trekking: 'Trekking'
  }
  return map[value || ''] || value || 'Tours'
}

function categoryOrder(value?: string | null) {
  const order: Record<string, number> = {
    luxury: 1,
    tailor_made: 2,
    adventure: 3,
    day_tours: 4,
    cultural: 5,
    trekking: 6
  }
  return order[value || ''] || 99
}

function formatPrice(tour: CatalogTour) {
  if (tour.price_amount === null || tour.price_amount === undefined) return 'Consultar'
  return `${tour.price_currency || 'USD'} ${Number(tour.price_amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export default async function ClientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
  const { data: client } = await supabase.from('clients').select('id,country,passport_number,lifecycle_status,proposal_status,payment_status,payment_amount,payment_currency').eq('profile_id', user?.id).single()

  const { count: assignedCount } = client?.id
    ? await supabase.from('client_itineraries').select('*', { count: 'exact', head: true }).eq('client_id', client.id)
    : { count: 0 }

  const { data: catalogTours } = await supabase
    .from('tours')
    .select('id,title,route,description,category,price_amount,price_currency,duration,image_url,featured')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12)
    .returns<CatalogTour[]>()

  const categories = Array.from(new Set((catalogTours || []).map((tour) => tour.category || 'day_tours'))).slice(0, 5)
  const groupedTours = Array.from(
    (catalogTours || []).reduce((map, tour) => {
      const category = tour.category || 'day_tours'
      const current = map.get(category) || []
      current.push(tour)
      map.set(category, current)
      return map
    }, new Map<string, CatalogTour[]>())
  ).sort(([a], [b]) => categoryOrder(a) - categoryOrder(b))

  return (
    <PageShell>
      <div className="mb-8 hidden flex-col justify-between gap-4 lg:flex lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Portal del cliente</p>
          <h1 className="mt-1 text-3xl font-black text-[#14264F]">Hola, {profile?.full_name || user?.email}</h1>
          <p className="mt-2 text-slate-500">Aquí podrás revisar propuestas, aceptar itinerarios, solicitar cambios y actualizar tus datos.</p>
        </div>
        <LogoutButton />
      </div>

      <section className="lg:hidden">
        <div className="mb-4">
          <p className="text-[13px] font-semibold text-slate-500">Hola, {profile?.full_name || 'viajero'}</p>
          <h1 className="mt-1 text-[1.65rem] font-black leading-tight text-[#14264F]">¿A dónde viajamos?</h1>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-semibold text-slate-500">Buscar experiencias</span>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 rounded-full bg-[#14264F] px-4 py-2 text-xs font-black text-white">Todos</span>
          {categories.map((category) => (
            <span key={category} className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-black text-[#14264F] shadow-sm ring-1 ring-slate-200">{categoryLabel(category)}</span>
          ))}
        </div>
      </section>


      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#1E40AF]">Catálogo</p>
            <h2 className="text-xl font-black text-[#14264F] lg:text-2xl">Experiencias recomendadas</h2>
          </div>
          <Link href="/client/itineraries" className="text-xs font-black text-[#1E40AF]">Mis viajes</Link>
        </div>

        <div className="space-y-7">
          {groupedTours.map(([category, tours]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[1.05rem] font-black text-[#14264F] lg:text-xl">{categoryLabel(category)}</h3>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{tours.length} tours</span>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-3 lg:overflow-visible">
                {tours.map((tour) => (
                  <article key={tour.id} className="w-[78vw] max-w-[310px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,.08)] lg:w-auto lg:max-w-none">
                    <div className="relative h-40 bg-slate-100">
                      {tour.image_url ? (
                        <img src={tour.image_url} alt={tour.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#14264F] to-[#1E40AF] text-white">
                          <Compass className="h-10 w-10 opacity-80" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#14264F]">{categoryLabel(tour.category)}</span>
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[#1E40AF]">
                        {tour.duration ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {tour.duration}</span> : null}
                      </div>
                      <h3 className="line-clamp-2 text-lg font-black leading-tight text-[#14264F]">{tour.title}</h3>
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{tour.route || 'Experiencia personalizada'}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm font-black text-[#1E40AF]">Desde {formatPrice(tour)}</p>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#14264F] text-white"><ArrowRight className="h-4 w-4" /></span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}

          {!catalogTours?.length ? (
            <div className="card p-5 text-sm font-semibold text-slate-500">Aún no hay tours publicados en catálogo.</div>
          ) : null}
        </div>
      </section>


      <section className="lg:hidden mt-5 grid gap-3">
        <Link href="/client/profile" className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#14264F] text-xl font-black text-white">
            {(profile?.full_name || user?.email || 'V').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-[#14264F]">{profile?.full_name || user?.email}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{profile?.email}</p>
          </div>
          <User className="h-5 w-5 text-slate-400" />
        </Link>
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-3 lg:mt-0">
        <StatCard title="Itinerarios" value={String(assignedCount ?? 0)} helper="Propuestas recibidas" />
        <StatCard title="Estado" value={client?.lifecycle_status === 'client' ? 'Cliente' : 'Prospecto'} helper={client?.proposal_status || 'Propuesta pendiente'} />
        <Link href="/client/chat" className="card flex items-center justify-between p-4 hover:ring-2 hover:ring-[#1E40AF]/20 lg:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#1E40AF]">Chat</p>
            <h2 className="mt-1 text-base font-black text-[#14264F] lg:text-xl">Hablar con el equipo</h2>
          </div>
          <MessageCircle className="h-6 w-6 text-[#1E40AF]" />
        </Link>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Link href="/client/itineraries" className="card block p-4 hover:ring-2 hover:ring-[#1E40AF]/20 lg:p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[#1E40AF]">Mis viajes</p>
          <h2 className="mt-1 text-base font-black text-[#14264F] lg:text-xl">Ver itinerarios recibidos</h2>
          <p className="mt-1 text-xs text-slate-500 lg:text-sm">Revisa días, rutas, comidas, alojamiento y stops.</p>
        </Link>
        <Link href="/client/profile" className="card block p-4 hover:ring-2 hover:ring-[#1E40AF]/20 lg:p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[#1E40AF]">Perfil</p>
          <h2 className="mt-1 text-base font-black text-[#14264F] lg:text-xl">Editar mis datos</h2>
          <p className="mt-1 text-xs text-slate-500 lg:text-sm">Actualiza WhatsApp, país y pasaporte.</p>
        </Link>
      </div>
    </PageShell>
  )
}
