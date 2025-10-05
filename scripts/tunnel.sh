#!/bin/bash

# Cloudflare Tunnel Yönetici
# /etc/cloudflared/config.yml yapılandırmasını kullanır

set -e

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Cloudflare Tunnel Yönetici            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Cloudflared yüklü mü kontrol et
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared bulunamadı!${NC}"
    echo -e "${YELLOW}Kurulum için:${NC}"
    echo -e "  ${YELLOW}wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb${NC}"
    echo -e "  ${YELLOW}sudo dpkg -i cloudflared-linux-amd64.deb${NC}"
    exit 1
fi

echo -e "${GREEN}✓ cloudflared bulundu${NC}"

# Yapılandırma dosyası kontrolü
CONFIG_FILE="/etc/cloudflared/config.yml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Yapılandırma dosyası bulunamadı: $CONFIG_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Yapılandırma dosyası bulundu${NC}"

# Yapılandırmayı göster
echo -e "${BLUE}📋 Mevcut Yapılandırma:${NC}"
echo ""
cat "$CONFIG_FILE" | grep -E "hostname|service|tunnel" | head -10
echo ""

# Tunnel durumunu kontrol et
if systemctl is-active --quiet cloudflared; then
    echo -e "${GREEN}✅ Cloudflare Tunnel zaten çalışıyor!${NC}"
    echo ""
    echo -e "${BLUE}Komutlar:${NC}"
    echo -e "  ${YELLOW}Durdur:  sudo systemctl stop cloudflared${NC}"
    echo -e "  ${YELLOW}Restart: sudo systemctl restart cloudflared${NC}"
    echo -e "  ${YELLOW}Durum:   sudo systemctl status cloudflared${NC}"
    echo -e "  ${YELLOW}Loglar:  sudo journalctl -u cloudflared -f${NC}"
    exit 0
fi

# Tunnel'ı başlat
echo -e "${YELLOW}🌐 Cloudflare Tunnel başlatılıyor...${NC}"
echo ""
echo -e "${GREEN}api.lensia.ai → localhost:51511${NC}"
echo ""

# Systemd service olarak başlat
if systemctl list-unit-files | grep -q cloudflared.service; then
    echo -e "${YELLOW}Systemd service kullanılıyor...${NC}"
    sudo systemctl start cloudflared
    sudo systemctl status cloudflared --no-pager
else
    echo -e "${YELLOW}Manuel olarak başlatılıyor...${NC}"
    sudo cloudflared tunnel --config "$CONFIG_FILE" run
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Tunnel Başarıyla Başlatıldı! 🎉     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Dashboard: https://api.lensia.ai${NC}"
echo ""
echo -e "${BLUE}Logları görmek için:${NC}"
echo -e "  ${YELLOW}sudo journalctl -u cloudflared -f${NC}"

