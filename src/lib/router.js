import { useEffect, useState } from 'preact/hooks';

// 주소 # 뒤를 화면 경로로 씁니다. 예: #/t/a/abc123
export function useHashPath() {
  const read = () => (location.hash.replace(/^#/, '') || '/');
  const [path, setPath] = useState(read);
  useEffect(() => {
    const on = () => { setPath(read()); window.scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return path;
}

export function go(path) {
  location.hash = path;
}

// '/t/a/:id' 같은 모양과 맞으면 { id } 를 돌려줍니다.
export function match(pattern, path) {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('?')[0].split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
