import { useEffect, useState } from 'preact/hooks';
import { api } from '../../lib/api.js';
import { store } from '../../lib/db.js';
import { go } from '../../lib/router.js';
import { fmtDateTime, remaining } from '../../lib/format.js';
import { byId } from '../../strategies/index.jsx';
import { Tip, ErrorNote, Loading } from '../../ui/kit.jsx';
import { StudentBar } from './StudentBar.jsx';

export async function clearStudentDevice(setStudent) {
  await store.delPrefix('draft:');
  await store.delPrefix('sent:');
  await setStudent(null);
}

export function MyTasks({ student, setStudent }) {
  const [list, setList] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    api.studentAssignments(student.code, student.number)
      .then(async (r) => {
        setList(r.assignments);
        const d = {};
        for (const a of r.assignments) d[a.id] = !!(await store.get('draft:' + a.id));
        setDrafts(d);
      })
      .catch(setError);
  }, [student.code, student.number]);

  const now = Date.now();
  const todo = (list || []).filter((a) => !a.submitted && a.deadline > now);
  const done = (list || []).filter((a) => a.submitted);
  const missed = (list || []).filter((a) => !a.submitted && a.deadline <= now);

  const card = (a, kind) => (
    <a key={a.id} href={`#/s/a/${a.id}`} class="card" style="text-decoration:none;color:inherit;display:flex;align-items:center;gap:16px;padding:20px 22px">
      <span aria-hidden="true" style={`flex:none;width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:${kind === 'todo' ? '#3355FF' : kind === 'done' ? '#DDF5E9' : '#EEF0F5'}`}>
        {kind === 'done'
          ? <svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#136B41" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          : <span style={`width:18px;height:18px;border-radius:999px;background:${kind === 'todo' ? '#FFD43B' : '#C5CAD8'}`} />}
      </span>
      <span class="stack" style="gap:2px;min-width:0">
        <span style="font-family:var(--font-kid);font-size:22px;line-height:1.25">{a.title}</span>
        <span class="small muted">{byId[a.strategy]?.name}{drafts[a.id] && kind === 'todo' ? ' · 쓰던 중' : ''}</span>
        <span class="small" style={`font-weight:700;color:${kind === 'todo' ? 'var(--orange-text)' : 'var(--ink-2)'}`}>
          {kind === 'missed' ? '마감됐어요' : `마감 ${fmtDateTime(a.deadline)}${kind === 'todo' ? ` · ${remaining(a.deadline)}` : ''}`}
        </span>
      </span>
    </a>
  );

  return (
    <>
      <StudentBar student={student} />
      <main class="page narrow">
        <h1 class="title-kid">내 과제</h1>
        <ErrorNote error={error} />
        {list === null && !error && <Loading />}
        {list && (
          <>
            <section class="stack">
              <h2 class="label">해야 할 과제 {todo.length}</h2>
              {todo.length ? todo.map((a) => card(a, 'todo')) : <p class="card muted">지금 해야 할 과제가 없어요.</p>}
            </section>
            {done.length > 0 && <section class="stack"><h2 class="label">낸 과제 {done.length}</h2>{done.map((a) => card(a, 'done'))}</section>}
            {missed.length > 0 && <section class="stack"><h2 class="label">마감된 과제</h2>{missed.map((a) => card(a, 'missed'))}</section>}
          </>
        )}
        <Tip title="쓰던 내용은 어디에 저장되나요?">
          <ul>
            <li>쓰는 동안 이 기기에 저장돼요. 화면을 닫았다가 다시 열어도 이어서 쓸 수 있어요.</li>
            <li>‘선생님께 내기’를 눌러야 선생님이 볼 수 있어요.</li>
            <li>마감 전에는 고쳐서 다시 낼 수 있어요.</li>
          </ul>
        </Tip>
        <section class="card stack" style="align-items:flex-start">
          <p style="font-weight:800">여러 명이 함께 쓰는 기기인가요?</p>
          <p class="small muted">다 쓴 뒤 이 기기에서 내 번호와 쓰던 내용을 지워요. 이미 낸 답은 선생님께 그대로 있어요.</p>
          <button type="button" class="btn" onClick={async () => { if (confirm('이 기기에서 내 번호와 쓰던 내용을 지울까요?')) { await clearStudentDevice(setStudent); go('/'); } }}>이 기기에서 지우기</button>
        </section>
      </main>
    </>
  );
}
