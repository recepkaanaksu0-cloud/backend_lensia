# 🔧 BACKEND API ENDPOINT'LERİ - Frontend Entegrasyon Rehberi

## ❌ SORUN: 404 Hatası

Frontend şu endpoint'e istek atıyor (YANLIŞ):
```
POST https://api.lensia.ai/api/generate/{generationId}/edit
```

## ✅ ÇÖZÜM: Doğru Endpoint'ler

### **Seçenek 1: Post-Process API (ÖNERİLEN)**

```typescript
POST http://localhost:51511/api/post-process
Content-Type: application/json

{
  "photoId": "cmgk1wrvx001g4af8tsmmexll",
  "processType": "background-remove",  // veya "retouch", "object-delete", vb.
  "params": {}
}
```

### **Seçenek 2: RESTful API**

```typescript
POST http://localhost:51511/api/uretim/{photoId}/{processType}
Content-Type: application/json

// Örnek: Arka plan kaldırma
POST http://localhost:51511/api/uretim/cmgk1wrvx001g4af8tsmmexll/background-remove
{}

// Örnek: Nesne silme
POST http://localhost:51511/api/uretim/cmgk1wrvx001g4af8tsmmexll/object-delete
{
  "prompt": "remove person in background"
}
```

---

## 📋 İŞLEM TİPİ EŞLEŞTİRMELERİ

Frontend'deki action isimleri → Backend processType:

| Frontend Action | Backend processType | Endpoint Örneği |
|----------------|---------------------|-----------------|
| `remove_background` | `background-remove` | `/api/uretim/{photoId}/background-remove` |
| `retouch` | `face-enhance` | `/api/uretim/{photoId}/face-enhance` |
| `remove_object` | `object-delete` | `/api/uretim/{photoId}/object-delete` |
| `upscale` | `upscale` | `/api/uretim/{photoId}/upscale` |
| `enhance` | `noise-fix` | `/api/uretim/{photoId}/noise-fix` |
| `color_correct` | `brightness-contrast` | `/api/uretim/{photoId}/brightness-contrast` |

---

## 🔧 FRONTEND DÜZELTMELERİ

### **1. page.tsx - handlePhotoEdit Fonksiyonu**

**MEVCUT (YANLIŞ):**
```typescript
const handlePhotoEdit = async (photoId: string, action: string, params?: any) => {
  console.log('📝 Edit action:', action, 'on photo', photoId);
  
  const response = await fetch(
    `https://api.lensia.ai/api/generate/${generationId}/edit`,  // ❌ YANLIŞ
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, action, ...params })
    }
  );
};
```

**YENİ (DOĞRU):**
```typescript
const handlePhotoEdit = async (photoId: string, action: string, params?: any) => {
  console.log('📝 Edit action:', action, 'on photo', photoId);
  
  // Action'ı processType'a çevir
  const processTypeMap: Record<string, string> = {
    'remove_background': 'background-remove',
    'retouch': 'face-enhance',
    'remove_object': 'object-delete',
    'upscale': 'upscale',
    'enhance': 'noise-fix',
    'color_correct': 'brightness-contrast'
  };
  
  const processType = processTypeMap[action] || action;
  
  // ✅ DOĞRU Endpoint
  const response = await fetch(
    `/api/post-process`,  // veya `/api/uretim/${photoId}/${processType}`
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        processType,
        params: params || {}
      })
    }
  );
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ İşlem başarılı:', result.refinementId);
    // Refinement ID ile durumu takip et
    pollRefinementStatus(result.refinementId);
  } else {
    console.error('❌ İşlem hatası:', result.error);
  }
};

// Durum takibi
const pollRefinementStatus = async (refinementId: string) => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/post-process?refinementId=${refinementId}`);
    const data = await res.json();
    
    if (data.refinement.status === 'completed') {
      clearInterval(interval);
      console.log('🎉 İşlem tamamlandı!', data.refinement.outputImageUrl);
      // Fotoğrafı güncelle
      updatePhotoInGrid(data.refinement.outputImageUrl);
    } else if (data.refinement.status === 'failed') {
      clearInterval(interval);
      console.error('❌ İşlem başarısız:', data.refinement.errorMessage);
    }
  }, 3000); // 3 saniyede bir kontrol
};
```

---

## 📝 KOMPLE ÖRNEK - page.tsx Güncellemesi

```typescript
// page.tsx - handlePhotoEdit fonksiyonunu değiştir

const handlePhotoEdit = async (
  photoId: string, 
  action: string, 
  params?: any
) => {
  console.log('📝 Edit action:', action, 'on photo', photoId);
  
  try {
    // Action mapping
    const processTypeMap: Record<string, string> = {
      'remove_background': 'background-remove',
      'retouch': 'face-enhance',
      'remove_object': 'object-delete',
      'upscale': 'upscale',
      'enhance': 'noise-fix',
      'sharpen': 'sharpen',
      'color_correct': 'brightness-contrast',
      'blur_background': 'blur-background',
      'skin_smooth': 'skin-smooth'
    };
    
    const processType = processTypeMap[action] || action;
    
    // API çağrısı - YENİ ENDPOINT
    const response = await fetch('/api/post-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        processType,
        params: params || {}
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ İşlem başlatıldı:', result.refinementId);
      
      // Toast bildirimi
      toast.success('Fotoğraf işleniyor...', {
        description: `${result.processInfo?.name || action} işlemi başlatıldı`
      });
      
      // Durum takibi başlat
      await pollRefinementStatus(result.refinementId, photoId);
      
      return result;
    } else {
      throw new Error(result.error || 'İşlem başarısız');
    }
    
  } catch (error) {
    console.error('❌ Edit hatası:', error);
    toast.error('İşlem başarısız', {
      description: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
    throw error;
  }
};

// Refinement durumunu takip et
const pollRefinementStatus = async (
  refinementId: string,
  photoId: string,
  maxAttempts = 60  // 3 dakika (60 x 3s)
) => {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const res = await fetch(
          `/api/post-process?refinementId=${refinementId}`
        );
        const data = await res.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Durum sorgulanamadı');
        }
        
        const { refinement } = data;
        
        // Tamamlandı
        if (refinement.status === 'completed') {
          clearInterval(interval);
          console.log('🎉 İşlem tamamlandı!', refinement.outputImageUrl);
          
          toast.success('İşlem tamamlandı!', {
            description: 'Fotoğraf başarıyla işlendi'
          });
          
          // Fotoğrafı grid'de güncelle
          updatePhotoInGrid(photoId, refinement.outputImageUrl);
          
          resolve(refinement);
        }
        // Başarısız
        else if (refinement.status === 'failed') {
          clearInterval(interval);
          console.error('❌ İşlem başarısız:', refinement.errorMessage);
          
          toast.error('İşlem başarısız', {
            description: refinement.errorMessage || 'Bilinmeyen hata'
          });
          
          reject(new Error(refinement.errorMessage));
        }
        // Timeout
        else if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.error('⏱️ İşlem zaman aşımına uğradı');
          
          toast.error('İşlem zaman aşımına uğradı', {
            description: 'Lütfen tekrar deneyin'
          });
          
          reject(new Error('Timeout'));
        }
        // Devam ediyor
        else {
          console.log(`⏳ İşlem devam ediyor... (${attempts}/${maxAttempts})`);
        }
        
      } catch (error) {
        clearInterval(interval);
        console.error('❌ Durum sorgulama hatası:', error);
        reject(error);
      }
      
    }, 3000); // 3 saniyede bir kontrol
  });
};

// Grid'deki fotoğrafı güncelle
const updatePhotoInGrid = (photoId: string, newImageUrl: string) => {
  // Mevcut photos state'ini güncelle
  setPhotos(prev => prev.map(photo => 
    photo.id === photoId 
      ? { ...photo, photoUrl: newImageUrl, updatedAt: new Date() }
      : photo
  ));
};
```

---

## 🎯 HIZLI DÜZELTİLMİŞ VERSİYON

`page.tsx` dosyasının 442-450 satırlarını şununla değiştir:

```typescript
const handlePhotoEdit = async (photoId: string, action: string, params?: any) => {
  console.log('📝 Edit action:', action, 'on photo', photoId);
  
  const processTypeMap: Record<string, string> = {
    'remove_background': 'background-remove',
    'retouch': 'face-enhance',
    'remove_object': 'object-delete'
  };
  
  const response = await fetch('/api/post-process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photoId,
      processType: processTypeMap[action] || action,
      params: params || {}
    })
  });
  
  const result = await response.json();
  console.log('✅ API Response:', result);
  
  return result;
};
```

---

## 🔍 TEST

Düzeltmeden sonra terminalde şunu görmelisiniz:

```bash
# ÖNCE (YANLIŞ):
POST https://api.lensia.ai/api/generate/.../edit 404

# SONRA (DOĞRU):
POST http://localhost:51511/api/post-process 200
✅ İşlem başlatıldı: cm2refinement123
```

---

## 📊 BACKEND LOG'LARDA GÖRECEKLER

```
POST /api/post-process
Body: {
  photoId: "cmgk1wrvx001g4af8tsmmexll",
  processType: "background-remove",
  params: {}
}
✅ ComfyUI isteği başlatıldı
✅ Refinement kaydı oluşturuldu: cm2refinement456
```

---

## 🚀 ÖZET

1. **page.tsx** dosyasındaki `handlePhotoEdit` fonksiyonunu yukarıdaki kodla değiştir
2. Action isimlerini processType'a çeviren mapping ekle
3. Endpoint'i `/api/post-process` olarak değiştir
4. Refinement ID ile durum takibi ekle (opsiyonel ama önerilen)

**Güncel Endpoint:**
```
POST /api/post-process
```

**Eski (Yanlış) Endpoint:**
```
POST /api/generate/{id}/edit  ❌ SİL
```
