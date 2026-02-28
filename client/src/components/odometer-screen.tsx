import { useState, useRef } from 'react';
import { useApp, useComputedStats } from '@/lib/app-context';
import { getTripOdoStart, getTripOdoEnd } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, ChevronRight, Camera, Check, Shield, Image, Clock, AlertTriangle } from 'lucide-react';

export function OdometerScreen() {
  const { state, dispatch } = useApp();
  const stats = useComputedStats();
  const [heroCollapsed, setHeroCollapsed] = useState(true);
  const [showOdoWarning, setShowOdoWarning] = useState(true);
  const [odoInputs, setOdoInputs] = useState<Record<string, string>>({});
  const [photoThumbs, setPhotoThumbs] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [expandedVerified, setExpandedVerified] = useState<Set<number>>(new Set());
  const [showUnconfirmedWarning, setShowUnconfirmedWarning] = useState(false);
  const [showOdoInfoPopup, setShowOdoInfoPopup] = useState(false);

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

      {showOdoWarning && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="mx-6 w-full max-w-[340px] rounded-[16px] p-[20px_18px] animate-pop"
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,158,11,.4)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}
            data-testid="modal-odo-warning"
          >
            <div className="flex flex-col items-center gap-[10px] mb-[14px]">
              <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,.12)', border: '2px solid rgba(245,158,11,.35)' }}>
                <AlertTriangle className="w-[22px] h-[22px]" style={{ color: 'var(--wc-am)' }} />
              </div>
              <div className="font-heading font-black text-[18px] uppercase text-white text-center">Accuracy Required</div>
            </div>
            <div className="text-[12px] leading-[1.6] mb-[16px]" style={{ color: 'var(--wc-t2)' }}>
              <p className="mb-[8px]">Both <strong className="text-white">personal and business</strong> trips must show accurate odometer readings.</p>
              <p className="mb-[8px]">Total km must be accurate with <strong className="text-white">no missing distances</strong> between trips.</p>
              <p className="mb-[8px]">Adjusting totals will <strong className="text-white">alter the calculations</strong> for claim estimates.</p>
              <p>All adjustments will be <strong className="text-white">logged in your audit report</strong>.</p>
            </div>
            <button
              className="w-full rounded-[11px] py-[12px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase text-black cursor-pointer transition-all"
              style={{ background: 'var(--wc-y)' }}
              onClick={() => setShowOdoWarning(false)}
              data-testid="button-odo-warning-ok"
            >
              I Understand
            </button>
            <button
              className="w-full rounded-[11px] py-[10px] mt-[8px] font-heading font-bold text-[12px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.97]"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'var(--wc-t2)' }}
              onClick={() => { setShowOdoWarning(false); setShowOdoInfoPopup(true); }}
              data-testid="button-see-more-odo-warning"
            >
              See More
            </button>
          </div>
        </div>
      )}

      {showOdoInfoPopup && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.88)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowOdoInfoPopup(false)}
          data-testid="odo-info-popup-overlay"
        >
          <div
            className="w-[360px] max-h-[80vh] rounded-[18px] overflow-hidden flex flex-col"
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,196,0,.3)', boxShadow: '0 8px 40px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-[16px] py-[14px] flex-shrink-0" style={{ borderBottom: '1px solid var(--wc-border)' }}>
              <div className="flex items-center gap-[8px]">
                <Shield className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
                <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em] text-white">Odometer Accuracy</span>
              </div>
              <button
                className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,.06)' }}
                onClick={() => setShowOdoInfoPopup(false)}
                data-testid="button-close-odo-info-popup"
              >
                <AlertTriangle className="w-[13px] h-[13px]" style={{ color: 'var(--wc-t3)' }} />
              </button>
            </div>

            <div className="overflow-y-auto p-[16px] flex flex-col gap-[14px]">
              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(245,196,0,.06)', border: '1px solid rgba(245,196,0,.2)' }}>
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <Camera className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
                  <span className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>About Photo Evidence</span>
                </div>
                <p className="text-[12px] leading-[1.6] text-white">
                  Photo evidence for all trips may not be achievable in practice. That's okay. What matters most is keeping <strong style={{ color: 'var(--wc-y)' }}>accurate and consistent odometer readings</strong> across all your trips, regardless of whether they are personal or business.
                </p>
              </div>

              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.15)' }}>
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <Check className="w-[14px] h-[14px]" style={{ color: 'var(--wc-gr)' }} />
                  <span className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-gr)' }}>Why Odometer Readings Matter</span>
                </div>
                <p className="text-[12px] leading-[1.6] text-white">
                  Accurate odometer records are essential for creating a compliant logbook under ATO guidelines. Your odometer readings establish the total kilometres driven and the business-use percentage that determines your deduction.
                </p>
              </div>

              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.15)' }}>
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <Clock className="w-[14px] h-[14px]" style={{ color: 'var(--wc-am)' }} />
                  <span className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-am)' }}>Periodic Odometer Updates</span>
                </div>
                <p className="text-[12px] leading-[1.6] text-white">
                  We have created a feature where you can periodically check, update, and upload your most recent odometer reading to ensure the records we generate for you remain accurate to the information you provide.
                </p>
              </div>

              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.12)' }}>
                <div className="flex items-start gap-[6px]">
                  <AlertTriangle className="w-[13px] h-[13px] flex-shrink-0 mt-[2px]" style={{ color: 'rgba(239,68,68,.7)' }} />
                  <p className="text-[11px] leading-[1.55]" style={{ color: 'rgba(239,68,68,.8)' }}>
                    <strong style={{ color: 'rgba(239,68,68,.95)' }}>Your responsibility.</strong> WorkCar is not liable for keeping odometer readings accurate. You must verify the readings for all trips you wish to disclose to the ATO to calculate your logbook deductions. Always ensure the information you provide is truthful and complete.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-[16px] py-[12px] flex-shrink-0" style={{ borderTop: '1px solid var(--wc-border)' }}>
              <button
                className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[14px] tracking-[.05em] uppercase text-black cursor-pointer transition-all active:scale-[.97]"
                style={{ background: 'var(--wc-y)', boxShadow: '0 2px 12px rgba(245,196,0,.25)' }}
                onClick={() => setShowOdoInfoPopup(false)}
                data-testid="button-got-it-odo-popup"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

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
        {(() => {
          const allConfirmed = sorted.every((_, idx) => {
            const origIdx = state.trips.indexOf(sorted[idx]);
            return state.verifiedSet.has(origIdx);
          });
          const unconfirmedCount = sorted.filter((_, idx) => !state.verifiedSet.has(state.trips.indexOf(sorted[idx]))).length;
          return (
            <button
              className="w-full rounded-[13px] py-[13px] font-heading font-black text-[17px] tracking-[.07em] uppercase cursor-pointer flex items-center justify-center gap-2 transition-all"
              style={{
                background: allConfirmed ? 'var(--wc-y)' : 'rgba(245,196,0,.3)',
                boxShadow: allConfirmed ? '0 4px 20px rgba(245,196,0,.25)' : 'none',
                color: allConfirmed ? '#000' : 'rgba(0,0,0,.6)',
              }}
              onClick={() => {
                if (allConfirmed) {
                  dispatch({ type: 'OPEN_SUMMARY' });
                } else {
                  setShowUnconfirmedWarning(true);
                }
              }}
              data-testid="button-save-finish"
            >
              <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
              {allConfirmed ? 'Save & Finish' : `Save & Finish (${unconfirmedCount} unconfirmed)`}
            </button>
          );
        })()}
      </div>

      {showUnconfirmedWarning && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowUnconfirmedWarning(false)}
          data-testid="unconfirmed-warning-overlay"
        >
          <div
            className="w-[340px] rounded-[18px] p-[24px] flex flex-col items-center gap-[16px]"
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,158,11,.4)', boxShadow: '0 8px 40px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,.12)', border: '2px solid rgba(245,158,11,.4)' }}>
              <AlertTriangle className="w-[26px] h-[26px]" style={{ color: 'var(--wc-am)' }} />
            </div>
            <div className="font-heading font-extrabold text-[18px] uppercase tracking-[.04em] text-white text-center">
              Unconfirmed Trips
            </div>
            <div className="text-[13px] leading-[1.5] text-center" style={{ color: 'var(--wc-t2)' }}>
              You have <span className="font-bold text-white">{sorted.filter((_, idx) => !state.verifiedSet.has(state.trips.indexOf(sorted[idx]))).length} trip{sorted.filter((_, idx) => !state.verifiedSet.has(state.trips.indexOf(sorted[idx]))).length !== 1 ? 's' : ''}</span> that haven't been confirmed yet. All odometer readings must be confirmed before you can save and finish.
            </div>
            <div className="w-full flex flex-col gap-[8px] mt-[4px]">
              {sorted.filter((_, idx) => !state.verifiedSet.has(state.trips.indexOf(sorted[idx]))).slice(0, 5).map((t, idx) => (
                <div key={idx} className="flex items-center gap-[8px] rounded-[10px] px-[12px] py-[8px]" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)' }}>
                  <AlertTriangle className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-am)' }} />
                  <span className="font-bold text-[12px] text-white truncate flex-1">{t.from} &rarr; {t.to}</span>
                </div>
              ))}
              {sorted.filter((_, idx) => !state.verifiedSet.has(state.trips.indexOf(sorted[idx]))).length > 5 && (
                <div className="text-[11px] text-center" style={{ color: 'var(--wc-t3)' }}>
                  +{sorted.filter((_, idx) => !state.verifiedSet.has(state.trips.indexOf(sorted[idx]))).length - 5} more
                </div>
              )}
            </div>
            <button
              className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[14px] tracking-[.05em] uppercase text-black cursor-pointer transition-all active:scale-[.97]"
              style={{ background: 'var(--wc-am)', boxShadow: '0 2px 12px rgba(245,158,11,.3)' }}
              onClick={() => setShowUnconfirmedWarning(false)}
              data-testid="button-dismiss-warning"
            >
              Go Back &amp; Confirm
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
