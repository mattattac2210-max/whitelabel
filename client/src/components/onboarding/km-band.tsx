import { useState, useMemo } from 'react';

interface KmBandProps {
  onNext: (kmBand: string) => void;
  onBack: () => void;
}

const bands = [
  { id: '0to2k', min: 0, max: 2000, label: 'Under 2,000 km', badge: null },
  { id: '2kto5k', min: 2000, max: 5000, label: '2,000 – 5,000 km', badge: null },
  { id: '5kto10k', min: 5000, max: 10000, label: '5,000 – 10,000 km', badge: { text: 'Logbook zone', type: 'yellow' as const } },
  { id: 'over10k', min: 10000, max: 99999, label: 'Over 10,000 km', badge: { text: 'Clear win', type: 'green' as const } },
];

function getBandForKm(yearlyKm: number) {
  for (let i = bands.length - 1; i >= 0; i--) {
    if (yearlyKm >= bands[i].min) return bands[i];
  }
  return bands[0];
}

function formatNum(n: number): string {
  return n.toLocaleString('en-AU');
}

export function KmBandScreen({ onNext, onBack }: KmBandProps) {
  const [mode, setMode] = useState<'week' | 'year'>('week');
  const [weeklyKm, setWeeklyKm] = useState(100);

  const yearlyKm = useMemo(() => weeklyKm * 48, [weeklyKm]);
  const displayKm = mode === 'week' ? weeklyKm : yearlyKm;
  const activeBand = useMemo(() => getBandForKm(yearlyKm), [yearlyKm]);

  const handleConfirm = () => {
    onNext(activeBand.id);
  };

  const sliderMin = 5;
  const sliderMax = 500;
  const pct = ((weeklyKm - sliderMin) / (sliderMax - sliderMin)) * 100;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ paddingTop: 44 }}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ padding: '20px 22px 40px' }}>
        <div className="ob-a1" style={{ marginBottom: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <button
              className="inline-flex items-center gap-[5px] bg-transparent border-none cursor-pointer"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--wc-t3)' }}
              onClick={onBack}
              data-testid="button-back-q2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--wc-y)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                2 of 3
              </span>
              <div className="ob-pbar" style={{ width: 80 }}>
                <div className="ob-pbar-fill" style={{ width: '66%' }} />
              </div>
            </div>
          </div>
          <div className="font-display" style={{ fontSize: 34, lineHeight: 1, marginBottom: 6 }}>
            What do you estimate<br />your <span style={{ color: 'var(--wc-y)' }}>work km</span> are?
          </div>
          <p style={{ fontSize: 12, color: 'var(--wc-t3)' }}>Drag the slider or tap a band below</p>
        </div>

        <div className="ob-a2">
          <div
            className="flex items-center justify-center gap-1"
            style={{
              background: 'rgba(255,255,255,.06)',
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
              width: 'fit-content',
              alignSelf: 'center',
              margin: '0 auto 20px',
            }}
          >
            <button
              onClick={() => setMode('week')}
              style={{
                padding: '7px 18px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '.03em',
                background: mode === 'week' ? 'var(--wc-y)' : 'transparent',
                color: mode === 'week' ? '#000' : 'var(--wc-t3)',
                transition: 'all .15s',
              }}
              data-testid="toggle-km-week"
            >
              Per Week
            </button>
            <button
              onClick={() => setMode('year')}
              style={{
                padding: '7px 18px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '.03em',
                background: mode === 'year' ? 'var(--wc-y)' : 'transparent',
                color: mode === 'year' ? '#000' : 'var(--wc-t3)',
                transition: 'all .15s',
              }}
              data-testid="toggle-km-year"
            >
              Per Year
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div className="font-data" style={{ fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {formatNum(displayKm)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--wc-t3)', marginTop: 4 }}>
              km / {mode === 'week' ? 'week' : 'year'}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--wc-t3)', textAlign: 'center', marginBottom: 16 }}>
            {mode === 'week' ? (
              <>That's roughly <span className="font-data" style={{ color: 'var(--wc-t2)', fontWeight: 600 }}>{formatNum(yearlyKm)}</span> km/year (48 working weeks)</>
            ) : (
              <>That's about <span className="font-data" style={{ color: 'var(--wc-t2)', fontWeight: 600 }}>{formatNum(weeklyKm)}</span> km/week over 48 weeks</>
            )}
          </div>

          <div style={{ padding: '0 4px', marginBottom: 8 }}>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={5}
              value={weeklyKm}
              onChange={(e) => setWeeklyKm(Number(e.target.value))}
              className="ob-km-slider"
              style={{
                width: '100%',
                background: `linear-gradient(to right, var(--wc-y) 0%, var(--wc-y) ${pct}%, rgba(255,255,255,.1) ${pct}%, rgba(255,255,255,.1) 100%)`,
              }}
              data-testid="slider-km"
            />
            <div className="flex justify-between" style={{ fontSize: 9, color: 'var(--wc-t3)', marginTop: 4 }}>
              <span>{formatNum(sliderMin * 48)}/yr</span>
              <span>{formatNum(sliderMax * 48)}/yr</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <div
            style={{
              background: activeBand.badge?.type === 'green'
                ? 'rgba(34,197,94,.08)'
                : activeBand.badge?.type === 'yellow'
                  ? 'rgba(245,196,0,.06)'
                  : 'rgba(255,255,255,.04)',
              border: `1.5px solid ${activeBand.badge?.type === 'green'
                ? 'rgba(34,197,94,.25)'
                : activeBand.badge?.type === 'yellow'
                  ? 'rgba(245,196,0,.2)'
                  : 'rgba(255,255,255,.08)'}`,
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(245,196,0,.1)',
              border: '1px solid rgba(245,196,0,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {activeBand.label}
              </div>
              {activeBand.badge && (
                <span style={{
                  display: 'inline-block',
                  marginTop: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  padding: '2px 7px',
                  borderRadius: 5,
                  background: activeBand.badge.type === 'yellow' ? 'rgba(245,196,0,.15)' : 'rgba(34,197,94,.12)',
                  color: activeBand.badge.type === 'yellow' ? 'var(--wc-y)' : 'var(--wc-gr)',
                }}>
                  {activeBand.badge.text}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[8px]" style={{ marginBottom: 10 }}>
          {bands.map((band) => (
            <div
              key={band.id}
              className="flex items-center gap-3 cursor-pointer transition-all duration-150"
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: activeBand.id === band.id ? 'rgba(245,196,0,.08)' : 'rgba(255,255,255,.025)',
                border: `1.5px solid ${activeBand.id === band.id ? 'rgba(245,196,0,.3)' : 'rgba(255,255,255,.06)'}`,
              }}
              onClick={() => {
                const midKm = band.id === 'over10k' ? 250 : Math.round((band.min + band.max) / 2 / 48 / 5) * 5;
                setWeeklyKm(band.id === '0to2k' ? 20 : band.id === '2kto5k' ? 70 : band.id === '5kto10k' ? 155 : midKm);
              }}
              data-testid={`tile-km-${band.id}`}
            >
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${activeBand.id === band.id ? 'var(--wc-y)' : 'rgba(255,255,255,.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {activeBand.id === band.id && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--wc-y)' }} />
                )}
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: activeBand.id === band.id ? 700 : 500, color: activeBand.id === band.id ? '#fff' : 'var(--wc-t3)' }}>
                {band.label}
              </div>
              {band.badge && (
                <span style={{
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  padding: '2px 6px',
                  borderRadius: 5,
                  background: band.badge.type === 'yellow' ? 'rgba(245,196,0,.1)' : 'rgba(34,197,94,.08)',
                  color: band.badge.type === 'yellow' ? 'var(--wc-y)' : 'var(--wc-gr)',
                }}>
                  {band.badge.text}
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          className="ob-btn ob-btn-y"
          style={{ marginTop: 16, width: '100%' }}
          onClick={handleConfirm}
          data-testid="button-km-next"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
