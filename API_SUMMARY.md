# ✅ Backend API Özeti - Frontend Kullanımı

## 🚀 Hızlı Başlangıç

### 1. Fotoğraf Üretimi Başlat
```javascript
POST /api/generate
{
  "userId": "user-123",
  "userResponses": { ... },
  "productImages": ["url"],
  "photoCount": 4
}

→ Response: { 
  generationId: "abc123", 
  status: "completed",
  photos: ["url1", "url2"],
  images: ["url1", "url2"],
  results: [{ url, thumbnailUrl, prompt, model, metadata }],
  data: { photos: [...], photoCount: 2 }
}
```

### 2. SSE ile Progress Takibi (ÖNERİLEN)
```javascript
const url = `/api/generate/${generationId}/stream?token=${userToken}`;
const eventSource = new EventSource(url);

// Her fotoğraf hazır olduğunda
eventSource.addEventListener('photo_generated', (e) => {
  const photo = JSON.parse(e.data);
  console.log('📸 Photo ready:', photo.url);
});

// Tüm fotoğraflar hazır
eventSource.addEventListener('completed', (e) => {
  const data = JSON.parse(e.data);
  console.log('✅ All done:', data.photos);
  eventSource.close();
});
```

---

## 📊 SSE Event'leri

Backend bu sırayla event gönderir:

1. **`connected`** - Bağlantı kuruldu
2. **`photo_generated`** - Her fotoğraf için (tekrar eder)
3. **`progress`** - İlerleme güncellemesi (her 1 saniye)
4. **`completed`** - Tamamlandı, bağlantı kapanır

---

## 📝 SSE Event Örnekleri

### photo_generated Event
```json
{
  "url": "https://storage.url/photo.jpg",
  "thumbnailUrl": "https://storage.url/thumb.jpg",
  "model": "google_flash",
  "prompt": "original prompt",
  "metadata": { "width": 1024, "height": 1024 }
}
```

### completed Event
```json
{
  "photos": [
    "https://storage.url/photo1.jpg",
    "https://storage.url/photo2.jpg"
  ],
  "status": "completed"
}
```

---

## ⚠️ Önemli: Token Authentication

**EventSource custom headers desteklemez!**

```javascript
// ❌ YANLIŞ - Çalışmaz!
const eventSource = new EventSource(url, {
  headers: { 'Authorization': 'Bearer token' }
});

// ✅ DOĞRU - Query parameter kullan
const url = `${apiUrl}/stream?token=${userToken}`;
const eventSource = new EventSource(url);
```

---

## 🔗 Tüm Endpoint'ler

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/api/generate` | POST | Optional | `{ generationId, status }` |
| `/api/generate/[id]/stream?token=X` | GET | Query | SSE stream |
| `/api/generate/[id]` | GET | Header | `{ generationId, status, progress }` |
| `/api/generate/[id]/photos` | GET | Header | `{ generationId, status, photos[] }` |

---

## 📖 Detaylı Dokümantasyon

- **SSE Kullanımı:** `SSE_API_DOCUMENTATION.md`
- **Tüm API'ler:** `FRONTEND_API_INTEGRATION_GUIDE.md`
- **React Hook Örneği:** Yukarıdaki dosyalarda mevcut

---

## 🧪 Test

```bash
# Backend'i başlat
npm run dev

# Test script'i çalıştır
./test-sse-stream.sh
```

---

## ✨ Özet

✅ **Status "completed" dönüyor**
✅ **Her fotoğraf hazır olduğunda SSE ile bildiriliyor** (`photo_generated`)
✅ **Tamamlandığında `completed` event gönderiliyor**
✅ **Token query parameter olarak gönderiliyor** (EventSource limitation)
✅ **CORS ayarları yapıldı**

Frontend artık bu API'leri kullanabilir! 🎉
