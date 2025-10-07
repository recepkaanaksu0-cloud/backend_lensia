#!/bin/bash

echo "=== Test 1: Üretimi Başlat (POST) ==="
RESPONSE=$(curl -s -X POST "http://localhost:51511/api/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "userId": "user-123",
    "userResponses": {
      "prompt": "örnek prompt",
      "productName": "Test Ürün",
      "productDescription": "Test açıklama",
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
      "photoCount": 2
    },
    "productImages": ["https://example.com/ref.jpg"],
    "referenceImages": []
  }')

echo "$RESPONSE" | jq '.'

# Extract generationId
GEN_ID=$(echo "$RESPONSE" | jq -r '.generationId')

if [ "$GEN_ID" != "null" ] && [ -n "$GEN_ID" ]; then
  echo ""
  echo "=== Generation ID: $GEN_ID ==="
  echo ""
  
  sleep 1
  
  echo "=== Test 2: SSE Stream Bağlantısı (5 saniye) ==="
  timeout 5 curl -N -s "http://localhost:51511/api/generate/${GEN_ID}/stream?token=test-token-123" || true
  
  echo ""
  echo ""
  echo "=== Test 3: Üretim Durumu Sorgula ==="
  curl -s "http://localhost:51511/api/generate/${GEN_ID}" \
    -H "Authorization: Bearer test-token" | jq '.'
  
  echo ""
  echo "=== Test 4: Fotoğrafları Çek ==="
  curl -s "http://localhost:51511/api/generate/${GEN_ID}/photos" \
    -H "Authorization: Bearer test-token" | jq '.'
else
  echo "ERROR: Generation ID alınamadı!"
fi
