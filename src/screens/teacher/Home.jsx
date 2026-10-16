import { useEffect, useState } from 'preact/hooks';
import { newDeviceId } from '../../lib/db.js';
import { loadUnit, saveUnit as saveUnitRec } from '../../lib/records.js';
import { api } from '../../lib/api.js';
import { fmtDateTime, remaining } from '../../lib/format.js';
import { STAGES } from '../../content/guides.js';
import { STRATEGIES, byId, recommendedFor, StrategyArt } from '../../strategies/index.jsx';
import { Tip, Donut, Dialog, ErrorNote } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';

const EMPTY_UNIT = { name: '', subject: '', lens: '', concepts: [], generalization: '', questions: { factual: '', conceptual: '', debatable: '' }, stage: 'connect' };

export function TeacherHome(props) {
  const { room } = props;
  const [unit, setUnit] = useState(undefined);
  const [editing, setEditing] = useState(null); // 고칠 단원 (새 단원이면 빈 단원)
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setUnit(undefined); setList(null); setError(null);
    loadUnit(room.id).then(setUnit);
    api.listAssignments(room).then((r) => setList(r.assignments)).catch(setError);
  }, [room.id]);

  const freshUnit = () => ({ ...EMPTY_UNIT, id: newDeviceId(), startedAt: Date.now() });
  const saveUnit = async (u) => { const next = u.id ? u : { ...u, id: newDeviceId(), startedAt: Date.now() }; await saveUnitRec(room.id, next); setUnit(next); };
  const startNewUnit = () => {
    if (!confirm('지금 단원을 마치고 새 단원을 시작할까요? 지금까지의 기록은 보관함에 이 단원 이름으로 그대로 남아요.')) return;
    setEditing(freshUnit());
  };
  const stageIdx = STAGES.findIndex((s) => s.id === (unit?.stage || 'connect'));
  const stage = STAGES[stageIdx < 0 ? 0 : stageIdx];
  const forStage = recommendedFor(stage.id);
  const shown = showAll || forStage.length === 0 ? STRATEGIES : forStage;

  return (
    <>
      <TeacherBar {...props} current="home" />
      <main class="page">
        {unit === undefined ? null : unit === null ? (
          <section class="card" style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;padding:32px">
            <div class="stack" style="flex:999 1 420px;gap:10px">
              <span class="eyebrow">수업 설계</span>
              <h1 class="title-lg">단원을 설계하고 탐구를 시작해요</h1>
              <p class="muted">단원 탭은 수업을 제대로 설계하고 시작할 때 쓰는 곳이에요. 단원 이름, 개념 렌즈, 핵심 개념, 안내 질문을 정해 두면 탐구 단계마다 알맞은 사고전략을 추천받고, 개념 단어가 활동지에 저절로 채워져요. 낸 과제는 보관함에서 이 단원 아래 단계별로 모여요.</p>
              <p class="small muted">설계 없이 수업 중에 바로 칠판에 띄우고 싶다면 <a href="#/t/tools" style="font-weight:700">도구 모음</a>을 써 보세요. 단원 정보는 이 기기에만 저장돼요.</p>
              <div class="row" style="margin-top:6px"><button type="button" class="btn big dark" onClick={() => setEditing(freshUnit())}>단원 설계하기</button></div>
            </div>
            <HeroArt />
          </section>
        ) : (
          <section style="display:flex;flex-wrap:wrap;background:#fff;border-radius:24px;overflow:hidden;border:1px solid var(--line)">
            <div style="flex:999 1 520px;min-width:0;padding:36px 40px;display:flex;flex-direction:column;gap:26px">
              <div class="stack" style="gap:10px">
                <span class="eyebrow">{unit.subject ? `${unit.subject} · ` : ''}지금 단원</span>
                <h1 class="title-xl">{unit.name}</h1>
                <div class="row muted" style="gap:6px 16px;font-size:14px">
                  {unit.lens && <span>개념 렌즈 <strong style="color:var(--ink)">{unit.lens}</strong></span>}
                  {unit.concepts.length > 0 && <span>핵심 개념 <strong style="color:var(--ink)">{unit.concepts.join(' · ')}</strong></span>}
                </div>
              </div>
              {unit.generalization && (
                <div class="stack" style="gap:8px;padding-left:18px;border-left:3px solid var(--butter)">
                  <span class="label">일반화</span>
                  <p style="font-size:21px;line-height:1.5;font-weight:700;letter-spacing:-0.03em">{unit.generalization}</p>
                </div>
              )}
              <div class="row">
                <button type="button" class="btn dark" onClick={() => setEditing(unit)}>단원 고치기</button>
                <button type="button" class="btn" onClick={startNewUnit}>새 단원 시작하기</button>
                <a class="btn ghost" href={`#/t/archive/u/${unit.id}`}>이 단원 기록 보기</a>
              </div>
            </div>
            <HeroArt panel />
          </section>
        )}

        {unit && (unit.questions.factual || unit.questions.conceptual || unit.questions.debatable) && (
          <section class="stack" style="gap:16px">
            <h2 class="label">안내 질문</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
              {[['factual', '사실적', '#3355FF', 'border-radius:999px'], ['conceptual', '개념적', '#FF6B3D', 'border-radius:3px'], ['debatable', '논쟁적', '#E8B400', 'border-radius:0;transform:rotate(45deg)']]
                .filter(([k]) => unit.questions[k])
                .map(([k, name, color, shape]) => (
                  <div key={k} class="card" style="display:flex;flex-direction:column;gap:14px">
                    <span class="row small" style="gap:8px;font-weight:800;color:var(--ink-2)"><span aria-hidden="true" style={`width:10px;height:10px;background:${color};${shape}`} />{name}</span>
                    <p style="font-size:17px;font-weight:700;line-height:1.5;letter-spacing:-0.03em">{unit.questions[k]}</p>
                  </div>
                ))}
            </div>
          </section>
        )}

        <Tip title="단원 탭과 도구 모음은 무엇이 다른가요?">
          <ul>
            <li><strong>단원</strong>: 단원을 미리 설계하고, 관계맺기부터 평가하기까지 탐구 단계를 따라가며 과제를 내요. 낸 과제는 보관함에서 <strong>단원 → 탐구 단계 → 과제</strong> 순서로 모여요.</li>
            <li><strong>도구 모음</strong>: 설계 없이 수업 중 언제든 사고전략을 꺼내 칠판에 띄우고 함께 채워요. 단원 밖 수업으로 날짜순 정리돼요.</li>
            <li>지금 탐구 단계를 바꿔 두면, 여기서 내는 과제가 그 단계에 정리돼요.</li>
          </ul>
        </Tip>

        <section class="stack" style="gap:16px">
          <div class="row between">
            <h2 class="label">탐구 단계</h2>
            <span class="small muted">단계를 누르면 그 단계에 맞는 전략이 아래에 보여요</span>
          </div>
          <nav class="card stage-map" style="padding:0" aria-label="탐구 단계">
            <div class="stage-map-in">
              <span class="stage-map-line" aria-hidden="true" />
              {STAGES.map((s, i) => (
                <button key={s.id} type="button" class={'stage' + (i < stageIdx ? ' done' : '')} aria-current={i === stageIdx ? 'step' : undefined}
                  onClick={() => saveUnit({ ...(unit || EMPTY_UNIT), stage: s.id })}>
                  <span class="dot" aria-hidden="true">{i < stageIdx ? '✓' : i + 1}</span>
                  <span class="name">{s.name}</span>
                </button>
              ))}
            </div>
          </nav>
          <Tip title={`${stage.name} 단계는 무엇을 하나요?`} tone="blue"><p>{stage.help}</p></Tip>
        </section>

        <section class="split">
          <div class="main stack" style="gap:16px">
            <div class="row between">
              <h2 class="title-md">{showAll || forStage.length === 0 ? '모든 전략' : `${stage.name}에 쓰기 좋은 전략`}</h2>
              {forStage.length > 0 && <button type="button" class="btn ghost" onClick={() => setShowAll(!showAll)}>{showAll ? '이 단계 전략만' : '모든 전략'}</button>}
            </div>
            {forStage.length === 0 && <p class="notice info">이 단계에 맞춘 전략은 다음 버전에서 더해져요. 지금은 아래 전략을 자유롭게 써 보세요.</p>}
            <div class="grid-cards">
              {shown.map((s) => (
                <a key={s.id} href={`#/t/new/${s.id}?from=unit`} class="card" style="padding:8px;text-decoration:none;color:inherit;display:flex;flex-direction:column">
                  <StrategyArt id={s.id} />
                  <span style="padding:16px 12px 12px;display:flex;flex-direction:column;gap:6px">
                    <span style="font-weight:800;font-size:17px;letter-spacing:-0.03em">{s.name}</span>
                    <span class="small muted" style="line-height:1.55">{s.summary}</span>
                    <span class="small" style="color:var(--blue);font-weight:700;margin-top:4px">준비하기 →</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <aside class="side stack" style="gap:16px">
            <h2 class="title-md">진행 중인 과제</h2>
            <ErrorNote error={error} />
            {error && /다시 들어와/.test(error.message) && <a class="btn primary" href="#/t/start">교실 이름과 비밀번호로 다시 들어오기</a>}
            {list === null && !error && <p class="muted">불러오는 중…</p>}
            {list && list.length === 0 && <p class="card muted">아직 낸 과제가 없어요. 왼쪽에서 사고전략을 골라 준비해 보세요.</p>}
            {list && list.map((a) => (
              <a key={a.id} href={`#/t/a/${a.id}`} class="card" style="text-decoration:none;color:inherit;display:flex;align-items:center;gap:18px;padding:20px 22px">
                <Donut value={a.submitted} total={room.size} label={`${room.size}명 중 ${a.submitted}명 제출`} />
                <span class="stack" style="gap:3px;min-width:0">
                  <span style="font-weight:800;font-size:17px;letter-spacing:-0.03em">{a.title}</span>
                  <span class="small muted">{byId[a.strategy]?.name} · {room.size}명 중 {a.submitted}명 제출</span>
                  <span class="small" style={`font-weight:700;color:${a.deadline < Date.now() ? 'var(--ink-2)' : 'var(--orange-text)'}`}>
                    {a.deadline < Date.now() ? `마감됨 · ${fmtDateTime(a.expires_at)}까지 보관` : `마감 ${fmtDateTime(a.deadline)} · ${remaining(a.deadline)}`}
                  </span>
                </span>
              </a>
            ))}
            <p class="small muted">제출물은 마감 후 14일 동안만 서버에 있어요. ‘모두 받기’로 받아 두면 이 기기의 보관함에 남아요.</p>
          </aside>
        </section>
      </main>
      {editing && <UnitDialog unit={editing} isNew={editing !== unit} onClose={() => setEditing(null)} onSave={async (u) => { await saveUnit(u); setEditing(null); }} />}
    </>
  );
}

function HeroArt({ panel }) {
  const abs = (s) => `position:absolute;${s}`;
  return (
    <div aria-hidden="true" style={panel ? 'flex:1 1 320px;min-height:280px;background:#3355FF;position:relative;overflow:hidden' : 'flex:1 1 220px;height:180px;border-radius:24px;background:#3355FF;position:relative;overflow:hidden'}>
      <span style={abs('right:-60px;top:-60px;width:240px;height:240px;border-radius:999px;background:#FFD43B')} />
      <span style={abs('left:40px;bottom:0;width:160px;height:80px;border-radius:160px 160px 0 0;background:#FF6B3D')} />
      <span style={abs('left:48px;top:44px;width:56px;height:56px;border-radius:16px;background:#fff')} />
      <span style={abs('left:116px;top:44px;width:56px;height:56px;border-radius:16px;border:3px solid #fff')} />
      {panel && <span style={abs('right:48px;bottom:48px;width:88px;height:88px;border-radius:0 0 0 88px;background:#2BB673')} />}
    </div>
  );
}

function UnitDialog({ unit, isNew, onClose, onSave }) {
  const [u, setU] = useState({ ...unit, questions: { ...unit.questions } });
  const [concepts, setConcepts] = useState(unit.concepts.join(', '));
  const field = (key, label, placeholder, hint) => (
    <div class="field">
      <label for={'u-' + key}>{label}</label>
      <input id={'u-' + key} class="input" value={u[key]} placeholder={placeholder} onInput={(e) => setU({ ...u, [key]: e.currentTarget.value })} />
      {hint && <span class="hint">{hint}</span>}
    </div>
  );
  const q = (key, label, placeholder) => (
    <div class="field">
      <label for={'uq-' + key}>{label}</label>
      <input id={'uq-' + key} class="input" value={u.questions[key]} placeholder={placeholder} onInput={(e) => setU({ ...u, questions: { ...u.questions, [key]: e.currentTarget.value } })} />
    </div>
  );
  const save = (e) => {
    e.preventDefault();
    onSave({ ...u, name: u.name.trim() || '이름 없는 단원', concepts: concepts.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean) });
  };
  return (
    <Dialog title={isNew ? '새 단원 설계하기' : '단원 고치기'} onClose={onClose} wide>
      <form class="stack-lg" onSubmit={save}>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">
          {field('name', '단원 이름', '예: 동물의 생활')}
          {field('subject', '학년과 과목', '예: 3학년 과학')}
        </div>
        {field('lens', '개념 렌즈', '예: 다양성', '단원 전체를 꿰뚫어 보는 큰 개념이에요. (예: 변화, 관계, 다양성, 상호작용)')}
        <div class="field">
          <label for="u-concepts">핵심 개념</label>
          <input id="u-concepts" class="input" value={concepts} placeholder="예: 특징, 분류, 서식지, 적응" onInput={(e) => setConcepts(e.currentTarget.value)} />
          <span class="hint">쉼표로 나눠 쓰세요. 일반화 문장 만들기에서 학생이 고르는 개념 단어로 쓰여요.</span>
        </div>
        <div class="field">
          <label for="u-gen">이 단원의 일반화 (선생님이 목표로 하는 문장)</label>
          <textarea id="u-gen" class="textarea" rows="2" value={u.generalization} placeholder="예: 동물은 생김새와 생활 방식의 공통점에 따라 무리 지을 수 있다." onInput={(e) => setU({ ...u, generalization: e.currentTarget.value })} />
        </div>
        <Tip title="안내 질문은 어떻게 쓰나요?">
          <ul>
            <li><strong>사실적 질문</strong>: 답이 정해져 있는 질문. 사례를 확인해요.</li>
            <li><strong>개념적 질문</strong>: 여러 사례에 통하는 ‘왜, 어떻게’를 묻는 질문. 일반화로 이어져요.</li>
            <li><strong>논쟁적 질문</strong>: 정답이 하나가 아니라 근거를 들어 토론하는 질문.</li>
          </ul>
        </Tip>
        {q('factual', '사실적 질문 (선택)', '예: 곤충의 몸은 몇 부분으로 나뉘나요?')}
        {q('conceptual', '개념적 질문 (선택)', '예: 우리는 왜 동물을 무리 지어 분류할까요?')}
        {q('debatable', '논쟁적 질문 (선택)', '예: 모든 동물을 한 가지 기준으로 나눌 수 있을까요?')}
        <div class="row" style="justify-content:flex-end">
          <button type="button" class="btn" onClick={onClose}>취소</button>
          <button class="btn primary">저장하기</button>
        </div>
      </form>
    </Dialog>
  );
}
