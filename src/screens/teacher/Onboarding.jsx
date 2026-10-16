import { useState } from 'preact/hooks';
import { api } from '../../lib/api.js';
import { go } from '../../lib/router.js';
import { Brand, Tip, ErrorNote, toast } from '../../ui/kit.jsx';

// 숫자 4자리 입력 칸
export function PinInput({ id, value, onInput, label }) {
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <input id={id} class="input" type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={value}
        style="max-width:180px;font-size:24px;letter-spacing:0.5em;font-weight:800"
        onInput={(e) => onInput(e.currentTarget.value.replace(/\D/g, '').slice(0, 4))} />
    </div>
  );
}

export function Onboarding({ teacher, setTeacher }) {
  const [label, setLabel] = useState('');
  const [size, setSize] = useState(25);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [code, setCode] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [firstTime] = useState(!teacher?.classrooms?.length);

  const add = async (room, adminKey) => {
    const list = (teacher?.classrooms || []).filter((c) => c.id !== room.id);
    await setTeacher({ classrooms: [...list, { ...room, adminKey }], currentId: room.id });
  };

  const create = async (e) => {
    e.preventDefault();
    if (pin !== pin2) { setError(new Error('두 비밀번호가 서로 달라요. 다시 확인해 주세요.')); return; }
    setBusy(true); setError(null);
    try {
      const r = await api.createClassroom(label.trim() || '우리 반', Number(size), pin);
      await add(r.classroom, r.adminKey);
      toast(`${r.classroom.label} 교실을 만들었어요. 교실 코드는 ${r.classroom.code}예요.`);
      go('/t/class');
    } catch (err) { setError(err); }
    setBusy(false);
  };

  const login = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api.login(code, loginPin);
      await add(r.classroom, r.adminKey);
      toast(`${r.classroom.label} 교실에 들어왔어요.`);
      go('/t');
    } catch (err) { setError(err); setLoginPin(''); }
    setBusy(false);
  };

  return (
    <>
      <header class="topbar"><div class="topbar-in"><Brand href="#/" /></div></header>
      <main class="page narrow">
        <div class="stack" style="gap:8px">
          <span class="eyebrow">선생님 시작하기</span>
          <h1 class="title-lg">{firstTime ? '먼저 교실을 만들어요' : '교실을 하나 더 만들거나 불러와요'}</h1>
          <p class="muted">가입은 필요 없어요. 교실을 만들면 학생용 ‘교실 코드’가 생기고, 선생님은 비밀번호 4자리를 정해요.</p>
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
            <div class="row" style="gap:16px;align-items:flex-start">
              <PinInput id="ob-pin" label="선생님 비밀번호 (숫자 4자리)" value={pin} onInput={setPin} />
              <PinInput id="ob-pin2" label="한 번 더" value={pin2} onInput={setPin2} />
            </div>
            <span class="hint" style="margin-top:-10px">다른 기기(교실 컴퓨터, 집 노트북)에서 이 교실에 들어올 때 써요. 0000, 1234처럼 쉬운 번호는 쓸 수 없어요.</span>
            <button class="btn big primary" disabled={busy || pin.length !== 4 || pin2.length !== 4}>{busy ? '만드는 중…' : '교실 만들기'}</button>
          </form>
          <form class="card side stack-lg" onSubmit={login}>
            <h2 class="title-md">내 교실에 들어오기</h2>
            <p class="muted small">다른 기기에서 이미 만든 교실이라면, 교실 코드와 선생님 비밀번호를 넣으세요.</p>
            <div class="field">
              <label for="ob-code">교실 코드</label>
              <input id="ob-code" class="input" value={code} maxLength={6} autoComplete="off" placeholder="6자리"
                style="max-width:220px;letter-spacing:0.2em;font-weight:800;text-transform:uppercase"
                onInput={(e) => setCode(e.currentTarget.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))} />
            </div>
            <PinInput id="ob-login-pin" label="선생님 비밀번호" value={loginPin} onInput={setLoginPin} />
            <button class="btn big" disabled={busy || code.length !== 6 || loginPin.length !== 4}>들어오기</button>
          </form>
        </div>
        <Tip title="교실 코드와 선생님 비밀번호는 무엇이 다른가요?">
          <ul>
            <li><strong>교실 코드</strong>(6자리): 학생에게 알려 주는 코드예요. 학생은 이 코드와 자기 번호로 들어와요.</li>
            <li><strong>선생님 비밀번호</strong>(숫자 4자리): 선생님만 알아요. 새 기기에서 처음 들어올 때 한 번만 넣으면, 그 기기는 다음부터 저절로 들어와요.</li>
            <li>비밀번호를 5번 틀리면 잠시 잠겨요. 학생이 비밀번호를 맞혀 보는 장난을 막기 위해서예요. 이미 들어와 있는 기기는 잠겨도 그대로 쓸 수 있어요.</li>
            <li>비밀번호를 잊었다면, 이미 들어와 있는 기기의 ‘교실’ 화면에서 바꿀 수 있어요. 들어와 있는 기기가 하나도 없으면 되찾을 수 없어요.</li>
          </ul>
        </Tip>
      </main>
    </>
  );
}
