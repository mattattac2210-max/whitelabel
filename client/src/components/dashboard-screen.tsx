import { useApp } from '@/lib/app-context';
import { RATE } from '@/lib/trip-data';
import { MapPin, LayoutGrid, FileText, Download, Plus, Gauge, ChevronRight } from 'lucide-react';

export function DashboardScreen() {
  const { state, dispatch } = useApp();

  const totalTrips = state.currentIndex;
  const bizKm = state.trips.slice(0, state.currentIndex).filter(t => t.type === 'business').reduce((s, t) => s + t.km, 0);
  const dedTotal = state.dedTotal;

  const tiles = [
    { screen: 'sort' as const, label: 'Sort Trips', sub: 'Classify business vs personal', icon: MapPin, primary: true },
    { screen: 'review' as const, label: 'Review', sub: 'View all classified trips', icon: LayoutGrid, primary: false },
    { screen: 'reports' as const, label: 'Reports', sub: 'Session summaries', icon: FileText, primary: false },
    { screen: 'export' as const, label: 'Export', sub: 'PDF & CSV exports', icon: Download, primary: false },
    { screen: 'input' as const, label: 'Add Trip', sub: 'Manual trip entry', icon: Plus, primary: false },
    { screen: 'odometer' as const, label: 'Odometer', sub: 'Verify readings', icon: Gauge, primary: false },
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
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}
          data-testid="dash-stat-ded"
        >
          <div className="text-[10px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-t3)' }}>Deduction</div>
          <div className="font-display text-[28px] leading-none mt-1" style={{ color: 'var(--wc-gr)' }}>
            ${dedTotal.toFixed(0)}
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--wc-t2)' }}>@ ${RATE}/km</div>
        </div>
      </div>

      <div className="ob-a3 mb-4">
        <div className="text-[11px] font-bold uppercase tracking-[.07em] mb-3" style={{ color: 'var(--wc-t3)' }}>Quick Actions</div>
        <div className="grid grid-cols-2 gap-2">
          {tiles.map(tile => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.screen}
                className="flex items-center gap-3 p-4 rounded-xl text-left transition-all active:scale-[.98]"
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
                  <div className="text-[9px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>{tile.sub}</div>
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

      <div
        className="ob-a5 rounded-xl p-4 flex items-center gap-3 cursor-pointer active:scale-[.98] transition-transform"
        style={{ background: 'rgba(245,196,0,.04)', border: '1px solid rgba(245,196,0,.16)' }}
        onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'odometer' })}
        data-testid="dash-audit-card"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(245,196,0,.1)', border: '1.5px solid rgba(245,196,0,.25)' }}
        >
          <Gauge className="w-5 h-5" stroke="var(--wc-y)" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold">Audit Readiness</div>
          <div className="text-[10px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>
            Verify odometer readings to boost your score
          </div>
        </div>
        <ChevronRight className="w-4 h-4" stroke="var(--wc-t3)" strokeWidth={2} />
      </div>
    </div>
  );
}
