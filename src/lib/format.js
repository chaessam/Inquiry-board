const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export function fmtDate(ms) {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEK[d.getDay()]})`;
}

export function fmtTime(ms) {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${hh}시${m ? ` ${m}분` : ''}`;
}

export function fmtDateTime(ms) {
  return `${fmtDate(ms)} ${fmtTime(ms)}`;
}

// <input type="datetime-local"> 값 <-> 밀리초
export function toLocalInput(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromLocalInput(v) {
  return new Date(v).getTime();
}

// 다음 수업일 오후 3시를 기본 마감으로
export function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + (d.getDay() === 5 ? 3 : d.getDay() === 6 ? 2 : 1));
  d.setHours(15, 0, 0, 0);
  return d.getTime();
}

export function groupKey(key) {
  return key.replace(/(.{4})(?=.)/g, '$1-');
}

export function remaining(deadline) {
  const diff = deadline - Date.now();
  if (diff <= 0) return '마감됨';
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}분 남음`;
  if (h < 24) return `${h}시간 남음`;
  return `${Math.floor(h / 24)}일 남음`;
}
