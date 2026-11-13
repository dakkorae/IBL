import { LearnerProfileKey } from '../types';
import { PROFILE_DATA, getLocalDateString, isKoreanWeekendOrHoliday, parseDateString } from '../data';
import { CloudRecord, Student } from '../cloud/types';

export interface StudentStat {
  student: Student;
  records: CloudRecord[]; // 날짜순
  days: number; // 기록한 날
  missions: number; // 실천한 미션 수
  totals: Record<LearnerProfileKey, number>;
  lastDate: string | null;
  daysSinceLast: number | null;
}

export interface AttentionItem {
  student: Student;
  kind: 'not-joined' | 'inactive' | 'gap';
  text: string;
}

const KEYS = PROFILE_DATA.map((p) => p.key);
const emptyTotals = () => Object.fromEntries(KEYS.map((k) => [k, 0])) as Record<LearnerProfileKey, number>;
const diffDays = (from: string, to: string) =>
  Math.round((parseDateString(to).getTime() - parseDateString(from).getTime()) / 86400000);

// 오늘을 포함해 최근 등교일 n일 (주말·공휴일 제외), 오래된 날짜부터
export function recentSchoolDays(n: number, today = getLocalDateString()): string[] {
  const out: string[] = [];
  const d = parseDateString(today);
  while (out.length < n) {
    const s = getLocalDateString(d);
    if (!isKoreanWeekendOrHoliday(s)) out.unshift(s);
    d.setDate(d.getDate() - 1);
  }
  return out;
}

export function buildClassStats(students: Student[], portfolios: Record<string, CloudRecord[]>, today = getLocalDateString()) {
  const stats: StudentStat[] = students.map((student) => {
    const records = (portfolios[student.id] || []).filter((r) => r.submitted);
    const totals = emptyTotals();
    let missions = 0;
    records.forEach((r) => {
      r.completed.forEach((k) => {
        if (k in totals) totals[k] += 1;
      });
      if (!r.reflectionOnly) missions += r.completed.length;
    });
    const lastDate = records.length ? records[records.length - 1].date : null;
    return {
      student,
      records,
      days: records.length,
      missions,
      totals,
      lastDate,
      daysSinceLast: lastDate ? diffDays(lastDate, today) : null
    };
  });

  // 학급 전체 합계
  const classTotals = emptyTotals();
  stats.forEach((s) => KEYS.forEach((k) => (classTotals[k] += s.totals[k])));
  const totalRecords = stats.reduce((sum, s) => sum + s.days, 0);
  const radarData = PROFILE_DATA.map((p) => ({
    name: p.name,
    englishName: p.englishName,
    key: p.key,
    value: classTotals[p.key],
    percentage: totalRecords > 0 ? Math.round((classTotals[p.key] / totalRecords) * 100) : 0,
    color: p.color,
    emoji: p.emoji
  }));

  const monday = (() => {
    const d = parseDateString(today);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return getLocalDateString(d);
  })();
  const todayCount = stats.filter((s) => s.records.some((r) => r.date === today)).length;
  const weekCount = stats.filter((s) => s.records.some((r) => r.date >= monday && r.date <= today)).length;

  // 살펴볼 학생: 순위가 아니라 도움이 필요할 수 있는 학생을 교사에게만 알려 줌
  const attention: AttentionItem[] = [];
  stats.forEach((s) => {
    if (!s.student.claimed) {
      attention.push({
        student: s.student,
        kind: 'not-joined',
        text: s.days > 0 ? '비밀번호를 초기화했어요. 새 비밀번호를 정해 다시 들어오면 돼요' : '아직 학급에 들어오지 않았어요'
      });
    } else if (s.daysSinceLast === null) {
      attention.push({ student: s.student, kind: 'inactive', text: '들어왔지만 아직 기록이 없어요' });
    } else if (s.daysSinceLast >= 7) {
      attention.push({ student: s.student, kind: 'inactive', text: `${s.daysSinceLast}일째 기록이 없어요` });
    } else if (s.days >= 8) {
      const missing = PROFILE_DATA.filter((p) => s.totals[p.key] === 0);
      if (missing.length > 0) {
        attention.push({
          student: s.student,
          kind: 'gap',
          text: `아직 한 번도 실천하지 않은 학습자상: ${missing.map((p) => p.name).join(', ')}`
        });
      }
    }
  });

  return {
    stats,
    classTotals,
    radarData,
    radarMax: Math.max(0, ...Object.values(classTotals)),
    totalRecords,
    totalMissions: stats.reduce((sum, s) => sum + s.missions, 0),
    joinedCount: students.filter((s) => s.claimed).length,
    todayCount,
    weekCount,
    attention
  };
}

export type ClassStats = ReturnType<typeof buildClassStats>;
export const displayName = (s: Student) => (s.nickname && s.nickname !== `${s.number}번` ? `${s.number}번 ${s.nickname}` : `${s.number}번`);
