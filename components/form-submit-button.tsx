'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

type FormSubmitButtonProps = {
  idleText: string
  pendingText?: string
  className?: string
}

export function FormSubmitButton({ idleText, pendingText = 'Procesando...', className = 'btn-primary' }: FormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button className={className} disabled={pending}>
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingText}
        </span>
      ) : idleText}
    </button>
  )
}
