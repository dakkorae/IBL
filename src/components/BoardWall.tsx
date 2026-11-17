import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { PROFILE_DATA } from '../data';
import { Entry } from '../cloud/types';

export const WALL_PAGE_SIZE = 12; // 한 쪽에 붙는 글 수 (PC 3줄×4, 태블릿 2줄×6, 휴대폰 1줄)

const dateText = (at: number) => {
  const d = new Date(at);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

interface Props {
  entries: Entry[];
  empty: string;
  me?: string; // 내 sid (내 글 표시, 내가 누른 좋아요 표시)
  onLike?: (entry: Entry, on: boolean) => void; // 없으면 좋아요 수만 보여 줌 (교사 화면)
  actions?: (entry: Entry) => React.ReactNode; // 쪽지 아래 오른쪽에 붙는 작은 버튼들 (불편해요, 내리기 …)
  badge?: (entry: Entry) => React.ReactNode; // 쪽지 위쪽에 붙는 표시 (신고 수 …)
}

// 담벼락: 글을 붙임쪽지처럼 여러 줄로 쌓아 보여 주고, 글이 많으면 쪽을 나눔 (칭찬·나눔 게시판, 교사 소통 탭이 함께 씀)
export default function BoardWall({ entries, empty, me, onLike, actions, badge }: Props) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(entries.length / WALL_PAGE_SIZE));
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  const current = Math.min(page, pages);
  const list = entries.slice((current - 1) * WALL_PAGE_SIZE, current * WALL_PAGE_SIZE);

  if (entries.length === 0) return <p className="py-10 text-center text-sm text-slate-500">{empty}</p>;

  // 쪽 번호: 많으면 현재 쪽 주변만
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 1);
  const pageBtn = 'min-w-10 h-10 px-2 rounded-xl border text-sm font-extrabold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center';

  return (
    <div className="space-y-4">
      <ul className="columns-1 sm:columns-2 xl:columns-3 gap-3 [column-fill:balance]">
        {list.map((entry) => {
          const p = PROFILE_DATA.find((x) => x.key === entry.profileKey);
          const likes = entry.likes || [];
          const liked = !!me && likes.includes(me);
          const isMine = !!me && entry.from === me;
          return (
            <li key={entry.id} className={`break-inside-avoid mb-3 rounded-2xl border shadow-sm overflow-hidden ${p ? `${p.bgColor} ${p.borderColor}` : 'bg-white border-slate-200'}`}>
              <div className="p-3.5 space-y-2">
                {badge?.(entry)}
                {p && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-white/80 border border-white rounded-full px-2 py-0.5 text-slate-700 whitespace-nowrap">
                    {p.emoji} {p.name}
                  </span>
                )}
                {entry.toName && (
                  <p className="text-sm font-black text-blue-700 break-words">To. {entry.toName}</p>
                )}
                <p className="text-sm text-slate-800 leading-relaxed break-words whitespace-pre-line">{entry.text}</p>
              </div>
              <div className="px-3.5 py-2 bg-white/70 border-t border-white flex items-center gap-2">
                <p className="min-w-0 flex-1 text-xs text-slate-600 truncate">
                  <span className="font-bold text-slate-800">{entry.fromName}</span>
                  {isMine && <span className="ml-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 rounded px-1 py-0.5">내 글</span>}
                  <span className="ml-1.5 text-slate-400">{dateText(entry.createdAt)}</span>
                </p>
                {actions?.(entry)}
                {onLike ? (
                  <button
                    type="button"
                    aria-pressed={liked}
                    aria-label={`좋아요 ${likes.length}개${liked ? ' (눌렀어요)' : ''}`}
                    onClick={() => onLike(entry, !liked)}
                    className={`shrink-0 h-8 px-2 rounded-full inline-flex items-center gap-1 text-xs font-extrabold cursor-pointer transition-all active:scale-90 ${liked ? 'text-rose-600 bg-rose-50' : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50'}`}
                  >
                    <Heart size={15} fill={liked ? 'currentColor' : 'none'} /> {likes.length}
                  </button>
                ) : (
                  <span className="shrink-0 h-8 px-1 inline-flex items-center gap-1 text-xs font-extrabold text-slate-500" aria-label={`좋아요 ${likes.length}개`}>
                    <Heart size={14} /> {likes.length}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {pages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="게시판 쪽 이동">
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="이전 쪽" className={`${pageBtn} bg-white border-slate-200 text-slate-600`}><ChevronLeft size={16} /></button>
          {numbers.map((n, i) => (
            <React.Fragment key={n}>
              {i > 0 && n - numbers[i - 1] > 1 && <span className="text-slate-400 px-0.5">…</span>}
              <button type="button" aria-current={n === current ? 'page' : undefined} onClick={() => setPage(n)}
                className={`${pageBtn} ${n === current ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                {n}
              </button>
            </React.Fragment>
          ))}
          <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="다음 쪽" className={`${pageBtn} bg-white border-slate-200 text-slate-600`}><ChevronRight size={16} /></button>
        </nav>
      )}
    </div>
  );
}
