import { useState } from 'preact/hooks';
import { Tip } from '../ui/kit.jsx';
import { CLASSIFY_TIPS as T } from '../content/guides.js';
import { ListField } from './Shell.jsx';
import { Quote } from './conceptAttainment.jsx';

const sortKo = (a, b) => a.localeCompare(b, 'ko');
const MAX_GROUPS = 6;
const COLORS = [
  { bg: '#E8ECFF', color: '#1F3BD1', drop: '#3355FF' },
  { bg: '#FFE9E0', color: '#B83C12', drop: '#C9461A' },
  { bg: '#DDF5E9', color: '#136B41', drop: '#1E8A55' },
  { bg: '#FFF6D1', color: '#6B5300', drop: '#8A6A00' },
  { bg: '#ECEEF4', color: '#3B4256', drop: '#586079' }
];
const UNSURE = 'unsure';
const color = (i) => COLORS[i % COLORS.length];

// 선생님이 무리 이름을 넣었으면 닫힌 분류, 비워 두었으면 학생이 무리를 만드는 열린 분류
function groupsOf(p, a) {
  if (p.groups?.length) return p.groups.map((name, i) => ({ id: 'c' + i, name }));
  return (a.groups || []).filter((g) => g.name.trim());
}

export const classify = {
  id: 'classify',
  name: '분류하기',
  stage: 'organize',
  stages: ['organize', 'investigate'],
  summary: '카드를 기준에 따라 무리 지어 나누고, 무리마다 공통점을 찾아요.',
  forTeacher: '나눌 카드를 넣어 주세요. 무리 이름을 비워 두면 학생이 스스로 기준과 무리를 정하고(열린 분류), 무리 이름을 넣으면 그 무리로 나눠요(닫힌 분류). 어디에 넣을지 고민되는 카드는 ‘애매해요’ 칸에 둘 수 있어서 수업 대화 거리가 돼요.',

  defaultPayload() {
    return { cards: [], groups: [], criterion: '' };
  },

  example() {
    return {
      title: '동물을 어떻게 나눌 수 있을까?',
      cards: ['개구리', '붕어', '고래', '독수리', '펭귄', '박쥐', '뱀', '다람쥐', '오리', '수달', '두더지', '참새'],
      groups: [],
      criterion: ''
    };
  },

  validate(p) {
    if (p.cards.length < 4) return '나눌 카드를 4장 이상 넣어 주세요.';
    if (p.cards.length > 24) return '카드는 24장까지 넣을 수 있어요.';
    if (new Set(p.cards).size < p.cards.length) return '같은 카드가 두 번 들어 있어요.';
    if (p.groups.length === 1) return '무리 이름은 2개 이상 넣거나, 모두 비워 주세요.';
    if (p.groups.length > MAX_GROUPS) return `무리는 ${MAX_GROUPS}개까지 넣을 수 있어요.`;
    if (p.groups.length && !p.criterion.trim()) return '닫힌 분류에서는 나누는 기준을 써 주세요.';
    return '';
  },

  Editor({ payload: p, set }) {
    return (
      <div class="stack-lg">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
          <ListField id="cl-cards" label="나눌 카드" list={p.cards} rows={6} hint="한 줄에 하나씩, 8~12장이 알맞아요. 학생 화면에서는 가나다순으로 보여요."
            onChange={(v) => set({ ...p, cards: v })} />
          <ListField id="cl-groups" label="무리 이름 (선택)" list={p.groups} rows={6} placeholder="비워 두면 학생이 정해요"
            hint="비워 두면 열린 분류: 학생이 기준과 무리를 스스로 정해요. 넣으면 닫힌 분류: 이 무리로만 나눠요."
            onChange={(v) => set({ ...p, groups: v })} />
        </div>
        {p.groups.length > 0 && (
          <div class="field">
            <label for="cl-criterion">나누는 기준</label>
            <input id="cl-criterion" class="input" value={p.criterion} placeholder="예: 사는 곳"
              onInput={(e) => set({ ...p, criterion: e.currentTarget.value })} />
            <span class="hint">닫힌 분류에서 학생에게 보여 줄 기준이에요.</span>
          </div>
        )}
      </div>
    );
  },

  emptyAnswer() {
    return { criterion: '', groups: [{ id: 'g1', name: '' }, { id: 'g2', name: '' }], place: {}, why: {}, unsure: '' };
  },

  useSteps({ payload: p, answer: a, set }) {
    const [selected, setSelected] = useState(null);
    const open = !p.groups?.length;
    const groups = groupsOf(p, a);
    const cards = [...p.cards].sort(sortKo);
    const zoneIds = new Set([...groups.map((g) => g.id), UNSURE]);
    const pool = cards.filter((c) => !zoneIds.has(a.place[c]));
    const inZone = (id) => cards.filter((c) => a.place[c] === id);
    const pick = (c) => setSelected(selected === c ? null : c);
    const drop = (id) => {
      if (!selected) return;
      set({ ...a, place: { ...a.place, [selected]: id } });
      setSelected(null);
    };
    const tileFor = (c) => <button key={c} type="button" class="tile" aria-pressed={selected === c} onClick={() => pick(c)}>{c}</button>;

    // 열린 분류 1단계: 무리 이름 고치기, 더하기, 빼기
    const editGroups = (groupsNext) => set({ ...a, groups: groupsNext });
    const removeGroup = (id) => {
      const place = Object.fromEntries(Object.entries(a.place).filter(([, z]) => z !== id));
      const why = { ...a.why }; delete why[id];
      set({ ...a, groups: a.groups.filter((g) => g.id !== id), place, why });
    };
    const addGroup = () => {
      const n = Math.max(0, ...a.groups.map((g) => Number(g.id.slice(1)) || 0)) + 1;
      editGroups([...a.groups, { id: 'g' + n, name: '' }]);
    };

    const zone = (g, i) => {
      const k = color(i);
      return (
        <div class="zone" key={g.id} style={`background:${k.bg};min-height:160px`}>
          <span class="deco" aria-hidden="true" style={i % 2
            ? `right:-16px;bottom:-16px;width:84px;height:84px;border-radius:22px;background:${k.drop};opacity:.12;transform:rotate(18deg)`
            : `right:-24px;bottom:-24px;width:96px;height:96px;border-radius:999px;background:${k.drop};opacity:.12`} />
          <div class="row between">
            <span class="zone-title" style={`color:${k.color};font-size:24px`}>{g.name}</span>
            <button type="button" class="drop" style={selected ? `background:${k.drop}` : ''} disabled={!selected} onClick={() => drop(g.id)}
              aria-label={selected ? `‘${selected}’을(를) ${g.name}에 놓기` : `${g.name}에 놓기`}>
              {selected ? `‘${selected}’ 놓기` : '여기에 놓기'}
            </button>
          </div>
          <div class="row" style="gap:8px">{inZone(g.id).map(tileFor)}</div>
        </div>
      );
    };
    const unsureZone = (
      <div class="zone dashed" style="background:#fff;min-height:120px">
        <div class="row between">
          <span class="zone-title" style="color:var(--ink-2);font-size:24px">애매해요</span>
          <button type="button" class="drop" style={selected ? 'background:var(--ink)' : ''} disabled={!selected} onClick={() => drop(UNSURE)}
            aria-label={selected ? `‘${selected}’을(를) 애매해요에 놓기` : '애매해요에 놓기'}>
            {selected ? `‘${selected}’ 놓기` : '여기에 놓기'}
          </button>
        </div>
        <div class="row" style="gap:8px">
          {inZone(UNSURE).map(tileFor)}
          {inZone(UNSURE).length === 0 && <span class="small muted">어디에 넣을지 고민되는 카드를 놓아요.</span>}
        </div>
      </div>
    );
    const criterion = open ? a.criterion : p.criterion;

    const setupStep = {
      title: '어떤 기준으로 나눌지 정하고, 무리 이름을 지어요.',
      help: '먼저 카드를 쭉 훑어보세요. 무리는 2개에서 5개까지 만들 수 있어요.',
      progress: (a.criterion.trim() ? 50 : 0) + Math.min(groups.length, 2) * 25,
      canNext: a.criterion.trim().length > 0 && groups.length >= 2,
      blockedHint: a.criterion.trim() ? '이름이 있는 무리를 2개 이상 만들어 주세요.' : '나누는 기준을 써 주세요.',
      body: (
        <div class="stack-lg">
          <div class="row" style="gap:6px">{cards.map((c) => <span key={c} class="chip plain">{c}</span>)}</div>
          <div class="field">
            <label for="cl-a-criterion" style="font-size:17px">나는 … 을/를 기준으로 나눌 거예요.</label>
            <input id="cl-a-criterion" class="input kid" value={a.criterion} placeholder="예: 움직이는 방법"
              onInput={(e) => set({ ...a, criterion: e.currentTarget.value })} />
          </div>
          <div class="stack" style="gap:10px">
            <span class="field-label" style="font-size:17px">무리 이름</span>
            {a.groups.map((g, i) => (
              <div key={g.id} class="row" style="gap:8px;flex-wrap:nowrap">
                <span aria-hidden="true" style={`flex:none;width:14px;height:14px;border-radius:${i % 2 ? '4px' : '999px'};background:${color(i).drop}`} />
                <input class="input kid" aria-label={`무리 ${i + 1} 이름`} value={g.name} placeholder={`무리 ${i + 1}`}
                  onInput={(e) => editGroups(a.groups.map((x) => (x.id === g.id ? { ...x, name: e.currentTarget.value } : x)))} />
                {a.groups.length > 2 && <button type="button" class="btn small" style="flex:none" onClick={() => removeGroup(g.id)}>빼기</button>}
              </div>
            ))}
            {a.groups.length < 5 && <button type="button" class="btn ghost" style="align-self:flex-start" onClick={addGroup}>+ 무리 더하기</button>}
          </div>
        </div>
      ),
      tips: <Tip title="기준과 무리 정하기"><ul>{T.criterion.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
    };

    const sortStep = {
      title: '카드를 무리에 나눠 놓아요.',
      help: '카드를 누르고, 놓을 무리를 누르면 돼요. 놓은 카드를 다시 누르면 옮길 수 있어요.',
      progress: cards.length ? Math.round((cards.length - pool.length) / cards.length * 100) : 100,
      canNext: pool.length === 0,
      blockedHint: `남은 카드 ${pool.length}장을 모두 놓으면 다음으로 갈 수 있어요.`,
      body: (
        <div class="stack" style="gap:16px">
          {criterion && <p class="notice info"><strong style="flex:none">기준</strong>{criterion}</p>}
          <div class="dashed" style="padding:18px 20px;display:flex;flex-direction:column;gap:12px">
            <span class="label">남은 카드 {pool.length}</span>
            <div class="row" style="gap:10px;min-height:56px">
              {pool.map(tileFor)}
              {pool.length === 0 && <span style="font-weight:700;color:#136B41">다 놓았어요. 다음 단계로 가 볼까요?</span>}
            </div>
            {selected && (
              <div class="stack" style="gap:8px;border-top:1px solid #EEF0F5;padding-top:12px">
                <span class="small" style="font-weight:700">‘{selected}’을(를) 어디에 놓을까요?</span>
                <div class="row" style="gap:6px">
                  {groups.map((g, i) => <button key={g.id} type="button" class="btn small" style={`background:${color(i).bg};border-color:transparent;color:${color(i).color};font-weight:800`} onClick={() => drop(g.id)}>{g.name}</button>)}
                  <button type="button" class="btn small" onClick={() => drop(UNSURE)}>애매해요</button>
                </div>
              </div>
            )}
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
            {groups.map(zone)}
          </div>
          {unsureZone}
        </div>
      ),
      tips: <Tip title="나누기 도움말"><ul>{T.sort.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
    };

    const filledGroups = groups.filter((g) => inZone(g.id).length > 0);
    const unsureCards = inZone(UNSURE);
    const whyDone = filledGroups.every((g) => (a.why[g.id] || '').trim()) && (unsureCards.length === 0 || a.unsure.trim());
    const whyStep = {
      title: '무리마다 어떤 점이 같은지 써요.',
      help: '같은 무리에 놓은 카드들의 공통점을 찾아보세요.',
      canNext: whyDone,
      blockedHint: '카드가 있는 무리마다 공통점을 써 주세요.',
      body: (
        <div class="stack-lg">
          {filledGroups.map((g) => {
            const i = groups.indexOf(g);
            return (
              <div key={g.id} class="stack" style={`gap:10px;padding:16px;border-radius:18px;background:${color(i).bg}`}>
                <span style={`font-family:var(--font-kid);font-size:22px;line-height:1.2;color:${color(i).color}`}>{g.name}</span>
                <div class="row" style="gap:6px">{inZone(g.id).map((c) => <span key={c} class="chip plain" style="border-color:transparent">{c}</span>)}</div>
                <div class="field">
                  <label for={'cl-why-' + g.id}>이 무리는 모두 …</label>
                  <textarea id={'cl-why-' + g.id} class="textarea kid" rows="2" value={a.why[g.id] || ''} aria-label={`${g.name}: 이 무리는 모두 …`}
                    onInput={(e) => set({ ...a, why: { ...a.why, [g.id]: e.currentTarget.value } })} />
                </div>
              </div>
            );
          })}
          {unsureCards.length > 0 && (
            <div class="stack dashed" style="gap:10px;padding:16px">
              <span style="font-family:var(--font-kid);font-size:22px;line-height:1.2;color:var(--ink-2)">애매해요</span>
              <div class="row" style="gap:6px">{unsureCards.map((c) => <span key={c} class="chip plain">{c}</span>)}</div>
              <div class="field">
                <label for="cl-unsure">왜 고르기 어려웠나요?</label>
                <textarea id="cl-unsure" class="textarea kid" rows="2" value={a.unsure} placeholder="예: ~이기도 하고 ~이기도 해서"
                  onInput={(e) => set({ ...a, unsure: e.currentTarget.value })} />
              </div>
            </div>
          )}
        </div>
      ),
      tips: <Tip title="공통점 쓰는 방법"><ul>{T.why.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
    };

    return open ? [setupStep, sortStep, whyStep] : [sortStep, whyStep];
  },

  View({ payload: p, content: a }) {
    const groups = groupsOf(p, a);
    const inZone = (id) => p.cards.filter((c) => a.place?.[c] === id).sort(sortKo);
    const unsure = inZone(UNSURE);
    const crit = p.groups?.length ? p.criterion : a.criterion;
    return (
      <div class="stack" style="gap:18px">
        <Quote label={p.groups?.length ? '선생님이 정한 기준' : '학생이 정한 기준'} color="#3355FF">{crit || '—'}</Quote>
        <div class="stack" style="gap:8px">
          {groups.map((g, i) => (
            <div key={g.id} style={`background:${color(i).bg};border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:8px`}>
              <span style={`font-family:var(--font-kid);font-size:20px;line-height:1.2;color:${color(i).color}`}>{g.name}</span>
              <div class="row" style="gap:4px">
                {inZone(g.id).map((c) => <span key={c} class="chip plain" style="border-color:transparent">{c}</span>)}
                {inZone(g.id).length === 0 && <span class="small muted">비어 있음</span>}
              </div>
              {a.why?.[g.id] && <p style="font-size:15px;font-weight:600;white-space:pre-wrap">모두 {a.why[g.id]}</p>}
            </div>
          ))}
          {unsure.length > 0 && (
            <div style="border:1.5px dashed #C5CAD8;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:8px">
              <span style="font-family:var(--font-kid);font-size:20px;line-height:1.2;color:var(--ink-2)">애매해요</span>
              <div class="row" style="gap:4px">{unsure.map((c) => <span key={c} class="chip plain" style="border:2px dashed #C9461A;color:#6A2A06;font-weight:800">{c}</span>)}</div>
              {a.unsure && <p style="font-size:15px;font-weight:600;white-space:pre-wrap">{a.unsure}</p>}
            </div>
          )}
        </div>
        {unsure.length > 0 && <span class="small" style="color:#6A2A06">애매한 카드는 수업 대화 거리로 좋아요.</span>}
      </div>
    );
  }
};
