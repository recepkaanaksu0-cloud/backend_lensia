'use client'

import { useState, useCallback } from 'react'
import { getGenerationStatus, type StatusResponse } from '@/lib/api/post-generation'

export function useGenerationStatus(requestId: string) {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!requestId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getGenerationStatus(requestId)
      setStatus(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status'
      setError(errorMessage)
      console.error('Status fetch error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [requestId])

  return {
    status,
    loading,
    error,
    fetchStatus
  }
}
