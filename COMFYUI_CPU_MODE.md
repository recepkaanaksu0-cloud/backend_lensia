# 🖥️ GPU Olmadan ComfyUI Kullanımı (CPU Modu)

## ⚠️ GPU Hatası Aldıysanız

Eğer şu hatayı aldıysanız:
```
AssertionError: Torch not compiled with CUDA enabled
```

Bu normal! Sisteminizde NVIDIA GPU yok veya CUDA kurulu değil. ComfyUI CPU modunda çalışabilir.

---

## 🚀 CPU Modunda Başlatma

### Otomatik (Önerilen)

```bash
npm run comfyui:cpu
```

Bu komut ComfyUI'ı otomatik olarak CPU modunda başlatır.

### Manuel

```bash
cd comfyui
source venv/bin/activate
python3 main.py --listen 127.0.0.1 --port 8188 --cpu
```

---

## ⏱️ Performans Farkları

| İşlem | GPU | CPU |
|-------|-----|-----|
| Upscale | 10-30s | 2-5 dakika ⚠️ |
| Rötuş | 15-25s | 3-8 dakika ⚠️ |
| Arka Plan Kaldır | 5-10s | 30s-2 dakika |
| Obje Sil | 20-40s | 5-15 dakika ⚠️ |
| Arka Plan Değiştir | 25-45s | 8-20 dakika ⚠️ |
| Model Değiştir | 20-50s | 5-15 dakika ⚠️ |

**⚠️ Uyarı:** CPU modunda işlemler 10-20x daha yavaş olabilir!

---

## 💡 Öneriler

### 1. İşlem Sayısını Azaltın

Workflow'larda `steps` parametresini azaltın:

```typescript
// lib/post-process/workflows.ts
"steps": 10,  // Varsayılan: 20
```

### 2. Sadece Hızlı İşlemleri Kullanın

CPU'da hızlı çalışan işlemler:
- ✅ **Arka Plan Kaldır** (5-10 saniye)
- ⚠️ **Rötuş Yap** (3-5 dakika, kabul edilebilir)
- ❌ **Obje Sil** (10+ dakika, çok yavaş)

### 3. Low-VRAM Modu

Eğer RAM sınırlıysa:

```bash
python3 main.py --cpu --lowvram
```

### 4. Daha Küçük Modeller

SD XL yerine daha küçük modeller kullanın:
- Stable Diffusion 1.5 (2GB yerine 6.5GB)
- LCM models (hızlı inference)

---

## 🔧 Script Güncellemeleri

### Yeni NPM Komutu

```bash
# CPU modunda başlat
npm run comfyui:cpu
```

### Otomatik GPU Algılama

`npm run comfyui` artık otomatik olarak:
- ✅ GPU varsa normal modda başlar
- ✅ GPU yoksa CPU modunda başlar

---

## 🎯 Test CPU Modunda

```bash
# ComfyUI'ı CPU modunda başlat
npm run comfyui:cpu

# Yeni terminalde test et (hızlı işlem)
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "your-photo-id",
    "processType": "background-remove"
  }'
```

---

## 🖥️ GPU Nasıl Kurulur? (İleride)

Eğer NVIDIA GPU'nuz varsa:

### 1. CUDA Kurulumu

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nvidia-driver-535 nvidia-cuda-toolkit

# Kontrol
nvidia-smi
```

### 2. PyTorch CUDA Versiyonu

```bash
cd comfyui
source venv/bin/activate

# CUDA 11.8
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# veya CUDA 12.1
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 3. Yeniden Başlat

```bash
npm run comfyui  # Artık GPU modunda çalışacak
```

---

## 📊 RAM Gereksinimleri

| İşlem | Minimum RAM | Önerilen RAM |
|-------|-------------|--------------|
| Arka Plan Kaldır | 4GB | 8GB |
| Rötuş | 8GB | 16GB |
| Upscale | 8GB | 16GB |
| Obje Sil | 12GB | 24GB |
| Model Değiştir | 12GB | 24GB |

**Not:** SD XL modelleri özellikle RAM açlığı yapıyor!

---

## 🔍 Sorun Giderme

### "Out of Memory" Hatası

```bash
# Low-VRAM modunda başlat
cd comfyui
python3 main.py --cpu --lowvram
```

### Çok Yavaş

```typescript
// Workflow'larda steps'i azalt
// lib/post-process/workflows.ts

"steps": 8,        // Varsayılan: 20
"denoise": 0.3,    // Varsayılan: 0.7
```

### Process Timeout

```typescript
// lib/post-process/processor.ts

// maxWaitTime'ı artır
const maxWaitTime = 600000  // 10 dakika (varsayılan: 5)
```

---

## ✅ CPU Modunda Kullanım Önerisi

### ✅ Kullanılabilir

- **Arka Plan Kaldır:** Hızlı ve etkili
- **Basit Rötuşlar:** Kabul edilebilir süre

### ⚠️ Dikkatli Kullanın

- **Upscale:** Yavaş ama yapılabilir
- **Model Değiştir:** Çok beklemek gerekebilir

### ❌ Önerilmez

- **Obje Sil:** Çok yavaş (10+ dakika)
- **Arka Plan Değiştir:** Çok yavaş (15+ dakika)

---

## 🎯 Özet

CPU modunda ComfyUI kullanmak için:

```bash
# 1. CPU modunda başlat
npm run comfyui:cpu

# 2. Sadece hızlı işlemleri kullan
# - Arka Plan Kaldır ✅
# - Rötuş (basit) ⚠️

# 3. Workflow steps'i azalt
# lib/post-process/workflows.ts
```

**Önemli:** Production için GPU şiddetle önerilir! CPU modu sadece test/geliştirme içindir.

---

**Şimdi Deneyebilirsiniz:**

```bash
npm run comfyui:cpu
```

ComfyUI CPU modunda başlayacak! 🚀
