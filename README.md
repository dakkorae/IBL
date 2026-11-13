# IB 학습자를 위한 매일 한 걸음! (IB Learner)

IB 초등학교 5학년 학생들이 **IB 10대 학습자상**을 매일 실천하고 기록하며, 자신의 성장을 한눈에 확인할 수 있는 포트폴리오 대시보드입니다.

2026 IB PYP 학급경영 전략 개발 연구회 사업의 일환으로 제작했습니다.

## 주요 기능

| 화면 | 내용 |
|---|---|
| 종합 대시보드 | 기록 일수·하루 평균 실천 수(평일/주말·공휴일 구분), 기간별 레이더 차트, 대표 강점과 도전이 필요한 학습자상, 날짜별 막대 차트, 최근 일지 |
| 미션 도전 | 10가지 학습자상별 실천 미션 체크, 실천 기록(필수: 체크한 미션 중 하나를 골라 5글자 이상 한 줄 쓰기, 여러 줄 추가 가능), 제출·수정. 체크한 미션이 없는 날은 성찰 한 줄을 쓰면 '성찰하는 사람' 1회로 기록. 미션은 1,000개(영역별 100개) 중 날짜별로 제시되며 영역별 하루 3회까지 바꿀 수 있음 |
| 배지 전당 | 배지 62개: 학습자상 성장(3단계×10), 꾸준함, 고른 성장, 기록, 미션, 깜짝 배지(받기 전까지 조건 비공개). 보통 학생이 1년이면 모두 받을 수 있도록 설계 (`src/badges.ts`) |
| 학습자상 탐구 | 10대 학습자상의 뜻과 실천 팁 |
| 환경 설정 | 화면 테마(색상 6가지 · 글꼴 4가지 · 글자 크기 3단계, 기기별 저장), 학생 정보 입력, 데이터 백업(JSON 내보내기/가져오기), 초기화, 샘플 데이터 불러오기 |

PC·태블릿·휴대폰 화면 크기에 맞춰 배치가 바뀌는 반응형 화면입니다(휴대폰은 하단 탭 바).

그 밖에 날짜 이동·달력, 작성 중 내용 자동 임시저장, 읽기 전용 공유 링크(이름과 누적 통계만 포함)를 지원합니다.

## 데이터 저장 방식

- **기본**: 모든 기록은 사용하는 기기의 브라우저(localStorage)에 저장됩니다.
- **학급 참여 시**: 환경 설정 → 학급 참여에서 학급 코드로 들어오면 기록이 학급 서버(Firebase)에도 저장되어, 다른 기기에서 이어 쓰고 교사가 학급 현황을 볼 수 있습니다. 이메일·이름 없이 학급 코드 + 번호 + 숫자 4자리 비밀번호로 들어옵니다.

## 학급 운영 (교사용)

| 주소 | 용도 |
|---|---|
| `#admin` | 관리자: 학급 개설 코드 발급 |
| `#teacher` | 교사: 학급 개설, 학급 현황(전체 레이더·제출 현황·살펴볼 학생), 학생별 기록, 명단·비밀번호 관리, 학급 삭제 |

서버 연결 방법은 [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md), 보안 규칙은 [firestore.rules](firestore.rules)를 보세요. `VITE_CLOUD_DEMO=1` 로 빌드하면 서버 없이 화면을 살펴볼 수 있는 체험용으로 동작합니다.

## 기술 스택

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · motion · lucide-react · Firebase(Firestore, 익명 로그인)

## 실행 방법

[Node.js](https://nodejs.org/) 20 이상이 필요합니다.

```bash
npm install      # 처음 한 번 패키지 설치
npm run dev      # 개발 서버 실행 → http://localhost:3000
npm run build    # 배포용 빌드 (dist 폴더 생성)
npm run lint     # 타입 검사
```

## 폴더 구조

```
src/
├── App.tsx                  화면 뼈대 (사이드바 + 헤더 + 현재 화면 + 모달)
├── main.tsx                 진입점
├── types.ts                 데이터 형식 정의
├── data.ts                  학습자상 정의, 날짜·공휴일, 통계 계산
├── badges.ts                배지 62개 정의와 획득 조건 판정
├── cloud/                   학급 서버 연결 (Firebase 구현 · 체험용 구현)
├── teacher/                 교사용 페이지
├── admin/                   관리자 페이지 (개설 코드)
├── theme.ts                 화면 테마 설정, 학급 운영 1단계(학급 개설·참여·교사용 페이지) (색상 · 글꼴 · 글자 크기)
├── styles/themes.css        색상 테마별 색표
├── missionsData.ts          실천 미션 1,000개
├── state/
│   └── PortfolioContext.tsx 앱 전체 상태와 동작 (기록, 제출, 백업, 공유 등)
├── storage/
│   └── drafts.ts            작성 중 내용 임시저장
├── views/                   메뉴별 화면
│   ├── DashboardView.tsx
│   ├── MissionView.tsx
│   ├── BadgesView.tsx
│   ├── ProfilesView.tsx
│   └── SettingsView.tsx
└── components/
    ├── layout/              Sidebar, Header, ShareModeBanner
    ├── modals/              축하·배지 획득·달력 모달
    ├── Toast.tsx            알림 메시지
    ├── RadarChart.tsx
    ├── HistoryBarChart.tsx
    └── Confetti.tsx
```

## 이력

- 2026.07 ~ 09: Google AI Studio로 최초 제작 ([IB-learner](https://github.com/dakkorae/IB-learner))
- 2026.11: 이 저장소로 옮겨 Claude Code로 개선 시작 — 화면별 파일 분리, 사용하지 않는 AI Studio·Gemini 관련 코드 정리, 미션 1,000개 새로 구성, 실천 기록 필수화, 반응형 화면, 배지 62개 새로 설계, 화면 테마 설정, 학급 운영 1단계(학급 개설·참여·교사용 페이지)
