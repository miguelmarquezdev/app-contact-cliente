import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#030712] p-4 text-white">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.22),transparent_30rem),radial-gradient(circle_at_bottom_right,rgba(249,115,22,.18),transparent_30rem)]" />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  )
}
