import { useState } from 'preact/hooks';
import { Tip } from '../ui/kit.jsx';
import { FOUR_CORNERS_TIPS as T } from '../content/guides.js';
import { NoteAdder } from './BoardShell.jsx';
import { Quote } from './conceptAttainment.jsx';

export const CORNERS = [
  { name: '매우 찬성', mark: 'border-radius:999px', solid: '#3355FF', soft: '#E8ECFF', text: '#1F3BD1' },
  { name: '찬성', mark: 'border-radius:5px', solid: '#2BB673', soft: '#DDF5E9', text: '#136B41' },
  { name: '반대', mark: 'border-radius:2px;transform:rotate(45deg)', solid: '#E8B400', soft: '#FFF6D1', text: '#6B5300' },
  { name: '매우 반대', mark: 'border-radius:999px 999px 0 0', solid: '#C9461A', soft: '#FFE9E0', text: '#B83C12' }
];
const ROUNDS = ['처음', '토론 뒤'];
const isCorner = (v) => Number.isInteger(v) && v >= 0 && v < 4;
// 찬성 쪽(0, 1)을 고르면 반대 쪽을, 반대 쪽(2, 3)을 고르면 찬성 쪽을 떠올려요
const otherSide = (c) => (c < 2 ? '반대' : '찬성');

export function Mark({ k, size = 14 }) {
  return <span aria-hidden="true" style={`flex:none;width:${size}px;height:${size}px;background:${k.solid};${k.mark}`} />;
}

function Statement({ p }) {
  return <p class="notice info" style="font-size:17px;font-weight:800;line-height:1.5">“{p.statement}”</p>;
}

export const fourCorners = {
  id: 'four-corners',
  name: '네 모퉁이 토론',
  stage: 'connect',
  stages: ['connect', 'generalize', 'transfer'],
  summary: '한 문장을 두고 매우 찬성·찬성·반대·매우 반대 중 내 자리를 골라 서고, 까닭을 나눠요.',
  forTeacher: '생각이 갈릴 만한 문장 하나를 넣어 주세요. 학생은 네 모퉁이 중 하나를 고르기만 해도 낼 수 있고, 까닭과 다른 모퉁이 친구의 생각은 쓰고 싶을 때 써요. 과제로 내면 모아 보기에서 모퉁이마다 학생 이름과 까닭이 모여요. 과제 없이 교실에서 실제로 서게 할 때는 함께 보기에서 모퉁이마다 학생 수를 세어 보세요. 일반화 문장을 넣으면 ‘정말 언제나 맞을까?’를 시험해 보는 활동이 돼요.',

  defaultPayload() {
    return { statement: '', think: '' };
  },

  example() {
    return {
      title: '모든 동물은 사는 곳에 맞는 생김새를 가지고 있을까?',
      statement: '동물의 생김새는 사는 곳에 따라 정해진다.',
      think: '사막여우, 북극곰, 오리처럼 우리가 살펴본 동물들을 떠올려 보세요.'
    };
  },

  validate(p) {
    return p.statement.trim() ? '' : '찬성과 반대를 고를 문장을 써 주세요.';
  },

  Editor({ payload: p, set }) {
    return (
      <div class="stack-lg">
        <div class="field">
          <label for="fc-statement">토론할 문장</label>
          <input id="fc-statement" class="input" value={p.statement} maxLength={100} placeholder="예: 동물의 생김새는 사는 곳에 따라 정해진다."
            onInput={(e) => set({ ...p, statement: e.currentTarget.value })} />
          <span class="hint">질문보다 ‘~이다’, ‘~해야 한다’처럼 찬성·반대를 고를 수 있는 문장이 좋아요.</span>
        </div>
        <div class="field">
          <label for="fc-think">생각할 거리 (선택)</label>
          <input id="fc-think" class="input" value={p.think} placeholder="예: 우리가 살펴본 동물들을 떠올려 보세요."
            onInput={(e) => set({ ...p, think: e.currentTarget.value })} />
          <span class="hint">문장 아래 작은 글씨로 보여요. 근거로 쓸 사례를 짚어 주면 좋아요.</span>
        </div>
      </div>
    );
  },

  emptyAnswer() {
    return { corner: null, reason: '', other: '' };
  },

  useSteps({ payload: p, answer: a, set }) {
    const chosen = isCorner(a.corner) ? CORNERS[a.corner] : null;
    const head = (
      <div class="stack" style="gap:8px">
        <Statement p={p} />
        {p.think && <p class="small muted">{p.think}</p>}
      </div>
    );
    const chosenChip = chosen && (
      <span class="chip" style={`align-self:flex-start;background:${chosen.soft};color:${chosen.text};font-size:16px`}><Mark k={chosen} />{chosen.name}</span>
    );
    return [
      {
        title: '이 문장에 대한 내 생각은?',
        help: '네 모퉁이 가운데 지금 내 생각과 가장 가까운 곳을 하나 골라요.',
        canNext: !!chosen,
        blockedHint: '모퉁이를 하나 골라 주세요.',
        body: (
          <div class="stack-lg">
            {head}
            <div class="corners" role="radiogroup" aria-label="네 모퉁이">
              {CORNERS.map((k, i) => (
                <button key={k.name} type="button" role="radio" aria-checked={a.corner === i} class="corner-pick"
                  style={`background:${a.corner === i ? k.text : k.soft};color:${a.corner === i ? '#fff' : k.text}`}
                  onClick={() => set({ ...a, corner: i })}>
                  <Mark k={a.corner === i ? { ...k, solid: '#fff' } : k} size={18} />{k.name}
                </button>
              ))}
            </div>
          </div>
        ),
        tips: <Tip title="모퉁이 고르는 방법"><ul>{T.pick.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: '왜 그 모퉁이를 골랐나요?',
        help: '내 생각과 근거를 써 보세요. 쓰지 않고 넘어가도 괜찮아요.',
        canNext: true,
        body: (
          <div class="stack-lg">
            {head}
            {chosenChip}
            <div class="field">
              <label for="fc-reason" style="font-size:17px">내가 이 모퉁이를 고른 까닭은 …</label>
              <textarea id="fc-reason" class="textarea kid" rows="4" value={a.reason} placeholder="나는 ~라고 생각해요. 왜냐하면 ~"
                onInput={(e) => set({ ...a, reason: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <Tip title="까닭을 잘 쓰는 방법"><ul>{T.reason.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: `${chosen ? otherSide(a.corner) : '다른'} 쪽 친구는 뭐라고 할까요?`,
        help: '나와 다른 모퉁이에 선 친구라면 어떤 까닭을 말할지 떠올려 써요. 쓰지 않고 내도 괜찮아요.',
        canNext: true,
        body: (
          <div class="stack-lg">
            {head}
            {chosenChip}
            {a.reason.trim() && <Quote label="내 까닭" color={chosen?.solid || '#3355FF'}>{a.reason}</Quote>}
            <div class="field">
              <label for="fc-other" style="font-size:17px">{chosen ? otherSide(a.corner) : '다른'} 쪽 친구는 … 라고 생각할 수 있어요.</label>
              <textarea id="fc-other" class="textarea kid" rows="3" value={a.other} placeholder="~라고 생각할 수도 있어요. 왜냐하면 ~"
                onInput={(e) => set({ ...a, other: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <Tip title="다른 생각 떠올리기"><ul>{T.other.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      }
    ];
  },

  // 함께 보기: 모퉁이마다 학생 수를 세고, 대표 까닭을 붙여요
  Board({ payload: p, answer: a, set }) {
    const [round, setRound] = useState(a.round || 0);
    const counts = a.counts || [[0, 0, 0, 0], [0, 0, 0, 0]];
    const notes = a.notes || [];
    const bump = (i, d) => {
      const next = counts.map((r) => [...r]);
      next[round][i] = Math.max(0, Math.min(99, next[round][i] + d));
      set({ ...a, counts: next, round });
    };
    const total = (r) => counts[r].reduce((x, y) => x + y, 0);
    const changed = total(1) > 0;
    return (
      <div class="stack-lg">
        <div class="stack" style="gap:8px">
          <p class="board-prompt">“{p.statement}”</p>
          {p.think && <p class="muted board-help">{p.think}</p>}
        </div>
        <div class="row no-print" style="gap:8px" role="tablist" aria-label="몇 번째로 섰나요">
          {ROUNDS.map((r, i) => (
            <button key={r} type="button" role="tab" aria-selected={round === i} class={'btn' + (round === i ? ' dark' : '')}
              onClick={() => { setRound(i); set({ ...a, counts, round: i }); }}>{r} 선 자리</button>
          ))}
          <span class="small muted">지금 세는 것: {ROUNDS[round]} · 모두 {total(round)}명</span>
        </div>
        <div class="corners board">
          {CORNERS.map((k, i) => {
            const mine = notes.filter((n) => n.corner === i);
            return (
              <section key={k.name} class="corner" style={`background:${k.soft}`}>
                <div class="row between" style="flex-wrap:nowrap;align-items:flex-start">
                  <h3 class="corner-name" style={`color:${k.text}`}><Mark k={k} size={20} />{k.name}</h3>
                  <div class="corner-count">
                    <button type="button" class="icon-btn no-print" aria-label={`${k.name} 한 명 빼기`} onClick={() => bump(i, -1)}>−</button>
                    <strong aria-live="polite" aria-label={`${k.name} ${counts[round][i]}명`}>{counts[round][i]}<span class="small">명</span></strong>
                    <button type="button" class="icon-btn no-print" aria-label={`${k.name} 한 명 더하기`} onClick={() => bump(i, 1)}>+</button>
                  </div>
                </div>
                {changed && round === 1 && <span class="small" style={`color:${k.text};font-weight:700`}>처음 {counts[0][i]}명 → 토론 뒤 {counts[1][i]}명</span>}
                <ul class="corner-notes">
                  {mine.map((n) => (
                    <li key={n.id}>
                      <span>{n.text}</span>
                      <button type="button" class="btn ghost small no-print" aria-label={`‘${n.text}’ 카드 지우기`} onClick={() => set({ ...a, notes: notes.filter((x) => x.id !== n.id) })}>지우기</button>
                    </li>
                  ))}
                </ul>
                <NoteAdder id={'fc-note-' + i} label={`${k.name} 까닭 붙이기`} compact placeholder="이 모퉁이의 까닭" onAdd={(n) => set({ ...a, notes: [...notes, { ...n, corner: i }] })} />
              </section>
            );
          })}
        </div>
        <Tip title="칠판에서 이렇게 써 보세요"><ul>{T.board.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      </div>
    );
  },

  View({ payload: p, content: a }) {
    const chosen = isCorner(a.corner) ? CORNERS[a.corner] : null;
    const counts = a.counts;
    const notes = a.notes || [];
    const anyCount = counts && counts.some((r) => r.some((n) => n > 0));
    return (
      <div class="stack" style="gap:18px">
        <p class="small muted">“{p.statement}”</p>
        {chosen && <span class="chip" style={`align-self:flex-start;background:${chosen.soft};color:${chosen.text}`}><Mark k={chosen} />{chosen.name}</span>}
        {chosen && <Quote label="고른 까닭" color={chosen.solid}>{a.reason || '—'}</Quote>}
        {chosen && <Quote label={`${otherSide(a.corner)} 쪽 친구의 생각`} color="#C5CAD8">{a.other || '—'}</Quote>}
        {(anyCount || notes.length > 0) && (
          <div class="corners">
            {CORNERS.map((k, i) => (
              <div key={k.name} class="corner" style={`background:${k.soft};min-height:0`}>
                <span class="row" style={`gap:8px;font-weight:800;color:${k.text}`}><Mark k={k} />{k.name}
                  {anyCount && <span style="margin-left:auto">{counts[0][i]}명{counts[1].some((n) => n) ? ` → ${counts[1][i]}명` : ''}</span>}</span>
                {notes.filter((n) => n.corner === i).map((n) => <p key={n.id} class="small" style="font-weight:600">{n.text}</p>)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
};
