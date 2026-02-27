import { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { type Trip, getTripOdoStart, getTripOdoEnd, RATE } from '@/lib/trip-data';
import { MapPin } from 'lucide-react';


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
      className="absolute top-0 left-0 right-0 bottom-0 rounded-[20px] overflow-hidden cursor-grab active:cursor-grabbing flex flex-col"
      style={{
        background: 'var(--wc-card)',
        border: '1.5px solid var(--wc-y)',
        boxShadow: '0 0 18px rgba(245,196,0,.25), 0 0 40px rgba(245,196,0,.1), 0 16px 50px rgba(0,0,0,.7)',
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
      <div className="w-full relative overflow-hidden flex-1 rounded-t-[20px]" style={{ background: '#0c1018' }}>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-[6px]" style={{ color: 'var(--wc-t3)' }}>
            <MapPin className="w-[20px] h-[20px] opacity-30" />
            <span className="font-data text-[9px] uppercase tracking-[.1em] opacity-40">Map</span>
          </div>
        </div>
        <div className="flex items-center gap-[5px] px-[13px] py-[7px]" style={{ borderTop: '1px solid var(--wc-border)' }}>
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
      </div>
      <div className="p-[0px_13px_7px] flex flex-col gap-[3px] flex-shrink-0">

        <div className="flex gap-[7px]">
          <div className="flex-1 flex flex-col gap-[3px] min-w-0">
            <div className="flex items-center gap-[7px] py-[2px]">
              <div className="w-[20px] h-[20px] rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,.14)' }}>
                <MapPin className="w-[10px] h-[10px]" stroke="#22C55E" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[11px] text-white truncate">{trip.from}</div>
                <div className="text-[9px]" style={{ color: 'var(--wc-t3)' }}>{trip.fromSub}</div>
              </div>
            </div>
            <div className="flex items-center gap-[7px] py-[2px] border-t" style={{ borderColor: 'var(--wc-border)' }}>
              <div className="w-[20px] h-[20px] rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wc-yd)' }}>
                <MapPin className="w-[10px] h-[10px]" stroke="#F5C400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[11px] text-white truncate">{trip.to}</div>
                <div className="text-[9px]" style={{ color: 'var(--wc-t3)' }}>{trip.toSub}</div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 self-stretch flex flex-col items-center justify-center rounded-[10px] px-[10px]" style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.2)' }}>
            <div className="font-heading font-black text-[20px] leading-none" style={{ color: 'var(--wc-y)' }}>{trip.km}</div>
            <div className="font-data text-[8px] uppercase tracking-[.06em] mt-[1px]" style={{ color: 'var(--wc-t2)' }}>km</div>
            <div className="font-data text-[8px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>{trip.time}</div>
          </div>
        </div>

        <div className="flex items-center gap-[5px] py-[1px] border-t" style={{ borderColor: 'var(--wc-border)' }}>
          <span className="font-data text-[7px] uppercase tracking-[.09em]" style={{ color: 'var(--wc-t3)' }}>Odo</span>
          <span className="font-heading font-bold text-[11px]" style={{ color: 'var(--wc-am)' }}>{Math.round(oStart).toLocaleString('en-AU')} km</span>
          <span className="font-heading text-[10px]" style={{ color: 'var(--wc-t3)' }}>&rarr;</span>
          <span className="font-heading font-bold text-[11px]" style={{ color: 'var(--wc-am)' }}>{Math.round(oEnd).toLocaleString('en-AU')} km</span>
        </div>

        <div className="flex gap-[5px]" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()} onPointerMove={e => e.stopPropagation()}>
          <button
            className="flex-1 py-[7px] rounded-[10px] font-heading font-extrabold text-[13px] tracking-[.06em] uppercase flex items-center justify-center gap-1 transition-all"
            style={{ background: 'transparent', border: '1.5px solid rgba(239,68,68,.3)', color: 'rgba(239,68,68,.65)' }}
            onClick={() => flyOut('left')}
            data-testid="button-personal"
          >
            Personal
          </button>
          <button
            className="flex-1 py-[7px] rounded-[10px] font-heading font-extrabold text-[13px] tracking-[.06em] uppercase flex items-center justify-center gap-1 transition-all active:scale-95"
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
          <div className="flex items-center gap-[3px] font-heading font-bold text-[10px] tracking-[.04em] uppercase" style={{ color: 'rgba(239,68,68,.55)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(239,68,68,0.55)"><path d="M19 12H5M5 12l7-7M5 12l7 7" /></svg>
            Swipe left
          </div>
          <div className="font-data text-[7px]" style={{ color: 'var(--wc-t3)' }}>or tap</div>
          <div className="flex items-center gap-[3px] font-heading font-bold text-[10px] tracking-[.04em] uppercase" style={{ color: 'rgba(245,196,0,.65)' }}>
            Swipe right
            <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(245,196,0,0.65)"><path d="M5 12h14M14 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
