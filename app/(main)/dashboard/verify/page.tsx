'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AddressAutocomplete, type PlaceResult } from '@/components/ui/AddressAutocomplete'
import { Loader2, Upload, CheckCircle2 } from 'lucide-react'
import { submitTenancy } from './actions'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export default function VerifyTenancyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    lat: null as number | null,
    lng: null as number | null,
    unitIdentifier: '',
    startDate: '',
    endDate: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handlePlaceSelect(place: PlaceResult) {
    setForm((prev) => ({
      ...prev,
      address: place.address || place.name || prev.address,
      city: place.city || prev.city,
      state: place.state || prev.state,
      country: place.country || prev.country,
      lat: place.lat,
      lng: place.lng,
    }))
  }

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setFileError(null)
    setFile(null)
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError('Only PDF, JPEG, and PNG files are accepted.')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('File must be under 5MB.')
      return
    }
    setFile(f)
  }

  async function uploadFile(): Promise<string | null> {
    if (!file) return null
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    setUploadProgress(0)

    const { error: uploadError } = await supabase.storage
      .from('tenancy-agreements')
      .upload(path, file, { upsert: false })

    if (uploadError) {
      setFileError(uploadError.message)
      setUploadProgress(null)
      return null
    }

    setUploadProgress(100)
    return path
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.address.trim()) { setError('Please enter your property address.'); return }
    if (!form.city.trim()) { setError('Please enter your city.'); return }
    if (!form.unitIdentifier.trim()) { setError('Please enter your unit (e.g. Flat 3B).'); return }
    if (!form.startDate) { setError('Please enter your tenancy start date.'); return }
    if (!file) { setError('Please upload your tenancy agreement.'); return }

    setLoading(true)

    try {
      // Upload file client-side (needs browser File API)
      const agreementPath = await uploadFile()
      if (!agreementPath) { setLoading(false); return }

      // All DB writes go through server action — avoids client-side RLS/JWT issues
      const result = await submitTenancy({
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        lat: form.lat,
        lng: form.lng,
        unitIdentifier: form.unitIdentifier,
        startDate: form.startDate,
        endDate: form.endDate,
        agreementPath,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <CheckCircle2 size={48} className="text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agreement submitted!</h2>
        <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
          Your tenancy is under review. Once verified, your ratings will count towards the
          unit&apos;s overall score.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Verify your tenancy</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload your tenancy agreement to become a verified tenant. Your ratings will then
          count towards the unit&apos;s overall score.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Address autocomplete */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Property address *</label>
          <AddressAutocomplete
            value={form.address}
            onChange={(val) => setForm((prev) => ({ ...prev, address: val }))}
            onSelect={handlePlaceSelect}
            placeholder="Start typing your property address…"
          />
          {form.city && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {form.city}, {form.state}, {form.country}
            </p>
          )}
        </div>

        {/* City / State / Country fallback */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        />

        {/* Unit identifier */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Unit / Flat *</label>
          <input
            type="text"
            required
            value={form.unitIdentifier}
            onChange={handleChange('unitIdentifier')}
            placeholder="e.g. Flat 3B, Room 12, Block A"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tenancy start *</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={handleChange('startDate')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tenancy end</label>
            <input
              type="date"
              value={form.endDate}
              onChange={handleChange('endDate')}
              min={form.startDate}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Leave blank if you still live here</p>
          </div>
        </div>

        {/* File upload */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tenancy agreement *
          </label>
          <div className={`rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
            file ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
          }`}>
            {file ? (
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 size={20} className="text-green-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                {uploadProgress === 100 && <p className="text-xs text-green-600">Uploaded</p>}
                {uploadProgress !== null && uploadProgress < 100 && (
                  <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setFile(null); setUploadProgress(null) }}
                  className="mt-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Upload size={20} className="text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">PDF, JPEG or PNG — max 5MB</p>
                <label className="cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px] flex items-center">
                  Browse files
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>
            )}
          </div>
          {fileError && <p className="mt-1 text-xs text-red-600">● {fileError}</p>}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50 min-h-[44px]"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Submit for verification
        </button>
      </form>
    </div>
  )
}
