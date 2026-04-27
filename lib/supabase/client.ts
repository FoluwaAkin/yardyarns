import { createBrowserClient } from '@supabase/ssr'

// Once you have a Supabase project, replace with:
//   import type { Database } from '@/types/database'
//   createBrowserClient<Database>(...)
// or run: supabase gen types typescript --project-id <id> > types/database.ts

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): ReturnType<typeof createBrowserClient<any>> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
