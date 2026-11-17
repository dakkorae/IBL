// 보안 규칙(firestore.rules) 자동 시험. 실행 방법은 CLAUDE.md 의 "확인 방법" 참고 (Firestore 에뮬레이터 필요)
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, deleteField, getDocs, collection, query, where } from 'firebase/firestore';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId: 'demo-test', firestore: { rules: fs.readFileSync(process.env.RULES || 'firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 } });
await env.clearFirestore();
let pass = 0, fail = 0;
const t = async (name, p) => { try { await p; pass++; } catch (e) { fail++; console.log('✗', name, '-', String(e.message).split('\n')[0].slice(0, 160)); } };
const ok = (n, p) => t(n, assertSucceeds(p));
const no = (n, p) => t(n + ' (막혀야 함)', assertFails(p));
await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'config/admin'), { keyHash: 'ADMIN' });
  await setDoc(doc(db, 'inviteCodes/CODE'), { active: true, usedCount: 0, maxClasses: 5, memo: '', createdAt: 1 });
  await setDoc(doc(db, 'inviteCodes/OLD'), { active: false, usedCount: 0, maxClasses: 5, memo: '', createdAt: 1 });
});
const T = env.authenticatedContext('teacher').firestore();
const A = env.authenticatedContext('devA').firestore();
const B = env.authenticatedContext('devB').firestore();
const C = env.authenticatedContext('devC').firestore();
const X = env.authenticatedContext('outsider').firestore();
const AD = env.authenticatedContext('admin').firestore();
const c = (db, p) => doc(db, 'classes/C1' + (p ? '/' + p : ''));

// 1. 학급 개설
{ const b = writeBatch(T);
  b.set(c(T), { name: '5-3', inviteCode: 'CODE', createdAt: 1, maxStudents: 2 });
  b.set(c(T, 'secrets/teacher'), { keyHash: 'TK' });
  b.set(c(T, 'teachers/teacher'), { keyHash: 'TK' });
  b.update(doc(T, 'inviteCodes/CODE'), { usedCount: 1 });
  await ok('학급 개설', b.commit()); }
{ const b = writeBatch(X);
  b.set(doc(X, 'classes/C9'), { name: 'x', inviteCode: 'CODE', createdAt: 1, maxStudents: 101 });
  b.set(doc(X, 'classes/C9/secrets/teacher'), { keyHash: 'K' });
  b.set(doc(X, 'classes/C9/teachers/outsider'), { keyHash: 'K' });
  b.update(doc(X, 'inviteCodes/CODE'), { usedCount: 2 });
  await no('정원 101명 학급 개설', b.commit()); }

// 2. 학생 등록
const reg = (db, uid, n, nick, pin, extra = {}) => { const b = writeBatch(db);
  b.set(c(db, 'pins/s' + n), { pinHash: pin });
  b.set(c(db, 'members/' + uid), { sid: 's' + n, pinHash: pin });
  b.set(c(db, 'students/s' + n), { number: n, nickname: nick, claimed: true, ...extra });
  return b.commit(); };
await ok('A 등록(s1)', reg(A, 'devA', 1, '햇살', 'PA'));
await no('B가 s1 자리 빼앗기', reg(B, 'devB', 1, '구름', 'PB'));
await no('B가 정원 밖 s3 등록', reg(B, 'devB', 3, '구름', 'PB'));
await no('13글자 닉네임', reg(B, 'devB', 2, '가나다라마바사아자차카타파', 'PB'));
await ok('B 등록(s2)', reg(B, 'devB', 2, '구름', 'PB'));
await ok('명단 읽기', getDocs(collection(X, 'classes/C1/students')));
await ok('본인 학생 문서 읽기', getDoc(c(A, 'students/s1')));

// 3. 닉네임 바꾸기
await ok('A 닉네임 변경 1회', updateDoc(c(A, 'students/s1'), { nickname: '햇님', nickAt: serverTimestamp() }));
await no('A 닉네임 바로 또 변경', updateDoc(c(A, 'students/s1'), { nickname: '달님', nickAt: serverTimestamp() }));
await no('B가 A 닉네임 변경', updateDoc(c(B, 'students/s1'), { nickname: '바보', nickAt: serverTimestamp() }));
await no('B가 nickAt 없이 변경', updateDoc(c(B, 'students/s2'), { nickname: '새구름' }));
await ok('교사가 닉네임 변경', updateDoc(c(T, 'students/s1'), { nickname: '햇살반장' }));
await ok('교사가 또 변경', updateDoc(c(T, 'students/s1'), { nickname: '햇살' }));

// 4. 기록·합계
await ok('B 기록 저장', setDoc(c(B, 'portfolios/s2'), { records: {}, updatedAt: 1 }));
await no('B가 s1 기록에 쓰기', setDoc(c(B, 'portfolios/s1'), { records: {}, updatedAt: 1 }));
await ok('배지 현황 적기', setDoc(c(B, 'public/stats'), { badges: { s2: ['a', 'b'] } }, { merge: true }));
await ok('교사 합계 갱신', updateDoc(c(T, 'public/stats'), { totals: {}, records: 0, missions: 0, days: {}, updatedAt: 2 }));
await no('외부인이 합계 읽기', getDoc(c(X, 'public/stats')));

// 5. 게시판
const entry = (id, from, extra = {}) => ({ id, type: 'praise', from, fromName: '구름', toName: '지우', profileKey: 'Caring', text: '멋졌어!', createdAt: 5, ...extra });
await no('B가 남의 이름(s1)으로 글', setDoc(c(B, 'public/praise'), { posts: { p0: entry('p0', 's1') }, last: 'p0' }, { merge: true }));
await ok('B 첫 글(문서 생성)', setDoc(c(B, 'public/praise'), { posts: { p1: entry('p1', 's2') }, last: 'p1' }, { merge: true }));
await ok('A 글 추가', setDoc(c(A, 'public/praise'), { posts: { p2: entry('p2', 's1') }, last: 'p2' }, { merge: true }));
await no('B가 A 글 고치기', setDoc(c(B, 'public/praise'), { posts: { p2: entry('p2', 's2') }, last: 'p2' }, { merge: true }));
await no('B가 A 글 지우기', setDoc(c(B, 'public/praise'), { posts: { p2: deleteField() }, last: 'p2' }, { merge: true }));
await no('B가 글 두 개 한꺼번에', setDoc(c(B, 'public/praise'), { posts: { p3: entry('p3', 's2'), p4: entry('p4', 's2') }, last: 'p3' }, { merge: true }));
await no('300자 넘는 글', setDoc(c(B, 'public/praise'), { posts: { p5: entry('p5', 's2', { text: 'x'.repeat(301) }) }, last: 'p5' }, { merge: true }));
await no('외부인 글쓰기', setDoc(c(X, 'public/praise'), { posts: { p6: entry('p6', 's2') }, last: 'p6' }, { merge: true }));
await no('외부인 읽기', getDoc(c(X, 'public/praise')));
await ok('학생 읽기', getDoc(c(A, 'public/praise')));
await ok('나눔 게시판 첫 글', setDoc(c(A, 'public/board'), { posts: { q1: entry('q1', 's1', { type: 'share' }) }, last: 'q1' }, { merge: true }));

// 6. 좋아요
const like = (db, pid, sid, v) => setDoc(c(db, 'public/praise'), { likes: { [pid]: { [sid]: v } }, liked: pid }, { merge: true });
await ok('A가 p1 좋아요', like(A, 'p1', 's1', true));
await ok('B가 p2 좋아요', like(B, 'p2', 's2', true));
await ok('B가 p1도 좋아요', like(B, 'p1', 's2', true));
await no('B가 A 이름으로 좋아요', like(B, 'p2', 's1', true));
await no('B가 A 좋아요 지우기', like(B, 'p1', 's1', deleteField()));
await no('없는 글에 좋아요', like(B, 'zz', 's2', true));
await no('좋아요에 이상한 값', like(B, 'p2', 's2', 5));
await ok('A 좋아요 취소', like(A, 'p1', 's1', deleteField()));
await ok('A 다시 좋아요', like(A, 'p1', 's1', true));
await no('좋아요인 척 글 고치기', setDoc(c(B, 'public/praise'), { likes: { p1: { s2: true } }, liked: 'p1', posts: { p2: entry('p2', 's2') } }, { merge: true }));
await ok('좋아요 뒤에도 글 추가 가능', setDoc(c(B, 'public/praise'), { posts: { p7: entry('p7', 's2') }, last: 'p7' }, { merge: true }));
{ const d = (await getDoc(c(A, 'public/praise'))).data(); if (Object.keys(d.posts).length !== 3 || Object.keys(d.likes.p1).length !== 2) { fail++; console.log('✗ 게시판 내용이 예상과 다름', JSON.stringify(d)); } else pass++; }

// 6-2. 내 글 지우기
const removeMine = (db, pid, extra = {}) => setDoc(c(db, 'public/praise'), { posts: { [pid]: deleteField() }, likes: { [pid]: deleteField() }, removed: pid, ...extra }, { merge: true });
await ok('B 지울 글 추가', setDoc(c(B, 'public/praise'), { posts: { p8: entry('p8', 's2') }, last: 'p8' }, { merge: true }));
await ok('A가 p8 좋아요', like(A, 'p8', 's1', true));
await no('A가 B 글 지우기', removeMine(A, 'p8'));
await no('B가 지우는 척 A 글 지우기', setDoc(c(B, 'public/praise'), { posts: { p2: deleteField() }, likes: { p2: deleteField() }, removed: 'p8' }, { merge: true }));
await no('B가 지우면서 다른 글 고치기', setDoc(c(B, 'public/praise'), { posts: { p8: deleteField(), p2: entry('p2', 's2') }, likes: { p8: deleteField() }, removed: 'p8' }, { merge: true }));
await ok('B가 자기 글 p8 지우기', removeMine(B, 'p8'));
await ok('좋아요 없는 나눔 글 q1 지우기', setDoc(c(A, 'public/board'), { posts: { q1: deleteField() }, likes: { q1: deleteField() }, removed: 'q1' }, { merge: true }));
{ const d = (await getDoc(c(A, 'public/praise'))).data(); if (d.posts.p8 || (d.likes || {}).p8 || Object.keys(d.posts).length !== 3) { fail++; console.log('✗ 내 글 지운 뒤 내용이 예상과 다름', JSON.stringify(d)); } else pass++; }
await ok('지운 뒤에도 글 추가 가능', setDoc(c(A, 'public/board'), { posts: { q2: entry('q2', 's1', { type: 'share' }) }, last: 'q2' }, { merge: true }));

// 7. 신고·교사 관리
await ok('신고', setDoc(c(A, 'reports/p7_s1'), { postId: 'p7', sid: 's1', at: 1 }));
await no('학생이 신고 목록 읽기', getDocs(collection(A, 'classes/C1/reports')));
await ok('교사 신고 목록', getDocs(collection(T, 'classes/C1/reports')));
await ok('교사 글 내리기', setDoc(c(T, 'public/praise'), { posts: { p7: deleteField() }, likes: { p7: deleteField() } }, { merge: true }));
await ok('교사 신고 지우기', deleteDoc(c(T, 'reports/p7_s1')));
await ok('교사 활동·지난 활동 저장', updateDoc(c(T), { focus: { key: 'Caring', note: '', since: '2026-11-17' }, log: [{ type: 'goal', profileKey: null, title: 'x', to: '2026-11-17' }] }));
await no('학생이 학급 설정 변경', updateDoc(c(A), { name: '해킹' }));
await no('교사가 정원 몰래 변경', updateDoc(c(T), { inviteCode: 'ZZ' }));
{ const b = writeBatch(T); ['s1', 's2'].forEach((s) => b.set(c(T, 'feedback/' + s), { items: { '2026-11-17': { stamp: '👍', text: '', at: 1 } } }, { merge: true })); await ok('교사 일괄 피드백', b.commit()); }
await ok('A 자기 피드백 읽기', getDoc(c(A, 'feedback/s1')));
await no('A가 B 피드백 읽기', getDoc(c(A, 'feedback/s2')));

// 8. 비밀번호 초기화 → 다른 기기에서 다시 들어오기
{ const b = writeBatch(T); b.delete(c(T, 'pins/s1')); b.update(c(T, 'students/s1'), { claimed: false }); await ok('교사 비밀번호 초기화', b.commit()); }
await no('초기화 뒤 옛 기기 A는 기록 못 읽음', getDoc(c(A, 'portfolios/s1')));
{ const b = writeBatch(C); b.set(c(C, 'pins/s1'), { pinHash: 'NEW' }); b.set(c(C, 'members/devC'), { sid: 's1', pinHash: 'NEW' }); b.update(c(C, 'students/s1'), { claimed: true }); await ok('C가 새 비밀번호로 s1 입장', b.commit()); }
await no('틀린 비밀번호로 s2 입장', setDoc(c(X, 'members/outsider'), { sid: 's2', pinHash: 'WRONG' }));
await ok('맞는 비밀번호로 s2 다른 기기 입장', setDoc(c(X, 'members/outsider'), { sid: 's2', pinHash: 'PB' }));
await ok('교사 학생 삭제', (() => { const b = writeBatch(T); ['portfolios', 'feedback', 'pins', 'students'].forEach((n) => b.delete(c(T, n + '/s2'))); return b.commit(); })());
await ok('빈 자리 s2에 새 학생 등록', reg(B, 'devB', 2, '새친구', 'PB2'));

// 9. 관리자
await no('틀린 관리자 키', setDoc(doc(X, 'admins/outsider'), { keyHash: 'NOPE' }));
await ok('관리자 로그인', setDoc(doc(AD, 'admins/admin'), { keyHash: 'ADMIN' }));
await ok('관리자 코드 삭제', deleteDoc(doc(AD, 'inviteCodes/OLD')));
// 관리자가 코드를 지우면서 그 코드로 만든 학급을 통째로 지움
await no('관리자가 학생 기록 읽기', getDoc(c(AD, 'portfolios/s1')));
await no('관리자가 게시판 읽기', getDoc(c(AD, 'public/praise')));
await no('일반인이 학급 목록 조회', getDocs(query(collection(X, 'classes'), where('inviteCode', '==', 'CODE'))));
await no('일반인이 학급 지우기', deleteDoc(c(X)));
await ok('관리자 학급 찾기', getDocs(query(collection(AD, 'classes'), where('inviteCode', '==', 'CODE'))));
await ok('관리자 명단·기기·신고 목록', Promise.all(['students', 'members', 'teachers', 'reports', 'reactions', 'posts'].map((n) => getDocs(collection(AD, 'classes/C1/' + n)))));
{ const b = writeBatch(AD);
  ['portfolios/s1', 'feedback/s1', 'pins/s1', 'students/s1', 'inbox/s1', 'public/board', 'public/praise', 'public/stats', 'members/devC', 'teachers/teacher', 'secrets/teacher'].forEach((n) => b.delete(c(AD, n)));
  b.delete(c(AD));
  await ok('관리자 학급 통째로 삭제', b.commit()); }
await no('일반인이 코드 삭제', deleteDoc(doc(X, 'inviteCodes/CODE')));

console.log(`통과 ${pass} / 실패 ${fail}`);
await env.cleanup();
process.exit(fail ? 1 : 0);
