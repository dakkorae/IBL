import { Badge, BadgeCategory, BadgeStatus, DailyRecord, LearnerProfileKey } from './types';
import {
  PROFILE_DATA,
  getLocalDateString,
  getMissionForDay,
  isKoreanWeekendOrHoliday,
  parseDateString
} from './data';

// =====================================================================
// 배지 설계 (총 62개)
// - 기준: 주 3일쯤 기록하고 하루 4개쯤 실천하는 '보통' 학생이 1년이면 모두 받을 수 있게
//   (1년에 기록 약 110일, 학습자상별 약 45회)
// - 하루에 많이 체크한다고 받는 배지는 없음: 꾸준함·고른 실천·글로 남긴 기록에 보상
// - 연속 기록은 등교일 기준 (주말·공휴일은 건너뛰어도 끊기지 않음)
// =====================================================================

export const BADGE_CATEGORIES: { key: BadgeCategory; title: string; emoji: string; desc: string }[] = [
  { key: 'profile', title: '학습자상 성장 배지', emoji: '🌱', desc: '학습자상마다 3단계 (3회 · 12회 · 30회 실천)' },
  { key: 'streak', title: '꾸준함 배지', emoji: '📅', desc: '기록한 날과 연속 기록 (등교일 기준)' },
  { key: 'balance', title: '고른 성장 배지', emoji: '🌈', desc: '여러 학습자상을 골고루 실천하기' },
  { key: 'writing', title: '기록 배지', emoji: '✏️', desc: '실천 기록을 정성껏 남기기' },
  { key: 'mission', title: '미션 배지', emoji: '🧩', desc: '다양한 미션에 도전하기' },
  { key: 'fun', title: '깜짝 배지', emoji: '🎁', desc: '받기 전까지는 조건이 비밀!' }
];

// 학습자상별 3단계 배지 이름
const PROFILE_TIER_NAMES: Record<LearnerProfileKey, [string, string, string]> = {
  Inquirers: ['호기심 새싹', '질문 수집가', '물음표 박사'],
  Knowledgeable: ['지식 새싹', '척척 정리왕', '걸어 다니는 백과사전'],
  Thinkers: ['생각 새싹', '아이디어 뱅크', '생각 발전소'],
  Communicators: ['소통 새싹', '경청의 달인', '마음 통역사'],
  Principled: ['원칙 새싹', '약속 지킴이', '정직한 나침반'],
  'Open-minded': ['열린 마음 새싹', '다름 탐험가', '세계 시민'],
  Caring: ['배려 새싹', '따뜻한 손길', '우리 반 햇살'],
  'Risk-takers': ['도전 새싹', '용기 충전 완료', '오뚝이 챔피언'],
  Balanced: ['균형 새싹', '몸 튼튼 마음 튼튼', '균형의 달인'],
  Reflective: ['성찰 새싹', '돌아보기 선수', '마음 거울 장인']
};
const PROFILE_TIERS = [
  { level: 1, count: 3, emoji: '🌱', desc: '첫걸음을 내디뎠어요!' },
  { level: 2, count: 12, emoji: '🌿', desc: '실천이 습관이 되어 가고 있어요.' },
  { level: 3, count: 30, emoji: '🌳', desc: '이 학습자상의 멋진 본보기가 되었어요!' }
];

const PROFILE_BADGES: Badge[] = PROFILE_DATA.flatMap((p) =>
  PROFILE_TIERS.map((t) => ({
    id: `${p.key}_L${t.level}`,
    name: PROFILE_TIER_NAMES[p.key][t.level - 1],
    emoji: t.level === 3 ? p.emoji : t.emoji,
    description: `${p.name}으로서 ${t.desc}`,
    requirementDescription: `${p.name} ${t.count}회 실천`,
    category: 'profile' as const,
    profileKey: p.key,
    level: t.level,
    requiredCount: t.count,
    unit: '회'
  }))
);

type Def = Omit<Badge, 'category'>;
const def = (category: BadgeCategory, list: Def[]): Badge[] => list.map((b) => ({ ...b, category }));

const OTHER_BADGES: Badge[] = [
  ...def('streak', [
    { id: 'days_1', name: '첫 발자국', emoji: '🚪', description: '포트폴리오의 첫 기록을 남겼어요. 시작이 반!', requirementDescription: '처음으로 기록 제출', requiredCount: 1, unit: '일' },
    { id: 'days_10', name: '열 번의 약속', emoji: '📅', description: '열 번이나 나와의 약속을 지켰어요.', requirementDescription: '기록한 날 10일', requiredCount: 10, unit: '일' },
    { id: 'days_30', name: '한 달 내공', emoji: '🌙', description: '한 달 치 실천이 차곡차곡 쌓였어요.', requirementDescription: '기록한 날 30일', requiredCount: 30, unit: '일' },
    { id: 'days_60', name: '예순 고개', emoji: '🏔️', description: '높은 고개를 꾸준히 넘어왔어요.', requirementDescription: '기록한 날 60일', requiredCount: 60, unit: '일' },
    { id: 'days_100', name: '백일잔치', emoji: '💯', description: '백 일 동안 자라 온 나를 축하해요!', requirementDescription: '기록한 날 100일', requiredCount: 100, unit: '일' },
    { id: 'streak_3', name: '작심삼일 돌파', emoji: '🔥', description: '작심삼일? 나는 아니지!', requirementDescription: '등교일 3일 연속 기록', requiredCount: 3, unit: '일 연속' },
    { id: 'streak_5', name: '한 주 개근', emoji: '🗓️', description: '월요일부터 금요일까지 빠짐없이!', requirementDescription: '등교일 5일 연속 기록', requiredCount: 5, unit: '일 연속' },
    { id: 'streak_7', name: '멈추지 않는 기차', emoji: '🚂', description: '칙칙폭폭, 실천 기차는 멈추지 않아요.', requirementDescription: '등교일 7일 연속 기록', requiredCount: 7, unit: '일 연속' },
    { id: 'comeback', name: '돌아온 탐험가', emoji: '🪃', description: '쉬어 가도 괜찮아요. 다시 돌아온 것이 멋져요!', requirementDescription: '7일 넘게 쉬었다가 다시 기록', requiredCount: 1, unit: '번' }
  ]),
  ...def('balance', [
    { id: 'rainbow_week', name: '무지개 한 주', emoji: '🌈', description: '한 주 동안 열 가지 색을 모두 칠했어요.', requirementDescription: '한 주(월~일) 동안 10개 학습자상을 모두 실천', requiredCount: 10, unit: '가지' },
    { id: 'all_5', name: '열 가지 색깔', emoji: '🎨', description: '모든 학습자상을 고루 경험했어요.', requirementDescription: '10개 학습자상을 모두 5회 이상 실천', requiredCount: 10, unit: '가지' },
    { id: 'all_15', name: '빈틈없는 성장', emoji: '⚖️', description: '어느 한쪽도 빠지지 않고 고르게 자랐어요.', requirementDescription: '10개 학습자상을 모두 15회 이상 실천', requiredCount: 10, unit: '가지' },
    { id: 'weak_spot', name: '약점 격파', emoji: '🎯', description: '가장 부족한 부분을 스스로 찾아 채웠어요.', requirementDescription: '그때까지 가장 적게 실천한 학습자상을 실천한 날 5번', requiredCount: 5, unit: '번' },
    { id: 'new_me', name: '어제와 다른 나', emoji: '🔄', description: '매번 새로운 모습으로 도전했어요.', requirementDescription: '직전 기록한 날과 겹치지 않는 학습자상만 실천한 날 3번', requiredCount: 3, unit: '번' }
  ]),
  ...def('writing', [
    { id: 'first_line', name: '첫 문장', emoji: '✏️', description: '나의 실천을 처음으로 글로 남겼어요.', requirementDescription: '실천 기록 처음 작성', requiredCount: 1, unit: '줄' },
    { id: 'detail_writer', name: '꼼꼼 기록가', emoji: '📝', description: '자세하게 쓰는 습관이 생겼어요.', requirementDescription: '30글자 이상 쓴 기록 10번', requiredCount: 10, unit: '번' },
    { id: 'chatty_writer', name: '수다쟁이 작가', emoji: '📚', description: '하루에 할 이야기가 이렇게나 많아요!', requirementDescription: '하루에 기록을 3줄 이상 쓴 날 5번', requiredCount: 5, unit: '번' },
    { id: 'collector', name: '기록 수집가', emoji: '🗂️', description: '모든 학습자상의 이야기를 모았어요.', requirementDescription: '10개 학습자상 모두에 대해 기록 한 번 이상 작성', requiredCount: 10, unit: '가지' },
    { id: 'lines_100', name: '백 줄의 이야기', emoji: '📖', description: '나만의 성장 이야기책이 완성되어 가요.', requirementDescription: '실천 기록 누적 100줄', requiredCount: 100, unit: '줄' },
    { id: 'honesty', name: '솔직함이 최고', emoji: '🪞', description: '못 한 날도 솔직하게 돌아볼 줄 아는 용기!', requirementDescription: '체크한 미션이 없는 날 성찰 기록 작성', requiredCount: 1, unit: '번' }
  ]),
  ...def('mission', [
    { id: 'as_given', name: '주는 대로 척척', emoji: '🎁', description: '어떤 미션이든 척척 해내요.', requirementDescription: '미션을 한 번도 바꾸지 않고 제출한 날 10번', requiredCount: 10, unit: '번' },
    { id: 'reroll_master', name: '다시 뽑기의 달인', emoji: '🎲', description: '나에게 딱 맞는 미션을 골라 실천했어요.', requirementDescription: '바꾼 미션을 실천한 날 5번', requiredCount: 5, unit: '번' },
    { id: 'mission_100', name: '미션 백과', emoji: '🧩', description: '서로 다른 미션 백 가지를 경험했어요.', requirementDescription: '서로 다른 미션 100가지 실천', requiredCount: 100, unit: '가지' },
    { id: 'mission_300', name: '미션 삼백', emoji: '🏅', description: '미션 삼백 개! 대단한 실천가예요.', requirementDescription: '실천한 미션 누적 300개', requiredCount: 300, unit: '개' }
  ]),
  ...def('fun', [
    { id: 'monday', name: '월요병 퇴치', emoji: '😴', description: '월요병쯤은 거뜬히 이겨 냈어요!', requirementDescription: '월요일에 기록 5번', hint: '한 주의 시작이 열쇠', requiredCount: 5, unit: '번', secret: true },
    { id: 'friday', name: '금요일의 마무리', emoji: '🎉', description: '한 주를 멋지게 마무리하는 사람!', requirementDescription: '금요일에 기록 5번', hint: '주말 바로 전날을 노려 봐요', requiredCount: 5, unit: '번', secret: true },
    { id: 'weekend', name: '주말에도 반짝', emoji: '🛋️', description: '쉬는 날에도 학습자상은 반짝반짝!', requirementDescription: '주말이나 공휴일에 기록 3번', hint: '학교에 안 가는 날에도…', requiredCount: 3, unit: '번', secret: true },
    { id: 'lucky_77', name: '럭키 세븐', emoji: '🍀', description: '행운의 숫자 77을 만났어요!', requirementDescription: '실천한 미션 누적 77개', hint: '행운의 숫자가 두 번', requiredCount: 77, unit: '개', secret: true },
    { id: 'three_three', name: '삼삼한 하루', emoji: '🎰', description: '딱 세 개, 알맞게 삼삼한 하루!', requirementDescription: '딱 3개만 실천한 날 3번', hint: '많지도 적지도 않게, 딱 그 숫자', requiredCount: 3, unit: '번', secret: true },
    { id: 'four_seasons', name: '사계절 탐험가', emoji: '🌸', description: '봄·여름·가을·겨울을 모두 함께했어요.', requirementDescription: '봄·여름·가을·겨울에 모두 기록', hint: '시간이 조금 걸리는 배지', requiredCount: 4, unit: '계절', secret: true },
    { id: 'new_month', name: '새 달 새 마음', emoji: '🗓️', description: '새 달마다 새 마음으로 시작했어요.', requirementDescription: '서로 다른 6개 달의 첫 주(1~7일)에 기록', hint: '달력이 넘어갈 때를 기억해요', requiredCount: 6, unit: '달', secret: true },
    { id: 'slow_ok', name: '느려도 괜찮아', emoji: '🐢', description: '늦게라도 챙기는 것이 진짜 실천!', requirementDescription: '지난 날짜의 기록을 나중에 채워 넣기', hint: '거북이도 결승선에 도착해요', requiredCount: 1, unit: '번', secret: true }
  ])
];

export const BADGE_DEFINITIONS: Badge[] = [...PROFILE_BADGES, ...OTHER_BADGES];
export const TOTAL_BADGE_COUNT = BADGE_DEFINITIONS.length;

// ---------------------------------------------------------------------
// 배지 판정
// ---------------------------------------------------------------------

export interface BadgeContext {
  customMissionsByDate?: Record<string, Partial<Record<LearnerProfileKey, string>>>;
  rerollCountsByDate?: Record<string, Partial<Record<LearnerProfileKey, number>>>;
}

const ALL_KEYS = PROFILE_DATA.map((p) => p.key);
const charCount = (text: string) => text.replace(/\s/g, '').length;
const dayDiff = (a: string, b: string) =>
  Math.round((parseDateString(b).getTime() - parseDateString(a).getTime()) / 86400000);
const addDays = (dateStr: string, n: number) => {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + n);
  return getLocalDateString(d);
};
// 그 날짜가 속한 주의 월요일
const weekKey = (dateStr: string) => {
  const d = parseDateString(dateStr);
  return addDays(dateStr, -((d.getDay() + 6) % 7));
};
const seasonOf = (dateStr: string) => {
  const m = parseDateString(dateStr).getMonth() + 1;
  return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'fall' : 'winter';
};

// 각 배지의 진행도(숫자)를 계산
export function computeBadgeProgress(history: DailyRecord[], ctx: BadgeContext = {}): Record<string, number> {
  const custom = ctx.customMissionsByDate || {};
  const rerolls = ctx.rerollCountsByDate || {};
  const records = history.filter((r) => r.submitted).sort((a, b) => a.date.localeCompare(b.date));
  const missionRecords = records.filter((r) => !r.reflectionOnly); // 실제로 미션을 실천한 날
  const p: Record<string, number> = {};

  // --- 학습자상 성장 (성찰만 남긴 날도 '성찰하는 사람' 1회로 셈)
  const totals = Object.fromEntries(ALL_KEYS.map((k) => [k, 0])) as Record<LearnerProfileKey, number>;
  records.forEach((r) => r.completed.forEach((k) => { if (k in totals) totals[k]++; }));
  PROFILE_BADGES.forEach((b) => { p[b.id] = totals[b.profileKey!]; });

  // --- 꾸준함
  const days = records.length;
  ['days_1', 'days_10', 'days_30', 'days_60', 'days_100'].forEach((id) => { p[id] = days; });

  const recorded = new Set(records.map((r) => r.date));
  let best = 0;
  if (records.length > 0) {
    let run = 0;
    const last = records[records.length - 1].date;
    for (let d = records[0].date; d <= last; d = addDays(d, 1)) {
      if (isKoreanWeekendOrHoliday(d)) continue; // 쉬는 날은 연속 기록을 끊지 않음
      run = recorded.has(d) ? run + 1 : 0;
      best = Math.max(best, run);
    }
  }
  ['streak_3', 'streak_5', 'streak_7'].forEach((id) => { p[id] = best; });

  let comebacks = 0;
  for (let i = 1; i < records.length; i++) {
    if (dayDiff(records[i - 1].date, records[i].date) > 8) comebacks++; // 사이에 빈 날이 7일 넘게
  }
  p.comeback = comebacks;

  // --- 고른 성장
  const weekSets: Record<string, Set<LearnerProfileKey>> = {};
  records.forEach((r) => {
    const w = weekKey(r.date);
    weekSets[w] = weekSets[w] || new Set();
    r.completed.forEach((k) => weekSets[w].add(k));
  });
  p.rainbow_week = Math.max(0, ...Object.values(weekSets).map((s) => s.size));
  p.all_5 = ALL_KEYS.filter((k) => totals[k] >= 5).length;
  p.all_15 = ALL_KEYS.filter((k) => totals[k] >= 15).length;

  let weakSpot = 0;
  const running = Object.fromEntries(ALL_KEYS.map((k) => [k, 0])) as Record<LearnerProfileKey, number>;
  records.forEach((r) => {
    if (!r.reflectionOnly && r.completed.length > 0) {
      const min = Math.min(...ALL_KEYS.map((k) => running[k]));
      if (r.completed.some((k) => running[k] === min)) weakSpot++;
    }
    r.completed.forEach((k) => { if (k in running) running[k]++; });
  });
  p.weak_spot = weakSpot;

  let newMe = 0;
  for (let i = 1; i < missionRecords.length; i++) {
    const prev = missionRecords[i - 1].completed;
    const cur = missionRecords[i].completed;
    if (prev.length > 0 && cur.length > 0 && !cur.some((k) => prev.includes(k))) newMe++;
  }
  p.new_me = newMe;

  // --- 기록 (예전 자유 메모는 한 줄로 셈)
  const linesOf = (r: DailyRecord) =>
    r.reflections && r.reflections.length > 0
      ? r.reflections
      : r.memo
        ? [{ profileKey: null, text: r.memo }]
        : [];
  const allLines = records.flatMap(linesOf);
  p.first_line = allLines.length;
  p.lines_100 = allLines.length;
  p.detail_writer = allLines.filter((l) => charCount(l.text) >= 30).length;
  p.chatty_writer = records.filter((r) => linesOf(r).length >= 3).length;
  p.collector = new Set(allLines.map((l) => l.profileKey).filter(Boolean)).size;
  p.honesty = records.filter((r) => r.reflectionOnly).length;

  // --- 미션
  const missionCount = missionRecords.reduce((s, r) => s + r.completed.length, 0);
  p.as_given = missionRecords.filter((r) => {
    const counts = rerolls[r.date] || {};
    return Object.values(counts).every((c) => !c);
  }).length;
  p.reroll_master = missionRecords.filter((r) => r.completed.some((k) => !!custom[r.date]?.[k])).length;
  const distinct = new Set<string>();
  missionRecords.forEach((r) =>
    r.completed.forEach((k) => distinct.add(`${k}|${getMissionForDay(k, r.date, custom[r.date] as Record<string, string> | undefined)}`))
  );
  p.mission_100 = distinct.size;
  p.mission_300 = missionCount;

  // --- 깜짝
  const dow = (d: string) => parseDateString(d).getDay();
  p.monday = records.filter((r) => dow(r.date) === 1).length;
  p.friday = records.filter((r) => dow(r.date) === 5).length;
  p.weekend = records.filter((r) => isKoreanWeekendOrHoliday(r.date)).length;
  p.lucky_77 = missionCount;
  p.three_three = missionRecords.filter((r) => r.completed.length === 3).length;
  p.four_seasons = new Set(records.map((r) => seasonOf(r.date))).size;
  p.new_month = new Set(records.filter((r) => Number(r.date.slice(8, 10)) <= 7).map((r) => r.date.slice(0, 7))).size;
  p.slow_ok = records.filter((r) => r.submittedAt && r.submittedAt > r.date).length;

  return p;
}

// 모든 배지의 정의 + 진행도 + 획득 여부
export function evaluateBadges(history: DailyRecord[], ctx: BadgeContext = {}): BadgeStatus[] {
  const progress = computeBadgeProgress(history, ctx);
  return BADGE_DEFINITIONS.map((b) => {
    const value = progress[b.id] || 0;
    return { ...b, progress: value, unlocked: value >= b.requiredCount };
  });
}
