import { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { type Trip, getTripOdoStart, getTripOdoEnd, RATE } from '@/lib/trip-data';
import { MapPin } from 'lucide-react';

function TripMap({ trip }: { trip: Trip }) {
  return (
    <div className="w-full h-[158px] relative overflow-hidden flex-shrink-0" style={{ background: '#0c1018' }}>
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 350 158">
        <defs>
          <filter id="yg"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="350" height="158" fill="#0c1018" />
        <ellipse cx="38" cy="134" rx="50" ry="38" fill="#0d1f35" opacity=".7" />
        <line x1="0" y1="79" x2="350" y2="79" stroke="#1a2535" strokeWidth="10" />
        <line x1="0" y1="36" x2="350" y2="36" stroke="#1a2535" strokeWidth="6" />
        <line x1="0" y1="128" x2="350" y2="128" stroke="#1a2535" strokeWidth="6" />
        <line x1="70" y1="0" x2="70" y2="158" stroke="#1a2535" strokeWidth="10" />
        <line x1="175" y1="0" x2="175" y2="158" stroke="#1a2535" strokeWidth="6" />
        <line x1="280" y1="0" x2="280" y2="158" stroke="#1a2535" strokeWidth="10" />
        <rect x="78" y="42" width="36" height="30" rx="3" fill="#141c28" opacity=".8" />
        <rect x="120" y="42" width="48" height="30" rx="3" fill="#111824" opacity=".8" />
        <rect x="183" y="85" width="40" height="38" rx="3" fill="#141c28" opacity=".8" />
        <rect x="183" y="42" width="88" height="34" rx="3" fill="#0f1520" opacity=".8" />
        <rect x="288" y="42" width="55" height="30" rx="3" fill="#141c28" opacity=".8" />
        <rect x="78" y="85" width="88" height="38" rx="4" fill="#0f1e14" opacity=".65" />
        <path d="M 62 134 L 62 79 L 175 79 L 175 36 L 282 36" stroke="#F5C400" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".18" filter="url(#yg)" />
        <path d="M 62 134 L 62 79 L 175 79 L 175 36 L 282 36" stroke="#F5C400" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 62 134 L 62 79 L 175 79 L 175 36 L 282 36" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="5 11" opacity=".3">
          <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="1.4s" repeatCount="indefinite" />
        </path>
        <g transform="translate(47,106)">
          <path d="M15 0C6.7 0 0 6.7 0 15c0 8.3 15 34 15 34s15-25.7 15-34C30 6.7 23.3 0 15 0z" fill="#22C55E" />
          <circle cx="15" cy="15" r="7" fill="rgba(0,0,0,.4)" />
          <text x="15" y="19.5" textAnchor="middle" fill="white" fontSize="10" fontFamily="Arial" fontWeight="900">A</text>
        </g>
        <g transform="translate(267,8)">
          <path d="M15 0C6.7 0 0 6.7 0 15c0 8.3 15 34 15 34s15-25.7 15-34C30 6.7 23.3 0 15 0z" fill="#F5C400" />
          <circle cx="15" cy="15" r="7" fill="rgba(0,0,0,.4)" />
          <text x="15" y="19.5" textAnchor="middle" fill="black" fontSize="10" fontFamily="Arial" fontWeight="900">B</text>
        </g>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 h-[44px] pointer-events-none z-[5]" style={{ background: 'linear-gradient(180deg,transparent,var(--wc-card))' }} />
    </div>
  );
}

interface TripCardProps {
  trip: Trip;
  tripIndex: number;
  isTop: boolean;
  position: number;
  onClassify: (type: 'business' | 'personal') => void;
  onEdit: () => void;
}

export function TripCard({ trip, tripIndex, isTop, position, onClassify, onEdit }: TripCardProps) {
  const { state } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const startXRef = useRef(0);

  const oStart = getTripOdoStart(state.trips, tripIndex);
  const oEnd = getTripOdoEnd(state.trips, tripIndex);

  const swipeRatio = Math.min(Math.abs(dragX) / 120, 1);
  const isBizSwipe = dragX > 0;
  const isPerSwipe = dragX < 0;

  const flyingRef = useRef(false);
  const flyOut = useCallback((dir: 'left' | 'right') => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    setIsFlying(true);
    const type = dir === 'right' ? 'business' : 'personal';
    setDragX(dir === 'right' ? 500 : -500);
    setTimeout(() => {
      setDragX(0);
      flyingRef.current = false;
      setIsFlying(false);
      setIsDragging(false);
      onClassify(type);
    }, 340);
  }, [onClassify]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isFlying || !isTop) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.tagName === 'BUTTON') return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    if (cardRef.current) cardRef.current.setPointerCapture(e.pointerId);
  }, [isFlying, isTop]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isFlying) return;
    setDragX(e.clientX - startXRef.current);
  }, [isDragging, isFlying]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging || isFlying) return;
    setIsDragging(false);
    if (dragX > 80) flyOut('right');
    else if (dragX < -80) flyOut('left');
    else setDragX(0);
  }, [isDragging, isFlying, dragX, flyOut]);

  const handleBusiness = useCallback(() => {
    flyOut('right');
  }, [flyOut]);

  const getTransform = () => {
    if (isFlying) return `translateX(${dragX}px) rotate(${dragX > 0 ? 14 : -14}deg)`;
    if (isDragging) return `translateX(${dragX}px) rotate(${dragX * 0.065}deg)`;
    if (!isTop) {
      if (position === 1) return 'scale(.955) translateY(10px)';
      if (position === 2) return 'scale(.91) translateY(19px)';
    }
    return 'scale(1) translateY(0)';
  };

  const getOpacity = () => {
    if (isFlying) return 0;
    if (position === 1) return 0.55;
    if (position === 2) return 0.28;
    return 1;
  };

  return (
    <div
      ref={cardRef}
      className="absolute top-0 left-0 right-0 rounded-[20px] overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        background: 'var(--wc-card)',
        border: '1px solid var(--wc-border)',
        boxShadow: '0 16px 50px rgba(0,0,0,.7)',
        transform: getTransform(),
        opacity: getOpacity(),
        transition: isDragging ? 'none' : isFlying ? 'transform .32s cubic-bezier(.4,0,.6,1), opacity .28s' : 'transform .4s cubic-bezier(.34,1.3,.64,1), opacity .3s',
        zIndex: isTop ? 10 : position === 1 ? 1 : 0,
        pointerEvents: isTop ? 'auto' : 'none',
        transformOrigin: 'center 62%',
        willChange: 'transform',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      data-testid={`trip-card-${tripIndex}`}
    >
      {isTop && (
        <>
          <div
            className="absolute inset-0 rounded-[20px] pointer-events-none z-20 flex items-start justify-end p-3"
            style={{
              background: 'linear-gradient(135deg,rgba(245,196,0,0),rgba(245,196,0,.22))',
              opacity: isBizSwipe ? swipeRatio * 0.8 : 0,
            }}
          >
            <div
              className="font-heading font-black text-[26px] tracking-[.05em] p-[5px_12px] rounded-[9px]"
              style={{
                color: 'var(--wc-y)',
                border: '3px solid var(--wc-y)',
                transform: 'rotate(10deg)',
                opacity: isBizSwipe ? swipeRatio : 0,
              }}
            >
              SORT: BUSINESS
            </div>
          </div>
          <div
            className="absolute inset-0 rounded-[20px] pointer-events-none z-20 flex items-start p-3"
            style={{
              background: 'linear-gradient(225deg,rgba(239,68,68,0),rgba(239,68,68,.22))',
              opacity: isPerSwipe ? swipeRatio * 0.8 : 0,
            }}
          >
            <div
              className="font-heading font-black text-[26px] tracking-[.05em] p-[5px_12px] rounded-[9px]"
              style={{
                color: 'var(--wc-re)',
                border: '3px solid var(--wc-re)',
                transform: 'rotate(-10deg)',
                opacity: isPerSwipe ? swipeRatio : 0,
              }}
            >
              SORT: PERSONAL
            </div>
          </div>
        </>
      )}

      <TripMap trip={trip} />

      <div className="p-[7px_13px_10px] flex flex-col gap-[5px]">
        <div className="flex items-center gap-[5px]">
          <span className="font-heading font-bold text-[12px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t2)' }}>{trip.date}</span>
          <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--wc-t3)' }} />
          <span className="font-data text-[10px]" style={{ color: 'var(--wc-t3)' }}>{trip.duration}</span>
          <button
            className="ml-auto rounded-[6px] px-2 py-[3px] font-heading font-semibold text-[11px] uppercase tracking-[.05em] transition-all"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
            onPointerDown={e => e.stopPropagation()}
            onClick={onEdit}
            data-testid="button-edit-trip"
          >
            Edit &rsaquo;
          </button>
        </div>

        <div className="flex gap-[7px]">
          <div className="flex-1 flex flex-col gap-[5px] min-w-0">
            <div className="flex items-center gap-[7px] py-[3px]">
              <div className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,.14)' }}>
                <MapPin className="w-[11px] h-[11px]" stroke="#22C55E" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[12px] text-white truncate">{trip.from}</div>
                <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>{trip.fromSub}</div>
              </div>
            </div>
            <div className="flex items-center gap-[7px] py-[3px] border-t" style={{ borderColor: 'var(--wc-border)' }}>
              <div className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wc-yd)' }}>
                <MapPin className="w-[11px] h-[11px]" stroke="#F5C400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[12px] text-white truncate">{trip.to}</div>
                <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>{trip.toSub}</div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 self-stretch flex flex-col items-center justify-center rounded-[10px] px-[12px]" style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.2)' }}>
            <div className="font-heading font-black text-[22px] leading-none" style={{ color: 'var(--wc-y)' }}>{trip.km}</div>
            <div className="font-data text-[9px] uppercase tracking-[.06em] mt-[2px]" style={{ color: 'var(--wc-t2)' }}>km</div>
            <div className="font-data text-[9px] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>{trip.time}</div>
          </div>
        </div>

        <div className="flex items-center gap-[5px] py-[2px] border-t" style={{ borderColor: 'var(--wc-border)' }}>
          <span className="font-data text-[7px] uppercase tracking-[.09em]" style={{ color: 'var(--wc-t3)' }}>Odo</span>
          <span className="font-heading font-bold text-[12px]" style={{ color: 'var(--wc-am)' }}>{Math.round(oStart).toLocaleString('en-AU')} km</span>
          <span className="font-heading text-[11px]" style={{ color: 'var(--wc-t3)' }}>&rarr;</span>
          <span className="font-heading font-bold text-[12px]" style={{ color: 'var(--wc-am)' }}>{Math.round(oEnd).toLocaleString('en-AU')} km</span>
        </div>

        <div className="flex gap-[6px]" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()} onPointerMove={e => e.stopPropagation()}>
          <button
            className="flex-1 py-[9px] rounded-[10px] font-heading font-extrabold text-[14px] tracking-[.06em] uppercase flex items-center justify-center gap-1 transition-all"
            style={{ background: 'transparent', border: '1.5px solid rgba(239,68,68,.3)', color: 'rgba(239,68,68,.65)' }}
            onClick={() => flyOut('left')}
            data-testid="button-personal"
          >
            Personal
          </button>
          <button
            className="flex-1 py-[9px] rounded-[10px] font-heading font-extrabold text-[14px] tracking-[.06em] uppercase flex items-center justify-center gap-1 transition-all active:scale-95"
            style={{
              background: 'var(--wc-yd)',
              border: '1.5px solid rgba(245,196,0,.45)',
              color: 'var(--wc-y)',
            }}
            onClick={handleBusiness}
            data-testid="button-business"
          >
            Business
          </button>
        </div>

        <div className="flex items-center justify-between px-[2px] mt-[-2px]">
          <div className="flex items-center gap-[3px] font-heading font-bold text-[11px] tracking-[.04em] uppercase" style={{ color: 'rgba(239,68,68,.55)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(239,68,68,0.55)"><path d="M19 12H5M5 12l7-7M5 12l7 7" /></svg>
            Swipe left
          </div>
          <div className="font-data text-[8px]" style={{ color: 'var(--wc-t3)' }}>or tap</div>
          <div className="flex items-center gap-[3px] font-heading font-bold text-[11px] tracking-[.04em] uppercase" style={{ color: 'rgba(245,196,0,.65)' }}>
            Swipe right
            <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(245,196,0,0.65)"><path d="M5 12h14M14 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
