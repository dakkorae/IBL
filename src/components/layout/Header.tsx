import { ChevronRight, ChevronLeft, Calendar, Share2 } from 'lucide-react';
import { usePortfolio } from '../../state/PortfolioContext';

// 상단 헤더: 화면 제목, 총 실천 횟수, 공유 버튼, 날짜 이동
// - 넓은 화면(xl): 날짜 · 제목 · 버튼이 한 줄
// - 그보다 좁은 화면: 윗줄에 제목과 버튼, 아랫줄에 날짜 이동
export default function Header() {
  const {
    currentView,
    getFormattedDate,
    handleNextDate,
    handlePrevDate,
    handleSharePortfolio,
    selectedDate,
    setCurrentView,
    setIsCalendarOpen,
    setSelectedDate,
    todayStr,
    totalMissionsCount
  } = usePortfolio();

  const navBtn =
    'w-10 h-10 shrink-0 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center disabled:cursor-not-allowed';

  return (
    <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      {/* Page Title */}
      <div className="order-1 xl:order-2 min-w-0 flex-1 xl:flex-none xl:text-center">
        <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight truncate">
          {currentView === 'dashboard' && '종합 성장 대시보드'}
          {currentView === 'mission' && (selectedDate === todayStr ? '오늘의 미션 도전!' : '선택한 날짜 미션 도전')}
          {currentView === 'class' && '우리 반'}
          {currentView === 'badges' && '나의 배지 전당'}
          {currentView === 'profiles' && 'IB 10대 학습자상 안내'}
          {currentView === 'settings' && '환경 설정'}
        </h2>
      </div>

      {/* Quick Stat Badge & Share Button */}
      <div className="order-2 xl:order-3 flex items-center gap-2 shrink-0">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-3 h-10 flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500">
            <span className="hidden sm:inline">총 </span>실천
          </span>
          <span className="text-sm font-extrabold text-indigo-600">{totalMissionsCount}회</span>
        </div>

        <button
          onClick={handleSharePortfolio}
          aria-label="포트폴리오 공유"
          className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 sm:w-auto sm:px-4 h-10 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <Share2 size={15} />
          <span className="hidden sm:inline">포트폴리오 공유</span>
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="order-3 xl:order-1 w-full xl:w-auto flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <button type="button" onClick={handlePrevDate} className={navBtn} aria-label="이전 날짜로 이동" title="이전 날짜로 이동">
          <ChevronLeft size={18} />
        </button>

        {/* 날짜 선택 버튼 (누르면 달력이 열림) */}
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          aria-label={`${getFormattedDate()}, 달력 열기`}
          className="flex-1 xl:flex-none min-w-0 h-10 inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-3 rounded-xl border border-indigo-200 shadow-sm cursor-pointer transition-all duration-200 active:scale-95"
        >
          <Calendar size={16} className="text-indigo-600 shrink-0" />
          <span className="font-extrabold text-sm truncate">{getFormattedDate()}</span>
          <span className="hidden sm:inline text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold shrink-0">
            달력 열기
          </span>
        </button>

        <button
          type="button"
          onClick={handleNextDate}
          disabled={selectedDate >= todayStr}
          className={navBtn}
          aria-label="다음 날짜로 이동"
          title="다음 날짜로 이동"
        >
          <ChevronRight size={18} />
        </button>

        {selectedDate !== todayStr && (
          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayStr);
              setCurrentView('mission');
            }}
            className="h-10 shrink-0 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 rounded-xl font-bold transition-all cursor-pointer shadow-sm"
            title="오늘 날짜로 돌아가기"
          >
            오늘 ↩
          </button>
        )}
      </div>
    </header>
  );
}
