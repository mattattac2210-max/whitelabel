import { useState } from 'react';

const DV_RATE = 0.25;
const ATO_CAR_LIMIT = 69674;

export function DepreciationCurve({ startValue, rawPrice }: { startValue: number; rawPrice: number }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const isCapped = rawPrice > ATO_CAR_LIMIT;
  const years = 10;

  const taxPoints: { year: number; wdv: number }[] = [];
  let wdv = startValue;
  taxPoints.push({ year: 0, wdv });
  for (let i = 1; i <= years; i++) {
    wdv = Math.max(0, wdv - Math.round(wdv * DV_RATE));
    taxPoints.push({ year: i, wdv });
  }

  const marketPoints: { year: number; val: number }[] = [];
  const marketStart = rawPrice > 0 ? rawPrice : startValue;
  for (let i = 0; i <= years; i++) {
    const rate = i <= 1 ? 0.15 : i <= 3 ? 0.12 : i <= 5 ? 0.08 : 0.05;
    const prev = i === 0 ? marketStart : marketPoints[i - 1].val;
    marketPoints.push({ year: i, val: i === 0 ? marketStart : Math.round(prev * (1 - rate)) });
  }

  const W = 320;
  const H = 170;
  const padL = 48;
  const padR = 12;
  const padT = 14;
  const padB = 34;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(rawPrice, startValue, marketStart);

  const xPos = (yr: number) => padL + (yr / years) * chartW;
  const yPos = (val: number) => padT + (1 - val / maxVal) * chartH;

  const taxLine = taxPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${xPos(p.year).toFixed(1)},${yPos(p.wdv).toFixed(1)}`).join(' ');
  const taxArea = taxLine + ` L${xPos(years).toFixed(1)},${yPos(0).toFixed(1)} L${xPos(0).toFixed(1)},${yPos(0).toFixed(1)} Z`;
  const marketLine = marketPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${xPos(p.year).toFixed(1)},${yPos(p.val).toFixed(1)}`).join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxVal * f));
  const xTicks = [0, 2, 4, 6, 8, 10];

  return (
    <div className="mt-[10px] rounded-[8px] p-[10px_8px_6px]" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px solid rgb(var(--wc-ink) / .06)' }} data-testid="chart-depreciation-curve">
      <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[6px] px-[4px]" style={{ color: 'var(--wc-t3)' }}>
        10-Year Depreciation Curve
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '190px' }}>
        {yTicks.map(v => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={yPos(v)} y2={yPos(v)} stroke="rgb(var(--wc-ink) / .06)" strokeWidth="0.5" />
            <text x={padL - 4} y={yPos(v) + 3} textAnchor="end" fontSize="7" fontFamily="var(--font-data)" fill="rgb(var(--wc-ink) / .3)">
              ${(v / 1000).toFixed(0)}k
            </text>
          </g>
        ))}

        {xTicks.map(yr => (
          <text key={yr} x={xPos(yr)} y={H - padB + 14} textAnchor="middle" fontSize="7" fontFamily="var(--font-data)" fill="rgb(var(--wc-ink) / .3)">
            Yr {yr}
          </text>
        ))}

        {isCapped && (
          <>
            <line x1={padL} x2={W - padR} y1={yPos(ATO_CAR_LIMIT)} y2={yPos(ATO_CAR_LIMIT)} stroke="rgb(var(--wc-ink) / .2)" strokeWidth="0.8" strokeDasharray="3,2" />
            <text x={W - padR} y={yPos(ATO_CAR_LIMIT) - 3} textAnchor="end" fontSize="6.5" fontFamily="var(--font-data)" fill="rgb(var(--wc-ink) / .35)">
              ATO Cap ${(ATO_CAR_LIMIT / 1000).toFixed(0)}k
            </text>
            <rect x={padL} y={padT} width={chartW} height={yPos(ATO_CAR_LIMIT) - padT} fill="rgb(var(--wc-ink) / .03)" rx="2" />
          </>
        )}

        <path d={marketLine} fill="none" stroke="rgb(var(--wc-ink) / .25)" strokeWidth="1" strokeDasharray="4,3" strokeLinejoin="round" />

        <path d={taxArea} fill="rgb(var(--wc-ink) / .04)" />
        <path d={taxLine} fill="none" stroke="var(--wc-y)" strokeWidth="1.5" strokeLinejoin="round" />

        {taxPoints.map((p, i) => {
          const isSelected = selectedIdx === i;
          return (
            <g key={`tax-${i}`} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelectedIdx(isSelected ? null : i); }}>
              <circle cx={xPos(p.year)} cy={yPos(p.wdv)} r={12} fill="transparent" />
              <circle
                cx={xPos(p.year)}
                cy={yPos(p.wdv)}
                r={isSelected ? 5 : i === 0 ? 3 : 2}
                fill="var(--wc-y)"
                stroke={isSelected ? 'var(--wc-card)' : 'none'}
                strokeWidth={isSelected ? 1.5 : 0}
              />
            </g>
          );
        })}

        {marketPoints.map((p, i) => (
          <g key={`mkt-${i}`} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelectedIdx(selectedIdx === i ? null : i); }}>
            <circle cx={xPos(p.year)} cy={yPos(p.val)} r={12} fill="transparent" />
            <circle
              cx={xPos(p.year)}
              cy={yPos(p.val)}
              r={selectedIdx === i ? 4 : 1.5}
              fill="rgb(var(--wc-ink) / .25)"
              stroke={selectedIdx === i ? 'var(--wc-card)' : 'none'}
              strokeWidth={selectedIdx === i ? 1.5 : 0}
            />
          </g>
        ))}

        {selectedIdx !== null && (() => {
          const tp = taxPoints[selectedIdx];
          const mp = marketPoints[selectedIdx];
          const cx = xPos(tp.year);
          const tipW = 82;
          const tipH = 38;
          const tipX = cx + tipW + 8 > W ? cx - tipW - 6 : cx + 6;
          const tipY = Math.max(padT, Math.min(yPos(tp.wdv) - tipH / 2, H - padB - tipH));
          return (
            <g>
              <line x1={cx} x2={cx} y1={padT} y2={H - padB} stroke="rgb(var(--wc-ink) / .1)" strokeWidth="0.5" strokeDasharray="2,2" />
              <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="4" fill="var(--wc-card)" stroke="var(--wc-border)" strokeWidth="1" />
              <text x={tipX + 5} y={tipY + 9} fontSize="6" fontFamily="var(--font-data)" fill="rgb(var(--wc-ink) / .4)" fontWeight="bold">
                Year {tp.year}
              </text>
              <text x={tipX + 5} y={tipY + 19} fontSize="7" fontFamily="var(--font-data)" fill="var(--wc-y)" fontWeight="bold">
                Tax WDV ${tp.wdv.toLocaleString()}
              </text>
              <text x={tipX + 5} y={tipY + 29} fontSize="7" fontFamily="var(--font-data)" fill="rgb(var(--wc-ink) / .4)">
                Market ~${mp.val.toLocaleString()}
              </text>
            </g>
          );
        })()}

        <text x={xPos(0) + 4} y={yPos(startValue) - 6} fontSize="7" fontFamily="var(--font-data)" fontWeight="bold" fill="var(--wc-y)">
          ${(startValue / 1000).toFixed(0)}k
        </text>
        <text x={xPos(years)} y={yPos(taxPoints[years].wdv) - 6} textAnchor="end" fontSize="7" fontFamily="var(--font-data)" fontWeight="bold" fill="var(--wc-y)">
          ${(taxPoints[years].wdv / 1000).toFixed(1)}k
        </text>
        <text x={xPos(years)} y={yPos(marketPoints[years].val) + 12} textAnchor="end" fontSize="6.5" fontFamily="var(--font-data)" fill="rgb(var(--wc-ink) / .35)">
          ~${(marketPoints[years].val / 1000).toFixed(0)}k market
        </text>

        <g transform={`translate(${padL + 4}, ${H - padB + 22})`}>
          <line x1="0" x2="14" y1="0" y2="0" stroke="var(--wc-y)" strokeWidth="1.5" />
          <text x="18" y="3" fontSize="6.5" fontFamily="var(--font-data)" fill="rgb(var(--wc-ink) / .4)">Tax (DV 25%)</text>
          <line x1="80" x2="94" y1="0" y2="0" stroke="rgb(var(--wc-ink) / .25)" strokeWidth="1" strokeDasharray="4,3" />
          <text x="98" y="3" fontSize="6.5" fontFamily="var(--font-data)" fill="rgb(var(--wc-ink) / .4)">Market value (est.)</text>
        </g>
      </svg>
      {selectedIdx !== null && (
        <div className="text-[8px] text-center mt-[4px]" style={{ color: 'var(--wc-t3)' }}>
          Tap another dot or tap again to dismiss
        </div>
      )}
    </div>
  );
}
