#!/bin/bash

# Post-Process Sistemini Başlatma Script'i
# Hem ComfyUI hem de Backend'i başlatır

set -e

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Post-Process Sistem Başlatıcı          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# ComfyUI kontrolü
if [ ! -d "./comfyui" ]; then
    echo -e "${RED}❌ ComfyUI kurulu değil!${NC}"
    echo -e "${YELLOW}Kurmak için: npm run comfyui:install${NC}"
    exit 1
fi

# Model kontrolü
if [ ! -f "./comfyui/models/checkpoints/sd_xl_base_1.0.safetensors" ]; then
    echo -e "${YELLOW}⚠️  SD XL Base modeli bulunamadı!${NC}"
    echo -e "${YELLOW}İndirmek için:${NC}"
    echo -e "${BLUE}wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors -P ./comfyui/models/checkpoints/${NC}"
    echo ""
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ComfyUI başlat
echo -e "${GREEN}1️⃣  ComfyUI başlatılıyor...${NC}"
if ! lsof -Pi :8188 -sTCP:LISTEN -t >/dev/null 2>&1; then
    npm run comfyui &
    COMFYUI_PID=$!
    
    # ComfyUI'ın başlamasını bekle
    echo -e "${YELLOW}   ComfyUI hazırlanıyor...${NC}"
    for i in {1..30}; do
        if curl -s --max-time 2 http://127.0.0.1:8188/system_stats > /dev/null 2>&1; then
            echo -e "${GREEN}   ✓ ComfyUI hazır!${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    echo ""
else
    echo -e "${GREEN}   ✓ ComfyUI zaten çalışıyor${NC}"
fi

# Backend başlat
echo -e "${GREEN}2️⃣  Backend başlatılıyor...${NC}"
npm run dev

# Cleanup on exit
trap "echo -e '\n${YELLOW}Kapatılıyor...${NC}'; kill $COMFYUI_PID 2>/dev/null; exit" INT TERM
