# Promere — Cursor Build Context

## WHAT THIS IS
Promere is a visual prompt intelligence tool for AI image generation. It helps creators find the right prompt, model, style, and settings by browsing 6,846 real community-generated images from Higgsfield AI, all classified by visual category.

## TECH STACK
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres + Storage + pgvector)
- **Deployment:** Vercel
- **Images:** Served from Higgsfield CDN (no self-hosted images for V1)

## SUPABASE CONNECTION
```
URL: https://pkdobhtvtjwtoxnluwoi.supabase.co
Anon Key: [PASTE YOUR ANON KEY HERE]
```

## DATABASE SCHEMA

### Table: `generations` (6,846 rows)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_set_id | TEXT (unique) | Higgsfield generation ID |
| model | TEXT | Model name: text2image_soul_v2, nano_banana_2, nano_banana_flash, seedream_v4_5, seedream_v5_lite, ai_influencer, flux_2, image_auto, text2keyframes, seedream |
| prompt | TEXT | Full prompt text (NULL for some ai_influencer images) |
| style_name | TEXT | Style preset name |
| style_strength | REAL | 0.0 to 1.0 |
| quality | TEXT | e.g. '1080p', '2k', '4k' |
| width | INT | Image width in pixels |
| height | INT | Image height in pixels |
| aspect_ratio | TEXT | e.g. '9:16', '3:4', '1:1', '4:5' |
| seed | BIGINT | Generation seed |
| views_count | INT | Community views |
| likes_count | INT | Community likes |
| output_image_url | TEXT | Full-res image CDN URL |
| output_image_url_min | TEXT | Thumbnail CDN URL (may be NULL) |
| reference_image_urls | JSONB | Array of reference image CDN URLs |
| reference_files | JSONB | Array of reference filenames |
| creator_username | TEXT | Creator's username |
| primary_category | TEXT | One of 8 categories (see below) |
| sub_category | TEXT | Sub-category within primary |
| visual_style | TEXT | Photorealistic, Editorial, Cinematic, Vintage/Film, Anime/Illustration, Raw/Candid |
| lighting | TEXT | Studio, Natural/Golden Hour, Flash/Harsh, Moody/Low-key, Neon/Colored, Backlit |
| mood | TEXT | Warm, Cold, Dramatic, Intimate, Energetic, Nostalgic, Dark/Gritty, Clean/Minimal |
| composition | TEXT | Close-up, Medium Shot, Full Body, Wide/Establishing, Overhead/Flat Lay, POV/First Person |
| camera_simulation | TEXT | DSLR/Mirrorless, Film Camera, Smartphone/Selfie, Drone/Aerial, Security Cam/CCTV, Vintage Point-and-Shoot |
| reference_usage | TEXT | no_reference, single_face_ref, multi_ref, style_ref, pose_ref |
| prompt_length | INT | Character count of prompt |
| has_prompt | BOOL | Whether image has a prompt |
| has_references | BOOL | Whether reference images were used |
| num_references | INT | Count of reference images |
| prompt_embedding | vector(1536) | For semantic search (NULL for now — will be populated later) |

### Table: `categories` (42 rows)

| Column | Type |
|--------|------|
| id | SERIAL |
| name | TEXT |
| slug | TEXT (unique) |
| parent_id | INT (self-ref, NULL for primary) |
| description | TEXT |
| display_order | INT |
| image_count | INT |

### Primary Categories
1. Portrait & Headshot (31.7%)
2. Fashion & Editorial (22.9%)
3. Product Photography
4. Cinematic & Film Still
5. Street & Documentary
6. Fantasy & Creative
7. Landscape & Architecture
8. Identity Transform

### Table: `prompt_templates` (empty — will be populated later)

## IMAGE URLS
Images are served from Higgsfield's CDN. Use `output_image_url` for full-res and `output_image_url_min` for thumbnails. Some `output_image_url_min` values are NULL — fall back to `output_image_url` in those cases.

Example CDN URL: `https://d8j0ntlcm91z4.cloudfront.net/user_xxx/image.png`

Reference images are in the `reference_image_urls` JSONB array.

## KEY SUPABASE QUERIES

### Gallery browse with filters
```sql
SELECT * FROM generations
WHERE primary_category = 'Fashion & Editorial'
  AND model = 'nano_banana_2'
  AND visual_style = 'Photorealistic'
ORDER BY views_count DESC
LIMIT 24 OFFSET 0;
```

### Category counts for filter sidebar
```sql
SELECT primary_category, COUNT(*) as count
FROM generations
GROUP BY primary_category
ORDER BY count DESC;
```

### Get distinct values for any filter
```sql
SELECT DISTINCT model FROM generations ORDER BY model;
SELECT DISTINCT visual_style FROM generations ORDER BY visual_style;
```

### Single image detail
```sql
SELECT * FROM generations WHERE job_set_id = 'xxx';
```

### Full-text search
```sql
SELECT * FROM generations
WHERE to_tsvector('english', COALESCE(prompt, '')) @@ plainto_tsquery('english', 'cinematic portrait')
ORDER BY views_count DESC
LIMIT 20;
```

## PAGES TO BUILD (V1)

### 1. `/` — Landing Page
- Hero section: "Stop guessing. Start directing."
- Search bar (text search across prompts)
- Category cards (8 primary categories with image counts)
- Top trending images (highest views_count)

### 2. `/browse` — Gallery Browser (CORE PAGE)
- Left sidebar: filter panel
  - Category (checkboxes for 8 primary categories)
  - Model (checkboxes for each model)
  - Visual Style (checkboxes)
  - Lighting (checkboxes)
  - Mood (checkboxes)
  - Composition (checkboxes)
  - Reference Usage (checkboxes)
  - Aspect Ratio (checkboxes)
- Main area: responsive image grid (masonry or uniform)
  - Each card shows: thumbnail image, model badge, views count, primary category tag
  - Infinite scroll or pagination (24 per page)
  - Sort by: Most Viewed, Most Liked, Newest
- Click any image → opens detail modal or navigates to `/image/[id]`

### 3. `/image/[job_set_id]` — Image Detail Page
- Large image display
- Full prompt text (copyable with one click)
- All metadata: model, style, quality, dimensions, seed, aspect ratio
- Classification tags: category, visual style, lighting, mood, composition, camera
- Engagement: views, likes
- Reference images (if any) — displayed alongside the output
- "Copy Prompt" button
- "Similar Images" section (same category + visual style, sorted by views)

### 4. `/search` — Search Results
- Text input → full-text search across prompts
- Results displayed as image grid with relevance
- Filter refinement on results

## DESIGN DIRECTION
- Dark theme (like Higgsfield's own UI)
- Image-first — images are the hero, text is secondary
- Clean, minimal chrome — let the images breathe
- Fast — lazy load images, skeleton loading states
- Mobile responsive — grid adapts from 4 columns to 2 to 1

## DATA DISTRIBUTION (for filter counts)
- Models: nano_banana_2 and text2image_soul_v2 = 75% of dataset
- Visual Style: Photorealistic (54.3%), Cinematic, Editorial, Raw/Candid
- Lighting: Natural/Golden Hour (49%), Studio, Moody/Low-key
- Reference: 55.3% no_reference, 18.6% multi_ref, 16% single_face_ref

## IMPORTANT NOTES
- `output_image_url_min` may be NULL — always fall back to `output_image_url`
- Some images have no prompt (ai_influencer model) — show "No prompt" gracefully
- `reference_image_urls` is a JSONB string that may need parsing — it could be a JSON array or a double-escaped string
- Sort by `views_count DESC` as default — most viewed = most interesting
- Use Supabase JS client (`@supabase/supabase-js`) for all queries
- RLS is enabled with public SELECT access — anon key works for reads
