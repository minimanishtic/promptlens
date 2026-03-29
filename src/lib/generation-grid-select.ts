/**
 * Explicit PostgREST column list for generation rows used in grids and search.
 * Ensures `output_image_url_min` (R2 thumbnails) is always requested — `select('*')`
 * can omit or not hydrate this field reliably in some setups.
 */
export const GENERATION_GRID_SELECT = [
  'id',
  'job_set_id',
  'model',
  'prompt',
  'style_name',
  'style_strength',
  'quality',
  'width',
  'height',
  'aspect_ratio',
  'seed',
  'views_count',
  'likes_count',
  'output_image_url',
  'output_image_url_min',
  'reference_image_urls',
  'reference_files',
  'creator_username',
  'source',
  'sort_priority',
  'primary_category',
  'sub_category',
  'visual_style',
  'lighting',
  'mood',
  'composition',
  'camera_simulation',
  'reference_usage',
  'prompt_length',
  'has_prompt',
  'has_references',
  'num_references',
].join(',')
