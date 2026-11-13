import { usePortfolio } from '../../state/PortfolioContext';

// 공유 링크로 열었을 때 상단에 보이는 읽기 전용 안내 띠
export default function ShareModeBanner() {
  const {
    isShareMode,
    sharedUserInfo
  } = usePortfolio();

  return (
    <>
      {isShareMode && (
        <div className="bg-gradient-to-r from-indigo-950 to-indigo-800 text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-bold border-b border-indigo-700 shadow-lg">
          <div className="flex items-center space-x-2.5">
            <span className="bg-indigo-500 text-white px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider animate-pulse">공유 모드</span>
            <span className="font-medium text-indigo-100">
              🏫 <span className="text-white font-extrabold">{sharedUserInfo.school} {sharedUserInfo.grade}학년 {sharedUserInfo.classroom}반 {sharedUserInfo.name}</span> 어린이의 포트폴리오를 열람 중입니다. (읽기 전용)
            </span>
          </div>
          <button
            onClick={() => {
              window.location.href = window.location.pathname;
            }}
            className="bg-white text-indigo-950 hover:bg-indigo-50 px-3.5 py-1.5 rounded-xl font-extrabold transition-all text-xs shadow-md shrink-0 self-start sm:self-center"
          >
            내 대시보드로 돌아가기
          </button>
        </div>
      )}
    </>
  );
}
