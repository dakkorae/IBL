import { PortfolioProvider, usePortfolio } from './state/PortfolioContext';
import Confetti from './components/Confetti';
import Sidebar from './components/layout/Sidebar';
import ShareModeBanner from './components/layout/ShareModeBanner';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import DashboardView from './views/DashboardView';
import MissionView from './views/MissionView';
import ProfilesView from './views/ProfilesView';
import BadgesView from './views/BadgesView';
import SettingsView from './views/SettingsView';
import CelebrateModal from './components/modals/CelebrateModal';
import BadgeUnlockModal from './components/modals/BadgeUnlockModal';
import CalendarModal from './components/modals/CalendarModal';
import Toast from './components/Toast';

// 화면 뼈대: 사이드바 + (공유 안내 띠, 헤더, 현재 화면) + 모달·알림
function AppLayout() {
  const { currentView, showCelebrateModal } = usePortfolio();

  return (
    <div className="min-h-dvh bg-slate-50 font-sans flex text-slate-800">
      {/* Confetti celebration */}
      <Confetti active={showCelebrateModal} />

      <Sidebar />

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <ShareModeBanner />
        <Header />

        {/* Content Area */}
        <div className="p-3 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'mission' && <MissionView />}
          {currentView === 'profiles' && <ProfilesView />}
          {currentView === 'badges' && <BadgesView />}
          {currentView === 'settings' && <SettingsView />}
        </div>
      </main>

      <BottomNav />

      <CelebrateModal />
      <BadgeUnlockModal />
      <CalendarModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <PortfolioProvider>
      <AppLayout />
    </PortfolioProvider>
  );
}
