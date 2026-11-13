import React, { useEffect, useState } from 'react';
import { GraduationCap, Plus, KeyRound, Loader2, ChevronRight, ArrowLeft, FlaskConical } from 'lucide-react';
import { cloudMode, errorMessage, getBackend, loadTeacherClasses, saveTeacherClasses } from '../cloud';
import { normalizeCode } from '../cloud/util';
import ClassDashboard from './ClassDashboard';
import { btnGhost, btnPrimary, card, input, label } from './ui';

type Mode = 'home' | 'create' | 'open';

// 교사용 페이지 (주소 끝에 #teacher): 학급 개설, 내 학급 열기, 학급 현황
export default function TeacherApp() {
  const [classes, setClasses] = useState(loadTeacherClasses);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('home');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 개설 양식
  const [invite, setInvite] = useState('');
  const [name, setName] = useState('');
  const [count, setCount] = useState('25');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  // 다른 기기에서 만든 학급 열기
  const [code, setCode] = useState('');
  const [openPw, setOpenPw] = useState('');

  useEffect(() => saveTeacherClasses(classes), [classes]);

  const remember = (id: string, className: string) =>
    setClasses((list) => [{ id, name: className }, ...list.filter((c) => c.id !== id)]);
  const forget = (id: string) => setClasses((list) => list.filter((c) => c.id !== id));

  const run = async (fn: () => Promise<void>) => {
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

  const createClass = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(count);
    if (!name.trim()) return setError('학급 이름을 입력해 주세요.');
    if (!Number.isInteger(n) || n < 1 || n > 40) return setError('학생 수는 1명부터 40명까지 입력해 주세요.');
    if (pw.length < 6) return setError('교사 비밀번호는 6자 이상으로 정해 주세요.');
    if (pw !== pw2) return setError('두 번 입력한 비밀번호가 서로 달라요.');
    run(async () => {
      const backend = await getBackend();
      const info = await backend.createClass({ inviteCode: invite, name, studentCount: n, password: pw });
      remember(info.id, info.name);
      setMode('home');
      setPw('');
      setPw2('');
      setOpenId(info.id);
    });
  };

  const openClass = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const backend = await getBackend();
      const id = normalizeCode(code);
      const info = await backend.getClass(id);
      if (!info || !(await backend.teacherLogin(id, openPw))) throw new Error('학급 코드나 교사 비밀번호가 맞지 않아요.');
      remember(info.id, info.name);
      setMode('home');
      setOpenPw('');
      setOpenId(info.id);
    });
  };

  const shell = (children: React.ReactNode, wide = false) => (
    <div className="min-h-dvh bg-slate-100 font-sans text-slate-800">
      <header className="bg-slate-900 text-white">
        <div className={`${wide ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="bg-indigo-600 p-1.5 rounded-lg shrink-0"><GraduationCap size={18} /></span>
            <span className="font-extrabold text-sm sm:text-base truncate">IB 학습자상 · 교사용</span>
            {cloudMode === 'demo' && (
              <span className="shrink-0 text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <FlaskConical size={11} /> 체험용
              </span>
            )}
          </div>
          <a href="#" className="shrink-0 text-xs font-bold text-slate-300 hover:text-white">학생 화면으로</a>
        </div>
      </header>
      <main className={`${wide ? 'max-w-6xl' : 'max-w-3xl'} mx-auto p-3 sm:p-6 space-y-4`}>{children}</main>
    </div>
  );

  if (cloudMode === 'off') {
    return shell(
      <div className={`${card} p-6 text-sm text-slate-600 leading-relaxed`}>
        학급 서버가 아직 연결되지 않았어요. Firebase 설정값을 넣은 뒤에 학급을 개설할 수 있습니다. (저장소의 docs/FIREBASE_SETUP.md 참고)
      </div>
    );
  }

  if (openId) {
    return shell(
      <ClassDashboard
        classId={openId}
        onBack={() => setOpenId(null)}
        onRenamed={(n) => remember(openId, n)}
        onGone={() => { forget(openId); setOpenId(null); }}
      />,
      true
    );
  }

  return shell(
    <>
      {mode === 'home' && (
        <>
          <div>
            <h1 className="text-xl font-black text-slate-900">내 학급</h1>
            <p className="text-sm text-slate-500 mt-1">이 기기에서 열어 본 학급이에요.</p>
          </div>
          {classes.length === 0 ? (
            <div className={`${card} p-6 text-sm text-slate-500`}>아직 연 학급이 없어요. 아래에서 학급을 개설하거나, 다른 기기에서 만든 학급을 열어 보세요.</div>
          ) : (
            <ul className="space-y-2">
              {classes.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setOpenId(c.id)} className={`${card} w-full p-4 flex items-center justify-between gap-3 text-left hover:border-indigo-400 transition-all cursor-pointer`}>
                    <span className="min-w-0">
                      <span className="block font-extrabold text-slate-900 truncate">{c.name}</span>
                      <span className="block text-xs text-slate-500 font-mono tracking-widest mt-0.5">{c.id}</span>
                    </span>
                    <ChevronRight size={18} className="text-slate-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" onClick={() => { setMode('create'); setError(''); }} className={btnPrimary}><Plus size={16} /> 새 학급 개설</button>
            <button type="button" onClick={() => { setMode('open'); setError(''); }} className={btnGhost}><KeyRound size={16} /> 다른 기기에서 만든 학급 열기</button>
          </div>
        </>
      )}

      {mode !== 'home' && (
        <button type="button" onClick={() => { setMode('home'); setError(''); }} className="text-sm font-bold text-slate-500 inline-flex items-center gap-1 cursor-pointer">
          <ArrowLeft size={15} /> 내 학급으로
        </button>
      )}

      {mode === 'create' && (
        <form onSubmit={createClass} className={`${card} p-4 sm:p-6 space-y-4`}>
          <div>
            <h1 className="text-lg font-black text-slate-900">새 학급 개설</h1>
            <p className="text-sm text-slate-500 mt-1">개설 코드는 연구회 관리자에게 받은 코드예요. 학생 이름 대신 번호로 명단이 만들어집니다.</p>
          </div>
          <div>
            <label className={label} htmlFor="t-invite">개설 코드</label>
            <input id="t-invite" className={`${input} uppercase font-mono tracking-widest`} value={invite} onChange={(e) => setInvite(e.target.value.toUpperCase())} placeholder={cloudMode === 'demo' ? 'DEMO-2026' : 'XXXX-XXXX'} autoComplete="off" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="t-name">학급 이름</label>
              <input id="t-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 5학년 3반" maxLength={40} required />
            </div>
            <div>
              <label className={label} htmlFor="t-count">학생 수</label>
              <input id="t-count" className={input} type="number" min={1} max={40} value={count} onChange={(e) => setCount(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="t-pw">교사 비밀번호 (6자 이상)</label>
              <input id="t-pw" className={input} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
            </div>
            <div>
              <label className={label} htmlFor="t-pw2">비밀번호 확인</label>
              <input id="t-pw2" className={input} type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
            </div>
          </div>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
            교사 비밀번호는 다른 기기에서 이 학급을 열 때 필요해요. 이메일을 받지 않기 때문에 잊어버리면 되찾을 수 없으니 꼭 적어 두세요.
          </p>
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy && <Loader2 size={16} className="animate-spin" />} 학급 개설하기
          </button>
        </form>
      )}

      {mode === 'open' && (
        <form onSubmit={openClass} className={`${card} p-4 sm:p-6 space-y-4`}>
          <h1 className="text-lg font-black text-slate-900">다른 기기에서 만든 학급 열기</h1>
          <div>
            <label className={label} htmlFor="o-code">학급 코드</label>
            <input id="o-code" className={`${input} uppercase font-mono tracking-widest`} value={code} onChange={(e) => setCode(normalizeCode(e.target.value).slice(0, 6))} placeholder="예: K7M2QD" autoComplete="off" required />
          </div>
          <div>
            <label className={label} htmlFor="o-pw">교사 비밀번호</label>
            <input id="o-pw" className={input} type="password" value={openPw} onChange={(e) => setOpenPw(e.target.value)} autoComplete="current-password" required />
          </div>
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy && <Loader2 size={16} className="animate-spin" />} 학급 열기
          </button>
        </form>
      )}

      {error && <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>}
    </>
  );
}
