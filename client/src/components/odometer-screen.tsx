import { useState, useRef } from 'react';
import { useApp, useComputedStats } from '@/lib/app-context';
import { getTripOdoStart, getTripOdoEnd } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, ChevronRight, Camera, Check, Shield, Image, Clock, AlertTriangle } from 'lucide-react';

export function OdometerScreen() {
  const { state, dispatch } = useApp();
  const stats = useComputedStats();
  const [heroCollapsed, setHeroCollapsed] = useState(true);
  const [odoInputs, setOdoInputs] = useState<Record<string, string>>({});
  const [photoThumbs, setPhotoThumbs] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [expandedVerified, setExpandedVerified] = useState<Set<number>>(new Set());

  const sorted = state.trips.filter(t => t.type !== null);
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
        <span className="ml-auto text-[11px]" style={{ color: 'var(--wc-t3)' }}>{state.verifiedSet.size} of {sorted.length} verified</span>
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

      <div className="mx-[14px] mb-1 rounded-[10px] p-[10px_12px]" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.18)' }}>
        <div className="flex items-start gap-[8px]">
          <AlertTriangle className="w-[14px] h-[14px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-am)' }} />
          <div className="text-[10px] leading-[1.55]" style={{ color: 'var(--wc-t2)' }}>
            <strong style={{ color: 'var(--wc-am)' }}>Accuracy required.</strong> Both personal and business trips must show accurate odometer readings. Total km must be correct with no missing distances between trips. Adjusting totals will alter claim estimate calculations. All adjustments are logged in your audit report.
          </div>
        </div>
      </div>

      <div className="flex-1 px-[14px] flex flex-col gap-[10px] overflow-y-auto scrollbar-thin pb-2">
        {sorted.map((t) => {
          const i = state.trips.indexOf(t);
          const oStart = Math.round(getTripOdoStart(state.trips, i, state.baseOdo));
          const oEnd = Math.round(getTripOdoEnd(state.trips, i, state.baseOdo));
          const verified = state.verifiedSet.has(i);

          const startKey = `${i}-start`;
          const endKey = `${i}-end`;
          const curStart = parseInt(odoInputs[startKey] ?? String(oStart)) || oStart;
          const curEnd = parseInt(odoInputs[endKey] ?? String(oEnd)) || oEnd;

          const sortedIdx = sorted.indexOf(t);
          const prevTrip = sortedIdx > 0 ? sorted[sortedIdx - 1] : null;
          const prevOrigIdx = prevTrip ? state.trips.indexOf(prevTrip) : -1;
          const prevEnd = prevTrip ? Math.round(getTripOdoEnd(state.trips, prevOrigIdx, state.baseOdo)) : null;
          const prevEndLocal = prevTrip ? parseInt(odoInputs[`${prevOrigIdx}-end`] ?? String(prevEnd)) || prevEnd : null;
          const hasMismatch = prevEndLocal != null && curStart !== prevEndLocal;

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
              <div
                className="flex items-center gap-3 p-[12px_14px]"
                style={{ cursor: verified ? 'pointer' : 'default' }}
                onClick={() => {
                  if (!verified) return;
                  setExpandedVerified(prev => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    return next;
                  });
                }}
              >
                <div
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 font-heading font-extrabold text-[12px] transition-all"
                  style={{
                    background: verified ? 'rgba(34,197,94,.18)' : 'transparent',
                    border: verified ? '2px solid var(--wc-gr)' : '2px solid var(--wc-border)',
                    color: verified ? 'var(--wc-gr)' : 'var(--wc-t3)',
                    fontSize: verified ? '16px' : '12px',
                  }}
                >
                  {verified ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] text-white truncate">{t.from} &rarr; {t.to}</div>
                  <div className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>
                    {t.date} &middot; {t.km} km &middot; {t.duration}
                    {verified && <span style={{ color: 'var(--wc-am)' }}> &middot; {curStart.toLocaleString('en-AU')}→{curEnd.toLocaleString('en-AU')}</span>}
                  </div>
                </div>
                {t.photo && <Image className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--wc-gr)' }} />}
                {!t.photo && verified && <Clock className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--wc-am)' }} />}
                {verified && (
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0 transition-transform"
                    style={{ color: 'var(--wc-t3)', transform: expandedVerified.has(i) ? 'rotate(90deg)' : 'none' }}
                  />
                )}
              </div>

              {(!verified || expandedVerified.has(i)) && <div className="px-[14px] pb-[10px] flex flex-col gap-[6px]">
                <div className="flex gap-[8px]">
                  <div className="flex-1">
                    <div className="font-data text-[7px] uppercase tracking-[.09em] mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Start Odo</div>
                    <div className="flex items-center gap-[4px]">
                      <button
                        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center font-heading font-black text-[18px] cursor-pointer transition-all active:scale-90"
                        style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: 'var(--wc-re)' }}
                        onClick={() => setOdoInputs(prev => ({ ...prev, [startKey]: String(curStart - 1) }))}
                        data-testid={`odo-start-minus-${i}`}
                      >
                        &minus;
                      </button>
                      <div
                        className="flex-1 rounded-[8px] py-[5px] text-center font-heading font-black text-[16px] tracking-[.02em]"
                        style={{ background: 'rgba(255,255,255,.07)', border: '1px solid var(--wc-border)', color: 'var(--wc-am)' }}
                        data-testid={`odo-start-${i}`}
                      >
                        {curStart.toLocaleString('en-AU')}
                      </div>
                      <button
                        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center font-heading font-black text-[18px] cursor-pointer transition-all active:scale-90"
                        style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', color: 'var(--wc-gr)' }}
                        onClick={() => setOdoInputs(prev => ({ ...prev, [startKey]: String(curStart + 1) }))}
                        data-testid={`odo-start-plus-${i}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-data text-[7px] uppercase tracking-[.09em] mb-[3px]" style={{ color: 'var(--wc-t3)' }}>End Odo</div>
                    <div className="flex items-center gap-[4px]">
                      <button
                        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center font-heading font-black text-[18px] cursor-pointer transition-all active:scale-90"
                        style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: 'var(--wc-re)' }}
                        onClick={() => setOdoInputs(prev => ({ ...prev, [endKey]: String(curEnd - 1) }))}
                        data-testid={`odo-minus-${i}`}
                      >
                        &minus;
                      </button>
                      <div
                        className="flex-1 rounded-[8px] py-[5px] text-center font-heading font-black text-[16px] tracking-[.02em]"
                        style={{ background: 'rgba(255,255,255,.07)', border: '1px solid var(--wc-border)', color: 'var(--wc-am)' }}
                        data-testid={`odo-input-${i}`}
                      >
                        {curEnd.toLocaleString('en-AU')}
                      </div>
                      <button
                        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center font-heading font-black text-[18px] cursor-pointer transition-all active:scale-90"
                        style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', color: 'var(--wc-gr)' }}
                        onClick={() => setOdoInputs(prev => ({ ...prev, [endKey]: String(curEnd + 1) }))}
                        data-testid={`odo-plus-${i}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="font-data text-[8px] text-center" style={{ color: 'var(--wc-t3)' }}>
                  Distance: <span style={{ color: 'var(--wc-y)' }}>{(curEnd - curStart).toLocaleString('en-AU')} km</span>
                </div>
                {hasMismatch && (
                  <div className="flex items-center gap-[6px] rounded-[8px] px-[10px] py-[5px]" style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)' }}>
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--wc-am)' }} />
                    <span className="font-data text-[9px] flex-1" style={{ color: 'var(--wc-am)' }}>
                      Start ({curStart.toLocaleString('en-AU')}) doesn't match previous trip end ({prevEndLocal!.toLocaleString('en-AU')})
                    </span>
                    <button
                      className="rounded-[6px] px-[8px] py-[3px] font-heading font-bold text-[9px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-95"
                      style={{ background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.3)', color: 'var(--wc-am)' }}
                      onClick={() => setOdoInputs(prev => ({ ...prev, [startKey]: String(prevEndLocal) }))}
                      data-testid={`odo-fix-${i}`}
                    >
                      Fix
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[6px]">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      ref={el => { fileInputRefs.current[i] = el; }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setPhotoThumbs(prev => ({ ...prev, [i]: ev.target?.result as string }));
                            dispatch({ type: 'ADD_PHOTO', tripIndex: i });
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                      data-testid={`photo-file-${i}`}
                    />
                    <button
                      className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center cursor-pointer transition-all active:scale-90 relative overflow-hidden"
                      style={{
                        background: photoThumbs[i] ? 'transparent' : 'rgba(245,196,0,.07)',
                        border: photoThumbs[i] ? '1.5px solid var(--wc-gr)' : '1.5px solid rgba(245,196,0,.25)',
                        color: 'var(--wc-y)',
                      }}
                      onClick={() => fileInputRefs.current[i]?.click()}
                      data-testid={`photo-btn-${i}`}
                    >
                      {photoThumbs[i] ? (
                        <img src={photoThumbs[i]} alt="Odo photo" className="absolute inset-0 w-full h-full object-cover rounded-[7px]" />
                      ) : (
                        <Camera className="w-[14px] h-[14px]" />
                      )}
                    </button>
                    <div className="text-[9px]" style={{ color: t.photo ? 'var(--wc-gr)' : 'var(--wc-t3)' }}>
                      {t.photo ? (
                        <><Check className="w-3 h-3 inline mr-1" />Photo +2 pts</>
                      ) : (
                        'Add photo +2 pts'
                      )}
                    </div>
                  </div>
                  <button
                    className="rounded-[9px] px-[12px] py-[5px] font-heading font-extrabold text-[11px] tracking-[.06em] uppercase text-black cursor-pointer flex items-center gap-[4px] transition-all active:scale-95"
                    style={{ background: 'var(--wc-y)', boxShadow: '0 2px 10px rgba(245,196,0,.2)' }}
                    onClick={() => {
                      dispatch({ type: 'VERIFY_TRIP', tripIndex: i, startReading: curStart, reading: curEnd, photo: t.photo });
                      if (state.verifiedSet.size + 1 >= sorted.length) {
                        setTimeout(() => dispatch({ type: 'OPEN_SUMMARY' }), 500);
                      }
                    }}
                    data-testid={`confirm-odo-${i}`}
                  >
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                    Confirm
                  </button>
                </div>
              </div>}
            </div>
          );
        })}
      </div>

      <div className="px-[14px] py-[6px] flex-shrink-0">
        <button
          className="w-full rounded-[13px] py-[13px] font-heading font-black text-[17px] tracking-[.07em] uppercase text-black cursor-pointer flex items-center justify-center gap-2 transition-all"
          style={{ background: 'var(--wc-y)', boxShadow: '0 4px 20px rgba(245,196,0,.25)' }}
          onClick={() => dispatch({ type: 'OPEN_SUMMARY' })}
          data-testid="button-save-finish"
        >
          <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
          Save &amp; Finish
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
