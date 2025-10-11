#!/bin/bash

# 🚀 LENSIA - Backend + ComfyUI Birlikte Başlatma Scripti
# ========================================================

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logo
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║                   🚀 LENSIA BAŞLATILIYOR 🚀                       ║"
echo "║                                                                   ║"
echo "║           Backend + ComfyUI + Test Panel                          ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# PID dosyaları için dizin
PID_DIR="$HOME/.lensia"
mkdir -p "$PID_DIR"

BACKEND_PID_FILE="$PID_DIR/backend.pid"
COMFYUI_PID_FILE="$PID_DIR/comfyui.pid"

# Cleanup fonksiyonu
cleanup() {
    echo -e "\n${YELLOW}⚠️  Kapatma sinyali alındı. Servisler durduruluyor...${NC}"
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo -e "${YELLOW}🛑 Backend durduruluyor (PID: $BACKEND_PID)...${NC}"
            kill "$BACKEND_PID" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    if [ -f "$COMFYUI_PID_FILE" ]; then
        COMFYUI_PID=$(cat "$COMFYUI_PID_FILE")
        if kill -0 "$COMFYUI_PID" 2>/dev/null; then
            echo -e "${YELLOW}🛑 ComfyUI durduruluyor (PID: $COMFYUI_PID)...${NC}"
            kill "$COMFYUI_PID" 2>/dev/null || true
        fi
        rm -f "$COMFYUI_PID_FILE"
    fi
    
    echo -e "${GREEN}✅ Tüm servisler durduruldu${NC}"
    exit 0
}

# Trap signals
trap cleanup SIGINT SIGTERM EXIT

# Önceki process'leri temizle
if [ -f "$BACKEND_PID_FILE" ]; then
    OLD_PID=$(cat "$BACKEND_PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Eski backend process bulundu (PID: $OLD_PID), durduruluyor...${NC}"
        kill "$OLD_PID" 2>/dev/null || true
        sleep 2
    fi
    rm -f "$BACKEND_PID_FILE"
fi

if [ -f "$COMFYUI_PID_FILE" ]; then
    OLD_PID=$(cat "$COMFYUI_PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Eski ComfyUI process bulundu (PID: $OLD_PID), durduruluyor...${NC}"
        kill "$OLD_PID" 2>/dev/null || true
        sleep 2
    fi
    rm -f "$COMFYUI_PID_FILE"
fi

echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📦 1. COMFYUI BAŞLATILIYOR...${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# ComfyUI dizinini kontrol et
if [ ! -d "./comfyui" ]; then
    echo -e "${RED}❌ ComfyUI dizini bulunamadı!${NC}"
    echo -e "${YELLOW}💡 Önce ComfyUI'ı kurun: npm run comfyui:install${NC}"
    exit 1
fi

# Virtual environment kontrolü
if [ ! -d "./comfyui/venv" ]; then
    echo -e "${RED}❌ ComfyUI virtual environment bulunamadı!${NC}"
    echo -e "${YELLOW}💡 Önce ComfyUI'ı kurun: npm run comfyui:install${NC}"
    exit 1
fi

# GPU kontrolü
if command -v nvidia-smi &> /dev/null; then
    GPU_INFO=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
    if [ -n "$GPU_INFO" ]; then
        echo -e "${GREEN}🎮 GPU bulundu: $GPU_INFO${NC}"
        GPU_FLAG=""
    else
        echo -e "${YELLOW}⚠️  GPU bulunamadı, CPU modunda başlatılacak${NC}"
        GPU_FLAG="--cpu"
    fi
else
    echo -e "${YELLOW}⚠️  nvidia-smi bulunamadı, CPU modunda başlatılacak${NC}"
    GPU_FLAG="--cpu"
fi

# ComfyUI'ı arka planda başlat
cd comfyui
source venv/bin/activate

echo -e "${BLUE}🚀 ComfyUI başlatılıyor...${NC}"

# ComfyUI'ı arka planda çalıştır ve logları dosyaya yaz
nohup python main.py $GPU_FLAG --listen 127.0.0.1 --port 8188 --cpu > ../logs/comfyui.log 2>&1 &
COMFYUI_PID=$!
echo "$COMFYUI_PID" > "$COMFYUI_PID_FILE"

deactivate
cd ..

echo -e "${GREEN}✅ ComfyUI başlatıldı (PID: $COMFYUI_PID)${NC}"
echo -e "${CYAN}   Log: logs/comfyui.log${NC}"

# ComfyUI'ın hazır olmasını bekle
echo -e "${YELLOW}⏳ ComfyUI'ın hazır olması bekleniyor...${NC}"
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s http://127.0.0.1:8188/system_stats > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ComfyUI hazır!${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo -ne "\r${YELLOW}⏳ Bekleniyor... ${WAITED}s${NC}"
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ ComfyUI başlatılamadı (timeout)${NC}"
    echo -e "${YELLOW}💡 Log dosyasını kontrol edin: tail -f logs/comfyui.log${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📦 2. BACKEND BAŞLATILIYOR...${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Backend'i başlat
echo -e "${BLUE}🚀 Next.js backend başlatılıyor...${NC}"

# Backend'i arka planda çalıştır
nohup npm run dev > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$BACKEND_PID_FILE"

echo -e "${GREEN}✅ Backend başlatıldı (PID: $BACKEND_PID)${NC}"
echo -e "${CYAN}   Log: logs/backend.log${NC}"

# Backend'in hazır olmasını bekle
echo -e "${YELLOW}⏳ Backend'in hazır olması bekleniyor...${NC}"
MAX_WAIT=30
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s http://localhost:51511/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend hazır!${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo -ne "\r${YELLOW}⏳ Bekleniyor... ${WAITED}s${NC}"
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ Backend başlatılamadı (timeout)${NC}"
    echo -e "${YELLOW}💡 Log dosyasını kontrol edin: tail -f logs/backend.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                   ║${NC}"
echo -e "${GREEN}║              ✅ TÜM SERVİSLER BAŞARIYLA BAŞLATILDI! ✅             ║${NC}"
echo -e "${GREEN}║                                                                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}📍 AÇIK SERVİSLER:${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${PURPLE}🌐 Backend API:${NC}"
echo -e "     ${BLUE}http://localhost:51511${NC}"
echo -e "     ${GREEN}✅ Çalışıyor${NC} (PID: $BACKEND_PID)"
echo ""
echo -e "  ${PURPLE}🎨 ComfyUI:${NC}"
echo -e "     ${BLUE}http://127.0.0.1:8188${NC}"
echo -e "     ${GREEN}✅ Çalışıyor${NC} (PID: $COMFYUI_PID)"
echo ""
echo -e "  ${PURPLE}🧪 Test Paneli:${NC}"
echo -e "     ${BLUE}http://localhost:51511/test-panel.html${NC}"
echo -e "     ${GREEN}✅ Hazır${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📊 SİSTEM BİLGİLERİ:${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  • API Endpoints:     ${GREEN}3 ana endpoint${NC}"
echo -e "  • İşlem Tipleri:     ${GREEN}46 farklı işlem${NC}"
echo -e "  • Kategoriler:       ${GREEN}9 kategori${NC}"
echo -e "  • GPU Modu:          ${GREEN}$([ -z "$GPU_FLAG" ] && echo "Aktif" || echo "Devre dışı (CPU)")${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}💡 KULLANIM:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Tarayıcınızda test panelini açın:"
echo -e "     ${BLUE}http://localhost:51511/test-panel.html${NC}"
echo ""
echo -e "  ${CYAN}2.${NC} API'yi kullanın:"
echo -e "     ${GREEN}curl http://localhost:51511/api/post-process/types | jq '.'${NC}"
echo ""
echo -e "  ${CYAN}3.${NC} Logları izleyin:"
echo -e "     ${GREEN}tail -f logs/backend.log${NC}"
echo -e "     ${GREEN}tail -f logs/comfyui.log${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⚠️  DURDURMA:${NC}"
echo -e "   ${RED}CTRL+C${NC} tuşlarına basarak tüm servisleri durdurun"
echo -e "   veya"
echo -e "   ${GREEN}./scripts/stop-all.sh${NC} scriptini çalıştırın"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}🎉 LENSIA hazır! Test panelini açarak başlayın! 🎉${NC}"
echo ""

# Logları takip et (isteğe bağlı)
if [ "$1" = "--logs" ] || [ "$1" = "-l" ]; then
    echo -e "${YELLOW}📜 Loglar gösteriliyor (CTRL+C ile durdurun)...${NC}"
    echo ""
    tail -f logs/backend.log logs/comfyui.log
else
    echo -e "${CYAN}💡 Logları görmek için: ./scripts/start-all.sh --logs${NC}"
    echo ""
    
    # Sonsuz döngü - kullanıcı CTRL+C yapana kadar bekle
    echo -e "${YELLOW}⏳ Servisler çalışıyor... Durdurmak için CTRL+C basın${NC}"
    while true; do
        sleep 10
        
        # Process'lerin hala çalıştığını kontrol et
        if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo -e "\n${RED}❌ Backend beklenmedik şekilde durdu!${NC}"
            echo -e "${YELLOW}💡 Log: tail -f logs/backend.log${NC}"
            exit 1
        fi
        
        if ! kill -0 "$COMFYUI_PID" 2>/dev/null; then
            echo -e "\n${RED}❌ ComfyUI beklenmedik şekilde durdu!${NC}"
            echo -e "${YELLOW}💡 Log: tail -f logs/comfyui.log${NC}"
            exit 1
        fi
    done
fi