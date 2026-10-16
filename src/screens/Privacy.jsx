import { Brand } from '../ui/kit.jsx';
import { OPERATOR } from '../content/privacy.js';

const fill = (v) => v || '[채워 주세요]';

export function Privacy() {
  const back = () => (history.length > 1 ? history.back() : (location.hash = '#/'));
  return (
    <>
      <header class="topbar"><div class="topbar-in"><Brand href="#/" /></div></header>
      <main class="page tight" style="gap:28px">
        <div class="stack" style="gap:8px">
          <span class="eyebrow">개인정보 안내</span>
          <h1 class="title-lg">내 정보는 이렇게 다뤄요</h1>
          <p class="muted">탐구보드은 학생 이름을 서버에 보내지 않고, 제출물도 잠깐만 보관하도록 만들었어요.</p>
        </div>

        <section class="card stack">
          <h2 class="title-md">한눈에 보기</h2>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <thead>
                <tr style="text-align:left;border-bottom:2px solid var(--ink)">
                  <th style="padding:8px 8px 8px 0">무엇을</th><th style="padding:8px">어디에</th><th style="padding:8px">얼마나 오래</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['학생 이름(명렬표), 단원 정보, 받아 둔 결과물', '선생님 기기', '선생님이 지울 때까지'],
                  ['학생이 쓰는 중인 답, 내 번호', '학생 기기', '‘이 기기에서 지우기’를 누를 때까지'],
                  ['교실 이름, 학생 수, 교실 코드', '서버', '1년 동안 쓰지 않으면 삭제'],
                  ['과제, 학생이 낸 답(번호와 기기 표시만)', '서버', '마감 후 14일이 지나면 자동 삭제'],
                  ['접속 주소의 해시(장난 요청 막기용)', '서버', '최대 1시간 뒤 삭제']
                ].map(([a, b, c]) => (
                  <tr key={a} style="border-bottom:1px solid var(--line)">
                    <td style="padding:10px 8px 10px 0">{a}</td><td style="padding:10px 8px">{b}</td><td style="padding:10px 8px">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section class="stack">
          <h2 class="title-md">모으지 않는 것</h2>
          <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
            <li>학생의 이름, 전화번호, 이메일, 사진은 서버로 보내지 않아요.</li>
            <li>회원 가입이 없어요. 선생님은 ‘교실 이름과 비밀번호 4자리’로, 학생은 ‘교실 코드와 번호’로 들어와요.</li>
            <li>광고, 방문 통계, 추적 쿠키를 쓰지 않아요. 글꼴도 앱 안에 넣어 두어 외부로 요청이 나가지 않아요.</li>
          </ul>
        </section>

        <section class="stack">
          <h2 class="title-md">서버에 보관하는 것</h2>
          <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
            <li><strong>왜:</strong> 선생님이 낸 과제를 학생이 받고, 학생이 낸 답을 선생님이 받기 위해서예요.</li>
            <li><strong>무엇을:</strong> 과제 내용, 학생이 낸 답, 번호, 같은 기기인지 알아보는 무작위 표시예요. 기기 표시는 기기 정보가 아니라 처음 들어올 때 만든 임의의 글자예요.</li>
            <li><strong>선생님 비밀번호:</strong> 서버에는 그대로 저장하지 않고, 되돌릴 수 없는 암호(해시)로만 저장해요. 5번 틀리면 잠시 잠겨요.</li>
            <li><strong>기기 열쇠:</strong> 선생님이 들어온 기기마다 무작위 열쇠를 만들어 기기에 저장해요. 서버에는 해시로만 남겨요.</li>
            <li><strong>어디에:</strong> Cloudflare의 서버(Pages, D1 데이터베이스)에 저장돼요.</li>
            <li><strong>지우기:</strong> 기한이 지나면 자동으로 지워져요. 선생님은 ‘과제 지우기’, ‘교실 완전히 지우기’로 언제든 바로 지울 수 있어요.</li>
          </ul>
        </section>

        <section class="stack">
          <h2 class="title-md">기기에 저장하는 것</h2>
          <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
            <li>쓰는 중인 답, 명렬표, 받아 둔 결과물은 브라우저 저장소(IndexedDB)에 있어요. 다른 사람은 볼 수 없어요.</li>
            <li>여러 명이 함께 쓰는 기기라면 다 쓴 뒤 ‘이 기기에서 지우기’를 눌러 주세요.</li>
            <li>브라우저 기록을 지우면 기기에 저장된 내용도 함께 지워질 수 있어요. 선생님은 보관함의 ‘파일로 백업’을 써 주세요.</li>
          </ul>
        </section>

        <section class="card soft-butter stack" style="border:0">
          <h2 class="title-md">선생님께</h2>
          <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
            <li>학교에서 쓰기 전에 학교의 학습지원 소프트웨어 선정·심의 절차를 확인해 주세요.</li>
            <li>학생에게 활동지에 이름이나 개인적인 정보를 쓰지 않도록 안내해 주세요.</li>
          </ul>
        </section>

        <section class="stack small muted">
          <p>운영: {fill(OPERATOR.name)}</p>
          <p>문의: <a href={OPERATOR.blog} target="_blank" rel="noopener noreferrer">{OPERATOR.blog.replace(/^https?:\/\//, '')}</a> (블로그)</p>
          <p>안내 날짜: {OPERATOR.updated}</p>
        </section>
        <div class="row"><button type="button" class="btn" onClick={back}>돌아가기</button></div>
      </main>
    </>
  );
}

export function FooterLinks() {
  return (
    <footer class="no-print" style="text-align:center;padding:0 16px 32px">
      <a href="#/privacy" class="small" style="color:var(--ink-2)">개인정보 안내</a>
    </footer>
  );
}
