import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/login')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role
    const isClient = role === 'client'
    const isCollaborator = role === 'collaborator' || role === 'tour_leader'
    const isClientArea = pathname === '/client' || pathname.startsWith('/client/')
    const isCollaboratorArea = pathname === '/collaborator' || pathname.startsWith('/collaborator/')

    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = isClient ? '/client/dashboard' : isCollaborator ? '/collaborator/dashboard' : '/dashboard'
      return NextResponse.redirect(url)
    }

    if (isClient && !isClientArea) {
      const url = request.nextUrl.clone()
      url.pathname = '/client/dashboard'
      return NextResponse.redirect(url)
    }

    if (isCollaborator && !isCollaboratorArea) {
      const url = request.nextUrl.clone()
      url.pathname = '/collaborator/dashboard'
      return NextResponse.redirect(url)
    }

    if (!isClient && isClientArea) {
      const url = request.nextUrl.clone()
      url.pathname = isCollaborator ? '/collaborator/dashboard' : '/dashboard'
      return NextResponse.redirect(url)
    }

    if (!isCollaborator && isCollaboratorArea) {
      const url = request.nextUrl.clone()
      url.pathname = isClient ? '/client/dashboard' : '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  // Importante para PWA: NO proteger manifest, service worker ni assets públicos.
  // Si el middleware redirige /site.webmanifest o /sw.js a /login, Chrome no detecta
  // la app como instalable y solo muestra "Crear acceso directo".
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|site.webmanifest|manifest.webmanifest|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|json|js|css|txt)$).*)'
  ]
}
