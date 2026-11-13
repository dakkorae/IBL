import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROFILE_DATA, getMissionForDay } from '../data';
import { usePortfolio } from '../state/PortfolioContext';

// ③ IB 10대 학습자상 상세 안내 화면
export default function ProfilesView() {
  const {
    expandedProfileKey,
    setExpandedProfileKey,
    todayStr
  } = usePortfolio();

  return (
    <div className="space-y-6">
      {/* Introduction header */}
      <div className="bg-indigo-900 text-white p-6 rounded-2xl relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-6 opacity-10">
          <BookOpen size={200} />
        </div>
        <span className="text-[10px] bg-indigo-500/40 text-white font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
          IB 초등과정 (PYP) 필독서
        </span>
        <h3 className="text-lg font-black text-white mt-3">IB 학습자상(Learner Profile)이 무엇인가요?</h3>
        <p className="text-xs text-indigo-200 mt-2 max-w-2xl leading-relaxed">
          인터내셔널 바칼로레아(IB)는 나이와 국가에 상관없이 모든 학습자가 더 평화롭고 나은 세상을 만드는 일에
          기여할 수 있는 글로벌 시민으로 성장하도록 돕습니다. 10가지 학습자상은 우리가 매일 실천해야 할 약속이자
          빛나는 북극성입니다.
        </p>
      </div>

      {/* Interactive Accordion Profiles List */}
      <div className="space-y-3">
        {PROFILE_DATA.map((profile, idx) => {
          const isExpanded = expandedProfileKey === profile.key;

          return (
            <div
              key={profile.key}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Accordion Trigger Header */}
              <button
                onClick={() => setExpandedProfileKey(isExpanded ? null : profile.key)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-all focus:outline-none"
              >
                <div className="flex items-center space-x-3.5">
                  <span className="text-3xl">{profile.emoji}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-400 font-mono">PROFILE {idx + 1}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${profile.bgColor} ${profile.textColor}`}>
                        {profile.englishName}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mt-0.5">
                      {profile.name}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400 hidden sm:inline-block">자세히 알아보기</span>
                  <div className="text-slate-400 p-1.5 bg-slate-50 rounded-lg">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </button>

              {/* Accordion Content Body */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-50"
                  >
                    <div className="p-5 bg-slate-50/50 space-y-4">
                      {/* Overall Description */}
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          뜻과 철학 (What it means)
                        </h5>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100">
                          {profile.description}
                        </p>
                      </div>

                      {/* Real Mission Text */}
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          오늘 학교에서의 도전 미션 (Daily Action Mission)
                        </h5>
                        <p className="text-xs text-indigo-900 font-semibold leading-relaxed bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/50">
                          📌 "{getMissionForDay(profile.key, todayStr)}"
                        </p>
                      </div>

                      {/* Practical Action Tips (bullets) */}
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          실천 가이드 & 팁 (Practical Practice Tips)
                        </h5>
                        <div className="grid grid-cols-1 gap-2.5">
                          {profile.tips.map((tip, tipIdx) => (
                            <div
                              key={tipIdx}
                              className="flex items-start space-x-2 bg-white p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600"
                            >
                              <span className="text-indigo-500 font-bold shrink-0">✔</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
