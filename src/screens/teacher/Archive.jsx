import { useEffect, useState } from 'preact/hooks';
import { store } from '../../lib/db.js';
import { go } from '../../lib/router.js';
import { fmtDate, fmtDateTime } from '../../lib/format.js';
import { byId } from '../../strategies/index.jsx';
import { loadArchive, groupArchive, downloadJson, today, stageName, OUTSIDE } from '../../lib/records.js';
import { Tip, Loading, toast } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';
import { Board } from './Board.jsx';
import { FileUnder } from './FileUnder.jsx';

// 백업 파일 모양: 받아 둔 과제와 함께 보기 기록을 그대로 담아요
function backupOf(items, unit) {
  return {
    app: '탐구보드',
    kind: unit ? 'unit' : 'archive',
    exportedAt: new Date().toISOString(),
    unit: unit || null,
    assignments: items.filter((it) => it.kind === 'assignment').map((it) => it.rec),
    live: items.filter((it) => it.kind === 'live').map((it) => it.rec)
  };
}

export function ArchivePage(props) {
  const [items, setItems] = useState(null);
  useEffect(() => { loadArchive().then(setItems); }, []);

  if (items === null) return <><TeacherBar {...props} current="archive" /><main class="page"><Loading /></main></>;
  const g = groupArchive(items);

  return (
    <>
      <TeacherBar {...props} current="archive" />
      <main class="page">
        <div class="row between" style="align-items:flex-end">
          <div class="stack" style="gap:8px">
            <span class="eyebrow">이 기기에 모아 둔 수업 기록</span>
            <h1 class="title-lg">보관함</h1>
          </div>
          {items.length > 0 && <button type="button" class="btn" onClick={() => downloadJson(`탐구보드-보관함-${today()}`, backupOf(items))}>전체 파일로 백업</button>}
        </div>

        <Tip title="보관함은 이렇게 정리돼요" tone="blue">
          <ul>
            <li>단원에서 낸 과제는 <strong>단원 → 탐구 단계 → 과제</strong> 순서로 모여요.</li>
            <li>도구 모음에서 단원 없이 낸 과제와 함께 보기 기록은 <strong>단원 밖 수업</strong>에 날짜순으로 모여요.</li>
            <li>과제는 제출 현황에서 ‘모두 받기’를 눌러야 여기에 들어와요. 함께 보기 기록은 저절로 들어와요.</li>
            <li>정리 자리가 틀렸다면 과제를 열어 ‘정리할 곳 바꾸기’로 옮길 수 있어요.</li>
          </ul>
        </Tip>

        {items.length === 0 && <p class="card muted">아직 모아 둔 기록이 없어요. 제출 현황에서 ‘모두 받기’를 누르거나, 도구 모음에서 함께 보기를 쓰면 여기에 쌓여요.</p>}

        {g.units.map((u) => (
          <section key={u.id} class="card stack-lg">
            <div class="row between" style="align-items:flex-start">
              <div class="stack" style="gap:4px">
                <span class="eyebrow">{u.subject ? `${u.subject} · ` : ''}단원</span>
                <h2 class="title-md" style="font-size:26px">{u.name}</h2>
                <span class="small muted">과제 {u.items.filter((x) => x.kind === 'assignment').length}개 · 함께 보기 {u.items.filter((x) => x.kind === 'live').length}개</span>
              </div>
              <div class="row" style="gap:8px">
                <a class="btn small dark" href={`#/t/archive/u/${u.id}`}>단원 모아 보기·인쇄</a>
                <button type="button" class="btn small" onClick={() => downloadJson(`탐구보드-${u.name}-${today()}`, backupOf(u.items, { id: u.id, name: u.name, subject: u.subject }))}>파일로 백업</button>
              </div>
            </div>
            <ol class="stage-groups">
              {u.stages.map((st) => (
                <li key={st.stage} class="stage-group">
                  <span class="stage-group-name">{st.name}</span>
                  <div class="stack" style="gap:8px">{st.items.map((it) => <ItemRow key={it.kind + it.id} it={it} />)}</div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {g.outside.length > 0 && (
          <section class="card stack-lg">
            <div class="row between" style="align-items:flex-start">
              <div class="stack" style="gap:4px">
                <span class="eyebrow">도구 모음 · 단원 없이</span>
                <h2 class="title-md" style="font-size:26px">단원 밖 수업</h2>
                <span class="small muted">최근 날짜가 위에 있어요</span>
              </div>
              <div class="row" style="gap:8px">
                <a class="btn small dark" href={`#/t/archive/u/${OUTSIDE}`}>모아 보기·인쇄</a>
                <button type="button" class="btn small" onClick={() => downloadJson(`탐구보드-단원밖수업-${today()}`, backupOf(g.outsideItems, { id: OUTSIDE, name: '단원 밖 수업' }))}>파일로 백업</button>
              </div>
            </div>
            <ol class="stage-groups">
              {g.outside.map((d) => (
                <li key={d.key} class="stage-group">
                  <span class="stage-group-name">{fmtDate(d.at)}</span>
                  <div class="stack" style="gap:8px">{d.items.map((it) => <ItemRow key={it.kind + it.id} it={it} showStage />)}</div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <Tip title="보관함은 어디에 저장되나요?">
          <ul>
            <li>이 기기의 브라우저에만 저장돼요. 브라우저 기록을 지우면 함께 지워질 수 있어요.</li>
            <li>‘파일로 백업’을 눌러 가끔 내 컴퓨터에 파일로 남겨 두세요. 단원을 마칠 때 단원별로 백업해 두면 찾기 쉬워요.</li>
          </ul>
        </Tip>
      </main>
    </>
  );
}

function ItemRow({ it, showStage }) {
  const s = byId[it.strategy];
  const href = it.kind === 'assignment' ? `#/t/archive/${it.id}` : `#/t/live/${it.id}`;
  return (
    <a href={href} class="item-row">
      <span class={'chip ' + (it.kind === 'assignment' ? '' : 'butter')} style="font-size:12px;padding:3px 10px;flex:none">{it.kind === 'assignment' ? '과제' : '함께 보기'}</span>
      <span class="stack" style="gap:0;min-width:0;flex:1">
        <span style="font-weight:800;letter-spacing:-0.03em">{it.title || s?.name}</span>
        <span class="small muted">
          {s?.name}{showStage ? ` · ${stageName(it.filed?.stage)}` : ''}{it.room ? ` · ${it.room}` : ''}
          {it.kind === 'assignment' ? ` · ${it.count}명 · ${fmtDate(it.at)}` : ` · ${fmtDateTime(it.updated || it.at)}에 저장`}
        </span>
      </span>
    </a>
  );
}

// 단원 하나(또는 단원 밖 수업)를 펼쳐서 모아 보기. 인쇄하기 좋게 만들어요.
export function ArchiveUnit(props) {
  const { unitId } = props;
  const [items, setItems] = useState(null);
  useEffect(() => { loadArchive().then(setItems); }, [unitId]);

  if (items === null) return <><TeacherBar {...props} current="archive" /><main class="page"><Loading /></main></>;
  const g = groupArchive(items);
  const outside = unitId === OUTSIDE;
  const unit = outside ? null : g.units.find((u) => u.id === unitId);
  const list = outside ? g.outsideItems : unit?.items || [];
  const title = outside ? '단원 밖 수업' : unit?.name || '이 단원';
  const sections = outside
    ? g.outside.map((d) => ({ key: d.key, name: fmtDate(d.at), items: d.items }))
    : (unit?.stages || []).map((st) => ({ key: st.stage, name: st.name, items: st.items }));
  const backup = () => downloadJson(`탐구보드-${title}-${today()}`, backupOf(list, outside ? { id: OUTSIDE, name: title } : { id: unit.id, name: unit.name, subject: unit.subject }));

  return (
    <>
      <TeacherBar {...props} current="archive" />
      <main class="page">
        <section class="row between" style="align-items:flex-end">
          <div class="stack" style="gap:8px">
            <nav class="small muted row" style="gap:6px;font-weight:600" aria-label="위치"><a href="#/t/archive" style="text-decoration:none">보관함</a><span aria-hidden="true">/</span><span>{title}</span></nav>
            <h1 class="title-lg">{unit?.subject ? `${unit.subject} · ` : ''}{title}</h1>
            <span class="small muted">과제 {list.filter((x) => x.kind === 'assignment').length}개 · 함께 보기 {list.filter((x) => x.kind === 'live').length}개 · {fmtDate(Date.now())} 기준</span>
          </div>
          {list.length > 0 && (
            <div class="row no-print">
              <button type="button" class="btn" onClick={backup}>파일로 백업</button>
              <button type="button" class="btn dark" onClick={() => print()}>인쇄</button>
            </div>
          )}
        </section>
        <Tip title="모아 보기는 이렇게 써요">
          <ul>
            <li>이 단원에서 받은 학생 답과 함께 보기 기록을 탐구 단계 순서대로 모두 펼쳐 보여 줘요.</li>
            <li><strong>인쇄</strong>에서 ‘PDF로 저장’을 고르면 단원 기록을 파일 하나로 남길 수 있어요. 학생 이름은 이 기기의 명렬표에서만 채워져요.</li>
            <li><strong>파일로 백업</strong>은 내용을 그대로 담은 파일(JSON)이에요. 기기를 바꾸거나 브라우저를 정리하기 전에 남겨 두세요.</li>
          </ul>
        </Tip>
        {list.length === 0 && <p class="card muted">아직 이 단원에 모아 둔 기록이 없어요. 과제를 내고 제출 현황에서 ‘모두 받기’를 누르면 여기에 모여요. <a href="#/t/archive">보관함으로</a></p>}
        {sections.map((sec) => (
          <section key={sec.key} class="stack-lg">
            <h2 class="title-md stage-heading">{sec.name}</h2>
            {sec.items.map((it) => <FullItem key={it.kind + it.id} it={it} showStage={outside} />)}
          </section>
        ))}
      </main>
    </>
  );
}

function FullItem({ it, showStage }) {
  const s = byId[it.strategy];
  if (!s) return null;
  if (it.kind === 'live') {
    return (
      <article class="card stack print-block">
        <span class="small muted">함께 보기 · {s.name}{showStage ? ` · ${stageName(it.filed?.stage)}` : ''} · {fmtDateTime(it.updated || it.at)}</span>
        <h3 class="title-md" style="font-size:20px">{it.title || s.name}</h3>
        {s.validate(it.rec.payload) ? <p class="muted">아직 준비가 덜 된 기록이에요.</p> : <s.View payload={it.rec.payload} content={it.rec.answer || s.emptyAnswer(it.rec.payload)} />}
      </article>
    );
  }
  const a = it.rec.assignment;
  const roster = it.rec.roster || [];
  const byNum = {};
  for (const sub of it.rec.submissions) (byNum[sub.number] ||= []).push(sub);
  const nums = Object.keys(byNum).map(Number).sort((x, y) => x - y);
  return (
    <article class="card stack-lg print-block">
      <div class="stack" style="gap:4px">
        <span class="small muted">과제 · {s.name}{showStage ? ` · ${stageName(it.filed?.stage)}` : ''} · {it.room} · {it.count}명 제출 · {fmtDate(it.at)}</span>
        <h3 class="title-md" style="font-size:20px">{a.title}</h3>
      </div>
      {nums.length === 0 && <p class="muted">받아 둔 답이 없어요.</p>}
      <div class="answer-grid">
        {nums.flatMap((n) => byNum[n].map((sub, i) => (
          <div key={sub.id} class="answer-cell">
            <span style="font-weight:800">{n}번{roster[n - 1] ? ` ${roster[n - 1]}` : ''}{byNum[n].length > 1 ? ` (기기 ${i + 1})` : ''}</span>
            <s.View payload={a.payload} content={sub.content} />
          </div>
        )))}
      </div>
    </article>
  );
}

export function ArchiveView(props) {
  const { id } = props;
  const [it, setIt] = useState(undefined);
  const [projector, setProjector] = useState(false);
  const [refile, setRefile] = useState(false);
  useEffect(() => {
    Promise.all([store.get('archive:' + id), store.get('meta:' + id)]).then(([x, m]) => setIt(x ? { ...x, filed: x.filed || m || null } : null));
  }, [id]);
  if (it === undefined) return <Loading />;
  if (it === null) return <main class="page"><p>보관함에 없는 과제예요. <a href="#/t/archive">보관함으로</a></p></main>;
  const remove = async () => {
    if (!confirm('이 기기의 보관함에서 지워요. 계속할까요?')) return;
    await store.del('archive:' + id); go('/t/archive');
  };
  const saveFiling = async (filed) => {
    const next = { ...it, filed };
    await store.set('archive:' + id, next);
    setIt(next);
    toast('정리할 곳을 바꿨어요.');
  };
  const f = it.filed;
  return (
    <>
      {!projector && <TeacherBar {...props} current="archive" />}
      <main class="page">
        <section class="row between" style="align-items:flex-end">
          <div class="stack" style="gap:8px">
            <nav class="small muted row" style="gap:6px;font-weight:600" aria-label="위치">
              <a href="#/t/archive" style="text-decoration:none">보관함</a><span aria-hidden="true">/</span>
              <a href={`#/t/archive/u/${f?.unitId || OUTSIDE}`} style="text-decoration:none">{f?.unitId ? f.unitName : '단원 밖 수업'}</a><span aria-hidden="true">/</span>
              <span>{stageName(f?.stage)}</span>
            </nav>
            <h1 class="title-lg">{it.assignment.title}</h1>
            <span class="small muted">{it.classroom.label} · {fmtDateTime(it.receivedAt)}에 받아 둠</span>
          </div>
          <div class="row no-print">
            <button type="button" class="btn" aria-pressed={projector} onClick={() => setProjector(!projector)}>{projector ? '크게 보기 끄기' : '크게 보기'}</button>
            <button type="button" class="btn" onClick={() => print()}>인쇄</button>
            {!projector && <button type="button" class="btn" aria-pressed={refile} onClick={() => setRefile(!refile)}>정리할 곳 바꾸기</button>}
            <button type="button" class="btn danger" onClick={remove}>지우기</button>
          </div>
        </section>
        {refile && !projector && (
          <section class="card pad-sm stack no-print">
            <FileUnder roomId={it.classroom.id || props.room.id} value={f || { unitId: null, stage: byId[it.assignment.strategy]?.stage }} onChange={saveFiling} idPrefix="av" />
            <span class="hint-line">바꾸면 바로 저장돼요. 보관함에서 이 과제가 고른 단원·단계 아래로 옮겨 가요.</span>
          </section>
        )}
        <Board assignment={it.assignment} submissions={it.submissions} size={it.classroom.size} roster={it.roster} projector={projector} />
      </main>
    </>
  );
}
