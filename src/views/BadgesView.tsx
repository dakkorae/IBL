import { Trophy, Lock, Sparkles } from 'lucide-react';
import { BadgeStatus } from '../types';
import { PROFILE_DATA } from '../data';
import { BADGE_CATEGORIES, TOTAL_BADGE_COUNT } from '../badges';
import { usePortfolio } from '../state/PortfolioContext';

const percentOf = (b: BadgeStatus) => Math.min(100, Math.round((b.progress / b.requiredCount) * 100));
const progressText = (b: BadgeStatus) => `${Math.min(b.progress, b.requiredCount)} / ${b.requiredCount}${b.unit}`;

// 배지 카드 한 장 (깜짝 배지는 받기 전까지 이름과 조건을 가림)
function BadgeCard({ badge }: { badge: BadgeStatus; key?: string }) {
  const hidden = badge.secret && !badge.unlocked;
  const pct = percentOf(badge);

  return (
    <div
      className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
        badge.unlocked
          ? 'bg-white border-amber-200 shadow-sm ring-1 ring-amber-400/10'
          : hidden
            ? 'bg-violet-50/50 border-dashed border-violet-200'
            : 'bg-white/70 border-slate-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl ${
            badge.unlocked
              ? 'bg-amber-50 border border-amber-200'
              : hidden
                ? 'bg-violet-100 text-violet-400'
                : 'bg-slate-100 grayscale opacity-50'
          }`}
          aria-hidden="true"
        >
          {hidden ? '❔' : badge.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-slate-800 text-sm flex flex-wrap items-center gap-1.5">
            <span className="break-keep">{hidden ? '???' : badge.name}</span>
            {badge.unlocked && (
              <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold border border-amber-200">획득</span>
            )}
          </h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed break-keep">
            {hidden ? `💡 힌트: ${badge.hint}` : badge.requirementDescription}
          </p>
          {badge.unlocked && (
            <p className="text-[11px] text-amber-700 font-medium mt-1 leading-relaxed break-keep">{badge.description}</p>
          )}
        </div>
      </div>

      {!badge.unlocked && !hidden && (
        <div className="space-y-1">
          <div className="flex justify-end text-[11px] font-bold text-slate-500">{progressText(badge)}</div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-indigo-400 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ④ 배지 전당 화면
export default function BadgesView() {
  const { badgeStatuses, unlockedBadgeCount } = usePortfolio();
  const totalPct = Math.round((unlockedBadgeCount / TOTAL_BADGE_COUNT) * 100);

  // 곧 받을 수 있는 배지: 아직 못 받은 (깜짝 배지 제외) 배지 중 진행률이 높은 순
  const nearest = badgeStatuses
    .filter((b) => !b.unlocked && !b.secret && b.progress > 0)
    .sort((a, b) => percentOf(b) - percentOf(a) || a.requiredCount - b.requiredCount)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-5 sm:p-6 rounded-3xl relative overflow-hidden shadow-lg shadow-yellow-500/10">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10">
          <Trophy size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] bg-white/20 text-white font-extrabold px-2.5 py-0.5 rounded-md tracking-wider">
              나의 배지 전당
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-2 break-keep">모아 볼까요? 배지 {TOTAL_BADGE_COUNT}개 🏆</h3>
            <p className="text-xs text-amber-50 mt-1 max-w-xl leading-relaxed break-keep">
              많이 누르는 것보다 꾸준히, 골고루, 정성껏 실천할수록 배지가 열려요. 받기 전까지 정체를 알 수 없는 깜짝 배지도 숨어 있어요!
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 md:min-w-[180px]">
            <span className="text-[11px] font-bold text-amber-100 block">모은 배지</span>
            <span className="text-2xl font-black text-white">
              {unlockedBadgeCount} <span className="text-sm font-normal text-amber-100">/ {TOTAL_BADGE_COUNT}개</span>
            </span>
            <div className="mt-2 w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${totalPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 곧 받을 수 있는 배지 */}
      {nearest.length > 0 && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-500" /> 조금만 더 하면 받을 수 있어요!
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {nearest.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-indigo-100 p-3 flex items-center gap-3">
                <span className="text-2xl grayscale opacity-60" aria-hidden="true">{b.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{b.name}</p>
                  <div className="mt-1 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentOf(b)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{progressText(b)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {BADGE_CATEGORIES.map((cat) => {
        const list = badgeStatuses.filter((b) => b.category === cat.key);
        const got = list.filter((b) => b.unlocked).length;

        return (
          <section key={cat.key} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {cat.emoji} {cat.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                {got} / {list.length}
              </span>
            </div>

            {cat.key === 'profile' ? (
              // 학습자상 배지: 학습자상마다 3단계를 한 카드에
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {PROFILE_DATA.map((profile) => {
                  const tiers = list.filter((b) => b.profileKey === profile.key);
                  const count = tiers[0]?.progress ?? 0;
                  const next = tiers.find((t) => !t.unlocked);
                  return (
                    <div key={profile.key} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl">{profile.emoji}</span>
                          <h4 className="text-sm font-bold text-slate-800 truncate">{profile.name}</h4>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold ${profile.bgColor} ${profile.textColor}`}>
                          {count}회
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {tiers.map((t) => (
                          <div
                            key={t.id}
                            title={`${t.name}: ${t.requirementDescription}`}
                            className={`rounded-xl border p-2 text-center ${
                              t.unlocked ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-dashed border-slate-200'
                            }`}
                          >
                            <div className={`text-xl ${t.unlocked ? '' : 'grayscale opacity-40'}`} aria-hidden="true">
                              {t.emoji}
                            </div>
                            <p className={`text-[10px] font-bold mt-1 leading-tight break-keep ${t.unlocked ? 'text-amber-800' : 'text-slate-400'}`}>
                              {t.name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5 flex items-center justify-center gap-0.5">
                              {!t.unlocked && <Lock size={8} />}
                              {t.requiredCount}회
                            </p>
                          </div>
                        ))}
                      </div>
                      {next ? (
                        <div className="space-y-1">
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${percentOf(next)}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            다음 배지 ‘{next.name}’까지 {next.requiredCount - count}회
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-700 font-bold">🎉 세 단계를 모두 모았어요!</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {list.map((b) => (
                  <BadgeCard key={b.id} badge={b} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
