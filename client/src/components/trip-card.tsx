import { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/lib/app-context';
import { type Trip, getTripOdoStart, getTripOdoEnd, RATE } from '@/lib/trip-data';
import { MapPin, Pointer, X, Clock, Route, Gauge } from 'lucide-react';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const polylineCache = new Map<string, string>();

function loadGMaps(): Promise<void> {
  if (window._gmapsLoaded) return Promise.resolve();
  if (window._gmapsPromise) return window._gmapsPromise;
  window._gmapsPromise = new Promise<void>((resolve, reject) => {
    if (!MAPS_KEY) { reject(new Error('No key')); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places,geometry`;
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
    const mapStyles = 'style=feature:all|element:geometry|color:0xffffff&style=feature:all|element:labels|visibility:off&style=feature:administrative.locality|element:labels.text|visibility:on&style=feature:administrative.locality|element:labels.text.fill|color:0x999999&style=feature:administrative.locality|element:labels.text.stroke|color:0xffffff&style=feature:administrative.neighborhood|element:labels.text|visibility:on&style=feature:administrative.neighborhood|element:labels.text.fill|color:0xbbbbbb&style=feature:administrative.neighborhood|element:labels.text.stroke|color:0xffffff&style=feature:road|element:geometry.fill|color:0x222222&style=feature:road|element:geometry.stroke|color:0xdddddd&style=feature:road.highway|element:geometry.fill|color:0x111111&style=feature:road.highway|element:geometry.stroke|color:0xcccccc&style=feature:water|element:geometry|color:0xe0e8ef&style=feature:poi|visibility:off&style=feature:transit|visibility:off&style=feature:landscape.man_made|element:geometry|color:0xf4f4f4&style=feature:landscape.natural|element:geometry|color:0xeef2e8';
    const markers = `markers=color:0x22C55E|label:A|${fromEnc}&markers=color:0xF5C400|label:B|${toEnc}`;

    const buildUrl = (polyPart?: string, bounds?: {n:number,s:number,e:number,w:number}) => {
      let visibleParam = `&visible=${fromEnc}%7C${toEnc}`;
      if (bounds) {
        const latPad = (bounds.n - bounds.s) * 0.4;
        const lngPad = (bounds.e - bounds.w) * 0.4;
        const padN = (bounds.n + latPad).toFixed(6);
        const padS = (bounds.s - latPad).toFixed(6);
        const padE = (bounds.e + lngPad).toFixed(6);
        const padW = (bounds.w - lngPad).toFixed(6);
        visibleParam = `&visible=${padS},${padW}%7C${padN},${padE}`;
      }
      if (polyPart) {
        const safePoly = polyPart.replace(/\|/g, '%7C').replace(/\\/g, '%5C');
        return `https://maps.googleapis.com/maps/api/staticmap?size=640x640&scale=2&maptype=roadmap&${mapStyles}&${markers}&path=weight:4|color:0xF5C400CC|enc:${safePoly}${visibleParam}&key=${MAPS_KEY}`;
      }
      return `https://maps.googleapis.com/maps/api/staticmap?size=640x640&scale=2&maptype=roadmap&${mapStyles}&${markers}${visibleParam}&key=${MAPS_KEY}`;
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
        let bounds: {n:number,s:number,e:number,w:number} | undefined;
        const b = route?.bounds;
        if (b) {
          const ne = b.getNorthEast();
          const sw = b.getSouthWest();
          bounds = { n: ne.lat(), s: sw.lat(), e: ne.lng(), w: sw.lng() };
        }
        if (poly) {
          const encoded = typeof poly === 'string' ? poly : (poly.points ? poly.points : (typeof poly.toJSON === 'function' ? poly.toJSON() : ''));
          if (encoded) {
            polylineCache.set(cacheKey, encoded);
            setImgUrl(buildUrl(encoded, bounds));
          } else {
            setImgUrl(buildUrl(undefined, bounds));
          }
        } else {
          setImgUrl(buildUrl(undefined, bounds));
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
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#f0f0f0' }}>
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

function InteractiveMap({ from, to, interactive = true }: { from: string; to: string; interactive?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!mapRef.current || !MAPS_KEY) return;
    let cancelled = false;

    loadGMaps().then(() => {
      if (cancelled || !mapRef.current) return;
      const g = window.google.maps;
      const map = new g.Map(mapRef.current, {
        zoom: 12,
        center: { lat: -33.8688, lng: 151.2093 },
        disableDefaultUI: true,
        zoomControl: interactive,
        gestureHandling: interactive ? 'greedy' : 'none',
        styles: [
          { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'administrative.locality', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
          { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#999999' }] },
          { featureType: 'administrative.neighborhood', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
          { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#bbbbbb' }] },
          { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#222222' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#dddddd' }] },
          { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#111111' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0e8ef' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#f4f4f4' }] },
          { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eef2e8' }] },
        ],
      });

      const ds = new g.DirectionsService();
      ds.route({
        origin: from,
        destination: to,
        travelMode: g.TravelMode.DRIVING,
        region: 'au',
      }).then((result: any) => {
        if (cancelled) return;
        const bounds = result.routes?.[0]?.bounds;
        if (bounds) map.fitBounds(bounds, 20);

        const path = result.routes?.[0]?.overview_path;
        if (!path || path.length < 2) return;

        new g.Polyline({
          path,
          map,
          strokeColor: '#F5C400',
          strokeWeight: 7,
          strokeOpacity: 0.9,
          zIndex: 1,
        });

        new g.Polyline({
          path,
          map,
          strokeColor: '#FFF0A0',
          strokeWeight: 2,
          strokeOpacity: 0.4,
          zIndex: 2,
        });

        const pulseMarker = new g.Marker({
          position: path[0],
          map,
          icon: {
            path: g.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#ffffff',
            fillOpacity: 0.9,
            strokeColor: '#F5C400',
            strokeWeight: 3,
          },
          zIndex: 10,
        });

        let totalDist = 0;
        const segments: number[] = [0];
        for (let i = 1; i < path.length; i++) {
          totalDist += g.geometry.spherical.computeDistanceBetween(path[i - 1], path[i]);
          segments.push(totalDist);
        }

        const duration = 4000;
        let startTime = 0;
        const animate = (ts: number) => {
          if (cancelled) return;
          if (!startTime) startTime = ts;
          const elapsed = (ts - startTime) % duration;
          const progress = elapsed / duration;
          const targetDist = progress * totalDist;

          let idx = 0;
          for (let i = 1; i < segments.length; i++) {
            if (segments[i] >= targetDist) { idx = i - 1; break; }
            if (i === segments.length - 1) idx = i - 1;
          }

          const segLen = segments[idx + 1] - segments[idx];
          const frac = segLen > 0 ? (targetDist - segments[idx]) / segLen : 0;
          const lat = path[idx].lat() + (path[idx + 1].lat() - path[idx].lat()) * frac;
          const lng = path[idx].lng() + (path[idx + 1].lng() - path[idx].lng()) * frac;
          pulseMarker.setPosition({ lat, lng });

          const pulseScale = 4 + Math.sin(progress * Math.PI * 8) * 2;
          const pulseOpacity = 0.6 + Math.sin(progress * Math.PI * 8) * 0.3;
          pulseMarker.setIcon({
            path: g.SymbolPath.CIRCLE,
            scale: pulseScale,
            fillColor: '#ffffff',
            fillOpacity: pulseOpacity,
            strokeColor: '#F5C400',
            strokeWeight: 2,
          });

          animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);

        const leg = result.routes?.[0]?.legs?.[0];
        if (leg) {
          new g.Marker({
            position: leg.start_location,
            map,
            icon: {
              path: g.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#22C55E',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2.5,
            },
            label: { text: 'A', color: '#fff', fontSize: '10px', fontWeight: 'bold' },
            zIndex: 5,
          });
          new g.Marker({
            position: leg.end_location,
            map,
            icon: {
              path: g.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#F5C400',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2.5,
            },
            label: { text: 'B', color: '#fff', fontSize: '10px', fontWeight: 'bold' },
            zIndex: 5,
          });
        }
      });
    });

    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [from, to]);

  return <div ref={mapRef} className="w-full h-full" />;
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
  const [showDetail, setShowDetail] = useState(false);
  const startXRef = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const baseOdo = state.lastOdoReading || state.baseOdo;
  const oStart = getTripOdoStart(state.trips, tripIndex, baseOdo);
  const oEnd = getTripOdoEnd(state.trips, tripIndex, baseOdo);

  const swipeRatio = Math.min(Math.abs(dragX) / 60, 1);
  const isBizSwipe = dragX > 0;
  const isPerSwipe = dragX < 0;

  const flyingRef = useRef(false);
  const flyOut = useCallback((dir: 'left' | 'right') => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    setIsFlying(true);
    const type = dir === 'right' ? 'business' : 'personal';
    if (dir === 'right' && navigator.vibrate) navigator.vibrate(30);
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
    if (dragX > 40) flyOut('right');
    else if (dragX < -40) flyOut('left');
    else setDragX(0);
  }, [isDragging, isFlying, dragX, flyOut]);

  const handleBusiness = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(30);
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
      <div className="w-full relative overflow-hidden flex-1 rounded-t-[20px] flex flex-col" style={{ background: '#f0f0f0' }}>
        <div className="flex-[1.6] relative overflow-hidden" style={{ perspective: '500px' }}
          onPointerDown={e => {
            e.stopPropagation();
            longPressTriggered.current = false;
            longPressTimer.current = setTimeout(() => {
              longPressTriggered.current = true;
              setShowDetail(true);
            }, 500);
          }}
          onPointerMove={() => {
            if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
          }}
          onPointerUp={e => {
            e.stopPropagation();
            if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
          }}
          onPointerCancel={() => {
            if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
          }}
          data-testid="map-tap-area">
          <div className="absolute inset-[-20%_0_0_0]" style={{ transform: 'rotateX(28deg) scale(1.15)', transformOrigin: '50% 55%' }}>
            <InteractiveMap from={`${trip.from}, ${trip.fromSub}`} to={`${trip.to}, ${trip.toSub}`} interactive={false} />
          </div>
          <div className="absolute inset-0 pointer-events-none z-[1]" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 35%, transparent 75%, rgba(0,0,0,0.15) 100%)' }} />
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
            style={{ background: '#F5C400', border: '1px solid #F5C400', color: '#000' }}
            onPointerDown={e => e.stopPropagation()}
            onClick={() => setShowDetail(true)}
            data-testid="button-see-details"
          >
            Details
          </button>
          <button
            className="rounded-[6px] px-2 py-[3px] font-heading font-semibold text-[11px] uppercase tracking-[.05em] transition-all"
            style={{ background: '#999', border: '1px solid #999', color: '#000' }}
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
                <div className="text-[10px] text-[#ffffff]" style={{ color: 'var(--wc-t3)' }}>{trip.fromSub}</div>
              </div>
            </div>
            <div className="flex items-center gap-[7px] py-[2px] border-t" style={{ borderColor: 'var(--wc-border)' }}>
              <div className="w-[20px] h-[20px] rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wc-yd)' }}>
                <MapPin className="w-[10px] h-[10px]" stroke="#F5C400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[11px] text-white truncate">{trip.to}</div>
                <div className="text-[#ffffff] text-[10px]" style={{ color: 'var(--wc-t3)' }}>{trip.toSub}</div>
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
          <div className="font-data text-[7px] text-[#ffffff]" style={{ color: 'var(--wc-t3)' }}>or tap</div>
          <div className="flex items-center gap-[3px] font-heading font-bold text-[10px] tracking-[.04em] uppercase" style={{ color: 'rgba(245,196,0,.65)' }}>
            Swipe right
            <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(245,196,0,0.65)"><path d="M5 12h14M14 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>
      {showDetail && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowDetail(false)}
          data-testid="detail-overlay"
        >
          <div
            className="relative w-[370px] max-h-[800px] rounded-[20px] overflow-hidden flex flex-col"
            style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-[10px] right-[10px] z-10 w-[32px] h-[32px] rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.15)' }}
              onClick={() => setShowDetail(false)}
              data-testid="button-close-detail"
            >
              <X className="w-[16px] h-[16px] text-white" />
            </button>
            <div className="relative w-full" style={{ height: '280px', background: '#f0f0f0' }}>
              <InteractiveMap from={`${trip.from}, ${trip.fromSub}`} to={`${trip.to}, ${trip.toSub}`} />
            </div>
            <div className="p-[16px] flex flex-col gap-[12px]">
              <div className="flex items-center gap-[6px]">
                <span className="font-heading font-bold text-[14px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t2)' }}>{trip.date}</span>
                <span className="w-[4px] h-[4px] rounded-full" style={{ background: 'var(--wc-t3)' }} />
                <span className="font-data text-[12px]" style={{ color: 'var(--wc-t3)' }}>{trip.duration}</span>
                <button
                  className="ml-auto rounded-[6px] px-2 py-[3px] font-heading font-semibold text-[11px] uppercase tracking-[.05em]"
                  style={{ background: '#999', border: '1px solid #999', color: '#000' }}
                  onClick={() => { setShowDetail(false); onEdit(); }}
                  data-testid="button-detail-edit"
                >
                  Edit &rsaquo;
                </button>
              </div>
              <div className="flex gap-[10px]">
                <div className="flex-1 flex flex-col gap-[8px] min-w-0">
                  <div className="flex items-start gap-[10px]">
                    <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center flex-shrink-0 mt-[2px]" style={{ background: 'rgba(34,197,94,.14)' }}>
                      <MapPin className="w-[14px] h-[14px]" stroke="#22C55E" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-semibold text-[14px] text-white truncate">{trip.from}</div>
                      <div className="text-[11px] mt-[1px] truncate" style={{ color: 'var(--wc-t3)' }}>{trip.fromSub}</div>
                    </div>
                  </div>
                  <div className="ml-[14px] w-[1px] h-[12px]" style={{ background: 'var(--wc-border)' }} />
                  <div className="flex items-start gap-[10px]">
                    <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center flex-shrink-0 mt-[2px]" style={{ background: 'var(--wc-yd)' }}>
                      <MapPin className="w-[14px] h-[14px]" stroke="#F5C400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-semibold text-[14px] text-white truncate">{trip.to}</div>
                      <div className="text-[11px] mt-[1px] truncate" style={{ color: 'var(--wc-t3)' }}>{trip.toSub}</div>
                    </div>
                  </div>
                </div>
                {(() => {
                  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  const daysInMonth = new Date(trip.year, trip.month + 1, 0).getDate();
                  const firstDow = new Date(trip.year, trip.month, 1).getDay();
                  const cells: (number | null)[] = Array(firstDow).fill(null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                  while (cells.length % 7 !== 0) cells.push(null);
                  return (
                    <div className="flex-shrink-0 self-center w-[100px] rounded-[10px] overflow-hidden flex flex-col" style={{ border: '1px solid var(--wc-border)' }} data-testid="detail-mini-calendar">
                      <div className="py-[3px] text-center font-heading font-bold text-[8px] uppercase tracking-[.1em]" style={{ background: 'var(--wc-y)', color: '#000' }}>
                        {MONTHS[trip.month]} {trip.year}
                      </div>
                      <div className="p-[3px_2px_4px]" style={{ background: 'rgba(255,255,255,.04)' }}>
                        <div className="grid grid-cols-7 gap-0">
                          {['S','M','T','W','T','F','S'].map((l, i) => (
                            <div key={`h${i}`} className="text-center font-data text-[6px] leading-[10px]" style={{ color: 'var(--wc-t3)' }}>{l}</div>
                          ))}
                          {cells.map((d, i) => (
                            <div
                              key={i}
                              className="text-center font-data text-[7px] leading-[13px] rounded-[3px]"
                              style={d === trip.day ? { background: 'var(--wc-y)', color: '#000', fontWeight: 800 } : { color: d ? 'var(--wc-t2)' : 'transparent' }}
                            >
                              {d ?? ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex gap-[8px]">
                <button
                  className="flex-1 py-[10px] rounded-[12px] font-heading font-extrabold text-[14px] tracking-[.06em] uppercase flex items-center justify-center gap-1"
                  style={{ background: 'rgba(180,180,180,.12)', border: '1.5px solid rgba(180,180,180,.35)', color: 'rgba(200,200,200,.9)' }}
                  onClick={() => { setShowDetail(false); flyOut('left'); }}
                  data-testid="button-detail-personal"
                >
                  Personal
                </button>
                <button
                  className="flex-1 py-[10px] rounded-[12px] font-heading font-extrabold text-[14px] tracking-[.06em] uppercase flex items-center justify-center gap-1"
                  style={{ background: 'rgba(245,196,0,.15)', border: '1.5px solid rgba(245,196,0,.6)', color: 'var(--wc-y)' }}
                  onClick={() => { setShowDetail(false); flyOut('right'); }}
                  data-testid="button-detail-business"
                >
                  Business
                </button>
              </div>
              <div className="flex gap-[8px] mt-[4px]">
                <div className="flex-1 rounded-[12px] p-[10px] flex flex-col items-center" style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.2)' }}>
                  <Route className="w-[16px] h-[16px] mb-[4px]" style={{ color: 'var(--wc-y)' }} />
                  <div className="font-heading font-black text-[22px] leading-none" style={{ color: 'var(--wc-y)' }}>{trip.km}</div>
                  <div className="font-data text-[9px] uppercase tracking-[.06em] mt-[2px]" style={{ color: 'var(--wc-t2)' }}>km</div>
                </div>
                <div className="flex-1 rounded-[12px] p-[10px] flex flex-col items-center" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)' }}>
                  <Clock className="w-[16px] h-[16px] mb-[4px]" style={{ color: 'var(--wc-t2)' }} />
                  <div className="font-heading font-black text-[22px] leading-none" style={{ color: 'var(--wc-t2)' }}>{trip.duration}</div>
                  <div className="font-data text-[9px] uppercase tracking-[.06em] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>duration</div>
                </div>
                <div className="flex-1 rounded-[12px] p-[10px] flex flex-col items-center" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
                  <Gauge className="w-[16px] h-[16px] mb-[4px]" style={{ color: 'var(--wc-am)' }} />
                  <div className="font-heading font-bold text-[13px] leading-tight text-center" style={{ color: 'var(--wc-am)' }}>
                    {Math.round(oStart).toLocaleString('en-AU')}
                    <span className="text-[9px] font-normal block" style={{ color: 'var(--wc-t3)' }}>&rarr; {Math.round(oEnd).toLocaleString('en-AU')}</span>
                  </div>
                  <div className="font-data text-[9px] uppercase tracking-[.06em] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>odometer</div>
                </div>
              </div>
              <div className="rounded-[10px] p-[8px_12px] flex items-center justify-between" style={{ background: 'rgba(245,196,0,.06)', border: '1px solid rgba(245,196,0,.15)' }}>
                <span className="font-data text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>ATO Deduction</span>
                <span className="font-heading font-black text-[18px]" style={{ color: 'var(--wc-y)' }}>${(trip.km * RATE).toFixed(2)}</span>
              </div>
              <button
                className="w-full py-[12px] rounded-[12px] font-heading font-bold text-[14px] uppercase tracking-[.06em]"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={() => setShowDetail(false)}
                data-testid="button-back-to-sorting"
              >
                Back to Sorting
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
