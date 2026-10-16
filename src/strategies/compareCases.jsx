import { Tip } from '../ui/kit.jsx';
import { COMPARE_TIPS as T } from '../content/guides.js';
import { ListField } from './Shell.jsx';
import { Quote } from './conceptAttainment.jsx';

const key = (i, j) => `${i}-${j}`;

// 사례는 가로(열), 기준은 세로(행). 한 줄을 가로로 읽으면 한 기준에서 사례들이 비교돼요.
function CompareTable({ p, cells }) {
  const th = 'text-align:left;padding:10px 12px;font-size:14px;font-weight:800;vertical-align:bottom';
  const td = 'padding:10px 12px;font-size:14px;line-height:1.5;vertical-align:top;white-space:pre-wrap;background:#fff;border-radius:10px';
  return (
    <div style="overflow-x:auto;margin:0 -4px;padding:0 4px">
      <table style={`border-collapse:separate;border-spacing:6px;min-width:${120 + p.cases.length * 130}px;width:100%;background:var(--ground);border-radius:16px`}>
        <thead>
          <tr>
            <th style={th + ';color:var(--ink-3);font-size:12px'}>기준 \ 사례</th>
            {p.cases.map((c) => <th key={c} style={th + ';background:var(--blue-soft);color:var(--blue-deep);border-radius:10px;font-family:var(--font-kid);font-weight:400;font-size:18px'}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {p.criteria.map((r, j) => (
            <tr key={r}>
              <th scope="row" style={th + ';vertical-align:top;background:var(--butter-soft);color:var(--butter-text);border-radius:10px;width:120px'}>{r}</th>
              {p.cases.map((c, i) => <td key={c} style={td}>{cells?.[key(i, j)] || <span style="color:var(--faint)">—</span>}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const compareCases = {
  id: 'compare-cases',
  name: '사례 비교표',
  stage: 'investigate',
  summary: '여러 사례를 같은 기준으로 살펴보고, 같은 점과 다른 점에서 패턴을 찾아요.',
  forTeacher: '비교할 사례와 살펴볼 기준을 정해 주세요. 학생은 사례를 하나씩 조사해 표를 채운 뒤, 표 전체를 보며 같은 점과 다른 점을 찾고 알게 된 점을 문장으로 써요. 기준에 단원의 핵심 개념을 넣으면 사실에서 개념으로 올라가기 쉬워요.',

  defaultPayload() {
    return { cases: [], criteria: [], source: '', frame: '여러 사례를 비교해 보니 ____.' };
  },

  example() {
    return {
      title: '사는 곳이 다르면 무엇이 다를까?',
      cases: ['사막여우', '북극곰', '수달', '두더지'],
      criteria: ['사는 곳 (서식지)', '눈에 띄는 몸의 특징', '그 특징이 살아가는 데 어떻게 도움이 될까?'],
      source: '과학책과 선생님이 나눠 준 동물 카드를 살펴보세요.',
      frame: '사는 곳이 다른 동물들을 비교해 보니 ____.'
    };
  },

  validate(p) {
    if (p.cases.length < 2) return '비교할 사례를 2개 이상 넣어 주세요.';
    if (p.cases.length > 6) return '사례는 6개까지 넣을 수 있어요.';
    if (p.criteria.length < 2) return '살펴볼 기준을 2개 이상 넣어 주세요.';
    if (p.criteria.length > 5) return '기준은 5개까지 넣을 수 있어요.';
    if (new Set(p.cases).size < p.cases.length || new Set(p.criteria).size < p.criteria.length) return '같은 사례나 기준이 두 번 들어 있어요.';
    return '';
  },

  Editor({ payload: p, set }) {
    return (
      <div class="stack-lg">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
          <ListField id="cc-cases" label="비교할 사례" list={p.cases} hint="한 줄에 하나씩, 3~4개가 알맞아요. 학생은 사례를 하나씩 차례로 채워요."
            onChange={(v) => set({ ...p, cases: v })} />
          <ListField id="cc-criteria" label="살펴볼 기준" list={p.criteria} hint="한 줄에 하나씩, 2~4개. 마지막 기준을 ‘왜, 어떻게’ 질문으로 두면 생각이 깊어져요."
            onChange={(v) => set({ ...p, criteria: v })} />
        </div>
        <div class="field">
          <label for="cc-source">찾아볼 자료 (선택)</label>
          <input id="cc-source" class="input" value={p.source} placeholder="예: 과학책 30~35쪽, 동물 카드"
            onInput={(e) => set({ ...p, source: e.currentTarget.value })} />
          <span class="hint">표를 채우는 단계마다 노란 상자로 보여요.</span>
        </div>
        <div class="field">
          <label for="cc-frame">알게 된 점 문장 틀</label>
          <input id="cc-frame" class="input" value={p.frame} onInput={(e) => set({ ...p, frame: e.currentTarget.value })} />
          <span class="hint">마지막 단계에서 학생이 이 문장을 이어 써요.</span>
        </div>
      </div>
    );
  },

  emptyAnswer() {
    return { cells: {}, same: '', diff: '', learned: '' };
  },

  useSteps({ payload: p, answer: a, set }) {
    const cells = a.cells || {};
    const filled = (i, j) => (cells[key(i, j)] || '').trim().length > 0;
    const setCell = (i, j, v) => set({ ...a, cells: { ...cells, [key(i, j)]: v } });
    const tips = <Tip title="표를 잘 채우는 방법"><ul>{T.fill.map((t) => <li key={t}>{t}</li>)}</ul></Tip>;

    const caseSteps = p.cases.map((c, i) => {
      const done = p.criteria.filter((_, j) => filled(i, j)).length;
      return {
        title: <>사례 {i + 1} · <span class="chip" style="font-family:var(--font-kid);font-size:20px;font-weight:400;padding:4px 14px">{c}</span> 을/를 살펴봐요.</>,
        help: '기준마다 알아낸 것을 짧게 써요.',
        progress: Math.round(done / p.criteria.length * 100),
        canNext: done === p.criteria.length,
        blockedHint: `빈칸 ${p.criteria.length - done}개를 채우면 다음으로 갈 수 있어요.`,
        body: (
          <div class="stack-lg">
            {p.source && <p class="notice info"><strong style="flex:none">찾아볼 자료</strong>{p.source}</p>}
            {p.criteria.map((r, j) => (
              <div class="field" key={key(i, j)}>
                <label for={`cc-${i}-${j}`} style="font-size:17px">{r}</label>
                <textarea id={`cc-${i}-${j}`} class="textarea kid" rows="2" value={cells[key(i, j)] || ''}
                  onInput={(e) => setCell(i, j, e.currentTarget.value)} />
              </div>
            ))}
          </div>
        ),
        tips
      };
    });

    return [
      ...caseSteps,
      {
        title: '표를 보고 같은 점과 다른 점을 찾아요.',
        help: '표를 가로로 한 줄씩 읽어 보세요. 휴대폰에서는 표를 옆으로 밀어 볼 수 있어요.',
        canNext: a.same.trim().length > 0 && a.diff.trim().length > 0,
        blockedHint: '같은 점과 다른 점을 모두 써 주세요.',
        body: (
          <div class="stack-lg">
            <CompareTable p={p} cells={cells} />
            <div class="field">
              <label for="cc-same" style="font-size:17px">같은 점 · 사례들은 모두 (또는 대부분) …</label>
              <textarea id="cc-same" class="textarea kid" rows="3" value={a.same} onInput={(e) => set({ ...a, same: e.currentTarget.value })} />
            </div>
            <div class="field">
              <label for="cc-diff" style="font-size:17px">다른 점 · … 은/는 … 이/가 다르다.</label>
              <textarea id="cc-diff" class="textarea kid" rows="3" value={a.diff} onInput={(e) => set({ ...a, diff: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <Tip title="패턴 찾기 도움말"><ul>{T.pattern.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: '비교해서 알게 된 점을 한 문장으로 써요.',
        help: '같은 점과 다른 점을 보고, 여러 사례에 두루 통하는 생각을 써 보세요.',
        canNext: a.learned.trim().length > 0,
        blockedHint: '알게 된 점을 써 주세요.',
        body: (
          <div class="stack-lg">
            <Quote label="같은 점" color="#3355FF">{a.same}</Quote>
            <Quote label="다른 점" color="#FF6B3D">{a.diff}</Quote>
            <div class="field">
              <label for="cc-learned" style="font-size:17px">{p.frame || '여러 사례를 비교해 보니 ____.'}</label>
              <textarea id="cc-learned" class="textarea kid" rows="3" value={a.learned} placeholder="여기에 써 보세요"
                onInput={(e) => set({ ...a, learned: e.currentTarget.value })} />
            </div>
          </div>
        ),
        tips: <Tip title="알게 된 점 쓰는 방법"><ul>{T.learned.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      }
    ];
  },

  View({ payload: p, content: a }) {
    return (
      <div class="stack" style="gap:18px">
        <CompareTable p={p} cells={a.cells} />
        <Quote label="같은 점" color="#3355FF">{a.same || '—'}</Quote>
        <Quote label="다른 점" color="#FF6B3D">{a.diff || '—'}</Quote>
        <Quote label="알게 된 점" color="#FFD43B">{a.learned || '—'}</Quote>
      </div>
    );
  }
};
