// 모아 보기: 학생들이 낸 답을 한 화면에 모아요.
// entries: [{ n: 번호, label: 이름 또는 '3번', content: 학생 답 }]  (번호마다 마지막으로 낸 답 하나)
// onBank(word, meaning): 개념 은행에 넣기 (선생님 화면에서만 넘겨요)
import { Line, pointLabel, POINTS, MID } from './valueLine.jsx';
import { CORNERS, Mark } from './fourCorners.jsx';

const has = (v) => typeof v === 'string' && v.trim().length > 0;
const count = (list) => {
  const m = new Map();
  for (const x of list) m.set(x, (m.get(x) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'));
};

// 학생 이름표
export function Who({ children }) {
  return <span class="gname">{children}</span>;
}

// 한 사람의 말 한 줄: 이름표 + 글
function Said({ e, children }) {
  return (
    <li class="said">
      <Who>{e.label}</Who>
      <span class="said-text">{children}</span>
    </li>
  );
}

// 글이 있는 학생만 모아 목록으로
function SaidList({ entries, pick, empty = '아직 쓴 친구가 없어요.' }) {
  const list = entries.filter((e) => has(pick(e.content)));
  if (!list.length) return <p class="small muted">{empty}</p>;
  return <ul class="said-list">{list.map((e) => <Said key={e.n} e={e}>{pick(e.content).trim()}</Said>)}</ul>;
}

// 여러 칸에 나눠 모으기 (보고-생각하고-궁금해하기, 비교 등)
function Columns({ entries, cols }) {
  return (
    <div class="gather-cols" style={`--n:${cols.length}`}>
      {cols.map((c) => (
        <section key={c.key} class="gather-col" style={`background:${c.bg}`}>
          <h3 class="gather-col-name" style={`color:${c.fg}`}>{c.name}</h3>
          <SaidList entries={entries} pick={(a) => a?.[c.key]} />
        </section>
      ))}
    </div>
  );
}

// 많이 고른 것 (낱말 + 몇 명)
function Tally({ title, rows, onBank, bankLabel = '개념 은행에 넣기' }) {
  if (!rows.length) return null;
  return (
    <section class="stack" style="gap:10px">
      <h3 class="label">{title}</h3>
      <div class="row" style="gap:8px">
        {rows.map(([w, n]) => (
          <span key={w} class="tally">
            <strong>{w}</strong><span class="tally-n">{n}명</span>
            {onBank && <button type="button" class="btn ghost small no-print" style="min-height:32px" onClick={() => onBank(w)}>{bankLabel}</button>}
          </span>
        ))}
      </div>
    </section>
  );
}

// ---------- 가치수직선: 한 수직선 위에 학생 이름이 각자 고른 자리에 떠요 ----------
function ValueLineGather({ payload: p, entries }) {
  const placed = entries.filter((e) => Number.isInteger(e.content?.me));
  const items = placed.map((e) => ({ key: 's' + e.n, text: e.label, pos: e.content.me, kind: 'name' }));
  const side = (f) => placed.filter((e) => f(e.content.me)).length;
  const reasons = placed.filter((e) => has(e.content.reason)).sort((a, b) => a.content.me - b.content.me);
  const cards = p.cards || [];
  return (
    <div class="stack-lg">
      <p class="board-prompt">{p.question}</p>
      <Line p={p} items={items} />
      <p class="row small" style="gap:6px 16px;font-weight:700;justify-content:center">
        <span style="color:var(--blue-text)">왼쪽 쪽 {side((i) => i < MID)}명</span>
        <span class="muted">가운데 {side((i) => i === MID)}명</span>
        <span style="color:var(--orange-text)">오른쪽 쪽 {side((i) => i > MID)}명</span>
      </p>
      {reasons.length > 0 && (
        <section class="stack" style="gap:10px">
          <h3 class="label">자리를 고른 까닭</h3>
          <ul class="said-list">
            {reasons.map((e) => <Said key={e.n} e={e}><span class="said-tag">{pointLabel(p, e.content.me)}</span>{e.content.reason.trim()}</Said>)}
          </ul>
        </section>
      )}
      {cards.length > 0 && (
        <section class="stack" style="gap:10px">
          <h3 class="label">의견 카드를 놓은 자리 (몇 명이 어디에 놓았나요)</h3>
          <div class="card-dist">
            {cards.map((c) => {
              const at = Array.from({ length: POINTS }, (_, i) => entries.filter((e) => e.content?.place?.[c] === i).length);
              const max = Math.max(1, ...at);
              return (
                <div key={c} class="card-dist-row">
                  <span class="card-dist-name">{c}</span>
                  <span class="card-dist-bars" aria-label={`${c}: ` + at.map((n, i) => `${pointLabel(p, i)} ${n}명`).join(', ')}>
                    {at.map((n, i) => <span key={i} class={'card-dist-bar' + (n ? '' : ' zero')} style={`--h:${n / max}`} title={`${pointLabel(p, i)} ${n}명`}>{n || ''}</span>)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------- 네 모퉁이: 모퉁이마다 학생 이름과 까닭이 모여요 ----------
function FourCornersGather({ payload: p, entries }) {
  const chosen = entries.filter((e) => Number.isInteger(e.content?.corner) && e.content.corner >= 0 && e.content.corner < 4);
  return (
    <div class="stack-lg">
      <div class="stack" style="gap:8px">
        <p class="board-prompt">“{p.statement}”</p>
        {p.think && <p class="muted board-help">{p.think}</p>}
      </div>
      <div class="corners board">
        {CORNERS.map((k, i) => {
          const mine = chosen.filter((e) => e.content.corner === i);
          return (
            <section key={k.name} class="corner" style={`background:${k.soft}`}>
              <div class="row between" style="flex-wrap:nowrap;align-items:flex-start">
                <h3 class="corner-name" style={`color:${k.text}`}><Mark k={k} size={20} />{k.name}</h3>
                <strong class="corner-total" style={`color:${k.text}`}>{mine.length}<span class="small">명</span></strong>
              </div>
              <div class="row" style="gap:6px">{mine.map((e) => <Who key={e.n}>{e.label}</Who>)}</div>
              {mine.some((e) => has(e.content.reason)) && <SaidList entries={mine} pick={(a) => a.reason} />}
              {mine.some((e) => has(e.content.other)) && (
                <details>
                  <summary class="small" style={`font-weight:800;color:${k.text};cursor:pointer`}>{i < 2 ? '반대' : '찬성'} 쪽 친구의 생각을 떠올린 것 보기</summary>
                  <SaidList entries={mine} pick={(a) => a.other} />
                </details>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---------- 일반화: 많이 고른 개념 + 모두의 일반화 문장 ----------
function GeneralizationGather({ entries }) {
  const picked = count(entries.flatMap((e) => e.content?.picked || []));
  const final = (a) => (has(a?.improved) ? a.improved : a?.draft);
  return (
    <div class="stack-lg">
      <Tally title="많이 고른 개념" rows={picked} />
      <section class="stack" style="gap:10px">
        <h3 class="label">우리 반의 일반화 문장 (다듬은 문장, 없으면 첫 문장)</h3>
        <ul class="said-list big">
          {entries.filter((e) => has(final(e.content))).map((e) => (
            <Said key={e.n} e={e}>
              {final(e.content).trim()}
              {(e.content.picked || []).length > 0 && <span class="said-chips">{e.content.picked.map((c) => <span key={c} class="chip" style="font-size:12px;padding:2px 8px">{c}</span>)}</span>}
            </Said>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- 프레이어: 네 칸에 모두의 생각을 ----------
function FrayerGather({ payload: p, entries, onBank }) {
  const cells = [['definition', '정의'], ['features', '특징'], ['examples', '예'], ['nonExamples', '예가 아닌 것']];
  const defs = entries.filter((e) => has(e.content?.definition));
  return (
    <div class="stack-lg">
      <p class="board-prompt" style="text-align:center">{p.concept}</p>
      <div class="gather-cols" style="--n:2">
        {cells.map(([key, name]) => (
          <section key={key} class="gather-col" style="background:var(--surface);border:1px solid var(--line)">
            <h3 class="gather-col-name">{name}</h3>
            {key === 'definition' && onBank && defs.length > 0 ? (
              <ul class="said-list">
                {defs.map((e) => (
                  <Said key={e.n} e={e}>
                    {e.content.definition.trim()}
                    <button type="button" class="btn ghost small no-print" style="min-height:32px" onClick={() => onBank(p.concept, e.content.definition.trim())}>이 정의로 개념 은행에 넣기</button>
                  </Said>
                ))}
              </ul>
            ) : <SaidList entries={entries} pick={(a) => a?.[key]} />}
          </section>
        ))}
      </div>
    </div>
  );
}

// ---------- 개념 획득: 붙인 이름, 카드를 놓은 자리, 공통점 ----------
function ConceptAttainmentGather({ payload: p, entries, onBank }) {
  const names = count(entries.map((e) => (e.content?.name || '').trim()).filter(Boolean));
  const tests = [...(p.testYes || []), ...(p.testNo || [])];
  return (
    <div class="stack-lg">
      <Tally title="학생들이 붙인 개념 이름" rows={names} onBank={onBank} />
      {p.conceptName && <p class="small muted">선생님이 정한 개념: {p.conceptName}</p>}
      {tests.length > 0 && (
        <section class="stack" style="gap:10px">
          <h3 class="label">카드를 어디에 놓았나요</h3>
          <div class="ca-dist">
            {tests.map((c) => {
              const yes = entries.filter((e) => e.content?.place?.[c] === 'yes').length;
              const no = entries.filter((e) => e.content?.place?.[c] === 'no').length;
              const want = p.testYes.includes(c) ? 'yes' : 'no';
              const off = want === 'yes' ? no : yes;
              return (
                <div key={c} class={'ca-dist-row' + (off ? ' off' : '')}>
                  <strong>{c}</strong>
                  <span style="color:var(--blue-text)">예 {yes}명</span>
                  <span style="color:var(--orange-text)">아니요 {no}명</span>
                  {off > 0 && <span class="small" style="color:#6A2A06">대화 거리</span>}
                </div>
              );
            })}
          </div>
        </section>
      )}
      <section class="stack" style="gap:10px">
        <h3 class="label">찾은 공통점</h3>
        <SaidList entries={entries} pick={(a) => a?.common} />
      </section>
    </div>
  );
}

// ---------- 다이아몬드 랭킹: 카드마다 평균 자리 ----------
const rowOfSlot = (len, i) => (len === 4 ? [0, 1, 1, 2][i] : [0, 1, 1, 2, 2, 2, 3, 3, 4][i]);
function DiamondGather({ payload: p, entries }) {
  const rows = (p.cards || []).map((c) => {
    const ranks = entries.map((e) => {
      const slots = e.content?.slots || [];
      const i = slots.indexOf(c);
      return i >= 0 ? rowOfSlot(slots.length, i) : null;
    }).filter((x) => x !== null);
    const top = entries.filter((e) => e.content?.slots?.[0] === c).length;
    const avg = ranks.length ? ranks.reduce((x, y) => x + y, 0) / ranks.length : 99;
    return { c, avg, top, n: ranks.length };
  }).sort((a, b) => a.avg - b.avg);
  return (
    <div class="stack-lg">
      <p class="board-prompt">{p.question}</p>
      <section class="stack" style="gap:10px">
        <h3 class="label">반 친구들이 중요하게 놓은 순서 (평균 자리)</h3>
        <ol class="rank-list">
          {rows.map((r) => (
            <li key={r.c}>
              <strong>{r.c}</strong>
              <span class="small muted">{r.top ? `맨 위에 놓은 친구 ${r.top}명` : ''}</span>
            </li>
          ))}
        </ol>
      </section>
      <section class="stack" style="gap:10px">
        <h3 class="label">맨 위에 놓은 까닭</h3>
        <ul class="said-list">
          {entries.filter((e) => has(e.content?.top)).map((e) => <Said key={e.n} e={e}><span class="said-tag">{e.content.slots?.[0] || '—'}</span>{e.content.top.trim()}</Said>)}
        </ul>
      </section>
    </div>
  );
}

export const GATHERS = {
  'value-line': ValueLineGather,
  'four-corners': FourCornersGather,
  generalization: GeneralizationGather,
  frayer: FrayerGather,
  'concept-attainment': ConceptAttainmentGather,
  'diamond-rank': DiamondGather,
  'see-think-wonder': ({ entries }) => <Columns entries={entries} cols={[
    { key: 'see', name: '보았어요', bg: 'var(--blue-soft)', fg: 'var(--blue-deep)' },
    { key: 'think', name: '생각해요', bg: 'var(--butter-soft)', fg: 'var(--butter-text)' },
    { key: 'wonder', name: '궁금해요', bg: 'var(--orange-soft)', fg: 'var(--orange-text)' }
  ]} />,
  'compare-cases': ({ entries }) => <Columns entries={entries} cols={[
    { key: 'same', name: '같은 점', bg: 'var(--blue-soft)', fg: 'var(--blue-deep)' },
    { key: 'diff', name: '다른 점', bg: 'var(--orange-soft)', fg: 'var(--orange-text)' },
    { key: 'learned', name: '알게 된 점', bg: 'var(--butter-soft)', fg: 'var(--butter-text)' }
  ]} />,
  'used-to-think': ({ entries }) => <Columns entries={entries} cols={[
    { key: 'before', name: '예전에는 이렇게 생각했어요', bg: 'var(--ground)', fg: 'var(--ink-2)' },
    { key: 'now', name: '지금은 이렇게 생각해요', bg: 'var(--blue-soft)', fg: 'var(--blue-deep)' },
    { key: 'still', name: '아직 궁금한 점', bg: 'var(--orange-soft)', fg: 'var(--orange-text)' }
  ]} />
};
