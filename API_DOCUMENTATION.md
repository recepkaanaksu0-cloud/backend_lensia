# Lensia.ai - ComfyUI Backend Dashboard

**API Endpoint:** `https://api.lensia.ai`  
**Port:** `51511` (Local)

Bu proje, Lensia.ai web sitesinden gelen görüntü işleme taleplerini otomatik olarak yönetir ve ComfyUI ile işleyerek sonuçları geri gönderir.

---

## 🎯 Sistem Mimarisi

```
┌─────────────────┐
│  www.lensia.ai  │  (Ana Site - Kullanıcı İstekleri)
└────────┬────────┘
         │ POST /api/jobs
         │ {prompt, image, params}
         ▼
┌─────────────────────────────┐
│  api.lensia.ai:51511        │  (Bu Proje - Dashboard)
│  Cloudflare Tunnel          │
└────────┬────────────────────┘
         │ 1. İsteği al, DB'ye kaydet
         │ 2. Operatör "İşle" butonuna basar
         │ 3. ComfyUI API'sine gönder
         ▼
┌─────────────────────────────┐
│  localhost:8188             │  (ComfyUI - Görüntü İşleme)
│  ComfyUI Local Server       │
└────────┬────────────────────┘
         │ Sonuç görüntü
         ▼
┌─────────────────────────────┐
│  Dashboard                   │  (Webhook Gönderimi)
│  POST webhook                │
└────────┬────────────────────┘
         │ {status, output_image_url}
         ▼
┌─────────────────┐
│  www.lensia.ai  │  (Webhook Handler)
└─────────────────┘
```

---

## 🚀 Hızlı Başlangıç

### 1. Cloudflare Tunnel'ı Başlat

```bash
sudo systemctl start cloudflared
# veya
npm run tunnel:start
```

**Kontrol:**
```bash
sudo systemctl status cloudflared
```

### 2. ComfyUI'ı Başlat

```bash
# Otomatik
npm run comfyui

# veya Manuel
cd /path/to/ComfyUI
python main.py
```

### 3. Dashboard'u Başlat

```bash
# Hızlı başlatma
./start.sh

# veya Manuel
npm run dev
```

**Erişim:**
- **Local:** http://localhost:51511
- **Public:** https://api.lensia.ai

---

## 📡 API Endpoints

### 1. İş Oluşturma (Lensia.ai'den gelir)

```http
POST https://api.lensia.ai/api/jobs
Content-Type: application/json
X-API-Key: your-api-key

{
  "job_id": "lensia_123",
  "prompt": "A beautiful sunset over mountains",
  "negative_prompt": "ugly, blurry",
  "input_image_url": "https://example.com/input.jpg",
  "webhook_url": "https://www.lensia.ai/api/jobs/webhook",
  "params": {
    "steps": 20,
    "cfg": 7
  }
}
```

**Response:**
```json
{
  "id": "clxxx...",
  "status": "pending",
  "lensiaJobId": "lensia_123",
  "createdAt": "2025-10-03T..."
}
```

### 2. İşleri Listele

```http
GET https://api.lensia.ai/api/jobs
```

### 3. İşi İşleme Al (Dashboard'dan manuel)

```http
POST https://api.lensia.ai/api/jobs/{id}/process
```

### 4. İş Durumu

```http
GET https://api.lensia.ai/api/jobs/{id}
```

---

## 🔄 İş Akışı Detayları

### 1. **İş Oluşturma** (Lensia.ai → Dashboard)

```javascript
// Lensia.ai backend'inden
fetch('https://api.lensia.ai/api/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.DASHBOARD_API_KEY
  },
  body: JSON.stringify({
    job_id: 'lensia_123',
    prompt: 'A beautiful landscape',
    input_image_url: 'https://...',
    webhook_url: 'https://www.lensia.ai/api/jobs/webhook'
  })
})
```

### 2. **İş İşleme** (Operatör → Dashboard → ComfyUI)

Dashboard'da operatör "İşle" butonuna basar:
- Job status → `processing`
- ComfyUI'a istek gönderilir
- Görüntü işlenir
- Job status → `completed`

### 3. **Webhook Gönderimi** (Dashboard → Lensia.ai)

```javascript
// Otomatik olarak gönderilir
POST https://www.lensia.ai/api/jobs/webhook
{
  "job_id": "lensia_123",
  "status": "completed",
  "output_image_url": "http://127.0.0.1:8188/view?filename=...",
  "processed_at": "2025-10-03T12:00:00Z"
}
```

---

## ⚙️ Yapılandırma

### .env.local

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=51511
NEXT_PUBLIC_API_URL="https://api.lensia.ai"

# ComfyUI
COMFYUI_API_URL="http://127.0.0.1:8188"

# Lensia.ai Integration
LENSIA_MAIN_SITE_URL="https://www.lensia.ai"
LENSIA_WEBHOOK_URL="https://www.lensia.ai/api/jobs/webhook"
LENSIA_API_KEY="your-api-key-here"
```

### Cloudflare Tunnel (/etc/cloudflared/config.yml)

```yaml
tunnel: 397d4544-4334-4e5b-897b-6a6e350339e8
credentials-file: /etc/cloudflared/397d4544-4334-4e5b-897b-6a6e350339e8.json

ingress:
  - hostname: api.lensia.ai
    service: http://localhost:51511
  - service: http_status:404
```

---

## 🛠️ Yönetim Komutları

### Dashboard
```bash
npm run dev              # Development (port 51511)
npm run build            # Production build
npm run start            # Production start
```

### ComfyUI
```bash
npm run comfyui          # ComfyUI'ı başlat
```

### Cloudflare Tunnel
```bash
npm run tunnel:start     # Tunnel'ı başlat
npm run tunnel:stop      # Tunnel'ı durdur
npm run tunnel:status    # Tunnel durumu
sudo journalctl -u cloudflared -f  # Loglar
```

### Veritabanı
```bash
npm run db:studio        # Prisma Studio (GUI)
npm run db:migrate       # Migration
npm run db:generate      # Prisma Client
```

---

## 🧪 Test

### Manuel İş Ekleme

```bash
curl -X POST https://api.lensia.ai/api/jobs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "job_id": "test_001",
    "prompt": "A beautiful sunset",
    "input_image_url": "https://picsum.photos/512",
    "webhook_url": "https://webhook.site/your-unique-url",
    "params": {}
  }'
```

### Webhook Test

Webhook'ları test etmek için: https://webhook.site

---

## 📊 Veritabanı Şeması

```prisma
model Job {
  id              String    @id @default(cuid())
  status          String    @default("pending")
  prompt          String
  negativePrompt  String?
  inputImageUrl   String
  outputImageUrl  String?
  paramsJson      String
  errorMessage    String?
  
  // Lensia.ai integration
  lensiaJobId     String?   @unique
  webhookUrl      String?
  webhookSent     Boolean   @default(false)
  webhookSentAt   DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Durum Değerleri:**
- `pending` - İş oluşturuldu, işlenmeyi bekliyor
- `processing` - ComfyUI'da işleniyor
- `completed` - İşlem tamamlandı
- `sent` - Webhook gönderildi
- `error` - Hata oluştu

---

## 🔐 Güvenlik

### API Key Doğrulama

Dashboard, gelen isteklerdeki `X-API-Key` header'ını kontrol eder:

```typescript
const apiKey = request.headers.get('x-api-key')
const isAuthorized = apiKey === process.env.LENSIA_API_KEY
```

### CORS

Next.js otomatik olarak CORS'u yönetir. Gerekirse `next.config.ts`'de özelleştirilebilir.

---

## 🐛 Sorun Giderme

### Cloudflare Tunnel çalışmıyor

```bash
# Durumu kontrol et
sudo systemctl status cloudflared

# Restart
sudo systemctl restart cloudflared

# Loglar
sudo journalctl -u cloudflared -f
```

### ComfyUI bağlanamıyor

```bash
# ComfyUI çalışıyor mu?
curl http://127.0.0.1:8188/system_stats

# ComfyUI'ı restart et
cd /path/to/ComfyUI
python main.py
```

### Port 51511 kullanımda

```bash
# Portu kullanan işlemi bul
lsof -i :51511

# İşlemi sonlandır
kill -9 <PID>
```

### Webhook gönderilmiyor

- `LENSIA_WEBHOOK_URL` doğru mu?
- `LENSIA_API_KEY` ayarlandı mı?
- Hedef site webhook'ları kabul ediyor mu?
- Logları kontrol et: `tail -f logs/dashboard.log`

---

## 📁 Proje Yapısı

```
backend_lensia/
├── app/
│   ├── _components/
│   │   └── job-table.tsx       # İş tablosu
│   ├── api/
│   │   └── jobs/
│   │       ├── route.ts        # POST, GET /api/jobs
│   │       └── [id]/
│   │           ├── route.ts    # GET, DELETE
│   │           └── process/
│   │               └── route.ts # POST işleme
│   └── page.tsx                # Dashboard
├── lib/
│   ├── prisma.ts               # Prisma client
│   ├── comfyui.ts              # ComfyUI API
│   └── webhook.ts              # Webhook helper
├── prisma/
│   ├── schema.prisma           # DB şeması
│   └── migrations/             # Migrations
├── scripts/
│   ├── start-comfyui.sh        # ComfyUI başlatıcı
│   ├── tunnel.sh               # Tunnel yönetici
│   └── dev.sh                  # Full dev
└── .env.local                  # Yapılandırma
```

---

## 🔄 ComfyUI Workflow Özelleştirme

`lib/comfyui.ts` dosyasındaki `createWorkflow()` fonksiyonunu düzenleyin:

1. ComfyUI'da workflow'unuzu oluşturun
2. "Save (API Format)" ile JSON export edin
3. `createWorkflow()` fonksiyonuna yapıştırın
4. Parametreleri dinamik yapın

```typescript
function createWorkflow(params: any) {
  return {
    "3": {
      "inputs": {
        "seed": params.seed || Math.random() * 1000000,
        "steps": params.steps || 20,
        "cfg": params.cfg || 7,
        // ...
      }
    }
  }
}
```

---

## 📞 Destek

- **Dokümantasyon:** README.md, QUICKSTART.md
- **API Referans:** Bu dosya
- **Sorunlar:** GitHub Issues

---

**Proje Durumu:** ✅ Production Ready  
**Son Güncelleme:** 3 Ekim 2025
