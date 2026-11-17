import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  FieldPath,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  query,
  serverTimestamp,
  where,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { BoardKind, Entry, ClassInfo, ClassPublicStats, CloudBackend, CloudError, CloudRecord, FeedbackMap, InviteCode, JoinResult, MAX_CLASS_STUDENTS, NICK_CHANGE_DAYS, RegisterResult, RenameResult, Student } from './types';
import { adminKeyHash, chunk, clean, normalizeCode, pinHash, randomCode, teacherKeyHash } from './util';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

const isDenied = (e: unknown) => (e as { code?: string })?.code === 'permission-denied';

// Firebase(Firestore + 익명 로그인)를 쓰는 실제 서버 구현
// - 이메일·이름 없이 기기마다 익명 ID만 발급받음
// - 누가 무엇을 읽고 쓸 수 있는지는 저장소 최상위의 firestore.rules가 서버에서 검사함
export function createFirebaseBackend(config: FirebaseConfig): CloudBackend {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let signIn: Promise<string> | null = null;
  const uid = () => {
    if (!signIn) {
      signIn = auth
        .authStateReady()
        .then(() => (auth.currentUser ? auth.currentUser : signInAnonymously(auth).then((c) => c.user)))
        .then((u) => u.uid)
        .catch((e) => {
          signIn = null;
          throw new CloudError('network', `서버에 연결하지 못했어요. (${(e as Error).message})`);
        });
    }
    return signIn;
  };

  const classRef = (cid: string) => doc(db, 'classes', cid);
  const sub = (cid: string, name: string) => collection(db, 'classes', cid, name);
  const subDoc = (cid: string, name: string, id: string) => doc(db, 'classes', cid, name, id);

  const toStudent = (id: string, d: Record<string, unknown>): Student => ({
    id,
    number: Number(d.number) || 0,
    nickname: String(d.nickname || ''),
    claimed: !!d.claimed,
    ...(d.nickAt ? { nickAt: typeof (d.nickAt as { toMillis?: () => number }).toMillis === 'function' ? (d.nickAt as { toMillis: () => number }).toMillis() : Number(d.nickAt) } : {})
  });
  // 게시판 문서: 칭찬 게시판은 public/praise, 나눔 게시판은 public/board (학생이 문서 하나만 읽으면 되도록 모아 둠)
  const boardRef = (cid: string, kind: BoardKind) => subDoc(cid, 'public', kind === 'praise' ? 'praise' : 'board');
  // 교사가 만들어 둔 빈 자리(예전 방식의 "3번")인지
  const isPlaceholder = (s: Student) => !s.claimed && s.nickname === `${s.number}번`;

  const backend: CloudBackend = {
    kind: 'firebase',

    // ---------------- 관리자 ----------------
    async adminLogin(key) {
      const id = await uid();
      try {
        await setDoc(doc(db, 'admins', id), { keyHash: await adminKeyHash(key) });
        return true;
      } catch (e) {
        if (isDenied(e)) return false;
        throw e;
      }
    },
    async isAdmin() {
      const id = await uid();
      return (await getDoc(doc(db, 'admins', id))).exists();
    },
    async listInviteCodes() {
      await uid();
      const snap = await getDocs(collection(db, 'inviteCodes'));
      return snap.docs
        .map((d) => ({ code: d.id, ...(d.data() as Omit<InviteCode, 'code'>) }))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    async createInviteCode(maxClasses, memo) {
      await uid();
      const code = `${randomCode(4)}-${randomCode(4)}`;
      const data = { maxClasses, usedCount: 0, active: true, memo, createdAt: Date.now() };
      await setDoc(doc(db, 'inviteCodes', code), data);
      return { code, ...data };
    },
    async setInviteActive(code, active) {
      await uid();
      await updateDoc(doc(db, 'inviteCodes', code), { active });
    },
    async deleteInviteCode(code) {
      await uid();
      await deleteDoc(doc(db, 'inviteCodes', code));
    },

    // ---------------- 교사 ----------------
    async createClass({ inviteCode, name, maxStudents, password }) {
      const id = await uid();
      const code = inviteCode.trim().toUpperCase();
      const inviteRef = doc(db, 'inviteCodes', code);
      const invite = code ? await getDoc(inviteRef) : null;
      const inv = invite?.data();
      if (!inv || !inv.active || inv.usedCount >= inv.maxClasses) {
        throw new CloudError('invalid-invite', '개설 코드가 올바르지 않거나 이미 모두 사용되었어요.');
      }

      let classId = randomCode(6);
      while ((await getDoc(classRef(classId))).exists()) classId = randomCode(6);
      const keyHash = await teacherKeyHash(classId, password);
      const max = Math.min(MAX_CLASS_STUDENTS, Math.max(1, Math.round(maxStudents) || MAX_CLASS_STUDENTS));
      const info = { name: name.trim(), inviteCode: code, createdAt: Date.now(), maxStudents: max };

      // 학급 문서 + 교사 비밀번호 + 이 기기를 교사로 등록 + 개설 코드 사용 횟수 올리기를 한 번에 처리
      const batch = writeBatch(db);
      batch.set(classRef(classId), info);
      batch.set(subDoc(classId, 'secrets', 'teacher'), { keyHash });
      batch.set(subDoc(classId, 'teachers', id), { keyHash });
      batch.update(inviteRef, { usedCount: inv.usedCount + 1 });
      try {
        await batch.commit();
      } catch (e) {
        if (isDenied(e)) throw new CloudError('invalid-invite', '개설 코드를 확인하지 못했어요. 다시 시도해 주세요.');
        throw e;
      }

      return { id: classId, name: info.name, createdAt: info.createdAt, maxStudents: max };
    },

    async teacherLogin(classId, password) {
      const id = await uid();
      try {
        await setDoc(subDoc(classId, 'teachers', id), { keyHash: await teacherKeyHash(classId, password) });
        return true;
      } catch (e) {
        if (isDenied(e)) return false;
        throw e;
      }
    },
    async isTeacher(classId) {
      const id = await uid();
      return (await getDoc(subDoc(classId, 'teachers', id))).exists();
    },
    async updateClassName(classId, name) {
      await uid();
      await updateDoc(classRef(classId), { name: name.trim() });
    },
    async updateStudentNickname(classId, sid, nickname) {
      await uid();
      await updateDoc(subDoc(classId, 'students', sid), { nickname: nickname.trim() });
    },
    async removeStudent(classId, sid) {
      await uid();
      const batch = writeBatch(db);
      batch.delete(subDoc(classId, 'portfolios', sid));
      batch.delete(subDoc(classId, 'feedback', sid));
      batch.delete(subDoc(classId, 'pins', sid));
      batch.delete(subDoc(classId, 'students', sid));
      await batch.commit();
    },
    async resetPin(classId, sid) {
      await uid();
      const batch = writeBatch(db);
      batch.delete(subDoc(classId, 'pins', sid));
      batch.update(subDoc(classId, 'students', sid), { claimed: false });
      await batch.commit();
    },
    async listPortfolios(classId) {
      await uid();
      const snap = await getDocs(sub(classId, 'portfolios'));
      const out: Record<string, CloudRecord[]> = {};
      snap.docs.forEach((d) => {
        const records = (d.data().records || {}) as Record<string, CloudRecord>;
        out[d.id] = Object.values(records).sort((a, b) => a.date.localeCompare(b.date));
      });
      return out;
    },
    async updateClassActivity(classId, patch) {
      await uid();
      await updateDoc(classRef(classId), clean(patch));
    },
    async setClassStats(classId, stats) {
      await uid();
      // 합계 칸만 통째로 바꿈 (학생들이 적어 둔 배지 현황 badges 는 그대로 둠)
      const ref = subDoc(classId, 'public', 'stats');
      const data = { totals: clean(stats.totals), records: stats.records, missions: stats.missions, days: clean(stats.days), updatedAt: Date.now() };
      if ((await getDoc(ref)).exists()) await updateDoc(ref, data);
      else await setDoc(ref, data);
    },
    async listFeedback(classId) {
      await uid();
      const snap = await getDocs(sub(classId, 'feedback'));
      const out: Record<string, FeedbackMap> = {};
      snap.docs.forEach((d) => (out[d.id] = (d.data().items || {}) as FeedbackMap));
      return out;
    },
    async setFeedback(classId, sid, date, feedback) {
      await uid();
      await setDoc(subDoc(classId, 'feedback', sid), { items: { [date]: feedback ? clean(feedback) : deleteField() } }, { merge: true });
    },
    async setFeedbackMany(classId, sids, date, feedback) {
      await uid();
      for (const part of chunk(sids, 50)) {
        const batch = writeBatch(db);
        part.forEach((sid) => batch.set(subDoc(classId, 'feedback', sid), { items: { [date]: clean(feedback) } }, { merge: true }));
        await batch.commit();
      }
    },
    async clearReports(classId, postId) {
      await uid();
      const reports = await getDocs(query(sub(classId, 'reports'), where('postId', '==', postId)));
      if (reports.empty) return;
      const batch = writeBatch(db);
      reports.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
    async removeEntry(classId, kind, postId) {
      await uid();
      const batch = writeBatch(db);
      batch.set(boardRef(classId, kind), { posts: { [postId]: deleteField() }, likes: { [postId]: deleteField() } }, { merge: true });
      const reports = await getDocs(query(sub(classId, 'reports'), where('postId', '==', postId)));
      reports.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
    async listReports(classId) {
      await uid();
      return (await getDocs(sub(classId, 'reports'))).docs.map((d) => d.data() as { postId: string; sid: string });
    },
    async deleteClass(classId) {
      const id = await uid();
      // 하위 문서를 모두 지운 뒤 학급 문서를 지우고, 마지막에 교사 등록을 지움
      const students = await getDocs(sub(classId, 'students'));
      const refs = students.docs.flatMap((d) => [
        subDoc(classId, 'portfolios', d.id),
        subDoc(classId, 'feedback', d.id),
        subDoc(classId, 'pins', d.id),
        subDoc(classId, 'students', d.id)
      ]);
      for (const name of ['posts', 'reactions', 'reports']) (await getDocs(sub(classId, name))).docs.forEach((d) => refs.push(d.ref));
      students.docs.forEach((d) => refs.push(subDoc(classId, 'inbox', d.id)));
      refs.push(subDoc(classId, 'public', 'board'), subDoc(classId, 'public', 'praise'));
      const members = await getDocs(sub(classId, 'members'));
      members.docs.forEach((d) => refs.push(d.ref));
      const teachers = await getDocs(sub(classId, 'teachers'));
      teachers.docs.filter((d) => d.id !== id).forEach((d) => refs.push(d.ref));
      refs.push(subDoc(classId, 'public', 'stats'), subDoc(classId, 'secrets', 'teacher'), classRef(classId));
      for (const part of chunk(refs, 10)) {
        const b = writeBatch(db);
        part.forEach((r) => b.delete(r));
        await b.commit();
      }
      await deleteDoc(subDoc(classId, 'teachers', id));
    },

    // ---------------- 공통 ----------------
    async getClass(classId) {
      await uid();
      const cid = normalizeCode(classId);
      if (!cid) return null;
      const snap = await getDoc(classRef(cid));
      if (!snap.exists()) return null;
      const d = snap.data();
      return { id: cid, name: String(d.name || ''), createdAt: Number(d.createdAt) || 0, maxStudents: Number(d.maxStudents) || MAX_CLASS_STUDENTS, focus: d.focus || null, goal: d.goal || null, extraMissions: d.extraMissions || null, log: d.log || null } as ClassInfo;
    },
    async listStudents(classId) {
      await uid();
      const snap = await getDocs(sub(classId, 'students'));
      return snap.docs.map((d) => toStudent(d.id, d.data())).sort((a, b) => a.number - b.number);
    },

    // ---------------- 학생 ----------------
    async registerStudent(classId, nickname, pin): Promise<RegisterResult> {
      const id = await uid();
      const nick = nickname.trim();
      const cls = await getDoc(classRef(classId));
      if (!cls.exists()) throw new CloudError('not-found', '학급을 찾을 수 없어요.');
      const max = Math.min(MAX_CLASS_STUDENTS, Number(cls.data().maxStudents) || MAX_CLASS_STUDENTS);
      // 다른 친구가 같은 순간에 같은 자리를 잡으면 서버가 거절하므로, 그때는 다음 빈 자리로 다시 시도
      for (let attempt = 0; attempt < 3; attempt++) {
        const list = await backend.listStudents(classId);
        if (list.some((s) => !isPlaceholder(s) && s.nickname === nick)) return { result: 'taken' };
        const byNumber = new Map(list.map((s) => [s.number, s]));
        let number = 0;
        for (let n = 1; n <= max; n++) {
          const cur = byNumber.get(n);
          if (!cur || isPlaceholder(cur)) {
            number = n;
            break;
          }
        }
        if (!number) return { result: 'full' };
        const sid = `s${number}`;
        const hash = await pinHash(classId, sid, pin);
        const batch = writeBatch(db);
        batch.set(subDoc(classId, 'pins', sid), { pinHash: hash });
        batch.set(subDoc(classId, 'members', id), { sid, pinHash: hash });
        if (byNumber.has(number)) batch.update(subDoc(classId, 'students', sid), { nickname: nick, claimed: true });
        else batch.set(subDoc(classId, 'students', sid), { number, nickname: nick, claimed: true });
        try {
          await batch.commit();
          return { result: 'ok', student: { id: sid, number, nickname: nick, claimed: true } };
        } catch (e) {
          if (!isDenied(e)) throw e;
        }
      }
      throw new CloudError('unknown', '등록하지 못했어요. 잠시 후 다시 시도해 주세요.');
    },
    async getStudent(classId, sid) {
      await uid();
      const snap = await getDoc(subDoc(classId, 'students', sid));
      return snap.exists() ? toStudent(snap.id, snap.data()) : null;
    },
    async renameSelf(classId, sid, nickname): Promise<RenameResult> {
      await uid();
      const nick = nickname.trim();
      const same = await getDocs(query(sub(classId, 'students'), where('nickname', '==', nick)));
      if (same.docs.some((d) => d.id !== sid)) return 'taken';
      const me = await backend.getStudent(classId, sid);
      if (me?.nickAt && Date.now() - me.nickAt < NICK_CHANGE_DAYS * 86400000) return 'too-soon';
      try {
        // 바꾼 때는 서버 시계로 적음 (한 달에 한 번 제한은 보안 규칙이 검사)
        await updateDoc(subDoc(classId, 'students', sid), { nickname: nick, nickAt: serverTimestamp() });
        return 'ok';
      } catch (e) {
        if (isDenied(e)) return 'too-soon';
        throw e;
      }
    },
    async joinClass(classId, sid, pin): Promise<JoinResult> {
      const id = await uid();
      const student = await getDoc(subDoc(classId, 'students', sid));
      if (!student.exists()) return 'not-found';
      const hash = await pinHash(classId, sid, pin);
      try {
        if (!student.data().claimed) {
          // 비밀번호가 초기화된 뒤 다시 입장: 새 비밀번호를 정하고 이 기기를 등록
          const batch = writeBatch(db);
          batch.set(subDoc(classId, 'pins', sid), { pinHash: hash });
          batch.set(subDoc(classId, 'members', id), { sid, pinHash: hash });
          batch.update(subDoc(classId, 'students', sid), { claimed: true });
          await batch.commit();
        } else {
          await setDoc(subDoc(classId, 'members', id), { sid, pinHash: hash });
        }
        return 'ok';
      } catch (e) {
        if (isDenied(e)) return 'wrong-pin';
        throw e;
      }
    },
    async leaveClass(classId) {
      const id = await uid();
      await deleteDoc(subDoc(classId, 'members', id));
    },
    async getPortfolio(classId, sid) {
      await uid();
      const snap = await getDoc(subDoc(classId, 'portfolios', sid));
      const records = ((snap.data() || {}).records || {}) as Record<string, CloudRecord>;
      return Object.values(records).sort((a, b) => a.date.localeCompare(b.date));
    },
    async saveRecords(classId, sid, records) {
      await uid();
      if (records.length === 0) return;
      const ref = subDoc(classId, 'portfolios', sid);
      const exists = (await getDoc(ref)).exists();
      if (!exists) {
        await setDoc(ref, { records: Object.fromEntries(records.map((r) => [r.date, clean(r)])), updatedAt: Date.now() });
        return;
      }
      // 날짜별 칸만 통째로 바꿔 끼움 (다른 날짜의 기록은 건드리지 않음)
      for (const part of chunk(records, 100)) {
        const args: unknown[] = [];
        part.forEach((r) => args.push(new FieldPath('records', r.date), clean(r)));
        const [firstPath, firstValue, ...rest] = [...args, 'updatedAt', Date.now()];
        await updateDoc(ref, firstPath as FieldPath, firstValue, ...rest);
      }
    },
    async getClassStats(classId) {
      await uid();
      const snap = await getDoc(subDoc(classId, 'public', 'stats'));
      if (!snap.exists()) return null;
      const d = snap.data();
      return { totals: d.totals || {}, records: d.records || 0, missions: d.missions || 0, days: d.days || {}, badges: d.badges || {}, updatedAt: d.updatedAt } as ClassPublicStats;
    },
    async applyStatsDelta(classId, deltas) {
      await uid();
      // 합계 문서의 해당 칸에만 더하기·빼기 (다른 학생의 변화와 겹쳐도 안전)
      const totals: Record<string, unknown> = {};
      const days: Record<string, unknown> = {};
      let records = 0;
      let missions = 0;
      const sum: Record<string, number> = {};
      deltas.forEach((d) => {
        const keys: Record<string, unknown> = {};
        Object.entries(d.keys).forEach(([k, n]) => {
          if (!n) return;
          keys[k] = increment(n);
          sum[k] = (sum[k] || 0) + n;
        });
        // 주의: merge 저장에서 빈 객체는 그 칸을 통째로 비우므로, 바뀐 것이 있을 때만 담는다
        const day = { ...(d.students ? { students: increment(d.students) } : {}), ...(Object.keys(keys).length ? { keys } : {}) };
        if (Object.keys(day).length) days[d.date] = day;
        records += d.students;
        missions += d.missions;
      });
      Object.entries(sum).forEach(([k, n]) => n && (totals[k] = increment(n)));
      await setDoc(
        subDoc(classId, 'public', 'stats'),
        {
          ...(Object.keys(totals).length ? { totals } : {}),
          ...(Object.keys(days).length ? { days } : {}),
          records: increment(records),
          missions: increment(missions),
          updatedAt: Date.now()
        },
        { merge: true }
      );
    },
    async getFeedback(classId, sid) {
      await uid();
      const snap = await getDoc(subDoc(classId, 'feedback', sid));
      return ((snap.data() || {}).items || {}) as FeedbackMap;
    },
    async addEntry(classId, entry) {
      await uid();
      const id = doc(sub(classId, 'reports')).id; // 겹치지 않는 새 ID만 빌려 씀
      const full = { ...clean(entry), id, createdAt: Date.now() } as Entry;
      // last: 방금 넣은 글의 ID. 보안 규칙이 "자기 글 하나만 더했는지" 검사하는 데 씀
      await setDoc(boardRef(classId, entry.type), { posts: { [id]: full }, last: id }, { merge: true });
      return full;
    },
    async getBoard(classId, kind) {
      await uid();
      const snap = await getDoc(boardRef(classId, kind));
      const likes = ((snap.data() || {}).likes || {}) as Record<string, Record<string, boolean>>;
      return (Object.values((snap.data() || {}).posts || {}) as Entry[])
        .map((e) => ({ ...e, type: kind, likes: Object.keys(likes[e.id] || {}) }))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    async setLike(classId, kind, postId, sid, on) {
      await uid();
      // liked: 방금 누른 글의 ID. 보안 규칙이 "그 글에서 자기 좋아요만 바꿨는지" 검사하는 데 씀
      await setDoc(boardRef(classId, kind), { likes: { [postId]: { [sid]: on ? true : deleteField() } }, liked: postId }, { merge: true });
    },
    async setMyBadges(classId, sid, badgeIds) {
      await uid();
      await setDoc(subDoc(classId, 'public', 'stats'), { badges: { [sid]: badgeIds } }, { merge: true });
    },
    async reportPost(classId, postId, sid) {
      await uid();
      await setDoc(subDoc(classId, 'reports', `${postId}_${sid}`), { postId, sid, at: Date.now() });
    }
  };

  return backend;
}
