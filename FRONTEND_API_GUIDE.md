# Frontend API Kullanım Kılavuzu

## Fotoğraf Üretim İşlemi

### 1. Fotoğraf Üretimi Başlatma

**Endpoint**: `POST /api/generate`

**Request Body**:
```json
{
  "userId": "user123",
  "userResponses": {
    "productName": "Ürün Adı",
    "productDescription": "Ürün açıklaması",
    "targetPlatforms": ["instagram", "website"],
    "aspectRatios": ["1:1", "4:5"],
    "moods": ["professional", "modern"],
    "environments": ["studio", "outdoor"],
    "lightings": ["natural", "soft"],
    "angles": ["front", "side"],
    "hasModel": true,
    "keepModel": false,
    "modelPoses": ["standing", "sitting"],
    "modelGender": "female",
    "modelAge": 25,
    "includeProps": true,
    "showProductOnly": false,
    "brandColors": ["#FF5733", "#C70039"],
    "photoCount": 4
  },
  "productImages": [
    "https://example.com/product1.jpg",
    "https://example.com/product2.jpg"
  ],
  "referenceImages": [
    "https://example.com/ref1.jpg"
  ]
}
```

**Response (Success)**:
```json
{
  "success": true,
  "requestId": "cm3r5xyz...",
  "message": "Generation completed",
  "estimatedTime": 80,
  "photoCount": 4,
  "warnings": [],
  "photos": [
    {
      "id": "photo1",
      "photoUrl": "https://picsum.photos/seed/...",
      "thumbnailUrl": "https://picsum.photos/seed/.../300/300",
      "prompt": "Professional ecommerce photograph...",
      "negativePrompt": "low quality, blurry",
      "aiModel": "gemini-2.5-flash",
      "metadata": {
        "width": 1024,
        "height": 1024,
        "seed": "..."
      },
      "createdAt": "2025-10-07T..."
    }
  ]
}
```

### 2. Üretim Durumunu Kontrol Etme

**Endpoint**: `GET /api/generate/[requestId]/status`

**Headers**:
```
Authorization: Bearer YOUR_TOKEN
```

**Response**:
```json
{
  "requestId": "cm3r5xyz...",
  "status": "completed",
  "processingStatus": "completed",
  "progress": 100,
  "currentStep": "completed",
  "currentStepName": "AI ile Fotoğraf Üretimi",
  "currentStepProgress": 100,
  "workflows": [
    {
      "step": "step1_prompt_generation",
      "stepName": "Prompt Oluşturma",
      "status": "completed",
      "progress": 100,
      "startedAt": "2025-10-07T...",
      "completedAt": "2025-10-07T...",
      "generatedPhotoCount": 0,
      "requestedPhotoCount": 3
    },
    {
      "step": "step2_ai_generation",
      "stepName": "AI ile Fotoğraf Üretimi",
      "status": "completed",
      "progress": 100,
      "startedAt": "2025-10-07T...",
      "completedAt": "2025-10-07T...",
      "generatedPhotoCount": 4,
      "requestedPhotoCount": 4
    }
  ],
  "photos": [
    {
      "id": "photo1",
      "photoUrl": "https://picsum.photos/seed/...",
      "thumbnailUrl": "https://picsum.photos/seed/.../300/300",
      "prompt": "Professional ecommerce photograph...",
      "negativePrompt": "low quality, blurry",
      "aiModel": "gemini-2.5-flash",
      "metadata": {
        "width": 1024,
        "height": 1024
      },
      "createdAt": "2025-10-07T..."
    }
  ],
  "completedAt": "2025-10-07T...",
  "errorMessage": null,
  "createdAt": "2025-10-07T...",
  "updatedAt": "2025-10-07T..."
}
```

### 3. Tüm Üretimleri Listeleme

**Endpoint**: `GET /api/generate`

**Response**:
```json
{
  "success": true,
  "requests": [
    {
      "id": "cm3r5xyz...",
      "userId": "user123",
      "status": "completed",
      "currentStep": "completed",
      "workflows": [...],
      "generatedPhotos": [...],
      "createdAt": "2025-10-07T...",
      "updatedAt": "2025-10-07T..."
    }
  ]
}
```

## Status Değerleri

### Generation Request Status
- `pending`: İşlem beklemede
- `processing`: İşlem devam ediyor
- `completed`: İşlem tamamlandı
- `error`: Hata oluştu

### Workflow Step Status
- `pending`: Adım henüz başlamadı
- `processing`: Adım işleniyor
- `completed`: Adım tamamlandı
- `error`: Adımda hata oluştu
- `skipped`: Adım atlandı

## Frontend Kullanım Örneği

```javascript
// 1. Fotoğraf üretimi başlat
async function generatePhotos(userId, userResponses, productImages, referenceImages) {
  const response = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      userResponses,
      productImages,
      referenceImages
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Request ID:', data.requestId);
    console.log('Generated Photos:', data.photos);
    return data;
  } else {
    console.error('Error:', data.error);
    throw new Error(data.error);
  }
}

// 2. Status kontrolü
async function checkStatus(requestId, authToken) {
  const response = await fetch(`http://localhost:3000/api/generate/${requestId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  const data = await response.json();
  return data;
}

// 3. Polling ile status takibi
async function pollStatus(requestId, authToken, onUpdate) {
  const interval = setInterval(async () => {
    const status = await checkStatus(requestId, authToken);
    
    onUpdate(status);
    
    if (status.status === 'completed' || status.status === 'error') {
      clearInterval(interval);
      
      if (status.status === 'completed') {
        console.log('Fotoğraflar hazır:', status.photos);
      } else {
        console.error('Hata:', status.errorMessage);
      }
    }
  }, 2000); // Her 2 saniyede bir kontrol et
  
  return interval;
}

// Kullanım
const result = await generatePhotos('user123', userResponses, productImages, referenceImages);

// Eğer hemen fotoğraflar dönmezse, polling başlat
if (result.status !== 'completed') {
  const intervalId = await pollStatus(result.requestId, 'YOUR_TOKEN', (status) => {
    console.log('Progress:', status.progress, '%');
    console.log('Current Step:', status.currentStepName);
  });
}
```

## Önemli Notlar

1. **Fotoğraf Üretimi Şu Anda Senkron**: `/api/generate` endpoint'i fotoğrafları hemen oluşturuyor ve response ile birlikte dönüyor. `status: 'completed'` ve `photos` array'i hemen kullanılabilir.

2. **Status Endpoint**: Üretim tamamlandıktan sonra da status endpoint'ini kullanarak fotoğrafları ve detayları alabilirsiniz.

3. **Authorization**: Status endpoint'i için Authorization header'ı zorunludur.

4. **Fotoğraf Sayısı**: `photoCount` parametresi 2, 4, 6 veya 8 olmalıdır.

5. **Mockup Veriler**: Şu anda sistem mockup görüntüler (picsum.photos) kullanıyor. Production'da gerçek AI modelleri entegre edilecek.

## API Base URL

- **Development**: `http://localhost:3000`
- **Production**: TBD

## Hata Kodları

- `400`: Geçersiz istek (eksik veya hatalı parametreler)
- `401`: Yetkilendirme hatası (status endpoint için)
- `404`: İstek bulunamadı
- `500`: Sunucu hatası
