import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lock, X, ChevronRight, CheckCircle2, AlertCircle, Info, BarChart3, Calculator, Car, Settings, AlertTriangle } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import {
  type DeductionState,
  type ReadinessCheck,
  getMissingItems,
  getIncludedItems,
  getEstimateDisclaimer,
  getReadinessLabel,
  getEstimateMode,
  getVehicleCostsDetailed,
  getReadinessChecks,
} from '@/lib/deduction-estimator';

interface DeductionCardProps {
  value: number;
  state: DeductionState;
  label?: string;
  sublabel?: string;
  animate?: boolean;
  className?: string;
  checks?: ReadinessCheck;
}

export function DeductionCard({ value, state, label = 'Deduction', sublabel, animate, className = '', checks }: DeductionCardProps) {
  const { dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const mode = getEstimateMode();

  const handleTap = () => {
    setShowModal(true);
  };

  return (
    <>
      <div
        className={`flex-1 rounded-xl p-3 relative cursor-pointer transition-all ${className}`}
        style={{
          background: state === 'locked' ? 'rgba(255,255,255,.02)' : 'var(--wc-card)',
          border: state === 'locked' ? '1px solid rgba(255,255,255,.06)' : '1px solid var(--wc-border)',
        }}
        onClick={handleTap}
        data-testid="dash-stat-ded"
      >
        <div className="text-[10px] font-bold uppercase tracking-[.07em]" style={{ color: 'var(--wc-t3)' }}>{label}</div>

        {state === 'locked' ? (
          <>
            <div className="flex items-center gap-[6px] mt-1">
              <Lock className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t3)' }} />
              <div className="font-display text-[28px] leading-none" style={{ color: 'rgba(255,255,255,.15)', filter: 'blur(4px)' }}>
                $—
              </div>
            </div>
            <div className="text-[9px] mt-1" style={{ color: 'var(--wc-t3)' }}>Tap to unlock</div>
          </>
        ) : state === 'partial' ? (
          <>
            <div className={`font-display text-[28px] leading-none mt-1`} style={{ color: 'var(--wc-am)' }}>
              ${value.toFixed(0)}*
            </div>
            <div className="text-[9px] mt-1 flex items-center gap-[3px]" style={{ color: 'var(--wc-am)' }}>
              <Info className="w-[8px] h-[8px]" />
              {mode === 'industry' ? 'industry estimate' : 'partial estimate'}
            </div>
          </>
        ) : (
          <>
            <div className={`font-display text-[28px] leading-none mt-1 ${animate ? 'animate-pop' : ''}`} style={{ color: 'var(--wc-gr)' }}>
              ${value.toFixed(0)}
            </div>
            <div className="text-[9px] mt-1" style={{ color: 'var(--wc-t2)' }}>{sublabel || 'logbook method'}</div>
          </>
        )}
      </div>

      {showModal && createPortal(
        <SimplifiedDeductionPrompt
          value={value}
          state={state}
          checks={checks}
          onClose={() => setShowModal(false)}
          onNavigate={(screen) => {
            setShowModal(false);
            dispatch({ type: 'GO_SCREEN', screen: screen as any });
          }}
        />,
        document.body
      )}
    </>
  );
}

interface SimplifiedPromptProps {
  value: number;
  state: DeductionState;
  checks?: ReadinessCheck;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

function SimplifiedDeductionPrompt({ value, state, checks, onClose, onNavigate }: SimplifiedPromptProps) {
  const mode = getEstimateMode();
  const basicComplete = checks?.basicDetailsComplete ?? false;
  const isLocked = state === 'locked';
  const needsBasics = mode === 'industry' && !basicComplete;
  const isIndustryReady = mode === 'industry' && basicComplete;

  const [purchasePrice, setPurchasePrice] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
      return p.purchasePrice || '';
    } catch { return ''; }
  });

  const [depYears, setDepYears] = useState<string>(() => {
    try {
      const p = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
      if (p.boughtNewOrUsed === 'New') return 'new';
      if (p.approxYearsOwned) return p.approxYearsOwned;
      return '';
    } catch { return ''; }
  });

  const ATO_CAR_LIMIT = 68108;
  const DV_RATE = 0.25;

  const rawPrice = parseFloat(purchasePrice) || 0;
  const capped = Math.min(rawPrice, ATO_CAR_LIMIT);
  const isNew = depYears === 'new';
  const yearsNum = isNew ? 0 : (parseInt(depYears) || 0);

  let depAmount = 0;
  if (capped > 0) {
    let wdv = capped;
    for (let i = 0; i < yearsNum; i++) {
      wdv -= wdv * DV_RATE;
    }
    depAmount = Math.round(wdv * DV_RATE);
  }

  const savePurchasePrice = (val: string) => {
    setPurchasePrice(val);
    try {
      const p = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
      p.purchasePrice = val;
      localStorage.setItem('wc_vehicle_purchase', JSON.stringify(p));
    } catch {}
  };

  const saveDepYears = (val: string) => {
    setDepYears(val);
    try {
      const p = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
      if (val === 'new') {
        p.boughtNewOrUsed = 'New';
        p.vehicleHistoryStatus = 'New vehicle';
        p.approxYearsOwned = '';
      } else {
        p.boughtNewOrUsed = 'Used';
        p.vehicleHistoryStatus = "I'm not sure";
        p.approxYearsOwned = val;
      }
      localStorage.setItem('wc_vehicle_purchase', JSON.stringify(p));
    } catch {}
  };

  const hasPrice = rawPrice > 0;
  const hasDep = depYears !== '';

  const title = needsBasics || isLocked
    ? 'Quick Setup'
    : 'Your Estimated Deduction';

  const subtitle = needsBasics || isLocked
    ? 'Fill in below to unlock per-trip values'
    : isIndustryReady
      ? 'Based on industry averages for your vehicle'
      : 'Based on your entered figures';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-[20px] p-[20px_18px_28px] animate-slide-up overflow-y-auto"
        style={{ background: '#1a1a1e', border: '1.5px solid var(--wc-border)', borderBottom: 'none', boxShadow: '0 -20px 60px rgba(0,0,0,.6)', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
        data-testid="modal-deduction-prompt"
      >
        <div className="flex justify-between items-start mb-[14px]">
          <div>
            <div className="font-heading font-black text-[18px] uppercase text-white leading-[1.1]">
              {title}
            </div>
            <div className="text-[11px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>
              {subtitle}
            </div>
          </div>
          <button
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
            onClick={onClose}
            data-testid="button-close-deduction-prompt"
          >
            <X className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        </div>

        {!isLocked && !needsBasics && (
          <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: isIndustryReady ? 'rgba(245,158,11,.04)' : 'rgba(34,197,94,.04)', border: isIndustryReady ? '1.5px solid rgba(245,158,11,.15)' : '1.5px solid rgba(34,197,94,.15)' }}>
            <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Estimated Deduction</div>
            <div className="font-display text-[32px] leading-none" style={{ color: isIndustryReady ? 'var(--wc-am)' : 'var(--wc-gr)' }}>
              ${value.toFixed(0)}{isIndustryReady ? '*' : ''}
            </div>
          </div>
        )}

        <div className="rounded-[12px] p-[14px] mb-[10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[8px]" style={{ color: hasPrice ? 'var(--wc-gr)' : 'var(--wc-y)' }}>
            Purchase Price
          </div>
          <div className="relative">
            <span className="absolute left-[12px] top-1/2 -translate-y-1/2 font-data text-[16px] font-bold" style={{ color: hasPrice ? 'var(--wc-y)' : 'var(--wc-t3)' }}>$</span>
            <input
              className="w-full rounded-[10px] p-[12px_12px_12px_28px] text-[16px] text-white outline-none font-data"
              style={{ background: 'rgba(255,255,255,.05)', border: hasPrice ? '1.5px solid rgba(245,196,0,.3)' : '1.5px solid rgba(255,255,255,.08)' }}
              type="number"
              inputMode="numeric"
              value={purchasePrice}
              onChange={e => savePurchasePrice(e.target.value)}
              placeholder="e.g. 55000"
              data-testid="input-prompt-purchase-price"
            />
          </div>
          {hasPrice && capped < rawPrice && (
            <div className="text-[9px] mt-[6px] flex items-center gap-[4px]" style={{ color: 'var(--wc-am)' }}>
              <Info className="w-[9px] h-[9px]" />
              ATO caps at ${ATO_CAR_LIMIT.toLocaleString()} for depreciation
            </div>
          )}
        </div>

        <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[8px]" style={{ color: hasDep ? 'var(--wc-gr)' : 'var(--wc-y)' }}>
            Depreciation
          </div>
          <div className="flex gap-[6px] flex-wrap">
            <button
              className="rounded-[8px] py-[10px] px-[14px] font-heading font-bold text-[12px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-[.97]"
              style={{
                background: isNew ? 'rgba(245,196,0,.12)' : 'rgba(255,255,255,.04)',
                border: isNew ? '1.5px solid rgba(245,196,0,.4)' : '1px solid rgba(255,255,255,.08)',
                color: isNew ? 'var(--wc-y)' : 'var(--wc-t3)',
              }}
              onClick={() => saveDepYears('new')}
              data-testid="button-dep-new"
            >
              New
            </button>
            {[1, 2, 3, 4, 5].map(y => {
              const active = depYears === String(y);
              return (
                <button
                  key={y}
                  className="rounded-[8px] py-[10px] px-[14px] font-heading font-bold text-[12px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-[.97]"
                  style={{
                    background: active ? 'rgba(245,196,0,.12)' : 'rgba(255,255,255,.04)',
                    border: active ? '1.5px solid rgba(245,196,0,.4)' : '1px solid rgba(255,255,255,.08)',
                    color: active ? 'var(--wc-y)' : 'var(--wc-t3)',
                  }}
                  onClick={() => saveDepYears(String(y))}
                  data-testid={`button-dep-${y}yr`}
                >
                  {y}yr
                </button>
              );
            })}
          </div>
          {hasPrice && hasDep && (
            <div className="flex items-center justify-between mt-[10px] pt-[8px]" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <span className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>This year's depreciation</span>
              <span className="font-data text-[14px] font-bold" style={{ color: 'var(--wc-gr)' }}>${depAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[8px]">
          {(needsBasics || isLocked) && hasPrice && hasDep && (
            <button
              className="w-full rounded-[11px] py-[12px] flex items-center justify-center gap-[6px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.98]"
              style={{ background: 'rgba(245,196,0,.08)', border: '1.5px solid rgba(245,196,0,.3)', color: 'var(--wc-y)' }}
              onClick={onClose}
              data-testid="button-prompt-done"
            >
              <CheckCircle2 className="w-[14px] h-[14px]" />
              Done
            </button>
          )}

          <button
            className="w-full rounded-[11px] py-[10px] flex items-center justify-center gap-[6px] font-heading font-bold text-[12px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.98]"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t3)' }}
            onClick={() => onNavigate('account')}
            data-testid="button-prompt-customise"
          >
            <Settings className="w-[12px] h-[12px]" />
            More Options
            <ChevronRight className="w-[12px] h-[12px]" />
          </button>

          <button
            className="w-full rounded-[11px] py-[8px] font-heading font-bold text-[11px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.98]"
            style={{ color: 'var(--wc-t3)' }}
            onClick={onClose}
            data-testid="button-prompt-dismiss"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeductionModalProps {
  state: DeductionState;
  checks: ReadinessCheck;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

function DeductionModal({ state, checks, onClose, onNavigate }: DeductionModalProps) {
  const missing = getMissingItems(checks);
  const included = getIncludedItems(checks);
  const readiness = getReadinessLabel(state);
  const disclaimer = getEstimateDisclaimer(state);

  const isLocked = state === 'locked';

  const navButtons: { label: string; screen: string }[] = [];
  const screens = new Set(missing.map(m => m.screen));
  if (screens.has('account')) navButtons.push({ label: 'Update Vehicle Details', screen: 'account' });
  if (screens.has('expenses')) navButtons.push({ label: 'Add Expenses', screen: 'expenses' });
  if (screens.has('sort')) navButtons.push({ label: 'Sort Trips', screen: 'sort' });
  if (!screens.has('account') && checks.taxProfileComplete === false) navButtons.push({ label: 'Update Tax Profile', screen: 'account' });

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-[20px] p-[20px_18px_28px] animate-slide-up"
        style={{ background: '#1a1a1e', border: '1.5px solid var(--wc-border)', borderBottom: 'none', boxShadow: '0 -20px 60px rgba(0,0,0,.6)' }}
        onClick={e => e.stopPropagation()}
        data-testid="modal-deduction-estimator"
      >
        <div className="flex justify-between items-start mb-[14px]">
          <div>
            <div className="font-heading font-black text-[18px] uppercase text-white">
              {isLocked ? 'Unlock Deduction Estimates' : 'Improve Your Estimate'}
            </div>
            <div className="flex items-center gap-[6px] mt-[4px]">
              <div
                className="w-[6px] h-[6px] rounded-full"
                style={{ background: isLocked ? 'var(--wc-re)' : state === 'partial' ? 'var(--wc-am)' : 'var(--wc-gr)' }}
              />
              <span className="font-data text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>
                {readiness}
              </span>
            </div>
          </div>
          <button
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
            onClick={onClose}
            data-testid="button-close-deduction-modal"
          >
            <X className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        </div>

        {isLocked && (
          <div className="text-[12px] leading-[1.5] mb-[14px]" style={{ color: 'var(--wc-t2)' }}>
            To calculate estimated claimable deductions, complete the following:
          </div>
        )}

        {missing.length > 0 && (
          <div className="mb-[12px]">
            <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[6px]" style={{ color: 'var(--wc-re)' }}>Missing</div>
            {missing.map((item, i) => (
              <div key={i} className="flex items-center gap-[8px] py-[5px]" style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <AlertCircle className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'rgba(239,68,68,.6)' }} />
                <span className="text-[12px]" style={{ color: 'var(--wc-t2)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {included.length > 0 && (
          <div className="mb-[14px]">
            <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[6px]" style={{ color: 'var(--wc-gr)' }}>Included</div>
            {included.map((item, i) => (
              <div key={i} className="flex items-center gap-[8px] py-[5px]" style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <CheckCircle2 className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'rgba(34,197,94,.6)' }} />
                <span className="text-[12px]" style={{ color: 'var(--wc-t2)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-[10px] leading-[1.4] mb-[14px] px-[2px]" style={{ color: 'var(--wc-t3)' }}>
          {disclaimer}
        </div>

        <div className="flex flex-col gap-[8px]">
          {navButtons.map((btn, i) => (
            <button
              key={i}
              className="w-full rounded-[11px] py-[11px] flex items-center justify-center gap-[6px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.98]"
              style={{
                background: i === 0 ? 'rgba(245,196,0,.08)' : 'rgba(255,255,255,.04)',
                border: i === 0 ? '1.5px solid rgba(245,196,0,.3)' : '1px solid var(--wc-border)',
                color: i === 0 ? 'var(--wc-y)' : 'var(--wc-t2)',
              }}
              onClick={() => onNavigate(btn.screen)}
              data-testid={`button-nav-${btn.screen}`}
            >
              {btn.label}
              <ChevronRight className="w-[14px] h-[14px]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ReadinessCardProps {
  state: DeductionState;
  checks: ReadinessCheck;
}

export function ReadinessCard({ state, checks }: ReadinessCardProps) {
  const { dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const mode = getEstimateMode();
  const readiness = getReadinessLabel(state);
  const missing = getMissingItems(checks);
  const completedCount = Object.values(checks).filter(Boolean).length;
  const totalCount = Object.keys(checks).length;

  if (state === 'active') return null;
  if (mode === 'industry') return null;

  return (
    <>
      <button
        className="w-full rounded-xl p-[12px_14px] flex items-center gap-[10px] text-left cursor-pointer transition-all active:scale-[.99]"
        style={{
          background: state === 'locked' ? 'rgba(239,68,68,.03)' : 'rgba(245,158,11,.03)',
          border: state === 'locked' ? '1px solid rgba(239,68,68,.15)' : '1px solid rgba(245,158,11,.15)',
        }}
        onClick={() => setShowModal(true)}
        data-testid="card-deduction-readiness"
      >
        <div
          className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{
            background: state === 'locked' ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)',
            border: state === 'locked' ? '1px solid rgba(239,68,68,.2)' : '1px solid rgba(245,158,11,.2)',
          }}
        >
          {state === 'locked' ? (
            <Lock className="w-[14px] h-[14px]" style={{ color: 'var(--wc-re)' }} />
          ) : (
            <Info className="w-[14px] h-[14px]" style={{ color: 'var(--wc-am)' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-white">Deduction Estimate: {readiness}</div>
          <div className="text-[10px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>
            {missing.length} item{missing.length !== 1 ? 's' : ''} needed &middot; {completedCount}/{totalCount} complete
          </div>
        </div>
        <ChevronRight className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
      </button>

      {showModal && createPortal(
        <DeductionModal
          state={state}
          checks={checks}
          onClose={() => setShowModal(false)}
          onNavigate={(screen) => {
            setShowModal(false);
            dispatch({ type: 'GO_SCREEN', screen: screen as any });
          }}
        />,
        document.body
      )}
    </>
  );
}

export function CalculationBreakdown({ className = '' }: { className?: string }) {
  const costs = getVehicleCostsDetailed();

  let bizPct = 0;
  let deduction = 0;
  try {
    const appState = JSON.parse(localStorage.getItem('wc_app_state') || '{}');
    const trips = appState.trips || [];
    const bizKm = trips.filter((t: any) => t.type === 'business').reduce((s: number, t: any) => s + (t.km || 0), 0);
    const totKm = trips.reduce((s: number, t: any) => s + (t.km || 0), 0);
    if (totKm > 0) {
      bizPct = Math.round(bizKm / totKm * 100);
      deduction = Math.round(bizPct / 100 * costs.total);
    }
  } catch {}

  const mode = getEstimateMode();
  const costBreakdown = [
    { label: mode === 'industry' ? 'Running costs (industry avg)' : 'Your vehicle expenses', value: costs.manual },
    { label: 'Fuel estimate', value: costs.fuelEstimate },
    { label: costs.isDepreciationEstimated ? 'Depreciation (estimated)' : 'Depreciation', value: costs.depreciation },
  ].filter(c => c.value > 0);
  if (costs.financeInterest > 0) costBreakdown.push({ label: 'Finance interest', value: costs.financeInterest });
  if (costs.leasePayments > 0) costBreakdown.push({ label: 'Lease payments', value: costs.leasePayments });

  return (
    <div className={className}>
      <div className="rounded-[10px] p-[12px] mb-[10px]" style={{ background: 'rgba(245,158,11,.04)', border: '1.5px solid rgba(245,158,11,.15)' }}>
        <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Estimated Deduction</div>
        <div className="font-display text-[28px] leading-none" style={{ color: 'var(--wc-am)' }}>
          ${deduction.toLocaleString()}*
        </div>
      </div>

      <div className="rounded-[10px] p-[12px] mb-[10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
        <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[8px]" style={{ color: 'var(--wc-y)' }}>The Formula</div>
        <div className="flex items-center gap-[6px] mb-[6px] flex-wrap">
          <div className="rounded-[6px] px-[8px] py-[4px]" style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.2)' }}>
            <span className="font-data text-[11px] font-bold" style={{ color: 'var(--wc-y)' }}>{bizPct}%</span>
          </div>
          <span className="font-data text-[11px]" style={{ color: 'var(--wc-t3)' }}>&times;</span>
          <div className="rounded-[6px] px-[8px] py-[4px]" style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.2)' }}>
            <span className="font-data text-[11px] font-bold" style={{ color: 'var(--wc-y)' }}>${costs.total.toLocaleString()}</span>
          </div>
          <span className="font-data text-[11px]" style={{ color: 'var(--wc-t3)' }}>=</span>
          <div className="rounded-[6px] px-[8px] py-[4px]" style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}>
            <span className="font-data text-[11px] font-bold" style={{ color: 'var(--wc-am)' }}>${deduction.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
          Business use % &times; Total vehicle costs = Deduction
        </div>
      </div>

      <div className="rounded-[10px] p-[12px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
        <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[6px]" style={{ color: 'var(--wc-t2)' }}>Vehicle costs breakdown</div>
        {costBreakdown.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-[5px]" style={{ borderBottom: i < costBreakdown.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
            <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>{item.label}</span>
            <span className="font-data text-[11px] font-bold" style={{ color: 'var(--wc-t2)' }}>${item.value.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-[6px] mt-[4px]" style={{ borderTop: '1.5px solid rgba(245,196,0,.2)' }}>
          <span className="text-[11px] font-bold" style={{ color: 'var(--wc-y)' }}>Total vehicle costs</span>
          <span className="font-data text-[12px] font-bold" style={{ color: 'var(--wc-y)' }}>${costs.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
