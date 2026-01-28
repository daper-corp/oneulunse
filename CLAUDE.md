# CLAUDE.md

이 파일은 Claude Code가 이 프로젝트를 이해하는 데 필요한 컨텍스트를 제공합니다.

## 프로젝트 개요

"오늘 운세"는 이름과 생년월일을 입력하면 오늘의 운세를 보여주는 모바일 우선 웹앱입니다.
순수 HTML/CSS/JavaScript로 구현되었으며 프레임워크를 사용하지 않습니다.

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `index.html` | SPA 메인 페이지. 3개 화면(입력, 로딩, 결과)을 섹션으로 관리 |
| `js/app.js` | 앱 로직, 화면 전환, URL 인코딩/디코딩, 공유 기능 |
| `js/fortune.js` | 운세 생성 알고리즘. 해시 기반 시드로 일관된 결과 보장 |
| `js/fortuneData.js` | 운세 데이터. 카테고리별 50개 이상 항목 |
| `css/main.css` | 스타일. 모바일 우선, 다크모드 지원 |

## 아키텍처

### 운세 생성 (`js/fortune.js`)
```
시드 = hash(이름 + 생년월일 + 오늘날짜)
각 운세 요소 = selectBySeed(배열, 시드, 오프셋)
```
- 같은 입력 + 같은 날 = 동일 결과
- 오프셋으로 같은 시드에서 다른 요소 선택

### URL 공유 (`js/app.js`)
```
인코딩: btoa(이름|생년월일) → URL-safe Base64
디코딩: URL에서 추출 → atob → 이름, 생년월일 분리
```
- 예: `oneulunse.com/abc123` 형태로 결과 공유

### 화면 구조 (`index.html`)
- `#main-screen`: 이름/생년월일 입력
- `#loading-screen`: 로딩 애니메이션
- `#result-screen`: 운세 결과 표시

## 외부 서비스

- **Kakao SDK**: 카카오톡 공유 (JavaScript 키 필요)
- **Kakao AdFit**: 광고 (단위 ID 5개 설정됨)
- **Vercel**: 호스팅 및 자동 배포

## 개발 명령어

```bash
# 로컬 서버 실행
npx serve

# 아이콘 생성 (sharp 필요)
node scripts/generate-icons.js
node scripts/generate-og-image.js
```

## 주의사항

- 생년월일 입력 형식: `YYYY-MM-DD` (자동 하이픈 삽입)
- PWA 캐시: Service Worker가 정적 파일 캐싱
- 광고 ID: `index.html` 내 AdFit 스크립트에 하드코딩됨
- 카카오 키: `index.html`의 `Kakao.init()`에 설정됨

## 코딩 컨벤션

- 순수 JavaScript (ES6+), 프레임워크 없음
- 한글 주석 사용
- CSS 변수로 색상/여백 관리
- 모바일 우선 반응형 디자인
