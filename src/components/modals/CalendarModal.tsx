import { ChevronRight, ChevronLeft, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortfolio } from '../../state/PortfolioContext';

// 날짜 선택 달력 모달
export default function CalendarModal() {
  const {
    calendarViewMonth,
    calendarViewYear,
    history,
    isCalendarOpen,
    selectedDate,
    setCalendarViewMonth,
    setCalendarViewYear,
    setCurrentView,
    setIsCalendarOpen,
    setSelectedDate,
    todayStr
  } = usePortfolio();

  return (
    <AnimatePresence>
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-100 relative"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">미션 수행 날짜 선택</h3>
                  <p className="text-[10px] text-slate-400">날짜를 클릭하면 해당 날짜 미션 보기로 이동합니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                title="닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Month Navigation Header */}
            <div className="flex items-center justify-between px-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  if (calendarViewMonth === 0) {
                    setCalendarViewMonth(11);
                    setCalendarViewYear((y) => y - 1);
                  } else {
                    setCalendarViewMonth((m) => m - 1);
                  }
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-all cursor-pointer border border-slate-200 shadow-2xs"
                title="이전 달"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-center">
                <span className="font-black text-base text-slate-800">
                  {calendarViewYear}년 {calendarViewMonth + 1}월
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (calendarViewMonth === 11) {
                    setCalendarViewMonth(0);
                    setCalendarViewYear((y) => y + 1);
                  } else {
                    setCalendarViewMonth((m) => m + 1);
                  }
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-all cursor-pointer border border-slate-200 shadow-2xs"
                title="다음 달"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs mb-2">
              <span className="text-rose-500 py-1">일</span>
              <span className="text-slate-600 py-1">월</span>
              <span className="text-slate-600 py-1">화</span>
              <span className="text-slate-600 py-1">수</span>
              <span className="text-slate-600 py-1">목</span>
              <span className="text-slate-600 py-1">금</span>
              <span className="text-indigo-600 py-1">토</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Leading offset blanks */}
              {Array.from({ length: new Date(calendarViewYear, calendarViewMonth, 1).getDay() }).map((_, i) => (
                <div key={`blank-${i}`} className="h-9" />
              ))}

              {/* Days of the Month */}
              {Array.from({ length: new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate() }).map((_, i) => {
                const dayNum = i + 1;
                const mmStr = String(calendarViewMonth + 1).padStart(2, '0');
                const ddStr = String(dayNum).padStart(2, '0');
                const dateStr = `${calendarViewYear}-${mmStr}-${ddStr}`;

                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const isFuture = dateStr > todayStr;
                const hasRecord = history.some((r) => r.date === dateStr && r.submitted && r.completed.length > 0);

                return (
                  <button
                    key={dateStr}
                    disabled={isFuture}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setCurrentView('mission');
                      setIsCalendarOpen(false);
                    }}
                    className={`h-9 rounded-xl font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105'
                        : isToday
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : isFuture
                        ? 'text-slate-300 bg-slate-50 cursor-not-allowed opacity-50'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {/* Record Indicator Dot */}
                    {hasRecord && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${
                          isSelected ? 'bg-amber-300' : 'bg-emerald-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Legend & Manual Input */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 text-[11px] text-slate-500">
              <div className="flex items-center justify-between text-xs font-semibold px-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>기록 제출 완료</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>오늘 ({todayStr})</span>
                </div>
              </div>

              {/* Direct Date Input Fallback */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-extrabold text-slate-700 text-xs">직접 날짜 입력:</span>
                <input
                  type="date"
                  value={selectedDate}
                  max={todayStr}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setCurrentView('mission');
                      setIsCalendarOpen(false);
                    }
                  }}
                  className="border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setCurrentView('mission');
                    setIsCalendarOpen(false);
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  오늘 날짜로 이동 ({todayStr})
                </button>

                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
