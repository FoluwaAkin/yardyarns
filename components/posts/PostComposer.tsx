'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Loader2, Play } from 'lucide-react'

const MAX_CHARS = 500
const MAX_FILES = 4
const MAX_IMAGE_BYTES = 10 * 1024 * 1024   // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024   // 50 MB
const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime'

interface MediaItem {
  localId: string
  file: File
  previewUrl: string   // object URL for local preview
  status: 'uploading' | 'done' | 'error'
  uploadedUrl?: string
  error?: string
}

interface Props {
  unitId: string
  userId: string
  onSuccess?: () => void
}

export function PostComposer({ unitId, userId, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [body, setBody] = useState('')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = MAX_CHARS - body.length
  const allUploaded = media.every((m) => m.status === 'done')
  const anyUploading = media.some((m) => m.status === 'uploading')

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''                     // allow re-selecting same file

    const available = MAX_FILES - media.length
    if (available <= 0) return
    const toAdd = files.slice(0, available)

    const newItems: MediaItem[] = toAdd.map((file) => ({
      localId: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
    }))

    setMedia((prev) => [...prev, ...newItems])

    // Upload each immediately
    for (const item of newItems) {
      const isVideo = item.file.type.startsWith('video/')
      const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
      const label = isVideo ? 'Videos' : 'Images'

      if (item.file.size > maxBytes) {
        setMedia((prev) =>
          prev.map((m) =>
            m.localId === item.localId
              ? { ...m, status: 'error', error: `${label} must be under ${isVideo ? '50' : '10'} MB` }
              : m
          )
        )
        continue
      }

      const ext = item.file.name.split('.').pop() ?? 'bin'
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(path, item.file, { contentType: item.file.type, upsert: false })

      if (uploadError || !data) {
        setMedia((prev) =>
          prev.map((m) =>
            m.localId === item.localId
              ? { ...m, status: 'error', error: 'Upload failed' }
              : m
          )
        )
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(data.path)

      setMedia((prev) =>
        prev.map((m) =>
          m.localId === item.localId
            ? { ...m, status: 'done', uploadedUrl: publicUrl }
            : m
        )
      )
    }
  }

  function removeMedia(localId: string) {
    setMedia((prev) => {
      const item = prev.find((m) => m.localId === localId)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((m) => m.localId !== localId)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (body.trim().length === 0 && media.length === 0) return
    if (anyUploading) return
    setError(null)
    setLoading(true)

    const mediaUrls = media.filter((m) => m.status === 'done').map((m) => m.uploadedUrl!)

    const { error: insertError } = await supabase.from('posts').insert({
      unit_id: unitId,
      user_id: userId,
      body: body.trim(),
      media_urls: mediaUrls,
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      setBody('')
      media.forEach((m) => URL.revokeObjectURL(m.previewUrl))
      setMedia([])
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    }
  }

  const canSubmit = (body.trim().length > 0 || media.some((m) => m.status === 'done')) && !anyUploading

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        Share your experience — horror stories or great moments
      </p>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_CHARS}
        rows={3}
        placeholder="What's it like living here?"
        className="w-full resize-none rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
      />

      {/* Media previews */}
      {media.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {media.map((m) => {
            const isVideo = m.file.type.startsWith('video/')
            return (
              <div
                key={m.localId}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
              >
                {isVideo ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-900 text-white">
                    <Play size={18} />
                    <span className="line-clamp-1 max-w-full px-1 text-[9px] text-gray-300">
                      {m.file.name}
                    </span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.previewUrl} alt="" className="h-full w-full object-cover" />
                )}

                {/* Uploading overlay */}
                {m.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                )}

                {/* Error overlay */}
                {m.status === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/70 p-1">
                    <span className="text-center text-[9px] leading-tight text-white">{m.error}</span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeMedia(m.localId)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/70 text-white transition hover:bg-gray-900"
                >
                  <X size={10} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Add media button */}
          {media.length < MAX_FILES && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={onFilesSelected}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Add photos or videos"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 transition hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <ImagePlus size={14} />
                <span className="hidden sm:inline">
                  Photo / Video {media.length > 0 && `(${media.length}/${MAX_FILES})`}
                </span>
              </button>
            </>
          )}

          <span className={`text-xs ${remaining < 50 ? 'text-amber-500' : 'text-gray-400'}`}>
            {remaining}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50 min-h-[44px]"
          >
            {(loading || anyUploading) && <Loader2 size={12} className="animate-spin" />}
            Post
          </button>
        </div>
      </div>
    </form>
  )
}
