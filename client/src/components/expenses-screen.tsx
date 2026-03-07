import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { BottomNav } from './bottom-nav';
import { ArrowLeft, Plus, Receipt, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  gst: number;
  receipt: boolean;
}

const CATEGORIES = [
  'Fuel & Oil',
  'Registration',
  'Insurance',
  'Repairs & Servicing',
  'Tyres',
  'Car Wash',
  'Tolls & Parking',
  'Roadside Assist',
  'Lease Payments',
  'Interest on Loan',
  'Depreciation',
  'Other',
];

function getExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem('wc_expenses');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveExpenses(expenses: Expense[]) {
  localStorage.setItem('wc_expenses', JSON.stringify(expenses));
}

let nextId = Date.now();

export function ExpensesScreen() {
  const { dispatch } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>(getExpenses);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [hasReceipt, setHasReceipt] = useState(false);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0 || !description.trim()) return;
    const gst = Math.round(parsedAmount / 11 * 100) / 100;
    const expense: Expense = {
      id: nextId++,
      date,
      category,
      description: description.trim(),
      amount: parsedAmount,
      gst,
      receipt: hasReceipt,
    };
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveExpenses(updated);
    setAdding(false);
    setDescription('');
    setAmount('');
    setHasReceipt(false);
  };

  const handleDelete = (id: number) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
    setExpanded(null);
  };

  return (
    <div className="flex flex-col h-full" data-testid="expenses-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="button-back-expenses"
        >
          <ArrowLeft className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[22px] uppercase tracking-[.04em] text-white">Expenses</span>
        <span className="ml-auto font-heading font-bold text-[14px]" style={{ color: 'var(--wc-y)' }}>${totalExpenses.toFixed(2)}</span>
      </div>

      <div className="flex gap-[6px] px-[14px] pb-[6px] flex-shrink-0">
        <div className="flex-1 rounded-[10px] p-[8px_12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Total Expenses</div>
          <div className="font-heading font-black text-[20px] leading-[1.2]" style={{ color: 'var(--wc-y)' }}>${totalExpenses.toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-[10px] p-[8px_12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>GST Credits</div>
          <div className="font-heading font-black text-[20px] leading-[1.2]" style={{ color: 'var(--wc-gr)' }}>${expenses.reduce((s, e) => s + e.gst, 0).toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-[10px] p-[8px_12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Items</div>
          <div className="font-heading font-black text-[20px] leading-[1.2]" style={{ color: 'var(--wc-t2)' }}>{expenses.length}</div>
        </div>
      </div>

      {adding && (
        <div className="mx-[14px] mb-[6px] rounded-[14px] p-[14px] flex-shrink-0" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,196,0,.4)', borderLeft: '4px solid var(--wc-y)' }}>
          <div className="font-heading font-bold text-[14px] uppercase tracking-[.04em] mb-[10px]" style={{ color: 'var(--wc-y)' }}>New Expense</div>

          <div className="flex gap-[8px] mb-[8px]">
            <div className="flex-1">
              <label className="font-data text-[9px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Date</label>
              <input
                type="date"
                className="w-full rounded-[8px] p-[10px] text-[14px] text-white outline-none"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
                value={date}
                onChange={e => setDate(e.target.value)}
                data-testid="expense-date"
              />
            </div>
            <div className="flex-1">
              <label className="font-data text-[9px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-[8px] p-[10px] text-[14px] text-white outline-none font-data"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                data-testid="expense-amount"
              />
            </div>
          </div>

          <label className="font-data text-[9px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Category</label>
          <div className="flex flex-wrap gap-[5px] mb-[8px]">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className="rounded-[8px] px-[10px] py-[7px] font-heading font-bold text-[11px] uppercase tracking-[.03em] cursor-pointer transition-all"
                style={{
                  background: category === cat ? 'rgba(245,196,0,.15)' : 'rgba(255,255,255,.04)',
                  border: category === cat ? '1px solid rgba(245,196,0,.4)' : '1px solid var(--wc-border)',
                  color: category === cat ? 'var(--wc-y)' : 'var(--wc-t2)',
                }}
                onClick={() => setCategory(cat)}
                data-testid={`expense-cat-${cat.replace(/[^a-zA-Z]/g, '').toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="font-data text-[9px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Description</label>
          <input
            className="w-full rounded-[8px] p-[10px] text-[14px] text-white outline-none mb-[8px]"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Oil change at Repco"
            data-testid="expense-description"
          />

          <button
            className="flex items-center gap-[8px] mb-[10px] cursor-pointer"
            onClick={() => setHasReceipt(!hasReceipt)}
            data-testid="expense-receipt-toggle"
          >
            <div className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center" style={{ background: hasReceipt ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.05)', border: hasReceipt ? '1.5px solid rgba(34,197,94,.4)' : '1.5px solid var(--wc-border)' }}>
              {hasReceipt && <Check className="w-[14px] h-[14px]" style={{ color: 'var(--wc-gr)' }} />}
            </div>
            <span className="text-[13px]" style={{ color: hasReceipt ? 'var(--wc-gr)' : 'var(--wc-t2)' }}>I have the receipt</span>
          </button>

          <div className="flex gap-[8px]">
            <button
              className="flex-1 py-[12px] rounded-[10px] font-heading font-bold text-[14px] uppercase tracking-[.04em] cursor-pointer"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t3)' }}
              onClick={() => setAdding(false)}
              data-testid="expense-cancel"
            >
              Cancel
            </button>
            <button
              className="flex-1 py-[12px] rounded-[10px] font-heading font-bold text-[14px] uppercase tracking-[.04em] text-black cursor-pointer"
              style={{ background: (parseFloat(amount) > 0 && description.trim()) ? 'var(--wc-y)' : 'rgba(245,196,0,.3)', opacity: (parseFloat(amount) > 0 && description.trim()) ? 1 : 0.5 }}
              onClick={handleAdd}
              data-testid="expense-save"
            >
              Save Expense
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 px-[14px] pb-1 flex flex-col gap-[5px] overflow-y-auto scrollbar-thin">
        {expenses.map(exp => {
          const isExpanded = expanded === exp.id;
          return (
            <div
              key={exp.id}
              className="rounded-[12px] cursor-pointer transition-all"
              style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)', borderLeft: '3px solid rgba(245,196,0,.4)' }}
              data-testid={`expense-item-${exp.id}`}
            >
              <div className="flex items-center gap-[10px] p-[12px_14px]" onClick={() => setExpanded(isExpanded ? null : exp.id)}>
                <Receipt className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] text-white truncate">{exp.description}</div>
                  <div className="text-[11px] mt-[1px]" style={{ color: 'var(--wc-t3)' }}>{exp.date} &middot; {exp.category}</div>
                </div>
                <div className="font-heading font-bold text-[15px] flex-shrink-0" style={{ color: 'var(--wc-y)' }}>${exp.amount.toFixed(2)}</div>
                {isExpanded ? <ChevronUp className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t3)' }} /> : <ChevronDown className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t3)' }} />}
              </div>
              {isExpanded && (
                <div className="px-[14px] pb-[12px] border-t flex items-center justify-between" style={{ borderColor: 'var(--wc-border)' }}>
                  <div className="text-[12px] pt-[8px]" style={{ color: 'var(--wc-t2)' }}>
                    GST: ${exp.gst.toFixed(2)} &middot; {exp.receipt ? '✓ Receipt' : 'No receipt'}
                  </div>
                  <button
                    className="flex items-center gap-[4px] mt-[8px] px-[10px] py-[6px] rounded-[8px] cursor-pointer"
                    style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: 'var(--wc-re)' }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }}
                    data-testid={`expense-delete-${exp.id}`}
                  >
                    <Trash2 className="w-[12px] h-[12px]" />
                    <span className="font-heading font-bold text-[11px] uppercase">Delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {expenses.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-[40px]">
            <Receipt className="w-[40px] h-[40px] mb-[12px]" style={{ color: 'var(--wc-t3)' }} />
            <div className="font-heading font-bold text-[16px] uppercase text-center" style={{ color: 'var(--wc-t3)' }}>No expenses yet</div>
            <div className="text-[12px] text-center mt-[4px]" style={{ color: 'var(--wc-t3)' }}>Tap the button below to add your first vehicle expense.</div>
          </div>
        )}
      </div>

      {!adding && (
        <div className="px-[14px] py-[8px] flex-shrink-0">
          <button
            className="w-full rounded-[14px] py-[15px] font-heading font-black text-[17px] tracking-[.07em] uppercase text-black cursor-pointer flex items-center justify-center gap-3 transition-all active:scale-[.98]"
            style={{ background: 'var(--wc-y)', boxShadow: '0 4px 20px rgba(245,196,0,.25)' }}
            onClick={() => setAdding(true)}
            data-testid="button-add-expense"
          >
            <Plus className="w-[20px] h-[20px]" strokeWidth={2.5} />
            Add Expense
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
