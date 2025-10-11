# Post-Process API Documentation

## Genel Bakış

Post-Process API, üretilmiş fotoğraflar üzerinde çeşitli işlemler yapmanızı sağlar. ComfyUI entegrasyonu ile çalışır.

## Kurulum

### 1. ComfyUI Kurulumu

```bash
# ComfyUI'ı proje içine kur
npm run comfyui:install

# Bu işlem:
# - ComfyUI'ı ./comfyui dizinine klonlar
# - Python virtual environment oluşturur
# - Gereksinimleri yükler
# - Önemli custom node'ları ekler
```

### 2. ComfyUI'ı Başlatma

```bash
# ComfyUI'ı başlat
npm run comfyui

# Alternatif: Manuel başlatma
cd comfyui
source venv/bin/activate
python main.py --listen 127.0.0.1 --port 8188
```

### 3. Model İndirme

ComfyUI çalışması için en az bir Stable Diffusion modeli gereklidir:

```bash
# Önerilen modeller:
# 1. SD XL Base: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0
# 2. RealESRGAN (upscale için): https://github.com/xinntao/Real-ESRGAN/releases

# İndirilen modelleri koyun:
# - Checkpoints: ./comfyui/models/checkpoints/
# - Upscale models: ./comfyui/models/upscale_models/
```

## API Endpoints

### 1. ComfyUI Durumu Kontrolü

**GET** `/api/comfyui/status`

ComfyUI sunucusunun çalışıp çalışmadığını kontrol eder.

**Response:**
```json
{
  "success": true,
  "comfyui": {
    "online": true,
    "version": "v0.0.1"
  }
}
```

### 2. Post-Process İşlemi Başlatma

**POST** `/api/post-process`

Bir fotoğraf üzerinde post-process işlemi başlatır.

**Request Body:**
```json
{
  "photoId": "clx123...",
  "processType": "upscale",
  "prompt": "optional custom prompt",
  "negativePrompt": "optional negative prompt",
  "additionalParams": {
    "seed": 12345,
    "modelName": "custom_model.safetensors"
  }
}
```

**Process Types:**
- `object-delete` - Obje Sil: Görüntüden istenmeyen objeleri kaldırır
- `background-change` - Arka Plan Değiştir: Farklı bir arka plan seçer
- `background-remove` - Arka Plan Kaldır: Arka planı tamamen kaldırır (PNG)
- `model-change` - Model Değiştir: Farklı bir model kullanır
- `noise-fix` - Rötuş Yap: Görüntü kalitesini iyileştirir
- `upscale` - Upscale: Görüntü çözünürlüğünü artırır

**Response:**
```json
{
  "success": true,
  "refinementId": "clx456...",
  "outputImageUrl": "http://127.0.0.1:8188/view?filename=...",
  "message": "İşlem başarıyla tamamlandı"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "ComfyUI sunucusu çevrimdışı. Lütfen ComfyUI'ı başlatın.",
  "details": "ECONNREFUSED"
}
```

### 3. Refinement Detayları

**GET** `/api/post-process?refinementId={id}`

Belirli bir refinement'ın detaylarını getirir.

**Response:**
```json
{
  "success": true,
  "refinement": {
    "id": "clx456...",
    "photoId": "clx123...",
    "refinementType": "upscale",
    "status": "completed",
    "inputImageUrl": "...",
    "outputImageUrl": "...",
    "parameters": "{...}",
    "createdAt": "2025-10-07T...",
    "updatedAt": "2025-10-07T..."
  }
}
```

### 4. Fotoğrafın Tüm Refinement'ları

**GET** `/api/post-process?photoId={id}`

Bir fotoğrafın tüm post-process işlemlerini listeler.

**Response:**
```json
{
  "success": true,
  "refinements": [
    {
      "id": "clx456...",
      "refinementType": "upscale",
      "status": "completed",
      "outputImageUrl": "...",
      "createdAt": "2025-10-07T..."
    },
    {
      "id": "clx789...",
      "refinementType": "noise-fix",
      "status": "processing",
      "createdAt": "2025-10-07T..."
    }
  ],
  "count": 2
}
```

## Frontend Kullanımı

### React Component Örneği

```tsx
import { PhotoActions } from '@/components/post-process/photo-actions'
import { ComfyUIStatus } from '@/components/post-process/comfyui-status'

export default function PhotoDetail({ photo }: { photo: GeneratedPhoto }) {
  const handleProcessComplete = (outputUrl: string) => {
    console.log('İşlem tamamlandı:', outputUrl)
    // Fotoğrafı güncelle veya yeni sekme aç
  }

  return (
    <div>
      <ComfyUIStatus />
      
      <img src={photo.photoUrl} alt="Fotoğraf" />
      
      <PhotoActions
        photoId={photo.id}
        photoUrl={photo.photoUrl}
        onProcessComplete={handleProcessComplete}
      />
    </div>
  )
}
```

## Workflow Özelleştirme

Her işlem tipi için workflow'lar `lib/post-process/workflows.ts` dosyasında tanımlanmıştır.

### Örnek: Custom Workflow Ekleme

```typescript
// lib/post-process/workflows.ts

export function createCustomWorkflow(params: WorkflowParams) {
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    // ... diğer node'lar
  }
}

// getWorkflowForProcessType fonksiyonuna ekle:
case 'custom-process':
  return createCustomWorkflow(params)
```

## Test

### API Test Script'i

```bash
# Tüm post-process işlemlerini test et
npm run postprocess:test

# Manuel test
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "clx123...",
    "processType": "upscale"
  }'
```

## Hata Ayıklama

### ComfyUI Bağlantı Hatası

```bash
# ComfyUI durumunu kontrol et
curl http://127.0.0.1:8188/system_stats

# ComfyUI'ı yeniden başlat
pkill -f "python main.py"
npm run comfyui
```

### Model Bulunamadı Hatası

```
Error: checkpoint not found: sd_xl_base_1.0.safetensors
```

**Çözüm:**
1. Model dosyasını indirin
2. `./comfyui/models/checkpoints/` dizinine koyun
3. Workflow'da doğru model adını kullanın

### İşlem Zaman Aşımı

```
Error: İşlem zaman aşımına uğradı
```

**Çözüm:**
1. ComfyUI loglarını kontrol edin
2. `maxWaitTime` parametresini artırın
3. Daha basit bir workflow kullanın

## Performans

- **Upscale**: ~10-30 saniye (boyuta bağlı)
- **Noise Fix**: ~15-25 saniye
- **Background Remove**: ~5-10 saniye
- **Object Delete**: ~20-40 saniye
- **Background Change**: ~25-45 saniye
- **Model Change**: ~20-50 saniye

## Güvenlik

- ComfyUI sadece localhost'ta dinler (`127.0.0.1:8188`)
- API endpoint'leri rate limiting kullanmalıdır
- Kullanıcı yetkilendirmesi eklenmelidir
- Dosya yükleme boyut limitleri uygulanmalıdır

## Yapılacaklar

- [ ] Rate limiting ekle
- [ ] Kullanıcı yetkilendirmesi
- [ ] Webhook desteği (uzun işlemler için)
- [ ] Batch processing
- [ ] Custom model yönetimi
- [ ] İşlem kuyruğu sistemi
- [ ] S3/Cloudflare R2 entegrasyonu (çıktı dosyaları için)
