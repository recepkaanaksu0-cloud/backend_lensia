# ComfyUI Job Runner Dashboard

Lensia.ai için otomatik görüntü işleme dashboard'u

## 🚀 Hızlı Başlangıç

```bash
# 1. Kurulum
chmod +x start.sh && ./start.sh

# 2. Tarayıcıda aç
http://localhost:3000
```

📖 **Detaylı guide:** [QUICKSTART.md](QUICKSTART.md)

---

## 📋 Özellikler

- ✅ Gerçek zamanlı iş kuyruğu yönetimi
- ✅ ComfyUI entegrasyonu
- ✅ Otomatik durum takibi
- ✅ Cloudflare Tunnel desteği
- ✅ SQLite veritabanı
- ✅ Modern UI (Tailwind + Shadcn)

## 🛠️ Teknolojiler

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** SQLite (geliştirme), PostgreSQL (production)
- **UI:** Tailwind CSS, Shadcn/UI
- **AI:** ComfyUI API

## 📚 Dokümantasyon

- [Quick Start Guide](QUICKSTART.md) - 5 dakikada başla
- [README](README.md) - Detaylı dökümantasyon
- [INSTRUCTIONS](INSTRUCTIONS.md) - Geliştirme kuralları

## 🎯 Kullanım

### İş Ekleme
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful landscape",
    "inputImageUrl": "https://picsum.photos/512",
    "params": {}
  }'
```

### ComfyUI Workflow Özelleştirme
`lib/comfyui.ts` → `createWorkflow()` fonksiyonunu düzenle

## 🔧 Komutlar

```bash
npm run dev          # Development server
npm run db:studio    # Veritabanı UI
npm run tunnel       # Cloudflare Tunnel
npm run full-dev     # Tüm servisler
```

## 📄 Lisans

MIT

---

**Geliştirici:** Lensia AI Team  
**Versiyon:** 0.1.0
