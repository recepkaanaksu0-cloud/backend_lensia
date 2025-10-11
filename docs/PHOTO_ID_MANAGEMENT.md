# 🔑 Photo ID Yönetimi - Nasıl Kullanılır?

## ❌ Yaygın Hata

Frontend şu ID'leri gönderiyor:
```
photo-1760128452468-1
photo-1760128452468-2
```

Backend şu ID'leri bekliyor:
```
cmgavsbhc00064autzh1f5hk8
cmgavsbij00084aut0olj3com
cmgavsbjm000a4autev5cy1tp
```

**Sonuç**: `404 Fotoğraf bulunamadı` hatası!

---

## ✅ Doğru Kullanım

### 1️⃣ Backend'den Fotoğrafları Al

```bash
GET http://localhost:51511/api/generate
```

**Yanıt:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "cmgk1wrvx001g4af8tsmmexll",
      "generatedPhotos": [
        {
          "id": "cmgavsbhc00064autzh1f5hk8",
          "photoId": "cmgavsbhc00064autzh1f5hk8",
          "photoUrl": "https://picsum.photos/seed/abc-0/1024/1024",
          "thumbnailUrl": "https://picsum.photos/seed/abc-0/300/300"
        },
        {
          "id": "cmgavsbij00084aut0olj3com",
          "photoId": "cmgavsbij00084aut0olj3com",
          "photoUrl": "https://picsum.photos/seed/abc-1/1024/1024",
          "thumbnailUrl": "https://picsum.photos/seed/abc-1/300/300"
        }
      ]
    }
  ]
}
```

### 2️⃣ Photo ID'yi Kullan

Frontend'de her photo objesinden `id` veya `photoId` değerini kullan:

```typescript
// ✅ DOĞRU
const photo = generatedPhotos[0];
const photoId = photo.id;  // "cmgavsbhc00064autzh1f5hk8"

// veya
const photoId = photo.photoId;  // "cmgavsbhc00064autzh1f5hk8"

// ❌ YANLIŞ
const photoId = "photo-1760128452468-1";  // Mock ID kullanma!
```

### 3️⃣ Post-Process İsteği Gönder

```typescript
const response = await fetch('/api/post-process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    photoId: photo.id,  // ✅ Gerçek DB ID'si
    processType: 'background-remove',
    params: {}
  })
});
```

---

## 🎯 Photo ID Formatları

| Format | Örnek | Kullanım | Geçerli? |
|--------|-------|----------|----------|
| **Prisma cuid()** | `cmgavsbhc00064autzh1f5hk8` | Veritabanı primary key | ✅ KULLAN |
| **Mock ID** | `photo-1760128452468-1` | Geliştirme/test | ❌ KULLANMA |
| **Timestamp ID** | `1760128452468` | Timestamp değeri | ❌ KULLANMA |

---

## 📝 Frontend Kod Örneği

### React Component ile Kullanım

```typescript
import { useState, useEffect } from 'react';

interface GeneratedPhoto {
  id: string;              // Gerçek DB ID - cmgavsbhc00064autzh1f5hk8
  photoId: string;         // Aynı değer
  photoUrl: string;
  thumbnailUrl: string;
}

export function PhotoEditor() {
  const [photos, setPhotos] = useState<GeneratedPhoto[]>([]);
  
  // 1. Fotoğrafları yükle
  useEffect(() => {
    fetch('http://localhost:51511/api/generate')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.requests.length > 0) {
          setPhotos(data.requests[0].generatedPhotos);
        }
      });
  }, []);
  
  // 2. Düzenleme işlemi
  const handleEdit = async (photo: GeneratedPhoto, action: string) => {
    const actionMap: Record<string, string> = {
      'remove_background': 'background-remove',
      'retouch': 'face-enhance',
      'upscale': 'upscale'
    };
    
    try {
      const response = await fetch('/api/post-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: photo.id,  // ✅ Gerçek ID kullan
          processType: actionMap[action] || action,
          params: {}
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Post-process failed:', error);
        alert(`Hata: ${error.error}`);
        return;
      }
      
      const result = await response.json();
      console.log('Success:', result);
      alert(`İşlem başlatıldı: ${result.refinementId}`);
      
    } catch (error) {
      console.error('Request failed:', error);
      alert('İstek gönderilemedi');
    }
  };
  
  return (
    <div>
      {photos.map((photo) => (
        <div key={photo.id}>
          <img src={photo.thumbnailUrl} alt="Photo" />
          <p>ID: {photo.id}</p>
          
          <button onClick={() => handleEdit(photo, 'remove_background')}>
            🎨 Arka Planı Kaldır
          </button>
          
          <button onClick={() => handleEdit(photo, 'retouch')}>
            ✨ Yüz Düzelt
          </button>
          
          <button onClick={() => handleEdit(photo, 'upscale')}>
            🔍 Büyüt
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Test Komutları

### 1. Gerçek Photo ID'leri Listele

```bash
curl http://localhost:51511/api/generate | jq '.requests[0].generatedPhotos[] | {id, photoId, photoUrl}'
```

**Çıktı:**
```json
{
  "id": "cmgavsbhc00064autzh1f5hk8",
  "photoId": "cmgavsbhc00064autzh1f5hk8",
  "photoUrl": "https://picsum.photos/seed/abc-0/1024/1024"
}
{
  "id": "cmgavsbij00084aut0olj3com",
  "photoId": "cmgavsbij00084aut0olj3com",
  "photoUrl": "https://picsum.photos/seed/abc-1/1024/1024"
}
```

### 2. Photo ID ile Post-Process Yap

```bash
# İlk fotoğrafın ID'sini al
PHOTO_ID=$(curl -s http://localhost:51511/api/generate | jq -r '.requests[0].generatedPhotos[0].id')

echo "Photo ID: $PHOTO_ID"

# Post-process isteği gönder
curl -X POST http://localhost:51511/api/post-process \
  -H 'Content-Type: application/json' \
  -d "{
    \"photoId\": \"$PHOTO_ID\",
    \"processType\": \"background-remove\",
    \"params\": {}
  }"
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "refinementId": "cm2refinement123",
  "outputImageUrl": "/outputs/refined_abc.png",
  "processInfo": {
    "name": "Background Remove",
    "description": "Arka planı kaldırır",
    "estimatedTime": 15
  }
}
```

---

## 🚨 Hata Durumları

### 404 - Fotoğraf Bulunamadı

```json
{
  "success": false,
  "error": "Fotoğraf bulunamadı"
}
```

**Sebep**: Yanlış photo ID kullanıldı (mock ID veya yanlış format)

**Çözüm**: Backend'den gelen gerçek `photo.id` değerini kullan

### 400 - Geçersiz photoId

```json
{
  "success": false,
  "error": "photoId gerekli"
}
```

**Sebep**: photoId gönderilmedi veya boş string

**Çözüm**: Request body'de `photoId` alanını doldur

---

## 📊 ID Karşılaştırması

| Senaryo | Frontend Gönderen | Backend Bekleyen | Sonuç |
|---------|-------------------|------------------|-------|
| ✅ Doğru | `cmgavsbhc00064autzh1f5hk8` | `cmgavsbhc00064autzh1f5hk8` | **200 OK** |
| ❌ Yanlış | `photo-1760128452468-1` | `cmgavsbhc00064autzh1f5hk8` | **404 Not Found** |
| ❌ Yanlış | `1760128452468` | `cmgavsbhc00064autzh1f5hk8` | **404 Not Found** |
| ❌ Yanlış | `undefined` | `cmgavsbhc00064autzh1f5hk8` | **400 Bad Request** |

---

## 🎉 Özet

1. ✅ Backend'den `/api/generate` endpoint'ini çağır
2. ✅ `generatedPhotos` array'inden photo objelerini al
3. ✅ Her photo'nun `id` veya `photoId` değerini kullan (ikisi de aynı)
4. ✅ Post-process isteğinde bu ID'yi `photoId` parametresine gönder
5. ❌ Mock ID'ler (`photo-1760128452468-1`) kullanma
6. ❌ Timestamp değerleri (`1760128452468`) kullanma
7. ✅ Sadece Prisma cuid formatındaki ID'leri kullan (`cmgavsbhc00064autzh1f5hk8`)

---

## 🔗 İlgili Dökümanlar

- **API Kullanımı**: `docs/COMFYUI_API_GUIDE.md`
- **Photo Objesi**: `docs/PHOTO_OBJECT_FORMAT.md`
- **Frontend Fix**: `docs/FRONTEND_FIX_GUIDE.md`
