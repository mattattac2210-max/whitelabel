import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/app-context';
import { calcLogbookDeduction } from '@/lib/trip-data';
import { MapPin, FileText, Download, Plus, ChevronRight, Navigation, Receipt, BarChart3, Key, Car, Info, AlertTriangle, Settings, HelpCircle, Play, BookOpen, ArrowRight, X, RotateCcw, Eye, TrendingUp, Fuel, Calendar, Route, DollarSign, Target, Clock } from 'lucide-react';
import { getReadinessChecks, getDeductionState, getEstimateDisclaimer, getEstimateMode } from '@/lib/deduction-estimator';
import { DeductionCard, ReadinessCard } from '@/components/deduction-card';
import { getAssistantMode, setAssistantMode as saveAssistantMode } from '@/lib/assistant-mode';
import { getLogbookStatus, isLogbookArchived, getActivePeriod } from '@/lib/logbook-utils';

export function DashboardScreen() {
  const { state, dispatch } = useApp();
  const [autoTrack, setAutoTrack] = useState(() => {
    const stored = localStorage.getItem('wc_autotrack');
    if (stored === null) {
      localStorage.setItem('wc_autotrack', '1');
      return true;
    }
    return stored === '1';
  });
  const [showAutoTrackWarning, setShowAutoTrackWarning] = useState(false);
  const [logbookStart, setLogbookStart] = useState<string | null>(() => localStorage.getItem('wc_logbook_start'));
  const [showLogbookInfo, setShowLogbookInfo] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [assistantMode, setAssistantMode] = useState(() => getAssistantMode());
  const [slideIdx, setSlideIdx] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SLIDE_COUNT = 9;

  const resetAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % SLIDE_COUNT);
    }, 3000);
  }, []);

  useEffect(() => {
    resetAutoSlide();
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, [resetAutoSlide]);

  const unsortedCount = state.trips.length - state.currentIndex;
  const queuedCount = state.queuedTrips.length;
  const totalUnsorted = unsortedCount + queuedCount;

  const activeReports = useMemo(() =>
    state.savedReports.filter(r => !r.supersedes),
    [state.savedReports]
  );

  const currentSessionHasReport = useMemo(() =>
    activeReports.some(r => r.sessionId === state.sessionId),
    [activeReports, state.sessionId]
  );

  const { totalTrips, bizKm, totalKmAll, dedTotal, totalBizCount, totalPerCount } = useMemo(() => {
    let rTrips = 0, rBizKm = 0, rAllKm = 0, rDed = 0, rBiz = 0, rPer = 0;
    for (const r of activeReports) {
      const include = currentSessionHasReport ? true : r.sessionId !== state.sessionId;
      if (include) {
        rTrips += r.bizCount + r.perCount;
        rBizKm += parseFloat(r.totalKm) || 0;
        rAllKm += (typeof r.allKm === 'number' ? r.allKm : parseFloat(r.totalKm || '0')) || 0;
        rDed += parseFloat(r.est.replace(/[^0-9.]/g, '')) || 0;
        rBiz += r.bizCount;
        rPer += r.perCount;
      }
    }
    if (!currentSessionHasReport) {
      const sorted = state.trips.slice(0, state.currentIndex);
      rTrips += state.currentIndex;
      rBizKm += sorted.filter(t => t.type === 'business').reduce((s, t) => s + t.km, 0);
      rAllKm += sorted.reduce((s, t) => s + t.km, 0);
      rDed += state.dedTotal;
      rBiz += state.bizCount;
      rPer += state.perCount;
    }
    return { totalTrips: rTrips, bizKm: rBizKm, totalKmAll: rAllKm, dedTotal: rDed, totalBizCount: rBiz, totalPerCount: rPer };
  }, [activeReports, currentSessionHasReport, state.sessionId, state.currentIndex, state.trips, state.dedTotal, state.bizCount, state.perCount]);

  const hasBizTrips = totalBizCount > 0;

  const showDeductionEstimates = useMemo(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('wc_settings') || '{}');
      return settings.showDeductionEstimates !== false;
    } catch {
      return true;
    }
  }, []);

  const estimateMode = useMemo(() => getEstimateMode(), []);
  const readinessChecks = useMemo(() => getReadinessChecks({ hasBizTrips }), [hasBizTrips]);
  const deductionState = useMemo(() => getDeductionState(readinessChecks, showDeductionEstimates), [readinessChecks, showDeductionEstimates]);
  const disclaimer = useMemo(() => getEstimateDisclaimer(deductionState), [deductionState]);

  const avgTripKm = useMemo(() => totalTrips > 0 ? totalKmAll / totalTrips : 0, [totalKmAll, totalTrips]);

  const dayStats = useMemo(() => {
    const days: Record<string, { biz: number; per: number }> = {};
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayNames.forEach(d => { days[d] = { biz: 0, per: 0 }; });
    const allTrips: any[] = [...state.trips.slice(0, state.currentIndex)];
    for (const r of activeReports) {
      if (r.trips) allTrips.push(...r.trips.filter((t: any) => t.type !== null));
    }
    allTrips.forEach((t: any) => {
      let dayName: string | null = null;
      if ((t as any).year !== undefined && (t as any).month !== undefined && (t as any).day !== undefined) {
        const d = new Date((t as any).year, (t as any).month, (t as any).day);
        dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      } else if (typeof t.date === 'string') {
        const match = t.date.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i);
        if (match) dayName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      }
      if (dayName && days[dayName]) {
        if (t.type === 'business') days[dayName].biz += 1;
        else days[dayName].per += 1;
      }
    });
    return dayNames.map(name => ({ name, ...days[name] }));
  }, [state.trips, state.currentIndex, activeReports]);

  const topDestinations = useMemo(() => {
    const map: Record<string, number> = {};
    const allTrips: any[] = [...state.trips.slice(0, state.currentIndex)];
    for (const r of activeReports) {
      if (r.trips) allTrips.push(...r.trips.filter((t: any) => t.type !== null));
    }
    allTrips.forEach((t: any) => {
      if (t.to) map[t.to] = (map[t.to] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [state.trips, state.currentIndex, activeReports]);

  const bizPctOverTime = useMemo(() => {
    const monthMap: Record<string, { biz: number; total: number }> = {};
    const allTrips: any[] = [...state.trips.slice(0, state.currentIndex)];
    for (const r of activeReports) {
      if (r.trips) allTrips.push(...r.trips.filter((t: any) => t.type !== null));
    }
    allTrips.forEach((t: any) => {
      let key: string | null = null;
      if ((t as any).year !== undefined && (t as any).month !== undefined) {
        const m = (t as any).month + 1;
        key = `${String(m).padStart(2, '0')}/${String((t as any).year).slice(-2)}`;
      } else if (typeof t.date === 'string') {
        const match = t.date.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (match) key = `${match[2].padStart(2, '0')}/${match[3].slice(-2)}`;
      }
      if (key) {
        if (!monthMap[key]) monthMap[key] = { biz: 0, total: 0 };
        monthMap[key].total += 1;
        if (t.type === 'business') monthMap[key].biz += 1;
      }
    });
    const sorted = Object.entries(monthMap).sort((a, b) => {
      const [am, ay] = a[0].split('/').map(Number);
      const [bm, by] = b[0].split('/').map(Number);
      return ay !== by ? ay - by : am - bm;
    });
    return sorted.slice(-6).map(([label, v]) => ({
      label,
      pct: v.total > 0 ? Math.round((v.biz / v.total) * 100) : 0,
    }));
  }, [state.trips, state.currentIndex, activeReports]);

  const activePeriod = getActivePeriod(state.logbookPeriods);
  const archived = isLogbookArchived(activePeriod);

  const allTiles = [
    { screen: 'sort' as const, label: 'Sort Trips', sub: totalUnsorted > 0 ? `${totalUnsorted} trip${totalUnsorted !== 1 ? 's' : ''} to sort` : 'All sorted', icon: MapPin, primary: true, badge: totalUnsorted, archivedHide: true, fullWidth: true },
    { screen: 'documents' as const, label: 'Documents', sub: 'Reports, expenses & export', icon: FileText, primary: false, archivedHide: false },
    { screen: 'input' as const, label: 'Add Trip', sub: 'Manual or live entry', icon: Plus, primary: false, archivedHide: true },
    { screen: 'stats' as const, label: 'My Stats', sub: 'Trips, km & trends', icon: BarChart3, primary: false, archivedHide: false },
    { screen: 'find-keys' as const, label: 'Find My Keys', sub: 'Last known location', icon: Key, primary: false, archivedHide: true },
  ];

  const tiles = archived ? allTiles.filter(t => !t.archivedHide) : allTiles;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden px-4 pb-2">
        <div className="ob-a1 mb-2 mt-1">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center ob-glow"
              style={{ background: 'rgb(var(--wc-ink) / .07)', border: '1.5px solid rgb(var(--wc-ink) / .22)' }}
            >
              <svg width="22" height="22" viewBox="0 0 52 52" fill="none">
                <path d="M26 4C15 4 7 13 7 21C7 35 26 48 26 48C26 48 45 35 45 21C45 13 37 4 26 4Z" stroke="var(--wc-text)" strokeWidth="2.2" fill="none"/>
                <circle cx="26" cy="21" r="7" stroke="var(--wc-text)" strokeWidth="2.2" fill="none"/>
                <path d="M19 17L22 25L26 19L30 25L33 17" stroke="var(--wc-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="font-display text-[28px] leading-none" data-testid="dashboard-title">
                Smart Logbook
              </div>
              <div className="font-data text-[9px] tracking-[.15em] uppercase" style={{ color: 'var(--wc-t3)' }}>Trip Tracker</div>
            </div>
            <button
              className="ml-auto flex items-center gap-[6px] rounded-[10px] p-[7px_12px] cursor-pointer transition-all active:scale-[.97]"
              style={{
                background: autoTrack ? 'rgba(34,197,94,.1)' : 'rgb(var(--wc-ink) / .04)',
                border: autoTrack ? '1.5px solid rgba(34,197,94,.3)' : '1.5px solid var(--wc-border)',
              }}
              onClick={() => {
                if (autoTrack) {
                  setShowAutoTrackWarning(true);
                } else {
                  setAutoTrack(true);
                  localStorage.setItem('wc_autotrack', '1');
                }
              }}
              data-testid="toggle-autotrack"
            >
              <Navigation className="w-[13px] h-[13px]" style={{ color: autoTrack ? 'var(--wc-gr)' : 'var(--wc-t3)' }} />
              <span className="font-heading font-bold text-[10px] uppercase tracking-[.05em]" style={{ color: autoTrack ? 'var(--wc-gr)' : 'var(--wc-t3)' }}>
                Auto
              </span>
              <div
                className="w-[30px] h-[16px] rounded-full relative transition-all"
                style={{
                  background: autoTrack ? 'rgba(34,197,94,.3)' : 'rgb(var(--wc-ink) / .1)',
                }}
              >
                <div
                  className="absolute top-[2px] w-[12px] h-[12px] rounded-full transition-all"
                  style={{
                    left: autoTrack ? '16px' : '2px',
                    background: autoTrack ? 'var(--wc-gr)' : 'var(--wc-t3)',
                  }}
                />
              </div>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <button
            className="flex-1 flex items-center gap-[8px] rounded-xl p-[10px_12px] cursor-pointer transition-all active:scale-[.98]"
            style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}
            onClick={() => setShowGuide(true)}
            data-testid="button-how-it-works"
          >
            <div className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .08)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
              <BookOpen className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold text-[11px]" style={{ color: 'var(--wc-text)' }}>How This App Works</div>
              <div className="text-[8px] mt-[1px]" style={{ color: 'var(--wc-t3)' }}>Guide & help</div>
            </div>
            <ChevronRight className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
          </button>
          <button
            className="flex items-center gap-[6px] rounded-xl p-[10px_12px] cursor-pointer transition-all active:scale-[.98]"
            style={{
              background: assistantMode ? 'rgb(var(--wc-ink) / .08)' : 'var(--wc-card)',
              border: assistantMode ? '1.5px solid rgb(var(--wc-ink) / .3)' : '1px solid var(--wc-border)',
            }}
            onClick={() => {
              const next = !assistantMode;
              setAssistantMode(next);
              saveAssistantMode(next);
            }}
            data-testid="toggle-assistant-mode"
          >
            <HelpCircle className="w-[16px] h-[16px]" style={{ color: assistantMode ? 'var(--wc-y)' : 'var(--wc-t3)' }} />
            <div className="flex flex-col items-start">
              <div className="font-heading font-bold text-[10px] uppercase tracking-[.04em]" style={{ color: assistantMode ? 'var(--wc-y)' : 'var(--wc-t3)' }}>
                Assist
              </div>
              <div
                className="w-[30px] h-[16px] rounded-full relative transition-all mt-[2px]"
                style={{ background: assistantMode ? 'rgb(var(--wc-ink) / .25)' : 'rgb(var(--wc-ink) / .1)' }}
              >
                <div
                  className="absolute top-[2px] w-[12px] h-[12px] rounded-full transition-all"
                  style={{
                    left: assistantMode ? '16px' : '2px',
                    background: assistantMode ? 'var(--wc-y)' : 'var(--wc-t3)',
                  }}
                />
              </div>
            </div>
          </button>
        </div>

        {!logbookStart && (
          <>
            <div
              className="w-full rounded-[10px] p-[8px_12px] mb-2 flex items-center gap-[8px]"
              style={{ background: 'rgba(var(--wc-ink) / .04)', border: '1.5px dashed rgb(var(--wc-ink) / .2)' }}
              data-testid="demo-mode-banner"
            >
              <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .08)' }}>
                <Eye className="w-[12px] h-[12px]" style={{ color: 'var(--wc-t2)' }} />
              </div>
              <div>
                <div className="font-heading font-bold text-[10px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-t2)' }}>Demo Mode</div>
                <div className="text-[9px] leading-[1.3]" style={{ color: 'var(--wc-t3)' }}>Exploring with sample data. Start your logbook to track real trips.</div>
              </div>
            </div>

            <button
              className="ob-a4 w-full rounded-xl p-[14px] mb-3 flex flex-col items-center gap-2 cursor-pointer active:scale-[.98] transition-transform"
              style={{ background: 'var(--wc-card)', border: '1.5px solid rgb(var(--wc-ink) / .3)' }}
              onClick={() => setShowLogbookInfo(true)}
              data-testid="button-start-logbook"
            >
              <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .08)', border: '2px solid rgb(var(--wc-ink) / .2)' }}>
                <FileText className="w-[20px] h-[20px]" style={{ color: 'var(--wc-y)' }} />
              </div>
              <div className="font-heading font-black text-[14px] uppercase tracking-[.04em] text-center" style={{ color: 'var(--wc-text)' }}>
                Ready to start your 12-week logbook?
              </div>
              <div className="text-[11px] text-center leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
                Tap to begin tracking. Complete 12 weeks for 5 years of ATO deductions.
              </div>
              <div
                className="rounded-[10px] py-[9px] px-5 font-heading font-extrabold text-[12px] uppercase tracking-[.06em]"
                style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
              >
                Start Logbook
              </div>
            </button>
          </>
        )}

        <div className="ob-a2 mb-2 relative" data-testid="stats-carousel">
          <div
            className="overflow-hidden rounded-xl"
            ref={slideRef}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchDeltaX.current = 0;
              if (autoSlideRef.current) clearInterval(autoSlideRef.current);
            }}
            onTouchMove={(e) => {
              touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
            }}
            onTouchEnd={() => {
              if (touchDeltaX.current < -40) {
                setSlideIdx(prev => (prev + 1) % SLIDE_COUNT);
              } else if (touchDeltaX.current > 40) {
                setSlideIdx(prev => (prev - 1 + SLIDE_COUNT) % SLIDE_COUNT);
              }
              resetAutoSlide();
            }}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${slideIdx * 100}%)` }}
            >

              <div className="w-full flex-shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className="rounded-xl p-2 min-w-0 flex flex-col items-center justify-center"
                    style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}
                    data-testid="dash-stat-biz-pct"
                  >
                    {(() => {
                      const bizPct = totalKmAll > 0 ? Math.round((bizKm / totalKmAll) * 100) : 0;
                      const sz = 74; const sw = 8; const r = (sz - sw) / 2; const circ = 2 * Math.PI * r;
                      const bizLen = (bizPct / 100) * circ; const perLen = circ - bizLen;
                      return (
                        <div className="relative">
                          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
                            <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="rgb(var(--wc-ink) / .06)" strokeWidth={sw} />
                            {bizPct > 0 && <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="var(--wc-y)" strokeWidth={sw} strokeDasharray={`${bizLen} ${perLen}`} strokeDashoffset={circ / 4} strokeLinecap="round" style={{ transition: 'stroke-dasharray .6s ease' }} />}
                            {bizPct > 0 && bizPct < 100 && <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="rgb(var(--wc-ink) / .15)" strokeWidth={sw} strokeDasharray={`${perLen} ${bizLen}`} strokeDashoffset={circ / 4 - bizLen} strokeLinecap="round" style={{ transition: 'stroke-dasharray .6s ease' }} />}
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-display text-[17px] leading-none" style={{ color: 'var(--wc-y)' }}>{bizPct}%</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="text-[9px] mt-[4px] text-center" style={{ color: 'var(--wc-t3)' }}>
                      {totalTrips > 0 ? `${totalBizCount}B / ${totalPerCount}P` : 'Business'}
                    </div>
                  </div>
                  <div className="rounded-xl min-w-0 flex flex-col" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid="dash-stat-km">
                    <div className="p-[8px_10px] flex-1">
                      <div className="text-[9px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-t3)' }}>Business KM</div>
                      <div className="font-display text-[18px] leading-none mt-[3px]">{bizKm.toFixed(1)}</div>
                      <div className="text-[9px] mt-[2px]" style={{ color: 'var(--wc-t2)' }}>{totalKmAll > 0 ? `of ${totalKmAll.toFixed(1)}` : 'km tracked'}</div>
                    </div>
                    <div className="mx-[10px]" style={{ height: 1, background: 'var(--wc-border)' }} />
                    <div className="p-[8px_10px] flex-1" data-testid="dash-stat-trips">
                      <div className="text-[9px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-t3)' }}>Trips</div>
                      <div className="font-display text-[18px] leading-none mt-[3px]">{totalTrips}</div>
                      <div className="text-[9px] mt-[2px]" style={{ color: 'var(--wc-t2)' }}>{totalBizCount}B / {totalPerCount}P</div>
                    </div>
                  </div>
                  <DeductionCard value={dedTotal} state={deductionState} label="Total Claimable Deductions" sublabel="logbook method" checks={readinessChecks} />
                </div>
              </div>

              <div className="w-full flex-shrink-0">
                <div className="grid grid-cols-3 gap-2" style={{ minHeight: '130px' }}>
                  <div className="rounded-xl p-[10px] min-w-0 flex flex-col items-center justify-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid="slide-biz-trips">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center mb-[6px]" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                      <TrendingUp className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
                    </div>
                    <div className="font-display text-[18px] leading-none">{totalBizCount}</div>
                    <div className="text-[8px] mt-[4px] text-center leading-[1.3]" style={{ color: 'var(--wc-t3)' }}>Business trips</div>
                  </div>
                  <div className="rounded-xl p-[10px] min-w-0 flex flex-col items-center justify-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid="slide-fuel-price">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center mb-[6px]" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                      <Fuel className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
                    </div>
                    <div className="font-display text-[18px] leading-none">${(() => { try { const s = JSON.parse(localStorage.getItem('wc_settings') || '{}'); const p = parseFloat(s.avgFuelPrice); return p > 0 ? p.toFixed(2) : '1.95'; } catch { return '1.95'; } })()}</div>
                    <div className="text-[8px] mt-[4px] text-center leading-[1.3]" style={{ color: 'var(--wc-t3)' }}>Avg fuel price /L</div>
                  </div>
                  <div className="rounded-xl p-[10px] min-w-0 flex flex-col items-center justify-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid="slide-depreciation">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center mb-[6px]" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                      <Car className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
                    </div>
                    <div className="font-display text-[15px] leading-none">${(() => { try { const p = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}'); const price = Math.min(parseFloat(p.purchasePrice) || 0, 69674); return price > 0 ? Math.round(price * 0.25).toLocaleString('en-AU') : '—'; } catch { return '—'; } })()}</div>
                    <div className="text-[8px] mt-[4px] text-center leading-[1.3]" style={{ color: 'var(--wc-t3)' }}>Est. depreciation</div>
                  </div>
                </div>
              </div>

              <div className="w-full flex-shrink-0">
                <div className="rounded-xl p-[14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)', minHeight: '130px' }} data-testid="slide-tax-deadline">
                  <div className="flex items-center gap-[8px] mb-[10px]">
                    <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                      <Calendar className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-[10px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t2)' }}>Tax Deadline</div>
                      <div className="font-data text-[8px]" style={{ color: 'var(--wc-t3)' }}>End of Financial Year</div>
                    </div>
                  </div>
                  {(() => {
                    const now = new Date();
                    const eofy = new Date(now.getFullYear(), 5, 30);
                    if (now > eofy) eofy.setFullYear(eofy.getFullYear() + 1);
                    const daysLeft = Math.max(0, Math.ceil((eofy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                    const totalSpan = 365;
                    const pct = Math.max(0, Math.min(100, ((totalSpan - daysLeft) / totalSpan) * 100));
                    const urgent = daysLeft <= 30;
                    const fyLabel = `30 June ${eofy.getFullYear()}`;
                    return (
                      <>
                        <div className="flex items-baseline gap-[4px] mb-[8px]">
                          <span className="font-display text-[32px] leading-none" style={{ color: urgent ? 'var(--wc-am)' : 'var(--wc-y)' }}>{daysLeft}</span>
                          <span className="font-heading font-bold text-[12px] uppercase" style={{ color: 'var(--wc-t3)' }}>days to EOFY</span>
                        </div>
                        <div className="w-full rounded-full h-[6px] overflow-hidden" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: urgent ? 'var(--wc-am)' : 'var(--wc-y)' }} />
                        </div>
                        <div className="font-data text-[8px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>
                          {urgent ? 'EOFY approaching — finalise your records' : `${fyLabel} — keep tracking your trips`}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="w-full flex-shrink-0">
                <div className="rounded-xl p-[14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)', minHeight: '130px' }} data-testid="slide-expenses-check">
                  <div className="flex items-center gap-[8px] mb-[8px]">
                    <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                      <Receipt className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
                    </div>
                    <div className="font-heading font-bold text-[10px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t2)' }}>Vehicle Expenses</div>
                  </div>
                  {(() => {
                    let expenseCount = 0;
                    let expenseTotal = 0;
                    try {
                      const raw = JSON.parse(localStorage.getItem('wc_expenses') || '[]');
                      expenseCount = raw.length;
                      expenseTotal = raw.reduce((s: number, e: any) => s + (e.amount || 0), 0);
                    } catch {}
                    const categories = ['Fuel & Oil', 'Registration', 'Insurance', 'Servicing', 'Tyres'];
                    let trackedCats = 0;
                    try {
                      const raw = JSON.parse(localStorage.getItem('wc_expenses') || '[]');
                      const cats = new Set(raw.map((e: any) => e.category));
                      trackedCats = categories.filter(c => cats.has(c)).length;
                    } catch {}
                    return (
                      <>
                        <div className="flex items-baseline gap-[6px] mb-[6px]">
                          <span className="font-display text-[24px] leading-none" style={{ color: expenseCount > 0 ? 'var(--wc-text)' : 'var(--wc-t3)' }}>{expenseCount > 0 ? `$${expenseTotal.toFixed(0)}` : '$0'}</span>
                          <span className="font-data text-[10px]" style={{ color: 'var(--wc-t3)' }}>{expenseCount} receipt{expenseCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex gap-[4px] mb-[6px]">
                          {categories.map((cat, i) => (
                            <div key={cat} className="flex-1 h-[4px] rounded-full" style={{ background: i < trackedCats ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .08)' }} />
                          ))}
                        </div>
                        <div className="font-data text-[8px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
                          {trackedCats === 0 ? 'Track fuel, rego, insurance, servicing & tyres' : `${trackedCats}/5 expense categories tracked`}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="w-full flex-shrink-0">
                <div className="rounded-xl p-[12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)', minHeight: '130px' }} data-testid="slide-day-chart">
                  <div className="flex items-center justify-between mb-[8px]">
                    <div className="font-heading font-bold text-[10px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t2)' }}>Trips by Day</div>
                    <div className="flex items-center gap-[8px]">
                      <div className="flex items-center gap-[3px]"><div className="w-[5px] h-[5px] rounded-[2px]" style={{ background: 'var(--wc-y)' }} /><span className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>Biz</span></div>
                      <div className="flex items-center gap-[3px]"><div className="w-[5px] h-[5px] rounded-[2px]" style={{ background: 'rgb(var(--wc-ink) / .12)' }} /><span className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>Per</span></div>
                    </div>
                  </div>
                  <div className="flex items-end gap-[4px]" style={{ height: '76px' }}>
                    {dayStats.map(d => {
                      const total = d.biz + d.per;
                      const maxDayTotal = Math.max(1, ...dayStats.map(dd => dd.biz + dd.per));
                      const barH = total > 0 ? Math.max(8, (total / maxDayTotal) * 60) : 4;
                      const bizH = total > 0 ? (d.biz / total) * barH : 0;
                      const perH = barH - bizH;
                      return (
                        <div key={d.name} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div className="w-full flex flex-col rounded-[3px] overflow-hidden" style={{ height: `${barH}px` }}>
                            {perH > 0 && <div style={{ height: `${perH}px`, background: 'rgb(var(--wc-ink) / .1)' }} />}
                            {bizH > 0 && <div style={{ height: `${bizH}px`, background: 'var(--wc-y)' }} />}
                            {total === 0 && <div className="h-full" style={{ background: 'rgb(var(--wc-ink) / .04)' }} />}
                          </div>
                          <div className="font-data text-[7px] uppercase mt-[3px]" style={{ color: total > 0 ? 'var(--wc-text)' : 'var(--wc-t3)' }}>{d.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="w-full flex-shrink-0">
                <div className="rounded-xl p-[12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)', minHeight: '130px' }} data-testid="slide-biz-pct-line">
                  <div className="flex items-center gap-[6px] mb-[8px]">
                    <TrendingUp className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
                    <div className="font-heading font-bold text-[10px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t2)' }}>Business % Over Time</div>
                  </div>
                  {bizPctOverTime.length > 0 ? (
                    <div className="flex flex-col gap-0">
                      <svg viewBox="0 0 200 70" className="w-full" style={{ height: '70px' }}>
                        {[0, 25, 50, 75, 100].map(v => (
                          <line key={v} x1="0" y1={70 - (v / 100) * 60 - 5} x2="200" y2={70 - (v / 100) * 60 - 5} stroke="rgb(var(--wc-ink) / .06)" strokeWidth="0.5" />
                        ))}
                        <polyline
                          fill="none"
                          stroke="var(--wc-y)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={bizPctOverTime.map((d, i) => {
                            const x = bizPctOverTime.length === 1 ? 100 : 10 + (i / (bizPctOverTime.length - 1)) * 180;
                            const y = 70 - (d.pct / 100) * 60 - 5;
                            return `${x},${y}`;
                          }).join(' ')}
                        />
                        {bizPctOverTime.map((d, i) => {
                          const x = bizPctOverTime.length === 1 ? 100 : 10 + (i / (bizPctOverTime.length - 1)) * 180;
                          const y = 70 - (d.pct / 100) * 60 - 5;
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r="3.5" fill="var(--wc-bg)" stroke="var(--wc-y)" strokeWidth="1.5" />
                              <text x={x} y={y - 6} textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--wc-text)" fontFamily="var(--font-data)">{d.pct}%</text>
                            </g>
                          );
                        })}
                      </svg>
                      <div className="flex justify-between mt-[2px]" style={{ paddingLeft: '3%', paddingRight: '3%' }}>
                        {bizPctOverTime.map((d, i) => (
                          <div key={i} className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>{d.label}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center" style={{ minHeight: '80px' }}>
                      <div className="text-center">
                        <TrendingUp className="w-[20px] h-[20px] mx-auto mb-[6px]" style={{ color: 'var(--wc-t3)' }} />
                        <div className="font-data text-[9px]" style={{ color: 'var(--wc-t3)' }}>Sort trips to see your trend</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full flex-shrink-0">
                <div className="grid grid-cols-2 gap-2" style={{ minHeight: '130px' }}>
                  <div className="rounded-xl p-[12px] flex flex-col justify-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid="slide-avg-km">
                    <Route className="w-[16px] h-[16px] mb-[6px]" style={{ color: 'var(--wc-y)' }} />
                    <div className="font-heading font-black text-[22px] leading-none" style={{ color: 'var(--wc-text)' }}>{avgTripKm.toFixed(1)}<span className="text-[11px] font-bold" style={{ color: 'var(--wc-t3)' }}> km</span></div>
                    <div className="font-data text-[8px] uppercase tracking-[.08em] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>Avg Trip Distance</div>
                  </div>
                  <div className="rounded-xl p-[12px] flex flex-col justify-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid="slide-total-km">
                    <Fuel className="w-[16px] h-[16px] mb-[6px]" style={{ color: 'var(--wc-y)' }} />
                    <div className="font-heading font-black text-[22px] leading-none" style={{ color: 'var(--wc-text)' }}>{totalKmAll.toFixed(0)}<span className="text-[11px] font-bold" style={{ color: 'var(--wc-t3)' }}> km</span></div>
                    <div className="font-data text-[8px] uppercase tracking-[.08em] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>Total Tracked</div>
                  </div>
                </div>
              </div>

              <div className="w-full flex-shrink-0">
                <div className="rounded-xl p-[12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)', minHeight: '130px' }} data-testid="slide-destinations">
                  <div className="flex items-center gap-[6px] mb-[10px]">
                    <Target className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
                    <div className="font-heading font-bold text-[10px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t2)' }}>Top Destinations</div>
                  </div>
                  {topDestinations.length > 0 ? topDestinations.map(([dest, count], i) => {
                    const maxCount = Math.max(1, ...topDestinations.map(([, c]) => c));
                    return (
                      <div key={dest} className="mb-[6px] last:mb-0">
                        <div className="flex items-center justify-between mb-[2px]">
                          <div className="flex items-center gap-[6px] flex-1 min-w-0">
                            <div className="w-[16px] h-[16px] rounded-full flex items-center justify-center font-data text-[8px] font-bold flex-shrink-0" style={{ background: i === 0 ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .08)', color: i === 0 ? 'var(--wc-bg)' : 'var(--wc-t2)' }}>{i + 1}</div>
                            <div className="text-[10px] truncate font-heading font-bold" style={{ color: 'var(--wc-text)' }}>{dest}</div>
                          </div>
                          <div className="font-data text-[10px] font-bold ml-2 flex-shrink-0" style={{ color: 'var(--wc-y)' }}>{count}x</div>
                        </div>
                        <div className="ml-[22px] h-[4px] rounded-full overflow-hidden" style={{ background: 'rgb(var(--wc-ink) / .04)' }}>
                          <div className="h-full rounded-full" style={{ width: `${(count / maxCount) * 100}%`, background: i === 0 ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .15)', transition: 'width .5s ease' }} />
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="flex-1 flex items-center justify-center py-4">
                      <div className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>Sort trips to see destinations</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full flex-shrink-0">
                <div className="grid grid-cols-3 gap-2" style={{ minHeight: '130px' }}>
                  <div className="rounded-xl p-[10px] min-w-0 flex flex-col items-center justify-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid="slide-reports">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center mb-[6px]" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                      <FileText className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
                    </div>
                    <div className="font-display text-[18px] leading-none">{activeReports.length}</div>
                    <div className="text-[8px] mt-[4px] text-center leading-[1.3]" style={{ color: 'var(--wc-t3)' }}>Reports saved</div>
                  </div>
                  <div className="rounded-xl p-[10px] min-w-0 flex flex-col items-center justify-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid="slide-unsorted">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center mb-[6px]" style={{ background: totalUnsorted > 0 ? 'rgba(245,158,11,.1)' : 'rgb(var(--wc-ink) / .06)' }}>
                      <Clock className="w-[18px] h-[18px]" style={{ color: totalUnsorted > 0 ? 'var(--wc-am)' : 'var(--wc-y)' }} />
                    </div>
                    <div className="font-display text-[18px] leading-none" style={{ color: totalUnsorted > 0 ? 'var(--wc-am)' : undefined }}>{totalUnsorted}</div>
                    <div className="text-[8px] mt-[4px] text-center leading-[1.3]" style={{ color: 'var(--wc-t3)' }}>To sort</div>
                  </div>
                  <div className="rounded-xl p-[10px] min-w-0 flex flex-col items-center justify-center" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid="slide-fy">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center mb-[6px]" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                      <Calendar className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
                    </div>
                    <div className="font-display text-[15px] leading-none">2025–26</div>
                    <div className="text-[8px] mt-[4px] text-center leading-[1.3]" style={{ color: 'var(--wc-t3)' }}>Financial year</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-center gap-[5px] mt-[8px]">
            {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
              <button
                key={i}
                className="cursor-pointer transition-all"
                style={{
                  width: slideIdx === i ? 16 : 6,
                  height: 6,
                  background: slideIdx === i ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .15)',
                  borderRadius: 3,
                }}
                onClick={() => { setSlideIdx(i); resetAutoSlide(); }}
                data-testid={`slide-dot-${i}`}
              />
            ))}
          </div>
        </div>

        {estimateMode === 'industry' && !readinessChecks.basicDetailsComplete && (
          <div className="ob-a2b mb-3">
            <div
              className="w-full rounded-xl p-[12px] text-left"
              style={{ background: 'rgba(153,153,153,.04)', border: '1.5px solid rgba(153,153,153,.2)' }}
              data-testid="card-basic-details-prompt"
            >
              <div className="flex items-start gap-[10px] mb-[10px]">
                <div
                  className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0 mt-[1px]"
                  style={{ background: 'rgba(153,153,153,.08)', border: '1px solid rgba(153,153,153,.2)' }}
                >
                  <AlertTriangle className="w-[14px] h-[14px]" style={{ color: 'var(--wc-am)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold leading-[1.3]" style={{ color: 'var(--wc-text)' }}>We need a couple of details to run estimates</div>
                  <div className="text-[10px] mt-[3px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
                    Tell us your vehicle type and purchase price so we can show you per-trip deduction values as you sort.
                  </div>
                </div>
              </div>
              <div className="flex gap-[8px]">
                <button
                  className="flex-1 rounded-[10px] py-[10px] flex items-center justify-center gap-[5px] font-heading font-bold text-[11px] tracking-[.04em] uppercase cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: 'rgb(var(--wc-ink) / .08)', border: '1.5px solid rgb(var(--wc-ink) / .3)', color: 'var(--wc-y)' }}
                  onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'account' as any })}
                  data-testid="button-fill-basic-details"
                >
                  <Car className="w-[13px] h-[13px]" />
                  Fill In Details
                  <ChevronRight className="w-[12px] h-[12px]" />
                </button>
                <button
                  className="rounded-[10px] py-[10px] px-[14px] flex items-center justify-center gap-[5px] font-heading font-bold text-[11px] tracking-[.04em] uppercase cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t3)' }}
                  onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'account' as any })}
                  data-testid="button-customise-details"
                >
                  <Settings className="w-[12px] h-[12px]" />
                  Customise
                </button>
              </div>
            </div>
          </div>
        )}

        {logbookStart && (() => {
          const lbStatus = getLogbookStatus(activePeriod);
          const start = new Date(logbookStart);
          const now = new Date();
          const totalDays = 84;
          const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          const daysPassed = Math.min(totalDays, elapsed);
          const currentWeek = Math.min(12, Math.floor(elapsed / 7) + 1);
          const pct = Math.round((daysPassed / totalDays) * 100);

          if (archived) {
            return (
              <button
                className="ob-a4 rounded-xl p-[10px_12px] mb-2 w-full text-left cursor-pointer transition-all"
                style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1.5px solid var(--wc-border)' }}
                onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'logbook-complete' })}
                data-testid="button-archived-logbook"
              >
                <div className="flex justify-between items-center mb-[3px]">
                  <div className="text-[9px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-t3)' }}>12-Week Logbook</div>
                  <div className="font-data text-[9px] font-bold" style={{ color: 'var(--wc-t3)' }}>Archived</div>
                </div>
                <div className="w-full rounded-full h-[6px] overflow-hidden" style={{ background: 'rgb(var(--wc-ink) / .08)' }}>
                  <div className="h-full rounded-full" style={{ width: '100%', background: 'var(--wc-t3)' }} />
                </div>
                <div className="text-[9px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>Tap to view logbook summary or enter restart code</div>
              </button>
            );
          }

          if (lbStatus.expired) {
            return (
              <button
                className="ob-a4 rounded-xl p-[10px_12px] mb-2 w-full text-left cursor-pointer transition-all"
                style={{ background: 'var(--wc-yd)', border: '1.5px solid var(--wc-y)' }}
                onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'logbook-complete' })}
                data-testid="button-logbook-expired"
              >
                <div className="flex justify-between items-center mb-[3px]">
                  <div className="text-[9px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-y)' }}>12-Week Logbook Complete!</div>
                  <div className="font-data text-[9px] font-bold" style={{ color: 'var(--wc-y)' }}>100%</div>
                </div>
                <div className="w-full rounded-full h-[6px] overflow-hidden" style={{ background: 'rgb(var(--wc-ink) / .08)' }}>
                  <div className="h-full rounded-full" style={{ width: '100%', background: 'var(--wc-y)' }} />
                </div>
                <div className="flex items-center gap-[4px] mt-[4px]">
                  <span className="text-[9px] font-bold" style={{ color: 'var(--wc-y)' }}>Finalise your logbook</span>
                  <ChevronRight className="w-[10px] h-[10px]" style={{ color: 'var(--wc-y)' }} />
                </div>
              </button>
            );
          }

          if (lbStatus.graceActive) {
            return (
              <button
                className="ob-a4 rounded-xl p-[10px_12px] mb-2 w-full text-left cursor-pointer transition-all"
                style={{ background: 'rgba(245,158,11,.06)', border: '1.5px solid rgba(245,158,11,.3)' }}
                onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'logbook-complete' })}
                data-testid="button-logbook-grace"
              >
                <div className="flex justify-between items-center mb-[3px]">
                  <div className="text-[9px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-am)' }}>Logbook Period Ended</div>
                  <div className="font-data text-[9px] font-bold" style={{ color: 'var(--wc-am)' }}>Grace period</div>
                </div>
                <div className="w-full rounded-full h-[6px] overflow-hidden" style={{ background: 'rgb(var(--wc-ink) / .08)' }}>
                  <div className="h-full rounded-full" style={{ width: '100%', background: 'var(--wc-am)' }} />
                </div>
                <div className="text-[9px] mt-[4px]" style={{ color: 'var(--wc-am)' }}>2-hour grace window — finalise your logbook now</div>
              </button>
            );
          }

          return (
            <div className="ob-a4 rounded-xl p-[8px_12px] mb-2" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
              <div className="flex justify-between items-center mb-[3px]">
                <div className="text-[9px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-t2)' }}>12-Week Logbook</div>
                <div className="font-data text-[9px]" style={{ color: 'var(--wc-y)' }}>Day {daysPassed}/84 · Week {currentWeek} · {pct}%</div>
              </div>
              <div className="w-full rounded-full h-[6px] overflow-hidden" style={{ background: 'rgb(var(--wc-ink) / .08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: 'var(--wc-y)' }}
                  data-testid="logbook-progress-bar"
                />
              </div>
            </div>
          );
        })()}

        <div className="ob-a3 flex-1 flex flex-col mb-2">
          <div className="text-[10px] font-bold uppercase tracking-[.07em] mb-2" style={{ color: 'var(--wc-t3)' }}>Quick Actions</div>
          <div className="grid grid-cols-2 gap-[8px] flex-1" style={{ gridAutoRows: '1fr' }}>
            {tiles.map(tile => {
              const Icon = tile.icon;
              const badgeCount = (tile as any).badge;
              const fullWidth = (tile as any).fullWidth;
              return (
                <button
                  key={tile.screen}
                  className="relative flex items-center gap-[10px] p-[12px_14px] rounded-xl text-left transition-all active:scale-[.98]"
                  style={{
                    ...(fullWidth && { gridColumn: '1 / -1' }),
                    background: tile.primary ? 'rgb(var(--wc-ink) / .06)' : 'var(--wc-card)',
                    border: tile.primary && badgeCount > 0 ? '2px solid rgb(var(--wc-ink) / .85)' : tile.primary ? '1.5px solid rgb(var(--wc-ink) / .35)' : '1px solid var(--wc-border)',
                  }}
                  onClick={() => {
                    dispatch({ type: 'GO_SCREEN', screen: tile.screen });
                  }}
                  data-testid={`dash-tile-${tile.screen}`}
                >
                  {badgeCount > 0 && (
                    <div
                      className="absolute flex items-center justify-center font-data"
                      style={{
                        top: -6, right: -4,
                        minWidth: 22, height: 22,
                        borderRadius: 11,
                        padding: '0 6px',
                        background: 'var(--wc-y)',
                        color: 'var(--wc-bg)',
                        fontSize: 11,
                        fontWeight: 800,
                        boxShadow: '0 0 8px rgb(var(--wc-ink) / .5)',
                      }}
                      data-testid="badge-unsorted-count"
                    >
                      {badgeCount}
                    </div>
                  )}
                  <div
                    className="w-[36px] h-[36px] rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: tile.primary ? 'rgb(var(--wc-ink) / .1)' : 'rgb(var(--wc-ink) / .04)',
                      border: tile.primary ? '1.5px solid rgb(var(--wc-ink) / .25)' : '1px solid rgb(var(--wc-ink) / .06)',
                    }}
                  >
                    <Icon
                      className="w-[18px] h-[18px]"
                      stroke={tile.primary ? 'var(--wc-y)' : 'var(--wc-t2)'}
                      strokeWidth={1.8}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold" style={{ color: tile.primary ? 'var(--wc-text)' : 'var(--wc-t2)' }}>
                      {tile.label}
                    </div>
                    <div className="text-[9px] mt-[1px]" style={{ color: badgeCount > 0 && tile.primary ? 'var(--wc-y)' : 'var(--wc-t3)' }}>{tile.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showAutoTrackWarning && (
          <div
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-[60px]"
            style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowAutoTrackWarning(false)}
            data-testid="modal-autotrack-warning"
          >
            <div
              className="w-full max-w-[360px] rounded-[20px] p-[20px]"
              style={{ background: 'var(--wc-card)', border: '1.5px solid var(--wc-border)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-[10px] mb-[12px]">
                <div
                  className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,.08)', border: '1.5px solid rgba(245,158,11,.2)' }}
                >
                  <AlertTriangle className="w-[16px] h-[16px]" style={{ color: 'var(--wc-am)' }} />
                </div>
                <div className="font-heading font-black text-[15px] uppercase leading-[1.2]" style={{ color: 'var(--wc-text)' }}>
                  Continuous Records Required
                </div>
              </div>

              <div className="text-[12px] leading-[1.6] mb-[10px]" style={{ color: 'var(--wc-t2)' }}>
                The ATO requires <strong style={{ color: 'var(--wc-text)' }}>continuous trip records</strong> during your logbook period. Gaps in tracking may invalidate your logbook.
              </div>

              <div className="rounded-[10px] p-[10px_12px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid rgb(var(--wc-ink) / .06)' }}>
                <div className="text-[11px] leading-[1.5]" style={{ color: 'var(--wc-t3)' }}>
                  You can adjust your tracking settings and methods at any time. Switching between methods is possible but can create logbook errors and may require adjustments after the report is generated.
                </div>
              </div>

              <div className="flex gap-[8px]">
                <button
                  className="flex-1 rounded-[10px] py-[11px] font-heading font-bold text-[12px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: 'rgba(34,197,94,.1)', border: '1.5px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}
                  onClick={() => setShowAutoTrackWarning(false)}
                  data-testid="button-keep-auto-on"
                >
                  Keep Auto On
                </button>
                <button
                  className="flex-1 rounded-[10px] py-[11px] font-heading font-bold text-[12px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t3)' }}
                  onClick={() => {
                    setAutoTrack(false);
                    localStorage.setItem('wc_autotrack', '0');
                    setShowAutoTrackWarning(false);
                  }}
                  data-testid="button-turn-auto-off"
                >
                  Turn Off
                </button>
              </div>
            </div>
          </div>
        )}

        {showLogbookInfo && (
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto"
            style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)' }}
            onClick={() => setShowLogbookInfo(false)}
            data-testid="modal-logbook-info"
          >
            <div className="min-h-full flex items-center justify-center py-6">
            <div
              className="mx-5 w-full max-w-[370px] rounded-[20px] p-[24px_22px]"
              style={{ background: 'var(--wc-card)', border: '1.5px solid rgb(var(--wc-ink) / .3)', boxShadow: '0 20px 60px rgba(0,0,0,.7)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-3 mb-5">
                <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .08)', border: '2px solid rgb(var(--wc-ink) / .2)' }}>
                  <FileText className="w-[26px] h-[26px]" style={{ color: 'var(--wc-y)' }} />
                </div>
                <div className="font-heading font-black text-[20px] uppercase tracking-[.03em] text-center leading-[1.2]" style={{ color: 'var(--wc-text)' }}>
                  12-Week Logbook
                </div>
              </div>

              <div className="text-[14px] leading-[1.7] mb-4" style={{ color: 'var(--wc-t2)' }}>
                <p className="mb-3">The ATO requires a <strong style={{ color: 'var(--wc-text)' }}>continuous 12-week logbook</strong> to claim car expenses using the logbook method. Once validated, it covers you for <strong style={{ color: 'var(--wc-text)' }}>5 years</strong> of tax deductions.</p>
              </div>

              <div className="rounded-[12px] p-[14px_16px] mb-4" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid rgb(var(--wc-ink) / .1)' }}>
                <div className="font-heading font-bold text-[12px] uppercase tracking-[.06em] mb-2" style={{ color: 'var(--wc-text)' }}>How it works</div>
                <div className="text-[13px] leading-[1.7]" style={{ color: 'var(--wc-t2)' }}>
                  <p className="mb-2">Record <strong style={{ color: 'var(--wc-text)' }}>every trip</strong> — both personal and business — for 12 consecutive weeks.</p>
                  <p className="mb-2">Your <strong style={{ color: 'var(--wc-text)' }}>business-use percentage</strong> is calculated from this period and applied to your annual car costs.</p>
                  <p>The 12 weeks must be <strong style={{ color: 'var(--wc-text)' }}>continuous</strong> — missing weeks (holidays, gaps) will affect your percentage and may require a restart.</p>
                </div>
              </div>

              <div className="rounded-[12px] p-[14px_16px] mb-4" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)' }}>
                <div className="font-heading font-bold text-[12px] uppercase tracking-[.06em] mb-2" style={{ color: 'var(--wc-am)' }}>Important</div>
                <div className="text-[13px] leading-[1.7]" style={{ color: 'var(--wc-t2)' }}>
                  <p className="mb-2">Once started, the <strong style={{ color: 'var(--wc-text)' }}>12-week window cannot be paused</strong>. The timer runs continuously from day one.</p>
                  <p className="mb-2">If you choose to <strong style={{ color: 'var(--wc-text)' }}>restart</strong>, the previous period is discarded and a new 12-week cycle begins.</p>
                  <p>Feel free to <strong style={{ color: 'var(--wc-text)' }}>explore the app first</strong> — you can start the logbook whenever you're ready.</p>
                </div>
              </div>

              <div className="flex flex-col gap-[8px]">
                <button
                  className="w-full rounded-[12px] py-[14px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    localStorage.setItem('wc_logbook_start', today);
                    setLogbookStart(today);
                    dispatch({ type: 'START_LOGBOOK' });
                    setShowLogbookInfo(false);
                  }}
                  data-testid="button-confirm-start-logbook"
                >
                  Start My 12 Weeks Now
                </button>
                <button
                  className="w-full rounded-[12px] py-[12px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid rgb(var(--wc-ink) / .1)', color: 'var(--wc-t2)' }}
                  onClick={() => setShowLogbookInfo(false)}
                  data-testid="button-explore-first"
                >
                  I'll Explore First
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

        {showGuide && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,.88)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowGuide(false)}
            data-testid="modal-how-it-works"
          >
            <div
              className="mx-4 w-full max-w-[375px] rounded-[20px] max-h-[88vh] overflow-y-auto"
              style={{ background: 'var(--wc-card)', border: '1.5px solid rgb(var(--wc-ink) / .3)', boxShadow: '0 20px 60px rgba(0,0,0,.7)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-[16px_18px_12px]" style={{ background: 'var(--wc-card)', borderBottom: '1px solid var(--wc-border)' }}>
                <div className="font-heading font-black text-[18px] uppercase tracking-[.03em]" style={{ color: 'var(--wc-text)' }}>How This App Works</div>
                <button
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgb(var(--wc-ink) / .08)' }}
                  onClick={() => setShowGuide(false)}
                  data-testid="button-close-guide"
                >
                  <X className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t2)' }} />
                </button>
              </div>

              <div className="p-[16px_18px_20px]">
                <div className="rounded-[14px] overflow-hidden mb-5" style={{ background: '#000', border: '1px solid rgb(var(--wc-ink) / .2)' }}>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .15)', border: '2px solid rgb(var(--wc-ink) / .3)' }}>
                        <Play className="w-[24px] h-[24px] ml-[2px]" style={{ color: 'var(--wc-y)' }} />
                      </div>
                      <div className="font-heading font-bold text-[13px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t2)' }}>Video Tutorial</div>
                      <div className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>Coming soon on YouTube</div>
                    </div>
                  </div>
                </div>

                <div className="font-heading font-bold text-[13px] uppercase tracking-[.06em] mb-3" style={{ color: 'var(--wc-text)' }}>App Workflow</div>

                <div className="flex flex-col gap-[2px] mb-5">
                  {[
                    { step: 1, label: 'Sort Trips', desc: 'Swipe each trip as Business or Personal', icon: ArrowRight },
                    { step: 2, label: 'Classify', desc: 'Assign a purpose to each business trip', icon: FileText },
                    { step: 3, label: 'Review', desc: 'Check everything is correct before saving', icon: BookOpen },
                    { step: 4, label: 'Odometer', desc: 'Verify start and end km readings', icon: Settings },
                    { step: 5, label: 'Export Report', desc: 'Generate your ATO-ready logbook', icon: Download },
                  ].map(item => (
                    <div key={item.step} className="flex items-center gap-[12px] rounded-[10px] p-[10px_12px]" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid rgb(var(--wc-ink) / .06)' }}>
                      <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .08)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
                        <span className="font-heading font-black text-[13px]" style={{ color: 'var(--wc-y)' }}>{item.step}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-bold text-[12px]" style={{ color: 'var(--wc-text)' }}>{item.label}</div>
                        <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>{item.desc}</div>
                      </div>
                      <item.icon className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
                    </div>
                  ))}
                </div>

                <div className="font-heading font-bold text-[13px] uppercase tracking-[.06em] mb-3" style={{ color: 'var(--wc-text)' }}>Key Features</div>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { label: '12-Week Logbook', desc: 'ATO-compliant tracking period' },
                    { label: 'Tax Estimate', desc: 'Real-time deduction calculator' },
                    { label: 'Audit Score', desc: 'Measure your record quality' },
                    { label: 'Expense Tracking', desc: 'Log fuel, servicing & more' },
                    { label: 'GPS Tracking', desc: 'Automatic trip recording' },
                    { label: 'Export Reports', desc: 'PDF & CSV for your accountant' },
                  ].map(f => (
                    <div key={f.label} className="rounded-[10px] p-[10px_12px]" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid rgb(var(--wc-ink) / .06)' }}>
                      <div className="font-heading font-bold text-[11px] mb-[2px]" style={{ color: 'var(--wc-text)' }}>{f.label}</div>
                      <div className="text-[9px]" style={{ color: 'var(--wc-t3)' }}>{f.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[12px] p-[14px_16px] mb-4" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-heading font-bold text-[12px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-text)' }}>Assistant Mode</div>
                      <div className="text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Show helpful prompts on every screen</div>
                    </div>
                    <button
                      className="w-[44px] h-[24px] rounded-full relative transition-all cursor-pointer"
                      style={{ background: assistantMode ? 'rgb(var(--wc-ink) / .25)' : 'rgb(var(--wc-ink) / .1)' }}
                      onClick={() => {
                        const next = !assistantMode;
                        setAssistantMode(next);
                        saveAssistantMode(next);
                      }}
                      data-testid="toggle-assistant-guide"
                    >
                      <div
                        className="absolute top-[3px] w-[18px] h-[18px] rounded-full transition-all"
                        style={{
                          left: assistantMode ? '23px' : '3px',
                          background: assistantMode ? 'var(--wc-y)' : 'var(--wc-t3)',
                        }}
                      />
                    </button>
                  </div>
                  <div className="text-[10px] mt-2 leading-[1.5]" style={{ color: 'var(--wc-t3)' }}>
                    When enabled, each screen shows a banner explaining what it does and tips for using it. Toggle this off anytime from the dashboard.
                  </div>
                </div>

                <button
                  className="w-full rounded-[12px] py-[13px] font-heading font-extrabold text-[14px] tracking-[.06em] uppercase cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                  onClick={() => setShowGuide(false)}
                  data-testid="button-close-guide-bottom"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
