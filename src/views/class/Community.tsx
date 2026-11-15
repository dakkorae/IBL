import React, { useEffect, useState } from 'react';
import { Loader2, Send, Flag, Megaphone } from 'lucide-react';
import { LearnerProfileKey } from '../../types';
import { PROFILE_DATA } from '../../data';
import { errorMessage, getBackend } from '../../cloud';
import { REACTIONS } from '../../cloud/stats';
import { BoardKind, Entry, Reaction, ReactionKind } from '../../cloud/types';
import { badWordMessage } from '../../filter';
import { usePortfolio } from '../../state/PortfolioContext';

const card = 'bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm';
const input =
  'w-full h-11 px-3 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800';
const primary =
  'h-11 px-5 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-extrabold rounded-xl cursor-pointer disabled:cursor-not-allowed';
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

// 우리 반 > 칭찬 게시판 · 나눔 게시판
// - 글은 비속어 검사를 통과하면 바로 올라감 (선생님은 교사용 화면에서 글을 내릴 수 있음)
export default function Community({ mode }: { mode: BoardKind }) {
  const { classSession, history, updateCommunity, showToast } = usePortfolio();
  const cid = classSession!.classId;
  const me = classSession!.sid;
  const myName = classSession!.nickname;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [boards, setBoards] = useState<Record<BoardKind, Entry[]>>({ praise: [], share: [] });
  const [mine, setMine] = useState<Reaction[]>([]);
  const [toMe, setToMe] = useState<Reaction[]>([]);
  const [reported, setReported] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  // 쓰기 양식
  const [to, setTo] = useState('');
  const [key, setKey] = useState('');
  const [text, setText] = useState('');
  const [pick, setPick] = useState('');

  const remember = (next: Record<BoardKind, Entry[]>) => {
    setBoards(next);
    // 내가 올린 글 수는 '우리 반 배지' 판정에 씀
    updateCommunity({
      notes: next.praise.filter((p) => p.from === me).length,
      shares: next.share.filter((p) => p.from === me).length
    });
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const b = await getBackend();
      const [praise, share, rx] = await Promise.all([b.getBoard(cid, 'praise'), b.getBoard(cid, 'share'), b.getMyReactions(cid, me)]);
      remember({ praise, share });
      setMine(rx.mine);
      setToMe(rx.toMe);
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

  const add = async (entry: Omit<Entry, 'id' | 'createdAt'>) => {
    const saved = await (await getBackend()).addEntry(cid, entry);
    remember({ ...boards, [entry.type]: [saved, ...boards[entry.type]] });
  };

  const sendPraise = (e: React.FormEvent) => {
    e.preventDefault();
    const target = to.trim();
    if (!target) return setError('칭찬할 친구의 이름이나 닉네임을 적어 주세요.');
    if (!key) return setError('칭찬할 학습자상을 골라 주세요.');
    if (chars(text) < 5) return setError('칭찬 내용을 5글자 이상 써 주세요.');
    const bad = badWordMessage(target, text);
    if (bad) return setError(bad);
    act(async () => {
      await add({ type: 'praise', from: me, fromName: myName, toName: target, profileKey: key as LearnerProfileKey, text: text.trim() });
      setTo(''); setKey(''); setText('');
      showToast('💌 칭찬 게시판에 올렸어요!', 'success');
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
    const bad = badWordMessage(line.text);
    if (bad) return setError(bad);
    act(async () => {
      await add({ type: 'share', from: me, fromName: myName, profileKey: line.profileKey, text: line.text.slice(0, 300) });
      setPick('');
      showToast('📣 나눔 게시판에 올렸어요!', 'success');
    });
  };

  const report = (entry: Entry) =>
    act(async () => {
      await (await getBackend()).reportPost(cid, entry.id, me);
      setReported((l) => [...l, entry.id]);
      showToast('선생님께 알렸어요.', 'info');
    });

  const postCard = (entry: Entry) => {
    const p = profileOf(entry.profileKey);
    const isMine = entry.from === me;
    return (
      <li key={entry.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-black text-slate-800 break-all">{entry.fromName}</span>
          {entry.toName && <span className="font-bold text-rose-600 break-all">→ {entry.toName}</span>}
          {p && <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] whitespace-nowrap ${p.bgColor} ${p.textColor}`}>{p.emoji} {p.name}</span>}
          {isMine && <span className="px-1.5 py-0.5 rounded-md font-bold text-[10px] whitespace-nowrap bg-indigo-100 text-indigo-700">내 글</span>}
        </div>
        <p className="text-sm text-slate-800 break-words whitespace-pre-line">{entry.text}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isMine ? (
            <p className="text-xs font-bold text-slate-600">
              받은 공감:{' '}
              {REACTIONS.map((r) => `${r.emoji} ${countsFor(entry.id)[r.kind] || 0}`).join('  ')}
            </p>
          ) : (
            <Stickers entry={entry} mine={myKind(entry.id)} onPick={(k) => react(entry, k)} />
          )}
          {!isMine && (
            <button type="button" disabled={busy || reported.includes(entry.id)} onClick={() => report(entry)} className="h-9 px-2 text-[11px] font-bold text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer disabled:cursor-default whitespace-nowrap">
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
  const list = boards[mode];

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>}

      {mode === 'praise' && (
        <form onSubmit={sendPraise} className={`${card} space-y-3`}>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Send size={16} className="text-indigo-500" /> 칭찬 글 쓰기</h4>
          <p className="text-xs text-slate-500">친구가 학습자상을 실천하는 모습을 발견했나요? 칭찬 게시판에 올려 우리 반 모두에게 알려 주세요.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label htmlFor="praise-to" className="block text-xs font-bold text-slate-600 mb-1">칭찬할 친구</label>
              <input id="praise-to" className={input} value={to} maxLength={20} onChange={(e) => setTo(e.target.value)} placeholder="이름이나 닉네임" autoComplete="off" />
            </div>
            <div>
              <label htmlFor="praise-key" className="block text-xs font-bold text-slate-600 mb-1">칭찬할 학습자상</label>
              <select id="praise-key" className={input} value={key} onChange={(e) => setKey(e.target.value)}>
                <option value="">학습자상 고르기</option>
                {PROFILE_DATA.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="praise-text" className="block text-xs font-bold text-slate-600 mb-1">칭찬할 내용</label>
            <textarea id="praise-text" className={`${input} !h-auto py-2.5 resize-none`} rows={3} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder="예: 오늘 체육 시간에 넘어진 친구를 먼저 도와주는 모습이 멋졌어!" />
          </div>
          <button type="submit" disabled={busy} className={primary}><Send size={15} /> 칭찬 게시판에 올리기</button>
        </form>
      )}

      {mode === 'share' && (
        <form onSubmit={share} className={`${card} space-y-3`}>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Megaphone size={16} className="text-indigo-500" /> 내 실천 나누기</h4>
          <p className="text-xs text-slate-500">내가 쓴 실천 기록 중 친구들과 나누고 싶은 것을 골라 주세요.</p>
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
      )}

      <div className={card}>
        <h4 className="text-sm font-bold text-slate-800">{mode === 'praise' ? '💌 칭찬 게시판' : '📣 나눔 게시판'} ({list.length})</h4>
        <p className="text-xs text-slate-500 mt-1">공감 스티커를 눌러 마음을 전해요. 몇 개를 받았는지는 글쓴이만 볼 수 있어요. 불편한 글은 ‘불편해요’로 선생님께 알려 주세요.</p>
        {list.length === 0 ? <p className="mt-3 text-sm text-slate-500">{mode === 'praise' ? '아직 올라온 칭찬이 없어요. 첫 번째로 칭찬해 볼까요?' : '아직 올라온 글이 없어요. 첫 번째로 나눠 볼까요?'}</p> : (
          <ul className="mt-3 space-y-2">{list.slice(0, 100).map((n) => postCard(n))}</ul>
        )}
      </div>
    </div>
  );
}
