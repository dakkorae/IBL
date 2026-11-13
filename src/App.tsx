import { PortfolioProvider, usePortfolio } from './state/PortfolioContext';
import Confetti from './components/Confetti';
import Sidebar from './components/layout/Sidebar';
import ShareModeBanner from './components/layout/ShareModeBanner';
import Header from './components/layout/Header';
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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row text-slate-800">
      {/* Confetti celebration */}
      <Confetti active={showCelebrateModal} />

      <Sidebar />

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <ShareModeBanner />
        <Header />

        {/* Content Area */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'mission' && <MissionView />}
          {currentView === 'profiles' && <ProfilesView />}
          {currentView === 'badges' && <BadgesView />}
          {currentView === 'settings' && <SettingsView />}
        </div>
      </main>

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
