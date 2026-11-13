import { Trophy, Sparkles, Award } from 'lucide-react';
import { PROFILE_DATA, getBadgesList } from '../data';
import { usePortfolio } from '../state/PortfolioContext';

// ④ 배지 전당 화면
export default function BadgesView() {
  const {
    getBadgeProgress,
    history
  } = usePortfolio();

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg shadow-yellow-500/10">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10">
          <Trophy size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] bg-white/20 text-white font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              성실 실천 명예의 전당
            </span>
            <h3 className="text-xl font-black text-white mt-2">나의 영예로운 배지 전당 🏆</h3>
            <p className="text-xs text-amber-50 mt-1 max-w-xl leading-relaxed">
              매일 꾸준하게 10가지 IB 학습자상을 실천할 때마다 성장의 배지가 잠금해제됩니다! 총 56개의 숨겨진 업적 배지를 모두 모아보세요.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 self-start md:self-center">
            <span className="text-[10px] font-bold text-amber-100 block">달성한 총 배지 개수</span>
            <span className="text-2xl font-black text-white">
              {getBadgesList(history).filter(b => getBadgeProgress(b, history) >= b.requiredCount).length} <span className="text-sm font-normal text-amber-200">/ 56개</span>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: MILESTONES */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="text-amber-500" size={20} />
          <h3 className="text-base font-bold text-slate-800">성장 마일스톤 배지 (누적 성찰 배지)</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getBadgesList(history).filter(b => b.type === 'total_days').map((badge) => {
            const currentProgress = getBadgeProgress(badge, history);
            const isUnlocked = currentProgress >= badge.requiredCount;
            const progressPercent = Math.min(Math.round((currentProgress / badge.requiredCount) * 100), 100);

            return (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-white border-yellow-200 shadow-md ring-1 ring-yellow-400/10'
                    : 'bg-white/60 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm ${
                    isUnlocked ? 'bg-amber-100/60 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isUnlocked ? badge.emoji : '🔒'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                      <span>{badge.name}</span>
                      {isUnlocked && <span className="text-[10px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded font-bold border border-yellow-200">완료</span>}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">{badge.description}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-2 border-t border-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>달성 목표: {badge.requiredCount}일 제출</span>
                    <span className={isUnlocked ? 'text-indigo-600' : 'text-slate-500'}>
                      {currentProgress} / {badge.requiredCount}일 ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isUnlocked ? 'bg-amber-500' : 'bg-slate-300'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: LEARNER PROFILES SPECIFIC BADGES */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-indigo-500" size={20} />
          <h3 className="text-base font-bold text-slate-800">학습자상별 전문 실천 배지 (Tiers 1~5)</h3>
        </div>

        <div className="space-y-4">
          {PROFILE_DATA.map((profile) => {
            // Filter badges corresponding to this profile
            const profileBadges = getBadgesList(history).filter(b => b.profileKey === profile.key);
            const currentCount = history.reduce((sum, r) => sum + (r.completed.includes(profile.key) ? 1 : 0), 0);
            
            return (
              <div key={profile.key} className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                {/* Profile Header Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-3 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{profile.emoji}</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{profile.name} 배지 패키지</h4>
                      <p className="text-[10px] text-slate-400 font-medium">실천을 쌓아 5가지 등급 배지를 획득하세요.</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${profile.bgColor} ${profile.textColor} text-xs font-bold self-start`}>
                    누적 실천: {currentCount}회
                  </div>
                </div>

                {/* Badges row for this profile */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 pt-1">
                  {profileBadges.map((badge) => {
                    const isUnlocked = currentCount >= badge.requiredCount;
                    const progressPercent = Math.min(Math.round((currentCount / badge.requiredCount) * 100), 100);

                    return (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-2xl border flex flex-col justify-between text-center transition-all ${
                          isUnlocked
                            ? 'bg-slate-50/50 border-slate-200 hover:shadow-sm ring-1 ring-slate-100'
                            : 'bg-white border-dashed border-slate-100 opacity-45'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto ${
                            isUnlocked ? 'bg-white shadow-sm border border-slate-100' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {isUnlocked ? badge.emoji : '🔒'}
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-[11px] font-black text-slate-800 truncate">{badge.name}</h5>
                            <p className="text-[9px] text-indigo-600 font-bold">{badge.requiredCount}회 달성</p>
                          </div>
                        </div>

                        <div className="mt-3.5 space-y-1">
                          <div className="flex justify-between text-[8px] font-extrabold text-slate-400">
                            <span>진행도</span>
                            <span>{currentCount} / {badge.requiredCount}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isUnlocked ? 'bg-emerald-500' : 'bg-slate-300'}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
