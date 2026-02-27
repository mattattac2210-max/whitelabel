import { useApp } from '@/lib/app-context';
import { BottomNav } from './bottom-nav';
import { ArrowLeft } from 'lucide-react';

export function ReportsScreen() {
  const { state, dispatch } = useApp();

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

      <div className="flex-1 px-[14px] flex flex-col gap-[6px] overflow-y-auto scrollbar-thin">
        {state.savedReports.length === 0 ? (
          <div className="py-[30px] px-[14px] text-center text-[13px]" style={{ color: 'var(--wc-t3)' }}>
            No sessions saved yet.<br />Complete your first sort session to see reports here.
          </div>
        ) : (
          state.savedReports.map((r, i) => (
            <div key={i} className="rounded-[13px] p-[12px_14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid={`report-${i}`}>
              <div className="font-data text-[9px] uppercase tracking-[.08em] mb-1" style={{ color: 'var(--wc-t3)' }}>{r.timestamp}</div>
              <div className="font-heading font-bold text-[15px] text-white mb-[6px]">Sort Session &mdash; {r.bizCount + r.perCount} trips</div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>
                  <strong style={{ color: 'var(--wc-y)' }}>{r.bizCount}</strong> business
                </span>
                <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>
                  <strong style={{ color: 'var(--wc-re)' }}>{r.perCount}</strong> personal
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
              {r.unclassified > 0 && (
                <div className="mt-1 text-[11px]" style={{ color: 'rgba(245,196,0,.7)' }}>
                  {r.unclassified} trip{r.unclassified > 1 ? 's' : ''} unclassified
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav activeOverride="reports" />
    </div>
  );
}
