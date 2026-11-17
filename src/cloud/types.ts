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
  since?: string; // 정한 날짜
}

// 지난 활동 기록: 끝난 중점 학습자상·공동 목표, 지운 우리 반 미션 (교사 화면의 '지난 활동'에서 확인)
export interface ActivityLogItem {
  type: 'focus' | 'goal' | 'mission';
  profileKey: LearnerProfileKey | null;
  title: string; // 목표 이름 / 학생에게 한마디 / 미션 문장
  from?: string; // 시작한 날
  to: string; // 끝난 날
  target?: number; // 공동 목표의 목표 횟수
  done?: number; // 끝낼 때까지 실천한 횟수
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
  maxStudents?: number; // 참여할 수 있는 학생 수 (없으면 100명)
  focus?: ClassFocus | null;
  goal?: ClassGoal | null;
  extraMissions?: Partial<Record<LearnerProfileKey, string[]>> | null; // 교사가 추가한 우리 반 미션
  log?: ActivityLogItem[] | null; // 지난 활동 (최근 것이 앞)
}

// 학생들에게 보여 주는 학급 합계 (개인별 수치는 담지 않음)
export interface ClassPublicStats {
  totals: Partial<Record<LearnerProfileKey, number>>;
  records: number; // 제출된 기록 수
  missions: number; // 실천한 미션 수
  days: Record<string, { students: number; keys: Partial<Record<LearnerProfileKey, number>> }>;
  badges?: Record<string, string[]>; // 학생(sid)별로 받은 배지 ID → 화면에는 '우리 반에서 n명이 획득'처럼 인원수만 보여 줌
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

// 칭찬 게시판(praise)과 나눔 게시판(share)의 글. 비속어 검사를 통과하면 바로 게시되고, 교사가 내릴 수 있음
export type BoardKind = 'praise' | 'share';
export interface Entry {
  id: string;
  type: BoardKind;
  from: string; // 쓴 학생 sid
  fromName: string;
  toName?: string; // 칭찬 받는 사람 (학생이 직접 적은 이름이나 닉네임)
  profileKey: LearnerProfileKey | null;
  mission?: string; // 나눔 글: 그날 실천한 미션 문장
  src?: string; // 나눔 글: 어느 실천 기록에서 왔는지 ('날짜#번호'). 같은 기록을 두 번 올리지 않게 씀
  text: string;
  createdAt: number;
  likes?: string[]; // 좋아요를 누른 학생 sid 목록 (개수는 모두에게 보임)
}

// (예전 방식) 공감 스티커: 누가(sid) 어느 글(postId, 글쓴이 author)에 무엇(kind)을 눌렀는지
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
  claimed: boolean; // 비밀번호가 정해져 있는지 (교사가 초기화하면 false)
  nickAt?: number; // 학생이 닉네임을 마지막으로 바꾼 때 (한 달에 한 번만 바꿀 수 있음)
}

export const MAX_CLASS_STUDENTS = 100;
export const NICKNAME_MAX = 12;
export const NICK_CHANGE_DAYS = 30;

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
// 새로 등록: taken = 이미 있는 닉네임, full = 학급 정원이 다 참
export type RegisterResult = { result: 'ok'; student: Student } | { result: 'taken' | 'full' };
export type RenameResult = 'ok' | 'taken' | 'too-soon';

// 서버와 주고받는 모든 동작. 실제 서버(Firebase)와 체험용(이 브라우저 안에서만 동작) 두 가지 구현이 있음
export interface CloudBackend {
  readonly kind: 'firebase' | 'demo';

  // 관리자 (개설 코드 발급)
  adminLogin(key: string): Promise<boolean>;
  isAdmin(): Promise<boolean>;
  adminLogout(): Promise<void>; // 이 기기의 관리자 등록을 지움
  listInviteCodes(): Promise<InviteCode[]>;
  createInviteCode(maxClasses: number, memo: string): Promise<InviteCode>;
  setInviteActive(code: string, active: boolean): Promise<void>;
  // 코드와 함께 그 코드로 만든 학급(학생 기록·게시글 포함)을 모두 지움. 지운 학급 수를 돌려줌
  deleteInviteCode(code: string): Promise<number>;

  // 교사
  createClass(input: { inviteCode: string; name: string; maxStudents: number; password: string }): Promise<ClassInfo>;
  teacherLogin(classId: string, password: string): Promise<boolean>;
  isTeacher(classId: string): Promise<boolean>;
  teacherLogout(classIds: string[]): Promise<void>; // 이 기기의 교사 등록을 지움 (학급과 기록은 그대로)
  updateClassName(classId: string, name: string): Promise<void>;
  updateStudentNickname(classId: string, sid: string, nickname: string): Promise<void>;
  removeStudent(classId: string, sid: string): Promise<void>;
  resetPin(classId: string, sid: string): Promise<void>;
  listPortfolios(classId: string): Promise<Record<string, CloudRecord[]>>;
  updateClassActivity(classId: string, patch: Partial<Pick<ClassInfo, 'focus' | 'goal' | 'extraMissions' | 'log'>>): Promise<void>;
  removeEntry(classId: string, kind: BoardKind, postId: string): Promise<void>;
  listReports(classId: string): Promise<{ postId: string; sid: string }[]>;
  clearReports(classId: string, postId: string): Promise<void>;
  setClassStats(classId: string, stats: ClassPublicStats): Promise<void>;
  listFeedback(classId: string): Promise<Record<string, FeedbackMap>>;
  setFeedback(classId: string, sid: string, date: string, feedback: Feedback | null): Promise<void>;
  setFeedbackMany(classId: string, sids: string[], date: string, feedback: Feedback): Promise<void>;
  deleteClass(classId: string): Promise<void>;

  // 공통
  getClass(classId: string): Promise<ClassInfo | null>;
  listStudents(classId: string): Promise<Student[]>;

  // 학생
  // 처음 등록: 학생이 닉네임과 비밀번호를 스스로 정함
  registerStudent(classId: string, nickname: string, pin: string): Promise<RegisterResult>;
  // 다시 들어오기(다른 기기, 나갔다가 다시): 닉네임으로 찾은 sid와 비밀번호로 입장
  joinClass(classId: string, sid: string, pin: string): Promise<JoinResult>;
  getStudent(classId: string, sid: string): Promise<Student | null>;
  renameSelf(classId: string, sid: string, nickname: string): Promise<RenameResult>;
  leaveClass(classId: string): Promise<void>;
  getPortfolio(classId: string, sid: string): Promise<CloudRecord[]>;
  saveRecords(classId: string, sid: string, records: CloudRecord[]): Promise<void>;
  getClassStats(classId: string): Promise<ClassPublicStats | null>;
  applyStatsDelta(classId: string, deltas: StatsDelta[]): Promise<void>;
  getFeedback(classId: string, sid: string): Promise<FeedbackMap>;
  addEntry(classId: string, entry: Omit<Entry, 'id' | 'createdAt'>): Promise<Entry>;
  getBoard(classId: string, kind: BoardKind): Promise<Entry[]>;
  removeMyEntry(classId: string, kind: BoardKind, postId: string): Promise<void>;
  setLike(classId: string, kind: BoardKind, postId: string, sid: string, on: boolean): Promise<void>;
  setMyBadges(classId: string, sid: string, badgeIds: string[]): Promise<void>;
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
