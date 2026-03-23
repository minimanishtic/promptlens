-- Original images first in all listings (0 = original, 1 = community)
ALTER TABLE generations ADD COLUMN IF NOT EXISTS sort_priority INT DEFAULT 1;

UPDATE generations SET sort_priority = 0 WHERE source = 'original';
UPDATE generations SET sort_priority = 1 WHERE source = 'community' OR source IS NULL;
