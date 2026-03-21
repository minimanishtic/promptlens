/**
 * Canonical primary_category values in the generations table.
 * Used for landing category cards, browse filter sidebar, etc.
 * — do not rely on scanning unbounded rows to discover these.
 */
export const KNOWN_PRIMARY_CATEGORIES = [
  'Portrait & Headshot',
  'Fashion & Editorial',
  'Fantasy & Creative',
  'Cinematic & Film Still',
  'Landscape & Architecture',
  'Street & Documentary',
  'Product Photography',
  'Identity Transform',
] as const

export type KnownPrimaryCategory = (typeof KNOWN_PRIMARY_CATEGORIES)[number]
