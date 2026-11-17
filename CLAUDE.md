# IBL – IB 학습자상 포트폴리오 (작업 안내서)

새 대화에서 이 파일만 읽으면 바로 이어서 작업할 수 있도록 정리한 문서입니다. 코드를 전부 다시 읽지 말고, 아래 지도에서 필요한 파일만 여세요.

## 한눈에
- 초등 5학년이 IB 10대 학습자상 미션을 매일 실천·기록하는 웹앱. 사용자(서성민 선생님)는 비개발자 → **설명은 쉬운 한국어로, 용어는 풀어서**.
- React 19 + TypeScript + Vite 6 + Tailwind 4. 서버는 Firebase(Firestore + 익명 로그인), 프로젝트 `ib-l-c9c6a`, 무료(Spark) 요금제.
- 저장소 `dakkorae/IBL` 의 `main` 에 직접 커밋·푸시 → Vercel 자동 배포. 원본 `dakkorae/IB-learner` 는 건드리지 않음.
- 주소: `/` 학생, `#teacher` 교사, `#admin` 관리자(개설 코드 발급).

## 작업 환경 (Claude Code 클라우드 세션)
- 세션마다 저장소를 새로 받은 임시 컴퓨터에서 작업함 → **올리지 않은 작업은 사라짐**. 시작하면 `npm ci` 부터.
- 사용자 지시: 작업이 끝나면 **`main` 에 바로 커밋·푸시**(Vercel 자동 배포). 세션이 따로 정해 주는 작업용 가지는 쓰지 않음.
- 브라우저 자동화: Playwright + Chromium 이 미리 설치되어 있음(`require('playwright')`). 체험용 빌드를 `python3 -m http.server` 로 띄워 눌러 보고, 폭 320~1920 에서 겹침·넘침을 스크립트로 점검.
- Google 서버 중 Firebase 본 서버(firestore.googleapis.com)는 막혀 있지만, **Firestore 에뮬레이터는 내려받아 돌릴 수 있음**(Java 있음) → 보안 규칙은 여기서 직접 시험(아래 확인 방법).
- 임시 파일·캡처는 저장소 밖(세션 scratchpad)에 둠. 저장소에 넣지 않음.

## 파일 지도
| 위치 | 내용 |
|---|---|
| `src/state/PortfolioContext.tsx` | 학생 앱의 모든 상태·동작(제출, 백업, 학급 동기화). 가장 큰 파일 → 필요한 함수만 grep |
| `src/views/*` | 학생 화면: Dashboard, Mission, Class(우리 반), Badges, Profiles, Settings |
| `src/views/class/Community.tsx` | 나눔 게시판 · 칭찬 게시판 (글쓰기 양식 + 담벼락) |
| `src/components/BoardWall.tsx` | 담벼락(패들렛 모양) + 쪽 나눔(12개) + 좋아요. 학생 게시판과 교사 소통 탭이 함께 씀 |
| `src/components/PeriodTabs.tsx` | 기간 고르기(오늘~1년). 대시보드와 우리 반 레이더가 함께 씀 |
| `src/missionSeed.ts` | 학생마다 다른 오늘의 미션: 씨앗값 정하기, 씨앗값이 바뀔 때 지난 미션 그대로 적어 두기 |
| `src/filter.ts` | 비속어 걸러 내기(낱말 목록, AI 없음). 모든 글 입력 칸에서 `badWordMessage()` 로 검사 |
| `src/data.ts` / `missionsData.ts` / `badges.ts` / `theme.ts` | 학습자상·날짜·통계 / 미션 1,000개 / 배지 판정 / 화면 테마 |
| `src/cloud/types.ts` | 서버 자료형과 `CloudBackend` 인터페이스 (**서버 기능은 여기부터 추가**) |
| `src/cloud/firebaseBackend.ts` · `demoBackend.ts` | 실제 서버 구현 · 체험용 구현(localStorage). **둘을 항상 같이 고침** |
| `src/cloud/stats.ts` | 학급 합계 계산, 공동 목표 진행도, 도장·스티커 목록 |
| `src/teacher/*` | 교사용: TeacherApp(개설·열기), ClassDashboard(현황·학생(일괄 피드백)·활동(지난 활동)·관리), Inbox(소통: 담벼락·신고함), InviteQR(QR 초대), report(CSV), stats |
| `src/admin/AdminApp.tsx` | 관리자: 개설 코드 발급·사용 중지·삭제, 코드별 개설된 학급(이름·학급 코드) 보기, 교사 비밀번호 재설정 코드 발급 |
| `scripts/rules-test.mjs` | 보안 규칙 자동 시험(109가지) |
| `firestore.rules` | 보안 규칙. **바꾸면 사용자가 Firebase 콘솔 규칙 탭에 다시 붙여 넣고 게시해야 함** (매번 안내) |
| `docs/FIREBASE_SETUP.md` | 서버 연결 방법 |

## 서버 자료 구조 (`classes/{학급코드}/…`)
`students`(명단) · `pins`·`secrets`(비밀번호 해시, 읽기 불가. `secrets/teacher {keyHash, resetHash}`, `secrets/reset {codeHash, expiresAt}`) · `members`·`teachers`(등록된 기기) · `portfolios/{sid}`(기록) · `feedback/{sid}` · `public/stats`(학급 합계) · `public/stats`의 `badges`(학생별 받은 배지 ID → 인원수만 표시) · `public/board`(나눔 게시판) · `public/praise`(칭찬 게시판) — 게시판 문서 모양은 `{ posts:{글ID:글}, last, likes:{글ID:{sid:true}}, liked, removed }` (last·liked·removed 는 방금 넣은/누른/지운 글 ID, 보안 규칙 검사용) · `reports`(불편해요). 학급 문서에는 `focus`·`goal`·`extraMissions`·`log`(지난 활동)·`maxStudents`. (`reactions`·`posts`·`inbox` 는 예전 방식, 이제 안 씀) 최상위: `inviteCodes`, `admins`, `config/admin`.

## 지켜 온 원칙
- 개인정보 없음: 학급 코드 + 학생이 스스로 정한 닉네임 + 숫자 4자리 비밀번호. 이메일·실명 받지 않음. 학적 정보(이름·학교)는 학급 미참여 때만 쓰고 기기에만 저장.
- 학생 등록: 교사가 명단을 미리 만들지 않음. 학생이 등록하면 빈 자리 번호(`s1`~`s{정원}`, 정원 최대 100)를 차지함. 닉네임 변경은 본인 30일 1회(보안 규칙이 검사), 교사는 제한 없음.
- 게시판은 교사 승인 없이 바로 게시(비속어 검사 통과 시). 사후 관리: 학생 ‘불편해요’ + 교사 삭제. 학생은 자기 글만 지울 수 있음.
- 관리자가 개설 코드를 삭제하면 **그 코드로 만든 학급과 모든 자료가 함께 삭제**됨(경고 1회). 관리자는 지우기만 가능하고 학생 기록·게시글 내용은 읽지 못함. 관리자는 코드별 학급 이름·학급 코드를 볼 수 있음(선생님이 학급 코드를 잊었을 때 알려 주기용, 교사 비밀번호는 볼 수 없음).
- 학생에게는 **학급 합계만** 보임. 개인별 실천 수치·순위 공개 금지(경쟁·거짓 체크 방지). 예외(사용자 결정): 게시판 좋아요 개수는 모두에게 보임, 배지는 ‘우리 반에서 n명이 획득’ 인원수만 보임.
- 로그아웃(교사·관리자): 이 기기의 등록 문서(`teachers/{uid}`·`admins/{uid}`)만 지움. 익명 로그인 자체는 유지(같은 기기의 학생 참여에 영향 없게). 학급·기록은 그대로.
- 교사 비밀번호 분실: 관리자가 학급별 ‘재설정 코드’(24시간, 1회용, 해시만 저장) 발급 → 교사 페이지 ‘교사 비밀번호를 잊었어요’에서 학급 코드 + 재설정 코드 + 새 비밀번호. 사용한 코드는 `secrets/teacher.resetHash` 에 남아 재사용 불가. 다른 기기의 기존 교사 등록은 그대로 유지됨.
- 학급 개설·비밀번호 재설정 직후에는 학급 코드·비밀번호 기록 안내 화면(체크해야 들어감, 복사 버튼).
- 학생 초대: 학급 코드 또는 QR(`/?join=학급코드` → 설정 화면의 참여 카드가 코드를 채워 줌).
- 교사 피드백은 **기록이 있는 날짜에만** 붙음(일괄 피드백도 그날 기록이 없는 학생은 건너뜀).
- 오늘의 미션은 **학생마다 다름**: 날짜 + 학습자상 + 씨앗값(학급 참여 중이면 `학급코드:sid`, 아니면 기기에서 만든 임의 값 `ib_mission_seed`)으로 100가지 중 하나. 같은 학생·같은 날은 어느 기기에서나 같음. 씨앗값이 바뀔 때(학급 참여·나가기)는 `freezeMissions()` 로 기록한 날·쓰던 날의 미션을 `customMissionsByDate` 에 적어 두어 바뀌지 않게 함. ‘새로 뽑은 미션’ 표시와 다시 뽑기 배지는 바꾼 횟수(`rerollCountsByDate`)로 판단.
- 기록은 기기(localStorage)에 먼저 저장하고 서버에 올림. 서버 실패해도 앱은 동작.
- 읽기 횟수 절약: 학생이 자주 보는 것은 문서 하나에 모아 둠(`public/stats`, `public/board`).
- Firestore `setDoc(..., {merge:true})` 에 **빈 객체를 넣으면 그 칸이 비워짐** → 바뀐 값이 있을 때만 담기.
- 화면은 휴대폰(하단 탭)·태블릿·PC 반응형. 색은 `indigo`/`violet` 계열만 쓰면 테마가 자동 적용됨.

## 확인 방법
```bash
npx tsc --noEmit && npm run build          # 타입 검사 + 빌드
VITE_CLOUD_DEMO=1 npx vite build --outDir /tmp/demo   # 서버 없이 도는 체험용 (개설 코드 DEMO-2026, 관리자 키 demo-admin)
```
- 보안 규칙을 바꿨으면 에뮬레이터로 시험(저장소 밖 임시 폴더에 도구 설치):
```bash
mkdir -p $TMP/emu && cd $TMP/emu && npm init -y && npm i firebase-tools @firebase/rules-unit-testing firebase
cp /home/user/IBL/scripts/rules-test.mjs . 
echo '{"firestore":{"rules":"/home/user/IBL/firestore.rules"},"emulators":{"firestore":{"port":8085,"host":"127.0.0.1"},"ui":{"enabled":false}}}' > firebase.json
RULES=/home/user/IBL/firestore.rules npx firebase emulators:exec --only firestore --project demo-test "node rules-test.mjs"   # 마지막 줄 "통과 N / 실패 0"
```
- 실제 Firebase 서버 동작(배포된 사이트)은 여기서 확인 불가 → 체험용 빌드 + 규칙 시험으로 확인하고, 실제 확인은 사용자에게 부탁한다(무엇을 눌러 볼지 순서로 안내).
- 커밋 메시지는 한국어, `feat(범위): …` 형식.

## 지금까지 (2026-11)
1. AI Studio 앱을 옮겨 화면별 파일로 분리, Gemini 흔적 제거
2. 미션 1,000개 새로 구성(검토용 엑셀 `docs/`), 실천 기록 필수화(체크만으로 제출 불가)
3. 반응형 화면, 배지 62개(+우리 반 배지 4개), 화면 테마(색 6·글꼴 4·크기 3)
4. 학급 1단계: 개설 코드 → 학급 개설 → 학생 참여, 교사 현황·명단 관리
5. 학급 2단계: 우리 반 메뉴(레이더·공동 목표·중점 학습자상), 교사 피드백
6. 학급 3단계: 칭찬 쪽지·나눔 게시판(교사 승인제)·공감 스티커·불편해요 알림, 우리 반 미션, CSV 리포트
7. (11/15) 반응형 줄바꿈 정리(낱말 단위), 우리 반 레이더 기간 선택, 닉네임·비밀번호 직접 등록, 정원 100명, 공유 링크 기능 삭제, 칭찬 쪽지 → 칭찬 게시판, 비속어 필터 + 승인제 폐지
8. (11/17) 게시판을 담벼락(패들렛) 모양 + 쪽 나눔 + 좋아요(개수 공개)로, 탭 순서 현황-나눔-칭찬, 배지 테두리 강조·‘우리 반에서 n명이 획득’, 관리자 코드 삭제, QR 초대, 일괄 피드백·피드백 문구 표시, 교사 소통 탭 담벼락·불편해요 신고함, 지난 활동 기록
9. (11/17) 내 글 삭제·내가 쓴 글만 보기·좋아요를 신고 앞으로, 미션 카드 경계 강조, 교사 게시판의 불편해요 표시 제거(신고함에만), 코드 삭제 시 학급 일괄 삭제
10. (11/17) 나눔 게시판: 기록 고르기 목록과 올라간 글에 그날 실천한 미션 문장 표시(글의 `mission` 칸)
11. (11/17) 미션을 학생마다 다르게, 나눔 글에서 실천 내용을 크게·미션은 작게, 나눌 기록 고르기 5개씩 쪽 나눔
12. (11/17) 교사·관리자 페이지 로그아웃
13. (11/17) 나눔: 이미 올린 기록은 고르기 목록에서 빠짐(글의 `src`=‘날짜#번호’, 예전 글은 학습자상+내용으로 판단), 글을 지우면 다시 나타남. 우리 반 현황의 선생님 피드백 5개씩 쪽 나눔
14. (11/17) 관리자 페이지: 개설 코드별로 개설된 학급 이름·학급 코드 보기
15. (11/17) 교사 비밀번호 재설정(관리자 발급 재설정 코드), 개설 직후 학급 코드·비밀번호 기록 안내

## 아직 안 한 것 / 아이디어
- 성장 리포트 인쇄용 화면(PDF), 다크 모드, 학습자상 아이콘 세트
- 게시판 글이 아주 많아질 때 오래된 글 정리
- 기존 주소 `ib-learner.vercel.app` 을 IBL 로 전환(사용자가 Vercel에서 결정)
