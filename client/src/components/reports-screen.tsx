import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Check, Camera, MapPin, Clock, Star, Archive } from 'lucide-react';

export function ReportsScreen() {
  const { state, dispatch } = useApp();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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
                  border: `1px solid ${isOpen ? 'rgba(245,196,0,.25)' : 'var(--wc-border)'}`,
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
                      {r.revision > 1 && !r.supersedes && (
                        <span className="inline-flex items-center gap-[3px] font-heading font-bold text-[8px] uppercase tracking-[.06em] px-[5px] py-[1px] rounded-[4px]" style={{ background: 'rgba(245,196,0,.12)', border: '1px solid rgba(245,196,0,.2)', color: 'var(--wc-y)' }}>
                          <Star className="w-[8px] h-[8px]" />
                          Rev {r.revision} &mdash; Latest
                        </span>
                      )}
                      {r.supersedes && (
                        <span className="inline-flex items-center gap-[3px] font-heading font-bold text-[8px] uppercase tracking-[.06em] px-[5px] py-[1px] rounded-[4px]" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t3)' }}>
                          <Archive className="w-[8px] h-[8px]" />
                          Superseded
                        </span>
                      )}
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-[16px] h-[16px] mt-1 flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
                      : <ChevronDown className="w-[16px] h-[16px] mt-1 flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
                    }
                  </div>
                  <div className="font-heading font-bold text-[15px] text-white mb-[6px]">
                    {r.supersedes ? 'Previous Report' : 'Sort Session'} &mdash; {r.bizCount + r.perCount} trips
                    {r.revision > 1 && !r.supersedes && <span className="font-data text-[9px] font-normal ml-[6px]" style={{ color: 'var(--wc-am)' }}>changes need verification</span>}
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

                    <div className="flex items-center gap-[6px] mt-[10px] mb-[8px] rounded-[8px] p-[7px_10px] animate-flash-yellow" style={{ background: 'rgba(245,196,0,.1)', border: '1px solid rgba(245,196,0,.3)' }}>
                      <Archive className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
                      <span className="text-[10px] leading-[1.4] font-semibold" style={{ color: 'var(--wc-y)' }}>
                        Read-only snapshot. To modify, go back and create a new report.
                      </span>
                    </div>

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
    </div>
  );
}
