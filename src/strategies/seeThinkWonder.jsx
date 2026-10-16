import { Tip } from '../ui/kit.jsx';
import { SEE_THINK_WONDER_TIPS as T } from '../content/guides.js';
import { Quote } from './conceptAttainment.jsx';

export const seeThinkWonder = {
  id: 'see-think-wonder',
  name: '보고-생각하고-궁금해하기',
  stage: 'connect',
  summary: '사진이나 물건을 자세히 보고, 떠오른 생각과 궁금한 점을 차례로 써요.',
  forTeacher: '사진, 영상, 실물처럼 함께 볼 자료를 화면에 띄우거나 나눠 주세요. 학생은 ‘보이는 것’과 ‘생각’을 나누어 쓰고, 마지막에 궁금한 점을 질문으로 만들어요. 모인 질문은 단원 탐구 질문을 고를 때 좋은 재료가 돼요.',

  defaultPayload() {
    return { material: '', focus: '' };
  },

  example() {
    return {
      title: '이 동물은 어디에서 살까?',
      material: '선생님이 화면에 띄운 사막여우 사진을 자세히 살펴보세요.',
      focus: '귀의 크기, 털 색, 발바닥, 동물 주변의 모습'
    };
  },

  validate(p) {
    return p.material.trim() ? '' : '학생이 살펴볼 자료를 알려 주세요.';
  },

  Editor({ payload: p, set }) {
    return (
      <div class="stack-lg">
        <div class="field">
          <label for="stw-material">살펴볼 자료</label>
          <textarea id="stw-material" class="textarea" rows="2" value={p.material} placeholder="예: 선생님이 화면에 띄운 사막여우 사진을 자세히 살펴보세요."
            onInput={(e) => set({ ...p, material: e.currentTarget.value })} />
          <span class="hint">학생 화면 맨 위에 보여요. 자료는 교실 화면에 띄우거나 실물로 나눠 주세요.</span>
        </div>
        <div class="field">
          <label for="stw-focus">살펴볼 곳 (선택)</label>
          <input id="stw-focus" class="input" value={p.focus} placeholder="예: 귀의 크기, 털 색, 주변 모습"
            onInput={(e) => set({ ...p, focus: e.currentTarget.value })} />
          <span class="hint">‘보기’ 단계에서 노란 상자로 보여요. 처음 하는 반이라면 넣어 주는 게 좋아요.</span>
        </div>
      </div>
    );
  },

  emptyAnswer() {
    return { see: '', think: '', wonder: '' };
  },

  useSteps({ payload: p, answer: a, set }) {
    // 단계마다 key를 달리해 글상자를 새로 만들어요. (한글 입력 중 단계를 넘겨도 글이 옆 단계로 옮겨 가지 않게)
    const box = (key, label, placeholder, rows = 4) => (
      <div class="field" key={key}>
        <label for={'stw-' + key} style="font-size:17px">{label}</label>
        <textarea id={'stw-' + key} class="textarea kid" rows={rows} value={a[key]} placeholder={placeholder}
          onInput={(e) => set({ ...a, [key]: e.currentTarget.value })} />
      </div>
    );
    const material = <p class="notice info" style="font-size:15px"><strong style="flex:none">살펴볼 자료</strong>{p.material}</p>;
    return [
      {
        title: '무엇이 보이나요?',
        help: '생각은 잠깐 미뤄 두고, 눈에 보이는 것만 써 보세요.',
        canNext: a.see.trim().length > 0,
        blockedHint: '보이는 것을 한 가지 이상 써 주세요.',
        body: (
          <div class="stack-lg">
            {material}
            {p.focus && <div class="row" style="gap:6px"><span class="label">살펴볼 곳</span>{p.focus.split(/\s*[,、]\s*/).filter(Boolean).map((f) => <span key={f} class="chip butter">{f}</span>)}</div>}
            {box('see', '나는 … 을/를 보았어요.', '한 줄에 하나씩 써도 좋아요.', 5)}
          </div>
        ),
        tips: <Tip title="잘 보는 방법"><ul>{T.see.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: '본 것을 보고 어떤 생각이 드나요?',
        help: '‘왜 그렇게 생각했는지’ 내가 본 것을 근거로 들어 보세요.',
        canNext: a.think.trim().length > 0,
        blockedHint: '내 생각을 써 주세요.',
        body: (
          <div class="stack-lg">
            <Quote label="내가 본 것" color="#3355FF">{a.see}</Quote>
            {box('think', '… 인 것 같아요. 왜냐하면 … 이 보이기 때문이에요.', '예: 아마 ~일 것 같아요. 왜냐하면 ~')}
          </div>
        ),
        tips: <Tip title="생각을 쓰는 방법"><ul>{T.think.map((t) => <li key={t}>{t}</li>)}</ul></Tip>
      },
      {
        title: '무엇이 궁금한가요?',
        help: '보고 생각하다가 떠오른 궁금한 점을 질문으로 써 보세요.',
        canNext: a.wonder.trim().length > 0,
        blockedHint: '궁금한 점을 한 가지 이상 써 주세요.',
        body: (
          <div class="stack-lg">
            <Quote label="내가 본 것" color="#3355FF">{a.see}</Quote>
            <Quote label="내 생각" color="#FFD43B">{a.think}</Quote>
            {box('wonder', '나는 … 이/가 궁금해요.', '물음표(?)로 끝나는 질문으로 써 보세요.')}
          </div>
        ),
        tips: (
          <Tip title="좋은 질문 만들기">
            <ul>{T.wonder.map((t) => <li key={t}>{t}</li>)}</ul>
            <p><strong>이렇게 시작해 보세요</strong></p>
            <div class="row" style="gap:6px">{T.starters.map((s) => <span key={s} class="chip plain">{s}</span>)}</div>
          </Tip>
        )
      }
    ];
  },

  View({ content: a }) {
    return (
      <div class="stack" style="gap:18px">
        <Quote label="보았어요" color="#3355FF">{a.see || '—'}</Quote>
        <Quote label="생각해요" color="#FFD43B">{a.think || '—'}</Quote>
        <Quote label="궁금해요" color="#FF6B3D">{a.wonder || '—'}</Quote>
      </div>
    );
  }
};
