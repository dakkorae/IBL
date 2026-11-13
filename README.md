# IB 학습자를 위한 매일 한 걸음! (IB Learner)

IB 초등학교 5학년 학생들이 **IB 10대 학습자상**을 매일 실천하고 기록하며, 자신의 성장을 한눈에 확인할 수 있는 포트폴리오 대시보드입니다.

2026 IB PYP 학급경영 전략 개발 연구회 사업의 일환으로 제작했습니다.

## 주요 기능

| 화면 | 내용 |
|---|---|
| 종합 대시보드 | 기록 일수·하루 평균 실천 수(평일/주말·공휴일 구분), 기간별 레이더 차트, 대표 강점과 도전이 필요한 학습자상, 날짜별 막대 차트, 최근 일지 |
| 미션 도전 | 10가지 학습자상별 실천 미션 체크, 하루 메모, 제출·수정. 미션은 1,000개(영역별 100개) 중 날짜별로 제시되며 영역별 하루 3회까지 바꿀 수 있음 |
| 배지 전당 | 실천 횟수에 따라 열리는 배지 |
| 학습자상 탐구 | 10대 학습자상의 뜻과 실천 팁 |
| 환경 설정 | 학생 정보 입력, 데이터 백업(JSON 내보내기/가져오기), 초기화, 샘플 데이터 불러오기 |

그 밖에 날짜 이동·달력, 작성 중 내용 자동 임시저장, 읽기 전용 공유 링크(이름과 누적 통계만 포함)를 지원합니다.

## 데이터 저장 방식

모든 기록은 **사용하는 기기의 브라우저(localStorage)** 에만 저장됩니다. 서버로 전송되지 않으며, 다른 기기나 다른 브라우저에서는 보이지 않습니다. 기기를 옮길 때는 환경 설정의 백업 기능을 이용하세요.

## 기술 스택

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · motion · lucide-react

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
├── data.ts                  학습자상 정의, 날짜·공휴일, 통계·배지 계산
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
- 2026.11: 이 저장소로 옮겨 Claude Code로 개선 시작 — 화면별 파일 분리, 사용하지 않는 AI Studio·Gemini 관련 코드 정리
