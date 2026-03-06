import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { type Trip, getTripOdoEnd } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import { AddressInput } from './address-input';
import { MapPin, Check, Calendar, Clock, ArrowLeft, ArrowRight, Gauge, Navigation, Square, Car, History, Crosshair, Pause, Play } from 'lucide-react';

let nextManualId = 8000;

type InputMode = 'choose' | 'existing' | 'live';

function ChooseScreen({ onSelect }: { onSelect: (mode: 'existing' | 'live') => void }) {
  const { dispatch } = useApp();
  return (
    <div className="flex flex-col h-full" data-testid="input-choose-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="button-back-choose"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">Add Trip</span>
      </div>

      <div className="flex-1 px-[18px] flex flex-col justify-center gap-[14px] pb-[40px]">
        <button
          className="rounded-[16px] p-[22px_20px] cursor-pointer transition-all text-left"
          style={{ background: 'rgba(245,196,0,.06)', border: '2px solid rgba(245,196,0,.25)' }}
          onClick={() => onSelect('live')}
          data-testid="choose-start-new"
        >
          <div className="flex items-center gap-[14px]">
            <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,196,0,.12)', border: '1px solid rgba(245,196,0,.3)' }}>
              <Navigation className="w-[24px] h-[24px]" style={{ color: 'var(--wc-y)' }} />
            </div>
            <div>
              <div className="font-heading font-black text-[18px] uppercase tracking-[.04em] leading-none mb-[5px]" style={{ color: 'var(--wc-y)' }}>Start New Trip</div>
              <div className="text-[12px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>Use current location or enter start point. Live map, real-time distance and timer.</div>
            </div>
          </div>
        </button>

        <button
          className="rounded-[16px] p-[22px_20px] cursor-pointer transition-all text-left"
          style={{ background: 'rgba(255,255,255,.03)', border: '2px solid var(--wc-border)' }}
          onClick={() => onSelect('existing')}
          data-testid="choose-add-existing"
        >
          <div className="flex items-center gap-[14px]">
            <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}>
              <History className="w-[24px] h-[24px]" style={{ color: 'var(--wc-t2)' }} />
            </div>
            <div>
              <div className="font-heading font-black text-[18px] uppercase tracking-[.04em] leading-none mb-[5px] text-white">Add Existing Trip</div>
              <div className="text-[12px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>Log a trip you already made. Fill in the details and send it to sort.</div>
            </div>
          </div>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function LiveTripScreen({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp();
  const [startAddress, setStartAddress] = useState('');
  const [phase, setPhase] = useState<'setup' | 'driving' | 'paused' | 'ended'>('setup');
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [pausedElapsed, setPausedElapsed] = useState(0);
  const [endAddress, setEndAddress] = useState('');
  const [tripKm, setTripKm] = useState(0);
  const [tripDuration, setTripDuration] = useState('');
  const [saved, setSaved] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pathRef = useRef<{ lat: number; lng: number }[]>([]);
  const polylineRef = useRef<any>(null);
  const liveKmRef = useRef(0);

  useEffect(() => {
    if (phase !== 'driving') return;
    timerRef.current = setInterval(() => {
      setElapsed(pausedElapsed + Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, startTime, pausedElapsed]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const fmtElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const initMap = useCallback((lat: number, lng: number) => {
    if (!mapRef.current || !window._gmapsLoaded) return;
    const pos = { lat, lng };
    const map = new window.google.maps.Map(mapRef.current, {
      center: pos,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a9a' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a3e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#333348' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e1a' }] },
      ],
    });
    mapInstanceRef.current = map;
    const marker = new window.google.maps.Marker({
      position: pos,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#F5C400',
        fillOpacity: 1,
        strokeColor: '#000',
        strokeWeight: 2,
      },
    });
    markerRef.current = marker;

    const polyline = new window.google.maps.Polyline({
      path: [pos],
      geodesic: true,
      strokeColor: '#F5C400',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map,
    });
    polylineRef.current = polyline;
  }, []);

  const startGeoTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (pathRef.current.length > 0) {
          const last = pathRef.current[pathRef.current.length - 1];
          const segKm = haversineKm(last, newPos);
          if (segKm > 0.005) {
            liveKmRef.current += segKm;
            setTripKm(Math.round(liveKmRef.current * 10) / 10);
            pathRef.current.push(newPos);
          }
        } else {
          pathRef.current.push(newPos);
        }

        if (markerRef.current) {
          markerRef.current.setPosition(newPos);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newPos);
        }
        if (polylineRef.current) {
          polylineRef.current.setPath(pathRef.current);
        }
      },
      (err) => {
        if (err.code === 1) {
          stopGeoTracking();
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, []);

  const stopGeoTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (window._gmapsLoaded) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
            if (status === 'OK' && results?.[0]) {
              setStartAddress(results[0].formatted_address);
              startCoordsRef.current = { lat, lng };
              setGeoStatus('done');
            } else {
              setStartAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
              startCoordsRef.current = { lat, lng };
              setGeoStatus('done');
            }
          });
        } else {
          setStartAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          startCoordsRef.current = { lat, lng };
          setGeoStatus('done');
        }
      },
      () => {
        setGeoStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCommence = () => {
    if (!startAddress) return;
    setPhase('driving');
    setStartTime(Date.now());
    setPausedElapsed(0);
    pathRef.current = [];
    liveKmRef.current = 0;

    if (startCoordsRef.current) {
      pathRef.current.push(startCoordsRef.current);
      if (window._gmapsLoaded) {
        initMap(startCoordsRef.current.lat, startCoordsRef.current.lng);
      }
      startGeoTracking();
    } else if (window._gmapsLoaded) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: startAddress, region: 'au' }, (results: any, status: string) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          startCoordsRef.current = { lat, lng };
          pathRef.current.push({ lat, lng });
          initMap(lat, lng);
        } else {
          initMap(-33.8688, 151.2093);
        }
        startGeoTracking();
      });
    } else {
      setMapError(true);
      startGeoTracking();
    }
  };

  const handlePause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPausedElapsed(elapsed);
    stopGeoTracking();
    setPhase('paused');
  };

  const handleResume = () => {
    setStartTime(Date.now());
    setPhase('driving');
    startGeoTracking();
  };

  const handleEndTrip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopGeoTracking();
    const totalSec = phase === 'paused' ? pausedElapsed : elapsed;
    const mins = Math.round(totalSec / 60);
    const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins || 1} min`;
    setTripDuration(durStr);

    if (liveKmRef.current > 0) {
      setTripKm(Math.round(liveKmRef.current * 10) / 10);
    }

    if (window._gmapsLoaded && pathRef.current.length > 0) {
      const lastPos = pathRef.current[pathRef.current.length - 1];
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: lastPos }, (results: any, status: string) => {
        if (status === 'OK' && results?.[0]) {
          setEndAddress(results[0].formatted_address);
        }
      });
    }

    setPhase('ended');
  };

  const canSendToSort = startAddress.length > 2 && endAddress.length > 2 && tripKm > 0;

  const handleSendToSort = () => {
    if (!startAddress || !endAddress || tripKm <= 0) return;
    const startD = new Date(startTime || Date.now());
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${dayNames[startD.getDay()]}, ${startD.getDate()} ${monthNames[startD.getMonth()]}`;
    const h = startD.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const timeStr = `${h12}:${String(startD.getMinutes()).padStart(2, '0')} ${ampm}`;
    const fromParts = startAddress.split(',');
    const toParts = endAddress.split(',');

    const trip: Trip = {
      id: nextManualId++,
      date: dateStr,
      day: startD.getDate(),
      month: startD.getMonth(),
      year: startD.getFullYear(),
      time: timeStr,
      duration: tripDuration,
      km: tripKm,
      from: fromParts[0].trim(),
      fromSub: fromParts.slice(1).join(',').trim(),
      to: toParts[0].trim(),
      toSub: toParts.slice(1).join(',').trim(),
      type: null,
      verified: false,
      photo: false,
      odoReading: null,
      odoStartReading: null,
      purposeLabel: null,
      purposeIndex: null,
      stops: [],
      notes: '',
    };

    dispatch({ type: 'ADD_TRIP', trip });
    dispatch({ type: 'ADD_LOG', desc: `Live trip ended: ${trip.from} → ${trip.to} (${tripKm} km) — sent to sort`, hasPhoto: false });
    setSaved(true);
    setTimeout(() => {
      dispatch({ type: 'GO_SCREEN', screen: 'sort' });
    }, 1200);
  };

  if (phase === 'setup') {
    return (
      <div className="flex flex-col h-full" data-testid="live-setup-screen">
        <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
          <button
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
            onClick={onBack}
            data-testid="button-back-live"
          >
            <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
          </button>
          <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">Start Trip</span>
        </div>

        <div className="flex-1 px-[18px] flex flex-col justify-center pb-[40px]">
          <div className="rounded-[16px] p-[20px] mb-[16px]" style={{ background: 'rgba(245,196,0,.04)', border: '1px solid rgba(245,196,0,.15)' }}>
            <div className="flex items-center gap-[10px] mb-[14px]">
              <Navigation className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-heading font-bold text-[14px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>Where are you starting?</span>
            </div>

            <button
              className="w-full rounded-[10px] p-[11px_14px] mb-[10px] flex items-center gap-[10px] cursor-pointer transition-all"
              style={{
                background: geoStatus === 'done' ? 'rgba(34,197,94,.08)' : 'rgba(255,255,255,.05)',
                border: geoStatus === 'done' ? '1.5px solid rgba(34,197,94,.3)' : '1.5px solid var(--wc-border)',
              }}
              onClick={handleUseCurrentLocation}
              disabled={geoStatus === 'loading'}
              data-testid="button-use-location"
            >
              <Crosshair className="w-[16px] h-[16px] flex-shrink-0" style={{ color: geoStatus === 'done' ? 'var(--wc-gr)' : 'var(--wc-y)' }} />
              <span className="text-[12px] font-bold" style={{ color: geoStatus === 'done' ? 'var(--wc-gr)' : 'var(--wc-t2)' }}>
                {geoStatus === 'loading' ? 'Getting location...' : geoStatus === 'done' ? 'Location found' : geoStatus === 'error' ? 'Location unavailable' : 'Use Current Location'}
              </span>
              {geoStatus === 'done' && <Check className="w-[14px] h-[14px] ml-auto" style={{ color: 'var(--wc-gr)' }} />}
            </button>

            {geoStatus === 'error' && (
              <div className="text-[10px] mb-[8px] px-[4px]" style={{ color: 'var(--wc-re)' }}>
                Could not get location. Please enable location permissions or enter an address below.
              </div>
            )}

            <div className="flex items-center gap-[8px] mb-[10px]">
              <div className="flex-1 h-[1px]" style={{ background: 'var(--wc-border)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.15em]" style={{ color: 'var(--wc-t3)' }}>or enter address</span>
              <div className="flex-1 h-[1px]" style={{ background: 'var(--wc-border)' }} />
            </div>

            <AddressInput
              className="w-full rounded-[10px] p-[12px_14px] text-[13px] text-white outline-none transition-all"
              style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--wc-border)' }}
              value={startAddress}
              onChange={(v) => { setStartAddress(v); if (geoStatus === 'done') setGeoStatus('idle'); startCoordsRef.current = null; }}
              placeholder="Enter starting address"
              data-testid="live-start-address"
            />
            <div className="text-[10px] mt-[8px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
              We'll track distance and time in real-time on the map.
            </div>
          </div>

          <button
            className="w-full rounded-[14px] py-[16px] font-heading font-black text-[18px] tracking-[.07em] uppercase flex items-center justify-center gap-[8px] transition-all"
            style={{
              background: startAddress.length > 3 ? 'var(--wc-y)' : 'rgba(245,196,0,.2)',
              color: startAddress.length > 3 ? 'black' : 'rgba(0,0,0,.4)',
              cursor: startAddress.length > 3 ? 'pointer' : 'not-allowed',
            }}
            onClick={handleCommence}
            disabled={startAddress.length <= 3}
            data-testid="button-commence"
          >
            <Car className="w-[20px] h-[20px]" strokeWidth={2.5} />
            Commence
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  if (phase === 'driving' || phase === 'paused') {
    const isPaused = phase === 'paused';
    return (
      <div className="flex flex-col h-full" data-testid="live-driving-screen">
        <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
          <div className="w-[8px] h-[8px] rounded-full" style={{ background: isPaused ? 'var(--wc-am)' : 'var(--wc-gr)', animation: isPaused ? 'none' : 'pulse 2s infinite' }} />
          <span className="font-heading font-extrabold text-[16px] uppercase tracking-[.04em]" style={{ color: isPaused ? 'var(--wc-am)' : 'var(--wc-gr)' }}>
            {isPaused ? 'Paused' : 'Trip In Progress'}
          </span>
          <span className="ml-auto font-data text-[14px] font-bold" style={{ color: 'var(--wc-y)' }}>{fmtElapsed(elapsed)}</span>
        </div>

        <div className="px-[14px] pb-[6px] flex-shrink-0">
          <div className="rounded-[10px] p-[8px_12px] flex items-center justify-between" style={{ background: 'rgba(245,196,0,.06)', border: '1px solid rgba(245,196,0,.15)' }}>
            <div className="flex items-center gap-[8px]">
              <MapPin className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
              <span className="text-[11px] truncate" style={{ color: 'var(--wc-t2)' }}>{startAddress.length > 30 ? startAddress.slice(0, 28) + '…' : startAddress}</span>
            </div>
            <div className="flex items-center gap-[4px] ml-[8px] flex-shrink-0">
              <span className="font-data text-[14px] font-bold" style={{ color: 'var(--wc-y)' }}>{tripKm.toFixed(1)}</span>
              <span className="font-data text-[9px] uppercase" style={{ color: 'var(--wc-t3)' }}>km</span>
            </div>
          </div>
        </div>

        <div className="flex-1 mx-[14px] rounded-[14px] overflow-hidden relative" style={{ border: '1px solid var(--wc-border)', background: '#1a1a2e', minHeight: '200px' }}>
          <div ref={mapRef} className="w-full h-full" data-testid="live-map" />
          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[8px]" style={{ background: '#1a1a2e' }}>
              <Navigation className="w-[28px] h-[28px]" style={{ color: 'var(--wc-t3)' }} />
              <span className="font-heading text-[12px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>Map unavailable</span>
              <span className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>Trip still recording — {tripKm.toFixed(1)} km</span>
            </div>
          )}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.5)' }}>
              <div className="rounded-[12px] p-[16px_24px] text-center" style={{ background: 'rgba(245,158,11,.1)', border: '1.5px solid rgba(245,158,11,.3)' }}>
                <Pause className="w-[24px] h-[24px] mx-auto mb-[6px]" style={{ color: 'var(--wc-am)' }} />
                <div className="font-heading font-bold text-[14px] uppercase" style={{ color: 'var(--wc-am)' }}>Paused</div>
              </div>
            </div>
          )}
        </div>

        <div className="px-[14px] pt-[10px] pb-[6px] flex flex-col gap-[8px] flex-shrink-0">
          <div className="flex gap-[8px]">
            <button
              className="flex-1 rounded-[14px] py-[14px] font-heading font-black text-[15px] tracking-[.05em] uppercase flex items-center justify-center gap-[6px] transition-all cursor-pointer"
              style={{
                background: isPaused ? 'rgba(34,197,94,.12)' : 'rgba(245,158,11,.1)',
                border: isPaused ? '2px solid rgba(34,197,94,.3)' : '2px solid rgba(245,158,11,.3)',
                color: isPaused ? 'var(--wc-gr)' : 'var(--wc-am)',
              }}
              onClick={isPaused ? handleResume : handlePause}
              data-testid={isPaused ? 'button-resume' : 'button-pause'}
            >
              {isPaused ? <Play className="w-[16px] h-[16px]" strokeWidth={2.5} /> : <Pause className="w-[16px] h-[16px]" strokeWidth={2.5} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              className="flex-1 rounded-[14px] py-[14px] font-heading font-black text-[15px] tracking-[.05em] uppercase flex items-center justify-center gap-[6px] transition-all cursor-pointer"
              style={{
                background: 'var(--wc-re)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(239,68,68,.25)',
              }}
              onClick={handleEndTrip}
              data-testid="button-end-trip"
            >
              <Square className="w-[14px] h-[14px]" fill="currentColor" strokeWidth={0} />
              End Trip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="live-ended-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">Trip Complete</span>
      </div>

      <div className="flex-1 px-[18px] pt-[6px] overflow-y-auto scrollbar-thin">
        <div className="rounded-[14px] p-[16px] mb-[12px]" style={{ background: 'rgba(34,197,94,.05)', border: '1.5px solid rgba(34,197,94,.2)' }}>
          <div className="flex items-center gap-[8px] mb-[10px]">
            <Check className="w-[16px] h-[16px]" style={{ color: 'var(--wc-gr)' }} />
            <span className="font-heading font-bold text-[14px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-gr)' }}>Trip Recorded</span>
          </div>
          <div className="flex flex-col gap-[6px] text-[12px]" style={{ color: 'var(--wc-t2)' }}>
            <div><strong className="text-white">From:</strong> {startAddress}</div>
            {endAddress && <div><strong className="text-white">To:</strong> {endAddress}</div>}
            <div><strong className="text-white">Duration:</strong> {tripDuration}</div>
            <div><strong className="text-white">Distance:</strong> <span className="font-data font-bold" style={{ color: 'var(--wc-y)' }}>{tripKm.toFixed(1)} km</span></div>
          </div>
        </div>

        {!endAddress && (
          <div className="mb-[10px]">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Destination</label>
            <AddressInput
              className="w-full rounded-[10px] p-[10px_12px] text-[12px] text-white outline-none transition-all"
              style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--wc-border)' }}
              value={endAddress}
              onChange={setEndAddress}
              placeholder="Enter destination"
              data-testid="live-end-address"
            />
          </div>
        )}

        {tripKm === 0 && (
          <div className="rounded-[10px] p-[10px_14px] mb-[10px]" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-am)' }}>Enter distance manually</label>
            <input
              type="number"
              step="0.1"
              className="w-full rounded-lg p-[8px_11px] text-[13px] text-white outline-none font-data"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
              value={tripKm || ''}
              onChange={e => setTripKm(parseFloat(e.target.value) || 0)}
              placeholder="0.0 km"
              data-testid="live-manual-km"
            />
          </div>
        )}

        {saved ? (
          <div
            className="w-full rounded-[14px] py-[15px] font-heading font-extrabold text-[16px] tracking-[.06em] uppercase flex items-center justify-center gap-2 transition-all"
            style={{ background: 'rgba(34,197,94,.12)', border: '2px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}
            data-testid="live-saved-confirm"
          >
            <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Sent to Sort
          </div>
        ) : (
          <button
            className="w-full rounded-[14px] py-[15px] font-heading font-black text-[17px] tracking-[.07em] uppercase text-black transition-all flex items-center justify-center gap-[8px]"
            style={{
              background: canSendToSort ? 'var(--wc-y)' : 'rgba(245,196,0,.2)',
              opacity: canSendToSort ? 1 : 0.5,
              boxShadow: canSendToSort ? '0 4px 20px rgba(245,196,0,.25)' : 'none',
              cursor: canSendToSort ? 'pointer' : 'not-allowed',
            }}
            onClick={handleSendToSort}
            disabled={!canSendToSort}
            data-testid="button-send-to-sort"
          >
            <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Send to Sort
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function ExistingTripScreen({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [km, setKm] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [odoStart, setOdoStart] = useState('');

  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [routeDur, setRouteDur] = useState<string | null>(null);
  const [calcStatus, setCalcStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calcRoute = useCallback(() => {
    if (routeTimerRef.current) clearTimeout(routeTimerRef.current);
    routeTimerRef.current = setTimeout(() => {
      if (!window._gmapsLoaded || !from || !to) return;
      const validStops = stops.filter(s => s.length > 3);
      const waypoints = validStops.map(s => ({ location: s, stopover: true }));
      setCalcStatus('loading');
      const ds = new window.google.maps.DirectionsService();
      ds.route({
        origin: from,
        destination: to,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'au',
      }, (result: any, status: string) => {
        if (status === 'OK' && result?.routes?.[0]) {
          const route = result.routes[0];
          let totalM = 0;
          let totalSec = 0;
          route.legs.forEach((leg: any) => {
            totalM += leg.distance?.value || 0;
            totalSec += leg.duration?.value || 0;
          });
          const calcKm = totalM / 1000;
          const mins = Math.round(totalSec / 60);
          const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
          setRouteKm(calcKm);
          setRouteDur(durStr);
          setKm(calcKm.toFixed(1));
          setDuration(durStr);
          setCalcStatus('done');
        } else {
          setCalcStatus('error');
        }
      });
    }, 600);
  }, [from, to, stops]);

  const handleSave = () => {
    if (!from || !to) return;
    const parsedKm = parseFloat(km) || 0;
    const d = new Date(date + 'T00:00:00');
    const fromParts = from.split(',');
    const toParts = to.split(',');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;

    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const timeStr = `${h12}:${mStr} ${ampm}`;

    const trip: Trip = {
      id: nextManualId++,
      date: dateStr,
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      time: timeStr,
      duration: duration || '',
      km: parsedKm,
      from: fromParts[0].trim(),
      fromSub: fromParts.slice(1).join(',').trim(),
      to: toParts[0].trim(),
      toSub: toParts.slice(1).join(',').trim(),
      type: null,
      verified: false,
      photo: false,
      odoReading: odoStart ? Math.round(parseFloat(odoStart) + parsedKm) : null,
      odoStartReading: odoStart ? Math.round(parseFloat(odoStart)) : null,
      purposeLabel: null,
      purposeIndex: null,
      stops: stops.filter(s => s.length > 3),
      notes: notes || '',
    };

    dispatch({ type: 'ADD_TRIP', trip });
    dispatch({ type: 'ADD_LOG', desc: `Existing trip added: ${trip.from} → ${trip.to} (${parsedKm} km) — sent to sort`, hasPhoto: false });
    setSaved(true);
    setTimeout(() => {
      dispatch({ type: 'GO_SCREEN', screen: 'sort' });
    }, 1200);
  };

  const canSave = from.length > 2 && to.length > 2;

  return (
    <div className="flex flex-col h-full" data-testid="existing-trip-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-existing"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">Add Existing</span>
        <span className="ml-auto font-data text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>Sends to sort</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[4px] pb-[10px]">
        <div className="mb-[8px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>From</label>
          <AddressInput
            className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none transition-all"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={from}
            onChange={setFrom}
            placeholder="Start address"
            data-testid="input-from"
          />
        </div>

        {stops.map((s, i) => (
          <div key={i} className="flex items-center gap-[5px] mb-1">
            <AddressInput
              className="w-full rounded-[7px] p-[6px_9px] text-[12px] text-white outline-none"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)', flex: 1 }}
              placeholder={`Stop ${i + 1}`}
              value={s}
              onChange={v => { const n = [...stops]; n[i] = v; setStops(n); }}
            />
            <button className="rounded-[6px] p-[5px_7px] text-[11px] cursor-pointer" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--wc-re)' }} onClick={() => { const n = [...stops]; n.splice(i, 1); setStops(n); }}>X</button>
          </div>
        ))}

        <div className="flex gap-[5px] mb-[8px]">
          <button
            className="flex-1 rounded-[7px] p-[5px_8px] font-heading font-semibold text-[10px] uppercase tracking-[.04em] cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,.03)', border: '1px dashed var(--wc-border)', color: 'var(--wc-t2)' }}
            onClick={() => setStops([...stops, ''])}
            data-testid="input-add-stop"
          >
            + Stop
          </button>
          {from.length > 3 && to.length > 3 && (
            <button
              className="rounded-[7px] p-[5px_10px] font-heading font-semibold text-[10px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center gap-[4px]"
              style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.25)', color: 'var(--wc-y)' }}
              onClick={calcRoute}
              data-testid="input-calc-route"
            >
              <MapPin className="w-[10px] h-[10px]" />
              {calcStatus === 'loading' ? 'Calc...' : 'Calc Route'}
            </button>
          )}
        </div>

        <div className="mb-[8px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>To</label>
          <AddressInput
            className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none transition-all"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={to}
            onChange={setTo}
            placeholder="Destination address"
            data-testid="input-to"
          />
        </div>

        <div className="flex gap-[6px] mb-[8px]">
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Date</label>
            <div className="relative">
              <Calendar className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
              <input
                type="date"
                className="w-full rounded-lg p-[7px_8px_7px_24px] text-[11px] text-white outline-none"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)', colorScheme: 'dark' }}
                value={date}
                onChange={e => setDate(e.target.value)}
                data-testid="input-date"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Time</label>
            <div className="relative">
              <Clock className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
              <input
                type="time"
                className="w-full rounded-lg p-[7px_8px_7px_24px] text-[11px] text-white outline-none"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)', colorScheme: 'dark' }}
                value={time}
                onChange={e => setTime(e.target.value)}
                data-testid="input-time"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-[6px] mb-[8px]">
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Distance (km)</label>
            <input
              type="number"
              step="0.1"
              className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
              value={km}
              onChange={e => setKm(e.target.value)}
              placeholder="0.0"
              data-testid="input-km"
            />
          </div>
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Duration</label>
            <input
              className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="e.g. 25 min"
              data-testid="input-duration"
            />
          </div>
        </div>

        <div className="rounded-[10px] p-[9px_12px] mb-[8px]" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--wc-border)' }}>
          <div className="flex items-center gap-[6px] mb-[6px]">
            <Gauge className="w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
            <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Odometer (optional)</span>
          </div>
          <div className="flex gap-[6px] items-end">
            <div className="flex-1">
              <label className="font-data text-[7px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Start Reading</label>
              <input
                type="number"
                className="w-full rounded-lg p-[7px_10px] text-[12px] text-white outline-none font-data"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
                value={odoStart}
                onChange={e => setOdoStart(e.target.value)}
                placeholder="e.g. 84280"
                data-testid="input-odo-start"
              />
            </div>
            <div className="flex-1">
              <label className="font-data text-[7px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>End Reading</label>
              <div
                className="w-full rounded-lg p-[7px_10px] text-[12px] font-data"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--wc-border)', color: odoStart && parseFloat(km) > 0 ? 'var(--wc-y)' : 'var(--wc-t3)' }}
                data-testid="input-odo-end"
              >
                {odoStart && parseFloat(km) > 0 ? Math.round(parseFloat(odoStart) + parseFloat(km)).toLocaleString() : '\u2014'}
              </div>
            </div>
          </div>
          {state.trips.length > 0 && (
            <button
              className="mt-[6px] rounded-[6px] p-[5px_10px] font-heading font-semibold text-[10px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center gap-[4px]"
              style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.25)', color: 'var(--wc-y)' }}
              onClick={() => {
                const lastOdo = getTripOdoEnd(state.trips, state.trips.length - 1, state.baseOdo);
                setOdoStart(Math.round(lastOdo).toString());
              }}
              data-testid="input-use-last-odo"
            >
              <Gauge className="w-[10px] h-[10px]" />
              Use last reading ({Math.round(getTripOdoEnd(state.trips, state.trips.length - 1, state.baseOdo)).toLocaleString()} km)
            </button>
          )}
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Notes</label>
          <textarea
            className="w-full rounded-lg p-[8px_11px] text-[11px] text-white outline-none resize-none h-[40px]"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes about this trip"
            data-testid="input-notes"
          />
        </div>

        {calcStatus === 'done' && routeKm !== null && (
          <div className="rounded-[8px] p-[7px_10px] mb-[8px] flex items-center gap-[5px]" style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)' }}>
            <Check className="w-[10px] h-[10px]" style={{ color: 'var(--wc-gr)' }} />
            <span className="text-[10px]" style={{ color: 'var(--wc-gr)' }}>Route: {routeKm.toFixed(1)} km{routeDur ? `, ${routeDur}` : ''}</span>
          </div>
        )}
        {calcStatus === 'error' && (
          <div className="rounded-[8px] p-[7px_10px] mb-[8px] text-[10px]" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--wc-re)' }}>
            Could not calculate route. Check addresses.
          </div>
        )}

        {saved ? (
          <div
            className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase flex items-center justify-center gap-2 transition-all mb-[6px]"
            style={{ background: 'rgba(34,197,94,.12)', border: '2px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}
            data-testid="input-saved-confirm"
          >
            <Check className="w-[16px] h-[16px]" strokeWidth={2.5} />
            Sent to Sort
          </div>
        ) : (
          <button
            className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase text-black cursor-pointer transition-all mb-[6px] flex items-center justify-center gap-[6px]"
            style={{
              background: canSave ? 'var(--wc-y)' : 'rgba(245,196,0,.2)',
              opacity: canSave ? 1 : 0.5,
              boxShadow: canSave ? '0 4px 20px rgba(245,196,0,.25)' : 'none',
            }}
            onClick={handleSave}
            disabled={!canSave}
            data-testid="input-save-trip"
          >
            <ArrowRight className="w-[16px] h-[16px]" strokeWidth={2.5} />
            Send to Sort
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

export function InputScreen() {
  const [mode, setMode] = useState<InputMode>('choose');

  if (mode === 'existing') return <ExistingTripScreen onBack={() => setMode('choose')} />;
  if (mode === 'live') return <LiveTripScreen onBack={() => setMode('choose')} />;
  return <ChooseScreen onSelect={setMode} />;
}
