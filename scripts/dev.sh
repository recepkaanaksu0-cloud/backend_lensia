#!/bin/bash

# Development Environment Başlatıcı
# Tüm servisleri paralel olarak başlatır

set -e

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      ComfyUI Dashboard - Full Stack       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# PID dosyaları için dizin
mkdir -p .pids

# Cleanup fonksiyonu
cleanup() {
    echo -e "\n${YELLOW}🛑 Servisler durduruluyor...${NC}"
    
    if [ -f .pids/dashboard.pid ]; then
        kill $(cat .pids/dashboard.pid) 2>/dev/null || true
        rm .pids/dashboard.pid
    fi
    
    if [ -f .pids/tunnel.pid ]; then
        kill $(cat .pids/tunnel.pid) 2>/dev/null || true
        rm .pids/tunnel.pid
    fi
    
    echo -e "${GREEN}✓ Temizleme tamamlandı${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 1. Dashboard'u başlat
echo -e "${YELLOW}📊 Dashboard başlatılıyor...${NC}"
npm run dev > logs/dashboard.log 2>&1 &
DASHBOARD_PID=$!
echo $DASHBOARD_PID > .pids/dashboard.pid
echo -e "${GREEN}✓ Dashboard başlatıldı (PID: $DASHBOARD_PID)${NC}"
echo -e "${GREEN}  → http://localhost:3000${NC}"

# 2. Cloudflare Tunnel başlat (eğer token varsa)
if [ ! -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    echo -e "${YELLOW}🌐 Cloudflare Tunnel başlatılıyor...${NC}"
    ./scripts/tunnel.sh > logs/tunnel.log 2>&1 &
    TUNNEL_PID=$!
    echo $TUNNEL_PID > .pids/tunnel.pid
    echo -e "${GREEN}✓ Tunnel başlatıldı (PID: $TUNNEL_PID)${NC}"
    
    # Tunnel URL'ini bekle ve göster
    sleep 5
    if [ -f logs/tunnel.log ]; then
        TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' logs/tunnel.log | head -1)
        if [ ! -z "$TUNNEL_URL" ]; then
            echo -e "${GREEN}  → $TUNNEL_URL${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Servisler Hazır! 🎉             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Logları görmek için:${NC}"
echo -e "  ${YELLOW}Dashboard: tail -f logs/dashboard.log${NC}"
if [ ! -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    echo -e "  ${YELLOW}Tunnel:    tail -f logs/tunnel.log${NC}"
fi
echo ""
echo -e "${YELLOW}Durdurmak için: Ctrl+C${NC}"
echo ""

# Sonsuza kadar bekle
wait
