# Post-Generation API - Quick Setup Guide

## 🚀 Quick Start

This implementation adds 5 new API endpoints and supporting infrastructure for enhanced post-generation workflows.

## 📦 Installation

### 1. Install Dependencies

```bash
npm install zod @supabase/supabase-js
npm install -D vitest supertest @types/supertest
```

### 2. Run Database Migration

```bash
# PostgreSQL
psql -U your_user -d your_database -f prisma/migrations/add_post_generation_metadata.sql

# Or using Prisma
npx prisma db push
```

### 3. Environment Variables

Ensure these are set in your `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔌 API Endpoints

### Status Polling
```
GET /api/generate/{requestId}/status
```

### Analytics Tracking
```
POST /api/generate/{requestId}/analytics
GET  /api/generate/{requestId}/analytics
```

### User Feedback
```
POST /api/generate/{requestId}/feedback
GET  /api/generate/{requestId}/feedback
```

### Download Management
```
POST /api/generate/{requestId}/download
GET  /api/generate/{requestId}/download
```

### Metadata Management
```
GET   /api/generate/{requestId}/metadata
PATCH /api/generate/{requestId}/metadata
```

## 🎯 Usage Examples

### Frontend Integration

```tsx
import { useGenerationStatus } from '@/lib/hooks/use-generation-status'
import { useGenerationAnalytics } from '@/lib/hooks/use-generation-analytics'
import { PhotoActions } from '@/components/generate/photo-actions'

function GeneratePage({ requestId }: { requestId: string }) {
  const { status, fetchStatus } = useGenerationStatus(requestId)
  const { trackEvent } = useGenerationAnalytics(requestId)

  // Poll status every 3 seconds
  useEffect(() => {
    const interval = setInterval(fetchStatus, 3000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  // Track page view
  useEffect(() => {
    trackEvent({ eventType: 'view' })
  }, [])

  return (
    <div>
      {status?.images.map(photo => (
        <PhotoActions 
          key={photo.id}
          requestId={requestId}
          photoId={photo.id}
          photoUrl={photo.url}
        />
      ))}
    </div>
  )
}
```

### Direct API Calls

```typescript
import { 
  getGenerationStatus,
  trackAnalytics,
  submitFeedback,
  downloadPhotos 
} from '@/lib/api/post-generation'

// Check status
const status = await getGenerationStatus(requestId)

// Track event
await trackAnalytics(requestId, {
  eventType: 'click',
  photoId: 'img-123'
})

// Submit feedback
await submitFeedback(requestId, {
  rating: 5,
  quality: 'excellent',
  comment: 'Great!'
})

// Download photos
await downloadPhotos(requestId, ['img-123', 'img-124'], 'png')
```

## 🧪 Testing

### Run Unit Tests

```bash
npm run test
# or
npx vitest run
```

### Run Integration Tests

```bash
# Set environment variables
export TEST_API_URL=http://localhost:3000
export TEST_AUTH_TOKEN=your_test_token

# Run tests
npx vitest run __tests__/integration
```

## 📊 Components

### Photo Actions Component

```tsx
import { PhotoActions } from '@/components/generate/photo-actions'

<PhotoActions 
  requestId={requestId}
  photoId="img-123"
  photoUrl="https://..."
/>
```

### Analytics Dashboard

```tsx
import { GenerationAnalytics } from '@/components/generate/generation-analytics'

<GenerationAnalytics requestId={requestId} />
```

## 🔧 Configuration

### Auth Setup

The API routes expect a Bearer token in the Authorization header. Update the auth logic in:
- `lib/api/post-generation.ts` - Client-side auth token handling
- Route files - Server-side auth validation

### Database Schema

The migration adds:
- `quality_score` column (DECIMAL)
- Indexes on `request_id`, `status`, `created_at`
- Metadata structure for analytics, feedback, downloads

## 📝 Next Steps

1. **Integrate into /generate page** - Add hooks and components
2. **Setup authentication** - Configure Supabase auth properly
3. **Add error boundaries** - Wrap components in error boundaries
4. **Setup monitoring** - Track API performance and errors
5. **Add caching** - Implement Redis for status polling
6. **Rate limiting** - Add rate limits to prevent abuse

## 📚 Documentation

- [POST_GENERATION_API.md](./POST_GENERATION_API.md) - Complete API docs
- [POST_GENERATION_EXAMPLES.md](./POST_GENERATION_EXAMPLES.md) - Usage examples
- [POST_GENERATION_IMPLEMENTATION.md](./POST_GENERATION_IMPLEMENTATION.md) - Implementation details

## 🐛 Troubleshooting

### Common Issues

**TypeError: Cannot read properties of undefined**
- Check that Supabase env vars are set
- Verify database connection

**401 Unauthorized**
- Ensure Authorization header is sent
- Check token validity

**404 Not Found**
- Verify requestId exists in database
- Check route parameter naming

**Analytics not saving**
- Analytics fails silently - check console logs
- Verify metadata JSON structure

## 🎉 Success!

Your post-generation API is now ready. Start integrating the hooks and components into your application!
