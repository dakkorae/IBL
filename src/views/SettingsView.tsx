import { Sparkles, RefreshCw, Trash2, User, Download, Upload } from 'lucide-react';
import { usePortfolio } from '../state/PortfolioContext';
import ThemeSettingsCard from '../components/settings/ThemeSettingsCard';
import ClassJoinCard from '../components/settings/ClassJoinCard';

// ⑤ 환경 설정 화면
export default function SettingsView() {
  const {
    handleExportData,
    handleImportData,
    handleLoadSampleData,
    handleResetData,
    handleSaveSettings,
    setUserInfo,
    userInfo
  } = usePortfolio();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 화면 테마 (색상 · 글꼴 · 글자 크기) */}
      {/* 학급 참여 (서버 저장) */}
      <ClassJoinCard />

      <ThemeSettingsCard />

      {/* Account Profile Setup Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-50">
          <User className="text-indigo-500" size={18} />
          <h3 className="text-sm font-bold text-slate-800">학적 정보 및 프로필 변경</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">이름</label>
            <input
              type="text"
              value={userInfo.name}
              onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
              className="w-full text-xs font-semibold p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">학년</label>
              <select
                value={userInfo.grade}
                onChange={(e) => setUserInfo({ ...userInfo, grade: e.target.value })}
                className="w-full text-xs font-semibold p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-700"
              >
                {['1', '2', '3', '4', '5', '6'].map((g) => (
                  <option key={g} value={g}>
                    {g}학년
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">반</label>
              <input
                type="text"
                value={userInfo.classroom}
                onChange={(e) => setUserInfo({ ...userInfo, classroom: e.target.value })}
                className="w-full text-xs font-semibold p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">학교명</label>
            <input
              type="text"
              value={userInfo.school}
              onChange={(e) => setUserInfo({ ...userInfo, school: e.target.value })}
              className="w-full text-xs font-semibold p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-700"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer"
          >
            학적 정보 저장하기
          </button>
        </form>
      </div>

      {/* Data Management Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-50">
          <RefreshCw className="text-amber-500" size={18} />
          <h3 className="text-sm font-bold text-slate-800">데이터 관리 및 초기화</h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700">로컬 브라우저 데이터 (LocalStorage)</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              이 애플리케이션의 모든 활동 데이터(과거 실천 이력, 학적 세팅)는 사용자 브라우저의 내부 메모리(localStorage)에
              안전하고 즉시 저장됩니다. 별도의 외부 서버 연동 없이 독립적으로 동작합니다.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Backup & Restore Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
              <button
                onClick={handleExportData}
                className="flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold p-3.5 rounded-xl text-xs border border-indigo-100 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <Download size={14} className="shrink-0" />
                <span>포트폴리오 백업 (JSON)</span>
              </button>

              <label className="flex items-center justify-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold p-3.5 rounded-xl text-xs border border-emerald-100 transition-all cursor-pointer shadow-sm hover:shadow-md relative">
                <Upload size={14} className="shrink-0" />
                <span>포트폴리오 복원 (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleLoadSampleData}
                className="w-full text-left bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <h5 className="text-xs font-bold text-indigo-700">샘플 실천 데이터 불러오기 (365일 데모)</h5>
                  <p className="text-[10px] text-indigo-500/80 mt-0.5">다양한 통계 차트와 명예의 전당 배지 기능을 미리 체험할 수 있는 1년치 예시 데이터를 채웁니다.</p>
                </div>
                <Sparkles size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={handleResetData}
                className="w-full text-left bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <h5 className="text-xs font-bold text-rose-700">전체 기록 데이터 초기화</h5>
                  <p className="text-[10px] text-rose-400/80 mt-0.5">저장된 기록과 설정을 완전히 삭제하고 0일부터 새롭게 시작합니다.</p>
                </div>
                <Trash2 size={16} className="text-rose-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
