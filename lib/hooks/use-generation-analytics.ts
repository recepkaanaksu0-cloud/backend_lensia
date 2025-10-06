'use client'

import { useState, useCallback } from 'react'
import { 
  trackAnalytics, 
  getAnalytics,
  type AnalyticsEvent,
  type AnalyticsResponse 
} from '@/lib/api/post-generation'

export function useGenerationAnalytics(requestId: string) {
  const [tracking, setTracking] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!requestId) return

    setTracking(true)
    setError(null)

    try {
      const result = await trackAnalytics(requestId, event)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track event'
      setError(errorMessage)
      // Don't throw - analytics should fail silently
      console.error('Analytics tracking error:', err)
      return null
    } finally {
      setTracking(false)
    }
  }, [requestId])

  const fetchAnalytics = useCallback(async () => {
    if (!requestId) return

    try {
      const data = await getAnalytics(requestId)
      setAnalytics(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics'
      setError(errorMessage)
      console.error('Analytics fetch error:', err)
      return null
    }
  }, [requestId])

  return {
    trackEvent,
    fetchAnalytics,
    analytics,
    tracking,
    error
  }
}
