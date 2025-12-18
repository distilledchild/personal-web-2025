# SEO: Google 인덱싱 문제 해결 (www 리다이렉트)

## 문제 요약

**날짜:** 2025-12-17  
**상태:** ✅ 해결됨

Google Search Console에서 다음 URL들이 "Page with redirect" 문제로 인해 인덱싱되지 않음:

- `http://www.distilledchild.space/` : Dec 12, 2025
- `http://distilledchild.space/` : Nov 22, 2025  
- `https://distilledchild.space/` : Nov 22, 2025

## 원인 분석

1. **www → non-www 리다이렉트 미설정**
   - `https://www.distilledchild.space`와 `https://distilledchild.space`가 별도 사이트로 취급됨
   - Google이 중복 콘텐츠로 인식하여 인덱싱 거부

2. **Canonical 태그 부재**
   - 대표 URL을 지정하는 canonical 태그가 없었음

3. **Sitemap/robots.txt 미설정**
   - 검색 엔진 크롤러에게 사이트 구조 안내 없음

## 해결 방법

### 1. Vercel Dashboard에서 www 리다이렉트 설정

**경로:** Vercel Dashboard → Project → Settings → Domains

1. `www.distilledchild.space` 클릭
2. "Redirect to another domain" 선택
3. **Status Code:** `308 Permanent Redirect` 선택
4. **Target:** `distilledchild.space` 입력
5. Save

### 2. Canonical 태그 추가 (`index.html`)

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DistilledChild</title>
  <meta name="description" content="DistilledChild - Personal portfolio showcasing research, art, and technology projects." />
  <link rel="canonical" href="https://distilledchild.space/" />
  <!-- ... -->
</head>
```

### 3. Sitemap 생성 (`public/sitemap.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://distilledchild.space/</loc>
    <lastmod>2025-12-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- 모든 URL은 non-www 버전으로 통일 -->
</urlset>
```

### 4. robots.txt 생성 (`public/robots.txt`)

```
User-agent: *
Allow: /

Sitemap: https://distilledchild.space/sitemap.xml
```

### 5. vercel.json 리다이렉트 설정 (백업)

```json
{
    "redirects": [
        {
            "source": "/:path*",
            "has": [
                {
                    "type": "host",
                    "value": "www.distilledchild.space"
                }
            ],
            "destination": "https://distilledchild.space/:path*",
            "permanent": true
        }
    ],
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

> **참고:** Vercel Dashboard의 도메인 설정이 `vercel.json`보다 우선 적용됨

## 검증 결과

```bash
# www → non-www 리다이렉트 확인
$ curl -sI https://www.distilledchild.space | head -5
HTTP/2 308 
location: https://distilledchild.space/

# http → https 리다이렉트 확인
$ curl -sI http://distilledchild.space | head -5
HTTP/1.0 308 Permanent Redirect
Location: https://distilledchild.space/

# Canonical 태그 확인
$ curl -s https://distilledchild.space | grep canonical
<link rel="canonical" href="https://distilledchild.space/" />

# Sitemap 확인
$ curl -s https://distilledchild.space/sitemap.xml | head -5
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://distilledchild.space/</loc>
```

## 최종 URL 구조

| 요청 URL | 응답 | 최종 URL |
|----------|------|----------|
| `http://www.distilledchild.space` | 308 → 308 | `https://distilledchild.space` |
| `http://distilledchild.space` | 308 | `https://distilledchild.space` |
| `https://www.distilledchild.space` | 308 | `https://distilledchild.space` |
| `https://distilledchild.space` | 200 | (정상 서빙) |

## 후속 조치

1. **Google Search Console에서 sitemap 제출**
   - URL: `https://distilledchild.space/sitemap.xml`

2. **URL 검사에서 재인덱싱 요청**
   - `https://distilledchild.space/` 입력 후 "색인 생성 요청"

3. **모니터링**
   - 며칠~1주일 후 인덱싱 상태 확인

## 관련 커밋

- `eaec79d` - SEO: add www→non-www redirect, canonical tag, sitemap, robots.txt; remove Railway config

## 정리 작업

- ❌ 삭제됨: `railway.json`, `server/railway.json`, `server/nixpacks.toml`
- ✅ 유지: `vercel.json` (Vercel 프론트엔드 배포용)

## 참고 자료

- [Vercel Redirects Documentation](https://vercel.com/docs/projects/project-configuration#redirects)
- [Google Search Console - Page with redirect](https://support.google.com/webmasters/answer/7440203)
- [Canonical URL Best Practices](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
