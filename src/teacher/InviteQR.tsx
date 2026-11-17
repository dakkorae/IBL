import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

// 학생 초대 주소: 이 주소로 들어오면 학급 코드가 자동으로 입력됨
export const inviteUrl = (classId: string) => `${window.location.origin}${window.location.pathname}?join=${classId}`;

// 화면 가득 크게 보여 주는 초대 QR (교실 TV·칠판 화면에 띄워 두고 학생이 태블릿 카메라로 찍음)
export default function InviteQR({ classId, className, onClose }: { classId: string; className: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="학생 초대 QR 코드" className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-lg max-h-full overflow-y-auto text-center space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="text-left min-w-0">
            <p className="text-xs font-bold text-indigo-600">학생 초대</p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 break-words">{className}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="w-10 h-10 shrink-0 rounded-xl border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="mx-auto w-full max-w-[min(70vh,22rem)] p-3 bg-white border-4 border-slate-900 rounded-2xl">
          <QRCodeSVG value={inviteUrl(classId)} size={512} level="M" marginSize={1} className="w-full h-auto" title={`${className} 초대 QR 코드`} />
        </div>
        <p className="text-sm font-bold text-slate-700">카메라로 QR 코드를 찍으면 학급 참여 화면이 열려요.</p>
        <p className="text-sm text-slate-500">
          QR이 안 되면 학급 코드 <b className="font-mono text-2xl tracking-[0.25em] text-indigo-700 align-middle">{classId}</b>
        </p>
      </div>
    </div>
  );
}
