// 비밀번호는 그대로 보내지 않고, 되돌릴 수 없는 값(SHA-256)으로 바꿔서 보냄
export async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const adminKeyHash = (key: string) => sha256(`ib-admin:${key.trim()}`);
export const teacherKeyHash = (classId: string, password: string) => sha256(`${classId}:teacher:${password}`);
export const pinHash = (classId: string, sid: string, pin: string) => sha256(`${classId}:${sid}:${pin}`);

// 헷갈리는 글자(0/O, 1/I/L)를 뺀 코드용 글자
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export function randomCode(length: number): string {
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (v) => ALPHABET[v % ALPHABET.length]).join('');
}

export const normalizeCode = (code: string) => code.toUpperCase().replace(/[^0-9A-Z]/g, '');

export function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// Firestore는 undefined 값을 받지 않으므로 저장 전에 걸러 냄
export const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));
