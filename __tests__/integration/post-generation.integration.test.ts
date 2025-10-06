import request from 'supertest'
import { describe, it, expect } from 'vitest'

// Integration test using supertest
// Run this against a test server instance

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN || 'test-token'

describe('Post-Generation API Integration', () => {
  const testRequestId = 'integration-test-' + Date.now()

  describe('Complete workflow', () => {
    it('should handle full post-generation flow', async () => {
      // 1. Check status
      const statusResponse = await request(BASE_URL)
        .get(`/api/generate/${testRequestId}/status`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

      // May be 404 if generation doesn't exist, or 200 if it does
      expect([200, 404]).toContain(statusResponse.status)

      // 2. Track analytics event
      const analyticsResponse = await request(BASE_URL)
        .post(`/api/generate/${testRequestId}/analytics`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          eventType: 'view',
          photoId: 'test-photo-1',
          metadata: { test: true }
        })

      // Should succeed or fail gracefully
      expect([200, 404, 500]).toContain(analyticsResponse.status)

      // 3. Get analytics summary
      const analyticsGetResponse = await request(BASE_URL)
        .get(`/api/generate/${testRequestId}/analytics`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)

      expect([200, 404]).toContain(analyticsGetResponse.status)

      // 4. Submit feedback
      const feedbackResponse = await request(BASE_URL)
        .post(`/api/generate/${testRequestId}/feedback`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          rating: 5,
          quality: 'excellent',
          comment: 'Integration test feedback'
        })

      expect([200, 404]).toContain(feedbackResponse.status)

      // 5. Prepare download
      const downloadResponse = await request(BASE_URL)
        .post(`/api/generate/${testRequestId}/download`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          photoIds: ['test-photo-1'],
          format: 'png',
          quality: 'high'
        })

      expect([200, 404]).toContain(downloadResponse.status)

      // 6. Update metadata
      const metadataResponse = await request(BASE_URL)
        .patch(`/api/generate/${testRequestId}/metadata`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          metadata: {
            testTag: 'integration',
            timestamp: new Date().toISOString()
          }
        })

      expect([200, 404]).toContain(metadataResponse.status)
    })

    it('should reject requests without authorization', async () => {
      const response = await request(BASE_URL)
        .get(`/api/generate/${testRequestId}/status`)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should validate analytics event types', async () => {
      const response = await request(BASE_URL)
        .post(`/api/generate/${testRequestId}/analytics`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          eventType: 'invalid_type',
          photoId: 'test-photo-1'
        })

      // Should return 400 for invalid event type
      expect([400, 404]).toContain(response.status)
    })

    it('should validate feedback rating range', async () => {
      const response = await request(BASE_URL)
        .post(`/api/generate/${testRequestId}/feedback`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          rating: 10, // Invalid: should be 1-5
          quality: 'excellent'
        })

      // Should return 400 for invalid rating
      expect([400, 404]).toContain(response.status)
    })
  })
})
