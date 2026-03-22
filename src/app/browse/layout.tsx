import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse',
  description:
    'Filter and explore 7,400+ AI-generated images by category, model, visual style, lighting, mood, and more.',
  openGraph: {
    title: 'Browse AI Images | PromptLens',
    description:
      'Filter by category, model, visual style, lighting, and more across 7,400+ community images.',
  },
}

export default function BrowseLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
