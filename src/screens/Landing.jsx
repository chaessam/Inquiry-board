import { Logo, Tip } from '../ui/kit.jsx';

// 첫 화면: 개념기반탐구 수업 종합 도구로 소개
const USES = [
  {
    title: '함께 보며 생각해요',
    text: 'TV나 전자칠판에 띄워 반 친구들의 생각을 크게 모아 보고, 비교하며 이야기 나눠요.',
    art: (
      <span aria-hidden="true" style="position:relative;display:block;width:56px;height:56px;border-radius:16px;background:#3355FF;overflow:hidden">
        <span style="position:absolute;left:10px;top:12px;width:36px;height:24px;border-radius:6px;background:#fff" />
        <span style="position:absolute;right:-10px;bottom:-10px;width:30px;height:30px;border-radius:999px;background:#FFD43B" />
      </span>
    )
  },
  {
    title: '각자 쓰고 바로 내요',
    text: '학생은 크롬북·태블릿·휴대폰에서 사고전략을 한 단계씩 채우고 선생님께 바로 제출해요.',
    art: (
      <span aria-hidden="true" style="position:relative;display:block;width:56px;height:56px;border-radius:16px;background:#FFD43B;overflow:hidden">
        <span style="position:absolute;left:8px;bottom:-14px;width:40px;height:28px;border-radius:40px 40px 0 0;background:#FF6B3D" />
        <span style="position:absolute;right:10px;top:10px;width:14px;height:14px;border-radius:4px;background:#fff" />
      </span>
    )
  },
  {
    title: '탐구 흐름을 따라가요',
    text: '단원의 개념 렌즈와 핵심 개념을 정하면, 관계맺기부터 성찰까지 단계마다 알맞은 사고전략을 골라 줘요.',
    art: (
      <span aria-hidden="true" style="position:relative;display:block;width:56px;height:56px;border-radius:16px;background:#DDF5E9;overflow:hidden">
        <span style="position:absolute;left:8px;top:30px;width:40px;height:3px;background:#161B2E" />
        <span style="position:absolute;left:6px;top:25px;width:12px;height:12px;border-radius:999px;background:#161B2E" />
        <span style="position:absolute;left:22px;top:23px;width:16px;height:16px;border-radius:999px;background:#3355FF" />
        <span style="position:absolute;left:40px;top:25px;width:12px;height:12px;border-radius:999px;background:#fff;border:2px solid #C5CAD8;box-sizing:border-box" />
      </span>
    )
  }
];

export function Landing({ teacher, student }) {
  return (
    <main class="page narrow" style="padding-top:56px;gap:40px">
      <section class="stack" style="align-items:flex-start;gap:16px;max-width:680px">
        <Logo size={48} />
        <span class="eyebrow">개념기반탐구 수업 도구</span>
        <h1 class="title-xl">사실에서 개념으로,<br />함께 깊어지는 생각</h1>
        <p class="muted" style="font-size:17px">탐구보드는 개념기반탐구 수업을 위한 종합 도구예요. 개념 획득, 프레이어 모델, 일반화 같은 사고전략을 함께 보며 생각하고, 학생들에게 과제로 내주고 제출도 받을 수 있어요.</p>
      </section>

      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
        {USES.map((u) => (
          <div key={u.title} class="card stack" style="gap:12px">
            {u.art}
            <h2 style="font-size:17px;font-weight:800;letter-spacing:-0.03em">{u.title}</h2>
            <p class="small muted" style="line-height:1.6">{u.text}</p>
          </div>
        ))}
      </section>

      <section class="stack" style="gap:12px">
        <h2 class="label">어떻게 들어갈까요?</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">
          <a class="card" href={teacher?.classrooms?.length ? '#/t' : '#/t/start'} style="text-decoration:none;color:inherit;display:flex;align-items:center;gap:18px;border:2px solid var(--ink)">
            <span class="stack" style="gap:2px;flex:1">
              <span class="title-md">선생님</span>
              <span class="muted">{teacher?.classrooms?.length ? '내 교실로 가기' : '새 교실을 만들거나 내 교실에 들어가요'}</span>
            </span>
            <span aria-hidden="true" style="font-size:22px;font-weight:800">→</span>
          </a>
          <a class="card" href={student ? '#/s' : '#/join'} style="text-decoration:none;color:inherit;display:flex;align-items:center;gap:18px">
            <span class="stack" style="gap:2px;flex:1">
              <span class="title-md">학생</span>
              <span class="muted">{student ? `${student.label} ${student.number}번으로 들어가기` : '교실 코드를 넣고 들어가요'}</span>
            </span>
            <span aria-hidden="true" style="font-size:22px;font-weight:800">→</span>
          </a>
        </div>
      </section>

      <Tip title="내 정보는 어디에 저장되나요?">
        <ul>
          <li>쓰는 중인 답, 단원 정보, 학생 이름(명렬표)은 <strong>이 기기에만</strong> 저장돼요.</li>
          <li>서버에는 과제와 제출한 답만 <strong>마감 후 14일 동안</strong> 잠깐 보관했다가 지워요. 서버는 학생 이름을 몰라요. 번호만 알아요.</li>
          <li>여러 명이 함께 쓰는 기기라면 다 쓴 뒤 ‘이 기기에서 지우기’를 눌러 주세요.</li>
        </ul>
        <a href="#/privacy" style="font-weight:700">개인정보 안내 자세히 보기 →</a>
      </Tip>
    </main>
  );
}
