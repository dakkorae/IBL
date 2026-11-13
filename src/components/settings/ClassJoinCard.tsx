import React, { useState } from 'react';
import { Users, Check, Loader2, LogOut, CloudOff, Cloud, ArrowLeft } from 'lucide-react';
import { cloudMode, errorMessage, getBackend } from '../../cloud';
import { ClassInfo, ClassSession, CloudRecord, Student } from '../../cloud/types';
import { normalizeCode } from '../../cloud/util';
import { usePortfolio } from '../../state/PortfolioContext';

type Step = 'code' | 'pick' | 'pin' | 'data';

const inputCls =
  'w-full h-12 px-4 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400';
const primaryBtn =
  'h-12 px-5 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-extrabold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed';
const ghostBtn =
  'h-12 px-4 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-600 text-sm font-bold border border-slate-200 rounded-xl transition-all cursor-pointer';

// 설정 화면의 '학급 참여' 카드: 학급 코드 → 내 번호 → 비밀번호 → 기록 가져오기/올리기
export default function ClassJoinCard() {
  const { classSession, connectClass, disconnectClass, history, syncState } = usePortfolio();

  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [picked, setPicked] = useState<Student | null>(null);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [cloudRecords, setCloudRecords] = useState<CloudRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const localDays = history.filter((r) => r.submitted).length;
  // 처음 실행하면 보이는 예시(샘플) 기록은 내 기록이 아니므로 학급에 올리지 않음
  const hasRealLocal = localDays > 0 && localStorage.getItem('ib_has_reset') === 'true';

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
  const restart = () => {
    setStep('code');
    setPicked(null);
    setPin('');
    setPin2('');
    setError('');
  };

  const findClass = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const backend = await getBackend();
      const found = await backend.getClass(code);
      if (!found) throw new Error('학급 코드를 찾을 수 없어요. 선생님께 받은 코드를 다시 확인해 주세요.');
      setInfo(found);
      setStudents(await backend.listStudents(found.id));
      setStep('pick');
    });
  };

  const sessionOf = (): ClassSession => ({
    classId: info!.id,
    className: info!.name,
    sid: picked!.id,
    number: picked!.number,
    nickname: picked!.nickname
  });

  const finish = (mode: 'pull' | 'push' | 'fresh', records: CloudRecord[] = cloudRecords) =>
    run(async () => {
      await connectClass(sessionOf(), mode, records);
      setNotice(
        mode === 'pull'
          ? `학급에 저장된 기록 ${records.length}일을 불러왔어요.`
          : mode === 'push'
            ? `이 기기의 기록 ${localDays}일을 학급에 올렸어요.`
            : '학급에 참여했어요. 오늘부터 기록을 시작해 보세요!'
      );
      restart();
    });

  const submitPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked || !info) return;
    if (!/^\d{4}$/.test(pin)) return setError('비밀번호는 숫자 4자리로 입력해 주세요.');
    if (!picked.claimed && pin !== pin2) return setError('두 번 입력한 비밀번호가 서로 달라요.');
    run(async () => {
      const backend = await getBackend();
      const result = await backend.joinClass(info.id, picked.id, pin);
      if (result === 'wrong-pin') {
        throw new Error(
          picked.claimed
            ? '비밀번호가 맞지 않아요. 잊어버렸다면 선생님께 초기화를 부탁하세요.'
            : '방금 다른 기기에서 이 번호의 비밀번호를 정했어요. 내 번호가 맞는지 확인해 주세요.'
        );
      }
      if (result === 'not-found') throw new Error('명단에서 이 번호를 찾을 수 없어요.');
      const records = await backend.getPortfolio(info.id, picked.id);
      setCloudRecords(records);
      if (records.length > 0 && !hasRealLocal) return void (await connectAndNote('pull', records));
      if (records.length === 0 && !hasRealLocal) return void (await connectAndNote('fresh', records));
      setStep('data'); // 어느 기록을 쓸지 골라야 하는 경우
    });
  };
  const connectAndNote = async (mode: 'pull' | 'fresh', records: CloudRecord[]) => {
    await connectClass(sessionOf(), mode, records);
    setNotice(mode === 'pull' ? `학급에 저장된 기록 ${records.length}일을 불러왔어요.` : '학급에 참여했어요. 오늘부터 기록을 시작해 보세요!');
    restart();
  };

  const cancelJoin = () =>
    run(async () => {
      if (info) await (await getBackend()).leaveClass(info.id);
      restart();
    });

  const header = (
    <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
      <Users className="text-indigo-500" size={18} />
      <div>
        <h3 className="text-sm font-bold text-slate-800">학급 참여</h3>
        <p className="text-xs text-slate-500 mt-0.5">우리 반에 참여하면 기록이 학급 서버에 저장되고, 다른 기기에서도 이어 쓸 수 있어요.</p>
      </div>
    </div>
  );
  const wrap = 'md:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4';

  if (cloudMode === 'off') {
    return (
      <div className={wrap}>
        {header}
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <CloudOff size={14} /> 학급 서버가 아직 연결되지 않았어요. 지금은 기록이 이 기기에만 저장됩니다.
        </p>
      </div>
    );
  }

  // ---- 참여 중 ----
  if (classSession) {
    return (
      <div className={wrap}>
        {header}
        {notice && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">✅ {notice}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
          <div className="min-w-0">
            <p className="text-base font-black text-slate-800 truncate">{classSession.className}</p>
            <p className="text-sm font-bold text-indigo-700 mt-0.5">
              {classSession.number}번{classSession.nickname !== `${classSession.number}번` && ` · ${classSession.nickname}`}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              {syncState === 'syncing' && (<><Loader2 size={12} className="animate-spin" /> 서버와 맞추는 중…</>)}
              {syncState === 'idle' && (<><Cloud size={12} className="text-emerald-600" /> 학급 서버에 저장되고 있어요</>)}
              {syncState === 'error' && (<><CloudOff size={12} className="text-rose-500" /> 서버에 연결하지 못했어요. 다음에 다시 시도할게요</>)}
            </p>
          </div>
          {!confirmLeave ? (
            <button type="button" onClick={() => setConfirmLeave(true)} className={ghostBtn}>
              <LogOut size={15} /> 학급에서 나가기
            </button>
          ) : (
            <div className="w-full sm:w-auto space-y-2">
              <p className="text-xs font-bold text-slate-700">정말 나갈까요? 학급에 올린 기록은 그대로 남고, 이 기기의 기록도 지워지지 않아요.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setConfirmLeave(false); setNotice(''); disconnectClass(); }} className={`${primaryBtn} flex-1 !bg-rose-600 hover:!bg-rose-700`}>
                  나가기
                </button>
                <button type="button" onClick={() => setConfirmLeave(false)} className={`${ghostBtn} flex-1`}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- 참여 전 ----
  return (
    <div className={wrap}>
      {header}

      {step === 'code' && (
        <form onSubmit={findClass} className="space-y-3">
          <label htmlFor="class-code" className="block text-xs font-bold text-slate-600">선생님께 받은 학급 코드</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="class-code"
              value={code}
              onChange={(e) => setCode(normalizeCode(e.target.value).slice(0, 6))}
              placeholder="예: K7M2QD"
              autoComplete="off"
              className={`${inputCls} sm:max-w-xs tracking-[0.3em] uppercase text-center`}
            />
            <button type="submit" disabled={busy || code.length < 6} className={primaryBtn}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : null} 학급 찾기
            </button>
          </div>
        </form>
      )}

      {step === 'pick' && info && (
        <div className="space-y-3">
          <button type="button" onClick={restart} className="text-xs font-bold text-slate-500 inline-flex items-center gap-1 cursor-pointer">
            <ArrowLeft size={13} /> 학급 코드 다시 입력
          </button>
          <p className="text-sm font-bold text-slate-800">
            <span className="text-indigo-700">{info.name}</span> — 내 번호를 골라 주세요.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2 max-h-72 overflow-y-auto pr-1">
            {students.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => { setPicked(st); setPin(''); setPin2(''); setError(''); setStep('pin'); }}
                className="h-14 px-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 text-center cursor-pointer transition-all"
              >
                <span className="block text-sm font-black text-slate-800">{st.number}번</span>
                {st.nickname !== `${st.number}번` && <span className="block text-[10px] text-slate-500 truncate">{st.nickname}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'pin' && info && picked && (
        <form onSubmit={submitPin} className="space-y-3 max-w-sm">
          <button type="button" onClick={() => { setStep('pick'); setError(''); }} className="text-xs font-bold text-slate-500 inline-flex items-center gap-1 cursor-pointer">
            <ArrowLeft size={13} /> 번호 다시 고르기
          </button>
          <p className="text-sm font-bold text-slate-800">
            <span className="text-indigo-700">{info.name} {picked.number}번</span>
            {picked.claimed ? ' — 비밀번호를 입력해 주세요.' : ' — 나만 아는 비밀번호(숫자 4자리)를 정해 주세요.'}
          </p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="숫자 4자리"
            aria-label="비밀번호"
            autoComplete="off"
            className={`${inputCls} text-center tracking-[0.5em]`}
          />
          {!picked.claimed && (
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
              placeholder="한 번 더 입력"
              aria-label="비밀번호 확인"
              autoComplete="off"
              className={`${inputCls} text-center tracking-[0.5em]`}
            />
          )}
          {!picked.claimed && <p className="text-[11px] text-slate-500">생일이나 1234처럼 쉬운 숫자는 피하고, 친구에게 알려 주지 마세요.</p>}
          <button type="submit" disabled={busy || pin.length < 4} className={`${primaryBtn} w-full`}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} 참여하기
          </button>
        </form>
      )}

      {step === 'data' && (
        <div className="space-y-3">
          {cloudRecords.length > 0 ? (
            <>
              <p className="text-sm font-bold text-slate-800 break-keep">
                학급에 이미 내 기록 {cloudRecords.length}일이 있어요. 불러오면 이 기기에 있던 기록 {localDays}일은 지워져요.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" disabled={busy} onClick={() => finish('pull')} className={primaryBtn}>학급 기록 불러오기</button>
                <button type="button" disabled={busy} onClick={cancelJoin} className={ghostBtn}>참여 취소</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-800 break-keep">이 기기에 기록 {localDays}일이 있어요. 학급에 올릴까요?</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" disabled={busy} onClick={() => finish('push')} className={primaryBtn}>기록을 학급에 올리기</button>
                <button type="button" disabled={busy} onClick={() => finish('fresh')} className={ghostBtn}>빈 기록으로 새로 시작</button>
                <button type="button" disabled={busy} onClick={cancelJoin} className={ghostBtn}>참여 취소</button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-xs font-bold text-rose-600">⚠️ {error}</p>}
    </div>
  );
}
