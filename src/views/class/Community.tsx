import React, { useEffect, useState } from 'react';
import { Loader2, Send, Flag, Megaphone, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { LearnerProfileKey } from '../../types';
import { PROFILE_DATA, getMissionForDay } from '../../data';
import { errorMessage, getBackend } from '../../cloud';
import { BoardKind, Entry } from '../../cloud/types';
import BoardWall from '../../components/BoardWall';
import { badWordMessage } from '../../filter';
import { usePortfolio } from '../../state/PortfolioContext';

const card = 'bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm';
const input =
  'w-full h-11 px-3 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800';
const primary =
  'h-11 px-5 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-extrabold rounded-xl cursor-pointer disabled:cursor-not-allowed';
const profileOf = (key: LearnerProfileKey | null) => PROFILE_DATA.find((p) => p.key === key);
const chars = (t: string) => t.replace(/\s/g, '').length;

// 우리 반 > 칭찬 게시판 · 나눔 게시판
// - 글은 비속어 검사를 통과하면 바로 올라감 (선생님은 교사용 화면에서 글을 내릴 수 있음)
export default function Community({ mode }: { mode: BoardKind }) {
  const { classSession, history, customMissionsByDate, updateCommunity, showToast } = usePortfolio();
  const cid = classSession!.classId;
  const me = classSession!.sid;
  const myName = classSession!.nickname;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [boards, setBoards] = useState<Record<BoardKind, Entry[]>>({ praise: [], share: [] });
  const [reported, setReported] = useState<string[]>([]);
  const [onlyMine, setOnlyMine] = useState(false); // 내가 쓴 글만 보기
  const [confirm, setConfirm] = useState(''); // 삭제를 한 번 더 확인 중인 글
  const [busy, setBusy] = useState(false);
  // 쓰기 양식
  const [to, setTo] = useState('');
  const [key, setKey] = useState('');
  const [text, setText] = useState('');
  const [pick, setPick] = useState('');
  const [pickPage, setPickPage] = useState(1);

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
      const [praise, share] = await Promise.all([b.getBoard(cid, 'praise'), b.getBoard(cid, 'share')]);
      remember({ praise, share });
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

  // 좋아요: 화면에 먼저 반영하고 서버에 저장 (실패하면 되돌림)
  const like = async (entry: Entry, on: boolean) => {
    const apply = (v: boolean) =>
      setBoards((b) => ({
        ...b,
        [entry.type]: b[entry.type].map((e) => (e.id === entry.id ? { ...e, likes: [...(e.likes || []).filter((x) => x !== me), ...(v ? [me] : [])] } : e))
      }));
    apply(on);
    try {
      await (await getBackend()).setLike(cid, entry.type, entry.id, me, on);
    } catch (e) {
      apply(!on);
      setError(errorMessage(e));
    }
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

  // 게시판에 나눌 수 있는 내 실천 기록 (최근 것부터, 5개씩 쪽을 나눠 보여 줌)
  const myLines = history
    .filter((r) => r.submitted)
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((r) =>
      (r.reflections || [])
        .filter((x) => x.profileKey)
        // 그날 그 학습자상으로 실천한 미션 문장을 함께 찾아 둠
        .map((x, i) => ({ id: `${r.date}#${i}`, date: r.date, ...x, mission: getMissionForDay(x.profileKey!, r.date, customMissionsByDate[r.date] as Record<string, string> | undefined) }))
    )
    .slice(0, 200);
  const PICK_PAGE = 5;
  const pickPages = Math.max(1, Math.ceil(myLines.length / PICK_PAGE));
  const pickNow = Math.min(pickPage, pickPages);
  const pageLines = myLines.slice((pickNow - 1) * PICK_PAGE, pickNow * PICK_PAGE);
  const share = (e: React.FormEvent) => {
    e.preventDefault();
    const line = myLines.find((l) => l.id === pick);
    if (!line) return setError('나눌 기록을 골라 주세요.');
    const bad = badWordMessage(line.text);
    if (bad) return setError(bad);
    act(async () => {
      await add({ type: 'share', from: me, fromName: myName, profileKey: line.profileKey, ...(line.mission ? { mission: line.mission.slice(0, 100) } : {}), text: line.text.slice(0, 300) });
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

  if (loading) {
    return <div className="py-16 flex items-center justify-center gap-2 text-slate-500 text-sm font-bold"><Loader2 size={18} className="animate-spin" /> 불러오는 중…</div>;
  }
  // 내 글 지우기
  const removeMine = (entry: Entry) =>
    act(async () => {
      await (await getBackend()).removeMyEntry(cid, entry.type, entry.id);
      remember({ ...boards, [entry.type]: boards[entry.type].filter((e) => e.id !== entry.id) });
      setConfirm('');
      showToast('글을 지웠어요.', 'info');
    });
  const myCount = boards[mode].filter((e) => e.from === me).length;
  const list = onlyMine ? boards[mode].filter((e) => e.from === me) : boards[mode];
  const chip = 'shrink-0 h-8 px-2 rounded-full inline-flex items-center text-[11px] font-extrabold cursor-pointer whitespace-nowrap disabled:opacity-50';

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
          <p className="text-xs text-slate-500">내가 쓴 실천 기록 중 친구들과 나누고 싶은 것을 골라 주세요. 그날 고른 미션도 함께 올라가요.</p>
          {myLines.length === 0 ? <p className="text-sm text-slate-500">아직 나눌 수 있는 실천 기록이 없어요. 미션을 실천하고 기록을 남겨 보세요.</p> : (
            <>
              <div role="radiogroup" aria-label="나눌 기록 고르기" className="space-y-2">
                {pageLines.map((l) => {
                  const p = profileOf(l.profileKey);
                  const on = pick === l.id;
                  return (
                    <label key={l.id} className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${on ? 'border-indigo-500 bg-indigo-50/60' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                      <input type="radio" name="share-pick" value={l.id} checked={on} onChange={() => setPick(l.id)} className="mt-1 w-4 h-4 shrink-0 accent-indigo-600" />
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="font-bold text-slate-500 whitespace-nowrap">{Number(l.date.slice(5, 7))}월 {Number(l.date.slice(8))}일</span>
                          {p && <span className={`px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap ${p.bgColor} ${p.textColor}`}>{p.emoji} {p.name}</span>}
                        </span>
                        <span className="block text-sm font-bold text-slate-900 break-words">{l.text}</span>
                        {l.mission && <span className="block text-[11px] text-slate-500 break-words"><span className="font-bold">📌 그날의 미션</span> · {l.mission}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
              {pickPages > 1 && (
                <div className="flex items-center justify-center gap-2" aria-label="기록 목록 쪽 이동">
                  <button type="button" disabled={pickNow === 1} onClick={() => setPickPage(pickNow - 1)} aria-label="이전 기록" className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
                  <span className="text-xs font-bold text-slate-600 min-w-16 text-center">{pickNow} / {pickPages}쪽</span>
                  <button type="button" disabled={pickNow === pickPages} onClick={() => setPickPage(pickNow + 1)} aria-label="다음 기록" className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
                </div>
              )}
              <button type="submit" disabled={busy || !pick} className={primary}><Megaphone size={15} /> 게시판에 올리기</button>
            </>
          )}
        </form>
      )}

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-3 px-1">
          <h4 className="text-sm font-bold text-slate-800">{mode === 'praise' ? '💌 칭찬 게시판' : '📣 나눔 게시판'} ({list.length})</h4>
          <div role="group" aria-label="보기" className="flex bg-slate-200/70 p-1 rounded-xl">
            {[{ v: false, name: '모든 글' }, { v: true, name: `내가 쓴 글 ${myCount}` }].map((t) => (
              <button key={t.name} type="button" aria-pressed={onlyMine === t.v} onClick={() => { setOnlyMine(t.v); setConfirm(''); }}
                className={`h-9 px-3 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap transition-all ${onlyMine === t.v ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3 px-1">♡를 눌러 마음을 전해요. 불편한 글은 깃발을 눌러 선생님께 알려 주세요. 내가 쓴 글은 휴지통으로 지울 수 있어요.</p>
        <BoardWall
          entries={list}
          me={me}
          empty={onlyMine ? '아직 내가 쓴 글이 없어요.' : mode === 'praise' ? '아직 올라온 칭찬이 없어요. 첫 번째로 칭찬해 볼까요?' : '아직 올라온 글이 없어요. 첫 번째로 나눠 볼까요?'}
          onLike={like}
          actions={(entry) =>
            entry.from === me ? (
              confirm === entry.id ? (
                <>
                  <button type="button" disabled={busy} onClick={() => removeMine(entry)} className={`${chip} bg-rose-600 text-white`}>지우기</button>
                  <button type="button" onClick={() => setConfirm('')} className={`${chip} bg-slate-100 text-slate-600`}>취소</button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirm(entry.id)} title="내 글 지우기" aria-label="내 글 지우기" className="shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
                  <Trash2 size={14} />
                </button>
              )
            ) : (
              <button type="button" disabled={busy || reported.includes(entry.id)} onClick={() => report(entry)} title="불편해요 (선생님께 알리기)" aria-label={reported.includes(entry.id) ? '선생님께 알렸어요' : '불편해요, 선생님께 알리기'}
                className={`shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer disabled:cursor-default ${reported.includes(entry.id) ? 'text-rose-500' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}>
                <Flag size={13} fill={reported.includes(entry.id) ? 'currentColor' : 'none'} />
              </button>
            )
          }
        />
      </div>
    </div>
  );
}
