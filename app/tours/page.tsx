import { PageShell } from '@/components/page-shell'
import { createClient } from '@/lib/supabase-server'
import { createTour } from './actions'

export default async function ToursPage() {
  const supabase = await createClient()
  const { data: tours } = await supabase.from('tours').select('*').order('created_at', { ascending: false })

  return (
    <PageShell>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Operaciones</p>
        <h1 className="text-3xl font-black text-white">Tours</h1>
      </div>

      <form action={createTour} className="card mb-6 grid gap-4 p-6 md:grid-cols-5">
        <input name="title" className="input md:col-span-2" placeholder="Nombre del tour" required />
        <input name="code" className="input" placeholder="Código" />
        <input name="start_date" className="input" type="date" />
        <input name="end_date" className="input" type="date" />
        <select name="status" className="input">
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="preparation">En preparación</option>
          <option value="operating">En operación</option>
          <option value="finished">Finalizado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <button className="btn-primary md:col-span-4">Crear tour</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111827] text-slate-300">
            <tr><th className="p-4">Tour</th><th className="p-4">Código</th><th className="p-4">Inicio</th><th className="p-4">Estado</th></tr>
          </thead>
          <tbody>
            {tours?.map((tour) => (
              <tr key={tour.id} className="border-t border-[#1e293b]">
                <td className="p-4 font-bold text-white">{tour.title}</td>
                <td className="p-4">{tour.code || '-'}</td>
                <td className="p-4">{tour.start_date || '-'}</td>
                <td className="p-4"><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">{tour.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}
