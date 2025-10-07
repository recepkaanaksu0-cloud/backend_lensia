# Frontend API Kullanım Kılavuzu - GÜNCEL

## 📋 API Endpoint'leri

### 1️⃣ **Fotoğraf Üretimi Başlatma**

**Endpoint:** `POST /api/generate`

**Request:**
```javascript
const response = await fetch('https://api.lensia.ai/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN' // Opsiyonel
  },
  body: JSON.stringify({
    userId: 'user-123',
    userResponses: {
      prompt: 'örnek prompt', // Opsiyonel
      productName: 'Ürün Adı',
      productDescription: 'Ürün açıklaması',
      targetPlatforms: ['instagram', 'website'],
      aspectRatios: ['1:1', '4:5'],
      moods: ['professional', 'modern'],
      environments: ['studio', 'outdoor'],
      lightings: ['natural', 'soft'],
      angles: ['front', 'side'],
      hasModel: false,
      keepModel: false,
      modelPoses: [],
      modelGender: null,
      modelAge: null,
      includeProps: false,
      showProductOnly: true,
      brandColors: ['#FF5733', '#C70039'],
      photoCount: 4 // 2, 4, 6, veya 8
    },
    productImages: [
      'https://example.com/product1.jpg',
      'https://example.com/product2.jpg'
    ],
    referenceImages: [
      'https://example.com/ref1.jpg'
    ]
  })
});

const data = await response.json();
console.log(data);
// { generationId: 'cmggr...', status: 'completed' }
```

**Response:**
```json
{
  "generationId": "cmggrtumw001g4ad895yq8606",
  "status": "completed"
}
```

---

### 2️⃣ **SSE (Server-Sent Events) ile Progress Takibi** ⭐ ÖNERİLEN

**Endpoint:** `GET /api/generate/[generationId]/stream?token=YOUR_TOKEN`

**⚠️ ÖNEMLİ:** EventSource custom headers desteklemediği için **token query parameter olarak gönderilmelidir**.

**Frontend Kullanımı:**

```typescript
// React Hook Örneği
import { useEffect, useState } from 'react';

interface SSEProgressData {
  generationId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  currentStepName: string;
  currentStepProgress: number;
  photoCount: number;
  photos?: string[];
}

function useSSEProgress(generationId: string, userToken: string) {
  const [data, setData] = useState<SSEProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!generationId || !userToken) return;

    // Token'ı query parameter olarak ekle (EventSource header desteklemez)
    const url = `https://api.lensia.ai/api/generate/${generationId}/stream?token=${userToken}`;
    
    console.log('🔌 Connecting to SSE:', url);
    const eventSource = new EventSource(url);

    eventSource.addEventListener('connected', (e) => {
      console.log('✅ SSE Connected:', e.data);
      setIsConnected(true);
    });

    eventSource.addEventListener('progress', (e) => {
      try {
        const progressData = JSON.parse(e.data);
        console.log('📊 Progress Update:', progressData);
        setData(progressData);
      } catch (err) {
        console.error('Failed to parse progress event:', err);
      }
    });

    eventSource.addEventListener('completed', (e) => {
      try {
        const completedData = JSON.parse(e.data);
        console.log('✅ Generation Completed:', completedData);
        setData(completedData);
        eventSource.close();
        setIsConnected(false);
      } catch (err) {
        console.error('Failed to parse completed event:', err);
      }
    });

    eventSource.addEventListener('error', (e: any) => {
      console.error('❌ SSE Error:', e);
      
      // Try to parse error data if available
      if (e.data) {
        try {
          const errorData = JSON.parse(e.data);
          setError(errorData.error || 'Unknown error');
        } catch {
          setError('Connection error');
        }
      } else {
        setError('Connection error');
      }
      
      eventSource.close();
      setIsConnected(false);
    });

    eventSource.onerror = (e) => {
      console.log('🔌 SSE Connection closed');
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
      setIsConnected(false);
    };
  }, [generationId, userToken]);

  return { data, error, isConnected };
}

// Component'te kullanım
function PhotoGenerationProgress({ generationId, userToken }: { generationId: string, userToken: string }) {
  const { data, error, isConnected } = useSSEProgress(generationId, userToken);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>Connecting...</div>;
  }

  return (
    <div>
      <h3>Status: {data.status}</h3>
      <p>Progress: {data.progress}%</p>
      <p>Current Step: {data.currentStepName}</p>
      <p>Photos Generated: {data.photoCount}</p>
      
      {data.status === 'completed' && data.photos && (
        <div>
          <h4>Generated Photos:</h4>
          {data.photos.map((url, i) => (
            <img key={i} src={url} alt={`Photo ${i + 1}`} />
          ))}
        </div>
      )}
      
      {isConnected && <span>🟢 Connected</span>}
    </div>
  );
}
```

**SSE Events:**

1. **`connected`** - Bağlantı kuruldu
```json
{
  "generationId": "cmggr...",
  "message": "Connected to generation stream"
}
```

2. **`progress`** - İlerleme güncellemesi (her 1 saniyede)
```json
{
  "generationId": "cmggr...",
  "status": "processing",
  "progress": 50,
  "currentStep": "step2_ai_generation",
  "currentStepName": "AI ile Fotoğraf Üretimi",
  "currentStepProgress": 75,
  "photoCount": 2
}
```

3. **`completed`** - Üretim tamamlandı
```json
{
  "generationId": "cmggr...",
  "status": "completed",
  "progress": 100,
  "photos": [
    "https://picsum.photos/seed/.../1024/1024",
    "https://picsum.photos/seed/.../1024/1024"
  ],
  "photoCount": 2
}
```

4. **`error`** - Hata oluştu
```json
{
  "generationId": "cmggr...",
  "error": "Error message",
  "status": "error"
}
```

---

### 3️⃣ **Polling ile Progress Takibi** (Alternatif)

**Endpoint:** `GET /api/generate/[generationId]`

**Headers:** `Authorization: Bearer YOUR_TOKEN`

```javascript
async function pollStatus(generationId, userToken) {
  const response = await fetch(`https://api.lensia.ai/api/generate/${generationId}`, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  const data = await response.json();
  return data;
  // { generationId: '...', status: 'completed', progress: 100 }
}

// Her 2 saniyede bir kontrol et
const interval = setInterval(async () => {
  const status = await pollStatus(generationId, token);
  
  console.log('Progress:', status.progress, '%');
  
  if (status.status === 'completed') {
    clearInterval(interval);
    console.log('✅ Completed!');
  }
}, 2000);
```

---

### 4️⃣ **Fotoğrafları Alma**

**Endpoint:** `GET /api/generate/[generationId]/photos`

**Headers:** `Authorization: Bearer YOUR_TOKEN`

```javascript
async function getPhotos(generationId, userToken) {
  const response = await fetch(`https://api.lensia.ai/api/generate/${generationId}/photos`, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  const data = await response.json();
  return data;
}

const result = await getPhotos(generationId, token);
console.log(result);
/*
{
  "generationId": "cmggr...",
  "status": "completed",
  "photos": [
    "https://picsum.photos/seed/.../1024/1024",
    "https://picsum.photos/seed/.../1024/1024"
  ]
}
*/
```

---

## 🔐 Authentication

### SSE (EventSource) için:
```javascript
// Token query parameter olarak
const url = `https://api.lensia.ai/api/generate/${generationId}/stream?token=${userToken}`;
const eventSource = new EventSource(url);
```

### Diğer Endpoint'ler için:
```javascript
// Token header olarak
headers: {
  'Authorization': `Bearer ${userToken}`
}
```

---

## 📊 Status Değerleri

| Status | Açıklama |
|--------|----------|
| `pending` | İşlem beklemede |
| `processing` | İşlem devam ediyor |
| `completed` | İşlem tamamlandı ✅ |
| `error` | Hata oluştu ❌ |

---

## 🚀 Tam Workflow Örneği

```typescript
async function generatePhotos() {
  const userToken = 'YOUR_USER_TOKEN';
  
  // 1. Üretimi başlat
  const startResponse = await fetch('https://api.lensia.ai/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user-123',
      userResponses: { /* ... */ },
      productImages: ['https://...'],
    })
  });
  
  const { generationId, status } = await startResponse.json();
  console.log('✅ Generation started:', generationId);
  
  // 2. SSE ile progress takibi
  const url = `https://api.lensia.ai/api/generate/${generationId}/stream?token=${userToken}`;
  const eventSource = new EventSource(url);
  
  eventSource.addEventListener('progress', (e) => {
    const data = JSON.parse(e.data);
    console.log(`📊 Progress: ${data.progress}% - ${data.currentStepName}`);
  });
  
  eventSource.addEventListener('completed', (e) => {
    const data = JSON.parse(e.data);
    console.log('✅ Completed! Photos:', data.photos);
    eventSource.close();
  });
  
  eventSource.onerror = () => {
    console.error('❌ SSE connection error');
    eventSource.close();
  };
}
```

---

## ⚠️ Önemli Notlar

1. **EventSource Limitation:** `EventSource` native olarak custom headers desteklemez, bu yüzden **token query parameter olarak gönderilmelidir**.

2. **CORS:** Tüm endpoint'ler CORS headers ile döner, cross-origin istekler desteklenir.

3. **Real-time Updates:** SSE kullanarak gerçek zamanlı progress takibi yapabilirsiniz (önerilir).

4. **Fallback:** SSE çalışmazsa polling (her 2 saniyede `/api/generate/[id]`) kullanabilirsiniz.

5. **Photo Count:** `photoCount` 2, 4, 6, veya 8 olmalıdır.

6. **Mockup Data:** Şu anda sistem mockup görüntüler (picsum.photos) kullanıyor.

---

## 🐛 Hata Ayıklama

### 401 Unauthorized Hatası (SSE):
```javascript
// ❌ YANLIŞ - EventSource header desteklemez
const eventSource = new EventSource(url, {
  headers: { 'Authorization': 'Bearer token' } // Çalışmaz!
});

// ✅ DOĞRU - Token query parameter olarak
const url = `${apiUrl}/stream?token=${userToken}`;
const eventSource = new EventSource(url);
```

### SSE Bağlantısı Kopuyor:
- Browser DevTools > Network > EventStream kontrol edin
- Token'ın doğru gönderildiğinden emin olun
- CORS hatası varsa backend CORS ayarlarını kontrol edin

---

## 📞 API Base URLs

- **Production:** `https://api.lensia.ai`
- **Development:** `http://localhost:51511`
