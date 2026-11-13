import { LayoutDashboard, CheckSquare, BookOpen, Settings, Trophy, LucideIcon } from 'lucide-react';
import { ViewType } from '../../types';

// 사이드바(PC·태블릿)와 하단 탭 바(휴대폰)가 함께 쓰는 메뉴 목록
export const NAV_ITEMS: { view: ViewType; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { view: 'dashboard', label: '종합 대시보드', shortLabel: '대시보드', icon: LayoutDashboard },
  { view: 'mission', label: '오늘의 미션 도전', shortLabel: '미션', icon: CheckSquare },
  { view: 'badges', label: '나의 배지 전당', shortLabel: '배지', icon: Trophy },
  { view: 'profiles', label: '10대 학습자상 탐구', shortLabel: '학습자상', icon: BookOpen },
  { view: 'settings', label: '환경 설정', shortLabel: '설정', icon: Settings }
];
