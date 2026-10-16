import { useState } from 'preact/hooks';
import { Tip } from '../ui/kit.jsx';
import { CONCEPT_ATTAINMENT_TIPS as T } from '../content/guides.js';
import { ListField } from './Shell.jsx';

const sortKo = (a, b) => a.localeCompare(b, 'ko');

export const conceptAttainment = {
  id: 'concept-attainment',
  name: '개념 획득',
  stage: 'focus',
  summary: '예와 아니요 카드를 나누며 개념의 공통 특징을 스스로 찾아요.',
  forTeacher: '선생님이 ‘예’와 ‘아니요’ 보기 카드를 몇 장 놓아 두면, 학생이 남은 카드를 나누고 ‘예’ 카드의 공통점을 찾아 개념에 이름을 붙여요. 개념 이름을 먼저 알려 주지 않는 것이 핵심이에요.',

  defaultPayload() {
    return {
      conceptName: '',
      yes: [],
      no: [],
      testYes: [],
      testNo: [],
      lookFor: '',
      frame: '‘예’ 칸의 것들은 모두 ____________.'
    };
  },

  example() {
    return {
      title: '곤충일까, 아닐까?',
      conceptName: '곤충',
      yes: ['개미', '나비', '메뚜기'],
      no: ['거미', '지렁이', '달팽이'],
      testYes: ['무당벌레', '잠자리', '매미'],
      testNo: ['공벌레', '지네'],
      lookFor: '다리 수, 몸이 나뉜 부분, 더듬이와 날개',
      frame: '‘예’ 칸의 동물들은 모두 ____________.'
    };
  },

  validate(p) {
    if (p.yes.length < 2 || p.no.length < 2) return '‘예’와 ‘아니요’ 보기 카드를 2장 이상씩 넣어 주세요.';
    if (p.testYes.length + p.testNo.length < 2) return '학생이 옮길 카드를 2장 이상 넣어 주세요.';
    return '';
  },

  Editor({ payload: p, set }) {
    const list = (key, label, hint) => (
      <ListField id={'ca-' + key} label={label} hint={hint} list={p[key]} onChange={(v) => set({ ...p, [key]: v })} />
    );
    return (
      <div class="stack-lg">
        <div class="field">
          <label for="ca-name">숨겨 둘 개념 이름</label>
          <input id="ca-name" class="input" value={p.conceptName} onInput={(e) => set({ ...p, conceptName: e.currentTarget.value })} placeholder="예: 곤충" />
          <span class="hint">학생 화면에는 보이지 않아요. 제출 현황에서 선생님만 봐요.</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
          {list('yes', '‘예’ 보기 카드', '선생님이 미리 놓아 두는 카드예요. 3장 정도가 알맞아요.')}
          {list('no', '‘아니요’ 보기 카드', '헷갈리기 쉬운 것을 넣으면 생각이 깊어져요. (예: 거미)')}
          {list('testYes', '학생이 옮길 카드 (정답: 예)', '학생 화면에서는 섞여서 보여요.')}
          {list('testNo', '학생이 옮길 카드 (정답: 아니요)', '정답은 제출 현황에서 다르게 놓은 카드를 표시할 때만 써요.')}
        </div>
        <div class="field">
          <label for="ca-look">살펴볼 점 (힌트)</label>
          <input id="ca-look" class="input" value={p.lookFor} onInput={(e) => set({ ...p, lookFor: e.currentTarget.value })} placeholder="예: 다리 수, 몸이 나뉜 부분" />
          <span class="hint">공통점을 찾는 단계에서 노란 상자로 보여요. 비워 두면 보이지 않아요.</span>
        </div>
        <div class="field">
          <label for="ca-frame">문장 틀</label>
          <input id="ca-frame" class="input" value={p.frame} onInput={(e) => set({ ...p, frame: e.currentTarget.value })} />
          <span class="hint">학생은 ‘문장 틀 없이 쓰기’를 눌러 끌 수 있어요.</span>
        </div>
      </div>
    );
  },

  emptyAnswer() {
    return { place: {}, common: '', frameOff: false, name: '', reason: '' };
  },

  useSteps({ payload: p, answer: a, set }) {
    const [selected, setSelected] = useState(null);
    const movable = [...p.testYes, ...p.testNo].sort(sortKo);
    const pool = movable.filter((c) => !a.place[c]);
    const placed = (zone) => movable.filter((c) => a.place[c] === zone);
    const drop = (zone) => {
      if (!selected) return;
      set({ ...a, place: { ...a.place, [selected]: zone } });
      setSelected(null);
    };
    const pick = (c) => setSelected(selected === c ? null : c);
    const tileFor = (c) => <button key={c} type="button" class="tile" aria-pressed={selected === c} onClick={() => pick(c)}>{c}</button>;
    const zone = (key, title, given, bg, color, dropBg) => (
      <div class="zone" style={`background:${bg}`}>
        {key === 'yes'
          ? <span class="deco" aria-hidden="true" style="right:-28px;bottom:-28px;width:110px;height:110px;border-radius:999px;background:#D7DEFF" />
          : <span class="deco" aria-hidden="true" style="right:-16px;bottom:-16px;width:96px;height:96px;border-radius:22px;background:#FFD6C7;transform:rotate(18deg)" />}
        <div class="row between">
          <span class="zone-title" style={`color:${color}`}>{title}</span>
          <button type="button" class="drop" style={selected ? `background:${dropBg}` : ''} disabled={!selected} onClick={() => drop(key)}>
            {selected ? `‘${selected}’ 여기에 놓기` : '여기에 놓기'}
          </button>
        </div>
        <div class="row" style="gap:8px">
          {given.map((c) => <span key={c} class="tile given">{c}<span class="tag" style={`color:${color}`}>보기</span></span>)}
          {placed(key).map(tileFor)}
        </div>
      </div>
    );
    const yesAll = [...p.yes, ...placed('yes')];

    return [
      {
        title: '선생님이 놓아 둔 카드를 보고, 남은 카드를 옮겨 보세요.',
        help: '카드를 누르고, 옮길 칸의 ‘여기에 놓기’를 누르면 돼요. 놓은 카드를 다시 누르면 옮길 수 있어요.',
        progress: movable.length ? Math.round((movable.length - pool.length) / movable.length * 100) : 100,
        canNext: pool.length === 0,
        blockedHint: `남은 카드 ${pool.length}장을 모두 옮기면 다음으로 갈 수 있어요.`,
        body: (
          <div class="stack" style="gap:16px">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">
              {zone('yes', '예', p.yes, '#E8ECFF', '#1F3BD1', '#3355FF')}
              {zone('no', '아니요', p.no, '#FFE9E0', '#B83C12', '#C9461A')}
            </div>
            <div class="dashed" style="padding:18px 20px;display:flex;flex-direction:column;gap:12px">
              <span class="label">남은 카드 {pool.length}</span>
              <div class="row" style="gap:10px;min-height:56px">
                {pool.map(tileFor)}
                {pool.length === 0 && <span style="font-weight:700;color:#136B41">다 옮겼어요. 다음 단계로 가 볼까요?</span>}
              </div>
            </div>
          </div>
        ),
        tips: <Tip title="어떻게 나누면 좋을까요?"><ul>{T.sort.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: '‘예’ 칸의 것들은 어떤 점이 같을까요?',
        help: '보기 카드와 내가 옮긴 카드를 함께 살펴보세요.',
        canNext: a.common.trim().length > 0,
        blockedHint: '공통점을 한 가지 이상 써 주세요.',
        body: (
          <div class="stack" style="gap:16px">
            <div class="row" style="gap:6px">{yesAll.map((c) => <span key={c} class="chip">{c}</span>)}</div>
            {p.lookFor && <p class="notice info"><strong>살펴볼 점</strong>&nbsp;{p.lookFor}</p>}
            <div class="field">
              <label for="ca-common" style="font-size:17px">{a.frameOff ? '공통점을 자유롭게 써 보세요.' : p.frame}</label>
              <textarea id="ca-common" class="textarea kid" rows="3" value={a.common} placeholder="여기에 써 보세요"
                onInput={(e) => set({ ...a, common: e.currentTarget.value })} />
            </div>
            <button type="button" class="btn ghost" style="align-self:flex-start" onClick={() => set({ ...a, frameOff: !a.frameOff })}>
              {a.frameOff ? '문장 틀 다시 보기' : '문장 틀 없이 쓰기'}
            </button>
          </div>
        ),
        tips: <Tip title="공통점을 잘 찾는 방법"><ul>{T.common.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: '‘예’ 칸의 무리에 이름을 붙여 보세요.',
        help: '내가 찾은 공통점이 잘 드러나는 이름이면 좋아요.',
        canNext: a.name.trim().length > 0,
        blockedHint: '이름을 지어 주세요.',
        body: (
          <div class="stack" style="gap:12px">
            <div class="field">
              <label for="ca-gname" style="font-size:17px">이 무리의 이름</label>
              <input id="ca-gname" class="input kid" style="max-width:400px;font-weight:700" value={a.name} placeholder="이름을 지어 보세요"
                onInput={(e) => set({ ...a, name: e.currentTarget.value })} />
            </div>
            <div class="field" style="margin-top:8px">
              <label for="ca-reason" style="font-size:17px">그렇게 이름 붙인 까닭</label>
              <textarea id="ca-reason" class="textarea kid" rows="3" value={a.reason} placeholder="왜냐하면 …"
                onInput={(e) => set({ ...a, reason: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <Tip title="이름 붙이기 도움말"><ul>{T.name.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      }
    ];
  },

  View({ payload: p, content: a }) {
    const answer = (c) => (p.testYes.includes(c) ? 'yes' : p.testNo.includes(c) ? 'no' : null);
    const inZone = (z) => [...(z === 'yes' ? p.yes : p.no), ...Object.keys(a.place || {}).filter((c) => a.place[c] === z)];
    const off = (c, z) => answer(c) && answer(c) !== z;
    const anyOff = ['yes', 'no'].some((z) => inZone(z).some((c) => off(c, z)));
    const box = (z, title, bg, color) => (
      <div style={`background:${bg};border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px`}>
        <span style={`font-family:var(--font-kid);font-size:22px;line-height:1;color:${color}`}>{title}</span>
        <div class="row" style="gap:4px">
          {inZone(z).map((c) => <span key={c} class="chip plain" style={off(c, z) ? 'border:2px dashed #C9461A;color:#6A2A06;font-weight:800' : 'border-color:transparent'}>{c}</span>)}
        </div>
      </div>
    );
    return (
      <div class="stack" style="gap:18px">
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
          {box('yes', '예', '#E8ECFF', '#1F3BD1')}
          {box('no', '아니요', '#FFE9E0', '#B83C12')}
        </div>
        {anyOff && <span class="small" style="color:#6A2A06;display:flex;align-items:center;gap:8px"><span aria-hidden="true" style="width:16px;height:16px;border:2px dashed #C9461A;border-radius:5px;display:inline-block" />선생님이 정한 칸과 다르게 놓은 카드 · 수업 대화 거리로 좋아요</span>}
        <Quote label="공통점" color="#3355FF">{a.common || '—'}</Quote>
        <Quote label="붙인 이름과 까닭" color="#FFD43B"><strong>{a.name || '—'}</strong>{a.reason ? ` — ${a.reason}` : ''}</Quote>
        {p.conceptName && <p class="small muted">선생님이 정한 개념: {p.conceptName}</p>}
      </div>
    );
  }
};

export function Quote({ label, color, children }) {
  return (
    <div style={`display:flex;flex-direction:column;gap:6px;padding-left:14px;border-left:3px solid ${color}`}>
      <span class="label">{label}</span>
      <p style="font-size:17px;font-weight:600;letter-spacing:-0.02em;white-space:pre-wrap">{children}</p>
    </div>
  );
}
