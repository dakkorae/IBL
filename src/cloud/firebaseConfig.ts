// 학급 서버(Firebase) 연결 설정
// - 웹 앱용 공개 값이라 저장소에 두어도 됩니다. 누가 무엇을 읽고 쓸 수 있는지는
//   이 값이 아니라 서버의 보안 규칙(firestore.rules)이 지킵니다.
// - 다른 Firebase 프로젝트로 바꾸려면 .env의 VITE_FIREBASE_* 값이 이 값보다 우선합니다.
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB3k6_KCqtGvtmawUC5uZAq1eVpkR-R3zU',
  authDomain: 'ib-l-c9c6a.firebaseapp.com',
  projectId: 'ib-l-c9c6a',
  appId: '1:806112260751:web:4da0b6797a733d743436fa'
};
