import { Tip } from '../ui/kit.jsx';
import { USED_TO_THINK as U } from '../content/guides.js';
import { Quote } from './conceptAttainment.jsx';

const KINDS = ['changed', 'deeper'];
const frameOf = (kind) => U.frames[kind] || U.frames.changed;
const join = (pre, mid, post) => {
  const tail = post.startsWith('~') ? mid + post.slice(1) : [mid, post].filter(Boolean).join(' ');
  return [pre, tail].filter(Boolean).join(' ');
};
const blank = (pre, post) => join(pre, '____', post);
const sentence = (pre, text, post) => join(pre, text.trim().replace(/[.。]$/, ''), post);

// 예전 생각 ↓ 지금 생각 (선생님 제출 현황의 좁은 옆 칸에서도 읽기 쉽게 위아래로)
function BeforeNow({ before, now }) {
  const box = (label, text, bg, color) => (
    <div style={`background:${bg};border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:6px`}>
      <span style={`font-family:var(--font-kid);font-size:20px;line-height:1.2;color:${color}`}>{label}</span>
      <p style="font-size:16px;font-weight:600;white-space:pre-wrap">{text || '—'}</p>
    </div>
  );
  return (
    <div class="stack" style="gap:4px">
      {box('예전 생각', before, 'var(--ground)', 'var(--ink-2)')}
      <span aria-hidden="true" style="align-self:center;font-size:22px;line-height:1;font-weight:800;color:var(--blue)">↓</span>
      {box('지금 생각', now, 'var(--blue-soft)', 'var(--blue-deep)')}
    </div>
  );
}

export const usedToThink = {
  id: 'used-to-think',
  name: '예전 생각·지금 생각',
  stage: 'reflect',
  summary: '배우기 전 생각과 지금 생각을 나란히 쓰고, 무엇이 왜 바뀌었는지 문장 틀로 정리해요.',
  forTeacher: '단원의 큰 질문을 넣어 주세요. 학생은 처음 생각과 지금 생각을 쓰고, 문장 틀로 무엇이 왜 바뀌었는지 정리해요. 생각이 바뀌지 않은 학생은 ‘생각이 더 깊어졌어요’를 골라 쓸 수 있어요. 단원 첫 시간에 쓴 활동지를 함께 꺼내 보게 하면 처음 생각을 떠올리기 쉬워요.',

  defaultPayload(unit) {
    return { question: unit?.questions?.conceptual || '', remind: '' };
  },

  example() {
    return {
      title: '내 생각은 어떻게 자랐을까?',
      question: '동물은 사는 곳에 따라 어떻게 다를까요?',
      remind: '단원 첫 시간에 사막여우 사진을 보고 쓴 생각을 떠올려 보세요.'
    };
  },

  validate(p) {
    return p.question.trim() ? '' : '생각을 돌아볼 질문을 써 주세요.';
  },

  Editor({ payload: p, set }) {
    return (
      <div class="stack-lg">
        <div class="field">
          <label for="ut-question">돌아볼 질문</label>
          <input id="ut-question" class="input" value={p.question} placeholder="예: 동물은 사는 곳에 따라 어떻게 다를까요?"
            onInput={(e) => set({ ...p, question: e.currentTarget.value })} />
          <span class="hint">단원의 개념적 질문을 넣으면 좋아요. 단원 정보에 개념적 질문이 있으면 처음부터 채워져요.</span>
        </div>
        <div class="field">
          <label for="ut-remind">처음 생각 떠올리기 실마리 (선택)</label>
          <input id="ut-remind" class="input" value={p.remind} placeholder="예: 단원 첫 시간에 쓴 활동지를 꺼내 보세요."
            onInput={(e) => set({ ...p, remind: e.currentTarget.value })} />
          <span class="hint">첫 단계에서 노란 상자로 보여요.</span>
        </div>
      </div>
    );
  },

  emptyAnswer() {
    return { before: '', now: '', kind: 'changed', what: '', why: '', still: '' };
  },

  useSteps({ payload: p, answer: a, set }) {
    const f = frameOf(a.kind);
    const question = (
      <div style="background:var(--butter);color:#3D2E00;border-radius:18px;padding:14px 18px;display:flex;flex-direction:column;gap:2px">
        <span class="label" style="color:#5C4700">돌아볼 질문</span>
        <span style="font-family:var(--font-kid);font-size:22px;line-height:1.35">{p.question}</span>
      </div>
    );
    return [
      {
        title: '이 단원을 배우기 전에는 어떻게 생각했나요?',
        help: '틀린 생각이어도 괜찮아요. 처음 떠올렸던 생각을 솔직하게 써 보세요.',
        canNext: a.before.trim().length > 0,
        blockedHint: '처음 생각을 써 주세요.',
        body: (
          <div class="stack-lg">
            {question}
            {p.remind && <p class="notice info"><strong style="flex:none">떠올려 봐요</strong>{p.remind}</p>}
            <div class="field" key="before">
              <label for="ut-before" style="font-size:17px">예전에 나는 … (이)라고 생각했어요.</label>
              <textarea id="ut-before" class="textarea kid" rows="4" value={a.before} placeholder="예전에 나는 …"
                onInput={(e) => set({ ...a, before: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <Tip title="처음 생각 떠올리기"><ul>{U.before.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: '지금은 어떻게 생각하나요?',
        help: '배운 사례와 개념 낱말을 넣어 지금 생각을 써 보세요.',
        canNext: a.now.trim().length > 0,
        blockedHint: '지금 생각을 써 주세요.',
        body: (
          <div class="stack-lg">
            {question}
            <Quote label="예전 생각" color="#C5CAD8">{a.before}</Quote>
            <div class="field" key="now">
              <label for="ut-now" style="font-size:17px">지금 나는 … (이)라고 생각해요.</label>
              <textarea id="ut-now" class="textarea kid" rows="4" value={a.now} placeholder="지금 나는 … 왜냐하면 …"
                onInput={(e) => set({ ...a, now: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <Tip title="지금 생각 쓰기"><ul>{U.now.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: '무엇이 바뀌었는지 정리해요.',
        help: '두 생각을 나란히 보고, 나에게 맞는 문장 틀을 골라 채워 보세요.',
        canNext: a.what.trim().length > 0 && a.why.trim().length > 0,
        blockedHint: '문장 틀의 빈칸 두 곳을 모두 채워 주세요.',
        body: (
          <div class="stack-lg">
            <BeforeNow before={a.before} now={a.now} />
            <div class="stack" style="gap:8px">
              <span class="label">내 생각은 …</span>
              <div class="row" style="gap:8px">
                {KINDS.map((k) => (
                  <button key={k} type="button" class="chip chip-btn" style="font-size:16px;padding:8px 16px"
                    aria-pressed={a.kind === k} onClick={() => set({ ...a, kind: k })}>{U.frames[k].name}</button>
                ))}
              </div>
            </div>
            <div class="field" key="what">
              <label for="ut-what" style="font-size:17px">{blank(...f.what)}</label>
              <textarea id="ut-what" class="textarea kid" rows="2" value={a.what} onInput={(e) => set({ ...a, what: e.currentTarget.value })} />
            </div>
            <div class="field" key="why">
              <label for="ut-why" style="font-size:17px">{blank(...f.why)}</label>
              <span class="hint">어떤 활동, 사례, 친구의 말 덕분이었나요?</span>
              <textarea id="ut-why" class="textarea kid" rows="2" value={a.why} onInput={(e) => set({ ...a, why: e.currentTarget.value })} />
            </div>
            <div class="field" key="still">
              <label for="ut-still" style="font-size:17px">아직 궁금한 점 (선택)</label>
              <textarea id="ut-still" class="textarea kid" rows="2" value={a.still} placeholder="더 알아보고 싶은 것이 있나요?"
                onInput={(e) => set({ ...a, still: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <Tip title="바뀐 점 정리하기"><ul>{U.change.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      }
    ];
  },

  View({ payload: p, content: a }) {
    const f = frameOf(a.kind);
    return (
      <div class="stack" style="gap:18px">
        <p class="small muted">{p.question}</p>
        <BeforeNow before={a.before} now={a.now} />
        <span class={'chip ' + (a.kind === 'deeper' ? 'mint' : 'orange')} style="align-self:flex-start">{f.name}</span>
        <Quote label="달라진 점" color="#3355FF">{a.what ? sentence(f.what[0], a.what, f.what[1]) : '—'}</Quote>
        <Quote label="까닭" color="#FFD43B">{a.why ? sentence(f.why[0], a.why, f.why[1]) : '—'}</Quote>
        {a.still && <Quote label="아직 궁금한 점" color="#FF6B3D">{a.still}</Quote>}
      </div>
    );
  }
};
