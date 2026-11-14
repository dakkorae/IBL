import { useEffect, useState } from 'react';
import { Users, RefreshCw, Target, Star, MessageCircleHeart, CalendarCheck, PartyPopper } from 'lucide-react';
import { PROFILE_DATA, getLocalDateString } from '../data';
import { cloudMode } from '../cloud';
import { goalProgress, myGoalCount } from '../cloud/stats';
import { Feedback } from '../cloud/types';
import RadarChart from '../components/RadarChart';
import { usePortfolio } from '../state/PortfolioContext';
import Community from './class/Community';

const TABS = [
  { key: 'home', name: '현황' },
  { key: 'notes', name: '칭찬 쪽지' },
  { key: 'board', name: '나눔 게시판' }
] as const;

const card = 'bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm';

// ⑥ 우리 반 화면: 학급 전체의 모습만 보여 줌 (친구 한 명 한 명의 숫자는 보이지 않음)
export default function ClassView() {
  const { classData, classDataState, classSession, history, refreshClassData, setCurrentView, updateCommunity } = usePortfolio();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('home');
  const { info, stats, feedback } = classData;

  // 화면을 열 때마다 최신 정보로
  useEffect(() => {
    if (classSession) refreshClassData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSession?.classId]);

  if (!classSession) {
    return (
      <div className={`${card} text-center py-12 space-y-4`}>
        <div className="text-5xl">🏫</div>
        <h3 className="text-lg font-black text-slate-800">아직 학급에 참여하지 않았어요</h3>
        <p className="text-sm text-slate-500 break-keep">
          {cloudMode === 'off'
            ? '학급 서버가 연결되면 우리 반 친구들과 함께한 실천을 여기에서 볼 수 있어요.'
            : '선생님께 받은 학급 코드로 참여하면, 우리 반이 함께 실천한 모습을 여기에서 볼 수 있어요.'}
        </p>
        {cloudMode !== 'off' && (
          <button
            type="button"
            onClick={() => setCurrentView('settings')}
            className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold rounded-xl cursor-pointer"
          >
            학급 참여하러 가기
          </button>
        )}
      </div>
    );
  }

  const today = getLocalDateString();
  const todayCount = stats?.days?.[today]?.students || 0;
  const focusProfile = info?.focus ? PROFILE_DATA.find((p) => p.key === info.focus!.key) : null;
  const goal = info?.goal || null;
  const goalProfile = goal?.profileKey ? PROFILE_DATA.find((p) => p.key === goal.profileKey) : null;
  const done = goal ? goalProgress(goal, stats) : 0;
  const mine = goal ? myGoalCount(goal, history) : 0;
  const pct = goal ? Math.min(100, Math.round((done / Math.max(1, goal.target)) * 100)) : 0;
  const reached = !!goal && done >= goal.target;
  // 공동 목표 달성에 함께했으면 배지용으로 기억해 둠
  useEffect(() => {
    if (reached && mine > 0) updateCommunity({ goal: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reached, mine]);

  const totals = stats?.totals || {};
  const radarData = PROFILE_DATA.map((p) => ({
    name: p.name,
    englishName: p.englishName,
    key: p.key,
    value: totals[p.key] || 0,
    percentage: stats && stats.records > 0 ? Math.round(((totals[p.key] || 0) / stats.records) * 100) : 0,
    color: p.color,
    emoji: p.emoji
  }));
  const radarMax = Math.max(0, ...radarData.map((d) => d.value));

  const feedbackList = (Object.entries(feedback) as [string, Feedback][])
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 10);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 학급 머리말 */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-5 sm:p-6 rounded-3xl flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] bg-white/20 font-extrabold px-2.5 py-0.5 rounded-md tracking-wider">우리 반</span>
          <h3 className="text-xl font-black mt-2 truncate">{info?.name || classSession.className}</h3>
          <p className="text-xs text-indigo-100 mt-1 flex items-center gap-1.5">
            <CalendarCheck size={14} /> 오늘 {todayCount}명의 친구가 기록했어요
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshClassData()}
          disabled={classDataState === 'loading'}
          className="h-11 px-4 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={15} className={classDataState === 'loading' ? 'animate-spin' : ''} /> 새로 고침
        </button>
      </div>

      {classDataState === 'error' && (
        <p role="alert" className="text-sm font-bold text-rose-600">⚠️ 우리 반 정보를 불러오지 못했어요. 잠시 후 새로 고침해 주세요.</p>
      )}

      <div role="tablist" className="grid grid-cols-3 bg-slate-200/70 p-1 rounded-xl sm:inline-grid sm:w-96">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} type="button" onClick={() => setTab(t.key)}
            className={`h-10 rounded-lg text-sm font-extrabold transition-all cursor-pointer ${tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
            {t.name}
          </button>
        ))}
      </div>

      {tab !== 'home' && <Community mode={tab} />}

      {tab === 'home' && (<>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 이번 주 중점 학습자상 */}
        <div className={card}>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Star size={16} className="text-amber-500" /> 이번 주 중점 학습자상
          </h4>
          {focusProfile ? (
            <div className={`mt-3 p-4 rounded-xl border ${focusProfile.bgColor} ${focusProfile.borderColor || 'border-slate-200'} flex items-start gap-3`}>
              <span className="text-4xl">{focusProfile.emoji}</span>
              <div className="min-w-0">
                <p className={`text-base font-black ${focusProfile.textColor}`}>{focusProfile.name}</p>
                <p className="text-sm text-slate-700 mt-1 break-keep">
                  {info?.focus?.note || '이번 주에는 이 학습자상을 특히 마음에 담고 실천해 봐요.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">선생님이 아직 정하지 않았어요.</p>
          )}
        </div>

        {/* 공동 목표 */}
        <div className={card}>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Target size={16} className="text-indigo-500" /> 우리 반 공동 목표
          </h4>
          {goal ? (
            <div className="mt-3 space-y-3">
              <p className="text-base font-black text-slate-800 break-keep">{goal.title}</p>
              <p className="text-xs text-slate-500">
                {goalProfile ? `${goalProfile.emoji} ${goalProfile.name}` : '모든 학습자상'} · {goal.startDate}부터
              </p>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${reached ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-black text-slate-800">
                  {done} <span className="font-medium text-slate-500">/ {goal.target}번</span>
                </span>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                  이 중 {mine}번은 내가 했어요
                </span>
              </div>
              {reached && (
                <p className="text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <PartyPopper size={18} /> 목표 달성! 우리 반 모두가 함께 해냈어요 🎉
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">지금은 진행 중인 공동 목표가 없어요.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 학급 전체 레이더 */}
        {stats && stats.records > 0 ? (
          <RadarChart data={radarData} maxSubmittedDays={radarMax} title="우리 반 학습자상" subtitle="우리 반 모두의 실천을 더한 모양" />
        ) : (
          <div className={`${card} flex items-center justify-center text-sm text-slate-500 text-center min-h-48`}>
            <span>
              <Users size={28} className="mx-auto text-slate-300 mb-2" />
              친구들의 기록이 모이면 우리 반의 모양이 나타나요.
            </span>
          </div>
        )}

        {/* 선생님 피드백 */}
        <div className={card}>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageCircleHeart size={16} className="text-rose-500" /> 선생님이 남긴 피드백
          </h4>
          <p className="text-xs text-slate-500 mt-1">나에게만 보여요.</p>
          {feedbackList.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">아직 받은 피드백이 없어요.</p>
          ) : (
            <ul className="mt-3 space-y-2 max-h-96 overflow-y-auto pr-1">
              {feedbackList.map(([date, f]) => (
                <li key={date} className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl flex items-start gap-3">
                  <span className="text-2xl shrink-0">{f.stamp || '💬'}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-rose-600">{date} 기록</p>
                    {f.text && <p className="text-sm text-slate-800 mt-0.5 break-words">{f.text}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      </>)}
    </div>
  );
}
