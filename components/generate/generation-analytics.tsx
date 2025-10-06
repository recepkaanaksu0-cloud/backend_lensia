'use client'

import { useEffect } from 'react'
import { useGenerationAnalytics } from '@/lib/hooks/use-generation-analytics'
import { useGenerationFeedback } from '@/lib/hooks/use-generation-feedback'
import { useGenerationDownload } from '@/lib/hooks/use-generation-download'

interface GenerationAnalyticsProps {
  requestId: string
}

export function GenerationAnalytics({ requestId }: GenerationAnalyticsProps) {
  const { analytics, fetchAnalytics } = useGenerationAnalytics(requestId)
  const { feedback, fetchFeedback } = useGenerationFeedback(requestId)
  const { stats, getDownloadStats } = useGenerationDownload(requestId)

  useEffect(() => {
    fetchAnalytics()
    fetchFeedback()
    getDownloadStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  if (!analytics && !feedback && !stats) {
    return <div className="p-4">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold">Generation Analytics</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Etkileşim</div>
          <div className="text-3xl font-bold">{analytics?.totalEvents || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Ortalama Puan</div>
          <div className="text-3xl font-bold">
            {feedback?.averageRating?.toFixed(1) || '0.0'} ⭐
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam İndirme</div>
          <div className="text-3xl font-bold">{stats?.totalDownloads || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Feedback</div>
          <div className="text-3xl font-bold">{feedback?.totalFeedback || 0}</div>
        </div>
      </div>

      {/* Event Breakdown */}
      {analytics?.byType && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Etkileşim Türleri</h3>
          <div className="space-y-2">
            {Object.entries(analytics.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="capitalize">{type}</span>
                <span className="font-bold">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Performance */}
      {analytics?.byPhoto && Object.keys(analytics.byPhoto).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Fotoğraf Performansı</h3>
          <div className="space-y-2">
            {Object.entries(analytics.byPhoto)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 5)
              .map(([photoId, count]) => (
                <div key={photoId} className="flex justify-between items-center">
                  <span className="text-sm truncate">{photoId}</span>
                  <span className="font-bold">{count as number} etkileşim</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Feedback */}
      {feedback?.feedback && feedback.feedback.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Son Geri Bildirimler</h3>
          <div className="space-y-3">
            {(feedback.feedback as Array<{ id: string; rating: number; quality?: string; comment?: string; timestamp: string }>).slice(-5).reverse().map((fb) => (
              <div key={fb.id} className="border-l-4 border-blue-500 pl-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{fb.rating}/5</span>
                  <span className="text-sm text-gray-600">
                    {fb.quality && `(${fb.quality})`}
                  </span>
                </div>
                {fb.comment && (
                  <p className="text-sm text-gray-700 mt-1">{fb.comment}</p>
                )}
                <span className="text-xs text-gray-500">
                  {new Date(fb.timestamp).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download History */}
      {stats?.downloadHistory && stats.downloadHistory.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">İndirme Geçmişi</h3>
          <div className="space-y-2">
            {(stats.downloadHistory as Array<{ timestamp: string; count: number; format: string; quality: string }>).slice(-5).reverse().map((dl, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{dl.count} fotoğraf</span>
                <span className="text-gray-600"> - {dl.format} ({dl.quality})</span>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(dl.timestamp).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
