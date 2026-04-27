interface Props {
  label: string
  score: number  // 1–5
}

export function AspectRatingBar({ label, score }: Props) {
  const pct = (score / 5) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-xs text-gray-500 dark:text-gray-400 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-gray-800 dark:bg-gray-200 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right text-xs font-medium text-gray-700 dark:text-gray-300">{score}</span>
    </div>
  )
}
