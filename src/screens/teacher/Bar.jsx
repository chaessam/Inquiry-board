import { Brand } from '../../ui/kit.jsx';
import { go } from '../../lib/router.js';

export function TeacherBar({ teacher, setTeacher, room, current }) {
  const many = teacher.classrooms.length > 1;
  const link = (href, name, key) => <a href={href} aria-current={current === key ? 'page' : undefined}>{name}</a>;
  return (
    <header class="topbar">
      <div class="topbar-in">
        <Brand href="#/t" />
        <nav class="nav" aria-label="주 메뉴">
          {link('#/t', '단원', 'home')}
          {link('#/t/class', '교실', 'class')}
          {link('#/t/archive', '보관함', 'archive')}
        </nav>
        <div class="spacer" />
        <a href="#/t/class" class="btn small" title="학생에게 알려 줄 교실 코드" style="gap:8px">
          <span class="muted" style="font-weight:500">교실 코드</span>
          <strong style="letter-spacing:0.14em;font-weight:800">{room.code}</strong>
        </a>
        {many ? (
          <label class="row" style="gap:6px">
            <span class="sr-only">교실 고르기</span>
            <select class="select" style="min-height:40px;padding:0 12px;width:auto;font-weight:700" value={room.id}
              onChange={(e) => { setTeacher({ ...teacher, currentId: e.currentTarget.value }); go('/t'); }}>
              {teacher.classrooms.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
        ) : (
          <span class="btn small" style="cursor:default;gap:8px"><span aria-hidden="true" style="width:26px;height:26px;border-radius:8px;background:#FFF6D1;color:#6B5300;display:grid;place-items:center;font-weight:800;font-size:12px">{room.size}</span>{room.label}</span>
        )}
      </div>
    </header>
  );
}
