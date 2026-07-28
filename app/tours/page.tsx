import { PageShell } from '@/components/page-shell'
import { createClient } from '@/lib/supabase-server'
import { createTour, deleteTour, updateTour } from './actions'
import { ToursAdminManager } from '@/components/tours-admin-manager'

type TourStop = {
  id: string
  place: string
  duration: string | null
  description: string | null
  includes_ticket: boolean | null
  order_index: number | null
}

type TourTemplate = {
  id: string
  title: string
  code: string | null
  route: string | null
  description: string | null
  category: string | null
  price_amount: number | null
  price_currency: string | null
  duration: string | null
  image_url: string | null
  featured: boolean | null
  default_food_notes: string | null
  meal_types: string[] | null
  meal_observations: Record<string, string> | null
  status: string | null
  created_at: string | null
  tour_template_stops: TourStop[] | null
}

export default async function ToursPage() {
  const supabase = await createClient()
  const { data: tours } = await supabase
    .from('tours')
    .select('id,title,code,route,description,category,price_amount,price_currency,duration,image_url,featured,default_food_notes,meal_types,meal_observations,status,created_at,tour_template_stops(id,place,duration,description,includes_ticket,order_index)')
    .order('created_at', { ascending: false })
    .returns<TourTemplate[]>()

  return (
    <PageShell>
      <div className="mb-6 hidden lg:block">
        <p className="text-sm font-bold uppercase tracking-widest text-[#0EA5E9]">Tours base</p>
        <h1 className="text-3xl font-black text-[#14264F]">Tours y catálogo</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">Crea servicios con precio, duración, imagen, categoría, comidas y stops. También se muestran en el inicio del prospecto.</p>
      </div>

      <ToursAdminManager
        tours={tours || []}
        createAction={createTour}
        updateAction={updateTour}
        deleteAction={deleteTour}
      />
    </PageShell>
  )
}
