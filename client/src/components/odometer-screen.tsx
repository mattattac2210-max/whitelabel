import { useState, useRef } from 'react';
import { useApp, useComputedStats, calcAuditScore, INDUSTRY_BIZ_AVG } from '@/lib/app-context';
import { getTripOdoStart, getTripOdoEnd } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, ChevronRight, Camera, Check, Shield, Image, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export function OdometerScreen() {
  const { state, dispatch } = useApp();
  const stats = useComputedStats();
  const [heroCollapsed, setHeroCollapsed] = useState(true);
  const [showOdoWarning, setShowOdoWarning] = useState(true);
  const [odoInputs, setOdoInputs] = useState<Record<string, string>>({});
  const [photoThumbs, setPhotoThumbs] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [expandedTrips, setExpandedTrips] = useState<Set<number>>(new Set());
  const [showUnconfirmedWarning, setShowUnconfirmedWarning] = useState(false);
  const [showOdoInfoPopup, setShowOdoInfoPopup] = useState(false);

  const sorted = state.trips.filter(t => t.type !== null);
  const score = stats.auditScore;
  const scoreFill = score > 80 ? 'linear-gradient(90deg,var(--wc-gr),#22ff88)' : score > 65 ? 'linear-gradient(90deg,var(--wc-am),var(--wc-gr))' : 'linear-gradient(90deg,var(--wc-re),var(--wc-am))';

  const toggleExpand = (i: number) => {
    setExpandedTrips(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full" data-testid="odometer-screen">
      <div className="flex items-center gap-[8px] px-[14px] pt-[6px] pb-[4px] flex-shrink-0">
        <button
          className="w-[28px] h-[28px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'notes' })}
          data-testid="button-back-odo"
        >
          <ArrowLeft className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[18px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Odometer</span>
        <span className="ml-auto text-[11px]" style={{ color: 'var(--wc-t3)' }}>{state.verifiedSet.size}/{sorted.length} verified</span>
      </div>

      <div
        className="mx-[14px] mb-[6px] rounded-[10px] overflow-hidden flex-shrink-0 cursor-pointer transition-all"
        style={{ background: 'var(--wc-card)', border: '1px solid rgb(var(--wc-ink) / .2)' }}
        onClick={() => setHeroCollapsed(!heroCollapsed)}
        data-testid="odo-hero-card"
      >
        <div className="flex items-center gap-2 p-[8px_12px]">
          <Shield className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[13px] flex-1 tracking-[.01em]" style={{ color: 'var(--wc-text)' }}>Audit Score</span>
          <span className="font-heading font-black text-[16px]" style={{ color: 'var(--wc-gr)' }} data-testid="text-audit-score">{score}%</span>
          <ChevronRight
            className="w-[14px] h-[14px] transition-transform"
            style={{ color: 'var(--wc-t3)', transform: heroCollapsed ? 'none' : 'rotate(90deg)' }}
          />
        </div>
        {!heroCollapsed && (
          <div className="px-[12px] pb-3 border-t pt-[8px]" style={{ borderColor: 'rgb(var(--wc-ink) / .06)' }}>
            <div className="text-[11px] leading-[1.55] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>
              Your audit score is an independent review of the information you have provided. It measures how well your logbook aligns with ATO compliance documentation requirements.
            </div>
            <div className="flex items-baseline justify-between mb-[4px]">
              <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Audit readiness</span>
              <span className="font-heading font-black text-[16px]" style={{ color: 'var(--wc-gr)' }}>{score}%</span>
            </div>
            <div className="h-[4px] rounded-[3px] overflow-hidden" style={{ background: 'rgb(var(--wc-ink) / .07)' }}>
              <div className="h-full rounded-[3px] transition-all duration-700" style={{ width: `${score}%`, background: scoreFill }} />
            </div>
            <div className="text-[9px] mt-[4px] mb-[6px]" style={{ color: 'var(--wc-t3)' }}>Tip: Photos score higher than timestamps alone.</div>

            {(() => {
              const sortedTripsArr = state.trips.filter(t => t.type !== null);
              const totalTrips = sortedTripsArr.length;
              const verifiedCount = state.verifiedSet.size;
              const photoCount = state.trips.filter(t => t.photo).length;
              const bizTripsArr = state.trips.filter(t => t.type === 'business');
              const notesCount = bizTripsArr.filter(t => t.notes && t.notes.length > 0).length;
              const result = calcAuditScore({
                totalTrips: state.trips.length,
                sortedTrips: totalTrips,
                verifiedCount,
                photoCount,
                bizPct: stats.bizPct,
                notesCount,
                bizCount: bizTripsArr.length,
              });
              const deviation = Math.abs(stats.bizPct - INDUSTRY_BIZ_AVG);
              const deviationLabel = deviation <= 10 ? 'Within range' : deviation <= 25 ? 'Moderate deviation' : 'High deviation';
              const deviationColor = deviation <= 10 ? 'var(--wc-gr)' : deviation <= 25 ? 'var(--wc-am)' : 'var(--wc-re)';
              return (
                <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid rgb(var(--wc-ink) / .15)' }}>
                  <div className="flex items-center gap-[6px] px-[10px] py-[6px]" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                    <Shield className="w-[11px] h-[11px]" style={{ color: 'var(--wc-y)' }} />
                    <span className="font-heading font-bold text-[10px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>How We Calculate This</span>
                  </div>
                  <div className="px-[10px] py-[6px] flex flex-col gap-[4px]">
                    <div className="text-[9px] leading-[1.5] mb-[2px]" style={{ color: 'var(--wc-t2)' }}>
                      Your audit score is a weighted percentage based on five categories. It scales with however many trips you have and factors in how your business use compares to industry norms. The maximum achievable score is <strong style={{ color: 'var(--wc-text)' }}>99%</strong>.
                    </div>
                    <div className="flex flex-col gap-[3px]">
                      {[
                        { label: 'Classification', weight: '30%', desc: `${totalTrips} of ${state.trips.length} trips sorted`, pct: result.classifiedPct, contrib: result.classifiedContrib, color: 'var(--wc-t2)' },
                        { label: 'Odometer verified', weight: '25%', desc: `${verifiedCount} of ${totalTrips} trips confirmed`, pct: result.verifiedPct, contrib: result.verifiedContrib, color: 'var(--wc-gr)' },
                        { label: 'Trip notes', weight: '10%', desc: `${notesCount} of ${bizTripsArr.length} business trips with notes`, pct: result.notesPct, contrib: result.notesContrib, color: 'var(--wc-am)' },
                        { label: 'Photo evidence', weight: '10%', desc: `${photoCount} of ${totalTrips} trips with photos (bonus)`, pct: result.photoPct, contrib: result.photoContrib, color: 'var(--wc-y)' },
                        { label: 'Business use ratio', weight: '24%', desc: `Your ${Math.round(stats.bizPct)}% vs ${INDUSTRY_BIZ_AVG}% industry avg`, pct: result.ratioPct, contrib: result.ratioContrib, color: deviationColor },
                      ].map((row, ri) => (
                        <div key={ri} className="rounded-[6px] px-[7px] py-[4px]" style={{ background: 'rgb(var(--wc-ink) / .02)' }}>
                          <div className="flex items-center justify-between mb-[2px]">
                            <div className="flex items-center gap-[4px]">
                              <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: row.color }} />
                              <span className="font-heading font-bold text-[9px]" style={{ color: 'var(--wc-text)' }}>{row.label}</span>
                              <span className="font-data text-[7px] px-[3px] py-[1px] rounded-[3px]" style={{ background: 'rgb(var(--wc-ink) / .06)', color: 'var(--wc-t3)' }}>weight {row.weight}</span>
                            </div>
                            <span className="font-heading font-black text-[11px] flex-shrink-0" style={{ color: row.color }}>+{row.contrib}</span>
                          </div>
                          <div className="flex items-center gap-[5px]">
                            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(row.pct, 100)}%`, background: row.color }} />
                            </div>
                            <span className="font-data text-[7px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }}>{Math.round(row.pct)}%</span>
                          </div>
                          <div className="text-[7px] mt-[1px]" style={{ color: 'var(--wc-t3)' }}>{row.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-[6px] px-[7px] py-[3px] mt-[1px]" style={{ background: 'rgb(var(--wc-ink) / .02)' }}>
                      <div className="flex items-center gap-[4px]">
                        <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: deviationColor }} />
                        <span className="font-data text-[7px]" style={{ color: deviationColor }}>{deviationLabel}</span>
                        <span className="text-[7px]" style={{ color: 'var(--wc-t3)' }}>{deviation <= 10 ? 'Your business use aligns with ATO industry benchmarks for tradies.' : deviation <= 25 ? 'Some deviation from industry average — ensure you can justify if audited.' : 'Significant deviation from industry norms — strong documentation recommended.'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-[6px] px-[7px] py-[4px] mt-[1px]" style={{ background: 'rgb(var(--wc-ink) / .08)', border: '1px solid rgb(var(--wc-ink) / .2)' }}>
                      <span className="font-heading font-bold text-[10px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Total Score</span>
                      <span className="font-heading font-black text-[14px]" style={{ color: 'var(--wc-y)' }}>{result.total}%</span>
                    </div>
                    <div className="text-[8px] leading-[1.45] mt-[2px] rounded-[5px] px-[6px] py-[4px]" style={{ color: 'var(--wc-t3)', background: 'rgb(var(--wc-ink) / .03)', border: '1px solid rgb(var(--wc-ink) / .06)' }}>
                      This is an independent review of the information you have provided. It does not replace financial or institutional recommendations and does not guarantee compliance. This score aligns with the integrity of what the ATO requires for compliance documentation. Industry average ({INDUSTRY_BIZ_AVG}%) is based on ATO benchmarks for trades and construction. Please seek certified financial advice if you require further assistance.
                    </div>
                  </div>
                </div>
              );
            })()}
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
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(153,153,153,.4)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}
            data-testid="modal-odo-warning"
          >
            <div className="flex flex-col items-center gap-[10px] mb-[14px]">
              <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center" style={{ background: 'rgba(153,153,153,.12)', border: '2px solid rgba(153,153,153,.35)' }}>
                <AlertTriangle className="w-[22px] h-[22px]" style={{ color: 'var(--wc-am)' }} />
              </div>
              <div className="font-heading font-black text-[18px] uppercase text-center" style={{ color: 'var(--wc-text)' }}>Accuracy Required</div>
            </div>
            <div className="text-[12px] leading-[1.6] mb-[16px]" style={{ color: 'var(--wc-t2)' }}>
              <p className="mb-[8px]">Both <strong style={{ color: 'var(--wc-text)' }}>personal and business</strong> trips must show accurate odometer readings.</p>
              <p className="mb-[8px]">Total km must be accurate with <strong style={{ color: 'var(--wc-text)' }}>no missing distances</strong> between trips.</p>
              <p className="mb-[8px]">Adjusting totals will <strong style={{ color: 'var(--wc-text)' }}>alter the calculations</strong> for claim estimates.</p>
              <p>All adjustments will be <strong style={{ color: 'var(--wc-text)' }}>logged in your audit report</strong>.</p>
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
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid rgb(var(--wc-ink) / .1)', color: 'var(--wc-t2)' }}
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
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgb(var(--wc-ink) / .3)', boxShadow: '0 8px 40px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-[16px] py-[14px] flex-shrink-0" style={{ borderBottom: '1px solid var(--wc-border)' }}>
              <div className="flex items-center gap-[8px]">
                <Shield className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
                <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Odometer Accuracy</span>
              </div>
              <button
                className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center"
                style={{ background: 'rgb(var(--wc-ink) / .06)' }}
                onClick={() => setShowOdoInfoPopup(false)}
                data-testid="button-close-odo-info-popup"
              >
                <AlertTriangle className="w-[13px] h-[13px]" style={{ color: 'var(--wc-t3)' }} />
              </button>
            </div>

            <div className="overflow-y-auto p-[16px] flex flex-col gap-[14px]">
              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid rgb(var(--wc-ink) / .2)' }}>
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <Camera className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
                  <span className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>About Photo Evidence</span>
                </div>
                <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--wc-text)' }}>
                  Photo evidence for all trips may not be achievable in practice. That's okay. What matters most is keeping <strong style={{ color: 'var(--wc-y)' }}>accurate and consistent odometer readings</strong> across all your trips, regardless of whether they are personal or business.
                </p>
              </div>

              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.15)' }}>
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <Check className="w-[14px] h-[14px]" style={{ color: 'var(--wc-gr)' }} />
                  <span className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-gr)' }}>Why Odometer Readings Matter</span>
                </div>
                <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--wc-text)' }}>
                  Accurate odometer records are essential for creating a compliant logbook under ATO guidelines. Your odometer readings establish the total kilometres driven and the business-use percentage that determines your deduction.
                </p>
              </div>

              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(153,153,153,.05)', border: '1px solid rgba(153,153,153,.15)' }}>
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <Clock className="w-[14px] h-[14px]" style={{ color: 'var(--wc-am)' }} />
                  <span className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-am)' }}>Periodic Odometer Updates</span>
                </div>
                <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--wc-text)' }}>
                  We have created a feature where you can periodically check, update, and upload your most recent odometer reading to ensure the records we generate for you remain accurate to the information you provide.
                </p>
              </div>

              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.12)' }}>
                <div className="flex items-start gap-[6px]">
                  <AlertTriangle className="w-[13px] h-[13px] flex-shrink-0 mt-[2px]" style={{ color: 'rgba(239,68,68,.7)' }} />
                  <p className="text-[11px] leading-[1.55]" style={{ color: 'rgba(239,68,68,.8)' }}>
                    <strong style={{ color: 'rgba(239,68,68,.95)' }}>Your responsibility.</strong> This application is not liable for keeping odometer readings accurate. You must verify the readings for all trips you wish to disclose to the ATO to calculate your logbook deductions. Always ensure the information you provide is truthful and complete.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-[16px] py-[12px] flex-shrink-0" style={{ borderTop: '1px solid var(--wc-border)' }}>
              <button
                className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[14px] tracking-[.05em] uppercase text-black cursor-pointer transition-all active:scale-[.97]"
                style={{ background: 'var(--wc-y)', boxShadow: '0 2px 12px rgb(var(--wc-ink) / .25)' }}
                onClick={() => setShowOdoInfoPopup(false)}
                data-testid="button-got-it-odo-popup"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-[14px] flex flex-col gap-[5px] overflow-y-auto scrollbar-thin pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {sorted.map((t) => {
          const i = state.trips.indexOf(t);
          const oStart = Math.round(getTripOdoStart(state.trips, i, state.baseOdo));
          const oEnd = Math.round(getTripOdoEnd(state.trips, i, state.baseOdo));
          const verified = state.verifiedSet.has(i);
          const isExpanded = expandedTrips.has(i);

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
              className="rounded-[12px] transition-all flex-shrink-0"
              style={{
                background: verified ? 'rgba(34,197,94,.03)' : 'var(--wc-card)',
                border: verified ? '1px solid rgba(34,197,94,.35)' : '1px solid var(--wc-border)',
              }}
              data-testid={`odo-trip-${i}`}
            >
              <div className="flex items-center gap-[8px] p-[8px_10px]">
                <div
                  className="w-[24px] h-[24px] rounded-full flex items-center justify-center flex-shrink-0 font-heading font-extrabold text-[10px] transition-all"
                  style={{
                    background: verified ? 'rgba(34,197,94,.18)' : 'transparent',
                    border: verified ? '2px solid var(--wc-gr)' : '1.5px solid var(--wc-border)',
                    color: verified ? 'var(--wc-gr)' : 'var(--wc-t3)',
                  }}
                >
                  {verified ? <Check className="w-[12px] h-[12px]" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] truncate leading-tight" style={{ color: 'var(--wc-text)' }}>
                    {t.from} &rarr; {t.to}
                  </div>
                  <div className="text-[10px] leading-tight" style={{ color: 'var(--wc-t3)' }}>
                    {t.km} km &middot; {curStart.toLocaleString('en-AU')}→{curEnd.toLocaleString('en-AU')}
                    {t.photo && <span style={{ color: 'var(--wc-gr)' }}> &middot; 📷</span>}
                  </div>
                </div>

                {!verified && (
                  <button
                    className="rounded-[7px] px-[10px] py-[5px] font-heading font-extrabold text-[10px] tracking-[.05em] uppercase text-black cursor-pointer flex items-center gap-[3px] transition-all active:scale-95 flex-shrink-0"
                    style={{ background: 'var(--wc-y)', boxShadow: '0 1px 6px rgb(var(--wc-ink) / .15)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'VERIFY_TRIP', tripIndex: i, startReading: curStart, reading: curEnd, photo: t.photo });
                    }}
                    data-testid={`confirm-odo-${i}`}
                  >
                    <Check className="w-[10px] h-[10px]" strokeWidth={2.5} />
                    Confirm
                  </button>
                )}

                <button
                  className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center flex-shrink-0 cursor-pointer"
                  style={{ background: 'rgb(var(--wc-ink) / .05)' }}
                  onClick={() => toggleExpand(i)}
                  data-testid={`odo-expand-${i}`}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-[13px] h-[13px]" style={{ color: 'var(--wc-t3)' }} />
                  ) : (
                    <ChevronDown className="w-[13px] h-[13px]" style={{ color: 'var(--wc-t3)' }} />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="px-[10px] pb-[10px] flex flex-col gap-[6px] border-t" style={{ borderColor: 'rgb(var(--wc-ink) / .08)' }}>
                  <div className="flex gap-[8px] mt-[8px]">
                    <div className="flex-1">
                      <div className="font-data text-[7px] uppercase tracking-[.09em] mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Start Odo</div>
                      <div className="flex items-center gap-[4px]">
                        <button
                          className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center font-heading font-black text-[16px] cursor-pointer transition-all active:scale-90"
                          style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: 'var(--wc-re)' }}
                          onClick={() => setOdoInputs(prev => ({ ...prev, [startKey]: String(curStart - 1) }))}
                          data-testid={`odo-start-minus-${i}`}
                        >
                          &minus;
                        </button>
                        <div
                          className="flex-1 rounded-[7px] py-[4px] text-center font-heading font-black text-[14px] tracking-[.02em]"
                          style={{ background: 'rgb(var(--wc-ink) / .07)', border: '1px solid var(--wc-border)', color: 'var(--wc-am)' }}
                          data-testid={`odo-start-${i}`}
                        >
                          {curStart.toLocaleString('en-AU')}
                        </div>
                        <button
                          className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center font-heading font-black text-[16px] cursor-pointer transition-all active:scale-90"
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
                          className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center font-heading font-black text-[16px] cursor-pointer transition-all active:scale-90"
                          style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: 'var(--wc-re)' }}
                          onClick={() => setOdoInputs(prev => ({ ...prev, [endKey]: String(curEnd - 1) }))}
                          data-testid={`odo-minus-${i}`}
                        >
                          &minus;
                        </button>
                        <div
                          className="flex-1 rounded-[7px] py-[4px] text-center font-heading font-black text-[14px] tracking-[.02em]"
                          style={{ background: 'rgb(var(--wc-ink) / .07)', border: '1px solid var(--wc-border)', color: 'var(--wc-am)' }}
                          data-testid={`odo-input-${i}`}
                        >
                          {curEnd.toLocaleString('en-AU')}
                        </div>
                        <button
                          className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center font-heading font-black text-[16px] cursor-pointer transition-all active:scale-90"
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
                    <div className="flex items-center gap-[5px] rounded-[7px] px-[8px] py-[4px]" style={{ background: 'rgba(153,153,153,.08)', border: '1px solid rgba(153,153,153,.25)' }}>
                      <AlertTriangle className="w-[11px] h-[11px] flex-shrink-0" style={{ color: 'var(--wc-am)' }} />
                      <span className="font-data text-[8px] flex-1" style={{ color: 'var(--wc-am)' }}>
                        Start ({curStart.toLocaleString('en-AU')}) ≠ prev end ({prevEndLocal!.toLocaleString('en-AU')})
                      </span>
                      <button
                        className="rounded-[5px] px-[6px] py-[2px] font-heading font-bold text-[8px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-95"
                        style={{ background: 'rgba(153,153,153,.15)', border: '1px solid rgba(153,153,153,.3)', color: 'var(--wc-am)' }}
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
                        className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center cursor-pointer transition-all active:scale-90 relative overflow-hidden"
                        style={{
                          background: photoThumbs[i] ? 'transparent' : 'rgb(var(--wc-ink) / .07)',
                          border: photoThumbs[i] ? '1.5px solid var(--wc-gr)' : '1.5px solid rgb(var(--wc-ink) / .25)',
                          color: 'var(--wc-y)',
                        }}
                        onClick={() => fileInputRefs.current[i]?.click()}
                        data-testid={`photo-btn-${i}`}
                      >
                        {photoThumbs[i] ? (
                          <img src={photoThumbs[i]} alt="Odo photo" className="absolute inset-0 w-full h-full object-cover rounded-[6px]" />
                        ) : (
                          <Camera className="w-[12px] h-[12px]" />
                        )}
                      </button>
                      <div className="text-[9px]" style={{ color: t.photo ? 'var(--wc-gr)' : 'var(--wc-t3)' }}>
                        {t.photo ? (
                          <><Check className="w-[10px] h-[10px] inline mr-1" />Photo +2 pts</>
                        ) : (
                          'Add photo +2 pts'
                        )}
                      </div>
                    </div>
                    {!verified && (
                      <button
                        className="rounded-[8px] px-[10px] py-[5px] font-heading font-extrabold text-[10px] tracking-[.06em] uppercase text-black cursor-pointer flex items-center gap-[3px] transition-all active:scale-95"
                        style={{ background: 'var(--wc-y)', boxShadow: '0 2px 10px rgb(var(--wc-ink) / .2)' }}
                        onClick={() => {
                          dispatch({ type: 'VERIFY_TRIP', tripIndex: i, startReading: curStart, reading: curEnd, photo: t.photo });
                        }}
                        data-testid={`confirm-odo-expanded-${i}`}
                      >
                        <Check className="w-[10px] h-[10px]" strokeWidth={2.5} />
                        Confirm
                      </button>
                    )}
                    {verified && (
                      <div className="flex items-center gap-[3px] px-[8px] py-[4px] rounded-[7px]" style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)' }}>
                        <Check className="w-[10px] h-[10px]" style={{ color: 'var(--wc-gr)' }} />
                        <span className="font-data text-[8px] uppercase" style={{ color: 'var(--wc-gr)' }}>Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
              className="w-full rounded-[12px] py-[12px] font-heading font-black text-[15px] tracking-[.07em] uppercase flex items-center justify-center gap-2 transition-all"
              style={{
                background: allConfirmed ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .3)',
                boxShadow: allConfirmed ? '0 4px 20px rgb(var(--wc-ink) / .25)' : 'none',
                color: allConfirmed ? '#000' : 'rgba(0,0,0,.6)',
                cursor: allConfirmed ? 'pointer' : 'default',
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
              <Check className="w-[16px] h-[16px]" strokeWidth={2.5} />
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
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(153,153,153,.4)', boxShadow: '0 8px 40px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: 'rgba(153,153,153,.12)', border: '2px solid rgba(153,153,153,.4)' }}>
              <AlertTriangle className="w-[26px] h-[26px]" style={{ color: 'var(--wc-am)' }} />
            </div>
            <div className="font-heading font-extrabold text-[18px] uppercase tracking-[.04em] text-center" style={{ color: 'var(--wc-text)' }}>
              Unconfirmed Trips
            </div>
            <div className="text-[13px] leading-[1.5] text-center" style={{ color: 'var(--wc-t2)' }}>
              You have <span className="font-bold" style={{ color: 'var(--wc-text)' }}>{sorted.filter((_, idx) => !state.verifiedSet.has(state.trips.indexOf(sorted[idx]))).length} trip{sorted.filter((_, idx) => !state.verifiedSet.has(state.trips.indexOf(sorted[idx]))).length !== 1 ? 's' : ''}</span> that haven't been confirmed yet. All odometer readings must be confirmed before you can save and finish.
            </div>
            <div className="w-full flex flex-col gap-[8px] mt-[4px]">
              {sorted.filter((_, idx) => !state.verifiedSet.has(state.trips.indexOf(sorted[idx]))).slice(0, 5).map((t, idx) => (
                <div key={idx} className="flex items-center gap-[8px] rounded-[10px] px-[12px] py-[8px]" style={{ background: 'rgba(153,153,153,.06)', border: '1px solid rgba(153,153,153,.15)' }}>
                  <AlertTriangle className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-am)' }} />
                  <span className="font-bold text-[12px] truncate flex-1" style={{ color: 'var(--wc-text)' }}>{t.from} &rarr; {t.to}</span>
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
              style={{ background: 'var(--wc-am)', boxShadow: '0 2px 12px rgba(153,153,153,.3)' }}
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
