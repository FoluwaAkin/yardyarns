import { REVIEW_ASPECTS } from '@/types'

interface ScoreRow {
  aspect: string
  avg_score: number
  review_count: number
}

interface Props {
  scores: ScoreRow[]
}

export function UnitScorePanel({ scores }: Props) {
  const scoreMap = Object.fromEntries(scores.map((s) => [s.aspect, s]))

  if (scores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
        No verified ratings yet.
      </div>
    )
  }

  const overall =
    scores.reduce((sum, s) => sum + Number(s.avg_score), 0) / scores.length

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      {/* Overall */}
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{overall.toFixed(1)}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">/ 5 (verified ratings)</span>
      </div>

      {/* Per-aspect bars */}
      <div className="space-y-2.5">
        {REVIEW_ASPECTS.map(({ key, label }) => {
          const row = scoreMap[key]
          const score = row ? Number(row.avg_score) : null
          const pct = score ? (score / 5) * 100 : 0

          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                {score !== null ? (
                  <span className="font-medium text-gray-900 dark:text-gray-100">{score.toFixed(1)}</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-gray-900 dark:bg-gray-200 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
