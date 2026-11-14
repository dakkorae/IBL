import { useEffect, useState } from 'react';
import { Loader2, Check, X, Flag, Trash2 } from 'lucide-react';
import { PROFILE_DATA } from '../data';
import { errorMessage, getBackend } from '../cloud';
import { REACTIONS } from '../cloud/stats';
import { Post, Reaction } from '../cloud/types';
import { btnGhost, btnPrimary, card } from './ui';

// 교사용 '소통' 탭: 승인 대기함, 알림 받은 글, 게시판 관리
export default function Inbox({ classId }: { classId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<{ postId: string; sid: string }[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const b = await getBackend();
        const [p, r, x] = await Promise.all([b.listPosts(classId), b.listReports(classId), b.listReactions(classId)]);
        setPosts(p);
        setReports(r);
        setReactions(x);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  const act = async (post: Post, status: Post['status'], fn: (b: Awaited<ReturnType<typeof getBackend>>) => Promise<void>) => {
    setBusy(post.id);
    setError('');
    try {
      await fn(await getBackend());
      setPosts((l) => l.map((p) => (p.id === post.id ? { ...p, status } : p)));
      if (status === 'removed') setReports((l) => l.filter((r) => r.postId !== post.id));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  };
  const review = (post: Post, ok: boolean) => act(post, ok ? 'approved' : 'rejected', (b) => b.reviewPost(classId, post, ok));
  const remove = (post: Post) => act(post, 'removed', (b) => b.removeFromBoard(classId, post.id));

  if (loading) return <div className="py-16 flex items-center justify-center gap-2 text-slate-500 text-sm font-bold"><Loader2 size={18} className="animate-spin" /> 불러오는 중…</div>;

  const pending = posts.filter((p) => p.status === 'pending');
  const board = posts.filter((p) => p.type === 'share' && p.status === 'approved');
  const notes = posts.filter((p) => p.type === 'note' && p.status === 'approved');
  const reportCount = (id: string) => reports.filter((r) => r.postId === id).length;
  const reactionText = (id: string) => REACTIONS.map((r) => `${r.emoji} ${reactions.filter((x) => x.postId === id && x.kind === r.kind).length}`).join('  ');

  const body = (p: Post) => {
    const prof = PROFILE_DATA.find((x) => x.key === p.profileKey);
    return (
      <div className="min-w-0 flex-1">
        <p className="text-xs flex flex-wrap items-center gap-1.5">
          <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${p.type === 'note' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-800'}`}>{p.type === 'note' ? '칭찬 쪽지' : '게시판'}</span>
          <span className="font-black text-slate-900">{p.fromName}</span>
          {p.toName && <span className="text-slate-500">→ {p.toName}</span>}
          {prof && <span className="text-slate-500">{prof.emoji} {prof.name}</span>}
        </p>
        <p className="text-sm text-slate-800 mt-1 break-words">{p.text}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>}

      <div className={`${card} p-4 sm:p-5`}>
        <h2 className="text-sm font-extrabold text-slate-900">승인 대기함 ({pending.length})</h2>
        <p className="text-xs text-slate-500 mt-1">승인하면 쪽지는 받는 학생에게 전달되고, 게시판 글은 학급 게시판에 올라가요.</p>
        {pending.length === 0 ? <p className="mt-3 text-sm text-slate-500">확인할 글이 없어요.</p> : (
          <ul className="mt-3 divide-y divide-slate-100">
            {pending.map((p) => (
              <li key={p.id} className="py-3 flex flex-wrap items-start gap-3">
                {body(p)}
                <div className="flex gap-2 shrink-0">
                  <button type="button" disabled={busy === p.id} onClick={() => review(p, true)} className={`${btnPrimary} !h-10 !px-3`}><Check size={15} /> 승인</button>
                  <button type="button" disabled={busy === p.id} onClick={() => review(p, false)} className={`${btnGhost} !h-10 !px-3`}><X size={15} /> 돌려보내기</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${card} p-4 sm:p-5`}>
        <h2 className="text-sm font-extrabold text-slate-900">나눔 게시판 ({board.length})</h2>
        {board.length === 0 ? <p className="mt-3 text-sm text-slate-500">게시된 글이 없어요.</p> : (
          <ul className="mt-3 divide-y divide-slate-100">
            {[...board].sort((a, b) => reportCount(b.id) - reportCount(a.id)).map((p) => (
              <li key={p.id} className="py-3 flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  {body(p)}
                  <p className="text-xs font-bold text-slate-500 mt-1.5">
                    {reactionText(p.id)}
                    {reportCount(p.id) > 0 && <span className="ml-3 text-rose-600 inline-flex items-center gap-1"><Flag size={12} /> 불편해요 {reportCount(p.id)}명</span>}
                  </p>
                </div>
                <button type="button" disabled={busy === p.id} onClick={() => remove(p)} className={`${btnGhost} !h-10 !px-3 shrink-0`}><Trash2 size={14} /> 내리기</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${card} p-4 sm:p-5`}>
        <h2 className="text-sm font-extrabold text-slate-900">전달된 칭찬 쪽지 ({notes.length})</h2>
        {notes.length === 0 ? <p className="mt-3 text-sm text-slate-500">전달된 쪽지가 없어요.</p> : (
          <ul className="mt-3 divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {notes.map((p) => <li key={p.id} className="py-3 flex">{body(p)}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
