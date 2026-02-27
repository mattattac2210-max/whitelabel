import { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { type Trip, getTripOdoStart, getTripOdoEnd, RATE } from '@/lib/trip-data';
import { MapPin, Pointer } from 'lucide-react';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const polylineCache = new Map<string, string>();

function loadGMaps(): Promise<void> {
  if (window._gmapsLoaded) return Promise.resolve();
  if (window._gmapsPromise) return window._gmapsPromise;
  window._gmapsPromise = new Promise<void>((resolve, reject) => {
    if (!MAPS_KEY) { reject(new Error('No key')); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => { window._gmapsLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed'));
    document.head.appendChild(script);
  });
  return window._gmapsPromise;
}

function StaticRouteMap({ from, to }: { from: string; to: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const fetchedRef = useRef('');

  useEffect(() => {
    const cacheKey = `${from}|${to}`;
    if (!MAPS_KEY || fetchedRef.current === cacheKey) return;
    fetchedRef.current = cacheKey;
    let cancelled = false;

    const fromEnc = encodeURIComponent(from);
    const toEnc = encodeURIComponent(to);
    const darkStyles = 'style=feature:all|element:geometry|color:0xffffff&style=feature:all|element:labels|visibility:off&style=feature:road|element:geometry.fill|color:0x000000&style=feature:road|element:geometry.stroke|color:0xcccccc&style=feature:water|element:geometry|color:0xe8e8e8&style=feature:poi|visibility:off&style=feature:transit|visibility:off&style=feature:administrative|visibility:off&style=feature:landscape.man_made|element:geometry|color:0xf0f0f0';
    const markers = `markers=color:0x22C55E|label:A|${fromEnc}&markers=color:0xF5C400|label:B|${toEnc}`;

    const buildUrl = (polyPart?: string) => {
      if (polyPart) {
        const safePoly = polyPart.replace(/\|/g, '%7C').replace(/\\/g, '%5C');
        return `https://maps.googleapis.com/maps/api/staticmap?size=600x300&scale=2&maptype=roadmap&${darkStyles}&${markers}&path=weight:4|color:0xF5C400CC|enc:${safePoly}&key=${MAPS_KEY}`;
      }
      return `https://maps.googleapis.com/maps/api/staticmap?size=600x300&scale=2&maptype=roadmap&${darkStyles}&${markers}&key=${MAPS_KEY}`;
    };

    const cached = polylineCache.get(cacheKey);
    if (cached) {
      setImgUrl(buildUrl(cached));
      setError(false);
      return;
    }

    loadGMaps().then(() => {
      if (cancelled) return;
      const ds = new window.google.maps.DirectionsService();
      ds.route({
        origin: from,
        destination: to,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'au',
      }).then((result: any) => {
        if (cancelled) return;
        const route = result?.routes?.[0];
        const poly = route?.overview_polyline;
        if (poly) {
          const encoded = typeof poly === 'string' ? poly : (poly.points ? poly.points : (typeof poly.toJSON === 'function' ? poly.toJSON() : ''));
          if (encoded) {
            polylineCache.set(cacheKey, encoded);
            setImgUrl(buildUrl(encoded));
          } else {
            setImgUrl(buildUrl());
          }
        } else {
          setImgUrl(buildUrl());
        }
        setError(false);
      }).catch(() => {
        if (!cancelled) { setImgUrl(buildUrl()); setError(false); }
      });
    }).catch(() => {
      if (!cancelled) { setImgUrl(buildUrl()); setError(false); }
    });

    return () => { cancelled = true; };
  }, [from, to]);

  if (error || !imgUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0c1018' }}>
        <div className="flex flex-col items-center gap-[4px]">
          <MapPin className="w-[18px] h-[18px] opacity-25" style={{ color: 'var(--wc-t3)' }} />
          <span className="font-data text-[8px] uppercase tracking-[.1em] opacity-30" style={{ color: 'var(--wc-t3)' }}>Map</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imgUrl}
      alt="Route map"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ filter: 'brightness(0.95)' }}
      onError={() => setError(true)}
      loading="lazy"
      draggable={false}
    />
  );
}

interface TripCardProps {
  trip: Trip;
  tripIndex: number;
  isTop: boolean;
  position: number;
  onClassify: (type: 'business' | 'personal') => void;
  onEdit: () => void;
  tutorialPhase?: 'idle' | 'left' | 'right' | 'done';
}

export function TripCard({ trip, tripIndex, isTop, position, onClassify, onEdit, tutorialPhase = 'done' }: TripCardProps) {
  const { state } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const startXRef = useRef(0);

  const baseOdo = state.lastOdoReading || state.baseOdo;
  const oStart = getTripOdoStart(state.trips, tripIndex, baseOdo);
  const oEnd = getTripOdoEnd(state.trips, tripIndex, baseOdo);

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

  const isTutorialActive = tutorialPhase === 'left' || tutorialPhase === 'right';
  const showFingerGesture = isTutorialActive || tutorialPhase === 'idle';

  const getTransform = () => {
    if (isFlying) return `translateX(${dragX}px) rotate(${dragX > 0 ? 14 : -14}deg)`;
    if (isDragging) return `translateX(${dragX}px) rotate(${dragX * 0.065}deg)`;
    if (!isTop) {
      if (position === 1) return 'scale(.955) translateY(10px)';
      if (position === 2) return 'scale(.91) translateY(19px)';
    }
    if (isTop && tutorialPhase === 'left') return 'translateX(-45px) rotate(-3deg)';
    if (isTop && tutorialPhase === 'right') return 'translateX(45px) rotate(3deg)';
    return 'scale(1) translateY(0)';
  };

  const getOpacity = () => {
    if (isFlying) return 0;
    if (position === 1) return 0.55;
    if (position === 2) return 0.28;
    return 1;
  };

  const perBtnHighlight = tutorialPhase === 'left' || (isPerSwipe && swipeRatio > 0.15);
  const bizBtnHighlight = tutorialPhase === 'right' || (isBizSwipe && swipeRatio > 0.15);

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
        transition: isDragging ? 'none' : isFlying ? 'transform .32s cubic-bezier(.4,0,.6,1), opacity .28s' : isTutorialActive ? 'transform .55s cubic-bezier(.4,0,.2,1), opacity .3s' : 'transform .4s cubic-bezier(.34,1.3,.64,1), opacity .3s',
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
            className="absolute inset-0 rounded-[20px] pointer-events-none z-20 flex items-center justify-center"
            style={{
              background: isBizSwipe ? 'linear-gradient(135deg,rgba(245,196,0,0),rgba(245,196,0,.22))' : tutorialPhase === 'right' ? 'rgba(245,196,0,.08)' : 'transparent',
              opacity: isBizSwipe ? swipeRatio * 0.8 : tutorialPhase === 'right' ? 1 : 0,
              transition: 'opacity .5s, background .5s',
            }}
          >
            <div
              className="font-heading font-black text-[28px] tracking-[.05em] p-[8px_20px] rounded-[12px]"
              style={{
                color: 'var(--wc-y)',
                border: '3px solid var(--wc-y)',
                opacity: isBizSwipe ? swipeRatio : tutorialPhase === 'right' ? 0.9 : 0,
                transition: 'opacity .5s',
              }}
            >
              Business
            </div>
          </div>
          <div
            className="absolute inset-0 rounded-[20px] pointer-events-none z-20 flex items-center justify-center"
            style={{
              background: isPerSwipe ? 'linear-gradient(225deg,rgba(160,160,160,0),rgba(160,160,160,.15))' : tutorialPhase === 'left' ? 'rgba(160,160,160,.06)' : 'transparent',
              opacity: isPerSwipe ? swipeRatio * 0.8 : tutorialPhase === 'left' ? 1 : 0,
              transition: 'opacity .5s, background .5s',
            }}
          >
            <div
              className="font-heading font-black text-[28px] tracking-[.05em] p-[8px_20px] rounded-[12px]"
              style={{
                color: 'rgba(180,180,180,.9)',
                border: '3px solid rgba(180,180,180,.6)',
                opacity: isPerSwipe ? swipeRatio : tutorialPhase === 'left' ? 0.9 : 0,
                transition: 'opacity .5s',
              }}
            >
              Personal
            </div>
          </div>
        </>
      )}
      <div className="w-full relative overflow-hidden flex-1 rounded-t-[20px] flex flex-col" style={{ background: '#0c1018' }}>
        <div className="flex-1 relative overflow-hidden">
          <StaticRouteMap from={`${trip.from}, ${trip.fromSub}`} to={`${trip.to}, ${trip.toSub}`} />
          <div className="absolute bottom-[6px] left-[8px] rounded-[7px] px-[8px] py-[3px] flex items-center gap-[4px]" style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', border: '1px solid rgba(245,196,0,.25)' }}>
            <span className="font-heading font-extrabold text-[14px]" style={{ color: 'var(--wc-y)' }}>{trip.km}</span>
            <span className="font-data text-[8px] uppercase" style={{ color: 'var(--wc-t3)' }}>km</span>
            <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--wc-t3)' }} />
            <span className="font-data text-[8px]" style={{ color: 'var(--wc-t3)' }}>{trip.time}</span>
          </div>
          {isTop && tutorialPhase !== 'done' && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              style={{
                opacity: isTutorialActive ? 0.45 : tutorialPhase === 'idle' ? 0.3 : 0,
                transition: 'opacity .5s ease',
              }}
            >
              <div className="flex flex-col items-center gap-[10px]">
                <Pointer className="w-[130px] h-[130px]" stroke="rgba(220,220,220,.7)" strokeWidth={0.8} />
                <div className="flex items-center gap-[10px]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(200,200,200,.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M5 12l5-5M5 12l5 5" />
                  </svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(200,200,200,.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M19 12l-5-5M19 12l-5 5" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-[5px] px-[13px] py-[5px] flex-shrink-0" style={{ borderTop: '1px solid var(--wc-border)' }}>
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
            className="flex-1 py-[7px] rounded-[10px] font-heading font-extrabold text-[13px] tracking-[.06em] uppercase flex items-center justify-center gap-1"
            style={{
              background: perBtnHighlight ? 'rgba(180,180,180,.15)' : 'transparent',
              border: perBtnHighlight ? '1.5px solid rgba(180,180,180,.5)' : '1.5px solid rgba(180,180,180,.2)',
              color: perBtnHighlight ? 'rgba(200,200,200,.9)' : 'rgba(180,180,180,.5)',
              transition: 'all .4s ease',
              transform: perBtnHighlight ? 'scale(1.04)' : 'scale(1)',
              boxShadow: perBtnHighlight ? '0 0 12px rgba(180,180,180,.2)' : 'none',
            }}
            onClick={() => flyOut('left')}
            data-testid="button-personal"
          >
            Personal
          </button>
          <button
            className="flex-1 py-[7px] rounded-[10px] font-heading font-extrabold text-[13px] tracking-[.06em] uppercase flex items-center justify-center gap-1 active:scale-95"
            style={{
              background: bizBtnHighlight ? 'rgba(245,196,0,.2)' : 'var(--wc-yd)',
              border: bizBtnHighlight ? '1.5px solid rgba(245,196,0,.7)' : '1.5px solid rgba(245,196,0,.45)',
              color: 'var(--wc-y)',
              transition: 'all .4s ease',
              transform: bizBtnHighlight ? 'scale(1.04)' : 'scale(1)',
              boxShadow: bizBtnHighlight ? '0 0 12px rgba(245,196,0,.3)' : 'none',
            }}
            onClick={handleBusiness}
            data-testid="button-business"
          >
            Business
          </button>
        </div>

        <div className="flex items-center justify-between px-[2px] mt-[-2px]">
          <div className="flex items-center gap-[3px] font-heading font-bold text-[10px] tracking-[.04em] uppercase" style={{ color: 'rgba(160,160,160,.55)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(160,160,160,0.55)"><path d="M19 12H5M5 12l7-7M5 12l7 7" /></svg>
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
