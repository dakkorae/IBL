import { useEffect, useState } from 'react';
import { Loader2, Flag, Trash2 } from 'lucide-react';
import { PROFILE_DATA } from '../data';
import { errorMessage, getBackend } from '../cloud';
import { REACTIONS } from '../cloud/stats';
import { BoardKind, Entry, Reaction } from '../cloud/types';
import { btnGhost, card } from './ui';

// 교사용 '소통' 탭: 칭찬 게시판 · 나눔 게시판 관리
// - 학생 글은 비속어 검사를 통과하면 바로 올라오므로, 여기에서 살펴보고 필요한 글은 내림
// - 학생이 '불편해요'로 알린 글이 맨 위에 보임
export default function Inbox({ classId }: { classId: string }) {
  const [boards, setBoards] = useState<Record<BoardKind, Entry[]>>({ praise: [], share: [] });
  const [reports, setReports] = useState<{ postId: string; sid: string }[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const b = await getBackend();
        const [praise, share, r, x] = await Promise.all([b.getBoard(classId, 'praise'), b.getBoard(classId, 'share'), b.listReports(classId), b.listReactions(classId)]);
        setBoards({ praise, share });
        setReports(r);
        setReactions(x);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  const remove = async (entry: Entry) => {
    setBusy(entry.id);
    setError('');
    try {
      await (await getBackend()).removeEntry(classId, entry.type, entry.id);
      setBoards((b) => ({ ...b, [entry.type]: b[entry.type].filter((p) => p.id !== entry.id) }));
      setReports((l) => l.filter((r) => r.postId !== entry.id));
      setConfirm('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  };

  if (loading) return <div className="py-16 flex items-center justify-center gap-2 text-slate-500 text-sm font-bold"><Loader2 size={18} className="animate-spin" /> 불러오는 중…</div>;

  const reportCount = (id: string) => reports.filter((r) => r.postId === id).length;
  const reactionText = (id: string) => REACTIONS.map((r) => `${r.emoji} ${reactions.filter((x) => x.postId === id && x.kind === r.kind).length}`).join('  ');

  const section = (kind: BoardKind, title: string) => {
    const list = [...boards[kind]].sort((a, b) => reportCount(b.id) - reportCount(a.id) || b.createdAt - a.createdAt);
    return (
      <div className={`${card} p-4 sm:p-5`}>
        <h2 className="text-sm font-extrabold text-slate-900">{title} ({list.length})</h2>
        {list.length === 0 ? <p className="mt-3 text-sm text-slate-500">올라온 글이 없어요.</p> : (
          <ul className="mt-3 divide-y divide-slate-100 max-h-[32rem] overflow-y-auto">
            {list.map((p) => {
              const prof = PROFILE_DATA.find((x) => x.key === p.profileKey);
              return (
                <li key={p.id} className="py-3 flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="text-xs flex flex-wrap items-center gap-1.5">
                      <span className="font-black text-slate-900 break-all">{p.fromName}</span>
                      {p.toName && <span className="font-bold text-rose-600 break-all">→ {p.toName}</span>}
                      {prof && <span className="text-slate-500 whitespace-nowrap">{prof.emoji} {prof.name}</span>}
                      <span className="text-slate-400 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                    </p>
                    <p className="text-sm text-slate-800 mt-1 break-words whitespace-pre-line">{p.text}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{reactionText(p.id)}</span>
                      {reportCount(p.id) > 0 && <span className="text-rose-600 inline-flex items-center gap-1"><Flag size={12} /> 불편해요 {reportCount(p.id)}명</span>}
                    </p>
                  </div>
                  {confirm === p.id ? (
                    <span className="flex gap-2 shrink-0">
                      <button type="button" disabled={busy === p.id} onClick={() => remove(p)} className={`${btnGhost} !h-10 !px-3 !text-rose-600 !border-rose-200`}>정말 내리기</button>
                      <button type="button" onClick={() => setConfirm('')} className={`${btnGhost} !h-10 !px-3`}>취소</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirm(p.id)} className={`${btnGhost} !h-10 !px-3 shrink-0`}><Trash2 size={14} /> 내리기</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>}
      <p className="text-xs text-slate-500 leading-relaxed">
        학생 글은 비속어 검사를 통과하면 선생님 승인 없이 바로 게시판에 올라가요. 검사는 낱말 목록 방식이라 모든 표현을 걸러 내지는 못하니, 가끔 살펴보시고 알맞지 않은 글은 ‘내리기’를 눌러 주세요.
      </p>
      {section('praise', '칭찬 게시판')}
      {section('share', '나눔 게시판')}
    </div>
  );
}
