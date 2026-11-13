// 화면 테마 설정 (색상 테마 · 글꼴 · 글자 크기)
// - 이 기기의 브라우저에 저장되며, 학습 기록 백업 파일에는 포함되지 않음
// - <html>에 data-theme / data-font / data-size 속성을 붙이고, 실제 모양은 CSS(index.css, styles/themes.css)가 정함

export type ColorThemeId = 'default' | 'ocean' | 'forest' | 'sunset' | 'blossom' | 'night';
export type FontId = 'pretendard' | 'gowun' | 'jua' | 'nanum';
export type FontSizeId = 'small' | 'medium' | 'large';

export interface ThemeSettings {
  color: ColorThemeId;
  font: FontId;
  size: FontSizeId;
}

// swatch: 설정 화면의 색 견본 (주 색상, 보조 색상)
export const COLOR_THEMES: { id: ColorThemeId; name: string; emoji: string; swatch: [string, string] }[] = [
  { id: 'default', name: '기본 보라', emoji: '💜', swatch: ['#4f46e5', '#7c3aed'] },
  { id: 'ocean', name: '바다', emoji: '🌊', swatch: ['#2563eb', '#06b6d4'] },
  { id: 'forest', name: '숲', emoji: '🌲', swatch: ['#059669', '#14b8a6'] },
  { id: 'sunset', name: '노을', emoji: '🌇', swatch: ['#ea580c', '#f43f5e'] },
  { id: 'blossom', name: '벚꽃', emoji: '🌸', swatch: ['#db2777', '#d946ef'] },
  { id: 'night', name: '밤하늘', emoji: '🌌', swatch: ['#475569', '#6366f1'] }
];

export const FONTS: { id: FontId; name: string; desc: string; family: string }[] = [
  { id: 'pretendard', name: '프리텐다드', desc: '깔끔한 기본 글꼴', family: '"Pretendard", sans-serif' },
  { id: 'gowun', name: '고운돋움', desc: '부드럽고 단정한 글꼴', family: '"Gowun Dodum", sans-serif' },
  { id: 'jua', name: '주아', desc: '동글동글 귀여운 글꼴', family: '"Jua", sans-serif' },
  { id: 'nanum', name: '나눔고딕', desc: '또박또박 읽기 쉬운 글꼴', family: '"Nanum Gothic", sans-serif' }
];

export const FONT_SIZES: { id: FontSizeId; name: string }[] = [
  { id: 'small', name: '작게' },
  { id: 'medium', name: '보통' },
  { id: 'large', name: '크게' }
];

export const DEFAULT_THEME: ThemeSettings = { color: 'default', font: 'pretendard', size: 'medium' };
const STORAGE_KEY = 'ib_theme_settings';

export function loadThemeSettings(): ThemeSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      color: COLOR_THEMES.some((t) => t.id === saved.color) ? saved.color : DEFAULT_THEME.color,
      font: FONTS.some((f) => f.id === saved.font) ? saved.font : DEFAULT_THEME.font,
      size: FONT_SIZES.some((s) => s.id === saved.size) ? saved.size : DEFAULT_THEME.size
    };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

export function applyThemeSettings(settings: ThemeSettings) {
  const root = document.documentElement;
  root.dataset.theme = settings.color;
  root.dataset.font = settings.font;
  root.dataset.size = settings.size;
}

export function saveThemeSettings(settings: ThemeSettings) {
  applyThemeSettings(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 저장이 안 되는 환경이면 이번 화면에만 적용
  }
}
