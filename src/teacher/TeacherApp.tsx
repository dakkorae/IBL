import React, { useEffect, useState } from 'react';
import { LogOut, GraduationCap, Plus, KeyRound, Loader2, ChevronRight, ArrowLeft, FlaskConical, Copy, Check, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { cloudMode, errorMessage, getBackend, loadTeacherClasses, saveTeacherClasses } from '../cloud';
import { normalizeCode } from '../cloud/util';
import { MAX_CLASS_STUDENTS } from '../cloud/types';
import { badWordMessage } from '../filter';
import ClassDashboard from './ClassDashboard';
import { btnGhost, btnPrimary, card, input, label } from './ui';

type Mode = 'home' | 'create' | 'open' | 'reset' | 'created';

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
  const [count, setCount] = useState('30');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  // 다른 기기에서 만든 학급 열기
  const [code, setCode] = useState('');
  const [openPw, setOpenPw] = useState('');
  // 비밀번호 재설정 (관리자에게 받은 재설정 코드로)
  const [resetCode, setResetCode] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  // 방금 개설한 학급: 학급 코드와 비밀번호를 꼭 기록하도록 한 번 더 보여 줌
  const [created, setCreated] = useState<{ id: string; name: string; pw: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [noted, setNoted] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

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
    if (!Number.isInteger(n) || n < 1 || n > MAX_CLASS_STUDENTS) return setError(`최대 학생 수는 1명부터 ${MAX_CLASS_STUDENTS}명까지 입력해 주세요.`);
    const bad = badWordMessage(name);
    if (bad) return setError(bad);
    if (pw.length < 6) return setError('교사 비밀번호는 6자 이상으로 정해 주세요.');
    if (pw !== pw2) return setError('두 번 입력한 비밀번호가 서로 달라요.');
    run(async () => {
      const backend = await getBackend();
      const info = await backend.createClass({ inviteCode: invite, name, maxStudents: n, password: pw });
      remember(info.id, info.name);
      setCreated({ id: info.id, name: info.name, pw });
      setShowPw(false);
      setNoted(false);
      setCopiedNote(false);
      setMode('created');
      setPw('');
      setPw2('');
    });
  };

  const resetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const id = normalizeCode(code);
    if (id.length < 6) return setError('학급 코드 6자리를 입력해 주세요.');
    if (normalizeCode(resetCode).length < 10) return setError('관리자에게 받은 재설정 코드를 정확히 입력해 주세요.');
    if (newPw.length < 6) return setError('새 교사 비밀번호는 6자 이상으로 정해 주세요.');
    if (newPw !== newPw2) return setError('두 번 입력한 새 비밀번호가 서로 달라요.');
    run(async () => {
      const backend = await getBackend();
      const info = await backend.getClass(id);
      if (!info) throw new Error('학급 코드를 찾을 수 없어요. 다시 확인해 주세요.');
      if (!(await backend.resetTeacherPassword(id, resetCode, newPw))) {
        throw new Error('재설정 코드가 맞지 않거나, 이미 사용했거나, 24시간이 지났어요. 관리자에게 새 코드를 요청해 주세요.');
      }
      remember(info.id, info.name);
      setCreated({ id: info.id, name: info.name, pw: newPw });
      setShowPw(false);
      setNoted(false);
      setCopiedNote(false);
      setMode('created');
      setResetCode('');
      setNewPw('');
      setNewPw2('');
    });
  };

  const noteText = (c: { id: string; name: string; pw: string }) => `[IB 학습자상 교사용]\n학급 이름: ${c.name}\n학급 코드: ${c.id}\n교사 비밀번호: ${c.pw}\n교사 페이지: ${window.location.origin}${window.location.pathname}#teacher`;
  const copyNote = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(noteText(created));
      setCopiedNote(true);
    } catch {
      setError('복사하지 못했어요. 화면의 내용을 직접 적어 두세요.');
    }
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

  // 로그아웃: 이 기기의 교사 등록을 지우고 '내 학급' 목록을 비움. 학급과 학생 기록은 그대로 남음
  const logout = () => {
    if (!window.confirm('이 기기에서 로그아웃할까요?\n학급과 학생 기록은 그대로 남아요. 다시 열 때는 학급 코드와 교사 비밀번호가 필요해요.')) return;
    run(async () => {
      await (await getBackend()).teacherLogout(classes.map((c) => c.id));
      setClasses([]);
      saveTeacherClasses([]);
      setOpenId(null);
      setMode('home');
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
          <div className="flex items-center gap-3 shrink-0">
            <a href="#" className={`${classes.length > 0 ? 'hidden sm:inline' : ''} text-xs font-bold text-slate-300 hover:text-white whitespace-nowrap`}>학생 화면으로</a>
            {cloudMode !== 'off' && classes.length > 0 && (
              <button type="button" onClick={logout} disabled={busy} className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50">
                <LogOut size={14} /> 로그아웃
              </button>
            )}
          </div>
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

      {mode === 'created' && created && (
        <div className={`${card} p-4 sm:p-6 space-y-4 border-2 !border-amber-400`}>
          <div className="flex items-start gap-3">
            <TriangleAlert size={28} className="text-amber-500 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-black text-slate-900">학급 코드와 교사 비밀번호를 꼭 기록해 두세요!</h1>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                이메일을 받지 않기 때문에, 잊어버리면 선생님 혼자서는 되찾을 수 없어요. 다른 기기에서 학급을 열 때 두 가지가 모두 필요해요. 수첩에 적거나, 아래 ‘복사하기’로 메모 앱에 붙여 넣어 두세요.
              </p>
            </div>
          </div>
          <dl className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
            <div>
              <dt className="text-xs font-bold text-amber-800">학급 이름</dt>
              <dd className="text-base font-black text-slate-900 break-all">{created.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-amber-800">학급 코드 (학생 초대에도 써요)</dt>
              <dd className="font-mono font-black text-3xl tracking-[0.2em] text-indigo-700">{created.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-amber-800">교사 비밀번호</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono font-black text-xl text-slate-900 break-all">{showPw ? created.pw : '•'.repeat(Math.min(12, created.pw.length))}</span>
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? '비밀번호 가리기' : '비밀번호 보기'} className="w-9 h-9 shrink-0 rounded-lg border border-amber-300 bg-white text-slate-600 inline-flex items-center justify-center cursor-pointer">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </dd>
            </div>
          </dl>
          <button type="button" onClick={copyNote} className={`${btnGhost} w-full`}>
            {copiedNote ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />} {copiedNote ? '복사했어요! 메모 앱에 붙여 넣어 두세요' : '학급 코드와 비밀번호 복사하기'}
          </button>
          <p className="text-xs text-slate-500 leading-relaxed">
            그래도 잊어버렸다면: 학급 코드는 개설 코드를 준 관리자가 찾아 줄 수 있고, 비밀번호는 관리자에게 ‘재설정 코드’를 받아 새로 정할 수 있어요.
          </p>
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer">
            <input type="checkbox" checked={noted} onChange={(e) => setNoted(e.target.checked)} className="w-5 h-5 accent-indigo-600 cursor-pointer" />
            <span className="text-sm font-bold text-slate-800">학급 코드와 교사 비밀번호를 기록해 두었어요</span>
          </label>
          <button type="button" disabled={!noted} onClick={() => { setOpenId(created.id); setCreated(null); setMode('home'); }} className={`${btnPrimary} w-full`}>
            학급으로 들어가기 <ChevronRight size={16} />
          </button>
        </div>
      )}

      {mode !== 'home' && mode !== 'created' && (
        <button type="button" onClick={() => { setMode('home'); setError(''); }} className="text-sm font-bold text-slate-500 inline-flex items-center gap-1 cursor-pointer">
          <ArrowLeft size={15} /> 내 학급으로
        </button>
      )}

      {mode === 'create' && (
        <form onSubmit={createClass} className={`${card} p-4 sm:p-6 space-y-4`}>
          <div>
            <h1 className="text-lg font-black text-slate-900">새 학급 개설</h1>
            <p className="text-sm text-slate-500 mt-1">개설 코드는 연구회 관리자에게 받은 코드예요. 학생은 학급 코드로 들어와 닉네임과 비밀번호를 스스로 정합니다.</p>
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
              <label className={label} htmlFor="t-count">최대 학생 수 (100명까지)</label>
              <input id="t-count" className={input} type="number" min={1} max={MAX_CLASS_STUDENTS} value={count} onChange={(e) => setCount(e.target.value)} required />
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
          <p className="text-sm text-amber-900 bg-amber-50 border-2 border-amber-300 rounded-xl px-3 py-2.5 leading-relaxed flex items-start gap-2">
            <TriangleAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <span><b>개설하면 학급 코드가 만들어져요. 학급 코드와 교사 비밀번호를 꼭 기록해 두세요.</b> 다른 기기에서 학급을 열 때 두 가지가 모두 필요하고, 이메일을 받지 않기 때문에 잊어버리면 혼자서는 되찾을 수 없어요.</span>
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
          <button type="button" onClick={() => { setMode('reset'); setError(''); }} className="w-full text-sm font-bold text-slate-500 hover:text-indigo-700 cursor-pointer">
            교사 비밀번호를 잊었어요
          </button>
        </form>
      )}

      {mode === 'reset' && (
        <form onSubmit={resetPassword} className={`${card} p-4 sm:p-6 space-y-4`}>
          <div>
            <h1 className="text-lg font-black text-slate-900">교사 비밀번호 다시 정하기</h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              개설 코드를 준 <b>관리자에게 ‘비밀번호 재설정 코드’를 요청</b>해 주세요. 받은 코드를 아래에 넣으면 새 비밀번호를 정할 수 있어요. 재설정 코드는 24시간 동안 한 번만 쓸 수 있어요.
            </p>
            <p className="text-xs text-slate-500 mt-1">학급 코드를 잊었다면 관리자에게 함께 물어보세요.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="r-code">학급 코드</label>
              <input id="r-code" className={`${input} uppercase font-mono tracking-widest`} value={code} onChange={(e) => setCode(normalizeCode(e.target.value).slice(0, 6))} placeholder="예: K7M2QD" autoComplete="off" required />
            </div>
            <div>
              <label className={label} htmlFor="r-reset">재설정 코드</label>
              <input id="r-reset" className={`${input} uppercase font-mono tracking-widest`} value={resetCode} onChange={(e) => setResetCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX-XX" autoComplete="off" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="r-pw">새 교사 비밀번호 (6자 이상)</label>
              <input id="r-pw" className={input} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" required />
            </div>
            <div>
              <label className={label} htmlFor="r-pw2">새 비밀번호 확인</label>
              <input id="r-pw2" className={input} type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} autoComplete="new-password" required />
            </div>
          </div>
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy && <Loader2 size={16} className="animate-spin" />} 새 비밀번호로 정하고 학급 열기
          </button>
        </form>
      )}

      {error && <p role="alert" className="text-sm font-bold text-rose-600">⚠️ {error}</p>}
    </>
  );
}
