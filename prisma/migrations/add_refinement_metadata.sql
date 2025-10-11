-- AddPostProcessMetadata
-- Refinement tablosuna metadata alanları ekler

-- Metadata JSON alanı ekle (eğer yoksa)
ALTER TABLE Refinement ADD COLUMN metadata TEXT;

-- İndeks ekle
CREATE INDEX IF NOT EXISTS idx_refinement_type ON Refinement(refinementType);
CREATE INDEX IF NOT EXISTS idx_refinement_created ON Refinement(createdAt);
