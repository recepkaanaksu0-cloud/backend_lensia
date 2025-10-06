'use client'

import { useState } from 'react'
import { useGenerationFeedback } from '@/lib/hooks/use-generation-feedback'
import { useGenerationDownload } from '@/lib/hooks/use-generation-download'
import { useGenerationAnalytics } from '@/lib/hooks/use-generation-analytics'

interface PhotoActionsProps {
  requestId: string
  photoId: string
  // photoUrl: string // Unused for now
}

export function PhotoActions({ requestId, photoId }: PhotoActionsProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)

  const { submitFeedback, submitting } = useGenerationFeedback(requestId)
  const { downloadPhotos, preparing } = useGenerationDownload(requestId)
  const { trackEvent } = useGenerationAnalytics(requestId)

  const handleRating = async (star: number) => {
    setRating(star)
    
    try {
      await submitFeedback({
        photoId,
        rating: star,
        quality: star >= 4 ? 'excellent' : star >= 3 ? 'good' : 'fair',
        comment: comment || undefined
      })

      await trackEvent({
        eventType: 'select',
        photoId,
        metadata: { action: 'rating', rating: star }
      })

      alert('Teşekkürler! Geri bildiriminiz kaydedildi.')
    } catch (error) {
      alert('Bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  const handleDownload = async () => {
    try {
      await downloadPhotos([photoId], 'png')
      
      await trackEvent({
        eventType: 'download',
        photoId,
        metadata: { format: 'png' }
      })
    } catch (error) {
      alert('İndirme başarısız oldu.')
    }
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      {/* Star Rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Bu fotoğrafı değerlendir:</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              disabled={submitting}
              className="text-2xl transition-colors disabled:opacity-50"
            >
              {(hoveredStar >= star || rating >= star) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Yorum (opsiyonel):</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Bu fotoğraf hakkında düşünceleriniz..."
          className="w-full p-2 border rounded-md resize-none"
          rows={3}
          disabled={submitting}
        />
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={preparing}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {preparing ? 'Hazırlanıyor...' : '⬇️ İndir'}
      </button>
    </div>
  )
}
