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
import type { ModelCategoryRow } from '@/lib/analytics'
import { MODEL_DISPLAY_NAMES } from '@/types/database'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const MODEL_COLORS = [
  '#7c3aed', '#a855f7', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#f97316', '#06b6d4',
  '#84cc16', '#8b5cf6',
]

interface Props {
  data: ModelCategoryRow[]
}

export default function ModelByCategoryChart({ data }: Props) {
  const categories = [...new Set(data.map((r) => r.primary_category))].sort()
  const models = [...new Set(data.map((r) => r.model))].sort()

  const datasets = models.map((model, i) => {
    return {
      label: MODEL_DISPLAY_NAMES[model] ?? model,
      data: categories.map((cat) => {
        const row = data.find((r) => r.model === model && r.primary_category === cat)
        return row?.count ?? 0
      }),
      backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] + 'cc',
      borderColor: MODEL_COLORS[i % MODEL_COLORS.length],
      borderWidth: 1,
      borderRadius: 2,
    }
  })

  const shortCats = categories.map((c) => c.split(' ')[0])

  return (
    <Bar
      data={{ labels: shortCats, datasets }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#a1a1aa', font: { size: 11 }, padding: 12, boxWidth: 12 },
          },
          tooltip: {
            callbacks: {
              title: (items) => categories[items[0].dataIndex],
              label: (item) => ` ${item.dataset.label}: ${(item.raw as number).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: '#71717a', font: { size: 11 } },
            grid: { color: '#27272a' },
          },
          y: {
            stacked: true,
            ticks: { color: '#71717a', font: { size: 11 } },
            grid: { color: '#27272a' },
          },
        },
      }}
    />
  )
}
