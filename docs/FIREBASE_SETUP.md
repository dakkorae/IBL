# 학급 서버(Firebase) 연결 방법

학급 기능은 Google의 Firebase를 서버로 씁니다. 무료 요금제(Spark)로 충분하며, 학생의 이메일·이름 같은 개인정보는 받지 않습니다.

## 1. Firebase 프로젝트 만들기

1. <https://console.firebase.google.com> 에서 **프로젝트 추가** (Google 애널리틱스는 꺼도 됩니다)
2. **빌드 → Firestore Database → 데이터베이스 만들기**
   - 위치: `asia-northeast3 (서울)`
   - **프로덕션 모드**로 시작
3. **빌드 → Authentication → 시작하기 → 로그인 방법 → 익명** 을 사용 설정
4. **프로젝트 설정(톱니바퀴) → 일반 → 내 앱 → 웹 앱(</>) 추가**
   - 앱 닉네임만 입력 (호스팅은 선택하지 않음)
   - 화면에 나오는 `firebaseConfig` 값 중 `apiKey`, `authDomain`, `projectId`, `appId` 를 복사

## 2. 보안 규칙 넣기

> 앱이 업데이트되어 `firestore.rules` 가 바뀌면 이 단계를 다시 해야 새 기능이 동작합니다.

**Firestore Database → 규칙** 탭에서 기존 내용을 지우고, 저장소 최상위의 [`firestore.rules`](../firestore.rules) 내용을 그대로 붙여 넣은 뒤 **게시**합니다.

## 3. 앱에 설정값 넣기

현재 프로젝트(`ib-l-c9c6a`)의 설정값은 `src/cloud/firebaseConfig.ts` 에 들어 있어서 따로 할 일이 없습니다. 다른 Firebase 프로젝트로 바꾸려면 그 파일을 고치거나, `.env`(Vercel은 Environment Variables)에 `VITE_FIREBASE_API_KEY` 등 4개 값을 넣으면 그 값이 우선합니다.

## 4. 관리자 키 등록 (한 번만)

1. 배포된 앱 주소 끝에 `#admin` 을 붙여 엽니다.
2. **처음 설정할 때** 칸에 쓰고 싶은 관리자 키를 입력해 등록값을 만듭니다.
3. Firebase 콘솔 → Firestore → **컬렉션 시작**
   - 컬렉션 ID: `config` / 문서 ID: `admin`
   - 필드: `keyHash` (string) = 만든 등록값
4. 다시 `#admin` 에서 관리자 키를 입력하면 개설 코드를 만들 수 있습니다.

## 5. 사용 흐름

| 누가 | 어디서 | 무엇을 |
|---|---|---|
| 관리자 | `#admin` | 개설 코드를 만들어 선생님께 전달 |
| 교사 | `#teacher` | 개설 코드로 학급 개설 → 학급 코드를 학생에게 안내 |
| 학생 | 환경 설정 → 학급 참여 | 학급 코드 입력 → 번호 선택 → 숫자 4자리 비밀번호 정하기 |

## 서버에 저장되는 것

- 학급 이름, 학생 번호와 별명(선택), 실천 기록(체크한 학습자상, 미션 문장, 학생이 쓴 실천 기록)
- 비밀번호는 원문이 아니라 되돌릴 수 없는 값(해시)으로만 저장됩니다.
- 학년이 끝나면 교사용 페이지 **관리 → 학급 전체 삭제**로 모두 지울 수 있습니다.
