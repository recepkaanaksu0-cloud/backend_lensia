#!/bin/bash

# ComfyUI Kurulum Script'i
# Bu script ComfyUI'ı otomatik olarak projeye yükler ve yapılandırır

set -e

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMFYUI_DIR="./comfyui"
VENV_DIR="$COMFYUI_DIR/venv"

echo -e "${BLUE}🎨 ComfyUI Kurulum Başlatılıyor...${NC}"
echo ""

# Python kontrolü
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 bulunamadı!${NC}"
    echo -e "${YELLOW}Lütfen Python 3.8 veya üstü kurun${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "${GREEN}✓ Python versiyonu: ${PYTHON_VERSION}${NC}"

# Git kontrolü
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git bulunamadı!${NC}"
    exit 1
fi

# ComfyUI'ı klonla
if [ -d "$COMFYUI_DIR" ]; then
    echo -e "${YELLOW}⚠️  ComfyUI dizini zaten mevcut${NC}"
    read -p "Yeniden kurmak ister misiniz? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Eski kurulum siliniyor...${NC}"
        rm -rf "$COMFYUI_DIR"
    else
        echo -e "${GREEN}✓ Mevcut kurulum kullanılıyor${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}📥 ComfyUI indiriliyor...${NC}"
git clone https://github.com/comfyanonymous/ComfyUI.git "$COMFYUI_DIR"

# Virtual environment oluştur
echo -e "${BLUE}🐍 Python sanal ortamı oluşturuluyor...${NC}"
cd "$COMFYUI_DIR"
python3 -m venv venv

# Virtual environment'ı aktifleştir
source venv/bin/activate

# Gereksinimleri yükle
echo -e "${BLUE}📦 Gereksinimler yükleniyor...${NC}"
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Custom nodes dizinini oluştur
mkdir -p custom_nodes

# Önemli custom node'ları yükle
echo -e "${BLUE}🔌 Custom node'lar yükleniyor...${NC}"

# ComfyUI Manager
cd custom_nodes
if [ ! -d "ComfyUI-Manager" ]; then
    git clone https://github.com/ltdrdata/ComfyUI-Manager.git
fi

# ControlNet
if [ ! -d "comfyui-controlnet" ]; then
    git clone https://github.com/Fannovel16/comfyui_controlnet_aux.git
fi

# Image processing nodes
if [ ! -d "ComfyUI-Custom-Scripts" ]; then
    git clone https://github.com/pythongosssss/ComfyUI-Custom-Scripts.git
fi

cd ../..

# Yapılandırma dosyası oluştur
echo -e "${BLUE}⚙️  Yapılandırma dosyası oluşturuluyor...${NC}"
cat > "$COMFYUI_DIR/extra_model_paths.yaml" << EOF
# ComfyUI model yolları yapılandırması
# Bu dosya, modellerin nerede bulunduğunu belirtir

comfyui:
    base_path: ./
    checkpoints: models/checkpoints/
    vae: models/vae/
    loras: models/loras/
    upscale_models: models/upscale_models/
    embeddings: models/embeddings/
    controlnet: models/controlnet/
EOF

# Model dizinlerini oluştur
echo -e "${BLUE}📁 Model dizinleri oluşturuluyor...${NC}"
mkdir -p "$COMFYUI_DIR/models/checkpoints"
mkdir -p "$COMFYUI_DIR/models/vae"
mkdir -p "$COMFYUI_DIR/models/loras"
mkdir -p "$COMFYUI_DIR/models/upscale_models"
mkdir -p "$COMFYUI_DIR/models/embeddings"
mkdir -p "$COMFYUI_DIR/models/controlnet"

# Başlangıç script'i oluştur
cat > "$COMFYUI_DIR/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
python main.py --listen 127.0.0.1 --port 8188
EOF

chmod +x "$COMFYUI_DIR/start.sh"

echo ""
echo -e "${GREEN}✅ ComfyUI başarıyla kuruldu!${NC}"
echo ""
echo -e "${YELLOW}📝 Önemli Notlar:${NC}"
echo -e "  • ComfyUI dizini: ${BLUE}$COMFYUI_DIR${NC}"
echo -e "  • Başlatmak için: ${BLUE}cd $COMFYUI_DIR && ./start.sh${NC}"
echo -e "  • veya: ${BLUE}npm run comfyui${NC}"
echo ""
echo -e "${YELLOW}📦 Model İndirme:${NC}"
echo -e "  Stable Diffusion modelleri indirmeniz gerekiyor:"
echo -e "  ${BLUE}https://civitai.com/${NC} veya ${BLUE}https://huggingface.co/${NC}"
echo -e "  İndirilen modelleri: ${BLUE}$COMFYUI_DIR/models/checkpoints/${NC} dizinine koyun"
echo ""
echo -e "${YELLOW}🎨 Önerilen Modeller:${NC}"
echo -e "  • SD XL Base: ${BLUE}stabilityai/stable-diffusion-xl-base-1.0${NC}"
echo -e "  • Upscaler: ${BLUE}RealESRGAN x4plus${NC}"
echo ""
echo -e "${GREEN}🚀 Kurulum tamamlandı!${NC}"
