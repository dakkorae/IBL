import { TimePeriod } from '../types';

export const PERIODS: { key: TimePeriod; label: string; days: number }[] = [
  { key: 'day', label: '오늘', days: 1 },
  { key: 'week', label: '7일', days: 7 },
  { key: 'month', label: '14일', days: 14 },
  { key: '3months', label: '3개월', days: 90 },
  { key: '6months', label: '6개월', days: 180 },
  { key: '1year', label: '1년', days: 365 }
];

// 분석 기간 고르기 (대시보드와 우리 반 레이더가 함께 씀)
export default function PeriodTabs({ value, onChange, label = '분석 기준 기간' }: { value: TimePeriod; onChange: (p: TimePeriod) => void; label?: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap bg-slate-100 p-1 rounded-xl">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={value === p.key}
            onClick={() => onChange(p.key)}
            className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
              value === p.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
