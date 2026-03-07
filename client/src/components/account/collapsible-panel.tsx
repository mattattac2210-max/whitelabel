import { useState } from 'react';
import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: React.ReactNode;
  testId: string;
}

export function CollapsiblePanel({ title, icon: Icon, defaultOpen = false, children, testId }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[14px] transition-all" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }} data-testid={testId}>
      <button
        className="w-full flex items-center gap-[10px] p-[14px_16px] cursor-pointer"
        onClick={() => setOpen(!open)}
        data-testid={`${testId}-toggle`}
      >
        <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.18)' }}>
          <Icon className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
        </div>
        <span className="font-heading font-bold text-[15px] uppercase tracking-[.04em] text-white flex-1 text-left">{title}</span>
        {open
          ? <ChevronUp className="w-[16px] h-[16px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
          : <ChevronDown className="w-[16px] h-[16px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
        }
      </button>
      {open && (
        <div className="px-[16px] pb-[16px] border-t" style={{ borderColor: 'var(--wc-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function FieldInput({ label, value, onChange, placeholder, type = 'text', testId, readOnly = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; testId: string; readOnly?: boolean;
}) {
  return (
    <div className="mb-[10px]">
      <label className="font-data text-[9px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>{label}</label>
      <input
        type={type}
        className="w-full rounded-[8px] p-[11px] text-[14px] text-white outline-none"
        style={{ background: readOnly ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)', opacity: readOnly ? 0.7 : 1 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        data-testid={testId}
      />
    </div>
  );
}

export function ToggleRow({ label, value, onChange, testId }: {
  label: string; value: boolean; onChange: (v: boolean) => void; testId: string;
}) {
  return (
    <div className="flex items-center justify-between py-[10px]" style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
      <span className="text-[13px] text-white">{label}</span>
      <button
        className="w-[44px] h-[24px] rounded-full relative cursor-pointer transition-all"
        style={{ background: value ? 'rgba(34,197,94,.3)' : 'rgba(255,255,255,.1)' }}
        onClick={() => onChange(!value)}
        data-testid={testId}
      >
        <div
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full transition-all"
          style={{ left: value ? '23px' : '3px', background: value ? 'var(--wc-gr)' : 'var(--wc-t3)' }}
        />
      </button>
    </div>
  );
}

export function ChipSelect({ label, options, value, onChange, testId }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; testId: string;
}) {
  return (
    <div className="mb-[10px]">
      <label className="font-data text-[9px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>{label}</label>
      <div className="flex flex-wrap gap-[5px]">
        {options.map(opt => (
          <button
            key={opt}
            className="rounded-[8px] px-[10px] py-[8px] font-heading font-bold text-[11px] uppercase tracking-[.03em] cursor-pointer transition-all"
            style={{
              background: value === opt ? 'rgba(245,196,0,.15)' : 'rgba(255,255,255,.04)',
              border: value === opt ? '1px solid rgba(245,196,0,.4)' : '1px solid var(--wc-border)',
              color: value === opt ? 'var(--wc-y)' : 'var(--wc-t2)',
            }}
            onClick={() => onChange(opt)}
            data-testid={`${testId}-${opt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
