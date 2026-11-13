import { ChevronRight, ChevronLeft, Calendar, Share2 } from 'lucide-react';
import { usePortfolio } from '../../state/PortfolioContext';

// 상단 헤더: 날짜 이동, 화면 제목, 총 실천 횟수, 공유 버튼
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

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Left: Calendar Controls */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
        {/* 이전 날짜 버튼 */}
        <button
          type="button"
          onClick={handlePrevDate}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
          title="이전 날짜로 이동"
        >
          <ChevronLeft size={15} />
        </button>

        {/* 날짜 선택 버튼 (클릭 시 달력 팝업 모달 열림) */}
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          className="inline-flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-sm cursor-pointer transition-all duration-200 group active:scale-95"
        >
          <Calendar size={15} className="text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
          <span className="font-extrabold text-xs sm:text-sm">{getFormattedDate()}</span>
          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold shrink-0 shadow-xs">
            📅 달력 열기
          </span>
        </button>

        {/* 다음 날짜 버튼 (오늘 날짜까지만 이동 가능) */}
        <button
          type="button"
          onClick={handleNextDate}
          disabled={selectedDate >= todayStr}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center disabled:cursor-not-allowed"
          title="다음 날짜로 이동"
        >
          <ChevronRight size={15} />
        </button>

        {/* 오늘 날짜로 이동 버튼 */}
        {selectedDate !== todayStr && (
          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayStr);
              setCurrentView('mission');
            }}
            className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-sm flex items-center space-x-1"
            title="오늘 날짜로 돌아가기"
          >
            <span>오늘로 이동</span>
            <span>↩</span>
          </button>
        )}
      </div>

      {/* Center: Page Title */}
      <div className="text-center shrink-0 my-0.5 md:my-0">
        <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
          {currentView === 'dashboard' && '종합 성장 대시보드'}
          {currentView === 'mission' && (selectedDate === todayStr ? '오늘의 IB 학습자 미션 도전!' : `IB 학습자 미션 도전 (${selectedDate})`)}
          {currentView === 'badges' && '나의 영예로운 배지 전당'}
          {currentView === 'profiles' && 'IB 10대 학습자상 상세 안내'}
          {currentView === 'settings' && '계정 및 환경 설정'}
        </h2>
      </div>

      {/* Right: Quick Stat Badge & Share Button */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-1.5 flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-500">총 실천 횟수</span>
          <span className="text-sm font-extrabold text-indigo-600">{totalMissionsCount}회</span>
        </div>

        <button
          onClick={handleSharePortfolio}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-2xl flex items-center space-x-2 text-xs font-bold shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <Share2 size={13} />
          <span>포트폴리오 공유</span>
        </button>
      </div>
    </header>
  );
}
