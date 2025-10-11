#!/bin/bash

# PyTorch CUDA Versiyonu Kurulum Script'i
# GPU desteği için PyTorch'u CUDA ile yeniden kurar

set -e

COMFYUI_DIR="./comfyui"

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PyTorch CUDA Kurulumu                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# GPU kontrolü
if ! command -v nvidia-smi &> /dev/null; then
    echo -e "${RED}❌ NVIDIA GPU bulunamadı!${NC}"
    exit 1
fi

GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
echo -e "${GREEN}✓ GPU bulundu: ${GPU_NAME}${NC}"

# CUDA versiyonunu kontrol et
CUDA_VERSION=$(nvidia-smi | grep "CUDA Version" | awk '{print $9}')
echo -e "${GREEN}✓ CUDA Version: ${CUDA_VERSION}${NC}"

# ComfyUI dizini kontrolü
if [ ! -d "$COMFYUI_DIR" ]; then
    echo -e "${RED}❌ ComfyUI bulunamadı!${NC}"
    exit 1
fi

cd "$COMFYUI_DIR"

# Virtual environment aktifleştir
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment bulunamadı!${NC}"
    exit 1
fi

source venv/bin/activate

# Mevcut PyTorch'u kaldır
echo -e "${YELLOW}📦 Mevcut PyTorch kaldırılıyor...${NC}"
pip uninstall -y torch torchvision torchaudio

# CUDA versiyonuna göre kurulum
echo -e "${YELLOW}📦 PyTorch CUDA versiyonu kuruluyor...${NC}"

if [[ "$CUDA_VERSION" == 12.* ]]; then
    echo -e "${GREEN}CUDA 12.x tespit edildi, PyTorch 2.8 + CUDA 12.1 kuruluyor...${NC}"
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
elif [[ "$CUDA_VERSION" == 11.* ]]; then
    echo -e "${GREEN}CUDA 11.x tespit edildi, PyTorch 2.8 + CUDA 11.8 kuruluyor...${NC}"
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
else
    echo -e "${YELLOW}CUDA versiyonu belirsiz, varsayılan CUDA 12.1 kuruluyor...${NC}"
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
fi

echo ""
echo -e "${GREEN}✅ PyTorch CUDA kurulumu tamamlandı!${NC}"
echo ""

# Test
echo -e "${YELLOW}🧪 CUDA desteği test ediliyor...${NC}"
python3 -c "
import torch
print(f'PyTorch Version: {torch.__version__}')
print(f'CUDA Available: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'CUDA Version: {torch.version.cuda}')
    print(f'GPU Count: {torch.cuda.device_count()}')
    print(f'GPU Name: {torch.cuda.get_device_name(0)}')
    print('✅ CUDA desteği aktif!')
else:
    print('❌ CUDA desteği YOK!')
"

echo ""
echo -e "${GREEN}🚀 Artık ComfyUI GPU modunda çalışabilir!${NC}"
echo -e "${GREEN}   Başlatmak için: npm run comfyui${NC}"
