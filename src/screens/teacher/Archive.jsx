import { useEffect, useState } from 'preact/hooks';
import { store } from '../../lib/db.js';
import { go } from '../../lib/router.js';
import { fmtDate, fmtDateTime } from '../../lib/format.js';
import { byId } from '../../strategies/index.jsx';
import { Tip, Loading } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';
import { Board } from './Board.jsx';

export function ArchivePage(props) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    store.keys().then(async (keys) => {
      const list = await Promise.all(keys.filter((k) => String(k).startsWith('archive:')).map((k) => store.get(k)));
      setItems(list.filter(Boolean).sort((a, b) => b.receivedAt - a.receivedAt));
    });
  }, []);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `탐구보드-보관함-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <>
      <TeacherBar {...props} current="archive" />
      <main class="page">
        <div class="row between" style="align-items:flex-end">
          <div class="stack" style="gap:8px">
            <span class="eyebrow">이 기기에 받아 둔 결과물</span>
            <h1 class="title-lg">보관함</h1>
          </div>
          {items?.length > 0 && <button type="button" class="btn" onClick={exportAll}>파일로 백업</button>}
        </div>
        {items === null ? <Loading /> : items.length === 0 ? (
          <p class="card muted">아직 받아 둔 과제가 없어요. 제출 현황에서 ‘모두 받기’를 누르면 여기에 쌓여요.</p>
        ) : (
          <div class="grid-cards">
            {items.map((it) => (
              <a key={it.assignment.id} href={`#/t/archive/${it.assignment.id}`} class="card" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:6px">
                <span class="small muted">{it.classroom.label} · {byId[it.assignment.strategy]?.name}</span>
                <span style="font-weight:800;font-size:17px;letter-spacing:-0.03em">{it.assignment.title}</span>
                <span class="small muted">{new Set(it.submissions.map((s) => s.number)).size}명 · {fmtDate(it.receivedAt)}에 받음</span>
              </a>
            ))}
          </div>
        )}
        <Tip title="보관함은 어디에 저장되나요?">
          <ul>
            <li>이 기기의 브라우저에만 저장돼요. 브라우저 기록을 지우면 함께 지워질 수 있어요.</li>
            <li>‘파일로 백업’을 눌러 가끔 내 컴퓨터에 파일로 남겨 두세요.</li>
          </ul>
        </Tip>
      </main>
    </>
  );
}

export function ArchiveView(props) {
  const { id } = props;
  const [it, setIt] = useState(undefined);
  const [projector, setProjector] = useState(false);
  useEffect(() => { store.get('archive:' + id).then((x) => setIt(x || null)); }, [id]);
  if (it === undefined) return <Loading />;
  if (it === null) return <main class="page"><p>보관함에 없는 과제예요. <a href="#/t/archive">보관함으로</a></p></main>;
  const remove = async () => {
    if (!confirm('이 기기의 보관함에서 지워요. 계속할까요?')) return;
    await store.del('archive:' + id); go('/t/archive');
  };
  return (
    <>
      {!projector && <TeacherBar {...props} current="archive" />}
      <main class="page">
        <section class="row between" style="align-items:flex-end">
          <div class="stack" style="gap:8px">
            <nav class="small muted row" style="gap:6px;font-weight:600" aria-label="위치"><a href="#/t/archive" style="text-decoration:none">보관함</a><span aria-hidden="true">/</span><span>{it.classroom.label}</span></nav>
            <h1 class="title-lg">{it.assignment.title}</h1>
            <span class="small muted">{fmtDateTime(it.receivedAt)}에 받아 둠</span>
          </div>
          <div class="row no-print">
            <button type="button" class="btn" aria-pressed={projector} onClick={() => setProjector(!projector)}>{projector ? '크게 보기 끄기' : '크게 보기'}</button>
            <button type="button" class="btn" onClick={() => print()}>인쇄</button>
            <button type="button" class="btn danger" onClick={remove}>지우기</button>
          </div>
        </section>
        <Board assignment={it.assignment} submissions={it.submissions} size={it.classroom.size} roster={it.roster} projector={projector} />
      </main>
    </>
  );
}
