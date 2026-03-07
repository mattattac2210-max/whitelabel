import { useState, useEffect } from 'react';
import { Settings, LogOut, X, ChevronRight } from 'lucide-react';
import { CollapsiblePanel, ToggleRow, FieldInput, ChipSelect } from './collapsible-panel';

interface AppSettings {
  tripDetectionAlerts: boolean;
  missingTripAlerts: boolean;
  eofyReminder: boolean;
  receiptScanNotif: boolean;
  autoDetectTrips: boolean;
  autoClassifySuggestions: boolean;
  homeLocation: string;
  workLocation: string;
  fuelAutoEstimation: boolean;
  fuelPriceSource: string;
  avgFuelPrice: string;
  receiptAI: boolean;
  showDeductionEstimates: boolean;
  useIndustryAverages: boolean;
  defaultTaxYear: string;
  exportFormat: string;
  shareWithAccountant: boolean;
  biometricLogin: boolean;
}

const DEFAULT: AppSettings = {
  tripDetectionAlerts: true, missingTripAlerts: true, eofyReminder: true, receiptScanNotif: true,
  autoDetectTrips: true, autoClassifySuggestions: true, homeLocation: '', workLocation: '',
  fuelAutoEstimation: true, fuelPriceSource: 'National Average', avgFuelPrice: '1.95', receiptAI: true,
  showDeductionEstimates: true,
  useIndustryAverages: true,
  defaultTaxYear: '2025-26', exportFormat: 'PDF', shareWithAccountant: false, biometricLogin: false,
};

function load(): AppSettings {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem('wc_settings') || '{}') }; }
  catch { return DEFAULT; }
}

export function SettingsPanel() {
  const [s, setS] = useState<AppSettings>(load);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('wc_settings', JSON.stringify(s));
  }, [s]);

  const updBool = (key: keyof AppSettings) => (v: boolean) => setS(prev => ({ ...prev, [key]: v }));
  const updStr = (key: keyof AppSettings) => (v: string) => setS(prev => ({ ...prev, [key]: v }));

  const handleIndustryToggle = (v: boolean) => {
    if (!v) {
      setShowConfirmModal(true);
    } else {
      setS(prev => ({ ...prev, useIndustryAverages: true }));
    }
  };

  const confirmPersonalised = () => {
    setS(prev => ({ ...prev, useIndustryAverages: false }));
    setShowConfirmModal(false);
  };

  const cancelPersonalised = () => {
    setShowConfirmModal(false);
  };

  const handleLogout = () => {
    if (confirm('Log out and clear all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <CollapsiblePanel title="Settings" icon={Settings} testId="panel-settings">
      <div className="pt-[12px]">
        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>Notifications</div>
        <ToggleRow label="Trip Detection Alerts" value={s.tripDetectionAlerts} onChange={updBool('tripDetectionAlerts')} testId="toggle-trip-detect" />
        <ToggleRow label="Missing Trip Alerts" value={s.missingTripAlerts} onChange={updBool('missingTripAlerts')} testId="toggle-missing-trip" />
        <ToggleRow label="EOFY Reminder" value={s.eofyReminder} onChange={updBool('eofyReminder')} testId="toggle-eofy" />
        <ToggleRow label="Receipt Scan Notifications" value={s.receiptScanNotif} onChange={updBool('receiptScanNotif')} testId="toggle-receipt-notif" />

        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mt-[16px] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>Trip Tracking</div>
        <ToggleRow label="Auto Detect Trips" value={s.autoDetectTrips} onChange={updBool('autoDetectTrips')} testId="toggle-auto-detect" />
        <ToggleRow label="Auto Classification Suggestions" value={s.autoClassifySuggestions} onChange={updBool('autoClassifySuggestions')} testId="toggle-auto-classify" />
        <FieldInput label="Home Location" value={s.homeLocation} onChange={updStr('homeLocation')} placeholder="e.g. 12 Home St, Suburb" testId="input-home-location" />
        <FieldInput label="Work Base Location" value={s.workLocation} onChange={updStr('workLocation')} placeholder="e.g. 45 Work Rd, Clayton" testId="input-work-location" />

        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mt-[16px] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>Expenses</div>
        <ToggleRow label="Allow Fuel Auto Estimation" value={s.fuelAutoEstimation} onChange={updBool('fuelAutoEstimation')} testId="toggle-fuel-auto" />
        <ChipSelect label="Fuel Price Source" options={['National Average', 'State Average', 'Manual']} value={s.fuelPriceSource} onChange={updStr('fuelPriceSource')} testId="chip-fuel-source" />
        <FieldInput label="Current Avg Fuel Price ($/L)" value={s.avgFuelPrice} onChange={updStr('avgFuelPrice')} type="number" placeholder="1.95" testId="input-fuel-price" />
        <ToggleRow label="Receipt AI Detection" value={s.receiptAI} onChange={updBool('receiptAI')} testId="toggle-receipt-ai" />

        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mt-[16px] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>Deduction Estimate Mode</div>
        <ToggleRow label="Show Deduction Estimates" value={s.showDeductionEstimates} onChange={updBool('showDeductionEstimates')} testId="toggle-show-deduction-estimates" />

        <div className="mt-[6px]">
          <ToggleRow label="Use industry averages for estimates" value={s.useIndustryAverages} onChange={handleIndustryToggle} testId="toggle-industry-averages" />
          <div className="text-[10px] leading-[1.4] mt-[-4px] mb-[8px] pl-[2px]" style={{ color: 'var(--wc-t3)' }}>
            {s.useIndustryAverages
              ? 'Fast setup using typical costs based on your vehicle and usage.'
              : 'Using your personalised financial and expense data for estimates.'}
          </div>
        </div>

        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mt-[16px] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>Reports</div>
        <ChipSelect label="Default Tax Year" options={['2024-25', '2025-26']} value={s.defaultTaxYear} onChange={updStr('defaultTaxYear')} testId="chip-tax-year" />
        <ChipSelect label="Export Format" options={['PDF', 'CSV', 'Both']} value={s.exportFormat} onChange={updStr('exportFormat')} testId="chip-export-format" />
        <ToggleRow label="Share Report With Accountant" value={s.shareWithAccountant} onChange={updBool('shareWithAccountant')} testId="toggle-share-accountant" />

        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mt-[16px] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>Security</div>
        <ToggleRow label="Biometric Login" value={s.biometricLogin} onChange={updBool('biometricLogin')} testId="toggle-biometric" />

        <button
          className="w-full mt-[16px] py-[14px] rounded-[12px] flex items-center justify-center gap-[8px] font-heading font-bold text-[14px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-[.98]"
          style={{ background: 'rgba(239,68,68,.06)', border: '1.5px solid rgba(239,68,68,.25)', color: 'var(--wc-re)' }}
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-[16px] h-[16px]" />
          Log Out
        </button>
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
