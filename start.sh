#!/bin/bash

# ComfyUI Job Runner Dashboard - Başlatma Scripti
# Bu script otomatik olarak gerekli servisleri başlatır

set -e

echo "🚀 ComfyUI Job Runner Dashboard başlatılıyor..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# .env.local dosyasını kontrol et
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local dosyası bulunamadı, oluşturuluyor...${NC}"
    cat > .env.local << EOF
# Database
DATABASE_URL="file:./dev.db"

# Server Configuration
PORT=51511
NEXT_PUBLIC_API_URL="https://api.lensia.ai"

# ComfyUI API Configuration
COMFYUI_API_URL="http://127.0.0.1:8188"

# Lensia.ai Main Site Configuration
LENSIA_MAIN_SITE_URL="https://www.lensia.ai"
LENSIA_WEBHOOK_URL="https://www.lensia.ai/api/jobs/webhook"
LENSIA_API_KEY="your-api-key-here"

# Cloudflare Tunnel Configuration
# Tunnel otomatik olarak /etc/cloudflared/config.yml'den çalışıyor
# api.lensia.ai -> localhost:51511
EOF
    echo -e "${GREEN}✓ .env.local dosyası oluşturuldu${NC}"
fi

# Node modules kontrolü
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules bulunamadı, bağımlılıklar yükleniyor...${NC}"
    npm install
    echo -e "${GREEN}✓ Bağımlılıklar yüklendi${NC}"
fi

# Prisma Client kontrolü ve oluşturma
echo -e "${YELLOW}📦 Prisma Client oluşturuluyor...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client oluşturuldu${NC}"

# Veritabanı migration
if [ ! -f "prisma/dev.db" ]; then
    echo -e "${YELLOW}📊 Veritabanı oluşturuluyor...${NC}"
    npx prisma migrate dev --name init
    echo -e "${GREEN}✓ Veritabanı hazır${NC}"
else
    echo -e "${GREEN}✓ Veritabanı mevcut${NC}"
fi

# ComfyUI sunucusunun çalışıp çalışmadığını kontrol et
echo -e "${YELLOW}🔍 ComfyUI sunucusu kontrol ediliyor...${NC}"
if curl -s --max-time 5 http://127.0.0.1:8188/system_stats > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ComfyUI sunucusu çalışıyor${NC}"
elif [ -d "./comfyui" ]; then
    echo -e "${YELLOW}⚠️  ComfyUI kurulu ama çalışmıyor!${NC}"
    echo -e "${YELLOW}  Başlatmak için:${NC}"
    echo -e "${YELLOW}  npm run comfyui${NC}"
else
    echo -e "${YELLOW}⚠️  ComfyUI kurulu değil!${NC}"
    echo -e "${YELLOW}  Kurmak için:${NC}"
    echo -e "${YELLOW}  npm run comfyui:install${NC}"
fi

# Cloudflare Tunnel durumunu kontrol et
echo -e "${YELLOW}🌐 Cloudflare Tunnel kontrol ediliyor...${NC}"
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo -e "${GREEN}✓ Cloudflare Tunnel çalışıyor${NC}"
    echo -e "${GREEN}  → https://api.lensia.ai → localhost:51511${NC}"
else
    echo -e "${YELLOW}⚠️  Cloudflare Tunnel çalışmıyor${NC}"
    echo -e "${YELLOW}  Başlatmak için:${NC}"
    echo -e "${YELLOW}  sudo systemctl start cloudflared${NC}"
    echo -e "${YELLOW}  veya${NC}"
    echo -e "${YELLOW}  npm run tunnel:start${NC}"
fi

# Next.js development server'ı başlat
echo -e "${GREEN}🎉 Dashboard başlatılıyor...${NC}"
echo -e "${GREEN}   Local:  http://localhost:51511${NC}"
echo -e "${GREEN}   Public: https://api.lensia.ai${NC}"
echo ""

npm run dev
