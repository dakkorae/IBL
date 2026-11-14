import { usePortfolio } from '../../state/PortfolioContext';
import { NAV_ITEMS } from './navItems';

// 휴대폰 화면 아래에 고정되는 메뉴 탭 바 (태블릿·PC에서는 숨김)
export default function BottomNav() {
  const { currentView, setCurrentView, submittedToday } = usePortfolio();

  return (
    <nav
      aria-label="주 메뉴"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5">
        {/* 휴대폰 탭은 5칸: 학습자상 안내는 설정 화면에서 열 수 있음 */}
        {NAV_ITEMS.filter((n) => n.view !== 'profiles').map(({ view, shortLabel, icon: Icon }) => {
          const active = currentView === view;
          return (
            <button
              key={view}
              onClick={() => {
                setCurrentView(view);
                window.scrollTo({ top: 0 });
              }}
              aria-current={active ? 'page' : undefined}
              className={`relative h-14 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                active ? 'text-indigo-600' : 'text-slate-500'
              }`}
            >
              {active && <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-indigo-600" aria-hidden="true" />}
              <span className="relative">
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                {view === 'mission' && (
                  <span
                    className={`absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full ring-2 ring-white ${submittedToday ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    aria-hidden="true"
                  />
                )}
              </span>
              <span>{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
