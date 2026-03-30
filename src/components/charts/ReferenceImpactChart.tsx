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
import type { ReferenceImpactRow } from '@/lib/analytics-dashboard'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  data: ReferenceImpactRow[]
}

export default function ReferenceImpactChart({ data }: Props) {
  const categories = [...new Set(data.map((r) => r.primary_category))].sort()

  const withRef = categories.map((cat) => {
    const row = data.find((r) => r.primary_category === cat && r.has_references)
    return row?.avg_views ?? 0
  })
  const withoutRef = categories.map((cat) => {
    const row = data.find((r) => r.primary_category === cat && !r.has_references)
    return row?.avg_views ?? 0
  })

  const shortCats = categories.map((c) => c.split(' ')[0])

  return (
    <Bar
      data={{
        labels: shortCats,
        datasets: [
          {
            label: 'With References',
            data: withRef,
            backgroundColor: '#7c3aedcc',
            borderColor: '#7c3aed',
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: 'Without References',
            data: withoutRef,
            backgroundColor: '#3f3f46cc',
            borderColor: '#52525b',
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#a1a1aa', font: { size: 11 }, padding: 14, boxWidth: 12 },
          },
          tooltip: {
            callbacks: {
              title: (items) => categories[items[0].dataIndex],
              label: (item) => ` ${item.dataset.label}: ${(item.raw as number).toLocaleString()} avg views`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#71717a', font: { size: 11 } },
            grid: { color: '#27272a' },
          },
          y: {
            ticks: { color: '#71717a', font: { size: 11 } },
            grid: { color: '#27272a' },
            title: { display: true, text: 'Avg Views', color: '#52525b', font: { size: 11 } },
          },
        },
      }}
    />
  )
}
