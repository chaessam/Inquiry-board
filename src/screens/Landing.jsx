import { Logo, Tip } from '../ui/kit.jsx';

export function Landing({ teacher, student }) {
  return (
    <main class="page tight" style="padding-top:56px">
      <div class="stack" style="align-items:flex-start;gap:16px">
        <Logo size={48} />
        <h1 class="title-xl">생각틀</h1>
        <p class="muted" style="font-size:17px">개념기반탐구 수업을 위한 사고전략 활동지예요. 선생님은 활동지를 만들어 과제로 내고, 학생은 기기에서 바로 쓰고 제출해요.</p>
      </div>

      <div class="stack" style="gap:12px">
        <a class="card" href={teacher?.classrooms?.length ? '#/t' : '#/t/start'} style="text-decoration:none;color:inherit;display:flex;align-items:center;gap:18px">
          <span aria-hidden="true" style="flex:none;width:56px;height:56px;border-radius:16px;background:#3355FF;position:relative;overflow:hidden">
            <span style="position:absolute;right:-12px;top:-12px;width:40px;height:40px;border-radius:999px;background:#FFD43B" />
          </span>
          <span class="stack" style="gap:2px">
            <span class="title-md">선생님</span>
            <span class="muted">{teacher?.classrooms?.length ? '내 교실로 가기' : '교실을 만들고 과제를 내요'}</span>
          </span>
        </a>
        <a class="card" href={student ? '#/s' : '#/join'} style="text-decoration:none;color:inherit;display:flex;align-items:center;gap:18px">
          <span aria-hidden="true" style="flex:none;width:56px;height:56px;border-radius:16px;background:#FFD43B;position:relative;overflow:hidden">
            <span style="position:absolute;left:8px;bottom:-14px;width:40px;height:28px;border-radius:40px 40px 0 0;background:#FF6B3D" />
          </span>
          <span class="stack" style="gap:2px">
            <span class="title-md">학생</span>
            <span class="muted">{student ? `${student.label} ${student.number}번으로 들어가기` : '교실 코드를 넣고 들어가요'}</span>
          </span>
        </a>
      </div>

      <Tip title="내 정보는 어디에 저장되나요?">
        <ul>
          <li>쓰는 중인 답, 단원 정보, 학생 이름(명렬표)은 <strong>이 기기에만</strong> 저장돼요.</li>
          <li>서버에는 과제와 제출한 답만 <strong>마감 후 14일 동안</strong> 잠깐 보관했다가 지워요. 서버는 학생 이름을 몰라요. 번호만 알아요.</li>
          <li>여러 명이 함께 쓰는 기기라면 다 쓴 뒤 ‘이 기기에서 지우기’를 눌러 주세요.</li>
        </ul>
      </Tip>
    </main>
  );
}
