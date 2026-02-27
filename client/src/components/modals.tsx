import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp, useComputedStats } from '@/lib/app-context';
import { RATE, getTripOdoEnd } from '@/lib/trip-data';
import { X, Check, AlertTriangle, Clock, Camera, MapPin, Settings, Trophy, Target, Gauge, ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';
import { AddressInput } from './address-input';

function ModalOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-[100] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full h-full overflow-y-auto scrollbar-thin"
        style={{ background: 'var(--wc-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function EditModal() {
  const { state, dispatch } = useApp();
  const trip = state.trips[state.editTripIndex];
  const [editFrom, setEditFrom] = useState('');
  const [editTo, setEditTo] = useState('');
  const [editKm, setEditKm] = useState('');
  const [editDur, setEditDur] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [routeDur, setRouteDur] = useState<string | null>(null);
  const [calcStatus, setCalcStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevTripRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.editModalOpen && trip && prevTripRef.current !== state.editTripIndex) {
      prevTripRef.current = state.editTripIndex;
      setEditFrom(`${trip.from}, ${trip.fromSub}`);
      setEditTo(`${trip.to}, ${trip.toSub}`);
      setEditKm(String(trip.km));
      setEditDur(trip.duration);
      setEditPurpose(trip.purposeLabel || '');
      setStops([]);
      setRouteKm(null);
      setRouteDur(null);
      setCalcStatus('idle');
    }
  }, [state.editModalOpen, state.editTripIndex, trip]);

  const calcRoute = useCallback(() => {
    if (routeTimerRef.current) clearTimeout(routeTimerRef.current);
    routeTimerRef.current = setTimeout(() => {
      if (!window._gmapsLoaded || !editFrom || !editTo) return;
      const validStops = stops.filter(s => s.length > 3);
      const waypoints = validStops.map(s => ({ location: s, stopover: true }));
      setCalcStatus('loading');
      const ds = new window.google.maps.DirectionsService();
      ds.route({
        origin: editFrom,
        destination: editTo,
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
          const km = totalM / 1000;
          const mins = Math.round(totalSec / 60);
          const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
          setRouteKm(km);
          setRouteDur(durStr);
          setEditKm(km.toFixed(1));
          setEditDur(durStr);
          setCalcStatus('done');
        } else {
          setCalcStatus('error');
        }
      });
    }, 600);
  }, [editFrom, editTo, stops]);

  useEffect(() => {
    const validStops = stops.filter(s => s.length > 3);
    if (editFrom.length > 5 && editTo.length > 5 && validStops.length > 0) {
      calcRoute();
    }
  }, [stops, calcRoute]);

  if (!state.editModalOpen || !trip) return null;

  const km = parseFloat(editKm) || 0;
  const totalKm = km;
  const cpm = totalKm * RATE;
  const log = totalKm * RATE * 0.7;

  const handleSave = () => {
    const fromParts = editFrom.split(',');
    const toParts = editTo.split(',');
    dispatch({
      type: 'UPDATE_TRIP',
      tripIndex: state.editTripIndex,
      updates: {
        from: fromParts[0].trim(),
        fromSub: fromParts.slice(1).join(',').trim(),
        to: toParts[0].trim(),
        toSub: toParts.slice(1).join(',').trim(),
        km: totalKm,
        duration: editDur || trip.duration,
        purposeLabel: editPurpose || trip.purposeLabel,
      },
    });
    dispatch({ type: 'ADD_LOG', desc: `Trip edited: ${fromParts[0].trim()} \u2192 ${toParts[0].trim()}${stops.filter(s => s.length > 3).length > 0 ? ` (${stops.filter(s => s.length > 3).length} stop${stops.filter(s => s.length > 3).length > 1 ? 's' : ''})` : ''}`, hasPhoto: false });
    setEditFrom('');
    setEditTo('');
    dispatch({ type: 'CLOSE_EDIT' });
  };

  return (
    <ModalOverlay open={state.editModalOpen} onClose={() => { setEditFrom(''); setEditTo(''); dispatch({ type: 'CLOSE_EDIT' }); }}>
      <div className="pt-[42px]" />
      <div className="flex items-center justify-between px-[18px] pb-[10px]">
        <div className="font-heading font-extrabold text-[18px] uppercase tracking-[.04em] text-white">Edit Trip</div>
        <button
          className="rounded-[7px] px-[11px] py-1 font-heading text-[12px] uppercase tracking-[.04em] cursor-pointer transition-all"
          style={{ background: 'rgba(255,255,255,.07)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
          onClick={() => { setEditFrom(''); setEditTo(''); dispatch({ type: 'CLOSE_EDIT' }); }}
          data-testid="button-close-edit"
        >
          Close <X className="w-3 h-3 inline" />
        </button>
      </div>
      <div className="px-[18px] pb-8">
        <div className="rounded-[9px] p-[9px_11px] mb-3 flex items-start gap-[7px]" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.28)' }}>
          <AlertTriangle className="w-[13px] h-[13px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-re)' }} />
          <div className="text-[10px] leading-[1.45]" style={{ color: 'rgba(239,68,68,.9)' }}>
            <strong style={{ color: 'var(--wc-re)' }}>All edits are timestamped and logged.</strong> Evidence is strongly recommended. Attach an odometer photo to strengthen your claim.
          </div>
        </div>

        <div className="flex gap-[5px] mb-3">
          {[
            { icon: Clock, label: 'Odo Photo' },
            { icon: Camera, label: 'Receipt' },
            { icon: MapPin, label: 'Notes' },
          ].map(ev => (
            <div key={ev.label} className="flex-1 rounded-lg p-[7px_5px] cursor-pointer transition-all text-center" style={{ background: 'rgba(245,196,0,.05)', border: '1px solid rgba(245,196,0,.2)' }}>
              <ev.icon className="w-[15px] h-[15px] mx-auto mb-[2px]" style={{ color: 'var(--wc-y)' }} />
              <div className="font-heading text-[10px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>{ev.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-1" style={{ color: 'var(--wc-t3)' }}>From Address</label>
          <AddressInput
            className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none transition-all"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={editFrom}
            onChange={setEditFrom}
            data-testid="input-edit-from"
          />
        </div>

        {stops.map((s, i) => (
          <div key={i} className="flex items-center gap-[5px] mb-1">
            <AddressInput
              className="w-full rounded-[7px] p-[6px_9px] text-[12px] text-white outline-none"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)', flex: 1 }}
              placeholder={`Stop ${i + 1} address`}
              value={s}
              onChange={v => { const n = [...stops]; n[i] = v; setStops(n); }}
            />
            <button className="rounded-[6px] p-[5px_7px] text-[11px] cursor-pointer" style={{ background: 'var(--wc-red)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--wc-re)' }} onClick={() => { const n = [...stops]; n.splice(i, 1); setStops(n); }}>X</button>
          </div>
        ))}
        <div className="flex gap-[5px] mb-[10px]">
          <button className="flex-1 rounded-[7px] p-[6px_10px] font-heading font-semibold text-[11px] uppercase tracking-[.04em] cursor-pointer transition-all" style={{ background: 'rgba(255,255,255,.03)', border: '1px dashed var(--wc-border)', color: 'var(--wc-t2)' }} onClick={() => setStops([...stops, ''])} data-testid="button-add-stop">+ Add Stop</button>
          {(stops.filter(s => s.length > 3).length > 0 || editFrom !== `${trip.from}, ${trip.fromSub}` || editTo !== `${trip.to}, ${trip.toSub}`) && (
            <button
              className="rounded-[7px] p-[6px_10px] font-heading font-semibold text-[11px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center gap-[4px]"
              style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.25)', color: 'var(--wc-y)' }}
              onClick={calcRoute}
              data-testid="button-calc-route"
            >
              <MapPin className="w-[11px] h-[11px]" />
              {calcStatus === 'loading' ? 'Calculating...' : 'Calc Route'}
            </button>
          )}
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-1" style={{ color: 'var(--wc-t3)' }}>To Address</label>
          <AddressInput
            className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none transition-all"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={editTo}
            onChange={setEditTo}
            data-testid="input-edit-to"
          />
        </div>

        <div className="flex gap-[7px] mb-[10px]">
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-1" style={{ color: 'var(--wc-t3)' }}>Distance (km)</label>
            <input className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none" type="number" step="0.1" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }} value={editKm} onChange={e => setEditKm(e.target.value)} data-testid="input-edit-km" />
          </div>
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-1" style={{ color: 'var(--wc-t3)' }}>Duration</label>
            <input className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }} value={editDur} onChange={e => setEditDur(e.target.value)} />
          </div>
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-1" style={{ color: 'var(--wc-t3)' }}>Purpose / Notes</label>
          <textarea className="w-full rounded-lg p-[8px_11px] text-[11px] text-white outline-none resize-none h-[50px]" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }} value={editPurpose} onChange={e => setEditPurpose(e.target.value)} placeholder="e.g. Tool pickup for client job at Sunshine site" data-testid="input-edit-purpose" />
        </div>

        <div className="rounded-lg p-[9px_12px] mb-[10px]" style={{ background: 'rgba(245,196,0,.04)', border: '1px solid rgba(245,196,0,.14)' }}>
          <div className="flex justify-between items-center">
            <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Total Distance</span>
            <span className="font-heading font-extrabold text-[15px]" style={{ color: 'var(--wc-y)' }}>{totalKm.toFixed(1)} km</span>
          </div>
          <div className="h-px my-[5px]" style={{ background: 'rgba(255,255,255,.05)' }} />
          <div className="flex justify-between items-center">
            <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Cents/km ($0.88)</span>
            <span className="font-heading font-extrabold text-[15px]" style={{ color: 'var(--wc-y)' }}>${cpm.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Logbook (70% biz)</span>
            <span className="font-heading font-extrabold text-[15px]" style={{ color: 'var(--wc-y)' }}>${log.toFixed(2)}</span>
          </div>
          {calcStatus === 'loading' && (
            <div className="text-[9px] mt-[3px] flex items-center gap-[4px]" style={{ color: 'var(--wc-y)' }}>
              <div className="w-[8px] h-[8px] rounded-full border-[1.5px] border-transparent animate-spin" style={{ borderTopColor: 'var(--wc-y)' }} />
              Calculating route via Google Maps...
            </div>
          )}
          {calcStatus === 'done' && routeKm !== null && (
            <div className="text-[9px] mt-[3px] flex items-center gap-[4px]" style={{ color: 'var(--wc-gr)' }}>
              <Check className="w-[9px] h-[9px]" />
              Route calculated: {routeKm.toFixed(1)} km{routeDur ? `, ${routeDur}` : ''}
            </div>
          )}
          {calcStatus === 'error' && (
            <div className="text-[9px] mt-[3px]" style={{ color: 'var(--wc-re)' }}>Could not calculate route. Check addresses and try again.</div>
          )}
          {calcStatus === 'idle' && (
            <div className="text-[9px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Add a stop or change addresses, then press Calc Route</div>
          )}
        </div>

        <button
          className="w-full rounded-[10px] py-[11px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase text-black cursor-pointer transition-all"
          style={{ background: 'var(--wc-y)' }}
          onClick={handleSave}
          data-testid="button-save-edit"
        >
          Save Changes
        </button>
      </div>
    </ModalOverlay>
  );
}

export function ATOModal() {
  const { state, dispatch } = useApp();

  return (
    <ModalOverlay open={state.atoModalOpen} onClose={() => dispatch({ type: 'CLOSE_ATO' })}>
      <div className="w-[36px] h-1 rounded-[2px] mx-auto mt-3 mb-2" style={{ background: 'var(--wc-t3)' }} />
      <div className="px-[18px] pb-8">
        <div className="font-heading font-black text-[20px] uppercase tracking-[.04em] mb-[2px]" style={{ color: 'var(--wc-y)' }}>ATO Compliance Notice</div>
        <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[13px]" style={{ color: 'var(--wc-t3)' }}>Tax Ruling TR 2021/1 &middot; FY2024-25</div>
        <div className="text-[11px] leading-[1.6] flex flex-col gap-2" style={{ color: 'var(--wc-t2)' }}>
          <p><strong className="text-white">Cents per km:</strong> $0.88/km (FY2024-25). No receipts needed, but capped at 5,000 km ($4,400 max). Simple &mdash; but leaves money on the table.</p>
          <p><strong className="text-white">Logbook method:</strong> Business use % x actual vehicle expenses (fuel, rego, insurance, depreciation, etc). <em>No kilometre cap.</em> Requires a 12-week logbook &mdash; which WorkCar helps you build. For most tradies, this method returns a significantly larger deduction.</p>
          <p><strong className="text-white">Estimates only.</strong> Final amounts depend on your individual tax circumstances. Confirm with a registered tax agent before lodging.</p>
          <p style={{ color: 'rgba(239,68,68,.7)', fontWeight: 600 }}>False claims are a serious offence under the Income Tax Assessment Act 1997. WorkCar maintains an immutable, timestamped audit trail of all classifications and edits.</p>
        </div>
        <button
          className="w-full rounded-[9px] py-[9px] font-heading font-bold text-[13px] tracking-[.06em] uppercase cursor-pointer mt-3 transition-all"
          style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
          onClick={() => dispatch({ type: 'CLOSE_ATO' })}
          data-testid="button-close-ato"
        >
          Understood
        </button>
      </div>
    </ModalOverlay>
  );
}

export function SummaryModal() {
  const { state, dispatch } = useApp();
  const stats = useComputedStats();
  const [showAuditBreakdown, setShowAuditBreakdown] = useState(false);
  const NUM_DIGITS = 6;
  const toDigits = (n: number): number[] => {
    const s = String(Math.max(0, Math.floor(n))).padStart(NUM_DIGITS, '0');
    return s.slice(-NUM_DIGITS).split('').map(Number);
  };
  const lastSavedOdo = state.savedReports.find(r => r.lastOdoReading)?.lastOdoReading;
  const [odoDigits, setOdoDigits] = useState<number[]>(() =>
    toDigits(state.lastOdoReading || lastSavedOdo || 0)
  );
  const digitsToNum = (d: number[]) => parseInt(d.join(''), 10);
  const spinDigit = (idx: number, dir: 1 | -1) => {
    setOdoDigits(prev => {
      const next = [...prev];
      next[idx] = (next[idx] + dir + 10) % 10;
      return next;
    });
    setOdoSaved(false);
  };
  const [odoSaved, setOdoSaved] = useState(false);
  const [rollDone, setRollDone] = useState(false);
  const lastReading = state.lastOdoReading;
  useEffect(() => {
    if (lastReading) setOdoDigits(toDigits(lastReading));
  }, [lastReading]);

  const [barFill, setBarFill] = useState(0);
  useEffect(() => {
    if (state.summaryModalOpen) {
      setRollDone(false);
      setBarFill(0);
      const t1 = setTimeout(() => setRollDone(true), 1800);
      const t2 = setTimeout(() => setBarFill(100), 50);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [state.summaryModalOpen]);

  if (!state.summaryModalOpen) return null;

  const biz = state.trips.filter(t => t.type === 'business');
  const sessionKm = biz.reduce((s, t) => s + t.km, 0);
  const sessionDed = Math.round(state.dedTotal);
  const photoCount = state.trips.filter(t => t.photo).length;
  const score = stats.auditScore;
  const scoreCol = score > 85 ? 'var(--wc-gr)' : score > 70 ? 'var(--wc-am)' : 'var(--wc-re)';

  const tripDates = state.trips.map(t => new Date(t.year, t.month, t.day).getTime());
  const earliestTrip = tripDates.length > 0 ? Math.min(...tripDates) : Date.now();
  const latestTrip = tripDates.length > 0 ? Math.max(...tripDates) : Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const logbookStart = new Date(earliestTrip);
  const weeksElapsed = Math.min(12, Math.max(0, (latestTrip - earliestTrip) / msPerWeek));
  const weeksDone = Math.max(1, Math.floor(weeksElapsed));
  const pct = Math.round((weeksElapsed / 12) * 100);
  const weeksLeft = 12 - weeksDone;
  const dueDate = new Date(earliestTrip + 12 * msPerWeek);
  const dueFmt = dueDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <ModalOverlay open={state.summaryModalOpen} onClose={() => dispatch({ type: 'CLOSE_SUMMARY' })}>
      <div className="pt-5 pb-6 flex flex-col" style={{ maxHeight: '100%' }}>
        <div className="flex items-center gap-[14px] px-[20px] mb-4">
          <div
            className="w-[56px] h-[56px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ border: `3px solid ${scoreCol}`, background: score > 85 ? 'rgba(34,197,94,.08)' : 'rgba(245,196,0,.08)' }}
          >
            <span className="font-heading font-black text-[20px]" style={{ color: scoreCol }} data-testid="text-summary-score">{score}%</span>
          </div>
          <div>
            <div className="font-heading font-black text-[22px] uppercase text-white leading-none">Session Complete</div>
            <div className="text-[13px] mt-[3px]" style={{ color: 'var(--wc-t2)' }}>You sorted {state.trips.filter(t => t.type !== null).length} trips this session.</div>
            <div className="font-data text-[9px] uppercase tracking-[.1em] mt-[2px]" style={{ color: scoreCol }}>Audit Score: {score}%</div>
          </div>
        </div>

        <div className="flex gap-[8px] px-[20px] mb-4">
          <div className="flex-1 rounded-[12px] p-[12px_10px] text-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Distance</div>
            <div className="font-heading font-black text-[20px] leading-tight" style={{ color: 'var(--wc-y)' }}>{sessionKm.toFixed(1)} km</div>
          </div>
          <div className="flex-1 rounded-[12px] p-[12px_10px] text-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Deduction</div>
            <div className="font-heading font-black text-[20px] leading-tight" style={{ color: 'var(--wc-gr)' }}>${sessionDed.toLocaleString('en-AU')}</div>
          </div>
          <div className="flex-1 rounded-[12px] p-[12px_10px] text-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Photos</div>
            <div className="font-heading font-black text-[20px] leading-tight" style={{ color: photoCount > 0 ? 'var(--wc-gr)' : 'var(--wc-t3)' }}>{photoCount}</div>
          </div>
        </div>

        <div className="mx-[20px] mb-4 rounded-[14px] p-[14px_16px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="flex items-center gap-[8px] mb-[10px]">
            <Gauge className="w-[18px] h-[18px]" style={{ color: 'var(--wc-am)' }} />
            <span className="font-heading font-bold text-[15px] uppercase tracking-[.04em] text-white">Odometer</span>
            {state.lastOdoVerifiedAt && (
              <span className="ml-auto font-data uppercase tracking-[.08em] text-[12px] text-white">
                verified {state.lastOdoVerifiedAt}
              </span>
            )}
          </div>

          <div className="rounded-[12px] p-[8px_6px] mb-[10px]" style={{ background: '#0a0a0a', border: '2px solid rgba(255,255,255,.1)', boxShadow: 'inset 0 3px 12px rgba(0,0,0,.7)' }}>
            <div className="flex justify-center gap-[3px]" data-testid="input-manual-odo">
              {odoDigits.map((digit, i) => {
                const rollNumbers = Array.from({ length: 10 }, (_, n) => n);
                const delay = (NUM_DIGITS - 1 - i) * 0.15;
                const duration = 0.8 + (NUM_DIGITS - 1 - i) * 0.15;
                return (
                  <div key={i} className="flex flex-col items-center" style={{ width: '52px' }}>
                    <button
                      className="w-full h-[30px] flex items-center justify-center cursor-pointer rounded-t-[8px] transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,.06)' }}
                      onClick={() => spinDigit(i, 1)}
                      data-testid={`button-odo-up-${i}`}
                    >
                      <ChevronUp className="w-[18px] h-[18px]" style={{ color: 'var(--wc-t3)' }} />
                    </button>
                    <div
                      className="w-full h-[56px] overflow-hidden relative"
                      style={{
                        background: i < NUM_DIGITS - 1
                          ? 'linear-gradient(180deg, #1a1a1a 0%, #222 40%, #222 60%, #1a1a1a 100%)'
                          : 'linear-gradient(180deg, #2a1800 0%, #3a2000 40%, #3a2000 60%, #2a1800 100%)',
                        borderTop: '1.5px solid rgba(255,255,255,.08)',
                        borderBottom: '1.5px solid rgba(255,255,255,.08)',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,.5)',
                      }}
                    >
                      {!rollDone ? (
                        <div
                          className="flex flex-col items-center"
                          style={{
                            animation: `odoRoll${digit} ${duration}s cubic-bezier(.2,.8,.3,1) ${delay}s both`,
                          }}
                        >
                          {rollNumbers.concat(rollNumbers).concat(rollNumbers.slice(0, digit + 1)).map((n, j) => (
                            <div
                              key={j}
                              className="w-full h-[56px] flex items-center justify-center font-data font-black text-[36px] select-none flex-shrink-0"
                              style={{
                                color: i < NUM_DIGITS - 1 ? '#fff' : 'var(--wc-am)',
                                textShadow: '0 0 12px rgba(255,255,255,.2)',
                              }}
                            >
                              {n}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="w-full h-[56px] flex items-center justify-center font-data font-black text-[36px] select-none"
                          style={{
                            color: i < NUM_DIGITS - 1 ? '#fff' : 'var(--wc-am)',
                            textShadow: '0 0 12px rgba(255,255,255,.2)',
                          }}
                        >
                          {digit}
                        </div>
                      )}
                    </div>
                    <button
                      className="w-full h-[30px] flex items-center justify-center cursor-pointer rounded-b-[8px] transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,.06)' }}
                      onClick={() => spinDigit(i, -1)}
                      data-testid={`button-odo-down-${i}`}
                    >
                      <ChevronDown className="w-[18px] h-[18px]" style={{ color: 'var(--wc-t3)' }} />
                    </button>
                  </div>
                );
              })}
              <div className="flex flex-col items-center justify-center" style={{ width: '24px' }}>
                <div className="h-[30px]" />
                <div className="h-[56px] flex items-end pb-[8px]">
                  <span className="font-data text-[12px] font-bold" style={{ color: 'var(--wc-t3)' }}>km</span>
                </div>
                <div className="h-[30px]" />
              </div>
            </div>
          </div>

          {odoSaved ? (
            <div
              className="w-full rounded-[8px] py-[8px] font-heading font-bold text-[11px] tracking-[.05em] uppercase flex items-center justify-center gap-2 transition-all"
              style={{
                background: 'rgba(34,197,94,.12)',
                border: '1.5px solid rgba(34,197,94,.3)',
                color: 'var(--wc-gr)',
                animation: 'odoSavedPop .4s ease-out',
              }}
              data-testid="odo-saved-confirm"
            >
              <Check className="w-[14px] h-[14px]" strokeWidth={2.5} />
              Saved
            </div>
          ) : (
            <button
              className="w-full rounded-[8px] py-[8px] font-heading font-bold text-[11px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.97]"
              style={{ background: 'rgba(245,158,11,.12)', border: '1.5px solid rgba(245,158,11,.3)', color: 'var(--wc-am)' }}
              onClick={() => {
                const val = digitsToNum(odoDigits);
                if (val > 0) {
                  dispatch({ type: 'SET_MANUAL_ODO', reading: val });
                  setOdoSaved(true);
                }
              }}
              data-testid="button-save-odo"
            >
              Save Odometer Reading
            </button>
          )}
        </div>

        <div className="mx-[20px] mb-4 rounded-[12px] p-[12px_14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="flex items-baseline justify-between mb-[6px]">
            <div className="text-[13px] text-white">
              <span className="font-heading font-black text-[20px]">{weeksDone}</span> / 12 weeks
            </div>
            <span className="font-heading font-black text-[18px]" style={{ color: 'var(--wc-y)' }}>{pct}%</span>
          </div>
          <div className="h-[6px] rounded-[3px] overflow-hidden mb-[6px]" style={{ background: 'rgba(255,255,255,.07)' }}>
            <div className="h-full rounded-[3px]" style={{ width: `${Math.min(barFill, pct)}%`, background: 'linear-gradient(90deg,var(--wc-y),#ffe066)', transition: 'width 1.2s cubic-bezier(.25,.8,.25,1)' }} />
          </div>
          <div className="text-[11px] text-white">
            Due <strong>{dueFmt}</strong> &middot; {weeksLeft > 0 ? `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} to go` : 'Logbook complete'}
          </div>
        </div>

        <div className="px-[20px] flex flex-col gap-[8px]">
          <button
            className="w-full rounded-[12px] py-[16px] font-heading font-black text-[20px] tracking-[.07em] uppercase text-black cursor-pointer flex items-center justify-center gap-2 transition-all"
            style={{ background: 'var(--wc-y)', boxShadow: '0 4px 20px rgba(245,196,0,.2)' }}
            onClick={() => dispatch({ type: 'SAVE_SESSION' })}
            data-testid="button-save-session"
          >
            <Check className="w-[20px] h-[20px]" strokeWidth={2.5} />
            Save &amp; Generate Report
          </button>
          <button
            className="w-full rounded-[12px] py-[14px] font-heading font-bold text-[16px] tracking-[.05em] uppercase cursor-pointer flex items-center justify-center gap-2 transition-all"
            style={{ background: 'rgba(255,255,255,.04)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
            onClick={() => setShowAuditBreakdown(true)}
            data-testid="button-understand-audit"
          >
            <ShieldCheck className="w-[18px] h-[18px]" style={{ color: scoreCol }} />
            Understand Your Audit Score
          </button>
          <button
            className="w-full rounded-[12px] py-[14px] font-heading font-bold text-[16px] tracking-[.05em] uppercase cursor-pointer transition-all"
            style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
            onClick={() => dispatch({ type: 'CLOSE_SUMMARY' })}
            data-testid="button-back-modify"
          >
            &larr; Go Back &amp; Modify
          </button>
          <button
            className="w-full rounded-[12px] py-[14px] font-heading font-bold text-[16px] tracking-[.05em] uppercase cursor-pointer transition-all"
            style={{ background: 'transparent', color: 'var(--wc-t3)' }}
            onClick={() => { dispatch({ type: 'CLOSE_SUMMARY' }); dispatch({ type: 'GO_SCREEN', screen: 'sort' }); }}
            data-testid="button-exit-no-save"
          >
            Exit Without Saving
          </button>
        </div>
      </div>
      {showAuditBreakdown && (
        <div
          className="absolute inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowAuditBreakdown(false)}
          data-testid="audit-breakdown-overlay"
        >
          <div
            className="w-[350px] rounded-[20px] p-[20px] flex flex-col gap-[14px]"
            style={{ background: 'var(--wc-card)', border: '1.5px solid var(--wc-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[8px]">
                <ShieldCheck className="w-[22px] h-[22px]" style={{ color: scoreCol }} />
                <span className="font-heading font-extrabold text-[18px] uppercase tracking-[.04em] text-white">Audit Score</span>
              </div>
              <button
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
                onClick={() => setShowAuditBreakdown(false)}
                data-testid="button-close-audit"
              >
                <X className="w-[14px] h-[14px] text-white" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-[10px] py-[10px]">
              <div className="font-heading font-black text-[56px] leading-none" style={{ color: scoreCol }}>{score}</div>
              <div className="flex flex-col">
                <span className="font-data text-[11px] uppercase tracking-[.08em] text-white">out of</span>
                <span className="font-heading font-black text-[28px] leading-none text-white">99</span>
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              {(() => {
                const photoPoints = state.trips.filter(t => t.photo).length * 2;
                const verifiedPoints = state.trips.filter(t => t.verified && !t.photo).length;
                const odoPoints = Math.min(state.verifiedSet.size, 20);
                const basePoints = 50;
                const items = [
                  { label: 'Base Score', points: basePoints, max: 50, desc: 'Starting score for all logbooks', icon: Target },
                  { label: 'Photo Evidence', points: photoPoints, max: null, desc: `${state.trips.filter(t => t.photo).length} photos (+2 pts each)`, icon: Camera },
                  { label: 'Verified Trips', points: verifiedPoints, max: null, desc: `${state.trips.filter(t => t.verified && !t.photo).length} verified (+1 pt each)`, icon: Check },
                  { label: 'Odometer Checks', points: odoPoints, max: 20, desc: `${state.verifiedSet.size} readings (max 20 pts)`, icon: Gauge },
                ];
                return items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="rounded-[10px] p-[10px_12px] flex items-center gap-[10px]" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)' }} data-testid={`audit-item-${i}`}>
                      <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,196,0,.1)' }}>
                        <Icon className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-bold text-[13px] text-white">{item.label}</div>
                        <div className="font-data text-[10px] text-white/60">{item.desc}</div>
                      </div>
                      <div className="font-heading font-black text-[18px] flex-shrink-0" style={{ color: item.points > 0 ? 'var(--wc-gr)' : 'var(--wc-t3)' }}>+{item.points}</div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="rounded-[10px] p-[10px_14px] flex items-center justify-between" style={{ background: score > 85 ? 'rgba(34,197,94,.08)' : score > 70 ? 'rgba(245,158,11,.08)' : 'rgba(239,68,68,.08)', border: `1px solid ${score > 85 ? 'rgba(34,197,94,.2)' : score > 70 ? 'rgba(245,158,11,.2)' : 'rgba(239,68,68,.2)'}` }}>
              <span className="font-data text-[10px] uppercase tracking-[.08em] text-white">
                {score > 85 ? 'Strong — ready for ATO review' : score > 70 ? 'Good — add more evidence to strengthen' : 'Needs work — add photos & verify odometers'}
              </span>
            </div>

            <button
              className="w-full py-[12px] rounded-[12px] font-heading font-bold text-[14px] uppercase tracking-[.06em]"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)', color: 'white' }}
              onClick={() => setShowAuditBreakdown(false)}
              data-testid="button-close-audit-bottom"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}
