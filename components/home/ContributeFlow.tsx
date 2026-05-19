'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  MessageSquare, Star, ArrowLeft, Search,
  MapPin, Plus, Loader2, X, ChevronDown,
} from 'lucide-react'
import { PostComposer } from '@/components/posts/PostComposer'
import { ReviewComposer } from '@/components/review/ReviewComposer'

type Step = 'idle' | 'compose' | 'auth_gate'
type ContributeType = 'post' | 'review'

interface Property {
  id: string
  name: string | null
  address: string
  city: string
  state: string
}

interface Unit {
  id: string
  unit_identifier: string
}

export function ContributeFlow({
  currentUserId,
  currentUsername,
}: {
  currentUserId: string | null
  currentUsername: string | null
}) {
  const supabaseRef = useRef(createClient())
  const router = useRouter()

  const [step, setStep] = useState<Step>('idle')
  const [type, setType] = useState<ContributeType | null>(null)

  // Property picker state (lives inside compose step)
  const [query, setQuery] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [tenancyId, setTenancyId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(true) // open until unit chosen
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [newUnitName, setNewUnitName] = useState('')
  const [addingUnit, setAddingUnit] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounced property search
  useEffect(() => {
    if (query.trim().length < 2) {
      setProperties([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const tokens = query.trim().split(',').map(t => t.trim()).filter(Boolean)
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
      const { data } = await supabaseRef.current
        .from('properties')
        .select('id, name, address, city, state')
        .or(conditions)
        .limit(8)
      setProperties(data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function start(contributeType: ContributeType) {
    setType(contributeType)
    setStep('compose')
    setQuery('')
    setProperties([])
    setSelectedProperty(null)
    setUnits([])
    setSelectedUnit(null)
    setTenancyId(null)
    setPickerOpen(true)
    setShowAddUnit(false)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  function reset() {
    setStep('idle')
    setType(null)
    setSelectedProperty(null)
    setSelectedUnit(null)
    setQuery('')
    setProperties([])
    setUnits([])
    setPickerOpen(true)
    setTenancyId(null)
  }

  async function selectProperty(property: Property) {
    setSelectedProperty(property)
    setLoadingUnits(true)
    setQuery(property.name ?? property.address)
    setProperties([])
    const { data } = await supabaseRef.current
      .from('units')
      .select('id, unit_identifier')
      .eq('property_id', property.id)
      .order('unit_identifier')
    setUnits(data ?? [])
    setLoadingUnits(false)
  }

  async function selectUnit(unit: Unit) {
    setSelectedUnit(unit)
    setPickerOpen(false)

    if (!currentUserId) {
      setStep('auth_gate')
      return
    }

    if (type === 'review') {
      const { data } = await supabaseRef.current
        .from('tenancies')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('unit_id', unit.id)
        .eq('verification_status', 'verified')
        .maybeSingle()
      setTenancyId(data?.id ?? null)
    }
  }

  async function addUnit() {
    if (!newUnitName.trim() || !selectedProperty) return
    setAddingUnit(true)
    const { data, error } = await supabaseRef.current
      .from('units')
      .insert({ property_id: selectedProperty.id, unit_identifier: newUnitName.trim() })
      .select('id, unit_identifier')
      .single()
    setAddingUnit(false)
    if (!error && data) {
      const sorted = [...units, data].sort((a, b) =>
        a.unit_identifier.localeCompare(b.unit_identifier)
      )
      setUnits(sorted)
      setShowAddUnit(false)
      setNewUnitName('')
      await selectUnit(data)
    }
  }

  function onSuccess() {
    reset()
    router.refresh()
  }

  const propertyLabel = selectedProperty?.name ?? selectedProperty?.address ?? ''

  // ── IDLE ─────────────────────────────────────────────────────────────────
  if (step === 'idle') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => start('post')}
          className="group flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 px-3 py-2.5 text-left transition hover:border-amber-300 dark:hover:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/20 active:scale-[0.98]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-200 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400 transition group-hover:bg-amber-300 dark:group-hover:bg-amber-700/50">
            <MessageSquare size={13} />
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Share a story</span>
        </button>

        <button
          onClick={() => start('review')}
          className="group flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10 px-3 py-2.5 text-left transition hover:border-blue-300 dark:hover:border-blue-700/60 hover:bg-blue-100 dark:hover:bg-blue-900/20 active:scale-[0.98]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-200 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 transition group-hover:bg-blue-300 dark:group-hover:bg-blue-700/50">
            <Star size={13} />
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Write a review</span>
        </button>
      </div>
    )
  }

  // ── AUTH GATE ─────────────────────────────────────────────────────────────
  if (step === 'auth_gate') {
    const redirectTo = `/units/${selectedUnit?.id}`
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={15} />
          </button>
          <span className={`text-sm font-medium ${type === 'post' ? 'text-amber-500' : 'text-blue-500'}`}>
            {type === 'post' ? 'Share a story' : 'Write a review'}
          </span>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Sign in to {type === 'post' ? 'share your story' : 'write your review'} for{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {selectedUnit?.unit_identifier}
            {selectedProperty ? `, ${propertyLabel}` : ''}
          </span>
          .
        </p>
        <div className="flex gap-2">
          <a
            href={`/auth/signin?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Sign in
          </a>
          <a
            href="/auth/signup"
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-center text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Create account
          </a>
        </div>
      </div>
    )
  }

  // ── COMPOSE (with inline property picker) ────────────────────────────────
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={15} />
          </button>
          <span className={`flex items-center gap-1.5 text-sm font-medium ${type === 'post' ? 'text-amber-500' : 'text-blue-500'}`}>
            {type === 'post' ? <MessageSquare size={13} /> : <Star size={13} />}
            {type === 'post' ? 'Share a story' : 'Write a review'}
          </span>
        </div>
      </div>

      {/* Property picker */}
      <div className="px-4 pb-3">
        {selectedUnit && !pickerOpen ? (
          // Compact selected state
          <button
            onClick={() => { setPickerOpen(true); setSelectedUnit(null); setTenancyId(null) }}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left transition hover:border-gray-300 dark:hover:border-gray-500"
          >
            <MapPin size={13} className="shrink-0 text-gray-400" />
            <span className="min-w-0 flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">
              <span className="font-medium">{selectedUnit.unit_identifier}</span>
              {selectedProperty && (
                <span className="text-gray-400 dark:text-gray-500"> · {propertyLabel}, {selectedProperty.city}</span>
              )}
            </span>
            <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
              Change <ChevronDown size={11} />
            </span>
          </button>
        ) : (
          // Search / unit list
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {selectedProperty ? 'Select a unit' : 'Which property?'}
            </p>

            {!selectedProperty ? (
              // Property search
              <>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelectedProperty(null); setUnits([]) }}
                    placeholder="Address, building name or city…"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-8 pr-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>

                {query.trim().length >= 2 && (
                  searching ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                      <Loader2 size={12} className="animate-spin" /> Searching…
                    </div>
                  ) : properties.length === 0 ? (
                    <p className="py-2 text-xs text-gray-400 dark:text-gray-500">
                      No properties found.{' '}
                      <a href="/search" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300">
                        Add it here
                      </a>
                      , then come back.
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {properties.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectProperty(p)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <MapPin size={12} className="shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            {p.name && <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</p>}
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.address}, {p.city}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </>
            ) : (
              // Unit list
              <>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => { setSelectedProperty(null); setUnits([]); setQuery('') }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={11} /> {propertyLabel}
                  </button>
                </div>

                {loadingUnits ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                    <Loader2 size={12} className="animate-spin" /> Loading units…
                  </div>
                ) : (
                  <div className="space-y-1">
                    {units.length > 0 && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-1">
                        {units.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => selectUnit(u)}
                            className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.unit_identifier}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {showAddUnit ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={newUnitName}
                          onChange={(e) => setNewUnitName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') addUnit() }}
                          placeholder="e.g. Flat 3B, Room 12"
                          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:text-gray-100 dark:placeholder-gray-500"
                        />
                        <button
                          onClick={addUnit}
                          disabled={addingUnit || !newUnitName.trim()}
                          className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          {addingUnit ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddUnit(true)}
                        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 transition hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <Plus size={12} /> Add a unit
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Composer — only shown once unit is selected */}
      {selectedUnit && !pickerOpen && currentUserId && (
        <div className="border-t border-gray-100 dark:border-gray-700/60">
          {type === 'post' ? (
            <div className="p-4 pt-3">
              <PostComposer
                unitId={selectedUnit.id}
                userId={currentUserId}
                onSuccess={onSuccess}
              />
            </div>
          ) : (
            <div className="p-4 pt-3">
              <ReviewComposer
                unitId={selectedUnit.id}
                userId={currentUserId}
                tenancyId={tenancyId}
                onSuccess={onSuccess}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
