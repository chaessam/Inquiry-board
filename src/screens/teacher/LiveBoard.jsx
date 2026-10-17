import { useEffect, useRef, useState } from 'preact/hooks';
import { store } from '../../lib/db.js';
import { go } from '../../lib/router.js';
import { fmtTime } from '../../lib/format.js';
import { byId } from '../../strategies/index.jsx';
import { BoardBody } from '../../strategies/BoardShell.jsx';
import { Tip, Loading, toast } from '../../ui/kit.jsx';
import { FileUnder } from './FileUnder.jsx';
import { loadBank } from '../../lib/bank.js';

const ZOOMS = [['1', '보통'], ['1.25', '크게'], ['1.5', '아주 크게']];
const readZoom = () => { try { return localStorage.getItem('board-zoom') || '1.25'; } catch { return '1.25'; } };

// 함께 보기: 칠판·TV에 띄워 선생님이 대표로 채우는 화면. 내용은 이 기기에 저절로 저장돼요.
export function LiveBoard(props) {
  const { room, id } = props;
  const [rec, setRec] = useState(undefined);
  const [setup, setSetup] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [boardKey, setBoardKey] = useState(0);
  const [savedAt, setSavedAt] = useState(null);
  const [fs, setFs] = useState(false);
  const [zoom, setZoom] = useState(readZoom);
  const [bank, setBank] = useState([]);
  const wrap = useRef();
  const timer = useRef();
  const latest = useRef();

  useEffect(() => {
    store.get('live:' + id).then((r) => {
      setRec(r || null);
      latest.current = r;
      if (r && byId[r.strategy]?.validate(r.payload)) setSetup(true);
      if (r && byId[r.strategy]?.usesBank) loadBank(room).then(setBank);
    });
  }, [id]);

  const flush = () => {
    clearTimeout(timer.current);
    timer.current = null;
    if (!latest.current) return Promise.resolve();
    return store.set('live:' + id, latest.current).then(() => setSavedAt(Date.now()));
  };

  // 화면을 떠나거나 탭을 닫을 때 쓰던 것을 바로 저장하고, 전체화면도 끝내요
  useEffect(() => {
    const onHide = () => { if (timer.current) flush(); };
    const onFs = () => setFs(!!(document.fullscreenElement || document.webkitFullscreenElement));
    addEventListener('pagehide', onHide);
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      onHide();
      removeEventListener('pagehide', onHide);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [id]);

  if (rec === undefined) return <main class="page"><Loading /></main>;
  if (rec === null) return <main class="page"><p class="card">이 기기에 없는 함께 보기 기록이에요. <a href="#/t/tools">도구 모음으로</a></p></main>;
  const s = byId[rec.strategy];
  if (!s) return <main class="page"><p class="card">알 수 없는 도구예요. <a href="#/t/tools">도구 모음으로</a></p></main>;

  const update = (patch) => {
    const next = { ...latest.current, ...patch, updatedAt: Date.now() };
    latest.current = next;
    setRec(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  };

  const problem = s.validate(rec.payload);
  const showSetup = setup || !!problem;

  const fillExample = () => {
    const { title, ...p } = s.example();
    update({ title: rec.title || title, payload: p, answer: s.emptyAnswer(p), step: 0 });
    setEditorKey(editorKey + 1); setBoardKey(boardKey + 1);
  };
  const restart = () => {
    if (!confirm('칠판에 채운 내용을 모두 비우고 처음부터 다시 할까요? 준비한 질문과 카드는 그대로 남아요.')) return;
    update({ answer: s.emptyAnswer(rec.payload), step: 0 });
    setBoardKey(boardKey + 1);
  };
  const remove = async () => {
    if (!confirm('이 함께 보기 기록을 이 기기에서 지울까요?')) return;
    clearTimeout(timer.current); timer.current = null; latest.current = null;
    await store.del('live:' + id);
    toast('함께 보기 기록을 지웠어요.');
    go('/t/tools');
  };
  const assign = async () => { await flush(); go(`/t/new/${s.id}?live=${id}`); };
  const toggleFs = () => {
    if (fs) { (document.exitFullscreen || document.webkitExitFullscreen)?.call(document); return; }
    const el = wrap.current;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    Promise.resolve(req?.call(el)).catch(() => toast('이 브라우저에서는 전체화면을 쓸 수 없어요.'));
  };
  const setZoomSaved = (z) => { setZoom(z); try { localStorage.setItem('board-zoom', z); } catch { /* 저장 못 해도 괜찮아요 */ } };
  const canFs = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);

  return (
    <div class={'board-wrap' + (fs ? ' is-fs' : '')} ref={wrap} style={`--zoom:${zoom}`}>
      <div class="board-bar no-print">
        <a class="btn small" href="#/t/tools">← 도구 모음</a>
        <span class="chip">{s.name}</span>
        <span class="small" style="color:var(--mint-text);font-weight:700" role="status">{savedAt ? `이 기기에 저장됨 · ${fmtTime(savedAt)}` : ''}</span>
        <div class="spacer" />
        <div class="seg" role="group" aria-label="글자 크기">
          {ZOOMS.map(([z, name]) => <button key={z} type="button" aria-pressed={zoom === z} onClick={() => setZoomSaved(z)}>{name}</button>)}
        </div>
        <button type="button" class="btn small" aria-pressed={showSetup} disabled={!!problem} onClick={() => setSetup(!setup)}>{showSetup ? '준비 접기' : '준비 고치기'}</button>
        <button type="button" class="btn small" disabled={!!problem} onClick={restart}>처음부터 다시</button>
        <button type="button" class="btn small" disabled={!!problem} onClick={() => print()}>인쇄</button>
        {canFs && <button type="button" class="btn small dark" onClick={toggleFs}>{fs ? '전체화면 끝내기' : '전체화면'}</button>}
        {rec.assignmentIds?.length > 0 && <a class="btn small" href={`#/t/a/${rec.assignmentIds[0]}`}>학생 제출 모아 보기</a>}
        <button type="button" class="btn small primary" disabled={!!problem} onClick={assign}>이 내용으로 과제 내기</button>
      </div>

      {showSetup && (
        <section class="card stack-lg no-print setup-panel">
          <div class="row between">
            <div class="stack" style="gap:4px">
              <span class="eyebrow">함께 보기 준비</span>
              <h2 class="title-md">칠판에 띄울 내용을 정해요</h2>
            </div>
            <button type="button" class="btn small" onClick={fillExample}>예시로 채워 보기</button>
          </div>
          <p class="muted">{s.forTeacher}</p>
          <div class="field">
            <label for="lb-title">칠판 제목 (선택)</label>
            <input id="lb-title" class="input" value={rec.title} maxLength={60} placeholder={`비워 두면 ‘${s.name}’으로 보여요. 예: 곤충일까, 아닐까?`} onInput={(e) => update({ title: e.currentTarget.value })} />
          </div>
          <s.Editor key={editorKey} payload={rec.payload} set={(payload) => update({ payload })} unit={null} bank={bank} />
          <div class="stack" style="gap:8px">
            <span class="field-label">보관함 정리</span>
            <FileUnder roomId={room.id} value={rec.filed} onChange={(filed) => update({ filed })} idPrefix="lb" />
            <span class="hint-line">함께 보기 기록은 보관함의 이 자리에 모여요. 단원 없이 쓰면 ‘단원 밖 수업’에 날짜순으로 정리돼요.</span>
          </div>
          <div class="row" style="border-top:1px solid #EEF0F5;padding-top:18px">
            <button type="button" class="btn big primary" disabled={!!problem} onClick={() => setSetup(false)}>칠판에 띄우기</button>
            {problem && <span class="hint-line">{problem}</span>}
            <div class="spacer" />
            <button type="button" class="btn small ghost danger" onClick={remove}>이 기록 지우기</button>
          </div>
        </section>
      )}

      {!problem && (
        <div class="board-stage">
          <h1 class="title-kid board-title">{rec.title || s.name}</h1>
          <BoardBody key={boardKey} strategy={s} payload={{ ...rec.payload, bank }} answer={rec.answer} set={(answer) => update({ answer })}
            step={rec.step || 0} setStep={(step) => update({ step })} />
        </div>
      )}

      {!fs && (
        <div class="no-print" style="max-width:960px">
          <Tip title="함께 보기는 이렇게 써요">
            <ul>
              <li><strong>전체화면</strong>을 누르면 TV·전자칠판에 칠판만 꽉 차게 보여요. 끝낼 때는 다시 누르거나 Esc를 눌러요.</li>
              <li><strong>글자 크기</strong>로 교실 뒤에서도 읽히게 키울 수 있어요. 태블릿·휴대폰에서는 보통 크기로 보여요.</li>
              <li>쓰는 내용은 이 기기에 저절로 저장돼요. 도구 모음의 ‘이어서 보기’나 보관함에서 다시 열 수 있어요.</li>
              <li><strong>인쇄</strong>에서 ‘PDF로 저장’을 고르면 결과를 파일로 남길 수 있어요.</li>
              <li><strong>이 내용으로 과제 내기</strong>를 누르면 지금 준비한 질문과 카드 그대로 과제 준비 화면이 열려요. 학생은 각자 기기로 채워 내요.</li>
              <li>과제를 낸 뒤에는 위의 <strong>학생 제출 모아 보기</strong>를 누르면 반 친구들이 낸 답이 한 화면에 모여요. 가치수직선은 한 줄 위에, 네 모퉁이는 모퉁이마다 이름이 떠요.</li>
            </ul>
          </Tip>
        </div>
      )}
    </div>
  );
}
