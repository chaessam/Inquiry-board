import { Brand } from '../../ui/kit.jsx';

export function StudentBar({ student, children }) {
  return (
    <header class="topbar">
      <div class="topbar-in" style="max-width:960px">
        <Brand href="#/s" />
        {children}
        <div class="spacer" />
        <span class="row" style="gap:10px;flex-wrap:nowrap">
          <span class="small muted" style="text-align:right;line-height:1.3">{student.label}</span>
          <span aria-label={`${student.number}번`} style="width:40px;height:40px;border-radius:12px;background:#FFD43B;color:#3D2E00;display:grid;place-items:center;font-family:var(--font-kid);font-size:18px">{student.number}</span>
        </span>
      </div>
    </header>
  );
}
