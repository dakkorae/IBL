import { DailyRecord, LearnerProfileKey } from '../types';

// 서버에 저장되는 하루 기록: 기기 기록(DailyRecord)에 그날 실천한 미션 문장과 바꾼 횟수를 덧붙임
export interface CloudRecord extends DailyRecord {
  missions?: Partial<Record<LearnerProfileKey, string>>; // 실천한 미션 문장
  rerolls?: Partial<Record<LearnerProfileKey, number>>; // 미션 바꾸기 횟수
  updatedAt: number;
}

// 이번 주 중점 학습자상
export interface ClassFocus {
  key: LearnerProfileKey;
  note: string;
}

// 학급 공동 목표: startDate부터 학급 전체가 target번 실천하기 (profileKey가 null이면 모든 학습자상)
export interface ClassGoal {
  title: string;
  profileKey: LearnerProfileKey | null;
  target: number;
  startDate: string;
}

export interface ClassInfo {
  id: string; // 학급 코드
  name: string;
  createdAt: number;
  focus?: ClassFocus | null;
  goal?: ClassGoal | null;
  extraMissions?: Partial<Record<LearnerProfileKey, string[]>> | null; // 교사가 추가한 우리 반 미션
}

// 학생들에게 보여 주는 학급 합계 (개인별 수치는 담지 않음)
export interface ClassPublicStats {
  totals: Partial<Record<LearnerProfileKey, number>>;
  records: number; // 제출된 기록 수
  missions: number; // 실천한 미션 수
  days: Record<string, { students: number; keys: Partial<Record<LearnerProfileKey, number>> }>;
  updatedAt?: number;
}

// 합계에 더하거나 뺄 변화량 (학생이 기록을 제출·수정할 때)
export interface StatsDelta {
  date: string;
  students: number;
  missions: number;
  keys: Partial<Record<LearnerProfileKey, number>>;
}

// 교사가 학생 기록에 남기는 피드백 (도장 + 한 줄)
export interface Feedback {
  stamp: string;
  text: string;
  at: number;
}
export type FeedbackMap = Record<string, Feedback>; // 날짜 → 피드백

// 칭찬 쪽지(note)와 나눔 게시판 글(share). 학생이 쓰면 '대기' 상태가 되고 교사가 승인해야 전달·게시됨
export type PostStatus = 'pending' | 'approved' | 'rejected' | 'removed';
export interface Post {
  id: string;
  type: 'note' | 'share';
  from: string; // 쓴 학생 sid
  fromName: string;
  to?: string; // 쪽지를 받는 학생 sid
  toName?: string;
  profileKey: LearnerProfileKey | null;
  text: string;
  status: PostStatus;
  createdAt: number;
}
// 승인되어 게시판·받은 쪽지함에 올라간 글
export type Entry = Omit<Post, 'status'>;

// 공감 스티커: 누가(sid) 어느 글(postId, 글쓴이 author)에 무엇(kind)을 눌렀는지
export type ReactionKind = 'clap' | 'try' | 'thanks';
export interface Reaction {
  postId: string;
  sid: string;
  author: string;
  kind: ReactionKind;
}

export interface Student {
  id: string;
  number: number;
  nickname: string;
  claimed: boolean; // 학생이 비밀번호를 정하고 입장했는지
}

export interface InviteCode {
  code: string;
  maxClasses: number;
  usedCount: number;
  active: boolean;
  memo: string;
  createdAt: number;
}

// 학생 기기에 저장되는 학급 참여 정보
export interface ClassSession {
  classId: string;
  className: string;
  sid: string;
  number: number;
  nickname: string;
}

export type JoinResult = 'ok' | 'wrong-pin' | 'not-found';

// 서버와 주고받는 모든 동작. 실제 서버(Firebase)와 체험용(이 브라우저 안에서만 동작) 두 가지 구현이 있음
export interface CloudBackend {
  readonly kind: 'firebase' | 'demo';

  // 관리자 (개설 코드 발급)
  adminLogin(key: string): Promise<boolean>;
  isAdmin(): Promise<boolean>;
  listInviteCodes(): Promise<InviteCode[]>;
  createInviteCode(maxClasses: number, memo: string): Promise<InviteCode>;
  setInviteActive(code: string, active: boolean): Promise<void>;

  // 교사
  createClass(input: { inviteCode: string; name: string; studentCount: number; password: string }): Promise<ClassInfo>;
  teacherLogin(classId: string, password: string): Promise<boolean>;
  isTeacher(classId: string): Promise<boolean>;
  updateClassName(classId: string, name: string): Promise<void>;
  addStudent(classId: string, number: number, nickname: string): Promise<Student>;
  updateStudentNickname(classId: string, sid: string, nickname: string): Promise<void>;
  removeStudent(classId: string, sid: string): Promise<void>;
  resetPin(classId: string, sid: string): Promise<void>;
  listPortfolios(classId: string): Promise<Record<string, CloudRecord[]>>;
  updateClassActivity(classId: string, patch: Partial<Pick<ClassInfo, 'focus' | 'goal' | 'extraMissions'>>): Promise<void>;
  listPosts(classId: string): Promise<Post[]>;
  reviewPost(classId: string, post: Post, approve: boolean): Promise<void>;
  removeFromBoard(classId: string, postId: string): Promise<void>;
  listReports(classId: string): Promise<{ postId: string; sid: string }[]>;
  listReactions(classId: string): Promise<Reaction[]>;
  setClassStats(classId: string, stats: ClassPublicStats): Promise<void>;
  listFeedback(classId: string): Promise<Record<string, FeedbackMap>>;
  setFeedback(classId: string, sid: string, date: string, feedback: Feedback | null): Promise<void>;
  deleteClass(classId: string): Promise<void>;

  // 공통
  getClass(classId: string): Promise<ClassInfo | null>;
  listStudents(classId: string): Promise<Student[]>;

  // 학생
  joinClass(classId: string, sid: string, pin: string): Promise<JoinResult>;
  leaveClass(classId: string): Promise<void>;
  getPortfolio(classId: string, sid: string): Promise<CloudRecord[]>;
  saveRecords(classId: string, sid: string, records: CloudRecord[]): Promise<void>;
  getClassStats(classId: string): Promise<ClassPublicStats | null>;
  applyStatsDelta(classId: string, deltas: StatsDelta[]): Promise<void>;
  getFeedback(classId: string, sid: string): Promise<FeedbackMap>;
  createPost(classId: string, post: Omit<Post, 'id' | 'status' | 'createdAt'>): Promise<Post>;
  listMyPosts(classId: string, sid: string): Promise<Post[]>;
  getBoard(classId: string): Promise<Entry[]>;
  getInbox(classId: string, sid: string): Promise<Entry[]>;
  // mine: 내가 누른 스티커, toMe: 내 글이 받은 스티커
  getMyReactions(classId: string, sid: string): Promise<{ mine: Reaction[]; toMe: Reaction[] }>;
  setReaction(classId: string, reaction: Omit<Reaction, 'kind'> & { kind: ReactionKind | null }): Promise<void>;
  reportPost(classId: string, postId: string, sid: string): Promise<void>;
}

export class CloudError extends Error {
  constructor(
    public code: 'invalid-invite' | 'permission' | 'network' | 'not-found' | 'unknown',
    message: string
  ) {
    super(message);
  }
}
