import React, { createContext, useContext, useEffect, useState } from 'react';
import { LearnerProfileKey, DailyRecord, ViewType, TimePeriod, Badge, Reflection } from '../types';
import { PROFILE_DATA, generateMockHistory, calculateStats, getLocalDateString, parseDateString, getMissionForDay, getRandomMission, getBadgesList, reconstructHistoryFromShared } from '../data';
import { getDailyDrafts, saveDailyDraft, clearDailyDraft } from '../storage/drafts';

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
      if (saved && ['dashboard', 'mission', 'profiles', 'badges', 'settings'].includes(saved)) {
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
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<Badge[]>([]);
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

  // Helper to calculate badge progress
  const getBadgeProgress = (badge: Badge, records: DailyRecord[]): number => {
    if (badge.type === 'profile_count' && badge.profileKey) {
      return records.reduce((sum, r) => sum + (r.completed.includes(badge.profileKey!) ? 1 : 0), 0);
    }
    if (badge.type === 'total_days') {
      return records.filter((r) => r.submitted).length;
    }
    return 0;
  };

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
      ...(isReflectionOnlyMode ? { reflectionOnly: true } : {})
    };

    // Filter out existing record if any, and add the new one
    const updatedHistory = history.filter((r) => r.date !== selectedDate);
    const finalHistory = [...updatedHistory, newRecord];

    // Compute newly unlocked achievements before updating state
    const previousBadges = getBadgesList(history);
    const previousUnlockedIds = previousBadges
      .filter((b) => getBadgeProgress(b, history) >= b.requiredCount)
      .map((b) => b.id);

    const currentBadges = getBadgesList(finalHistory);
    const newlyUnlocked = currentBadges.filter((b) => {
      const isNowUnlocked = getBadgeProgress(b, finalHistory) >= b.requiredCount;
      const wasUnlockedBefore = previousUnlockedIds.includes(b.id);
      return isNowUnlocked && !wasUnlockedBefore;
    });

    localStorage.setItem('ib_portfolio_history', JSON.stringify(finalHistory));
    setHistory(finalHistory);
    setSubmittedToday(true);
    setIsEditingToday(false);
    clearDailyDraft(selectedDate); // Clear draft since formally submitted

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
    if (isShareMode) return;
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
    if (isShareMode) return;
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

  return {
    calendarViewMonth,
    calendarViewYear,
    currentView,
    customMissionsByDate,
    expandedProfileKey,
    getBadgeProgress,
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
