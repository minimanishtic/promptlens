import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prompt Templates',
  description:
    'Top-performing prompt templates for every category — extracted from the highest-engagement AI-generated images. Copy and remix proven prompts.',
  openGraph: {
    title: 'Prompt Templates | PromptLens',
    description:
      'Browse the best prompts from 7,400+ AI-generated images, organised by category. Filter by model, copy with one click.',
  },
}

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children
}
