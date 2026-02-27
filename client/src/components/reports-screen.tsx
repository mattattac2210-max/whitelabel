import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Check, Camera, MapPin, Clock, Star, Archive, ShieldAlert, ArrowUpCircle, Link2 } from 'lucide-react';

export function ReportsScreen() {
  const { state, dispatch } = useApp();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const hasMultiple = state.savedReports.length > 1;
  const unresolvedConflict = hasMultiple && !state.conflictResolved;

  useEffect(() => {
    if (unresolvedConflict) {
      setShowConflictModal(true);
    }
  }, []);

  return (
    <div className="flex flex-col h-full" data-testid="reports-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'sort' })}
          data-testid="button-back-reports"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">Session Reports</span>
        <span className="ml-auto text-[11px]" style={{ color: 'var(--wc-t3)' }}>{state.savedReports.length} session{state.savedReports.length !== 1 ? 's' : ''}</span>
      </div>

      {unresolvedConflict && (
        <button
          className="mx-[14px] mb-[6px] flex items-center gap-[8px] rounded-[10px] p-[8px_12px] flex-shrink-0 cursor-pointer transition-all animate-flash-yellow text-left"
          style={{ background: 'var(--wc-y)', border: '1px solid var(--wc-y)' }}
          onClick={() => setShowConflictModal(true)}
          data-testid="button-conflict-banner"
        >
          <ShieldAlert className="w-[16px] h-[16px] flex-shrink-0 text-black" />
          <div>
            <div className="font-heading font-black text-[11px] uppercase tracking-[.04em] text-black">
              Conflicting Reports
            </div>
            <div className="text-[10px] leading-[1.3] text-black font-medium" style={{ opacity: .7 }}>
              Tap to resolve — only one report can be active for final submission.
            </div>
          </div>
        </button>
      )}

      {hasMultiple && state.conflictResolved && (
        <div className="mx-[14px] mb-[6px] flex items-center gap-[8px] rounded-[10px] p-[7px_12px] flex-shrink-0" style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)' }}>
          <Link2 className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--wc-gr)' }} />
          <div className="flex-1">
            <span className="text-[10px] font-semibold" style={{ color: 'var(--wc-gr)' }}>
              {state.savedReports.length} linked reports &mdash; active report selected.
            </span>
          </div>
          <button
            className="font-heading font-bold text-[9px] uppercase tracking-[.05em] px-[6px] py-[3px] rounded-[5px] cursor-pointer"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
            onClick={() => setShowConflictModal(true)}
            data-testid="button-edit-selection"
          >
            Edit
          </button>
        </div>
      )}

      <div className="flex-1 px-[14px] flex flex-col gap-[6px] overflow-y-auto scrollbar-thin pb-2">
        {state.savedReports.length === 0 ? (
          <div className="py-[30px] px-[14px] text-center text-[13px]" style={{ color: 'var(--wc-t3)' }}>
            No sessions saved yet.<br />Complete your first sort session to see reports here.
          </div>
        ) : (
          state.savedReports.map((r, i) => {
            const isOpen = expandedIdx === i;
            const bizTrips = r.trips?.filter(t => t.type === 'business') || [];
            const perTrips = r.trips?.filter(t => t.type === 'personal') || [];

            return (
              <div
                key={i}
                className="rounded-[13px] overflow-hidden"
                style={{
                  background: 'var(--wc-card)',
                  border: `1px solid ${!r.supersedes ? 'rgba(245,196,0,.25)' : isOpen ? 'rgba(255,255,255,.12)' : 'var(--wc-border)'}`,
                  transition: 'border-color .2s',
                  opacity: r.supersedes ? 0.55 : 1,
                }}
                data-testid={`report-${i}`}
              >
                <button
                  className="w-full p-[12px_14px] text-left cursor-pointer"
                  style={{ background: 'transparent' }}
                  onClick={() => setExpandedIdx(isOpen ? null : i)}
                  data-testid={`report-toggle-${i}`}
                >
                  <div className="flex items-start justify-between mb-[2px]">
                    <div className="flex items-center gap-[6px] flex-wrap">
                      <div className="font-data text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>{r.timestamp}</div>
                      {!r.supersedes && (
                        <span className="inline-flex items-center gap-[3px] font-heading font-bold text-[8px] uppercase tracking-[.06em] px-[5px] py-[1px] rounded-[4px]" style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)', color: 'var(--wc-gr)' }}>
                          <Check className="w-[8px] h-[8px]" />
                          Active — Rev {r.revision}
                        </span>
                      )}
                      {r.supersedes && (
                        <span className="inline-flex items-center gap-[3px] font-heading font-bold text-[8px] uppercase tracking-[.06em] px-[5px] py-[1px] rounded-[4px]" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t3)' }}>
                          <Archive className="w-[8px] h-[8px]" />
                          Archived
                        </span>
                      )}
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-[16px] h-[16px] mt-1 flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
                      : <ChevronDown className="w-[16px] h-[16px] mt-1 flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
                    }
                  </div>
                  <div className="font-heading font-bold text-[15px] text-white mb-[6px]">
                    {r.supersedes ? 'Archived Report' : 'Active Report'} &mdash; {r.bizCount + r.perCount} trips
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>
                      <strong style={{ color: 'var(--wc-y)' }}>{r.bizCount}</strong> business
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>
                      <strong style={{ color: 'var(--wc-t2)' }}>{r.perCount}</strong> personal
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>
                      Est. <strong style={{ color: 'var(--wc-y)' }}>{r.est}</strong>
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>
                      <strong style={{ color: 'var(--wc-y)' }}>{r.totalKm} km</strong>
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>
                      Audit <strong style={{ color: 'var(--wc-y)' }}>{r.auditScore}%</strong>
                    </span>
                  </div>
                  {r.lastOdoVerifiedAt && (
                    <div className="mt-1 text-[11px]" style={{ color: 'var(--wc-t2)' }}>
                      Odo: <strong style={{ color: 'var(--wc-am)' }}>{r.lastOdoReading?.toLocaleString('en-AU')} km</strong>
                      <span style={{ color: 'var(--wc-t3)' }}> &middot; verified {r.lastOdoVerifiedAt}</span>
                    </div>
                  )}
                </button>

                {isOpen && (
                  <div className="px-[14px] pb-[14px] max-h-[55vh] overflow-y-auto scrollbar-thin" style={{ borderTop: '1px solid var(--wc-border)' }}>

                    <div className="flex items-center gap-[6px] mt-[10px] mb-[8px] rounded-[8px] p-[7px_10px] animate-flash-yellow" style={{ background: 'var(--wc-y)', border: '1px solid var(--wc-y)' }}>
                      <Archive className="w-[12px] h-[12px] flex-shrink-0 text-black" />
                      <span className="text-[10px] leading-[1.4] font-bold text-black">
                        Read-only snapshot. To modify, go back and create a new report.
                      </span>
                    </div>

                    {hasMultiple && (
                      <div className="mb-[8px]">
                        {r.supersedes ? (
                          <button
                            className="w-full rounded-[8px] py-[7px] font-heading font-bold text-[11px] tracking-[.05em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[5px]"
                            style={{ background: 'rgba(245,196,0,.08)', border: '1.5px solid rgba(245,196,0,.3)', color: 'var(--wc-y)' }}
                            onClick={() => dispatch({ type: 'PROMOTE_REPORT', reportIndex: i })}
                            data-testid={`button-promote-${i}`}
                          >
                            <ArrowUpCircle className="w-[13px] h-[13px]" />
                            Make This the Active Report
                          </button>
                        ) : (
                          <div className="flex items-center gap-[5px] rounded-[8px] p-[6px_10px]" style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)' }}>
                            <Check className="w-[12px] h-[12px]" style={{ color: 'var(--wc-gr)' }} />
                            <span className="text-[10px] font-bold" style={{ color: 'var(--wc-gr)' }}>This is your active report for final submission</span>
                          </div>
                        )}
                      </div>
                    )}

                    {r.areasToCheck && r.areasToCheck.length > 0 && (
                      <div className="mt-[12px] rounded-[10px] p-[10px_12px]" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)' }}>
                        <div className="flex items-center gap-[6px] mb-[6px]">
                          <AlertTriangle className="w-[14px] h-[14px]" style={{ color: 'var(--wc-am)' }} />
                          <span className="font-heading font-bold text-[11px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-am)' }}>Areas to Check</span>
                        </div>
                        {r.areasToCheck.map((a, ai) => (
                          <div key={ai} className="flex items-start gap-[6px] mb-[3px]">
                            <span className="text-[10px] mt-[2px]" style={{ color: r.areasToCheck[0].startsWith('All clear') ? 'var(--wc-gr)' : 'var(--wc-am)' }}>
                              {r.areasToCheck[0].startsWith('All clear') ? '\u2713' : '\u2022'}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>{a}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {bizTrips.length > 0 && (
                      <div className="mt-[12px]">
                        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mb-[6px]" style={{ color: 'var(--wc-y)' }}>Business Trips</div>
                        {bizTrips.map((t, ti) => (
                          <div key={ti} className="flex items-center gap-[8px] py-[5px]" style={{ borderBottom: ti < bizTrips.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                            <MapPin className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] text-white truncate">{t.from} &rarr; {t.to}</div>
                              <div className="flex gap-[6px] items-center">
                                <span className="font-data text-[9px]" style={{ color: 'var(--wc-t3)' }}>{t.date} &middot; {t.km} km</span>
                                {t.purposeLabel && <span className="font-data text-[8px] px-[4px] py-[1px] rounded-[4px]" style={{ background: 'rgba(245,196,0,.1)', color: 'var(--wc-y)' }}>{t.purposeLabel}</span>}
                              </div>
                            </div>
                            <div className="flex gap-[3px] flex-shrink-0">
                              {t.verified && <Check className="w-[12px] h-[12px]" style={{ color: 'var(--wc-gr)' }} />}
                              {t.photo && <Camera className="w-[12px] h-[12px]" style={{ color: 'var(--wc-gr)' }} />}
                              {!t.verified && <span className="w-[12px] h-[12px] rounded-full" style={{ background: 'rgba(245,158,11,.2)', border: '1px solid rgba(245,158,11,.3)' }} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {perTrips.length > 0 && (
                      <div className="mt-[10px]">
                        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mb-[6px]" style={{ color: 'var(--wc-t3)' }}>Personal Trips</div>
                        {perTrips.map((t, ti) => (
                          <div key={ti} className="flex items-center gap-[8px] py-[5px]" style={{ borderBottom: ti < perTrips.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                            <MapPin className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] truncate" style={{ color: 'var(--wc-t2)' }}>{t.from} &rarr; {t.to}</div>
                              <span className="font-data text-[9px]" style={{ color: 'var(--wc-t3)' }}>{t.date} &middot; {t.km} km</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {r.auditLog && r.auditLog.length > 0 && (
                      <div className="mt-[12px]">
                        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mb-[6px]" style={{ color: 'var(--wc-t2)' }}>Audit Log</div>
                        <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.04)' }}>
                          {r.auditLog.slice(0, 10).map((e, ei) => (
                            <div key={ei} className="flex items-start gap-[6px] py-[3px]" style={{ borderBottom: ei < Math.min(r.auditLog.length, 10) - 1 ? '1px solid rgba(255,255,255,.03)' : 'none' }}>
                              <Clock className="w-[10px] h-[10px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-t3)' }} />
                              <span className="font-data text-[9px]" style={{ color: 'var(--wc-t3)' }}>{e.time}</span>
                              <span className="text-[10px] flex-1" style={{ color: 'var(--wc-t2)' }}>{e.desc}</span>
                            </div>
                          ))}
                          {r.auditLog.length > 10 && (
                            <div className="text-[9px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>+{r.auditLog.length - 10} more entries</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-[10px] text-center">
                      <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Last modified {r.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav activeOverride="reports" />

      {showConflictModal && hasMultiple && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowConflictModal(false)}
        >
          <div
            className="mx-5 w-full max-w-[360px] rounded-[16px] p-[20px_16px] animate-pop"
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,158,11,.35)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}
            data-testid="modal-conflict"
          >
            <div className="flex flex-col items-center gap-[8px] mb-[14px]">
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,.12)', border: '2px solid rgba(245,158,11,.35)' }}>
                <ShieldAlert className="w-[24px] h-[24px]" style={{ color: 'var(--wc-am)' }} />
              </div>
              <div className="font-heading font-black text-[18px] uppercase text-white text-center leading-[1.2]">
                Conflicting Reports
              </div>
              <div className="text-[12px] text-center leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
                Multiple reports exist for this session. Only <strong className="text-white">one report</strong> can be active for your final ATO submission. Please select which report is correct.
              </div>
            </div>

            <div className="flex flex-col gap-[8px] mb-[14px]">
              {state.savedReports.map((r, i) => (
                <div
                  key={i}
                  className="rounded-[10px] p-[10px_12px] cursor-pointer transition-all"
                  style={{
                    background: !r.supersedes ? 'rgba(34,197,94,.06)' : 'rgba(255,255,255,.03)',
                    border: !r.supersedes ? '1.5px solid rgba(34,197,94,.3)' : '1.5px solid var(--wc-border)',
                  }}
                  onClick={() => dispatch({ type: 'PROMOTE_REPORT', reportIndex: i })}
                  data-testid={`conflict-select-${i}`}
                >
                  <div className="flex items-center justify-between mb-[4px]">
                    <div className="flex items-center gap-[6px]">
                      <div
                        className="w-[16px] h-[16px] rounded-full flex items-center justify-center"
                        style={{
                          background: !r.supersedes ? 'var(--wc-gr)' : 'transparent',
                          border: !r.supersedes ? '2px solid var(--wc-gr)' : '2px solid var(--wc-border)',
                        }}
                      >
                        {!r.supersedes && <Check className="w-[10px] h-[10px] text-black" />}
                      </div>
                      <span className="font-heading font-bold text-[13px] text-white">Rev {r.revision}</span>
                      {!r.supersedes && (
                        <span className="font-heading font-bold text-[8px] uppercase tracking-[.06em] px-[4px] py-[1px] rounded-[3px]" style={{ background: 'rgba(34,197,94,.15)', color: 'var(--wc-gr)' }}>Active</span>
                      )}
                      {r.supersedes && (
                        <span className="font-heading font-bold text-[8px] uppercase tracking-[.06em] px-[4px] py-[1px] rounded-[3px]" style={{ background: 'rgba(255,255,255,.04)', color: 'var(--wc-t3)' }}>Archived</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-[8px] flex-wrap text-[10px]" style={{ color: 'var(--wc-t2)' }}>
                    <span><strong style={{ color: 'var(--wc-y)' }}>{r.bizCount}</strong> biz</span>
                    <span><strong>{r.perCount}</strong> per</span>
                    <span>Est. <strong style={{ color: 'var(--wc-y)' }}>{r.est}</strong></span>
                    <span><strong style={{ color: 'var(--wc-y)' }}>{r.totalKm}</strong> km</span>
                  </div>
                  <div className="font-data text-[8px] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>{r.timestamp}</div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-[6px] rounded-[8px] p-[8px_10px] mb-[12px]" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)' }}>
              <AlertTriangle className="w-[12px] h-[12px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-am)' }} />
              <span className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-am)' }}>
                You can change your selection at any time. The archived report is kept for reference but will not be used in your final report.
              </span>
            </div>

            <button
              className="w-full rounded-[11px] py-[11px] font-heading font-bold text-[14px] tracking-[.05em] uppercase cursor-pointer transition-all text-black"
              style={{ background: 'var(--wc-y)' }}
              onClick={() => setShowConflictModal(false)}
              data-testid="button-conflict-done"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
