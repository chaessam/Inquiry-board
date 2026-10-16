import { useState } from 'preact/hooks';
import { byId } from '../../strategies/index.jsx';
import { fmtDateTime } from '../../lib/format.js';

// 번호별 제출 격자 + 고른 학생의 결과물 (제출 현황과 보관함이 함께 써요)
export function Board({ assignment, submissions, size, roster = [], projector }) {
  const [sel, setSel] = useState(() => submissions[0]?.number || 1);
  const [which, setWhich] = useState(0);
  const s = byId[assignment.strategy];

  const byNum = {};
  for (const sub of submissions) (byNum[sub.number] ||= []).push(sub);
  const count = Object.keys(byNum).length;
  const resub = Object.values(byNum).filter((l) => l.some((x) => x.revisions > 0)).length;
  const dups = Object.keys(byNum).filter((n) => byNum[n].length > 1).map(Number);
  const name = (n) => (projector ? '' : roster[n - 1] || '');

  const mine = byNum[sel] || [];
  const cur = mine[Math.min(which, mine.length - 1)];

  return (
    <div class={'stack-lg' + (projector ? ' projector' : '')}>
      <section class="row" style="gap:12px;align-items:stretch">
        <div class="card" style="flex:2 1 420px;display:flex;flex-wrap:wrap;align-items:center;gap:28px">
          <Ring size={size} count={count} resub={resub} />
          <div style="display:grid;grid-template-columns:auto auto;column-gap:28px;row-gap:10px;align-items:baseline">
            <Legend color="#3355FF" label="제출" value={count - resub} />
            <Legend color="#FF6B3D" label="다시 제출" value={resub} />
            <Legend outline label="아직" value={Math.max(0, size - count)} />
          </div>
        </div>
        {dups.length > 0 && (
          <p class="notice warn" style="flex:1 1 260px;margin:0;align-items:center">
            <span aria-hidden="true" style="flex:none;width:24px;height:24px;border-radius:999px;background:#C9461A;color:#fff;display:grid;place-items:center;font-weight:800">!</span>
            <span><strong>{dups.join(', ')}번</strong>이 다른 기기에서도 같은 번호로 제출했어요. 두 답 모두 보관해 두었어요.</span>
          </p>
        )}
      </section>

      <section class="split">
        <div class="main stack">
          <div class="row between">
            <h2 class="title-md">번호별 제출</h2>
            {!projector && <span class="small muted">이름은 이 기기의 명렬표에서만 보여요</span>}
          </div>
          <div class="tiles">
            {Array.from({ length: size }, (_, i) => i + 1).map((n) => {
              const l = byNum[n];
              const st = !l ? 'm' : l.some((x) => x.revisions > 0) ? 'r' : 's';
              return (
                <button key={n} type="button" class={'ntile' + (st === 'm' ? ' missing' : '')} aria-pressed={sel === n} onClick={() => { setSel(n); setWhich(0); }}>
                  <span class="row between" style="width:100%;flex-wrap:nowrap">
                    <span class="num" style={st === 'm' ? 'color:#8A91A6' : ''}>{n}</span>
                    {l && <span aria-hidden="true" style={`width:10px;height:10px;border-radius:999px;${l.length > 1 ? 'border:2.5px solid #C9461A' : st === 'r' ? 'background:#FF6B3D' : 'background:#3355FF'}`} />}
                  </span>
                  <span class="who">{name(n)}</span>
                  <span class="state" style={`color:${st === 'm' ? 'var(--ink-3)' : st === 'r' ? 'var(--orange-text)' : 'var(--blue-text)'}`}>{st === 'm' ? '아직' : st === 'r' ? '다시 제출' : '제출'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside class="card side stack-lg">
          <div class="row" style="gap:14px;flex-wrap:nowrap">
            <span aria-hidden="true" style="flex:none;width:48px;height:48px;border-radius:14px;background:#FFD43B;color:#3D2E00;display:grid;place-items:center;font-family:var(--font-kid);font-size:22px">{sel}</span>
            <div class="stack" style="gap:0">
              <h2 class="title-md" style="font-size:20px">{name(sel) || `${sel}번`}</h2>
              <span class="small muted">{cur ? `${sel}번 · ${fmtDateTime(cur.submitted_at)}${cur.revisions ? ` · 다시 제출 ${cur.revisions}회` : ''}` : `${sel}번 · 아직 제출 전`}</span>
            </div>
          </div>
          {mine.length > 1 && (
            <div class="row" style="gap:6px" role="tablist" aria-label="기기별 답">
              {mine.map((_, i) => <button key={i} type="button" role="tab" aria-selected={which === i} class={'btn small' + (which === i ? ' dark' : '')} onClick={() => setWhich(i)}>기기 {i + 1}</button>)}
            </div>
          )}
          {cur ? <s.View payload={assignment.payload} content={cur.content} /> : <p class="muted" style="padding:18px;background:var(--ground);border-radius:16px">아직 제출하지 않았어요. 학생 화면에는 ‘해야 할 과제’로 보여요.</p>}
        </aside>
      </section>
    </div>
  );
}

function Ring({ size, count, resub }) {
  const r = 46, c = 2 * Math.PI * r;
  const a = size ? (count - resub) / size : 0;
  const b = size ? resub / size : 0;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={`${size}명 중 ${count}명 제출`} style="flex:none">
      <circle cx="56" cy="56" r={r} fill="none" stroke="#EEF0F5" stroke-width="14" />
      <circle cx="56" cy="56" r={r} fill="none" stroke="#3355FF" stroke-width="14" stroke-dasharray={`${(c * a).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 56 56)" />
      <circle cx="56" cy="56" r={r} fill="none" stroke="#FF6B3D" stroke-width="14" stroke-dasharray={`${(c * b).toFixed(1)} ${c.toFixed(1)}`} stroke-dashoffset={(-c * a).toFixed(1)} transform="rotate(-90 56 56)" />
      <text x="56" y="56" text-anchor="middle" font-size="26" font-weight="800" fill="#161B2E" font-family="Gothic A1, sans-serif">{count}</text>
      <text x="56" y="76" text-anchor="middle" font-size="12" fill="#646B80" font-family="Gothic A1, sans-serif">/ {size}명</text>
    </svg>
  );
}

function Legend({ color, outline, label, value }) {
  return (
    <>
      <span class="row muted" style="gap:10px;flex-wrap:nowrap"><span aria-hidden="true" style={`width:10px;height:10px;border-radius:3px;${outline ? 'border:2px solid #C5CAD8' : `background:${color}`}`} />{label}</span>
      <strong style="font-size:22px;font-weight:800;font-variant-numeric:tabular-nums">{value}</strong>
    </>
  );
}
