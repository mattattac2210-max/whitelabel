import { useState } from 'react';

interface TradeSelectProps {
  onNext: (trade: string) => void;
  onBack: () => void;
}

const trades = [
  {
    id: 'electrician',
    title: 'Electrician',
    subtitle: 'Domestic, commercial, industrial',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8" strokeLinecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id: 'plumber',
    title: 'Plumber',
    subtitle: 'Residential, commercial, gas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 22V12M12 12C12 7 7 3 7 3s5 4 5 9M12 12c0-5 5-9 5-9s-5 4-5 9" />
      </svg>
    ),
  },
  {
    id: 'builder',
    title: 'Builder / Carpenter',
    subtitle: 'Residential, reno, fitout',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'painter',
    title: 'Painter / Decorator',
    subtitle: 'Interior, exterior, commercial',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8" strokeLinecap="round">
        <path d="M2 13.5V19a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-5.5" />
        <path d="M20 8l-8-6-8 6" />
        <path d="M12 2v10M8 10v2M16 10v2" />
      </svg>
    ),
  },
  {
    id: 'hvac',
    title: 'HVAC / Refrigeration',
    subtitle: 'Air con, heating, cooling',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
  },
  {
    id: 'landscaper',
    title: 'Landscaper / Gardener',
    subtitle: 'Residential, commercial grounds',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
      </svg>
    ),
  },
  {
    id: 'other',
    title: 'Other Trade',
    subtitle: 'Tiler, concreter, welder & more',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    ),
  },
];

const notTradie = {
  id: 'not-tradie',
  title: 'Not a tradie?',
  subtitle: 'We can still help with your vehicle deductions',
  icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-2a4 4 0 018 0v2" />
      <path d="M19 8h2M21 11l-2-3 2-3" />
    </svg>
  ),
};

export function TradeSelectScreen({ onNext, onBack }: TradeSelectProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (tradeId: string) => {
    setSelected(tradeId);
    setTimeout(() => onNext(tradeId), 120);
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ paddingTop: 44 }}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ padding: '20px 22px 40px' }}>
        <div className="ob-a1" style={{ marginBottom: 22 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <button
              className="inline-flex items-center gap-[5px] bg-transparent border-none cursor-pointer"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--wc-t3)' }}
              onClick={onBack}
              data-testid="button-back-q1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--wc-y)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                1 of 2
              </span>
              <div className="ob-pbar" style={{ width: 80 }}>
                <div className="ob-pbar-fill" style={{ width: '50%' }} />
              </div>
            </div>
          </div>
          <div className="font-display" style={{ fontSize: 34, lineHeight: 1, marginBottom: 6 }}>
            What's your<br /><span style={{ color: 'var(--wc-y)' }}>trade?</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--wc-t3)' }}>Tap to select — we'll move straight on</p>
        </div>

        <div className="flex flex-col gap-2 ob-a2">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className={`ob-trade-tile ${selected === trade.id ? 'selected' : ''}`}
              onClick={() => handleSelect(trade.id)}
              data-testid={`tile-trade-${trade.id}`}
            >
              <div className="ob-trade-icon">{trade.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{trade.title}</div>
                <div style={{ fontSize: 11, color: 'var(--wc-t3)', marginTop: 1 }}>{trade.subtitle}</div>
              </div>
              <div className="ob-trade-check">
                {selected === trade.id && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          ))}

          <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '4px 0' }} />

          <div
            className={`ob-trade-tile ${selected === notTradie.id ? 'selected' : ''}`}
            style={{
              borderColor: selected === notTradie.id ? 'var(--wc-y)' : 'rgba(255,255,255,.08)',
              background: selected === notTradie.id ? 'rgba(245,196,0,.04)' : 'rgba(255,255,255,.02)',
            }}
            onClick={() => handleSelect(notTradie.id)}
            data-testid="tile-trade-not-tradie"
          >
            <div
              className="ob-trade-icon"
              style={{
                background: selected === notTradie.id ? 'rgba(245,196,0,.10)' : 'rgba(255,255,255,.05)',
                borderColor: selected === notTradie.id ? 'rgba(245,196,0,.25)' : 'rgba(255,255,255,.1)',
              }}
            >
              {notTradie.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--wc-t2)' }}>{notTradie.title}</div>
              <div style={{ fontSize: 11, color: 'var(--wc-t3)', marginTop: 1 }}>{notTradie.subtitle}</div>
            </div>
            <div className="ob-trade-check">
              {selected === notTradie.id && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
