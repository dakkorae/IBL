import { Sparkles, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePortfolio } from '../state/PortfolioContext';

// 화면 하단에 잠깐 떴다 사라지는 알림
export default function Toast() {
  const {
    setToastMessage,
    toastMessage
  } = usePortfolio();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-3 md:top-auto md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-50 sm:max-w-md pointer-events-auto"
        >
          <div className={`p-4 rounded-2xl shadow-xl border flex items-center space-x-3 backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/20'
              : toastMessage.type === 'warning'
              ? 'bg-amber-900/95 text-amber-50 border-amber-700 shadow-amber-950/30'
              : 'bg-indigo-900/95 text-white border-indigo-700 shadow-indigo-950/30'
          }`}>
            <div className="shrink-0">
              {toastMessage.type === 'success' && <Sparkles size={18} className="text-amber-400" />}
              {toastMessage.type === 'warning' && <AlertCircle size={18} className="text-amber-400" />}
              {toastMessage.type === 'info' && <Info size={18} className="text-indigo-300" />}
            </div>
            <p className="text-xs sm:text-sm font-bold flex-1 leading-snug">
              {toastMessage.text}
            </p>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
