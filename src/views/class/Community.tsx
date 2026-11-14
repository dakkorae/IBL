import React, { useEffect, useState } from 'react';
import { Loader2, Send, Flag, Mail, Megaphone } from 'lucide-react';
import { LearnerProfileKey } from '../../types';
import { PROFILE_DATA } from '../../data';
import { errorMessage, getBackend } from '../../cloud';
import { REACTIONS } from '../../cloud/stats';
import { Entry, Post, Reaction, ReactionKind, Student } from '../../cloud/types';
import { usePortfolio } from '../../state/PortfolioContext';

const card = 'bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm';
const input =
  'w-full h-11 px-3 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800';
const primary =
  'h-11 px-5 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-extrabold rounded-xl cursor-pointer disabled:cursor-not-allowed';
const STATUS: Record<Post['status'], { text: string; cls: string }> = {
  pending: { text: '선생님 확인 대기 중', cls: 'bg-amber-100 text-amber-800' },
  approved: { text: '전달됨', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { text: '돌려보냄', cls: 'bg-slate-200 text-slate-600' },
  removed: { text: '내려감', cls: 'bg-slate-200 text-slate-600' }
};
const profileOf = (key: LearnerProfileKey | null) => PROFILE_DATA.find((p) => p.key === key);
const chars = (t: string) => t.replace(/\s/g, '').length;

// 공감 스티커 줄: 내가 누른 것만 표시되고, 개수는 글쓴이에게만 보임
function Stickers({ entry, mine, counts, onPick }: { entry: Entry; mine?: ReactionKind; counts?: Partial<Record<ReactionKind, number>>; onPick: (k: ReactionKind | null) => void; key?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTIONS.map((r) => (
        <button
          key={r.kind}
          type="button"
          aria-pressed={mine === r.kind}
          aria-label={`${entry.fromName}의 글에 ${r.label}`}
          onClick={() => onPick(mine === r.kind ? null : r.kind)}
          className={`h-9 px-2.5 rounded-full border text-xs font-bold cursor-pointer transition-all ${
            mine === r.kind ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
          }`}
        >
          {r.emoji} {r.label}
          {counts && counts[r.kind] ? <span className="ml-1 opacity-80">{counts[r.kind]}</span> : null}
        </button>
      ))}
    </div>
  );
}

// 우리 반 > 칭찬 쪽지 · 나눔 게시판
export default function Community({ mode }: { mode: 'notes' | 'board' }) {
  const { classSession, history, updateCommunity, showToast } = usePortfolio();
  const cid = classSession!.classId;
  const me = classSession!.sid;
  const myName = classSession!.nickname;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [board, setBoard] = useState<Entry[]>([]);
  const [inbox, setInbox] = useState<Entry[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [mine, setMine] = useState<Reaction[]>([]);
  const [toMe, setToMe] = useState<Reaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [reported, setReported] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  // 쓰기 양식
  const [to, setTo] = useState('');
  const [key, setKey] = useState('');
  const [text, setText] = useState('');
  const [pick, setPick] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const b = await getBackend();
      const [bd, ib, mp, rx, st] = await Promise.all([
        b.getBoard(cid),
        b.getInbox(cid, me),
        b.listMyPosts(cid, me),
        b.getMyReactions(cid, me),
        students.length ? Promise.resolve(students) : b.listStudents(cid)
      ]);
      setBoard(bd);
      setInbox(ib);
      setMyPosts(mp);
      setMine(rx.mine);
      setToMe(rx.toMe);
      setStudents(st);
      updateCommunity({
        notes: mp.filter((p) => p.type === 'note' && p.status === 'approved').length,
        shares: mp.filter((p) => p.type === 'share' && p.status === 'approved').length
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, me]);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const react = (entry: Entry, kind: ReactionKind | null) =>
    act(async () => {
      await (await getBackend()).setReaction(cid, { postId: entry.id, sid: me, author: entry.from, kind });
      setMine((list) => [...list.filter((r) => r.postId !== entry.id), ...(kind ? [{ postId: entry.id, sid: me, author: entry.from, kind }] : [])]);
    });
  const myKind = (id: string) => mine.find((r) => r.postId === id)?.kind;
  const countsFor = (id: string) => {
    const c: Partial<Record<ReactionKind, number>> = {};
    toMe.filter((r) => r.postId === id).forEach((r) => (c[r.kind] = (c[r.kind] || 0) + 1));
    return c;
  };

  const sendNote = (e: React.FormEvent) => {
    e.preventDefault();
    const target = students.find((s) => s.id === to);
    if (!target) return setError('쪽지를 받을 친구를 골라 주세요.');
    if (chars(text) < 5) return setError('칭찬 내용을 5글자 이상 써 주세요.');
    act(async () => {
      const post = await (await getBackend()).createPost(cid, {
        type: 'note', from: me, fromName: myName, to: target.id, toName: target.nickname,
        profileKey: (key || null) as LearnerProfileKey | null, text: text.trim()
      });
      setMyPosts((l) => [post, ...l]);
      setTo(''); setKey(''); setText('');
      showToast('💌 쪽지를 보냈어요! 선생님이 확인하면 친구에게 전달돼요.', 'success');
    });
  };

  // 게시판에 나눌 수 있는 내 실천 기록 (최근 것부터 15개)
  const myLines = history
    .filter((r) => r.submitted)
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((r) => (r.reflections || []).filter((x) => x.profileKey).map((x, i) => ({ id: `${r.date}#${i}`, date: r.date, ...x })))
    .slice(0, 15);
  const share = (e: React.FormEvent) => {
    e.preventDefault();
    const line = myLines.find((l) => l.id === pick);
    if (!line) return setError('나눌 기록을 골라 주세요.');
    act(async () => {
      const post = await (await getBackend()).createPost(cid, { type: 'share', from: me, fromName: myName, profileKey: line.profileKey, text: line.text });
      setMyPosts((l) => [post, ...l]);
      setPick('');
      showToast('📣 게시판에 올렸어요! 선생님이 확인하면 친구들에게 보여요.', 'success');
    });
  };

  const report = (entry: Entry) =>
    act(async () => {
      await (await getBackend()).reportPost(cid, entry.id, me);
      setReported((l) => [...l, entry.id]);
      showToast('선생님께 알렸어요.', 'info');
    });

  const postCard = (entry: Entry, opts: { showTo?: boolean; canReport?: boolean }) => {
    const p = profileOf(entry.profileKey);
    const isMine = entry.from === me;
    return (
      <li key={entry.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-black text-slate-800">{entry.fromName}</span>
          {opts.showTo && <span className="text-slate-500">→ 나에게</span>}
          {p && <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${p.bgColor} ${p.textColor}`}>{p.emoji} {p.name}</span>}
          {isMine && <span className="px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-indigo-100 text-indigo-700">내 글</span>}
        </div>
        <p className="text-sm text-slate-800 break-words">{entry.text}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isMine ? (
            <p className="text-xs font-bold text-slate-600">
              받은 공감:{' '}
              {REACTIONS.map((r) => `${r.emoji} ${countsFor(entry.id)[r.kind] || 0}`).join('  ')}
            </p>
          ) : (
            <Stickers entry={entry} mine={myKind(entry.id)} onPick={(k) => react(entry, k)} />
          )}
          {opts.canReport && !isMine && (
            <button type="button" disabled={busy || reported.includes(entry.id)} onClick={() => report(entry)} className="h-9 px-2 text-[11px] font-bold text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer disabled:cursor-default">
              <Flag size={12} /> {reported.includes(entry.id) ? '알렸어요' : '불편해요'}
            </button>
          )}
        </div>
      </li>
    );
  };

  if (loading) {
    return <div className="py-16 flex items-center justify-center gap-2 text-slate-500 text-sm font-bold"><Loader2 size={18} className="animate-spin" /> 불러오는 중…</div>;
  }
  const sent = myPosts.filter((p) => p.type === (mode === 'notes' ? 'note' : 'share'));

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>}

      {mode === 'notes' && (
        <>
          <form onSubmit={sendNote} className={`${card} space-y-3`}>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Send size={16} className="text-indigo-500" /> 칭찬 쪽지 쓰기</h4>
            <p className="text-xs text-slate-500 break-keep">친구가 학습자상을 실천하는 모습을 발견했나요? 쪽지로 알려 주세요. 선생님이 확인한 뒤 전달돼요.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select className={input} value={to} onChange={(e) => setTo(e.target.value)} aria-label="받을 친구">
                <option value="">받을 친구 고르기</option>
                {students.filter((s) => s.id !== me).map((s) => (
                  <option key={s.id} value={s.id}>{s.nickname === `${s.number}번` ? s.nickname : `${s.number}번 ${s.nickname}`}</option>
                ))}
              </select>
              <select className={input} value={key} onChange={(e) => setKey(e.target.value)} aria-label="발견한 학습자상">
                <option value="">발견한 학습자상 (선택)</option>
                {PROFILE_DATA.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.name}</option>)}
              </select>
            </div>
            <textarea className={`${input} !h-auto py-2.5 resize-none`} rows={2} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} aria-label="칭찬 내용" placeholder="예: 오늘 체육 시간에 넘어진 친구를 먼저 도와주는 모습이 멋졌어!" />
            <button type="submit" disabled={busy} className={primary}><Send size={15} /> 쪽지 보내기</button>
          </form>

          <div className={card}>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Mail size={16} className="text-rose-500" /> 받은 쪽지 ({inbox.length})</h4>
            {inbox.length === 0 ? <p className="mt-3 text-sm text-slate-500">아직 받은 쪽지가 없어요.</p> : (
              <ul className="mt-3 space-y-2">{inbox.map((n) => postCard(n, { showTo: true }))}</ul>
            )}
          </div>
        </>
      )}

      {mode === 'board' && (
        <>
          <form onSubmit={share} className={`${card} space-y-3`}>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Megaphone size={16} className="text-indigo-500" /> 내 실천 나누기</h4>
            <p className="text-xs text-slate-500 break-keep">내가 쓴 실천 기록 중 친구들과 나누고 싶은 것을 골라 주세요. 선생님이 확인한 뒤 게시판에 올라가요.</p>
            {myLines.length === 0 ? <p className="text-sm text-slate-500">아직 나눌 수 있는 실천 기록이 없어요. 미션을 실천하고 기록을 남겨 보세요.</p> : (
              <>
                <select className={input} value={pick} onChange={(e) => setPick(e.target.value)} aria-label="나눌 기록">
                  <option value="">나눌 기록 고르기</option>
                  {myLines.map((l) => <option key={l.id} value={l.id}>{l.date.slice(5)} {profileOf(l.profileKey)?.emoji} {l.text.slice(0, 40)}</option>)}
                </select>
                <button type="submit" disabled={busy || !pick} className={primary}><Megaphone size={15} /> 게시판에 올리기</button>
              </>
            )}
          </form>

          <div className={card}>
            <h4 className="text-sm font-bold text-slate-800">📣 나눔 게시판 ({board.length})</h4>
            <p className="text-xs text-slate-500 mt-1">공감 스티커를 눌러 마음을 전해요. 몇 개를 받았는지는 글쓴이만 볼 수 있어요.</p>
            {board.length === 0 ? <p className="mt-3 text-sm text-slate-500">아직 올라온 글이 없어요. 첫 번째로 나눠 볼까요?</p> : (
              <ul className="mt-3 space-y-2">{board.map((n) => postCard(n, { canReport: true }))}</ul>
            )}
          </div>
        </>
      )}

      {sent.length > 0 && (
        <div className={card}>
          <h4 className="text-sm font-bold text-slate-800">{mode === 'notes' ? '내가 보낸 쪽지' : '내가 올린 글'}</h4>
          <ul className="mt-3 space-y-2">
            {sent.slice(0, 10).map((p) => (
              <li key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {p.toName && <span className="font-bold text-slate-700">→ {p.toName}</span>}
                  <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${STATUS[p.status].cls}`}>{p.type === 'share' && p.status === 'approved' ? '게시됨' : STATUS[p.status].text}</span>
                  {p.type === 'note' && p.status === 'approved' && countsFor(p.id) && (
                    <span className="text-slate-600 font-bold">{REACTIONS.filter((r) => countsFor(p.id)[r.kind]).map((r) => `${r.emoji} ${r.label}`).join(' ')}</span>
                  )}
                </div>
                <p className="text-sm text-slate-700 mt-1 break-words">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
