import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { CATEGORIES, RATE } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, Wrench, Building2, Package, ClipboardList, Handshake, Store, Zap, FileText, GraduationCap, Landmark, Check, MapPin } from 'lucide-react';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const iconMap: Record<string, typeof Wrench> = {
  Wrench, Building2, Package, ClipboardList, Handshake, Store, Zap, FileText, GraduationCap, Landmark,
};

function loadGMaps(): Promise<void> {
  if ((window as any)._gmapsLoaded) return Promise.resolve();
  if ((window as any)._gmapsPromise) return (window as any)._gmapsPromise;
  (window as any)._gmapsPromise = new Promise<void>((resolve, reject) => {
    if (!MAPS_KEY) { reject(new Error('No key')); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places,geometry`;
    script.async = true;
    script.onload = () => { (window as any)._gmapsLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed'));
    document.head.appendChild(script);
  });
  return (window as any)._gmapsPromise;
}

function ClassifyMiniMap({ from, to }: { from: string; to: string }) {
  const [url, setUrl] = useState('');
  const fetchedRef = useRef('');

  useEffect(() => {
    if (!MAPS_KEY) return;
    const key = `${from}|${to}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    const mapStyles = [
      'style=feature:all|element:geometry|color:0xffffff',
      'style=feature:all|element:labels|visibility:off',
      'style=feature:road|element:geometry|color:0x000000',
      'style=feature:water|element:geometry|color:0xd4e8f0',
    ].join('&');
    const markers = `markers=size:small|color:0x22C55E|${encodeURIComponent(from)}&markers=size:small|color:0xF5C400|${encodeURIComponent(to)}`;

    loadGMaps().then(() => {
      const ds = new google.maps.DirectionsService();
      ds.route({ origin: from, destination: to, travelMode: google.maps.TravelMode.DRIVING, region: 'au' })
        .then((result: any) => {
          const poly = result.routes?.[0]?.overview_polyline;
          if (poly) {
            const safePoly = poly.replace(/\|/g, '%7C');
            setUrl(`https://maps.googleapis.com/maps/api/staticmap?size=300x300&scale=2&maptype=roadmap&${mapStyles}&${markers}&path=weight:8|color:0xF5C400CC|enc:${safePoly}&key=${MAPS_KEY}`);
          } else {
            setUrl(`https://maps.googleapis.com/maps/api/staticmap?size=300x300&scale=2&maptype=roadmap&${mapStyles}&${markers}&key=${MAPS_KEY}`);
          }
        })
        .catch(() => {
          setUrl(`https://maps.googleapis.com/maps/api/staticmap?size=300x300&scale=2&maptype=roadmap&${mapStyles}&${markers}&key=${MAPS_KEY}`);
        });
    });
  }, [from, to]);

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.04)' }}>
        <div className="w-[14px] h-[14px] border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--wc-y)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden" data-testid="classify-mini-map">
      <img src={url} alt="route" className="absolute inset-0 w-full h-full object-cover pt-[0px] pb-[0px] pl-[4px] pr-[4px]" draggable={false} />
    </div>
  );
}

export function ClassifyScreen() {
  const { state, dispatch } = useApp();
  const [armed, setArmed] = useState<number | null>(null);
  const [customText, setCustomText] = useState('');
  const [customArmed, setCustomArmed] = useState(false);
  const [justAdvanced, setJustAdvanced] = useState(false);

  const { classifyStep, classifyBizTrips, trips } = state;

  useEffect(() => {
    if (classifyStep >= classifyBizTrips.length && classifyBizTrips.length > 0) {
      dispatch({ type: 'GO_SCREEN', screen: 'review' });
    }
  }, [classifyStep, classifyBizTrips.length, dispatch]);

  useEffect(() => {
    if (classifyStep > 0) {
      setJustAdvanced(true);
      const t = setTimeout(() => setJustAdvanced(false), 600);
      return () => clearTimeout(t);
    }
  }, [classifyStep]);

  if (classifyStep >= classifyBizTrips.length) {
    return null;
  }

  const tripIndex = classifyBizTrips[classifyStep];
  const trip = trips[tripIndex];
  const total = classifyBizTrips.length;
  const fillPct = ((classifyStep + 0.5) / total) * 100;

  const handleArm = useCallback((idx: number) => {
    if (armed === idx) {
      dispatch({ type: 'SET_PURPOSE', tripIndex, purposeLabel: CATEGORIES[idx].label, purposeIndex: idx });
      setArmed(null);
      dispatch({ type: 'CLASSIFY_NEXT' });
    } else {
      setArmed(idx);
      setCustomArmed(false);
    }
  }, [armed, dispatch, tripIndex]);

  const handleCustom = useCallback(() => {
    if (!customText.trim()) return;
    if (customArmed) {
      dispatch({ type: 'SET_PURPOSE', tripIndex, purposeLabel: customText.trim(), purposeIndex: null });
      setCustomArmed(false);
      setCustomText('');
      dispatch({ type: 'CLASSIFY_NEXT' });
    } else {
      setCustomArmed(true);
      setArmed(null);
    }
  }, [customArmed, customText, dispatch, tripIndex]);

  return (
    <div className="flex flex-col h-full" data-testid="classify-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'sort' })}
          data-testid="button-back-classify"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">What was this for?</span>
        <span className="ml-auto text-[11px]" style={{ color: 'var(--wc-t3)' }}>{classifyStep + 1} of {total}</span>
      </div>

      <div className="px-4 pb-[5px] flex-shrink-0">
        <div className="flex items-center justify-between mb-[3px]">
          <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Business trips</span>
          <span className="font-heading font-bold text-[12px]" style={{ color: 'var(--wc-y)' }}>{classifyStep + 1} / {total}</span>
        </div>
        <div className="h-[3px] rounded-[2px] overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
          <div className="h-full rounded-[2px] transition-all duration-500" style={{ width: `${fillPct}%`, background: 'var(--wc-y)' }} />
        </div>
      </div>

      <div
        className="mx-[10px] mb-[10px] rounded-[14px] overflow-hidden flex-shrink-0 transition-all"
        style={{
          background: 'var(--wc-card)',
          border: justAdvanced ? '1.5px solid rgba(245,196,0,.85)' : '1.5px solid rgba(245,196,0,.5)',
          boxShadow: justAdvanced ? '0 0 20px rgba(245,196,0,.35), 0 0 40px rgba(245,196,0,.12)' : '0 0 14px rgba(245,196,0,.15), 0 0 30px rgba(245,196,0,.06)',
          transition: 'border .6s ease, box-shadow .6s ease',
        }}
        data-testid="classify-trip-card"
      >
        <div className="flex gap-0">
          <div className="flex-1 min-w-0 p-[12px_6px_12px_12px] flex flex-col justify-center gap-[8px]">
            <div className="flex items-center gap-[8px]">
              <div className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,.14)' }}>
                <MapPin className="w-[11px] h-[11px]" stroke="#22C55E" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] text-white truncate">{trip.from}</div>
                <div className="font-data text-[9px] truncate" style={{ color: 'var(--wc-t3)' }}>{trip.fromSub}</div>
              </div>
            </div>
            <div className="flex items-center gap-[8px]">
              <div className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wc-yd)' }}>
                <MapPin className="w-[11px] h-[11px]" stroke="#F5C400" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] text-white truncate">{trip.to}</div>
                <div className="font-data text-[9px] truncate" style={{ color: 'var(--wc-t3)' }}>{trip.toSub}</div>
              </div>
            </div>
            <div className="flex items-center gap-[6px] mt-[2px] flex-wrap">
              <span className="font-data text-[10px]" style={{ color: 'var(--wc-t3)' }}>{trip.date}</span>
              <span className="w-[3px] h-[3px] rounded-full flex-shrink-0" style={{ background: 'var(--wc-t3)' }} />
              <span className="font-heading font-bold text-[13px]" style={{ color: 'var(--wc-y)' }}>{trip.km} km</span>
              <span className="w-[3px] h-[3px] rounded-full flex-shrink-0" style={{ background: 'var(--wc-t3)' }} />
              <span className="font-data text-[10px]" style={{ color: 'var(--wc-t3)' }}>{trip.duration}</span>
            </div>
            <div className="font-heading font-extrabold text-[18px]" style={{ color: 'var(--wc-gr)' }}>+${(trip.km * RATE).toFixed(2)}</div>
          </div>
          <div className="w-[150px] aspect-square flex-shrink-0 self-center rounded-[14px] overflow-hidden">
            <ClassifyMiniMap from={`${trip.from}, ${trip.fromSub}`} to={`${trip.to}, ${trip.toSub}`} />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-[14px] flex flex-col gap-[7px] overflow-y-auto pb-[6px] scrollbar-hide">
        <div className="grid grid-cols-2 gap-[7px] flex-1 content-stretch">
          {CATEGORIES.map((cat, i) => {
            const isArmed = armed === i;
            const Icon = iconMap[cat.icon] || Wrench;
            return (
              <button
                key={i}
                className="rounded-[13px] p-[10px_10px] cursor-pointer transition-all flex flex-col items-center justify-center gap-[4px] text-center"
                style={{
                  background: isArmed ? 'var(--wc-y)' : 'rgba(255,255,255,.04)',
                  border: isArmed ? '1.5px solid var(--wc-y)' : '1.5px solid var(--wc-border)',
                  transform: isArmed ? 'scale(1.03)' : 'none',
                  boxShadow: isArmed ? '0 0 22px rgba(245,196,0,.3)' : 'none',
                }}
                onClick={() => handleArm(i)}
                data-testid={`classify-cat-${i}`}
              >
                {isArmed ? (
                  <Check className="w-6 h-6" style={{ color: '#000' }} />
                ) : (
                  <Icon className="w-6 h-6" style={{ color: 'var(--wc-t2)' }} />
                )}
                <span className="font-heading font-bold text-[13px] uppercase tracking-[.03em] leading-[1.2]" style={{ color: isArmed ? '#000' : 'var(--wc-t2)' }}>
                  {isArmed ? 'Confirm' : cat.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-[7px] items-center rounded-[13px] p-[10px_12px] flex-shrink-0" style={{ background: 'rgba(255,255,255,.03)', border: '1.5px dashed rgba(255,255,255,.1)' }}>
          <input
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-white"
            style={{ caretColor: 'var(--wc-y)' }}
            placeholder="+ Add your own..."
            value={customText}
            onChange={e => { setCustomText(e.target.value); setCustomArmed(false); }}
            data-testid="input-custom-purpose"
          />
          <button
            className="rounded-lg px-[10px] py-[5px] font-heading font-bold text-[12px] uppercase tracking-[.04em] cursor-pointer whitespace-nowrap transition-all"
            style={{ background: 'rgba(245,196,0,.1)', border: '1px solid rgba(245,196,0,.3)', color: 'var(--wc-y)' }}
            onClick={handleCustom}
            data-testid="button-use-custom"
          >
            {customArmed ? '\u2713 Confirm' : 'Use'}
          </button>
        </div>
      </div>

      <BottomNav activeOverride="classify" />
    </div>
  );
}
