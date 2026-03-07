import { useApp } from '@/lib/app-context';
import { BottomNav } from './bottom-nav';
import { ArrowLeft } from 'lucide-react';
import { MyDetailsPanel } from './account/my-details-panel';
import { VehiclePanel } from './account/vehicle-panel';
import { TaxEstimatePanel } from './account/tax-estimate-panel';
import { SettingsPanel } from './account/settings-panel';

export function AccountScreen() {
  const { dispatch } = useApp();

  return (
    <div className="flex flex-col h-full" data-testid="account-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="button-back-account"
        >
          <ArrowLeft className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[22px] uppercase tracking-[.04em] text-white">Account</span>
      </div>

      <div className="flex-1 px-[14px] pb-1 flex flex-col gap-[8px] overflow-y-auto scrollbar-thin">
        <MyDetailsPanel />
        <VehiclePanel />
        <TaxEstimatePanel />
        <SettingsPanel />
      </div>

      <BottomNav />
    </div>
  );
}
