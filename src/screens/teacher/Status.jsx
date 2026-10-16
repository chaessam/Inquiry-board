import { useEffect, useState } from 'preact/hooks';
import { store } from '../../lib/db.js';
import { api } from '../../lib/api.js';
import { go } from '../../lib/router.js';
import { fmtDateTime, remaining, toLocalInput, fromLocalInput } from '../../lib/format.js';
import { byId } from '../../strategies/index.jsx';
import { Tip, ErrorNote, Loading, Dialog, toast } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';
import { Board } from './Board.jsx';
import { stageName } from '../../lib/records.js';

export function StatusPage(props) {
  const { room, id } = props;
  const [data, setData] = useState(null);
  const [roster, setRoster] = useState([]);
  const [received, setReceived] = useState(null);
  const [error, setError] = useState(null);
  const [projector, setProjector] = useState(false);
  const [extend, setExtend] = useState(false);
  const [filed, setFiled] = useState(null);

  const load = () => api.getAssignment(room, id).then((r) => { setData(r); setError(null); }).catch(setError);
  useEffect(() => {
    load();
    store.get('roster:' + room.id).then((r) => setRoster(r || []));
    store.get('archive:' + id).then((a) => setReceived(a?.receivedAt || null));
    store.get('meta:' + id).then((x) => setFiled(x || null));
  }, [id, room.id]);

  if (error && !data) return <><TeacherBar {...props} /><main class="page"><ErrorNote error={error} /><a href="#/t">홈으로</a></main></>;
  if (!data) return <><TeacherBar {...props} /><main class="page"><Loading /></main></>;

  const a = data.assignment;
  const s = byId[a.strategy];
  const closed = a.deadline < Date.now();

  const receiveAll = async () => {
    const fresh = await api.getAssignment(room, id).catch((e) => { setError(e); return null; });
    if (!fresh) return;
    setData(fresh);
    const now = Date.now();
    // 다시 받을 때도 보관함에서 바꾼 정리 자리는 그대로 둬요
    const prev = await store.get('archive:' + id);
    const filing = prev?.filed || (await store.get('meta:' + id)) || null;
    await store.set('archive:' + id, { ...fresh, classroom: { id: room.id, label: room.label, size: room.size }, roster, receivedAt: now, filed: filing });
    setReceived(now);
    toast(`${new Set(fresh.submissions.map((x) => x.number)).size}명의 답을 이 기기에 받아 두었어요.`);
  };

  const remove = async () => {
    if (!confirm('서버에서 이 과제와 제출물을 지워요. 이 기기에 받아 둔 것은 보관함에 남아요. 계속할까요?')) return;
    try { await api.deleteAssignment(room, id); go('/t'); } catch (e) { setError(e); }
  };

  return (
    <>
      {!projector && <TeacherBar {...props} />}
      <main class="page" style={projector ? 'max-width:1400px' : ''}>
        <section class="row between" style="align-items:flex-end;gap:16px">
          <div class="stack" style="gap:8px">
            <nav class="small muted row" style="gap:6px;font-weight:600" aria-label="위치"><a href="#/t" style="text-decoration:none">홈</a><span aria-hidden="true">/</span><span>{s?.name}</span></nav>
            <h1 class="title-lg" style="font-size:40px">{a.title}</h1>
            {filed && !projector && <span class="small muted">보관함 정리: {filed.unitId ? filed.unitName : '단원 밖 수업'} › {stageName(filed.stage)}</span>}
            <span class="row small muted" style="gap:8px">
              <span aria-hidden="true" style={`width:8px;height:8px;border-radius:999px;background:${closed ? '#8A91A6' : '#2BB673'}`} />
              {closed ? `마감됨 · ${fmtDateTime(a.expires_at)}에 서버에서 지워져요` : `진행 중 · 마감 ${fmtDateTime(a.deadline)} (${remaining(a.deadline)})`}
            </span>
          </div>
          <div class="row no-print">
            <button type="button" class="btn" onClick={load}>새로고침</button>
            <button type="button" class="btn" aria-pressed={projector} onClick={() => setProjector(!projector)}>{projector ? '크게 보기 끄기' : '크게 보기'}</button>
            <button type="button" class={received ? 'btn' : 'btn dark'} onClick={receiveAll}>{received ? '다시 받기' : '모두 받기'}</button>
          </div>
        </section>

        {!projector && (
          <p class={'notice ' + (received ? 'ok' : 'info')} style="margin:0">
            {received
              ? `${fmtDateTime(received)}에 이 기기의 보관함에 받아 두었어요. 그 뒤에 들어온 답이 있으면 ‘다시 받기’를 눌러 주세요.`
              : `제출물은 ${fmtDateTime(a.expires_at)}까지 서버에 있어요. 그 전에 ‘모두 받기’로 이 기기에 받아 두세요.`}
          </p>
        )}
        <ErrorNote error={error} />

        <Board assignment={a} submissions={data.submissions} size={room.size} roster={roster} projector={projector}
          onMove={async (subId, number) => {
            try {
              await api.moveSubmission(room, id, subId, number);
              await load();
              toast(`${number}번 답으로 옮겼어요.`);
              return true;
            } catch (e) { setError(e); return false; }
          }} />

        {!projector && (
          <>
            <Tip title="제출 현황은 이렇게 써요">
              <ul>
                <li>번호를 누르면 오른쪽에 그 학생의 답이 보여요.</li>
                <li><strong>크게 보기</strong>는 이름을 숨기고 칠판에 띄우기 좋게 바꿔요. 함께 보며 이야기 나누기에 좋아요.</li>
                {a.strategy === 'concept-attainment' && <li>주황 점선 카드는 선생님이 정한 칸과 다르게 놓은 카드예요. ‘왜 그렇게 생각했니?’를 물어보기 좋은 대화 거리예요.</li>}
                <li>학생이 마감 전에 고쳐서 다시 내면 ‘다시 제출’로 바뀌고 마지막 답이 보여요.</li>
              </ul>
            </Tip>
            <section class="row no-print" style="gap:8px">
              <button type="button" class="btn small" onClick={() => setExtend(true)}>마감 바꾸기</button>
              <button type="button" class="btn small danger" onClick={remove}>과제 지우기</button>
            </section>
          </>
        )}
      </main>
      {extend && <ExtendDialog deadline={a.deadline} onClose={() => setExtend(false)} onSave={async (ms) => {
        try { await api.extendAssignment(room, id, ms); setExtend(false); load(); toast('마감을 바꿨어요.'); } catch (e) { setError(e); setExtend(false); }
      }} />}
    </>
  );
}

function ExtendDialog({ deadline, onClose, onSave }) {
  const [v, setV] = useState(toLocalInput(Math.max(deadline, Date.now() + 3600000)));
  return (
    <Dialog title="마감 바꾸기" onClose={onClose}>
      <div class="field">
        <label for="ex-d">새 마감</label>
        <input id="ex-d" class="input" type="datetime-local" value={v} onInput={(e) => setV(e.currentTarget.value)} />
        <span class="hint">서버 보관 기간도 새 마감 뒤 14일로 함께 바뀌어요.</span>
      </div>
      <div class="row" style="justify-content:flex-end">
        <button type="button" class="btn" onClick={onClose}>취소</button>
        <button type="button" class="btn primary" onClick={() => onSave(fromLocalInput(v))}>바꾸기</button>
      </div>
    </Dialog>
  );
}
