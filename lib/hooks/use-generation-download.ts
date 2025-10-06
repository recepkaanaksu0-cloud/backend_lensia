'use client'

import { useState, useCallback } from 'react'
import { 
  prepareDownload, 
  downloadPhotos,
  getDownloadStats,
  type DownloadRequest 
} from '@/lib/api/post-generation'

export function useGenerationDownload(requestId: string) {
  const [preparing, setPreparing] = useState(false)
  const [stats, setStats] = useState<{ totalDownloads: number; lastDownload?: string; downloadHistory: unknown[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const preparePhotos = useCallback(async (request: DownloadRequest) => {
    if (!requestId) return

    setPreparing(true)
    setError(null)

    try {
      const result = await prepareDownload(requestId, request)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to prepare download'
      setError(errorMessage)
      console.error('Download preparation error:', err)
      throw err
    } finally {
      setPreparing(false)
    }
  }, [requestId])

  const downloadPhotosNow = useCallback(async (
    photoIds: string[],
    format: 'original' | 'png' | 'jpg' = 'png'
  ) => {
    if (!requestId) return

    setPreparing(true)
    setError(null)

    try {
      await downloadPhotos(requestId, photoIds, format)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download photos'
      setError(errorMessage)
      console.error('Download error:', err)
      throw err
    } finally {
      setPreparing(false)
    }
  }, [requestId])

  const fetchDownloadStats = useCallback(async () => {
    if (!requestId) return

    try {
      const data = await getDownloadStats(requestId)
      setStats(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch download stats'
      setError(errorMessage)
      console.error('Download stats fetch error:', err)
      return null
    }
  }, [requestId])

  return {
    prepareDownload: preparePhotos,
    downloadPhotos: downloadPhotosNow,
    getDownloadStats: fetchDownloadStats,
    stats,
    preparing,
    error
  }
}
