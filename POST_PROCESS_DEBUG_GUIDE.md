# 🔍 Post-Process Debug Kılavuzu

## ✅ Durum Tespiti

Test sonuçlarına göre:

1. **ComfyUI Çalışıyor** ✅
   - Port: 8188
   - Status: Online
   - GPU: NVIDIA GeForce RTX 4070 Laptop GPU
   
2. **API Endpoint'ler Çalışıyor** ✅
   - `POST /api/post-process` ✅
   - `POST /api/uretim/{photoId}/{processType}` ✅
   
3. **Workflow Pipeline'ları Çalışıyor** ✅
   - Background Change workflow başarıyla çalıştı
   - Output görüntüleri oluşturuldu
   - History'de başarılı executions görülüyor

## 📊 Test Sonuçları

```bash
# Test 1: background-change işlemi
✅ Success: true
✅ Output: background_change_00002_.png
✅ Refinement ID oluşturuldu
✅ Process Info döndü

# ComfyUI History
✅ Prompt ID: 8a229211-6e54-4be0-9d38-5af411b3ab92
✅ Status: success
✅ Completed: true
```

## 🔍 Kullanıcının Gördüğü Log Mesajları

Kullanıcının paylaştığı log:

```
📥 [API Route] Received request: {
  photoId: 'cmglblxon00994af82utqjjax',
  processType: 'background-change',
  params: {}
}
🔄 Forwarding to backend: http://localhost:51511/api/uretim/...
📡 Backend response status: 200
✅ Backend response: { success: true, ... }
```

**Bu log mesajları kodda YOK!** 

### Olası Sebepler:

1. **Browser Developer Console'dan geliyor olabilir** (Frontend komponent log'ları)
2. **Eski bir middleware/proxy dosyası var olabilir**
3. **Test script'i veya başka bir tool kullanılıyor olabilir**
4. **Browser extension veya proxy aracı log ekliyor olabilir**

## ✅ Eklenen Debug Log'ları

### 1. API Route (`/app/api/post-process/route.ts`)

```typescript
console.log('📥 [POST /api/post-process] Request:', { photoId, processType, params })
console.log('✅ [POST /api/post-process] Result:', { ... })
```

### 2. Processor (`/lib/post-process/processor.ts`)

```typescript
console.log('🔧 [Processor] Starting post-process:', request)
console.log('📷 [Processor] Photo found:', { id, url })
console.log('🎨 [Processor] Sending to ComfyUI...')
console.log('🎨 [Processor] ComfyUI result:', { ... })
```

### 3. ComfyUI Integration

```typescript
console.log('🖼️ [ComfyUI] Processing image:', { ... })
console.log('⬇️ [ComfyUI] Image downloaded, size:', ...)
console.log('⬆️ [ComfyUI] Image uploaded:', uploadedImageName)
console.log('🚀 [ComfyUI] Sending workflow:', { ... })
console.log('✨ [ComfyUI] Workflow submitted, promptId:', ...)
console.log('⏳ [ComfyUI] Waiting for completion...')
console.log('✅ [ComfyUI] Workflow completed:', result)
```

### 4. Frontend Component (`/components/post-process/photo-actions.tsx`)

```typescript
console.log('📤 [Frontend] Starting post-process:', { photoId, processType })
console.log('📤 [Frontend] Request body:', requestBody)
console.log('📥 [Frontend] Response status:', response.status)
console.log('📥 [Frontend] Response data:', data)
console.log('✅ [Frontend] Process completed successfully!')
// veya
console.error('❌ [Frontend] Process failed:', data.error)
```

## 🎯 ComfyUI Pipeline Akışı

İşlem akışı şu şekilde çalışıyor:

```
1. Frontend Component
   ↓ POST /api/post-process
   
2. API Route Handler
   ↓ Validasyon
   ↓ Photo lookup
   ↓ ComfyUI status check
   ↓ startPostProcess()
   
3. Processor
   ↓ Create Refinement record
   ↓ processWithComfyUI()
   
4. ComfyUI Integration
   ↓ Download image
   ↓ Upload to ComfyUI
   ↓ Create workflow (getWorkflowForProcessType)
   ↓ Submit prompt to ComfyUI
   ↓ Wait for completion
   ↓ Get output image URL
   
5. Response
   ↓ Update Refinement record
   ↓ Return success + outputImageUrl
   
6. Frontend
   ↓ Display result
   ✅ Show processed image
```

## 🧪 Test Komutları

### Manuel Test

```bash
# Fotoğraf ID'sini al
PHOTO_ID=$(curl -s http://localhost:51511/api/generate | jq -r '.requests[0].generatedPhotos[0].id')

# Test 1: /api/post-process
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d "{
    \"photoId\": \"$PHOTO_ID\",
    \"processType\": \"background-change\",
    \"params\": {}
  }" | jq '.'

# Test 2: /api/uretim endpoint
curl -X POST "http://localhost:51511/api/uretim/$PHOTO_ID/background-change" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
```

### ComfyUI Durumu

```bash
# System stats
curl -s http://127.0.0.1:8188/system_stats | jq '.'

# History (son işlemler)
curl -s http://127.0.0.1:8188/history | jq 'to_entries | .[0:3]'

# Queue durumu
curl -s http://127.0.0.1:8188/queue | jq '.'
```

### Log Kontrolü

```bash
# Backend log'ları (real-time)
tail -f logs/backend.log | grep -E "📥|🔧|📷|🎨|🖼️|⬇️|⬆️|🚀|✨|⏳|✅|❌"

# ComfyUI log'ları
tail -f logs/comfyui.log
```

## 🎨 Workflow Tipleri

Şu anda desteklenen process type'lar:

```typescript
'object-delete'        // Obje silme (inpainting)
'background-change'    // Arka plan değiştirme ✅ TEST EDİLDİ
'background-remove'    // Arka plan kaldırma (transparent)
'background-color'     // Solid color arka plan
'model-change'         // AI model değiştirme
'noise-fix'            // Denoising
'upscale'              // Upscaling
'rotate'               // Rotation
'brightness-contrast'  // Brightness/Contrast
'sharpen'              // Sharpening
'blur-background'      // Background blur (bokeh)
'face-enhance'         // Face restoration
'skin-smooth'          // Skin smoothing
'teeth-whiten'         // Teeth whitening
```

## ⚠️ Bilinen Gereksinimler

### ComfyUI Model Gereksinimleri

Bazı workflow'lar özel node'lar veya modeller gerektirebilir:

1. **background-change, object-delete, model-change**
   - `sd_xl_base_1.0.safetensors` ✅ MEVCUT

2. **background-remove, blur-background**
   - Custom node: `RemoveBackground` veya `RemBG`
   - Kurulum gerekebilir

3. **face-enhance**
   - Custom node: `FaceRestore`
   - Model: `GFPGANv1.4`

4. **upscale**
   - Custom node: `ImageUpscaleWithModel`
   - Model: `RealESRGAN` veya benzeri

### Eksik Node Hatası Alırsanız

ComfyUI custom node'ları yüklenmemiş olabilir:

```bash
cd comfyui
python -m pip install -r custom_nodes/requirements.txt

# veya ComfyUI Manager kullanarak install edin
```

## 🔥 Sorun Giderme

### 1. Frontend'den istek gidiyor ama yanıt gelmiyor

**Kontrol:**
```javascript
// Browser console'da
// Network tab'ı açın
// XHR/Fetch filter'ı açın
// İsteğin response'unu inceleyin
```

**Çözüm:**
- CORS sorunlarını kontrol edin (middleware.ts)
- Timeout süresini artırın (işlemler 30-60s sürebilir)
- await/async düzgün kullanılıyor mu kontrol edin

### 2. ComfyUI pipeline başlamıyor

**Kontrol:**
```bash
# Workflow JSON'ı geçerli mi?
curl -X POST http://127.0.0.1:8188/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": {...}, "client_id": "test"}' \
  | jq '.'
```

**Çözüm:**
- Workflow node'ları mevcut mu kontrol edin
- Model dosyaları indirilmiş mi kontrol edin
- ComfyUI console log'ları kontrol edin

### 3. İşlem timeout oluyor

**Sebep:** GPU işlemleri CPU'da veya model cache'i yok

**Çözüm:**
```bash
# GPU kullanımını kontrol edin
nvidia-smi

# ComfyUI GPU kullanıyor mu?
curl -s http://127.0.0.1:8188/system_stats | jq '.devices'
```

## 📋 Checklist: İşlem Çalışıyor mu?

- [x] ComfyUI çalışıyor (port 8188)
- [x] API endpoint'ler çalışıyor
- [x] Workflow JSON oluşturuluyor
- [x] ComfyUI prompt kabul ediyor
- [x] İşlem tamamlanıyor
- [x] Output image oluşuyor
- [x] Refinement kaydı oluşuyor
- [ ] **Frontend sonucu gösteriyor** ← BURAYA ODAKLAN

## 🎯 Sonraki Adım

Kullanıcının görüşü:
> "Frontend'den istekler yolluyorum ama sanırım yanıtlanmıyor ve işlenmiyor"

**Gerçek Durum:**
- İstekler yanıtlanıyor ✅
- İşlemler yapılıyor ✅
- ComfyUI pipeline'ları çalışıyor ✅

**Olası Sorun:**
- Frontend result'ı handle etmiyor
- Timeout çok kısa
- State update olmuyor
- UI refresh olmuyor

**Test için:**
1. Browser Developer Console'u açın
2. Network tab'ında isteği inceleyin
3. Console'da yeni eklenen log'ları kontrol edin
4. Response'da `outputImageUrl` var mı bakın

---

**Tüm sistem çalışıyor! Frontend entegrasyonu kontrol edilmeli.** 🚀
