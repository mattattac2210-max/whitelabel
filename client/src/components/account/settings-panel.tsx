import { useState, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';
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
  useEffect(() => {
    localStorage.setItem('wc_settings', JSON.stringify(s));
  }, [s]);

  const updBool = (key: keyof AppSettings) => (v: boolean) => setS(prev => ({ ...prev, [key]: v }));
  const updStr = (key: keyof AppSettings) => (v: string) => setS(prev => ({ ...prev, [key]: v }));

  const handleLogout = () => {
    if (confirm('Log out and clear all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <CollapsiblePanel title="Settings" icon={Settings} testId="panel-settings">
      <div className="pt-[12px]">
        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>Deduction Estimates</div>
        <ToggleRow label="Show Deduction Estimates" value={s.showDeductionEstimates} onChange={updBool('showDeductionEstimates')} testId="toggle-show-deduction-estimates" />

        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mt-[16px] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>Notifications</div>
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

    </CollapsiblePanel>
  );
}
