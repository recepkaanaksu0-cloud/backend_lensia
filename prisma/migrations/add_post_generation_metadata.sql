-- Migration: Add post-generation metadata fields and indexes
-- Created: 2025-10-06
-- Description: Extends generations table metadata to support analytics, feedback, and download tracking

-- Add quality_score column if it doesn't exist
ALTER TABLE generations 
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT 0.00;

-- Add index on request_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_generations_request_id 
ON generations(request_id);

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_generations_status 
ON generations(status);

-- Add index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_generations_created_at 
ON generations(created_at DESC);

-- Add GIN index on metadata for analytics queries (PostgreSQL specific)
-- Comment out if using SQLite or adjust accordingly
CREATE INDEX IF NOT EXISTS idx_generations_metadata_gin 
ON generations USING GIN (metadata);

-- Example metadata structure (for documentation):
-- {
--   "images": [...],
--   "analytics": [
--     {
--       "id": "evt_123",
--       "eventType": "view",
--       "photoId": "img-123",
--       "timestamp": "2025-10-06T10:00:00Z",
--       "metadata": {}
--     }
--   ],
--   "feedback": [
--     {
--       "id": "fb_123",
--       "rating": 5,
--       "quality": "excellent",
--       "comment": "Great!",
--       "timestamp": "2025-10-06T10:00:00Z"
--     }
--   ],
--   "averageRating": 4.5,
--   "lastDownload": "2025-10-06T10:00:00Z",
--   "downloadHistory": [
--     {
--       "timestamp": "2025-10-06T10:00:00Z",
--       "photoIds": ["img-123"],
--       "format": "png",
--       "quality": "high",
--       "count": 1
--     }
--   ],
--   "lastModified": "2025-10-06T10:00:00Z"
-- }

-- Add comment to quality_score column
COMMENT ON COLUMN generations.quality_score IS 'Average user rating (1-5) calculated from feedback';

-- Verify migration
SELECT 
  COUNT(*) as total_generations,
  COUNT(quality_score) as with_quality_score,
  AVG(quality_score) as avg_quality
FROM generations;
