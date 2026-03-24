-- Global classification counts for /search sidebar (full table aggregates, not result-set scoped).
-- Apply in Supabase SQL Editor or via `supabase db push`.

CREATE OR REPLACE FUNCTION get_filter_counts()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT json_build_object(
    'visual_style',
    COALESCE(
      (
        SELECT json_object_agg(visual_style, cnt)
        FROM (
          SELECT visual_style, count(*)::int AS cnt
          FROM generations
          WHERE visual_style IS NOT NULL
            AND trim(visual_style) != ''
          GROUP BY visual_style
        ) t
      ),
      '{}'::json
    ),
    'lighting',
    COALESCE(
      (
        SELECT json_object_agg(lighting, cnt)
        FROM (
          SELECT lighting, count(*)::int AS cnt
          FROM generations
          WHERE lighting IS NOT NULL
            AND trim(lighting) != ''
          GROUP BY lighting
        ) t
      ),
      '{}'::json
    ),
    'mood',
    COALESCE(
      (
        SELECT json_object_agg(mood, cnt)
        FROM (
          SELECT mood, count(*)::int AS cnt
          FROM generations
          WHERE mood IS NOT NULL
            AND trim(mood) != ''
          GROUP BY mood
        ) t
      ),
      '{}'::json
    ),
    'composition',
    COALESCE(
      (
        SELECT json_object_agg(composition, cnt)
        FROM (
          SELECT composition, count(*)::int AS cnt
          FROM generations
          WHERE composition IS NOT NULL
            AND trim(composition) != ''
          GROUP BY composition
        ) t
      ),
      '{}'::json
    ),
    'camera_simulation',
    COALESCE(
      (
        SELECT json_object_agg(camera_simulation, cnt)
        FROM (
          SELECT camera_simulation, count(*)::int AS cnt
          FROM generations
          WHERE camera_simulation IS NOT NULL
            AND trim(camera_simulation) != ''
          GROUP BY camera_simulation
        ) t
      ),
      '{}'::json
    )
  );
$$;

GRANT EXECUTE ON FUNCTION get_filter_counts() TO anon;
GRANT EXECUTE ON FUNCTION get_filter_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_filter_counts() TO service_role;
