import { PageShell } from '@/components/page-shell'
import { createClient } from '@/lib/supabase-server'
import { createDocumentLink } from './actions'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: tours } = await supabase.from('tours').select('id,title')
  const { data: documents } = await supabase.from('documents').select('*, tours(title)').order('created_at', { ascending: false })

  return (
    <PageShell>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Archivos</p>
        <h1 className="text-3xl font-black text-[#14264F]">Documentos</h1>
      </div>

      <form action={createDocumentLink} className="card mb-6 grid gap-4 p-6 md:grid-cols-5">
        <select name="tour_id" className="input" required>
          <option value="">Tour</option>
          {tours?.map((tour) => <option key={tour.id} value={tour.id}>{tour.title}</option>)}
        </select>
        <input name="title" className="input" placeholder="Título del documento" required />
        <input name="file_url" className="input md:col-span-2" placeholder="URL del archivo en Supabase Storage o Drive" required />
        <select name="visibility" className="input">
          <option value="internal">Solo interno</option>
          <option value="team">Equipo</option>
          <option value="client">Visible al cliente</option>
        </select>
        <button className="btn-primary md:col-span-5">Guardar documento</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documents?.map((doc) => (
          <a key={doc.id} href={doc.file_url} target="_blank" className="card block p-5 hover:border-emerald-300">
            <p className="text-xs font-bold uppercase text-[#0EA5E9]">{doc.tours?.title}</p>
            <h3 className="mt-1 font-black text-[#14264F]">{doc.title}</h3>
            <p className="mt-2 text-sm text-slate-500">Visibilidad: {doc.visibility}</p>
          </a>
        ))}
      </div>
    </PageShell>
  )
}
