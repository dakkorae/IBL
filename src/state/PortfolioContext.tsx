import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LearnerProfileKey, DailyRecord, ViewType, TimePeriod, Reflection, BadgeStatus } from '../types';
import { PROFILE_DATA, generateMockHistory, calculateStats, getLocalDateString, parseDateString, getMissionForDay, getDefaultMissionForDay, getRandomMission, reconstructHistoryFromShared } from '../data';
import { evaluateBadges, CommunityCounts } from '../badges';
import { getDailyDrafts, saveDailyDraft, clearDailyDraft } from '../storage/drafts';
import { getBackend, loadClassSession, saveClassSession } from '../cloud';
import { ClassInfo, ClassPublicStats, ClassSession, CloudRecord, FeedbackMap } from '../cloud/types';
import { recordDelta } from '../cloud/stats';

export const MIN_REFLECTION_LENGTH = 5;
const emptyReflection = (): Reflection => ({ profileKey: null, text: '' });

// 저장된 기록을 입력 칸에 다시 불러올 때 쓰는 변환 (예전 자유 메모도 한 줄로 보여 줌)
const recordToReflections = (rec: DailyRecord): Reflection[] => {
  if (Array.isArray(rec.reflections) && rec.reflections.length > 0) return rec.reflections;
  if (rec.memo) return [{ profileKey: null, text: rec.memo }];
  return [emptyReflection()];
};
const recordToSelected = (rec: DailyRecord): LearnerProfileKey[] => (rec.reflectionOnly ? [] : rec.completed || []);
const draftToReflections = (draft: { memo?: string; reflections?: Reflection[] } | undefined): Reflection[] => {
  if (draft && Array.isArray(draft.reflections) && draft.reflections.length > 0) return draft.reflections;
  if (draft && typeof draft.memo === 'string' && draft.memo) return [{ profileKey: null, text: draft.memo }];
  return [emptyReflection()];
};

// 앱 전체가 함께 쓰는 상태(기록, 학생 정보, 선택 날짜 등)와 동작(제출, 백업, 공유 등)을 모아 둔 곳.
// 각 화면은 usePortfolio()로 필요한 값만 꺼내 씁니다.
function usePortfolioState() {
  // --- STATE WITH SYNCHRONOUS PERSISTENCE ---

  // 1. History state initialized synchronously from localStorage
  const [history, setHistory] = useState<DailyRecord[]>(() => {
    try {
      const stored = localStorage.getItem('ib_portfolio_history');
      if (stored !== null) {
        const parsed = JSON.parse(stored) as DailyRecord[];
        if (Array.isArray(parsed)) {
          // Strictly return whatever is in localStorage without modifying or injecting mock records!
          return parsed.sort((a, b) => a.date.localeCompare(b.date));
        }
      }
      // If user has explicitly reset data before, keep clean empty history
      if (localStorage.getItem('ib_has_reset') === 'true') {
        return [];
      }
    } catch (e) {
      console.error('Failed to load initial history from localStorage', e);
    }
    const initial = generateMockHistory();
    try {
      localStorage.setItem('ib_portfolio_history', JSON.stringify(initial));
    } catch (e) {
      console.error(e);
    }
    return initial;
  });

  // 2. User info initialized synchronously from localStorage
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const stored = localStorage.getItem('ib_user_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.name) return parsed;
      }
    } catch (e) {
      console.error('Failed to load userInfo from localStorage', e);
    }
    return {
      name: '김현우',
      grade: '5',
      classroom: '3',
      school: 'IB World School'
    };
  });

  // 3. Current view & time filter period initialized synchronously
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    try {
      const saved = localStorage.getItem('ib_current_view') as ViewType | null;
      if (saved && ['dashboard', 'mission', 'class', 'profiles', 'badges', 'settings'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.error(e);
    }
    return 'dashboard';
  });

  const [statsPeriod, setStatsPeriod] = useState<TimePeriod>(() => {
    try {
      const saved = localStorage.getItem('ib_stats_period') as TimePeriod | null;
      if (saved && ['day', 'week', 'month', '3months', '6months', '1year'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.error(e);
    }
    return '1year';
  });

  // 4. Dates
  const [todayStr, setTodayStr] = useState<string>(() => getLocalDateString());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ib_selected_date');
      if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) {
        return saved;
      }
    } catch (e) {
      console.error(e);
    }
    return getLocalDateString();
  });

  // 5. Checklist and memo initialized synchronously from submitted record OR draft
  const [selectedMissions, setSelectedMissions] = useState<LearnerProfileKey[]>(() => {
    try {
      const initDate = localStorage.getItem('ib_selected_date') || getLocalDateString();
      const storedHist = localStorage.getItem('ib_portfolio_history');
      if (storedHist) {
        const hist: DailyRecord[] = JSON.parse(storedHist);
        const rec = hist.find((r) => r.date === initDate);
        if (rec && rec.submitted) return recordToSelected(rec);
      }
      const rawDrafts = localStorage.getItem('ib_daily_drafts');
      if (rawDrafts) {
        const drafts = JSON.parse(rawDrafts);
        if (drafts[initDate] && Array.isArray(drafts[initDate].completed)) {
          return drafts[initDate].completed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [reflections, setReflections] = useState<Reflection[]>(() => {
    try {
      const initDate = localStorage.getItem('ib_selected_date') || getLocalDateString();
      const storedHist = localStorage.getItem('ib_portfolio_history');
      if (storedHist) {
        const hist: DailyRecord[] = JSON.parse(storedHist);
        const rec = hist.find((r) => r.date === initDate);
        if (rec && rec.submitted) return recordToReflections(rec);
      }
      const rawDrafts = localStorage.getItem('ib_daily_drafts');
      if (rawDrafts) {
        const drafts = JSON.parse(rawDrafts);
        return draftToReflections(drafts[initDate]);
      }
    } catch (e) {
      console.error(e);
    }
    return [emptyReflection()];
  });

  const [submittedToday, setSubmittedToday] = useState<boolean>(() => {
    try {
      const initDate = localStorage.getItem('ib_selected_date') || getLocalDateString();
      const storedHist = localStorage.getItem('ib_portfolio_history');
      if (storedHist) {
        const hist: DailyRecord[] = JSON.parse(storedHist);
        const rec = hist.find((r) => r.date === initDate);
        if (rec && rec.submitted) return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const [isEditingToday, setIsEditingToday] = useState(false);
  const [showCelebrateModal, setShowCelebrateModal] = useState(false);
  const [expandedProfileKey, setExpandedProfileKey] = useState<LearnerProfileKey | null>(null);

  // Calendar Modal States
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());

  // Sharing Mode States
  const [isShareMode, setIsShareMode] = useState(false);
  const [sharedUserInfo, setSharedUserInfo] = useState({
    name: '김현우',
    grade: '5',
    classroom: '3',
    school: 'IB World School'
  });

  // Badge Unlock States
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<BadgeStatus[]>([]);
  const [showBadgeUnlockModal, setShowBadgeUnlockModal] = useState(false);

  // Custom Assigned Missions per Date (when rerolled by user)
  const [customMissionsByDate, setCustomMissionsByDate] = useState<Record<string, Partial<Record<LearnerProfileKey, string>>>>(() => {
    try {
      const stored = localStorage.getItem('ib_custom_missions_by_date');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Daily Reroll Count per Date per Profile (Max 3 attempts per profile per day)
  const [rerollCountsByDate, setRerollCountsByDate] = useState<Record<string, Partial<Record<LearnerProfileKey, number>>>>(() => {
    try {
      const stored = localStorage.getItem('ib_reroll_counts_by_date');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Feedback animation state for recently rerolled card
  const [recentlyRerolledKey, setRecentlyRerolledKey] = useState<LearnerProfileKey | null>(null);
  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Real-time synchronization of today's date upon connection, tab focus, or midnight rollover
  useEffect(() => {
    const syncCurrentDate = () => {
      const current = getLocalDateString();
      setTodayStr((prevToday) => {
        if (prevToday !== current) {
          // If the user was on previous today, advance to new today
          setSelectedDate((prevSel) => (prevSel === prevToday ? current : prevSel));
          return current;
        }
        return prevToday;
      });
    };

    // Run immediately
    syncCurrentDate();

    window.addEventListener('focus', syncCurrentDate);
    document.addEventListener('visibilitychange', syncCurrentDate);
    const interval = setInterval(syncCurrentDate, 15000);

    return () => {
      window.removeEventListener('focus', syncCurrentDate);
      document.removeEventListener('visibilitychange', syncCurrentDate);
      clearInterval(interval);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  useEffect(() => {
    if (selectedDate) {
      const d = parseDateString(selectedDate);
      if (!isNaN(d.getTime())) {
        setCalendarViewYear(d.getFullYear());
        setCalendarViewMonth(d.getMonth());
      }
    }
  }, [selectedDate, isCalendarOpen]);

  // 학급 활동 횟수(승인된 쪽지·게시 글 수, 공동 목표 달성 참여): '우리 반 배지' 판정에 씀. 기기에 기억해 둠
  const [classSession, setClassSession] = useState<ClassSession | null>(loadClassSession);
  const [community, setCommunity] = useState<CommunityCounts>(() => {
    try {
      return { notes: 0, shares: 0, goal: false, ...JSON.parse(localStorage.getItem('ib_community') || '{}') };
    } catch {
      return { notes: 0, shares: 0, goal: false };
    }
  });
  const updateCommunity = (patch: Partial<CommunityCounts>) =>
    setCommunity((prev) => {
      const next = { ...prev, ...patch };
      if (JSON.stringify(next) === JSON.stringify(prev)) return prev;
      localStorage.setItem('ib_community', JSON.stringify(next));
      return next;
    });

  // 교사가 추가한 '우리 반 미션'을 오늘의 미션으로 고르기 (미션 바꾸기 횟수는 쓰지 않음)
  const handleSetClassMission = (profileKey: LearnerProfileKey, mission: string) => {
    if (isShareMode || (submittedToday && !isEditingToday)) return;
    const next = { ...customMissionsByDate, [selectedDate]: { ...(customMissionsByDate[selectedDate] || {}), [profileKey]: mission } };
    setCustomMissionsByDate(next);
    localStorage.setItem('ib_custom_missions_by_date', JSON.stringify(next));
  };

  // 배지 진행도와 획득 여부 (기록·미션 변경 내역이 바뀔 때마다 다시 계산)
  const badgeStatuses = useMemo(
    () => evaluateBadges(history, { customMissionsByDate, rerollCountsByDate, community: classSession ? community : undefined }),
    [history, customMissionsByDate, rerollCountsByDate, classSession, community]
  );
  const unlockedBadgeCount = badgeStatuses.filter((b) => b.unlocked).length;

  // Format selected date for display (e.g., 2026년 7월 14일 화요일)
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };
    const dateObj = parseDateString(selectedDate);
    return dateObj.toLocaleDateString('ko-KR', options);
  };

  // Date navigation handlers
  const handlePrevDate = () => {
    const cur = parseDateString(selectedDate);
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(getLocalDateString(cur));
    setCurrentView('mission');
  };

  const handleNextDate = () => {
    if (selectedDate >= todayStr) return;
    const cur = parseDateString(selectedDate);
    cur.setDate(cur.getDate() + 1);
    const nextStr = getLocalDateString(cur);
    if (nextStr <= todayStr) {
      setSelectedDate(nextStr);
      setCurrentView('mission');
    }
  };

  // Synchronize navigation & state selections to LocalStorage so they survive refresh
  useEffect(() => {
    try {
      localStorage.setItem('ib_current_view', currentView);
    } catch (e) {
      console.error(e);
    }
  }, [currentView]);

  useEffect(() => {
    try {
      localStorage.setItem('ib_selected_date', selectedDate);
    } catch (e) {
      console.error(e);
    }
  }, [selectedDate]);

  useEffect(() => {
    try {
      localStorage.setItem('ib_stats_period', statsPeriod);
    } catch (e) {
      console.error(e);
    }
  }, [statsPeriod]);

  useEffect(() => {
    try {
      localStorage.setItem('ib_user_info', JSON.stringify(userInfo));
    } catch (e) {
      console.error(e);
    }
  }, [userInfo]);

  // --- INITIALIZATION FOR URL SHARE MODE ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');

    if (shareParam) {
      try {
        const decoded = decodeURIComponent(atob(shareParam));
        const parsed = JSON.parse(decoded);
        if (parsed.u && parsed.stats) {
          setIsShareMode(true);
          setSharedUserInfo(parsed.u);
          setUserInfo(parsed.u);

          const dummyHistory = reconstructHistoryFromShared(parsed.stats);
          setHistory(dummyHistory);
          setSubmittedToday(true);
        }
      } catch (e) {
        console.error('공유 데이터를 해석하는데 실패했습니다.', e);
        alert('❌ 올바르지 않거나 손상된 공유 링크입니다. 일반 모드로 접속합니다.');
      }
    }
  }, []);

  // Listen for date or history changes, to sync checklist input states with the selected date's record or saved draft
  useEffect(() => {
    const record = history.find((r) => r.date === selectedDate);
    const drafts = getDailyDrafts();
    const draft = drafts[selectedDate];

    if (record && record.submitted) {
      setSubmittedToday(true);
      // If user was in edit mode and has draft edits, prioritize draft edits
      if (isEditingToday && draft) {
        setSelectedMissions(draft.completed || []);
        setReflections(draftToReflections(draft));
      } else {
        setSelectedMissions(recordToSelected(record));
        setReflections(recordToReflections(record));
        setIsEditingToday(false);
      }
    } else {
      setSubmittedToday(false);
      setIsEditingToday(false);
      // If not submitted yet, restore draft if user previously inputted selections or memo
      if (draft) {
        setSelectedMissions(draft.completed || []);
        setReflections(draftToReflections(draft));
      } else {
        setSelectedMissions([]);
        setReflections([emptyReflection()]);
      }
    }
  }, [selectedDate, history]);

  // --- ACTIONS ---
  // Reroll single profile mission for the selected date (max 3 times per profile per day)
  const handleRerollMission = (profileKey: LearnerProfileKey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isShareMode) return;
    if (submittedToday && !isEditingToday) {
      showToast('⚠️ 이미 제출된 기록에서는 미션을 변경할 수 없습니다. 수정을 원하시면 "기록 수정하기"를 눌러주세요.', 'warning');
      return;
    }

    const dateRerolls = rerollCountsByDate[selectedDate] || {};
    const currentCount = (typeof dateRerolls === 'object' ? (dateRerolls[profileKey] || 0) : 0);
    const prof = PROFILE_DATA.find((p) => p.key === profileKey);
    const profName = prof ? prof.name : '해당 영역';

    if (currentCount >= 3) {
      showToast(`⚠️ [${profName}] 실천 미션 바꾸기는 영역별로 하루 최대 3회까지만 가능합니다. (남은 기회: 0회)`, 'warning');
      return;
    }

    const currentMission = getMissionForDay(profileKey, selectedDate, customMissionsByDate[selectedDate]);
    const newMission = getRandomMission(profileKey, currentMission);

    const updatedDateMissions = {
      ...(customMissionsByDate[selectedDate] || {}),
      [profileKey]: newMission
    };
    const nextCustomMissions = {
      ...customMissionsByDate,
      [selectedDate]: updatedDateMissions
    };

    const nextRerollCounts = {
      ...rerollCountsByDate,
      [selectedDate]: {
        ...(typeof rerollCountsByDate[selectedDate] === 'object' ? rerollCountsByDate[selectedDate] : {}),
        [profileKey]: currentCount + 1
      }
    };

    setCustomMissionsByDate(nextCustomMissions);
    setRerollCountsByDate(nextRerollCounts);
    localStorage.setItem('ib_custom_missions_by_date', JSON.stringify(nextCustomMissions));
    localStorage.setItem('ib_reroll_counts_by_date', JSON.stringify(nextRerollCounts));

    setRecentlyRerolledKey(profileKey);
    setTimeout(() => setRecentlyRerolledKey(null), 1000);

    const remaining = 3 - (currentCount + 1);
    showToast(`✨ [${profName}] 새로운 실천 미션으로 변경되었습니다! (이 영역 남은 기회: ${remaining}회)`, 'success');
  };

  // Toggle mission selection with immediate draft persistence
  const handleToggleMission = (key: LearnerProfileKey) => {
    if (isShareMode) return; // Prevent modification in share mode
    if (submittedToday && !isEditingToday) return; // Prevent modification if submitted & not editing

    const updated = selectedMissions.includes(key)
      ? selectedMissions.filter((k) => k !== key)
      : [...selectedMissions, key];
    // 체크를 푼 미션을 고른 기록 줄은 미션을 다시 고르도록 비워 둔다
    const nextReflections = reflections.map((r) =>
      r.profileKey && !updated.includes(r.profileKey) ? { ...r, profileKey: null } : r
    );
    setSelectedMissions(updated);
    setReflections(nextReflections);
    saveDailyDraft(selectedDate, updated, nextReflections);
  };

  // --- 실천 기록(한 줄 기록) 입력 ---
  const canEditReflections = !isShareMode && !(submittedToday && !isEditingToday);

  const updateReflections = (next: Reflection[]) => {
    setReflections(next);
    saveDailyDraft(selectedDate, selectedMissions, next);
  };

  const handleReflectionChange = (index: number, patch: Partial<Reflection>) => {
    if (!canEditReflections) return;
    updateReflections(reflections.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const handleAddReflection = () => {
    if (!canEditReflections) return;
    updateReflections([...reflections, emptyReflection()]);
  };

  const handleRemoveReflection = (index: number) => {
    if (!canEditReflections || reflections.length <= 1) return;
    updateReflections(reflections.filter((_, i) => i !== index));
  };

  // 체크한 미션이 하나도 없는 날: 미션 선택 없이 성찰 한 줄만 쓰면 저장되고 '성찰하는 사람' +1
  const isReflectionOnlyMode = selectedMissions.length === 0;
  const countChars = (text: string) => text.replace(/\s/g, '').length;
  const filledReflections = reflections.filter((r) => r.text.trim().length > 0 || (!isReflectionOnlyMode && r.profileKey));

  // 제출을 막는 이유 (없으면 null)
  const reflectionError: string | null = (() => {
    if (filledReflections.length === 0) {
      return isReflectionOnlyMode
        ? '오늘 실천하지 못한 까닭이나 내일의 다짐을 한 줄 써 주세요.'
        : '체크한 미션 중 하나를 골라 실천한 내용을 한 줄 써 주세요.';
    }
    for (const r of filledReflections) {
      if (!isReflectionOnlyMode && !r.profileKey) return '어떤 미션에 대한 기록인지 골라 주세요.';
      if (countChars(r.text) < MIN_REFLECTION_LENGTH) return `실천 기록은 ${MIN_REFLECTION_LENGTH}글자 이상 써 주세요.`;
    }
    return null;
  })();

  // Submit daily checklist
  const handleSubmitDaily = (e: React.FormEvent) => {
    e.preventDefault();
    if (isShareMode) return;

    if (reflectionError) {
      showToast(`⚠️ ${reflectionError}`, 'warning');
      return;
    }

    const savedReflections: Reflection[] = filledReflections.map((r) => ({
      profileKey: isReflectionOnlyMode ? null : r.profileKey,
      text: r.text.trim()
    }));

    const newRecord: DailyRecord = {
      date: selectedDate,
      completed: isReflectionOnlyMode ? ['Reflective'] : selectedMissions,
      submitted: true,
      reflections: savedReflections,
      submittedAt: getLocalDateString(),
      ...(isReflectionOnlyMode ? { reflectionOnly: true } : {})
    };

    // Filter out existing record if any, and add the new one
    const updatedHistory = history.filter((r) => r.date !== selectedDate);
    const finalHistory = [...updatedHistory, newRecord];

    // 이번 제출로 새로 받은 배지 찾기
    const badgeCtx = { customMissionsByDate, rerollCountsByDate, community: classSession ? community : undefined };
    const previousUnlockedIds = new Set(evaluateBadges(history, badgeCtx).filter((b) => b.unlocked).map((b) => b.id));
    const newlyUnlocked = evaluateBadges(finalHistory, badgeCtx).filter((b) => b.unlocked && !previousUnlockedIds.has(b.id));

    localStorage.setItem('ib_portfolio_history', JSON.stringify(finalHistory));
    setHistory(finalHistory);
    setSubmittedToday(true);
    setIsEditingToday(false);
    clearDailyDraft(selectedDate); // Clear draft since formally submitted
    pushToClass([newRecord], classSession, history.find((r) => r.date === selectedDate && r.submitted));

    if (newlyUnlocked.length > 0) {
      setNewlyUnlockedBadges(newlyUnlocked);
      setShowBadgeUnlockModal(true);
    } else {
      // Trigger default daily celebration
      setShowCelebrateModal(true);
    }
  };

  // Enable editing today's submitted data
  const handleEnableEdit = () => {
    if (isShareMode) return;
    setIsEditingToday(true);
    saveDailyDraft(selectedDate, selectedMissions, reflections);
  };

  // Reset entire application data
  const handleResetData = () => {
    if (isShareMode || blockedWhileInClass()) return;
    if (confirm('정말로 모든 포트폴리오 데이터를 초기화하시겠습니까?\n초기화 후에는 모든 실천 기록이 지워지고 처음부터 기록을 시작하게 됩니다.')) {
      const emptyHistory: DailyRecord[] = [];
      localStorage.setItem('ib_portfolio_history', JSON.stringify(emptyHistory));
      localStorage.setItem('ib_has_reset', 'true');
      localStorage.removeItem('ib_daily_drafts');
      localStorage.removeItem('ib_custom_missions_by_date');
      localStorage.removeItem('ib_reroll_counts_by_date');
      setHistory(emptyHistory);
      setSelectedMissions([]);
      setReflections([emptyReflection()]);
      setSubmittedToday(false);
      setIsEditingToday(false);
      setCustomMissionsByDate({});
      setRerollCountsByDate({});
      alert('모든 실천 데이터가 초기화되었습니다. 이제 첫 도전을 시작해 보세요!');
    }
  };

  // Load 365-day sample demo data for preview
  const handleLoadSampleData = () => {
    if (isShareMode || blockedWhileInClass()) return;
    if (confirm('365일치 샘플 실천 데이터를 불러오시겠습니까?\n현재 저장된 실천 기록이 샘플 데이터로 대체됩니다.')) {
      const sample = generateMockHistory();
      localStorage.setItem('ib_portfolio_history', JSON.stringify(sample));
      localStorage.removeItem('ib_has_reset');
      localStorage.removeItem('ib_daily_drafts');
      setHistory(sample);
      showToast('✨ 365일치 샘플 실천 데이터가 로드되었습니다.', 'success');
    }
  };

  // Save profile settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (isShareMode) return;
    localStorage.setItem('ib_user_info', JSON.stringify(userInfo));
    alert('학적 정보가 저장되었습니다!');
  };

  // Share portfolio via Base64 encoded URL
  const handleSharePortfolio = () => {
    // Calculate cumulative stats for each profile key
    const profileTotals: Record<string, number> = {};
    PROFILE_DATA.forEach((p) => {
      profileTotals[p.key] = 0;
    });
    
    history.forEach((record) => {
      record.completed.forEach((key) => {
        if (profileTotals[key] !== undefined) {
          profileTotals[key] += 1;
        }
      });
    });

    const payload = {
      u: userInfo,
      stats: profileTotals
    };

    try {
      const jsonStr = JSON.stringify(payload);
      // UTF-8 safe base64 encoding
      const base64Str = btoa(encodeURIComponent(jsonStr));
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${base64Str}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('🎉 성장 포트폴리오를 친구들과 선생님, 부모님께 공유할 수 있는 링크가 복사되었습니다!\n원하는 곳에 붙여넣기(Ctrl+V) 하여 자랑해 보세요.');
      }).catch(() => {
        prompt('링크 복사에 실패했습니다. 아래 링크를 수동으로 복사해주세요:', shareUrl);
      });
    } catch (e) {
      alert('공유 링크 생성에 실패했습니다.');
    }
  };

  // Export portfolio history as JSON file download
  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(history, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'ib_portfolio_data.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      alert('백업 파일 생성 중 오류가 발생했습니다.');
    }
  };

  // Import, validate and restore portfolio history from JSON file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (blockedWhileInClass()) {
      e.target.value = '';
      return;
    }
    if (isShareMode) {
      alert('공유 모드에서는 데이터를 가져올 수 없습니다.');
      return;
    }

    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          
          if (!Array.isArray(parsed)) {
            throw new Error("올바른 백업 파일 형식이 아닙니다. (데이터는 배열 형태여야 합니다.)");
          }

          // Strict structural validation
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            
            // Validate date string
            if (typeof item.date !== 'string') {
              throw new Error(`인덱스 ${i}번 데이터의 날짜 규격(date)이 올바르지 않습니다.`);
            }
            
            // Validate completed array
            if (!Array.isArray(item.completed)) {
              throw new Error(`인덱스 ${i}번 데이터의 실천 목록(completed)이 올바르지 않습니다.`);
            }
            
            // Validate submission flag
            if (typeof item.submitted !== 'boolean') {
              throw new Error(`인덱스 ${i}번 데이터의 제출 여부(submitted) 정보가 누락되었습니다.`);
            }
          }

          // If validation passes, save and overwrite
          localStorage.setItem('ib_portfolio_history', JSON.stringify(parsed));
          setHistory(parsed);
          
          alert('🎉 성공적으로 포트폴리오 데이터를 복원했습니다!\n이제 새로 채워진 데이터를 종합 대시보드와 미션 탭에서 확인할 수 있습니다.');
        } catch (err: any) {
          alert(`❌ 데이터 복원 실패: ${err.message}\n올바르게 생성된 ib_portfolio_data.json 파일인지 확인 후 다시 시도해 주세요.`);
        }
      };
    }
  };


  // --- STATS COMPUTATION ---
  const stats = calculateStats(history, statsPeriod, parseDateString(todayStr));

  // Count total historical completed missions across all records
  const totalMissionsCount = history.reduce((sum, r) => sum + r.completed.length, 0);

  // =====================================================================
  // 학급 연결: 기록은 지금처럼 이 기기에 먼저 저장하고, 학급에 참여 중이면 서버에도 올림
  // =====================================================================
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle');

  const blockedWhileInClass = () => {
    if (!classSession) return false;
    showToast('⚠️ 학급에 참여 중일 때는 사용할 수 없어요. 학급에서 나간 뒤 다시 시도해 주세요.', 'warning');
    return true;
  };

  // 기기 기록 → 서버 기록 (그날 실천한 미션 문장과 바꾼 횟수를 함께 담음)
  const toCloudRecord = (r: DailyRecord): CloudRecord => {
    const missions: Partial<Record<LearnerProfileKey, string>> = {};
    if (!r.reflectionOnly) {
      r.completed.forEach((k) => {
        missions[k] = getMissionForDay(k, r.date, customMissionsByDate[r.date] as Record<string, string> | undefined);
      });
    }
    const rerolls = rerollCountsByDate[r.date];
    return { ...r, missions, ...(rerolls && Object.keys(rerolls).length ? { rerolls } : {}), updatedAt: Date.now() };
  };

  // 우리 반 정보: 학급 설정(중점 학습자상·공동 목표), 학급 합계, 선생님 피드백
  const [classData, setClassData] = useState<{ info: ClassInfo | null; stats: ClassPublicStats | null; feedback: FeedbackMap }>({
    info: null,
    stats: null,
    feedback: {}
  });
  const [classDataState, setClassDataState] = useState<'idle' | 'loading' | 'error'>('idle');

  const loadClassData = async (session: ClassSession | null = classSession, notify = false) => {
    if (!session) return;
    setClassDataState('loading');
    try {
      const backend = await getBackend();
      const [info, stats, feedback] = await Promise.all([
        backend.getClass(session.classId),
        backend.getClassStats(session.classId),
        backend.getFeedback(session.classId, session.sid)
      ]);
      setClassData({ info, stats, feedback });
      setClassDataState('idle');
      if (notify) {
        // 지난번 이후 새로 달린 선생님 피드백이 있으면 알려 줌
        const seen = Number(localStorage.getItem('ib_feedback_seen') || 0);
        const latest = Math.max(0, ...Object.values(feedback).map((f) => f.at || 0));
        if (latest > seen) {
          showToast('💌 선생님이 피드백을 남겼어요! ‘우리 반’에서 확인해 보세요.', 'info');
          localStorage.setItem('ib_feedback_seen', String(latest));
        }
      }
    } catch (e) {
      console.error('우리 반 정보 불러오기 실패', e);
      setClassDataState('error');
    }
  };

  const PENDING_KEY = 'ib_cloud_pending';
  const loadPending = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    } catch {
      return [];
    }
  };

  // 서버에 올리기. 실패하면 날짜를 적어 두었다가 다음에 다시 올림
  const pushToClass = async (
    records: DailyRecord[],
    session: ClassSession | null = classSession,
    previous?: DailyRecord,
    updateStats = true
  ): Promise<boolean> => {
    if (!session || records.length === 0) return true;
    const dates = records.map((r) => r.date);
    setSyncState('syncing');
    try {
      const backend = await getBackend();
      await backend.saveRecords(session.classId, session.sid, records.map(toCloudRecord));
      if (updateStats) {
        // 우리 반 합계에 이번 변화를 반영 (실패해도 기록 저장에는 영향 없음. 교사 화면이 열릴 때 다시 맞춰짐)
        backend
          .applyStatsDelta(session.classId, records.map((r) => recordDelta(records.length === 1 ? previous : undefined, r)))
          .then(() => loadClassData(session))
          .catch((e) => console.error('학급 합계 반영 실패', e));
      }
      localStorage.setItem(PENDING_KEY, JSON.stringify(loadPending().filter((d) => !dates.includes(d))));
      setSyncState('idle');
      return true;
    } catch (e) {
      console.error('학급 서버 저장 실패', e);
      localStorage.setItem(PENDING_KEY, JSON.stringify([...new Set([...loadPending(), ...dates])]));
      setSyncState('error');
      showToast('⚠️ 학급 서버에 저장하지 못했어요. 기록은 이 기기에 남아 있고, 다음에 다시 올릴게요.', 'warning');
      return false;
    }
  };

  // 서버 기록을 이 기기에 그대로 반영
  const applyCloudRecords = (records: CloudRecord[]) => {
    const nextCustom: Record<string, Partial<Record<LearnerProfileKey, string>>> = {};
    const nextRerolls: Record<string, Partial<Record<LearnerProfileKey, number>>> = {};
    const nextHistory: DailyRecord[] = records
      .map((rec) => {
        const { missions, rerolls, updatedAt, ...daily } = rec;
        void updatedAt;
        const changed = Object.entries(missions || {}).filter(
          ([k, text]) => text && text !== getDefaultMissionForDay(k as LearnerProfileKey, rec.date)
        );
        if (changed.length) nextCustom[rec.date] = Object.fromEntries(changed);
        if (rerolls) nextRerolls[rec.date] = rerolls;
        return daily as DailyRecord;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // 아직 제출하지 않은 날짜에서 바꿔 둔 미션은 그대로 둠
    const submittedDates = new Set(nextHistory.map((r) => r.date));
    Object.entries(customMissionsByDate).forEach(([d, v]) => {
      if (!submittedDates.has(d)) nextCustom[d] = v;
    });
    Object.entries(rerollCountsByDate).forEach(([d, v]) => {
      if (!submittedDates.has(d)) nextRerolls[d] = v;
    });

    localStorage.setItem('ib_portfolio_history', JSON.stringify(nextHistory));
    localStorage.setItem('ib_has_reset', 'true');
    localStorage.setItem('ib_custom_missions_by_date', JSON.stringify(nextCustom));
    localStorage.setItem('ib_reroll_counts_by_date', JSON.stringify(nextRerolls));
    setHistory(nextHistory);
    setCustomMissionsByDate(nextCustom);
    setRerollCountsByDate(nextRerolls);
  };

  // 학급 참여를 마무리 (설정 화면의 학급 참여 카드에서 호출)
  // - 'pull': 서버에 있는 기록을 이 기기로 가져옴
  // - 'push': 이 기기의 기록을 서버에 올림
  // - 'fresh': 빈 기록으로 새로 시작
  const connectClass = async (session: ClassSession, mode: 'pull' | 'push' | 'fresh', cloudRecords: CloudRecord[] = []) => {
    if (mode === 'pull') applyCloudRecords(cloudRecords);
    if (mode === 'fresh') applyCloudRecords([]);
    if (mode === 'push') {
      const ok = await pushToClass(history.filter((r) => r.submitted), session);
      if (!ok) throw new Error('이 기기의 기록을 학급에 올리지 못했어요. 잠시 후 다시 시도해 주세요.');
      localStorage.setItem('ib_has_reset', 'true');
    }
    saveClassSession(session);
    setClassSession(session);
    loadClassData(session);
    const nextUser = { ...userInfo, name: session.nickname, school: session.className };
    setUserInfo(nextUser);
    localStorage.setItem('ib_user_info', JSON.stringify(nextUser));
  };

  const disconnectClass = async () => {
    const session = classSession;
    saveClassSession(null);
    setClassSession(null);
    setClassData({ info: null, stats: null, feedback: {} });
    localStorage.removeItem(PENDING_KEY);
    setSyncState('idle');
    if (session) {
      try {
        await (await getBackend()).leaveClass(session.classId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 앱을 열 때: 못 올린 기록을 먼저 올리고, 서버 기록(다른 기기에서 쓴 것 포함)을 가져옴
  useEffect(() => {
    if (!classSession || isShareMode) return;
    let cancelled = false;
    (async () => {
      try {
        const pending = loadPending();
        if (pending.length > 0) {
          const ok = await pushToClass(history.filter((r) => pending.includes(r.date)), classSession, undefined, false);
          if (!ok) return;
        }
        const backend = await getBackend();
        setSyncState('syncing');
        const records = await backend.getPortfolio(classSession.classId, classSession.sid);
        if (cancelled) return;
        applyCloudRecords(records);
        setSyncState('idle');
        loadClassData(classSession, true);
      } catch (e) {
        console.error('학급 서버 동기화 실패', e);
        if (!cancelled) setSyncState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSession?.classId, classSession?.sid]);


  return {
    calendarViewMonth,
    calendarViewYear,
    currentView,
    customMissionsByDate,
    expandedProfileKey,
    badgeStatuses,
    classData,
    classDataState,
    handleSetClassMission,
    updateCommunity,
    classSession,
    connectClass,
    refreshClassData: () => loadClassData(),
    disconnectClass,
    syncState,
    unlockedBadgeCount,
    getFormattedDate,
    handleEnableEdit,
    handleExportData,
    handleImportData,
    handleLoadSampleData,
    handleReflectionChange,
    handleAddReflection,
    handleRemoveReflection,
    reflectionError,
    isReflectionOnlyMode,
    handleNextDate,
    handlePrevDate,
    handleRerollMission,
    handleResetData,
    handleSaveSettings,
    handleSharePortfolio,
    handleSubmitDaily,
    handleToggleMission,
    history,
    isCalendarOpen,
    isEditingToday,
    isShareMode,
    reflections,
    newlyUnlockedBadges,
    recentlyRerolledKey,
    rerollCountsByDate,
    selectedDate,
    selectedMissions,
    setCalendarViewMonth,
    setCalendarViewYear,
    setCurrentView,
    setCustomMissionsByDate,
    setExpandedProfileKey,
    setHistory,
    setIsCalendarOpen,
    setIsEditingToday,
    setIsShareMode,
    setReflections,
    setNewlyUnlockedBadges,
    setRecentlyRerolledKey,
    setRerollCountsByDate,
    setSelectedDate,
    setSelectedMissions,
    setSharedUserInfo,
    setShowBadgeUnlockModal,
    setShowCelebrateModal,
    setStatsPeriod,
    setSubmittedToday,
    setToastMessage,
    setTodayStr,
    setUserInfo,
    sharedUserInfo,
    showBadgeUnlockModal,
    showCelebrateModal,
    showToast,
    stats,
    statsPeriod,
    submittedToday,
    toastMessage,
    todayStr,
    totalMissionsCount,
    userInfo
  };
}

export type PortfolioContextValue = ReturnType<typeof usePortfolioState>;

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const value = usePortfolioState();
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio는 PortfolioProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
