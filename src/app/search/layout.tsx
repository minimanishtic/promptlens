import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Search across 6,846 AI-generated image prompts. Find the exact wording, model, and style settings behind any result.',
  openGraph: {
    title: 'Search Prompts | PromptLens',
    description:
      'Full-text search across thousands of real AI image generation prompts.',
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
