# 🎯 Frontend - Backend API Entegrasyonu

## SSE Event Formatı

Backend şu SSE event'lerini gönderir:

### 1. `connected` - Bağlantı Kuruldu
```javascript
event: connected
data: {
  "generationId": "cmggtifg7...",
  "message": "Connected to generation stream"
}
```

### 2. `photo_generated` - Her Fotoğraf Hazır Olduğunda
```javascript
event: photo_generated
data: {
  "url": "https://storage.url/photo.jpg",
  "thumbnailUrl": "https://storage.url/thumb.jpg", // optional
  "model": "google_flash",
  "prompt": "original_prompt",
  "metadata": { /* ... */ }
}
```

### 3. `progress` - İlerleme Güncellemesi (her 1 saniye)
```javascript
event: progress
data: {
  "generationId": "cmggtifg7...",
  "status": "processing",
  "progress": 50,
  "currentStep": "step2_ai_generation",
  "currentStepName": "AI ile Fotoğraf Üretimi",
  "currentStepProgress": 75,
  "photoCount": 2
}
```

### 4. `completed` - Tüm Fotoğraflar Hazır
```javascript
event: completed
data: {
  "photos": ["url1", "url2", ...],
  "status": "completed"
}
```

### 5. `error` - Hata Oluştu
```javascript
event: error
data: {
  "generationId": "cmggtifg7...",
  "error": "Error message",
  "status": "error"
}
```

---

## Frontend Kullanımı

### 1. Üretimi Başlat
```javascript
const response = await fetch('https://api.lensia.ai/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    userResponses: {
      productName: 'Test Ürün',
      productDescription: 'Test açıklama',
      targetPlatforms: ['instagram'],
      aspectRatios: ['1:1'],
      moods: ['professional'],
      environments: ['studio'],
      lightings: ['natural'],
      angles: ['front'],
      hasModel: false,
      keepModel: false,
      modelPoses: [],
      modelGender: null,
      modelAge: null,
      includeProps: false,
      showProductOnly: true,
      brandColors: ['#FF5733'],
      photoCount: 2
    },
    productImages: ['https://example.com/ref.jpg']
  })
});

const { generationId, status } = await response.json();
// { generationId: 'cmggtifg7...', status: 'completed' }
```

### 2. SSE ile Progress Takibi
```javascript
const userToken = 'YOUR_USER_TOKEN';
const url = `https://api.lensia.ai/api/generate/${generationId}/stream?token=${userToken}`;
const eventSource = new EventSource(url);

// Bağlantı kuruldu
eventSource.addEventListener('connected', (e) => {
  const data = JSON.parse(e.data);
  console.log('✅ Connected:', data.message);
});

// Her fotoğraf hazır olduğunda
eventSource.addEventListener('photo_generated', (e) => {
  const photoData = JSON.parse(e.data);
  console.log('📸 New photo:', photoData.url);
  
  // UI'da fotoğrafı göster
  displayPhoto({
    url: photoData.url,
    thumbnailUrl: photoData.thumbnailUrl,
    model: photoData.model,
    prompt: photoData.prompt,
    metadata: photoData.metadata
  });
});

// İlerleme güncellemeleri
eventSource.addEventListener('progress', (e) => {
  const progressData = JSON.parse(e.data);
  console.log(`📊 Progress: ${progressData.progress}%`);
  
  updateProgressBar(progressData.progress);
  updateStepInfo(progressData.currentStepName);
});

// Tüm fotoğraflar hazır
eventSource.addEventListener('completed', (e) => {
  const data = JSON.parse(e.data);
  console.log('✅ All photos ready:', data.photos);
  
  eventSource.close();
  showCompletionMessage(data.photos);
});

// Hata durumu
eventSource.addEventListener('error', (e) => {
  if (e.data) {
    const errorData = JSON.parse(e.data);
    console.error('❌ Error:', errorData.error);
    showErrorMessage(errorData.error);
  }
  eventSource.close();
});

// Bağlantı kapandığında
eventSource.onerror = () => {
  console.log('🔌 Connection closed');
  eventSource.close();
};
```

---

## React Hook Örneği

```typescript
import { useEffect, useState } from 'react';

interface Photo {
  url: string;
  thumbnailUrl?: string;
  model: string;
  prompt: string;
  metadata: any;
}

interface ProgressData {
  generationId: string;
  status: string;
  progress: number;
  currentStepName: string;
  photoCount: number;
}

export function usePhotoGeneration(generationId: string, userToken: string) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!generationId || !userToken) return;

    const url = `https://api.lensia.ai/api/generate/${generationId}/stream?token=${userToken}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('photo_generated', (e) => {
      const photo = JSON.parse(e.data);
      setPhotos(prev => [...prev, photo]);
    });

    eventSource.addEventListener('progress', (e) => {
      const progressData = JSON.parse(e.data);
      setProgress(progressData);
    });

    eventSource.addEventListener('completed', (e) => {
      setIsCompleted(true);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      if (e.data) {
        const errorData = JSON.parse(e.data);
        setError(errorData.error);
      }
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [generationId, userToken]);

  return { photos, progress, isCompleted, error };
}

// Kullanımı
function PhotoGenerationComponent() {
  const { photos, progress, isCompleted, error } = usePhotoGeneration(
    'cmggtifg7...',
    'user-token-123'
  );

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h3>Progress: {progress?.progress}%</h3>
      <p>Step: {progress?.currentStepName}</p>
      
      <div className="photos-grid">
        {photos.map((photo, i) => (
          <img key={i} src={photo.url} alt={`Photo ${i + 1}`} />
        ))}
      </div>
      
      {isCompleted && <p>✅ All photos generated!</p>}
    </div>
  );
}
```

---

## Önemli Notlar

### ⚠️ EventSource Token Limitation
EventSource custom headers desteklemez, token **query parameter** olarak gönderilmelidir:

```javascript
// ❌ YANLIŞ
const eventSource = new EventSource(url, {
  headers: { 'Authorization': 'Bearer token' }
});

// ✅ DOĞRU
const url = `${apiUrl}/stream?token=${userToken}`;
const eventSource = new EventSource(url);
```

### 📊 Event Akışı
1. **connected** → Bağlantı kuruldu
2. **photo_generated** → Her fotoğraf için (1-N kez)
3. **progress** → İlerleme güncellemeleri (her 1 saniye)
4. **completed** → Tüm fotoğraflar hazır
5. Bağlantı kapanır

### 🔄 Retry Stratejisi
EventSource otomatik olarak yeniden bağlanır, ancak manual kontrol isterseniz:

```javascript
let reconnectAttempts = 0;
const maxReconnects = 3;

eventSource.onerror = () => {
  if (reconnectAttempts < maxReconnects) {
    reconnectAttempts++;
    console.log(`Reconnecting... (${reconnectAttempts}/${maxReconnects})`);
    setTimeout(() => {
      // Yeniden bağlan
    }, 2000);
  } else {
    console.error('Max reconnect attempts reached');
    eventSource.close();
  }
};
```

---

## API Endpoints Özeti

| Endpoint | Method | Auth | Açıklama |
|----------|--------|------|----------|
| `/api/generate` | POST | Optional | Üretimi başlat |
| `/api/generate/[id]/stream` | GET | Query Token | SSE progress stream |
| `/api/generate/[id]` | GET | Header | Status sorgula |
| `/api/generate/[id]/photos` | GET | Header | Fotoğrafları al |

---

## Test Komutu

```bash
# SSE stream'i test et
curl -N "http://localhost:51511/api/generate/[GENERATION_ID]/stream?token=test-token"
```

---

## Debugging

### Browser DevTools
1. **Network** sekmesini aç
2. **EventStream** filtresini seç
3. SSE bağlantısını bulup tıkla
4. **Messages** tab'ında event'leri gör

### Console Logları
```javascript
// Her event'i logla
['connected', 'photo_generated', 'progress', 'completed', 'error'].forEach(eventType => {
  eventSource.addEventListener(eventType, (e) => {
    console.log(`[${eventType}]`, JSON.parse(e.data));
  });
});
```
