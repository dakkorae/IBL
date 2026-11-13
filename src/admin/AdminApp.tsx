import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, Copy, Check, FlaskConical } from 'lucide-react';
import { cloudMode, errorMessage, getBackend } from '../cloud';
import { InviteCode } from '../cloud/types';
import { adminKeyHash } from '../cloud/util';
import { btnGhost, btnPrimary, card, input, label } from '../teacher/ui';

// 관리자 페이지 (주소 끝에 #admin): 학급 개설 코드를 만들어 연구회 선생님께 나눠 줌
export default function AdminApp() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [key, setKey] = useState('');
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [memo, setMemo] = useState('');
  const [max, setMax] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [setupHash, setSetupHash] = useState('');

  const run = async (fn: (b: Awaited<ReturnType<typeof getBackend>>) => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn(await getBackend());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (cloudMode === 'off') return;
    run(async (b) => {
      const ok = await b.isAdmin();
      setAdmin(ok);
      if (ok) setCodes(await b.listInviteCodes());
    });
  }, []);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      // 복사가 막힌 환경에서는 화면의 코드를 직접 읽으면 됨
    }
  };

  return (
    <div className="min-h-dvh bg-slate-100 font-sans text-slate-800">
      <header className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-indigo-600 p-1.5 rounded-lg"><ShieldCheck size={18} /></span>
            <span className="font-extrabold text-sm sm:text-base">IB 학습자상 · 관리자</span>
            {cloudMode === 'demo' && <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><FlaskConical size={11} /> 체험용</span>}
          </div>
          <a href="#teacher" className="text-xs font-bold text-slate-300 hover:text-white">교사용 페이지</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4">
        {cloudMode === 'off' && <div className={`${card} p-6 text-sm text-slate-600`}>학급 서버가 아직 연결되지 않았어요. (저장소의 docs/FIREBASE_SETUP.md 참고)</div>}

        {cloudMode !== 'off' && admin === null && !error && (
          <div className="py-16 flex items-center justify-center gap-2 text-slate-500 text-sm font-bold"><Loader2 size={18} className="animate-spin" /> 확인하는 중…</div>
        )}

        {cloudMode !== 'off' && admin === false && (
          <>
            <form className={`${card} p-4 sm:p-6 space-y-3`} onSubmit={(e) => { e.preventDefault(); run(async (b) => { if (!(await b.adminLogin(key))) throw new Error('관리자 키가 맞지 않아요.'); setAdmin(true); setKey(''); setCodes(await b.listInviteCodes()); }); }}>
              <h1 className="text-lg font-black text-slate-900">관리자 확인</h1>
              <div>
                <label className={label} htmlFor="a-key">관리자 키</label>
                <input id="a-key" className={input} type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" placeholder={cloudMode === 'demo' ? '체험용 키: demo-admin' : ''} required />
              </div>
              <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy && <Loader2 size={16} className="animate-spin" />} 확인</button>
            </form>

            {cloudMode === 'firebase' && (
              <div className={`${card} p-4 sm:p-6 space-y-3`}>
                <h2 className="text-sm font-extrabold text-slate-900">처음 설정할 때: 관리자 키 등록값 만들기</h2>
                <p className="text-xs text-slate-600 leading-relaxed break-keep">
                  쓰고 싶은 관리자 키(12자 이상 권장)를 입력하면 등록값이 만들어져요. 이 값을 Firebase 콘솔의 Firestore에서 <b>config</b> 컬렉션 → <b>admin</b> 문서 → <b>keyHash</b> 필드(문자열)에 붙여 넣으면 됩니다. 키 자체는 서버로 보내지 않아요.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input className={input} type="password" value={setupKey} onChange={(e) => { setSetupKey(e.target.value); setSetupHash(''); }} placeholder="새 관리자 키" aria-label="새 관리자 키" autoComplete="off" />
                  <button type="button" disabled={setupKey.trim().length < 8} onClick={async () => setSetupHash(await adminKeyHash(setupKey))} className={`${btnGhost} shrink-0`}>등록값 만들기</button>
                </div>
                {setupHash && (
                  <button type="button" onClick={() => copy(setupHash)} className="w-full text-left p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs break-all cursor-pointer">
                    {setupHash} {copied === setupHash ? <Check size={13} className="inline text-emerald-600" /> : <Copy size={13} className="inline text-slate-400" />}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {admin && (
          <>
            <form className={`${card} p-4 sm:p-6 space-y-3`} onSubmit={(e) => { e.preventDefault(); const n = Number(max); if (!Number.isInteger(n) || n < 1 || n > 20) return setError('학급 수는 1부터 20까지 입력해 주세요.'); run(async (b) => { const c = await b.createInviteCode(n, memo.trim()); setCodes((list) => [c, ...list]); setMemo(''); }); }}>
              <h1 className="text-lg font-black text-slate-900">개설 코드 만들기</h1>
              <p className="text-xs text-slate-500">코드를 받은 선생님만 학급을 개설할 수 있어요. 메모에는 누구에게 준 코드인지 적어 두세요.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="a-memo">메모</label>
                  <input id="a-memo" className={input} value={memo} maxLength={30} onChange={(e) => setMemo(e.target.value)} placeholder="예: 연구회 ○○ 선생님" />
                </div>
                <div>
                  <label className={label} htmlFor="a-max">개설 가능한 학급 수</label>
                  <input id="a-max" className={input} type="number" min={1} max={20} value={max} onChange={(e) => setMax(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={busy} className={`${btnPrimary} w-full sm:w-auto`}>{busy && <Loader2 size={16} className="animate-spin" />} 코드 만들기</button>
            </form>

            <div className={`${card} p-4 sm:p-6`}>
              <h2 className="text-sm font-extrabold text-slate-900">발급한 코드 ({codes.length}개)</h2>
              {codes.length === 0 && <p className="text-sm text-slate-500 mt-2">아직 만든 코드가 없어요.</p>}
              <ul className="mt-2 divide-y divide-slate-100">
                {codes.map((c) => {
                  const full = c.usedCount >= c.maxClasses;
                  return (
                    <li key={c.code} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <button type="button" onClick={() => copy(c.code)} title="코드 복사" className={`font-mono font-black tracking-widest text-base cursor-pointer inline-flex items-center gap-1.5 ${c.active && !full ? 'text-indigo-700' : 'text-slate-400 line-through'}`}>
                        {c.code} {copied === c.code ? <Check size={14} className="text-emerald-600" /> : <Copy size={13} className="text-slate-400" />}
                      </button>
                      <span className="flex-1 min-w-32 text-sm text-slate-600 truncate">{c.memo || '메모 없음'}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${full ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-800'}`}>사용 {c.usedCount} / {c.maxClasses}</span>
                      <button type="button" disabled={busy} onClick={() => run(async (b) => { await b.setInviteActive(c.code, !c.active); setCodes((list) => list.map((x) => (x.code === c.code ? { ...x, active: !c.active } : x))); })} className={`${btnGhost} !h-9 !px-3 !text-xs`}>
                        {c.active ? '사용 중지' : '다시 사용'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {error && <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>}
      </main>
    </div>
  );
}
