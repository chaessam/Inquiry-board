import { useState } from 'preact/hooks';
import { byId } from '../../strategies/index.jsx';
import { GATHERS } from '../../strategies/gather.jsx';

const readNames = () => { try { return localStorage.getItem('gather-names') !== 'num'; } catch { return true; } };

// 번호마다 마지막으로 낸 답 하나만 (같은 번호로 여러 기기에서 냈으면 가장 늦게 낸 것)
export function latestByNumber(submissions) {
  const best = {};
  for (const s of submissions) if (!best[s.number] || s.submitted_at > best[s.number].submitted_at) best[s.number] = s;
  return Object.values(best).sort((a, b) => a.number - b.number);
}

// 모아 보기: 학생들이 낸 답을 한 화면에 모아 칠판에 띄워요
export function GatherView({ assignment, submissions, size, roster = [], onBank }) {
  const [names, setNames] = useState(readNames);
  const s = byId[assignment.strategy];
  const subs = latestByNumber(submissions);
  const hasRoster = roster.some(Boolean);
  const label = (n) => (names && roster[n - 1] ? roster[n - 1] : `${n}번`);
  const entries = subs.map((x) => ({ n: x.number, label: label(x.number), content: x.content || {} }));
  const missing = Array.from({ length: size }, (_, i) => i + 1).filter((n) => !subs.some((x) => x.number === n));
  const Custom = GATHERS[assignment.strategy];
  const setNamesSaved = (v) => { setNames(v); try { localStorage.setItem('gather-names', v ? 'name' : 'num'); } catch { /* 괜찮아요 */ } };

  return (
    <div class="stack-lg gather">
      <div class="row between no-print" style="gap:10px">
        <span class="row small" style="gap:10px;font-weight:700">
          <span class="chip">{entries.length}명의 생각이 모였어요</span>
          {missing.length > 0 && <span class="muted">아직: {missing.length > 12 ? `${missing.length}명` : missing.map((n) => `${n}번`).join(', ')}</span>}
        </span>
        {hasRoster && (
          <div class="seg" role="group" aria-label="학생 표시">
            <button type="button" aria-pressed={names} onClick={() => setNamesSaved(true)}>이름으로</button>
            <button type="button" aria-pressed={!names} onClick={() => setNamesSaved(false)}>번호로</button>
          </div>
        )}
      </div>
      {entries.length === 0 ? (
        <p class="card muted" style="text-align:center;padding:40px 24px">아직 낸 친구가 없어요. 학생이 ‘선생님께 내기’를 누르면 여기에 모여요.</p>
      ) : Custom ? (
        <Custom payload={assignment.payload} entries={entries} onBank={onBank} />
      ) : (
        <div class="answer-grid">
          {entries.map((e) => (
            <div key={e.n} class="answer-cell">
              <span class="gname" style="align-self:flex-start">{e.label}</span>
              <s.View payload={assignment.payload} content={e.content} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
