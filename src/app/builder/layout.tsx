import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prompt Builder',
  description:
    'Build the perfect AI image prompt step-by-step. Choose your category, style, lighting, mood, composition, and model — with real example images at every step.',
  openGraph: {
    title: 'Prompt Builder Wizard | PromptLens',
    description:
      'A guided 6-step wizard that helps you craft the ideal AI image prompt using real examples from 6,800+ community generations.',
  },
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children
}
