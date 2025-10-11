#!/bin/bash

# 🎨 Post-Process API Test Script
# Backend ve ComfyUI çalışırken kullanın

BASE_URL="http://localhost:51511"
PHOTO_ID="test_photo_id"  # Değiştirin!

echo "🎨 POST-PROCESS API TEST"
echo "========================"
echo ""

# Renklendirme
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Tüm işlem tiplerini listele
echo -e "${YELLOW}📋 Test 1: Tüm İşlem Tiplerini Listele${NC}"
curl -s "${BASE_URL}/api/post-process/types" | jq '.' | head -30
echo ""

# Test 2: Kategori bazlı listeleme
echo -e "${YELLOW}📋 Test 2: PORTRAIT Kategorisini Listele${NC}"
curl -s "${BASE_URL}/api/post-process/types?category=PORTRAIT" | jq '.'
echo ""

# Test 3: Tek bir işlem bilgisi
echo -e "${YELLOW}📋 Test 3: background-color İşlem Bilgisi${NC}"
curl -s "${BASE_URL}/api/post-process/types?type=background-color" | jq '.'
echo ""

# Test 4: Arka plan renk değiştirme
echo -e "${YELLOW}🎨 Test 4: Arka Plan Renk Değiştirme (Beyaz)${NC}"
curl -X POST "${BASE_URL}/api/post-process" \
  -H "Content-Type: application/json" \
  -d "{
    \"photoId\": \"${PHOTO_ID}\",
    \"processType\": \"background-color\",
    \"params\": {
      \"backgroundColor\": \"#FFFFFF\"
    }
  }" | jq '.'
echo ""

# Test 5: Fotoğraf döndürme (90 derece)
echo -e "${YELLOW}🔄 Test 5: Fotoğraf Döndürme (90°)${NC}"
curl -X POST "${BASE_URL}/api/post-process" \
  -H "Content-Type: application/json" \
  -d "{
    \"photoId\": \"${PHOTO_ID}\",
    \"processType\": \"rotate\",
    \"params\": {
      \"rotationAngle\": 90
    }
  }" | jq '.'
echo ""

# Test 6: RESTful API - Arka plan renk değiştirme
echo -e "${YELLOW}🌐 Test 6: RESTful API - Arka Plan Renk${NC}"
curl -X POST "${BASE_URL}/api/uretim/${PHOTO_ID}/background-color" \
  -H "Content-Type: application/json" \
  -d "{
    \"backgroundColor\": \"#F0F0F0\"
  }" | jq '.'
echo ""

# Test 7: Parlaklık/Kontrast ayarlama
echo -e "${YELLOW}💡 Test 7: Parlaklık/Kontrast Ayarlama${NC}"
curl -X POST "${BASE_URL}/api/uretim/${PHOTO_ID}/brightness-contrast" \
  -H "Content-Type: application/json" \
  -d "{
    \"brightness\": 0.2,
    \"contrast\": 0.15
  }" | jq '.'
echo ""

# Test 8: Arka plan bulanıklaştırma
echo -e "${YELLOW}🌫️  Test 8: Arka Plan Bulanıklaştırma (Bokeh)${NC}"
curl -X POST "${BASE_URL}/api/uretim/${PHOTO_ID}/blur-background" \
  -H "Content-Type: application/json" \
  -d "{
    \"blurStrength\": 7
  }" | jq '.'
echo ""

# Test 9: Yüz iyileştirme
echo -e "${YELLOW}👤 Test 9: Yüz İyileştirme${NC}"
curl -X POST "${BASE_URL}/api/uretim/${PHOTO_ID}/face-enhance" \
  -H "Content-Type: application/json" \
  -d "{
    \"faceEnhanceStrength\": 0.8
  }" | jq '.'
echo ""

# Test 10: Nesne silme
echo -e "${YELLOW}🗑️  Test 10: Nesne Silme${NC}"
curl -X POST "${BASE_URL}/api/post-process" \
  -H "Content-Type: application/json" \
  -d "{
    \"photoId\": \"${PHOTO_ID}\",
    \"processType\": \"object-delete\",
    \"params\": {
      \"prompt\": \"remove person in background, clean scene\",
      \"negativePrompt\": \"artifacts, blur\"
    }
  }" | jq '.'
echo ""

# Test 11: İşlem durumu sorgulama (refinement ID ile)
echo -e "${YELLOW}🔍 Test 11: İşlem Durumu Sorgulama${NC}"
echo "Önce bir refinementId elde edin, sonra:"
echo "curl \"${BASE_URL}/api/post-process?refinementId=REF_ID\" | jq '.'"
echo ""

# Test 12: Fotoğrafın tüm işlemlerini listeleme
echo -e "${YELLOW}📜 Test 12: Fotoğrafın Tüm İşlemleri${NC}"
curl -s "${BASE_URL}/api/post-process?photoId=${PHOTO_ID}" | jq '.'
echo ""

echo -e "${GREEN}✅ Test tamamlandı!${NC}"
echo ""
echo "💡 İpuçları:"
echo "  - PHOTO_ID değişkenini gerçek bir fotoğraf ID'si ile değiştirin"
echo "  - ComfyUI'ın çalıştığından emin olun: npm run comfyui"
echo "  - Backend'in çalıştığından emin olun: npm run dev"
echo "  - jq yüklü değilse: sudo apt install jq"
