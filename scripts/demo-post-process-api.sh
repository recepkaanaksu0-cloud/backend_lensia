#!/bin/bash

# 🎯 LENSIA POST-PROCESS API - HIZLI TEST
# ========================================

BASE_URL="http://localhost:51511"
PHOTO_ID="cmgavsbhc00064autzh1f5hk8"  # Veritabanından alınan gerçek ID

echo "🚀 LENSIA POST-PROCESS API TEST PAKETİ"
echo "======================================"
echo ""
echo "📸 Fotoğraf ID: $PHOTO_ID"
echo "🔗 API URL: $BASE_URL"
echo ""

# Renklendirme
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 TEST 1: Tüm İşlem Tiplerini Listele${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
curl -s "${BASE_URL}/api/post-process/types" | jq '{
  totalProcesses: .totalProcesses,
  categories: .usage.availableCategories
}'
echo ""

# Test 2
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 TEST 2: BASIC Kategorisi${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
curl -s "${BASE_URL}/api/post-process/types?category=BASIC" | jq '{
  category: .category,
  count: .count,
  processes: .processes | map(.type)
}'
echo ""

# Test 3
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 TEST 3: PORTRAIT Kategorisi${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
curl -s "${BASE_URL}/api/post-process/types?category=PORTRAIT" | jq '{
  category: .category,
  count: .count,
  operations: .processes | map({type, name, estimatedTime})
}'
echo ""

# Test 4
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 TEST 4: Tek İşlem Detayı (background-color)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
curl -s "${BASE_URL}/api/post-process/types?type=background-color" | jq '{
  type,
  name,
  description,
  category,
  estimatedTime,
  requiredParams,
  examples
}'
echo ""

# Test 5  
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 TEST 5: ARTISTIC Kategorisi${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
curl -s "${BASE_URL}/api/post-process/types?category=ARTISTIC" | jq '.processes[0:3] | map({type, name})'
echo ""

# Test 6
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 TEST 6: ENHANCEMENT Kategorisi${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
curl -s "${BASE_URL}/api/post-process/types?category=ENHANCEMENT" | jq '.count'
echo ""

# Test 7 - RESTful API Info
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}🌐 TEST 7: RESTful API Endpoint Bilgisi${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
curl -s "${BASE_URL}/api/uretim/${PHOTO_ID}/background-color" | jq '{
  photoId,
  processType,
  name,
  description,
  endpoint,
  method
}'
echo ""

# Test 8 - Photo Refinements
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}📷 TEST 8: Fotoğrafın Mevcut İşlemleri${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
curl -s "${BASE_URL}/api/post-process?photoId=${PHOTO_ID}" | jq '{
  success,
  count,
  refinements: .refinements | length
}'
echo ""

echo -e "${GREEN}✅ TÜM TESTLER TAMAMLANDI!${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📚 KULLANIM ÖRNEKLERİ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""
echo "1️⃣  Arka Plan Renk Değiştir (Beyaz):"
echo "   curl -X POST ${BASE_URL}/api/post-process \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"photoId\": \"${PHOTO_ID}\", \"processType\": \"background-color\", \"params\": {\"backgroundColor\": \"#FFFFFF\"}}'"
echo ""
echo "2️⃣  Fotoğraf Döndür (90°):"
echo "   curl -X POST ${BASE_URL}/api/uretim/${PHOTO_ID}/rotate \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"rotationAngle\": 90}'"
echo ""
echo "3️⃣  Yüz İyileştirme:"
echo "   curl -X POST ${BASE_URL}/api/uretim/${PHOTO_ID}/face-enhance \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"faceEnhanceStrength\": 0.8}'"
echo ""
echo "4️⃣  Arka Plan Bulanıklaştır:"
echo "   curl -X POST ${BASE_URL}/api/uretim/${PHOTO_ID}/blur-background \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"blurStrength\": 7}'"
echo ""
echo -e "${YELLOW}⚠️  NOT: Gerçek işlemler için ComfyUI çalışıyor olmalı!${NC}"
echo "   ComfyUI başlatmak için: ${GREEN}npm run comfyui${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
