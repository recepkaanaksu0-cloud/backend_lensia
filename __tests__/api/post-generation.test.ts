import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as analyticsPost, GET as analyticsGet } from '@/app/api/generate/[requestId]/analytics/route'
import { GET as statusGet } from '@/app/api/generate/[requestId]/status/route'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              request_id: 'test-123',
              status: 'completed',
              processing_status: 'Done',
              metadata: JSON.stringify({
                images: [{ id: 'img-1', url: 'test.png' }],
                analytics: [],
                progress: 100
              }),
              created_at: '2025-10-06T10:00:00Z',
              completed_at: '2025-10-06T10:05:00Z'
            },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}))

// Mock zod
vi.mock('zod', () => ({
  z: {
    object: vi.fn(() => ({
      parse: vi.fn((data) => data)
    })),
    string: vi.fn(() => ({
      optional: vi.fn(() => ({}))
    })),
    enum: vi.fn(() => ({})),
    record: vi.fn(() => ({})),
    any: vi.fn(() => ({}))
  },
  ZodError: class ZodError extends Error {}
}))

describe('Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/generate/[requestId]/analytics', () => {
    it('should track analytics event successfully', async () => {
      const request = new Request('http://localhost:3000/api/generate/test-123/analytics', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          eventType: 'view',
          photoId: 'img-1',
          metadata: { source: 'grid' }
        })
      })

      const response = await analyticsPost(request as any, {
        params: { requestId: 'test-123' }
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.event).toBeDefined()
      expect(data.event.eventType).toBe('view')
    })

    it('should return 401 without authorization', async () => {
      const request = new Request('http://localhost:3000/api/generate/test-123/analytics', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          eventType: 'view',
          photoId: 'img-1'
        })
      })

      const response = await analyticsPost(request as any, {
        params: { requestId: 'test-123' }
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/generate/[requestId]/analytics', () => {
    it('should retrieve analytics summary', async () => {
      const request = new Request('http://localhost:3000/api/generate/test-123/analytics', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      })

      const response = await analyticsGet(request as any, {
        params: { requestId: 'test-123' }
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('totalEvents')
      expect(data).toHaveProperty('byType')
      expect(data).toHaveProperty('byPhoto')
    })
  })
})

describe('Status API', () => {
  describe('GET /api/generate/[requestId]/status', () => {
    it('should return generation status', async () => {
      const request = new Request('http://localhost:3000/api/generate/test-123/status', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      })

      const response = await statusGet(request as any, {
        params: { requestId: 'test-123' }
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.requestId).toBe('test-123')
      expect(data.status).toBe('completed')
      expect(data.progress).toBe(100)
      expect(data.images).toHaveLength(1)
    })

    it('should return 401 without authorization', async () => {
      const request = new Request('http://localhost:3000/api/generate/test-123/status', {
        method: 'GET'
      })

      const response = await statusGet(request as any, {
        params: { requestId: 'test-123' }
      })

      expect(response.status).toBe(401)
    })

    it('should include cache control headers', async () => {
      const request = new Request('http://localhost:3000/api/generate/test-123/status', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token'
        }
      })

      const response = await statusGet(request as any, {
        params: { requestId: 'test-123' }
      })

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('max-age=5')
    })
  })
})
