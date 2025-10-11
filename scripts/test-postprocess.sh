#!/bin/bash

# Post-Process Test Script
# Post-processing API'sini test eder

set -e

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:51511}"

echo -e "${BLUE}🧪 Post-Process API Test${NC}"
echo ""

# ComfyUI durumunu kontrol et
echo -e "${YELLOW}1. ComfyUI durumu kontrol ediliyor...${NC}"
STATUS=$(curl -s "$API_URL/api/comfyui/status")
echo "$STATUS" | jq '.'

if echo "$STATUS" | jq -e '.comfyui.online == true' > /dev/null; then
    echo -e "${GREEN}✓ ComfyUI çalışıyor${NC}"
else
    echo -e "${RED}❌ ComfyUI çalışmıyor!${NC}"
    echo -e "${YELLOW}Başlatmak için: npm run comfyui${NC}"
    exit 1
fi

echo ""

# Test için bir fotoğraf ID'si al
echo -e "${YELLOW}2. Test için fotoğraf aranıyor...${NC}"
PHOTOS=$(curl -s "$API_URL/api/generate")
PHOTO_ID=$(echo "$PHOTOS" | jq -r '.requests[0].generatedPhotos[0].id // empty')

if [ -z "$PHOTO_ID" ]; then
    echo -e "${RED}❌ Test için fotoğraf bulunamadı!${NC}"
    echo -e "${YELLOW}Önce bir fotoğraf üretmeniz gerekiyor.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Test fotoğrafı bulundu: $PHOTO_ID${NC}"
echo ""

# Her işlem tipini test et
PROCESS_TYPES=("noise-fix" "upscale" "background-remove")

for TYPE in "${PROCESS_TYPES[@]}"; do
    echo -e "${YELLOW}3. Test: $TYPE işlemi başlatılıyor...${NC}"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/post-process" \
        -H "Content-Type: application/json" \
        -d "{
            \"photoId\": \"$PHOTO_ID\",
            \"processType\": \"$TYPE\"
        }")
    
    echo "$RESPONSE" | jq '.'
    
    if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✓ $TYPE işlemi başarılı!${NC}"
        
        REFINEMENT_ID=$(echo "$RESPONSE" | jq -r '.refinementId')
        OUTPUT_URL=$(echo "$RESPONSE" | jq -r '.outputImageUrl')
        
        echo -e "${GREEN}  Refinement ID: $REFINEMENT_ID${NC}"
        echo -e "${GREEN}  Output URL: $OUTPUT_URL${NC}"
    else
        echo -e "${RED}❌ $TYPE işlemi başarısız!${NC}"
    fi
    
    echo ""
done

# Refinement'ları listele
echo -e "${YELLOW}4. Fotoğraf refinement'ları listeleniyor...${NC}"
REFINEMENTS=$(curl -s "$API_URL/api/post-process?photoId=$PHOTO_ID")
echo "$REFINEMENTS" | jq '.'

echo ""
echo -e "${GREEN}✅ Test tamamlandı!${NC}"
