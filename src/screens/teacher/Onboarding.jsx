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
  const [firstTime] = useState(!teacher?.classrooms?.length);
  const [tab, setTab] = useState('create');
  const [label, setLabel] = useState('');
  const [size, setSize] = useState(25);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const pick = (t) => { setTab(t); setError(null); };

  const add = async (room, adminKey) => {
    const list = (teacher?.classrooms || []).filter((c) => c.id !== room.id);
    await setTeacher({ classrooms: [...list, { ...room, adminKey }], currentId: room.id });
  };

  const create = async (e) => {
    e.preventDefault();
    if (pin !== pin2) { setError(new Error('두 비밀번호가 서로 달라요. 다시 확인해 주세요.')); return; }
    setBusy(true); setError(null);
    try {
      const r = await api.createClassroom(label.trim(), Number(size), pin);
      await add(r.classroom, r.adminKey);
      toast(`${r.classroom.label} 교실을 만들었어요. 학생용 교실 코드는 ${r.classroom.code}예요.`);
      go('/t/class');
    } catch (err) { setError(err); }
    setBusy(false);
  };

  const login = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api.login(loginName.trim(), loginPin);
      await add(r.classroom, r.adminKey);
      toast(`${r.classroom.label} 교실에 들어왔어요.`);
      go('/t');
    } catch (err) { setError(err); setLoginPin(''); }
    setBusy(false);
  };

  const tabBtn = (key, text) => (
    <button type="button" role="tab" id={'tab-' + key} aria-selected={tab === key} aria-controls={'panel-' + key}
      onClick={() => pick(key)}
      style={`flex:1;min-height:52px;border:0;border-radius:12px;font-weight:800;font-size:16px;${tab === key ? 'background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(22,27,46,0.12)' : 'background:transparent;color:var(--ink-2)'}`}>
      {text}
    </button>
  );

  return (
    <>
      <header class="topbar"><div class="topbar-in"><Brand href="#/" /></div></header>
      <main class="page tight">
        <div class="stack" style="gap:8px">
          <span class="eyebrow">선생님</span>
          <h1 class="title-lg">{firstTime ? '교실을 만들거나 들어가요' : '교실을 하나 더 만들거나 들어가요'}</h1>
          <p class="muted">가입은 필요 없어요. 교실 이름과 비밀번호 4자리만 기억하면 어느 기기에서든 들어올 수 있어요.</p>
        </div>

        <div role="tablist" aria-label="선생님 시작 방법" style="display:flex;gap:4px;padding:4px;background:#E9EBF2;border-radius:16px">
          {tabBtn('create', '새 교실 만들기')}
          {tabBtn('login', '내 교실 들어가기')}
        </div>

        <ErrorNote error={error} />

        {tab === 'create' ? (
          <form id="panel-create" role="tabpanel" aria-labelledby="tab-create" class="card stack-lg" onSubmit={create}>
            <div class="field">
              <label for="ob-label">교실 이름</label>
              <input id="ob-label" class="input" value={label} onInput={(e) => setLabel(e.currentTarget.value)} placeholder="예: 한빛초 3학년 2반" maxLength={30} />
              <span class="hint">들어올 때 쓰는 이름이라 다른 선생님과 겹치면 안 돼요. 학교 이름을 붙이면 좋아요.</span>
            </div>
            <div class="field">
              <label for="ob-size">학생 수</label>
              <input id="ob-size" class="input" type="number" min="1" max="40" value={size} onInput={(e) => setSize(e.currentTarget.value)} style="max-width:160px" />
              <span class="hint">학생은 1번부터 이 번호까지 중에서 자기 번호를 골라요. 나중에 바꿀 수 있어요.</span>
            </div>
            <div class="row" style="gap:16px;align-items:flex-start">
              <PinInput id="ob-pin" label="비밀번호 (숫자 4자리)" value={pin} onInput={setPin} />
              <PinInput id="ob-pin2" label="한 번 더" value={pin2} onInput={setPin2} />
            </div>
            <span class="hint" style="margin-top:-10px">0000, 1234처럼 쉬운 번호는 쓸 수 없어요.</span>
            <button class="btn big primary" disabled={busy || label.trim().length < 2 || pin.length !== 4 || pin2.length !== 4}>{busy ? '만드는 중…' : '교실 만들기'}</button>
          </form>
        ) : (
          <form id="panel-login" role="tabpanel" aria-labelledby="tab-login" class="card stack-lg" onSubmit={login}>
            <div class="field">
              <label for="ob-login-name">교실 이름</label>
              <input id="ob-login-name" class="input" value={loginName} onInput={(e) => setLoginName(e.currentTarget.value)} placeholder="예: 한빛초 3학년 2반" maxLength={30} autoComplete="username" />
              <span class="hint">교실을 만들 때 정한 이름이에요. 띄어쓰기는 달라도 괜찮아요.</span>
            </div>
            <PinInput id="ob-login-pin" label="비밀번호" value={loginPin} onInput={setLoginPin} />
            <button class="btn big primary" disabled={busy || loginName.trim().length < 2 || loginPin.length !== 4}>{busy ? '들어가는 중…' : '들어가기'}</button>
          </form>
        )}

        <Tip title={tab === 'create' ? '교실을 만들면 무엇이 생기나요?' : '비밀번호가 생각나지 않아요'}>
          {tab === 'create' ? (
            <ul>
              <li><strong>교실 코드</strong>(6자리)가 생겨요. 학생에게 알려 주는 코드예요. 학생은 이 코드(또는 QR)와 자기 번호로 들어와요.</li>
              <li><strong>교실 이름과 비밀번호</strong>는 선생님만 써요. 새 기기에서 처음 한 번만 넣으면, 그 기기는 다음부터 저절로 들어와요.</li>
            </ul>
          ) : (
            <ul>
              <li>비밀번호를 5번 틀리면 잠시 잠겨요. 학생이 비밀번호를 맞혀 보는 장난을 막기 위해서예요.</li>
              <li>이미 들어와 있는 기기가 있다면, 그 기기의 ‘교실’ 화면에서 비밀번호를 새로 정할 수 있어요.</li>
              <li>들어와 있는 기기가 하나도 없으면 비밀번호를 되찾을 수 없어요. 새 교실을 만들어 주세요.</li>
            </ul>
          )}
        </Tip>
      </main>
    </>
  );
}
