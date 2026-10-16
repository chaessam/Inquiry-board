import { useEffect, useState } from 'preact/hooks';
import qrcode from 'qrcode-generator';

export function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#3355FF" />
      <path d="M32 23a9 9 0 0 1-9 9h-7A16 16 0 0 1 32 16z" fill="#FFD43B" />
      <rect x="7" y="7" width="9" height="9" rx="2.5" fill="#FFFFFF" />
    </svg>
  );
}

export function Brand({ href = '#/' }) {
  return <a class="brand" href={href}><Logo /><span>탐구보드</span></a>;
}

// 접었다 펼 수 있는 도움말 상자. 처음 보는 학생도 이해하도록 짧고 친절하게.
export function Tip({ title, children, open = false, tone }) {
  return (
    <details class={'tip' + (tone ? ' ' + tone : '')} open={open}>
      <summary><span class="tip-icon" aria-hidden="true">?</span>{title}</summary>
      <div class="tip-body">{children}</div>
    </details>
  );
}

export function Donut({ value, total, size = 64, label }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const part = total ? Math.min(1, value / total) : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label || `${total}명 중 ${value}명`} style="flex:none">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8ECFF" stroke-width="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3355FF" stroke-width="8" stroke-linecap="round"
        stroke-dasharray={`${(c * part).toFixed(1)} ${c.toFixed(1)}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 5} text-anchor="middle" font-size={size / 4.2} font-weight="800" fill="#161B2E" font-family="Gothic A1, sans-serif">{value}</text>
    </svg>
  );
}

export function Dialog({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div class="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div class="dialog" role="dialog" aria-modal="true" aria-label={title} style={wide ? 'width:min(820px,100%)' : ''}>
        <div class="row between">
          <h2 class="title-md">{title}</h2>
          {onClose && <button type="button" class="icon-btn" aria-label="닫기" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="#161B2E" stroke-width="2" stroke-linecap="round" /></svg>
          </button>}
        </div>
        {children}
      </div>
    </div>
  );
}

let toastListener = null;
export function toast(message) { toastListener?.(message); }
export function ToastHost() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    let timer;
    toastListener = (m) => { setMsg(m); clearTimeout(timer); timer = setTimeout(() => setMsg(''), 2600); };
    return () => { toastListener = null; };
  }, []);
  return msg ? <div class="toast" role="status">{msg}</div> : null;
}

export function QR({ text, size = 220 }) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return (
    <svg width={size} height={size} viewBox={`-2 -2 ${n + 4} ${n + 4}`} role="img" aria-label="교실 들어가기 QR 코드" shape-rendering="crispEdges">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
      <path d={d} fill="#161B2E" />
    </svg>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return <p class="notice err" role="alert">{String(error.message || error)}</p>;
}

export function Loading({ text = '불러오는 중…' }) {
  return <p class="muted" role="status" style="padding:24px 0">{text}</p>;
}

export function joinUrl(code) {
  return `${location.origin}/#/j/${code}`;
}
