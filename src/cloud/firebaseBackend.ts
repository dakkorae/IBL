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
  where,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { Entry, Post, Reaction, ClassInfo, ClassPublicStats, CloudBackend, CloudError, CloudRecord, FeedbackMap, InviteCode, JoinResult, Student } from './types';
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
    claimed: !!d.claimed
  });

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

    // ---------------- 교사 ----------------
    async createClass({ inviteCode, name, studentCount, password }) {
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
      const info = { name: name.trim(), inviteCode: code, createdAt: Date.now() };

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

      const numbers = Array.from({ length: studentCount }, (_, i) => i + 1);
      for (const part of chunk(numbers, 10)) {
        const b = writeBatch(db);
        part.forEach((n) => b.set(subDoc(classId, 'students', `s${n}`), { number: n, nickname: `${n}번`, claimed: false }));
        await b.commit();
      }
      return { id: classId, name: info.name, createdAt: info.createdAt };
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
    async addStudent(classId, number, nickname) {
      await uid();
      const sid = `s${number}`;
      const data = { number, nickname: nickname.trim() || `${number}번`, claimed: false };
      await setDoc(subDoc(classId, 'students', sid), data);
      return { id: sid, ...data };
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
      await setDoc(subDoc(classId, 'public', 'stats'), { ...clean(stats), updatedAt: Date.now() });
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
    async listPosts(classId) {
      await uid();
      return (await getDocs(sub(classId, 'posts'))).docs.map((d) => ({ id: d.id, ...d.data() }) as Post).sort((a, b) => b.createdAt - a.createdAt);
    },
    async reviewPost(classId, post, approve) {
      await uid();
      const batch = writeBatch(db);
      batch.update(subDoc(classId, 'posts', post.id), { status: approve ? 'approved' : 'rejected', reviewedAt: Date.now() });
      if (approve) {
        // 승인된 글은 학생들이 한 번에 읽는 문서(게시판 / 받는 학생의 쪽지함)에 옮겨 적음
        const { status, ...entry } = post;
        void status;
        if (post.type === 'share') batch.set(subDoc(classId, 'public', 'board'), { posts: { [post.id]: clean(entry) } }, { merge: true });
        else if (post.to) batch.set(subDoc(classId, 'inbox', post.to), { notes: { [post.id]: clean(entry) } }, { merge: true });
      }
      await batch.commit();
    },
    async removeFromBoard(classId, postId) {
      await uid();
      const batch = writeBatch(db);
      batch.set(subDoc(classId, 'public', 'board'), { posts: { [postId]: deleteField() } }, { merge: true });
      batch.update(subDoc(classId, 'posts', postId), { status: 'removed' });
      const reports = await getDocs(query(sub(classId, 'reports'), where('postId', '==', postId)));
      reports.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
    async listReports(classId) {
      await uid();
      return (await getDocs(sub(classId, 'reports'))).docs.map((d) => d.data() as { postId: string; sid: string });
    },
    async listReactions(classId) {
      await uid();
      return (await getDocs(sub(classId, 'reactions'))).docs.map((d) => d.data() as Reaction);
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
      refs.push(subDoc(classId, 'public', 'board'));
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
      return { id: cid, name: String(d.name || ''), createdAt: Number(d.createdAt) || 0, focus: d.focus || null, goal: d.goal || null, extraMissions: d.extraMissions || null } as ClassInfo;
    },
    async listStudents(classId) {
      await uid();
      const snap = await getDocs(sub(classId, 'students'));
      return snap.docs.map((d) => toStudent(d.id, d.data())).sort((a, b) => a.number - b.number);
    },

    // ---------------- 학생 ----------------
    async joinClass(classId, sid, pin): Promise<JoinResult> {
      const id = await uid();
      const student = await getDoc(subDoc(classId, 'students', sid));
      if (!student.exists()) return 'not-found';
      const hash = await pinHash(classId, sid, pin);
      try {
        if (!student.data().claimed) {
          // 처음 입장: 비밀번호를 정하고 이 기기를 그 번호의 주인으로 등록
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
      return { totals: d.totals || {}, records: d.records || 0, missions: d.missions || 0, days: d.days || {}, updatedAt: d.updatedAt } as ClassPublicStats;
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
    async createPost(classId, post) {
      await uid();
      const ref = doc(sub(classId, 'posts'));
      const data = { ...clean(post), status: 'pending' as const, createdAt: Date.now() };
      await setDoc(ref, data);
      return { id: ref.id, ...data } as Post;
    },
    async listMyPosts(classId, sid) {
      await uid();
      const snap = await getDocs(query(sub(classId, 'posts'), where('from', '==', sid)));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post).sort((a, b) => b.createdAt - a.createdAt);
    },
    async getBoard(classId) {
      await uid();
      const snap = await getDoc(subDoc(classId, 'public', 'board'));
      return (Object.values((snap.data() || {}).posts || {}) as Entry[]).sort((a, b) => b.createdAt - a.createdAt);
    },
    async getInbox(classId, sid) {
      await uid();
      const snap = await getDoc(subDoc(classId, 'inbox', sid));
      return (Object.values((snap.data() || {}).notes || {}) as Entry[]).sort((a, b) => b.createdAt - a.createdAt);
    },
    async getMyReactions(classId, sid) {
      await uid();
      const [mine, toMe] = await Promise.all([
        getDocs(query(sub(classId, 'reactions'), where('sid', '==', sid))),
        getDocs(query(sub(classId, 'reactions'), where('author', '==', sid)))
      ]);
      return { mine: mine.docs.map((d) => d.data() as Reaction), toMe: toMe.docs.map((d) => d.data() as Reaction) };
    },
    async setReaction(classId, r) {
      await uid();
      const ref = subDoc(classId, 'reactions', `${r.postId}_${r.sid}`);
      if (r.kind) await setDoc(ref, { postId: r.postId, sid: r.sid, author: r.author, kind: r.kind });
      else await deleteDoc(ref);
    },
    async reportPost(classId, postId, sid) {
      await uid();
      await setDoc(subDoc(classId, 'reports', `${postId}_${sid}`), { postId, sid, at: Date.now() });
    }
  };

  return backend;
}
