import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Library',
  description: 'Your saved AI prompts, organised into collections.',
}

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children
}
