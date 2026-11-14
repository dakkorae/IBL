import { ChevronRight, Sparkles, RefreshCw, Check, Info, Plus, Trash2 } from 'lucide-react';
import { LearnerProfileKey } from '../types';
import { PROFILE_DATA, getMissionForDay } from '../data';
import { usePortfolio, MIN_REFLECTION_LENGTH } from '../state/PortfolioContext';

// ② 미션 도전(체크리스트) 화면
export default function MissionView() {
  const {
    customMissionsByDate,
    handleEnableEdit,
    handleAddReflection,
    handleReflectionChange,
    handleRemoveReflection,
    isReflectionOnlyMode,
    reflectionError,
    reflections,
    handleRerollMission,
    handleSubmitDaily,
    handleToggleMission,
    isEditingToday,
    recentlyRerolledKey,
    rerollCountsByDate,
    selectedDate,
    selectedMissions,
    setCurrentView,
    submittedToday,
    todayStr,
    classData,
    classSession
  } = usePortfolio();

  const formDisabled = submittedToday && !isEditingToday;
  const focusKey = classSession ? classData.info?.focus?.key : undefined;
  const hasDraft = selectedMissions.length > 0 || reflections.some((r) => r.text.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Daily Checklist Header Guide */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-row items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {selectedDate === todayStr ? '오늘의 미션 도전 현황' : `${selectedDate} 미션 도전 현황`}
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 font-medium">
              총 1,000가지 실천 미션 중 랜덤 제시 (영역별 100가지)
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 break-keep">
            10대 학습자상을 학교생활에서 실천하고, 스스로를 칭찬해주세요.
          </h3>
          <p className="hidden sm:block text-xs text-slate-500">
            각 영역별 실천 미션이 마음에 들지 않으면 <strong className="text-indigo-600">영역별로 각각 하루 최대 3회씩</strong> 다른 미션으로 변경할 수 있습니다.
          </p>
        </div>

        <div className="bg-indigo-50/60 p-3 sm:p-4 rounded-xl border border-indigo-100 text-center shrink-0 sm:min-w-[120px]">
          <p className="text-[10px] font-bold text-indigo-500 mb-0.5">
            {selectedDate === todayStr ? '오늘의 완성도' : '선택 날짜 완성도'}
          </p>
          <p className="text-2xl font-black text-indigo-600 leading-tight">
            {selectedMissions.length} <span className="text-sm font-normal text-slate-400">/ 10</span>
          </p>
        </div>
      </div>

      {/* Submission Status Alert for submitted days */}
      {submittedToday && !isEditingToday && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🎉</span>
            <div>
              <h4 className="text-sm font-bold">
                {selectedDate === todayStr ? '오늘의 포트폴리오 제출이 완료되었습니다!' : `${selectedDate} 포트폴리오 제출이 완료되었습니다!`}
              </h4>
              <p className="text-xs text-emerald-600">
                {selectedDate === todayStr ? '오늘 기록한 값은 대시보드 통계에 안전하게 합산되었습니다.' : '이 날 기록한 값은 대시보드 통계에 안전하게 반영되었습니다.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleEnableEdit}
            className="bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 self-start sm:self-center"
          >
            {selectedDate === todayStr ? '오늘 기록 수정하기' : '선택한 날짜 기록 수정하기'}
          </button>
        </div>
      )}

      {/* Editing Mode Banner */}
      {isEditingToday && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-2.5">
            <span className="text-base">✏️</span>
            <div>
              <span className="font-bold text-amber-900">기록 수정 모드 진행 중</span>
              <p className="text-[11px] text-amber-700 mt-0.5">수정 중인 내용이 브라우저에 실시간으로 자동 임시 저장됩니다. 수정을 마치면 아래 '결과 제출하기'를 눌러주세요.</p>
            </div>
          </div>
          <span className="bg-amber-200/80 text-amber-900 font-bold px-2.5 py-1 rounded-lg text-[10px] shrink-0">
            실시간 임시 저장 중
          </span>
        </div>
      )}

      {/* In-progress Draft Alert */}
      {!submittedToday && !isEditingToday && hasDraft && (
        <div className="bg-blue-50 border border-blue-200/80 text-blue-900 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-2.5">
            <span className="text-base">💾</span>
            <div>
              <span className="font-bold text-blue-900">입력하신 내용이 실시간 자동 저장되었습니다.</span>
              <p className="text-[11px] text-blue-700 mt-0.5">새로고침을 하거나 다른 탭으로 이동해도 체크한 미션({selectedMissions.length}개)과 실천 기록이 안전하게 보존됩니다.</p>
            </div>
          </div>
          <span className="bg-blue-200/70 text-blue-900 font-bold px-2.5 py-1 rounded-lg text-[10px] shrink-0">
            새로고침 유지됨
          </span>
        </div>
      )}

      {/* Grid of Missions */}
      <form onSubmit={handleSubmitDaily} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {PROFILE_DATA.map((profile, idx) => {
            const isSelected = selectedMissions.includes(profile.key);
            const disabled = submittedToday && !isEditingToday;
            const isRerolled = !!(customMissionsByDate[selectedDate] && customMissionsByDate[selectedDate]![profile.key]);
            const isRecentlyChanged = recentlyRerolledKey === profile.key;

            const dateRerolls = rerollCountsByDate[selectedDate] || {};
            const categoryRerollCount = (typeof dateRerolls === 'object' ? (dateRerolls[profile.key] || 0) : 0);
            const remainingCategoryRerolls = Math.max(0, 3 - categoryRerollCount);

            return (
              <div
                key={profile.key}
                onClick={() => !disabled && handleToggleMission(profile.key)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isRecentlyChanged
                    ? 'ring-2 ring-amber-400 bg-amber-50/40 border-amber-300 shadow-md'
                    : isSelected
                    ? `${profile.borderColor} ${profile.bgColor} ring-2 ring-indigo-500/15 shadow-md`
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                } ${disabled ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'}`}
              >
                {/* Upper line: Emoji, Badge, Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-3xl shrink-0">{profile.emoji}</span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-[15px] sm:text-base leading-snug break-keep">
                        {profile.name}
                      </h4>
                      <p className="mt-0.5 flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${profile.bgColor} ${profile.textColor}`}>
                          {profile.englishName}
                        </span>
                        {focusKey === profile.key && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                            ⭐ 이번 주 중점
                          </span>
                        )}
                        <span className="hidden sm:inline text-[10px] text-slate-400 font-mono whitespace-nowrap">MISSION #{idx + 1}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Controls: Per-Category Reroll Button + Checkbox */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Mission Reroll Button with per-category remaining count */}
                    <button
                      type="button"
                      disabled={disabled || remainingCategoryRerolls <= 0}
                      onClick={(e) => handleRerollMission(profile.key, e)}
                      className={`inline-flex items-center gap-1.5 px-2.5 h-10 whitespace-nowrap rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                        disabled || remainingCategoryRerolls <= 0
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-200 hover:border-amber-300 active:scale-95'
                      }`}
                      title={
                        remainingCategoryRerolls > 0
                          ? `[${profile.name}] 실천 미션을 다른 미션으로 변경합니다 (이 영역 남은 기회: ${remainingCategoryRerolls}회)`
                          : `[${profile.name}] 오늘의 실천미션 변경 기회(3회)를 모두 사용했습니다.`
                      }
                    >
                      <RefreshCw size={11} className={`${isRecentlyChanged ? 'animate-spin text-amber-600' : remainingCategoryRerolls > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span>바꾸기</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold transition-colors ${
                        remainingCategoryRerolls > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {remainingCategoryRerolls}/3
                      </span>
                    </button>

                    {/* Custom Checkbox UI */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-transparent'
                      }`}
                    >
                      <Check size={18} strokeWidth={3} />
                    </div>
                  </div>
                </div>

                {/* Mid Section: Real 100-mission Pool Content */}
                <div className={`mt-4 p-3.5 backdrop-blur-sm rounded-xl border transition-all ${
                  isRecentlyChanged
                    ? 'bg-amber-50/70 border-amber-200'
                    : isSelected
                    ? 'bg-white/80 border-slate-100'
                    : 'bg-slate-50/70 border-slate-100'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/60">
                        💡 실천 미션
                      </span>
                      {isRerolled && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-md border border-amber-200 flex items-center space-x-1">
                          <Sparkles size={9} />
                          <span>새로 뽑은 미션</span>
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:flex items-center space-x-1">
                      <span className="text-[10px] font-semibold text-slate-400">변경 기회:</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        remainingCategoryRerolls > 0
                          ? 'text-amber-700 bg-amber-50 border border-amber-200/60'
                          : 'text-slate-400 bg-slate-100'
                      }`}>
                        {remainingCategoryRerolls} / 3회
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 font-semibold leading-relaxed break-keep">
                    {getMissionForDay(profile.key, selectedDate, customMissionsByDate[selectedDate])}
                  </p>
                </div>

                {/* Bottom Hint Tip */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <div className="flex items-center">
                    <Info size={11} className="mr-1.5 text-slate-300" />
                    <span>배우고 실천했다면 카드를 눌러 체크하세요.</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Form Elements */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="block text-sm font-bold text-slate-700">
                ✍️ {selectedDate === todayStr ? '오늘의 실천 기록' : `${selectedDate} 실천 기록`}{' '}
                <span className="text-rose-500 text-xs">(필수)</span>
              </label>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-semibold">
                💾 입력 즉시 자동 저장
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              {isReflectionOnlyMode
                ? '오늘 체크한 미션이 없어요. 실천하지 못한 까닭이나 내일의 다짐을 한 줄 쓰면 저장되고, 솔직한 돌아보기로 ‘성찰하는 사람’ 1회가 기록됩니다.'
                : `체크한 미션 중 하나를 고르고, 언제 어떻게 실천했는지 써 주세요. (${MIN_REFLECTION_LENGTH}글자 이상, 한 줄 이상 필수)`}
            </p>

            <div className="space-y-3">
              {reflections.map((r, index) => {
                const chars = r.text.replace(/\s/g, '').length;
                const needsMission = !isReflectionOnlyMode && !r.profileKey && r.text.trim().length > 0;
                return (
                  <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      {isReflectionOnlyMode ? (
                        <span className="flex-1 text-xs font-bold text-violet-700">🪞 오늘의 성찰</span>
                      ) : (
                        <select
                          value={r.profileKey || ''}
                          onChange={(e) => handleReflectionChange(index, { profileKey: (e.target.value || null) as LearnerProfileKey | null })}
                          disabled={formDisabled}
                          aria-label={`${index + 1}번 기록의 미션 고르기`}
                          className={`flex-1 min-w-0 h-11 px-3 text-sm font-semibold bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                            needsMission ? 'border-rose-300 text-rose-600' : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          <option value="">미션 고르기 (체크한 미션)</option>
                          {PROFILE_DATA.filter((p) => selectedMissions.includes(p.key)).map((p) => (
                            <option key={p.key} value={p.key}>
                              {p.emoji} {p.name} — {getMissionForDay(p.key, selectedDate, customMissionsByDate[selectedDate])}
                            </option>
                          ))}
                        </select>
                      )}
                      {reflections.length > 1 && !formDisabled && (
                        <button
                          type="button"
                          onClick={() => handleRemoveReflection(index)}
                          aria-label={`${index + 1}번 기록 지우기`}
                          className="w-11 h-11 shrink-0 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={r.text}
                      onChange={(e) => handleReflectionChange(index, { text: e.target.value })}
                      disabled={formDisabled}
                      rows={2}
                      maxLength={300}
                      aria-label={`${index + 1}번 기록 내용`}
                      placeholder={
                        isReflectionOnlyMode
                          ? '예: 오늘은 시간이 없어서 못 했어요. 내일은 쉬는 시간에 질문을 하나 만들어 볼래요.'
                          : '예: 2교시 수학 시간에 짝에게 분수 문제 푸는 방법을 설명해 줬어요.'
                      }
                      className="w-full p-3 text-sm font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 placeholder-slate-400 transition-all resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                    {!formDisabled && (
                      <p className={`text-[11px] font-semibold ${chars >= MIN_REFLECTION_LENGTH ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {chars >= MIN_REFLECTION_LENGTH ? `✓ ${chars}글자` : `${chars} / ${MIN_REFLECTION_LENGTH}글자 이상`}
                        {needsMission && <span className="text-rose-500 ml-2">미션을 골라 주세요</span>}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {!formDisabled && (
              <button
                type="button"
                onClick={handleAddReflection}
                className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-11 px-4 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>기록 한 줄 더 쓰기</span>
              </button>
            )}
          </div>

          {/* Submission Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className={`text-xs font-medium text-center sm:text-left ${reflectionError && !formDisabled ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
              {reflectionError && !formDisabled
                ? `✍️ ${reflectionError}`
                : '💡 기록을 제출하면 대시보드에 해당 날짜의 실천 내용이 반영됩니다.'}
            </p>

            {submittedToday && !isEditingToday ? (
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="w-full sm:w-auto bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <span>📊 대시보드로 돌아가 성적 확인하기</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                aria-disabled={!!reflectionError}
                className={`w-full sm:w-auto text-white text-sm font-extrabold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  reflectionError
                    ? 'bg-slate-300'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/15'
                }`}
              >
                <span>🚀 미션 수행 결과 제출하기</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
