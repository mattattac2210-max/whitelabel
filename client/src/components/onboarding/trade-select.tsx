import { useState } from 'react';

interface TradeSelectProps {
  onNext: (trade: string) => void;
  onBack: () => void;
}

const trades = [
  {
    id: 'electrician',
    title: 'Electrician',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id: 'plumber',
    title: 'Plumber',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 22V12M12 12C12 7 7 3 7 3s5 4 5 9M12 12c0-5 5-9 5-9s-5 4-5 9" />
      </svg>
    ),
  },
  {
    id: 'builder',
    title: 'Builder',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'painter',
    title: 'Painter',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M19 3H5a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
        <path d="M12 9v6" />
        <path d="M10 15h4v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5z" />
      </svg>
    ),
  },
  {
    id: 'hvac',
    title: 'HVAC',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
  },
  {
    id: 'landscaper',
    title: 'Landscaper',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
      </svg>
    ),
  },
  {
    id: 'carpenter',
    title: 'Carpenter',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'other-trade',
    title: 'Other Trade',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    ),
  },
];

const moreOccupations = [
  {
    id: 'real-estate',
    title: 'Real Estate',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
      </svg>
    ),
  },
  {
    id: 'sales-rep',
    title: 'Sales Rep',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  {
    id: 'delivery-driver',
    title: 'Delivery',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    id: 'consultant',
    title: 'Consultant',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: 'mobile-mechanic',
    title: 'Mechanic',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'cleaner',
    title: 'Cleaner',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2v6M8 4l4 4 4-4" />
        <path d="M8 10h8l1 12H7l1-12z" />
      </svg>
    ),
  },
  {
    id: 'photographer',
    title: 'Photography',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    id: 'aged-care',
    title: 'Aged Care',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    id: 'not-listed',
    title: 'Not Listed',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

export function TradeSelectScreen({ onNext, onBack }: TradeSelectProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (tradeId: string) => {
    setSelected(tradeId);
    setTimeout(() => onNext(tradeId), 150);
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
            What's your<br /><span style={{ color: 'var(--wc-y)' }}>trade/occupation?</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--wc-t3)' }}>Tap to select — we'll move straight on</p>
        </div>

        <div className="grid grid-cols-4 gap-[10px] ob-a2">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-150"
              style={{
                background: selected === trade.id ? 'rgba(245,196,0,.12)' : 'rgba(255,255,255,.04)',
                border: `1.5px solid ${selected === trade.id ? 'var(--wc-y)' : 'rgba(255,255,255,.08)'}`,
                borderRadius: 16,
                padding: '16px 4px 12px',
                position: 'relative',
              }}
              onClick={() => handleSelect(trade.id)}
              data-testid={`tile-trade-${trade.id}`}
            >
              {selected === trade.id && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--wc-y)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              <div style={{ marginBottom: 8 }}>{trade.icon}</div>
              <div style={{
                fontSize: 11, fontWeight: 600, textAlign: 'center',
                color: selected === trade.id ? 'var(--wc-y)' : 'var(--wc-t2)',
                lineHeight: 1.2,
              }}>
                {trade.title}
              </div>
            </div>
          ))}
        </div>

        <div style={{ margin: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.07)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--wc-t3)', textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>
            Also benefits from WorkCar
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.07)' }} />
        </div>

        <div className="grid grid-cols-4 gap-[10px]">
          {moreOccupations.map((occ) => (
            <div
              key={occ.id}
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-150"
              style={{
                background: selected === occ.id ? 'rgba(245,196,0,.12)' : 'rgba(255,255,255,.025)',
                border: `1.5px solid ${selected === occ.id ? 'var(--wc-y)' : 'rgba(255,255,255,.06)'}`,
                borderRadius: 16,
                padding: '14px 4px 10px',
                position: 'relative',
                color: selected === occ.id ? 'var(--wc-y)' : 'var(--wc-t3)',
              }}
              onClick={() => handleSelect(occ.id)}
              data-testid={`tile-trade-${occ.id}`}
            >
              {selected === occ.id && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--wc-y)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              <div style={{ marginBottom: 6 }}>{occ.icon}</div>
              <div style={{
                fontSize: 10, fontWeight: 600, textAlign: 'center',
                lineHeight: 1.2,
              }}>
                {occ.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
