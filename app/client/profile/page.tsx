import type { ElementType } from 'react'
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  Lock,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { ProfileAvatarUpload } from '@/components/profile-avatar-upload'
import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase-server'
import { updateClientProfile } from './actions'

function splitName(fullName?: string | null) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}


function SettingsRow({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <button type="button" className="flex w-full items-center gap-3.5 border-b border-slate-200 py-3.5 text-left last:border-b-0 sm:gap-4 sm:py-4">
      <Icon className="h-5 w-5 shrink-0 text-slate-800 sm:h-6 sm:w-6" />
      <span className="flex-1 text-[15px] font-semibold text-slate-950 sm:text-base">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-900 sm:h-5 sm:w-5" />
    </button>
  )
}

export default async function ClientProfilePage({ searchParams }: { searchParams?: Promise<{ success?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
  const { data: client } = await supabase.from('clients').select('*').eq('profile_id', user?.id).single()
  const { firstName, lastName } = splitName(profile?.full_name)

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <div className="hidden lg:mb-8 lg:block">
          <p className="text-sm font-bold uppercase tracking-widest text-[#1E40AF]">Portal cliente</p>
          <h1 className="mt-1 text-3xl font-black text-[#14264F]">Profile</h1>
          <p className="mt-2 text-slate-500">Actualiza tus datos, avatar y preferencias de cuenta.</p>
        </div>

        <div className="lg:hidden">
          <h1 className="mb-6 text-[2rem] font-black leading-none text-slate-950">Profile</h1>
        </div>

        {params?.success ? (
          <div className="mb-5 rounded-2xl bg-[#14264F]/10 p-4 text-sm font-bold text-[#1E40AF]">{params.success}</div>
        ) : null}

        <form action={updateClientProfile} className="space-y-6 sm:space-y-7">
          <input type="hidden" name="full_name" value={profile?.full_name || ''} />
          <input type="hidden" name="existing_avatar_url" value={profile?.avatar_url || ''} />

          <ProfileAvatarUpload
            name={profile?.full_name}
            email={profile?.email || user?.email}
            avatarUrl={profile?.avatar_url}
          />

          <section className="space-y-3.5 sm:space-y-4">
            <input name="first_name" defaultValue={firstName} className="profile-input" placeholder="First Name" />
            <input name="last_name" defaultValue={lastName} className="profile-input" placeholder="Last Name" />

            <div className="relative">
              <span className="absolute -top-2 left-5 bg-white px-2 text-sm font-semibold text-slate-500">Email</span>
              <input value={profile?.email || user?.email || ''} className="profile-input bg-white text-slate-500" disabled />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <div className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                <span className="text-2xl">🇵🇪</span>
                <span className="text-slate-500">▾</span>
                <span>+51</span>
              </div>
              <input name="phone" defaultValue={profile?.phone || ''} className="profile-input" placeholder="Phone Number" />
            </div>

            <input name="country" defaultValue={client?.country || ''} className="profile-input" placeholder="Country" />
            <input name="passport_number" defaultValue={client?.passport_number || ''} className="profile-input" placeholder="Passport Number" />
          </section>

          <button className="btn-primary w-full sm:w-auto">Guardar mis datos</button>
        </form>

        <section className="mt-8 pb-6 sm:mt-9">
          <h2 className="mb-3 text-[1.55rem] font-black text-slate-950 sm:mb-4 sm:text-2xl">Settings</h2>
          <div className="bg-white">
            <SettingsRow icon={Bell} label="Notifications" />
            <SettingsRow icon={ShieldCheck} label="Permissions" />
            <SettingsRow icon={Lock} label="Privacy Policy" />
            <SettingsRow icon={FileText} label="Terms of Use" />
            <SettingsRow icon={Trash2} label="Delete Your Account" />
            <SettingsRow icon={HelpCircle} label="Help Center" />
          </div>

          <div className="mt-7">
            <LogoutButton variant="outlineDanger" />
          </div>
        </section>
      </div>
    </PageShell>
  )
}
