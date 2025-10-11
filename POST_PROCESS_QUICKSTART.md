# Post-Process Sistem - Hızlı Başlangıç

## 🚀 Kurulum (İlk Kez)

### 1. ComfyUI'ı Kurun

```bash
npm run comfyui:install
```

Bu komut:
- ✅ ComfyUI'ı `./comfyui` dizinine kurar
- ✅ Python virtual environment oluşturur
- ✅ Tüm gereksinimleri yükler
- ✅ Custom node'ları ekler

**Süre:** ~5-10 dakika (internet hızınıza bağlı)

### 2. Model Dosyalarını İndirin

ComfyUI'ın çalışması için en az bir model gereklidir:

```bash
# Temel model (zorunlu)
wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors \
  -P ./comfyui/models/checkpoints/

# Upscale modeli (upscale işlemi için)
wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth \
  -P ./comfyui/models/upscale_models/
```

**Not:** Model dosyaları büyüktür (~6-7 GB), indirme 10-30 dakika sürebilir.

## 🎯 Kullanım

### Adım 1: ComfyUI'ı Başlatın

```bash
npm run comfyui
```

**Çıktı:**
```
✅ ComfyUI başlatıldı!
   URL: http://127.0.0.1:8188
```

ComfyUI web arayüzü: http://127.0.0.1:8188

### Adım 2: Backend'i Başlatın

```bash
npm run dev
# veya
./start.sh
```

Dashboard: http://localhost:51511

### Adım 3: Post-Process Kullanın

Frontend'te bir fotoğraf seçtikten sonra, post-process butonlarından birini tıklayın:

- 🗑️ **Obje Sil** - İstenmeyen objeleri kaldırır
- 🖼️ **Arka Plan Değiştir** - Farklı bir arka plan seçer
- ❌ **Arka Plan Kaldır** - Arka planı tamamen şeffaf yapar
- 👥 **Model Değiştir** - Farklı bir AI modeli kullanır
- ✨ **Rötuş Yap** - Kaliteyi iyileştirir, gürültüyü azaltır
- 🔍 **Upscale** - Çözünürlüğü 2x veya 4x artırır

## 🧪 Test

```bash
# Tüm post-process işlemlerini test et
npm run postprocess:test
```

## 📚 Detaylı Dokümantasyon

- **API Dokümantasyonu:** [docs/POST_PROCESS_API.md](./docs/POST_PROCESS_API.md)
- **Workflow Özelleştirme:** [lib/post-process/workflows.ts](./lib/post-process/workflows.ts)
- **Processor Kodu:** [lib/post-process/processor.ts](./lib/post-process/processor.ts)

## 🐛 Sorun Giderme

### ComfyUI çalışmıyor

```bash
# Durumu kontrol et
curl http://127.0.0.1:8188/system_stats

# Yeniden başlat
pkill -f "python main.py"
npm run comfyui
```

### Model bulunamadı hatası

```
Error: checkpoint not found: sd_xl_base_1.0.safetensors
```

**Çözüm:**
1. Model dosyasının doğru dizinde olduğunu kontrol edin:
   ```bash
   ls -lh ./comfyui/models/checkpoints/
   ```
2. Eksikse yukarıdaki wget komutunu kullanın

### Port 8188 kullanımda hatası

```bash
# Eski process'i öldür
lsof -ti:8188 | xargs kill -9

# Yeniden başlat
npm run comfyui
```

## 📁 Proje Yapısı

```
backend_lensia/
├── comfyui/                          # ComfyUI kurulumu
│   ├── models/
│   │   ├── checkpoints/              # AI modelleri buraya
│   │   └── upscale_models/           # Upscale modelleri buraya
│   └── ...
├── lib/
│   └── post-process/
│       ├── workflows.ts              # ComfyUI workflow tanımları
│       └── processor.ts              # İşlem mantığı
├── app/
│   └── api/
│       ├── post-process/
│       │   └── route.ts             # POST/GET endpoint
│       └── comfyui/
│           └── status/
│               └── route.ts         # Durum kontrolü
├── components/
│   └── post-process/
│       ├── photo-actions.tsx        # Frontend butonlar
│       └── comfyui-status.tsx       # Durum göstergesi
└── scripts/
    ├── install-comfyui.sh           # Kurulum script'i
    ├── start-comfyui.sh             # Başlatma script'i
    └── test-postprocess.sh          # Test script'i
```

## 🔧 Gelişmiş Ayarlar

### Farklı Port Kullanma

```bash
# ComfyUI'ı farklı portta başlat
cd comfyui
source venv/bin/activate
python main.py --listen 127.0.0.1 --port 8189

# .env.local'ı güncelle
COMFYUI_API_URL="http://127.0.0.1:8189"
```

### Custom Workflow Ekleme

1. `lib/post-process/workflows.ts` dosyasını aç
2. Yeni bir workflow fonksiyonu oluştur
3. `PostProcessType` enum'ına ekle
4. `getWorkflowForProcessType` switch case'ine ekle

### Performans Optimizasyonu

- **CPU:** `--cpu` flag'i ekle (GPU yoksa)
- **RAM:** `--lowvram` veya `--normalvram` kullan
- **Hız:** Steps sayısını azalt (20→15)

## 📞 Destek

- **GitHub Issues:** Hata bildirimleri için
- **Dokümantasyon:** `docs/POST_PROCESS_API.md`
- **ComfyUI Dokümantasyonu:** https://github.com/comfyanonymous/ComfyUI

## ✅ Kontrol Listesi

Sistem çalışıyor mu kontrol edin:

- [ ] Python 3.8+ kurulu
- [ ] ComfyUI kurulumu tamamlandı (`./comfyui` dizini var)
- [ ] Model dosyaları indirildi (en az SD XL Base)
- [ ] ComfyUI çalışıyor (http://127.0.0.1:8188 açılıyor)
- [ ] Backend çalışıyor (http://localhost:51511 açılıyor)
- [ ] ComfyUI durumu "online" görünüyor
- [ ] Test komutu başarılı (`npm run postprocess:test`)

Hepsi ✅ ise sistem hazır! 🎉
