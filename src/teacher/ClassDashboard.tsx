import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, Check, RefreshCw, Loader2, Users, CalendarCheck, Target, Eye, X, Download, UserPlus, KeyRound, Trash2, Pencil } from 'lucide-react';
import { PROFILE_DATA, getLocalDateString, parseDateString } from '../data';
import { errorMessage, getBackend } from '../cloud';
import { ClassGoal, ClassInfo, CloudRecord, Feedback, FeedbackMap, Student } from '../cloud/types';
import { FEEDBACK_STAMPS, computeStats, goalProgress } from '../cloud/stats';
import RadarChart from '../components/RadarChart';
import { StudentStat, buildClassStats, displayName, recentSchoolDays } from './stats';
import Inbox from './Inbox';
import { downloadClassSummary, downloadStudentReport } from './report';
import { btnDanger, btnGhost, btnPrimary, card, input, label } from './ui';

type Tab = 'overview' | 'students' | 'activity' | 'inbox' | 'manage';
const TABS: { key: Tab; name: string }[] = [
  { key: 'overview', name: '현황' },
  { key: 'students', name: '학생' },
  { key: 'activity', name: '활동' },
  { key: 'inbox', name: '소통' },
  { key: 'manage', name: '관리' }
];
const shortDate = (d: string) => {
  const date = parseDateString(d);
  return `${date.getMonth() + 1}/${date.getDate()}(${'일월화수목금토'[date.getDay()]})`;
};

interface Props {
  classId: string;
  onBack: () => void;
  onRenamed: (name: string) => void;
  onGone: () => void;
}

export default function ClassDashboard({ classId, onBack, onRenamed, onGone }: Props) {
  const [info, setInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [portfolios, setPortfolios] = useState<Record<string, CloudRecord[]>>({});
  const [feedback, setFeedback] = useState<Record<string, FeedbackMap>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const backend = await getBackend();
      const found = await backend.getClass(classId);
      if (!found) throw new Error('학급을 찾을 수 없어요. 삭제되었을 수 있어요.');
      if (!(await backend.isTeacher(classId))) throw new Error('이 기기는 이 학급의 교사로 등록되어 있지 않아요. ‘다른 기기에서 만든 학급 열기’로 다시 열어 주세요.');
      const [list, ports, fb] = await Promise.all([backend.listStudents(classId), backend.listPortfolios(classId), backend.listFeedback(classId)]);
      setInfo(found);
      setStudents(list);
      setPortfolios(ports);
      setFeedback(fb);
      // 학생들에게 보여 주는 학급 합계를 전체 기록으로 다시 계산해 서버에 맞춰 둠
      backend.setClassStats(classId, computeStats(list.map((st) => ports[st.id] || []))).catch((e) => console.error('학급 합계 저장 실패', e));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  const today = getLocalDateString();
  const cls = useMemo(() => buildClassStats(students, portfolios, today), [students, portfolios, today]);
  const detail = cls.stats.find((s) => s.student.id === detailId) || null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(classId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 복사가 막힌 환경에서는 화면의 코드를 직접 읽으면 됨
    }
  };

  if (loading && !info) {
    return (
      <div className="py-20 flex items-center justify-center gap-2 text-slate-500 text-sm font-bold">
        <Loader2 size={18} className="animate-spin" /> 학급 정보를 불러오는 중…
      </div>
    );
  }
  if (error && !info) {
    return (
      <div className={`${card} p-6 space-y-4`}>
        <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onBack} className={btnGhost}><ArrowLeft size={15} /> 내 학급으로</button>
          <button type="button" onClick={onGone} className={btnGhost}>목록에서 지우기</button>
        </div>
      </div>
    );
  }
  if (!info) return null;

  return (
    <div className="space-y-4">
      {/* 학급 머리말 */}
      <div className={`${card} p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={onBack} aria-label="내 학급으로" className="w-10 h-10 shrink-0 rounded-xl border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate">{info.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">학생 {students.length}명 · 입장 {cls.joinedCount}명</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button type="button" onClick={copyCode} title="학급 코드 복사" className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 inline-flex items-center justify-center gap-2 cursor-pointer">
            <span className="text-[11px] font-bold text-indigo-600">학급 코드</span>
            <span className="font-mono font-black tracking-[0.25em] text-base">{classId}</span>
            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={14} className="text-indigo-500" />}
          </button>
          <button type="button" onClick={load} disabled={loading} aria-label="새로 고침" title="새로 고침" className="w-11 h-11 shrink-0 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div role="tablist" className="grid grid-cols-5 bg-slate-200/70 p-1 rounded-xl sm:inline-grid sm:w-[28rem]">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} type="button" onClick={() => setTab(t.key)}
            className={`h-10 rounded-lg text-sm font-extrabold transition-all cursor-pointer ${tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {t.name}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>}

      {tab === 'overview' && <Overview cls={cls} today={today} onOpen={setDetailId} />}
      {tab === 'students' && (
        <>
          <button type="button" onClick={() => downloadClassSummary(info.name, cls.stats)} className={btnGhost}><Download size={15} /> 학급 요약 내려받기 (엑셀용 CSV)</button>
          <StudentList stats={cls.stats} onOpen={setDetailId} />
        </>
      )}
      {tab === 'activity' && (
        <Activity classId={classId} info={info} progress={info.goal ? goalProgress(info.goal, computeStats(students.map((st) => portfolios[st.id] || []))) : 0} onChange={(patch) => setInfo({ ...info, ...patch })} />
      )}
      {tab === 'inbox' && <Inbox classId={classId} />}
      {tab === 'manage' && (
        <Manage classId={classId} info={info} students={students} reload={load} onRenamed={(n) => { setInfo({ ...info, name: n }); onRenamed(n); }} onGone={onGone} />
      )}

      {detail && (
        <StudentDetail
          stat={detail}
          classId={classId}
          className={info.name}
          feedback={feedback[detail.student.id] || {}}
          onFeedback={(date, fb) =>
            setFeedback((all) => {
              const mine = { ...(all[detail.student.id] || {}) };
              if (fb) mine[date] = fb;
              else delete mine[date];
              return { ...all, [detail.student.id]: mine };
            })
          }
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ 현황
function Overview({ cls, today, onOpen }: { cls: ReturnType<typeof buildClassStats>; today: string; onOpen: (id: string) => void }) {
  const days = recentSchoolDays(5, today);
  const total = cls.stats.length;
  const tiles = [
    { icon: CalendarCheck, name: '오늘 기록한 학생', value: `${cls.todayCount}명`, sub: `전체 ${total}명 중` },
    { icon: Users, name: '이번 주 기록한 학생', value: `${cls.weekCount}명`, sub: '월요일부터 오늘까지' },
    { icon: Target, name: '학급 전체 실천', value: `${cls.totalMissions}개`, sub: `기록 ${cls.totalRecords}일` }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.name} className={`${card} p-4 flex items-center gap-3`}>
            <span className="w-11 h-11 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><t.icon size={20} /></span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500">{t.name}</p>
              <p className="text-xl font-black text-slate-900 leading-tight">{t.value}</p>
              <p className="text-[11px] text-slate-400">{t.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cls.totalRecords > 0 ? (
          <RadarChart data={cls.radarData} maxSubmittedDays={cls.radarMax} title="학급 전체 학습자상" subtitle="우리 반 모두의 실천을 더한 모양" />
        ) : (
          <div className={`${card} p-6 flex items-center justify-center text-sm text-slate-500 text-center min-h-48`}>
            아직 올라온 기록이 없어요. 학생들이 학급 코드로 참여해 기록을 제출하면 여기에 학급 전체 모양이 나타납니다.
          </div>
        )}

        {/* 살펴볼 학생 */}
        <div className={`${card} p-4 sm:p-5`}>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2"><Eye size={16} className="text-indigo-500" /> 살펴볼 학생</h2>
          <p className="text-xs text-slate-500 mt-1">교사에게만 보이는 목록이에요. 학생 화면에는 나타나지 않습니다.</p>
          {cls.attention.length === 0 ? (
            <p className="mt-4 text-sm text-emerald-700 font-bold">👍 지금은 따로 살펴볼 학생이 없어요.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {cls.attention.map((a) => (
                <li key={a.student.id}>
                  <button type="button" onClick={() => onOpen(a.student.id)} className="w-full py-2.5 flex items-start gap-3 text-left hover:bg-slate-50 rounded-lg px-1 cursor-pointer">
                    <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${a.kind === 'not-joined' ? 'bg-slate-100 text-slate-600' : a.kind === 'inactive' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                      {a.kind === 'not-joined' ? '미입장' : a.kind === 'inactive' ? '기록 뜸함' : '빈 영역'}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-800">{displayName(a.student)}</span>
                      <span className="block text-xs text-slate-500 break-keep">{a.text}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 최근 등교일 제출 현황 */}
      <div className={`${card} p-4 sm:p-5`}>
        <h2 className="text-sm font-extrabold text-slate-900">최근 등교일 5일 제출 현황</h2>
        <p className="text-xs text-slate-500 mt-1">숫자는 그날 실천한 미션 수, ‘성찰’은 미션 없이 성찰 기록만 남긴 날이에요.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="text-left font-bold px-2 py-1">학생</th>
                {days.map((d) => (
                  <th key={d} className={`font-bold px-0.5 py-1 leading-tight ${d === today ? 'text-indigo-700' : ''}`}>
                    <span className="block sm:inline">{shortDate(d).split('(')[0]}</span>
                    <span className="block sm:inline">({shortDate(d).split('(')[1]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cls.stats.map((s) => (
                <tr key={s.student.id}>
                  <td className="px-2 py-1">
                    <button type="button" onClick={() => onOpen(s.student.id)} className="font-bold text-slate-800 hover:text-indigo-700 text-left max-w-24 sm:max-w-none truncate block cursor-pointer">{displayName(s.student)}</button>
                  </td>
                  {days.map((d) => {
                    const rec = s.records.find((r) => r.date === d);
                    return (
                      <td key={d} className="px-0.5 py-1 text-center">
                        <span className={`inline-flex items-center justify-center min-w-8 sm:min-w-9 h-7 px-1 rounded-lg text-xs font-extrabold ${
                          !rec ? 'bg-slate-100 text-slate-300' : rec.reflectionOnly ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {!rec ? '–' : rec.reflectionOnly ? '성찰' : rec.completed.length}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 학생 목록
function StudentList({ stats, onOpen }: { stats: StudentStat[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {stats.map((s) => {
        const max = Math.max(1, ...Object.values(s.totals));
        return (
          <button key={s.student.id} type="button" onClick={() => onOpen(s.student.id)} className={`${card} p-4 text-left hover:border-indigo-400 transition-all cursor-pointer`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-slate-900 truncate">{displayName(s.student)}</span>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.student.claimed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                {s.student.claimed ? '입장함' : '미입장'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              기록 {s.days}일 · 미션 {s.missions}개 · {s.lastDate ? `마지막 ${shortDate(s.lastDate)}` : '기록 없음'}
            </p>
            {/* 학습자상별 실천 분포 (작은 막대 10개) */}
            <div className="mt-3 flex items-end gap-1 h-10" aria-hidden="true">
              {PROFILE_DATA.map((p) => (
                <span key={p.key} title={`${p.name} ${s.totals[p.key]}회`} className="flex-1 rounded-t" style={{ height: `${Math.max(6, (s.totals[p.key] / max) * 100)}%`, backgroundColor: s.totals[p.key] ? p.color : '#e2e8f0' }} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ 학생 상세
// 기록 한 건에 남기는 교사 피드백 (도장 + 한 줄). 학생 본인에게만 보임
function FeedbackEditor({ classId, sid, date, value, onSaved }: { classId: string; sid: string; date: string; value?: Feedback; onSaved: (fb: Feedback | null) => void; key?: string }) {
  const [stamp, setStamp] = useState(value?.stamp || '');
  const [text, setText] = useState(value?.text || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = stamp !== (value?.stamp || '') || text.trim() !== (value?.text || '');

  const save = async (fb: Feedback | null) => {
    setBusy(true);
    setError('');
    try {
      await (await getBackend()).setFeedback(classId, sid, date, fb);
      onSaved(fb);
      if (!fb) {
        setStamp('');
        setText('');
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-500 mr-1">피드백</span>
        {FEEDBACK_STAMPS.map((s) => (
          <button key={s.stamp} type="button" aria-pressed={stamp === s.stamp} onClick={() => setStamp(stamp === s.stamp ? '' : s.stamp)}
            className={`h-9 px-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${stamp === s.stamp ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-indigo-400'}`}>
            {s.stamp} {s.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input className={`${input} !h-10`} value={text} maxLength={100} onChange={(e) => setText(e.target.value)} placeholder="한 줄 남기기 (선택)" aria-label={`${date} 기록에 남길 한 줄`} />
        <button type="button" disabled={busy || !dirty || (!stamp && !text.trim())} onClick={() => save({ stamp, text: text.trim(), at: Date.now() })} className={`${btnPrimary} !h-10 !px-3 shrink-0`}>
          {value ? '수정' : '보내기'}
        </button>
        {value && (
          <button type="button" disabled={busy} onClick={() => save(null)} aria-label="피드백 지우기" title="피드백 지우기" className={`${btnGhost} !h-10 !px-3 shrink-0`}><Trash2 size={14} /></button>
        )}
      </div>
      {value && !dirty && <p className="text-[11px] font-bold text-emerald-700">✓ 학생에게 전달됐어요</p>}
      {error && <p role="alert" className="text-xs font-bold text-rose-600">⚠️ {error}</p>}
    </div>
  );
}

function StudentDetail({ stat, classId, className, feedback, onFeedback, onClose }: { stat: StudentStat; classId: string; className: string; feedback: FeedbackMap; onFeedback: (date: string, fb: Feedback | null) => void; onClose: () => void; key?: string }) {
  const [limit, setLimit] = useState(20);
  const max = Math.max(1, ...Object.values(stat.totals));
  const records = [...stat.records].reverse();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex justify-end" role="dialog" aria-modal="true" aria-label={`${displayName(stat.student)} 기록`} onClick={onClose}>
      <div className="w-full sm:max-w-xl h-full bg-slate-50 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-5 h-14 flex items-center justify-between">
          <h2 className="font-black text-slate-900 truncate">{displayName(stat.student)}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"><X size={20} /></button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[['기록한 날', `${stat.days}일`], ['실천한 미션', `${stat.missions}개`], ['마지막 기록', stat.lastDate ? shortDate(stat.lastDate) : '없음']].map(([k, v]) => (
              <div key={k} className={`${card} p-3 text-center`}>
                <p className="text-[11px] font-bold text-slate-500">{k}</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          <div className={`${card} p-4 space-y-2`}>
            <h3 className="text-sm font-extrabold text-slate-900">학습자상별 실천</h3>
            {PROFILE_DATA.map((p) => (
              <div key={p.key} className="flex items-center gap-2 text-xs">
                <span className="w-32 shrink-0 font-bold text-slate-700 truncate">{p.emoji} {p.name}</span>
                <span className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <span className="block h-full rounded-full" style={{ width: `${(stat.totals[p.key] / max) * 100}%`, backgroundColor: p.color }} />
                </span>
                <span className="w-9 shrink-0 text-right font-extrabold text-slate-700">{stat.totals[p.key]}회</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">실천 기록</h3>
              <button type="button" onClick={() => downloadStudentReport(className, stat, feedback)} className={`${btnGhost} !h-9 !px-3 !text-xs`}><Download size={13} /> 성장 리포트 (CSV)</button>
            </div>
            {records.length === 0 && <p className="text-sm text-slate-500">아직 기록이 없어요.</p>}
            {records.slice(0, limit).map((r) => (
              <div key={r.date} className={`${card} p-3.5 space-y-2`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-indigo-700">{r.date} {shortDate(r.date).replace(/^.*\(/, '(')}</span>
                  {r.reflectionOnly ? (
                    <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">성찰 기록만</span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500">미션 {r.completed.length}개</span>
                  )}
                </div>
                {!r.reflectionOnly && (
                  <ul className="space-y-1">
                    {r.completed.map((k) => {
                      const p = PROFILE_DATA.find((x) => x.key === k);
                      return (
                        <li key={k} className="text-xs text-slate-600 flex gap-1.5">
                          <span className="shrink-0" title={p?.name}>{p?.emoji}</span>
                          <span className="break-keep">{r.missions?.[k] || p?.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {(r.reflections || []).map((ref, i) => {
                  const p = ref.profileKey ? PROFILE_DATA.find((x) => x.key === ref.profileKey) : null;
                  return (
                    <p key={i} className="text-sm text-slate-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 break-words">
                      <span className="text-[10px] font-bold text-amber-700 mr-1.5">✍️ {p ? p.name : '성찰'}</span>
                      {ref.text}
                    </p>
                  );
                })}
                {!r.reflections?.length && r.memo && <p className="text-sm text-slate-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 break-words">{r.memo}</p>}
                <FeedbackEditor key={`${stat.student.id}-${r.date}`} classId={classId} sid={stat.student.id} date={r.date} value={feedback[r.date]} onSaved={(fb) => onFeedback(r.date, fb)} />
              </div>
            ))}
            {records.length > limit && (
              <button type="button" onClick={() => setLimit(limit + 30)} className={`${btnGhost} w-full`}>이전 기록 더 보기 ({records.length - limit}일 남음)</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 활동 (중점 학습자상 · 공동 목표)
function Activity({ classId, info, progress, onChange }: { classId: string; info: ClassInfo; progress: number; onChange: (patch: Partial<ClassInfo>) => void }) {
  const [focusKey, setFocusKey] = useState<string>(info.focus?.key || '');
  const [note, setNote] = useState(info.focus?.note || '');
  const [title, setTitle] = useState(info.goal?.title || '');
  const [goalKey, setGoalKey] = useState<string>(info.goal?.profileKey || '');
  const [target, setTarget] = useState(String(info.goal?.target || 100));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (patch: Partial<Pick<ClassInfo, 'focus' | 'goal' | 'extraMissions'>>, text: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await (await getBackend()).updateClassActivity(classId, patch);
      onChange(patch);
      setMsg({ ok: true, text });
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  // 우리 반 미션
  const [mKey, setMKey] = useState<string>(PROFILE_DATA[0].key);
  const [mText, setMText] = useState('');
  const extra = info.extraMissions || {};
  const saveMissions = (key: string, list: string[], text: string) => {
    const next = { ...extra, [key]: list };
    return save({ extraMissions: next }, text);
  };
  const goal = info.goal;
  const pct = goal ? Math.min(100, Math.round((progress / Math.max(1, goal.target)) * 100)) : 0;

  return (
    <div className="space-y-4">
      {msg && <p role="status" className={`text-sm font-bold ${msg.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{msg.ok ? '✅' : '⚠️'} {msg.text}</p>}
      <p className="text-xs text-slate-500">여기에서 정한 내용은 학생 화면의 ‘우리 반’ 메뉴에 나타나요.</p>

      <form className={`${card} p-4 sm:p-5 space-y-3`} onSubmit={(e) => { e.preventDefault(); save({ focus: focusKey ? { key: focusKey as ClassGoal['profileKey'] & string, note: note.trim() } : null }, focusKey ? '중점 학습자상을 정했어요.' : '중점 학습자상을 해제했어요.'); }}>
        <h2 className="text-sm font-extrabold text-slate-900">⭐ 이번 주 중점 학습자상</h2>
        <p className="text-xs text-slate-500">학생의 미션 카드에 ‘이번 주 중점’ 표시가 붙어요. 탐구 단원과 연결해 정해 보세요.</p>
        <div>
          <label className={label} htmlFor="f-key">학습자상</label>
          <select id="f-key" className={input} value={focusKey} onChange={(e) => setFocusKey(e.target.value)}>
            <option value="">정하지 않음</option>
            {PROFILE_DATA.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="f-note">학생에게 한마디 (선택)</label>
          <input id="f-note" className={input} value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="예: 이번 주 탐구 단원에서 질문을 많이 만들어 봐요!" />
        </div>
        <button type="submit" disabled={busy} className={btnPrimary}>저장</button>
      </form>

      <form className={`${card} p-4 sm:p-5 space-y-3`} onSubmit={(e) => {
        e.preventDefault();
        const n = Number(target);
        if (!title.trim()) return setMsg({ ok: false, text: '목표 이름을 입력해 주세요.' });
        if (!Number.isInteger(n) || n < 1 || n > 9999) return setMsg({ ok: false, text: '목표 횟수는 1부터 9999까지 입력해 주세요.' });
        save({ goal: { title: title.trim(), profileKey: (goalKey || null) as ClassGoal['profileKey'], target: n, startDate: goal?.startDate || getLocalDateString() } }, goal ? '공동 목표를 고쳤어요.' : '공동 목표를 시작했어요.');
      }}>
        <h2 className="text-sm font-extrabold text-slate-900">🎯 학급 공동 목표</h2>
        <p className="text-xs text-slate-500">개인 경쟁이 아니라 반 전체가 함께 채우는 목표예요. 시작한 날부터 학급 전체의 실천 횟수를 셉니다.</p>
        {goal && (
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-extrabold text-slate-900 truncate">{goal.title}</span>
              <span className="font-black text-indigo-700 shrink-0">{progress} / {goal.target}번</span>
            </div>
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden"><div className={`h-full rounded-full ${progress >= goal.target ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} /></div>
            <p className="text-[11px] text-slate-500">{goal.startDate}부터 진행 중{progress >= goal.target ? ' · 🎉 달성!' : ''}</p>
          </div>
        )}
        <div>
          <label className={label} htmlFor="g-title">목표 이름</label>
          <input id="g-title" className={input} value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="예: 우리 반 배려 100번!" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="g-key">세는 학습자상</label>
            <select id="g-key" className={input} value={goalKey} onChange={(e) => setGoalKey(e.target.value)}>
              <option value="">모든 학습자상</option>
              {PROFILE_DATA.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="g-target">목표 횟수</label>
            <input id="g-target" className={input} type="number" min={1} max={9999} value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy} className={btnPrimary}>{goal ? '목표 고치기' : '목표 시작하기'}</button>
          {goal && <button type="button" disabled={busy} onClick={() => { save({ goal: null }, '공동 목표를 끝냈어요.'); setTitle(''); }} className={btnGhost}>목표 끝내기</button>}
        </div>
      </form>

      <form className={`${card} p-4 sm:p-5 space-y-3`} onSubmit={(e) => {
        e.preventDefault();
        const t = mText.trim();
        const list = (extra as Record<string, string[]>)[mKey] || [];
        if (t.length < 5) return setMsg({ ok: false, text: '미션은 5글자 이상으로 써 주세요.' });
        if (list.length >= 10) return setMsg({ ok: false, text: '학습자상마다 10개까지 넣을 수 있어요.' });
        if (list.includes(t)) return setMsg({ ok: false, text: '이미 있는 미션이에요.' });
        saveMissions(mKey, [...list, t], '우리 반 미션을 추가했어요.').then(() => setMText(''));
      }}>
        <h2 className="text-sm font-extrabold text-slate-900">🏫 우리 반 미션</h2>
        <p className="text-xs text-slate-500">우리 반에 맞는 미션을 직접 넣을 수 있어요. 학생의 미션 카드에 ‘우리 반 미션으로 바꾸기’가 나타나고, 고르면 그날 미션이 바뀝니다.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select className={input} value={mKey} onChange={(e) => setMKey(e.target.value)} aria-label="미션을 넣을 학습자상">
            {PROFILE_DATA.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.name}</option>)}
          </select>
          <input className={`${input} sm:col-span-2`} value={mText} maxLength={60} onChange={(e) => setMText(e.target.value)} placeholder="예: 급식실에서 조리사 선생님께 인사하기" aria-label="새 미션" />
        </div>
        <button type="submit" disabled={busy} className={btnPrimary}>미션 추가</button>
        {PROFILE_DATA.filter((p) => ((extra as Record<string, string[]>)[p.key] || []).length > 0).map((p) => (
          <div key={p.key}>
            <p className="text-xs font-bold text-slate-700 mt-2">{p.emoji} {p.name}</p>
            <ul className="mt-1 space-y-1">
              {((extra as Record<string, string[]>)[p.key] || []).map((m) => (
                <li key={m} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="flex-1 min-w-0 break-keep">· {m}</span>
                  <button type="button" disabled={busy} aria-label={`미션 지우기: ${m}`} onClick={() => saveMissions(p.key, ((extra as Record<string, string[]>)[p.key] || []).filter((x) => x !== m), '미션을 지웠어요.')} className="w-9 h-9 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </form>
    </div>
  );
}

// ------------------------------------------------------------------ 관리
function Manage({ classId, info, students, reload, onRenamed, onGone }: {
  classId: string; info: ClassInfo; students: Student[]; reload: () => Promise<void>; onRenamed: (name: string) => void; onGone: () => void;
}) {
  const [name, setName] = useState(info.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [nick, setNick] = useState('');
  const [confirm, setConfirm] = useState<{ sid: string; action: 'reset' | 'remove' } | null>(null);
  const [deleteText, setDeleteText] = useState('');

  const run = async (fn: (b: Awaited<ReturnType<typeof getBackend>>) => Promise<void>, message = '') => {
    setBusy(true);
    setError('');
    setDone('');
    try {
      await fn(await getBackend());
      if (message) setDone(message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const nextNumber = Math.max(0, ...students.map((s) => s.number)) + 1;

  return (
    <div className="space-y-4">
      {(error || done) && (
        <p role="status" className={`text-sm font-bold ${error ? 'text-rose-600' : 'text-emerald-700'}`}>{error ? `⚠️ ${error}` : `✅ ${done}`}</p>
      )}

      {/* 학생 안내 */}
      <div className={`${card} p-4 sm:p-5`}>
        <h2 className="text-sm font-extrabold text-slate-900">학생 참여 방법</h2>
        <ol className="mt-2 text-sm text-slate-600 space-y-1 list-decimal list-inside leading-relaxed">
          <li>학생 화면의 <b>환경 설정 → 학급 참여</b>에서 학급 코드 <b className="font-mono tracking-widest text-indigo-700">{classId}</b> 입력</li>
          <li>자기 번호를 고르고, 숫자 4자리 비밀번호를 스스로 정하기</li>
          <li>다른 기기에서는 같은 번호와 비밀번호로 들어오면 기록이 이어져요</li>
        </ol>
      </div>

      {/* 학급 이름 */}
      <form className={`${card} p-4 sm:p-5`} onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(async (b) => { await b.updateClassName(classId, name); onRenamed(name.trim()); }, '학급 이름을 바꿨어요.'); }}>
        <label className={label} htmlFor="m-name">학급 이름</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input id="m-name" className={input} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          <button type="submit" disabled={busy || !name.trim() || name.trim() === info.name} className={`${btnPrimary} shrink-0`}>이름 바꾸기</button>
        </div>
      </form>

      {/* 학생 명단 */}
      <div className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">학생 명단 ({students.length}명)</h2>
            <p className="text-xs text-slate-500 mt-0.5">별명은 선택 사항이에요. 실명 대신 번호만 써도 됩니다.</p>
          </div>
          <button type="button" disabled={busy || students.length >= 40} onClick={() => run(async (b) => { await b.addStudent(classId, nextNumber, ''); await reload(); }, `${nextNumber}번 학생을 추가했어요.`)} className={btnGhost}>
            <UserPlus size={15} /> {nextNumber}번 추가
          </button>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {students.map((s) => (
            <li key={s.id} className="py-2.5 flex flex-wrap items-center gap-2">
              <span className="w-12 shrink-0 text-sm font-black text-slate-900">{s.number}번</span>
              {editing === s.id ? (
                <form className="flex-1 min-w-48 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(async (b) => { await b.updateStudentNickname(classId, s.id, nick || `${s.number}번`); setEditing(null); await reload(); }); }}>
                  <input className={`${input} !h-10`} value={nick} maxLength={12} autoFocus onChange={(e) => setNick(e.target.value)} placeholder="별명 (비우면 번호만)" aria-label={`${s.number}번 별명`} />
                  <button type="submit" disabled={busy} className={`${btnPrimary} !h-10 !px-3 shrink-0`}>저장</button>
                  <button type="button" onClick={() => setEditing(null)} className={`${btnGhost} !h-10 !px-3 shrink-0`}>취소</button>
                </form>
              ) : confirm?.sid === s.id ? (
                <div className="flex-1 min-w-48 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 break-keep">
                    {confirm.action === 'reset' ? '비밀번호를 초기화할까요? 학생이 새 비밀번호를 다시 정하게 돼요. 기록은 그대로예요.' : '이 학생과 기록을 모두 삭제할까요? 되돌릴 수 없어요.'}
                  </span>
                  <button type="button" disabled={busy} className={`${btnDanger} !h-10 !px-3`} onClick={() => run(async (b) => { if (confirm.action === 'reset') await b.resetPin(classId, s.id); else await b.removeStudent(classId, s.id); setConfirm(null); await reload(); }, confirm.action === 'reset' ? `${s.number}번 비밀번호를 초기화했어요.` : `${s.number}번 학생을 삭제했어요.`)}>
                    {confirm.action === 'reset' ? '초기화' : '삭제'}
                  </button>
                  <button type="button" onClick={() => setConfirm(null)} className={`${btnGhost} !h-10 !px-3`}>취소</button>
                </div>
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">
                    {s.nickname !== `${s.number}번` ? s.nickname : <span className="text-slate-400">별명 없음</span>}
                    <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.claimed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{s.claimed ? '입장함' : '미입장'}</span>
                  </span>
                  <span className="flex gap-1 shrink-0">
                    <button type="button" title="별명 바꾸기" aria-label={`${s.number}번 별명 바꾸기`} onClick={() => { setEditing(s.id); setNick(s.nickname !== `${s.number}번` ? s.nickname : ''); setConfirm(null); }} className="w-10 h-10 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"><Pencil size={15} /></button>
                    <button type="button" title="비밀번호 초기화" aria-label={`${s.number}번 비밀번호 초기화`} disabled={!s.claimed} onClick={() => setConfirm({ sid: s.id, action: 'reset' })} className="w-10 h-10 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"><KeyRound size={15} /></button>
                    <button type="button" title="학생 삭제" aria-label={`${s.number}번 학생 삭제`} onClick={() => setConfirm({ sid: s.id, action: 'remove' })} className="w-10 h-10 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"><Trash2 size={15} /></button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* 학급 삭제 */}
      <div className={`${card} p-4 sm:p-5 border-rose-200`}>
        <h2 className="text-sm font-extrabold text-rose-700">학급 전체 삭제</h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed break-keep">
          학년이 끝나면 학급을 삭제해 서버에 남은 학생 기록을 모두 지울 수 있어요. 삭제하면 되돌릴 수 없습니다. 확인을 위해 학급 이름 <b>{info.name}</b>을(를) 그대로 입력해 주세요.
        </p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input className={input} value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder={info.name} aria-label="삭제 확인용 학급 이름" />
          <button type="button" disabled={busy || deleteText.trim() !== info.name} onClick={() => run(async (b) => { await b.deleteClass(classId); onGone(); })} className={`${btnDanger} shrink-0`}>
            <Trash2 size={15} /> 학급과 모든 기록 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
