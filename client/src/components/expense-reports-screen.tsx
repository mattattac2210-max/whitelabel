import { useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, Receipt, Download, FileText } from 'lucide-react';

interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  gst: number;
  receipt: boolean;
}

function getExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem('wc_expenses');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function ExpenseReportsScreen() {
  const { dispatch } = useApp();
  const expenses = useMemo(getExpenses, []);

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const totalGST = expenses.reduce((s, e) => s + e.gst, 0);
  const withReceipt = expenses.filter(e => e.receipt).length;

  const byCategory = useMemo(() => {
    const map: Record<string, { total: number; count: number; gst: number }> = {};
    expenses.forEach(e => {
      if (!map[e.category]) map[e.category] = { total: 0, count: 0, gst: 0 };
      map[e.category].total += e.amount;
      map[e.category].count += 1;
      map[e.category].gst += e.gst;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [expenses]);

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = 'Date,Category,Description,Amount,GST,Receipt\n';
    const rows = expenses.map(e =>
      `${e.date},"${e.category}","${e.description}",${e.amount.toFixed(2)},${e.gst.toFixed(2)},${e.receipt ? 'Yes' : 'No'}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full" data-testid="expense-reports-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="button-back-expense-reports"
        >
          <ArrowLeft className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[22px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Expense Reports</span>
      </div>

      <div className="flex gap-[6px] px-[14px] pb-[6px] flex-shrink-0">
        <div className="flex-1 rounded-[10px] p-[8px_12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Total</div>
          <div className="font-heading font-black text-[20px] leading-[1.2]" style={{ color: 'var(--wc-y)' }}>${totalAmount.toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-[10px] p-[8px_12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>GST</div>
          <div className="font-heading font-black text-[20px] leading-[1.2]" style={{ color: 'var(--wc-gr)' }}>${totalGST.toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-[10px] p-[8px_12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Receipts</div>
          <div className="font-heading font-black text-[20px] leading-[1.2]" style={{ color: 'var(--wc-t2)' }}>{withReceipt}/{expenses.length}</div>
        </div>
      </div>

      <div className="flex-1 px-[14px] pb-1 flex flex-col gap-[6px] overflow-y-auto scrollbar-thin">
        <div className="font-heading font-bold text-[13px] uppercase tracking-[.04em] mt-[4px] mb-[2px]" style={{ color: 'var(--wc-t2)' }}>By Category</div>
        {byCategory.map(([cat, data]) => {
          const pct = totalAmount > 0 ? (data.total / totalAmount * 100) : 0;
          return (
            <div key={cat} className="rounded-[12px] p-[12px_14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
              <div className="flex items-center justify-between mb-[6px]">
                <div className="font-semibold text-[14px]" style={{ color: 'var(--wc-text)' }}>{cat}</div>
                <div className="font-heading font-bold text-[14px]" style={{ color: 'var(--wc-y)' }}>${data.total.toFixed(2)}</div>
              </div>
              <div className="h-[6px] rounded-full overflow-hidden mb-[4px]" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--wc-y)' }} />
              </div>
              <div className="flex justify-between text-[11px]" style={{ color: 'var(--wc-t3)' }}>
                <span>{data.count} item{data.count !== 1 ? 's' : ''} &middot; GST ${data.gst.toFixed(2)}</span>
                <span>{pct.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}

        {expenses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-[40px]">
            <FileText className="w-[40px] h-[40px] mb-[12px]" style={{ color: 'var(--wc-t3)' }} />
            <div className="font-heading font-bold text-[16px] uppercase text-center" style={{ color: 'var(--wc-t3)' }}>No expenses recorded</div>
            <div className="text-[12px] text-center mt-[4px]" style={{ color: 'var(--wc-t3)' }}>Add expenses first, then come back for reports.</div>
            <button
              className="mt-[12px] rounded-[10px] px-[20px] py-[10px] font-heading font-bold text-[13px] uppercase cursor-pointer"
              style={{ background: 'rgb(var(--wc-ink) / .1)', border: '1px solid rgb(var(--wc-ink) / .3)', color: 'var(--wc-y)' }}
              onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'expenses' })}
              data-testid="button-go-add-expenses"
            >
              Add Expenses
            </button>
          </div>
        )}

        {expenses.length > 0 && (
          <div className="rounded-[12px] p-[14px] mt-[4px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="font-heading font-bold text-[13px] uppercase tracking-[.04em] mb-[6px]" style={{ color: 'var(--wc-t2)' }}>All Expenses</div>
            {expenses.map((exp, i) => (
              <div key={exp.id} className="flex items-center justify-between py-[8px]" style={{ borderTop: i > 0 ? '1px solid rgb(var(--wc-ink) / .04)' : 'none' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] truncate" style={{ color: 'var(--wc-text)' }}>{exp.description}</div>
                  <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>{exp.date} &middot; {exp.category}{exp.receipt ? ' &middot; ✓' : ''}</div>
                </div>
                <div className="font-data font-bold text-[13px] flex-shrink-0" style={{ color: 'var(--wc-y)' }}>${exp.amount.toFixed(2)}</div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-[10px] mt-[6px]" style={{ borderTop: '1.5px solid rgb(var(--wc-ink) / .2)' }}>
              <div className="font-heading font-bold text-[14px] uppercase" style={{ color: 'var(--wc-text)' }}>Total</div>
              <div className="font-heading font-bold text-[16px]" style={{ color: 'var(--wc-y)' }}>${totalAmount.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {expenses.length > 0 && (
        <div className="px-[14px] py-[8px] flex-shrink-0">
          <button
            className="w-full rounded-[14px] py-[15px] font-heading font-black text-[17px] tracking-[.07em] uppercase cursor-pointer flex items-center justify-center gap-3 transition-all active:scale-[.98]"
            style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)', boxShadow: '0 4px 20px rgb(var(--wc-ink) / .25)' }}
            onClick={handleExportCSV}
            data-testid="button-export-expenses"
          >
            <Download className="w-[20px] h-[20px]" strokeWidth={2.5} />
            Export Expenses CSV
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
