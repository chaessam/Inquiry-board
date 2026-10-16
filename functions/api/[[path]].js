// 서버 우편함 API (Cloudflare Pages Functions + D1)
// - 교실: 교사는 '관리 코드'로, 학생은 '교실 코드 + 번호'로 구분합니다.
// - 과제와 제출물은 마감 후 14일이 지나면 지웁니다(요청이 들어올 때 함께 정리).
// - 학생 이름은 서버로 오지 않습니다.

const DAY = 24 * 60 * 60 * 1000;
const KEEP_AFTER_DEADLINE = 14 * DAY;
const CLASSROOM_IDLE_LIMIT = 365 * DAY;
const MAX_DEADLINE_AHEAD = 120 * DAY;
const MAX_JSON_BYTES = 32 * 1024;
const MAX_REVISIONS = 30;
const MAX_ACTIVE_ASSIGNMENTS = 60;
const MAX_CLASS_SIZE = 40;
const STRATEGIES = ['concept-attainment', 'frayer', 'generalization'];
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  try {
    const res = await route(request, env, parts, url);
    return res;
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: '서버에서 문제가 생겼어요. 잠시 뒤 다시 해 주세요.' }, 500);
  }
}

async function route(request, env, p, url) {
  const m = request.method;
  const db = env.DB;

  // 교실 만들기
  if (m === 'POST' && p.length === 1 && p[0] === 'classrooms') {
    const body = await readJson(request);
    const label = cleanText(body.label, 30) || '우리 반';
    const size = clampInt(body.size, 1, MAX_CLASS_SIZE);
    await cleanup(db);
    const adminKey = randomKey();
    const now = Date.now();
    const id = randomId();
    for (let i = 0; i < 5; i++) {
      const code = randomCode();
      try {
        await db.prepare('INSERT INTO classrooms (id, code, label, size, admin_hash, created_at, last_used) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(id, code, label, size, await sha256(adminKey), now, now).run();
        return json({ classroom: { id, code, label, size }, adminKey }, 201);
      } catch (e) {
        if (!String(e).includes('UNIQUE')) throw e;
      }
    }
    throw new HttpError(500, '교실 코드를 만들지 못했어요. 다시 해 주세요.');
  }

  // 관리 코드로 교실 불러오기
  if (m === 'POST' && p.length === 2 && p[0] === 'teacher' && p[1] === 'recover') {
    const body = await readJson(request);
    const key = normalizeKey(body.adminKey);
    if (!key) throw new HttpError(400, '관리 코드를 확인해 주세요.');
    const row = await db.prepare('SELECT id, code, label, size FROM classrooms WHERE admin_hash = ?').bind(await sha256(key)).first();
    if (!row) throw new HttpError(404, '이 관리 코드로 된 교실이 없어요.');
    await touch(db, row.id);
    return json({ classroom: row, adminKey: key });
  }

  // 교사 전용: /classrooms/:id/...
  if (p[0] === 'classrooms' && p.length >= 2) {
    const room = await requireTeacher(request, db, p[1]);

    if (m === 'PATCH' && p.length === 2) {
      const body = await readJson(request);
      const label = cleanText(body.label, 30) || room.label;
      const size = body.size == null ? room.size : clampInt(body.size, 1, MAX_CLASS_SIZE);
      await db.prepare('UPDATE classrooms SET label = ?, size = ? WHERE id = ?').bind(label, size, room.id).run();
      return json({ classroom: { id: room.id, code: room.code, label, size } });
    }

    if (m === 'DELETE' && p.length === 2) {
      await db.batch([
        db.prepare('DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE classroom_id = ?)').bind(room.id),
        db.prepare('DELETE FROM assignments WHERE classroom_id = ?').bind(room.id),
        db.prepare('DELETE FROM classrooms WHERE id = ?').bind(room.id)
      ]);
      return json({ ok: true });
    }

    if (p[2] === 'assignments' && p.length === 3 && m === 'GET') {
      const { results } = await db.prepare(
        `SELECT a.id, a.strategy, a.title, a.deadline, a.expires_at, a.created_at,
                (SELECT COUNT(DISTINCT s.number) FROM submissions s WHERE s.assignment_id = a.id) AS submitted
           FROM assignments a WHERE a.classroom_id = ? AND a.expires_at > ? ORDER BY a.created_at DESC`
      ).bind(room.id, Date.now()).all();
      return json({ assignments: results });
    }

    if (p[2] === 'assignments' && p.length === 3 && m === 'POST') {
      const body = await readJson(request);
      if (!STRATEGIES.includes(body.strategy)) throw new HttpError(400, '알 수 없는 사고전략이에요.');
      const title = cleanText(body.title, 60);
      if (!title) throw new HttpError(400, '과제 제목을 써 주세요.');
      const deadline = Number(body.deadline);
      const now = Date.now();
      if (!Number.isFinite(deadline) || deadline <= now) throw new HttpError(400, '마감은 지금보다 뒤여야 해요.');
      if (deadline > now + MAX_DEADLINE_AHEAD) throw new HttpError(400, '마감은 120일 안으로 정해 주세요.');
      const payload = jsonText(body.payload, '활동지');
      await cleanup(db);
      const active = await db.prepare('SELECT COUNT(*) AS n FROM assignments WHERE classroom_id = ?').bind(room.id).first();
      if (active.n >= MAX_ACTIVE_ASSIGNMENTS) throw new HttpError(429, '진행 중인 과제가 너무 많아요. 지난 과제를 정리해 주세요.');
      const id = randomId();
      await db.prepare('INSERT INTO assignments (id, classroom_id, strategy, title, payload, deadline, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, room.id, body.strategy, title, payload, deadline, deadline + KEEP_AFTER_DEADLINE, now).run();
      return json({ assignment: { id, strategy: body.strategy, title, deadline, expires_at: deadline + KEEP_AFTER_DEADLINE, created_at: now, submitted: 0 } }, 201);
    }

    if (p[2] === 'assignments' && p.length === 4) {
      const a = await db.prepare('SELECT * FROM assignments WHERE id = ? AND classroom_id = ?').bind(p[3], room.id).first();
      if (!a) throw new HttpError(404, '과제를 찾을 수 없어요. 보관 기간이 지났을 수 있어요.');
      if (m === 'GET') {
        const { results } = await db.prepare('SELECT number, device_id, content, revisions, submitted_at FROM submissions WHERE assignment_id = ? ORDER BY number, submitted_at')
          .bind(a.id).all();
        return json({
          assignment: { ...a, payload: JSON.parse(a.payload) },
          submissions: results.map((s) => ({ ...s, content: JSON.parse(s.content) }))
        });
      }
      if (m === 'PATCH') {
        // 마감 연장만 허용
        const body = await readJson(request);
        const deadline = Number(body.deadline);
        if (!Number.isFinite(deadline) || deadline > Date.now() + MAX_DEADLINE_AHEAD) throw new HttpError(400, '마감 날짜를 확인해 주세요.');
        await db.batch([
          db.prepare('UPDATE assignments SET deadline = ?, expires_at = ? WHERE id = ?').bind(deadline, deadline + KEEP_AFTER_DEADLINE, a.id),
          db.prepare('UPDATE submissions SET expires_at = ? WHERE assignment_id = ?').bind(deadline + KEEP_AFTER_DEADLINE, a.id)
        ]);
        return json({ ok: true, deadline, expires_at: deadline + KEEP_AFTER_DEADLINE });
      }
      if (m === 'DELETE') {
        await db.batch([
          db.prepare('DELETE FROM submissions WHERE assignment_id = ?').bind(a.id),
          db.prepare('DELETE FROM assignments WHERE id = ?').bind(a.id)
        ]);
        return json({ ok: true });
      }
    }
  }

  // 학생: /class/:code
  if (p[0] === 'class' && p.length >= 2) {
    const code = String(p[1] || '').toUpperCase();
    const room = await db.prepare('SELECT id, code, label, size FROM classrooms WHERE code = ?').bind(code).first();
    if (!room) throw new HttpError(404, '교실 코드를 다시 확인해 주세요.');

    if (m === 'GET' && p.length === 2) {
      return json({ classroom: { code: room.code, label: room.label, size: room.size } });
    }

    if (m === 'GET' && p.length === 3 && p[2] === 'assignments') {
      const number = Number(url.searchParams.get('number'));
      const { results } = await db.prepare(
        'SELECT id, strategy, title, payload, deadline FROM assignments WHERE classroom_id = ? AND expires_at > ? ORDER BY created_at DESC'
      ).bind(room.id, Date.now()).all();
      let mine = new Set();
      if (Number.isInteger(number) && number >= 1) {
        const sub = await db.prepare(
          'SELECT DISTINCT s.assignment_id AS id FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.classroom_id = ? AND s.number = ?'
        ).bind(room.id, number).all();
        mine = new Set(sub.results.map((r) => r.id));
      }
      return json({ assignments: results.map((a) => ({ ...a, payload: JSON.parse(a.payload), submitted: mine.has(a.id) })) });
    }

    if (m === 'POST' && p.length === 5 && p[2] === 'assignments' && p[4] === 'submit') {
      const a = await db.prepare('SELECT id, deadline, expires_at FROM assignments WHERE id = ? AND classroom_id = ?').bind(p[3], room.id).first();
      if (!a) throw new HttpError(404, '과제를 찾을 수 없어요.');
      if (Date.now() > a.deadline) throw new HttpError(403, '마감 시간이 지나서 낼 수 없어요. 선생님께 말씀드려요.');
      const body = await readJson(request);
      const number = clampInt(body.number, 1, room.size);
      const deviceId = String(body.deviceId || '');
      if (!/^[a-z0-9]{16,40}$/.test(deviceId)) throw new HttpError(400, '기기 정보를 확인할 수 없어요.');
      const content = jsonText(body.content, '답');
      const prev = await db.prepare('SELECT id, revisions FROM submissions WHERE assignment_id = ? AND number = ? AND device_id = ?')
        .bind(a.id, number, deviceId).first();
      const now = Date.now();
      if (prev) {
        if (prev.revisions >= MAX_REVISIONS) throw new HttpError(429, '다시 내기는 여기까지 할 수 있어요.');
        await db.prepare('UPDATE submissions SET content = ?, revisions = revisions + 1, submitted_at = ? WHERE id = ?')
          .bind(content, now, prev.id).run();
        return json({ ok: true, revisions: prev.revisions + 1, submittedAt: now });
      }
      await db.prepare('INSERT INTO submissions (id, assignment_id, number, device_id, content, revisions, submitted_at, expires_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)')
        .bind(randomId(), a.id, number, deviceId, content, now, a.expires_at).run();
      await touch(db, room.id);
      return json({ ok: true, revisions: 0, submittedAt: now }, 201);
    }
  }

  throw new HttpError(404, '없는 주소예요.');
}

// ---------- 도우미 ----------

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_JSON_BYTES * 2) throw new HttpError(413, '보낸 내용이 너무 커요.');
  try { return JSON.parse(text || '{}'); } catch { throw new HttpError(400, '보낸 내용을 읽을 수 없어요.'); }
}

function jsonText(value, what) {
  const text = JSON.stringify(value ?? null);
  if (value == null || typeof value !== 'object') throw new HttpError(400, `${what} 내용이 비어 있어요.`);
  if (new TextEncoder().encode(text).length > MAX_JSON_BYTES) throw new HttpError(413, `${what} 내용이 너무 길어요.`);
  return text;
}

function cleanText(v, max) {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${min}부터 ${max} 사이의 숫자를 넣어 주세요.`);
  return n;
}

async function requireTeacher(request, db, id) {
  const auth = request.headers.get('authorization') || '';
  const key = normalizeKey(auth.replace(/^Bearer\s+/i, ''));
  if (!key) throw new HttpError(401, '교실 관리 코드가 필요해요.');
  const room = await db.prepare('SELECT id, code, label, size FROM classrooms WHERE id = ? AND admin_hash = ?').bind(id, await sha256(key)).first();
  if (!room) throw new HttpError(403, '이 교실을 관리할 수 없어요. 관리 코드를 확인해 주세요.');
  await touch(db, room.id);
  return room;
}

async function touch(db, id) {
  await db.prepare('UPDATE classrooms SET last_used = ? WHERE id = ?').bind(Date.now(), id).run();
}

async function cleanup(db) {
  const now = Date.now();
  await db.batch([
    db.prepare('DELETE FROM submissions WHERE expires_at < ?').bind(now),
    db.prepare('DELETE FROM assignments WHERE expires_at < ?').bind(now),
    db.prepare('DELETE FROM classrooms WHERE last_used < ?').bind(now - CLASSROOM_IDLE_LIMIT)
  ]);
}

function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function randomId() {
  return [...randomBytes(12)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function randomCode() {
  return [...randomBytes(6)].map((x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join('');
}

// 관리 코드: 20자리(4자리씩 끊어 보여 줌), 약 100비트
function randomKey() {
  return [...randomBytes(20)].map((x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join('');
}

function normalizeKey(v) {
  const k = String(v || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  return k.length === 20 ? k : '';
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
