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
import { FileUnder } from './FileUnder.jsx';
import { loadUnit, filingFor, outsideFiling, fileAssignment } from '../../lib/records.js';

export function NewAssignment(props) {
  const { room, strategyId, query } = props;
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
  const [filing, setFiling] = useState(null);
  const [fromLive, setFromLive] = useState(null);
  const from = query?.get('live') ? 'live' : query?.get('from') || '';

  useEffect(() => {
    if (!s) return;
    (async () => {
      const u = await loadUnit(room.id);
      setUnit(u);
      const stageQ = query?.get('stage');
      // 함께 보기에서 왔으면 준비한 질문·카드를 그대로 가져와요
      const live = query?.get('live') ? await store.get('live:' + query.get('live')) : null;
      if (live && live.strategy === s.id) {
        setTitle(live.title || '');
        setPayload(live.payload);
        setFiling(live.filed || outsideFiling(s.stage));
        setFromLive(live);
        return;
      }
      setPayload(s.defaultPayload(u));
      // 도구 모음에서 왔거나 단원이 없으면 ‘단원 밖 수업’, 단원 탭에서 왔으면 지금 단원의 지금 단계
      setFiling(from === 'tools' || !u?.id ? outsideFiling(stageQ || s.stage) : filingFor(u, u.stage));
    })();
  }, [strategyId, room.id]);

  if (!s) return <main class="page"><p>알 수 없는 전략이에요. <a href="#/t">홈으로</a></p></main>;
  if (!payload || !filing) return null;

  const fillExample = () => {
    const { title: t, ...p } = s.example();
    setTitle(t); setPayload(p); setEditorKey(editorKey + 1);
  };

  const problem = !title.trim() ? '과제 제목을 써 주세요.' : s.validate(payload);

  const publish = async () => {
    setBusy(true); setError(null);
    try {
      const r = await api.createAssignment(room, { strategy: s.id, title: title.trim(), payload, deadline: fromLocalInput(deadline) });
      await fileAssignment(r.assignment.id, { ...filing, roomId: room.id, strategy: s.id, title: title.trim(), liveId: fromLive?.id || null });
      setDone(r.assignment);
    } catch (err) { setError(err); }
    setBusy(false);
  };

  const stageName = STAGES.find((x) => x.id === s.stage)?.name;
  const viaTools = from === 'tools' || from === 'live';

  return (
    <>
      <TeacherBar {...props} current={viaTools ? 'tools' : 'home'} />
      <main class="page narrow">
        <div class="row" style="gap:20px;align-items:flex-end">
          <div style="width:200px;flex:none"><StrategyArt id={s.id} /></div>
          <div class="stack" style="gap:8px;flex:1 1 280px">
            <span class="eyebrow">{stageName} · 활동지 만들기</span>
            <h1 class="title-lg">{s.name}</h1>
            <p class="muted">{s.summary}</p>
          </div>
        </div>
        {fromLive && <p class="notice ok" style="margin:0">함께 보기에서 준비한 제목과 내용을 그대로 가져왔어요. 고칠 곳이 있으면 고친 뒤 과제로 내 주세요. 함께 보기 기록은 그대로 남아요.</p>}
        <Tip title={`${s.name}은(는) 이렇게 써요`} tone="blue" open={!fromLive}>
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
          <div class="stack" style="gap:8px">
            <span class="field-label">보관함 정리</span>
            <FileUnder roomId={room.id} value={filing} onChange={setFiling} idPrefix="na" />
            <Tip title="보관함 정리는 왜 하나요?">
              <ul>
                <li>‘모두 받기’로 받아 둔 결과물이 보관함에서 <strong>단원 → 탐구 단계 → 과제</strong> 순서로 모여요.</li>
                <li>단원을 정하지 않고 낸 과제는 ‘단원 밖 수업’에 날짜순으로 정리돼요.</li>
                <li>이 정보는 이 기기에만 저장되고, 학생에게는 보이지 않아요. 나중에 보관함에서 바꿀 수도 있어요.</li>
              </ul>
            </Tip>
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
            <button type="button" class="btn" onClick={() => go(viaTools ? '/t/tools' : '/t')}>{viaTools ? '도구 모음으로' : '단원으로'}</button>
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
