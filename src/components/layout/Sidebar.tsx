import { LayoutDashboard, CheckSquare, BookOpen, Settings, Trophy } from 'lucide-react';
import { getBadgesList } from '../../data';
import { usePortfolio } from '../../state/PortfolioContext';

// 왼쪽 사이드바: 앱 제목, 학생 정보, 메뉴
export default function Sidebar() {
  const {
    currentView,
    getBadgeProgress,
    history,
    selectedDate,
    setCurrentView,
    submittedToday,
    todayStr,
    userInfo
  } = usePortfolio();

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand / Title */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shrink-0">
          <Trophy size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[12px] font-extrabold tracking-tight text-white leading-snug whitespace-nowrap">IB학습자를 위한 매일 한 걸음!</h1>
          <p className="text-[10px] text-slate-400 font-medium">PORTFOLIO DASHBOARD</p>
        </div>
      </div>

      {/* User Card */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg font-bold">
            {userInfo.name[0]}
          </div>
          <div>
            <div className="text-xs text-slate-400">{userInfo.school}</div>
            <div className="text-sm font-bold text-white">
              {userInfo.grade}학년 {userInfo.classroom}반 {userInfo.name}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            currentView === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard size={18} />
          <span>종합 대시보드</span>
        </button>

        <button
          onClick={() => setCurrentView('mission')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            currentView === 'mission'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <CheckSquare size={18} />
            <span>{selectedDate === todayStr ? '오늘의 미션 도전' : '선택 날짜 미션 도전'}</span>
          </div>
          {submittedToday ? (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              완료
            </span>
          ) : (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
              대기
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentView('badges')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            currentView === 'badges'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Trophy size={18} />
            <span>나의 배지 전당</span>
          </div>
          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold">
            {getBadgesList(history).filter(b => getBadgeProgress(b, history) >= b.requiredCount).length} / 56
          </span>
        </button>

        <button
          onClick={() => setCurrentView('profiles')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            currentView === 'profiles'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <BookOpen size={18} />
          <span>10대 학습자상 탐구</span>
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            currentView === 'settings'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings size={18} />
          <span>환경 설정</span>
        </button>
      </nav>

      {/* Footer info */}
      <div className="p-6 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-500 font-mono">IB Learner Profile v1.2</p>
        <p className="text-[9px] text-slate-600 mt-0.5">Designed for Elementary Grade 5</p>
      </div>
    </aside>
  );
}
