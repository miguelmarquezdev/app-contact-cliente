export type UserRole = 'admin' | 'tour_leader' | 'collaborator' | 'client'

export type Profile = {
  id: string
  full_name: string
  email: string
  phone?: string | null
  role: UserRole
  position?: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export type Tour = {
  id: string
  title: string
  code?: string | null
  start_date?: string | null
  end_date?: string | null
  status: 'pending' | 'confirmed' | 'preparation' | 'operating' | 'finished' | 'cancelled'
  tour_leader_id?: string | null
  created_at: string
}

export type Client = {
  id: string
  profile_id: string
  country?: string | null
  passport_number?: string | null
  notes_internal?: string | null
  created_at: string
}


export type Itinerary = {
  id: string
  tour_id?: string | null
  title: string
  description?: string | null
  created_at: string
}

export type ItineraryDay = {
  id: string
  itinerary_id: string
  day_number: number
  title: string
  route?: string | null
  food?: string | null
  hotel?: string | null
  description?: string | null
  created_at: string
}

export type ItineraryStop = {
  id: string
  day_id: string
  place?: string | null
  title?: string | null
  duration?: string | null
  includes_ticket: boolean
  image_url?: string | null
  description?: string | null
  order_index: number
  created_at: string
}
