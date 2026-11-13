import { useState } from 'react';
import { Palette, Check, RotateCcw } from 'lucide-react';
import {
  COLOR_THEMES,
  DEFAULT_THEME,
  FONTS,
  FONT_SIZES,
  ThemeSettings,
  loadThemeSettings,
  saveThemeSettings
} from '../../theme';

// 설정 화면의 '화면 테마' 카드: 고르는 즉시 앱 전체에 적용되고 이 기기에 저장됨
export default function ThemeSettingsCard() {
  const [settings, setSettings] = useState<ThemeSettings>(loadThemeSettings);

  const update = (patch: Partial<ThemeSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveThemeSettings(next);
  };

  const isDefault =
    settings.color === DEFAULT_THEME.color && settings.font === DEFAULT_THEME.font && settings.size === DEFAULT_THEME.size;

  return (
    <div className="md:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <Palette className="text-indigo-500" size={18} />
          <div>
            <h3 className="text-sm font-bold text-slate-800">화면 테마</h3>
            <p className="text-xs text-slate-500 mt-0.5">고르는 즉시 바뀌고, 이 기기에 저장돼요.</p>
          </div>
        </div>
        {!isDefault && (
          <button
            type="button"
            onClick={() => update(DEFAULT_THEME)}
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer"
          >
            <RotateCcw size={13} /> 처음 설정으로
          </button>
        )}
      </div>

      {/* 색상 테마 */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-bold text-slate-700 mb-3">🎨 색상 테마</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {COLOR_THEMES.map((t) => {
            const active = settings.color === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => update({ color: t.id })}
                aria-pressed={active}
                className={`relative p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  active ? 'border-indigo-500 bg-indigo-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className="h-10 rounded-lg mb-2 shadow-inner"
                  style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
                  aria-hidden="true"
                />
                <span className="text-xs font-bold text-slate-700">
                  {t.emoji} {t.name}
                </span>
                {active && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 글꼴 */}
      <fieldset>
        <legend className="text-xs font-bold text-slate-700 mb-3">✏️ 글꼴</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {FONTS.map((f) => {
            const active = settings.font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => update({ font: f.id })}
                aria-pressed={active}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  active ? 'border-indigo-500 bg-indigo-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{f.name}</span>
                  {active && <Check size={14} strokeWidth={3} className="text-indigo-600" />}
                </span>
                <span className="block text-lg text-slate-800 mt-1" style={{ fontFamily: f.family }}>
                  오늘도 한 걸음!
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">{f.desc}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 글자 크기 */}
      <fieldset>
        <legend className="text-xs font-bold text-slate-700 mb-3">🔠 글자 크기</legend>
        <div className="inline-flex w-full sm:w-auto bg-slate-100 p-1 rounded-xl" role="group">
          {FONT_SIZES.map((s, i) => {
            const active = settings.size === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => update({ size: s.id })}
                aria-pressed={active}
                className={`flex-1 sm:flex-none sm:px-6 h-10 rounded-lg font-bold transition-all cursor-pointer ${
                  active ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                style={{ fontSize: `${13 + i * 2}px` }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
