import { useApp } from '@/lib/app-context';
import { ArrowLeft, Car, Receipt, Download, ChevronRight, BarChart3 } from 'lucide-react';
import type { Screen } from '@/lib/app-context';

const docItems: { screen: Screen; label: string; sub: string; icon: typeof Car; reportsReadOnly?: boolean }[] = [
  { screen: 'reports', label: 'Trip Summaries', sub: 'View trip summaries', icon: Car, reportsReadOnly: true },
  { screen: 'stats', label: 'My Stats', sub: 'Trips, km & trends', icon: BarChart3 },
  { screen: 'expenses', label: 'Expenses', sub: 'Track & report costs', icon: Receipt },
  { screen: 'export', label: 'Export', sub: 'PDF & CSV download', icon: Download },
];

export function DocumentsScreen() {
  const { dispatch } = useApp();

  return (
    <div className="flex flex-col h-full" data-testid="documents-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="button-back-documents"
        >
          <ArrowLeft className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[22px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Documents</span>
      </div>

      <div className="flex-1 px-4 pb-[20px] flex flex-col gap-[8px] overflow-y-auto">
        {docItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.screen}
              className="flex items-center gap-[10px] p-[12px_14px] rounded-xl text-left transition-all active:scale-[.98]"
              style={{
                background: 'var(--wc-card)',
                border: '1px solid var(--wc-border)',
              }}
              onClick={() => dispatch({ type: 'GO_SCREEN', screen: item.screen, reportsReadOnly: item.reportsReadOnly })}
              data-testid={`doc-item-${item.screen}`}
            >
              <div
                className="w-[36px] h-[36px] rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgb(var(--wc-ink) / .04)',
                  border: '1px solid rgb(var(--wc-ink) / .06)',
                }}
              >
                <Icon
                  className="w-[18px] h-[18px]"
                  stroke="var(--wc-t2)"
                  strokeWidth={1.8}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold" style={{ color: 'var(--wc-t2)' }}>
                  {item.label}
                </div>
                <div className="text-[9px] mt-[1px]" style={{ color: 'var(--wc-t3)' }}>{item.sub}</div>
              </div>
              <ChevronRight className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
