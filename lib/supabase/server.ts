import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Once you have a Supabase project, run:
//   supabase gen types typescript --project-id <id> > types/database.ts
// then pass the Database generic here.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient(): Promise<ReturnType<typeof createServerClient<any>>> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies will be set by middleware
          }
        },
      },
    }
  )
}

// Use this in Server Actions that must NOT write cookies.
// Writing cookies in a Server Action makes Next.js 16 re-render the entire
// current page as part of the action response. For lightweight mutations
// (delete, like, etc.) that re-render is unnecessary and can crash the page
// if the re-render itself fails. The middleware already refreshes the session
// token on every request, so deferring cookie writes to the next request is safe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createActionClient(): Promise<ReturnType<typeof createServerClient<any>>> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Intentional no-op: suppress cookie writes so Next.js does not
          // trigger an automatic page re-render. The middleware handles
          // token refresh on the next navigation.
        },
      },
    }
  )
}
