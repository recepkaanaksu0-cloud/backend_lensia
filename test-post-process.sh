#!/bin/bash

# Önce bir fotoğraf ID'si alalım
PHOTO_ID=$(curl -s http://localhost:51511/api/generate | jq -r '.requests[0].generatedPhotos[0].id // empty')

if [ -z "$PHOTO_ID" ]; then
  echo "❌ Fotoğraf bulunamadı!"
  exit 1
fi

echo "📸 Test Photo ID: $PHOTO_ID"
echo ""

echo "🧪 Test 1: /api/post-process endpoint"
curl -X POST http://localhost:51511/api/post-process \
  -H "Content-Type: application/json" \
  -d "{
    \"photoId\": \"$PHOTO_ID\",
    \"processType\": \"background-change\",
    \"params\": {}
  }" | jq '.'

echo ""
echo ""
echo "🧪 Test 2: /api/uretim/{photoId}/{processType} endpoint"
curl -X POST "http://localhost:51511/api/uretim/$PHOTO_ID/background-change" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
