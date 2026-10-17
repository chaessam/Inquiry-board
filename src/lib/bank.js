// 개념 은행: 교실마다 하나씩, 수업이 바뀌어도 계속 쌓이는 개념 단어 모음
// 서버(classrooms.concepts)에 두고, 선생님 기기에는 마지막으로 받은 것을 bank:<교실id> 로 남겨 둬요.
// 학생 기기는 '내 과제'를 불러올 때 함께 받아요. (따로 요청하지 않아요)
// 한 개념의 모양: { w: 단어, m: 뜻(선택), u: 단원 이름표(선택), at: 넣은 시각 }
import { api } from './api.js';
import { store } from './db.js';

export const BANK_MAX = 150;

export async function cachedBank(roomId) {
  return (await store.get('bank:' + roomId)) || [];
}

// 화면을 열 때 한 번 불러와요. 인터넷이 안 되면 기기에 남은 것을 써요.
export async function loadBank(room) {
  try {
    const r = await api.getConcepts(room);
    await store.set('bank:' + room.id, r.concepts);
    return r.concepts;
  } catch {
    return cachedBank(room.id);
  }
}

export async function saveBank(room, list) {
  const r = await api.saveConcepts(room, list);
  await store.set('bank:' + room.id, r.concepts);
  return r.concepts;
}

const clean = (w) => String(w || '').replace(/\s+/g, ' ').trim().slice(0, 20);

// 단어 여러 개를 한 번에 넣어요. 이미 있는 단어는 건너뛰고(뜻이 비어 있으면 채워요), 새로 넣은 수를 알려 줘요.
export function mergeWords(list, words, { unit = '', meaning = '' } = {}) {
  const next = [...list];
  let added = 0;
  for (const raw of words) {
    const w = clean(raw);
    if (!w) continue;
    const i = next.findIndex((c) => c.w === w);
    if (i >= 0) {
      if (meaning && !next[i].m) next[i] = { ...next[i], m: meaning.slice(0, 100) };
      continue;
    }
    next.unshift({ w, m: meaning.slice(0, 100), u: unit.slice(0, 30), at: Date.now() });
    added++;
  }
  return { list: next.slice(0, BANK_MAX), added };
}

// 단원을 저장할 때 핵심 개념을 은행에 넣어요. 새 단어가 있을 때만 서버에 요청해요.
export async function addUnitConcepts(room, unit) {
  const words = unit?.concepts || [];
  if (!words.length) return 0;
  const cached = await cachedBank(room.id);
  if (words.every((w) => cached.some((c) => c.w === w))) return 0;
  const fresh = await loadBank(room);
  const r = mergeWords(fresh, words, { unit: unit.name || '' });
  if (r.added) await saveBank(room, r.list);
  return r.added;
}

// 학생 활동지에 보여 줄 은행 단어 (활동지에 이미 있는 단어는 빼요)
export const bankWords = (bank, except = []) => (bank || []).map((c) => c.w).filter((w) => !except.includes(w));
