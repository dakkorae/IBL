import { Trophy } from 'lucide-react';
import { TOTAL_BADGE_COUNT } from '../../badges';
import { usePortfolio } from '../../state/PortfolioContext';
import { NAV_ITEMS } from './navItems';

// 왼쪽 사이드바: 앱 제목, 학생 정보, 메뉴
// - PC(lg 이상): 글자가 함께 보이는 넓은 사이드바
// - 태블릿(md): 아이콘만 보이는 좁은 사이드바
// - 휴대폰: 숨김 (대신 BottomNav 사용)
export default function Sidebar() {
  const {
    currentView,
    unlockedBadgeCount,
    selectedDate,
    setCurrentView,
    submittedToday,
    todayStr,
    userInfo
  } = usePortfolio();

  return (
    <aside className="hidden md:flex md:w-20 lg:w-64 md:sticky md:top-0 md:h-dvh bg-slate-900 text-slate-200 flex-col shrink-0 border-r border-slate-800 overflow-y-auto">
      {/* Brand / Title */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-center lg:justify-start lg:space-x-3">
        <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shrink-0">
          <Trophy size={18} className="text-white" />
        </div>
        <div className="min-w-0 hidden lg:block">
          <h1 className="text-[12px] font-extrabold tracking-tight text-white leading-snug whitespace-nowrap">IB학습자를 위한 매일 한 걸음!</h1>
          <p className="text-[10px] text-slate-400 font-medium">PORTFOLIO DASHBOARD</p>
        </div>
      </div>

      {/* User Card */}
      <div className="px-3 lg:px-6 py-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-center lg:justify-start lg:space-x-3">
          <div
            className="w-10 h-10 shrink-0 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg font-bold"
            title={`${userInfo.grade}학년 ${userInfo.classroom}반 ${userInfo.name}`}
          >
            {userInfo.name[0]}
          </div>
          <div className="hidden lg:block min-w-0">
            <div className="text-xs text-slate-400 truncate">{userInfo.school}</div>
            <div className="text-sm font-bold text-white truncate">
              {userInfo.grade}학년 {userInfo.classroom}반 {userInfo.name}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-2 lg:p-4 space-y-1" aria-label="주 메뉴">
        {NAV_ITEMS.map(({ view, label, shortLabel, icon: Icon }) => {
          const active = currentView === view;
          const fullLabel = view === 'mission' && selectedDate !== todayStr ? '선택 날짜 미션 도전' : label;
          return (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              aria-current={active ? 'page' : undefined}
              title={fullLabel}
              className={`relative w-full flex flex-col lg:flex-row items-center lg:justify-between gap-1 px-2 lg:px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3">
                <Icon size={20} />
                <span className="hidden lg:inline">{fullLabel}</span>
                <span className="lg:hidden text-[10px] font-bold">{shortLabel}</span>
              </div>
              {view === 'mission' && (
                <>
                  <span
                    className={`hidden lg:inline text-[10px] px-2 py-0.5 rounded-full border ${
                      submittedToday
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {submittedToday ? '완료' : '대기'}
                  </span>
                  <span
                    className={`lg:hidden absolute top-2 right-3 w-2 h-2 rounded-full ${submittedToday ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    aria-hidden="true"
                  />
                </>
              )}
              {view === 'badges' && (
                <span className="hidden lg:inline text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold">
                  {unlockedBadgeCount} / {TOTAL_BADGE_COUNT}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="hidden lg:block p-6 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-500 font-mono">IB Learner Profile v1.5</p>
        <p className="text-[9px] text-slate-600 mt-0.5">Designed for Elementary Grade 5</p>
      </div>
    </aside>
  );
}
