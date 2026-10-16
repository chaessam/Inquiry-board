import { useState } from 'preact/hooks';
import { newDeviceId } from '../lib/db.js';

// 함께 보기(칠판) 화면 틀
// 전략에 Board가 있으면 한 화면 보기로, 없으면 학생 활동지 단계를 칠판 크기로 보여 줘요.
export function BoardBody({ strategy, payload, answer, set, step, setStep }) {
  if (strategy.Board) return <strategy.Board payload={payload} answer={answer} set={set} />;
  return <StepBoard strategy={strategy} payload={payload} answer={answer} set={set} step={step} setStep={setStep} />;
}

// 단계 이름표를 눌러 바로 옮겨 갈 수 있어요. (앞 단계를 다 채운 단계까지만)
function StepBoard({ strategy, payload, answer, set, step, setStep }) {
  const steps = strategy.useSteps({ payload, answer, set });
  const cur = Math.min(step, steps.length - 1);
  const reachable = (i) => steps.slice(0, i).every((x) => x.canNext);
  const s = steps[cur];
  return (
    <div class="stack-lg">
      <div class="board-steps no-print" role="tablist" aria-label="활동 단계">
        {steps.map((x, i) => (
          <button key={i} type="button" role="tab" class="board-step-tab" aria-selected={i === cur} disabled={!reachable(i)} onClick={() => setStep(i)}>
            <span class="step-badge" aria-hidden="true">{i + 1}</span>
            <span class="board-step-name">{x.title}</span>
          </button>
        ))}
      </div>
      <article class="card board-card">
        <div class="stack" style="gap:6px">
          <p class="board-q">{s.title}</p>
          {s.help && <p class="muted board-help">{s.help}</p>}
        </div>
        {s.body}
        <div class="no-print">{s.tips}</div>
        <div class="row between no-print" style="border-top:1px solid #EEF0F5;padding-top:20px">
          <button type="button" class="btn big" disabled={cur === 0} onClick={() => setStep(cur - 1)}>이전 단계</button>
          {cur < steps.length - 1 && (
            <button type="button" class="btn big primary" disabled={!s.canNext} onClick={() => setStep(cur + 1)}>다음 단계</button>
          )}
        </div>
        {!s.canNext && s.blockedHint && cur < steps.length - 1 && <p class="hint-line no-print" style="text-align:right;margin-top:-12px">{s.blockedHint}</p>}
      </article>
    </div>
  );
}

// 칠판에 의견 카드 붙이기: 짧게 쓰고 Enter 또는 ‘붙이기’
export function NoteAdder({ id, label, placeholder = '예: 3번 — 동물이 안전해서 좋아요', onAdd, compact }) {
  const [text, setText] = useState('');
  const add = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onAdd({ id: newDeviceId().slice(0, 10), text: t.slice(0, 120) });
    setText('');
  };
  return (
    <form class={'note-adder no-print' + (compact ? ' compact' : '')} onSubmit={add}>
      <label for={id} class={compact ? 'sr-only' : 'field-label'}>{label}</label>
      <div class="row" style="gap:8px;flex-wrap:nowrap">
        <input id={id} class="input" value={text} maxLength={120} placeholder={placeholder} onInput={(e) => setText(e.currentTarget.value)} />
        <button class="btn primary" style="flex:none" disabled={!text.trim()}>붙이기</button>
      </div>
    </form>
  );
}
