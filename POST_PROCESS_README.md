# 🎨 Fotoğraf Post-Process Sistemi

Lensia.ai backend'ine entegre edilmiş, ComfyUI tabanlı profesyonel fotoğraf işleme sistemi.

## ✨ Özellikler

### 6 Farklı Post-Process İşlemi

| İşlem | Açıklama | Kullanım Alanı |
|-------|----------|----------------|
| 🗑️ **Obje Sil** | İstenmeyen objeleri akıllıca kaldırır | Arka plandaki gereksiz öğeleri temizleme |
| 🖼️ **Arka Plan Değiştir** | Profesyonel stüdyo arka planları | Ürün fotoğrafları, portreler |
| ❌ **Arka Plan Kaldır** | Tamamen şeffaf PNG oluşturur | Logo, sticker, katalog görselleri |
| 👥 **Model Değiştir** | Farklı AI modelleri ile yeniden üret | Stil değişiklikleri, farklı varyantlar |
| ✨ **Rötuş Yap** | Gürültü azaltma, keskinlik artırma | Kalite iyileştirme, profesyonelleştirme |
| 🔍 **Upscale** | 2x-4x çözünürlük artırma | Baskı, yüksek çözünürlük gereksinimleri |

## 🚀 Hızlı Başlangıç

### 1️⃣ ComfyUI Kurulumu

```bash
# Tek komutla kur
npm run comfyui:install

# Model indir (SD XL Base - zorunlu)
wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors \
  -P ./comfyui/models/checkpoints/
```

### 2️⃣ Başlatma

```bash
# Terminal 1: ComfyUI
npm run comfyui

# Terminal 2: Backend
npm run dev
```

### 3️⃣ Kullanım

```typescript
import { PhotoActions } from '@/components/post-process/photo-actions'

<PhotoActions
  photoId={photo.id}
  photoUrl={photo.photoUrl}
  onProcessComplete={(outputUrl) => {
    console.log('İşlem tamamlandı:', outputUrl)
  }}
/>
```

## 📡 API Kullanımı

### Durum Kontrolü

```bash
curl http://localhost:51511/api/comfyui/status
```

### Post-Process Başlatma

```bash
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "clx123...",
    "processType": "upscale"
  }'
```

### Sonuçları Listeleme

```bash
curl http://localhost:51511/api/post-process?photoId=clx123...
```

## 🏗️ Mimari

```
Frontend (React)
    ↓ POST /api/post-process
Backend (Next.js API)
    ↓ processWithComfyUI()
ComfyUI Server (127.0.0.1:8188)
    ↓ Workflow Execution
AI Models (Stable Diffusion, etc.)
    ↓ Generated Images
Backend (Image URL)
    ↓ Response
Frontend (Display Result)
```

## 📂 Dosya Yapısı

```
├── scripts/
│   ├── install-comfyui.sh      # 🔧 Otomatik kurulum
│   ├── start-comfyui.sh        # ▶️  Başlatma
│   └── test-postprocess.sh     # 🧪 Test
│
├── lib/post-process/
│   ├── workflows.ts            # 📝 ComfyUI workflow tanımları
│   └── processor.ts            # ⚙️  İşlem mantığı
│
├── app/api/
│   ├── post-process/route.ts   # 🌐 POST/GET endpoint
│   └── comfyui/status/route.ts # 📊 Durum API
│
├── components/post-process/
│   ├── photo-actions.tsx       # 🎨 İşlem butonları
│   └── comfyui-status.tsx      # 🟢 Durum göstergesi
│
└── comfyui/                    # 🎯 ComfyUI kurulumu
    └── models/
        ├── checkpoints/        # AI modelleri
        └── upscale_models/     # Upscale modelleri
```

## 🎯 Workflow Detayları

### Upscale İşlemi

```typescript
1. LoadImage        → Orijinal görüntüyü yükle
2. UpscaleModelLoader → RealESRGAN modelini yükle
3. ImageUpscaleWithModel → 4x upscale uygula
4. SaveImage        → Sonucu kaydet
```

### Rötuş İşlemi

```typescript
1. LoadImage        → Orijinal görüntüyü yükle
2. CheckpointLoader → SD XL modelini yükle
3. CLIPTextEncode   → "masterpiece, sharp, detailed"
4. KSampler         → Denoise: 0.4, Steps: 20
5. VAEDecode        → Latent'i görüntüye çevir
6. SaveImage        → İyileştirilmiş görüntüyü kaydet
```

## ⚡ Performans

| İşlem | Süre | Gereksinim |
|-------|------|------------|
| Upscale | 10-30s | GPU: 4GB+, CPU: Yavaş |
| Rötuş | 15-25s | GPU: 6GB+, CPU: Çok yavaş |
| Arka Plan Kaldır | 5-10s | CPU: Yeterli |
| Obje Sil | 20-40s | GPU: 6GB+, CPU: Çok yavaş |

**Not:** GPU kullanımı önemle önerilir. CPU'da çalıştırmak için:
```bash
cd comfyui
python main.py --cpu
```

## 🔧 Özelleştirme

### Yeni İşlem Tipi Ekleme

1. **Type tanımla** (`lib/post-process/workflows.ts`):
```typescript
export type PostProcessType = 
  | 'existing-types...'
  | 'my-custom-process'
```

2. **Workflow oluştur**:
```typescript
export function createMyCustomWorkflow(params: WorkflowParams) {
  return {
    // ComfyUI workflow JSON
  }
}
```

3. **Switch case'e ekle**:
```typescript
case 'my-custom-process':
  return createMyCustomWorkflow(params)
```

4. **Frontend'e buton ekle** (`components/post-process/photo-actions.tsx`):
```typescript
{
  type: 'my-custom-process',
  label: 'Özel İşlem',
  icon: <Icon />,
  color: 'bg-pink-500',
  description: 'Açıklama'
}
```

## 🧪 Test

```bash
# Tüm işlemleri test et
npm run postprocess:test

# Manuel test
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{"photoId": "xxx", "processType": "noise-fix"}'
```

## 🐛 Sorun Giderme

### ComfyUI bağlanamıyor

```bash
# Durumu kontrol et
curl http://127.0.0.1:8188/system_stats

# Logları görüntüle
cd comfyui && tail -f logs/comfyui.log

# Yeniden başlat
pkill -f "python main.py"
npm run comfyui
```

### Model bulunamadı

```
Error: checkpoint not found: sd_xl_base_1.0.safetensors
```

**Çözüm:**
```bash
# Model dosyasını kontrol et
ls -lh ./comfyui/models/checkpoints/

# Eksikse indir
wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors \
  -P ./comfyui/models/checkpoints/
```

### İşlem çok yavaş

1. **GPU kullan** (CPU çok yavaş)
2. **Steps azalt**: workflows.ts'de `steps: 20` → `steps: 15`
3. **Resolution düşür**: Büyük görüntüleri önce küçült

## 📊 Database Schema

```sql
CREATE TABLE Refinement (
  id              TEXT PRIMARY KEY,
  photoId         TEXT NOT NULL,
  refinementType  TEXT NOT NULL,  -- 'upscale', 'noise-fix', etc.
  status          TEXT DEFAULT 'pending',
  inputImageUrl   TEXT NOT NULL,
  outputImageUrl  TEXT,
  parameters      TEXT,           -- JSON
  metadata        TEXT,           -- JSON
  comfyuiJobId    TEXT,
  errorMessage    TEXT,
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Güvenlik

- ✅ ComfyUI sadece localhost'ta dinler
- ✅ File upload boyut limitleri
- ⚠️ Rate limiting eklenecek
- ⚠️ Kullanıcı yetkilendirmesi eklenecek

## 📚 Kaynaklar

- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [Stable Diffusion Models](https://huggingface.co/models?pipeline_tag=text-to-image)
- [RealESRGAN](https://github.com/xinntao/Real-ESRGAN)
- [API Dokümantasyonu](./docs/POST_PROCESS_API.md)
- [Hızlı Başlangıç](./POST_PROCESS_QUICKSTART.md)

## 📝 Yapılacaklar

- [ ] Webhook desteği (uzun işlemler için)
- [ ] Batch processing (toplu işlem)
- [ ] Custom model yönetimi UI
- [ ] İşlem kuyruğu sistemi
- [ ] S3/R2 entegrasyonu
- [ ] Rate limiting middleware
- [ ] Kullanıcı yetkilendirmesi
- [ ] Progress tracking (gerçek zamanlı ilerleme)
- [ ] ComfyUI otomatik başlatma
- [ ] Docker containerization

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

---

**Hazırlayan:** Lensia.ai Backend Team  
**Versiyon:** 1.0.0  
**Son Güncelleme:** 7 Ekim 2025
