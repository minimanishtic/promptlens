/**
 * Prefer thumbnail URL for grids; fall back to full URL when min is null, undefined, or blank.
 * Note: `min ?? full` is wrong when `min` is `''` — nullish coalescing does not skip empty strings.
 */
export function generationThumbnailUrl(gen: {
  output_image_url_min?: string | null
  output_image_url?: string | null
}): string | null {
  const min = gen.output_image_url_min
  const full = gen.output_image_url
  if (typeof min === 'string' && min.trim() !== '') return min
  if (typeof full === 'string' && full.trim() !== '') return full
  return null
}
