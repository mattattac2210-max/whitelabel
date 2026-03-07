import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lock, X, ChevronRight, CheckCircle2, AlertCircle, Info, BarChart3, Calculator } from 'lucide-react';
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
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const mode = getEstimateMode();

  const handleTap = () => {
    if (mode === 'industry') {
      setShowIndustryModal(true);
    } else if (state === 'locked' || state === 'partial') {
      setShowModal(true);
    }
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
              {mode === 'industry' ? 'based on industry averages' : 'partial estimate'}
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

      {showModal && checks && createPortal(
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

      {showIndustryModal && createPortal(
        <IndustryAveragesModal
          value={value}
          onClose={() => setShowIndustryModal(false)}
          onExploreMaths={() => {
            setShowIndustryModal(false);
            dispatch({ type: 'GO_SCREEN', screen: 'account' as any });
          }}
          onSwitchToPersonalised={() => {
            setShowIndustryModal(false);
            try {
              const settings = JSON.parse(localStorage.getItem('wc_settings') || '{}');
              settings.useIndustryAverages = false;
              localStorage.setItem('wc_settings', JSON.stringify(settings));
            } catch {}
            dispatch({ type: 'GO_SCREEN', screen: 'account' as any });
          }}
        />,
        document.body
      )}
    </>
  );
}

interface IndustryAveragesModalProps {
  value: number;
  onClose: () => void;
  onExploreMaths: () => void;
  onSwitchToPersonalised: () => void;
}

function IndustryAveragesModal({ value, onClose, onExploreMaths, onSwitchToPersonalised }: IndustryAveragesModalProps) {
  const costs = useMemo(() => getVehicleCostsDetailed(), []);
  const disclaimer = getEstimateDisclaimer('partial');

  let bizPct = 0;
  try {
    const trips = JSON.parse(localStorage.getItem('wc_app_state') || '{}').trips || [];
    const sorted = trips.filter((t: any) => t.type !== null);
    const bizKm = sorted.filter((t: any) => t.type === 'business').reduce((s: number, t: any) => s + (t.km || 0), 0);
    const totKm = sorted.reduce((s: number, t: any) => s + (t.km || 0), 0);
    if (totKm > 0) bizPct = Math.round(bizKm / totKm * 100);
  } catch {}

  const costBreakdown = [
    { label: 'Running costs (industry avg)', value: costs.manual },
    { label: 'Fuel estimate', value: costs.fuelEstimate },
    { label: 'Depreciation', value: costs.depreciation },
  ].filter(c => c.value > 0);

  if (costs.financeInterest > 0) costBreakdown.push({ label: 'Finance interest', value: costs.financeInterest });
  if (costs.leasePayments > 0) costBreakdown.push({ label: 'Lease payments', value: costs.leasePayments });

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
        data-testid="modal-industry-averages"
      >
        <div className="flex justify-between items-start mb-[12px]">
          <div className="flex items-center gap-[10px]">
            <div
              className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}
            >
              <BarChart3 className="w-[18px] h-[18px]" style={{ color: 'var(--wc-am)' }} />
            </div>
            <div>
              <div className="font-heading font-black text-[17px] uppercase text-white leading-[1.1]">
                How We Calculated This
              </div>
              <div className="flex items-center gap-[5px] mt-[3px]">
                <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--wc-am)' }} />
                <span className="font-data text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-am)' }}>
                  Industry averages
                </span>
              </div>
            </div>
          </div>
          <button
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
            onClick={onClose}
            data-testid="button-close-industry-modal"
          >
            <X className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        </div>

        <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: 'rgba(245,158,11,.04)', border: '1.5px solid rgba(245,158,11,.15)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Estimated Deduction</div>
          <div className="font-display text-[32px] leading-none" style={{ color: 'var(--wc-am)' }}>
            ${value.toFixed(0)}*
          </div>
        </div>

        <div className="rounded-[10px] p-[12px] mb-[12px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[8px]" style={{ color: 'var(--wc-y)' }}>The Formula</div>
          <div className="flex items-center gap-[6px] mb-[6px]">
            <div className="rounded-[6px] px-[8px] py-[4px]" style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.2)' }}>
              <span className="font-data text-[11px] font-bold" style={{ color: 'var(--wc-y)' }}>{bizPct}%</span>
            </div>
            <span className="font-data text-[11px]" style={{ color: 'var(--wc-t3)' }}>&times;</span>
            <div className="rounded-[6px] px-[8px] py-[4px]" style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.2)' }}>
              <span className="font-data text-[11px] font-bold" style={{ color: 'var(--wc-y)' }}>${costs.total.toLocaleString()}</span>
            </div>
            <span className="font-data text-[11px]" style={{ color: 'var(--wc-t3)' }}>=</span>
            <div className="rounded-[6px] px-[8px] py-[4px]" style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}>
              <span className="font-data text-[11px] font-bold" style={{ color: 'var(--wc-am)' }}>${value.toFixed(0)}</span>
            </div>
          </div>
          <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
            Business use % &times; Total vehicle costs = Deduction
          </div>
        </div>

        <div className="rounded-[10px] p-[12px] mb-[12px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
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

        <div className="text-[10px] leading-[1.4] mb-[12px] px-[2px]" style={{ color: 'var(--wc-t3)' }}>
          {disclaimer}
        </div>

        <div className="flex flex-col gap-[8px]">
          <button
            className="w-full rounded-[11px] py-[12px] flex items-center justify-center gap-[6px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.98]"
            style={{ background: 'rgba(245,196,0,.08)', border: '1.5px solid rgba(245,196,0,.3)', color: 'var(--wc-y)' }}
            onClick={onExploreMaths}
            data-testid="button-explore-maths"
          >
            <Calculator className="w-[14px] h-[14px]" />
            Explore Our Maths
          </button>
          <button
            className="w-full rounded-[11px] py-[12px] flex items-center justify-center gap-[6px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.98]"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
            onClick={onSwitchToPersonalised}
            data-testid="button-switch-personalised"
          >
            Switch to Personalised Estimates
            <ChevronRight className="w-[14px] h-[14px]" />
          </button>
          <button
            className="w-full rounded-[11px] py-[12px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.98]"
            style={{ color: 'var(--wc-t3)' }}
            onClick={onClose}
            data-testid="button-close-industry-ok"
          >
            Got It
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
  const costs = useMemo(() => getVehicleCostsDetailed(), []);

  let bizPct = 0;
  let deduction = 0;
  try {
    const appState = JSON.parse(localStorage.getItem('wc_app_state') || '{}');
    const trips = appState.trips || [];
    const sorted = trips.filter((t: any) => t.type !== null);
    const bizKm = sorted.filter((t: any) => t.type === 'business').reduce((s: number, t: any) => s + (t.km || 0), 0);
    const totKm = sorted.reduce((s: number, t: any) => s + (t.km || 0), 0);
    if (totKm > 0) {
      bizPct = Math.round(bizKm / totKm * 100);
      deduction = Math.round(bizPct / 100 * costs.total);
    }
  } catch {}

  const costBreakdown = [
    { label: 'Running costs (industry avg)', value: costs.manual },
    { label: 'Fuel estimate', value: costs.fuelEstimate },
    { label: 'Depreciation', value: costs.depreciation },
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
