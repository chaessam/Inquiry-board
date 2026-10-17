import { useEffect, useRef, useState } from 'preact/hooks';
import { store } from '../../lib/db.js';
import { api } from '../../lib/api.js';
import { go } from '../../lib/router.js';
import { fmtDateTime, remaining, toLocalInput, fromLocalInput } from '../../lib/format.js';
import { byId } from '../../strategies/index.jsx';
import { Tip, ErrorNote, Loading, Dialog, toast } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';
import { Board } from './Board.jsx';
import { stageName } from '../../lib/records.js';
import { GatherView } from './Gather.jsx';
import { loadBank, saveBank, mergeWords } from '../../lib/bank.js';

const POLL_MS = 5000;          // 모아 보기 저절로 새로 받기 간격 (3초 이상)
const POLL_LIMIT = 60 * 60000; // 60분이 지나면 멈춰요

// 새로 받은 답을 합쳐요 (같은 답을 고쳐 냈으면 바꿔 끼워요)
const mergeSubs = (old, fresh) => {
  const byId = new Map(old.map((x) => [x.id, x]));
  for (const x of fresh) byId.set(x.id, x);
  return [...byId.values()].sort((a, b) => a.number - b.number || a.submitted_at - b.submitted_at);
};

export async function addToBank(room, word, meaning = '', unit = '') {
  const fresh = await loadBank(room);
  const had = fresh.find((c) => c.w === word.trim());
  const r = mergeWords(fresh, [word], { unit, meaning });
  if (r.added || (meaning && had && !had.m)) { await saveBank(room, r.list); toast(`‘${word.trim()}’을(를) 개념 은행에 넣었어요.`); }
  else toast(`‘${word.trim()}’은(는) 이미 개념 은행에 있어요.`);
}

export function StatusPage(props) {
  const { room, id, view } = props;
  const [data, setData] = useState(null);
  const [roster, setRoster] = useState([]);
  const [received, setReceived] = useState(null);
  const [error, setError] = useState(null);
  const [projector, setProjector] = useState(false);
  const [extend, setExtend] = useState(false);
  const [filed, setFiled] = useState(null);
  const [tab, setTab] = useState(view === 'each' ? 'each' : 'gather');
  const [auto, setAuto] = useState(true);
  const [lastPoll, setLastPoll] = useState(null);
  const pollStart = useRef(Date.now());
  const dataRef = useRef(null);
  dataRef.current = data;

  const load = () => api.getAssignment(room, id).then((r) => { setData(r); setError(null); }).catch(setError);
  useEffect(() => {
    load();
    store.get('roster:' + room.id).then((r) => setRoster(r || []));
    store.get('archive:' + id).then((a) => setReceived(a?.receivedAt || null));
    store.get('meta:' + id).then((x) => setFiled(x || null));
  }, [id, room.id]);

  // 모아 보기를 띄워 둔 동안만, 이 화면 하나에서 새로 들어온 답만 받아요
  const closedNow = !!data && data.assignment.deadline < Date.now();
  const polling = auto && tab === 'gather' && !!data && !closedNow;
  useEffect(() => {
    if (!polling) return;
    pollStart.current = Date.now();
    let stop = false;
    const tick = async () => {
      if (stop || document.hidden) return;
      if (Date.now() - pollStart.current > POLL_LIMIT) { setAuto(false); toast('60분이 지나 저절로 새로 받기를 멈췄어요. 새로고침을 눌러 주세요.'); return; }
      const cur = dataRef.current;
      const since = Math.max(0, ...cur.submissions.map((x) => x.submitted_at));
      try {
        const r = await api.getAssignment(room, id, since);
        if (!stop && r.submissions.length) setData((d) => ({ ...d, assignment: r.assignment, submissions: mergeSubs(d.submissions, r.submissions) }));
        setLastPoll(Date.now());
      } catch { /* 다음 차례에 다시 해요 */ }
    };
    const t = setInterval(tick, POLL_MS);
    return () => { stop = true; clearInterval(t); };
  }, [polling, id]);

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
      {!projector && <TeacherBar {...props} current="tasks" />}
      <main class="page" style={projector ? 'max-width:1400px' : ''}>
        <section class="row between" style="align-items:flex-end;gap:16px">
          <div class="stack" style="gap:8px">
            <nav class="small muted row" style="gap:6px;font-weight:600" aria-label="위치"><a href="#/t/tasks" style="text-decoration:none">과제</a><span aria-hidden="true">/</span><span>{s?.name}</span></nav>
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

        <div class="row between no-print" style="gap:10px">
          <div class="seg" role="tablist" aria-label="보기 바꾸기">
            <button type="button" role="tab" aria-selected={tab === 'gather'} aria-pressed={tab === 'gather'} onClick={() => setTab('gather')}>모아 보기</button>
            <button type="button" role="tab" aria-selected={tab === 'each'} aria-pressed={tab === 'each'} onClick={() => setTab('each')}>한 명씩 보기</button>
          </div>
          {tab === 'gather' && !closed && (
            <label class="row small" style="gap:8px;cursor:pointer;font-weight:700">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.currentTarget.checked)} style="width:18px;height:18px" />
              새로 낸 답 저절로 모으기{polling && lastPoll ? <span class="muted" style="font-weight:500"> · 5초마다</span> : ''}
            </label>
          )}
        </div>

        {tab === 'gather' ? (
          <div class={projector ? 'gather-big' : ''}>
            <GatherView assignment={a} submissions={data.submissions} size={room.size} roster={roster}
              onBank={(w, m) => addToBank(room, w, m, filed?.unitName || '').catch(setError)} />
          </div>
        ) : (
        <Board assignment={a} submissions={data.submissions} size={room.size} roster={roster} projector={projector}
          onMove={async (subId, number) => {
            try {
              await api.moveSubmission(room, id, subId, number);
              await load();
              toast(`${number}번 답으로 옮겼어요.`);
              return true;
            } catch (e) { setError(e); return false; }
          }} />
        )}

        {!projector && (
          <>
            <Tip title="제출 현황은 이렇게 써요">
              <ul>
                <li><strong>모아 보기</strong>는 반 친구들이 낸 답을 한 화면에 모아요. 가치수직선은 한 수직선 위에, 네 모퉁이는 모퉁이마다 학생 이름이 떠요. 칠판에 띄울 때는 ‘크게 보기’를 눌러요.</li>
                <li>모아 보기를 띄워 두면 새로 낸 답이 5초마다 저절로 모여요. 화면을 숨기거나 60분이 지나면 멈춰요.</li>
                <li>이름은 이 기기의 명렬표에서만 채워져요. 칠판에 이름을 띄우고 싶지 않으면 ‘번호로’를 눌러요.</li>
                <li><strong>한 명씩 보기</strong>에서 번호를 누르면 오른쪽에 그 학생의 답이 보여요.</li>
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
