import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { ArrowLeft, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MyDetailsPanel } from './account/my-details-panel';
import { VehiclePanel } from './account/vehicle-panel';
import { TaxEstimatePanel } from './account/tax-estimate-panel';
import { TrackingPanel } from './account/tracking-panel';
import { NotificationsPanel } from './account/notifications-panel';
import { HelpPanel } from './account/help-panel';
import { SettingsPanel } from './account/settings-panel';

const FRESH_START_KEYS = [
  'wc_onboarded',
  'wc_welcome_seen',
  'wc_logbook_start',
  'wc_fill_highlight',
  'wc_assist_intro_seen',
  'wc_vehicle_specs',
  'wc_vehicle_purchase',
  'wc_autotrack',
];

function FreshStartPanel() {
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = () => {
    FRESH_START_KEYS.forEach(k => localStorage.removeItem(k));
    setDone(true);
    setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div
      className="rounded-[14px] p-[14px]"
      style={{ background: 'rgba(239,68,68,.04)', border: '1.5px solid rgba(239,68,68,.18)' }}
    >
      <div className="flex items-center gap-[8px] mb-[8px]">
        <div
          className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)' }}
        >
          <RotateCcw className="w-[14px] h-[14px]" style={{ color: 'rgba(239,68,68,.8)' }} />
        </div>
        <div>
          <div className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Fresh Start</div>
          <div className="text-[10px] leading-[1.3]" style={{ color: 'var(--wc-t3)' }}>Re-experience the full onboarding flow</div>
        </div>
      </div>

      {done ? (
        <div className="flex items-center gap-[6px] py-[10px] justify-center">
          <CheckCircle2 className="w-[14px] h-[14px]" style={{ color: '#4ade80' }} />
          <span className="font-heading font-bold text-[12px] uppercase" style={{ color: '#4ade80' }}>Reset done — reloading…</span>
        </div>
      ) : !confirm ? (
        <button
          className="w-full rounded-[10px] py-[10px] font-heading font-bold text-[12px] uppercase tracking-[.05em] cursor-pointer transition-all active:scale-[.97]"
          style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: 'rgba(239,68,68,.9)' }}
          onClick={() => setConfirm(true)}
        >
          Reset to Fresh Start
        </button>
      ) : (
        <div className="rounded-[10px] p-[10px_12px]" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)' }}>
          <div className="flex items-start gap-[6px] mb-[10px]">
            <AlertTriangle className="w-[12px] h-[12px] flex-shrink-0 mt-[1px]" style={{ color: 'rgba(239,68,68,.8)' }} />
            <div className="text-[11px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>
              This will clear onboarding, logbook start, vehicle details and all first-run flags, then reload. Continue?
            </div>
          </div>
          <div className="flex gap-[6px]">
            <button
              className="flex-1 rounded-[8px] py-[9px] font-heading font-bold text-[11px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-[.97]"
              style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: 'rgba(239,68,68,.95)' }}
              onClick={handleReset}
            >
              Yes, reset
            </button>
            <button
              className="flex-1 rounded-[8px] py-[9px] font-heading font-bold text-[11px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-[.97]"
              style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t3)' }}
              onClick={() => setConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AccountScreen() {
  const { dispatch } = useApp();

  return (
    <div className="flex flex-col h-full" data-testid="account-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="button-back-account"
        >
          <ArrowLeft className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[22px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Account</span>
      </div>

      <div className="flex-1 px-[14px] pb-[80px] flex flex-col gap-[8px] overflow-y-auto scrollbar-thin" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as any}>
        <MyDetailsPanel />
        <VehiclePanel />
        <TaxEstimatePanel />
        <TrackingPanel />
        <NotificationsPanel />
        <HelpPanel />
        <SettingsPanel />
        <FreshStartPanel />
      </div>
    </div>
  );
}
