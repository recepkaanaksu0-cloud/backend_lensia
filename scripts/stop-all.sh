#!/bin/bash

# 🛑 LENSIA - Tüm Servisleri Durdur
# ==================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PID_DIR="$HOME/.lensia"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
COMFYUI_PID_FILE="$PID_DIR/comfyui.pid"

echo -e "${YELLOW}"
echo "╔═══════════════════════════════════════════╗"
echo "║                                           ║"
echo "║     🛑 LENSIA Durduruluyor 🛑             ║"
echo "║                                           ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

STOPPED=0

# Backend'i durdur
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "${YELLOW}🛑 Backend durduruluyor (PID: $BACKEND_PID)...${NC}"
        kill "$BACKEND_PID" 2>/dev/null || true
        sleep 2
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo -e "${RED}⚠️  Backend yanıt vermiyor, zorla kapatılıyor...${NC}"
            kill -9 "$BACKEND_PID" 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ Backend durduruldu${NC}"
        STOPPED=$((STOPPED + 1))
    fi
    rm -f "$BACKEND_PID_FILE"
fi

# ComfyUI'ı durdur
if [ -f "$COMFYUI_PID_FILE" ]; then
    COMFYUI_PID=$(cat "$COMFYUI_PID_FILE")
    if kill -0 "$COMFYUI_PID" 2>/dev/null; then
        echo -e "${YELLOW}🛑 ComfyUI durduruluyor (PID: $COMFYUI_PID)...${NC}"
        kill "$COMFYUI_PID" 2>/dev/null || true
        sleep 2
        if kill -0 "$COMFYUI_PID" 2>/dev/null; then
            echo -e "${RED}⚠️  ComfyUI yanıt vermiyor, zorla kapatılıyor...${NC}"
            kill -9 "$COMFYUI_PID" 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ ComfyUI durduruldu${NC}"
        STOPPED=$((STOPPED + 1))
    fi
    rm -f "$COMFYUI_PID_FILE"
fi

# Port'ları kontrol et ve gerekirse temizle
echo ""
echo -e "${YELLOW}🔍 Port kontrolü yapılıyor...${NC}"

# Port 51511 (Backend)
if lsof -Pi :51511 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Port 51511 hala meşgul, temizleniyor...${NC}"
    lsof -ti:51511 | xargs kill -9 2>/dev/null || true
fi

# Port 8188 (ComfyUI)
if lsof -Pi :8188 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Port 8188 hala meşgul, temizleniyor...${NC}"
    lsof -ti:8188 | xargs kill -9 2>/dev/null || true
fi

echo ""
if [ $STOPPED -eq 0 ]; then
    echo -e "${YELLOW}ℹ️  Çalışan servis bulunamadı${NC}"
else
    echo -e "${GREEN}✅ $STOPPED servis başarıyla durduruldu${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}║     ✅ Tüm Servisler Durduruldu ✅        ║${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
