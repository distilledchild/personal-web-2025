# Cloud Run 자동 배포 가이드

## 개요
이 문서는 GitHub에 코드를 푸시하면 자동으로 Cloud Run에 배포되는 CI/CD 파이프라인 구축 방법을 설명합니다.

## 목차
1. [배포 방법 비교](#배포-방법-비교)
2. [Cloud Build 자동 배포 (권장)](#cloud-build-자동-배포-권장)
3. [GitHub Actions 자동 배포](#github-actions-자동-배포)
4. [로컬 수동 배포](#로컬-수동-배포)
5. [비용 분석](#비용-분석)
6. [트러블슈팅](#트러블슈팅)

---

## 배포 방법 비교

### 방법 1: Cloud Build (권장)
```
✅ 무료: 120분/일 (개인 프로젝트 충분)
✅ GCP 네이티브 통합 (권한 관리 쉬움)
✅ 설정 간단 (cloudbuild.yaml)
✅ 빌드 속도 빠름
✅ GitHub 연동 가능

비용: $0 (무료 tier 범위 내)
설정 시간: 10-15분
```

### 방법 2: GitHub Actions
```
✅ 무료: 2,000분/월 (Private repo)
✅ 무제한 (Public repo)
✅ GitHub에서 모든 것 관리
✅ 다른 CI/CD 도구와 통합 쉬움

⚠️ GCP 인증 설정 필요 (Service Account)

비용: $0
설정 시간: 15-20분
```

### 방법 3: 로컬 수동 배포
```
✅ 무료: 100%
✅ 설정 간단
✅ 즉시 실행 가능

⚠️ 자동화 없음 (수동 실행 필요)

비용: $0
설정 시간: 5분
```

---

## Cloud Build 자동 배포 (권장)

### 워크플로우
```
1. 로컬에서 코드 수정
   ↓
2. git add . && git commit -m "Update"
   ↓
3. git push origin main
   ↓
4. Cloud Build 자동 실행
   - Docker 이미지 빌드
   - Google Container Registry로 푸시
   - Cloud Run에 배포
   ↓
5. 배포 완료! 🎉
```

### 1. 사전 준비

#### 필요한 것
- ✅ Google Cloud Platform 프로젝트
- ✅ Cloud Run 서비스 (이미 배포된 상태)
- ✅ GitHub 저장소
- ✅ 로컬에 Docker 설치

### 2. Cloud Build API 활성화

```bash
# Cloud Build API 활성화
gcloud services enable cloudbuild.googleapis.com

# Artifact Registry API 활성화 (필요시)
gcloud services enable artifactregistry.googleapis.com
```

### 3. Cloud Build 권한 설정

Cloud Build 서비스 계정에 Cloud Run 배포 권한을 부여합니다.

```bash
# 프로젝트 번호 확인
PROJECT_ID="your-project-id"  # 실제 프로젝트 ID로 변경
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"

# Cloud Run Admin 권한 부여
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

# Service Account User 권한 부여
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Storage Admin 권한 부여 (GCR 접근용)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### 4. cloudbuild.yaml 파일 확인

프로젝트에 이미 `server/cloudbuild.yaml` 파일이 있습니다:

```yaml
steps:
  # Step 1: Docker 이미지 빌드
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/backend:$SHORT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/backend:latest'
      - '.'

  # Step 2: Google Container Registry로 푸시
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/backend:$SHORT_SHA'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/backend:latest'

  # Step 3: Cloud Run에 자동 배포
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/backend:$SHORT_SHA'
      - '--region'
      - 'us-west1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/backend:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/backend:latest'

options:
  logging: CLOUD_LOGGING_ONLY
```

**변수 설명:**
- `$PROJECT_ID`: GCP 프로젝트 ID (자동 치환)
- `$SHORT_SHA`: Git 커밋 해시 앞 7자리 (자동 치환)
- `backend`: Cloud Run 서비스 이름
- `us-west1`: Cloud Run 리전

**필요 시 수정:**
- 서비스 이름: `backend` → 다른 이름
- 리전: `us-west1` → `asia-northeast3` (서울) 등
- 환경 변수 추가:
  ```yaml
  - '--set-env-vars'
  - 'NODE_ENV=production,OTHER_VAR=value'
  ```

### 5. GitHub 저장소 연결

#### 방법 A: Cloud Console에서 연결 (추천, 더 쉬움)

1. **Google Cloud Console 접속**
   ```
   https://console.cloud.google.com/cloud-build/triggers
   ```

2. **프로젝트 선택**

3. **"CREATE TRIGGER" 버튼 클릭**

4. **Trigger 설정:**
   ```
   Name: deploy-backend
   Description: Deploy backend to Cloud Run on push to main
   Event: Push to a branch
   Source:
     - Click "CONNECT REPOSITORY"
     - Select "GitHub (Cloud Build GitHub App)"
     - Authenticate GitHub
     - Select your repository: personal-web-2025
   Branch: ^main$
   Build Configuration: Cloud Build configuration file (yaml or json)
   Cloud Build configuration file location: server/cloudbuild.yaml
   ```

5. **"CREATE" 버튼 클릭**

#### 방법 B: gcloud 명령어로 연결

```bash
# GitHub 저장소 연결 및 Trigger 생성
gcloud builds triggers create github \
  --repo-name=personal-web-2025 \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=server/cloudbuild.yaml \
  --description="Deploy backend to Cloud Run"
```

**참고:** 처음 실행 시 GitHub 인증 필요

### 6. 테스트

#### 코드 수정 및 푸시
```bash
# 1. 코드 수정 (예: server/index.js)
echo "console.log('test deploy');" >> server/index.js

# 2. Git 커밋 및 푸시
git add .
git commit -m "Test auto deploy"
git push origin main
```

#### 빌드 상태 확인

**Cloud Console에서 확인:**
```
https://console.cloud.google.com/cloud-build/builds
```

**터미널에서 확인:**
```bash
# 최근 빌드 목록 확인
gcloud builds list --limit=5

# 특정 빌드 로그 확인
gcloud builds log BUILD_ID --stream
```

#### 배포 확인

```bash
# Cloud Run 서비스 상태 확인
gcloud run services describe backend --region=us-west1

# 서비스 URL 확인
gcloud run services describe backend \
  --region=us-west1 \
  --format='value(status.url)'
```

브라우저에서 접속 테스트:
```
https://your-service-url/api/health
```

### 7. 빌드 히스토리 및 로그

#### Cloud Console에서 확인
```
https://console.cloud.google.com/cloud-build/builds
```

- ✅ 성공한 빌드: 녹색 체크
- ❌ 실패한 빌드: 빨간색 X
- 각 빌드 클릭하면 상세 로그 확인 가능

#### 터미널에서 확인
```bash
# 최근 빌드 목록
gcloud builds list --limit=10

# 특정 빌드 상세 정보
gcloud builds describe BUILD_ID

# 빌드 로그 스트리밍
gcloud builds log BUILD_ID --stream
```

### 8. 환경 변수 추가 (선택)

`cloudbuild.yaml`에서 환경 변수를 추가할 수 있습니다:

```yaml
steps:
  # ... 기존 steps ...

  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/backend:$SHORT_SHA'
      - '--region'
      - 'us-west1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'NODE_ENV=production,MONGO_URI=$$MONGO_URI,JWT_SECRET=$$JWT_SECRET'
    secretEnv: ['MONGO_URI', 'JWT_SECRET']

# Secret Manager에서 비밀 가져오기
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/MONGO_URI/versions/latest
      env: 'MONGO_URI'
    - versionName: projects/$PROJECT_ID/secrets/JWT_SECRET/versions/latest
      env: 'JWT_SECRET'
```

**Secret Manager에 비밀 저장:**
```bash
# Secret 생성
echo -n "mongodb://..." | gcloud secrets create MONGO_URI --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-

# Cloud Build에 Secret 접근 권한 부여
gcloud secrets add-iam-policy-binding MONGO_URI \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 9. 특정 폴더 변경 시에만 빌드 (선택)

`server/` 폴더 변경 시에만 빌드하도록 Trigger 설정:

**Cloud Console에서:**
1. Cloud Build → Triggers → 해당 Trigger 선택 → EDIT
2. "Included files filter (glob)" 추가:
   ```
   server/**
   ```

**gcloud 명령어:**
```bash
gcloud builds triggers update TRIGGER_NAME \
  --included-files="server/**"
```

---

## GitHub Actions 자동 배포

### 워크플로우
```
1. 로컬에서 코드 수정
   ↓
2. git push origin main
   ↓
3. GitHub Actions 실행
   - Docker 이미지 빌드
   - GCR 푸시
   - Cloud Run 배포
   ↓
4. 완료!
```

### 1. GCP Service Account 생성

```bash
# Service Account 생성
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Cloud Run Admin 권한
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Storage Admin 권한 (GCR 접근)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Service Account User 권한
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# JSON 키 생성
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 2. GitHub Secret 추가

1. **GitHub Repository → Settings → Secrets and variables → Actions**
2. **"New repository secret" 클릭**
3. **Secret 추가:**
   ```
   Name: GCP_SA_KEY
   Value: key.json 파일 내용 전체 복사/붙여넣기
   ```
4. **"Add secret" 클릭**

### 3. GitHub Actions Workflow 파일 확인

프로젝트에 이미 `.github/workflows/deploy-backend.yml` 파일이 있습니다:

```yaml
name: Deploy Backend to Cloud Run

on:
  push:
    branches:
      - main
    paths:
      - 'server/**'
      - '.github/workflows/deploy-backend.yml'

env:
  PROJECT_ID: YOUR_GCP_PROJECT_ID  # ⚠️ 실제 프로젝트 ID로 변경
  SERVICE_NAME: backend
  REGION: us-west1

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Configure Docker to use gcloud
        run: gcloud auth configure-docker

      - name: Build Docker image
        run: |
          docker build -t gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }} ./server
          docker tag gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }} gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:latest

      - name: Push to Google Container Registry
        run: |
          docker push gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }}
          docker push gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --image gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "NODE_ENV=production"

      - name: Get Service URL
        run: |
          SERVICE_URL=$(gcloud run services describe ${{ env.SERVICE_NAME }} \
            --region ${{ env.REGION }} \
            --format 'value(status.url)')
          echo "Service deployed at: $SERVICE_URL"
```

**⚠️ 중요: `PROJECT_ID`를 실제 프로젝트 ID로 변경하세요!**

### 4. 테스트

```bash
# 코드 수정 및 푸시
git add .
git commit -m "Test GitHub Actions deploy"
git push origin main
```

**빌드 확인:**
- GitHub Repository → Actions 탭
- 실행 중인 워크플로우 확인

---

## 로컬 수동 배포

### 1. deploy.sh 스크립트 사용

프로젝트에 이미 `server/deploy.sh` 파일이 있습니다:

```bash
#!/bin/bash

# Cloud Run 배포 스크립트

set -e

# 변수 설정
PROJECT_ID="YOUR_GCP_PROJECT_ID"  # ⚠️ 실제 프로젝트 ID로 변경
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
```

### 2. 스크립트 수정 및 실행

```bash
# 1. PROJECT_ID 수정
# server/deploy.sh 파일을 열어서 YOUR_GCP_PROJECT_ID를 실제 값으로 변경

# 2. 실행 권한 부여
chmod +x server/deploy.sh

# 3. 배포 실행
cd server
./deploy.sh
```

### 3. 간단한 명령어로 배포

스크립트 없이 직접 명령어 실행:

```bash
cd server

# 1. Docker 이미지 빌드
docker build -t gcr.io/YOUR_PROJECT_ID/backend:latest .

# 2. GCR로 푸시
docker push gcr.io/YOUR_PROJECT_ID/backend:latest

# 3. Cloud Run 배포
gcloud run deploy backend \
  --image gcr.io/YOUR_PROJECT_ID/backend:latest \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated
```

---

## 비용 분석

### Cloud Build (권장)

#### 무료 tier
```
✅ 빌드 시간: 120분/일 (무료)
✅ 약 24-40회 배포/일 가능 (1회 빌드 3-5분 기준)
```

#### 실제 사용량 (개인 프로젝트)
```
📊 예상 배포 횟수:
- 개발 중: 1-3회/일
- 안정기: 1-2회/주

📊 예상 빌드 시간:
- 3회/일 × 5분 = 15분/일
- 무료 한도: 120분/일
- 사용률: 12.5% ✅

결론: 100% 무료 범위 내에서 사용 가능!
```

#### 초과 시 비용
```
💰 $0.003/분 (빌드 시간 초과분)

예: 하루 200분 사용 시
- 무료: 120분
- 유료: 80분 × $0.003 = $0.24/일 = $7.20/월
```

### GitHub Actions

#### 무료 tier
```
✅ Public repo: 무제한 무료
✅ Private repo: 2,000분/월 무료
```

#### 초과 시 비용 (Private repo)
```
💰 $0.008/분

예: 월 3,000분 사용 시
- 무료: 2,000분
- 유료: 1,000분 × $0.008 = $8/월
```

### 로컬 수동 배포
```
✅ 비용: $0 (완전 무료)
⚠️ 자동화 없음
```

### Cloud Run 실행 비용
```
무료 tier (매월):
- 요청: 200만 건
- CPU: 180,000 vCPU-초
- 메모리: 360,000 GiB-초
- 네트워크 송신: 1GB

개인 프로젝트는 대부분 무료 범위 내!
```

---

## 트러블슈팅

### 문제 1: Cloud Build 권한 오류

**에러 메시지:**
```
ERROR: (gcloud.run.deploy) PERMISSION_DENIED: Permission 'run.services.update' denied
```

**해결 방법:**
```bash
# Cloud Build 서비스 계정에 권한 부여
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

---

### 문제 2: GitHub 연동 실패

**에러 메시지:**
```
ERROR: Repository not found
```

**해결 방법:**
1. GitHub App 재인증:
   ```
   https://console.cloud.google.com/cloud-build/triggers
   ```
2. "CONNECT REPOSITORY" 클릭
3. GitHub 재인증 및 저장소 선택

---

### 문제 3: Docker 빌드 실패

**에러 메시지:**
```
ERROR: failed to solve with frontend dockerfile.v0
```

**원인:**
- Dockerfile 문법 오류
- 파일 경로 오류
- 의존성 설치 실패

**해결 방법:**
1. 로컬에서 Docker 빌드 테스트:
   ```bash
   cd server
   docker build -t test:latest .
   ```

2. Dockerfile 확인:
   - `COPY` 명령어 경로 확인
   - `package.json` 존재 여부 확인
   - Node.js 버전 확인

3. `.dockerignore` 확인:
   ```
   node_modules
   npm-debug.log
   .env
   .git
   ```

---

### 문제 4: Cloud Run 배포 타임아웃

**에러 메시지:**
```
ERROR: Revision failed to become ready
```

**원인:**
- 애플리케이션 시작 실패
- 포트 바인딩 오류
- 환경 변수 누락

**해결 방법:**
1. Cloud Run 로그 확인:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit=50
   ```

2. 애플리케이션이 `PORT` 환경 변수 사용하는지 확인:
   ```javascript
   const PORT = process.env.PORT || 3001;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

3. 헬스체크 엔드포인트 추가:
   ```javascript
   app.get('/health', (req, res) => {
     res.status(200).send('OK');
   });
   ```

---

### 문제 5: GitHub Actions에서 GCP 인증 실패

**에러 메시지:**
```
Error: google-github-actions/auth failed with: retry function failed after 3 attempts
```

**해결 방법:**
1. Service Account 키 재확인:
   ```bash
   cat key.json
   ```

2. GitHub Secret 재등록:
   - Repository → Settings → Secrets → GCP_SA_KEY 삭제
   - `key.json` 전체 내용 복사하여 재등록

3. Service Account 권한 확인:
   ```bash
   gcloud projects get-iam-policy YOUR_PROJECT_ID \
     --flatten="bindings[].members" \
     --filter="bindings.members:github-actions@*"
   ```

---

### 문제 6: 빌드는 성공하지만 배포 안 됨

**증상:**
- Cloud Build 빌드 성공 ✅
- 하지만 Cloud Run 서비스가 업데이트되지 않음

**원인:**
- 이미지가 푸시되었지만 배포 단계 실패
- Cloud Run 서비스 이름 불일치

**해결 방법:**
1. Cloud Build 로그 확인:
   ```bash
   gcloud builds list --limit=1
   gcloud builds log BUILD_ID
   ```

2. `cloudbuild.yaml`에서 서비스 이름 확인:
   ```yaml
   - name: 'gcr.io/cloud-builders/gcloud'
     args:
       - 'run'
       - 'deploy'
       - 'backend'  # ← 실제 Cloud Run 서비스 이름과 일치해야 함
   ```

3. Cloud Run 서비스 목록 확인:
   ```bash
   gcloud run services list
   ```

---

### 문제 7: 환경 변수가 적용되지 않음

**증상:**
- 배포는 성공하지만 애플리케이션에서 환경 변수를 읽지 못함

**해결 방법:**
1. Cloud Run 서비스의 환경 변수 확인:
   ```bash
   gcloud run services describe backend --region=us-west1 --format=yaml
   ```

2. `cloudbuild.yaml`에 환경 변수 추가:
   ```yaml
   - '--set-env-vars'
   - 'NODE_ENV=production,MONGO_URI=your-mongo-uri'
   ```

3. Secret Manager 사용 (민감한 정보):
   ```yaml
   secretEnv: ['MONGO_URI', 'JWT_SECRET']

   availableSecrets:
     secretManager:
       - versionName: projects/$PROJECT_ID/secrets/MONGO_URI/versions/latest
         env: 'MONGO_URI'
   ```

---

### 문제 8: 이전 이미지가 계속 배포됨

**증상:**
- 새 코드를 푸시했는데 이전 버전이 배포됨

**원인:**
- Docker 이미지 캐시
- GCR에 이미지가 푸시되지 않음
- `:latest` 태그만 사용

**해결 방법:**
1. 커밋 SHA를 이미지 태그로 사용 (이미 `cloudbuild.yaml`에 적용됨):
   ```yaml
   - 'gcr.io/$PROJECT_ID/backend:$SHORT_SHA'  # ✅ 커밋별 고유 태그
   ```

2. GCR에서 이미지 확인:
   ```bash
   gcloud container images list-tags gcr.io/YOUR_PROJECT_ID/backend
   ```

3. 특정 이미지로 재배포:
   ```bash
   gcloud run deploy backend \
     --image gcr.io/YOUR_PROJECT_ID/backend:abc1234 \
     --region us-west1
   ```

---

### 로그 확인 방법

#### Cloud Build 로그
```bash
# 최근 빌드 목록
gcloud builds list --limit=10

# 특정 빌드 로그
gcloud builds log BUILD_ID --stream

# Cloud Console
https://console.cloud.google.com/cloud-build/builds
```

#### Cloud Run 로그
```bash
# 실시간 로그 스트리밍
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=backend" \
  --limit=50 \
  --format=json \
  --freshness=1h

# Cloud Console
https://console.cloud.google.com/run
# → 서비스 선택 → LOGS 탭
```

#### GitHub Actions 로그
```
GitHub Repository → Actions 탭 → 워크플로우 선택 → 각 Step 클릭
```

---

## 추가 최적화

### 1. 빌드 속도 향상

#### Docker 멀티스테이지 빌드 사용

`server/Dockerfile` 최적화:

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# 필요 시 빌드 스크립트 실행
# RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app .

EXPOSE 3001
CMD ["node", "index.js"]
```

#### Docker Layer 캐싱

`cloudbuild.yaml`에 캐시 추가:

```yaml
options:
  machineType: 'E2_HIGHCPU_8'  # 빌드 속도 향상
  logging: CLOUD_LOGGING_ONLY
```

### 2. 배포 알림 설정

#### Slack 알림 추가

`cloudbuild.yaml`에 추가:

```yaml
steps:
  # ... 기존 steps ...

  # Slack 알림
  - name: 'gcr.io/cloud-builders/curl'
    args:
      - '-X'
      - 'POST'
      - '-H'
      - 'Content-Type: application/json'
      - '-d'
      - '{"text":"✅ Backend deployed successfully! Image: gcr.io/$PROJECT_ID/backend:$SHORT_SHA"}'
      - 'YOUR_SLACK_WEBHOOK_URL'
```

### 3. Rollback 전략

#### 이전 버전으로 롤백

```bash
# 이전 이미지 확인
gcloud container images list-tags gcr.io/YOUR_PROJECT_ID/backend

# 특정 버전으로 롤백
gcloud run deploy backend \
  --image gcr.io/YOUR_PROJECT_ID/backend:PREVIOUS_SHA \
  --region us-west1
```

#### 트래픽 분할 (Blue-Green 배포)

```bash
# 새 버전 배포 (트래픽 0%)
gcloud run deploy backend \
  --image gcr.io/YOUR_PROJECT_ID/backend:NEW_SHA \
  --region us-west1 \
  --no-traffic \
  --tag=new

# 트래픽 점진적 이동
gcloud run services update-traffic backend \
  --region us-west1 \
  --to-revisions=new=10,LATEST=90

# 전체 트래픽 이동
gcloud run services update-traffic backend \
  --region us-west1 \
  --to-latest
```

---

## 체크리스트

### Cloud Build 설정 완료 체크리스트

- [ ] Cloud Build API 활성화
- [ ] Cloud Build 서비스 계정 권한 설정 (run.admin, iam.serviceAccountUser)
- [ ] `server/cloudbuild.yaml` 파일 확인
- [ ] GitHub 저장소 연결
- [ ] Trigger 생성 (main 브랜치, server/cloudbuild.yaml)
- [ ] 테스트 배포 실행
- [ ] Cloud Console에서 빌드 성공 확인
- [ ] Cloud Run 서비스 업데이트 확인
- [ ] 브라우저에서 접속 테스트

### GitHub Actions 설정 완료 체크리스트

- [ ] GCP Service Account 생성
- [ ] Service Account에 권한 부여 (run.admin, storage.admin, iam.serviceAccountUser)
- [ ] Service Account JSON 키 생성
- [ ] GitHub Secret에 `GCP_SA_KEY` 추가
- [ ] `.github/workflows/deploy-backend.yml`에서 `PROJECT_ID` 수정
- [ ] 테스트 푸시 실행
- [ ] GitHub Actions 탭에서 워크플로우 성공 확인
- [ ] Cloud Run 서비스 업데이트 확인
- [ ] 브라우저에서 접속 테스트

### 로컬 수동 배포 체크리스트

- [ ] `server/deploy.sh`에서 `PROJECT_ID` 수정
- [ ] 스크립트 실행 권한 부여 (`chmod +x`)
- [ ] Docker Desktop 실행 중 확인
- [ ] gcloud CLI 인증 완료 (`gcloud auth login`)
- [ ] 스크립트 실행 (`./deploy.sh`)
- [ ] 배포 성공 메시지 확인
- [ ] 브라우저에서 접속 테스트

---

## 참고 자료

### 공식 문서
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Container Registry](https://cloud.google.com/container-registry/docs)

### 유용한 명령어
```bash
# Cloud Build
gcloud builds list
gcloud builds describe BUILD_ID
gcloud builds log BUILD_ID --stream

# Cloud Run
gcloud run services list
gcloud run services describe SERVICE_NAME --region=REGION
gcloud run revisions list --service=SERVICE_NAME --region=REGION

# Container Registry
gcloud container images list
gcloud container images list-tags gcr.io/PROJECT_ID/IMAGE_NAME
gcloud container images delete gcr.io/PROJECT_ID/IMAGE_NAME:TAG

# Secret Manager
gcloud secrets create SECRET_NAME --data-file=-
gcloud secrets versions access latest --secret=SECRET_NAME
```

---

## 문서 히스토리

- **2025-12-04:** 초기 문서 작성 (Cloud Build, GitHub Actions, 로컬 배포 방법)

---

## 다음 단계

1. ✅ Cloud Build 자동 배포 설정 완료
2. ✅ 커스텀 도메인 연결 완료 (별도 문서 참조)
3. 📝 프론트엔드 Vercel 배포 (진행 중)
4. 📝 환경 변수 Secret Manager로 마이그레이션 (선택)
5. 📝 모니터링 및 알림 설정 (선택)
