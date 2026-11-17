import { useEffect, useState } from 'react';
import { Loader2, Flag, Trash2, CheckCircle2 } from 'lucide-react';
import { errorMessage, getBackend } from '../cloud';
import { BoardKind, Entry } from '../cloud/types';
import BoardWall from '../components/BoardWall';
import { input } from './ui';

type Tab = 'share' | 'praise' | 'reports';

// 교사용 '소통' 탭: 학생 화면과 같은 담벼락 모양으로 게시판을 보고, 글을 내릴 수 있음
// - 학생 글은 비속어 검사를 통과하면 바로 올라오므로, 여기에서 살펴보고 필요한 글은 내림
// - '불편해요 신고함'에는 학생이 알린 글만 모아 보여 줌
export default function Inbox({ classId }: { classId: string }) {
  const [boards, setBoards] = useState<Record<BoardKind, Entry[]>>({ praise: [], share: [] });
  const [reports, setReports] = useState<{ postId: string; sid: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('share');
  const [sort, setSort] = useState<'count' | 'recent'>('count');

  useEffect(() => {
    (async () => {
      try {
        const b = await getBackend();
        const [praise, share, r] = await Promise.all([b.getBoard(classId, 'praise'), b.getBoard(classId, 'share'), b.listReports(classId)]);
        setBoards({ praise, share });
        setReports(r);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  const act = async (entry: Entry, fn: (b: Awaited<ReturnType<typeof getBackend>>) => Promise<void>, removed: boolean) => {
    setBusy(entry.id);
    setError('');
    try {
      await fn(await getBackend());
      if (removed) setBoards((b) => ({ ...b, [entry.type]: b[entry.type].filter((p) => p.id !== entry.id) }));
      setReports((l) => l.filter((r) => r.postId !== entry.id));
      setConfirm('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  };
  const remove = (entry: Entry) => act(entry, (b) => b.removeEntry(classId, entry.type, entry.id), true);
  const dismiss = (entry: Entry) => act(entry, (b) => b.clearReports(classId, entry.id), false);

  if (loading) return <div className="py-16 flex items-center justify-center gap-2 text-slate-500 text-sm font-bold"><Loader2 size={18} className="animate-spin" /> 불러오는 중…</div>;

  const reportCount = (id: string) => reports.filter((r) => r.postId === id).length;
  const reported = [...boards.share, ...boards.praise]
    .filter((p) => reportCount(p.id) > 0)
    .sort((a, b) => (sort === 'count' ? reportCount(b.id) - reportCount(a.id) || b.createdAt - a.createdAt : b.createdAt - a.createdAt));

  const TABS: { key: Tab; name: string; count: number }[] = [
    { key: 'share', name: '나눔 게시판', count: boards.share.length },
    { key: 'praise', name: '칭찬 게시판', count: boards.praise.length },
    { key: 'reports', name: '불편해요 신고함', count: reported.length }
  ];
  const small = 'shrink-0 h-8 px-2 rounded-full inline-flex items-center gap-1 text-[11px] font-extrabold cursor-pointer whitespace-nowrap disabled:opacity-50';

  const actions = (entry: Entry) =>
    confirm === entry.id ? (
      <>
        <button type="button" disabled={busy === entry.id} onClick={() => remove(entry)} className={`${small} bg-rose-600 text-white`}>삭제</button>
        <button type="button" onClick={() => setConfirm('')} className={`${small} bg-slate-100 text-slate-600`}>취소</button>
      </>
    ) : (
      <>
        {tab === 'reports' && (
          <button type="button" disabled={busy === entry.id} onClick={() => dismiss(entry)} title="문제 없는 글이에요 (신고만 지우기)" aria-label="문제 없음, 신고 지우기" className={`${small} text-emerald-700 hover:bg-emerald-50`}>
            <CheckCircle2 size={14} /> 문제 없음
          </button>
        )}
        <button type="button" onClick={() => setConfirm(entry.id)} title="글 삭제" aria-label={`${entry.fromName}의 글 삭제`} className="shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
          <Trash2 size={14} />
        </button>
      </>
    );
  const badge = (entry: Entry) =>
    reportCount(entry.id) > 0 ? (
      <p className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-white bg-rose-600 rounded-full px-2 py-0.5 whitespace-nowrap"><Flag size={11} /> 불편해요 {reportCount(entry.id)}명</span>
        {tab === 'reports' && <span className="text-[11px] font-bold text-slate-600 bg-white/80 rounded-full px-2 py-0.5 whitespace-nowrap">{entry.type === 'praise' ? '칭찬 게시판' : '나눔 게시판'}</span>}
      </p>
    ) : null;

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>}
      <p className="text-xs text-slate-500 leading-relaxed">
        학생 글은 비속어 검사를 통과하면 선생님 승인 없이 바로 게시판에 올라가요. 검사는 낱말 목록 방식이라 모든 표현을 걸러 내지는 못하니, 가끔 살펴보시고 알맞지 않은 글은 휴지통을 눌러 삭제해 주세요.
      </p>

      <div role="tablist" className="flex flex-wrap gap-1 bg-slate-200/70 p-1 rounded-xl w-fit max-w-full">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} type="button" onClick={() => { setTab(t.key); setConfirm(''); }}
            className={`h-10 px-3 rounded-lg text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {t.name}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${t.key === 'reports' && t.count > 0 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'reports' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">학생이 ‘불편해요’로 알린 글만 모았어요. 문제가 없으면 ‘문제 없음’, 알맞지 않으면 휴지통을 눌러 주세요.</p>
            <select value={sort} onChange={(e) => setSort(e.target.value as 'count' | 'recent')} aria-label="정렬" className={`${input} !w-auto !h-10`}>
              <option value="count">신고 많은 순</option>
              <option value="recent">최근 글 순</option>
            </select>
          </div>
          <BoardWall entries={reported} empty="신고된 글이 없어요. 👍" actions={actions} badge={badge} />
        </>
      ) : (
        <BoardWall entries={boards[tab]} empty="올라온 글이 없어요." actions={actions} badge={badge} />
      )}
    </div>
  );
}
