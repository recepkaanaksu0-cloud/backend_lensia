'use client'

import { useState, useCallback } from 'react'
import { 
  submitFeedback, 
  getFeedback,
  type FeedbackRequest 
} from '@/lib/api/post-generation'

export function useGenerationFeedback(requestId: string) {
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ feedback: unknown[]; averageRating: number; totalFeedback: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitUserFeedback = useCallback(async (feedbackData: FeedbackRequest) => {
    if (!requestId) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await submitFeedback(requestId, feedbackData)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback'
      setError(errorMessage)
      console.error('Feedback submission error:', err)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [requestId])

  const fetchFeedback = useCallback(async () => {
    if (!requestId) return

    try {
      const data = await getFeedback(requestId)
      setFeedback(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feedback'
      setError(errorMessage)
      console.error('Feedback fetch error:', err)
      return null
    }
  }, [requestId])

  return {
    submitFeedback: submitUserFeedback,
    fetchFeedback,
    feedback,
    submitting,
    error
  }
}
