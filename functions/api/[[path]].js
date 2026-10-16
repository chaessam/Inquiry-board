// 서버 우편함 API (Cloudflare Pages Functions + D1)
// - 교실: 교사는 '교실 이름 + 비밀번호 4자리'로 처음 한 번 들어오고, 그 뒤로는 기기 열쇠로 구분합니다.
//   학생은 '교실 코드 + 번호'로 구분합니다.
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
// 장난 요청 막기: 같은 접속 주소에서 시간 창마다 받을 수 있는 횟수
// 학교는 반 전체가 같은 주소로 나가므로 넉넉하게 잡습니다.
const MIN = 60 * 1000;
const LIMITS = {
  create: [5, 60 * MIN],      // 교실 만들기
  login: [20, 10 * MIN],      // 교사 비밀번호로 들어오기 (교실마다 따로 잠금도 있어요)
  miss: [30, 10 * MIN],       // 없는 교실 코드 넣기
  read: [1500, 10 * MIN],     // 학생 화면 읽기
  submit: [600, 10 * MIN],    // 제출
  move: [100, 10 * MIN]       // 교사가 제출물 번호 옮기기
};
const STRATEGIES = ['concept-attainment', 'frayer', 'generalization', 'see-think-wonder', 'compare-cases', 'classify', 'diamond-rank', 'used-to-think', 'value-line', 'four-corners'];
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
  const limit = (name) => rateLimit(db, request, env, name);

  // 교실 만들기
  if (m === 'POST' && p.length === 1 && p[0] === 'classrooms') {
    await limit('create');
    const body = await readJson(request);
    const label = checkLabel(body.label);
    const size = clampInt(body.size, 1, MAX_CLASS_SIZE);
    const pin = checkPin(body.pin);
    await cleanup(db);
    await requireFreeName(db, label);
    const adminKey = randomKey(); // 이 기기의 열쇠 (선생님에게는 보이지 않아요)
    const now = Date.now();
    const id = randomId();
    for (let i = 0; i < 5; i++) {
      const code = randomCode();
      try {
        await db.prepare('INSERT INTO classrooms (id, code, label, name_key, size, admin_hash, pin_hash, created_at, last_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, code, label, nameKey(label), size, await sha256(adminKey), await pinHash(env, id, pin), now, now).run();
        return json({ classroom: { id, code, label, size }, adminKey }, 201);
      } catch (e) {
        if (String(e).includes('name_key')) throw new HttpError(409, NAME_TAKEN);
        if (!String(e).includes('UNIQUE')) throw e;
      }
    }
    throw new HttpError(500, '교실 코드를 만들지 못했어요. 다시 해 주세요.');
  }

  // 다른 기기에서 들어오기: 교실 이름 + 비밀번호 4자리
  if (m === 'POST' && p.length === 2 && p[0] === 'teacher' && p[1] === 'login') {
    await limit('login');
    const body = await readJson(request);
    const key = nameKey(cleanText(body.name, 30));
    const pin = String(body.pin || '');
    const room = key ? await db.prepare('SELECT id, code, label, size, pin_hash, pin_fails, pin_locked_until FROM classrooms WHERE name_key = ?').bind(key).first() : null;
    const fail = '교실 이름이나 비밀번호가 맞지 않아요.';
    if (!room || !room.pin_hash) {
      await limit('miss');
      throw new HttpError(401, fail);
    }
    const now = Date.now();
    if (room.pin_locked_until > now) {
      throw new HttpError(423, `비밀번호를 여러 번 틀려서 잠겼어요. ${Math.ceil((room.pin_locked_until - now) / MIN)}분 뒤에 다시 해 주세요. 이미 들어가 있는 선생님 기기는 그대로 쓸 수 있어요.`);
    }
    if (!/^\d{4}$/.test(pin) || (await pinHash(env, room.id, pin)) !== room.pin_hash) {
      const fails = room.pin_fails + 1;
      // 5번 틀릴 때마다 잠금: 15분 → 30분 → 1시간 … 최대 하루
      const lockMin = fails % 5 === 0 ? Math.min(15 * 2 ** (fails / 5 - 1), 24 * 60) : 0;
      await db.prepare('UPDATE classrooms SET pin_fails = ?, pin_locked_until = ? WHERE id = ?')
        .bind(fails, lockMin ? now + lockMin * MIN : 0, room.id).run();
      throw new HttpError(401, lockMin ? `${fail} 여러 번 틀려서 ${lockMin}분 동안 잠겼어요.` : `${fail} (${5 - (fails % 5)}번 더 틀리면 잠시 잠겨요)`);
    }
    const token = randomKey();
    await db.batch([
      db.prepare('UPDATE classrooms SET pin_fails = 0, pin_locked_until = 0, last_used = ? WHERE id = ?').bind(now, room.id),
      db.prepare('INSERT INTO teacher_tokens (token_hash, classroom_id, created_at, last_used) VALUES (?, ?, ?, ?)').bind(await sha256(token), room.id, now, now)
    ]);
    return json({ classroom: { id: room.id, code: room.code, label: room.label, size: room.size }, adminKey: token });
  }

  // 교사 전용: /classrooms/:id/...
  if (p[0] === 'classrooms' && p.length >= 2) {
    const room = await requireTeacher(request, db, p[1]);

    if (m === 'PATCH' && p.length === 2) {
      const body = await readJson(request);
      const label = body.label == null ? room.label : checkLabel(body.label);
      const size = body.size == null ? room.size : clampInt(body.size, 1, MAX_CLASS_SIZE);
      if (nameKey(label) !== nameKey(room.label)) await requireFreeName(db, label);
      try {
        await db.prepare('UPDATE classrooms SET label = ?, name_key = ?, size = ? WHERE id = ?').bind(label, nameKey(label), size, room.id).run();
      } catch (e) {
        if (String(e).includes('UNIQUE')) throw new HttpError(409, NAME_TAKEN);
        throw e;
      }
      return json({ classroom: { id: room.id, code: room.code, label, size } });
    }

    // 비밀번호 바꾸기: 이 기기만 남기고 다른 기기는 모두 나가게 해요
    if (m === 'PUT' && p.length === 3 && p[2] === 'pin') {
      const body = await readJson(request);
      const pin = checkPin(body.pin);
      const mine = await sha256(room.key);
      const stmts = [db.prepare('UPDATE classrooms SET pin_hash = ?, pin_fails = 0, pin_locked_until = 0 WHERE id = ?').bind(await pinHash(env, room.id, pin), room.id)];
      if (body.signOutOthers !== false) {
        stmts.push(db.prepare('DELETE FROM teacher_tokens WHERE classroom_id = ? AND token_hash != ?').bind(room.id, mine));
        if (!room.viaAdmin) stmts.push(db.prepare('UPDATE classrooms SET admin_hash = ? WHERE id = ?').bind(await sha256(randomKey()), room.id));
      }
      await db.batch(stmts);
      return json({ ok: true });
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

    // 잘못된 번호로 낸 답을 올바른 번호로 옮기기
    if (p[2] === 'assignments' && p.length === 6 && p[4] === 'submissions' && m === 'PATCH') {
      await limit('move');
      const sub = await db.prepare(
        'SELECT s.id, s.device_id, s.assignment_id FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ? AND a.id = ? AND a.classroom_id = ?'
      ).bind(p[5], p[3], room.id).first();
      if (!sub) throw new HttpError(404, '제출물을 찾을 수 없어요.');
      const body = await readJson(request);
      const number = clampInt(body.number, 1, room.size);
      const clash = await db.prepare('SELECT id FROM submissions WHERE assignment_id = ? AND number = ? AND device_id = ? AND id != ?')
        .bind(sub.assignment_id, number, sub.device_id, sub.id).first();
      if (clash) throw new HttpError(409, `${number}번에 같은 기기에서 낸 답이 이미 있어요.`);
      await db.prepare('UPDATE submissions SET number = ? WHERE id = ?').bind(number, sub.id).run();
      return json({ ok: true, number });
    }

    if (p[2] === 'assignments' && p.length === 4) {
      const a = await db.prepare('SELECT * FROM assignments WHERE id = ? AND classroom_id = ?').bind(p[3], room.id).first();
      if (!a) throw new HttpError(404, '과제를 찾을 수 없어요. 보관 기간이 지났을 수 있어요.');
      if (m === 'GET') {
        const { results } = await db.prepare('SELECT id, number, device_id, content, revisions, submitted_at FROM submissions WHERE assignment_id = ? ORDER BY number, submitted_at')
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
    await limit(m === 'POST' ? 'submit' : 'read');
    const room = await db.prepare('SELECT id, code, label, size FROM classrooms WHERE code = ?').bind(code).first();
    if (!room) {
      await limit('miss');
      throw new HttpError(404, '교실 코드를 다시 확인해 주세요.');
    }

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
  if (!key) throw new HttpError(401, '선생님 기기로 들어와 있지 않아요. 교실 이름과 비밀번호로 다시 들어와 주세요.');
  const h = await sha256(key);
  const room = await db.prepare(
    `SELECT id, code, label, size, (admin_hash = ?) AS via_admin FROM classrooms
      WHERE id = ? AND (admin_hash = ? OR EXISTS (SELECT 1 FROM teacher_tokens t WHERE t.token_hash = ? AND t.classroom_id = classrooms.id))`
  ).bind(h, id, h, h).first();
  if (!room) throw new HttpError(403, '이 기기는 교실에서 나가 있어요. 교실 이름과 비밀번호로 다시 들어와 주세요.');
  await db.batch([
    db.prepare('UPDATE classrooms SET last_used = ? WHERE id = ?').bind(Date.now(), room.id),
    db.prepare('UPDATE teacher_tokens SET last_used = ? WHERE token_hash = ?').bind(Date.now(), h)
  ]);
  return { id: room.id, code: room.code, label: room.label, size: room.size, key, viaAdmin: !!room.via_admin };
}

// 교실 이름은 로그인 이름이라 다른 교실과 겹치면 안 돼요 (띄어쓰기·대소문자는 무시)
const NAME_TAKEN = '같은 이름의 교실이 이미 있어요. 학교 이름을 붙이는 등 다르게 지어 주세요. (예: 한빛초 3학년 2반)';
function nameKey(label) {
  return String(label || '').toLowerCase().replace(/\s+/g, '');
}
function checkLabel(v) {
  const label = cleanText(v, 30);
  if (nameKey(label).length < 2) throw new HttpError(400, '교실 이름을 2글자 이상 써 주세요.');
  return label;
}
async function requireFreeName(db, label) {
  const taken = await db.prepare('SELECT 1 FROM classrooms WHERE name_key = ?').bind(nameKey(label)).first();
  if (taken) throw new HttpError(409, NAME_TAKEN);
}

// 비밀번호 4자리: 너무 쉬운 번호는 받지 않아요
const WEAK_PINS = new Set(['1004', '2580', '0852', '1212', '1122', '6969', '1357', '2468', '0101', '0007']);
function checkPin(v) {
  const pin = String(v ?? '');
  if (!/^\d{4}$/.test(pin)) throw new HttpError(400, '비밀번호는 숫자 4자리로 정해 주세요.');
  const d = [...pin].map(Number);
  const same = d.every((x) => x === d[0]);
  const up = d.every((x, i) => i === 0 || x === (d[i - 1] + 1) % 10);
  const down = d.every((x, i) => i === 0 || x === (d[i - 1] + 9) % 10);
  if (same || up || down || WEAK_PINS.has(pin)) throw new HttpError(400, '0000, 1234처럼 너무 쉬운 번호는 쓸 수 없어요. 다른 번호로 정해 주세요.');
  return pin;
}

async function pinHash(env, classroomId, pin) {
  return sha256(`${env.PIN_PEPPER || 'saenggakteul-pin'}|${classroomId}|${pin}`);
}

async function touch(db, id) {
  await db.prepare('UPDATE classrooms SET last_used = ? WHERE id = ?').bind(Date.now(), id).run();
}

async function cleanup(db) {
  const now = Date.now();
  await db.batch([
    db.prepare('DELETE FROM submissions WHERE expires_at < ?').bind(now),
    db.prepare('DELETE FROM assignments WHERE expires_at < ?').bind(now),
    db.prepare('DELETE FROM classrooms WHERE last_used < ?').bind(now - CLASSROOM_IDLE_LIMIT),
    db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(now)
  ]);
}

// 접속 주소는 날짜·용도와 섞은 해시로만 다룹니다. (RATE_SALT 비밀값을 설정하면 더 안전해요)
async function rateLimit(db, request, env, name) {
  const [max, windowMs] = LIMITS[name];
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const day = new Date().toISOString().slice(0, 10);
  const bucket = name + ':' + (await sha256(`${env.RATE_SALT || 'saenggakteul'}|${day}|${name}|${ip}`)).slice(0, 32);
  const now = Date.now();
  const row = await db.prepare(
    `INSERT INTO rate_limits (bucket, hits, reset_at) VALUES (?, 1, ?)
     ON CONFLICT(bucket) DO UPDATE SET
       hits = CASE WHEN reset_at < ? THEN 1 ELSE hits + 1 END,
       reset_at = CASE WHEN reset_at < ? THEN ? ELSE reset_at END
     RETURNING hits`
  ).bind(bucket, now + windowMs, now, now, now + windowMs).first();
  if (row && row.hits > max) throw new HttpError(429, '짧은 시간에 요청이 너무 많았어요. 잠시 뒤에 다시 해 주세요.');
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

// 기기 열쇠: 20자리 무작위 (약 100비트). 선생님에게는 보이지 않고 기기에만 저장돼요.
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
