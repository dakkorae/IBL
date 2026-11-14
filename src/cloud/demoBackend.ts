import { ClassInfo, ClassPublicStats, CloudBackend, CloudError, CloudRecord, FeedbackMap, InviteCode, Student } from './types';
import { emptyStats } from './stats';
import { adminKeyHash, normalizeCode, pinHash, randomCode, teacherKeyHash } from './util';

// 체험용 서버: 실제 서버 없이 이 브라우저 안(localStorage)에서만 동작함
// - 서버 설정 전에 화면과 흐름을 미리 살펴보기 위한 것 (다른 기기와는 공유되지 않음)
// - 체험용 관리자 키: demo-admin / 체험용 개설 코드: DEMO-2026
interface DemoClass {
  info: ClassInfo;
  teacherHash: string;
  students: Record<string, Student>;
  pins: Record<string, string>;
  portfolios: Record<string, Record<string, CloudRecord>>;
  stats?: ClassPublicStats;
  feedback?: Record<string, FeedbackMap>;
}
interface DemoState {
  invites: Record<string, InviteCode>;
  classes: Record<string, DemoClass>;
  admin: boolean;
  teacherOf: string[];
  memberOf: Record<string, string>; // classId -> sid
}

const KEY = 'ib_demo_cloud';
export const DEMO_ADMIN_KEY = 'demo-admin';
export const DEMO_INVITE_CODE = 'DEMO-2026';

const load = (): DemoState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // 저장소를 못 읽으면 새로 시작
  }
  return {
    invites: {
      [DEMO_INVITE_CODE]: { code: DEMO_INVITE_CODE, maxClasses: 5, usedCount: 0, active: true, memo: '체험용 코드', createdAt: Date.now() }
    },
    classes: {},
    admin: false,
    teacherOf: [],
    memberOf: {}
  };
};
const save = (s: DemoState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 저장 실패는 무시 (체험용)
  }
};
const wait = () => new Promise((r) => setTimeout(r, 120));

export function createDemoBackend(): CloudBackend {
  const need = (s: DemoState, classId: string) => {
    const c = s.classes[classId];
    if (!c) throw new CloudError('not-found', '학급을 찾을 수 없어요.');
    return c;
  };
  const needTeacher = (s: DemoState, classId: string) => {
    if (!s.teacherOf.includes(classId)) throw new CloudError('permission', '교사 권한이 없어요.');
    return need(s, classId);
  };

  return {
    kind: 'demo',

    async adminLogin(key) {
      await wait();
      const ok = (await adminKeyHash(key)) === (await adminKeyHash(DEMO_ADMIN_KEY));
      if (ok) {
        const s = load();
        s.admin = true;
        save(s);
      }
      return ok;
    },
    async isAdmin() {
      return load().admin;
    },
    async listInviteCodes() {
      await wait();
      return Object.values(load().invites).sort((a, b) => b.createdAt - a.createdAt);
    },
    async createInviteCode(maxClasses, memo) {
      await wait();
      const s = load();
      const code = `${randomCode(4)}-${randomCode(4)}`;
      s.invites[code] = { code, maxClasses, usedCount: 0, active: true, memo, createdAt: Date.now() };
      save(s);
      return s.invites[code];
    },
    async setInviteActive(code, active) {
      const s = load();
      if (s.invites[code]) s.invites[code].active = active;
      save(s);
    },

    async createClass({ inviteCode, name, studentCount, password }) {
      await wait();
      const s = load();
      const inv = s.invites[inviteCode.trim().toUpperCase()];
      if (!inv || !inv.active || inv.usedCount >= inv.maxClasses) {
        throw new CloudError('invalid-invite', '개설 코드가 올바르지 않거나 이미 모두 사용되었어요.');
      }
      const id = randomCode(6);
      const students: Record<string, Student> = {};
      for (let n = 1; n <= studentCount; n++) students[`s${n}`] = { id: `s${n}`, number: n, nickname: `${n}번`, claimed: false };
      const info = { id, name: name.trim(), createdAt: Date.now() };
      s.classes[id] = { info, teacherHash: await teacherKeyHash(id, password), students, pins: {}, portfolios: {} };
      s.teacherOf.push(id);
      inv.usedCount += 1;
      save(s);
      return info;
    },
    async teacherLogin(classId, password) {
      await wait();
      const s = load();
      const c = s.classes[classId];
      if (!c || c.teacherHash !== (await teacherKeyHash(classId, password))) return false;
      if (!s.teacherOf.includes(classId)) s.teacherOf.push(classId);
      save(s);
      return true;
    },
    async isTeacher(classId) {
      const s = load();
      return s.teacherOf.includes(classId) && !!s.classes[classId];
    },
    async updateClassName(classId, name) {
      const s = load();
      needTeacher(s, classId).info.name = name.trim();
      save(s);
    },
    async addStudent(classId, number, nickname) {
      const s = load();
      const c = needTeacher(s, classId);
      const st = { id: `s${number}`, number, nickname: nickname.trim() || `${number}번`, claimed: false };
      c.students[st.id] = st;
      save(s);
      return st;
    },
    async updateStudentNickname(classId, sid, nickname) {
      const s = load();
      const c = needTeacher(s, classId);
      if (c.students[sid]) c.students[sid].nickname = nickname.trim();
      save(s);
    },
    async removeStudent(classId, sid) {
      const s = load();
      const c = needTeacher(s, classId);
      delete c.students[sid];
      delete c.pins[sid];
      delete c.portfolios[sid];
      if (c.feedback) delete c.feedback[sid];
      save(s);
    },
    async resetPin(classId, sid) {
      const s = load();
      const c = needTeacher(s, classId);
      delete c.pins[sid];
      if (c.students[sid]) c.students[sid].claimed = false;
      if (s.memberOf[classId] === sid) delete s.memberOf[classId];
      save(s);
    },
    async listPortfolios(classId) {
      await wait();
      const c = needTeacher(load(), classId);
      const out: Record<string, CloudRecord[]> = {};
      Object.entries(c.portfolios).forEach(([sid, recs]) => {
        out[sid] = Object.values(recs).sort((a, b) => a.date.localeCompare(b.date));
      });
      return out;
    },
    async updateClassActivity(classId, patch) {
      const s = load();
      Object.assign(needTeacher(s, classId).info, patch);
      save(s);
    },
    async setClassStats(classId, stats) {
      const s = load();
      needTeacher(s, classId).stats = { ...stats, updatedAt: Date.now() };
      save(s);
    },
    async listFeedback(classId) {
      return needTeacher(load(), classId).feedback || {};
    },
    async setFeedback(classId, sid, date, feedback) {
      const s = load();
      const c = needTeacher(s, classId);
      c.feedback = c.feedback || {};
      c.feedback[sid] = c.feedback[sid] || {};
      if (feedback) c.feedback[sid][date] = feedback;
      else delete c.feedback[sid][date];
      save(s);
    },
    async deleteClass(classId) {
      await wait();
      const s = load();
      needTeacher(s, classId);
      delete s.classes[classId];
      s.teacherOf = s.teacherOf.filter((id) => id !== classId);
      delete s.memberOf[classId];
      save(s);
    },

    async getClass(classId) {
      await wait();
      return load().classes[normalizeCode(classId)]?.info || null;
    },
    async listStudents(classId) {
      const c = need(load(), classId);
      return Object.values(c.students).sort((a, b) => a.number - b.number);
    },

    async joinClass(classId, sid, pin) {
      await wait();
      const s = load();
      const c = s.classes[classId];
      if (!c || !c.students[sid]) return 'not-found';
      const hash = await pinHash(classId, sid, pin);
      if (!c.pins[sid]) {
        c.pins[sid] = hash;
        c.students[sid].claimed = true;
      } else if (c.pins[sid] !== hash) {
        return 'wrong-pin';
      }
      s.memberOf[classId] = sid;
      save(s);
      return 'ok';
    },
    async leaveClass(classId) {
      const s = load();
      delete s.memberOf[classId];
      save(s);
    },
    async getPortfolio(classId, sid) {
      await wait();
      const s = load();
      if (s.memberOf[classId] !== sid && !s.teacherOf.includes(classId)) throw new CloudError('permission', '권한이 없어요.');
      return Object.values(need(s, classId).portfolios[sid] || {}).sort((a, b) => a.date.localeCompare(b.date));
    },
    async saveRecords(classId, sid, records) {
      const s = load();
      if (s.memberOf[classId] !== sid) throw new CloudError('permission', '권한이 없어요.');
      const c = need(s, classId);
      c.portfolios[sid] = c.portfolios[sid] || {};
      records.forEach((r) => (c.portfolios[sid][r.date] = r));
      save(s);
    },
    async getClassStats(classId) {
      await wait();
      const s = load();
      if (!(classId in s.memberOf) && !s.teacherOf.includes(classId)) throw new CloudError('permission', '권한이 없어요.');
      return need(s, classId).stats || null;
    },
    async applyStatsDelta(classId, deltas) {
      const s = load();
      const c = need(s, classId);
      const st = (c.stats = c.stats || emptyStats());
      deltas.forEach((d) => {
        const day = (st.days[d.date] = st.days[d.date] || { students: 0, keys: {} });
        day.students += d.students;
        st.records += d.students;
        st.missions += d.missions;
        Object.entries(d.keys).forEach(([k, n]) => {
          const key = k as keyof typeof st.totals;
          day.keys[key] = (day.keys[key] || 0) + (n || 0);
          st.totals[key] = (st.totals[key] || 0) + (n || 0);
        });
      });
      save(s);
    },
    async getFeedback(classId, sid) {
      const s = load();
      if (s.memberOf[classId] !== sid && !s.teacherOf.includes(classId)) throw new CloudError('permission', '권한이 없어요.');
      return need(s, classId).feedback?.[sid] || {};
    }
  };
}
