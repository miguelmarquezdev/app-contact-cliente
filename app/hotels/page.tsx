import { PageShell } from '@/components/page-shell'
import { createClient } from '@/lib/supabase-server'
import { createHotel, deleteHotel } from './actions'
import { Trash2 } from 'lucide-react'

export default async function HotelsPage() {
  const supabase = await createClient()
  const { data: hotels } = await supabase.from('hotels').select('*').order('created_at', { ascending: false })

  return (
    <PageShell>
      <div className="mb-6 hidden lg:block">
        <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Alojamientos</p>
        <h1 className="text-3xl font-black text-[#14264F]">Hoteles</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">Registra los hoteles con los que trabajas para seleccionarlos luego en cada día del itinerario.</p>
      </div>

      <form action={createHotel} className="card mb-6 grid gap-4 p-5 sm:p-6 md:grid-cols-2">
        <input name="name" className="input" placeholder="Nombre del hotel" required />
        <input name="location" className="input" placeholder="Ubicación: Aguas Calientes, Cusco..." />
        <input name="contact" className="input md:col-span-2" placeholder="Contacto opcional" />
        <textarea name="description" className="input min-h-24 md:col-span-2" placeholder="Descripción, categoría, notas internas o condiciones." />
        <select name="status" className="input">
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
        <button className="btn-primary">Guardar hotel</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(hotels || []).map((hotel) => (
          <article key={hotel.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#0EA5E9]">Hotel</p>
                <h2 className="mt-1 text-xl font-black text-[#14264F]">{hotel.name}</h2>
                {hotel.location ? <p className="mt-1 text-sm font-bold text-[#1E40AF]">{hotel.location}</p> : null}
              </div>
              <form action={deleteHotel}>
                <input type="hidden" name="hotel_id" value={hotel.id} />
                <button className="rounded-2xl bg-red-500/10 p-3 text-red-300 ring-1 ring-red-500/20"><Trash2 className="h-4 w-4" /></button>
              </form>
            </div>
            {hotel.description ? <p className="mt-3 text-sm leading-6 text-slate-500">{hotel.description}</p> : null}
            {hotel.contact ? <p className="mt-3 text-xs font-bold text-slate-500">Contacto: {hotel.contact}</p> : null}
          </article>
        ))}
      </div>
    </PageShell>
  )
}
