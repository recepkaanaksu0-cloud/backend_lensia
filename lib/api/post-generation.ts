// Post-Generation API Service
// Centralized service for all post-generation API calls

// ============= Types =============

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface GeneratedImage {
  id: string
  url: string
  thumbnailUrl?: string
  filename?: string
}

export interface StatusResponse {
  requestId: string
  status: GenerationStatus
  processingStatus: string
  progress: number
  currentStep: string
  images: GeneratedImage[]
  completedAt?: string
  errorMessage?: string
  metadata: Record<string, unknown>
}

export type AnalyticsEventType = 'view' | 'click' | 'select' | 'reject' | 'download' | 'refine' | 'edit'

export interface AnalyticsEvent {
  eventType: AnalyticsEventType
  photoId?: string
  action?: string
  metadata?: Record<string, unknown>
}

export interface AnalyticsResponse {
  totalEvents: number
  byType: Record<string, number>
  byPhoto: Record<string, number>
  events: AnalyticsEvent[]
}

export interface FeedbackRequest {
  photoId?: string
  rating: number
  quality?: 'poor' | 'fair' | 'good' | 'excellent'
  issues?: string[]
  comment?: string
}

export interface FeedbackData {
  id: string
  photoId?: string
  rating: number
  quality?: string
  issues?: string[]
  comment?: string
  timestamp: string
}

export interface FeedbackResponse {
  success: boolean
  feedback: FeedbackData
  averageRating: number
  totalFeedback: number
}

export interface DownloadRequest {
  photoIds: string[]
  format?: 'original' | 'png' | 'jpg'
  quality?: 'standard' | 'high' | 'ultra'
}

export interface DownloadResponse {
  success: boolean
  downloads: Array<{
    id: string
    url: string
    thumbnailUrl?: string
    filename: string
  }>
  count: number
  format: string
  quality: string
}

export interface MetadataResponse {
  requestId: string
  metadata: Record<string, unknown>
  created: string
  updated: string
  status: string
}

// ============= API Functions =============

const API_BASE = '/api/generate'

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  
  // Add auth token if available (adjust based on your auth setup)
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============= Status =============

export async function getGenerationStatus(requestId: string): Promise<StatusResponse> {
  return fetchWithAuth(`${API_BASE}/${requestId}/status`)
}

// ============= Analytics =============

export interface TrackAnalyticsResponse {
  success: boolean
  event: AnalyticsEvent & { id: string; timestamp: string }
  totalEvents: number
}

export async function trackAnalytics(
  requestId: string,
  event: AnalyticsEvent
): Promise<TrackAnalyticsResponse> {
  return fetchWithAuth(`${API_BASE}/${requestId}/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  })
}

export async function getAnalytics(requestId: string): Promise<AnalyticsResponse> {
  return fetchWithAuth(`${API_BASE}/${requestId}/analytics`)
}

// ============= Feedback =============

export async function submitFeedback(
  requestId: string,
  feedback: FeedbackRequest
): Promise<FeedbackResponse> {
  return fetchWithAuth(`${API_BASE}/${requestId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  })
}

export async function getFeedback(
  requestId: string
): Promise<{ feedback: FeedbackData[]; averageRating: number; totalFeedback: number }> {
  return fetchWithAuth(`${API_BASE}/${requestId}/feedback`)
}

// ============= Download =============

export async function prepareDownload(
  requestId: string,
  request: DownloadRequest
): Promise<DownloadResponse> {
  return fetchWithAuth(`${API_BASE}/${requestId}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
}

export interface DownloadHistoryItem {
  timestamp: string
  photoIds: string[]
  format: string
  quality: string
  count: number
}

export async function getDownloadStats(
  requestId: string
): Promise<{ totalDownloads: number; lastDownload?: string; downloadHistory: DownloadHistoryItem[] }> {
  return fetchWithAuth(`${API_BASE}/${requestId}/download`)
}

// ============= Metadata =============

export async function getMetadata(requestId: string): Promise<MetadataResponse> {
  return fetchWithAuth(`${API_BASE}/${requestId}/metadata`)
}

export async function updateMetadata(
  requestId: string,
  metadata: Record<string, unknown>
): Promise<{ success: boolean; metadata: Record<string, unknown>; updated: string }> {
  return fetchWithAuth(`${API_BASE}/${requestId}/metadata`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata })
  })
}

// ============= Helper Functions =============

export async function downloadPhotos(
  requestId: string,
  photoIds: string[],
  format: 'original' | 'png' | 'jpg' = 'png'
): Promise<void> {
  const result = await prepareDownload(requestId, { photoIds, format })
  
  // Download each file
  for (const download of result.downloads) {
    const link = document.createElement('a')
    link.href = download.url
    link.download = download.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Wait a bit between downloads
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

// ============= Batch Operations =============

export async function trackMultipleEvents(
  requestId: string,
  events: AnalyticsEvent[]
): Promise<void> {
  await Promise.all(
    events.map(event => 
      trackAnalytics(requestId, event).catch(console.error)
    )
  )
}
