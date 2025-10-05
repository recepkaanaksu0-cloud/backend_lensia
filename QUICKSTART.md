# ComfyUI Job Runner Dashboard - Quick Start Guide

## 🎯 5 Dakikada Başlangıç

### 1️⃣ Kurulum (İlk Kez)

```bash
# Projeye git
cd /home/mami/Desktop/backend_lensia

# Script'lere izin ver
chmod +x start.sh scripts/*.sh

# Hızlı kurulum
npm run setup
```

### 2️⃣ ComfyUI'ı Başlat

ComfyUI'ı ayrı bir terminalde çalıştırın:

```bash
cd /path/to/ComfyUI
python main.py
```

ComfyUI'ın http://127.0.0.1:8188 adresinde çalıştığından emin olun.

### 3️⃣ Dashboard'u Başlat

**Seçenek A - Tek Komut (Önerilen):**
```bash
./start.sh
```

**Seçenek B - Manuel:**
```bash
npm run dev
```

**Seçenek C - Tüm Servisler (Dashboard + Tunnel):**
```bash
npm run full-dev
```

### 4️⃣ Dashboard'a Eriş

Tarayıcıda aç: **http://localhost:3000**

---

## 🧪 Test İşi Ekle

Dashboard açıkken, yeni bir terminal açın:

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "negativePrompt": "ugly, blurry",
    "inputImageUrl": "https://picsum.photos/512",
    "params": {
      "steps": 20,
      "cfg": 7
    }
  }'
```

Dashboard'da yeni işi göreceksiniz. "İşle" butonuna tıklayın!

---

## 🌐 İnternete Açma (Opsiyonel)

### Quick Tunnel (Geçici URL):
```bash
npm run tunnel
```

### Named Tunnel (Kalıcı URL):
1. https://dash.cloudflare.com/ → Zero Trust → Tunnels
2. "Create a tunnel" → Token'ı kopyala
3. `.env.local` dosyasına ekle:
   ```
   CLOUDFLARE_TUNNEL_TOKEN="eyJh..."
   ```
4. Başlat:
   ```bash
   npm run tunnel
   ```

---

## 📊 Veritabanını Görüntüle

```bash
npm run db:studio
```

Tarayıcıda http://localhost:5555 açılacak.

---

## 🔧 Sorun Giderme

### ComfyUI bağlanamıyor
```bash
# ComfyUI'ın çalışıp çalışmadığını kontrol et
curl http://127.0.0.1:8188/system_stats
```

### Veritabanı hatası
```bash
# Veritabanını sıfırla
npx prisma migrate reset

# Yeniden oluştur
npx prisma migrate dev
```

### Port 3000 kullanımda
```bash
# Portu kullanan işlemi bul
lsof -i :3000

# İşlemi sonlandır
kill -9 <PID>
```

---

## 🎨 Komutlar Özeti

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Development server'ı başlat |
| `npm run build` | Production build |
| `npm run start` | Production server'ı başlat |
| `npm run db:generate` | Prisma client oluştur |
| `npm run db:migrate` | Yeni migration oluştur |
| `npm run db:studio` | Veritabanı arayüzünü aç |
| `npm run tunnel` | Cloudflare Tunnel başlat |
| `npm run full-dev` | Tüm servisleri başlat |
| `./start.sh` | Otomatik kurulum ve başlatma |

---

## 📁 Önemli Dosyalar

- `app/page.tsx` - Ana dashboard sayfası
- `app/_components/job-table.tsx` - İş tablosu bileşeni
- `lib/comfyui.ts` - ComfyUI entegrasyonu (buradan workflow düzenle)
- `prisma/schema.prisma` - Veritabanı şeması
- `.env.local` - Yapılandırma dosyası

---

## 🚀 Sonraki Adımlar

1. ✅ Dashboard'u test et
2. ✅ ComfyUI workflow'unu özelleştir (`lib/comfyui.ts`)
3. ✅ Gerçek işleri ekle ve test et
4. 📖 Detaylı dökümantasyon için `README.md` ve `INSTRUCTIONS.md` oku

---

**Başarılar! 🎉**

Sorular için: GitHub Issues veya `INSTRUCTIONS.md` dosyasına bakın.
