import { useState, useMemo } from 'react';
import { useApp, getEstimatorParamsFromState } from '@/lib/app-context';
import { getLogbookStatus, isLogbookArchived, validateRestartCode, getActivePeriod } from '@/lib/logbook-utils';
import { calcLogbookDeduction, getVehicleCosts } from '@/lib/trip-data';
import { CheckCircle, FileText, Download, Archive, ArrowRight, Lock, AlertTriangle, KeyRound, ChevronRight, Calendar, TrendingUp, Route, BarChart3 } from 'lucide-react';

export function LogbookCompleteScreen() {
  const { state, dispatch } = useApp();
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestartInput, setShowRestartInput] = useState(false);
  const [restartCode, setRestartCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const activePeriod = getActivePeriod(state.logbookPeriods);
  const logbook = getLogbookStatus(activePeriod);
  const archived = isLogbookArchived(activePeriod);

  const stats = useMemo(() => {
    const activeReports = state.savedReports.filter(r => !r.supersedes);
    let totalTrips = 0;
    let bizTrips = 0;
    let perTrips = 0;
    let bizKm = 0;
    let totalKm = 0;

    for (const r of activeReports) {
      totalTrips += (r.bizCount || 0) + (r.perCount || 0);
      bizTrips += r.bizCount || 0;
      perTrips += r.perCount || 0;
      bizKm += parseFloat(r.totalKm || '0');
      totalKm += r.allKm ?? r.trips?.reduce((s, t) => s + (t.km || 0), 0) ?? parseFloat(r.totalKm || '0');
    }

    const unsortedCurrent = state.trips.length - state.currentIndex;
    const bizPct = totalKm > 0 ? Math.round((bizKm / totalKm) * 100) : 0;
    const params = getEstimatorParamsFromState(state, (state.bizCount || 0) > 0);
    const vehicleCosts = getVehicleCosts(params);
    const deduction = calcLogbookDeduction(bizKm, totalKm, vehicleCosts);
    const hasReports = activeReports.length > 0;

    return { totalTrips, bizTrips, perTrips, bizKm, totalKm, unsortedCurrent, bizPct, deduction, hasReports, reportCount: activeReports.length };
  }, [state.savedReports, state.trips, state.currentIndex]);

  const steps = [
    { label: 'All trips sorted', done: stats.unsortedCurrent === 0 },
    { label: 'Reports generated', done: stats.hasReports },
    { label: 'Data exported', done: stats.hasReports },
    { label: 'Logbook archived', done: archived },
  ];

  const handleArchive = () => {
    dispatch({ type: 'ARCHIVE_LOGBOOK' });
    dispatch({ type: 'GO_SCREEN', screen: 'dashboard' });
    setShowArchiveConfirm(false);
  };

  const handleRestart = () => {
    if (validateRestartCode(restartCode)) {
      dispatch({ type: 'RESTART_LOGBOOK' });
      setShowRestartInput(false);
      setRestartCode('');
    } else {
      setCodeError('Invalid code. Contact support for a restart code.');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--wc-yd)', border: '2.5px solid var(--wc-y)' }}>
            <CheckCircle className="w-[30px] h-[30px]" style={{ color: 'var(--wc-y)' }} />
          </div>
          <div className="font-display text-[28px] leading-none text-center mb-1" data-testid="text-logbook-complete">
            {archived ? 'Logbook Archived' : 'Logbook Complete'}
          </div>
          <div className="text-[12px] text-center leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
            {logbook.startDate && logbook.endDate ? (
              <>
                {logbook.startDate.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' — '}
                {logbook.endDate.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' · 12 weeks'}
              </>
            ) : '12-week logbook period'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[8px] mb-4">
          <div className="rounded-xl p-[12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="flex items-center gap-[6px] mb-[6px]">
              <Route className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>Total Distance</span>
            </div>
            <div className="font-heading font-black text-[22px] leading-none" data-testid="text-total-km">
              {stats.totalKm.toFixed(0)}<span className="text-[11px] font-bold" style={{ color: 'var(--wc-t3)' }}> km</span>
            </div>
          </div>
          <div className="rounded-xl p-[12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="flex items-center gap-[6px] mb-[6px]">
              <TrendingUp className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>Business Use</span>
            </div>
            <div className="font-heading font-black text-[22px] leading-none" data-testid="text-biz-pct">
              {stats.bizPct}<span className="text-[11px] font-bold" style={{ color: 'var(--wc-t3)' }}>%</span>
            </div>
          </div>
          <div className="rounded-xl p-[12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="flex items-center gap-[6px] mb-[6px]">
              <BarChart3 className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>Total Trips</span>
            </div>
            <div className="font-heading font-black text-[22px] leading-none" data-testid="text-total-trips">
              {stats.totalTrips}
            </div>
            <div className="font-data text-[8px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>
              {stats.bizTrips} business · {stats.perTrips} personal
            </div>
          </div>
          <div className="rounded-xl p-[12px]" style={{ background: 'var(--wc-yd)', border: '1px solid var(--wc-y)' }}>
            <div className="flex items-center gap-[6px] mb-[6px]">
              <Calendar className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-y)' }}>Est. Deduction</span>
            </div>
            <div className="font-heading font-black text-[22px] leading-none" style={{ color: 'var(--wc-y)' }} data-testid="text-deduction">
              ${Math.round(stats.deduction).toLocaleString('en-AU')}
            </div>
          </div>
        </div>

        {stats.unsortedCurrent > 0 && !archived && (
          <div className="flex items-start gap-[8px] rounded-xl p-[12px] mb-4" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
            <AlertTriangle className="w-[16px] h-[16px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-am)' }} />
            <div>
              <div className="text-[12px] font-bold" style={{ color: 'var(--wc-am)' }}>
                {stats.unsortedCurrent} trip{stats.unsortedCurrent !== 1 ? 's' : ''} still unsorted
              </div>
              <div className="text-[10px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>
                Sort remaining trips before generating your final report.
              </div>
              <button
                className="mt-[8px] rounded-lg px-[14px] py-[6px] font-heading font-bold text-[11px] uppercase tracking-[.04em] cursor-pointer"
                style={{ background: 'var(--wc-am)', color: '#fff' }}
                onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'sort' })}
                data-testid="button-sort-remaining"
              >
                Sort Remaining Trips
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl p-[14px] mb-4" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="font-heading font-bold text-[11px] uppercase tracking-[.06em] mb-[10px]" style={{ color: 'var(--wc-t2)' }}>
            Completion Checklist
          </div>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-[10px] py-[8px]" style={{ borderTop: i > 0 ? '1px solid var(--wc-border)' : 'none' }}>
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                style={step.done
                  ? { background: 'var(--wc-y)', border: '1.5px solid var(--wc-y)' }
                  : { background: 'transparent', border: '1.5px solid var(--wc-border)' }
                }
              >
                {step.done && (
                  <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="var(--wc-bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-[12px] font-heading font-bold" style={{ color: step.done ? 'var(--wc-text)' : 'var(--wc-t3)', textDecoration: step.done ? 'line-through' : 'none' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {!archived && (
          <div className="flex flex-col gap-[8px] mb-4">
            <button
              className="w-full rounded-xl py-[13px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
              style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
              onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'export' })}
              data-testid="button-final-reports"
            >
              <FileText className="w-[16px] h-[16px]" />
              Generate Final Reports
              <ArrowRight className="w-[14px] h-[14px]" />
            </button>

            {stats.hasReports && (
              <button
                className="w-full rounded-xl py-[12px] font-heading font-bold text-[14px] tracking-[.06em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid rgb(var(--wc-ink) / .2)', color: 'var(--wc-text)' }}
                onClick={() => setShowArchiveConfirm(true)}
                data-testid="button-archive-logbook"
              >
                <Archive className="w-[15px] h-[15px]" />
                Archive Logbook
              </button>
            )}
          </div>
        )}

        {archived && (
          <div className="rounded-xl p-[14px] mb-4" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1.5px solid var(--wc-border)' }}>
            <div className="flex items-center gap-[8px] mb-[8px]">
              <Lock className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t3)' }} />
              <div className="font-heading font-bold text-[12px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-t2)' }}>
                Logbook Locked
              </div>
            </div>
            <div className="text-[11px] leading-[1.5] mb-[12px]" style={{ color: 'var(--wc-t3)' }}>
              This logbook has been archived. You can view your reports and stats but cannot add or modify trips. To start a new 12-week logbook, enter a restart code.
            </div>

            <div className="flex flex-col gap-[8px]">
              <button
                className="w-full rounded-xl py-[12px] font-heading font-bold text-[14px] tracking-[.06em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
                style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'reports' })}
                data-testid="button-view-reports"
              >
                <FileText className="w-[15px] h-[15px]" />
                View Reports
              </button>
              <button
                className="w-full rounded-xl py-[12px] font-heading font-bold text-[14px] tracking-[.06em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
                style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'stats' })}
                data-testid="button-view-stats"
              >
                <BarChart3 className="w-[15px] h-[15px]" />
                View Stats
              </button>

              {!showRestartInput ? (
                <button
                  className="w-full rounded-xl py-[12px] font-heading font-bold text-[13px] tracking-[.06em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
                  style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                  onClick={() => setShowRestartInput(true)}
                  data-testid="button-enter-restart-code"
                >
                  <KeyRound className="w-[14px] h-[14px]" />
                  Enter Restart Code
                </button>
              ) : (
                <div className="rounded-xl p-[12px]" style={{ border: '1.5px solid var(--wc-border)' }}>
                  <div className="font-heading font-bold text-[11px] uppercase tracking-[.04em] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>
                    Enter your restart code
                  </div>
                  <input
                    type="text"
                    value={restartCode}
                    onChange={e => { setRestartCode(e.target.value.toUpperCase()); setCodeError(''); }}
                    placeholder="XXXXXXXX"
                    className="w-full rounded-lg px-[12px] py-[10px] font-data text-[14px] tracking-[.1em] text-center uppercase mb-[8px]"
                    style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)', outline: 'none' }}
                    data-testid="input-restart-code"
                  />
                  {codeError && (
                    <div className="text-[10px] mb-[6px] text-center" style={{ color: 'var(--wc-re)' }}>{codeError}</div>
                  )}
                  <div className="flex gap-[6px]">
                    <button
                      className="flex-1 rounded-lg py-[9px] font-heading font-bold text-[12px] uppercase tracking-[.04em] cursor-pointer"
                      style={{ background: 'transparent', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                      onClick={() => { setShowRestartInput(false); setRestartCode(''); setCodeError(''); }}
                      data-testid="button-cancel-restart"
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 rounded-lg py-[9px] font-heading font-bold text-[12px] uppercase tracking-[.04em] cursor-pointer"
                      style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)', opacity: restartCode.length === 0 ? 0.4 : 1 }}
                      onClick={handleRestart}
                      disabled={restartCode.length === 0}
                      data-testid="button-submit-restart"
                    >
                      Start New Logbook
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-[9px] text-center leading-[1.4] pb-2" style={{ color: 'var(--wc-t3)' }}>
          Your logbook data is valid for <strong style={{ color: 'var(--wc-text)' }}>5 years</strong> of ATO tax deductions.
          Keep your exported reports in a safe location.
        </div>
      </div>

      {showArchiveConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowArchiveConfirm(false)}
        >
          <div
            className="mx-6 w-full max-w-[340px] rounded-[16px] p-[20px_18px] animate-pop"
            style={{ background: 'var(--wc-card)', border: '1.5px solid var(--wc-border)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}
            data-testid="modal-archive-confirm"
          >
            <div className="flex flex-col items-center gap-[10px] mb-[14px]">
              <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .08)', border: '2px solid rgb(var(--wc-ink) / .2)' }}>
                <Archive className="w-[22px] h-[22px]" style={{ color: 'var(--wc-y)' }} />
              </div>
              <div className="font-heading font-black text-[18px] uppercase text-center" style={{ color: 'var(--wc-text)' }}>
                Archive Logbook?
              </div>
            </div>
            <div className="flex items-start gap-[8px] rounded-[10px] p-[10px_12px] mb-[16px]" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
              <AlertTriangle className="w-[16px] h-[16px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-am)' }} />
              <span className="text-[12px] leading-[1.5]" style={{ color: 'rgb(var(--wc-ink) / .75)' }}>
                <strong>This locks your logbook.</strong> You will no longer be able to add or modify trips. You can still view your reports and stats. A restart code is required to begin a new logbook.
              </span>
            </div>
            <div className="flex flex-col gap-[8px]">
              <button
                className="w-full rounded-[11px] py-[11px] font-heading font-bold text-[14px] tracking-[.05em] uppercase cursor-pointer transition-all"
                style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                onClick={handleArchive}
                data-testid="button-confirm-archive"
              >
                Yes, Archive Logbook
              </button>
              <button
                className="w-full rounded-[11px] py-[10px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all"
                style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={() => setShowArchiveConfirm(false)}
                data-testid="button-cancel-archive"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
