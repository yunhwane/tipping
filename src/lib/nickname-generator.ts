import { randomInt, randomUUID } from "crypto";

const ADJECTIVES = [
  "빠른", "용감한", "똑똑한", "귀여운", "멋진",
  "신나는", "활발한", "든든한", "재빠른", "씩씩한",
  "느긋한", "다정한", "영리한", "유쾌한", "힘찬",
];

const ANIMALS = [
  "고양이", "강아지", "토끼", "사자", "호랑이",
  "펭귄", "곰돌이", "여우", "부엉이", "다람쥐",
  "판다", "코알라", "수달", "돌고래", "햄스터",
];

function generateOne(): string {
  const adj = ADJECTIVES[randomInt(ADJECTIVES.length)]!;
  const animal = ANIMALS[randomInt(ANIMALS.length)]!;
  const num = randomInt(10, 100);
  return `${adj}${animal}${num}`;
}

/**
 * 고유한 닉네임을 생성합니다.
 * @param isUnique - 닉네임 중복 여부를 확인하는 함수
 * @returns 고유한 닉네임 문자열
 */
export async function generateUniqueNickname(
  isUnique: (nickname: string) => Promise<boolean>,
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const nickname = generateOne();
    if (await isUnique(nickname)) return nickname;
  }

  // fallback: UUID 4자리 suffix
  const adj = ADJECTIVES[randomInt(ADJECTIVES.length)]!;
  const animal = ANIMALS[randomInt(ANIMALS.length)]!;
  const suffix = randomUUID().slice(0, 4);
  return `${adj}${animal}${suffix}`;
}
