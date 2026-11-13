import { DailyRecord, LearnerProfileKey } from '../types';

// 서버에 저장되는 하루 기록: 기기 기록(DailyRecord)에 그날 실천한 미션 문장과 바꾼 횟수를 덧붙임
export interface CloudRecord extends DailyRecord {
  missions?: Partial<Record<LearnerProfileKey, string>>; // 실천한 미션 문장
  rerolls?: Partial<Record<LearnerProfileKey, number>>; // 미션 바꾸기 횟수
  updatedAt: number;
}

export interface ClassInfo {
  id: string; // 학급 코드
  name: string;
  createdAt: number;
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
  deleteClass(classId: string): Promise<void>;

  // 공통
  getClass(classId: string): Promise<ClassInfo | null>;
  listStudents(classId: string): Promise<Student[]>;

  // 학생
  joinClass(classId: string, sid: string, pin: string): Promise<JoinResult>;
  leaveClass(classId: string): Promise<void>;
  getPortfolio(classId: string, sid: string): Promise<CloudRecord[]>;
  saveRecords(classId: string, sid: string, records: CloudRecord[]): Promise<void>;
}

export class CloudError extends Error {
  constructor(
    public code: 'invalid-invite' | 'permission' | 'network' | 'not-found' | 'unknown',
    message: string
  ) {
    super(message);
  }
}
