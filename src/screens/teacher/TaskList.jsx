import { useEffect, useState } from 'preact/hooks';
import { api } from '../../lib/api.js';
import { prefixed, stageName } from '../../lib/records.js';
import { fmtDateTime, remaining } from '../../lib/format.js';
import { byId, StrategyArt } from '../../strategies/index.jsx';
import { Tip, Donut, ErrorNote, Loading } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';

const FILTERS = [['open', '진행 중'], ['closed', '마감됨'], ['all', '모두']];
const ORIGIN_ALL = '';
const OUTSIDE = 'none';

// 과제: 단원 탭에서 냈든 도구 모음에서 냈든, 낸 과제를 한곳에서 보고 모아 봐요
export function TaskList(props) {
  const { room } = props;
  const [list, setList] = useState(null);
  const [metas, setMetas] = useState({});
  const [received, setReceived] = useState({});
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('open');
  const [origin, setOrigin] = useState(ORIGIN_ALL);

  const load = () => {
    setError(null);
    api.listAssignments(room).then((r) => setList(r.assignments)).catch((e) => { setError(e); setList((l) => l || []); });
  };
  useEffect(() => {
    load();
    Promise.all([prefixed('meta:'), prefixed('archive:')]).then(([ms, ars]) => {
      setMetas(Object.fromEntries(ms.filter((m) => m.assignmentId).map((m) => [m.assignmentId, m])));
      setReceived(Object.fromEntries(ars.map((a) => [a.assignment.id, a.receivedAt])));
    });
  }, [room.id]);

  if (list === null) return <><TeacherBar {...props} current="tasks" /><main class="page"><Loading /></main></>;

  const now = Date.now();
  const originOf = (a) => metas[a.id]?.unitId || OUTSIDE;
  const origins = [];
  for (const a of list) {
    const k = originOf(a);
    if (!origins.some((o) => o.id === k)) origins.push({ id: k, name: k === OUTSIDE ? '도구 모음 · 단원 밖' : metas[a.id].unitName || '이름 없는 단원' });
  }
  const shown = list
    .filter((a) => filter === 'all' || (filter === 'open' ? a.deadline > now : a.deadline <= now))
    .filter((a) => origin === ORIGIN_ALL || originOf(a) === origin);
  const openCount = list.filter((a) => a.deadline > now).length;

  return (
    <>
      <TeacherBar {...props} current="tasks" />
      <main class="page">
        <section class="row between" style="align-items:flex-end">
          <div class="stack" style="gap:8px;max-width:720px">
            <span class="eyebrow">단원에서 낸 과제도, 도구 모음에서 낸 과제도</span>
            <h1 class="title-lg">과제</h1>
            <p class="muted" style="font-size:16px">{room.label}에 낸 과제를 모두 모았어요. <strong style="color:var(--ink)">모아 보기</strong>를 누르면 학생들이 낸 생각이 한 화면에 모여요. 칠판에 띄워 함께 이야기 나누어 보세요.</p>
          </div>
          <div class="row">
            <button type="button" class="btn" onClick={load}>새로고침</button>
            <a class="btn dark" href="#/t/tools">새 과제 내기</a>
          </div>
        </section>

        <Tip title="과제 화면은 이렇게 써요" tone="blue">
          <ul>
            <li><strong>모아 보기</strong>: 반 친구들의 답을 하나로 모아요. 가치수직선은 한 수직선 위에 이름이, 네 모퉁이는 모퉁이마다 이름과 까닭이 떠요.</li>
            <li><strong>한 명씩 보기</strong>: 번호를 눌러 학생 한 명의 답을 자세히 봐요.</li>
            <li>과제는 마감 뒤 14일 동안 서버에 있어요. 그 안에 과제를 열어 ‘모두 받기’를 누르면 보관함에 남아요.</li>
            <li>과제를 어디서 냈는지(단원, 도구 모음)는 이 기기에만 기록돼요. 다른 기기에서 낸 과제는 ‘도구 모음 · 단원 밖’으로 보여요.</li>
          </ul>
        </Tip>
        <ErrorNote error={error} />

        <section class="row" style="gap:12px">
          <div class="seg" role="group" aria-label="마감으로 고르기">
            {FILTERS.map(([k, name]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{name}{k === 'open' ? ` ${openCount}` : ''}</button>)}
          </div>
          {origins.length > 1 && (
            <div class="chip-scroll" role="group" aria-label="낸 곳으로 고르기" style="flex:1 1 300px">
              <button type="button" class="chip chip-btn" aria-pressed={origin === ORIGIN_ALL} onClick={() => setOrigin(ORIGIN_ALL)}>모든 곳</button>
              {origins.map((o) => <button key={o.id} type="button" class="chip chip-btn" aria-pressed={origin === o.id} onClick={() => setOrigin(o.id)}>{o.name}</button>)}
            </div>
          )}
        </section>

        {shown.length === 0 ? (
          <p class="card muted">{list.length === 0 ? '아직 낸 과제가 없어요. 도구 모음이나 단원 탭에서 사고전략을 골라 과제를 내 보세요.' : '이 조건에 맞는 과제가 없어요.'}</p>
        ) : (
          <div class="task-grid">
            {shown.map((a) => {
              const s = byId[a.strategy];
              const m = metas[a.id];
              const closed = a.deadline <= now;
              return (
                <article key={a.id} class="card task-card">
                  <div style="width:96px;flex:none;overflow:hidden" class="task-art"><StrategyArt id={a.strategy} /></div>
                  <div class="stack" style="gap:6px;flex:1 1 240px;min-width:0">
                    <span class="small muted">{s?.name} · {m ? (m.unitId ? `${m.unitName} › ${stageName(m.stage)}` : `단원 밖 › ${stageName(m.stage)}`) : '낸 곳 기록 없음'}</span>
                    <a href={`#/t/a/${a.id}`} class="task-title">{a.title}</a>
                    <span class="small" style={`font-weight:700;color:${closed ? 'var(--ink-2)' : 'var(--orange-text)'}`}>
                      {closed ? `마감됨 · ${fmtDateTime(a.expires_at)}까지 서버에 있어요` : `마감 ${fmtDateTime(a.deadline)} · ${remaining(a.deadline)}`}
                    </span>
                    {received[a.id] && <span class="small" style="color:var(--mint-text);font-weight:700">보관함에 받아 둠</span>}
                    <div class="row" style="gap:8px;margin-top:4px">
                      <a class="btn small primary" href={`#/t/a/${a.id}?view=gather`}>모아 보기</a>
                      <a class="btn small" href={`#/t/a/${a.id}?view=each`}>한 명씩 보기</a>
                    </div>
                  </div>
                  <Donut value={a.submitted} total={room.size} label={`${room.size}명 중 ${a.submitted}명 제출`} />
                </article>
              );
            })}
          </div>
        )}
        <p class="small muted">서버 보관 기간이 지난 과제는 이 목록에서 사라져요. ‘모두 받기’로 받아 둔 과제는 <a href="#/t/archive">보관함</a>에서 계속 모아 볼 수 있어요.</p>
      </main>
    </>
  );
}
