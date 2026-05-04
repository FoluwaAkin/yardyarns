import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { AddPropertyForm } from '@/components/property/AddPropertyForm'
import { SearchInput } from '@/components/property/SearchInput'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let properties: {
    id: string
    name: string | null
    address: string
    city: string
    state: string
  }[] = []

  if (q && q.trim().length > 0) {
    // Split on commas so "The Juliana, Ilasan" searches both tokens independently
    const tokens = q.trim().split(',').map(t => t.trim()).filter(Boolean)
    const conditions = tokens
      .flatMap(token => {
        const term = `%${token}%`
        return [
          `address.ilike.${term}`,
          `city.ilike.${term}`,
          `state.ilike.${term}`,
          `name.ilike.${term}`,
        ]
      })
      .join(',')
    const { data } = await supabase
      .from('properties')
      .select('id, name, address, city, state')
      .or(conditions)
      .limit(30)
    properties = data ?? []
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Find a property</h1>

      {/* Search form */}
      <SearchInput defaultValue={q} />

      {/* Results */}
      {q && (
        <div>
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            {properties.length} result{properties.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
          </p>

          {properties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No properties found.</p>
              {user && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Be the first to add it below.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              {properties.map((p) => (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  className="flex items-center gap-3 px-4 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[56px]"
                >
                  <MapPin size={16} className="shrink-0 text-gray-400" />
                  <div>
                    {p.name && (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {p.address}, {p.city}, {p.state}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add property */}
      {user && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Don&apos;t see your property?
          </p>
          <AddPropertyForm userId={user.id} />
        </div>
      )}
    </div>
  )
}
