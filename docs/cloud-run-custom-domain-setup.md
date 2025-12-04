# Cloud Run 커스텀 도메인 설정 가이드

## 개요
이 문서는 Google Cloud Run에 배포된 서비스에 커스텀 도메인(예: distilledchild.space)을 연결하는 전체 과정을 설명합니다.

## 목차
1. [사전 준비](#사전-준비)
2. [Cloud Run에서 도메인 매핑](#1-cloud-run에서-도메인-매핑)
3. [도메인 소유권 인증](#2-도메인-소유권-인증)
4. [DNS 레코드 설정](#3-dns-레코드-설정-namecheap)
5. [SSL 인증서 발급 대기](#4-ssl-인증서-발급-대기)
6. [확인 및 테스트](#5-확인-및-테스트)
7. [트러블슈팅](#트러블슈팅)

---

## 사전 준비

### 필요한 것
- ✅ Google Cloud Platform 계정
- ✅ Cloud Run에 배포된 서비스
- ✅ 등록된 도메인 (예: Namecheap, GoDaddy 등)
- ✅ 도메인 관리 권한 (DNS 레코드 수정 가능)

### 예상 소요 시간
- 설정 작업: 10-15분
- DNS 전파 및 SSL 인증서 발급: 20분~1시간
- **총 소요 시간: 약 1시간**

---

## 1. Cloud Run에서 도메인 매핑

### 단계별 진행

1. **Google Cloud Console 접속**
   ```
   https://console.cloud.google.com/run
   ```

2. **서비스 선택**
   - 커스텀 도메인을 연결할 Cloud Run 서비스 클릭

3. **Domain Mappings 탭 이동**
   - 상단 탭에서 "Domain Mappings" 또는 "도메인 관리" 선택

4. **도메인 추가**
   - "Add Mapping" 또는 "매핑 추가" 버튼 클릭
   - 도메인 입력:
     - `distilledchild.space` (루트 도메인)
     - 또는 `www.distilledchild.space` (www 서브도메인)
     - 또는 둘 다

5. **계속 진행**
   - "Continue" 클릭

---

## 2. 도메인 소유권 인증

### 인증이 필요한 이유
Google은 아무나 다른 사람의 도메인을 사용하지 못하도록, 도메인 소유자임을 증명하도록 요구합니다.

### 인증 방법

#### 옵션 1: Google Search Console 사용 (권장)
1. Google Search Console에 이미 도메인이 등록되어 있으면 자동 인증
2. 등록되지 않았다면 Search Console에서 도메인 추가 및 인증

#### 옵션 2: TXT 레코드 추가
1. Cloud Run이 제공하는 TXT 레코드 값 복사
2. 도메인 제공업체(Namecheap 등)의 DNS 설정에서 TXT 레코드 추가
   ```
   Type: TXT Record
   Host: @
   Value: google-site-verification=xxxxxxxxxxxx
   TTL: Automatic
   ```
3. 저장 후 "Verify" 버튼 클릭

### 인증 완료 확인
- ✅ "Domain verified" 메시지 표시
- 다음 단계로 진행 가능

---

## 3. DNS 레코드 설정 (Namecheap)

### Cloud Run이 제공하는 DNS 정보 확인

도메인 인증 후, Cloud Run은 다음과 같은 DNS 레코드 설정을 요구합니다:

```
A Record:
Name/Host: @
Value: 216.239.32.21 (Google Load Balancer IP)

CNAME Record:
Name/Host: www
Value: ghs.googlehosted.com
```

> **참고:** IP 주소는 Google이 제공하는 값이며, 프로젝트마다 다를 수 있습니다.

### Namecheap에서 DNS 레코드 추가

#### 1. Namecheap 로그인 및 도메인 관리 페이지 이동
```
Namecheap Dashboard → Domain List → 해당 도메인 선택 → "Manage" 클릭
```

#### 2. Advanced DNS 탭 이동
```
상단 탭에서 "Advanced DNS" 클릭
```

#### 3. A Record 추가/수정
```
Type: A Record
Host: @
Value: 216.239.32.21
TTL: Automatic
```

**설명:**
- `@` = 루트 도메인 (distilledchild.space)
- `216.239.32.21` = Google Load Balancer IP
- 이미 A Record가 있다면 Value만 수정

#### 4. CNAME Record 추가/수정
```
Type: CNAME Record
Host: www
Value: ghs.googlehosted.com.
TTL: Automatic
```

**설명:**
- `www` = www 서브도메인 (www.distilledchild.space)
- `ghs.googlehosted.com` = Google Hosted Service
- 끝에 점(`.`)이 자동으로 추가될 수 있음 (정상)

#### 5. 저장
- "Save Changes" 또는 체크 버튼(✓) 클릭

### 최종 DNS 레코드 확인

설정 완료 후 다음과 같이 표시되어야 합니다:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 216.239.32.21 | Automatic |
| CNAME Record | www | ghs.googlehosted.com. | Automatic |

---

## 4. SSL 인증서 발급 대기

### Cloud Run 상태 확인

DNS 레코드 설정 후 Cloud Run Console로 돌아가면 다음 메시지가 표시됩니다:

```
⏳ Waiting for certificate provisioning.
   You must configure your DNS records for certificate issuance to begin.
```

### 자동 진행 과정

1. **DNS 전파** (5-30분)
   - Namecheap DNS 서버에서 전 세계 DNS 서버로 변경사항 전파
   - 지역에 따라 전파 속도 상이

2. **Google DNS 확인** (자동)
   - Google이 설정한 DNS 레코드가 올바른지 확인

3. **SSL 인증서 발급** (10-20분)
   - Let's Encrypt를 통해 무료 SSL 인증서 자동 발급
   - Google이 자동으로 처리

4. **인증서 설치 완료**
   - Cloud Run에 인증서 자동 설치
   - HTTPS 접속 가능

### 예상 총 소요 시간
- **최소:** 20분
- **평균:** 30분~1시간
- **최대:** 48시간 (드물게)

---

## 5. 확인 및 테스트

### DNS 전파 확인

터미널에서 다음 명령어로 DNS 전파 상태 확인:

```bash
# 루트 도메인 확인
nslookup distilledchild.space

# www 서브도메인 확인
nslookup www.distilledchild.space
```

**성공 시 결과:**
```bash
$ nslookup www.distilledchild.space
Server:		8.8.8.8
Address:	8.8.8.8#53

Non-authoritative answer:
www.distilledchild.space	canonical name = ghs.googlehosted.com.
Name:	ghs.googlehosted.com
Address: 216.239.32.21
```

### 대체 확인 방법 (dig 명령어)

```bash
dig distilledchild.space
dig www.distilledchild.space
```

### SSL 인증서 발급 완료 확인

Cloud Run Console에서 다음 상태 확인:

```
✅ Active
   SSL certificate provisioned
   Domain mapping active
```

### 브라우저 테스트

1. **HTTPS 접속 테스트**
   ```
   https://distilledchild.space
   https://www.distilledchild.space
   ```

2. **HTTP 자동 리다이렉트 확인**
   ```
   http://distilledchild.space → https://distilledchild.space
   http://www.distilledchild.space → https://www.distilledchild.space
   ```

3. **SSL 인증서 확인**
   - 브라우저 주소창의 자물쇠 아이콘 클릭
   - 인증서 정보 확인: Let's Encrypt 발급

---

## 트러블슈팅

### 문제 1: "Waiting for certificate provisioning" 메시지가 계속 표시됨

**원인:**
- DNS 레코드가 아직 전파되지 않음
- DNS 레코드 설정 오류

**해결 방법:**
1. Namecheap DNS 설정 재확인
   ```
   A Record: @ → 216.239.32.21
   CNAME Record: www → ghs.googlehosted.com
   ```

2. DNS 전파 확인
   ```bash
   nslookup www.distilledchild.space
   ```

3. 최대 48시간 대기 (보통 30분~1시간)

---

### 문제 2: "DNS configuration error" 표시

**원인:**
- 잘못된 A Record 또는 CNAME Record 값
- 루트 도메인(@)에 CNAME과 A Record가 동시에 존재

**해결 방법:**
1. 동일한 Host에 중복 레코드 제거
   - `@`에는 **A Record만**
   - `www`에는 **CNAME Record만**

2. 올바른 값 재확인
   - Cloud Run Console에서 제공한 정확한 IP와 도메인 사용

---

### 문제 3: DNS 전파가 너무 느림

**확인 방법:**
- 온라인 DNS 전파 체크 도구 사용
  ```
  https://www.whatsmydns.net/
  ```

**해결 방법:**
1. TTL을 낮게 설정 (예: 300초)
2. 로컬 DNS 캐시 플러시
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

---

### 문제 4: 일부 지역에서만 접속 안 됨

**원인:**
- DNS 전파가 일부 지역에서 완료되지 않음

**해결 방법:**
- 추가 대기 (DNS 전파는 지역별로 시차 있음)
- 다른 네트워크에서 테스트 (모바일 데이터, VPN 등)

---

### 문제 5: 브라우저에서 "Connection refused" 오류

**원인:**
- Cloud Run 서비스가 실행 중이 아님
- Ingress 설정이 잘못됨

**해결 방법:**
1. Cloud Run 서비스 상태 확인
   ```
   Console → Cloud Run → 서비스 선택 → 상태 확인
   ```

2. Ingress 설정 확인
   ```
   Settings → Ingress → "All" 또는 "Internal and Cloud Load Balancing" 선택
   ```

---

## 참고 정보

### DNS 레코드 타입 설명

#### A Record
- **목적:** 도메인을 IPv4 주소로 연결
- **사용:** 루트 도메인 (예: distilledchild.space)
- **예시:** `distilledchild.space → 216.239.32.21`

#### CNAME Record
- **목적:** 도메인을 다른 도메인으로 연결 (별칭)
- **사용:** 서브도메인 (예: www.distilledchild.space)
- **예시:** `www.distilledchild.space → ghs.googlehosted.com`
- **제약:** 루트 도메인(@)에는 사용 불가

#### TXT Record
- **목적:** 텍스트 정보 저장 (주로 인증용)
- **사용:** 도메인 소유권 인증, SPF, DKIM 등
- **예시:** `google-site-verification=xxxxxxxxxxxx`

---

### Google Cloud Run Load Balancer IP

Google Cloud Run은 여러 Load Balancer IP를 제공합니다:

```
216.239.32.21
216.239.34.21
216.239.36.21
216.239.38.21
```

**참고:**
- Cloud Run Console에서 제공하는 IP를 사용하세요
- 대부분의 경우 `216.239.32.21` 사용

---

### SSL 인증서 갱신

**자동 갱신:**
- Google이 Let's Encrypt를 통해 자동으로 갱신
- 만료 전 자동 갱신 (사용자 조치 불필요)
- 인증서 유효 기간: 90일

**갱신 실패 시:**
- Cloud Run Console에서 알림 표시
- DNS 레코드가 올바른지 확인
- 문제 해결 후 자동으로 재시도

---

### 비용

**Cloud Run 커스텀 도메인:**
- 도메인 매핑: **무료**
- SSL 인증서: **무료** (Let's Encrypt)
- Load Balancer: **무료** (Cloud Run 포함)

**도메인 등록:**
- Namecheap, GoDaddy 등에서 연간 비용 발생 (서비스 제공업체마다 상이)

**Cloud Run 서비스:**
- 요청 수, CPU, 메모리 사용량에 따라 과금
- 매월 200만 요청 무료 (Free Tier)

---

## 요약 체크리스트

### Cloud Run 설정
- [ ] Cloud Run Console에서 서비스 선택
- [ ] Domain Mappings 탭에서 도메인 추가
- [ ] 도메인 소유권 인증 (Verify)
- [ ] DNS 레코드 정보 확인 (A, CNAME)

### Namecheap 설정
- [ ] Advanced DNS 탭 이동
- [ ] A Record 추가: `@ → 216.239.32.21`
- [ ] CNAME Record 추가: `www → ghs.googlehosted.com`
- [ ] 변경사항 저장

### 확인 및 테스트
- [ ] DNS 전파 확인 (`nslookup`, `dig`)
- [ ] SSL 인증서 발급 대기 (20분~1시간)
- [ ] Cloud Run Console에서 "Active" 상태 확인
- [ ] 브라우저에서 HTTPS 접속 테스트
- [ ] HTTP → HTTPS 자동 리다이렉트 확인

---

## 추가 자료

### 공식 문서
- [Google Cloud Run - Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Namecheap - DNS Management](https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain/)

### DNS 전파 체크 도구
- [WhatsMyDNS](https://www.whatsmydns.net/)
- [DNS Checker](https://dnschecker.org/)

### SSL 인증서 확인 도구
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

---

## 문서 히스토리

- **2025-12-04:** 초기 문서 작성 (distilledchild.space 커스텀 도메인 설정 과정 기록)

---

## 문의 및 피드백

문제가 발생하거나 추가 질문이 있으면 Google Cloud Support 또는 도메인 제공업체에 문의하세요.
