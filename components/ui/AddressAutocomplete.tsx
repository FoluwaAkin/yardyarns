'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

export interface PlaceResult {
  placeId: string
  description: string
  name: string
  address: string
  city: string
  state: string
  country: string
  lat: number | null
  lng: number | null
}

interface Prediction {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect: (place: PlaceResult) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search address…',
  className = '',
  autoFocus = false,
}: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 3) {
      setPredictions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/places?input=${encodeURIComponent(input)}`)
      const data = await res.json()
      setPredictions(data.predictions ?? [])
      setOpen((data.predictions ?? []).length > 0)
      setActiveIndex(-1)
    } catch {
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  async function handleSelect(prediction: Prediction) {
    onChange(prediction.description)
    setOpen(false)
    setPredictions([])
    setLoading(true)

    try {
      const res = await fetch(`/api/places?placeId=${encodeURIComponent(prediction.placeId)}`)
      const details = await res.json()
      onSelect({
        placeId: prediction.placeId,
        description: prediction.description,
        name: prediction.mainText,
        address: details.address || prediction.mainText,
        city: details.city || '',
        state: details.state || '',
        country: details.country || 'Nigeria',
        lat: details.lat,
        lng: details.lng,
      })
    } catch {
      // Fall back to just the description
      onSelect({
        placeId: prediction.placeId,
        description: prediction.description,
        name: prediction.mainText,
        address: prediction.mainText,
        city: '',
        state: '',
        country: 'Nigeria',
        lat: null,
        lng: null,
      })
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(predictions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
          />
        )}
      </div>

      {open && predictions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-900">
          {predictions.map((p, i) => (
            <li key={p.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                onClick={() => handleSelect(p)}
                className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition ${
                  i === activeIndex ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{p.mainText}</p>
                  {p.secondaryText && (
                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">{p.secondaryText}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
