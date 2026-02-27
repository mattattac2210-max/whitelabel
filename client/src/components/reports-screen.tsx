import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Check, Camera, MapPin, Clock, Star, Archive, ShieldAlert, ArrowUpCircle, Link2, Trash2, Plus } from 'lucide-react';

const SESSION_LABELS: Record<string, string> = {
  batch1: 'Week 1 — 24\u201327 Feb',
  batch2: 'Week 2 — 28 Feb\u20132 Mar',
};

export function ReportsScreen() {
  const { state, dispatch } = useApp();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [conflictSessionId, setConflictSessionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const locked = !state.freshSession && state.savedReports.length > 0;

  const sessionIds = [...new Set(state.savedReports.map(r => r.sessionId))];
  const sessionGroups = sessionIds.map(sid => ({
    sessionId: sid,
    reports: state.savedReports
      .map((r, i) => ({ ...r, globalIdx: i }))
      .filter(r => r.sessionId === sid),
  }));

  return (
    <div className="flex flex-col h-full" data-testid="reports-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        {!locked && (
          <button
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
            onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'sort' })}
            data-testid="button-back-reports"
          >
            <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
          </button>
        )}
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">Session Reports</span>
        <span className="ml-auto text-[11px]" style={{ color: 'var(--wc-t3)' }}>{state.savedReports.length} report{state.savedReports.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex-1 px-[14px] flex flex-col gap-[10px] overflow-y-auto scrollbar-thin pb-2">
        {state.savedReports.length === 0 ? (
          <div className="py-[30px] px-[14px] text-center text-[13px]" style={{ color: 'var(--wc-t3)' }}>
            No sessions saved yet.<br />Complete your first sort session to see reports here.
          </div>
        ) : (
          sessionGroups.map(group => {
            const isLinked = group.reports.length > 1;
            const hasActive = group.reports.some(r => !r.supersedes);
            const label = SESSION_LABELS[group.sessionId] || group.sessionId;

            return (
              <div
                key={group.sessionId}
                className={isLinked ? 'rounded-[16px] p-[8px] flex flex-col gap-[6px]' : 'flex flex-col gap-[6px]'}
                style={isLinked ? { border: '2px solid rgba(245,196,0,.4)', background: 'rgba(245,196,0,.03)' } : {}}
                data-testid={`session-group-${group.sessionId}`}
              >
                {isLinked && (
                  <div className="flex flex-col gap-[6px] px-[6px] pt-[2px] pb-[2px]">
                    <div className="flex items-center gap-[6px]">
                      <Link2 className="w-[11px] h-[11px]" style={{ color: 'var(--wc-y)' }} />
                      <span className="font-heading font-bold text-[9px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-y)' }}>Linked Reports</span>
                      <span className="font-data text-[8px] tracking-[.04em]" style={{ color: 'var(--wc-t3)' }}>{label}</span>
                    </div>
                    {hasActive ? (
                      <button
                        className="flex items-center gap-[6px] rounded-[8px] p-[5px_8px] cursor-pointer transition-all text-left"
                        style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)' }}
                        onClick={() => setConflictSessionId(group.sessionId)}
                        data-testid={`button-edit-active-${group.sessionId}`}
                      >
                        <Check className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-gr)' }} />
                        <span className="flex-1 text-[9px]" style={{ color: 'var(--wc-t2)' }}>
                          <span style={{ color: 'var(--wc-gr)' }}>Resolved</span> — tap to change active report
                        </span>
                      </button>
                    ) : (
                      <button
                        className="flex items-center gap-[6px] rounded-[8px] p-[5px_8px] cursor-pointer transition-all animate-flash-yellow text-left"
                        style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)' }}
                        onClick={() => setConflictSessionId(group.sessionId)}
                        data-testid={`button-resolve-${group.sessionId}`}
                      >
                        <ShieldAlert className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-am)' }} />
                        <span className="flex-1 text-[9px]" style={{ color: 'var(--wc-am)' }}>
                          Tap to select active report
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {group.reports.map(r => {
                  const i = r.globalIdx;
                  const isOpen = expandedIdx === i;
                  const bizTrips = r.trips?.filter(t => t.type === 'business') || [];
                  const perTrips = r.trips?.filter(t => t.type === 'personal') || [];

                  return (
                    <div
                      key={i}
                      className="rounded-[13px] overflow-hidden"
                      style={{
                        background: 'var(--wc-card)',
                        border: isLinked
                          ? `1.5px solid ${!r.supersedes ? 'rgba(34,197,94,.35)' : 'var(--wc-border)'}`
                          : `1px solid ${isOpen ? 'rgba(245,196,0,.25)' : 'var(--wc-border)'}`,
                        transition: 'border-color .2s',
                        opacity: r.supersedes ? 0.6 : 1,
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
                          {state.sessionId === r.sessionId && state.trips.length > 0 ? (
                            <div className="flex items-center gap-[6px] mt-[10px] mb-[8px] rounded-[8px] p-[7px_10px] animate-flash-yellow" style={{ background: 'var(--wc-y)', border: '1px solid var(--wc-y)' }}>
                              <Archive className="w-[12px] h-[12px] flex-shrink-0 text-black" />
                              <span className="text-[10px] leading-[1.4] font-bold text-black">
                                Read-only snapshot. To modify, go back and create a new report.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-[6px] mt-[10px] mb-[8px] rounded-[8px] p-[7px_10px]" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)' }}>
                              <Archive className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
                              <span className="text-[10px] leading-[1.4] font-bold" style={{ color: 'var(--wc-t3)' }}>
                                Permanent archive. Sort cards deleted — this report can no longer be modified.
                              </span>
                            </div>
                          )}

                          {isLinked && (
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
                })}
              </div>
            );
          })
        )}
      </div>

      {locked ? (
        <div className="flex-shrink-0 px-[14px] py-[10px] flex flex-col gap-[8px]" style={{ background: 'rgba(10,10,10,.97)', borderTop: '1px solid var(--wc-border)' }}>
          <button
            className="w-full rounded-[11px] py-[12px] font-heading font-extrabold text-[14px] tracking-[.06em] uppercase text-black cursor-pointer transition-all flex items-center justify-center gap-[6px]"
            style={{ background: 'var(--wc-y)' }}
            onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'review' })}
            data-testid="button-create-another-report"
          >
            <Plus className="w-[15px] h-[15px]" strokeWidth={2.5} />
            Create Another Report
          </button>
          <button
            className="w-full rounded-[11px] py-[10px] font-heading font-bold text-[12px] tracking-[.05em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
            style={{ background: 'rgba(239,68,68,.08)', border: '1.5px solid rgba(239,68,68,.25)', color: 'rgba(239,68,68,.7)' }}
            onClick={() => setConfirmDelete(true)}
            data-testid="button-delete-trips-reports"
          >
            <Trash2 className="w-[13px] h-[13px]" />
            Delete All Sort Cards
          </button>
        </div>
      ) : (
        <BottomNav activeOverride="reports" />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="mx-6 w-full max-w-[340px] rounded-[16px] p-[20px_18px] animate-pop"
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(239,68,68,.35)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}
            data-testid="modal-delete-confirm"
          >
            <div className="flex flex-col items-center gap-[10px] mb-[14px]">
              <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,.12)', border: '2px solid rgba(239,68,68,.3)' }}>
                <Trash2 className="w-[22px] h-[22px]" style={{ color: 'var(--wc-re)' }} />
              </div>
              <div className="font-heading font-black text-[18px] uppercase text-white text-center">Delete All Sort Cards?</div>
            </div>
            <div className="flex items-start gap-[8px] rounded-[10px] p-[10px_12px] mb-[16px]" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)' }}>
              <AlertTriangle className="w-[16px] h-[16px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-re)' }} />
              <span className="text-[12px] leading-[1.5]" style={{ color: 'rgba(239,68,68,.85)' }}>
                <strong>This action is not reversible.</strong> Please check your reports are accurate for this session before you decide to delete your sort cards.
              </span>
            </div>
            <div className="flex flex-col gap-[8px]">
              <button
                className="w-full rounded-[11px] py-[11px] font-heading font-bold text-[14px] tracking-[.05em] uppercase cursor-pointer transition-all"
                style={{ background: 'rgba(239,68,68,.15)', border: '1.5px solid rgba(239,68,68,.4)', color: '#EF4444' }}
                onClick={() => { dispatch({ type: 'DELETE_ALL_TRIPS' }); setConfirmDelete(false); dispatch({ type: 'GO_SCREEN', screen: 'sort' }); }}
                data-testid="button-confirm-delete-reports"
              >
                Yes, Delete All Cards
              </button>
              <button
                className="w-full rounded-[11px] py-[10px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all"
                style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={() => setConfirmDelete(false)}
                data-testid="button-cancel-delete-reports"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {conflictSessionId && (() => {
        const groupReports = state.savedReports
          .map((r, i) => ({ ...r, globalIdx: i }))
          .filter(r => r.sessionId === conflictSessionId);
        if (groupReports.length < 2) return null;
        const label = SESSION_LABELS[conflictSessionId] || conflictSessionId;

        return (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)' }}
            onClick={() => setConflictSessionId(null)}
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
                  Select Active Report
                </div>
                <div className="font-data text-[9px] tracking-[.04em]" style={{ color: 'var(--wc-t3)' }}>{label}</div>
                <div className="text-[12px] text-center leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
                  Multiple reports exist for this session. Only <strong className="text-white">one report</strong> can be active for your final ATO submission.
                </div>
              </div>

              <div className="flex flex-col gap-[8px] mb-[14px]">
                {groupReports.map(r => (
                  <div
                    key={r.globalIdx}
                    className="rounded-[10px] p-[10px_12px] cursor-pointer transition-all"
                    style={{
                      background: !r.supersedes ? 'rgba(34,197,94,.06)' : 'rgba(255,255,255,.03)',
                      border: !r.supersedes ? '1.5px solid rgba(34,197,94,.3)' : '1.5px solid var(--wc-border)',
                    }}
                    onClick={() => dispatch({ type: 'PROMOTE_REPORT', reportIndex: r.globalIdx })}
                    data-testid={`conflict-select-${r.globalIdx}`}
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
                onClick={() => setConflictSessionId(null)}
                data-testid="button-conflict-done"
              >
                Done
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
