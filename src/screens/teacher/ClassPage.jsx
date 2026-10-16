import { useEffect, useState } from 'preact/hooks';
import { store } from '../../lib/db.js';
import { api } from '../../lib/api.js';
import { go } from '../../lib/router.js';
import { groupKey } from '../../lib/format.js';
import { Tip, QR, ErrorNote, toast, joinUrl, Dialog } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';

export function ClassPage(props) {
  const { room, teacher, setTeacher } = props;
  const [roster, setRoster] = useState('');
  const [label, setLabel] = useState(room.label);
  const [size, setSize] = useState(room.size);
  const [showKey, setShowKey] = useState(false);
  const [big, setBig] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLabel(room.label); setSize(room.size);
    store.get('roster:' + room.id).then((r) => setRoster((r || []).join('\n')));
  }, [room.id]);

  const saveRoom = async (e) => {
    e.preventDefault(); setError(null);
    try {
      const r = await api.updateClassroom(room, { label, size: Number(size) });
      await setTeacher({ ...teacher, classrooms: teacher.classrooms.map((c) => (c.id === room.id ? { ...c, ...r.classroom } : c)) });
      toast('교실 정보를 바꿨어요.');
    } catch (err) { setError(err); }
  };

  const saveRoster = async () => {
    const names = roster.split('\n').map((s) => s.trim());
    while (names.length && !names[names.length - 1]) names.pop();
    await store.set('roster:' + room.id, names);
    toast('명렬표를 이 기기에 저장했어요.');
  };

  const forget = async () => {
    if (!confirm('이 기기에서만 교실을 빼요. 관리 코드가 있으면 다시 불러올 수 있어요. 계속할까요?')) return;
    const rest = teacher.classrooms.filter((c) => c.id !== room.id);
    await setTeacher({ classrooms: rest, currentId: rest[0]?.id });
    go(rest.length ? '/t' : '/t/start');
  };

  const destroy = async () => {
    if (!confirm('서버에서 이 교실과 모든 과제·제출물을 지워요. 되돌릴 수 없어요. 계속할까요?')) return;
    try {
      await api.deleteClassroom(room);
      const rest = teacher.classrooms.filter((c) => c.id !== room.id);
      await setTeacher({ classrooms: rest, currentId: rest[0]?.id });
      await store.delPrefix('unit:' + room.id); await store.delPrefix('roster:' + room.id);
      go(rest.length ? '/t' : '/t/start');
    } catch (err) { setError(err); }
  };

  const url = joinUrl(room.code);
  return (
    <>
      <TeacherBar {...props} current="class" />
      <main class="page">
        <div class="stack" style="gap:8px">
          <span class="eyebrow">교실</span>
          <h1 class="title-lg">{room.label}</h1>
        </div>
        <ErrorNote error={error} />
        <div class="split">
          <section class="card main" style="display:flex;flex-wrap:wrap;gap:28px;align-items:center">
            <QR text={url} size={200} />
            <div class="stack" style="gap:10px;flex:1 1 240px">
              <span class="label">학생 들어오는 방법</span>
              <p>휴대폰·태블릿 카메라로 QR을 찍거나, 아래 주소에서 교실 코드를 넣어요.</p>
              <strong style="font-size:40px;letter-spacing:0.16em;line-height:1.1">{room.code}</strong>
              <span class="small muted" style="word-break:break-all">{location.origin}/#/join</span>
              <div class="row">
                <button type="button" class="btn dark" onClick={() => setBig(true)}>칠판에 크게 띄우기</button>
                <button type="button" class="btn" onClick={() => { navigator.clipboard?.writeText(url); toast('들어오기 주소를 복사했어요.'); }}>주소 복사</button>
              </div>
            </div>
          </section>
          <section class="card side stack">
            <span class="label">선생님용 관리 코드</span>
            <p class="small muted">다른 기기에서 이 교실을 불러올 때 써요. 학생에게 보여 주지 마세요.</p>
            <strong aria-hidden={!showKey} style={`font-size:18px;letter-spacing:0.06em;word-break:break-all;filter:blur(${showKey ? '0' : '6px'})`}>{groupKey(room.adminKey)}</strong>
            <div class="row">
              <button type="button" class="btn small" onClick={() => setShowKey(!showKey)}>{showKey ? '가리기' : '보기'}</button>
              <button type="button" class="btn small" onClick={() => { navigator.clipboard?.writeText(groupKey(room.adminKey)); toast('관리 코드를 복사했어요.'); }}>복사</button>
            </div>
          </section>
        </div>

        <div class="split">
          <section class="card main stack-lg">
            <h2 class="title-md">명렬표</h2>
            <p class="muted small">한 줄에 한 명씩, 1번부터 차례로 이름을 쓰세요. 이름은 <strong>이 기기에만</strong> 저장되고 서버로 가지 않아요. 제출 현황에서 번호 옆에 이름이 보여요.</p>
            <textarea class="textarea" rows="10" value={roster} onInput={(e) => setRoster(e.currentTarget.value)} placeholder={'김하준\n이서윤\n박도윤'} aria-label="명렬표" />
            <div class="row"><button type="button" class="btn primary" onClick={saveRoster}>명렬표 저장</button></div>
          </section>
          <form class="card side stack-lg" onSubmit={saveRoom}>
            <h2 class="title-md">교실 정보</h2>
            <div class="field">
              <label for="cp-label">교실 이름</label>
              <input id="cp-label" class="input" value={label} onInput={(e) => setLabel(e.currentTarget.value)} maxLength={30} />
            </div>
            <div class="field">
              <label for="cp-size">학생 수</label>
              <input id="cp-size" class="input" type="number" min="1" max="40" value={size} onInput={(e) => setSize(e.currentTarget.value)} style="max-width:140px" />
            </div>
            <button class="btn">바꾸기</button>
            <hr style="border:0;border-top:1px solid var(--line);margin:4px 0" />
            <a class="btn" href="#/t/start">교실 하나 더 만들기</a>
            <button type="button" class="btn" onClick={forget}>이 기기에서 교실 빼기</button>
            <button type="button" class="btn danger" onClick={destroy}>교실 완전히 지우기</button>
          </form>
        </div>
        <Tip title="학생이 번호를 잘못 골랐어요">
          <ul>
            <li>학생 화면 아래의 ‘이 기기에서 지우기’를 누르면 처음부터 다시 번호를 고를 수 있어요.</li>
            <li>같은 번호로 다른 기기에서 제출하면 제출 현황에 표시되고, 두 답이 모두 보관돼요.</li>
          </ul>
        </Tip>
      </main>
      {big && (
        <Dialog title={`${room.label} 들어오기`} onClose={() => setBig(false)} wide>
          <div style="display:flex;flex-wrap:wrap;gap:32px;align-items:center;justify-content:center;padding:12px 0">
            <QR text={url} size={300} />
            <div class="stack" style="gap:12px">
              <span class="label">교실 코드</span>
              <strong style="font-size:64px;letter-spacing:0.14em;line-height:1">{room.code}</strong>
              <p class="muted">카메라로 QR을 찍거나<br />{location.host}/#/join 에서 코드를 넣어요.</p>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
