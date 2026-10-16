// 수업 기록 정리: 단원 이력, 과제를 낸 곳(단원·탐구 단계), 함께 보기 기록
// 모두 선생님 기기(IndexedDB)에만 저장합니다. 서버로 보내지 않아요.
//   unit:<교실id>     지금 단원 (id가 있어 단원을 바꿔도 기록이 섞이지 않아요)
//   units:<교실id>    지금까지 쓴 단원 목록 [{ id, name, subject, startedAt }]
//   meta:<과제id>     과제를 낸 곳 { unitId, unitName, unitSubject, stage, roomId, strategy, title, createdAt, liveId }
//   live:<기록id>     함께 보기 기록 { id, roomId, strategy, title, payload, answer, step, filed, createdAt, updatedAt }
import { store, newDeviceId } from './db.js';
import { STAGES } from '../content/guides.js';

export const OUTSIDE = 'none'; // 단원 밖 수업

export const stageName = (id) => STAGES.find((s) => s.id === id)?.name || '단계 없음';

export async function loadUnit(roomId) {
  let u = await store.get('unit:' + roomId);
  if (u && !u.id) {
    // 예전 버전에서 만든 단원에는 id가 없어요. 한 번만 붙여 줍니다.
    u = { ...u, id: newDeviceId(), startedAt: Date.now() };
    await saveUnit(roomId, u);
  }
  return u || null;
}

export async function saveUnit(roomId, u) {
  await store.set('unit:' + roomId, u);
  if (!u.id || !u.name?.trim()) return;
  const list = (await store.get('units:' + roomId)) || [];
  const entry = { id: u.id, name: u.name, subject: u.subject || '', startedAt: u.startedAt || Date.now() };
  await store.set('units:' + roomId, [entry, ...list.filter((x) => x.id !== u.id)]);
}

export async function listUnits(roomId) {
  return (await store.get('units:' + roomId)) || [];
}

// 정리할 곳 만들기
export function filingFor(unit, stage) {
  if (!unit?.id) return { unitId: null, unitName: '', unitSubject: '', stage: stage || 'connect' };
  return { unitId: unit.id, unitName: unit.name, unitSubject: unit.subject || '', stage: stage || unit.stage || 'connect' };
}
export const outsideFiling = (stage) => filingFor(null, stage);

export async function fileAssignment(assignmentId, info) {
  await store.set('meta:' + assignmentId, { ...info, assignmentId, createdAt: info.createdAt || Date.now() });
}

// ---------- 함께 보기 기록 ----------

export async function createLive(room, strategy, { stage, unit } = {}) {
  const id = newDeviceId();
  const now = Date.now();
  const rec = {
    id, roomId: room.id, roomLabel: room.label, strategy: strategy.id, title: '',
    payload: strategy.defaultPayload(unit), answer: null, step: 0,
    filed: outsideFiling(stage || strategy.stage), createdAt: now, updatedAt: now
  };
  rec.answer = strategy.emptyAnswer(rec.payload);
  await store.set('live:' + id, rec);
  return rec;
}

export async function prefixed(prefix) {
  const keys = await store.keys();
  const list = await Promise.all(keys.filter((k) => String(k).startsWith(prefix)).map((k) => store.get(k)));
  return list.filter(Boolean);
}

export const listLive = async (roomId) =>
  (await prefixed('live:')).filter((r) => !roomId || r.roomId === roomId).sort((a, b) => b.updatedAt - a.updatedAt);

// ---------- 보관함 묶기: 단원 → 탐구 단계 → 과제 ----------

// 보관함 한 줄로 쓰는 모양
function itemOf(kind, r, filed) {
  if (kind === 'assignment') {
    return {
      kind, id: r.assignment.id, title: r.assignment.title, strategy: r.assignment.strategy,
      at: r.assignment.created_at || r.receivedAt, room: r.classroom?.label || '',
      count: new Set(r.submissions.map((s) => s.number)).size, filed, rec: r
    };
  }
  return { kind, id: r.id, title: r.title, strategy: r.strategy, at: r.createdAt, updated: r.updatedAt, room: r.roomLabel || '', filed, rec: r };
}

export async function loadArchive() {
  const [archives, lives, metas] = await Promise.all([prefixed('archive:'), prefixed('live:'), prefixed('meta:')]);
  const metaById = {};
  for (const m of metas) if (m.assignmentId) metaById[m.assignmentId] = m;
  const items = [
    ...archives.map((r) => itemOf('assignment', r, r.filed || metaById[r.assignment.id] || null)),
    ...lives.map((r) => itemOf('live', r, r.filed || null))
  ];
  return items;
}

export function groupArchive(items) {
  const units = new Map();
  const outside = [];
  for (const it of items) {
    const f = it.filed;
    if (!f?.unitId) { outside.push(it); continue; }
    if (!units.has(f.unitId)) units.set(f.unitId, { id: f.unitId, name: f.unitName || '이름 없는 단원', subject: f.unitSubject || '', items: [], latest: 0 });
    const u = units.get(f.unitId);
    u.items.push(it);
    u.latest = Math.max(u.latest, it.at || 0);
    // 가장 최근 기록에 붙은 이름을 단원 이름으로 써요 (단원 이름을 고쳤을 때)
    if ((it.at || 0) >= u.latest && f.unitName) { u.name = f.unitName; u.subject = f.unitSubject || u.subject; }
  }
  const byStage = (list) => STAGES
    .map((s) => ({ stage: s.id, name: s.name, items: list.filter((it) => (it.filed?.stage || '') === s.id).sort((a, b) => a.at - b.at) }))
    .concat([{ stage: '', name: '단계 없음', items: list.filter((it) => !STAGES.some((s) => s.id === it.filed?.stage)).sort((a, b) => a.at - b.at) }])
    .filter((g) => g.items.length);
  const unitList = [...units.values()].sort((a, b) => b.latest - a.latest).map((u) => ({ ...u, stages: byStage(u.items) }));

  // 단원 밖 수업: 날짜순 (최근 날짜가 위로)
  const days = new Map();
  for (const it of outside.sort((a, b) => b.at - a.at)) {
    const d = new Date(it.at);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!days.has(k)) days.set(k, { key: k, at: it.at, items: [] });
    days.get(k).items.push(it);
  }
  return { units: unitList, outside: [...days.values()], outsideItems: outside };
}

export function downloadJson(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name.replace(/[\\/:*?"<>|]/g, '_') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const today = () => new Date().toISOString().slice(0, 10);
