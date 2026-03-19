'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { VisualStyleRow } from '@/lib/analytics'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = [
  '#7c3aed', '#a855f7', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6',
]

interface Props {
  data: VisualStyleRow[]
}

export default function VisualStyleDonut({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <Doughnut
      data={{
        labels: data.map((d) => d.visual_style),
        datasets: [
          {
            data: data.map((d) => d.count),
            backgroundColor: COLORS.map((c) => c + 'cc'),
            borderColor: COLORS,
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#a1a1aa', font: { size: 12 }, padding: 14, boxWidth: 14 },
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                const count = item.raw as number
                const pct = ((count / total) * 100).toFixed(1)
                return ` ${count.toLocaleString()} (${pct}%)`
              },
            },
          },
        },
      }}
    />
  )
}
