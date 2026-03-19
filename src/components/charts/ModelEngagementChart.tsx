'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { ModelEngagementRow } from '@/lib/analytics'
import { MODEL_DISPLAY_NAMES } from '@/types/database'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  data: ModelEngagementRow[]
}

export default function ModelEngagementChart({ data }: Props) {
  const labels = data.map((r) => MODEL_DISPLAY_NAMES[r.model] ?? r.model)
  const values = data.map((r) => r.avg_views)
  const counts = data.map((r) => r.count)

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: 'Avg Views',
            data: values,
            backgroundColor: values.map((_, i) =>
              `hsl(${270 - i * 18}, 70%, ${55 - i * 3}%)`,
            ),
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      }}
      options={{
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) =>
                ` Avg ${(item.raw as number).toLocaleString()} views (${counts[item.dataIndex].toLocaleString()} images)`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#71717a', font: { size: 11 } },
            grid: { color: '#27272a' },
          },
          y: {
            ticks: { color: '#a1a1aa', font: { size: 12 } },
            grid: { color: 'transparent' },
          },
        },
      }}
    />
  )
}
