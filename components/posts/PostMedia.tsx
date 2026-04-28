import { Play } from 'lucide-react'

function isVideo(url: string) {
  return /\.(mp4|webm|mov|ogg|quicktime)(\?|$)/i.test(url)
}

interface Props {
  urls: string[]
}

export function PostMedia({ urls }: Props) {
  if (!urls || urls.length === 0) return null

  const count = urls.length

  // Grid layout classes per count
  const gridClass =
    count === 1 ? 'grid-cols-1' :
    count === 2 ? 'grid-cols-2' :
    count === 3 ? 'grid-cols-2' :
    'grid-cols-2'

  return (
    <div className={`grid gap-1 rounded-xl overflow-hidden ${gridClass} mb-4`}>
      {urls.map((url, i) => {
        // 3-item layout: first spans full width
        const spanFull = count === 3 && i === 0

        if (isVideo(url)) {
          return (
            <div
              key={url}
              className={`relative bg-black ${spanFull ? 'col-span-2' : ''}`}
            >
              <video
                src={url}
                controls
                preload="metadata"
                playsInline
                className="w-full max-h-72 object-contain"
              />
            </div>
          )
        }

        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block overflow-hidden bg-gray-100 dark:bg-gray-800 ${spanFull ? 'col-span-2' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              loading="lazy"
              className={`w-full object-cover ${count === 1 ? 'max-h-96' : 'h-40'}`}
            />
          </a>
        )
      })}
    </div>
  )
}

// Compact video placeholder shown in the upload preview before the URL resolves
export function VideoThumb({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-900 text-white">
      <Play size={20} />
      <span className="line-clamp-1 max-w-full px-1 text-[10px] text-gray-300">{name}</span>
    </div>
  )
}
