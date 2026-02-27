import { useState, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { CATEGORIES, RATE } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, Wrench, Building2, Package, ClipboardList, Handshake, Store, Zap, FileText, GraduationCap, Landmark, Check } from 'lucide-react';

const iconMap: Record<string, typeof Wrench> = {
  Wrench, Building2, Package, ClipboardList, Handshake, Store, Zap, FileText, GraduationCap, Landmark,
};

export function ClassifyScreen() {
  const { state, dispatch } = useApp();
  const [armed, setArmed] = useState<number | null>(null);
  const [customText, setCustomText] = useState('');
  const [customArmed, setCustomArmed] = useState(false);
  const [microOpen, setMicroOpen] = useState(false);
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
        className="mx-[14px] mb-2 rounded-[14px] overflow-hidden flex-shrink-0 cursor-pointer transition-all"
        style={{
          background: 'var(--wc-card)',
          border: justAdvanced ? '1.5px solid rgba(245,196,0,.85)' : '1.5px solid rgba(245,196,0,.5)',
          boxShadow: justAdvanced ? '0 0 20px rgba(245,196,0,.35), 0 0 40px rgba(245,196,0,.12)' : '0 0 14px rgba(245,196,0,.15), 0 0 30px rgba(245,196,0,.06)',
          transition: 'border .6s ease, box-shadow .6s ease',
        }}
        onClick={() => setMicroOpen(!microOpen)}
        data-testid="classify-trip-card"
      >
        <div className="flex items-center gap-2 p-[9px_12px]">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[12px] text-white truncate">{trip.from} &rarr; {trip.to}</div>
            <div className="text-[11px] truncate" style={{ color: 'var(--wc-t3)' }}>{trip.date} &middot; {trip.km} km &middot; {trip.duration}</div>
          </div>
          <div className="font-heading font-extrabold text-[16px] flex-shrink-0" style={{ color: 'var(--wc-gr)' }}>+${(trip.km * RATE).toFixed(2)}</div>
          <div className="text-[14px] flex-shrink-0 transition-transform" style={{ color: 'var(--wc-t3)', transform: microOpen ? 'rotate(180deg)' : 'none' }}>&or;</div>
        </div>
        {microOpen && (
          <div className="p-[0_12px_12px] border-t" style={{ borderColor: 'var(--wc-border)' }} onClick={e => e.stopPropagation()}>
            <div className="flex gap-[7px] mb-[6px] mt-2">
              <div className="flex-1">
                <span className="font-data text-[7px] uppercase tracking-[.09em] block mb-1" style={{ color: 'var(--wc-t3)' }}>From</span>
                <input className="w-full rounded-lg px-[9px] py-[6px] text-[12px] text-white outline-none transition-all" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }} defaultValue={`${trip.from}, ${trip.fromSub}`} />
              </div>
              <div className="flex-1">
                <span className="font-data text-[7px] uppercase tracking-[.09em] block mb-1" style={{ color: 'var(--wc-t3)' }}>To</span>
                <input className="w-full rounded-lg px-[9px] py-[6px] text-[12px] text-white outline-none transition-all" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }} defaultValue={`${trip.to}, ${trip.toSub}`} />
              </div>
            </div>
            <div className="flex gap-[7px]">
              <div className="flex-1">
                <span className="font-data text-[7px] uppercase tracking-[.09em] block mb-1" style={{ color: 'var(--wc-t3)' }}>Distance (km)</span>
                <input className="w-full rounded-lg px-[9px] py-[6px] text-[12px] text-white outline-none" type="number" step="0.1" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }} defaultValue={trip.km} />
              </div>
              <div className="flex-1">
                <span className="font-data text-[7px] uppercase tracking-[.09em] block mb-1" style={{ color: 'var(--wc-t3)' }}>Duration</span>
                <input className="w-full rounded-lg px-[9px] py-[6px] text-[12px] text-white outline-none" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }} defaultValue={trip.duration} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-[14px] grid grid-cols-2 gap-[7px] content-start overflow-y-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat, i) => {
          const isArmed = armed === i;
          const Icon = iconMap[cat.icon] || Wrench;
          return (
            <button
              key={i}
              className="rounded-[13px] p-[12px_10px] cursor-pointer transition-all flex flex-col items-center gap-[5px] text-center"
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

        <div className="col-span-2 flex gap-[7px] items-center rounded-[13px] p-[10px_12px] mt-[2px]" style={{ background: 'rgba(255,255,255,.03)', border: '1.5px dashed rgba(255,255,255,.1)' }}>
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
