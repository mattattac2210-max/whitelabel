import { useState, useCallback, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { type Trip, CATEGORIES, RATE } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import { AddressInput } from './address-input';
import { MapPin, Check, Calendar, Clock, Wrench, Building2, Package, ClipboardList, Handshake, Store, Zap, FileText, GraduationCap, Landmark, Plus, ArrowRight } from 'lucide-react';

const iconMap: Record<string, any> = { Wrench, Building2, Package, ClipboardList, Handshake, Store, Zap, FileText, GraduationCap, Landmark };

let nextManualId = 8000;

export function InputScreen() {
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
  const [tripType, setTripType] = useState<'business' | 'personal'>('business');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

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

  const resetForm = () => {
    setFrom('');
    setTo('');
    setKm('');
    setDuration('');
    setTripType('business');
    setPurpose('');
    setNotes('');
    setStops([]);
    setSaved(false);
    setRouteKm(null);
    setRouteDur(null);
    setCalcStatus('idle');
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

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
      type: tripType,
      verified: false,
      photo: false,
      odoReading: null,
      odoStartReading: null,
      purposeLabel: purpose || null,
      purposeIndex: purpose ? CATEGORIES.findIndex(c => c.label === purpose) : null,
      stops: stops.filter(s => s.length > 3),
    };

    dispatch({ type: 'ADD_TRIP', trip });
    dispatch({ type: 'ADD_LOG', desc: `Manual trip added: ${trip.from} → ${trip.to} (${parsedKm} km, ${tripType})`, hasPhoto: false });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const canSave = from.length > 2 && to.length > 2;
  const estDed = tripType === 'business' ? (parseFloat(km) || 0) * RATE : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[6px] pb-[10px]">
        <div className="flex items-center justify-between mb-[10px]">
          <div>
            <div className="font-heading font-black text-[22px] uppercase tracking-[.04em] text-white leading-none">Add Trip</div>
            <div className="font-data text-[9px] uppercase tracking-[.1em] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Manual entry</div>
          </div>
          <div className="flex items-center gap-[6px]">
            <div className="font-data text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>
              {state.trips.length} trips logged
            </div>
          </div>
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Trip Type</label>
          <div className="flex gap-[6px]">
            <button
              className="flex-1 rounded-[8px] py-[9px] font-heading font-bold text-[13px] uppercase tracking-[.05em] cursor-pointer transition-all"
              style={tripType === 'business'
                ? { background: 'rgba(245,196,0,.15)', border: '2px solid var(--wc-y)', color: 'var(--wc-y)' }
                : { background: 'rgba(255,255,255,.04)', border: '2px solid var(--wc-border)', color: 'var(--wc-t3)' }}
              onClick={() => setTripType('business')}
              data-testid="input-type-business"
            >
              Business
            </button>
            <button
              className="flex-1 rounded-[8px] py-[9px] font-heading font-bold text-[13px] uppercase tracking-[.05em] cursor-pointer transition-all"
              style={tripType === 'personal'
                ? { background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.4)', color: 'white' }
                : { background: 'rgba(255,255,255,.04)', border: '2px solid var(--wc-border)', color: 'var(--wc-t3)' }}
              onClick={() => setTripType('personal')}
              data-testid="input-type-personal"
            >
              Personal
            </button>
          </div>
        </div>

        {tripType === 'business' && (
          <div className="mb-[10px]">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Business Purpose</label>
            <div className="grid grid-cols-5 gap-[4px]">
              {CATEGORIES.map((cat, ci) => {
                const Icon = iconMap[cat.icon];
                const selected = purpose === cat.label;
                return (
                  <button
                    key={ci}
                    className="rounded-[7px] p-[6px_2px] cursor-pointer transition-all text-center"
                    style={selected
                      ? { background: 'rgba(245,196,0,.15)', border: '1.5px solid var(--wc-y)' }
                      : { background: 'rgba(255,255,255,.03)', border: '1.5px solid var(--wc-border)' }}
                    onClick={() => setPurpose(selected ? '' : cat.label)}
                    data-testid={`input-purpose-${ci}`}
                  >
                    {Icon && <Icon className="w-[14px] h-[14px] mx-auto mb-[2px]" style={{ color: selected ? 'var(--wc-y)' : 'var(--wc-t3)' }} />}
                    <div className="font-heading text-[7px] uppercase tracking-[.02em] leading-tight" style={{ color: selected ? 'var(--wc-y)' : 'var(--wc-t3)' }}>{cat.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

        {tripType === 'business' && parseFloat(km) > 0 && (
          <div className="rounded-[10px] p-[9px_12px] mb-[8px]" style={{ background: 'rgba(245,196,0,.04)', border: '1px solid rgba(245,196,0,.14)' }}>
            <div className="flex justify-between items-center">
              <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Est. Deduction</span>
              <span className="font-heading font-extrabold text-[15px]" style={{ color: 'var(--wc-y)' }}>${estDed.toFixed(2)}</span>
            </div>
          </div>
        )}

        {saved ? (
          <div
            className="w-full rounded-[10px] py-[11px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase flex items-center justify-center gap-2 transition-all mb-[6px]"
            style={{ background: 'rgba(34,197,94,.12)', border: '2px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}
            data-testid="input-saved-confirm"
          >
            <Check className="w-[16px] h-[16px]" strokeWidth={2.5} />
            Trip Added
          </div>
        ) : (
          <button
            className="w-full rounded-[10px] py-[11px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase text-black cursor-pointer transition-all mb-[6px]"
            style={{
              background: canSave ? 'var(--wc-y)' : 'rgba(245,196,0,.2)',
              opacity: canSave ? 1 : 0.5,
            }}
            onClick={handleSave}
            disabled={!canSave}
            data-testid="input-save-trip"
          >
            <Plus className="w-[16px] h-[16px] inline mr-1" strokeWidth={2.5} />
            Add Trip
          </button>
        )}

        <button
          className="w-full rounded-[10px] py-[9px] font-heading font-bold text-[12px] tracking-[.05em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
          style={{ background: 'rgba(255,255,255,.04)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
          onClick={() => { resetForm(); dispatch({ type: 'GO_SCREEN', screen: 'sort' }); }}
          data-testid="input-go-sort"
        >
          <ArrowRight className="w-[12px] h-[12px]" />
          Go to Sort
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
