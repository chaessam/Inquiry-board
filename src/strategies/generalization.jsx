import { Tip } from '../ui/kit.jsx';
import { GENERALIZATION as G } from '../content/guides.js';
import { ListField, appendWord } from './Shell.jsx';
import { Quote } from './conceptAttainment.jsx';

// 일반화 도움말: 동사 상자는 눌러서 글상자에 바로 넣을 수 있어요.
function VerbBox({ onPick }) {
  return (
    <Tip title="일반화에 쓰기 좋은 동사" tone="blue">
      <p>동사를 누르면 글상자 끝에 들어가요.</p>
      {G.verbGroups.map((g) => (
        <div key={g.name} class="stack" style="gap:6px">
          <span class="label">{g.name}</span>
          <div class="row" style="gap:6px">
            {g.verbs.map((v) => <button key={v} type="button" class="chip plain chip-btn" onClick={() => onPick(v)}>{v}</button>)}
          </div>
        </div>
      ))}
    </Tip>
  );
}

function WhatIsTip() {
  return (
    <Tip title="일반화가 뭐예요? 어떻게 써요?">
      <p>{G.what}</p>
      <p><strong>이렇게 시작해 보세요</strong></p>
      <ul>{G.starters.map((s) => <li key={s}>{s}</li>)}</ul>
      <p><strong>힘이 약한 문장을 바꿔 봐요</strong></p>
      <ul>{G.weakToStrong.map((w) => <li key={w.weak}><s style="color:#8A6A00">{w.weak}</s> → {w.strong}</li>)}</ul>
    </Tip>
  );
}

function LevelTip() {
  return (
    <Tip title="한 단계 더 깊게 만드는 법 (수준 1 → 2 → 3)">
      <p>첫 문장에 ‘어떻게?’, ‘왜?’를 물으면 더 구체적인 문장(수준 2)이 돼요. 수준 2 문장에 ‘그래서?’를 물으면 더 넓은 생각(수준 3)으로 이어져요.</p>
      <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px">
        {G.levels.map((l) => (
          <li key={l.level}><strong>{l.level}</strong> {l.text}{l.ask && <><br /><span style="color:#8A6A00">↳ 물어보기: {l.ask}</span></>}</li>
        ))}
      </ol>
    </Tip>
  );
}

function Checklist({ checks = [], onToggle }) {
  return (
    <div class="card pad-sm soft-butter" style="border:0">
      <p style="font-weight:800;margin-bottom:8px">좋은 일반화 점검표</p>
      <div class="stack" style="gap:6px">
        {G.checklist.map((c, i) => (
          <label key={c} class="row" style="gap:10px;flex-wrap:nowrap;align-items:flex-start;min-height:32px;cursor:pointer">
            <input type="checkbox" checked={!!checks[i]} onChange={() => onToggle(i)} style="width:20px;height:20px;margin-top:3px;flex:none" />
            <span>{c}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export const generalization = {
  id: 'generalization',
  name: '일반화 문장 만들기',
  stage: 'generalize',
  summary: '개념 두 개를 골라 관계를 문장으로 쓰고, ‘어떻게? 왜?’로 한 단계 다듬어요.',
  forTeacher: '학생이 개념 단어를 골라 첫 일반화(수준 1)를 쓰고, ‘어떻게? 왜?’ 질문에 답하며 수준 2 문장으로 다듬어요. 동사 상자와 점검표가 함께 보여요.',

  defaultPayload(unit) {
    return { concepts: unit?.concepts?.length ? [...unit.concepts] : [], context: '', minConcepts: 2 };
  },

  example() {
    return {
      title: '동물과 환경, 한 문장으로',
      concepts: ['동물', '환경', '생김새', '생활 방식', '적응', '먹이'],
      context: '사막여우, 북극곰, 오리처럼 우리가 살펴본 동물들을 떠올려 보세요.',
      minConcepts: 2
    };
  },

  validate(p) {
    return p.concepts.length >= 2 ? '' : '개념 단어를 2개 이상 넣어 주세요.';
  },

  Editor({ payload: p, set }) {
    return (
      <div class="stack-lg">
        <ListField id="ge-concepts" label="학생이 고를 개념 단어" list={p.concepts} rows={5}
          hint="단원의 핵심 개념이 처음부터 채워져 있어요. 한 줄에 하나씩, 4~8개가 알맞아요."
          onChange={(v) => set({ ...p, concepts: v })} />
        <div class="field">
          <label for="ge-context">떠올릴 사례 (선택)</label>
          <textarea id="ge-context" class="textarea" rows="2" value={p.context} placeholder="예: 우리가 살펴본 사막여우, 북극곰, 오리를 떠올려 보세요."
            onInput={(e) => set({ ...p, context: e.currentTarget.value })} />
          <span class="hint">학생이 사실(사례)에서 일반화로 올라가도록, 지금까지 다룬 사례를 짚어 주세요.</span>
        </div>
      </div>
    );
  },

  emptyAnswer() {
    return { picked: [], draft: '', how: '', improved: '', checks: [] };
  },

  useSteps({ payload: p, answer: a, set }) {
    const toggle = (c) => {
      const picked = a.picked.includes(c) ? a.picked.filter((x) => x !== c) : [...a.picked, c];
      set({ ...a, picked });
    };
    const enough = a.picked.length >= (p.minConcepts || 2);
    const pickedChips = <div class="row" style="gap:6px">{a.picked.map((c) => <span key={c} class="chip">{c}</span>)}</div>;
    return [
      {
        title: '개념 단어 두 개 이상을 골라, 둘의 관계를 한 문장으로 써 보세요.',
        help: p.context || '지금까지 살펴본 사례를 떠올려 보세요.',
        progress: enough ? (a.draft.trim() ? 100 : 60) : 20,
        canNext: enough && a.draft.trim().length > 0,
        blockedHint: enough ? '첫 문장을 써 주세요.' : '개념 단어를 두 개 이상 골라 주세요.',
        body: (
          <div class="stack-lg">
            <div class="stack" style="gap:8px">
              <span class="label">개념 단어 고르기 · {a.picked.length}개 골랐어요</span>
              <div class="row" style="gap:8px">
                {p.concepts.map((c) => <button key={c} type="button" class="chip chip-btn" style="font-size:16px;padding:8px 16px" aria-pressed={a.picked.includes(c)} onClick={() => toggle(c)}>{c}</button>)}
              </div>
            </div>
            <div class="field">
              <label for="ge-draft" style="font-size:17px">첫 일반화 문장</label>
              <span class="hint">고른 단어가 모두 들어가게 써 보세요. 짧아도 괜찮아요.</span>
              <textarea id="ge-draft" class="textarea kid" rows="3" value={a.draft} placeholder="예: 동물은 환경에 적응한다."
                onInput={(e) => set({ ...a, draft: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <div class="stack" style="gap:10px"><WhatIsTip /><VerbBox onPick={(v) => set({ ...a, draft: appendWord(a.draft, v) })} /></div>
      },
      {
        title: '‘어떻게?’, ‘왜?’ 그럴까요?',
        help: '내 첫 문장에 질문을 던져 보세요. 사례를 근거로 들면 더 좋아요.',
        canNext: a.how.trim().length > 0,
        blockedHint: '질문에 대한 내 생각을 써 주세요.',
        body: (
          <div class="stack-lg">
            <Quote label="내 첫 문장" color="#3355FF">{a.draft}</Quote>
            <div class="field">
              <label for="ge-how" style="font-size:17px">어떻게 그럴까요? 왜 그럴까요?</label>
              <textarea id="ge-how" class="textarea kid" rows="4" value={a.how} placeholder="예: 북극곰은 털이 두꺼워서 추운 곳에서 살 수 있다. 사막여우는 귀가 커서 몸의 열을 내보낸다."
                onInput={(e) => set({ ...a, how: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <LevelTip />
      },
      {
        title: '더 깊은 일반화 문장으로 다시 써 보세요.',
        help: '앞에서 쓴 ‘어떻게, 왜’를 담아 첫 문장을 고쳐 써요. 점검표로 스스로 확인해요.',
        canNext: a.improved.trim().length > 0,
        blockedHint: '다듬은 문장을 써 주세요.',
        body: (
          <div class="stack-lg">
            {pickedChips}
            <Quote label="첫 문장" color="#C5CAD8">{a.draft}</Quote>
            <div class="field">
              <label for="ge-improved" style="font-size:17px">다듬은 일반화 문장</label>
              <textarea id="ge-improved" class="textarea kid" rows="3" value={a.improved}
                onInput={(e) => set({ ...a, improved: e.currentTarget.value })} />
            </div>
            <Checklist checks={a.checks} onToggle={(i) => { const c = [...(a.checks || [])]; c[i] = !c[i]; set({ ...a, checks: c }); }} />
          </div>
        ),
        tips: <div class="stack" style="gap:10px"><VerbBox onPick={(v) => set({ ...a, improved: appendWord(a.improved, v) })} /><LevelTip /></div>
      }
    ];
  },

  View({ content: a }) {
    const done = (a.checks || []).filter(Boolean).length;
    return (
      <div class="stack" style="gap:18px">
        <div class="row" style="gap:6px">{(a.picked || []).map((c) => <span key={c} class="chip">{c}</span>)}</div>
        <Quote label="첫 문장 (수준 1)" color="#C5CAD8">{a.draft || '—'}</Quote>
        <Quote label="어떻게? 왜?" color="#FFD43B">{a.how || '—'}</Quote>
        <Quote label="다듬은 문장 (수준 2)" color="#3355FF">{a.improved || '—'}</Quote>
        <p class="small muted">점검표 {done}/{G.checklist.length} 확인</p>
      </div>
    );
  }
};
