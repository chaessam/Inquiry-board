import { useState } from 'preact/hooks';
import { api } from '../../lib/api.js';
import { go } from '../../lib/router.js';
import { groupKey } from '../../lib/format.js';
import { Brand, Tip, Dialog, ErrorNote, toast } from '../../ui/kit.jsx';

export function Onboarding({ teacher, setTeacher }) {
  const [label, setLabel] = useState('');
  const [size, setSize] = useState(25);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [saved, setSaved] = useState(false);
  const [firstTime] = useState(!teacher?.classrooms?.length);

  const add = async (room, adminKey) => {
    const list = (teacher?.classrooms || []).filter((c) => c.id !== room.id);
    await setTeacher({ classrooms: [...list, { ...room, adminKey }], currentId: room.id });
  };

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api.createClassroom(label.trim() || '우리 반', Number(size));
      await add(r.classroom, r.adminKey);
      setCreated(r);
    } catch (err) { setError(err); }
    setBusy(false);
  };

  const recover = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api.recover(key);
      await add(r.classroom, r.adminKey);
      toast(`${r.classroom.label} 교실을 불러왔어요.`);
      go('/t');
    } catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <>
      <header class="topbar"><div class="topbar-in"><Brand href="#/" /></div></header>
      <main class="page narrow">
        <div class="stack" style="gap:8px">
          <span class="eyebrow">선생님 시작하기</span>
          <h1 class="title-lg">{firstTime ? '먼저 교실을 만들어요' : '교실을 하나 더 만들어요'}</h1>
          <p class="muted">가입은 필요 없어요. 교실을 만들면 학생용 ‘교실 코드’와 선생님용 ‘관리 코드’가 생겨요.</p>
        </div>
        <ErrorNote error={error} />
        <div class="split">
          <form class="card main stack-lg" onSubmit={create}>
            <h2 class="title-md">새 교실 만들기</h2>
            <div class="field">
              <label for="ob-label">교실 이름</label>
              <input id="ob-label" class="input" value={label} onInput={(e) => setLabel(e.currentTarget.value)} placeholder="예: 3학년 2반" maxLength={30} />
            </div>
            <div class="field">
              <label for="ob-size">학생 수</label>
              <input id="ob-size" class="input" type="number" min="1" max="40" value={size} onInput={(e) => setSize(e.currentTarget.value)} style="max-width:160px" />
              <span class="hint">학생은 1번부터 이 번호까지 중에서 자기 번호를 골라요. 나중에 바꿀 수 있어요.</span>
            </div>
            <button class="btn big primary" disabled={busy}>{busy ? '만드는 중…' : '교실 만들기'}</button>
          </form>
          <form class="card side stack-lg" onSubmit={recover}>
            <h2 class="title-md">관리 코드로 불러오기</h2>
            <p class="muted small">다른 기기에서 만든 교실을 이 기기에서도 쓰려면, 그때 받은 관리 코드 20자리를 넣으세요.</p>
            <div class="field">
              <label for="ob-key">관리 코드</label>
              <input id="ob-key" class="input" value={key} onInput={(e) => setKey(e.currentTarget.value)} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autoComplete="off" style="letter-spacing:0.08em;font-weight:700" />
            </div>
            <button class="btn big" disabled={busy || key.replace(/[^0-9a-z]/gi, '').length !== 20}>불러오기</button>
          </form>
        </div>
        <Tip title="교실 코드와 관리 코드는 무엇이 다른가요?">
          <ul>
            <li><strong>교실 코드</strong>(6자리): 학생에게 알려 주는 코드예요. 학생은 이 코드와 자기 번호로 들어와요.</li>
            <li><strong>관리 코드</strong>(20자리): 선생님만 아는 비밀번호 같은 코드예요. 다른 기기에서 교실을 불러오거나, 기기를 바꿀 때 필요해요.</li>
            <li>관리 코드는 서버에 그대로 저장하지 않아요. 잃어버리면 다시 찾을 수 없으니 꼭 적어 두세요.</li>
          </ul>
        </Tip>
      </main>

      {created && (
        <Dialog title="교실이 만들어졌어요">
          <p>학생에게는 교실 코드를, 선생님은 관리 코드를 꼭 적어 두세요.</p>
          <div class="card soft-blue" style="border:0;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
            <span class="label" style="color:#1F3BD1">학생용 교실 코드</span>
            <strong style="font-size:28px;letter-spacing:0.16em">{created.classroom.code}</strong>
          </div>
          <div class="card soft-butter" style="border:0;display:flex;flex-direction:column;gap:10px">
            <span class="label" style="color:#6B5300">선생님용 관리 코드 · 다른 사람에게 보여 주지 마세요</span>
            <strong style="font-size:20px;letter-spacing:0.08em;word-break:break-all">{groupKey(created.adminKey)}</strong>
            <div class="row">
              <button type="button" class="btn small" onClick={() => { navigator.clipboard?.writeText(groupKey(created.adminKey)); toast('관리 코드를 복사했어요.'); }}>복사하기</button>
              <button type="button" class="btn small" onClick={() => {
                const blob = new Blob([`생각틀 교실: ${created.classroom.label}\n교실 코드: ${created.classroom.code}\n관리 코드: ${groupKey(created.adminKey)}\n`], { type: 'text/plain' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `생각틀-${created.classroom.label}-관리코드.txt`; a.click();
              }}>파일로 저장</button>
            </div>
          </div>
          <label class="row" style="gap:10px;cursor:pointer">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.currentTarget.checked)} style="width:20px;height:20px" />
            관리 코드를 적어 두었어요
          </label>
          <button type="button" class="btn big primary" disabled={!saved} onClick={() => go('/t')}>교실로 가기</button>
        </Dialog>
      )}
    </>
  );
}
