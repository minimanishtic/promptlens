'use client'

import { useEffect, useRef } from 'react'
import { logEvent } from '@/lib/analytics'

/** Fire-and-forget detail_view once per mount / job_set_id change (image detail page). */
export default function DetailViewTracker({
  jobSetId,
  source,
}: {
  jobSetId: string
  source: string
}) {
  const lastRef = useRef<string | null>(null)

  useEffect(() => {
    if (!jobSetId) return
    if (lastRef.current === jobSetId) return
    lastRef.current = jobSetId
    void logEvent('detail_view', { generation_id: jobSetId, source }, `/image/${jobSetId}`)
  }, [jobSetId, source])

  return null
}
