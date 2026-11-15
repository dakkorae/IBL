// 비속어 걸러 내기 (AI 없이, 이 기기 안에서 낱말 목록으로 검사)
// - 띄어쓰기·특수문자·숫자를 끼워 넣어 피하는 것(시1발, 시 발)도 잡음
// - "다시 발표", "새끼 고양이", "꼭꼭 씹어"처럼 평범한 표현은 걸리지 않도록 낱말 단위로 검사
// - 목록 방식이라 새로 생긴 말이나 교묘한 변형까지 모두 잡지는 못함 → 게시판의 '불편해요' 알림과 교사의 '내리기'가 뒤를 받침

// 한글 비속어(낱말 안에 이 글자가 들어 있으면 걸림)
const BAD_WORDS = [
  // 욕설
  '시발', '씨발', '씨바', '시바', '씨빨', '시빨', '쓰발', '쒸발', '씨팔', '시팔', '씨부랄', '씨불', '씹새', '씹놈', '씹년', '씹할', '씹창',
  '병신', '븅신', '빙신', '벼엉신', '등신', '개새끼', '개새', '개색기', '개색끼', '개세끼', '개쉐', '개쌔', '개자식', '개놈', '개같은놈', '개같은년',
  '이새끼', '저새끼', '그새끼', '새끼야', '새끼들아', '미친새끼', '미친놈', '미친년', '미친새', '미친넘',
  '지랄', '지럴', '좆', '졷', '좃', '존나', '존내', '졸라게', '닥쳐', '아가리', '주둥아리',
  '꺼져라', '꺼지라', '죽어라', '뒤져라', '뒈져', '뒤질래', '죽여버',
  '또라이', '돌아이', '찐따', '찌질이', '호로새', '호로자', '후레자', '후레새', '쌍놈', '쌍년', '썅', '상놈의', '염병', '엠창', '엿먹',
  '느금', '니애미', '니미', '애미',
  // 혐오·따돌림 표현
  '한남충', '틀딱', '급식충', '맘충', '김치녀', '장애새', '거지새',
  // 성적 표현
  '섹스', '쎅스', '야동', '딸딸이', '성관계', '강간', '창녀', '걸레년', '보지년', '자지새',
  // 영어 욕을 한글로 적은 것
  '뻑큐', '뻐큐', '퍼큐', '빠큐', '뻑유', '퍽유', '쉣', '비치년',
  // 자음만 쓴 줄임말
  'ㅅㅂ', 'ㅆㅂ', 'ㅂㅅ', 'ㅄ', 'ㅈㄹ', 'ㅈㄴ', 'ㅁㅊ', 'ㄲㅈ', 'ㅅㄲ', 'ㄱㅅㄲ', 'ㄴㄱㅁ', 'ㅗㅗ', 'ㅈ같', 'ㅈ까'
];

// 비속어 글자가 들어 있지만 평범한 낱말 (검사 전에 지움)
const SAFE_WORDS = [
  '시발점', '시발역', '다시발', '역시발', '몹시발', '혹시발', '잠시발', '등신대', '시바견', '시바이누',
  '팔등신', '미니미', '아가리쿠스', '한강간'
];

const ENGLISH = /\b(f+u+c*k+\w*|sh+i+t+|b+i+t+c+h+\w*|asshole|bastard|porn\w*|sex\w*|wtf|stfu)\b/i;

function scan(token: string): string | null {
  let t = token;
  SAFE_WORDS.forEach((w) => (t = t.split(w).join(' ')));
  return BAD_WORDS.find((w) => t.includes(w)) || null;
}

// 걸리는 낱말이 있으면 그 낱말을, 없으면 null
export function findBadWord(text: string): string | null {
  if (!text) return null;
  const english = text.match(ENGLISH);
  if (english) return english[0];

  // 한글·자음모음만 남기고(숫자·기호 끼워 넣기 무력화), 띄어쓰기는 낱말 구분으로 남김
  const tokens = text
    .replace(/[^가-힣ㄱ-ㆎ\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  // 한 글자씩 띄어 쓴 것("시 발 놈")은 붙여서 한 낱말로 봄
  const words: string[] = [];
  let run = '';
  tokens.forEach((t) => {
    if (t.length === 1) run += t;
    else {
      if (run) words.push(run);
      run = '';
      words.push(t);
    }
  });
  if (run) words.push(run);

  for (const w of words) {
    const hit = scan(w);
    if (hit) return hit;
  }
  return null;
}

// 여러 입력 칸을 한 번에 검사해서, 걸리면 학생에게 보여 줄 안내 문장을 돌려줌
export function badWordMessage(...texts: (string | null | undefined)[]): string | null {
  for (const t of texts) {
    const hit = t ? findBadWord(t) : null;
    if (hit) return `“${hit}” 같은 말은 쓸 수 없어요. 바르고 고운 말로 바꿔 주세요.`;
  }
  return null;
}
