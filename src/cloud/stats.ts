import { DailyRecord, LearnerProfileKey } from '../types';
import { ClassGoal, ClassPublicStats, StatsDelta } from './types';

export const emptyStats = (): ClassPublicStats => ({ totals: {}, records: 0, missions: 0, days: {} });

const missionCount = (r: DailyRecord | undefined) => (r && r.submitted && !r.reflectionOnly ? r.completed.length : 0);

// 한 날짜의 기록이 before → after 로 바뀔 때 학급 합계가 얼마나 달라지는지
export function recordDelta(before: DailyRecord | undefined, after: DailyRecord): StatsDelta {
  const had = before && before.submitted ? before.completed : [];
  const keys: Partial<Record<LearnerProfileKey, number>> = {};
  after.completed.forEach((k) => {
    if (!had.includes(k)) keys[k] = 1;
  });
  had.forEach((k) => {
    if (!after.completed.includes(k)) keys[k] = -1;
  });
  return {
    date: after.date,
    students: before && before.submitted ? 0 : 1,
    missions: missionCount(after) - missionCount(before),
    keys
  };
}

// 교사 화면에서 전체 기록으로 합계를 정확히 다시 계산 (변화량 누적으로 생긴 어긋남을 바로잡음)
export function computeStats(recordLists: DailyRecord[][]): ClassPublicStats {
  const stats = emptyStats();
  recordLists.forEach((records) =>
    records
      .filter((r) => r.submitted)
      .forEach((r) => {
        const day = (stats.days[r.date] = stats.days[r.date] || { students: 0, keys: {} });
        day.students += 1;
        stats.records += 1;
        stats.missions += missionCount(r);
        r.completed.forEach((k) => {
          day.keys[k] = (day.keys[k] || 0) + 1;
          stats.totals[k] = (stats.totals[k] || 0) + 1;
        });
      })
  );
  return stats;
}

// 공동 목표 진행도: 시작일 이후 학급 전체의 실천 횟수
export function goalProgress(goal: ClassGoal, stats: ClassPublicStats | null): number {
  if (!stats) return 0;
  return Object.entries(stats.days)
    .filter(([date]) => date >= goal.startDate)
    .reduce((sum, [, day]) => {
      const keys = day.keys || {};
      return sum + (goal.profileKey ? keys[goal.profileKey] || 0 : Object.values(keys).reduce((a, b) => a + (b || 0), 0));
    }, 0);
}

// 공동 목표 중 내가 실천한 횟수
export function myGoalCount(goal: ClassGoal, history: DailyRecord[]): number {
  return history
    .filter((r) => r.submitted && r.date >= goal.startDate)
    .reduce((sum, r) => sum + (goal.profileKey ? (r.completed.includes(goal.profileKey) ? 1 : 0) : r.completed.length), 0);
}

export const FEEDBACK_STAMPS = [
  { stamp: '👍', label: '잘했어요' },
  { stamp: '🌟', label: '멋져요' },
  { stamp: '💪', label: '응원해요' },
  { stamp: '❤️', label: '고마워요' }
];
