import { useState } from 'preact/hooks';
import { Tip } from '../ui/kit.jsx';
import { DIAMOND_TIPS as T } from '../content/guides.js';
import { ListField } from './Shell.jsx';
import { Quote } from './conceptAttainment.jsx';

// 카드 수에 따른 다이아몬드 모양 (줄마다 칸 수)
const SHAPES = { 4: [1, 2, 1], 9: [1, 2, 3, 2, 1] };
const shapeOf = (p) => SHAPES[p.cards.length] || SHAPES[9];
const rowsOf = (shape) => {
  let at = 0;
  return shape.map((n) => Array.from({ length: n }, () => at++));
};
const sortKo = (a, b) => a.localeCompare(b, 'ko');

function Diamond({ p, slots, renderSlot }) {
  const shape = shapeOf(p);
  const rows = rowsOf(shape);
  const label = 'align-self:center;font-family:var(--font-kid);font-size:17px;line-height:1.2;padding:4px 14px;border-radius:999px';
  return (
    <div class="stack" style="gap:8px">
      <span style={label + ';background:var(--blue);color:#fff'}>▲ {p.top || '가장 중요해요'}</span>
      {rows.map((row, r) => (
        <div key={r} class="diamond-row">
          {row.map((i) => renderSlot(i, slots[i]))}
        </div>
      ))}
      <span style={label + ';background:var(--line);color:var(--ink-2)'}>▼ {p.bottom || '덜 중요해요'}</span>
    </div>
  );
}

export const diamondRank = {
  id: 'diamond-rank',
  name: '다이아몬드 랭킹',
  stage: 'organize',
  summary: '카드를 다이아몬드 모양으로 놓으며 무엇이 더 중요한지 순위를 매겨요.',
  forTeacher: '질문 하나와 카드 9장(처음 하는 반은 4장)을 넣어 주세요. 학생은 가장 중요한 카드를 맨 위에, 가장 덜 중요한 카드를 맨 아래에 놓고 까닭을 써요. 가운데 줄은 ‘비슷하게 중요해요’라서 순서를 하나하나 정하는 부담을 덜어 줘요. 정답이 없는 활동이라 친구와 비교하며 이야기 나누기 좋아요.',

  defaultPayload() {
    return { question: '', cards: [], top: '가장 중요해요', bottom: '덜 중요해요' };
  },

  example() {
    return {
      title: '북극곰에게 가장 도움이 되는 특징은?',
      question: '북극곰이 추운 북극에서 살아가는 데 가장 도움이 되는 특징은 무엇일까요?',
      cards: ['두꺼운 털', '두꺼운 지방층', '하얀 털 색', '넓고 큰 발바닥', '작은 귀', '헤엄을 잘 치는 몸', '날카로운 발톱', '냄새를 잘 맡는 코', '검은 피부'],
      top: '가장 도움이 돼요',
      bottom: '덜 도움이 돼요'
    };
  },

  validate(p) {
    if (!p.question.trim()) return '순위를 매길 질문을 써 주세요.';
    if (!SHAPES[p.cards.length]) return `카드를 9장(또는 4장) 넣어 주세요. 지금 ${p.cards.length}장이에요.`;
    if (new Set(p.cards).size < p.cards.length) return '같은 카드가 두 번 들어 있어요.';
    return '';
  },

  Editor({ payload: p, set }) {
    return (
      <div class="stack-lg">
        <div class="field">
          <label for="dr-question">순위를 매길 질문</label>
          <input id="dr-question" class="input" value={p.question} placeholder="예: 북극곰이 북극에서 살아가는 데 가장 도움이 되는 특징은?"
            onInput={(e) => set({ ...p, question: e.currentTarget.value })} />
          <span class="hint">‘무엇이 가장 ~할까요?’처럼 기준이 드러나는 질문이 좋아요.</span>
        </div>
        <ListField id="dr-cards" label={`카드 · 지금 ${p.cards.length}장`} list={p.cards} rows={9}
          hint="한 줄에 하나씩 9장을 넣으면 1-2-3-2-1 다이아몬드, 4장을 넣으면 1-2-1 작은 다이아몬드가 돼요."
          onChange={(v) => set({ ...p, cards: v })} />
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
          <div class="field">
            <label for="dr-top">맨 위 이름</label>
            <input id="dr-top" class="input" value={p.top} onInput={(e) => set({ ...p, top: e.currentTarget.value })} />
          </div>
          <div class="field">
            <label for="dr-bottom">맨 아래 이름</label>
            <input id="dr-bottom" class="input" value={p.bottom} onInput={(e) => set({ ...p, bottom: e.currentTarget.value })} />
          </div>
        </div>
      </div>
    );
  },

  emptyAnswer(p) {
    return { slots: Array(p?.cards?.length === 4 ? 4 : 9).fill(null), top: '', bottom: '' };
  },

  useSteps({ payload: p, answer: a, set }) {
    // selected: { card, from } · from은 카드가 놓여 있던 칸 번호(카드 상자에서 고르면 null)
    const [selected, setSelected] = useState(null);
    const shape = shapeOf(p);
    const n = shape.reduce((x, y) => x + y, 0);
    const slots = Array.from({ length: n }, (_, i) => (p.cards.includes(a.slots?.[i]) ? a.slots[i] : null));
    const pool = p.cards.filter((c) => !slots.includes(c)).sort(sortKo);
    const placed = n - pool.length;

    const tapSlot = (i) => {
      if (!selected) {
        if (slots[i]) setSelected({ card: slots[i], from: i });
        return;
      }
      if (selected.from === i) { setSelected(null); return; }
      const next = [...slots];
      const there = next[i];
      next[i] = selected.card;
      if (selected.from !== null) next[selected.from] = there; // 칸끼리는 자리 바꾸기, 상자에서 왔으면 원래 카드는 상자로
      set({ ...a, slots: next });
      setSelected(null);
    };
    const backToPool = () => {
      if (selected?.from == null) return;
      const next = [...slots];
      next[selected.from] = null;
      set({ ...a, slots: next });
      setSelected(null);
    };
    const pickPool = (c) => setSelected(selected?.card === c ? null : { card: c, from: null });

    const slotBtn = (i, card) => {
      const on = selected && selected.from === i;
      const target = selected && !on;
      return (
        <button key={i} type="button" class={'slot' + (card ? ' filled' : '') + (target ? ' target' : '')} aria-pressed={on}
          aria-label={card ? `${i + 1}번 칸: ${card}` : `${i + 1}번 칸: 비어 있음`} onClick={() => tapSlot(i)}>
          {card || (target ? '여기에 놓기' : '')}
        </button>
      );
    };

    const topCard = slots[0];
    const bottomCard = slots[n - 1];
    const question = <p class="notice info" style="font-size:16px;font-weight:700">{p.question}</p>;

    return [
      {
        title: '카드를 다이아몬드 모양으로 놓아 보세요.',
        help: '카드를 누르고 빈칸을 누르면 놓여요. 놓은 카드를 누르고 다른 칸을 누르면 자리가 바뀌어요.',
        progress: Math.round(placed / n * 100),
        canNext: placed === n,
        blockedHint: `남은 카드 ${pool.length}장을 모두 놓으면 다음으로 갈 수 있어요.`,
        body: (
          <div class="stack" style="gap:16px">
            {question}
            <div class="dashed" style="padding:16px 18px;display:flex;flex-direction:column;gap:12px">
              <div class="row between">
                <span class="label">카드 상자 {pool.length}</span>
                {selected?.from != null && <button type="button" class="btn small" onClick={backToPool}>‘{selected.card}’ 상자로 돌려놓기</button>}
              </div>
              <div class="row" style="gap:10px;min-height:52px">
                {pool.map((c) => <button key={c} type="button" class="tile" style="font-size:16px" aria-pressed={selected?.card === c} onClick={() => pickPool(c)}>{c}</button>)}
                {pool.length === 0 && <span style="font-weight:700;color:#136B41">다 놓았어요. 자리를 더 바꿔 보거나 다음으로 가요.</span>}
              </div>
            </div>
            <Diamond p={p} slots={slots} renderSlot={slotBtn} />
          </div>
        ),
        tips: <Tip title="카드 놓는 방법"><ul>{T.place.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: '맨 위와 맨 아래에 놓은 까닭을 써요.',
        help: '질문을 다시 읽고, 그 질문에 비추어 까닭을 써 보세요.',
        canNext: a.top.trim().length > 0 && a.bottom.trim().length > 0,
        blockedHint: '두 가지 까닭을 모두 써 주세요.',
        body: (
          <div class="stack-lg">
            {question}
            <Diamond p={p} slots={slots} renderSlot={(i, c) => <span key={i} class={'slot filled' + (i === 0 || i === n - 1 ? ' strong' : '')}>{c || '—'}</span>} />
            <div class="field">
              <label for="dr-a-top" style="font-size:17px">‘{topCard}’을(를) 맨 위에 놓은 까닭은 …</label>
              <textarea id="dr-a-top" class="textarea kid" rows="3" value={a.top} placeholder="왜냐하면 …"
                onInput={(e) => set({ ...a, top: e.currentTarget.value })} />
            </div>
            <div class="field">
              <label for="dr-a-bottom" style="font-size:17px">‘{bottomCard}’을(를) 맨 아래에 놓은 까닭은 …</label>
              <textarea id="dr-a-bottom" class="textarea kid" rows="3" value={a.bottom} placeholder="왜냐하면 …"
                onInput={(e) => set({ ...a, bottom: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <Tip title="까닭을 잘 쓰는 방법"><ul>{T.reason.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      }
    ];
  },

  View({ payload: p, content: a }) {
    const n = shapeOf(p).reduce((x, y) => x + y, 0);
    const slots = Array.from({ length: n }, (_, i) => a.slots?.[i] || null);
    return (
      <div class="stack" style="gap:18px">
        <p class="small muted">{p.question}</p>
        <Diamond p={p} slots={slots} renderSlot={(i, c) => <span key={i} class={'slot filled small' + (i === 0 || i === n - 1 ? ' strong' : '')}>{c || '—'}</span>} />
        <Quote label={`맨 위 · ${slots[0] || '—'}`} color="#3355FF">{a.top || '—'}</Quote>
        <Quote label={`맨 아래 · ${slots[n - 1] || '—'}`} color="#C5CAD8">{a.bottom || '—'}</Quote>
      </div>
    );
  }
};
