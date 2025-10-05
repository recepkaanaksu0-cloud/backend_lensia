# ComfyUI Job Runner Dashboard - Development Instructions

## 🎯 Proje Amacı

Bu proje, lensia.ai web sitesinden gelen görüntü işleme taleplerini otomatik olarak yönetmek ve ComfyUI ile işlemek için tasarlanmış bir dashboard'dur.

## 📋 Kod Standartları

### TypeScript Kullanımı
- Tüm dosyalar TypeScript ile yazılmalıdır
- `any` tipi kullanımı mümkün olduğunca az olmalı
- Interface ve Type tanımlamaları açık ve net olmalı

### API Route'ları
- Tüm API route'ları `app/api/` dizini altında olmalı
- Error handling her route'da mutlaka yapılmalı
- HTTP status code'ları doğru kullanılmalı (200, 201, 400, 404, 500)

### Veritabanı İşlemleri
- Prisma kullanılmalı
- Transaction gerektiren işlemler için `prisma.$transaction` kullanılmalı
- Database migration'ları düzenli yapılmalı

### Frontend Bileşenleri
- Shadcn/UI bileşenleri kullanılmalı
- Client component'ler için 'use client' directive kullanılmalı
- SWR ile data fetching yapılmalı (otomatik yenileme için)

## 🔧 Geliştirme Workflow'u

### 1. Yeni Özellik Eklerken
```bash
# Branch oluştur
git checkout -b feature/yeni-ozellik

# Kod değişikliklerini yap
# Test et
npm run dev

# Commit ve push
git add .
git commit -m "feat: yeni özellik açıklaması"
git push origin feature/yeni-ozellik
```

### 2. Database Değişikliği
```bash
# schema.prisma dosyasını güncelle
# Migration oluştur
npx prisma migrate dev --name migration_aciklamasi

# Prisma client'ı yeniden oluştur
npx prisma generate
```

### 3. API Endpoint Eklerken
- `app/api/` altında uygun dizinde oluştur
- Error handling ekle
- TypeScript type'ları tanımla
- Dokümante et (README.md'de)

## 🚨 Önemli Kurallar

### 1. Asenkron İşlemler
ComfyUI işlemleri uzun sürebilir, bu yüzden:
- İşlem başlatma asenkron olmalı
- Kullanıcıya hemen yanıt dönülmeli
- İşlem arka planda devam etmeli
- Durum güncellemeleri veritabanına yazılmalı

### 2. Hata Yönetimi
- Tüm hatalara `try-catch` ile yakalanmalı
- Kullanıcıya anlamlı hata mesajları gösterilmeli
- Hatalar console'a loglanmalı
- Database'de error state saklanmalı

### 3. Güvenlik
- User input'ları validate edilmeli
- SQL injection'a karşı Prisma kullanılmalı
- XSS'e karşı Next.js'in built-in koruması yeterli
- API rate limiting eklenebilir (gelecek feature)

## 📁 Dosya Yapısı Kuralları

```
app/
├── _components/          # Sayfa içi kullanılan bileşenler
├── api/                  # API route'ları
│   └── [resource]/       # Resource bazlı gruplama
└── page.tsx              # Sayfa dosyaları

lib/
├── prisma.ts             # Prisma client singleton
├── comfyui.ts            # ComfyUI API fonksiyonları
└── utils.ts              # Utility fonksiyonlar

prisma/
├── schema.prisma         # Database şeması
└── migrations/           # Migration dosyaları
```

## 🎨 UI/UX Prensipleri

### 1. Loading States
- Her async işlem için loading state gösterilmeli
- Skeleton loader'lar kullanılabilir
- İşlem sırasında butonlar disable edilmeli

### 2. Error States
- Hatalar kullanıcı dostu şekilde gösterilmeli
- Retry mekanizması sunulmalı
- Error boundary'ler kullanılmalı

### 3. Success States
- Başarılı işlemler için feedback verilmeli
- Toast notification kullanılabilir
- Otomatik yenileme yapılmalı

## 🔄 ComfyUI Entegrasyonu

### Workflow Özelleştirme
`lib/comfyui.ts` dosyasındaki `createWorkflow` fonksiyonu:
1. ComfyUI'da workflow'unuzu oluşturun
2. "Save (API Format)" ile export edin
3. JSON'ı `createWorkflow` fonksiyonuna yapıştırın
4. Parametreleri dinamik hale getirin

### Örnek:
```typescript
function createWorkflow(params: any) {
  return {
    "3": {
      "inputs": {
        "seed": params.seed || Math.floor(Math.random() * 1000000000),
        "steps": params.steps || 20,
        "cfg": params.cfg || 7,
        // ... diğer parametreler
      }
    }
  }
}
```

## 🧪 Test Stratejisi

### Manuel Test
```bash
# Test işi ekleme
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt",
    "inputImageUrl": "https://picsum.photos/512",
    "params": {}
  }'

# İşi işleme
curl -X POST http://localhost:3000/api/jobs/[JOB_ID]/process

# İşi görüntüleme
curl http://localhost:3000/api/jobs/[JOB_ID]
```

### Veritabanı Test
```bash
# Prisma Studio ile manuel kontrol
npx prisma studio
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Production'da mutlaka ayarlanmalı:
- `DATABASE_URL`: Production database URL
- `COMFYUI_API_URL`: ComfyUI server URL
- `CLOUDFLARE_TUNNEL_TOKEN`: (Opsiyonel) Tunnel token

## 📊 Monitoring ve Logging

### Console Logging
- Önemli işlemler loglanmalı
- Error'lar detaylı loglanmalı
- Production'da log level ayarlanabilir

### Performance
- SWR cache kullanılmalı
- Gereksiz re-render'lar önlenmeli
- Image optimization (Next.js Image component)

## 🔐 Güvenlik Checklist

- [ ] API endpoint'leri validate ediliyor mu?
- [ ] Error mesajları sensitive bilgi içermiyor mu?
- [ ] Database query'leri parameterized mi?
- [ ] File upload (gelecekte) için validation var mı?
- [ ] Rate limiting düşünüldü mü?

## 💡 Best Practices

### 1. Code Organization
- Tek sorumluluk prensibi
- DRY (Don't Repeat Yourself)
- Anlamlı değişken isimleri
- Yorum satırları gerektiğinde

### 2. Performance
- Lazy loading
- Code splitting
- Image optimization
- Database indexing

### 3. Maintainability
- Modüler kod yapısı
- Reusable component'ler
- Clear separation of concerns
- Documentation

## 🆘 Troubleshooting

### ComfyUI Bağlantı Sorunları
1. ComfyUI çalışıyor mu kontrol et: `curl http://127.0.0.1:8188/system_stats`
2. CORS ayarlarını kontrol et
3. Network bağlantısını kontrol et

### Database Sorunları
1. Migration durumunu kontrol et: `npx prisma migrate status`
2. Schema ile sync: `npx prisma db push`
3. Reset gerekirse: `npx prisma migrate reset`

### Build Sorunları
1. Node modules temizle: `rm -rf node_modules package-lock.json`
2. Yeniden yükle: `npm install`
3. Prisma client yenile: `npx prisma generate`

## 📞 İletişim ve Destek

Sorular ve öneriler için:
- GitHub Issues
- Pull Request'ler hoş gelir
- Code review her zaman yapılmalı
