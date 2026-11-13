import { ProfileDefinition, LearnerProfileKey, DailyRecord, TimePeriod, Badge } from './types';
import { IB_MISSIONS_1000 } from './missionsData';

export { IB_MISSIONS_1000 };

export const PROFILE_DATA: ProfileDefinition[] = [
  {
    key: 'Inquirers',
    name: '탐구하는 사람',
    englishName: 'Inquirers',
    emoji: '🔍',
    color: '#3b82f6', // blue
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    mission: '수업 시간에 궁금한 점이 생기면 질문 노트에 적어두고, 쉬는 시간에 선생님이나 책을 통해 스스로 답 찾아보기',
    description: '호기심을 키우고, 스스로 탐구하고 배우는 힘을 기릅니다. 평생 배움을 즐기는 마음을 배양합니다.',
    tips: [
      '스마트폰으로 게임 검색 대신 모르는 단어의 뜻을 사전에서 찾아봐요.',
      '책을 읽다가 "왜 그럴까?" 하는 의문이 생기면 메모해두고 도서관에서 관련 책을 찾아봐요.',
      '선생님이나 부모님께 오늘 배운 내용 중 가장 신기했던 것에 대해 꼬리 질문을 던져보세요.'
    ]
  },
  {
    key: 'Knowledgeable',
    name: '지식이 풍부한 사람',
    englishName: 'Knowledgeable',
    emoji: '📚',
    color: '#10b981', // emerald
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    mission: '오늘 배운 내용 중 가장 흥미로웠던 사실 한 가지를 가족이나 친구에게 설명해주기',
    description: '깊이 있는 지식을 탐구하며, 다양한 주제와 이슈들에 대해 배운 내용을 일상과 연결합니다.',
    tips: [
      '하교 길이나 저녁 식사 시간에 "오늘 학교에서 진짜 신기한 걸 배웠는데!" 하고 이야기해보세요.',
      '배운 내용을 나만의 그림 지도로 그리거나 마인드맵으로 정리해보세요.',
      '동화책이나 뉴스 기사 하나를 읽고 어떤 의미인지 스스로 요약해보세요.'
    ]
  },
  {
    key: 'Thinkers',
    name: '사고하는 사람',
    englishName: 'Thinkers',
    emoji: '💡',
    color: '#f59e0b', // amber
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    mission: '친구와 의견이 다를 때, "그렇게 생각할 수도 있구나!"라고 먼저 공감한 뒤 내 의견을 논리적으로 말해보기',
    description: '비판적이고 창의적인 사고 능력을 활용하여 복잡한 문제를 해결하고 현명한 결정을 내립니다.',
    tips: [
      '문제를 풀 때 한 가지 방법만 쓰지 말고 다른 방식으로도 풀어보세요.',
      '친구와 대화할 때 "내 생각에는 이래, 왜냐하면~"이라며 타당한 이유를 함께 덧붙여 말해요.',
      '나에게 일어난 작은 문제에 대해 일방적으로 불평하기보다 해결 가능한 대안을 세 가지만 찾아보세요.'
    ]
  },
  {
    key: 'Communicators',
    name: '소통하는 사람',
    englishName: 'Communicators',
    emoji: '🗣️',
    color: '#8b5cf6', // purple
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    mission: '쉬는 시간에 평소 잘 이야기해보지 않은 친구에게 먼저 다가가 "주말에 뭐 했어?"라고 따뜻하게 질문하기',
    description: '여러 언어와 방식으로 내 생각과 아이디어를 표현하고, 다른 사람의 목소리에 귀를 기울이며 협력합니다.',
    tips: [
      '친구의 이야기를 끊지 않고 고개를 끄덕이며 끝까지 경청해봅니다.',
      '문자 메시지나 짧은 편지로 주변 사람들에게 나의 감정이나 고마운 마음을 정확하게 써보세요.',
      '모둠 발표 시간에 듣는 사람들의 눈을 바라보며 자신감 있는 목소리로 이야기해보세요.'
    ]
  },
  {
    key: 'Principled',
    name: '원칙을 지키는 사람',
    englishName: 'Principled',
    emoji: '🛡️',
    color: '#06b6d4', // cyan
    borderColor: 'border-cyan-200',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    mission: '선생님이 보지 않더라도 복도에서 뛰지 않고, 쓰레기를 발견하면 먼저 주워서 쓰레기통에 버리기',
    description: '공정함, 정직함, 정의로움을 소중히 여기며, 규칙을 존중하고 스스로 행동에 책임을 집니다.',
    tips: [
      '학급 규칙이나 놀이 규칙을 철저히 지키며, 아무도 보지 않을 때도 약속을 실천해요.',
      '내가 실수했거나 잘못한 일이 있을 때 핑계를 대지 않고 솔직하게 인정해요.',
      '인터넷이나 SNS 상에서 고운 말, 바른 말만 사용하고 저작권을 지키려고 노력해요.'
    ]
  },
  {
    key: 'Open-minded',
    name: '열린 마음을 지닌 사람',
    englishName: 'Open-minded',
    emoji: '🌍',
    color: '#ec4899', // pink
    borderColor: 'border-pink-200',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    mission: '모둠 활동 시 내가 원하지 않는 역할을 맡게 되더라도 기분 좋게 수락하고 최선을 다하기',
    description: '나의 문화와 역사를 소중히 여기면서도, 다른 이의 다양한 관점과 문화를 수용하고 성장합니다.',
    tips: [
      '새로운 급식 메뉴나 평소에 잘 먹지 않던 다른 나라 음식을 한 입 도전해보세요.',
      '나와 성격이 다른 친구의 행동을 비난하지 않고, "저 친구는 저런 면이 멋지네!" 하고 긍정적인 면을 찾아요.',
      '책이나 영화를 볼 때 다른 주인공의 입장이 되어 그 감정을 상상하고 존중해보세요.'
    ]
  },
  {
    key: 'Caring',
    name: '배려하는 사람',
    englishName: 'Caring',
    emoji: '❤️',
    color: '#ef4444', // red
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    mission: '무거운 짐이나 청소 도구를 들고 가는 친구나 선생님을 보면 "내가 도와줄게!" 하고 함께 들기',
    description: '타인을 공감하고 동정하며, 적극적으로 봉사하고 더 나은 환경을 만들기 위해 배려를 실천합니다.',
    tips: [
      '속상해하는 친구가 있다면 옆에 앉아 가만히 등을 토닥여주거나 "괜찮아?"라고 한마디 건네보세요.',
      '집에서 부모님을 위해 심부름을 하거나 식사 준비, 정돈을 돕는 작은 깜짝 선물을 해보세요.',
      '나의 따뜻한 말 한마디가 상대방의 하루를 어떻게 바꿀 수 있을지 고민하고 실천해봅니다.'
    ]
  },
  {
    key: 'Risk-takers',
    name: '도전하는 사람',
    englishName: 'Risk-takers',
    emoji: '🚀',
    color: '#ea580c', // orange
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    mission: '오늘 수업 시간 중, 정답을 확실히 모르더라도 틀릴 것을 두려워하지 않고 내 생각을 1번 이상 발표해 보기',
    description: '불확실함에 마주하더라도 두려워하지 않고, 새로운 아이디어나 전술을 자신 있게 시도해봅니다.',
    tips: [
      '새로운 동아리 활동이나 학급 직책에 적극적으로 도전해 지원해보세요.',
      '한 번도 배워보지 않은 스포츠, 악기 혹은 게임을 처음부터 찬찬히 배워봅니다.',
      '틀리는 것에 주눅 들지 말고, "실수는 배움의 기회"라는 마음으로 용기를 내 목소리를 냅니다.'
    ]
  },
  {
    key: 'Balanced',
    name: '균형 잡힌 사람',
    englishName: 'Balanced',
    emoji: '⚖️',
    color: '#14b8a6', // teal
    borderColor: 'border-teal-200',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    mission: '쉬는 시간에 스마트폰이나 게임 이야기만 하지 않고, 가벼운 스트레칭을 하거나 바깥 공기 쐬고 오기',
    description: '몸과 마음, 감정의 조화로운 발달이 중요함을 이해하고, 나와 타인의 웰빙을 골고루 돌봅니다.',
    tips: [
      '공부나 책 읽기가 끝난 후 15분간 야외에서 가벼운 러닝을 하거나 줄넘기를 해요.',
      '정크푸드나 탄산음료 대신 신선한 과일과 물을 챙겨 먹는 건강 습관을 지킵니다.',
      '해야 할 숙제 시간과 자유 놀이 시간의 계획을 스스로 세워 골고루 실천해보세요.'
    ]
  },
  {
    key: 'Reflective',
    name: '성찰하는 사람',
    englishName: 'Reflective',
    emoji: '💭',
    color: '#64748b', // slate
    borderColor: 'border-slate-200',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    mission: '하교하기 전, 오늘 하루 나의 행동 중 가장 뿌듯했던 일과 조금 아쉬웠던 일을 일기장이나 메모장에 간략히 적어보기',
    description: '자신의 학습 과정과 경험을 비판적으로 분석하며, 나의 강점과 한계를 알고 스스로 성장하도록 노력합니다.',
    tips: [
      '시험 성적이 낮게 나왔을 때 단순 낙담하기보다, 어떤 단원이 부족했는지 오답 노트를 작성해봅니다.',
      '잠들기 전 5분간 눈을 감고 오늘 내가 친구에게 했던 상처 주는 말은 없었는지 돌아봅니다.',
      '나의 실천 포트폴리오를 읽어보며 내가 지난주보다 어떤 점이 성장했는지 기록해보세요.'
    ]
  }
];

// Helper to get local date string YYYY-MM-DD (immune to UTC offset issues)
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get past dates (format: YYYY-MM-DD)
export function getPastDateString(daysAgo: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - daysAgo);
  return getLocalDateString(d);
}

// Safely parse YYYY-MM-DD into a local Date object
export function parseDateString(dateStr: string): Date {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  return new Date(yyyy, (mm || 1) - 1, dd || 1);
}

// Check if a given YYYY-MM-DD date falls on a South Korean Weekend or Public Holiday
export function isKoreanWeekendOrHoliday(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length < 3) return false;

  const yyyy = parts[0];
  const mm = parts[1];
  const dd = parts[2];

  const dateObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }

  // Fixed Korean Solar Public Holidays
  const mmdd = `${mm}-${dd}`;
  const fixedHolidays = [
    '01-01', // 신정
    '03-01', // 삼일절
    '05-05', // 어린이날
    '06-06', // 현충일
    '08-15', // 광복절
    '10-03', // 개천절
    '10-09', // 한글날
    '12-25', // 성탄절
  ];

  if (fixedHolidays.includes(mmdd)) {
    return true;
  }

  // Known Lunar / Variable Holidays & Substitute Holidays in Korea (2024 - 2027)
  const variableHolidays = [
    // 2024
    '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', '2024-04-10', '2024-05-15', '2024-09-16', '2024-09-17', '2024-09-18',
    // 2025
    '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-03', '2025-05-06', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08',
    // 2026
    '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-02', '2026-05-24', '2026-05-25', '2026-06-03', '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-05',
    // 2027
    '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09', '2027-05-13', '2027-09-14', '2027-09-15', '2027-09-16'
  ];

  return variableHolidays.includes(dateStr);
}

export const MISSION_POOL: Record<LearnerProfileKey, string[]> = IB_MISSIONS_1000;

// Seed-based custom hashing function
export function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Get day-specific unique mission based on seed (deterministic per day & profile)
export function getDefaultMissionForDay(profileKey: LearnerProfileKey, dateStr: string): string {
  const pool = IB_MISSIONS_1000[profileKey];
  if (!pool || pool.length === 0) return PROFILE_DATA.find((p) => p.key === profileKey)?.mission || '';
  // Combine dateStr and profileKey for independent random distribution per category
  const seed = hashStringToInt(`${dateStr}_${profileKey}`);
  const idx = seed % pool.length;
  return pool[idx];
}

// Get random mission different from current for individual reroll
export function getRandomMission(profileKey: LearnerProfileKey, currentMission?: string): string {
  const pool = IB_MISSIONS_1000[profileKey];
  if (!pool || pool.length === 0) return PROFILE_DATA.find((p) => p.key === profileKey)?.mission || '';
  if (pool.length === 1) return pool[0];
  
  let newMission = currentMission;
  let attempts = 0;
  while ((newMission === currentMission || !newMission) && attempts < 10) {
    const randomIdx = Math.floor(Math.random() * pool.length);
    newMission = pool[randomIdx];
    attempts++;
  }
  return newMission || pool[0];
}

// Get day-specific mission (checking custom assignments if any, or default)
export function getMissionForDay(
  profileKey: LearnerProfileKey, 
  dateStr: string, 
  customAssignments?: Record<string, string>
): string {
  if (customAssignments && customAssignments[profileKey]) {
    return customAssignments[profileKey];
  }
  return getDefaultMissionForDay(profileKey, dateStr);
}

// Generate for past 365 days leading up to yesterday (ONLY for initial demo preview)
export function generateMockHistory(baseDate: Date = new Date()): DailyRecord[] {
  const profileKeys = PROFILE_DATA.map((p) => p.key);

  const mockMemos = [
    '친구에게 모르는 수학 문제를 친절하게 가르쳐 주며 깊은 보람을 느꼈다.',
    '국어 시간에 내 의견과 근거를 자신 있게 발표해서 선생님의 칭찬을 들었다.',
    '복도에 떨어진 과자 비닐을 스스로 주워 쓰레기통에 깨끗이 분리수거했다.',
    '쉬는 시간에 새로운 도서관 과학 잡지를 탐독하며 신기한 우주 지식을 배웠다.',
    '미술 협동화 그리기 활동 중 양보하는 미덕을 실천하여 팀워크를 빛냈다.',
    '사회 수행 자료 조사를 도서관에 직접 방문해서 아날로그 책을 찾아 해결했다.',
    '체육 피구 경기 중 넘어져 우는 친구의 상처에 보건실 연고를 들고 가 위로했다.',
    '친구와 팽팽히 엇갈리는 입장이었으나 양보하여 갈등을 평화로이 해소했다.',
    '오늘 수업 도중 내 생각을 자신감 있고 정확히 전달해서 선생님의 기쁨이 되었다.',
    '하교길 쓰레기 수거 및 내 서랍 정돈을 남김없이 말끔히 완료했다.'
  ];

  const records: DailyRecord[] = [];
  for (let i = 1; i <= 365; i++) {
    const pastDate = getPastDateString(i, baseDate);
    const shuffled = [...profileKeys].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 5) + 3; // 3 to 7
    records.push({
      date: pastDate,
      completed: shuffled.slice(0, count),
      submitted: true,
      reflections: [{ profileKey: shuffled[0], text: mockMemos[i % mockMemos.length] }]
    });
  }

  return records.sort((a, b) => a.date.localeCompare(b.date));
}

// Synchronize existing portfolio history.
// CRITICAL: NEVER synthesize or inject mock records if user history exists (even an empty array or single day record)!
// User records MUST be strictly preserved as authentic data without any artificial filler.
export function syncHistoryWithToday(existingHistory: DailyRecord[] | null, baseDate: Date = new Date()): DailyRecord[] {
  if (existingHistory !== null && Array.isArray(existingHistory)) {
    // Strictly preserve user history sorted by date
    return [...existingHistory].sort((a, b) => a.date.localeCompare(b.date));
  }

  // Only if strictly null (completely uninitialized), generate sample mock data for first-time preview
  return generateMockHistory(baseDate);
}

// Compute statistics for the dashboard relative to today's local date
export function calculateStats(history: DailyRecord[], period: TimePeriod, baseDate: Date = new Date()) {
  const profileCounts: Record<LearnerProfileKey, number> = {} as any;
  PROFILE_DATA.forEach((p) => {
    profileCounts[p.key] = 0;
  });

  const today = getLocalDateString(baseDate);

  // Filter based on period
  let daysToCount = 1;
  if (period === 'day') daysToCount = 1;
  if (period === 'week') daysToCount = 7;
  if (period === 'month') daysToCount = 14; // our standard current cycle representation
  if (period === '3months') daysToCount = 90;
  if (period === '6months') daysToCount = 180;
  if (period === '1year') daysToCount = 365;

  const thresholdDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - (daysToCount - 1));
  const thresholdStr = getLocalDateString(thresholdDate);

  const filteredHistory = history.filter((record) => {
    if (period === 'day') {
      return record.date === today;
    }
    return record.date >= thresholdStr && record.date <= today;
  });

  filteredHistory.forEach((record) => {
    record.completed.forEach((key) => {
      if (profileCounts[key] !== undefined) {
        profileCounts[key] += 1;
      }
    });
  });

  // Convert to chart-friendly format
  const chartData = PROFILE_DATA.map((p) => ({
    name: p.name,
    englishName: p.englishName,
    key: p.key,
    value: profileCounts[p.key],
    percentage: filteredHistory.length > 0 
      ? Math.round((profileCounts[p.key] / filteredHistory.length) * 100) 
      : 0,
    color: p.color,
    emoji: p.emoji
  }));

  // Sort to find strengths and areas for growth
  const sorted = [...chartData].sort((a, b) => b.value - a.value);
  
  // Handlers for empty records
  const maxVal = sorted[0]?.value || 0;
  const minVal = sorted[sorted.length - 1]?.value || 0;

  // Calculate weekday vs weekend/holiday stats
  const weekdayRecords = filteredHistory.filter((r) => !isKoreanWeekendOrHoliday(r.date));
  const weekendHolidayRecords = filteredHistory.filter((r) => isKoreanWeekendOrHoliday(r.date));

  const totalActions = filteredHistory.reduce((acc, r) => acc + r.completed.length, 0);
  const weekdayActions = weekdayRecords.reduce((acc, r) => acc + r.completed.length, 0);
  const weekendHolidayActions = weekendHolidayRecords.reduce((acc, r) => acc + r.completed.length, 0);

  return {
    chartData,
    strongest: sorted.length > 0 && sorted[0].value > 0 ? sorted[0] : null,
    weakest: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    totalSubmittedDays: filteredHistory.length,
    weekdaySubmittedDays: weekdayRecords.length,
    weekendHolidaySubmittedDays: weekendHolidayRecords.length,

    averageCompletedPerDay: filteredHistory.length > 0
      ? (totalActions / filteredHistory.length).toFixed(1)
      : '0',
    weekdayAveragePerDay: weekdayRecords.length > 0
      ? (weekdayActions / weekdayRecords.length).toFixed(1)
      : '0',
    weekendHolidayAveragePerDay: weekendHolidayRecords.length > 0
      ? (weekendHolidayActions / weekendHolidayRecords.length).toFixed(1)
      : '0'
  };
}

// Generate the beautiful Badge & Achievements list
export function getBadgesList(history: DailyRecord[]): Badge[] {
  const profileTotals: Record<LearnerProfileKey, number> = {} as any;
  PROFILE_DATA.forEach((p) => {
    profileTotals[p.key] = 0;
  });

  // Compute total counts for each profile
  history.forEach((record) => {
    record.completed.forEach((key) => {
      if (profileTotals[key] !== undefined) {
        profileTotals[key]++;
      }
    });
  });

  const totalDaysCount = history.filter((r) => r.submitted).length;

  const badges: Badge[] = [];

  // 1. Level-based badges for each of the 10 profiles (10 keys * 5 tiers = 50 badges)
  const tierConfigs = [
    { level: 1, requiredCount: 1, suffix: '새싹', emojiOverride: '🌱', desc: '해당 학습자상의 첫 실천을 훌륭히 마쳤습니다!' },
    { level: 2, requiredCount: 5, suffix: '수호자', emojiOverride: '🧭', desc: '해당 영역에서 흔들림 없는 모범이 됩니다.' },
    { level: 3, requiredCount: 15, suffix: '전도사', emojiOverride: '🔥', desc: '친구들에게 적극적으로 긍정 가치를 전파합니다.' },
    { level: 4, requiredCount: 30, suffix: '전문가', emojiOverride: '🎓', desc: '학급 전원의 롤모델이자 주도적인 학습 리더입니다.' },
    { level: 5, requiredCount: 50, suffix: '마스터', emojiOverride: '👑', desc: '해당 학습자상 분야의 최고 권위자 수준에 올랐습니다!' }
  ];

  PROFILE_DATA.forEach((profile) => {
    tierConfigs.forEach((tier) => {
      const id = `${profile.key}_L${tier.level}`;
      const name = `${profile.name} ${tier.suffix}`;
      const emoji = tier.level === 5 ? '👑' : profile.emoji;
      const progress = profileTotals[profile.key];
      const isUnlocked = progress >= tier.requiredCount;

      badges.push({
        id,
        name,
        emoji,
        description: `진정으로 ${profile.name}으로서의 모습을 갖춰가고 있습니다. ${tier.desc}`,
        requirementDescription: `${profile.name} ${tier.requiredCount}회 실천 (현재: ${progress}회)`,
        profileKey: profile.key,
        requiredCount: tier.requiredCount,
        type: 'profile_count'
      });
    });
  });

  // 2. Cumulative milestones for submission streaks (6 badges)
  const milestoneConfigs = [
    { id: 'total_1', name: '꿈의 첫 삽 🗺️', count: 1, desc: 'IB 학습자상 기록 포트폴리오의 첫 걸음을 떼었습니다.' },
    { id: 'total_5', name: '습관의 새싹 📅', count: 5, desc: '배움을 기록하고 성찰하는 아름다운 주간 습관을 지녔습니다.' },
    { id: 'total_10', name: '원칙 수호대 🛡️', count: 10, desc: '꾸준하고 규칙적으로 학습 성찰을 실천하고 있습니다.' },
    { id: 'total_30', name: '영예로운 열정 💖', count: 30, desc: '한 달간 거르지 않고 자신을 탐구하고 성찰했습니다.' },
    { id: 'total_100', name: '100일의 기적 💯', count: 100, desc: '세상을 이롭게 바꾸는 진정한 IB 글로벌 핵심 인재입니다.' },
    { id: 'total_300', name: '성장의 화룡점정 🏆', count: 300, desc: '초등학교 5학년 과정 동안 완벽한 배움의 헌신을 선보였습니다!' }
  ];

  milestoneConfigs.forEach((m) => {
    badges.push({
      id: m.id,
      name: m.name,
      emoji: m.name.split(' ').pop() || '🏅',
      description: m.desc,
      requirementDescription: `총 포트폴리오 제출 ${m.count}일 달성 (현재: ${totalDaysCount}일)`,
      requiredCount: m.count,
      type: 'total_days'
    });
  });

  return badges;
}

// Reconstruct historical records from cumulative profile counts for read-only share view
export function reconstructHistoryFromShared(stats: Record<LearnerProfileKey, number>): DailyRecord[] {
  const records: DailyRecord[] = [];
  const keys = Object.keys(stats) as LearnerProfileKey[];
  const maxCount = Math.max(...Object.values(stats), 1);
  
  for (let d = 0; d < maxCount; d++) {
    const completedThisDay: LearnerProfileKey[] = [];
    keys.forEach(key => {
      if (stats[key] > d) {
        completedThisDay.push(key);
      }
    });
    
    records.push({
      date: getPastDateString(maxCount - d),
      completed: completedThisDay,
      submitted: true,
      memo: '공유된 포트폴리오의 실천 이력입니다.'
    });
  }
  return records;
}


