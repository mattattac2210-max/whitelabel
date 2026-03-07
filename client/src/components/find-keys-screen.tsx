import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, Key, MapPin, Clock, Navigation, Volume2, VolumeX } from 'lucide-react';

interface KeyLocation {
  lat: number;
  lng: number;
  address: string;
  timestamp: number;
}

function getLastKeyLocation(): KeyLocation | null {
  try {
    const raw = localStorage.getItem('wc_key_location');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveKeyLocation(loc: KeyLocation) {
  localStorage.setItem('wc_key_location', JSON.stringify(loc));
}

function getKeyHistory(): KeyLocation[] {
  try {
    const raw = localStorage.getItem('wc_key_history');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addKeyHistory(loc: KeyLocation) {
  const history = getKeyHistory();
  history.unshift(loc);
  localStorage.setItem('wc_key_history', JSON.stringify(history.slice(0, 20)));
}

export function FindKeysScreen() {
  const { dispatch } = useApp();
  const [lastLocation, setLastLocation] = useState<KeyLocation | null>(getLastKeyLocation);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [history] = useState<KeyLocation[]>(getKeyHistory);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateLocation = () => {
    if (!navigator.geolocation) return;
    setUpdating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentPos({ lat: latitude, lng: longitude });

        const geocoder = (window as any).google?.maps?.Geocoder;
        if (geocoder) {
          const gc = new geocoder();
          gc.geocode({ location: { lat: latitude, lng: longitude } }, (results: any, status: string) => {
            const address = (status === 'OK' && results?.[0]) ? results[0].formatted_address : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            const loc: KeyLocation = { lat: latitude, lng: longitude, address, timestamp: Date.now() };
            setLastLocation(loc);
            saveKeyLocation(loc);
            addKeyHistory(loc);
            setUpdating(false);
          });
        } else {
          const loc: KeyLocation = { lat: latitude, lng: longitude, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, timestamp: Date.now() };
          setLastLocation(loc);
          saveKeyLocation(loc);
          addKeyHistory(loc);
          setUpdating(false);
        }
      },
      () => setUpdating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleRing = () => {
    if (ringing) {
      setRinging(false);
      return;
    }
    setRinging(true);
    if ('vibrate' in navigator) {
      const pattern = [200, 100, 200, 100, 200, 100, 500, 200, 200, 100, 200, 100, 200];
      navigator.vibrate(pattern);
    }
    setTimeout(() => setRinging(false), 5000);
  };

  const timeSince = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full" data-testid="find-keys-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="button-back-find-keys"
        >
          <ArrowLeft className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[22px] uppercase tracking-[.04em] text-white">Find My Keys</span>
        <Key className="ml-auto w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
      </div>

      <div className="flex-1 px-[14px] pb-1 flex flex-col gap-[8px] overflow-y-auto scrollbar-thin">
        <div className="rounded-[16px] p-[20px] text-center" style={{ background: 'rgba(245,196,0,.04)', border: '1.5px solid rgba(245,196,0,.2)' }}>
          <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-[14px]" style={{ background: 'rgba(245,196,0,.1)', border: '2px solid rgba(245,196,0,.3)' }}>
            <Key className="w-[34px] h-[34px]" style={{ color: 'var(--wc-y)' }} />
          </div>
          {lastLocation ? (
            <>
              <div className="font-heading font-bold text-[14px] uppercase tracking-[.04em] mb-[4px]" style={{ color: 'var(--wc-y)' }}>Last Known Location</div>
              <div className="text-[15px] text-white mb-[4px]">{lastLocation.address}</div>
              <div className="flex items-center justify-center gap-[6px] text-[12px]" style={{ color: 'var(--wc-t3)' }}>
                <Clock className="w-[12px] h-[12px]" />
                {timeSince(lastLocation.timestamp)}
              </div>
            </>
          ) : (
            <>
              <div className="font-heading font-bold text-[14px] uppercase tracking-[.04em] mb-[4px]" style={{ color: 'var(--wc-t3)' }}>No Location Saved</div>
              <div className="text-[13px]" style={{ color: 'var(--wc-t3)' }}>Tap "Mark Location" to save where your keys are right now.</div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-[8px]">
          <button
            className="rounded-[14px] p-[16px] flex flex-col items-center gap-[8px] cursor-pointer transition-all active:scale-[.97]"
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,196,0,.3)' }}
            onClick={updateLocation}
            data-testid="button-mark-location"
          >
            {updating ? (
              <div className="w-[28px] h-[28px] border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--wc-y)', borderTopColor: 'transparent' }} />
            ) : (
              <MapPin className="w-[28px] h-[28px]" style={{ color: 'var(--wc-y)' }} />
            )}
            <div className="font-heading font-bold text-[14px] uppercase" style={{ color: 'var(--wc-y)' }}>
              {updating ? 'Locating...' : 'Mark Location'}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>Save current spot</div>
          </button>

          <button
            className="rounded-[14px] p-[16px] flex flex-col items-center gap-[8px] cursor-pointer transition-all active:scale-[.97]"
            style={{ background: ringing ? 'rgba(245,196,0,.12)' : 'var(--wc-card)', border: ringing ? '1.5px solid rgba(245,196,0,.5)' : '1.5px solid var(--wc-border)' }}
            onClick={toggleRing}
            data-testid="button-ring-keys"
          >
            {ringing ? (
              <VolumeX className="w-[28px] h-[28px] animate-pulse" style={{ color: 'var(--wc-y)' }} />
            ) : (
              <Volume2 className="w-[28px] h-[28px]" style={{ color: 'var(--wc-t2)' }} />
            )}
            <div className="font-heading font-bold text-[14px] uppercase" style={{ color: ringing ? 'var(--wc-y)' : 'var(--wc-t2)' }}>
              {ringing ? 'Ringing...' : 'Ring Keys'}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>Vibrate to find</div>
          </button>
        </div>

        {lastLocation && (
          <button
            className="w-full rounded-[14px] p-[14px] flex items-center gap-[12px] cursor-pointer transition-all active:scale-[.98]"
            style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.25)' }}
            onClick={() => openInMaps(lastLocation.lat, lastLocation.lng)}
            data-testid="button-open-maps"
          >
            <Navigation className="w-[22px] h-[22px]" style={{ color: 'var(--wc-gr)' }} />
            <div className="flex-1">
              <div className="font-heading font-bold text-[14px] uppercase" style={{ color: 'var(--wc-gr)' }}>Navigate to Keys</div>
              <div className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>Open in Google Maps</div>
            </div>
          </button>
        )}

        {history.length > 0 && (
          <div className="rounded-[12px] p-[14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="font-heading font-bold text-[13px] uppercase tracking-[.04em] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>Location History</div>
            {history.slice(0, 8).map((loc, i) => (
              <div
                key={i}
                className="flex items-center gap-[8px] py-[8px] cursor-pointer"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,.04)' : 'none' }}
                onClick={() => openInMaps(loc.lat, loc.lng)}
              >
                <Clock className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-white truncate">{loc.address}</div>
                  <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>{timeSince(loc.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
