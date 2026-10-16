import { useEffect, useState } from 'preact/hooks';
import { store } from '../../lib/db.js';
import { api } from '../../lib/api.js';
import { go } from '../../lib/router.js';
import { defaultDeadline, toLocalInput, fromLocalInput, fmtDateTime } from '../../lib/format.js';
import { byId, StrategyArt } from '../../strategies/index.jsx';
import { WorksheetShell } from '../../strategies/Shell.jsx';
import { STAGES } from '../../content/guides.js';
import { Tip, Dialog, ErrorNote, QR, joinUrl } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';

export function NewAssignment(props) {
  const { room, strategyId } = props;
  const s = byId[strategyId];
  const [unit, setUnit] = useState(null);
  const [title, setTitle] = useState('');
  const [payload, setPayload] = useState(null);
  const [deadline, setDeadline] = useState(toLocalInput(defaultDeadline()));
  const [editorKey, setEditorKey] = useState(0);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!s) return;
    store.get('unit:' + room.id).then((u) => { setUnit(u); setPayload(s.defaultPayload(u)); });
  }, [strategyId, room.id]);

  if (!s) return <main class="page"><p>알 수 없는 전략이에요. <a href="#/t">홈으로</a></p></main>;
  if (!payload) return null;

  const fillExample = () => {
    const { title: t, ...p } = s.example();
    setTitle(t); setPayload(p); setEditorKey(editorKey + 1);
  };

  const problem = !title.trim() ? '과제 제목을 써 주세요.' : s.validate(payload);

  const publish = async () => {
    setBusy(true); setError(null);
    try {
      const r = await api.createAssignment(room, { strategy: s.id, title: title.trim(), payload, deadline: fromLocalInput(deadline) });
      setDone(r.assignment);
    } catch (err) { setError(err); }
    setBusy(false);
  };

  const stageName = STAGES.find((x) => x.id === s.stage)?.name;

  return (
    <>
      <TeacherBar {...props} current="home" />
      <main class="page narrow">
        <div class="row" style="gap:20px;align-items:flex-end">
          <div style="width:200px;flex:none"><StrategyArt id={s.id} /></div>
          <div class="stack" style="gap:8px;flex:1 1 280px">
            <span class="eyebrow">{stageName} · 활동지 만들기</span>
            <h1 class="title-lg">{s.name}</h1>
            <p class="muted">{s.summary}</p>
          </div>
        </div>
        <Tip title={`${s.name}은(는) 이렇게 써요`} tone="blue" open>
          <p>{s.forTeacher}</p>
          <div class="row"><button type="button" class="btn small" onClick={fillExample}>예시로 채워 보기 (곤충·동물 단원)</button></div>
        </Tip>

        <div class="row" role="tablist" aria-label="보기 바꾸기" style="gap:6px">
          <button type="button" role="tab" aria-selected={!preview} class={'btn small' + (!preview ? ' dark' : '')} onClick={() => setPreview(false)}>준비하기</button>
          <button type="button" role="tab" aria-selected={preview} class={'btn small' + (preview ? ' dark' : '')} onClick={() => setPreview(true)}>학생 화면 미리보기</button>
        </div>

        {preview ? (
          <PreviewPane strategy={s} payload={payload} title={title} />
        ) : (
          <section class="card stack-lg" style="padding:32px">
            <div class="field">
              <label for="na-title">과제 제목</label>
              <input id="na-title" class="input" value={title} maxLength={60} placeholder="학생에게 보이는 제목이에요. 예: 곤충일까, 아닐까?" onInput={(e) => setTitle(e.currentTarget.value)} />
              <span class="hint">질문 모양 제목이 학생의 호기심을 끌어요.</span>
            </div>
            <s.Editor key={editorKey} payload={payload} set={setPayload} unit={unit} />
          </section>
        )}

        <section class="card stack-lg" style="padding:28px 32px">
          <h2 class="title-md">과제로 내기</h2>
          <div class="field" style="max-width:320px">
            <label for="na-deadline">마감</label>
            <input id="na-deadline" class="input" type="datetime-local" value={deadline} onInput={(e) => setDeadline(e.currentTarget.value)} />
            <span class="hint">마감 뒤 14일 동안 제출물을 서버에 보관해요. 그 안에 ‘모두 받기’를 눌러 주세요.</span>
          </div>
          <ErrorNote error={error} />
          <div class="row">
            <button type="button" class="btn big primary" disabled={!!problem || busy} onClick={publish}>{busy ? '내는 중…' : `${room.label}에 과제 내기`}</button>
            {problem && <span class="hint-line">{problem}</span>}
          </div>
        </section>
      </main>

      {done && (
        <Dialog title="과제를 냈어요" wide>
          <p>학생들은 교실 코드로 들어와 ‘내 과제’에서 바로 볼 수 있어요. 아직 들어오지 않은 학생에게 아래 QR을 보여 주세요.</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center">
            <QR text={joinUrl(room.code)} size={180} />
            <div class="stack" style="gap:8px">
              <span class="label">교실 코드</span>
              <strong style="font-size:44px;letter-spacing:0.14em;line-height:1">{room.code}</strong>
              <span class="muted">마감 {fmtDateTime(done.deadline)}</span>
            </div>
          </div>
          <div class="row" style="justify-content:flex-end">
            <button type="button" class="btn" onClick={() => go('/t')}>홈으로</button>
            <button type="button" class="btn primary" onClick={() => go('/t/a/' + done.id)}>제출 현황 보기</button>
          </div>
        </Dialog>
      )}
    </>
  );
}

function PreviewPane({ strategy, payload, title }) {
  const [answer, setAnswer] = useState(strategy.emptyAnswer(payload));
  const [step, setStep] = useState(0);
  const steps = strategy.useSteps({ payload, answer, set: setAnswer });
  const ready = !strategy.validate(payload);
  return (
    <section class="stack-lg" style="background:#E9EBF2;border-radius:28px;padding:clamp(16px,3vw,28px)">
      <p class="small muted">학생이 보게 될 화면이에요. 직접 눌러 볼 수 있지만 저장되거나 제출되지는 않아요.</p>
      <h2 class="title-kid">{title || '(과제 제목)'}</h2>
      {ready
        ? <WorksheetShell steps={steps} step={Math.min(step, steps.length - 1)} setStep={setStep} preview />
        : <p class="notice info">{strategy.validate(payload)} 그러면 미리보기가 보여요.</p>}
    </section>
  );
}
