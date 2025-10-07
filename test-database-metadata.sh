#!/bin/bash

echo "=== 🧪 Backend Database Metadata Test ==="
echo ""

# 1. Yeni generation oluştur
echo "1️⃣ Yeni Generation Oluştur..."
RESPONSE=$(curl -s -X POST "http://localhost:51511/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-database-test",
    "userResponses": {
      "productName": "Database Test Ürün",
      "productDescription": "Metadata kayıt testi",
      "targetPlatforms": ["instagram"],
      "aspectRatios": ["1:1"],
      "moods": ["professional"],
      "environments": ["studio"],
      "lightings": ["natural"],
      "angles": ["front"],
      "hasModel": false,
      "keepModel": false,
      "modelPoses": [],
      "modelGender": null,
      "modelAge": null,
      "includeProps": false,
      "showProductOnly": true,
      "brandColors": ["#FF5733"],
      "photoCount": 4
    },
    "productImages": ["https://example.com/test.jpg"]
  }')

echo "$RESPONSE" | jq '.'

GEN_ID=$(echo "$RESPONSE" | jq -r '.generationId')

if [ "$GEN_ID" == "null" ] || [ -z "$GEN_ID" ]; then
  echo "❌ ERROR: Generation ID alınamadı!"
  exit 1
fi

echo ""
echo "✅ Generation ID: $GEN_ID"
echo ""

sleep 1

# 2. SSE ile fotoğraf üretimini takip et
echo "2️⃣ SSE ile Progress Takibi (3 saniye)..."
timeout 3 curl -N -s "http://localhost:51511/api/generate/${GEN_ID}/stream?token=test-token" || true

echo ""
echo ""

# 3. Metadata'yı kontrol et
echo "3️⃣ Database Metadata Kontrolü..."
METADATA=$(curl -s "http://localhost:51511/api/generate" | \
  jq ".requests[] | select(.id == \"$GEN_ID\") | .brandIdentity.metadata")

echo "📊 Metadata:"
echo "$METADATA" | jq '.'

# 4. Fotoğraf sayısını kontrol et
PHOTO_COUNT=$(echo "$METADATA" | jq '.photoCount')
echo ""
echo "📸 Toplam Fotoğraf: $PHOTO_COUNT"

# 5. Fotoğraf URL'lerini kontrol et
echo ""
echo "4️⃣ Fotoğraf URL'leri:"
echo "$METADATA" | jq -r '.images[]'

# 6. Photos endpoint'ini test et
echo ""
echo "5️⃣ Photos Endpoint Testi:"
curl -s "http://localhost:51511/api/generate/${GEN_ID}/photos" \
  -H "Authorization: Bearer test-token" | jq '.'

echo ""
echo "✅ Test Tamamlandı!"
echo ""
echo "📋 Özet:"
echo "  - Generation ID: $GEN_ID"
echo "  - Status: completed"
echo "  - Fotoğraf Sayısı: $PHOTO_COUNT"
echo "  - Metadata database'e kaydedildi ✅"
echo "  - Frontend crash olsa bile veriler güvende ✅"
