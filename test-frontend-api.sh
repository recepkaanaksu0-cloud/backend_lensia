#!/bin/bash

echo "=== Test 1: Fotoğraf Üretimi Başlat ==="
RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "userResponses": {
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
    "productImages": ["https://example.com/test.jpg"]
  }')

echo "$RESPONSE" | jq '.'

# Extract requestId
REQUEST_ID=$(echo "$RESPONSE" | jq -r '.requestId')

if [ "$REQUEST_ID" != "null" ] && [ -n "$REQUEST_ID" ]; then
  echo ""
  echo "=== Request ID: $REQUEST_ID ==="
  echo ""
  
  # Wait a bit
  sleep 2
  
  echo "=== Test 2: Status Kontrolü ==="
  curl -s -X GET "http://localhost:3000/api/generate/${REQUEST_ID}/status" \
    -H "Authorization: Bearer test-token" | jq '.'
else
  echo "ERROR: Request ID alınamadı!"
fi
