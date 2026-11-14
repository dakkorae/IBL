import { PROFILE_DATA } from '../data';
import { FeedbackMap } from '../cloud/types';
import { StudentStat, displayName } from './stats';

// 엑셀에서 바로 열리는 CSV 파일로 내려받기 (한글이 깨지지 않도록 BOM 포함)
function download(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 학급 요약: 학생별 한 줄
export function downloadClassSummary(className: string, stats: StudentStat[]) {
  download(`${className}_학급요약.csv`, [
    ['학생', '입장', '기록한 날', '실천한 미션', '마지막 기록', ...PROFILE_DATA.map((p) => p.name)],
    ...stats.map((s) => [displayName(s.student), s.student.claimed ? 'O' : '', s.days, s.missions, s.lastDate || '', ...PROFILE_DATA.map((p) => s.totals[p.key])])
  ]);
}

// 학생 성장 리포트: 날짜별 실천·기록·피드백
export function downloadStudentReport(className: string, stat: StudentStat, feedback: FeedbackMap) {
  const name = (k: string | null) => PROFILE_DATA.find((p) => p.key === k)?.name || '성찰';
  download(`${className}_${displayName(stat.student)}_성장리포트.csv`, [
    ['날짜', '실천한 학습자상', '실천한 미션', '실천 기록', '교사 피드백'],
    ...stat.records.map((r) => [
      r.date,
      r.reflectionOnly ? '(성찰 기록만)' : r.completed.map(name).join(', '),
      r.reflectionOnly ? '' : r.completed.map((k) => r.missions?.[k] || '').filter(Boolean).join(' / '),
      (r.reflections || []).map((x) => `[${name(x.profileKey)}] ${x.text}`).join(' / ') || r.memo || '',
      feedback[r.date] ? `${feedback[r.date].stamp} ${feedback[r.date].text}`.trim() : ''
    ]),
    [],
    ['학습자상', '실천 횟수'],
    ...PROFILE_DATA.map((p) => [p.name, stat.totals[p.key]])
  ]);
}
