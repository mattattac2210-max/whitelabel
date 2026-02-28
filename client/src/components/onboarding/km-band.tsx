import { useState, useMemo } from 'react';

interface KmBandProps {
  onNext: (kmBand: string, weeklyKm: number, personalWeeklyKm: number) => void;
  onBack: () => void;
  defaultBand?: string;
}

const bands = [
  { id: '0to2k', min: 0, max: 2000, label: 'Under 2,000 km', weeklyMid: 20, badge: null },
  { id: '2kto5k', min: 2000, max: 5000, label: '2,000 \u2013 5,000 km', weeklyMid: 70, badge: null },
  { id: '5kto10k', min: 5000, max: 10000, label: '5,000 \u2013 10,000 km', weeklyMid: 155, badge: { text: 'Logbook zone', type: 'yellow' as const } },
  { id: 'over10k', min: 10000, max: 99999, label: 'Over 10,000 km', weeklyMid: 250, badge: { text: 'Clear win', type: 'green' as const } },
];

function getBandForKm(yearlyKm: number) {
  for (let i = bands.length - 1; i >= 0; i--) {
    if (yearlyKm >= bands[i].min) return bands[i];
  }
  return bands[0];
}

function getDefaultWeekly(bandId?: string) {
  if (!bandId) return 100;
  const b = bands.find(x => x.id === bandId);
  return b ? b.weeklyMid : 100;
}

function formatNum(n: number): string {
  return n.toLocaleString('en-AU');
}

export function KmBandScreen({ onNext, onBack, defaultBand }: KmBandProps) {
  const [mode, setMode] = useState<'week' | 'year'>('week');
  const [weeklyKm, setWeeklyKm] = useState(() => getDefaultWeekly(defaultBand));
  const [personalWeeklyKm, setPersonalWeeklyKm] = useState(100);

  const yearlyKm = useMemo(() => weeklyKm * 48, [weeklyKm]);
  const personalYearlyKm = useMemo(() => personalWeeklyKm * 48, [personalWeeklyKm]);
  const activeBand = useMemo(() => getBandForKm(yearlyKm), [yearlyKm]);
  const totalYearlyKm = yearlyKm + personalYearlyKm;
  const bizPctDisplay = totalYearlyKm > 0 ? Math.round((yearlyKm / totalYearlyKm) * 100) : 0;

  const handleConfirm = () => {
    onNext(activeBand.id, weeklyKm, personalWeeklyKm);
  };

  const sliderMin = 5;
  const sliderMax = 500;
  const pct = ((weeklyKm - sliderMin) / (sliderMax - sliderMin)) * 100;

  const persSliderMin = 10;
  const persSliderMax = 400;
  const persPct = ((personalWeeklyKm - persSliderMin) / (persSliderMax - persSliderMin)) * 100;

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
              margin: '0 auto 20px',
            }}
          >
            <button
              onClick={() => setMode('week')}
              data-testid="toggle-km-week"
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
                transition: 'all .18s',
              }}
            >
              Per Week
            </button>
            <button
              onClick={() => setMode('year')}
              data-testid="toggle-km-year"
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
                transition: 'all .18s',
              }}
            >
              Per Year
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div className="font-display" style={{ fontSize: 48, lineHeight: 1, color: 'var(--wc-y)' }} data-testid="text-km-display">
              {formatNum(mode === 'week' ? weeklyKm : yearlyKm)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--wc-t3)', marginTop: 4, fontWeight: 600 }}>
              {mode === 'week' ? 'km per week' : 'km per year'}
            </div>
            {mode === 'week' && (
              <div style={{ fontSize: 11, color: 'var(--wc-t3)', marginTop: 2 }}>
                = {formatNum(yearlyKm)} km/year (48 working weeks)
              </div>
            )}
          </div>

          <div style={{ padding: '0 4px', marginBottom: 20, position: 'relative' }}>
            <div style={{ position: 'relative', height: 32, display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3,
                background: 'rgba(255,255,255,.08)',
              }} />
              <div style={{
                position: 'absolute', left: 0, height: 6, borderRadius: 3,
                width: `${pct}%`,
                background: 'linear-gradient(90deg, var(--wc-y), #F59E0B)',
              }} />
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={5}
                value={weeklyKm}
                onChange={(e) => setWeeklyKm(Number(e.target.value))}
                data-testid="slider-km"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: 32,
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 2,
                  margin: 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  transform: 'translateX(-50%)',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--wc-y)',
                  border: '3px solid #000',
                  boxShadow: '0 0 12px rgba(245,196,0,.4)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            </div>
            <div className="flex justify-between" style={{ marginTop: 6, fontSize: 9, color: 'var(--wc-t3)', letterSpacing: '.04em' }}>
              <span>5 km/wk</span>
              <span>500 km/wk</span>
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              background: activeBand.badge?.type === 'yellow'
                ? 'rgba(245,196,0,.06)'
                : activeBand.badge?.type === 'green'
                  ? 'rgba(34,197,94,.06)'
                  : 'rgba(255,255,255,.04)',
              border: `1.5px solid ${activeBand.badge?.type === 'yellow'
                ? 'rgba(245,196,0,.25)'
                : activeBand.badge?.type === 'green'
                  ? 'rgba(34,197,94,.25)'
                  : 'rgba(255,255,255,.08)'}`,
              borderRadius: 14,
              marginBottom: 16,
              textAlign: 'center',
              transition: 'all .25s',
            }}
            data-testid="text-active-band"
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{activeBand.label}</div>
            {activeBand.badge && (
              <span style={{
                display: 'inline-block',
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                padding: '3px 8px',
                borderRadius: 6,
                marginTop: 4,
                background: activeBand.badge.type === 'yellow' ? 'rgba(245,196,0,.12)' : 'rgba(34,197,94,.1)',
                color: activeBand.badge.type === 'yellow' ? 'var(--wc-y)' : 'var(--wc-gr)',
              }}>
                {activeBand.badge.text}
              </span>
            )}
          </div>

          <div style={{ fontSize: 10, color: 'var(--wc-t3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, marginBottom: 8 }}>
            Or tap a band
          </div>
          {bands.map((band) => (
            <div
              key={band.id}
              className="flex items-center gap-3 cursor-pointer"
              style={{
                padding: '12px 14px',
                marginBottom: 6,
                borderRadius: 12,
                background: activeBand.id === band.id ? 'rgba(245,196,0,.06)' : 'rgba(255,255,255,.03)',
                border: `1.5px solid ${activeBand.id === band.id ? 'rgba(245,196,0,.3)' : 'rgba(255,255,255,.06)'}`,
                transition: 'all .18s',
              }}
              onClick={() => setWeeklyKm(band.weeklyMid)}
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

        <div className="ob-a3" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--wc-t3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, marginBottom: 10 }}>
            And your <span style={{ color: 'var(--wc-t2)' }}>personal</span> driving?
          </div>
          <div style={{
            padding: '12px 14px',
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 12,
          }}>
            <div className="flex justify-between items-baseline" style={{ marginBottom: 8 }}>
              <div>
                <span className="font-data" style={{ fontSize: 18, fontWeight: 800, color: 'var(--wc-t2)' }} data-testid="text-personal-km">{formatNum(personalWeeklyKm)}</span>
                <span style={{ fontSize: 10, color: 'var(--wc-t3)', marginLeft: 4 }}>km/wk</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--wc-t3)' }}>
                {formatNum(personalYearlyKm)} km/yr
              </div>
            </div>
            <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2,
                background: 'rgba(255,255,255,.08)',
              }} />
              <div style={{
                position: 'absolute', left: 0, height: 4, borderRadius: 2,
                width: `${persPct}%`,
                background: 'linear-gradient(90deg, var(--wc-t3), var(--wc-t2))',
              }} />
              <input
                type="range"
                min={persSliderMin}
                max={persSliderMax}
                step={5}
                value={personalWeeklyKm}
                onChange={(e) => setPersonalWeeklyKm(Number(e.target.value))}
                data-testid="slider-personal-km"
                style={{
                  position: 'absolute', width: '100%', height: 24,
                  opacity: 0, cursor: 'pointer', zIndex: 2, margin: 0,
                }}
              />
              <div style={{
                position: 'absolute', left: `${persPct}%`, transform: 'translateX(-50%)',
                width: 18, height: 18, borderRadius: '50%',
                background: 'var(--wc-t2)', border: '2px solid #000',
                boxShadow: '0 0 8px rgba(255,255,255,.15)',
                pointerEvents: 'none', zIndex: 1,
              }} />
            </div>
            <div className="flex justify-between" style={{ marginTop: 4, fontSize: 8, color: 'var(--wc-t3)' }}>
              <span>10 km/wk</span>
              <span>400 km/wk</span>
            </div>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 10, padding: '8px 12px',
            background: 'rgba(245,196,0,.04)', border: '1px solid rgba(245,196,0,.12)',
            borderRadius: 10,
          }} data-testid="text-total-km-summary">
            <div style={{ fontSize: 10, color: 'var(--wc-t3)' }}>Total est.</div>
            <div className="font-data" style={{ fontSize: 12, fontWeight: 700, color: 'var(--wc-t2)' }}>
              {formatNum(totalYearlyKm)} km/yr
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--wc-y)' }}>
              {bizPctDisplay}% business
            </div>
          </div>
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
