import { useState } from 'react';

interface KmBandProps {
  onNext: (kmBand: string) => void;
  onBack: () => void;
  defaultBand?: string;
}

const bands = [
  {
    id: '0to2k',
    label: 'Under 2,000 km',
    sub: 'Occasional supply runs, rare job sites',
    badge: null,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    id: '2kto5k',
    label: '2,000 \u2013 5,000 km',
    sub: 'Regular job site travel, few sites per week',
    badge: null,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: '5kto10k',
    label: '5,000 \u2013 10,000 km',
    sub: 'Heavy work travel, daily job site runs',
    badge: { text: 'Logbook zone', type: 'yellow' as const },
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id: 'over10k',
    label: 'Over 10,000 km',
    sub: 'On the road most days \u2014 car is your office',
    badge: { text: 'Clear win', type: 'green' as const },
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m4 0h-8a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2z" />
      </svg>
    ),
  },
];

export function KmBandScreen({ onNext, onBack, defaultBand }: KmBandProps) {
  const [selected, setSelected] = useState<string | null>(defaultBand || null);

  const handleSelect = (bandId: string) => {
    setSelected(bandId);
    setTimeout(() => onNext(bandId), 120);
  };

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
            How many km<br />for <span style={{ color: 'var(--wc-y)' }}>work</span><br />this year?
          </div>
          <p style={{ fontSize: 12, color: 'var(--wc-t3)' }}>Tap to select &mdash; we'll move straight on</p>
        </div>

        <div className="ob-a2 flex flex-col" style={{ gap: 10 }}>
          {bands.map((band) => (
            <div
              key={band.id}
              className={`ob-trade-tile${selected === band.id ? ' selected' : ''}`}
              style={{ padding: '18px', cursor: 'pointer' }}
              onClick={() => handleSelect(band.id)}
              data-testid={`tile-km-${band.id}`}
            >
              <div
                className="ob-trade-icon"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  flexShrink: 0,
                }}
              >
                {band.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{band.label}</div>
                <div style={{ fontSize: 11, color: 'var(--wc-t3)', marginTop: 3, lineHeight: 1.4 }}>{band.sub}</div>
              </div>
              {band.badge && (
                <div
                  style={{
                    flexShrink: 0,
                    padding: '3px 8px',
                    background: band.badge.type === 'yellow' ? 'rgba(245,196,0,.12)' : 'rgba(34,197,94,.1)',
                    border: `1px solid ${band.badge.type === 'yellow' ? 'rgba(245,196,0,.28)' : 'rgba(34,197,94,.28)'}`,
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: band.badge.type === 'yellow' ? 'var(--wc-y)' : 'var(--wc-gr)',
                      textTransform: 'uppercase',
                      letterSpacing: '.05em',
                    }}
                  >
                    {band.badge.text}
                  </div>
                </div>
              )}
              <div
                className="ob-trade-check"
                style={{
                  flexShrink: 0,
                }}
              >
                {selected === band.id && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
