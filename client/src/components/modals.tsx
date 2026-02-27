import { useState, useEffect, useRef } from 'react';
import { useApp, useComputedStats } from '@/lib/app-context';
import { RATE, getTripOdoEnd } from '@/lib/trip-data';
import { X, Check, AlertTriangle, Clock, Camera, MapPin, Settings, Trophy, Target, Gauge, Minus, Plus } from 'lucide-react';

function ModalOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-[100] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90%] rounded-t-[28px] overflow-y-auto scrollbar-thin"
        style={{ background: 'var(--wc-bg)', border: '1px solid var(--wc-border)', borderBottom: 'none' }}
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
    }
  }, [state.editModalOpen, state.editTripIndex, trip]);

  if (!state.editModalOpen || !trip) return null;

  const km = parseFloat(editKm) || 0;
  const stopEst = stops.filter(s => s.length > 3).length * 2.5;
  const totalKm = km + stopEst;
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
        km: parseFloat(editKm) || trip.km,
        duration: editDur || trip.duration,
        purposeLabel: editPurpose || trip.purposeLabel,
      },
    });
    dispatch({ type: 'ADD_LOG', desc: `Trip edited: ${fromParts[0].trim()} \u2192 ${toParts[0].trim()}`, hasPhoto: false });
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
          <input
            className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none transition-all"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={editFrom}
            onChange={e => setEditFrom(e.target.value)}
            data-testid="input-edit-from"
          />
        </div>

        {stops.map((s, i) => (
          <div key={i} className="flex items-center gap-[5px] mb-1">
            <input
              className="flex-1 rounded-[7px] p-[6px_9px] text-[12px] text-white outline-none"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
              placeholder={`Stop ${i + 1} address`}
              value={s}
              onChange={e => { const n = [...stops]; n[i] = e.target.value; setStops(n); }}
            />
            <button className="rounded-[6px] p-[5px_7px] text-[11px] cursor-pointer" style={{ background: 'var(--wc-red)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--wc-re)' }} onClick={() => { const n = [...stops]; n.splice(i, 1); setStops(n); }}>X</button>
          </div>
        ))}
        <button className="w-full rounded-[7px] p-[6px_10px] font-heading font-semibold text-[11px] uppercase tracking-[.04em] cursor-pointer mb-[10px] transition-all" style={{ background: 'rgba(255,255,255,.03)', border: '1px dashed var(--wc-border)', color: 'var(--wc-t2)' }} onClick={() => setStops([...stops, ''])} data-testid="button-add-stop">+ Add Stop</button>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-1" style={{ color: 'var(--wc-t3)' }}>To Address</label>
          <input
            className="w-full rounded-lg p-[8px_11px] text-[12px] text-white outline-none transition-all"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={editTo}
            onChange={e => setEditTo(e.target.value)}
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
          <div className="text-[9px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Figures update in real time as you edit distance or add stops</div>
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
  const [manualOdo, setManualOdo] = useState('');

  if (!state.summaryModalOpen) return null;

  const biz = state.trips.filter(t => t.type === 'business');
  const sessionKm = biz.reduce((s, t) => s + t.km, 0);
  const sessionDed = Math.round(state.dedTotal);
  const photoCount = state.trips.filter(t => t.photo).length;
  const score = stats.auditScore;
  const scoreCol = score > 85 ? 'var(--wc-gr)' : score > 70 ? 'var(--wc-am)' : 'var(--wc-re)';

  const LOGBOOK_START = new Date('2026-01-09');
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.min(12, Math.max(0, (now.getTime() - LOGBOOK_START.getTime()) / msPerWeek));
  const weeksDone = Math.floor(weeksElapsed);
  const pct = Math.round((weeksElapsed / 12) * 100);
  const weeksLeft = 12 - weeksDone;
  const dueDate = new Date(LOGBOOK_START.getTime() + 12 * msPerWeek);
  const dueFmt = dueDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <ModalOverlay open={state.summaryModalOpen} onClose={() => dispatch({ type: 'CLOSE_SUMMARY' })}>
      <div className="pt-4 pb-8 overflow-y-auto max-h-[85vh] scrollbar-thin">
        <div className="flex flex-col items-center gap-3 px-[18px] mb-4">
          <div
            className="w-[64px] h-[64px] rounded-full flex items-center justify-center"
            style={{ border: `3px solid ${scoreCol}`, background: score > 85 ? 'rgba(34,197,94,.08)' : 'rgba(245,196,0,.08)' }}
          >
            <span className="font-heading font-black text-[22px]" style={{ color: scoreCol }} data-testid="text-summary-score">{score}%</span>
          </div>
          <div className="font-heading font-black text-[24px] uppercase text-white text-center leading-none">Session Complete</div>
          <div className="text-[12px] text-center" style={{ color: 'var(--wc-t2)' }}>You sorted {state.trips.length} trips this session.</div>
        </div>

        <div className="flex gap-2 px-[18px] mb-4">
          <div className="flex-1 rounded-[12px] p-[10px] text-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="font-data text-[7px] uppercase tracking-[.1em] mb-1" style={{ color: 'var(--wc-t3)' }}>Distance</div>
            <div className="font-heading font-black text-[18px]" style={{ color: 'var(--wc-y)' }}>{sessionKm.toFixed(1)} km</div>
          </div>
          <div className="flex-1 rounded-[12px] p-[10px] text-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="font-data text-[7px] uppercase tracking-[.1em] mb-1" style={{ color: 'var(--wc-t3)' }}>Deduction</div>
            <div className="font-heading font-black text-[18px]" style={{ color: 'var(--wc-gr)' }}>${sessionDed.toLocaleString('en-AU')}</div>
          </div>
          <div className="flex-1 rounded-[12px] p-[10px] text-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="font-data text-[7px] uppercase tracking-[.1em] mb-1" style={{ color: 'var(--wc-t3)' }}>Photos</div>
            <div className="font-heading font-black text-[18px]" style={{ color: photoCount > 0 ? 'var(--wc-gr)' : 'var(--wc-t3)' }}>{photoCount}</div>
          </div>
        </div>

        <div className="mx-[18px] mb-4 rounded-[14px] p-[16px_16px_18px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="flex items-center gap-[8px] mb-[14px]">
            <Gauge className="w-[20px] h-[20px]" style={{ color: 'var(--wc-am)' }} />
            <span className="font-heading font-bold text-[15px] uppercase tracking-[.04em] text-white">Odometer</span>
            {state.lastOdoVerifiedAt && (
              <span className="ml-auto font-data text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>
                verified {state.lastOdoVerifiedAt}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-[12px] mb-[14px]">
            <button
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--wc-border)' }}
              onClick={() => {
                const cur = parseInt(manualOdo) || state.lastOdoReading || 0;
                if (cur > 0) setManualOdo(String(cur - 1));
              }}
              data-testid="button-odo-minus"
            >
              <Minus className="w-[22px] h-[22px]" style={{ color: 'var(--wc-t2)' }} />
            </button>

            <div className="flex-1 max-w-[200px]">
              <input
                type="number"
                className="w-full text-center rounded-[12px] px-[10px] py-[14px] font-heading font-black text-[28px] text-white outline-none"
                style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid var(--wc-border)', caretColor: 'var(--wc-am)' }}
                value={manualOdo || (state.lastOdoReading ? String(state.lastOdoReading) : '')}
                onChange={e => setManualOdo(e.target.value)}
                placeholder="0"
                data-testid="input-manual-odo"
              />
              <div className="text-center font-data text-[10px] uppercase tracking-[.1em] mt-[6px]" style={{ color: 'var(--wc-t3)' }}>
                kilometres
              </div>
            </div>

            <button
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              style={{ background: 'rgba(245,158,11,.1)', border: '1.5px solid rgba(245,158,11,.3)' }}
              onClick={() => {
                const cur = parseInt(manualOdo) || state.lastOdoReading || 0;
                setManualOdo(String(cur + 1));
              }}
              data-testid="button-odo-plus"
            >
              <Plus className="w-[22px] h-[22px]" style={{ color: 'var(--wc-am)' }} />
            </button>
          </div>

          {!state.lastOdoVerifiedAt && !manualOdo && (
            <div className="text-center text-[11px] mb-[10px]" style={{ color: 'var(--wc-t3)' }}>
              No odometer verified yet this session
            </div>
          )}

          <button
            className="w-full rounded-[10px] py-[12px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.97]"
            style={{ background: 'rgba(245,158,11,.12)', border: '1.5px solid rgba(245,158,11,.3)', color: 'var(--wc-am)' }}
            onClick={() => {
              const val = parseInt(manualOdo) || state.lastOdoReading;
              if (val && val > 0) {
                dispatch({ type: 'SET_MANUAL_ODO', reading: val });
                setManualOdo('');
              }
            }}
            data-testid="button-save-odo"
          >
            Save Odometer Reading
          </button>
        </div>

        <div className="mx-[18px] mb-4">
          <div className="font-heading font-bold text-[14px] uppercase tracking-[.04em] text-white mb-2">12-week Logbook Progress</div>
          <div className="rounded-[12px] p-[12px_14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[13px]" style={{ color: 'var(--wc-t2)' }}>
                <span className="font-heading font-black text-[20px] text-white">{weeksDone}</span> / 12 weeks
              </div>
              <span className="font-heading font-black text-[18px]" style={{ color: 'var(--wc-y)' }}>{pct}%</span>
            </div>
            <div className="h-[6px] rounded-[3px] overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,.07)' }}>
              <div className="h-full rounded-[3px] transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--wc-y),#ffe066)' }} />
            </div>
            <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>
              Due <strong className="text-white">{dueFmt}</strong> &middot; {weeksLeft > 0 ? `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} to go` : 'Logbook complete'}
            </div>
          </div>
        </div>

        <div className="mx-[18px] mb-4 rounded-[12px] p-[13px_14px] flex gap-[10px] items-center" style={{ background: 'rgba(245,196,0,.05)', border: '1px solid rgba(245,196,0,.15)' }}>
          <Target className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
          <div className="text-[12px] leading-[1.55]" style={{ color: 'var(--wc-t2)' }}>
            Every trip sorted now means a <strong style={{ color: 'var(--wc-y)' }}>bigger, faster claim</strong> at tax time. Check back soon.
          </div>
        </div>

        <div className="px-[18px] flex flex-col gap-[7px]">
          <button
            className="w-full rounded-[13px] py-[14px] font-heading font-black text-[17px] tracking-[.07em] uppercase text-black cursor-pointer flex items-center justify-center gap-2 transition-all"
            style={{ background: 'var(--wc-y)', boxShadow: '0 4px 20px rgba(245,196,0,.2)' }}
            onClick={() => dispatch({ type: 'SAVE_SESSION' })}
            data-testid="button-save-session"
          >
            <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Save &amp; Return to Dashboard
          </button>
          <button
            className="w-full rounded-[13px] py-[11px] font-heading font-bold text-[14px] tracking-[.05em] uppercase cursor-pointer transition-all"
            style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t3)' }}
            onClick={() => dispatch({ type: 'CLOSE_SUMMARY' })}
            data-testid="button-ignore-summary"
          >
            Ignore &amp; Continue
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
