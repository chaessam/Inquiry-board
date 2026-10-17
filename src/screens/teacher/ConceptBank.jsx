import { useEffect, useState } from 'preact/hooks';
import { loadBank, saveBank, mergeWords, BANK_MAX } from '../../lib/bank.js';
import { loadUnit } from '../../lib/records.js';
import { fmtDate } from '../../lib/format.js';
import { Tip, Dialog, ErrorNote, Loading, toast } from '../../ui/kit.jsx';
import { TeacherBar } from './Bar.jsx';

const ALL = '';
const NO_TAG = '\u0000';
// 카드 색: 시안의 네 가지 부드러운 색을 돌려 써요
const TONES = [
  ['#E8ECFF', '#1F3BD1'],
  ['#FFE9E0', '#B83C12'],
  ['#FFF6D1', '#6B5300'],
  ['#DDF5E9', '#136B41']
];
const toneOf = (w) => TONES[[...w].reduce((n, ch) => n + ch.charCodeAt(0), 0) % TONES.length];

// 개념 은행: 수업마다가 아니라 교실에 계속 쌓이는 개념 갤러리
export function ConceptBank(props) {
  const { room } = props;
  const [bank, setBank] = useState(null);
  const [unit, setUnit] = useState(null);
  const [tag, setTag] = useState(ALL);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // { item, index } 또는 { item: 새 개념 }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBank(room).then(setBank);
    loadUnit(room.id).then(setUnit);
  }, [room.id]);

  const commit = async (next, msg) => {
    setBusy(true); setError(null);
    try { setBank(await saveBank(room, next)); if (msg) toast(msg); return true; } catch (e) { setError(e); return false; } finally { setBusy(false); }
  };

  if (bank === null) return <><TeacherBar {...props} current="bank" /><main class="page"><Loading /></main></>;

  const tags = [...new Set(bank.map((c) => c.u).filter(Boolean))];
  const hasUntagged = bank.some((c) => !c.u);
  const shown = bank.filter((c) => (tag === ALL || (tag === NO_TAG ? !c.u : c.u === tag)) && (!q.trim() || c.w.includes(q.trim()) || c.m.includes(q.trim())));
  const unitMissing = (unit?.concepts || []).filter((w) => !bank.some((c) => c.w === w));

  const importUnit = () => {
    const r = mergeWords(bank, unitMissing, { unit: unit.name || '' });
    commit(r.list, `단원 핵심 개념 ${r.added}개를 넣었어요.`);
  };
  const remove = (c) => {
    if (!confirm(`‘${c.w}’을(를) 개념 은행에서 뺄까요? 이미 낸 과제에는 그대로 남아요.`)) return;
    commit(bank.filter((x) => x.w !== c.w), `‘${c.w}’을(를) 뺐어요.`);
  };
  const saveItem = async (item, old) => {
    const w = item.w.trim();
    if (bank.some((c) => c.w === w && c !== old)) { setError(new Error(`‘${w}’은(는) 이미 개념 은행에 있어요.`)); return; }
    const entry = { w, m: item.m.trim(), u: item.u.trim(), at: old?.at || Date.now() };
    const next = old ? bank.map((c) => (c === old ? entry : c)) : [entry, ...bank];
    if (await commit(next, old ? '고쳤어요.' : `‘${w}’을(를) 넣었어요.`)) setEditing(null);
  };

  return (
    <>
      <TeacherBar {...props} current="bank" />
      <main class="page">
        <section class="row between" style="align-items:flex-end">
          <div class="stack" style="gap:8px;max-width:720px">
            <span class="eyebrow">{room.label}이(가) 함께 모으는</span>
            <h1 class="title-lg">개념 은행</h1>
            <p class="muted" style="font-size:16px">수업에서 만난 개념 단어를 한곳에 차곡차곡 모아요. 단원이 바뀌어도 사라지지 않고 계속 쌓여요. 학생들은 일반화 문장을 만들 때 여기서 개념을 꺼내 써요.</p>
          </div>
          <button type="button" class="btn big primary" disabled={busy || bank.length >= BANK_MAX} onClick={() => setEditing({ item: { w: '', m: '', u: unit?.name || '' } })}>개념 넣기</button>
        </section>

        <Tip title="개념 은행은 이렇게 써요" tone="blue">
          <ul>
            <li><strong>개념 넣기</strong>로 단어와 뜻을 넣어요. 뜻은 비워 두고 나중에 반 친구들과 함께 정해도 좋아요.</li>
            <li>단원을 설계할 때 쓴 <strong>핵심 개념</strong>은 저절로 들어와요. 단원 이름이 이름표로 붙어요.</li>
            <li>제출 현황의 <strong>모아 보기</strong>에서 학생이 찾은 개념 이름이나 정의를 눌러 바로 넣을 수도 있어요.</li>
            <li>학생은 <strong>일반화 문장 만들기</strong>에서 ‘우리 반 개념 은행’ 단어를 골라 쓸 수 있고, ‘내 과제’ 화면 아래에서 은행 전체를 볼 수 있어요.</li>
            <li>개념은 {BANK_MAX}개까지 모을 수 있어요. 지금 {bank.length}개예요.</li>
          </ul>
        </Tip>
        <ErrorNote error={error} />

        {unitMissing.length > 0 && (
          <p class="notice info" style="margin:0;align-items:center;flex-wrap:wrap">
            <span style="flex:1 1 260px">지금 단원 ‘{unit.name}’의 핵심 개념 중 <strong>{unitMissing.join(', ')}</strong>이(가) 아직 은행에 없어요.</span>
            <button type="button" class="btn small dark" disabled={busy} onClick={importUnit}>한 번에 넣기</button>
          </p>
        )}

        {bank.length > 0 && (
          <section class="stack" style="gap:12px">
            <div class="row" style="gap:12px">
              <div class="chip-scroll" role="tablist" aria-label="단원 이름표로 고르기" style="flex:1 1 320px">
                <button type="button" role="tab" class="chip chip-btn" aria-pressed={tag === ALL} aria-selected={tag === ALL} onClick={() => setTag(ALL)}>모두 {bank.length}</button>
                {tags.map((t) => <button key={t} type="button" role="tab" class="chip chip-btn" aria-pressed={tag === t} aria-selected={tag === t} onClick={() => setTag(t)}>{t} {bank.filter((c) => c.u === t).length}</button>)}
                {hasUntagged && tags.length > 0 && <button type="button" role="tab" class="chip chip-btn" aria-pressed={tag === NO_TAG} aria-selected={tag === NO_TAG} onClick={() => setTag(NO_TAG)}>이름표 없음</button>}
              </div>
              <label class="sr-only" for="cb-q">개념 찾기</label>
              <input id="cb-q" class="input" style="max-width:240px" value={q} placeholder="개념 찾기" onInput={(e) => setQ(e.currentTarget.value)} />
            </div>
          </section>
        )}

        {bank.length === 0 ? (
          <section class="card" style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;padding:32px">
            <div class="stack" style="flex:999 1 360px;gap:10px">
              <h2 class="title-md">아직 모은 개념이 없어요</h2>
              <p class="muted">첫 개념을 넣어 보세요. 예: 적응, 서식지, 다양성, 변화, 관계</p>
              <div class="row"><button type="button" class="btn dark" onClick={() => setEditing({ item: { w: '', m: '', u: unit?.name || '' } })}>개념 넣기</button></div>
            </div>
            <BankArt />
          </section>
        ) : shown.length === 0 ? (
          <p class="card muted">찾는 개념이 없어요.</p>
        ) : (
          <div class="bank-grid">
            {shown.map((c) => {
              const [bg, fg] = toneOf(c.w);
              return (
                <article key={c.w} class="bank-card" style={`background:${bg}`}>
                  <h2 class="bank-word" style={`color:${fg}`}>{c.w}</h2>
                  <p class="bank-meaning">{c.m || <span class="muted">뜻을 함께 정해 보세요</span>}</p>
                  <div class="row between" style="gap:6px;margin-top:auto">
                    <span class="small" style="color:var(--ink-2);font-weight:700">{c.u || '이름표 없음'} · {fmtDate(c.at)}</span>
                    <span class="row" style="gap:4px">
                      <button type="button" class="btn ghost small" disabled={busy} onClick={() => setEditing({ item: c, old: c })}>고치기</button>
                      <button type="button" class="btn ghost small danger" disabled={busy} aria-label={`${c.w} 빼기`} onClick={() => remove(c)}>빼기</button>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      {editing && <ConceptDialog item={editing.item} isNew={!editing.old} busy={busy} tags={tags} onClose={() => { setEditing(null); setError(null); }} onSave={(item) => saveItem(item, editing.old)} />}
    </>
  );
}

function ConceptDialog({ item, isNew, busy, tags, onClose, onSave }) {
  const [v, setV] = useState({ ...item });
  const submit = (e) => { e.preventDefault(); if (v.w.trim()) onSave(v); };
  return (
    <Dialog title={isNew ? '개념 넣기' : '개념 고치기'} onClose={onClose}>
      <form class="stack-lg" onSubmit={submit}>
        <div class="field">
          <label for="cd-w">개념 단어</label>
          <input id="cd-w" class="input" value={v.w} maxLength={20} placeholder="예: 적응" onInput={(e) => setV({ ...v, w: e.currentTarget.value })} />
        </div>
        <div class="field">
          <label for="cd-m">뜻 (선택)</label>
          <textarea id="cd-m" class="textarea" rows="2" maxLength={100} value={v.m} placeholder="예: 생물이 사는 곳에 알맞게 몸과 생활 방식이 바뀌는 것" onInput={(e) => setV({ ...v, m: e.currentTarget.value })} />
          <span class="hint">학생 눈높이의 말로 써요. 반 친구들과 함께 다듬은 정의를 넣으면 더 좋아요.</span>
        </div>
        <div class="field">
          <label for="cd-u">단원 이름표 (선택)</label>
          <input id="cd-u" class="input" value={v.u} maxLength={30} list="cd-tags" placeholder="예: 동물의 생활" onInput={(e) => setV({ ...v, u: e.currentTarget.value })} />
          <datalist id="cd-tags">{tags.map((t) => <option key={t} value={t} />)}</datalist>
          <span class="hint">어느 단원에서 만난 개념인지 붙여 두면 모아 보기 좋아요.</span>
        </div>
        <div class="row" style="justify-content:flex-end">
          <button type="button" class="btn" onClick={onClose}>취소</button>
          <button class="btn primary" disabled={!v.w.trim() || busy}>{busy ? '저장 중…' : '저장하기'}</button>
        </div>
      </form>
    </Dialog>
  );
}

function BankArt() {
  const abs = (s) => `position:absolute;${s}`;
  return (
    <div aria-hidden="true" style="flex:1 1 220px;height:160px;border-radius:24px;background:#E8ECFF;position:relative;overflow:hidden">
      <span style={abs('left:24px;top:28px;width:80px;height:52px;border-radius:12px;background:#fff')} />
      <span style={abs('left:112px;top:28px;width:64px;height:52px;border-radius:12px;background:#FFD43B')} />
      <span style={abs('left:24px;top:88px;width:56px;height:52px;border-radius:12px;background:#FF6B3D')} />
      <span style={abs('left:88px;top:88px;width:88px;height:52px;border-radius:12px;background:#3355FF')} />
      <span style={abs('right:-30px;top:-30px;width:90px;height:90px;border-radius:999px;background:#2BB673')} />
    </div>
  );
}
