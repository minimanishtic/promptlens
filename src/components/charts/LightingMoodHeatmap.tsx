'use client'

import type { HeatmapCell } from '@/lib/analytics-dashboard'

const LIGHTINGS = ['Studio', 'Natural/Golden Hour', 'Flash/Harsh', 'Moody/Low-key', 'Neon/Colored', 'Backlit']
const MOODS = ['Warm', 'Cold', 'Dramatic', 'Intimate', 'Energetic', 'Nostalgic', 'Dark/Gritty', 'Clean/Minimal']

interface Props {
  data: HeatmapCell[]
}

export default function LightingMoodHeatmap({ data }: Props) {
  const countMap = new Map(data.map((d) => [`${d.lighting}|||${d.mood}`, d.count]))
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  const getCount = (lighting: string, mood: string) =>
    countMap.get(`${lighting}|||${mood}`) ?? 0

  const bgColor = (count: number) => {
    if (count === 0) return 'bg-zinc-900'
    const intensity = count / maxCount
    if (intensity > 0.75) return 'bg-sky-500'
    if (intensity > 0.5) return 'bg-sky-600'
    if (intensity > 0.25) return 'bg-sky-800'
    if (intensity > 0.1) return 'bg-sky-800'
    return 'bg-sky-950'
  }

  const textColor = (count: number) => {
    const intensity = count / maxCount
    return intensity > 0.25 ? 'text-white' : intensity > 0 ? 'text-sky-300' : 'text-zinc-700'
  }

  return (
    <>
    <p className="text-xs text-zinc-400 mb-3 sm:hidden text-center flex items-center justify-center gap-1.5">
      <span>←</span>
      <span>Swipe to view full table</span>
      <span>→</span>
    </p>
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[640px]">
        <thead>
          <tr>
            <th className="text-left p-2 text-zinc-500 font-medium w-36 whitespace-nowrap">Lighting \ Mood</th>
            {MOODS.map((mood) => (
              <th key={mood} className="p-2 text-zinc-400 font-medium text-center whitespace-nowrap">
                {mood.split('/')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LIGHTINGS.map((lighting) => (
            <tr key={lighting}>
              <td className="p-2 text-zinc-400 font-medium whitespace-nowrap pr-4">
                {lighting.split('/')[0]}
              </td>
              {MOODS.map((mood) => {
                const count = getCount(lighting, mood)
                return (
                  <td
                    key={mood}
                    className={`p-0 text-center`}
                    title={`${lighting} × ${mood}: ${count.toLocaleString()} images`}
                  >
                    <div className={`${bgColor(count)} ${textColor(count)} m-0.5 rounded py-2 px-1 tabular-nums`}>
                      {count > 0 ? count.toLocaleString() : '—'}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-3 mt-4 justify-end">
        <span className="text-xs text-zinc-600">Fewer</span>
        {['bg-sky-950', 'bg-sky-800', 'bg-sky-700', 'bg-sky-600', 'bg-sky-500'].map((bg) => (
          <div key={bg} className={`w-6 h-4 rounded ${bg}`} />
        ))}
        <span className="text-xs text-zinc-600">More</span>
      </div>
    </div>
    </>
  )
}
