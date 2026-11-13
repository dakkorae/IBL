import { LearnerProfileKey, Reflection } from '../types';

// 제출 전 작성 중인 체크·메모를 날짜별로 브라우저에 임시 저장하는 도우미

export interface DailyDraft {
  completed: LearnerProfileKey[];
  memo?: string;
  reflections?: Reflection[];
}

export const getDailyDrafts = (): Record<string, DailyDraft> => {
  try {
    const raw = localStorage.getItem('ib_daily_drafts');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to read ib_daily_drafts', e);
    return {};
  }
};

export const saveDailyDraft = (date: string, completed: LearnerProfileKey[], reflections: Reflection[]) => {
  try {
    const drafts = getDailyDrafts();
    drafts[date] = { completed, reflections };
    localStorage.setItem('ib_daily_drafts', JSON.stringify(drafts));
  } catch (e) {
    console.error('Failed to save daily draft', e);
  }
};

export const clearDailyDraft = (date: string) => {
  try {
    const drafts = getDailyDrafts();
    if (drafts[date]) {
      delete drafts[date];
      localStorage.setItem('ib_daily_drafts', JSON.stringify(drafts));
    }
  } catch (e) {
    console.error('Failed to clear daily draft', e);
  }
};
