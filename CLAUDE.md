# IBL – IB 학습자상 포트폴리오 (작업 안내서)

새 대화에서 이 파일만 읽으면 바로 이어서 작업할 수 있도록 정리한 문서입니다. 코드를 전부 다시 읽지 말고, 아래 지도에서 필요한 파일만 여세요.

## 한눈에
- 초등 5학년이 IB 10대 학습자상 미션을 매일 실천·기록하는 웹앱. 사용자(서성민 선생님)는 비개발자 → **설명은 쉬운 한국어로, 용어는 풀어서**.
- React 19 + TypeScript + Vite 6 + Tailwind 4. 서버는 Firebase(Firestore + 익명 로그인), 프로젝트 `ib-l-c9c6a`, 무료(Spark) 요금제.
- 저장소 `dakkorae/IBL` 의 `main` 에 직접 커밋·푸시 → Vercel 자동 배포. 원본 `dakkorae/IB-learner` 는 건드리지 않음.
- 주소: `/` 학생, `#teacher` 교사, `#admin` 관리자(개설 코드 발급).

## 파일 지도
| 위치 | 내용 |
|---|---|
| `src/state/PortfolioContext.tsx` | 학생 앱의 모든 상태·동작(제출, 백업, 학급 동기화). 가장 큰 파일 → 필요한 함수만 grep |
| `src/views/*` | 학생 화면: Dashboard, Mission, Class(우리 반), Badges, Profiles, Settings |
| `src/views/class/Community.tsx` | 칭찬 쪽지 · 나눔 게시판 · 공감 스티커 |
| `src/data.ts` / `missionsData.ts` / `badges.ts` / `theme.ts` | 학습자상·날짜·통계 / 미션 1,000개 / 배지 판정 / 화면 테마 |
| `src/cloud/types.ts` | 서버 자료형과 `CloudBackend` 인터페이스 (**서버 기능은 여기부터 추가**) |
| `src/cloud/firebaseBackend.ts` · `demoBackend.ts` | 실제 서버 구현 · 체험용 구현(localStorage). **둘을 항상 같이 고침** |
| `src/cloud/stats.ts` | 학급 합계 계산, 공동 목표 진행도, 도장·스티커 목록 |
| `src/teacher/*` | 교사용: TeacherApp(개설·열기), ClassDashboard(현황·학생·활동·관리), Inbox(소통), report(CSV), stats |
| `firestore.rules` | 보안 규칙. **바꾸면 사용자가 Firebase 콘솔 규칙 탭에 다시 붙여 넣고 게시해야 함** (매번 안내) |
| `docs/FIREBASE_SETUP.md` | 서버 연결 방법 |

## 서버 자료 구조 (`classes/{학급코드}/…`)
`students`(명단) · `pins`·`secrets`(비밀번호 해시, 읽기 불가) · `members`·`teachers`(등록된 기기) · `portfolios/{sid}`(기록) · `feedback/{sid}` · `public/stats`(학급 합계) · `public/board`(승인된 게시 글) · `inbox/{sid}`(승인된 쪽지) · `posts`(승인 대기함) · `reactions` · `reports`. 최상위: `inviteCodes`, `admins`, `config/admin`.

## 지켜 온 원칙
- 개인정보 없음: 학급 코드 + 번호 + 숫자 4자리 비밀번호. 이메일·실명 받지 않음.
- 학생에게는 **학급 합계만** 보임. 개인별 수치·순위·좋아요 개수 공개 금지(경쟁·거짓 체크 방지).
- 기록은 기기(localStorage)에 먼저 저장하고 서버에 올림. 서버 실패해도 앱은 동작.
- 읽기 횟수 절약: 학생이 자주 보는 것은 문서 하나에 모아 둠(`public/stats`, `public/board`).
- Firestore `setDoc(..., {merge:true})` 에 **빈 객체를 넣으면 그 칸이 비워짐** → 바뀐 값이 있을 때만 담기.
- 화면은 휴대폰(하단 탭)·태블릿·PC 반응형. 색은 `indigo`/`violet` 계열만 쓰면 테마가 자동 적용됨.

## 확인 방법
```bash
npx tsc --noEmit && npm run build          # 타입 검사 + 빌드
VITE_CLOUD_DEMO=1 npx vite build --outDir /tmp/demo   # 서버 없이 도는 체험용 (개설 코드 DEMO-2026, 관리자 키 demo-admin)
```
- 작업 환경(클라우드 세션)에서는 Google 서버 접속이 막혀 **실제 Firebase 동작은 확인 불가**. 체험용 빌드를 브라우저 자동화로 확인하고, 실제 서버 확인은 사용자에게 부탁한다(무엇을 눌러 볼지 순서로 안내).
- 커밋 메시지는 한국어, `feat(범위): …` 형식.

## 지금까지 (2026-11)
1. AI Studio 앱을 옮겨 화면별 파일로 분리, Gemini 흔적 제거
2. 미션 1,000개 새로 구성(검토용 엑셀 `docs/`), 실천 기록 필수화(체크만으로 제출 불가)
3. 반응형 화면, 배지 62개(+우리 반 배지 4개), 화면 테마(색 6·글꼴 4·크기 3)
4. 학급 1단계: 개설 코드 → 학급 개설 → 학생 참여, 교사 현황·명단 관리
5. 학급 2단계: 우리 반 메뉴(레이더·공동 목표·중점 학습자상), 교사 피드백
6. 학급 3단계: 칭찬 쪽지·나눔 게시판(교사 승인제)·공감 스티커·불편해요 알림, 우리 반 미션, CSV 리포트

## 아직 안 한 것 / 아이디어
- 성장 리포트 인쇄용 화면(PDF), 다크 모드, 학습자상 아이콘 세트
- 게시판 글이 아주 많아질 때 오래된 글 정리
- 기존 주소 `ib-learner.vercel.app` 을 IBL 로 전환(사용자가 Vercel에서 결정)
