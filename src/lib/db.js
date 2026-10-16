// 이 기기에만 저장하는 작은 저장소 (IndexedDB, 키-값)
// 키 규칙
//   teacher           { classrooms: [{ id, code, label, size, adminKey }], currentId }
//   unit:<교실id>      단원 정보
//   roster:<교실id>    명렬표 (번호 순 이름 배열)
//   archive:<과제id>   '모두 받기'로 받아 둔 과제와 제출물
//   student           { code, label, size, number, deviceId }
//   draft:<과제id>     학생이 쓰는 중인 답
//   sent:<과제id>      학생이 낸 답의 사본

const DB_NAME = 'saenggakteul';
const STORE = 'kv';
let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => {
        // 다른 탭에서 저장소를 지우거나 새 버전으로 열면 이 탭의 연결을 놓아 줘요
        req.result.onversionchange = () => { req.result.close(); dbPromise = null; };
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const store = {
  get: (key) => tx('readonly', (s) => s.get(key)),
  set: (key, value) => tx('readwrite', (s) => s.put(value, key)),
  del: (key) => tx('readwrite', (s) => s.delete(key)),
  keys: () => tx('readonly', (s) => s.getAllKeys()),
  async delPrefix(prefix) {
    const all = await store.keys();
    await Promise.all(all.filter((k) => String(k).startsWith(prefix)).map((k) => store.del(k)));
  }
};

export function newDeviceId() {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
