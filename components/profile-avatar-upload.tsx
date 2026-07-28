'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'

type ProfileAvatarUploadProps = {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
}

function initials(name?: string | null, email?: string | null) {
  const source = name || email || 'Viajero'
  return source.trim().charAt(0).toUpperCase()
}

export function ProfileAvatarUpload({ name, email, avatarUrl }: ProfileAvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl || null)
  const [selectedName, setSelectedName] = useState('')
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  return (
    <section className="flex items-center gap-4 sm:gap-5">
      <div className="relative flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F4A340] text-[2.65rem] font-black text-white shadow-sm ring-1 ring-slate-200 sm:h-28 sm:w-28">
        {previewUrl ? (
          <img src={previewUrl} alt="Avatar preview" className="h-full w-full object-cover" />
        ) : (
          initials(name, email)
        )}
        <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#14264F] text-white ring-2 ring-white sm:h-8 sm:w-8">
          <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-[1.02rem] font-black leading-tight text-slate-950 sm:text-2xl">{email}</p>
        <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#1E40AF] sm:px-5 sm:py-3 sm:text-base">
          Change Photo
          <input
            name="avatar_file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return

              if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
              const nextUrl = URL.createObjectURL(file)
              objectUrlRef.current = nextUrl
              setPreviewUrl(nextUrl)
              setSelectedName(file.name)
            }}
          />
        </label>
        <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-slate-500">
          {selectedName || 'JPG, PNG o WEBP · máximo 5 MB'}
        </p>
      </div>
    </section>
  )
}
