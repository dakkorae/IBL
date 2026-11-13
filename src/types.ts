export type LearnerProfileKey =
  | 'Inquirers'
  | 'Knowledgeable'
  | 'Thinkers'
  | 'Communicators'
  | 'Principled'
  | 'Open-minded'
  | 'Caring'
  | 'Risk-takers'
  | 'Balanced'
  | 'Reflective';

export interface ProfileDefinition {
  key: LearnerProfileKey;
  name: string;
  englishName: string;
  emoji: string;
  color: string; // Tailwind color class or hex
  borderColor: string;
  bgColor: string;
  textColor: string;
  mission: string;
  description: string;
  tips: string[];
}

// 실천 기록 한 줄: 어떤 학습자상 미션에 대한 기록인지 + 실천 내용
// (체크한 미션이 없는 날의 성찰 기록은 profileKey가 null)
export interface Reflection {
  profileKey: LearnerProfileKey | null;
  text: string;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  completed: LearnerProfileKey[]; // keys of profiles completed on this day
  submitted: boolean;
  memo?: string; // 예전 자유 메모 (이전 기록 호환용)
  reflections?: Reflection[];
  reflectionOnly?: boolean; // 체크한 미션 없이 성찰 기록만 남긴 날 (성찰하는 사람 +1)
  submittedAt?: string; // 실제로 제출한 날짜 (YYYY-MM-DD)
}

export type ViewType = 'dashboard' | 'mission' | 'profiles' | 'settings' | 'badges';
export type TimePeriod = 'day' | 'week' | 'month' | '3months' | '6months' | '1year';

export type BadgeCategory = 'profile' | 'streak' | 'balance' | 'writing' | 'mission' | 'fun';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requirementDescription: string; // 획득 조건 (예: "등교일 5일 연속 기록")
  category: BadgeCategory;
  profileKey?: LearnerProfileKey;
  level?: number; // 학습자상 배지의 단계 (1~3)
  requiredCount: number;
  unit: string; // 진행도 단위 (회, 일, 번, 줄 …)
  secret?: boolean; // 받기 전까지 조건을 가리는 깜짝 배지
  hint?: string; // 깜짝 배지의 힌트
}

export interface BadgeStatus extends Badge {
  progress: number;
  unlocked: boolean;
}

