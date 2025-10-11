# 🎨 POST-PROCESS API DÖKÜMANTASYONU

## 📋 İçindekiler
1. [API Endpoints](#api-endpoints)
2. [Tüm İşlem Tipleri](#tüm-i̇şlem-tipleri)
3. [Örnek İstekler](#örnek-i̇stekler)
4. [Parametreler](#parametreler)

---

## 🔌 API Endpoints

### 1. JSON-Based API (Önerilen)
```
POST /api/post-process
GET  /api/post-process?photoId={id}
GET  /api/post-process?refinementId={id}
GET  /api/post-process/types
GET  /api/post-process/types?category=PORTRAIT
GET  /api/post-process/types?type=background-color
```

### 2. RESTful URL-Based API
```
POST /api/uretim/{photoId}/{processType}
GET  /api/uretim/{photoId}/{processType}
```

---

## 🎯 Tüm İşlem Tipleri (50+ İşlem)

### 📁 **BASIC** (Temel İşlemler)
| İşlem | Açıklama | Süre |
|-------|----------|------|
| `object-delete` | Nesne silme | 20-40s |
| `background-change` | Arka plan değiştir | 25-45s |
| `background-remove` | Arka plan kaldır (PNG) | 5-10s |
| `background-color` | ✨ Arka plan renk değiştir | 8-15s |
| `rotate` | ✨ Fotoğraf döndür | 2-5s |
| `crop-smart` | Akıllı kırpma | 10-15s |

### 🎨 **ENHANCEMENT** (Kalite İyileştirme)
| İşlem | Açıklama | Süre |
|-------|----------|------|
| `noise-fix` | Rötuş/gürültü azaltma | 15-25s |
| `upscale` | 2x/4x büyütme | 10-30s |
| `sharpen` | Keskinleştirme | 5-10s |
| `brightness-contrast` | ✨ Parlaklık/kontrast | 5-10s |
| `saturation` | ✨ Doygunluk ayarı | 5-10s |
| `resolution-enhance` | Çözünürlük iyileştirme | 20-40s |
| `denoise-advanced` | Gelişmiş gürültü azaltma | 20-35s |
| `hdr-enhance` | HDR iyileştirme | 20-35s |
| `super-resolution` | Süper çözünürlük (8x) | 40-80s |

### 👤 **PORTRAIT** (Portre İyileştirme)
| İşlem | Açıklama | Süre |
|-------|----------|------|
| `face-enhance` | ✨ Yüz iyileştirme | 20-35s |
| `skin-smooth` | ✨ Cilt pürüzsüzleştirme | 15-25s |
| `eye-enhance` | ✨ Göz iyileştirme | 15-25s |
| `teeth-whiten` | ✨ Diş beyazlatma | 10-20s |
| `makeup-apply` | ✨ Makyaj uygulama | 25-40s |
| `hair-color` | ✨ Saç rengi değiştir | 20-35s |
| `age-modify` | ✨ Yaş değiştirme | 30-50s |
| `gender-swap` | ✨ Cinsiyet değiştirme | 35-60s |

### 💪 **BODY** (Vücut İşlemleri)
| İşlem | Açıklama | Süre |
|-------|----------|------|
| `body-reshape` | ✨ Vücut şekillendirme | 25-40s |
| `clothing-change` | ✨ Kıyafet değiştirme | 40-70s |

### 💡 **LIGHTING** (Işık ve Efektler)
| İşlem | Açıklama | Süre |
|-------|----------|------|
| `lighting-adjust` | ✨ Işık ayarlama | 20-35s |
| `shadow-remove` | ✨ Gölge kaldırma | 20-35s |
| `blur-background` | ✨ Arka plan bulanıklaştır | 15-25s |
| `reflection-add` | ✨ Yansıma ekle | 15-25s |

### 🎭 **ARTISTIC** (Artistik Efektler)
| İşlem | Açıklama | Süre |
|-------|----------|------|
| `style-transfer` | ✨ Stil transfer | 30-50s |
| `vintage-effect` | ✨ Vintage efekt | 10-20s |
| `black-white` | ✨ Siyah beyaz | 5-10s |
| `sepia` | ✨ Sepya tonu | 5-10s |
| `film-grain` | ✨ Film grain | 8-15s |
| `color-pop` | ✨ Renk vurgulama | 15-25s |
| `vignette` | ✨ Vinyet efekti | 5-10s |

### 🔧 **PROFESSIONAL** (Profesyonel Düzeltmeler)
| İşlem | Açıklama | Süre |
|-------|----------|------|
| `perspective-fix` | ✨ Perspektif düzeltme | 10-20s |
| `color-grade` | ✨ Renk düzenleme | 15-25s |
| `lens-correction` | ✨ Lens düzeltme | 10-20s |
| `chromatic-aberration` | ✨ Renk sapması düzeltme | 10-20s |
| `watermark-remove` | ✨ Filigran kaldırma | 20-40s |

### 🏷️ **BRANDING** (Marka İşlemleri)
| İşlem | Açıklama | Süre |
|-------|----------|------|
| `text-add` | ✨ Metin ekle | 5-10s |
| `logo-add` | ✨ Logo ekle | 8-15s |
| `border-add` | ✨ Çerçeve ekle | 5-10s |

### 🔄 **RESTORATION** (Restorasyon)
| İşlem | Açıklama | Süre |
|-------|----------|------|
| `restore-old-photo` | ✨ Eski fotoğraf restore | 40-80s |

---

## 📝 Örnek İstekler

### 1️⃣ Arka Plan Renk Değiştirme
```bash
# JSON API
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "abc123",
    "processType": "background-color",
    "params": {
      "backgroundColor": "#FFFFFF"
    }
  }'

# RESTful API
curl -X POST http://localhost:51511/api/uretim/abc123/background-color \
  -H "Content-Type: application/json" \
  -d '{
    "backgroundColor": "#FFFFFF"
  }'
```

**Cevap:**
```json
{
  "success": true,
  "refinementId": "ref_xyz789",
  "outputImageUrl": "https://cdn.lensia.ai/refined/abc123_bg_white.png",
  "processInfo": {
    "name": "Arka Plan Renk Değiştir",
    "description": "Arka planı tek düze renge değiştirir",
    "estimatedTime": "8-15s (GPU)"
  }
}
```

### 2️⃣ Fotoğraf Döndürme
```bash
# JSON API
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "abc123",
    "processType": "rotate",
    "params": {
      "rotationAngle": 90
    }
  }'

# RESTful API
curl -X POST http://localhost:51511/api/uretim/abc123/rotate \
  -H "Content-Type: application/json" \
  -d '{
    "rotationAngle": 90
  }'
```

**Cevap:**
```json
{
  "success": true,
  "refinementId": "ref_rot456",
  "outputImageUrl": "https://cdn.lensia.ai/refined/abc123_rotated_90.png"
}
```

### 3️⃣ Nesne Silme (İstenmeyen Kişi Kaldırma)
```bash
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "abc123",
    "processType": "object-delete",
    "params": {
      "prompt": "remove person in background, clean scene",
      "negativePrompt": "artifacts, distortion"
    }
  }'
```

### 4️⃣ Portre İyileştirme Kombinasyonu
```bash
# Yüz iyileştirme
curl -X POST http://localhost:51511/api/uretim/abc123/face-enhance \
  -H "Content-Type: application/json" \
  -d '{
    "faceEnhanceStrength": 0.8
  }'

# Cilt pürüzsüzleştirme
curl -X POST http://localhost:51511/api/uretim/abc123/skin-smooth \
  -H "Content-Type: application/json" \
  -d '{
    "skinSmoothLevel": 0.6
  }'

# Diş beyazlatma
curl -X POST http://localhost:51511/api/uretim/abc123/teeth-whiten \
  -H "Content-Type: application/json" \
  -d '{
    "teethWhitenLevel": 0.7
  }'
```

### 5️⃣ Renk Düzenleme
```bash
curl -X POST http://localhost:51511/api/uretim/abc123/color-grade \
  -H "Content-Type: application/json" \
  -d '{
    "brightness": 0.2,
    "contrast": 0.15,
    "saturation": 0.1
  }'
```

### 6️⃣ Vücut Şekillendirme
```bash
curl -X POST http://localhost:51511/api/uretim/abc123/body-reshape \
  -H "Content-Type: application/json" \
  -d '{
    "bodyReshape": {
      "waist": -0.2,
      "legs": 0.1,
      "arms": -0.1
    }
  }'
```

### 7️⃣ Arka Plan Bulanıklaştırma (Bokeh)
```bash
curl -X POST http://localhost:51511/api/uretim/abc123/blur-background \
  -H "Content-Type: application/json" \
  -d '{
    "blurStrength": 7
  }'
```

### 8️⃣ Logo ve Metin Ekleme
```bash
# Logo ekle
curl -X POST http://localhost:51511/api/uretim/abc123/logo-add \
  -H "Content-Type: application/json" \
  -d '{
    "logoUrl": "https://lensia.ai/logo.png",
    "logoPosition": "bottom-right"
  }'

# Metin ekle
curl -X POST http://localhost:51511/api/uretim/abc123/text-add \
  -H "Content-Type: application/json" \
  -d '{
    "textContent": "LENSIA.AI",
    "textPosition": { "x": 100, "y": 100 },
    "textStyle": {
      "font": "Arial",
      "size": 48,
      "color": "#FFFFFF",
      "bold": true
    }
  }'
```

### 9️⃣ Saç Rengi Değiştirme
```bash
curl -X POST http://localhost:51511/api/uretim/abc123/hair-color \
  -H "Content-Type: application/json" \
  -d '{
    "hairColor": "#8B4513"
  }'
```

### 🔟 Perspektif Düzeltme (Mimari Fotoğraflar)
```bash
curl -X POST http://localhost:51511/api/uretim/abc123/perspective-fix \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📊 İşlem Durumu Sorgulama

### Refinement ID ile Sorgulama
```bash
curl http://localhost:51511/api/post-process?refinementId=ref_xyz789
```

**Cevap:**
```json
{
  "success": true,
  "refinement": {
    "id": "ref_xyz789",
    "photoId": "abc123",
    "refinementType": "background-color",
    "status": "completed",
    "inputImageUrl": "https://cdn.lensia.ai/original/abc123.png",
    "outputImageUrl": "https://cdn.lensia.ai/refined/abc123_bg_white.png",
    "parameters": "{\"backgroundColor\":\"#FFFFFF\"}",
    "createdAt": "2025-10-10T10:30:00Z",
    "completedAt": "2025-10-10T10:30:12Z"
  },
  "processInfo": {
    "name": "Arka Plan Renk Değiştir",
    "description": "Arka planı tek düze renge değiştirir"
  }
}
```

### Photo ID ile Tüm İşlemleri Listeleme
```bash
curl http://localhost:51511/api/post-process?photoId=abc123
```

**Cevap:**
```json
{
  "success": true,
  "refinements": [
    {
      "id": "ref_1",
      "refinementType": "background-color",
      "status": "completed",
      "outputImageUrl": "..."
    },
    {
      "id": "ref_2",
      "refinementType": "rotate",
      "status": "completed",
      "outputImageUrl": "..."
    }
  ],
  "count": 2
}
```

---

## 🎛️ Tüm İşlem Tiplerini Listeleme

### Tüm İşlemleri Getir
```bash
curl http://localhost:51511/api/post-process/types
```

### Kategoriye Göre Filtrele
```bash
# Portre işlemleri
curl http://localhost:51511/api/post-process/types?category=PORTRAIT

# Artistik efektler
curl http://localhost:51511/api/post-process/types?category=ARTISTIC

# Temel işlemler
curl http://localhost:51511/api/post-process/types?category=BASIC
```

**Kategoriler:**
- `BASIC` - Temel işlemler
- `ENHANCEMENT` - Kalite iyileştirme
- `PORTRAIT` - Portre işlemleri
- `BODY` - Vücut işlemleri
- `LIGHTING` - Işık ve efektler
- `ARTISTIC` - Artistik efektler
- `PROFESSIONAL` - Profesyonel düzeltmeler
- `BRANDING` - Marka işlemleri
- `RESTORATION` - Restorasyon

### Tek Bir İşlem Bilgisi
```bash
curl http://localhost:51511/api/post-process/types?type=background-color
```

**Cevap:**
```json
{
  "success": true,
  "type": "background-color",
  "name": "Arka Plan Renk Değiştir",
  "description": "Arka planı tek düze renge değiştirir",
  "category": "BASIC",
  "estimatedTime": "8-15s (GPU)",
  "requiredParams": ["backgroundColor"],
  "examples": [
    { "backgroundColor": "#FFFFFF" },
    { "backgroundColor": "#F0F0F0" },
    { "backgroundColor": "#000000" }
  ]
}
```

---

## 🔧 Parametreler Detayı

### `background-color`
```typescript
{
  backgroundColor: string  // Hex color (örn: "#FFFFFF", "#000000", "#F0F0F0")
}
```

### `rotate`
```typescript
{
  rotationAngle: number  // Derece (0-360, negatif değerler de desteklenir)
}
```

### `object-delete`
```typescript
{
  prompt: string           // "remove person", "delete car", vb.
  negativePrompt?: string  // "artifacts", "blur", vb.
}
```

### `face-enhance`
```typescript
{
  faceEnhanceStrength?: number  // 0-1 arası (varsayılan: 0.8)
}
```

### `skin-smooth`
```typescript
{
  skinSmoothLevel?: number  // 0-1 arası (varsayılan: 0.6)
}
```

### `brightness-contrast`
```typescript
{
  brightness?: number  // -1 to 1
  contrast?: number    // -1 to 1
}
```

### `body-reshape`
```typescript
{
  bodyReshape: {
    waist?: number   // -1 to 1 (negatif = ince, pozitif = kalın)
    legs?: number    // -1 to 1 (negatif = kısa, pozitif = uzun)
    arms?: number    // -1 to 1
  }
}
```

### `text-add`
```typescript
{
  textContent: string,
  textPosition?: { x: number, y: number },
  textStyle?: {
    font?: string,
    size?: number,
    color?: string,  // Hex color
    bold?: boolean
  }
}
```

### `logo-add`
```typescript
{
  logoUrl: string,
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
}
```

---

## ⚡ Hızlı Başlangıç

### 1. ComfyUI'ı Başlat
```bash
npm run comfyui
```

### 2. Backend'i Başlat
```bash
npm run dev
```

### 3. İlk İsteğini Gönder
```bash
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "YOUR_PHOTO_ID",
    "processType": "background-color",
    "params": {
      "backgroundColor": "#FFFFFF"
    }
  }'
```

---

## 📞 Hata Durumları

### ComfyUI Çevrimdışı
```json
{
  "success": false,
  "error": "ComfyUI sunucusu çevrimdışı. Lütfen ComfyUI'ı başlatın.",
  "help": "npm run comfyui veya npm run comfyui:cpu komutlarından birini çalıştırın"
}
```

### Geçersiz İşlem Tipi
```json
{
  "success": false,
  "error": "Geçersiz processType: invalid-type",
  "availableTypes": ["background-color", "rotate", ...]
}
```

### Fotoğraf Bulunamadı
```json
{
  "success": false,
  "error": "Fotoğraf bulunamadı"
}
```

---

## 🎯 Önerilen Kullanım Senaryoları

### E-Ticaret Ürün Fotoğrafları
1. `background-remove` - Arka planı kaldır
2. `background-color` - Beyaz arka plan (#FFFFFF)
3. `sharpen` - Keskinleştir
4. `brightness-contrast` - Parlaklığı ayarla

### Portre Fotoğrafları
1. `face-enhance` - Yüz iyileştir
2. `skin-smooth` - Cilt pürüzsüzleştir
3. `eye-enhance` - Göz iyileştir
4. `teeth-whiten` - Diş beyazlat
5. `blur-background` - Arka plan bulanıklaştır

### Sosyal Medya İçerikleri
1. `crop-smart` - 1:1 veya 16:9 kırp
2. `color-pop` - Renk vurgula
3. `text-add` - Başlık ekle
4. `vignette` - Vinyet efekti
5. `vintage-effect` - Vintage görünüm

---

**✨ 50+ profesyonel fotoğraf işleme özelliği artık hazır!**
