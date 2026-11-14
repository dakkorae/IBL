import { CloudBackend, ClassSession } from './types';
import { DEFAULT_FIREBASE_CONFIG } from './firebaseConfig';

// 어떤 서버를 쓸지 결정
// - VITE_CLOUD_DEMO=1 이면 체험용(이 브라우저 안에서만 동작, 미리보기용)
// - 그 밖에는 실제 서버(Firebase). 설정은 firebaseConfig.ts, .env의 VITE_FIREBASE_* 값이 있으면 그 값이 우선
// - 설정이 비어 있으면 학급 기능을 끄고 기기에만 저장
const env = import.meta.env;
const firebaseConfig = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string | undefined) || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string | undefined) || DEFAULT_FIREBASE_CONFIG.projectId,
  appId: (env.VITE_FIREBASE_APP_ID as string | undefined) || DEFAULT_FIREBASE_CONFIG.appId
};

export const cloudMode: 'firebase' | 'demo' | 'off' =
  env.VITE_CLOUD_DEMO === '1' ? 'demo' : firebaseConfig.apiKey && firebaseConfig.projectId ? 'firebase' : 'off';

let backendPromise: Promise<CloudBackend> | null = null;

// 서버 코드는 필요할 때만 내려받음 (학급에 참여하지 않은 학생은 받지 않음)
export function getBackend(): Promise<CloudBackend> {
  if (cloudMode === 'off') return Promise.reject(new Error('학급 서버가 설정되지 않았어요.'));
  if (!backendPromise) {
    backendPromise =
      cloudMode === 'firebase'
        ? import('./firebaseBackend').then((m) =>
            m.createFirebaseBackend({
              apiKey: firebaseConfig.apiKey!,
              authDomain: firebaseConfig.authDomain || `${firebaseConfig.projectId}.firebaseapp.com`,
              projectId: firebaseConfig.projectId!,
              appId: firebaseConfig.appId || ''
            })
          )
        : import('./demoBackend').then((m) => m.createDemoBackend());
  }
  return backendPromise;
}

// ---- 학생 기기의 학급 참여 정보 ----
const SESSION_KEY = 'ib_class_session';
export function loadClassSession(): ClassSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return s && s.classId && s.sid ? s : null;
  } catch {
    return null;
  }
}
export function saveClassSession(session: ClassSession | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // 저장 실패는 무시
  }
}

// ---- 교사 기기에서 연 학급 목록 ----
const TEACHER_KEY = 'ib_teacher_classes';
export function loadTeacherClasses(): { id: string; name: string }[] {
  try {
    const list = JSON.parse(localStorage.getItem(TEACHER_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
export function saveTeacherClasses(list: { id: string; name: string }[]) {
  try {
    localStorage.setItem(TEACHER_KEY, JSON.stringify(list));
  } catch {
    // 저장 실패는 무시
  }
}

export const errorMessage = (e: unknown) =>
  e instanceof Error && e.message ? e.message : '문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
