import { Trophy, Sparkles, AlertCircle, Calendar, Award } from 'lucide-react';
import { PROFILE_DATA } from '../data';
import RadarChart from '../components/RadarChart';
import HistoryBarChart from '../components/HistoryBarChart';
import { usePortfolio } from '../state/PortfolioContext';

// ① 종합 성장 대시보드 화면
export default function DashboardView() {
  const {
    history,
    selectedDate,
    selectedMissions,
    setStatsPeriod,
    stats,
    statsPeriod,
    submittedToday,
    todayStr
  } = usePortfolio();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Top Summary Stats Cards */}
      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Recorded Days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">총 기록 일수</p>
              <p className="text-xl font-black text-slate-800">{stats.totalSubmittedDays}일째 실천 중</p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">전체</span>
              <span className="font-bold text-slate-700">{stats.totalSubmittedDays}일</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">평일</span>
              <span className="font-bold text-slate-700">{stats.weekdaySubmittedDays}일</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">주말 및 공휴일</span>
              <span className="font-bold text-slate-700">{stats.weekendHolidaySubmittedDays}일</span>
            </div>
          </div>
        </div>

        {/* Card 2: Average Daily Actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
              <Award size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">하루 평균 실천 수</p>
              <p className="text-xl font-black text-slate-800">{stats.averageCompletedPerDay}개 / 일</p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">전체</span>
              <span className="font-bold text-slate-700">{stats.averageCompletedPerDay}개/일</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">평일</span>
              <span className="font-bold text-slate-700">{stats.weekdayAveragePerDay}개/일</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">주말 및 공휴일</span>
              <span className="font-bold text-slate-700">{stats.weekendHolidayAveragePerDay}개/일</span>
            </div>
          </div>
        </div>

        {/* Card 3: Completion Status for Selected Date */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">
                {selectedDate === todayStr ? '오늘 완료 여부' : `${selectedDate} 완료 여부`}
              </p>
              <p className={`text-xl font-black ${submittedToday ? 'text-emerald-600' : 'text-amber-500'}`}>
                {submittedToday ? '제출 완료 🎉' : '미제출 (진행중)'}
              </p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-500 font-medium">해당 날짜 실천 항목:</span>
            <span className="font-extrabold text-amber-600">{selectedMissions.length}개 완료</span>
          </div>
        </div>
      </div>

      {/* Chart Filters & Radar Chart Column (L: 5) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500">분석 기준 기간</span>
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatsPeriod('day')}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                statsPeriod === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              오늘
            </button>
            <button
              onClick={() => setStatsPeriod('week')}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                statsPeriod === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              7일
            </button>
            <button
              onClick={() => setStatsPeriod('month')}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                statsPeriod === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              14일
            </button>
            <button
              onClick={() => setStatsPeriod('3months')}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                statsPeriod === '3months' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3개월
            </button>
            <button
              onClick={() => setStatsPeriod('6months')}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                statsPeriod === '6months' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              6개월
            </button>
            <button
              onClick={() => setStatsPeriod('1year')}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                statsPeriod === '1year' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              1년
            </button>
          </div>
        </div>

        {/* Radar Chart Visual */}
        <RadarChart data={stats.chartData} maxSubmittedDays={stats.totalSubmittedDays} />
      </div>

      {/* Strengths / Growth & Stats List Column (L: 7) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Strengths vs Growth Highlight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Strength Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-2 right-2 text-indigo-200">
              <Trophy size={64} className="opacity-45" />
            </div>
            <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
              나의 대표 강점
            </span>
            {stats.strongest ? (
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{stats.strongest.emoji}</span>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{stats.strongest.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{stats.strongest.englishName}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                  {PROFILE_DATA.find((p) => p.key === stats.strongest?.key)?.description}
                </p>
                <div className="mt-4 flex items-center text-xs text-indigo-600 font-bold">
                  <span>이 기간 동안 총 {stats.strongest.value}회 실천 완료!</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-slate-400 text-xs py-4">
                실천 데이터를 쌓아 대표 강점을 알아보세요!
              </div>
            )}
          </div>

          {/* Growth Needed Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-2 right-2 text-amber-200">
              <AlertCircle size={64} className="opacity-45" />
            </div>
            <span className="text-[10px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
              도전과 노력이 필요한 상
            </span>
            {stats.weakest ? (
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{stats.weakest.emoji}</span>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{stats.weakest.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{stats.weakest.englishName}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                  {PROFILE_DATA.find((p) => p.key === stats.weakest?.key)?.description}
                </p>
                <div className="mt-4 flex items-center text-xs text-amber-700 font-bold">
                  <span>앞으로 조금만 더 신경 써보면 어떨까요?</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-slate-400 text-xs py-4">
                앞으로 더 많은 학습자상 도전에 도전해 보아요!
              </div>
            )}
          </div>
        </div>

        {/* History Bar Chart */}
        <HistoryBarChart history={history} />

        {/* Feed of Recent Journals / Actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-800">최근 일지 기록</h3>
            <span className="text-xs text-slate-400">지속적인 성장의 기록</span>
          </div>

          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {[...history]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 4)
              .map((record) => (
                <div key={record.date} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600">{record.date}</span>
                    <div className="flex -space-x-1 overflow-hidden">
                      {record.completed.map((key) => {
                        const prof = PROFILE_DATA.find((p) => p.key === key);
                        return (
                          <span
                            key={key}
                            title={prof?.name}
                            className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] border border-slate-200 shadow-sm"
                          >
                            {prof?.emoji}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {record.reflectionOnly && (
                    <span className="inline-block text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
                      🪞 성찰 기록으로 +1
                    </span>
                  )}
                  {(record.reflections || []).map((r, i) => {
                    const prof = r.profileKey ? PROFILE_DATA.find((p) => p.key === r.profileKey) : null;
                    return (
                      <p key={i} className="text-xs text-slate-600 leading-relaxed font-medium break-words">
                        {prof && (
                          <span className={`inline-block mr-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${prof.bgColor} ${prof.textColor}`}>
                            {prof.emoji} {prof.name}
                          </span>
                        )}
                        {r.text}
                      </p>
                    );
                  })}
                  {!record.reflections?.length && record.memo && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium break-words">
                      "{record.memo}"
                    </p>
                  )}
                </div>
              ))}

            {history.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-6">일지 기록이 아직 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
