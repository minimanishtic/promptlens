import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics',
  description:
    'Data-driven insights from 6,800+ AI-generated images. Discover which models, prompt lengths, visual styles, and settings drive the most engagement.',
  openGraph: {
    title: 'Prompt Analytics | Promere',
    description:
      'What actually works in AI image generation? See model performance, engagement data, and prompt length analysis.',
  },
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}
