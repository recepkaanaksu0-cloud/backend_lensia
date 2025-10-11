#!/bin/bash

# ComfyUI'ı CPU modunda başlatma (GPU olmayan sistemler için)

set -e

COMFYUI_DIR="./comfyui"

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🖥️  ComfyUI CPU Modunda Başlatılıyor...${NC}"

# ComfyUI kontrolü
if [ ! -d "$COMFYUI_DIR" ]; then
    echo -e "${RED}❌ ComfyUI kurulu değil!${NC}"
    echo -e "${YELLOW}Kurmak için: npm run comfyui:install${NC}"
    exit 1
fi

# Zaten çalışıyor mu kontrol et
if curl -s --max-time 2 http://127.0.0.1:8188/system_stats > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ComfyUI zaten çalışıyor${NC}"
    exit 0
fi

cd "$COMFYUI_DIR"

# Virtual environment aktifleştir
if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo -e "${GREEN}✓ CPU modunda başlatılıyor...${NC}"
echo -e "${YELLOW}  Not: GPU olmadan işlemler daha yavaş olacak${NC}"
echo -e "${GREEN}  → http://127.0.0.1:8188${NC}"
echo ""

# CPU modunda başlat
python3 main.py --listen 127.0.0.1 --port 8188 --cpu
