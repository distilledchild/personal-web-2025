#!/bin/bash

# Cloud Run 배포 스크립트

set -e

# 변수 설정
PROJECT_ID="YOUR_GCP_PROJECT_ID"
SERVICE_NAME="backend"
REGION="us-west1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting deployment to Cloud Run..."

# 1. Docker 이미지 빌드
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME}:latest .

# 2. 이미지에 타임스탬프 태그 추가
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:${TIMESTAMP}

# 3. Google Container Registry로 푸시
echo "📤 Pushing to Google Container Registry..."
docker push ${IMAGE_NAME}:latest
docker push ${IMAGE_NAME}:${TIMESTAMP}

# 4. Cloud Run에 배포
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:${TIMESTAMP} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"

# 5. 배포 완료 URL 출력
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --format 'value(status.url)')

echo "✅ Deployment complete!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo "🏷️  Image tag: ${TIMESTAMP}"
