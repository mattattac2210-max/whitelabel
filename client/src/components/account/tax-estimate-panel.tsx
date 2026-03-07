import { useState, useEffect, useMemo } from 'react';
import { Calculator, AlertTriangle, Lock, CheckCircle, Circle, Info, BarChart3, ChevronRight, X } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { calcLogbookDeduction } from '@/lib/trip-data';
import { CollapsiblePanel, FieldInput, ChipSelect, ToggleRow } from './collapsible-panel';
import { CalculationBreakdown } from '@/components/deduction-card';
import {
  getReadinessChecks,
  getDeductionState,
  getMissingItems,
  getIncludedItems,
  getEstimateDisclaimer,
  getReadinessLabel,
  getEstimateMode,
  type DeductionState,
} from '@/lib/deduction-estimator';

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

function loadSettings() {
  try { return JSON.parse(localStorage.getItem('wc_settings') || '{}'); }
  catch { return {}; }
}

function saveSettings(patch: Record<string, any>) {
  try {
    const current = loadSettings();
    localStorage.setItem('wc_settings', JSON.stringify({ ...current, ...patch }));
  } catch {}
}

export function TaxEstimatePanel() {
  const { state } = useApp();
  const [p, setP] = useState<TaxProfile>(load);
  const [useIndustry, setUseIndustry] = useState(() => {
    const s = loadSettings();
    return s.useIndustryAverages !== false;
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('wc_tax_profile', JSON.stringify(p));
  }, [p]);

  const upd = (key: keyof TaxProfile) => (v: string) => setP(prev => ({ ...prev, [key]: v }));
  const updBool = (key: keyof TaxProfile) => (v: boolean) => setP(prev => ({ ...prev, [key]: v }));

  const handleIndustryToggle = (v: boolean) => {
    if (!v) {
      setShowConfirmModal(true);
    } else {
      setUseIndustry(true);
      saveSettings({ useIndustryAverages: true });
    }
  };

  const confirmPersonalised = () => {
    setUseIndustry(false);
    saveSettings({ useIndustryAverages: false });
    setShowConfirmModal(false);
  };

  const cancelPersonalised = () => {
    setShowConfirmModal(false);
  };

  const annualIncome = useMemo(() => {
    const raw = parseFloat(p.salary) || 0;
    return p.incomeMode === 'Weekly' ? raw * 52 : raw;
  }, [p.salary, p.incomeMode]);

  const hasBizTrips = state.trips.some(t => t.type === 'business');
  const readinessChecks = useMemo(() => getReadinessChecks(hasBizTrips), [hasBizTrips, p]);

  let showDeductionEstimates = true;
  try {
    const settings = loadSettings();
    if (settings.showDeductionEstimates === false) showDeductionEstimates = false;
  } catch {}

  const deductionState = getDeductionState(readinessChecks, showDeductionEstimates);
  const missingItems = getMissingItems(readinessChecks);
  const includedItems = getIncludedItems(readinessChecks);
  const readinessLabel = getReadinessLabel(deductionState);
  const disclaimer = getEstimateDisclaimer(deductionState);

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

  const readinessColor = deductionState === 'active' ? 'rgba(34,197,94,.15)' : deductionState === 'partial' ? 'rgba(245,158,11,.15)' : 'rgba(255,255,255,.06)';
  const readinessBorderColor = deductionState === 'active' ? 'rgba(34,197,94,.25)' : deductionState === 'partial' ? 'rgba(245,158,11,.25)' : 'rgba(255,255,255,.08)';
  const readinessTextColor = deductionState === 'active' ? 'var(--wc-gr)' : deductionState === 'partial' ? 'var(--wc-am)' : 'var(--wc-t3)';

  return (
    <CollapsiblePanel title="Tax Estimate" icon={Calculator} testId="panel-tax-estimate">
      <div className="pt-[12px]">
        <ToggleRow label="Use Industry Averages" value={useIndustry} onChange={handleIndustryToggle} testId="toggle-industry-averages" />
        <div className="text-[10px] leading-[1.4] mt-[-4px] mb-[12px] pl-[2px]" style={{ color: 'var(--wc-t3)' }}>
          {useIndustry
            ? 'Quickest setup — deductions estimated using typical costs for your vehicle type.'
            : 'Personalised — using your financial and expense data for estimates.'}
        </div>

        {useIndustry ? (
          <>
            <CalculationBreakdown className="mb-[10px]" />
            <div className="rounded-[10px] p-[10px_12px] flex items-start gap-[8px]" style={{ background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.15)' }}>
              <BarChart3 className="w-[14px] h-[14px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-am)' }} />
              <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
                Based on industry average running costs for your vehicle type. Switch off the toggle above to enter your own financial details.
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-[10px] p-[10px_12px] mb-[12px]" style={{ background: readinessColor, border: `1px solid ${readinessBorderColor}` }} data-testid="card-readiness-status">
              <div className="flex items-center gap-[6px] mb-[6px]">
                {deductionState === 'active' ? (
                  <CheckCircle className="w-[14px] h-[14px] flex-shrink-0" style={{ color: readinessTextColor }} />
                ) : deductionState === 'partial' ? (
                  <Info className="w-[14px] h-[14px] flex-shrink-0" style={{ color: readinessTextColor }} />
                ) : (
                  <Lock className="w-[14px] h-[14px] flex-shrink-0" style={{ color: readinessTextColor }} />
                )}
                <span className="font-heading font-bold text-[11px] uppercase tracking-[.04em]" style={{ color: readinessTextColor }} data-testid="text-readiness-label">{readinessLabel}</span>
              </div>
              {includedItems.length > 0 && (
                <div className="mb-[4px]">
                  {includedItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-[4px] text-[10px] leading-[1.6]" style={{ color: 'var(--wc-t2)' }}>
                      <CheckCircle className="w-[10px] h-[10px] flex-shrink-0" style={{ color: 'var(--wc-gr)' }} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {missingItems.length > 0 && (
                <div>
                  {missingItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-[4px] text-[10px] leading-[1.6]" style={{ color: 'var(--wc-t3)' }}>
                      <Circle className="w-[10px] h-[10px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[10px] p-[10px_12px] mb-[12px] flex items-start gap-[8px]" style={{ background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.15)' }}>
              <AlertTriangle className="w-[14px] h-[14px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-am)' }} />
              <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
                {disclaimer}
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

                <div className="rounded-[10px] p-[12px] mb-[6px] relative" style={{ background: 'rgba(245,196,0,.04)', border: '1.5px solid rgba(245,196,0,.2)' }} data-testid="card-vehicle-deduction">
                  {deductionState === 'locked' && (
                    <div className="absolute inset-0 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)', zIndex: 1 }}>
                      <div className="flex items-center gap-[6px]">
                        <Lock className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t3)' }} />
                        <span className="font-heading font-bold text-[11px] uppercase" style={{ color: 'var(--wc-t3)' }}>Complete profile to unlock</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-[4px]">
                    <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Vehicle Deduction</span>
                    <span className="font-heading font-bold text-[16px]" style={{ color: deductionState === 'locked' ? 'var(--wc-t3)' : 'var(--wc-y)' }}>
                      ${vehicleDed.toLocaleString()}{deductionState === 'partial' && '*'}
                    </span>
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>
                    {totalKmAll > 0 ? Math.round(bizKm / totalKmAll * 100) : 0}% biz use &times; vehicle costs
                  </div>
                  {deductionState === 'partial' && (
                    <div className="text-[9px] mt-[4px]" style={{ color: 'var(--wc-am)' }}>*Approximate — add more details for accuracy</div>
                  )}
                </div>

                <div className="rounded-[10px] p-[12px] relative" style={{ background: 'rgba(34,197,94,.04)', border: '1.5px solid rgba(34,197,94,.2)' }} data-testid="card-tax-saving">
                  {deductionState === 'locked' && (
                    <div className="absolute inset-0 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)', zIndex: 1 }}>
                      <div className="flex items-center gap-[6px]">
                        <Lock className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t3)' }} />
                        <span className="font-heading font-bold text-[11px] uppercase" style={{ color: 'var(--wc-t3)' }}>Locked</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-[2px]">
                    <span className="font-heading font-bold text-[13px] uppercase" style={{ color: deductionState === 'locked' ? 'var(--wc-t3)' : 'var(--wc-gr)' }}>Tax Saving from Vehicle</span>
                    <span className="font-heading font-black text-[20px]" style={{ color: deductionState === 'locked' ? 'var(--wc-t3)' : 'var(--wc-gr)' }}>
                      ${taxSaving.toLocaleString()}{deductionState === 'partial' && '*'}
                    </span>
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>Estimated impact on your tax bill</div>
                  {deductionState === 'partial' && (
                    <div className="text-[9px] mt-[4px]" style={{ color: 'var(--wc-am)' }}>*Approximate — add more details for accuracy</div>
                  )}
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
          </>
        )}
      </div>

      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }}
          onClick={cancelPersonalised}
        >
          <div
            className="w-full max-w-[390px] rounded-t-[20px] p-[20px_18px_28px] animate-slide-up"
            style={{ background: '#1a1a1e', border: '1.5px solid var(--wc-border)', borderBottom: 'none', boxShadow: '0 -20px 60px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}
            data-testid="modal-personalised-confirm"
          >
            <div className="flex justify-between items-start mb-[14px]">
              <div className="font-heading font-black text-[18px] uppercase text-white leading-[1.2]">
                Switch to personalised estimates?
              </div>
              <button
                className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
                onClick={cancelPersonalised}
                data-testid="button-close-personalised-modal"
              >
                <X className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t3)' }} />
              </button>
            </div>

            <div className="text-[13px] leading-[1.5] mb-[14px]" style={{ color: 'var(--wc-t2)' }}>
              Tailor deduction estimates to your finances, expenses and vehicle ownership details.
            </div>

            <div className="mb-[16px]">
              {[
                'Takes around 10\u201315 minutes to complete',
                'Uses your financial and expense information',
                'Produces a more realistic estimate',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-[8px] py-[4px]">
                  <ChevronRight className="w-[12px] h-[12px] flex-shrink-0 mt-[3px]" style={{ color: 'var(--wc-y)' }} />
                  <span className="text-[12px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-[8px]">
              <button
                className="w-full rounded-[11px] py-[12px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.98]"
                style={{ background: 'rgba(245,196,0,.08)', border: '1.5px solid rgba(245,196,0,.3)', color: 'var(--wc-y)' }}
                onClick={confirmPersonalised}
                data-testid="button-confirm-personalised"
              >
                Continue
              </button>
              <button
                className="w-full rounded-[11px] py-[12px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.98]"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={cancelPersonalised}
                data-testid="button-keep-industry"
              >
                Keep Industry Averages
              </button>
            </div>
          </div>
        </div>
      )}
    </CollapsiblePanel>
  );
}
