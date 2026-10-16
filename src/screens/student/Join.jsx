import { useEffect, useState } from 'preact/hooks';
import { api } from '../../lib/api.js';
import { go } from '../../lib/router.js';
import { newDeviceId } from '../../lib/db.js';
import { Brand, Tip, ErrorNote } from '../../ui/kit.jsx';

export function Join({ code: initial, student, setStudent }) {
  const [code, setCode] = useState((initial || '').toUpperCase());
  const [room, setRoom] = useState(null);
  const [num, setNum] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const lookup = async (c) => {
    setBusy(true); setError(null);
    try { const r = await api.joinInfo(c.trim().toUpperCase()); setRoom(r.classroom); } catch (e) { setError(e); }
    setBusy(false);
  };

  useEffect(() => {
    if (initial && student?.code === initial.toUpperCase()) { go('/s'); return; }
    if (initial) lookup(initial);
  }, [initial]);

  const confirm = async () => {
    await setStudent({ code: room.code, label: room.label, size: room.size, number: num, deviceId: student?.deviceId || newDeviceId() });
    go('/s');
  };

  return (
    <>
      <header class="topbar"><div class="topbar-in"><Brand href="#/" /></div></header>
      <main class="page tight">
        {!room ? (
          <form class="stack-lg" onSubmit={(e) => { e.preventDefault(); lookup(code); }}>
            <div class="stack" style="gap:8px">
              <h1 class="title-kid">교실에 들어가요</h1>
              <p class="muted">선생님이 알려 준 교실 코드 6자리를 넣어요.</p>
            </div>
            <div class="field">
              <label for="jn-code">교실 코드</label>
              <input id="jn-code" class="input kid" value={code} maxLength={6} autoComplete="off" autoCapitalize="characters"
                style="font-size:32px;letter-spacing:0.3em;text-align:center;font-weight:800;text-transform:uppercase"
                onInput={(e) => setCode(e.currentTarget.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))} />
            </div>
            <ErrorNote error={error} />
            <button class="btn big primary" disabled={code.length !== 6 || busy}>{busy ? '찾는 중…' : '들어가기'}</button>
            <Tip title="코드가 어디 있나요?">
              <ul>
                <li>선생님이 칠판에 띄워 준 화면에 있어요. QR을 카메라로 찍으면 코드를 넣지 않아도 돼요.</li>
                <li>숫자 0과 1, 글자 O와 I는 쓰지 않아요. 헷갈리면 선생님께 물어봐요.</li>
              </ul>
            </Tip>
          </form>
        ) : (
          <div class="stack-lg">
            <div class="stack" style="gap:8px">
              <span class="eyebrow">{room.label}</span>
              <h1 class="title-kid">내 번호를 눌러요</h1>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px">
              {Array.from({ length: room.size }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" class="tile" aria-pressed={num === n} style="justify-content:center;min-height:64px;font-size:22px;font-weight:800;padding:0" onClick={() => setNum(n)}>{n}</button>
              ))}
            </div>
            {num && (
              <div class="card soft-butter stack" style="border:0;align-items:flex-start">
                <p style="font-size:19px;font-weight:800">{room.label} {num}번이 맞나요?</p>
                <p class="small" style="color:#4D3B00">다른 친구 번호로 들어가면 내 답이 친구 답처럼 보여요. 꼭 내 번호를 골라요.</p>
                <button type="button" class="btn big primary" onClick={confirm}>네, {num}번이에요</button>
              </div>
            )}
            <button type="button" class="btn ghost" style="align-self:flex-start" onClick={() => { setRoom(null); setNum(null); }}>다른 교실 코드 넣기</button>
          </div>
        )}
      </main>
    </>
  );
}
