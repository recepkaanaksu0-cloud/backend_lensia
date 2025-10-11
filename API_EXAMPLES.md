# 🎨 ÖRNEK API MESAJLARI

## 🚀 Hızlı Başlangıç

### 1. ComfyUI ve Backend Başlat
```bash
# Terminal 1: ComfyUI
npm run comfyui

# Terminal 2: Backend
npm run dev
```

### 2. Gerçek Fotoğraf ID'si Al
```bash
# Mevcut fotoğrafları listele
curl http://localhost:51511/api/jobs | jq '.jobs[0].photos[0].id'

# Örnek çıktı: "cm5y8z123abc..."
```

---

## 📤 İSTEK ÖRNEKLERİ

### ✅ 1. ARKA PLAN RENK DEĞİŞTİRME

**JSON API:**
```bash
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "cm5y8z123abc",
    "processType": "background-color",
    "params": {
      "backgroundColor": "#FFFFFF"
    }
  }'
```

**RESTful API:**
```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/background-color \
  -H "Content-Type: application/json" \
  -d '{"backgroundColor": "#FFFFFF"}'
```

**JavaScript/TypeScript:**
```typescript
const response = await fetch('http://localhost:51511/api/post-process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    photoId: 'cm5y8z123abc',
    processType: 'background-color',
    params: {
      backgroundColor: '#FFFFFF'  // Beyaz
    }
  })
})

const result = await response.json()
console.log(result.outputImageUrl)
```

**CEVAP:**
```json
{
  "success": true,
  "refinementId": "ref_abc123",
  "outputImageUrl": "http://127.0.0.1:8188/view?filename=bg_color_00001_.png&type=output",
  "processInfo": {
    "name": "Arka Plan Renk Değiştir",
    "description": "Arka planı tek düze renge değiştirir",
    "category": "BASIC",
    "estimatedTime": "8-15s (GPU)"
  }
}
```

---

### ✅ 2. FOTOĞRAF DÖNDÜRME

```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/rotate \
  -H "Content-Type: application/json" \
  -d '{
    "rotationAngle": 90
  }'
```

**Parametreler:**
- `rotationAngle`: 0-360 arası derece (negatif değerler sola döndürür)
  - `90`: 90° sağa
  - `-45`: 45° sola
  - `180`: 180° ters çevir

---

### ✅ 3. NESNE/KİŞİ KALDIRMA

```bash
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "cm5y8z123abc",
    "processType": "object-delete",
    "params": {
      "prompt": "remove person in background, clean background",
      "negativePrompt": "artifacts, blur, distortion"
    }
  }'
```

**Popüler Prompt'lar:**
```json
{
  "prompt": "remove person, empty scene",
  "negativePrompt": "artifacts"
}

{
  "prompt": "delete car, clean street",
  "negativePrompt": "blur, distortion"
}

{
  "prompt": "remove object, seamless background",
  "negativePrompt": "visible edits"
}
```

---

### ✅ 4. PARLALIK/KONTRAST AYARLAMA

```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/brightness-contrast \
  -H "Content-Type: application/json" \
  -d '{
    "brightness": 0.2,
    "contrast": 0.15
  }'
```

**Parametre Değerleri:**
- `brightness`: -1 to 1 (negatif = karart, pozitif = aydınlat)
- `contrast`: -1 to 1 (negatif = düşük kontrast, pozitif = yüksek kontrast)

**Örnek Kombinasyonlar:**
```json
// Aydınlık ve canlı
{ "brightness": 0.3, "contrast": 0.2 }

// Koyu ve dramatik
{ "brightness": -0.2, "contrast": 0.4 }

// Yumuşak ve doğal
{ "brightness": 0.1, "contrast": -0.1 }
```

---

### ✅ 5. ARKA PLAN BULANIKLAŞTIRMA (Bokeh)

```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/blur-background \
  -H "Content-Type: application/json" \
  -d '{
    "blurStrength": 7
  }'
```

**Blur Strength Değerleri:**
- `3`: Hafif bokeh
- `7`: Orta bokeh (önerilen)
- `10`: Güçlü bokeh

---

### ✅ 6. YÜZ İYİLEŞTİRME

```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/face-enhance \
  -H "Content-Type: application/json" \
  -d '{
    "faceEnhanceStrength": 0.8
  }'
```

---

### ✅ 7. CİLT PÜRÜZSÜZLEŞTİRME

```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/skin-smooth \
  -H "Content-Type: application/json" \
  -d '{
    "skinSmoothLevel": 0.6
  }'
```

**Seviyeler:**
- `0.3`: Doğal görünüm
- `0.6`: Dengeli (önerilen)
- `0.9`: Porselen cilt

---

### ✅ 8. DİŞ BEYAZLATMA

```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/teeth-whiten \
  -H "Content-Type: application/json" \
  -d '{
    "teethWhitenLevel": 0.7
  }'
```

---

### ✅ 9. VÜCUT ŞEKİLLENDİRME

```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/body-reshape \
  -H "Content-Type: application/json" \
  -d '{
    "bodyReshape": {
      "waist": -0.2,
      "legs": 0.1,
      "arms": -0.1
    }
  }'
```

**Parametre Açıklaması:**
- `waist`: -1 to 1 (negatif = ince, pozitif = kalın)
- `legs`: -1 to 1 (negatif = kısa, pozitif = uzun)
- `arms`: -1 to 1 (negatif = ince, pozitif = kalın)

---

### ✅ 10. ARKA PLAN DEĞİŞTİRME (AI ile)

```bash
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "cm5y8z123abc",
    "processType": "background-change",
    "params": {
      "prompt": "professional white studio background, soft lighting",
      "negativePrompt": "busy, cluttered, distracting"
    }
  }'
```

**Popüler Arka Planlar:**
```json
// Stüdyo beyaz
{
  "prompt": "professional white studio background, clean, minimal",
  "negativePrompt": "shadows, texture"
}

// Doğa manzarası
{
  "prompt": "beautiful nature background, trees, outdoor scene",
  "negativePrompt": "indoor, artificial"
}

// Şehir manzarası (bulanık)
{
  "prompt": "blurred city background, bokeh lights, urban",
  "negativePrompt": "sharp, detailed"
}
```

---

### ✅ 11. UPSCALE (Büyütme)

```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/upscale \
  -H "Content-Type: application/json" \
  -d '{}'
```

2x veya 4x çözünürlük artırır (RealESRGAN kullanır)

---

### ✅ 12. ARKA PLAN KALDIRMA (Şeffaf PNG)

```bash
curl -X POST http://localhost:51511/api/uretim/cm5y8z123abc/background-remove \
  -H "Content-Type: application/json" \
  -d '{}'
```

Arka planı tamamen kaldırır, şeffaf PNG oluşturur.

---

## 🔍 İŞLEM DURUMU SORGULAMA

### Refinement ID ile Sorgulama
```bash
curl http://localhost:51511/api/post-process?refinementId=ref_abc123
```

**CEVAP:**
```json
{
  "success": true,
  "refinement": {
    "id": "ref_abc123",
    "photoId": "cm5y8z123abc",
    "refinementType": "background-color",
    "status": "completed",
    "inputImageUrl": "https://...",
    "outputImageUrl": "http://127.0.0.1:8188/view?filename=...",
    "parameters": "{\"backgroundColor\":\"#FFFFFF\"}",
    "createdAt": "2025-10-10T10:30:00.000Z",
    "completedAt": "2025-10-10T10:30:12.000Z"
  }
}
```

### Fotoğrafın Tüm İşlemlerini Listele
```bash
curl http://localhost:51511/api/post-process?photoId=cm5y8z123abc
```

---

## 📊 TÜM İŞLEM TİPLERİNİ LİSTELE

```bash
# Tüm işlemler
curl http://localhost:51511/api/post-process/types

# Kategori bazlı
curl http://localhost:51511/api/post-process/types?category=PORTRAIT
curl http://localhost:51511/api/post-process/types?category=ARTISTIC
curl http://localhost:51511/api/post-process/types?category=BASIC

# Tek işlem bilgisi
curl http://localhost:51511/api/post-process/types?type=background-color
```

---

## 🎯 ÖZEL SENARYOLAR

### Senaryo 1: E-Ticaret Ürün Fotoğrafı
```bash
# 1. Arka planı kaldır
curl -X POST http://localhost:51511/api/uretim/PHOTO_ID/background-remove \
  -H "Content-Type: application/json" -d '{}'

# 2. Beyaz arka plan ekle
curl -X POST http://localhost:51511/api/uretim/PHOTO_ID/background-color \
  -H "Content-Type: application/json" \
  -d '{"backgroundColor": "#FFFFFF"}'

# 3. Keskinleştir
curl -X POST http://localhost:51511/api/uretim/PHOTO_ID/sharpen \
  -H "Content-Type: application/json" \
  -d '{"sharpness": 1.5}'
```

### Senaryo 2: Portre Fotoğraf İyileştirme
```bash
# 1. Yüz iyileştir
curl -X POST http://localhost:51511/api/uretim/PHOTO_ID/face-enhance \
  -H "Content-Type: application/json" \
  -d '{"faceEnhanceStrength": 0.8}'

# 2. Cilt pürüzsüzleştir
curl -X POST http://localhost:51511/api/uretim/PHOTO_ID/skin-smooth \
  -H "Content-Type: application/json" \
  -d '{"skinSmoothLevel": 0.6}'

# 3. Diş beyazlat
curl -X POST http://localhost:51511/api/uretim/PHOTO_ID/teeth-whiten \
  -H "Content-Type: application/json" \
  -d '{"teethWhitenLevel": 0.7}'

# 4. Arka plan bulanıklaştır
curl -X POST http://localhost:51511/api/uretim/PHOTO_ID/blur-background \
  -H "Content-Type: application/json" \
  -d '{"blurStrength": 7}'
```

### Senaryo 3: Sosyal Medya İçeriği
```bash
# 1. Parlaklık/kontrast ayarla
curl -X POST http://localhost:51511/api/uretim/PHOTO_ID/brightness-contrast \
  -H "Content-Type: application/json" \
  -d '{"brightness": 0.2, "contrast": 0.15}'

# 2. Renk vurgula (gelecekte eklenecek)
# curl -X POST .../color-pop
```

---

## 🎨 RENK ÖRNEKLERİ (backgroundColor için)

```json
// Beyaz tonları
"#FFFFFF"  // Beyaz
"#F8F8F8"  // Açık gri-beyaz
"#F0F0F0"  // Gri-beyaz

// Gri tonları
"#E0E0E0"  // Açık gri
"#CCCCCC"  // Orta gri
"#808080"  // Gri

// Diğer
"#000000"  // Siyah
"#F5F5DC"  // Bej
"#FFF8DC"  // Krem
```

---

## ⚠️ HATA DURUMLARI

### ComfyUI Çevrimdışı
```json
{
  "success": false,
  "error": "ComfyUI sunucusu çevrimdışı. Lütfen ComfyUI'ı başlatın.",
  "help": "npm run comfyui veya npm run comfyui:cpu komutlarından birini çalıştırın"
}
```

**Çözüm:**
```bash
npm run comfyui  # veya npm run comfyui:cpu
```

### Fotoğraf Bulunamadı
```json
{
  "success": false,
  "error": "Fotoğraf bulunamadı"
}
```

**Çözüm:** Geçerli bir photoId kullanın.

### Geçersiz İşlem Tipi
```json
{
  "success": false,
  "error": "Geçersiz processType: invalid-type",
  "availableTypes": ["background-color", "rotate", ...]
}
```

---

## 🚀 FRONTEND ENTEGRASYONU

### React/Next.js Örneği
```typescript
'use client'

import { useState } from 'react'

export function PhotoPostProcess({ photoId }: { photoId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const processPhoto = async (processType: string, params: any = {}) => {
    setLoading(true)
    try {
      const response = await fetch('/api/post-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          processType,
          params
        })
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        alert('İşlem tamamlandı!')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => processPhoto('background-color', { backgroundColor: '#FFFFFF' })}
        disabled={loading}
      >
        Beyaz Arka Plan
      </button>
      
      <button
        onClick={() => processPhoto('rotate', { rotationAngle: 90 })}
        disabled={loading}
      >
        90° Döndür
      </button>
      
      <button
        onClick={() => processPhoto('face-enhance', { faceEnhanceStrength: 0.8 })}
        disabled={loading}
      >
        Yüz İyileştir
      </button>
      
      {result?.outputImageUrl && (
        <img src={result.outputImageUrl} alt="Processed" />
      )}
    </div>
  )
}
```

---

**✅ API Hazır! 50+ profesyonel işlem destekleniyor.**
