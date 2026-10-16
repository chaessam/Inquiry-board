import { conceptAttainment } from './conceptAttainment.jsx';
import { frayer } from './frayer.jsx';
import { generalization } from './generalization.jsx';
import { seeThinkWonder } from './seeThinkWonder.jsx';
import { compareCases } from './compareCases.jsx';
import { classify } from './classify.jsx';
import { diamondRank } from './diamondRank.jsx';
import { usedToThink } from './usedToThink.jsx';
import { valueLine } from './valueLine.jsx';
import { fourCorners } from './fourCorners.jsx';

// 탐구 단계 순서대로 (관계맺기 → 집중하기 → 조사하기 → 조직 및 정리 → 일반화하기 → 성찰하기)
// 새 전략을 더하면 functions/api/[[path]].js 의 STRATEGIES 에도 id를 넣어 주세요.
export const STRATEGIES = [seeThinkWonder, valueLine, fourCorners, conceptAttainment, frayer, compareCases, classify, diamondRank, generalization, usedToThink];
export const byId = Object.fromEntries(STRATEGIES.map((s) => [s.id, s]));

// 이 탐구 단계에 쓰기 좋은 전략 (stages 에 그 단계가 들어 있는 것)
export const recommendedFor = (stageId) => STRATEGIES.filter((s) => (s.stages || [s.stage]).includes(stageId));

// 전략 카드 위의 작은 그림 (시안의 도형 언어)
export function StrategyArt({ id }) {
  const abs = (s) => `position:absolute;${s}`;
  if (id === 'concept-attainment') {
    return (
      <div aria-hidden="true" style="height:140px;border-radius:18px;background:#E8ECFF;position:relative;overflow:hidden">
        <span style={abs('left:20px;top:22px;width:76px;height:96px;border-radius:12px;background:#fff')} />
        <span style={abs('left:32px;top:36px;width:22px;height:22px;border-radius:999px;background:#3355FF')} />
        <span style={abs('left:32px;top:68px;width:52px;height:8px;border-radius:4px;background:#C9D3FF')} />
        <span style={abs('left:32px;top:84px;width:36px;height:8px;border-radius:4px;background:#C9D3FF')} />
        <span style={abs('left:108px;top:22px;width:76px;height:96px;border-radius:12px;background:#fff')} />
        <span style={abs('left:120px;top:36px;width:22px;height:22px;border-radius:4px;background:#FF6B3D')} />
        <span style={abs('left:120px;top:68px;width:44px;height:8px;border-radius:4px;background:#FFD6C7')} />
        <span style={abs('left:120px;top:84px;width:52px;height:8px;border-radius:4px;background:#FFD6C7')} />
      </div>
    );
  }
  if (id === 'frayer') {
    return (
      <div aria-hidden="true" style="height:140px;border-radius:18px;background:#FFF6D1;position:relative;overflow:hidden">
        <span style={abs('left:24px;top:20px;width:72px;height:44px;border-radius:10px;background:#fff')} />
        <span style={abs('left:104px;top:20px;width:72px;height:44px;border-radius:10px;background:#fff')} />
        <span style={abs('left:24px;top:72px;width:72px;height:44px;border-radius:10px;background:#fff')} />
        <span style={abs('left:104px;top:72px;width:72px;height:44px;border-radius:10px;background:#fff')} />
        <span style={abs('left:76px;top:44px;width:48px;height:48px;border-radius:999px;background:#FFD43B;border:4px solid #FFF6D1')} />
      </div>
    );
  }
  if (id === 'see-think-wonder') {
    return (
      <div aria-hidden="true" style="height:140px;border-radius:18px;background:#FFE9E0;position:relative;overflow:hidden">
        <span style={abs('left:22px;top:30px;width:80px;height:80px;border-radius:999px;background:#fff')} />
        <span style={abs('left:44px;top:52px;width:36px;height:36px;border-radius:999px;background:#3355FF')} />
        <span style={abs('left:56px;top:58px;width:10px;height:10px;border-radius:999px;background:#fff')} />
        <span style={abs('left:112px;top:30px;width:72px;height:36px;border-radius:72px 72px 0 0;background:#FFD43B')} />
        <span style={abs('left:128px;top:78px;width:40px;height:40px;border-radius:12px;background:#FF6B3D;transform:rotate(14deg)')} />
      </div>
    );
  }
  if (id === 'compare-cases') {
    const cell = (x, y, bg) => <span key={x + '-' + y} style={abs(`left:${22 + x * 40}px;top:${20 + y * 26}px;width:34px;height:20px;border-radius:6px;background:${bg}`)} />;
    return (
      <div aria-hidden="true" style="height:140px;border-radius:18px;background:#E8ECFF;position:relative;overflow:hidden">
        {[0, 1, 2, 3].map((x) => cell(x, 0, x ? '#3355FF' : 'transparent'))}
        {[1, 2, 3].flatMap((y) => [0, 1, 2, 3].map((x) => cell(x, y, x ? '#fff' : '#FFD43B')))}
        <span style={abs('left:178px;top:62px;width:14px;height:14px;border-radius:999px;background:#FF6B3D')} />
      </div>
    );
  }
  if (id === 'classify') {
    return (
      <div aria-hidden="true" style="height:140px;border-radius:18px;background:#DDF5E9;position:relative;overflow:hidden">
        <span style={abs('left:84px;top:14px;width:26px;height:26px;border-radius:999px;background:#3355FF;box-shadow:0 8px 14px rgba(22,27,46,0.18)')} />
        <span style={abs('left:18px;top:56px;width:80px;height:66px;border-radius:14px;background:#fff')} />
        <span style={abs('left:106px;top:56px;width:80px;height:66px;border-radius:14px;background:#fff')} />
        <span style={abs('left:30px;top:72px;width:20px;height:20px;border-radius:999px;background:#3355FF')} />
        <span style={abs('left:58px;top:80px;width:20px;height:20px;border-radius:999px;background:#3355FF')} />
        <span style={abs('left:118px;top:72px;width:20px;height:20px;border-radius:5px;background:#FF6B3D')} />
        <span style={abs('left:148px;top:84px;width:20px;height:20px;border-radius:5px;background:#FF6B3D')} />
      </div>
    );
  }
  if (id === 'diamond-rank') {
    const rows = [1, 2, 3, 2, 1];
    return (
      <div aria-hidden="true" style="height:140px;border-radius:18px;background:#FFF6D1;position:relative;overflow:hidden">
        {rows.flatMap((n, r) => Array.from({ length: n }, (_, i) => (
          <span key={r + '-' + i} style={abs(`left:${100 - n * 17 + i * 34}px;top:${12 + r * 24}px;width:30px;height:20px;border-radius:6px;background:${r === 0 ? '#3355FF' : r === 4 ? '#E6E8EF' : '#fff'}`)} />
        )))}
        <span style={abs('left:150px;top:96px;width:30px;height:15px;border-radius:30px 30px 0 0;background:#FFD43B')} />
      </div>
    );
  }
  if (id === 'value-line') {
    return (
      <div aria-hidden="true" style="height:140px;border-radius:18px;background:#E8ECFF;position:relative;overflow:hidden">
        <span style={abs('left:20px;top:68px;width:160px;height:4px;border-radius:2px;background:#161B2E')} />
        <span style={abs('left:14px;top:60px;width:20px;height:20px;border-radius:999px;background:#3355FF')} />
        <span style={abs('left:166px;top:60px;width:20px;height:20px;border-radius:999px;background:#C9461A')} />
        <span style={abs('left:52px;top:28px;width:40px;height:24px;border-radius:6px;background:#fff')} />
        <span style={abs('left:112px;top:88px;width:44px;height:24px;border-radius:6px;background:#FFD43B')} />
        <span style={abs('left:92px;top:62px;width:16px;height:16px;border-radius:999px;background:#fff;border:3px solid #161B2E;box-sizing:border-box')} />
      </div>
    );
  }
  if (id === 'four-corners') {
    return (
      <div aria-hidden="true" style="height:140px;border-radius:18px;background:#ECEEF4;position:relative;overflow:hidden">
        <span style={abs('left:16px;top:14px;width:80px;height:52px;border-radius:12px;background:#3355FF')} />
        <span style={abs('left:104px;top:14px;width:80px;height:52px;border-radius:12px;background:#2BB673')} />
        <span style={abs('left:16px;top:74px;width:80px;height:52px;border-radius:12px;background:#FFD43B')} />
        <span style={abs('left:104px;top:74px;width:80px;height:52px;border-radius:12px;background:#FF6B3D')} />
        <span style={abs('left:82px;top:52px;width:36px;height:36px;border-radius:999px;background:#fff;border:4px solid #ECEEF4')} />
      </div>
    );
  }
  if (id === 'used-to-think') {
    return (
      <div aria-hidden="true" style="height:140px;border-radius:18px;background:#ECEEF4;position:relative;overflow:hidden">
        <span style={abs('left:20px;top:38px;width:56px;height:56px;border-radius:999px;background:#C5CAD8')} />
        <span style={abs('left:84px;top:64px;width:30px;height:4px;border-radius:2px;background:#161B2E')} />
        <span style={abs('left:106px;top:58px;width:12px;height:12px;border-top:4px solid #161B2E;border-right:4px solid #161B2E;transform:rotate(45deg);box-sizing:border-box')} />
        <span style={abs('left:124px;top:26px;width:64px;height:64px;border-radius:999px;background:#3355FF')} />
        <span style={abs('left:124px;top:100px;width:64px;height:32px;border-radius:64px 64px 0 0;background:#FFD43B')} />
      </div>
    );
  }
  return (
    <div aria-hidden="true" style="height:140px;border-radius:18px;background:#DDF5E9;position:relative;overflow:hidden">
      <span style={abs('left:22px;top:28px;width:44px;height:44px;border-radius:999px;background:#3355FF')} />
      <span style={abs('left:130px;top:28px;width:44px;height:44px;border-radius:12px;background:#FF6B3D')} />
      <span style={abs('left:66px;top:48px;width:64px;height:4px;border-radius:2px;background:#161B2E')} />
      <span style={abs('left:22px;top:92px;width:150px;height:10px;border-radius:5px;background:#fff')} />
      <span style={abs('left:22px;top:110px;width:110px;height:10px;border-radius:5px;background:#fff')} />
    </div>
  );
}
