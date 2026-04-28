import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import { AddUnitForm } from '@/components/property/AddUnitForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (!property) notFound()

  const { data: units } = await supabase
    .from('units')
    .select('id, unit_identifier, created_at')
    .eq('property_id', id)
    .order('unit_identifier')

  // Fetch aggregate scores for all units at once
  const unitIds = (units ?? []).map((u) => u.id)
  const { data: scores } = unitIds.length
    ? await supabase
        .from('unit_aggregate_scores')
        .select('unit_id, aspect, avg_score')
        .in('unit_id', unitIds)
    : { data: [] }

  // Group scores by unit_id → overall avg
  const unitOverallScore: Record<string, number> = {}
  if (scores) {
    const grouped: Record<string, number[]> = {}
    for (const row of scores) {
      if (!grouped[row.unit_id]) grouped[row.unit_id] = []
      grouped[row.unit_id].push(Number(row.avg_score))
    }
    for (const [uid, vals] of Object.entries(grouped)) {
      unitOverallScore[uid] = vals.reduce((a, b) => a + b, 0) / vals.length
    }
  }

  return (
    <div className="space-y-6">
      {/* Property header */}
      <div>
        {property.name && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{property.name}</h1>
        )}
        <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <MapPin size={14} />
          {property.address}, {property.city}, {property.state}
        </p>
      </div>

      {/* Units list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Units
          </h2>
          {user && <AddUnitForm propertyId={id} />}
        </div>

        {(units ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No units yet.{user ? ' Add the first one.' : ' Sign in to add one.'}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {(units ?? []).map((unit) => {
              const score = unitOverallScore[unit.id]
              return (
                <Link
                  key={unit.id}
                  href={`/units/${unit.id}`}
                  className="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[56px]"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {unit.unit_identifier}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    {score !== undefined ? (
                      <span className="font-medium text-gray-900 dark:text-gray-100">{score.toFixed(1)} ★</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">No verified ratings</span>
                    )}
                    <ChevronRight size={14} />
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
