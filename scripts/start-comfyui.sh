#!/bin/bash

# ComfyUI Otomatik Başlatıcı
# Bu script ComfyUI'ı otomatik olarak başlatır ve yönetir

set -e

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       ComfyUI Otomatik Başlatıcı          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# ComfyUI dizinini kontrol et
COMFYUI_DIR="${COMFYUI_DIR:-$HOME/ComfyUI}"

if [ ! -d "$COMFYUI_DIR" ]; then
    echo -e "${RED}❌ ComfyUI dizini bulunamadı: $COMFYUI_DIR${NC}"
    echo -e "${YELLOW}COMFYUI_DIR environment variable'ını ayarlayın:${NC}"
    echo -e "  ${YELLOW}export COMFYUI_DIR=/path/to/ComfyUI${NC}"
    exit 1
fi

echo -e "${GREEN}✓ ComfyUI dizini bulundu: $COMFYUI_DIR${NC}"

# Python kontrolü
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 bulunamadı!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python3 bulundu${NC}"

# ComfyUI'ın çalışıp çalışmadığını kontrol et
if curl -s --max-time 2 http://127.0.0.1:8188/system_stats > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  ComfyUI zaten çalışıyor!${NC}"
    echo -e "${GREEN}  → http://127.0.0.1:8188${NC}"
    exit 0
fi

# ComfyUI'ı başlat
echo -e "${YELLOW}🚀 ComfyUI başlatılıyor...${NC}"

cd "$COMFYUI_DIR"

# Virtual environment varsa aktifleştir
if [ -d "venv" ]; then
    echo -e "${YELLOW}  Virtual environment aktifleştiriliyor...${NC}"
    source venv/bin/activate
fi

# ComfyUI'ı başlat
echo -e "${GREEN}  → http://127.0.0.1:8188${NC}"
echo ""
python3 main.py --listen 127.0.0.1 --port 8188
