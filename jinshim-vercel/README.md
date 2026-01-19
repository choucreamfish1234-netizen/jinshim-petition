# 진심의 무게 - 엄벌 탄원서 작성 도우미

## 📁 프로젝트 구조

```
진심의무게-vercel/
├── api/
│   └── generate.js      # Serverless Function (OpenAI API)
├── public/
│   └── index.html       # 프론트엔드
├── package.json
├── vercel.json
└── README.md
```

## 🚀 Vercel 배포 방법

### 1단계: Vercel 가입 및 프로젝트 생성

1. [Vercel](https://vercel.com) 가입 (GitHub 연동 추천)
2. "Add New Project" 클릭

### 2단계: GitHub 연결 또는 직접 업로드

**방법 A: GitHub 연결 (추천)**
1. 이 폴더를 GitHub 레포지토리에 푸시
2. Vercel에서 해당 레포지토리 선택
3. "Import" 클릭

**방법 B: Vercel CLI**
```bash
npm i -g vercel
cd 진심의무게-vercel
vercel
```

### 3단계: 환경변수 설정 ⚠️ 중요!

Vercel 대시보드에서:
1. 프로젝트 선택 → Settings → Environment Variables
2. 다음 변수 추가:

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | `sk-your-api-key-here` |

**주의:** Environment 선택 시 `Production`, `Preview`, `Development` 모두 체크

### 4단계: 재배포

환경변수 설정 후:
1. Deployments 탭 이동
2. 최신 배포 옆 "..." 클릭
3. "Redeploy" 선택

---

## ⚙️ 기능 설명

### 사용량 제한
- **1인당 하루 3회 무료**
- 서버 측 IP 기반 + 클라이언트 localStorage 이중 체크
- 초과 시 "전문가 검토" 모달 자동 표시

### API 보안
- OpenAI API 키는 Vercel 환경변수에만 저장
- 클라이언트에서 키 접근 불가
- 서버리스 함수가 중계 역할

### 검토 패키지
| 등급 | 가격 | 내용 | 소요시간 |
|------|------|------|----------|
| 🥉 기본 | 33,000원 | 형식/오탈자 검토 | 24시간 |
| 🥈 정밀 | 77,000원 | 내용 보완 + 코멘트 | 12시간 |
| 🥇 프리미엄 | 165,000원 | 검토 + 전화상담 15분 | 6시간 |
| 💎 VIP | 330,000원 | 완전 재작성 + 상담 | 당일 |

---

## 💰 예상 비용

### OpenAI API (GPT-4o)
- 1회 생성: ~$0.02 (약 27원)
- 100회/월: ~2,700원
- 1,000회/월: ~27,000원

### Vercel
- **무료 플랜**: 100GB 대역폭, 충분한 서버리스 호출
- 소규모~중규모 서비스는 무료로 운영 가능

---

## 🔧 커스터마이징

### 일일 제한 횟수 변경
`api/generate.js` 파일에서:
```javascript
const DAILY_LIMIT = 3;  // 원하는 횟수로 변경
```

### 카카오톡 채널 변경
`public/index.html`에서 `pf.kakao.com/_YxgWxcn` 검색 후 본인 채널 ID로 변경

---

## 🆘 문제 해결

### "Server configuration error"
→ 환경변수 `OPENAI_API_KEY`가 설정되지 않음

### API 호출 실패
→ Vercel 대시보드 → Functions → Logs에서 오류 확인

### CORS 오류
→ `api/generate.js`의 CORS 헤더 확인

---

## 📞 문의

법률 자문 협력: 법률사무소 로앤이
