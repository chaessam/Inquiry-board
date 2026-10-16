import { Tip } from '../ui/kit.jsx';
import { FRAYER_TIPS as T } from '../content/guides.js';

const CELLS = [
  { key: 'definition', name: '정의', ask: '이 개념은 무엇인가요?' },
  { key: 'features', name: '특징', ask: '꼭 있어야 하는 특징은 무엇인가요?' },
  { key: 'examples', name: '예', ask: '이 개념에 해당하는 것을 써 보세요.' },
  { key: 'nonExamples', name: '예가 아닌 것', ask: '비슷해 보이지만 해당하지 않는 것을 써 보세요.' }
];

export const frayer = {
  id: 'frayer',
  name: '프레이어 모델',
  stage: 'focus',
  summary: '정의, 특징, 예, 예가 아닌 것을 네 칸에 정리해요.',
  forTeacher: '가운데 개념을 두고 네 칸을 채우며 개념을 또렷하게 해요. 개념 획득 다음 차시에 쓰면, 학생이 찾은 특징을 정의로 다듬을 수 있어요.',

  defaultPayload() {
    return { concept: '', prompts: { definition: '', features: '', examples: '', nonExamples: '' } };
  },

  example() {
    return {
      title: '곤충을 네 칸에 정리해요',
      concept: '곤충',
      prompts: { definition: '', features: '몸의 생김새를 떠올려 보세요.', examples: '', nonExamples: '곤충처럼 보이지만 곤충이 아닌 동물은?' }
    };
  },

  validate(p) {
    return p.concept.trim() ? '' : '가운데에 둘 개념을 써 주세요.';
  },

  Editor({ payload: p, set }) {
    return (
      <div class="stack-lg">
        <div class="field">
          <label for="fr-concept">가운데 개념</label>
          <input id="fr-concept" class="input" value={p.concept} placeholder="예: 곤충" onInput={(e) => set({ ...p, concept: e.currentTarget.value })} />
        </div>
        <p class="hint-line">칸마다 학생에게 줄 도움 질문을 넣을 수 있어요. 비워 두면 기본 질문이 보여요.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
          {CELLS.map((c) => (
            <div class="field" key={c.key}>
              <label for={'fr-' + c.key}>{c.name} 칸 도움 질문</label>
              <input id={'fr-' + c.key} class="input" value={p.prompts[c.key]} placeholder={c.ask}
                onInput={(e) => set({ ...p, prompts: { ...p.prompts, [c.key]: e.currentTarget.value } })} />
            </div>
          ))}
        </div>
      </div>
    );
  },

  emptyAnswer() {
    return { definition: '', features: '', examples: '', nonExamples: '' };
  },

  useSteps({ payload: p, answer: a, set }) {
    const field = (c, rows = 3) => (
      <div class="field" key={c.key}>
        <label for={'fra-' + c.key} style="font-size:17px">{c.name}</label>
        <span class="hint">{p.prompts[c.key] || c.ask}</span>
        <textarea id={'fra-' + c.key} class="textarea kid" rows={rows} value={a[c.key]} onInput={(e) => set({ ...a, [c.key]: e.currentTarget.value })} />
      </div>
    );
    const filled = (k) => a[k].trim().length > 0;
    const concept = <span class="chip butter" style="font-family:var(--font-kid);font-size:20px;font-weight:400;padding:6px 16px">{p.concept}</span>;
    return [
      {
        title: <>{concept} 은/는 무엇일까요?</>,
        help: '먼저 뜻과 특징을 내 말로 써 보세요.',
        canNext: filled('definition') && filled('features'),
        blockedHint: '정의와 특징을 모두 써 주세요.',
        body: <div class="stack-lg">{field(CELLS[0])}{field(CELLS[1])}</div>,
        tips: (
          <Tip title="정의와 특징 쓰는 법">
            <p><strong>정의</strong></p><ul>{T.definition.map((t) => <li key={t}>{t}</li>)}</ul>
            <p><strong>특징</strong></p><ul>{T.features.map((t) => <li key={t}>{t}</li>)}</ul>
          </Tip>
        )
      },
      {
        title: '예와 예가 아닌 것을 찾아보세요.',
        help: '여러 개면 한 줄에 하나씩 써도 좋아요.',
        canNext: filled('examples') && filled('nonExamples'),
        blockedHint: '예와 예가 아닌 것을 모두 써 주세요.',
        body: <div class="stack-lg">{field(CELLS[2])}{field(CELLS[3])}</div>,
        tips: (
          <Tip title="좋은 예와 ‘예가 아닌 것’ 고르기">
            <ul>{T.examples.map((t) => <li key={t}>{t}</li>)}{T.nonExamples.map((t) => <li key={t}>{t}</li>)}</ul>
          </Tip>
        )
      },
      {
        title: '네 칸을 한눈에 보고 다듬어요.',
        help: '칸을 눌러 바로 고칠 수 있어요. 다 됐으면 선생님께 내요.',
        canNext: CELLS.every((c) => filled(c.key)),
        blockedHint: '네 칸을 모두 채워 주세요.',
        body: (
          <div class="frayer">
            {CELLS.map((c) => (
              <label class="cell" key={c.key} for={'frv-' + c.key}>
                <span class="label">{c.name}</span>
                <textarea id={'frv-' + c.key} rows="3" value={a[c.key]} onInput={(e) => set({ ...a, [c.key]: e.currentTarget.value })}
                  style="border:0;background:transparent;resize:vertical;font-size:16px;line-height:1.6;padding:0;outline-offset:4px" />
              </label>
            ))}
            <span class="center">{p.concept}</span>
          </div>
        ),
        tips: (
          <Tip title="스스로 점검해요">
            <ul>
              <li>정의만 읽어도 무엇인지 알 수 있나요?</li>
              <li>‘예가 아닌 것’이 왜 아닌지, 특징 칸을 보고 설명할 수 있나요?</li>
            </ul>
          </Tip>
        )
      }
    ];
  },

  View({ payload: p, content: a }) {
    return (
      <div class="frayer">
        {CELLS.map((c) => (
          <div class="cell" key={c.key}>
            <span class="label">{c.name}</span>
            <p style="white-space:pre-wrap;font-size:15px">{a[c.key] || '—'}</p>
          </div>
        ))}
        <span class="center" style="font-size:18px;padding:8px 18px">{p.concept}</span>
      </div>
    );
  }
};
