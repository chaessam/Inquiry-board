import { useState } from 'preact/hooks';

// 모든 사고전략이 함께 쓰는 학생 활동지 틀: 진행 막대, 단계 안내, 도움말, 이전/다음 버튼
export function WorksheetShell({ steps, step, setStep, onSubmit, submitting, submitLabel = '선생님께 내기', preview }) {
  const cur = steps[step];
  const last = step === steps.length - 1;
  return (
    <div class="stack-lg">
      <div class="segs" style={`--n:${steps.length}`} aria-hidden="true">
        {steps.map((s, i) => <span key={i}><span style={`width:${i < step ? 100 : i === step ? (s.progress ?? 40) : 0}%`} /></span>)}
      </div>
      <article class="card" style="padding:clamp(20px,4vw,32px);border-radius:28px;display:flex;flex-direction:column;gap:24px">
        <div class="row" style="align-items:flex-start;gap:14px;flex-wrap:nowrap">
          <span class="step-badge" aria-hidden="true">{step + 1}</span>
          <div class="stack" style="gap:4px;padding-top:2px">
            <p style="font-size:21px;font-weight:800;line-height:1.4;letter-spacing:-0.04em">{cur.title}</p>
            {cur.help && <p class="muted">{cur.help}</p>}
          </div>
        </div>
        {cur.body}
        {cur.tips}
        <div class="row between" style="border-top:1px solid #EEF0F5;padding-top:24px">
          <button type="button" class="btn big" disabled={step === 0} onClick={() => setStep(step - 1)}>이전</button>
          {last
            ? <button type="button" class="btn big primary" style="min-width:160px" disabled={!cur.canNext || submitting || preview} onClick={onSubmit}>
                {preview ? '미리보기에서는 낼 수 없어요' : submitting ? '내는 중…' : submitLabel}
              </button>
            : <button type="button" class="btn big primary" style="min-width:160px" disabled={!cur.canNext} onClick={() => setStep(step + 1)}>다음</button>}
        </div>
        {!cur.canNext && cur.blockedHint && <p class="hint-line" style="text-align:right;margin-top:-12px">{cur.blockedHint}</p>}
      </article>
    </div>
  );
}

// 낱말 상자에서 낱말을 눌러 글상자 끝에 붙여 넣기
export function appendWord(text, word) {
  const w = word.replace(/^~/, '').trim();
  if (!text) return w;
  return text.replace(/\s*$/, '') + ' ' + w;
}

export function linesToList(text) {
  return String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

// 한 줄에 하나씩 쓰는 목록 입력. 쓰는 동안 빈 줄이 사라지지 않도록 원문을 따로 들고 있어요.
export function ListField({ id, label, hint, list, onChange, rows = 4, placeholder = '한 줄에 하나씩' }) {
  const [raw, setRaw] = useState(list.join('\n'));
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <textarea id={id} class="textarea" rows={rows} value={raw} placeholder={placeholder}
        onInput={(e) => { setRaw(e.currentTarget.value); onChange(linesToList(e.currentTarget.value)); }} />
      {hint && <span class="hint">{hint}</span>}
    </div>
  );
}
