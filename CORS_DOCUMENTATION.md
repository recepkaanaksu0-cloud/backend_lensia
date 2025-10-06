# CORS Konfigürasyonu

Backend API'mizde CORS (Cross-Origin Resource Sharing) desteği eklenmiştir.

## ✅ Yapılan Değişiklikler

### 1. Global CORS Middleware (`middleware.ts`)
- Tüm `/api/*` endpoint'lerinde otomatik çalışır
- Preflight (OPTIONS) request'leri otomatik handle eder
- Development modda tüm localhost originlerine izin verir
- Production modda sadece izin verilen domain'lere izin verir

### 2. CORS Utility Library (`lib/cors.ts`)
- `applyCorsHeaders()` - Response'a CORS headers ekler
- `handleCorsOptions()` - OPTIONS request handler
- `corsJsonResponse()` - CORS headers ile JSON response oluşturur

### 3. Güncellenmiş Endpoint'ler
Aşağıdaki endpoint'lere CORS desteği eklendi:
- ✅ `/api/generate` - AI görsel üretimi
- ✅ `/api/jobs` - İş listesi ve oluşturma
- ✅ `/api/ping` - Basit canlılık kontrolü
- ✅ `/api/health` - Detaylı sağlık kontrolü
- ✅ `/api/telemetry` - Metrik toplama

## 🌐 İzin Verilen Origin'ler

### Production
```typescript
const ALLOWED_ORIGINS = [
  'https://www.lensia.ai',
  'https://lensia.ai',
  'https://api.lensia.ai',
  'https://localhost:3000',
  'http://localhost:3000',
  'https://localhost:3001',
  'http://localhost:3001',
  'http://localhost:51511',
  'https://localhost:51511',
]
```

### Development Mode
- Tüm `localhost` ve `127.0.0.1` adresleri kabul edilir
- Herhangi bir port numarası kullanılabilir

## 🔧 CORS Headers

### Request Headers (İstemci → Sunucu)
```http
Origin: https://www.lensia.ai
Content-Type: application/json
Authorization: Bearer <token>
X-API-Key: <your-api-key>
```

### Response Headers (Sunucu → İstemci)
```http
Access-Control-Allow-Origin: https://www.lensia.ai
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key, Accept, Origin
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

## 📝 Kullanım Örnekleri

### JavaScript Fetch API
```javascript
// GET request
fetch('https://api.lensia.ai/api/ping', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Cookie'ler için
})
  .then(response => response.json())
  .then(data => console.log(data))

// POST request
fetch('https://api.lensia.ai/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
  },
  credentials: 'include',
  body: JSON.stringify({
    userId: 'user123',
    userResponses: {
      sector: 'fashion',
      style: 'modern'
    },
    productImages: ['https://example.com/image1.jpg']
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
```

### Axios
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.lensia.ai',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
  }
})

// GET request
const response = await api.get('/api/health')

// POST request
const response = await api.post('/api/generate', {
  userId: 'user123',
  userResponses: { sector: 'fashion' },
  productImages: ['https://example.com/image1.jpg']
})
```

### React Query
```javascript
import { useQuery, useMutation } from '@tanstack/react-query'

// GET request
const { data, isLoading } = useQuery({
  queryKey: ['health'],
  queryFn: async () => {
    const response = await fetch('https://api.lensia.ai/api/health', {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Network error')
    return response.json()
  }
})

// POST request
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await fetch('https://api.lensia.ai/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
      },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('API error')
    return response.json()
  }
})
```

## 🚨 Hata Çözümleri

### CORS Hatası: "No 'Access-Control-Allow-Origin' header"
**Sebep:** Origin izin listesinde değil

**Çözüm:**
1. `middleware.ts` dosyasındaki `ALLOWED_ORIGINS` listesine origin ekleyin
2. Development modda çalıştığınızdan emin olun
3. Browser console'da origin adresini kontrol edin

```bash
# Development modda çalıştır
npm run dev

# Production modda origin ekle
# middleware.ts dosyasını düzenle
```

### Preflight Request (OPTIONS) Başarısız
**Sebep:** OPTIONS metodu handle edilmiyor

**Çözüm:** Middleware otomatik handle ediyor, ama manuel kontrol için:
```bash
curl -X OPTIONS https://api.lensia.ai/api/generate \
  -H "Origin: https://www.lensia.ai" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Credentials Policy Hatası
**Sebep:** `credentials: 'include'` ile wildcard origin (`*`) kullanılamaz

**Çözüm:** Middleware spesifik origin döner, wildcard kullanmaz

## 🧪 Test

### Preflight Request Test
```bash
curl -X OPTIONS https://api.lensia.ai/api/ping \
  -H "Origin: https://www.lensia.ai" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Beklenen Response:
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://www.lensia.ai
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key, Accept, Origin
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### Actual Request Test
```bash
curl https://api.lensia.ai/api/ping \
  -H "Origin: https://www.lensia.ai" \
  -v
```

Beklenen Response:
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://www.lensia.ai
Access-Control-Allow-Credentials: true
Content-Type: application/json

{
  "status": "ok",
  "message": "pong",
  "timestamp": "2025-10-06T12:00:00.000Z"
}
```

## 📚 Security Best Practices

1. **Specific Origins:** Wildcard (`*`) yerine spesifik domain'ler kullanılır
2. **Credentials:** `Access-Control-Allow-Credentials: true` sadece güvenilir origin'ler için
3. **Max-Age:** Preflight cache süresi 24 saat (86400 saniye)
4. **Security Headers:** XSS, clickjacking koruması için ek header'lar
5. **API Key:** Hassas endpoint'ler için `X-API-Key` header kontrolü

## 🔄 Güncelleme

Yeni bir origin eklemek için:

1. `middleware.ts` dosyasını açın
2. `ALLOWED_ORIGINS` array'ine yeni origin ekleyin:
```typescript
const ALLOWED_ORIGINS = [
  'https://www.lensia.ai',
  'https://lensia.ai',
  'https://new-domain.com', // Yeni origin
]
```
3. Değişiklikleri kaydedin ve uygulamayı yeniden başlatın

## ✅ Checklist

- [x] Global CORS middleware eklendi
- [x] Tüm API endpoint'lere CORS desteği eklendi
- [x] Preflight (OPTIONS) request'leri handle ediliyor
- [x] Development/production mod ayrımı yapılıyor
- [x] Security headers eklendi
- [x] Test edildi ve doğrulandı
- [x] Dokümantasyon oluşturuldu

## 🎉 Sonuç

CORS policy backend'e başarıyla entegre edildi. Artık `www.lensia.ai` ve diğer izin verilen domain'ler API endpoint'lerinize sorunsuz erişebilir.

**Test için:**
```bash
# Ping endpoint
curl https://api.lensia.ai/api/ping -H "Origin: https://www.lensia.ai" -v

# Health endpoint
curl https://api.lensia.ai/api/health -H "Origin: https://localhost:3000" -v

# Generate endpoint (POST)
curl -X POST https://api.lensia.ai/api/generate \
  -H "Origin: https://www.lensia.ai" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"userId":"test","userResponses":{},"productImages":["https://example.com/img.jpg"]}' \
  -v
```
