import { useState } from 'preact/hooks';
import { Tip } from '../ui/kit.jsx';
import { VALUE_LINE_TIPS as T } from '../content/guides.js';
import { ListField } from './Shell.jsx';
import { NoteAdder } from './BoardShell.jsx';
import { Quote } from './conceptAttainment.jsx';

// 수직선의 자리 수 (0: 왼쪽 끝, 3: 가운데, 6: 오른쪽 끝)
const POINTS = 7;
const MID = 3;

function pointLabel(p, i) {
  if (i === 0) return `왼쪽 끝 (${p.left})`;
  if (i === POINTS - 1) return `오른쪽 끝 (${p.right})`;
  if (i === MID) return '가운데';
  return i < MID ? `왼쪽에 가까운 곳 ${MID - i}` : `오른쪽에 가까운 곳 ${i - MID}`;
}

// 양 끝 관점과 일곱 자리. items: [{ key, text, pos, kind: 'card' | 'note' | 'me' }]
export function Line({ p, items, selected, onItem, onPoint }) {
  const at = (i) => items.filter((x) => x.pos === i);
  return (
    <div class="vline">
      <span class="vline-end l">{p.left || '왼쪽 관점'}</span>
      <span class="vline-end r">{p.right || '오른쪽 관점'}</span>
      <div class="vline-track">
        {Array.from({ length: POINTS }, (_, i) => (
          <div key={i} class="vline-col">
            {onPoint ? (
              <button type="button" class={'vline-pt' + (selected ? ' target' : '')} aria-label={selected ? `${pointLabel(p, i)}에 놓기` : pointLabel(p, i)} onClick={() => onPoint(i)}>
                {i === MID ? <span class="vline-mid">가운데</span> : null}
              </button>
            ) : (
              <span class="vline-pt" aria-hidden="true">{i === MID ? <span class="vline-mid">가운데</span> : null}</span>
            )}
            {at(i).map((x) => onItem && x.kind !== 'fixed'
              ? <button key={x.key} type="button" class={'vline-card ' + x.kind} aria-pressed={selected === x.key} aria-label={`${x.text} · ${pointLabel(p, i)}`} onClick={() => onItem(x)}>{x.text}</button>
              : <span key={x.key} class={'vline-card ' + x.kind}>{x.text}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

const cardItems = (p, place) => p.cards.map((c) => ({ key: 'c:' + c, text: c, pos: Number.isInteger(place?.[c]) ? place[c] : null, kind: 'card' }));

export const valueLine = {
  id: 'value-line',
  name: '가치수직선',
  stage: 'connect',
  stages: ['connect', 'transfer', 'reflect'],
  summary: '두 관점을 양 끝에 두고, 의견 카드와 내 생각이 그 사이 어디쯤인지 놓아 보며 까닭을 나눠요.',
  forTeacher: '정답이 하나가 아닌 질문과, 서로 다른 두 관점을 양 끝에 넣어 주세요. 학생은 수직선 위에 내 자리를 정하고 까닭을 써요. 의견 카드를 미리 넣어 두면, 그 의견들이 어디쯤인지 먼저 놓아 보며 생각을 넓혀요. 함께 보기에서는 반 친구들의 의견을 카드로 받아 수직선에 바로 붙일 수 있어요.',

  defaultPayload() {
    return { question: '', left: '', right: '', cards: [] };
  },

  example() {
    return {
      title: '동물원은 동물에게 좋은 곳일까?',
      question: '동물원은 동물에게 도움이 될까요, 해가 될까요?',
      left: '동물에게 도움이 돼요',
      right: '동물에게 해가 돼요',
      cards: ['멸종 위기 동물을 지켜 줄 수 있어요.', '좁은 곳에서 지내면 답답해해요.', '다친 동물을 치료해 줄 수 있어요.', '자연에서 사는 법을 잊어버릴 수 있어요.']
    };
  },

  validate(p) {
    if (!p.question.trim()) return '함께 생각할 질문을 써 주세요.';
    if (!p.left.trim() || !p.right.trim()) return '양 끝에 둘 관점을 모두 써 주세요.';
    if (p.cards.length > 12) return '의견 카드는 12장까지 넣을 수 있어요.';
    if (new Set(p.cards).size < p.cards.length) return '같은 카드가 두 번 들어 있어요.';
    return '';
  },

  Editor({ payload: p, set }) {
    return (
      <div class="stack-lg">
        <div class="field">
          <label for="vl-question">함께 생각할 질문</label>
          <input id="vl-question" class="input" value={p.question} placeholder="예: 동물원은 동물에게 도움이 될까요, 해가 될까요?"
            onInput={(e) => set({ ...p, question: e.currentTarget.value })} />
          <span class="hint">정답이 하나로 정해지지 않는 논쟁적 질문이 잘 맞아요. 단원의 논쟁적 질문을 넣어 보세요.</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">
          <div class="field">
            <label for="vl-left">왼쪽 끝 관점</label>
            <input id="vl-left" class="input" value={p.left} maxLength={30} placeholder="예: 동물에게 도움이 돼요" onInput={(e) => set({ ...p, left: e.currentTarget.value })} />
          </div>
          <div class="field">
            <label for="vl-right">오른쪽 끝 관점</label>
            <input id="vl-right" class="input" value={p.right} maxLength={30} placeholder="예: 동물에게 해가 돼요" onInput={(e) => set({ ...p, right: e.currentTarget.value })} />
          </div>
        </div>
        <ListField id="vl-cards" label={`의견 카드 (선택) · 지금 ${p.cards.length}장`} list={p.cards} rows={4}
          hint="넣으면 학생이 먼저 이 의견들을 수직선에 놓아 본 뒤 내 자리를 정해요. 비워 두면 바로 내 자리를 정해요. 12장까지."
          onChange={(v) => set({ ...p, cards: v })} />
      </div>
    );
  },

  emptyAnswer() {
    return { place: {}, me: null, reason: '', notes: [] };
  },

  useSteps({ payload: p, answer: a, set }) {
    const [selected, setSelected] = useState(null);
    const items = cardItems(p, a.place);
    const pool = items.filter((x) => x.pos === null);
    const placed = items.filter((x) => x.pos !== null);
    const question = <p class="notice info" style="font-size:16px;font-weight:700">{p.question}</p>;

    const pick = (x) => setSelected(selected === x.key ? null : x.key);
    const placeAt = (i) => {
      if (!selected) return;
      set({ ...a, place: { ...a.place, [selected.slice(2)]: i } });
      setSelected(null);
    };

    const cardStep = {
      title: '의견 카드를 수직선 위에 놓아 보세요.',
      help: '카드를 누르고, 그 의견에 어울리는 자리의 동그라미를 눌러요.',
      progress: items.length ? Math.round(placed.length / items.length * 100) : 100,
      canNext: pool.length === 0,
      blockedHint: `남은 카드 ${pool.length}장을 모두 놓으면 다음으로 갈 수 있어요.`,
      body: (
        <div class="stack" style="gap:16px">
          {question}
          <div class="dashed" style="padding:16px 18px;display:flex;flex-direction:column;gap:12px">
            <span class="label">남은 카드 {pool.length}</span>
            <div class="row" style="gap:10px;min-height:52px">
              {pool.map((x) => <button key={x.key} type="button" class="tile" style="font-size:16px" aria-pressed={selected === x.key} onClick={() => pick(x)}>{x.text}</button>)}
              {pool.length === 0 && <span style="font-weight:700;color:#136B41">다 놓았어요. 자리를 더 옮겨 보거나 다음으로 가요.</span>}
            </div>
          </div>
          <Line p={p} items={placed} selected={selected} onItem={pick} onPoint={placeAt} />
        </div>
      ),
      tips: <Tip title="카드 놓는 방법"><ul>{T.cards.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
    };

    const me = a.me === null || a.me === undefined ? [] : [{ key: 'me', text: '나', pos: a.me, kind: 'me' }];
    const meStep = {
      title: '내 생각은 어디쯤인가요?',
      help: '수직선에서 지금 내 생각과 가장 가까운 동그라미를 누르고, 그 자리에 선 까닭을 써요.',
      progress: (a.me !== null && a.me !== undefined ? 50 : 0) + (a.reason.trim() ? 50 : 0),
      canNext: a.me !== null && a.me !== undefined && a.reason.trim().length > 0,
      blockedHint: a.me === null || a.me === undefined ? '수직선에서 내 자리를 골라 주세요.' : '내 자리에 선 까닭을 써 주세요.',
      body: (
        <div class="stack-lg">
          {question}
          <Line p={p} items={[...placed.map((x) => ({ ...x, kind: 'fixed card' })), ...me]} selected="me" onPoint={(i) => set({ ...a, me: i })} />
          <div class="field">
            <label for="vl-reason" style="font-size:17px">내가 이 자리에 선 까닭은 …</label>
            <textarea id="vl-reason" class="textarea kid" rows="3" value={a.reason} placeholder="왜냐하면 …" onInput={(e) => set({ ...a, reason: e.currentTarget.value })} />
          </div>
        </div>
      ),
      tips: <Tip title="내 자리 정하기"><ul>{T.me.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
    };

    return p.cards.length ? [cardStep, meStep] : [meStep];
  },

  // 함께 보기: 반 친구들의 의견을 카드로 붙이고, 함께 자리를 정해요
  Board({ payload: p, answer: a, set }) {
    const [selected, setSelected] = useState(null);
    const notes = a.notes || [];
    const items = [...cardItems(p, a.place), ...notes.map((n) => ({ key: 'n:' + n.id, text: n.text, pos: Number.isInteger(n.pos) ? n.pos : null, kind: 'note' }))];
    const pool = items.filter((x) => x.pos === null);
    const placed = items.filter((x) => x.pos !== null);
    const sel = items.find((x) => x.key === selected);

    const move = (key, pos) => {
      if (key.startsWith('c:')) {
        const place = { ...a.place };
        if (pos === null) delete place[key.slice(2)]; else place[key.slice(2)] = pos;
        set({ ...a, place });
      } else {
        set({ ...a, notes: notes.map((n) => ('n:' + n.id === key ? { ...n, pos } : n)) });
      }
    };
    const pick = (x) => setSelected(selected === x.key ? null : x.key);
    const placeAt = (i) => { if (selected) { move(selected, i); setSelected(null); } };

    return (
      <div class="stack-lg">
        <p class="board-prompt">{p.question}</p>
        <div class="board-panel stack">
          <NoteAdder id="vl-note" label="친구 의견을 카드로 붙여요" onAdd={(n) => { set({ ...a, notes: [...notes, { ...n, pos: null }] }); setSelected('n:' + n.id); }} />
          {(pool.length > 0 || sel) && (
            <div class="row" style="gap:10px;min-height:52px">
              {pool.map((x) => <button key={x.key} type="button" class={'tile' + (x.kind === 'note' ? ' note-tile' : '')} aria-pressed={selected === x.key} onClick={() => pick(x)}>{x.text}</button>)}
            </div>
          )}
          {sel ? (
            <div class="row no-print" style="gap:8px">
              <span class="small" style="font-weight:700">‘{sel.text}’ — 수직선의 동그라미를 누르면 놓여요.</span>
              {sel.pos !== null && <button type="button" class="btn small" onClick={() => { move(sel.key, null); setSelected(null); }}>수직선에서 빼기</button>}
              {sel.kind === 'note' && <button type="button" class="btn small danger" onClick={() => { set({ ...a, notes: notes.filter((n) => 'n:' + n.id !== sel.key) }); setSelected(null); }}>카드 지우기</button>}
            </div>
          ) : pool.length > 0 && <span class="small muted no-print">카드를 누르고 수직선의 동그라미를 누르면 놓여요.</span>}
        </div>
        <Line p={p} items={placed} selected={selected} onItem={pick} onPoint={placeAt} />
        <Tip title="칠판에서 이렇게 써 보세요"><ul>{T.board.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      </div>
    );
  },

  View({ payload: p, content: a }) {
    const notes = (a.notes || []).filter((n) => Number.isInteger(n.pos)).map((n) => ({ key: 'n:' + n.id, text: n.text, pos: n.pos, kind: 'note' }));
    const placed = cardItems(p, a.place).filter((x) => x.pos !== null);
    const me = Number.isInteger(a.me) ? [{ key: 'me', text: '나', pos: a.me, kind: 'me' }] : [];
    return (
      <div class="stack" style="gap:18px">
        <p class="small muted">{p.question}</p>
        <Line p={p} items={[...placed, ...notes, ...me]} />
        {Number.isInteger(a.me) && <Quote label={`내 자리 · ${pointLabel(p, a.me)}`} color="#3355FF">{a.reason || '—'}</Quote>}
      </div>
    );
  }
};
