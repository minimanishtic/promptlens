'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { PromptLengthBucket } from '@/lib/analytics'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface Props {
  data: PromptLengthBucket[]
}

export default function PromptLengthChart({ data }: Props) {
  const maxCount = Math.max(...data.map((d) => d.count))

  return (
    <Bar
      data={{
        labels: data.map((d) => `${d.bucket} chars`),
        datasets: [
          {
            label: 'Avg Views',
            data: data.map((d) => d.avg_views),
            backgroundColor: data.map((d) => {
              const intensity = 0.4 + (d.count / maxCount) * 0.6
              return `rgba(124, 58, 237, ${intensity})`
            }),
            borderColor: '#7c3aed',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` Avg ${(item.raw as number).toLocaleString()} views`,
              afterLabel: (item) =>
                ` ${data[item.dataIndex].count.toLocaleString()} images in this range`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#71717a', font: { size: 12 } },
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
