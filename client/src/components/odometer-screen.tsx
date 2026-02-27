import { useState } from 'react';
import { useApp, useComputedStats } from '@/lib/app-context';
import { getTripOdoEnd } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, ChevronRight, Camera, Check, Shield, Image, Clock } from 'lucide-react';

export function OdometerScreen() {
  const { state, dispatch } = useApp();
  const stats = useComputedStats();
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);
  const [heroCollapsed, setHeroCollapsed] = useState(true);
  const [odoInputs, setOdoInputs] = useState<Record<number, string>>({});

  const score = stats.auditScore;
  const scoreFill = score > 80 ? 'linear-gradient(90deg,var(--wc-gr),#22ff88)' : score > 65 ? 'linear-gradient(90deg,var(--wc-am),var(--wc-gr))' : 'linear-gradient(90deg,var(--wc-re),var(--wc-am))';

  return (
    <div className="flex flex-col h-full" data-testid="odometer-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'review' })}
          data-testid="button-back-odo"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">Odometer</span>
        <span className="ml-auto text-[11px]" style={{ color: 'var(--wc-t3)' }}>{state.verifiedSet.size} of {state.trips.length} verified</span>
      </div>

      <div
        className="mx-[14px] mb-2 rounded-[12px] overflow-hidden flex-shrink-0 cursor-pointer transition-all"
        style={{ background: 'var(--wc-card)', border: '1px solid rgba(245,196,0,.2)' }}
        onClick={() => setHeroCollapsed(!heroCollapsed)}
        data-testid="odo-hero-card"
      >
        <div className="flex items-center gap-2 p-[10px_13px]">
          <Shield className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[14px] text-white flex-1 tracking-[.01em]">Audit Score</span>
          <div className="flex items-center gap-[5px] flex-shrink-0">
            <span className="font-heading font-black text-[18px]" style={{ color: 'var(--wc-gr)' }} data-testid="text-audit-score">{score}%</span>
            <ChevronRight
              className="w-4 h-4 transition-transform"
              style={{ color: 'var(--wc-t3)', transform: heroCollapsed ? 'none' : 'rotate(90deg)' }}
            />
          </div>
        </div>
        {!heroCollapsed && (
          <div className="px-[13px] pb-3 border-t pt-[10px]" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
            <div className="text-[12px] leading-[1.55] mb-[10px]" style={{ color: 'var(--wc-t2)' }}>
              Your audit score measures how ATO-ready your logbook is. Verify odometer readings and add photo evidence to increase your score.
            </div>
            <div className="flex items-baseline justify-between mb-[5px]">
              <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Audit readiness</span>
              <span className="font-heading font-black text-[18px]" style={{ color: 'var(--wc-gr)' }}>{score}%</span>
            </div>
            <div className="h-[5px] rounded-[3px] overflow-hidden" style={{ background: 'rgba(255,255,255,.07)' }}>
              <div className="h-full rounded-[3px] transition-all duration-700" style={{ width: `${score}%`, background: scoreFill }} />
            </div>
            <div className="text-[10px] mt-[5px]" style={{ color: 'var(--wc-t3)' }}>Tip: Photos score higher than timestamps alone.</div>
          </div>
        )}
      </div>

      <div className="flex-1 px-[14px] flex flex-col gap-[10px] overflow-y-auto scrollbar-thin pb-2">
        {state.trips.map((t, i) => {
          const oEnd = Math.round(getTripOdoEnd(state.trips, i));
          const verified = state.verifiedSet.has(i);
          const isExpanded = expandedTrip === i;

          return (
            <div
              key={i}
              className="rounded-[14px] transition-all"
              style={{
                background: verified ? 'rgba(34,197,94,.03)' : 'var(--wc-card)',
                border: verified ? '1.5px solid rgba(34,197,94,.45)' : '1.5px solid var(--wc-border)',
              }}
              data-testid={`odo-trip-${i}`}
            >
              <div className="flex items-center gap-3 p-[15px_16px] cursor-pointer" onClick={() => setExpandedTrip(isExpanded ? null : i)}>
                <div
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 font-heading font-extrabold text-[13px] transition-all"
                  style={{
                    background: verified ? 'rgba(34,197,94,.18)' : 'transparent',
                    border: verified ? '2px solid var(--wc-gr)' : '2px solid var(--wc-border)',
                    color: verified ? 'var(--wc-gr)' : 'var(--wc-t3)',
                    fontSize: verified ? '18px' : '13px',
                  }}
                >
                  {verified ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-[14px] text-white mb-1 ${isExpanded ? '' : 'truncate'}`}>{t.from} &rarr; {t.to}</div>
                  <div className="text-[12px]" style={{ color: 'var(--wc-t3)' }}>{t.date} &middot; {t.km} km &middot; {t.duration}</div>
                </div>
                {t.photo && <Image className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--wc-gr)' }} />}
                {!t.photo && verified && <Clock className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--wc-am)' }} />}
                <div className="font-heading font-extrabold text-[16px] flex-shrink-0 text-right leading-[1.2]" style={{ color: 'var(--wc-am)' }}>
                  {oEnd.toLocaleString('en-AU')} km
                  <small className="block font-data text-[7px] text-right mt-[2px]" style={{ color: 'var(--wc-t3)' }}>est. end odo</small>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform ml-[2px]" style={{ color: 'var(--wc-t3)', transform: isExpanded ? 'rotate(90deg)' : 'none' }} />
              </div>
              {isExpanded && (
                <div className="p-[14px_16px_16px] flex flex-col gap-3 border-t" style={{ borderColor: 'var(--wc-border)' }}>
                  <div className="font-data text-[8px] uppercase tracking-[.09em] mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Actual odometer reading at end of trip</div>
                  <div className="flex items-stretch gap-2">
                    <input
                      className="flex-1 rounded-[11px] p-[13px_14px] font-heading font-extrabold text-[22px] text-white outline-none tracking-[.02em]"
                      type="number"
                      placeholder={String(oEnd)}
                      value={odoInputs[i] ?? ''}
                      onChange={e => setOdoInputs(prev => ({ ...prev, [i]: e.target.value }))}
                      style={{ background: 'rgba(255,255,255,.07)', border: '1.5px solid var(--wc-border)' }}
                      data-testid={`odo-input-${i}`}
                    />
                    <button
                      className="rounded-[11px] p-[13px_14px] font-heading font-bold text-[13px] uppercase tracking-[.04em] cursor-pointer flex flex-col items-center gap-1 transition-all"
                      style={{ background: 'rgba(245,196,0,.07)', border: '1.5px solid rgba(245,196,0,.25)', color: 'var(--wc-y)' }}
                      onClick={() => dispatch({ type: 'ADD_PHOTO', tripIndex: i })}
                      data-testid={`photo-btn-${i}`}
                    >
                      <Camera className="w-4 h-4" />
                      Photo +2pts
                    </button>
                  </div>
                  <div className="text-[10px]" style={{ color: t.photo ? 'var(--wc-gr)' : 'var(--wc-t3)' }}>
                    {t.photo ? (
                      <><Check className="w-3 h-3 inline mr-1" /> Photo attached - +2 audit pts</>
                    ) : (
                      'No photo yet - timestamp only (+1 pt) - Add photo for +2 pts'
                    )}
                  </div>
                  <button
                    className="w-full rounded-[11px] py-3 font-heading font-extrabold text-[14px] tracking-[.06em] uppercase text-black cursor-pointer flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'var(--wc-y)', boxShadow: '0 2px 12px rgba(245,196,0,.2)' }}
                    onClick={() => {
                      const reading = odoInputs[i] ? parseFloat(odoInputs[i]) : oEnd;
                      dispatch({ type: 'VERIFY_TRIP', tripIndex: i, reading, photo: t.photo });
                      setExpandedTrip(null);
                      if (state.verifiedSet.size + 1 >= state.trips.length) {
                        setTimeout(() => dispatch({ type: 'OPEN_SUMMARY' }), 500);
                      }
                    }}
                    data-testid={`confirm-odo-${i}`}
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    Confirm Reading
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
