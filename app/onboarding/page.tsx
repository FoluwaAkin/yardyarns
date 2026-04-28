'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'
  const supabase = createClient()

  const [username, setUsername] = useState('')
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/signin'); return }
      supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.username) {
            setCurrentUsername(data.username)
            setUsername(data.username)
          }
          setChecking(false)
        })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isChanging = currentUsername !== null
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (clean.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscores).')
      return
    }

    if (clean === currentUsername) {
      router.push(nextPath)
      return
    }

    setLoading(true)

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', clean)
      .maybeSingle()

    if (existing) {
      setLoading(false)
      setError('That username is already taken.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setError('Session expired. Please sign in again.')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          username: clean,
          email_verified: !!user.email_confirmed_at,
        },
        { onConflict: 'id' }
      )

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      router.push(nextPath)
      router.refresh()
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isChanging ? 'Change username' : 'Choose a username'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isChanging
              ? 'Your username is the only thing other people see. No email or real name.'
              : 'This is what others see on your posts. No email or real name, just your handle.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 dark:focus-within:border-gray-400 dark:focus-within:ring-gray-400">
              <span className="flex items-center rounded-l-lg border-r border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-sm text-gray-500 dark:text-gray-400">
                @
              </span>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-r-lg px-3 py-2.5 text-sm outline-none dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                placeholder="yourhandle"
                maxLength={30}
                autoFocus
              />
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Letters, numbers, and underscores only. Min 3 characters.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || clean.length < 3}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isChanging ? 'Save changes' : 'Save username'}
          </button>

          {isChanging && (
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full rounded-lg px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}
