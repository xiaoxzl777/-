import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlanItem } from '../api/types';
import { shortName } from '../utils/format';

interface Props {
  items: PlanItem[];
  activeSeq: number | null;
  onHover: (seq: number | null) => void;
}

/** 四周留白：上面给悬停提示留位置，下面给图例留位置 */
const PAD = { top: 64, right: 48, bottom: 76, left: 48 };

/** 珠江主航道的大致走向（经度, 纬度），只用来给示意地图做参照 */
const PEARL_RIVER: [number, number][][] = [
  [[113.214, 23.156], [113.226, 23.132], [113.236, 23.112], [113.246, 23.106], [113.266, 23.114], [113.29, 23.117],
    [113.31, 23.113], [113.326, 23.109], [113.346, 23.104], [113.366, 23.1], [113.4, 23.095], [113.45, 23.089]],
  [[113.238, 23.1], [113.245, 23.08], [113.262, 23.06], [113.3, 23.054], [113.35, 23.064], [113.4, 23.08], [113.43, 23.088]],
];

/**
 * 示意地图：按坐标把各站画出来，站与站之间按交通方式连线。
 * 没有接入高德地图，所以不画真实道路，只画出珠江作参照。
 */
export default function RouteMap({ items, activeSeq, onHover }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });
  const [drawn, setDrawn] = useState(false);

  // 按容器的实际大小画图，这样不管多宽多高都不会裁掉站点
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setDrawn(false);
    const timer = window.setTimeout(() => setDrawn(true), 60);
    return () => window.clearTimeout(timer);
  }, [items]);

  const layout = useMemo(() => {
    if (items.length === 0) return null;
    const { w, h } = size;
    const lats = items.map(i => i.lat);
    const lngs = items.map(i => i.lng);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const kx = Math.cos((midLat * Math.PI) / 180);
    // 范围太小时（比如只有一站）给一个最小范围（约 400 米），免得放得过大
    const spanX = Math.max((Math.max(...lngs) - Math.min(...lngs)) * kx, 0.004);
    const spanY = Math.max(Math.max(...lats) - Math.min(...lats), 0.004);
    const innerW = Math.max(w - PAD.left - PAD.right, 40);
    const innerH = Math.max(h - PAD.top - PAD.bottom, 40);
    const scale = Math.min(innerW / spanX, innerH / spanY);
    const cx = PAD.left + innerW / 2;
    const cy = PAD.top + innerH / 2;
    const project = (lng: number, lat: number) => ({ x: cx + (lng - midLng) * kx * scale, y: cy - (lat - midLat) * scale });

    const riverLines = PEARL_RIVER.map(line => line.map(([lng, lat]) => project(lng, lat)));
    const river = riverLines.map(points => points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(''));
    const visible = riverLines[0].filter(p => p.x > 40 && p.x < w - 40 && p.y > 40 && p.y < h - PAD.bottom);
    const riverLabel = visible.length > 0 ? visible[Math.floor(visible.length / 2)] : null;
    const points = items.map(item => ({ item, ...project(item.lng, item.lat) }));
    return { river, riverLabel, points, riverWidth: Math.min(Math.max(scale * 0.0022, 10), 60) };
  }, [items, size]);

  if (!layout) return null;
  const { w, h } = size;
  const { points, river, riverLabel, riverWidth } = layout;
  const markers = points.filter((p, i) => points.findIndex(q => q.item.poiId === p.item.poiId) === i);
  const grid = [];
  for (let x = 0; x <= w; x += 44) grid.push(`M${x} 0V${h}`);
  for (let y = 0; y <= h; y += 44) grid.push(`M0 ${y}H${w}`);

  return (
    <div className="mapbox panel" ref={boxRef}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="行程示意地图">
        <rect width={w} height={h} className="m-land" />
        <path className="m-grid" d={grid.join('')} />
        {river.map((d, i) => <path key={i} d={d} className="m-water" style={{ strokeWidth: riverWidth }} />)}
        {riverLabel && (
          <text className="m-label-water" x={riverLabel.x} y={riverLabel.y - riverWidth / 2 - 10} textAnchor="middle">珠江</text>
        )}

        {points.slice(0, -1).map((from, i) => {
          const to = points[i + 1];
          const length = Math.hypot(to.x - from.x, to.y - from.y);
          if (length < 1) return null;
          const mode = from.item.nextMode ?? 'WALK';
          return (
            <g key={`leg-${i}`}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="m-case" />
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                className={`m-route m-${mode.toLowerCase()} ${drawn ? 'is-in' : ''}`}
                style={{ '--len': length } as React.CSSProperties} />
            </g>
          );
        })}

        {markers.map(({ item, x, y }) => {
          const visits = items.filter(i => i.poiId === item.poiId);
          const hot = visits.some(v => v.seq === activeSeq);
          const label = `${shortName(item.name)} ${visits.map(v => `${v.startTime}–${v.endTime}`).join('、')}`;
          const tipWidth = Math.min(label.length * 11 + 28, w - 16);
          const tipX = Math.min(Math.max(x - tipWidth / 2, 8), w - tipWidth - 8);
          const tipY = y - 58 < 8 ? y + 24 : y - 58; // 太靠上时提示显示在下面
          return (
            <g key={item.poiId} className={`m-marker ${hot ? 'is-hot' : ''} ${item.type === 'RESTAURANT' ? 'is-meal' : ''}`}
              onMouseEnter={() => onHover(item.seq)} onMouseLeave={() => onHover(null)}>
              <circle cx={x} cy={y} r="26" className="m-halo" />
              <circle cx={x} cy={y} r="15" className="m-dot" />
              <text x={x} y={y + 4.5} textAnchor="middle" className="num">{visits.map(v => v.seq).join('·')}</text>
              <g className="m-tip">
                <rect x={tipX} y={tipY} width={tipWidth} height="30" rx="15" />
                <text x={tipX + tipWidth / 2} y={tipY + 20} textAnchor="middle">{label}</text>
              </g>
            </g>
          );
        })}
      </svg>
      <div className="map-legend">
        <span><i className="is-walk" />步行</span>
        <span><i className="is-metro" />地铁</span>
        <span><i className="is-taxi" />打车</span>
      </div>
      <div className="map-note">示意图，路程按直线估算</div>
    </div>
  );
}
