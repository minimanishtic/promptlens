import { notFound } from 'next/navigation'
import ImageDetailModal from '@/components/ImageDetailModal'
import ImageDetailContent from '@/components/ImageDetailContent'
import { getImageDetailPayload } from '@/lib/get-image-detail'

/**
 * Intercepts soft navigation from /browse → /image/[job_set_id] and renders
 * detail in a modal while the gallery stays mounted underneath.
 */
export default async function BrowseImageModalPage({
  params,
}: {
  params: Promise<{ job_set_id: string }>
}) {
  const { job_set_id } = await params
  const data = await getImageDetailPayload(job_set_id)
  if (!data) notFound()

  return (
    <ImageDetailModal>
      <ImageDetailContent gen={data.gen} similarImages={data.similarImages} />
    </ImageDetailModal>
  )
}
