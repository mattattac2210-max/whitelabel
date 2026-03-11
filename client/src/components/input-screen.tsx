import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { type Trip, getTripOdoEnd } from '@/lib/trip-data';
import { AddressInput, preloadGoogleMaps } from './address-input';
import { getTopRoutes, getTopPlaces, recordPlace, recordRoute, type SavedRoute, type SavedPlace } from '@/lib/place-memory';
import { MapPin, Check, Calendar, Clock, ArrowLeft, ArrowRight, Gauge, Navigation, Navigation2, Square, Car, History, Crosshair, Pause, Play, DollarSign, Fuel, StickyNote, Route, Briefcase } from 'lucide-react';

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#444' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#333' }] },
  { featureType: 'road', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#777' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#666' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e1a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const LIGHT_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#999999' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#bbbbbb' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#222222' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#dddddd' }] },
  { featureType: 'road', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#111111' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0e8ef' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#f4f4f4' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eef2e8' }] },
];

function getMapStyles() {
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES;
}

function calcBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const toRad = (d: number) => d * Math.PI / 180;
  const toDeg = (r: number) => r * 180 / Math.PI;
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function getMarkerColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return isDark
    ? { fill: '#FFFFFF', stroke: '#000000', polyline: '#FFFFFF' }
    : { fill: '#000000', stroke: '#FFFFFF', polyline: '#000000' };
}

function getEstimatedDeduction(km: number): number {
  return Math.round(km * 0.88 * 100) / 100;
}

function getEstimatedFuelCost(km: number): number {
  let fuelConsumption = 10;
  let fuelPrice = 1.95;
  try {
    const specs = JSON.parse(localStorage.getItem('wc_vehicle_specs') || '{}');
    const fc = parseFloat(specs.fuelConsumption);
    if (fc > 0) fuelConsumption = fc;
    const ft = (specs.fuelType || '').toLowerCase();
    if (ft === 'diesel') fuelPrice = 1.89;
    else if (ft === 'premium') fuelPrice = 2.15;
    else if (ft === 'lpg') fuelPrice = 1.05;
  } catch {}
  return Math.round(km / 100 * fuelConsumption * fuelPrice * 100) / 100;
}

let nextManualId = 8000;

type InputMode = 'choose' | 'existing' | 'live';

function ChooseScreen({ onSelect }: { onSelect: (mode: 'existing' | 'live') => void }) {
  const { dispatch } = useApp();
  useEffect(() => { preloadGoogleMaps(); }, []);
  return (
    <div className="flex flex-col h-full" data-testid="input-choose-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="button-back-choose"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Add Trip</span>
      </div>

      <div className="flex-1 px-[18px] flex flex-col justify-center gap-[14px] pb-[40px]">
        <button
          className="rounded-[20px] p-[28px_24px] cursor-pointer transition-all text-left"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '2px solid rgb(var(--wc-ink) / .25)' }}
          onClick={() => onSelect('live')}
          data-testid="choose-start-new"
        >
          <div className="flex items-center gap-[18px]">
            <div className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .12)', border: '1px solid rgb(var(--wc-ink) / .3)' }}>
              <Navigation className="w-[30px] h-[30px]" style={{ color: 'var(--wc-y)' }} />
            </div>
            <div>
              <div className="font-heading font-black text-[22px] uppercase tracking-[.04em] leading-none mb-[8px]" style={{ color: 'var(--wc-y)' }}>Start New Trip</div>
              <div className="text-[14px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>Use current location or enter start point. Live map, real-time distance and timer.</div>
            </div>
          </div>
        </button>

        <button
          className="rounded-[20px] p-[28px_24px] cursor-pointer transition-all text-left"
          style={{ background: 'rgb(var(--wc-ink) / .03)', border: '2px solid var(--wc-border)' }}
          onClick={() => onSelect('existing')}
          data-testid="choose-add-existing"
        >
          <div className="flex items-center gap-[18px]">
            <div className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}>
              <History className="w-[30px] h-[30px]" style={{ color: 'var(--wc-t2)' }} />
            </div>
            <div>
              <div className="font-heading font-black text-[22px] uppercase tracking-[.04em] leading-none mb-[8px]" style={{ color: 'var(--wc-text)' }}>Add Existing Trip</div>
              <div className="text-[14px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>Log a trip you already made. Fill in the details and send it to sort.</div>
            </div>
          </div>
        </button>
      </div>


    </div>
  );
}

function LiveTripScreen({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp();
  const [startAddress, setStartAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');
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
  const [tripNotes, setTripNotes] = useState('');
  const [tripStops, setTripStops] = useState<string[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tripType, setTripType] = useState<'business' | 'personal' | null>(null);
  const [navInfo, setNavInfo] = useState<{ nextStep: string; remainingKm: number; etaMins: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState<'start' | 'dest' | null>(null);
  const mapPickerRef = useRef<HTMLDivElement>(null);
  const mapPickerInstanceRef = useRef<any>(null);
  const mapPickerMarkerRef = useRef<any>(null);
  const pickedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const positionMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const directionsStepsRef = useRef<any[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const destCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pathRef = useRef<{ lat: number; lng: number }[]>([]);
  const polylineRef = useRef<any>(null);
  const snapTimerRef = useRef<number | null>(null);
  const snappedPathRef = useRef<any[]>([]);
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

  const createLabelMarker = useCallback((map: any, position: { lat: number; lng: number }, label: string, bgColor: string, textColor: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
      <path d="M20 51C20 51 38 33 38 20C38 10.1 29.9 2 20 2C10.1 2 2 10.1 2 20C2 33 20 51 20 51Z" fill="${bgColor}" stroke="${textColor}" stroke-width="2"/>
      <text x="20" y="25" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="18" fill="${textColor}">${label}</text>
    </svg>`;
    return new window.google.maps.Marker({
      position,
      map,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new window.google.maps.Size(40, 52),
        anchor: new window.google.maps.Point(20, 52),
      },
    });
  }, []);

  const snapToRoad = useCallback((pos: { lat: number; lng: number }, callback: (snapped: { lat: number; lng: number }) => void) => {
    if (!window._gmapsLoaded) { callback(pos); return; }
    const offset = 0.001;
    const nearby = { lat: pos.lat + offset, lng: pos.lng };
    const ds = new window.google.maps.DirectionsService();
    ds.route(
      { origin: pos, destination: nearby, travelMode: window.google.maps.TravelMode.DRIVING, region: 'au' },
      (result: any, status: string) => {
        if (status === 'OK' && result?.routes?.[0]?.legs?.[0]) {
          const loc = result.routes[0].legs[0].start_location;
          callback({ lat: loc.lat(), lng: loc.lng() });
        } else {
          callback(pos);
        }
      }
    );
  }, []);

  const initMap = useCallback((lat: number, lng: number) => {
    if (!mapRef.current || !window._gmapsLoaded) return;
    const rawPos = { lat, lng };
    const isDark = document.documentElement.classList.contains('dark');
    const map = new window.google.maps.Map(mapRef.current, {
      center: rawPos,
      zoom: 17,
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: 'greedy',
      styles: getMapStyles(),
    });
    mapInstanceRef.current = map;
    setMapLoaded(true);

    const markerBg = isDark ? '#FFFFFF' : '#000000';
    const markerText = isDark ? '#000000' : '#FFFFFF';
    const marker = createLabelMarker(map, rawPos, 'A', markerBg, markerText);
    markerRef.current = marker;

    const posMarker = new window.google.maps.Marker({
      position: rawPos,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: isDark ? '#FFFFFF' : '#000000',
        fillOpacity: 1,
        strokeColor: isDark ? '#000000' : '#FFFFFF',
        strokeWeight: 2.5,
      },
      zIndex: 10,
    });
    positionMarkerRef.current = posMarker;

    const polylineOutline = new window.google.maps.Polyline({
      path: [rawPos],
      geodesic: true,
      strokeColor: '#1a73e8',
      strokeOpacity: 0.35,
      strokeWeight: 8,
      map,
      zIndex: 3,
    });
    const polylineInner = new window.google.maps.Polyline({
      path: [rawPos],
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 0.85,
      strokeWeight: 4,
      map,
      zIndex: 4,
    });
    polylineRef.current = [polylineOutline, polylineInner];

    snapToRoad(rawPos, (snapped) => {
      marker.setPosition(snapped);
      posMarker.setPosition(snapped);
      map.panTo(snapped);
      startCoordsRef.current = snapped;
      pathRef.current = [snapped];
      polylineOutline.setPath([snapped]);
      polylineInner.setPath([snapped]);
    });
  }, [createLabelMarker, snapToRoad]);

  const loadDirectionsRoute = useCallback((map: any, origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    if (!window._gmapsLoaded) return;
    const isDark = document.documentElement.classList.contains('dark');
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
      (result: any, status: string) => {
        if (status !== 'OK' || !result?.routes?.[0]) return;
        const route = result.routes[0];
        const leg = route.legs[0];

        let routePath: any[] = [];
        if (route.overview_path && route.overview_path.length > 0) {
          routePath = route.overview_path;
        } else {
          try {
            const encoded = typeof route.overview_polyline === 'string' ? route.overview_polyline : route.overview_polyline?.points || route.overview_polyline;
            routePath = window.google.maps.geometry.encoding.decodePath(encoded);
          } catch { /* fallback below */ }
        }
        if (routePath.length === 0) {
          route.legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
              if (step.path) routePath = routePath.concat(step.path);
            });
          });
        }
        if (routePolylineRef.current) {
          if (Array.isArray(routePolylineRef.current)) routePolylineRef.current.forEach((p: any) => p.setMap(null));
          else routePolylineRef.current.setMap(null);
        }
        const routeOutline = new window.google.maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#1a73e8',
          strokeOpacity: 0.35,
          strokeWeight: 10,
          map,
          zIndex: 1,
        });
        const routeInner = new window.google.maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#4285F4',
          strokeOpacity: 0.85,
          strokeWeight: 5,
          map,
          zIndex: 2,
        });
        routePolylineRef.current = [routeOutline, routeInner];

        directionsStepsRef.current = leg.steps.map((s: any) => ({
          instruction: s.instructions?.replace(/<[^>]*>/g, '') || '',
          endLat: s.end_location.lat(),
          endLng: s.end_location.lng(),
          distanceM: s.distance?.value || 0,
        }));

        const markerBg = isDark ? '#FFFFFF' : '#000000';
        const markerText = isDark ? '#000000' : '#FFFFFF';
        if (endMarkerRef.current) endMarkerRef.current.setMap(null);
        const bMarker = createLabelMarker(map, destination, 'B', markerBg, markerText);
        endMarkerRef.current = bMarker;

        setNavInfo({
          nextStep: directionsStepsRef.current[0]?.instruction || 'Head to destination',
          remainingKm: Math.round((leg.distance?.value || 0) / 100) / 10,
          etaMins: Math.round((leg.duration?.value || 0) / 60),
        });
      }
    );
  }, [createLabelMarker]);

  const updateNavInfo = useCallback((currentPos: { lat: number; lng: number }) => {
    if (!directionsStepsRef.current.length) return;
    const steps = directionsStepsRef.current;
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < steps.length; i++) {
      const d = haversineKm(currentPos, { lat: steps[i].endLat, lng: steps[i].endLng });
      if (d < closestDist) { closestDist = d; closestIdx = i; }
    }
    if (closestDist < 0.05 && closestIdx < steps.length - 1) closestIdx++;
    let remainingM = 0;
    for (let i = closestIdx; i < steps.length; i++) remainingM += steps[i].distanceM;
    const remainingKm = Math.round(remainingM / 100) / 10;
    const avgSpeedKmh = 40;
    const etaMins = Math.max(1, Math.round((remainingKm / avgSpeedKmh) * 60));
    setNavInfo({
      nextStep: steps[closestIdx]?.instruction || 'Continue to destination',
      remainingKm,
      etaMins,
    });
  }, []);

  useEffect(() => {
    if (phase !== 'driving' || mapLoaded || mapError) return;
    if (!mapRef.current || !window._gmapsLoaded) return;
    if (startCoordsRef.current) {
      initMap(startCoordsRef.current.lat, startCoordsRef.current.lng);
    }
  }, [phase, mapLoaded, mapError, initMap]);

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
          if (segKm > 0.01) {
            liveKmRef.current += segKm;
            setTripKm(Math.round(liveKmRef.current * 10) / 10);
            pathRef.current.push(newPos);
          }
        } else {
          pathRef.current.push(newPos);
        }

        if (mapInstanceRef.current) {
          if (pathRef.current.length >= 2) {
            const prev = pathRef.current[pathRef.current.length - 2];
            const heading = calcBearing(prev, newPos);
            const camCenter = snappedPathRef.current.length > 0
              ? snappedPathRef.current[snappedPathRef.current.length - 1]
              : newPos;
            try {
              mapInstanceRef.current.moveCamera({ center: camCenter, heading });
            } catch {
              mapInstanceRef.current.panTo(camCenter);
              mapInstanceRef.current.setHeading(heading);
            }
          } else {
            mapInstanceRef.current.panTo(newPos);
          }
        }
        if (pathRef.current.length >= 2 && window._gmapsLoaded) {
          const now = Date.now();
          if (!snapTimerRef.current || now - snapTimerRef.current > 4000) {
            snapTimerRef.current = now;
            const pts = pathRef.current;
            const origin = pts[0];
            const current = pts[pts.length - 1];
            if (haversineKm(origin, current) > 0.005 || pts.length >= 3) {
              const waypoints: any[] = [];
              if (pts.length > 2) {
                const maxWp = 8;
                const step = Math.max(1, Math.floor((pts.length - 2) / maxWp));
                for (let i = 1; i < pts.length - 1; i += step) {
                  if (waypoints.length >= maxWp) break;
                  waypoints.push({ location: pts[i], stopover: false });
                }
              }
              const ds = new window.google.maps.DirectionsService();
              ds.route(
                {
                  origin,
                  destination: current,
                  waypoints,
                  travelMode: window.google.maps.TravelMode.DRIVING,
                  region: 'au',
                  optimizeWaypoints: false,
                },
                (result: any, status: string) => {
                  if (status !== 'OK' || !result?.routes?.[0]) return;
                  const route = result.routes[0];
                  let roadPath: any[] = [];
                  if (route.overview_path && route.overview_path.length > 0) {
                    roadPath = route.overview_path;
                  } else {
                    route.legs.forEach((leg: any) => {
                      leg.steps.forEach((step: any) => {
                        if (step.path) roadPath = roadPath.concat(step.path);
                      });
                    });
                  }
                  if (roadPath.length > 0 && polylineRef.current && Array.isArray(polylineRef.current)) {
                    snappedPathRef.current = roadPath;
                    polylineRef.current.forEach((p: any) => p.setPath(roadPath));
                    const lastRoadPt = roadPath[roadPath.length - 1];
                    const snappedEnd = {
                      lat: typeof lastRoadPt.lat === 'function' ? lastRoadPt.lat() : lastRoadPt.lat,
                      lng: typeof lastRoadPt.lng === 'function' ? lastRoadPt.lng() : lastRoadPt.lng,
                    };
                    if (positionMarkerRef.current) {
                      positionMarkerRef.current.setPosition(snappedEnd);
                    }
                  }
                }
              );
            }
          }
        }
        if (!positionMarkerRef.current || snappedPathRef.current.length === 0) {
          if (positionMarkerRef.current) {
            positionMarkerRef.current.setPosition(newPos);
          }
        }
        if (directionsStepsRef.current.length > 0) {
          updateNavInfo(newPos);
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
              const geo = results[0].geometry.location;
              const snappedLat = typeof geo.lat === 'function' ? geo.lat() : geo.lat;
              const snappedLng = typeof geo.lng === 'function' ? geo.lng() : geo.lng;
              setStartAddress(results[0].formatted_address);
              startCoordsRef.current = { lat: snappedLat, lng: snappedLng };
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

  const resolveDestCoords = useCallback(() => {
    if (!destAddress || !window._gmapsLoaded) return;
    if (destCoordsRef.current) {
      if (mapInstanceRef.current && startCoordsRef.current) {
        loadDirectionsRoute(mapInstanceRef.current, startCoordsRef.current, destCoordsRef.current);
      }
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: destAddress, region: 'au' }, (results: any, status: string) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        destCoordsRef.current = { lat: loc.lat(), lng: loc.lng() };
        if (mapInstanceRef.current && startCoordsRef.current) {
          loadDirectionsRoute(mapInstanceRef.current, startCoordsRef.current, destCoordsRef.current);
        }
      }
    });
  }, [destAddress, loadDirectionsRoute]);

  useEffect(() => {
    if (!mapLoaded || !destAddress) return;
    resolveDestCoords();
  }, [mapLoaded, destAddress, resolveDestCoords]);

  useEffect(() => {
    if (!showMapPicker || !mapPickerRef.current || !window._gmapsLoaded) return;
    const defaultCenter = startCoordsRef.current || { lat: -33.8688, lng: 151.2093 };
    const isDark = document.documentElement.classList.contains('dark');
    const map = new window.google.maps.Map(mapPickerRef.current, {
      center: defaultCenter,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: getMapStyles(),
    });
    mapPickerInstanceRef.current = map;

    const markerBg = isDark ? '#FFFFFF' : '#000000';
    const markerText = isDark ? '#000000' : '#FFFFFF';
    const marker = createLabelMarker(map, defaultCenter, showMapPicker === 'start' ? 'A' : 'B', markerBg, markerText);
    mapPickerMarkerRef.current = marker;
    pickedCoordsRef.current = defaultCenter;

    let routeLines: any[] = [];
    let pickerRenderer: any = null;
    const drawPickerRoute = (origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) => {
      routeLines.forEach((l: any) => l.setMap(null));
      routeLines = [];
      if (pickerRenderer) { pickerRenderer.setMap(null); pickerRenderer = null; }
      const ds = new window.google.maps.DirectionsService();
      ds.route(
        { origin, destination: dest, travelMode: window.google.maps.TravelMode.DRIVING, region: 'au' },
        (result: any, status: string) => {
          if (status !== 'OK' || !result?.routes?.[0]) return;
          const route = result.routes[0];
          let path: any[] = [];
          if (route.overview_path && route.overview_path.length > 0) {
            path = route.overview_path;
          } else {
            route.legs.forEach((leg: any) => {
              leg.steps.forEach((step: any) => {
                if (step.path) path = path.concat(step.path);
              });
            });
          }
          if (path.length > 0) {
            const outline = new window.google.maps.Polyline({ path, geodesic: true, strokeColor: '#1a73e8', strokeOpacity: 0.35, strokeWeight: 10, map, zIndex: 1 });
            const inner = new window.google.maps.Polyline({ path, geodesic: true, strokeColor: '#4285F4', strokeOpacity: 0.85, strokeWeight: 5, map, zIndex: 2 });
            routeLines = [outline, inner];
          } else {
            const renderer = new window.google.maps.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: '#4285F4', strokeOpacity: 0.85, strokeWeight: 5 } });
            renderer.setDirections(result);
            pickerRenderer = renderer;
          }
          const bounds = new window.google.maps.LatLngBounds();
          route.legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          map.fitBounds(bounds, 50);
        }
      );
    };

    if (showMapPicker === 'dest' && startCoordsRef.current) {
      const startMarkerBg = isDark ? '#FFFFFF' : '#000000';
      const startMarkerText = isDark ? '#000000' : '#FFFFFF';
      createLabelMarker(map, startCoordsRef.current, 'A', startMarkerBg, startMarkerText);
    }

    map.addListener('click', (e: any) => {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      marker.setPosition(pos);
      pickedCoordsRef.current = pos;
      if (showMapPicker === 'dest' && startCoordsRef.current) {
        drawPickerRoute(startCoordsRef.current, pos);
      }
    });

    return () => {
      routeLines.forEach((l: any) => l.setMap(null));
      if (pickerRenderer) pickerRenderer.setMap(null);
      mapPickerInstanceRef.current = null;
      mapPickerMarkerRef.current = null;
    };
  }, [showMapPicker, createLabelMarker]);

  const handleMapPickerConfirm = () => {
    if (!pickedCoordsRef.current || !window._gmapsLoaded) { setShowMapPicker(null); return; }
    const coords = pickedCoordsRef.current;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results: any, status: string) => {
      const addr = status === 'OK' && results?.[0] ? results[0].formatted_address : `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      if (showMapPicker === 'start') {
        setStartAddress(addr);
        startCoordsRef.current = coords;
        setGeoStatus('done');
      } else {
        setDestAddress(addr);
        destCoordsRef.current = coords;
      }
      setShowMapPicker(null);
    });
  };

  const handleCommence = () => {
    if (!startAddress) return;
    setPhase('driving');
    setStartTime(Date.now());
    setPausedElapsed(0);
    pathRef.current = [];
    liveKmRef.current = 0;
    if (destAddress) setEndAddress(destAddress);

    if (startCoordsRef.current) {
      pathRef.current.push(startCoordsRef.current);
      if (!window._gmapsLoaded) {
        setMapError(true);
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
        } else {
          startCoordsRef.current = { lat: -33.8688, lng: 151.2093 };
        }
        if (mapRef.current && !mapLoaded) {
          initMap(startCoordsRef.current!.lat, startCoordsRef.current!.lng);
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

    if (destAddress && !endAddress) {
      setEndAddress(destAddress);
    }

    if (window._gmapsLoaded && pathRef.current.length > 0) {
      const lastPos = pathRef.current[pathRef.current.length - 1];
      const isDark = document.documentElement.classList.contains('dark');
      const markerBg = isDark ? '#FFFFFF' : '#000000';
      const markerText = isDark ? '#000000' : '#FFFFFF';
      if (mapInstanceRef.current) {
        const bMarker = createLabelMarker(mapInstanceRef.current, lastPos, 'B', markerBg, markerText);
        endMarkerRef.current = bMarker;
        if (markerRef.current && startCoordsRef.current) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(startCoordsRef.current);
          bounds.extend(lastPos);
          mapInstanceRef.current.fitBounds(bounds, 60);
        }
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: lastPos }, (results: any, status: string) => {
        if (status === 'OK' && results?.[0]) {
          setEndAddress(results[0].formatted_address);
        } else if (!endAddress && !destAddress) {
          setEndAddress(`${lastPos.lat.toFixed(5)}, ${lastPos.lng.toFixed(5)}`);
        }
      });
    } else if (!endAddress && !destAddress && startCoordsRef.current) {
      setEndAddress(startAddress);
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
      type: tripType,
      verified: false,
      photo: false,
      odoReading: null,
      odoStartReading: null,
      purposeLabel: null,
      purposeIndex: null,
      stops: tripStops.filter(s => s.length > 2),
      notes: tripNotes,
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
      <div className="flex flex-col h-full relative" data-testid="live-setup-screen">
        <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
          <button
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
            style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
            onClick={onBack}
            data-testid="button-back-live"
          >
            <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
          </button>
          <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Start Trip</span>
        </div>

        <div className="flex-1 px-[18px] flex flex-col justify-center pb-[40px]">
          <div className="rounded-[16px] p-[20px] mb-[16px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
            <div className="flex items-center gap-[10px] mb-[14px]">
              <Navigation className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-heading font-bold text-[14px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>Where are you starting?</span>
            </div>

            <button
              className="w-full rounded-[10px] p-[11px_14px] mb-[10px] flex items-center gap-[10px] cursor-pointer transition-all"
              style={{
                background: geoStatus === 'done' ? 'rgba(34,197,94,.08)' : 'rgb(var(--wc-ink) / .05)',
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

            <div className="flex gap-[8px] mt-[8px]">
              <AddressInput
                className="rounded-[10px] p-[12px_14px] text-[13px] outline-none transition-all"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
                value={startAddress}
                onChange={(v) => { setStartAddress(v); if (geoStatus === 'done') setGeoStatus('idle'); startCoordsRef.current = null; }}
                placeholder="Enter starting address"
                data-testid="live-start-address"
              />
              <button
                className="rounded-[10px] px-[10px] flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)' }}
                onClick={() => setShowMapPicker('start')}
                data-testid="button-map-pick-start"
              >
                <MapPin className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
              </button>
            </div>
          </div>

          <div className="rounded-[16px] p-[20px] mb-[16px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
            <div className="flex items-center gap-[10px] mb-[14px]">
              <MapPin className="w-[18px] h-[18px]" style={{ color: 'var(--wc-t2)' }} />
              <span className="font-heading font-bold text-[14px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-t2)' }}>Where are you going?</span>
              <span className="ml-auto font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Optional</span>
            </div>

            <div className="flex gap-[8px]">
              <AddressInput
                className="rounded-[10px] p-[12px_14px] text-[13px] outline-none transition-all"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
                value={destAddress}
                onChange={(v) => { setDestAddress(v); destCoordsRef.current = null; }}
                placeholder="Enter destination address"
                data-testid="live-dest-address"
              />
              <button
                className="rounded-[10px] px-[10px] flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)' }}
                onClick={() => setShowMapPicker('dest')}
                data-testid="button-map-pick-dest"
              >
                <MapPin className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
              </button>
            </div>
            <div className="text-[10px] mt-[8px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
              {destAddress ? 'We\'ll show turn-by-turn directions and ETA while you drive.' : 'Add a destination for navigation assistance, or leave blank to just record.'}
            </div>
          </div>

          <button
            className="w-full rounded-[14px] py-[16px] font-heading font-black text-[18px] tracking-[.07em] uppercase flex items-center justify-center gap-[8px] transition-all"
            style={{
              background: startAddress.length > 3 ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
              color: startAddress.length > 3 ? 'var(--wc-bg)' : 'rgb(var(--wc-ink) / .4)',
              cursor: startAddress.length > 3 ? 'pointer' : 'not-allowed',
            }}
            onClick={handleCommence}
            disabled={startAddress.length <= 3}
            data-testid="button-commence"
          >
            <Car className="w-[20px] h-[20px]" strokeWidth={2.5} />
            Start Trip
          </button>
        </div>

        {showMapPicker && (
          <div className="absolute inset-0 z-50 flex flex-col" style={{ background: 'var(--wc-bg)' }} data-testid="map-picker-overlay">
            <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
              <button
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center cursor-pointer"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
                onClick={() => setShowMapPicker(null)}
                data-testid="button-map-picker-cancel"
              >
                <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
              </button>
              <span className="font-heading font-extrabold text-[16px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>
                {showMapPicker === 'start' ? 'Pick Start' : 'Pick Destination'}
              </span>
            </div>
            <div className="px-[14px] pb-[6px] flex-shrink-0">
              <div className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>Tap the map to place your pin</div>
            </div>
            <div className="flex-1 mx-[14px] rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--wc-border)' }}>
              <div ref={mapPickerRef} className="w-full h-full" style={{ minHeight: '300px' }} data-testid="map-picker-map" />
            </div>
            <div className="px-[14px] pt-[10px] pb-[8px] flex-shrink-0">
              <button
                className="w-full rounded-[14px] py-[14px] font-heading font-black text-[16px] tracking-[.06em] uppercase flex items-center justify-center gap-[8px] cursor-pointer transition-all"
                style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                onClick={handleMapPickerConfirm}
                data-testid="button-map-picker-confirm"
              >
                <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
                Confirm Location
              </button>
            </div>
          </div>
        )}
  
      </div>
    );
  }

  if (phase === 'driving' || phase === 'paused') {
    const isPaused = phase === 'paused';
    const liveDeduction = getEstimatedDeduction(tripKm);
    return (
      <div className="flex flex-col h-full" data-testid="live-driving-screen">
        <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
          <div className="w-[8px] h-[8px] rounded-full" style={{ background: isPaused ? 'var(--wc-am)' : 'var(--wc-gr)', animation: isPaused ? 'none' : 'pulse 2s infinite' }} />
          <span className="font-heading font-extrabold text-[14px] uppercase tracking-[.04em]" style={{ color: isPaused ? 'var(--wc-am)' : 'var(--wc-gr)' }}>
            {isPaused ? 'Paused' : 'Recording'}
          </span>
          {destAddress ? (
            <span className="ml-auto text-[10px] truncate" style={{ color: 'var(--wc-t3)', maxWidth: '55%' }}>→ {destAddress.length > 30 ? destAddress.slice(0, 28) + '…' : destAddress}</span>
          ) : (
            <span className="ml-auto text-[10px] truncate" style={{ color: 'var(--wc-t3)', maxWidth: '55%' }}>{startAddress.length > 35 ? startAddress.slice(0, 33) + '…' : startAddress}</span>
          )}
        </div>

        <div className="flex-1 mx-[14px] rounded-[14px] overflow-hidden relative" style={{ border: '1px solid var(--wc-border)', background: 'var(--wc-card)', minHeight: '200px', perspective: '800px' }}>
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '200px', transform: 'rotateX(25deg) scale(1.15)', transformOrigin: 'center 60%' }} data-testid="live-map" />
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[8px]" style={{ background: 'var(--wc-card)' }}>
              <Navigation className="w-[28px] h-[28px] animate-pulse" style={{ color: 'var(--wc-y)' }} />
              <span className="font-heading text-[12px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>Loading map...</span>
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[8px]" style={{ background: 'var(--wc-card)' }}>
              <Navigation className="w-[28px] h-[28px]" style={{ color: 'var(--wc-t3)' }} />
              <span className="font-heading text-[12px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>Map unavailable</span>
              <span className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>Trip still recording — {tripKm.toFixed(1)} km</span>
            </div>
          )}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)' }}>
              <div className="rounded-[12px] p-[16px_24px] text-center" style={{ background: 'rgba(153,153,153,.1)', border: '1.5px solid rgba(153,153,153,.3)' }}>
                <Pause className="w-[24px] h-[24px] mx-auto mb-[6px]" style={{ color: 'var(--wc-am)' }} />
                <div className="font-heading font-bold text-[14px] uppercase" style={{ color: 'var(--wc-am)' }}>Paused</div>
              </div>
            </div>
          )}
        </div>

        <div className="px-[14px] pt-[8px] flex-shrink-0">
          {navInfo && (
            <div className="rounded-[10px] p-[8px_12px] mb-[8px] flex items-center gap-[10px]" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }} data-testid="nav-directions-bar">
              <Navigation2 className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate leading-tight" style={{ color: 'var(--wc-text)' }} data-testid="text-nav-step">{navInfo.nextStep}</div>
                <div className="flex items-center gap-[8px] mt-[2px]">
                  <span className="font-data text-[9px] uppercase" style={{ color: 'var(--wc-t3)' }}>{navInfo.remainingKm} km left</span>
                  <span className="font-data text-[9px]" style={{ color: 'var(--wc-t3)' }}>·</span>
                  <span className="font-data text-[9px] uppercase" style={{ color: 'var(--wc-t3)' }}>{navInfo.etaMins} min</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-[6px] mb-[8px]">
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Distance</div>
              <div className="font-display text-[20px] leading-none" style={{ color: 'var(--wc-y)' }} data-testid="text-live-km">{tripKm.toFixed(1)}</div>
              <div className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>km</div>
            </div>
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Time</div>
              <div className="font-display text-[20px] leading-none" style={{ color: 'var(--wc-text)' }} data-testid="text-live-time">{fmtElapsed(elapsed)}</div>
              <div className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>elapsed</div>
            </div>
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Est. Claim</div>
              <div className="font-display text-[20px] leading-none" style={{ color: tripType === 'business' ? 'var(--wc-gr)' : 'var(--wc-t2)' }} data-testid="text-live-deduction">${liveDeduction.toFixed(2)}</div>
              <div className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>{tripType === 'business' ? 'claimable' : 'if business'}</div>
            </div>
          </div>

          <div className="flex gap-[6px] mb-[8px]">
            <button
              className="flex-1 rounded-[10px] py-[9px] font-heading font-bold text-[11px] tracking-[.05em] uppercase flex items-center justify-center gap-[5px] cursor-pointer transition-all"
              style={{
                background: tripType === 'business' ? 'rgba(34,197,94,.1)' : 'rgb(var(--wc-ink) / .04)',
                border: tripType === 'business' ? '1.5px solid rgba(34,197,94,.4)' : '1.5px solid var(--wc-border)',
                color: tripType === 'business' ? 'var(--wc-gr)' : 'var(--wc-t2)',
              }}
              onClick={() => setTripType(tripType === 'business' ? null : 'business')}
              data-testid="button-trip-business"
            >
              <Briefcase className="w-[13px] h-[13px]" />
              Business
            </button>
            <button
              className="flex-1 rounded-[10px] py-[9px] font-heading font-bold text-[11px] tracking-[.05em] uppercase flex items-center justify-center gap-[5px] cursor-pointer transition-all"
              style={{
                background: tripType === 'personal' ? 'rgb(var(--wc-ink) / .1)' : 'rgb(var(--wc-ink) / .04)',
                border: tripType === 'personal' ? '1.5px solid rgb(var(--wc-ink) / .4)' : '1.5px solid var(--wc-border)',
                color: tripType === 'personal' ? 'var(--wc-text)' : 'var(--wc-t2)',
              }}
              onClick={() => setTripType(tripType === 'personal' ? null : 'personal')}
              data-testid="button-trip-personal"
            >
              <Car className="w-[13px] h-[13px]" />
              Personal
            </button>
          </div>

          <div className="flex gap-[8px] pb-[6px]">
            <button
              className="flex-1 rounded-[12px] py-[12px] font-heading font-black text-[14px] tracking-[.05em] uppercase flex items-center justify-center gap-[6px] transition-all cursor-pointer"
              style={{
                background: isPaused ? 'rgba(34,197,94,.12)' : 'rgba(153,153,153,.08)',
                border: isPaused ? '2px solid rgba(34,197,94,.3)' : '2px solid rgba(153,153,153,.25)',
                color: isPaused ? 'var(--wc-gr)' : 'var(--wc-am)',
              }}
              onClick={isPaused ? handleResume : handlePause}
              data-testid={isPaused ? 'button-resume' : 'button-pause'}
            >
              {isPaused ? <Play className="w-[15px] h-[15px]" strokeWidth={2.5} /> : <Pause className="w-[15px] h-[15px]" strokeWidth={2.5} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              className="flex-1 rounded-[12px] py-[12px] font-heading font-black text-[14px] tracking-[.05em] uppercase flex items-center justify-center gap-[6px] transition-all cursor-pointer"
              style={{
                background: 'var(--wc-re)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(239,68,68,.25)',
              }}
              onClick={handleEndTrip}
              data-testid="button-end-trip"
            >
              <Square className="w-[13px] h-[13px]" fill="currentColor" strokeWidth={0} />
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
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Trip Complete</span>
      </div>

      <div className="flex-1 px-[18px] pt-[6px] overflow-y-auto scrollbar-thin pb-[10px]">
        <div className="rounded-[14px] p-[16px] mb-[12px]" style={{ background: 'rgba(34,197,94,.05)', border: '1.5px solid rgba(34,197,94,.2)' }}>
          <div className="flex items-center gap-[8px] mb-[10px]">
            <Check className="w-[16px] h-[16px]" style={{ color: 'var(--wc-gr)' }} />
            <span className="font-heading font-bold text-[14px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-gr)' }}>Trip Recorded</span>
          </div>
          <div className="flex flex-col gap-[6px] text-[12px]" style={{ color: 'var(--wc-t2)' }}>
            <div><strong style={{ color: 'var(--wc-text)' }}>From:</strong> {startAddress}</div>
            {endAddress && <div><strong style={{ color: 'var(--wc-text)' }}>To:</strong> {endAddress}</div>}
            <div><strong style={{ color: 'var(--wc-text)' }}>Duration:</strong> {tripDuration}</div>
            <div><strong style={{ color: 'var(--wc-text)' }}>Distance:</strong> <span className="font-data font-bold" style={{ color: 'var(--wc-y)' }}>{tripKm.toFixed(1)} km</span></div>
          </div>
        </div>

        <div className="flex gap-[8px] mb-[12px]">
          <div className="flex-1 rounded-[12px] p-[12px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <div className="flex items-center gap-[6px] mb-[4px]">
              <DollarSign className="w-[12px] h-[12px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Est. Deduction</span>
            </div>
            <div className="font-display text-[22px] leading-none" style={{ color: 'var(--wc-y)' }} data-testid="text-est-deduction">
              ${getEstimatedDeduction(tripKm).toFixed(2)}
            </div>
            <div className="font-data text-[8px] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>if business trip</div>
          </div>
          <div className="flex-1 rounded-[12px] p-[12px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <div className="flex items-center gap-[6px] mb-[4px]">
              <Fuel className="w-[12px] h-[12px]" style={{ color: 'var(--wc-t2)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Est. Fuel Cost</span>
            </div>
            <div className="font-display text-[22px] leading-none" style={{ color: 'var(--wc-text)' }} data-testid="text-est-fuel">
              ${getEstimatedFuelCost(tripKm).toFixed(2)}
            </div>
            <div className="font-data text-[8px] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>this trip</div>
          </div>
        </div>

        {!endAddress && (
          <div className="mb-[10px]">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Destination</label>
            <AddressInput
              className="w-full rounded-[10px] p-[10px_12px] text-[12px] outline-none transition-all"
              style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
              value={endAddress}
              onChange={setEndAddress}
              placeholder="Enter destination"
              data-testid="live-end-address"
            />
          </div>
        )}

        <div className="rounded-[10px] p-[10px_14px] mb-[10px]" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid var(--wc-border)' }}>
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Distance (km)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            className="w-full rounded-lg p-[8px_11px] text-[13px] outline-none font-data"
            style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
            value={tripKm || ''}
            onChange={e => setTripKm(parseFloat(e.target.value) || 0)}
            placeholder="Min 1"
            data-testid="live-manual-km"
          />
        </div>

        {tripStops.map((s, i) => (
          <div key={i} className="flex items-center gap-[5px] mb-[6px]">
            <AddressInput
              className="w-full rounded-[8px] p-[7px_10px] text-[12px] outline-none"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
              placeholder={`Stop ${i + 1}`}
              value={s}
              onChange={v => { const n = [...tripStops]; n[i] = v; setTripStops(n); }}
            />
            <button className="rounded-[6px] p-[5px_7px] text-[11px] cursor-pointer" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--wc-re)' }} onClick={() => { const n = [...tripStops]; n.splice(i, 1); setTripStops(n); }}>X</button>
          </div>
        ))}

        <button
          className="w-full rounded-[8px] p-[7px_10px] mb-[10px] font-heading font-semibold text-[10px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center justify-center gap-[5px]"
          style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px dashed var(--wc-border)', color: 'var(--wc-t2)' }}
          onClick={() => setTripStops([...tripStops, ''])}
          data-testid="live-add-stop"
        >
          <Route className="w-[11px] h-[11px]" />
          + Add Stop
        </button>

        <div className="mb-[10px]">
          <div className="flex items-center gap-[6px] mb-[4px]">
            <StickyNote className="w-[11px] h-[11px]" style={{ color: 'var(--wc-t3)' }} />
            <label className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Notes</label>
          </div>
          <textarea
            className="w-full rounded-[10px] p-[9px_12px] text-[12px] outline-none resize-none h-[50px]"
            style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
            value={tripNotes}
            onChange={e => setTripNotes(e.target.value)}
            placeholder="Add notes about this trip (optional)"
            data-testid="live-notes"
          />
        </div>

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
            className="w-full rounded-[14px] py-[15px] font-heading font-black text-[17px] tracking-[.07em] uppercase transition-all flex items-center justify-center gap-[8px]"
            style={{
              background: canSendToSort ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
              color: 'var(--wc-bg)',
              opacity: canSendToSort ? 1 : 0.5,
              boxShadow: canSendToSort ? '0 4px 20px rgb(var(--wc-ink) / .25)' : 'none',
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


    </div>
  );
}

function ExistingTripScreen({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp();

  const lastTripTo = useMemo(() => {
    if (state.trips.length === 0) return '';
    const last = state.trips[state.trips.length - 1];
    return [last.to, last.toSub].filter(Boolean).join(', ');
  }, [state.trips]);

  const [from, setFrom] = useState(lastTripTo);
  const [fromEdited, setFromEdited] = useState(false);
  const [to, setTo] = useState('');
  const [km, setKm] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calcStatus, setCalcStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const [frequentRoutes, setFrequentRoutes] = useState<SavedRoute[]>([]);
  const [suggestedPlaces, setSuggestedPlaces] = useState<SavedPlace[]>([]);
  const calcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFrequentRoutes(getTopRoutes(3));
    setSuggestedPlaces(getTopPlaces(from, 3));
  }, []);

  useEffect(() => {
    setSuggestedPlaces(getTopPlaces(from, 3));
  }, [from]);

  // Auto-calculate route when both addresses are filled
  useEffect(() => {
    if (calcTimerRef.current) clearTimeout(calcTimerRef.current);
    if (!from || !to || from.length < 5 || to.length < 5) return;

    calcTimerRef.current = setTimeout(() => {
      if (!window._gmapsLoaded) return;
      setCalcStatus('loading');
      const validStops = stops.filter(s => s.length > 3);
      const waypoints = validStops.map(s => ({ location: s, stopover: true }));
      const ds = new window.google.maps.DirectionsService();
      ds.route({
        origin: from,
        destination: to,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'au',
      }, (result: any, status: string) => {
        if (status === 'OK' && result?.routes?.[0]) {
          let totalM = 0, totalSec = 0;
          result.routes[0].legs.forEach((leg: any) => {
            totalM += leg.distance?.value || 0;
            totalSec += leg.duration?.value || 0;
          });
          const calcKm = totalM / 1000;
          const mins = Math.round(totalSec / 60);
          const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
          setKm(calcKm.toFixed(1));
          setDuration(durStr);
          setCalcStatus('done');
        } else {
          setCalcStatus('error');
        }
      });
    }, 800);

    return () => { if (calcTimerRef.current) clearTimeout(calcTimerRef.current); };
  }, [from, to, stops]);

  useEffect(() => {
    if (calcStatus === 'error') setShowDetails(true);
  }, [calcStatus]);

  const odoStart = useMemo(() => {
    if (state.trips.length === 0) return state.baseOdo;
    return getTripOdoEnd(state.trips, state.trips.length - 1, state.baseOdo);
  }, [state.trips, state.baseOdo]);

  const parsedKm = parseFloat(km) || 0;
  const odoEnd = Math.round(odoStart + parsedKm);
  const isAutoFilled = !fromEdited && from === lastTripTo && lastTripTo.length > 0;

  const handleFromChange = useCallback((v: string) => {
    setFrom(v);
    setFromEdited(true);
  }, []);

  const handleQuickAdd = useCallback((route: SavedRoute) => {
    setFrom(route.fromAddress);
    setTo(route.toAddress);
    setFromEdited(true);
    if (route.km > 0) {
      setKm(route.km.toFixed(1));
      setDuration(route.duration || '');
    }
  }, []);

  const handleSave = () => {
    if (!from || !to || parsedKm < 1) return;

    recordPlace(from);
    recordPlace(to);
    recordRoute(from, to, parsedKm, duration);

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
      odoReading: odoEnd,
      odoStartReading: Math.round(odoStart),
      purposeLabel: null,
      purposeIndex: null,
      stops: stops.filter(s => s.length > 3),
      notes: notes || '',
    };

    dispatch({ type: 'ADD_TRIP', trip });
    dispatch({ type: 'ADD_LOG', desc: `Trip added: ${trip.from} → ${trip.to} (${parsedKm} km) — sent to sort`, hasPhoto: false });
    setSaved(true);
    setTimeout(() => {
      dispatch({ type: 'GO_SCREEN', screen: 'sort' });
    }, 1200);
  };

  const canSave = from.length > 2 && to.length > 2 && parsedKm >= 1;

  const dateObj = new Date(date + 'T00:00:00');
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const displayDate = `${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`;
  const [hh, mm] = time.split(':');
  const hr = parseInt(hh);
  const displayTime = `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${mm} ${hr >= 12 ? 'PM' : 'AM'}`;

  return (
    <div className="flex flex-col h-full" data-testid="existing-trip-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-existing"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Add Trip</span>
        <span className="ml-auto font-data text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>sends to sort</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[6px] pb-[10px]">

        {frequentRoutes.length > 0 && (
          <div className="mb-[14px]">
            <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[6px] flex items-center gap-[5px]" style={{ color: 'var(--wc-t3)' }}>
              <Route className="w-[10px] h-[10px]" />
              Your trips
            </div>
            <div className="flex gap-[8px] overflow-x-auto pb-[4px] scrollbar-thin">
              {frequentRoutes.map((route, i) => (
                <button
                  key={i}
                  className="flex-shrink-0 rounded-[12px] p-[10px_14px] cursor-pointer transition-all text-left"
                  style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1.5px solid var(--wc-border)', minWidth: '120px' }}
                  onClick={() => handleQuickAdd(route)}
                >
                  <div className="font-heading font-bold text-[11px] truncate leading-tight" style={{ color: 'var(--wc-text)', maxWidth: '130px' }}>
                    {route.fromLabel}
                  </div>
                  <div className="font-heading font-bold text-[11px] truncate leading-tight mt-[2px]" style={{ color: 'var(--wc-y)', maxWidth: '130px' }}>
                    → {route.toLabel}
                  </div>
                  <div className="font-data text-[9px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>
                    {route.km.toFixed(1)} km{route.duration ? ` · ${route.duration}` : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-[10px]">
          <div className="flex items-center gap-[6px] mb-[4px]">
            <label className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>From</label>
            {isAutoFilled && (
              <span className="font-data text-[7px] tracking-[.05em]" style={{ color: 'var(--wc-y)' }}>· from last trip</span>
            )}
          </div>
          <AddressInput
            className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none transition-all"
            style={{ background: 'rgb(var(--wc-ink) / .05)', border: isAutoFilled ? '1.5px solid rgb(var(--wc-ink) / .25)' : '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
            value={from}
            onChange={handleFromChange}
            placeholder="Start address"
            data-testid="input-from"
          />
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Where to?</label>
          <AddressInput
            className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none transition-all"
            style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
            value={to}
            onChange={setTo}
            placeholder="Destination"
            data-testid="input-to"
          />

          {suggestedPlaces.length > 0 && to.length < 3 && (
            <div className="flex gap-[6px] mt-[6px] flex-wrap">
              {suggestedPlaces.map((place, i) => (
                <button
                  key={i}
                  className="rounded-[8px] p-[5px_10px] cursor-pointer transition-all flex items-center gap-[4px]"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                  onClick={() => setTo(place.address)}
                >
                  <MapPin className="w-[10px] h-[10px]" style={{ color: 'var(--wc-y)' }} />
                  <span className="font-heading font-semibold text-[10px]">{place.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {calcStatus === 'loading' && (
          <div className="rounded-[10px] p-[8px_12px] mb-[10px] flex items-center gap-[8px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <Route className="w-[12px] h-[12px] animate-pulse" style={{ color: 'var(--wc-y)' }} />
            <span className="font-data text-[10px]" style={{ color: 'var(--wc-t3)' }}>Calculating route...</span>
          </div>
        )}

        {calcStatus === 'error' && (
          <div className="rounded-[10px] p-[8px_12px] mb-[10px] flex items-center gap-[6px]" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)' }}>
            <span className="text-[10px]" style={{ color: 'var(--wc-re)' }}>Could not calculate route. Enter distance below.</span>
          </div>
        )}

        {parsedKm > 0 && (
          <div className="flex gap-[6px] mb-[10px]">
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Distance</div>
              <div className="font-display text-[20px] leading-none" style={{ color: 'var(--wc-y)' }}>{km}</div>
              <div className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>km</div>
            </div>
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Date</div>
              <div className="font-data text-[13px] font-bold leading-none" style={{ color: 'var(--wc-text)' }}>{displayDate}</div>
              <div className="font-data text-[7px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>{displayTime}</div>
            </div>
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Odometer</div>
              <div className="font-data text-[11px] font-bold leading-tight" style={{ color: 'var(--wc-text)' }}>{Math.round(odoStart).toLocaleString()}</div>
              <div className="font-data text-[9px]" style={{ color: 'var(--wc-y)' }}>→ {odoEnd.toLocaleString()}</div>
            </div>
          </div>
        )}

        <button
          className="w-full rounded-[8px] p-[8px] mb-[8px] font-heading font-semibold text-[11px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center justify-center gap-[5px]"
          style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
          onClick={() => setShowDetails(!showDetails)}
        >
          <span style={{ fontSize: '8px' }}>{showDetails ? '▲' : '▼'}</span>
          {showDetails ? 'Less' : 'More'} details
        </button>

        {showDetails && (
          <div className="rounded-[12px] p-[14px] mb-[10px]" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid var(--wc-border)' }}>
            <div className="flex gap-[6px] mb-[8px]">
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Date</label>
                <div className="relative">
                  <Calendar className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
                  <input
                    type="date"
                    className="w-full rounded-lg p-[7px_8px_7px_24px] text-[11px] outline-none"
                    style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    data-testid="input-date"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Time</label>
                <div className="relative">
                  <Clock className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
                  <input
                    type="time"
                    className="w-full rounded-lg p-[7px_8px_7px_24px] text-[11px] outline-none"
                    style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    data-testid="input-time"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-[6px] mb-[8px]">
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  className="w-full rounded-lg p-[7px_10px] text-[12px] outline-none font-data"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                  value={km}
                  onChange={e => setKm(e.target.value)}
                  placeholder="Min 1"
                  data-testid="input-km"
                />
              </div>
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Duration</label>
                <input
                  className="w-full rounded-lg p-[7px_10px] text-[12px] outline-none"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 25 min"
                  data-testid="input-duration"
                />
              </div>
            </div>

            {stops.map((s, i) => (
              <div key={i} className="flex items-center gap-[5px] mb-[6px]">
                <AddressInput
                  className="w-full rounded-[7px] p-[6px_9px] text-[12px] outline-none"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
                  placeholder={`Stop ${i + 1}`}
                  value={s}
                  onChange={v => { const n = [...stops]; n[i] = v; setStops(n); }}
                />
                <button className="rounded-[6px] p-[5px_7px] text-[11px] cursor-pointer" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--wc-re)' }} onClick={() => { const n = [...stops]; n.splice(i, 1); setStops(n); }}>✕</button>
              </div>
            ))}
            <button
              className="w-full rounded-[7px] p-[5px_8px] mb-[8px] font-heading font-semibold text-[10px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center justify-center gap-[4px]"
              style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px dashed var(--wc-border)', color: 'var(--wc-t2)' }}
              onClick={() => setStops([...stops, ''])}
              data-testid="input-add-stop"
            >
              <Route className="w-[10px] h-[10px]" />
              + Add Stop
            </button>

            <div className="mb-[6px]">
              <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Notes</label>
              <textarea
                className="w-full rounded-lg p-[7px_10px] text-[11px] outline-none resize-none h-[40px]"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional"
                data-testid="input-notes"
              />
            </div>

            <div className="flex items-center gap-[6px]">
              <Gauge className="w-[11px] h-[11px]" style={{ color: 'var(--wc-t3)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>
                Odo: {Math.round(odoStart).toLocaleString()} → {parsedKm > 0 ? odoEnd.toLocaleString() : '—'} km (auto)
              </span>
            </div>
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
            className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase cursor-pointer transition-all mb-[6px] flex items-center justify-center gap-[6px]"
            style={{
              background: canSave ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
              color: 'var(--wc-bg)',
              opacity: canSave ? 1 : 0.5,
              boxShadow: canSave ? '0 4px 20px rgb(var(--wc-ink) / .25)' : 'none',
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
    </div>
  );
}

export function InputScreen() {
  const [mode, setMode] = useState<InputMode>('choose');

  if (mode === 'existing') return <ExistingTripScreen onBack={() => setMode('choose')} />;
  if (mode === 'live') return <LiveTripScreen onBack={() => setMode('choose')} />;
  return <ChooseScreen onSelect={setMode} />;
}
