import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Confetti from '../Confetti';
import { usePortfolio } from '../../state/PortfolioContext';

// 새 배지 획득 축하 모달
export default function BadgeUnlockModal() {
  const {
    newlyUnlockedBadges,
    setCurrentView,
    setShowBadgeUnlockModal,
    setShowCelebrateModal,
    showBadgeUnlockModal,
    userInfo
  } = usePortfolio();

  return (
    <AnimatePresence>
      {showBadgeUnlockModal && newlyUnlockedBadges.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Confetti active={showBadgeUnlockModal} />
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-gradient-to-b from-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-800 relative overflow-hidden"
          >
            {/* Close button at top right */}
            <button
              onClick={() => setShowBadgeUnlockModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all p-1.5 hover:bg-white/10 rounded-full z-20 cursor-pointer"
              title="닫기"
            >
              <X size={18} />
            </button>

            {/* Star light background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,transparent_100%)] pointer-events-none" />
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center space-y-5 relative">
              <div className="w-20 h-20 bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-yellow-500/20 text-4xl animate-pulse">
                👑
              </div>

              <div className="space-y-1">
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 font-extrabold px-3 py-1 rounded-full border border-yellow-500/30 uppercase tracking-widest animate-bounce">
                  명예로운 업적 잠금 해제!
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white pt-2 leading-tight">
                  대단해요, {userInfo.name} 어린이!
                </h3>
                <p className="text-xs text-indigo-300 font-medium">
                  끊임없는 실천과 성찰로 영광스러운 배지를 획득했습니다!
                </p>
              </div>

              {/* Display Newly Unlocked Badges */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center space-y-3">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">새로 받은 배지 {newlyUnlockedBadges.length}개</p>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {newlyUnlockedBadges.map((badge) => (
                    <div key={badge.id} className="flex items-center space-x-3.5 text-left bg-indigo-900/30 border border-indigo-500/20 p-3.5 rounded-xl">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-3xl shrink-0 shadow-inner">
                        {badge.emoji}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">{badge.name}</h4>
                        <p className="text-[10px] text-indigo-200 mt-0.5 leading-relaxed font-medium">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Celebration Letter */}
              <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                "배움을 마음에 품고 끝없이 행동하는 사람은 미래를 더 아름답게 빛낼 주인공입니다. 여러분의 소중한 성장은 이미 배지 전당에 영원히 기록되었습니다!"
              </p>

              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowBadgeUnlockModal(false);
                    setShowCelebrateModal(true); // Trigger standard submission success next
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer"
                >
                  확인
                </button>

                <button
                  onClick={() => {
                    setShowBadgeUnlockModal(false);
                    setCurrentView('badges');
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 text-xs font-black py-3.5 rounded-xl transition-all shadow-md shadow-yellow-500/10 cursor-pointer"
                >
                  배지 전당가서 자랑하기 🏆
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
