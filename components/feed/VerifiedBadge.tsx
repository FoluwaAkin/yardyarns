import { BadgeCheck } from 'lucide-react'

export function VerifiedBadge() {
  return (
    <span
      title="Verified tenant"
      className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400"
    >
      <BadgeCheck size={10} />
      Verified
    </span>
  )
}
