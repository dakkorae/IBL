import { Suspense, lazy, useEffect, useState } from 'react';
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

// 교사용·관리자용 화면은 학생 화면과 따로 내려받음 (학생 기기에는 필요 없음)
const TeacherApp = lazy(() => import('./teacher/TeacherApp'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

const routeOf = () => (location.hash === '#teacher' ? 'teacher' : location.hash === '#admin' ? 'admin' : 'student');

export default function App() {
  // 주소 끝이 #teacher 이면 교사용, #admin 이면 관리자용 화면
  const [route, setRoute] = useState(routeOf);
  useEffect(() => {
    const onHash = () => setRoute(routeOf());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route !== 'student') {
    return (
      <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm font-bold text-slate-500">불러오는 중…</div>}>
        {route === 'teacher' ? <TeacherApp /> : <AdminApp />}
      </Suspense>
    );
  }

  return (
    <PortfolioProvider>
      <AppLayout />
    </PortfolioProvider>
  );
}
