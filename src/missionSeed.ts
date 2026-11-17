import { DailyRecord, LearnerProfileKey } from './types';
import { getDefaultMissionForDay, setMissionSeed } from './data';
import { ClassSession } from './cloud/types';
import { loadClassSession } from './cloud';

// 학생마다 다른 오늘의 미션
// - 미션은 "날짜 + 학습자상 + 학생마다 다른 씨앗값"으로 100가지 중 하나가 정해짐
// - 씨앗값: 학급에 참여했으면 학급코드+내 자리 번호(어느 기기에서 열어도 같은 미션), 아니면 이 기기에서 한 번 만든 임의의 값
// - 씨앗값이 바뀌는 순간(학급 참여·나가기, 예전 버전에서 넘어올 때)에는 이미 기록했거나 쓰고 있던 날의 미션을 그대로 적어 두어 바뀌지 않게 함

type CustomMissions = Record<string, Partial<Record<LearnerProfileKey, string>>>;
const SEED_KEY = 'ib_mission_seed';

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

function deviceSeed(): string {
  let seed = '';
  try {
    seed = localStorage.getItem(SEED_KEY) || '';
    if (!seed) {
      seed = Array.from(crypto.getRandomValues(new Uint32Array(2)), (n) => n.toString(36)).join('');
      localStorage.setItem(SEED_KEY, seed);
    }
  } catch {
    seed = seed || 'device';
  }
  return seed;
}

export const seedFor = (session: ClassSession | null) => (session ? `${session.classId}:${session.sid}` : deviceSeed());

// 지금 씨앗값으로 정해져 있는 미션을, 기록한 날과 쓰고 있던 날에 한해 그대로 적어 둠 (이미 적혀 있는 것은 건드리지 않음)
export function freezeMissions(history: DailyRecord[], custom: CustomMissions): CustomMissions {
  const next: CustomMissions = { ...custom };
  const keep = (date: string, keys: LearnerProfileKey[]) => {
    keys.forEach((k) => {
      if (next[date]?.[k]) return;
      next[date] = { ...(next[date] || {}), [k]: getDefaultMissionForDay(k, date) };
    });
  };
  history.filter((r) => r.submitted && !r.reflectionOnly).forEach((r) => keep(r.date, r.completed || []));
  const drafts = readJson<Record<string, { completed?: LearnerProfileKey[] }>>('ib_daily_drafts', {});
  Object.entries(drafts).forEach(([date, d]) => keep(date, d?.completed || []));
  return next;
}

// 앱이 켜질 때 한 번: 씨앗값을 정함. 예전 버전(모두 같은 미션)에서 처음 넘어올 때는 지난 기록의 미션을 먼저 적어 둠
export function prepareMissionSeed() {
  try {
    if (!localStorage.getItem(SEED_KEY)) {
      const history = readJson<DailyRecord[] | null>('ib_portfolio_history', null);
      if (Array.isArray(history) && history.length > 0) {
        setMissionSeed(''); // 예전 방식
        const frozen = freezeMissions(history, readJson<CustomMissions>('ib_custom_missions_by_date', {}));
        localStorage.setItem('ib_custom_missions_by_date', JSON.stringify(frozen));
      }
    }
  } catch (e) {
    console.error('미션 정리 실패', e);
  }
  setMissionSeed(seedFor(loadClassSession()));
}
