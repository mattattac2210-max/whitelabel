import { useState, useEffect, useMemo } from 'react';
import { Calculator, AlertTriangle } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { calcLogbookDeduction } from '@/lib/trip-data';
import { CollapsiblePanel, FieldInput, ChipSelect, ToggleRow } from './collapsible-panel';

interface TaxProfile {
  incomeMode: string;
  salary: string;
  otherDeductions: string;
  hecsDebt: boolean;
  hospitalCover: boolean;
  familyStatus: string;
  dependants: string;
}

const DEFAULT: TaxProfile = {
  incomeMode: 'Annual', salary: '', otherDeductions: '',
  hecsDebt: false, hospitalCover: false, familyStatus: 'Single', dependants: '0',
};

function load(): TaxProfile {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem('wc_tax_profile') || '{}') }; }
  catch { return DEFAULT; }
}

function calcTax(taxable: number): number {
  if (taxable <= 18200) return 0;
  if (taxable <= 45000) return (taxable - 18200) * 0.16;
  if (taxable <= 135000) return 4288 + (taxable - 45000) * 0.30;
  if (taxable <= 190000) return 31288 + (taxable - 135000) * 0.37;
  return 51638 + (taxable - 190000) * 0.45;
}

function getTaxBracket(taxable: number): string {
  if (taxable <= 18200) return '0% (Tax-Free)';
  if (taxable <= 45000) return '16%';
  if (taxable <= 135000) return '30%';
  if (taxable <= 190000) return '37%';
  return '45%';
}

export function TaxEstimatePanel() {
  const { state } = useApp();
  const [p, setP] = useState<TaxProfile>(load);

  useEffect(() => {
    localStorage.setItem('wc_tax_profile', JSON.stringify(p));
  }, [p]);

  const upd = (key: keyof TaxProfile) => (v: string) => setP(prev => ({ ...prev, [key]: v }));
  const updBool = (key: keyof TaxProfile) => (v: boolean) => setP(prev => ({ ...prev, [key]: v }));

  const annualIncome = useMemo(() => {
    const raw = parseFloat(p.salary) || 0;
    return p.incomeMode === 'Weekly' ? raw * 52 : raw;
  }, [p.salary, p.incomeMode]);

  const bizKm = state.trips.filter(t => t.type === 'business').reduce((s, t) => s + t.km, 0);
  const totalKmAll = state.trips.filter(t => t.type !== null).reduce((s, t) => s + t.km, 0);
  const vehicleDed = calcLogbookDeduction(bizKm, totalKmAll);
  const otherDed = parseFloat(p.otherDeductions) || 0;
  const totalDed = vehicleDed + otherDed;
  const taxableIncome = Math.max(0, annualIncome - totalDed);
  const taxWithoutDed = calcTax(annualIncome - otherDed);
  const taxWithDed = calcTax(taxableIncome);
  const taxSaving = Math.round((taxWithoutDed - taxWithDed) * 100) / 100;
  const medicareLevyRate = 0.02;
  const medicareLevy = Math.round(taxableIncome * medicareLevyRate * 100) / 100;
  const surchargeRisk = annualIncome > 93000 && !p.hospitalCover;

  const sliderMax = p.incomeMode === 'Weekly' ? 5000 : 250000;

  return (
    <CollapsiblePanel title="Tax Estimate" icon={Calculator} testId="panel-tax-estimate">
      <div className="pt-[12px]">
        <div className="rounded-[10px] p-[10px_12px] mb-[12px] flex items-start gap-[8px]" style={{ background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.15)' }}>
          <AlertTriangle className="w-[14px] h-[14px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-am)' }} />
          <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
            This estimate is for planning purposes only and does not constitute tax advice. Final tax outcomes depend on your full tax position and should be reviewed by a registered tax agent.
          </div>
        </div>

        <ChipSelect label="Income Mode" options={['Weekly', 'Annual']} value={p.incomeMode} onChange={upd('incomeMode')} testId="chip-income-mode" />

        <div className="mb-[10px]">
          <label className="font-data text-[9px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>
            Salary / Wages ({p.incomeMode})
          </label>
          <input
            type="range"
            min="0"
            max={sliderMax}
            step={p.incomeMode === 'Weekly' ? 50 : 1000}
            value={parseFloat(p.salary) || 0}
            onChange={e => upd('salary')(e.target.value)}
            className="w-full mb-[4px] accent-[#F5C400]"
            data-testid="slider-salary"
          />
          <input
            type="number"
            className="w-full rounded-[8px] p-[11px] text-[14px] text-white outline-none font-data"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={p.salary}
            onChange={e => upd('salary')(e.target.value)}
            placeholder={p.incomeMode === 'Weekly' ? 'e.g. 1500' : 'e.g. 85000'}
            data-testid="input-salary"
          />
          {p.incomeMode === 'Weekly' && annualIncome > 0 && (
            <div className="text-[10px] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>= ${annualIncome.toLocaleString()} per year</div>
          )}
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[9px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Other Deductions ($)</label>
          <input
            type="range"
            min="0"
            max="20000"
            step={500}
            value={parseFloat(p.otherDeductions) || 0}
            onChange={e => upd('otherDeductions')(e.target.value)}
            className="w-full mb-[4px] accent-[#F5C400]"
            data-testid="slider-other-ded"
          />
          <input
            type="number"
            className="w-full rounded-[8px] p-[11px] text-[14px] text-white outline-none font-data"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={p.otherDeductions}
            onChange={e => upd('otherDeductions')(e.target.value)}
            placeholder="e.g. 2000"
            data-testid="input-other-ded"
          />
        </div>

        <ToggleRow label="HELP / HECS Debt" value={p.hecsDebt} onChange={updBool('hecsDebt')} testId="toggle-hecs" />
        <ToggleRow label="Private Hospital Cover" value={p.hospitalCover} onChange={updBool('hospitalCover')} testId="toggle-hospital" />

        <ChipSelect label="Family Status" options={['Single', 'Family']} value={p.familyStatus} onChange={upd('familyStatus')} testId="chip-family" />

        {p.familyStatus === 'Family' && (
          <FieldInput label="Dependants" value={p.dependants} onChange={upd('dependants')} type="number" placeholder="0" testId="input-dependants" />
        )}

        {annualIncome > 0 && (
          <>
            <div className="font-heading font-bold text-[12px] uppercase tracking-[.04em] mt-[16px] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>Tax Summary (Estimated)</div>

            <div className="grid grid-cols-2 gap-[6px] mb-[6px]">
              <div className="rounded-[8px] p-[10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
                <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Annual Income</div>
                <div className="font-heading font-bold text-[16px] mt-[2px] text-white">${annualIncome.toLocaleString()}</div>
              </div>
              <div className="rounded-[8px] p-[10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
                <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Taxable Income</div>
                <div className="font-heading font-bold text-[16px] mt-[2px]" style={{ color: 'var(--wc-y)' }}>${taxableIncome.toLocaleString()}</div>
              </div>
              <div className="rounded-[8px] p-[10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
                <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Tax Bracket</div>
                <div className="font-heading font-bold text-[14px] mt-[2px]" style={{ color: 'var(--wc-am)' }}>{getTaxBracket(taxableIncome)}</div>
              </div>
              <div className="rounded-[8px] p-[10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
                <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Medicare Levy</div>
                <div className="font-heading font-bold text-[14px] mt-[2px]" style={{ color: 'var(--wc-am)' }}>${medicareLevy.toLocaleString()}</div>
              </div>
            </div>

            <div className="rounded-[10px] p-[12px] mb-[6px]" style={{ background: 'rgba(245,196,0,.04)', border: '1.5px solid rgba(245,196,0,.2)' }}>
              <div className="flex justify-between items-center mb-[4px]">
                <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Vehicle Deduction</span>
                <span className="font-heading font-bold text-[16px]" style={{ color: 'var(--wc-y)' }}>${vehicleDed.toLocaleString()}</span>
              </div>
              <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>{totalKmAll > 0 ? Math.round(bizKm / totalKmAll * 100) : 0}% biz use &times; vehicle costs</div>
            </div>

            <div className="rounded-[10px] p-[12px]" style={{ background: 'rgba(34,197,94,.04)', border: '1.5px solid rgba(34,197,94,.2)' }}>
              <div className="flex justify-between items-center mb-[2px]">
                <span className="font-heading font-bold text-[13px] uppercase" style={{ color: 'var(--wc-gr)' }}>Tax Saving from Vehicle</span>
                <span className="font-heading font-black text-[20px]" style={{ color: 'var(--wc-gr)' }}>${taxSaving.toLocaleString()}</span>
              </div>
              <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>Estimated impact on your tax bill</div>
            </div>

            {surchargeRisk && (
              <div className="rounded-[10px] p-[10px_12px] mt-[8px] flex items-start gap-[8px]" style={{ background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.2)' }}>
                <AlertTriangle className="w-[14px] h-[14px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-re)' }} />
                <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-re)' }}>
                  You may be liable for the Medicare Levy Surcharge (1-1.5%) as your income exceeds the threshold and you don't have private hospital cover.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CollapsiblePanel>
  );
}
