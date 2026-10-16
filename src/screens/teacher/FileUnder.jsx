import { useEffect, useState } from 'preact/hooks';
import { STAGES } from '../../content/guides.js';
import { listUnits, loadUnit, OUTSIDE } from '../../lib/records.js';

// 어느 수업 기록에 정리할지 고르기: 단원(또는 단원 밖 수업) + 탐구 단계
export function FileUnder({ roomId, value, onChange, idPrefix = 'fu' }) {
  const [units, setUnits] = useState([]);
  useEffect(() => {
    Promise.all([loadUnit(roomId), listUnits(roomId)]).then(([cur, list]) => {
      const all = [...list];
      if (cur?.id && cur.name?.trim() && !all.some((u) => u.id === cur.id)) all.unshift({ id: cur.id, name: cur.name, subject: cur.subject || '' });
      // 예전에 정리한 단원이 목록에 없으면 함께 보여 줘요
      if (value?.unitId && !all.some((u) => u.id === value.unitId)) all.push({ id: value.unitId, name: value.unitName || '이름 없는 단원', subject: value.unitSubject || '' });
      setUnits(all);
    });
  }, [roomId]);

  const pickUnit = (id) => {
    if (id === OUTSIDE) return onChange({ ...value, unitId: null, unitName: '', unitSubject: '' });
    const u = units.find((x) => x.id === id);
    onChange({ ...value, unitId: u.id, unitName: u.name, unitSubject: u.subject || '' });
  };

  return (
    <div class="filing">
      <div class="field">
        <label for={idPrefix + '-unit'}>어느 수업 기록에 둘까요?</label>
        <select id={idPrefix + '-unit'} class="select" value={value?.unitId || OUTSIDE} onChange={(e) => pickUnit(e.currentTarget.value)}>
          {units.map((u) => <option key={u.id} value={u.id}>{u.subject ? `${u.subject} · ` : ''}{u.name}</option>)}
          <option value={OUTSIDE}>단원 밖 수업 (날짜순으로 정리)</option>
        </select>
      </div>
      <div class="field">
        <label for={idPrefix + '-stage'}>탐구 단계</label>
        <select id={idPrefix + '-stage'} class="select" value={value?.stage || 'connect'} onChange={(e) => onChange({ ...value, stage: e.currentTarget.value })}>
          {STAGES.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.name}</option>)}
        </select>
      </div>
    </div>
  );
}
