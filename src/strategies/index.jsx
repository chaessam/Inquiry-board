import { conceptAttainment } from './conceptAttainment.jsx';
import { frayer } from './frayer.jsx';
import { generalization } from './generalization.jsx';

export const STRATEGIES = [conceptAttainment, frayer, generalization];
export const byId = Object.fromEntries(STRATEGIES.map((s) => [s.id, s]));

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
