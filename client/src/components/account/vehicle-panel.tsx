import { useState, useEffect } from 'react';
import { Car, Search, AlertTriangle } from 'lucide-react';
import { CollapsiblePanel, FieldInput, ChipSelect } from './collapsible-panel';

interface VehicleSpecs {
  rego: string;
  make: string;
  model: string;
  variant: string;
  year: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  engineCapacity: string;
  fuelConsumption: string;
  vehicleCategory: string;
  payload: string;
  gvm: string;
  vehicleValue: string;
}

interface PurchaseDetails {
  purchaseDate: string;
  purchasePrice: string;
  financeType: string;
  currentWDV: string;
  dateFirstUsed: string;
  previouslyClaimed: string;
}

const SPEC_DEFAULT: VehicleSpecs = {
  rego: '', make: '', model: '', variant: '', year: '', bodyType: '',
  fuelType: '', transmission: '', engineCapacity: '', fuelConsumption: '',
  vehicleCategory: '', payload: '', gvm: '', vehicleValue: '',
};

const PURCHASE_DEFAULT: PurchaseDetails = {
  purchaseDate: '', purchasePrice: '', financeType: 'Owned',
  currentWDV: '', dateFirstUsed: '', previouslyClaimed: '',
};

function loadSpecs(): VehicleSpecs {
  try { return { ...SPEC_DEFAULT, ...JSON.parse(localStorage.getItem('wc_vehicle_specs') || '{}') }; }
  catch { return SPEC_DEFAULT; }
}
function loadPurchase(): PurchaseDetails {
  try { return { ...PURCHASE_DEFAULT, ...JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}') }; }
  catch { return PURCHASE_DEFAULT; }
}

const DV_RATE = 0.25;
const ATO_CAR_LIMIT = 68108;

const MOCK_VEHICLES: Record<string, Partial<VehicleSpecs>> = {
  'ABC123': { make: 'Toyota', model: 'HiLux', variant: 'SR5 4x4', year: '2022', bodyType: 'Utility', fuelType: 'Diesel', transmission: 'Automatic', engineCapacity: '2755cc', fuelConsumption: '8.6', vehicleCategory: 'Ute - 4x4', payload: '985', gvm: '3200', vehicleValue: '58990' },
  'XYZ789': { make: 'Ford', model: 'Ranger', variant: 'Wildtrak', year: '2023', bodyType: 'Utility', fuelType: 'Diesel', transmission: 'Automatic', engineCapacity: '2000cc', fuelConsumption: '7.6', vehicleCategory: 'Ute - 4x4', payload: '960', gvm: '3270', vehicleValue: '62990' },
  'DEF456': { make: 'Isuzu', model: 'D-MAX', variant: 'LS-U', year: '2021', bodyType: 'Utility', fuelType: 'Diesel', transmission: 'Automatic', engineCapacity: '2999cc', fuelConsumption: '7.7', vehicleCategory: 'Ute - 4x4', payload: '1005', gvm: '3100', vehicleValue: '52990' },
};

export function VehiclePanel() {
  const [specs, setSpecs] = useState<VehicleSpecs>(loadSpecs);
  const [purchase, setPurchase] = useState<PurchaseDetails>(loadPurchase);
  const [regoInput, setRegoInput] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle');
  const [manualEdit, setManualEdit] = useState(false);

  useEffect(() => {
    localStorage.setItem('wc_vehicle_specs', JSON.stringify(specs));
    if (specs.fuelConsumption) {
      localStorage.setItem('wc_fuel_consumption', specs.fuelConsumption);
    }
  }, [specs]);

  useEffect(() => {
    localStorage.setItem('wc_vehicle_purchase', JSON.stringify(purchase));
  }, [purchase]);

  const updSpec = (key: keyof VehicleSpecs) => (v: string) => setSpecs(prev => ({ ...prev, [key]: v }));
  const updPurch = (key: keyof PurchaseDetails) => (v: string) => setPurchase(prev => ({ ...prev, [key]: v }));

  const handleLookup = () => {
    const key = regoInput.toUpperCase().replace(/\s/g, '');
    setLookupStatus('loading');
    setTimeout(() => {
      const match = MOCK_VEHICLES[key];
      if (match) {
        setSpecs(prev => ({ ...prev, ...match, rego: key }));
        setLookupStatus('found');
      } else {
        setLookupStatus('notfound');
      }
    }, 1200);
  };

  const hasVehicle = specs.make && specs.model;

  const depreciationCalc = () => {
    const rawPrice = parseFloat(purchase.purchasePrice) || 0;
    if (rawPrice <= 0) return null;
    const cappedPrice = Math.min(rawPrice, ATO_CAR_LIMIT);
    const wdv = parseFloat(purchase.currentWDV) || 0;
    const base = wdv > 0 ? wdv : cappedPrice;
    const prevClaimed = parseFloat(purchase.previouslyClaimed) || 0;

    const dateUsed = purchase.dateFirstUsed ? new Date(purchase.dateFirstUsed) : null;
    const purchDate = purchase.purchaseDate ? new Date(purchase.purchaseDate) : null;
    const startDate = dateUsed || purchDate;

    const now = new Date();
    const fyStart = new Date(now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1, 6, 1);
    const fyEnd = new Date(fyStart.getFullYear() + 1, 5, 30);
    let daysInFY = Math.round((fyEnd.getTime() - fyStart.getTime()) / 86400000);
    let daysOwned = daysInFY;
    if (startDate && startDate > fyStart) {
      daysOwned = Math.round((fyEnd.getTime() - startDate.getTime()) / 86400000);
      daysOwned = Math.max(0, Math.min(daysOwned, daysInFY));
    }
    const prorata = daysOwned / daysInFY;
    const annualDep = Math.round(base * DV_RATE * 100) / 100;
    const dep = Math.round(base * DV_RATE * prorata * 100) / 100;
    return { dep, annualDep, prorata: Math.round(prorata * 100), method: 'Diminishing Value', cappedPrice, currentWDV: wdv, base, prevClaimed };
  };

  const fuelEconomy = parseFloat(specs.fuelConsumption) || 0;
  const estAnnualRunning = fuelEconomy > 0 ? Math.round(fuelEconomy / 100 * 15000 * 1.95) : 0;
  const depResult = depreciationCalc();

  const specFields: { label: string; key: keyof VehicleSpecs }[] = [
    { label: 'Make', key: 'make' }, { label: 'Model', key: 'model' },
    { label: 'Variant', key: 'variant' }, { label: 'Year', key: 'year' },
    { label: 'Body Type', key: 'bodyType' }, { label: 'Fuel Type', key: 'fuelType' },
    { label: 'Transmission', key: 'transmission' }, { label: 'Engine', key: 'engineCapacity' },
    { label: 'Fuel (L/100km)', key: 'fuelConsumption' }, { label: 'Category', key: 'vehicleCategory' },
    { label: 'Payload (kg)', key: 'payload' }, { label: 'GVM (kg)', key: 'gvm' },
    { label: 'Value ($)', key: 'vehicleValue' },
  ];

  return (
    <CollapsiblePanel title="Vehicle Details" icon={Car} testId="panel-vehicle">
      <div className="pt-[12px]">
        <label className="font-data text-[9px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Lookup Vehicle by Rego</label>
        <div className="flex gap-[6px] mb-[10px]">
          <input
            className="flex-1 rounded-[8px] p-[11px] text-[16px] text-white outline-none font-data uppercase tracking-[.1em]"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--wc-border)' }}
            value={regoInput}
            onChange={e => setRegoInput(e.target.value)}
            placeholder="e.g. ABC123"
            data-testid="input-rego-lookup"
          />
          <button
            className="rounded-[8px] px-[16px] flex items-center gap-[6px] font-heading font-bold text-[12px] uppercase cursor-pointer transition-all active:scale-[.97]"
            style={{ background: 'rgba(245,196,0,.1)', border: '1px solid rgba(245,196,0,.3)', color: 'var(--wc-y)' }}
            onClick={handleLookup}
            disabled={!regoInput.trim() || lookupStatus === 'loading'}
            data-testid="button-rego-lookup"
          >
            {lookupStatus === 'loading' ? (
              <div className="w-[14px] h-[14px] border-[2px] border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--wc-y)', borderTopColor: 'transparent' }} />
            ) : (
              <Search className="w-[14px] h-[14px]" />
            )}
            Lookup
          </button>
        </div>

        {lookupStatus === 'found' && (
          <div className="rounded-[10px] p-[10px_12px] mb-[10px] flex items-center gap-[8px]" style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)' }}>
            <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--wc-gr)' }} />
            <span className="text-[12px]" style={{ color: 'var(--wc-gr)' }}>Vehicle found and details populated</span>
          </div>
        )}
        {lookupStatus === 'notfound' && (
          <div className="rounded-[10px] p-[10px_12px] mb-[10px] flex items-center gap-[8px]" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
            <AlertTriangle className="w-[14px] h-[14px]" style={{ color: 'var(--wc-am)' }} />
            <span className="text-[12px]" style={{ color: 'var(--wc-am)' }}>Vehicle not found. Try demo regos: ABC123, XYZ789, DEF456</span>
          </div>
        )}

        {hasVehicle && !manualEdit && (
          <>
            <div className="grid grid-cols-2 gap-[6px] mb-[8px]">
              {specFields.map(f => (
                <div key={f.key} className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
                  <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>{f.label}</div>
                  <div className="text-[13px] text-white mt-[2px]">{specs[f.key] || '—'}</div>
                </div>
              ))}
              {specs.rego && (
                <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(245,196,0,.04)', border: '1px solid rgba(245,196,0,.15)' }}>
                  <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Rego</div>
                  <div className="text-[13px] font-data font-bold mt-[2px]" style={{ color: 'var(--wc-y)' }}>{specs.rego}</div>
                </div>
              )}
            </div>
            <button
              className="text-[11px] font-heading font-bold uppercase tracking-[.04em] cursor-pointer mb-[10px]"
              style={{ color: 'var(--wc-t3)' }}
              onClick={() => setManualEdit(true)}
              data-testid="button-manual-edit-vehicle"
            >
              Manually Edit Details
            </button>
          </>
        )}

        {(!hasVehicle || manualEdit) && (
          <div className="mb-[8px]">
            {specFields.map(f => (
              <FieldInput key={f.key} label={f.label} value={specs[f.key]} onChange={updSpec(f.key)} testId={`input-vehicle-${f.key.toLowerCase()}`} />
            ))}
            {manualEdit && (
              <button
                className="text-[11px] font-heading font-bold uppercase tracking-[.04em] cursor-pointer"
                style={{ color: 'var(--wc-y)' }}
                onClick={() => setManualEdit(false)}
                data-testid="button-done-edit-vehicle"
              >
                Done Editing
              </button>
            )}
          </div>
        )}

        <div className="font-heading font-bold text-[12px] uppercase tracking-[.04em] mt-[14px] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>Purchase Details</div>

        <FieldInput label="Purchase Date" value={purchase.purchaseDate} onChange={updPurch('purchaseDate')} type="date" testId="input-purchase-date" />
        <FieldInput label="Purchase Price ($)" value={purchase.purchasePrice} onChange={updPurch('purchasePrice')} type="number" placeholder="e.g. 55000" testId="input-purchase-price" />
        <ChipSelect label="Finance Type" options={['Owned', 'Loan', 'Lease']} value={purchase.financeType} onChange={updPurch('financeType')} testId="chip-finance" />

        <div className="font-heading font-bold text-[12px] uppercase tracking-[.04em] mt-[14px] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>Tax Calculation Details</div>

        <FieldInput label="Current Written Down Value (WDV) ($)" value={purchase.currentWDV} onChange={updPurch('currentWDV')} type="number" placeholder="e.g. 42000" testId="input-current-wdv" />
        <FieldInput label="Date First Used for Business" value={purchase.dateFirstUsed} onChange={updPurch('dateFirstUsed')} type="date" testId="input-date-first-used" />
        <FieldInput label="Previously Claimed Amounts ($)" value={purchase.previouslyClaimed} onChange={updPurch('previouslyClaimed')} type="number" placeholder="e.g. 8000" testId="input-previously-claimed" />

        <div className="font-heading font-bold text-[12px] uppercase tracking-[.04em] mt-[14px] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>ATO Calculation Data</div>
        <div className="grid grid-cols-3 gap-[6px]">
          <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
            <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Fuel Economy</div>
            <div className="text-[14px] font-heading font-bold mt-[2px]" style={{ color: 'var(--wc-y)' }}>{fuelEconomy > 0 ? `${fuelEconomy}L` : '—'}</div>
          </div>
          <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
            <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Est. Running</div>
            <div className="text-[14px] font-heading font-bold mt-[2px]" style={{ color: 'var(--wc-y)' }}>{estAnnualRunning > 0 ? `$${estAnnualRunning.toLocaleString()}` : '—'}</div>
          </div>
          <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
            <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Depreciation</div>
            <div className="text-[14px] font-heading font-bold mt-[2px]" style={{ color: 'var(--wc-gr)' }}>{depResult ? `$${depResult.dep.toLocaleString()}` : '—'}</div>
          </div>
        </div>
        {depResult && (
          <div className="mt-[8px] grid grid-cols-2 gap-[6px]">
            <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Capped Value</div>
              <div className="text-[13px] font-heading font-bold mt-[2px] text-white">${depResult.cappedPrice.toLocaleString()}</div>
            </div>
            <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Current WDV</div>
              <div className="text-[13px] font-heading font-bold mt-[2px] text-white">{depResult.currentWDV > 0 ? `$${depResult.currentWDV.toLocaleString()}` : '—'}</div>
            </div>
            <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Annual Dep.</div>
              <div className="text-[13px] font-heading font-bold mt-[2px]" style={{ color: 'var(--wc-gr)' }}>${depResult.annualDep.toLocaleString()}</div>
            </div>
            <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Deductible Dep.</div>
              <div className="text-[13px] font-heading font-bold mt-[2px]" style={{ color: 'var(--wc-gr)' }}>${depResult.dep.toLocaleString()}</div>
            </div>
          </div>
        )}
        {depResult && depResult.prorata < 100 && (
          <div className="text-[10px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>
            Prorated at {depResult.prorata}% ({depResult.method})
          </div>
        )}
        {depResult && depResult.prevClaimed > 0 && (
          <div className="text-[10px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>
            Previously claimed: ${depResult.prevClaimed.toLocaleString()}
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}
