import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-white p-4 text-[#14264F]">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.16),transparent_30rem),radial-gradient(circle_at_bottom_right,rgba(20,38,79,.10),transparent_30rem)]" />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  )
}
