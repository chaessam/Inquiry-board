import { useEffect, useState } from 'preact/hooks';
import { store } from '../../lib/db.js';
import { go } from '../../lib/router.js';
import { fmtDateTime } from '../../lib/format.js';
import { STAGES } from '../../content/guides.js';
import { STRATEGIES, byId, recommendedFor, StrategyArt } from '../../strategies/index.jsx';
import { loadUnit, listLive, createLive, stageName } from '../../lib/records.js';
import { Tip, toast } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';

const ALL = 'all';

// 도구 모음: 단원 설계 없이 수업 중 바로 꺼내 칠판에 띄우는 곳
export function Toolbox(props) {
  const { room } = props;
  const [unit, setUnit] = useState(undefined);
  const [stage, setStage] = useState(null);
  const [lives, setLives] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadUnit(room.id).then((u) => { setUnit(u); setStage((s) => s || u?.stage || ALL); });
    listLive(room.id).then(setLives);
  }, [room.id]);

  const startLive = async (s, st) => {
    if (busy) return;
    setBusy(true);
    const rec = await createLive(room, s, { stage: st === ALL ? s.stage : st, unit });
    go('/t/live/' + rec.id);
  };
  const removeLive = async (r) => {
    if (!confirm(`‘${r.title || byId[r.strategy]?.name}’ 함께 보기 기록을 이 기기에서 지울까요?`)) return;
    await store.del('live:' + r.id);
    setLives(lives.filter((x) => x.id !== r.id));
    toast('함께 보기 기록을 지웠어요.');
  };

  if (unit === undefined || !stage) return <TeacherBar {...props} current="tools" />;

  const cur = STAGES.find((s) => s.id === stage);
  const rec = cur ? recommendedFor(cur.id) : [];
  const others = cur ? STRATEGIES.filter((s) => !rec.includes(s)) : [];
  const assignHref = (s, st) => `#/t/new/${s.id}?from=tools&stage=${st === ALL ? s.stage : st}`;

  return (
    <>
      <TeacherBar {...props} current="tools" />
      <main class="page">
        <section class="stack" style="gap:10px;max-width:760px">
          <span class="eyebrow">수업 중 바로 꺼내 쓰는</span>
          <h1 class="title-lg">도구 모음</h1>
          <p class="muted" style="font-size:16px">단원을 미리 설계하지 않아도 괜찮아요. 사고전략 도구를 골라 <strong style="color:var(--ink)">함께 보기</strong>를 누르면 TV·전자칠판에 크게 띄워 반 친구들과 함께 채울 수 있어요. 채운 내용으로 바로 과제를 낼 수도 있어요.</p>
        </section>

        <Tip title="도구 모음은 이렇게 써요" tone="blue">
          <ul>
            <li><strong>함께 보기</strong>: 선생님이 대표로 화면을 누르며 시범을 보이거나, 반 친구들의 말을 받아 적어 함께 채워요. 학생 기기는 없어도 돼요.</li>
            <li><strong>과제로 내기</strong>: 학생이 각자 기기로 한 단계씩 채워 선생님께 내요. 지금처럼 제출 현황과 보관함으로 이어져요.</li>
            <li>함께 보기 내용은 이 기기에 저절로 저장돼요. 다음 시간에 ‘이어서 보기’로 다시 열 수 있어요.</li>
            <li>아래 단계를 누르면 그 단계에 쓰기 좋은 도구를 추천해요. 추천이 아니어도 언제든 골라 쓸 수 있어요.</li>
          </ul>
        </Tip>

        {lives?.length > 0 && (
          <section class="stack" style="gap:12px">
            <div class="row between">
              <h2 class="title-md">이어서 보기</h2>
              <a href="#/t/archive" class="small" style="font-weight:700">보관함에서 모두 보기 →</a>
            </div>
            <div class="grid-cards">
              {lives.slice(0, 6).map((r) => (
                <div key={r.id} class="card pad-sm stack" style="gap:8px">
                  <span class="small muted">{byId[r.strategy]?.name} · {stageName(r.filed?.stage)}</span>
                  <a href={`#/t/live/${r.id}`} style="font-weight:800;font-size:17px;letter-spacing:-0.03em;color:var(--ink);text-decoration:none">{r.title || byId[r.strategy]?.name}</a>
                  <span class="small muted">{fmtDateTime(r.updatedAt)}에 저장</span>
                  <div class="row" style="gap:8px">
                    <a class="btn small dark" href={`#/t/live/${r.id}`}>이어서 보기</a>
                    <button type="button" class="btn small ghost danger" onClick={() => removeLive(r)}>지우기</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section class="stack" style="gap:14px">
          <h2 class="label">탐구 단계로 고르기</h2>
          <div class="chip-scroll" role="tablist" aria-label="탐구 단계">
            <button type="button" role="tab" class="chip chip-btn" aria-pressed={stage === ALL} aria-selected={stage === ALL} onClick={() => setStage(ALL)}>단계별로 모두 보기</button>
            {STAGES.map((s, i) => (
              <button key={s.id} type="button" role="tab" class="chip chip-btn" aria-pressed={stage === s.id} aria-selected={stage === s.id} onClick={() => setStage(s.id)}>
                {i + 1}. {s.name}{unit?.stage === s.id ? ' · 지금 단원' : ''}
              </button>
            ))}
          </div>
        </section>

        {cur ? (
          <>
            <Tip title={`${cur.name} 단계는 무엇을 하나요?`}><p>{cur.help}</p></Tip>
            <section class="stack" style="gap:16px">
              <h2 class="title-md">{cur.name}에 추천하는 도구</h2>
              <div class="grid-cards">
                {rec.map((s) => <ToolCard key={s.id} s={s} recommended onLive={() => startLive(s, cur.id)} href={assignHref(s, cur.id)} />)}
              </div>
            </section>
            <section class="stack" style="gap:16px">
              <h2 class="title-md">다른 도구도 쓸 수 있어요</h2>
              <div class="grid-cards">
                {others.map((s) => <ToolCard key={s.id} s={s} onLive={() => startLive(s, cur.id)} href={assignHref(s, cur.id)} />)}
              </div>
            </section>
          </>
        ) : (
          STAGES.map((st, i) => (
            <section key={st.id} class="stack" style="gap:12px">
              <div class="stack" style="gap:2px">
                <h2 class="title-md"><span style="color:var(--blue)">{i + 1}</span> {st.name}</h2>
                <p class="small muted">{st.help}</p>
              </div>
              <div class="grid-cards">
                {recommendedFor(st.id).map((s) => <ToolCard key={s.id} s={s} compact onLive={() => startLive(s, st.id)} href={assignHref(s, st.id)} />)}
              </div>
            </section>
          ))
        )}
      </main>
    </>
  );
}

function ToolCard({ s, recommended, compact, onLive, href }) {
  return (
    <div class="card tool-card">
      {!compact && <StrategyArt id={s.id} />}
      <div class="stack" style="gap:6px;padding:12px 10px 4px;flex:1">
        <span class="row" style="gap:8px">
          <span style="font-weight:800;font-size:17px;letter-spacing:-0.03em">{s.name}</span>
          {recommended && <span class="chip mint" style="font-size:12px;padding:2px 8px">추천</span>}
        </span>
        <span class="small muted" style="line-height:1.55">{s.summary}</span>
        {!compact && <span class="small" style="color:var(--ink-3)">잘 맞는 단계: {(s.stages || [s.stage]).map(stageName).join(' · ')}</span>}
      </div>
      <div class="row" style="gap:8px;padding:8px 10px 10px">
        <button type="button" class="btn small primary" onClick={onLive}>함께 보기</button>
        <a class="btn small" href={href}>과제로 내기</a>
      </div>
    </div>
  );
}
