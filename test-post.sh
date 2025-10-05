#!/bin/bash

echo "🧪 Testing POST /api/generate endpoint..."
echo ""

curl -X POST http://localhost:51511/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-001",
    "userResponses": {
      "sector": "e-commerce",
      "platform": "instagram",
      "style": "modern",
      "mood": "professional",
      "colors": ["#1a365d", "#2d3748", "#ffffff"],
      "additionalDetails": "Ürün fotoğrafı, beyaz arka plan",
      "customTags": ["product", "clean"],
      "additionalNotes": "Yüksek çözünürlükte olsun"
    },
    "uploadedImageBase64": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMzY1ZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfmZI8L3RleHQ+PC9zdmc+",
    "aspectRatio": "1:1",
    "negativePrompt": "low quality, blurry, distorted"
  }'

echo ""
echo ""
echo "✅ Request completed"
