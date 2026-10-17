import { useEffect, useRef, useState } from 'preact/hooks';
import { api } from '../../lib/api.js';
import { store } from '../../lib/db.js';
import { go } from '../../lib/router.js';
import { fmtDateTime } from '../../lib/format.js';
import { byId } from '../../strategies/index.jsx';
import { WorksheetShell } from '../../strategies/Shell.jsx';
import { ErrorNote, Loading } from '../../ui/kit.jsx';
import { StudentBar } from './StudentBar.jsx';
import { clearStudentDevice } from './MyTasks.jsx';

export function DoTask({ student, setStudent, id }) {
  const [a, setA] = useState(undefined);
  const [bank, setBank] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.studentAssignments(student.code, student.number)
      .then((r) => { setBank(r.concepts || []); setA(r.assignments.find((x) => x.id === id) || null); })
      .catch((e) => { setError(e); setA(null); });
  }, [id]);

  if (a === undefined) return <><StudentBar student={student} /><main class="page narrow"><Loading /></main></>;
  if (!a) return (
    <><StudentBar student={student} /><main class="page narrow">
      <ErrorNote error={error || new Error('과제를 찾을 수 없어요. 마감 후 보관 기간이 지났을 수 있어요.')} />
      <a class="btn" href="#/s">내 과제로</a>
    </main></>
  );
  return <Worksheet student={student} setStudent={setStudent} a={a} bank={bank} />;
}

function Worksheet({ student, setStudent, a, bank }) {
  const s = byId[a.strategy];
  const [answer, setAnswer] = useState(null);
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const timer = useRef();

  useEffect(() => {
    Promise.all([store.get('draft:' + a.id), store.get('sent:' + a.id)]).then(([d, sn]) => {
      setAnswer(d?.answer || sn?.answer || s.emptyAnswer(a.payload));
      setStep(d?.step || 0);
      setSent(sn || (a.submitted ? { at: null } : null));
    });
  }, [a.id]);

  const update = (next) => {
    setAnswer(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      store.set('draft:' + a.id, { answer: next, step }).then(() => setSavedAt(Date.now()));
    }, 400);
  };
  const go2 = (n) => { setStep(n); store.set('draft:' + a.id, { answer, step: n }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const closed = a.deadline < Date.now();

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const r = await api.submit(student.code, a.id, { number: student.number, deviceId: student.deviceId, content: answer });
      const rec = { answer, at: r.submittedAt, revisions: r.revisions };
      await store.set('sent:' + a.id, rec);
      await store.del('draft:' + a.id);
      setSent(rec); setEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setError(e); }
    setBusy(false);
  };

  const showDone = sent && !editing;

  return (
    <>
      <StudentBar student={student}>
        <span class="small" style="color:var(--mint-text)">{savedAt ? '이 기기에 저장됨' : ''}</span>
      </StudentBar>
      <main class="page narrow">
        <section class="row between" style="align-items:flex-end;gap:20px">
          <div class="stack" style="gap:8px">
            <a href="#/s" class="small" style="text-decoration:none;font-weight:700">← 내 과제</a>
            <span class="eyebrow">{s.name}</span>
            <h1 class="title-kid">{a.title}</h1>
            <span class="small muted">마감 {fmtDateTime(a.deadline)}</span>
          </div>
          <div aria-hidden="true" style="position:relative;width:132px;height:72px;flex:none">
            <span style="position:absolute;left:0;bottom:0;width:72px;height:36px;border-radius:72px 72px 0 0;background:#FF6B3D" />
            <span style="position:absolute;left:56px;top:0;width:44px;height:44px;border-radius:999px;background:#3355FF" />
            <span style="position:absolute;right:0;bottom:0;width:36px;height:36px;border-radius:10px;background:#FFD43B" />
          </div>
        </section>
        <ErrorNote error={error} />

        {!answer ? <Loading /> : showDone ? (
          <section class="card" style="border-radius:28px;padding:40px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px">
            <div aria-hidden="true" style="position:relative;width:168px;height:112px">
              <span style="position:absolute;left:0;bottom:0;width:88px;height:44px;border-radius:88px 88px 0 0;background:#FFD43B" />
              <span style="position:absolute;right:0;top:8px;width:40px;height:40px;border-radius:12px;background:#FF6B3D;transform:rotate(14deg)" />
              <span style="position:absolute;left:44px;top:0;width:80px;height:80px;border-radius:999px;background:#3355FF;display:grid;place-items:center">
                <svg width="38" height="38" viewBox="0 0 38 38"><path d="M10 20l6 6 12-13" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
            </div>
            <span style="font-family:var(--font-kid);font-size:34px;line-height:1.2">선생님께 냈어요!</span>
            <p class="muted">{sent.at ? `${fmtDateTime(sent.at)}에 냈어요. ` : ''}{closed ? '마감이 지나서 더 고칠 수 없어요.' : `마감(${fmtDateTime(a.deadline)}) 전까지는 고쳐서 다시 낼 수 있어요.`}</p>
            <div class="row" style="justify-content:center">
              {!closed && <button type="button" class="btn big dark" onClick={() => { setEditing(true); setStep(0); }}>고쳐서 다시 내기</button>}
              <a class="btn big" href="#/s">내 과제로</a>
            </div>
            <button type="button" class="btn ghost" onClick={async () => { if (confirm('이 기기에서 내 번호와 쓰던 내용을 지울까요? 낸 답은 선생님께 그대로 있어요.')) { await clearStudentDevice(setStudent); go('/'); } }}>
              이 기기에서 지우기 (여럿이 쓰는 기기라면)
            </button>
          </section>
        ) : closed ? (
          <p class="notice warn">마감이 지나서 낼 수 없어요. 선생님께 말씀드려요.</p>
        ) : (
          <Steps strategy={s} payload={{ ...a.payload, bank }} answer={answer} set={update} step={step} setStep={go2} onSubmit={submit} submitting={busy}
            submitLabel={sent ? '고친 답 다시 내기' : '선생님께 내기'} />
        )}
      </main>
    </>
  );
}

// 전략마다 단계 안에서 훅을 쓰므로, 답을 불러온 뒤에만 그려지는 별도 컴포넌트로 둡니다.
function Steps({ strategy, payload, answer, set, step, ...rest }) {
  const steps = strategy.useSteps({ payload, answer, set });
  return <WorksheetShell steps={steps} step={Math.min(step, steps.length - 1)} {...rest} />;
}
