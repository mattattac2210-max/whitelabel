import { useState } from 'react';
import { Lock, X, ChevronRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import {
  type DeductionState,
  type ReadinessCheck,
  getMissingItems,
  getIncludedItems,
  getEstimateDisclaimer,
  getReadinessLabel,
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

  const handleTap = () => {
    if (state === 'locked' || state === 'partial') {
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
            <div className={`font-display text-[28px] leading-none mt-1 ${animate ? 'animate-pop' : ''}`} style={{ color: 'var(--wc-am)' }}>
              ${value.toFixed(0)}*
            </div>
            <div className="text-[9px] mt-1 flex items-center gap-[3px]" style={{ color: 'var(--wc-am)' }}>
              <Info className="w-[8px] h-[8px]" />
              partial estimate
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

      {showModal && checks && (
        <DeductionModal
          state={state}
          checks={checks}
          onClose={() => setShowModal(false)}
          onNavigate={(screen) => {
            setShowModal(false);
            dispatch({ type: 'GO_SCREEN', screen: screen as any });
          }}
        />
      )}
    </>
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
      className="fixed inset-0 z-[200] flex items-end justify-center"
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
  const readiness = getReadinessLabel(state);
  const missing = getMissingItems(checks);
  const completedCount = Object.values(checks).filter(Boolean).length;
  const totalCount = Object.keys(checks).length;

  if (state === 'active') return null;

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

      {showModal && (
        <DeductionModal
          state={state}
          checks={checks}
          onClose={() => setShowModal(false)}
          onNavigate={(screen) => {
            setShowModal(false);
            dispatch({ type: 'GO_SCREEN', screen: screen as any });
          }}
        />
      )}
    </>
  );
}
