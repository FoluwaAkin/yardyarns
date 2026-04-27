'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AddressAutocomplete, type PlaceResult } from '@/components/ui/AddressAutocomplete'

interface Props {
  defaultValue?: string
}

export function SearchInput({ defaultValue = '' }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function submit(query: string) {
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  function handleSelect(place: PlaceResult) {
    // Use the building/estate name as the search term — it's what's stored in the name column
    const query = place.name || place.description
    setValue(query)
    submit(query)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit(value)
    }
  }

  return (
    <form onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); submit(value) }}>
      <div className="flex gap-2">
        <AddressAutocomplete
          value={value}
          onChange={setValue}
          onSelect={handleSelect}
          placeholder="Search by address, city, or estate name…"
          className="flex-1"
          autoFocus={false}
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 dark:hover:bg-gray-300"
        >
          Search
        </button>
      </div>
    </form>
  )
}
