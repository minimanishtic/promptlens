import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings Decoder',
  description:
    'Learn what every AI image generation setting actually looks like. Visual Style, Lighting, Mood, Composition, and Camera Simulation — each explained with real community examples.',
  openGraph: {
    title: 'Settings Decoder | Promere',
    description:
      'Visual guide to AI image settings. See what Cinematic, Golden Hour, Moody/Low-key, and every other setting actually produces.',
  },
}

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
  return children
}
