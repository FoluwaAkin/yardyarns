'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { verifyTenancy, rejectTenancy } from './actions'

export function VerificationActions({ tenancyId }: { tenancyId: string }) {
  const [loading, setLoading] = useState<'verify' | 'reject' | null>(null)
  const [done, setDone] = useState<'verified' | 'rejected' | null>(null)

  async function handle(action: 'verify' | 'reject') {
    setLoading(action)
    try {
      if (action === 'verify') await verifyTenancy(tenancyId)
      else await rejectTenancy(tenancyId)
      setDone(action === 'verify' ? 'verified' : 'rejected')
    } finally {
      setLoading(null)
    }
  }

  if (done) {
    return (
      <span className={`flex items-center gap-1.5 text-sm font-medium ${
        done === 'verified' ? 'text-green-600' : 'text-red-500'
      }`}>
        {done === 'verified'
          ? <><CheckCircle2 size={15} /> Verified</>
          : <><XCircle size={15} /> Rejected</>
        }
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handle('verify')}
        disabled={!!loading}
        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50 min-h-[36px]"
      >
        {loading === 'verify' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
        Verify
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={!!loading}
        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50 min-h-[36px]"
      >
        {loading === 'reject' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
        Reject
      </button>
    </div>
  )
}
