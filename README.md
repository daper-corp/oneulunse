# 오늘 운세

매일 새로운 운세를 확인할 수 있는 무료 모바일 웹앱입니다.

**Live**: https://oneulunse.com

## 주요 기능

- **일일 운세**: 이름과 생년월일 기반으로 매일 다른 운세 제공
- **카테고리별 운세**: 총운, 금전운, 연애운
- **행운 요소**: 행운의 시간, 색상, 번호, 간식
- **오늘의 조언**: 한마디 조언과 주의사항
- **결과 공유**: 카카오톡, 인스타그램, X(트위터) 공유
- **공유 가능한 URL**: 결과 페이지 링크로 다른 사람 운세 확인 가능
- **PWA 지원**: 홈 화면에 추가하여 앱처럼 사용

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **PWA**: Service Worker, Web App Manifest
- **Hosting**: Vercel
- **광고**: Kakao AdFit
- **공유**: Kakao SDK

## 프로젝트 구조

```
oneulunse/
├── index.html          # 메인 SPA
├── css/
│   └── main.css        # 스타일시트
├── js/
│   ├── app.js          # 앱 로직, URL 인코딩/디코딩
│   ├── fortune.js      # 운세 생성 알고리즘
│   └── fortuneData.js  # 운세 데이터 (50+ 항목/카테고리)
├── assets/
│   ├── icons/          # PWA 아이콘 (72-512px)
│   ├── og-image.png    # 소셜 미리보기 이미지
│   └── og-image.svg    # OG 이미지 원본
├── sw.js               # Service Worker
├── manifest.json       # PWA 매니페스트
├── vercel.json         # Vercel 배포 설정
├── robots.txt          # 검색엔진 크롤링 설정
└── sitemap.xml         # 사이트맵
```

## 운세 생성 원리

- 이름 + 생년월일 + 오늘 날짜를 해시하여 시드 생성
- 같은 사람이 같은 날 확인하면 항상 같은 결과
- 다음 날이 되면 새로운 결과

## 로컬 실행

```bash
npx serve
```

브라우저에서 `http://localhost:3000` 접속

## 아이콘 생성

```bash
npm install
node scripts/generate-icons.js      # PWA 아이콘
node scripts/generate-og-image.js   # OG 이미지
node scripts/generate-toss-icon.js  # 토스 앱 아이콘
```

## 배포

Vercel에 연결되어 `main` 브랜치 push 시 자동 배포됩니다.

## 라이선스

MIT
