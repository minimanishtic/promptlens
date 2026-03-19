export type Generation = {
  id: string
  job_set_id: string
  model: string | null
  prompt: string | null
  style_name: string | null
  style_strength: number | null
  quality: string | null
  width: number | null
  height: number | null
  aspect_ratio: string | null
  seed: number | null
  views_count: number | null
  likes_count: number | null
  output_image_url: string | null
  output_image_url_min: string | null
  reference_image_urls: unknown | null
  reference_files: unknown | null
  creator_username: string | null
  primary_category: string | null
  sub_category: string | null
  visual_style: string | null
  lighting: string | null
  mood: string | null
  composition: string | null
  camera_simulation: string | null
  reference_usage: string | null
  prompt_length: number | null
  has_prompt: boolean | null
  has_references: boolean | null
  num_references: number | null
}

export type Category = {
  id: number
  name: string
  slug: string
  parent_id: number | null
  description: string | null
  display_order: number | null
  image_count: number | null
}

export type Database = {
  public: {
    Tables: {
      generations: {
        Row: Generation
        Insert: Partial<Generation>
        Update: Partial<Generation>
      }
      categories: {
        Row: Category
        Insert: Partial<Category>
        Update: Partial<Category>
      }
    }
  }
}

export type FilterState = {
  primary_category: string[]
  model: string[]
  visual_style: string[]
  lighting: string[]
  mood: string[]
  composition: string[]
  reference_usage: string[]
  aspect_ratio: string[]
}

export type SortOption = 'views_count' | 'likes_count' | 'created_at'

export const FILTER_LABELS: Record<keyof FilterState, string> = {
  primary_category: 'Category',
  model: 'Model',
  visual_style: 'Visual Style',
  lighting: 'Lighting',
  mood: 'Mood',
  composition: 'Composition',
  reference_usage: 'Reference Usage',
  aspect_ratio: 'Aspect Ratio',
}

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  text2image_soul_v2: 'Soul V2',
  nano_banana_2: 'Nano 2',
  nano_banana_flash: 'Nano Flash',
  seedream_v4_5: 'Seedream 4.5',
  seedream_v5_lite: 'Seedream 5 Lite',
  ai_influencer: 'AI Influencer',
  flux_2: 'Flux 2',
  image_auto: 'Image Auto',
  text2keyframes: 'Keyframes',
  seedream: 'Seedream',
}
