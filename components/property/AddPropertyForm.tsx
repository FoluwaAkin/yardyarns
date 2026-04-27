'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AddressAutocomplete, type PlaceResult } from '@/components/ui/AddressAutocomplete'
import { Loader2, Plus, X } from 'lucide-react'

interface Props {
  userId: string
}

export function AddPropertyForm({ userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    lat: null as number | null,
    lng: null as number | null,
  })

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handlePlaceSelect(place: PlaceResult) {
    setForm((prev) => ({
      ...prev,
      // Auto-fill name from the place's mainText if user hasn't typed one yet
      name: prev.name || place.name || prev.name,
      address: place.address || prev.address,
      city: place.city || prev.city,
      state: place.state || prev.state,
      country: place.country || prev.country,
      lat: place.lat,
      lng: place.lng,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: property, error: propError } = await supabase
      .from('properties')
      .insert({
        name: form.name || null,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        lat: form.lat,
        lng: form.lng,
        created_by: userId,
      })
      .select('id')
      .single()

    setLoading(false)

    if (propError || !property) {
      setError(propError?.message ?? 'Failed to add property.')
      return
    }

    setOpen(false)
    setForm({ name: '', address: '', city: '', state: '', country: 'Nigeria', lat: null, lng: null })
    router.push(`/properties/${property.id}`)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <Plus size={16} />
        Add a property
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm dark:shadow-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Add a property</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="Building name / number (optional)"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />

        <div>
          <AddressAutocomplete
            value={form.address}
            onChange={(val) => setForm((prev) => ({ ...prev, address: val }))}
            onSelect={handlePlaceSelect}
            placeholder="Address *"
          />
          {form.city && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {form.city}, {form.state}, {form.country}
            </p>
          )}
        </div>

        {/* Editable city/state/country in case autocomplete misses them */}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            required
            value={form.city}
            onChange={handleChange('city')}
            placeholder="City *"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <input
            type="text"
            required
            value={form.state}
            onChange={handleChange('state')}
            placeholder="State *"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
        <input
          type="text"
          required
          value={form.country}
          onChange={handleChange('country')}
          placeholder="Country *"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Save property
        </button>
      </form>
    </div>
  )
}
