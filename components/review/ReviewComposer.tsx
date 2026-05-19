'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { REVIEW_ASPECTS } from '@/types'
import { Loader2, Star } from 'lucide-react'
import { format, addDays, differenceInDays } from 'date-fns'

interface Props {
  unitId: string
  userId: string
  tenancyId: string | null  // null = unverified
  onSuccess?: () => void
}

const CURRENT_MONTH_START = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
const CURRENT_MONTH_END = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-1 transition"
        >
          <Star
            size={20}
            className={
              n <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-200 dark:text-gray-600 fill-gray-200 dark:fill-gray-600'
            }
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewComposer({ unitId, userId, tenancyId, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [periodStart, setPeriodStart] = useState(CURRENT_MONTH_START)
  const [periodEnd, setPeriodEnd] = useState(CURRENT_MONTH_END)
  const [body, setBody] = useState('')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rentAmount, setRentAmount] = useState('')
  const [rentFrequency, setRentFrequency] = useState<'annual' | 'monthly'>('annual')
  const [serviceCharge, setServiceCharge] = useState('')
  const [agencyFee, setAgencyFee] = useState('')
  const [legalFee, setLegalFee] = useState('')
  const [cautionDeposit, setCautionDeposit] = useState('')

  function setScore(aspect: string, value: number) {
    setScores((prev) => ({ ...prev, [aspect]: value }))
  }

  function validatePeriod() {
    const diff = differenceInDays(new Date(periodEnd), new Date(periodStart))
    if (diff < 6) return 'Period must be at least 7 days.'
    if (diff > 30) return 'Period must be at most 31 days.'
    return null
  }

  function parsePrice(label: string, raw: string): { value: number | null; err: string | null } {
    const trimmed = raw.trim()
    if (!trimmed) return { value: null, err: null }
    const n = Number(trimmed)
    if (!Number.isFinite(n) || n < 0) {
      return { value: null, err: `${label} must be a non-negative number.` }
    }
    return { value: n, err: null }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const periodError = validatePeriod()
    if (periodError) { setError(periodError); return }
    if (body.trim().length < 10) { setError('Body must be at least 10 characters.'); return }
    const missingAspects = REVIEW_ASPECTS.filter(({ key }) => !scores[key])
    if (missingAspects.length > 0) {
      setError(`Please rate all aspects. Missing: ${missingAspects.map(a => a.label).join(', ')}.`)
      return
    }

    const priceFields: Record<string, { value: number | null; err: string | null }> = {}
    if (tenancyId) {
      priceFields.rent_amount = parsePrice('Rent', rentAmount)
      priceFields.service_charge = parsePrice('Service charge', serviceCharge)
      priceFields.agency_fee = parsePrice('Agency fee', agencyFee)
      priceFields.legal_fee = parsePrice('Legal fee', legalFee)
      priceFields.caution_deposit = parsePrice('Caution deposit', cautionDeposit)
      const firstErr = Object.values(priceFields).find((p) => p.err)?.err
      if (firstErr) { setError(firstErr); return }
    }

    setError(null)
    setLoading(true)

    const pricingPayload = tenancyId
      ? {
          rent_amount: priceFields.rent_amount.value,
          rent_frequency: priceFields.rent_amount.value !== null ? rentFrequency : null,
          service_charge: priceFields.service_charge.value,
          agency_fee: priceFields.agency_fee.value,
          legal_fee: priceFields.legal_fee.value,
          caution_deposit: priceFields.caution_deposit.value,
        }
      : {}

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        unit_id: unitId,
        user_id: userId,
        tenancy_id: tenancyId,
        period_start: periodStart,
        period_end: periodEnd,
        body: body.trim(),
        ...pricingPayload,
      })
      .select('id')
      .single()

    if (reviewError || !review) {
      setLoading(false)
      if (reviewError?.code === '23505') {
        setError('You already reviewed this unit for that period.')
      } else {
        setError(reviewError?.message ?? 'Failed to save review.')
      }
      return
    }

    // Insert ratings
    const { error: ratingsError } = await supabase.from('ratings').insert(
      REVIEW_ASPECTS.map(({ key }) => ({
        review_id: review.id,
        aspect: key,
        score: scores[key],
      }))
    )

    setLoading(false)

    if (ratingsError) {
      setError(ratingsError.message)
      return
    }

    setBody('')
    setScores({})
    setRentAmount('')
    setServiceCharge('')
    setAgencyFee('')
    setLegalFee('')
    setCautionDeposit('')
    if (onSuccess) {
      onSuccess()
    } else {
      router.refresh()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Write a review</h3>

      {!tenancyId && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          You&apos;re posting as an unverified user. Your ratings won&apos;t affect the
          unit&apos;s overall score until you{' '}
          <a href="/dashboard/verify" className="underline">
            verify your tenancy
          </a>
          .
        </p>
      )}

      {/* Period picker */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Review period</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">From</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">To</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              min={format(addDays(new Date(periodStart), 6), 'yyyy-MM-dd')}
              max={format(addDays(new Date(periodStart), 30), 'yyyy-MM-dd')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Min 7 days, max 31 days.</p>
      </div>

      {/* Aspect ratings */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Rate each aspect</p>
        <div className="space-y-3">
          {REVIEW_ASPECTS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
              <StarRating value={scores[key] ?? 0} onChange={(v) => setScore(key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">Your experience</p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Describe your time living here…"
          className="w-full resize-none rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
      </div>

      {/* Commercial terms — verified tenants only */}
      {tenancyId && (
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-900/10 p-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Commercial terms <span className="text-gray-400 dark:text-gray-500">(optional)</span></p>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">From your verified rental agreement. Skip any that don&apos;t apply.</p>
          </div>

          {/* Rent + frequency toggle */}
          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">Rent</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  placeholder="e.g. 2500000"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-7 pr-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
              <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setRentFrequency('annual')}
                  className={`rounded-md px-2.5 py-1.5 transition ${rentFrequency === 'annual' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  / year
                </button>
                <button
                  type="button"
                  onClick={() => setRentFrequency('monthly')}
                  className={`rounded-md px-2.5 py-1.5 transition ${rentFrequency === 'monthly' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  / month
                </button>
              </div>
            </div>
          </div>

          {/* Service charge */}
          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">Service charge</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-7 pr-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* One-off fees */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Agency', value: agencyFee, set: setAgencyFee },
              { label: 'Legal', value: legalFee, set: setLegalFee },
              { label: 'Caution', value: cautionDeposit, set: setCautionDeposit },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">{label}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₦</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-6 pr-2 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50 min-h-[44px]"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        Submit review
      </button>
    </form>
  )
}
