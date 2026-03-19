import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse',
  description:
    'Filter and explore 6,846 AI-generated images by category, model, visual style, lighting, mood, and more.',
  openGraph: {
    title: 'Browse AI Images | PromptLens',
    description:
      'Filter by category, model, visual style, lighting, and more across 6,846 Higgsfield AI community images.',
  },
}

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children
}
