import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROFILE_DATA } from '../../data';
import { usePortfolio } from '../../state/PortfolioContext';

// 미션 제출 후 축하 모달
export default function CelebrateModal() {
  const {
    selectedMissions,
    setCurrentView,
    setShowCelebrateModal,
    showCelebrateModal,
    userInfo
  } = usePortfolio();

  return (
    <AnimatePresence>
      {showCelebrateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden"
          >
            {/* Top Right Close Button */}
            <button
              onClick={() => setShowCelebrateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-all p-1.5 hover:bg-slate-100 rounded-full z-20 cursor-pointer"
              title="닫기"
            >
              <X size={18} />
            </button>
            {/* Confetti element decoration inside card */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-rose-50 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center space-y-4 relative">
              <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20 text-3xl animate-bounce">
                ✨
              </div>

              <div className="space-y-1">
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-0.5 rounded-full">
                  성장 완료! 하교 승인 완료
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 pt-1">
                  멋져요, {userInfo.name} 어린이!
                </h3>
                <p className="text-xs text-indigo-600 font-bold">
                  오늘의 {selectedMissions.length}가지 학습자상을 성실하게 실천했습니다!
                </p>
              </div>

              {/* Micro checklist list of what was completed today */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left max-h-[160px] overflow-y-auto space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">오늘 빛낸 핵심 가치들</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMissions.map((key) => {
                    const prof = PROFILE_DATA.find((p) => p.key === key);
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center space-x-1 bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                      >
                        <span>{prof?.emoji}</span>
                        <span>{prof?.name}</span>
                      </span>
                    );
                  })}
                  {selectedMissions.length === 0 && (
                    <span className="text-xs text-slate-400 font-medium">아쉽게도 오늘은 선택된 핵심 가치가 없지만, 마음만은 이미 훌륭해요!</span>
                  )}
                </div>
              </div>

              {/* Short encouragement message */}
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                "우리가 실천하는 오늘의 작은 약속이 더 나은 평화로운 내일을 만듭니다. 오늘 밤 푹 자고, 내일 더 튼튼한
                모습으로 교실에서 만나요!"
              </p>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowCelebrateModal(false);
                    setCurrentView('dashboard');
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  성장 확인하고 홈으로 가기
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
