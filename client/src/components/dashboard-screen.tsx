import { useState, useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { calcLogbookDeduction } from '@/lib/trip-data';
import { MapPin, FileText, Download, Plus, ChevronRight, Navigation, Receipt, BarChart3, Key, Car, UserCircle, Info, AlertTriangle, Settings } from 'lucide-react';
import { getReadinessChecks, getDeductionState, getEstimateDisclaimer, getEstimateMode } from '@/lib/deduction-estimator';
import { DeductionCard, ReadinessCard } from '@/components/deduction-card';

export function DashboardScreen() {
  const { state, dispatch } = useApp();
  const [autoTrack, setAutoTrack] = useState(() => localStorage.getItem('wc_autotrack') === '1');

  const totalTrips = state.currentIndex;
  const bizKm = state.trips.slice(0, state.currentIndex).filter(t => t.type === 'business').reduce((s, t) => s + t.km, 0);
  const dedTotal = state.dedTotal;
  const unsortedCount = state.trips.length - state.currentIndex;
  const queuedCount = state.queuedTrips.length;
  const totalUnsorted = unsortedCount + queuedCount;

  const hasBizTrips = state.bizCount > 0;

  const showDeductionEstimates = useMemo(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('wc_settings') || '{}');
      return settings.showDeductionEstimates !== false;
    } catch {
      return true;
    }
  }, []);

  const estimateMode = useMemo(() => getEstimateMode(), []);
  const readinessChecks = useMemo(() => getReadinessChecks(hasBizTrips), [hasBizTrips]);
  const deductionState = useMemo(() => getDeductionState(readinessChecks, showDeductionEstimates), [readinessChecks, showDeductionEstimates]);
  const disclaimer = useMemo(() => getEstimateDisclaimer(deductionState), [deductionState]);

  const tiles = [
    { screen: 'sort' as const, label: 'Sort Trips', sub: totalUnsorted > 0 ? `${totalUnsorted} trip${totalUnsorted !== 1 ? 's' : ''} to sort` : 'All sorted', icon: MapPin, primary: true, badge: totalUnsorted },
    { screen: 'reports' as const, label: 'Driving Reports', sub: 'Trip summaries & export', icon: Car, primary: false },
    { screen: 'input' as const, label: 'Add Trip', sub: 'Manual or live entry', icon: Plus, primary: false },
    { screen: 'expenses' as const, label: 'Expenses', sub: 'Track & report costs', icon: Receipt, primary: false },
    { screen: 'stats' as const, label: 'My Stats', sub: 'Trips, km & trends', icon: BarChart3, primary: false },
    { screen: 'export' as const, label: 'Export', sub: 'PDF & CSV download', icon: Download, primary: false },
    { screen: 'find-keys' as const, label: 'Find My Keys', sub: 'Last known location', icon: Key, primary: false },
    { screen: 'account' as const, label: 'Account', sub: 'Profile, vehicle & tax', icon: UserCircle, primary: false },
  ];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8" style={{ overscrollBehavior: 'contain' }}>
      <div className="ob-a1 mb-6 mt-2">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center ob-glow"
            style={{ background: 'rgba(245,196,0,.07)', border: '1.5px solid rgba(245,196,0,.22)' }}
          >
            <svg width="22" height="22" viewBox="0 0 52 52" fill="none">
              <path d="M26 4C15 4 7 13 7 21C7 35 26 48 26 48C26 48 45 35 45 21C45 13 37 4 26 4Z" stroke="#F5C400" strokeWidth="2.2" fill="none"/>
              <circle cx="26" cy="21" r="7" stroke="#F5C400" strokeWidth="2.2" fill="none"/>
              <path d="M19 17L22 25L26 19L30 25L33 17" stroke="#F5C400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="font-display text-[28px] leading-none" data-testid="dashboard-title">
              WORK<span style={{ color: 'var(--wc-y)' }}>CAR</span>
            </div>
            <div className="font-data text-[9px] tracking-[.15em] uppercase" style={{ color: 'var(--wc-t3)' }}>Smart Logbook</div>
          </div>
          <button
            className="ml-auto flex items-center gap-[6px] rounded-[10px] p-[7px_12px] cursor-pointer transition-all active:scale-[.97]"
            style={{
              background: autoTrack ? 'rgba(34,197,94,.1)' : 'rgba(255,255,255,.04)',
              border: autoTrack ? '1.5px solid rgba(34,197,94,.3)' : '1.5px solid var(--wc-border)',
            }}
            onClick={() => {
              const next = !autoTrack;
              setAutoTrack(next);
              localStorage.setItem('wc_autotrack', next ? '1' : '0');
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
                background: autoTrack ? 'rgba(34,197,94,.3)' : 'rgba(255,255,255,.1)',
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

      <div className="ob-a2 flex gap-2 mb-5">
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}
          data-testid="dash-stat-trips"
        >
          <div className="text-[10px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-t3)' }}>Trips</div>
          <div className="font-display text-[28px] leading-none mt-1">{totalTrips}</div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--wc-t2)' }}>
            {state.bizCount}B / {state.perCount}P
          </div>
        </div>
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}
          data-testid="dash-stat-km"
        >
          <div className="text-[10px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-t3)' }}>Business KM</div>
          <div className="font-display text-[28px] leading-none mt-1" style={{ color: 'var(--wc-y)' }}>{bizKm.toFixed(1)}</div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--wc-t2)' }}>km tracked</div>
        </div>
        <DeductionCard
          value={dedTotal}
          state={deductionState}
          label="Deduction"
          sublabel="logbook method"
          checks={readinessChecks}
        />
      </div>

      {estimateMode === 'industry' && !readinessChecks.basicDetailsComplete && (
        <div className="ob-a2b mb-4">
          <div
            className="w-full rounded-xl p-[14px] text-left"
            style={{ background: 'rgba(245,158,11,.04)', border: '1.5px solid rgba(245,158,11,.2)' }}
            data-testid="card-basic-details-prompt"
          >
            <div className="flex items-start gap-[10px] mb-[10px]">
              <div
                className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0 mt-[1px]"
                style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}
              >
                <AlertTriangle className="w-[14px] h-[14px]" style={{ color: 'var(--wc-am)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-white leading-[1.3]">We need a couple of details to run estimates</div>
                <div className="text-[10px] mt-[3px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
                  Tell us your vehicle type and purchase price so we can show you per-trip deduction values as you sort.
                </div>
              </div>
            </div>
            <div className="flex gap-[8px]">
              <button
                className="flex-1 rounded-[10px] py-[10px] flex items-center justify-center gap-[5px] font-heading font-bold text-[11px] tracking-[.04em] uppercase cursor-pointer transition-all active:scale-[.97]"
                style={{ background: 'rgba(245,196,0,.08)', border: '1.5px solid rgba(245,196,0,.3)', color: 'var(--wc-y)' }}
                onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'account' as any })}
                data-testid="button-fill-basic-details"
              >
                <Car className="w-[13px] h-[13px]" />
                Fill In Details
                <ChevronRight className="w-[12px] h-[12px]" />
              </button>
              <button
                className="rounded-[10px] py-[10px] px-[14px] flex items-center justify-center gap-[5px] font-heading font-bold text-[11px] tracking-[.04em] uppercase cursor-pointer transition-all active:scale-[.97]"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t3)' }}
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

      {estimateMode === 'industry' && readinessChecks.basicDetailsComplete && (
        <div className="ob-a2b mb-4">
          <button
            className="w-full rounded-xl p-[12px_14px] flex items-start gap-[10px] text-left cursor-pointer transition-all active:scale-[.99]"
            style={{ background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.18)' }}
            onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'account' as any })}
            data-testid="card-industry-averages-banner"
          >
            <div
              className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0 mt-[1px]"
              style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}
            >
              <Info className="w-[14px] h-[14px]" style={{ color: 'var(--wc-am)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-white leading-[1.3]">Estimates use industry averages</div>
              <div className="text-[10px] mt-[3px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
                You're good to go! Tap here anytime to customise with your actual expenses for a more accurate figure.
              </div>
            </div>
            <ChevronRight className="w-[14px] h-[14px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-am)' }} />
          </button>
        </div>
      )}

      <div className="ob-a3 mb-4">
        <div className="text-[11px] font-bold uppercase tracking-[.07em] mb-3" style={{ color: 'var(--wc-t3)' }}>Quick Actions</div>
        <div className="grid grid-cols-2 gap-2">
          {tiles.map(tile => {
            const Icon = tile.icon;
            const badgeCount = (tile as any).badge;
            return (
              <button
                key={tile.screen}
                className="relative flex items-center gap-3 p-4 rounded-xl text-left transition-all active:scale-[.98]"
                style={{
                  background: tile.primary ? 'rgba(245,196,0,.06)' : 'var(--wc-card)',
                  border: tile.primary ? '1.5px solid rgba(245,196,0,.35)' : '1px solid var(--wc-border)',
                }}
                onClick={() => {
                  if (tile.screen === 'classify') {
                    dispatch({ type: 'INIT_CLASSIFY' });
                  } else {
                    dispatch({ type: 'GO_SCREEN', screen: tile.screen });
                  }
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
                      color: '#000',
                      fontSize: 11,
                      fontWeight: 800,
                      boxShadow: '0 0 8px rgba(245,196,0,.5)',
                    }}
                    data-testid="badge-unsorted-count"
                  >
                    {badgeCount}
                  </div>
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: tile.primary ? 'rgba(245,196,0,.1)' : 'rgba(255,255,255,.04)',
                    border: tile.primary ? '1.5px solid rgba(245,196,0,.25)' : '1px solid rgba(255,255,255,.06)',
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    stroke={tile.primary ? 'var(--wc-y)' : 'var(--wc-t2)'}
                    strokeWidth={1.8}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold" style={{ color: tile.primary ? '#fff' : 'var(--wc-t2)' }}>
                    {tile.label}
                  </div>
                  <div className="text-[9px] mt-[2px]" style={{ color: badgeCount > 0 && tile.primary ? 'var(--wc-y)' : 'var(--wc-t3)' }}>{tile.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ob-a4 rounded-xl p-4 mb-4" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
        <div className="flex justify-between items-center mb-2">
          <div className="text-[11px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-t2)' }}>12-Week Logbook</div>
          <div className="font-data text-[11px]" style={{ color: 'var(--wc-y)' }}>Week 1 of 12</div>
        </div>
        <div className="flex gap-[3px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`ob-wpip ${i === 0 ? 'now' : ''}`}
            />
          ))}
        </div>
        <div className="text-[10px] mt-2 text-center" style={{ color: 'var(--wc-t3)' }}>
          Complete 12 weeks <span style={{ color: 'var(--wc-t2)' }}>for 5 years of deductions</span>
        </div>
      </div>

      {deductionState !== 'active' && (
        <div className="ob-a5 mb-4">
          <ReadinessCard state={deductionState} checks={readinessChecks} />
        </div>
      )}

      {deductionState !== 'locked' && (
        <div className="ob-a6 mb-4 px-1">
          <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
            {disclaimer}
          </div>
        </div>
      )}

    </div>
  );
}
