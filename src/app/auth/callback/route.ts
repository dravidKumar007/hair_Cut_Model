import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/'

  if (!code) {
    return redirect(`/auth/error?error=Missing code in callback URL`)
  }

  const supabase = await createClient()

  // ✅ Exchange the code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  console.log('✅ Session established:', data.session)

  return redirect(next)
}
