import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp, useComputedStats } from '@/lib/app-context';
import { RATE } from '@/lib/trip-data';
import { TripCard } from './trip-card';
import { BottomNav } from './bottom-nav';
import { Undo2, ChevronRight, AlertTriangle, Trash2 } from 'lucide-react';

function MiniCalendar({ day, month, year }: { day: number; month: number; year: number }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const first = new Date(year, month, 1).getDay();
  const off = first === 0 ? 6 : first - 1;
  const dim = new Date(year, month + 1, 0).getDate();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="flex-1 rounded-[11px] p-[7px_9px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
      <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Trip Day</div>
      <div className="font-heading font-bold text-[11px] uppercase mb-[2px] text-center" style={{ color: 'var(--wc-t2)' }}>{months[month]} {year}</div>
      <div className="grid grid-cols-7 gap-[1px]">
        {days.map((d, i) => (
          <div key={i} className="font-data text-[6px] text-center" style={{ color: 'var(--wc-t3)' }}>{d}</div>
        ))}
        {Array.from({ length: off }).map((_, i) => (
          <div key={`e${i}`} className="font-heading font-semibold text-[10px] text-center p-[2px_1px] text-transparent">.</div>
        ))}
        {Array.from({ length: dim }).map((_, i) => {
          const d = i + 1;
          const isActive = d === day;
          const isPast = d < day;
          return (
            <div
              key={d}
              className="font-heading font-semibold text-[10px] text-center p-[2px_1px] rounded-[3px] leading-none"
              style={{
                color: isActive ? '#000' : isPast ? 'var(--wc-t2)' : 'var(--wc-t3)',
                background: isActive ? 'var(--wc-y)' : 'transparent',
                fontWeight: isActive ? 900 : 600,
                borderRadius: isActive ? '4px' : '3px',
                boxShadow: isActive ? '0 0 5px var(--wc-yg)' : 'none',
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BusinessDial({ pct }: { pct: number }) {
  const arcLen = 84.82;
  const offset = arcLen - (arcLen * pct / 100);
  const strokeColor = pct >= 55 && pct <= 75 ? '#22C55E' : pct > 85 ? '#EF4444' : '#F5C400';

  return (
    <div className="flex-1 rounded-[11px] p-[7px_9px] flex flex-col items-center gap-[2px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
      <div className="font-data text-[7px] uppercase tracking-[.1em] self-start" style={{ color: 'var(--wc-t3)' }}>Business Use %</div>
      <div className="relative w-[70px] h-[42px]">
        <svg viewBox="0 0 70 42" width="70" height="42">
          <path d="M 7 38 A 27 27 0 0 1 63 38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5.5" strokeLinecap="round" />
          <path
            d="M 7 38 A 27 27 0 0 1 63 38"
            fill="none"
            stroke={strokeColor}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset .9s ease' }}
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-heading font-black text-[17px] leading-none" style={{ color: 'var(--wc-y)' }}>{Math.round(pct)}%</div>
      </div>
      <div className="w-full h-[4px] rounded-[2px] relative" style={{ background: 'rgba(255,255,255,.08)' }}>
        <div className="h-full rounded-[2px] transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--wc-gr),var(--wc-y))' }} />
        <div className="absolute top-[-4px] w-[2px] h-[12px] rounded-[1px] transition-all duration-700" style={{ left: `calc(${pct}% - 1px)`, background: 'var(--wc-y)' }} />
      </div>
      <div className="flex justify-between w-full font-data text-[6px]" style={{ color: 'var(--wc-t3)' }}>
        <span>0%</span><span>100%</span>
      </div>
      <div className="text-[8px] text-center" style={{ color: 'var(--wc-t3)' }}>Avg: <span className="font-semibold" style={{ color: 'rgba(245,196,0,.65)' }}>55\u201375%</span></div>
    </div>
  );
}

export function SortScreen() {
  const { state, dispatch } = useApp();
  const stats = useComputedStats();
  const [flashAmt, setFlashAmt] = useState<string | null>(null);
  const [dedPop, setDedPop] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tutorialPhase, setTutorialPhase] = useState<'idle' | 'left' | 'right' | 'done'>('idle');
  const tutorialRan = useRef(false);
  const tutorialTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (tutorialRan.current || state.currentIndex > 0) return;
    tutorialRan.current = true;
    const t1 = setTimeout(() => setTutorialPhase('left'), 600);
    const t2 = setTimeout(() => setTutorialPhase('right'), 2000);
    const t3 = setTimeout(() => setTutorialPhase('done'), 3400);
    tutorialTimers.current = [t1, t2, t3];
    return () => { t1 && clearTimeout(t1); t2 && clearTimeout(t2); t3 && clearTimeout(t3); };
  }, [state.currentIndex]);

  useEffect(() => {
    if (state.currentIndex > 0 && tutorialPhase !== 'done') {
      tutorialTimers.current.forEach(clearTimeout);
      setTutorialPhase('done');
    }
  }, [state.currentIndex, tutorialPhase]);

  const currentTrip = state.trips[state.currentIndex];
  const isComplete = state.currentIndex >= state.trips.length;
  const remaining = state.trips.length - state.currentIndex;

  const handleClassify = useCallback((type: 'business' | 'personal') => {
    const trip = state.trips[state.currentIndex];
    if (!trip) return;
    if (type === 'business') {
      const earned = trip.km * RATE;
      setFlashAmt('+$' + earned.toFixed(2));
      setDedPop(true);
      setTimeout(() => setFlashAmt(null), 1100);
      setTimeout(() => setDedPop(false), 500);
    }
    dispatch({ type: 'CLASSIFY_TRIP', tripType: type });
  }, [state.currentIndex, state.trips, dispatch]);

  const logbookPct = Math.min(100, Math.round((state.dedTotal / 5000) * 100));

  const sortDone = isComplete;
  const classifyDone = state.classifyBizTrips.length > 0 && state.classifyStep >= state.classifyBizTrips.length;
  const odoDone = state.lastOdoReading != null;

  const nextScreen = !sortDone ? null : !classifyDone ? 'classify' as const : 'review' as const;

  return (
    <div className="flex flex-col h-full" data-testid="sort-screen">
      <div className="flex items-center px-[14px] pt-[5px] pb-[3px] flex-shrink-0 gap-[6px]">
        <button
          className="flex items-center gap-[4px] rounded-[8px] px-[8px] py-[4px] transition-all"
          style={{
            background: 'rgba(255,255,255,.06)',
            border: '1px solid var(--wc-border)',
            opacity: state.lastAction ? 1 : 0,
            pointerEvents: state.lastAction ? 'auto' : 'none',
          }}
          onClick={() => dispatch({ type: 'UNDO_LAST' })}
          data-testid="button-undo"
        >
          <Undo2 className="w-[12px] h-[12px]" style={{ color: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[10px] tracking-[.04em] uppercase" style={{ color: 'var(--wc-y)' }}>Undo</span>
        </button>

        <div className="flex items-center gap-[6px]">
          {([
            { id: 'step1', label: 'Sort', active: !sortDone, done: sortDone, screen: 'sort' as const },
            { id: 'step2', label: 'Classify', active: sortDone && !classifyDone, done: classifyDone, screen: 'classify' as const },
            { id: 'step3', label: 'Review', active: sortDone && classifyDone && !odoDone, done: sortDone && classifyDone && odoDone, screen: 'review' as const },
            { id: 'step4', label: 'Odo', active: false, done: odoDone, screen: 'odometer' as const },
          ]).map((step, i, arr) => (
            <div key={step.id} className="flex items-center gap-[3px]">
              <div
                className="w-[14px] h-[14px] rounded-full flex items-center justify-center font-heading text-[7px] font-bold transition-all"
                style={{
                  background: step.active ? 'var(--wc-y)' : step.done ? 'rgba(245,196,0,.15)' : 'var(--wc-bg)',
                  border: step.active ? '1.5px solid var(--wc-y)' : step.done ? '1.5px solid rgba(245,196,0,.5)' : '1.5px solid var(--wc-border)',
                  color: step.active ? '#000' : step.done ? 'var(--wc-y)' : 'var(--wc-t3)',
                }}
              >
                {step.done ? '\u2713' : i + 1}
              </div>
              <span className="font-data text-[7px] uppercase tracking-[.04em]" style={{ color: step.active ? 'var(--wc-y)' : step.done ? 'rgba(245,196,0,.55)' : 'var(--wc-t3)' }}>
                {step.label}
              </span>
              {i < arr.length - 1 && (
                <div className="w-[6px] h-px" style={{ background: step.done ? 'rgba(245,196,0,.4)' : 'var(--wc-border)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-[5px] ml-auto">
          <div className="flex items-center gap-[3px] rounded-[20px] px-[7px] py-[2px]" style={{ background: 'var(--wc-yd)', border: '1px solid rgba(245,196,0,.2)' }}>
            <span className="font-heading font-black text-[13px]" style={{ color: 'var(--wc-y)' }} data-testid="text-remaining">{remaining}</span>
            <span className="font-heading font-semibold text-[9px] uppercase tracking-[.03em]" style={{ color: 'rgba(245,196,0,.6)' }}>left</span>
          </div>
          {nextScreen && (
            <button
              className="flex items-center gap-[2px] rounded-[20px] px-[7px] py-[2px] cursor-pointer transition-all"
              style={{ background: 'var(--wc-yd)', border: '1px solid rgba(245,196,0,.35)' }}
              onClick={() => nextScreen === 'classify' ? dispatch({ type: 'INIT_CLASSIFY' }) : dispatch({ type: 'GO_SCREEN', screen: nextScreen })}
              data-testid="button-next-step"
            >
              <span className="font-heading font-bold text-[9px] uppercase tracking-[.03em]" style={{ color: 'var(--wc-y)' }}>Next</span>
              <ChevronRight className="w-[10px] h-[10px]" style={{ color: 'var(--wc-y)' }} />
            </button>
          )}
          <div className="flex items-center gap-[3px] rounded-[20px] px-[6px] py-[2px]" style={{ background: 'var(--wc-grd)', border: '1px solid rgba(34,197,94,.2)' }}>
            <div className="w-[5px] h-[5px] rounded-full animate-gps" style={{ background: 'var(--wc-gr)' }} />
            <span className="font-data text-[7px] tracking-[.06em]" style={{ color: 'var(--wc-gr)' }}>GPS</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-[5px] flex-shrink-0">
        <div className="h-1 rounded-[2px] overflow-hidden" style={{ background: 'rgba(255,255,255,.07)' }}>
          <div
            className="h-full rounded-[2px] transition-all duration-500"
            style={{ width: `${stats.progress}%`, background: 'linear-gradient(90deg,var(--wc-y),#ffe066)' }}
            data-testid="progress-bar"
          />
        </div>
      </div>

      <div className="flex-1 relative mx-[14px]">
        {flashAmt && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="font-heading font-black text-[58px] leading-none animate-big-pop" style={{ color: 'var(--wc-gr)', textShadow: '0 0 40px rgba(34,197,94,.5)' }}>
              {flashAmt}
            </div>
          </div>
        )}

        {!isComplete ? (
          <>
            {state.trips.slice(state.currentIndex, state.currentIndex + 3).map((trip, offset) => (
              <TripCard
                key={trip.id}
                trip={trip}
                tripIndex={state.currentIndex + offset}
                isTop={offset === 0}
                position={offset}
                onClassify={handleClassify}
                onEdit={() => dispatch({ type: 'OPEN_EDIT', tripIndex: state.currentIndex + offset })}
                tutorialPhase={offset === 0 ? tutorialPhase : 'done'}
              />
            ))}
          </>
        ) : state.trips.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[12px] p-7 z-50">
            <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.04)', border: '2px solid var(--wc-border)' }}>
              <Trash2 className="w-7 h-7" style={{ color: 'var(--wc-t3)' }} />
            </div>
            <div className="font-heading font-black text-[22px] uppercase text-white text-center leading-none" data-testid="text-no-trips">No Sort Cards</div>
            <div className="text-[12px] text-center leading-[1.5]" style={{ color: 'var(--wc-t3)' }}>
              All sort cards have been deleted. Use Reset Demo to load sample trips, or connect your GPS to import new trips.
            </div>
            <div className="flex flex-col gap-[7px] w-full mt-1">
              <button
                className="w-full rounded-[11px] py-3 font-heading font-extrabold text-[16px] tracking-[.06em] uppercase text-black cursor-pointer transition-all"
                style={{ background: 'var(--wc-y)' }}
                onClick={() => dispatch({ type: 'RESET_DEMO' })}
                data-testid="button-reload-demo"
              >
                Load Sample Trips
              </button>
              {state.savedReports.length > 0 && (
                <button
                  className="w-full rounded-[11px] py-[10px] font-heading font-bold text-[14px] tracking-[.06em] uppercase cursor-pointer transition-all"
                  style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                  onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'reports' })}
                  data-testid="button-view-reports-empty"
                >
                  View Saved Reports
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[9px] p-7 z-50">
            <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center" style={{ background: 'var(--wc-yd)', border: '2px solid var(--wc-y)' }}>
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div className="font-heading font-black text-[26px] uppercase text-white text-center leading-none" data-testid="text-complete">All Sorted!</div>
            <div className="text-[12px] text-center" style={{ color: 'var(--wc-t2)' }}>Total estimated deduction*</div>
            <div className="font-heading font-black text-[44px] leading-none" style={{ color: 'var(--wc-y)' }} data-testid="text-total-deduction">
              ${Math.round(state.dedTotal).toLocaleString('en-AU')}
            </div>
            <div className="flex flex-col gap-[7px] w-full mt-1">
              {state.savedReports.length > 0 && (
                <div className="flex items-start gap-[8px] rounded-[10px] p-[10px_12px]" style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)' }} data-testid="warning-existing-report">
                  <AlertTriangle className="w-[16px] h-[16px] flex-shrink-0 mt-[1px]" stroke="var(--wc-am)" />
                  <div className="text-[11px] leading-[1.5]" style={{ color: 'var(--wc-am)' }}>
                    <strong style={{ color: '#F59E0B' }}>Report already exists.</strong> A report (Rev {state.savedReports[0].revision}) was saved on {state.savedReports[0].timestamp}. Continuing will create <strong>Rev {state.savedReports.length + 1}</strong> and mark the previous as superseded. View reports to check which is current.
                  </div>
                </div>
              )}
              <button
                className="w-full rounded-[11px] py-3 font-heading font-extrabold text-[16px] tracking-[.06em] uppercase text-black cursor-pointer transition-all"
                style={{ background: 'var(--wc-y)' }}
                onClick={() => {
                  if (state.savedReports.length > 0) {
                    dispatch({ type: 'GO_SCREEN', screen: 'review' });
                  } else {
                    dispatch({ type: 'INIT_CLASSIFY' });
                  }
                }}
                data-testid="button-classify-trips"
              >
                {state.savedReports.length > 0 ? 'Edit & Create Rev ' + (state.savedReports.length + 1) + ' \u2192' : 'Classify Business Trips \u2192'}
              </button>
              <button
                className="w-full rounded-[11px] py-[10px] font-heading font-bold text-[14px] tracking-[.06em] uppercase cursor-pointer transition-all"
                style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'review' })}
                data-testid="button-review-all"
              >
                Review All Trips
              </button>
              <button
                className="text-[11px] py-[3px] cursor-pointer"
                style={{ color: 'var(--wc-t3)' }}
                onClick={() => dispatch({ type: 'RESET_DEMO' })}
                data-testid="button-reset"
              >
                &larr; Reset demo
              </button>

              <button
                className="w-full rounded-[11px] py-[9px] mt-[6px] font-heading font-bold text-[12px] tracking-[.05em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
                style={{ background: 'rgba(239,68,68,.08)', border: '1.5px solid rgba(239,68,68,.25)', color: 'rgba(239,68,68,.7)' }}
                onClick={() => setConfirmDelete(true)}
                data-testid="button-delete-trips"
              >
                <Trash2 className="w-[13px] h-[13px]" />
                Delete All Sort Cards
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0" style={{ background: 'rgba(10,10,10,.97)', borderTop: '1px solid var(--wc-border)' }}>
        <div className="px-[14px] pt-[6px] flex flex-col gap-1">
          <div className="rounded-[11px] p-[8px_13px] relative overflow-hidden" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[11px]" style={{ background: 'var(--wc-y)' }} />
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Logbook Claim Est.*</div>
                <div className={`font-heading font-black text-[26px] leading-none ${dedPop ? 'animate-pop' : ''}`} style={{ color: 'var(--wc-y)' }} data-testid="text-deduction">
                  ${Math.round(state.dedTotal).toLocaleString('en-AU')}
                </div>
              </div>
              <div className="text-right">
                <div className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Business</div>
                <div className="font-heading font-bold text-[15px]" style={{ color: 'var(--wc-t2)' }} data-testid="text-biz-count">{state.bizCount} trips</div>
              </div>
            </div>
            <div className="font-data text-[8px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>
              *<button className="border-b" style={{ color: 'rgba(245,196,0,.55)', borderColor: 'rgba(245,196,0,.22)' }} onClick={() => dispatch({ type: 'OPEN_ATO' })} data-testid="button-ato-info">ATO rates TR 2021/1</button> &middot; Estimates only &middot; Not tax advice
            </div>
            <div className="mt-[6px]">
              <div className="h-1 rounded-[2px] overflow-hidden relative" style={{ background: 'rgba(255,255,255,.07)' }}>
                <div className="h-full rounded-[2px] transition-all duration-700" style={{ width: `${logbookPct}%`, background: 'linear-gradient(90deg,rgba(34,197,94,.8),var(--wc-y),#ffe066)' }} />
              </div>
              <div className="flex justify-between mt-[3px]">
                <span className="font-data text-[7px] tracking-[.05em]" style={{ color: 'var(--wc-t3)' }}>Logbook coverage: <span data-testid="text-logbook-pct">{logbookPct}%</span></span>
                <button className="text-[9px] font-semibold cursor-pointer" style={{ color: 'rgba(245,196,0,.55)' }} onClick={() => dispatch({ type: 'OPEN_ATO' })}>No cap with logbook method &nearr;</button>
              </div>
            </div>
          </div>

          <div className="flex gap-[5px]">
            <BusinessDial pct={stats.bizPct} />
            {currentTrip && <MiniCalendar day={currentTrip.day} month={currentTrip.month} year={currentTrip.year} />}
            {!currentTrip && state.trips.length > 0 && <MiniCalendar day={state.trips[state.trips.length - 1].day} month={state.trips[state.trips.length - 1].month} year={state.trips[state.trips.length - 1].year} />}
          </div>

          <div className="py-[2px]">
            <div className="text-[9px] text-center leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
              <span style={{ color: 'rgba(239,68,68,.55)' }}>False or inflated claims are a serious offence.</span> WorkCar logs all classifications with timestamps to an immutable audit trail.
            </div>
          </div>
        </div>

        <BottomNav activeOverride="sort" />
      </div>

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
                onClick={() => { dispatch({ type: 'DELETE_ALL_TRIPS' }); setConfirmDelete(false); }}
                data-testid="button-confirm-delete"
              >
                Yes, Delete All Cards
              </button>
              <button
                className="w-full rounded-[11px] py-[10px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all"
                style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={() => setConfirmDelete(false)}
                data-testid="button-cancel-delete"
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
