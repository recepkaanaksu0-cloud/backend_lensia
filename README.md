# ComfyUI Job Runner Dashboard

## 📋 Proje Hakkında

Bu proje, `lensia.ai` web sitesinden gelen görüntü düzenleme taleplerini otomatik olarak yönetmek ve işlemek için geliştirilmiş bir dashboard uygulamasıdır. Yerel ComfyUI sunucusuyla entegre çalışarak, iş kuyruğunu verimli bir şekilde yönetmenizi sağlar.

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- ComfyUI (http://127.0.0.1:8188 adresinde çalışıyor olmalı)
- (Opsiyonel) Cloudflare Tunnel için cloudflared

### Kurulum

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Veritabanını hazırlayın:**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. **Ortam değişkenlerini ayarlayın:**
`.env.local` dosyası otomatik oluşturulacaktır, ancak gerekirse düzenleyebilirsiniz.

4. **Uygulamayı başlatın:**
```bash
chmod +x start.sh
./start.sh
```

Veya manuel olarak:
```bash
npm run dev
```

## 🛠️ Otomasyon Scriptleri

### start.sh - Tek Komutla Başlatma
Tüm gereksinimleri kontrol eder ve uygulamayı başlatır:
```bash
./start.sh
```

### scripts/tunnel.sh - Cloudflare Tunnel
Dashboard'u internete açmak için:
```bash
chmod +x scripts/tunnel.sh
./scripts/tunnel.sh
```

### scripts/dev.sh - Full Stack Development
Tüm servisleri paralel olarak başlatır:
```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

## 📁 Proje Yapısı

```
comfyui-dashboard/
├── app/
│   ├── _components/
│   │   └── job-table.tsx        # Ana iş tablosu bileşeni
│   ├── api/
│   │   └── jobs/
│   │       ├── route.ts         # GET, POST /api/jobs
│   │       └── [id]/
│   │           ├── route.ts     # GET, DELETE /api/jobs/:id
│   │           └── process/
│   │               └── route.ts # POST /api/jobs/:id/process
│   └── page.tsx                 # Ana dashboard sayfası
├── lib/
│   ├── prisma.ts                # Prisma client
│   └── comfyui.ts               # ComfyUI API entegrasyonu
├── prisma/
│   ├── schema.prisma            # Veritabanı şeması
│   └── dev.db                   # SQLite database
├── scripts/
│   ├── tunnel.sh                # Cloudflare Tunnel başlatıcı
│   └── dev.sh                   # Full stack başlatıcı
└── start.sh                     # Ana başlatma scripti
```

## 🔧 API Endpoints

### GET /api/jobs
Tüm işleri getirir.

**Yanıt:**
```json
[
  {
    "id": "clxxx...",
    "status": "pending",
    "prompt": "A beautiful landscape",
    "negativePrompt": "ugly, blurry",
    "inputImageUrl": "https://...",
    "outputImageUrl": null,
    "paramsJson": "{}",
    "createdAt": "2025-10-03T...",
    "updatedAt": "2025-10-03T..."
  }
]
```

### POST /api/jobs
Yeni iş oluşturur.

**İstek Body:**
```json
{
  "prompt": "A beautiful landscape",
  "negativePrompt": "ugly, blurry",
  "inputImageUrl": "https://example.com/image.jpg",
  "params": {
    "steps": 20,
    "cfg": 7
  }
}
```

### POST /api/jobs/:id/process
İşi ComfyUI'a gönderir ve işlemeye başlar.

### DELETE /api/jobs/:id
İşi siler.

## 🎨 Özellikler

- ✅ Gerçek zamanlı iş durumu takibi (SWR ile otomatik yenileme)
- ✅ Tek tıkla iş işleme
- ✅ Detaylı iş görüntüleme (prompt, parametreler, görüntüler)
- ✅ Hata yönetimi ve görüntüleme
- ✅ Otomatik veritabanı yönetimi
- ✅ ComfyUI API entegrasyonu
- ✅ Cloudflare Tunnel desteği
- ✅ Responsive tasarım (Tailwind CSS + Shadcn/UI)

## 🔐 Cloudflare Tunnel Kurulumu

1. **Cloudflared yükleyin:**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

2. **Tunnel oluşturun:**
- https://dash.cloudflare.com/ adresine gidin
- Zero Trust > Access > Tunnels > Create a tunnel
- Token'ı kopyalayın

3. **Token'ı .env.local'e ekleyin:**
```env
CLOUDFLARE_TUNNEL_TOKEN="your-token-here"
```

4. **Tunnel'ı başlatın:**
```bash
./scripts/tunnel.sh
```

## 🧪 Test İşi Ekleme

Dashboard üzerinden veya API ile:

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "negativePrompt": "ugly, distorted",
    "inputImageUrl": "https://picsum.photos/512",
    "params": {
      "steps": 20,
      "cfg": 7,
      "sampler": "euler"
    }
  }'
```

## 📊 Veritabanı Yönetimi

### Prisma Studio ile görüntüleme:
```bash
npx prisma studio
```

### Migration oluşturma:
```bash
npx prisma migrate dev --name migration_name
```

### Veritabanını sıfırlama:
```bash
npx prisma migrate reset
```

## 🐛 Sorun Giderme

### ComfyUI bağlantı hatası
- ComfyUI'ın çalıştığından emin olun: `http://127.0.0.1:8188`
- `.env.local` dosyasındaki `COMFYUI_API_URL` değerini kontrol edin

### Veritabanı hatası
```bash
npx prisma migrate reset
npx prisma generate
```

### Port zaten kullanımda
```bash
# 3000 portunu kullanımda olan işlemi bul
lsof -i :3000
# İşlemi sonlandır
kill -9 <PID>
```

## 📝 Geliştirme Notları

### ComfyUI Workflow Özelleştirme
`lib/comfyui.ts` dosyasındaki `createWorkflow` fonksiyonunu kendi workflow'unuza göre düzenleyin. ComfyUI'dan "Save (API Format)" ile workflow'u export edip buraya yapıştırabilirsiniz.

### Yeni Parametreler Ekleme
Job modelindeki `paramsJson` alanına JSON formatında istediğiniz parametreleri ekleyebilirsiniz.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🔗 Faydalı Linkler

- [Next.js Dokümantasyonu](https://nextjs.org/docs)
- [Prisma Dokümantasyonu](https://www.prisma.io/docs)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

## 💡 Gelecek Özellikler

- [ ] Batch processing (toplu iş işleme)
- [ ] İş önceliklendirme
- [ ] Webhook desteği (iş tamamlandığında bildirim)
- [ ] Kullanıcı yetkilendirme
- [ ] İstatistik ve analitik dashboard
- [ ] Docker desteği
- [ ] WebSocket ile gerçek zamanlı ilerleme takibi


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
