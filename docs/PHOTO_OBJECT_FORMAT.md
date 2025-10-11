# 📸 Photo Objesi Formatı

## Backend'den Frontend'e Gönderilen Yeni Photo Objesi

### ✅ Güncellenmiş Format

Backend artık her fotoğrafla birlikte **`photoId`** bilgisini de gönderiyor.

```typescript
{
  "success": true,
  "requests": [
    {
      "id": "cmgk1wrvx001g4af8tsmmexll",
      "userId": "user123",
      "generatedPhotos": [
        {
          "id": "photo-1760123333591-0",          // Database ID
          "photoId": "photo-1760123333591-0",      // ✅ YENİ: photoId eklendi
          "requestId": "cmgk1wrvx001g4af8tsmmexll",
          "photoUrl": "https://picsum.photos/seed/cmgk1wrvx001g4af8tsmmexll-0/1024/1024",
          "thumbnailUrl": "https://picsum.photos/seed/cmgk1wrvx001g4af8tsmmexll-0/300/300",
          "prompt": "Professional photo...",
          "negativePrompt": "low quality, blurry",
          "generationStep": "step2_ai_generation",
          "aiModel": "gemini-2.5-flash",
          "metadata": "{\"width\":1024,\"height\":1024,\"seed\":\"cmgk1wrvx001g4af8tsmmexll-0\"}",
          "createdAt": "2025-10-10T12:00:00.000Z",
          "refinements": []
        }
      ]
    }
  ]
}
```

---

## 🔄 Frontend'de Kullanım

### Photo Interface (TypeScript)

```typescript
interface GeneratedPhoto {
  id: string;                    // Database ID
  photoId: string;              // ✅ YENİ: Post-process için kullan
  requestId: string;
  photoUrl: string;
  thumbnailUrl: string;
  prompt: string;
  negativePrompt?: string;
  generationStep: string;
  aiModel: string;
  metadata: string;
  createdAt: string;
  refinements?: Refinement[];
}
```

### handlePhotoEdit Fonksiyonu (Güncellenmiş)

```typescript
const handlePhotoEdit = async (
  photo: GeneratedPhoto, 
  action: string, 
  params?: any
) => {
  // Action mapping
  const actionMap: Record<string, string> = {
    'remove_background': 'background-remove',
    'retouch': 'face-enhance',
    'remove_object': 'object-delete',
    'upscale': 'upscale',
    'enhance': 'noise-fix',
    'color_correct': 'brightness-contrast'
  };
  
  // ✅ photoId kullanarak API çağrısı yap
  const response = await fetch('/api/post-process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photoId: photo.photoId,  // ✅ Backend'den gelen photoId
      processType: actionMap[action] || action,
      params: params || {}
    })
  });
  
  if (!response.ok) {
    throw new Error(`Post-process failed: ${response.statusText}`);
  }
  
  return response.json();
};
```

---

## 📋 Örnek Kullanımlar

### 1. Remove Background

```typescript
// Photo objesinden photoId'yi al
const photo = generatedPhotos[0];

const result = await handlePhotoEdit(photo, 'remove_background');

console.log(result);
// {
//   "success": true,
//   "refinementId": "cm2refinement123",
//   "status": "processing",
//   "message": "Arka plan kaldırma işlemi başlatıldı",
//   "estimatedTime": 15
// }
```

### 2. Face Retouch

```typescript
const photo = generatedPhotos[0];

const result = await handlePhotoEdit(photo, 'retouch', {
  smoothness: 0.7,
  brightness: 0.3
});

console.log(result);
// {
//   "success": true,
//   "refinementId": "cm2refinement456",
//   "status": "processing",
//   "message": "Yüz düzeltme işlemi başlatıldı",
//   "estimatedTime": 20
// }
```

### 3. Upscale

```typescript
const photo = generatedPhotos[0];

const result = await handlePhotoEdit(photo, 'upscale', {
  scale: 4
});

console.log(result);
// {
//   "success": true,
//   "refinementId": "cm2refinement789",
//   "status": "processing",
//   "message": "Görüntü büyütme işlemi başlatıldı",
//   "estimatedTime": 30
// }
```

---

## 🎯 Photo Actions Button Component

```typescript
interface PhotoActionsProps {
  photo: GeneratedPhoto;
  onActionComplete?: (result: any) => void;
}

const PhotoActions: React.FC<PhotoActionsProps> = ({ photo, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  
  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const result = await handlePhotoEdit(photo, action);
      onActionComplete?.(result);
      
      // Success notification
      toast.success(`${action} işlemi başlatıldı!`);
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('İşlem başlatılamadı');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="photo-actions">
      <button 
        onClick={() => handleAction('remove_background')}
        disabled={loading}
      >
        🎨 Arka Planı Kaldır
      </button>
      
      <button 
        onClick={() => handleAction('retouch')}
        disabled={loading}
      >
        ✨ Yüz Düzelt
      </button>
      
      <button 
        onClick={() => handleAction('upscale')}
        disabled={loading}
      >
        🔍 Büyüt (4x)
      </button>
      
      <button 
        onClick={() => handleAction('remove_object')}
        disabled={loading}
      >
        🗑️ Obje Sil
      </button>
    </div>
  );
};
```

---

## 🔍 photoId vs id Farkı

| Field | Açıklama | Kullanım Alanı |
|-------|----------|----------------|
| **`id`** | Database primary key | Internal DB operations |
| **`photoId`** | Frontend için explicit ID | ✅ Post-process API çağrıları |

Her iki field de aynı değere sahip, ancak `photoId` frontend'de daha açık bir şekilde gösterir ki bu ID post-process işlemleri için kullanılmalı.

---

## ✅ Değişiklik Özeti

### Backend Değişikliği
- **Dosya**: `app/api/generate/route.ts`
- **Değişiklik**: 
  ```typescript
  generatedPhotos: req.generatedPhotos.map((photo) => ({
    ...photo,
    photoId: photo.id, // PhotoID eklendi
  }))
  ```

### Frontend Kullanımı
```typescript
// ESKİ (Çalışmıyor):
POST /api/generate/${generationId}/edit

// YENİ (Çalışıyor):
POST /api/post-process
Body: {
  "photoId": photo.photoId,  // ✅ Backend'den gelen photoId
  "processType": "background-remove",
  "params": {}
}
```

---

## 🚀 Test Komutu

```bash
# Backend'den photo listesini al
curl http://localhost:51511/api/generate | jq '.requests[0].generatedPhotos[0]'

# Çıktı:
{
  "id": "photo-1760123333591-0",
  "photoId": "photo-1760123333591-0",  ✅
  "photoUrl": "https://picsum.photos/seed/.../1024/1024",
  ...
}

# Photo ID ile post-process yap
curl -X POST http://localhost:51511/api/post-process \
  -H 'Content-Type: application/json' \
  -d '{
    "photoId": "photo-1760123333591-0",
    "processType": "background-remove",
    "params": {}
  }'
```

---

## 📝 Notlar

1. ✅ Backend her photo objesine `photoId` ekliyor
2. ✅ Frontend artık `photo.photoId` kullanabilir
3. ✅ Eski kodlar çalışmaya devam eder (photo.id hala var)
4. ✅ Yeni post-process API çağrıları için `photoId` kullan
5. ✅ TypeScript interface'i güncellemeyi unutma!
