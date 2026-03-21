import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'
import ImageDetailContent from '@/components/ImageDetailContent'
import { getImageDetailPayload, getImageSeoFields } from '@/lib/get-image-detail'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ job_set_id: string }>
}): Promise<Metadata> {
  const { job_set_id } = await params
  const data = await getImageSeoFields(job_set_id)

  if (!data) {
    return { title: 'Image Not Found' }
  }

  const promptSnippet = data.prompt
    ? data.prompt.slice(0, 80) + (data.prompt.length > 80 ? '…' : '')
    : 'No prompt'
  const category = data.primary_category ?? 'AI Image'
  const style = data.visual_style ? ` · ${data.visual_style}` : ''
  const title = `${category}${style}`
  const imageUrl = data.output_image_url_min ?? data.output_image_url ?? undefined

  return {
    title,
    description: promptSnippet,
    openGraph: {
      title,
      description: promptSnippet,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: promptSnippet,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

export default async function ImageDetailPage({
  params,
}: {
  params: Promise<{ job_set_id: string }>
}) {
  const { job_set_id } = await params
  const data = await getImageDetailPayload(job_set_id)
  if (!data) notFound()

  const { gen, similarImages } = data

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-lg font-bold text-white shrink-0">
            Prompt<span className="text-sky-400">Lens</span>
          </a>
          <span className="text-zinc-700 hidden sm:block">|</span>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/browse" className="hover:text-white transition-colors">
              Browse
            </Link>
            <Link href="/glossary" className="hover:text-white transition-colors">
              Glossary
            </Link>
            <Link href="/analytics" className="hover:text-white transition-colors">
              Analytics
            </Link>
            <Link href="/templates" className="hover:text-white transition-colors">
              Templates
            </Link>
            <Link href="/builder" className="hover:text-white transition-colors">
              Builder
            </Link>
            <Link href="/library" className="hover:text-white transition-colors">
              Library
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NavAuthButton />
            <MobileNav />
          </div>
        </div>
      </header>

      <ImageDetailContent gen={gen} similarImages={similarImages} />
    </div>
  )
}
