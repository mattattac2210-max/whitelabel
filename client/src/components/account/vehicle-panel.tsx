import { useState, useEffect, useMemo } from 'react';
import { Car, Search, AlertTriangle, Info, ChevronDown, ChevronUp, CheckCircle2, DollarSign, Route, RotateCcw, Zap } from 'lucide-react';
import { CollapsiblePanel, FieldInput, ChipSelect } from './collapsible-panel';
import { useApp } from '@/lib/app-context';

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
  estimatedAnnualKm: string;
}

interface PurchaseDetails {
  ownershipType: string;
  purchasePrice: string;
  purchaseDate: string;
  dateFirstUsed: string;
  boughtNewOrUsed: string;
  vehicleHistoryStatus: string;
  financeInputMode: string;
  estimatedAnnualInterest: string;
  lenderName: string;
  loanAmount: string;
  depositPaid: string;
  loanStartDate: string;
  loanTermMonths: string;
  interestRate: string;
  repaymentFrequency: string;
  balloonPayment: string;
  leaseProvider: string;
  leasePaymentAmount: string;
  leasePaymentFrequency: string;
  leaseStartDate: string;
  depreciationMode: string;
  currentWDV: string;
  yearFirstClaimed: string;
  previouslyClaimed: string;
  approxYearsOwned: string;
  approxYearsBusinessUse: string;
  approxBusinessUsePct: string;
  priorClaimsMade: string;
  financeType: string;
}

const SPEC_DEFAULT: VehicleSpecs = {
  rego: '', make: '', model: '', variant: '', year: '', bodyType: '',
  fuelType: '', transmission: '', engineCapacity: '', fuelConsumption: '',
  vehicleCategory: '', payload: '', gvm: '', vehicleValue: '', estimatedAnnualKm: '',
};

const PURCHASE_DEFAULT: PurchaseDetails = {
  ownershipType: 'Owned',
  purchasePrice: '',
  purchaseDate: '',
  dateFirstUsed: '',
  boughtNewOrUsed: 'New',
  vehicleHistoryStatus: 'New vehicle',
  financeInputMode: 'Simple',
  estimatedAnnualInterest: '',
  lenderName: '',
  loanAmount: '',
  depositPaid: '',
  loanStartDate: '',
  loanTermMonths: '',
  interestRate: '',
  repaymentFrequency: 'Monthly',
  balloonPayment: '',
  leaseProvider: '',
  leasePaymentAmount: '',
  leasePaymentFrequency: 'Monthly',
  leaseStartDate: '',
  depreciationMode: 'enterWDV',
  currentWDV: '',
  yearFirstClaimed: '',
  previouslyClaimed: '',
  approxYearsOwned: '',
  approxYearsBusinessUse: '',
  approxBusinessUsePct: '',
  priorClaimsMade: 'No',
  financeType: 'Owned',
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
const ATO_CAR_LIMIT = 69674; // 2025–26 ATO car cost limit

const MOCK_VEHICLES: Record<string, Partial<VehicleSpecs>> = {
  'ABC123': { make: 'Toyota', model: 'HiLux', variant: 'SR5 4x4', year: '2022', bodyType: 'Utility', fuelType: 'Diesel', transmission: 'Automatic', engineCapacity: '2755cc', fuelConsumption: '8.6', vehicleCategory: 'Ute - 4x4', payload: '985', gvm: '3200', vehicleValue: '58990' },
  'XYZ789': { make: 'Ford', model: 'Ranger', variant: 'Wildtrak', year: '2023', bodyType: 'Utility', fuelType: 'Diesel', transmission: 'Automatic', engineCapacity: '2000cc', fuelConsumption: '7.6', vehicleCategory: 'Ute - 4x4', payload: '960', gvm: '3270', vehicleValue: '62990' },
  'DEF456': { make: 'Isuzu', model: 'D-MAX', variant: 'LS-U', year: '2021', bodyType: 'Utility', fuelType: 'Diesel', transmission: 'Automatic', engineCapacity: '2999cc', fuelConsumption: '7.7', vehicleCategory: 'Ute - 4x4', payload: '1005', gvm: '3100', vehicleValue: '52990' },
};

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="font-heading font-bold text-[12px] uppercase tracking-[.04em] mt-[14px] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>
      {children}
    </div>
  );
}

function StatCell({ label, value, color = 'var(--wc-text)', estimated = false }: { label: string; value: string; color?: string; estimated?: boolean }) {
  return (
    <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px solid rgb(var(--wc-ink) / .04)' }}>
      <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>{label}</div>
      <div className="text-[13px] font-heading font-bold mt-[2px]" style={{ color }}>
        {value}{estimated ? '*' : ''}
      </div>
    </div>
  );
}

function FieldBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-[5px] mb-[4px]">
      <div
        className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(245,196,0,.2)', border: '1.5px solid rgba(245,196,0,.6)' }}
      >
        <span className="font-heading font-black text-[9px]" style={{ color: 'var(--wc-y)' }}>{n}</span>
      </div>
      <span className="font-heading font-bold text-[9px] uppercase tracking-[.07em]" style={{ color: 'var(--wc-y)' }}>{label}</span>
      <span className="text-[8px]" style={{ color: 'var(--wc-t3)' }}>← fill this in</span>
    </div>
  );
}

function KmSlider({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<'year' | 'week'>('year');

  const annualKm = parseInt(value) || 0;
  const weeklyKm = annualKm > 0 ? Math.round(annualKm / 52) : 0;

  const displayValue = mode === 'year' ? annualKm : weeklyKm;
  const max = mode === 'year' ? 40000 : 770;
  const step = mode === 'year' ? 500 : 25;

  const handleSlider = (raw: number) => {
    const annual = mode === 'year' ? raw : Math.round(raw * 52);
    onChange(String(annual));
  };

  const sliderVal = mode === 'year' ? Math.min(annualKm, max) : Math.min(weeklyKm, max);
  const pct = max > 0 ? Math.min(100, (sliderVal / max) * 100) : 0;

  const bands = [
    { label: 'Low', max: mode === 'year' ? 12000 : 230, color: '#4ade80' },
    { label: 'Avg', max: mode === 'year' ? 27000 : 520, color: 'var(--wc-y)' },
    { label: '>', max: mode === 'year' ? 40000 : 770, color: '#f472b6' },
  ];
  const activeBand = bands.find(b => sliderVal <= b.max) ?? bands[bands.length - 1];

  return (
    <div className="mb-[10px]">
      <div className="flex items-center justify-between mb-[6px]">
        <label className="font-data text-[9px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Estimated Distance Driven</label>
        <div className="flex rounded-[8px] overflow-hidden" style={{ border: '1px solid var(--wc-border)' }}>
          {(['week', 'year'] as const).map(m => (
            <button
              key={m}
              className="px-[8px] py-[3px] font-heading font-bold text-[8px] uppercase tracking-[.05em] transition-all"
              style={{
                background: mode === m ? 'rgb(var(--wc-ink) / .15)' : 'transparent',
                color: mode === m ? 'var(--wc-text)' : 'var(--wc-t3)',
              }}
              onClick={() => setMode(m)}
            >
              Per {m}
            </button>
          ))}
        </div>
      </div>

      {/* Value display */}
      <div className="flex items-baseline gap-[4px] mb-[8px]">
        <span className="font-display text-[28px] leading-none" style={{ color: activeBand.color }}>
          {displayValue > 0 ? displayValue.toLocaleString() : '—'}
        </span>
        <span className="font-heading font-bold text-[11px]" style={{ color: 'var(--wc-t3)' }}>
          km / {mode}
        </span>
        {mode === 'week' && annualKm > 0 && (
          <span className="ml-auto font-data text-[9px]" style={{ color: 'var(--wc-t3)' }}>
            ≈ {annualKm.toLocaleString()} km/yr
          </span>
        )}
        {mode === 'year' && weeklyKm > 0 && (
          <span className="ml-auto font-data text-[9px]" style={{ color: 'var(--wc-t3)' }}>
            ≈ {weeklyKm.toLocaleString()} km/wk
          </span>
        )}
      </div>

      {/* Slider */}
      <div className="relative mb-[4px]">
        <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'rgb(var(--wc-ink) / .08)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: activeBand.color }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={sliderVal}
          onChange={e => handleSlider(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-[6px]"
          style={{ margin: 0 }}
        />
        {/* Thumb dot */}
        <div
          className="absolute top-1/2 w-[16px] h-[16px] rounded-full border-2 pointer-events-none transition-all"
          style={{
            left: `calc(${pct}% - 8px)`,
            top: '-5px',
            background: 'var(--wc-bg)',
            borderColor: activeBand.color,
            boxShadow: `0 0 6px ${activeBand.color}60`,
          }}
        />
      </div>

      {/* Range labels */}
      <div className="flex justify-between mt-[10px]">
        {bands.map(b => (
          <div key={b.label} className="flex items-center gap-[3px]">
            <div className="w-[5px] h-[5px] rounded-full" style={{ background: b.color }} />
            <span className="font-heading font-bold text-[8px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-t3)' }}>
              {b.label}
            </span>
          </div>
        ))}
      </div>

      {/* Reset */}
      {annualKm > 0 && (
        <button
          className="mt-[6px] flex items-center gap-[4px] text-[8px] font-heading font-bold uppercase tracking-[.05em] cursor-pointer transition-all active:scale-[.95]"
          style={{ color: 'var(--wc-t3)' }}
          onClick={() => onChange('')}
        >
          <RotateCcw className="w-[8px] h-[8px]" />
          Reset
        </button>
      )}
    </div>
  );
}

function getCurrentFY() {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(fyStartYear, 6, 1);
  const end = new Date(fyStartYear + 1, 5, 30);
  const daysInFY = Math.round((end.getTime() - start.getTime()) / 86400000);
  return { start, end, daysInFY };
}

function estimateWDV(cappedPrice: number, purchaseDate: string | null, yearsUsed: number, bizPct: number): number {
  if (cappedPrice <= 0) return 0;
  let wdv = cappedPrice;
  const pd = purchaseDate ? new Date(purchaseDate) : null;
  const now = new Date();
  const actualYears = pd ? Math.max(0, (now.getTime() - pd.getTime()) / (365.25 * 86400000)) : yearsUsed;
  const years = Math.max(0, Math.floor(actualYears));

  if (years === 0) return wdv;

  const firstYearFraction = pd
    ? (() => {
        const fyStart = new Date(pd.getMonth() >= 6 ? pd.getFullYear() : pd.getFullYear() - 1, 6, 1);
        const fyEnd = new Date(fyStart.getFullYear() + 1, 5, 30);
        const daysInFY = Math.round((fyEnd.getTime() - fyStart.getTime()) / 86400000);
        const daysOwned = Math.max(0, Math.min(Math.round((fyEnd.getTime() - pd.getTime()) / 86400000), daysInFY));
        return daysOwned / daysInFY;
      })()
    : 1;

  wdv -= wdv * DV_RATE * firstYearFraction;
  for (let i = 1; i < years; i++) {
    wdv -= wdv * DV_RATE;
  }
  return Math.round(Math.max(0, wdv) * 100) / 100;
}

function calcAdvancedInterest(p: PurchaseDetails): number {
  const loan = parseFloat(p.loanAmount) || 0;
  const rate = parseFloat(p.interestRate) || 0;
  if (loan <= 0 || rate <= 0) return 0;
  return Math.round(loan * (rate / 100) * 100) / 100;
}

function calcAnnualLeaseTotal(p: PurchaseDetails): number {
  const amt = parseFloat(p.leasePaymentAmount) || 0;
  if (amt <= 0) return 0;
  const freq = p.leasePaymentFrequency;
  if (freq === 'Weekly') return Math.round(amt * 52 * 100) / 100;
  if (freq === 'Fortnightly') return Math.round(amt * 26 * 100) / 100;
  return Math.round(amt * 12 * 100) / 100;
}

export function VehiclePanel() {
  const { dispatch } = useApp();
  const [specs, setSpecs] = useState<VehicleSpecs>(loadSpecs);
  const [purchase, setPurchase] = useState<PurchaseDetails>(loadPurchase);
  const [regoInput, setRegoInput] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle');
  const [manualEdit, setManualEdit] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [highlight, setHighlight] = useState(() => localStorage.getItem('wc_fill_highlight') === '1');
  const [applied, setApplied] = useState(false);

  // Clear highlight once user starts filling fields
  useEffect(() => {
    if (highlight && specs.vehicleCategory && purchase.purchasePrice && specs.estimatedAnnualKm) {
      localStorage.removeItem('wc_fill_highlight');
      setHighlight(false);
    }
  }, [highlight, specs.vehicleCategory, purchase.purchasePrice, specs.estimatedAnnualKm]);

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

  const rawPrice = parseFloat(purchase.purchasePrice) || 0;
  const cappedPrice = rawPrice > 0 ? Math.min(rawPrice, ATO_CAR_LIMIT) : 0;
  const isCapped = rawPrice > ATO_CAR_LIMIT;

  const depCalc = useMemo(() => {
    const status = purchase.vehicleHistoryStatus;
    const mode = purchase.depreciationMode;
    let wdv = 0;
    let isEstimated = false;
    let wdvSource = '';

    if (status === 'New vehicle') {
      wdv = cappedPrice;
      if (cappedPrice <= 0) return null;
      wdvSource = 'New purchase (capped price)';

      const { start: fyStart, end: fyEnd, daysInFY } = getCurrentFY();
      const startDate = purchase.dateFirstUsed ? new Date(purchase.dateFirstUsed) : purchase.purchaseDate ? new Date(purchase.purchaseDate) : null;
      let daysOwned = daysInFY;
      if (startDate && startDate > fyStart) {
        daysOwned = Math.max(0, Math.min(Math.round((fyEnd.getTime() - startDate.getTime()) / 86400000), daysInFY));
      }
      const prorata = daysOwned / daysInFY;
      const annualDep = Math.round(wdv * DV_RATE * 100) / 100;
      const dep = Math.round(wdv * DV_RATE * prorata * 100) / 100;
      const wdvAfter = Math.round((wdv - dep) * 100) / 100;
      return { wdv, wdvAfter, annualDep, dep, prorata: Math.round(prorata * 100), isEstimated, wdvSource, cappedPrice };
    }

    if (status === 'Previously claimed') {
      if (mode === 'enterWDV') {
        const userWDV = parseFloat(purchase.currentWDV) || 0;
        if (userWDV <= 0 && cappedPrice <= 0) return null;
        wdv = userWDV > 0 ? userWDV : cappedPrice;
        wdvSource = userWDV > 0 ? 'Entered by user' : 'Capped purchase price (no WDV entered)';
        isEstimated = userWDV <= 0;
      } else if (mode === 'enterClaimed') {
        const claimed = parseFloat(purchase.previouslyClaimed) || 0;
        if (cappedPrice <= 0) return null;
        wdv = Math.max(0, cappedPrice - claimed);
        wdvSource = 'Calculated from purchase price minus prior claims';
        isEstimated = false;
      } else {
        if (cappedPrice <= 0) return null;
        const yearsUsed = parseFloat(purchase.approxYearsBusinessUse) || parseFloat(purchase.approxYearsOwned) || 0;
        const bizPct = parseFloat(purchase.approxBusinessUsePct) || 50;
        wdv = estimateWDV(cappedPrice, purchase.purchaseDate || null, yearsUsed, bizPct);
        wdvSource = 'Estimated by app';
        isEstimated = true;
      }
    } else {
      if (cappedPrice <= 0) return null;
      const yearsOwned = parseFloat(purchase.approxYearsOwned) || 0;
      const yearsUsed = parseFloat(purchase.approxYearsBusinessUse) || yearsOwned;
      wdv = estimateWDV(cappedPrice, purchase.purchaseDate || null, yearsUsed, parseFloat(purchase.approxBusinessUsePct) || 50);
      wdvSource = 'Estimated by app';
      isEstimated = true;
    }

    if (wdv <= 0) return null;

    const { start: fyStart, end: fyEnd, daysInFY } = getCurrentFY();
    const startDate = purchase.dateFirstUsed ? new Date(purchase.dateFirstUsed) : purchase.purchaseDate ? new Date(purchase.purchaseDate) : null;
    let daysOwned = daysInFY;
    if (startDate && startDate > fyStart) {
      daysOwned = Math.max(0, Math.min(Math.round((fyEnd.getTime() - startDate.getTime()) / 86400000), daysInFY));
    }
    const prorata = daysOwned / daysInFY;
    const annualDep = Math.round(wdv * DV_RATE * 100) / 100;
    const dep = Math.round(wdv * DV_RATE * prorata * 100) / 100;
    const wdvAfter = Math.round((wdv - dep) * 100) / 100;

    return { wdv, wdvAfter, annualDep, dep, prorata: Math.round(prorata * 100), isEstimated, wdvSource, cappedPrice };
  }, [purchase, cappedPrice]);

  const advancedInterest = useMemo(() => calcAdvancedInterest(purchase), [purchase]);
  const annualLeaseTotal = useMemo(() => calcAnnualLeaseTotal(purchase), [purchase]);

  const isEV = specs.vehicleCategory === 'EV' || (specs.fuelType || '').toLowerCase().includes('electric');

  const fuelEconomy = parseFloat(specs.fuelConsumption) || 0;
  // EVs: use kWh/100km × avg electricity rate ($0.30/kWh); ICE: L/100km × fuel price
  const estAnnualRunning = isEV
    ? (fuelEconomy > 0 ? Math.round(fuelEconomy / 100 * 15000 * 0.30) : 0)
    : (fuelEconomy > 0 ? Math.round(fuelEconomy / 100 * 15000 * 1.95) : 0);

  const hasVehicleType = !!(specs.vehicleCategory || specs.bodyType);
  const basicComplete = rawPrice > 0 && hasVehicleType;

  const VEHICLE_TYPES = ['Ute - 4x4', 'Ute - 4x2', 'SUV - Medium', 'SUV - Small', 'Sedan / Hatch', 'Van', 'EV', 'Other'];

  const advancedSpecFields: { label: string; key: keyof VehicleSpecs }[] = [
    { label: 'Make', key: 'make' }, { label: 'Model', key: 'model' },
    { label: 'Variant', key: 'variant' }, { label: 'Year', key: 'year' },
    { label: 'Body Type', key: 'bodyType' }, { label: 'Fuel Type', key: 'fuelType' },
    { label: 'Transmission', key: 'transmission' }, { label: 'Engine', key: 'engineCapacity' },
    { label: isEV ? 'Efficiency (kWh/100km)' : 'Fuel (L/100km)', key: 'fuelConsumption' },
    { label: 'Payload (kg)', key: 'payload' }, { label: 'GVM (kg)', key: 'gvm' },
    { label: 'Value ($)', key: 'vehicleValue' },
  ];

  return (
    <CollapsiblePanel
      title="Vehicle Details"
      icon={Car}
      testId="panel-vehicle"
      badge={highlight ? (
        <div className="flex flex-wrap gap-[4px]">
          {[
            { n: 1, icon: Car,        label: 'Vehicle Type',   done: !!specs.vehicleCategory },
            { n: 2, icon: DollarSign, label: 'Purchase Price', done: !!purchase.purchasePrice },
            { n: 3, icon: Route,      label: 'Est. km / yr',   done: !!specs.estimatedAnnualKm },
          ].filter(f => !f.done).map(f => (
            <div
              key={f.n}
              className="flex items-center gap-[4px] pl-[3px] pr-[7px] py-[2px] rounded-full"
              style={{ background: 'rgba(245,196,0,.15)', border: '1px solid rgba(245,196,0,.45)' }}
            >
              <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,196,0,.35)' }}>
                <span className="font-heading font-black text-[7px]" style={{ color: 'var(--wc-y)' }}>{f.n}</span>
              </div>
              <f.icon className="w-[8px] h-[8px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-heading font-bold text-[8px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>{f.label}</span>
            </div>
          ))}
        </div>
      ) : undefined}
    >
      <div className="pt-[12px]">

        {/* ═══ BASIC DETAILS (required) ═══ */}
        <div className="rounded-[12px] p-[14px]" style={{ background: basicComplete ? 'rgba(34,197,94,.03)' : 'rgba(153,153,153,.03)', border: basicComplete ? '1.5px solid rgba(34,197,94,.15)' : '1.5px solid rgba(153,153,153,.15)' }}>
          <div className="flex items-center justify-between mb-[10px]">
            <div className="font-heading font-black text-[13px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-text)' }}>Basic Details</div>
            {basicComplete ? (
              <div className="flex items-center gap-[4px]">
                <CheckCircle2 className="w-[12px] h-[12px]" style={{ color: 'var(--wc-gr)' }} />
                <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-gr)' }}>Complete</span>
              </div>
            ) : (
              <div className="flex items-center gap-[4px]">
                <AlertTriangle className="w-[10px] h-[10px]" style={{ color: 'var(--wc-am)' }} />
                <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-am)' }}>Required</span>
              </div>
            )}
          </div>

          {!basicComplete && (
            <div className="rounded-[8px] p-[8px_10px] mb-[10px] flex items-start gap-[6px]" style={{ background: 'rgba(153,153,153,.06)', border: '1px solid rgba(153,153,153,.15)' }}>
              <Info className="w-[10px] h-[10px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-am)' }} />
              <div className="text-[9px] leading-[1.4]" style={{ color: 'var(--wc-am)' }}>
                These fields are needed before deduction estimates can run. Fill them in to see per-trip values when sorting.
              </div>
            </div>
          )}

          {highlight && !specs.vehicleCategory && <FieldBadge n={1} label="Vehicle Type" />}
          <ChipSelect label="Vehicle Type" options={VEHICLE_TYPES} value={specs.vehicleCategory} onChange={updSpec('vehicleCategory')} testId="chip-vehicle-type" />

          {highlight && !purchase.purchasePrice && <FieldBadge n={2} label="Purchase Price" />}
          <FieldInput label="Vehicle Purchase Price ($)" value={purchase.purchasePrice} onChange={updPurch('purchasePrice')} type="number" placeholder="e.g. 55000" testId="input-purchase-price" />

          {highlight && !specs.estimatedAnnualKm && <FieldBadge n={3} label="Est. km / Year" />}
          <KmSlider value={specs.estimatedAnnualKm} onChange={updSpec('estimatedAnnualKm')} />

          {cappedPrice > 0 && (
            <div className="rounded-[8px] p-[8px_10px] mb-[10px] flex items-start gap-[6px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid rgb(var(--wc-ink) / .12)' }}>
              <Info className="w-[12px] h-[12px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-y)' }} />
              <div>
                <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>ATO Capped Value</div>
                <div className="text-[14px] font-heading font-bold mt-[1px]" style={{ color: 'var(--wc-y)' }}>
                  ${cappedPrice.toLocaleString()}
                  {isCapped && <span className="text-[10px] font-normal ml-[4px]" style={{ color: 'var(--wc-t3)' }}>(limit applied)</span>}
                </div>
                <div className="text-[9px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Value used for depreciation calculations</div>
              </div>
            </div>
          )}

          {isEV && (
            <div className="rounded-[8px] p-[8px_10px] mb-[8px] flex items-start gap-[6px]" style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.25)' }}>
              <Info className="w-[10px] h-[10px] flex-shrink-0 mt-[2px]" style={{ color: '#4ade80' }} />
              <div className="text-[9px] leading-[1.4]" style={{ color: '#4ade80' }}>
                EV selected — running costs use electricity rates (~$0.30/kWh) instead of fuel. Industry average: $6,400/yr. Fuel consumption field = kWh/100km.
              </div>
            </div>
          )}

          {basicComplete && (
            <>
              <div className="grid grid-cols-3 gap-[6px] mt-[4px] mb-[12px]">
                <StatCell
                  label={isEV ? 'Efficiency' : 'Fuel Economy'}
                  value={fuelEconomy > 0 ? `${fuelEconomy}${isEV ? 'kWh' : 'L'}` : isEV ? '~18kWh' : '~10L'}
                  color="var(--wc-y)"
                />
                <StatCell
                  label={isEV ? 'Est. Charging' : 'Est. Fuel'}
                  value={estAnnualRunning > 0 ? `$${estAnnualRunning.toLocaleString()}` : isEV ? '~$810' : '~$2,925'}
                  color="var(--wc-y)"
                />
                <StatCell label="Depreciation" value={depCalc ? `$${depCalc.dep.toLocaleString()}` : '—'} color="var(--wc-gr)" estimated={depCalc?.isEstimated} />
              </div>

              <button
                className="w-full rounded-[11px] py-[12px] flex items-center justify-center gap-[7px] font-heading font-extrabold text-[13px] uppercase tracking-[.06em] transition-all active:scale-[.97]"
                style={{
                  background: applied ? 'rgba(34,197,94,.15)' : 'var(--wc-y)',
                  color: applied ? '#4ade80' : 'var(--wc-bg)',
                  border: applied ? '1.5px solid rgba(34,197,94,.4)' : 'none',
                }}
                onClick={() => {
                  if (applied) {
                    dispatch({ type: 'GO_SCREEN', screen: 'dashboard' });
                    return;
                  }
                  setApplied(true);
                  localStorage.removeItem('wc_fill_highlight');
                  setTimeout(() => {
                    dispatch({ type: 'GO_SCREEN', screen: 'dashboard' });
                  }, 1400);
                }}
              >
                {applied ? (
                  <>
                    <CheckCircle2 className="w-[16px] h-[16px]" style={{ color: '#4ade80' }} />
                    Applied — going to dashboard
                  </>
                ) : (
                  <>
                    <Zap className="w-[15px] h-[15px]" />
                    Apply to Estimates
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* ═══ ADVANCED DETAILS (optional) ═══ */}
        <button
          className="w-full flex items-center justify-between rounded-[12px] p-[12px_14px] mt-[10px] cursor-pointer transition-all"
          style={{ background: 'rgb(var(--wc-ink) / .015)', border: '1px solid rgb(var(--wc-ink) / .06)' }}
          onClick={() => setShowAdvanced(!showAdvanced)}
          data-testid="button-toggle-advanced"
        >
          <div className="font-heading font-black text-[13px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-text)' }}>Advanced Details</div>
          <div className="flex items-center gap-[6px]">
            <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>For personalised estimates</span>
            {showAdvanced ? <ChevronUp className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t3)' }} /> : <ChevronDown className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t3)' }} />}
          </div>
        </button>

        {showAdvanced && (
          <div className="mt-[2px]">

            {/* Rego Lookup */}
            <div className="rounded-[12px] p-[14px] mt-[8px]" style={{ background: 'rgb(var(--wc-ink) / .015)', border: '1px solid rgb(var(--wc-ink) / .06)' }}>
              <div className="font-heading font-bold text-[11px] uppercase tracking-[.04em] mb-[8px]" style={{ color: 'var(--wc-text)' }}>Rego Lookup</div>
              <div className="flex gap-[6px] mb-[6px]">
                <input
                  className="flex-1 rounded-[8px] p-[11px] text-[16px] outline-none font-data uppercase tracking-[.1em]"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                  value={regoInput}
                  onChange={e => setRegoInput(e.target.value)}
                  placeholder="e.g. ABC123"
                  data-testid="input-rego-lookup"
                />
                <button
                  className="rounded-[8px] px-[16px] flex items-center gap-[6px] font-heading font-bold text-[12px] uppercase cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: 'rgb(var(--wc-ink) / .1)', border: '1px solid rgb(var(--wc-ink) / .3)', color: 'var(--wc-y)' }}
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
                <div className="rounded-[8px] p-[8px_10px] flex items-center gap-[6px]" style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)' }}>
                  <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--wc-gr)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--wc-gr)' }}>Vehicle found and details populated</span>
                </div>
              )}
              {lookupStatus === 'notfound' && (
                <div className="rounded-[8px] p-[8px_10px] flex items-center gap-[6px]" style={{ background: 'rgba(153,153,153,.06)', border: '1px solid rgba(153,153,153,.2)' }}>
                  <AlertTriangle className="w-[12px] h-[12px]" style={{ color: 'var(--wc-am)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--wc-am)' }}>Not found. Try: ABC123, XYZ789, DEF456</span>
                </div>
              )}
            </div>

            {/* Vehicle Specs */}
            <div className="rounded-[12px] p-[14px] mt-[8px]" style={{ background: 'rgb(var(--wc-ink) / .015)', border: '1px solid rgb(var(--wc-ink) / .06)' }}>
              <div className="font-heading font-bold text-[11px] uppercase tracking-[.04em] mb-[8px]" style={{ color: 'var(--wc-text)' }}>Vehicle Specifications</div>
              {hasVehicle && !manualEdit ? (
                <>
                  <div className="grid grid-cols-2 gap-[6px] mb-[8px]">
                    {advancedSpecFields.map(f => (
                      <div key={f.key} className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px solid rgb(var(--wc-ink) / .04)' }}>
                        <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>{f.label}</div>
                        <div className="text-[13px] mt-[2px]" style={{ color: 'var(--wc-text)' }}>{specs[f.key] || '—'}</div>
                      </div>
                    ))}
                    {specs.rego && (
                      <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
                        <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Rego</div>
                        <div className="text-[13px] font-data font-bold mt-[2px]" style={{ color: 'var(--wc-y)' }}>{specs.rego}</div>
                      </div>
                    )}
                  </div>
                  <button
                    className="text-[11px] font-heading font-bold uppercase tracking-[.04em] cursor-pointer"
                    style={{ color: 'var(--wc-t3)' }}
                    onClick={() => setManualEdit(true)}
                    data-testid="button-manual-edit-vehicle"
                  >
                    Manually Edit Details
                  </button>
                </>
              ) : (
                <div>
                  {advancedSpecFields.map(f => (
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
            </div>

            {/* Purchase, Ownership & Finance */}
            <div className="rounded-[12px] p-[14px] mt-[8px]" style={{ background: 'rgb(var(--wc-ink) / .015)', border: '1px solid rgb(var(--wc-ink) / .06)' }}>
              <div className="font-heading font-bold text-[11px] uppercase tracking-[.04em] mb-[8px]" style={{ color: 'var(--wc-text)' }}>Purchase, Ownership & Finance</div>

              <ChipSelect label="Ownership Type" options={['Owned', 'Financed', 'Leased']} value={purchase.ownershipType} onChange={updPurch('ownershipType')} testId="chip-ownership" />
              <FieldInput label="Purchase Date" value={purchase.purchaseDate} onChange={updPurch('purchaseDate')} type="date" testId="input-purchase-date" />
              <FieldInput label="Date First Used for Business" value={purchase.dateFirstUsed} onChange={updPurch('dateFirstUsed')} type="date" testId="input-date-first-used" />
              <ChipSelect label="Bought New or Used" options={['New', 'Used']} value={purchase.boughtNewOrUsed} onChange={updPurch('boughtNewOrUsed')} testId="chip-new-used" />

              {purchase.ownershipType === 'Financed' && (
                <>
                  <SectionLabel>Finance Details</SectionLabel>
                  <ChipSelect label="Input Mode" options={['Simple', 'Advanced']} value={purchase.financeInputMode} onChange={updPurch('financeInputMode')} testId="chip-finance-mode" />
                  {purchase.financeInputMode === 'Simple' ? (
                    <>
                      <FieldInput label="Estimated Annual Interest ($)" value={purchase.estimatedAnnualInterest} onChange={updPurch('estimatedAnnualInterest')} type="number" placeholder="e.g. 3200" testId="input-annual-interest" />
                      <FieldInput label="Lender Name (optional)" value={purchase.lenderName} onChange={updPurch('lenderName')} placeholder="e.g. ANZ" testId="input-lender-name" />
                    </>
                  ) : (
                    <>
                      <FieldInput label="Loan Amount ($)" value={purchase.loanAmount} onChange={updPurch('loanAmount')} type="number" placeholder="e.g. 45000" testId="input-loan-amount" />
                      <FieldInput label="Deposit Paid ($)" value={purchase.depositPaid} onChange={updPurch('depositPaid')} type="number" placeholder="e.g. 10000" testId="input-deposit" />
                      <FieldInput label="Loan Start Date" value={purchase.loanStartDate} onChange={updPurch('loanStartDate')} type="date" testId="input-loan-start" />
                      <FieldInput label="Loan Term (months)" value={purchase.loanTermMonths} onChange={updPurch('loanTermMonths')} type="number" placeholder="e.g. 60" testId="input-loan-term" />
                      <FieldInput label="Interest Rate (%)" value={purchase.interestRate} onChange={updPurch('interestRate')} type="number" placeholder="e.g. 6.5" testId="input-interest-rate" />
                      <ChipSelect label="Repayment Frequency" options={['Weekly', 'Fortnightly', 'Monthly']} value={purchase.repaymentFrequency} onChange={updPurch('repaymentFrequency')} testId="chip-repay-freq" />
                      <FieldInput label="Balloon Payment ($, optional)" value={purchase.balloonPayment} onChange={updPurch('balloonPayment')} type="number" placeholder="e.g. 15000" testId="input-balloon" />
                      {advancedInterest > 0 && (
                        <div className="rounded-[8px] p-[8px_10px] mb-[10px]" style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.12)' }}>
                          <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Estimated Annual Interest</div>
                          <div className="text-[14px] font-heading font-bold mt-[1px]" style={{ color: 'var(--wc-gr)' }}>${advancedInterest.toLocaleString()}</div>
                          <div className="text-[9px] mt-[1px]" style={{ color: 'var(--wc-t3)' }}>Only interest is deductible, not principal</div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="rounded-[8px] p-[8px_10px] flex items-start gap-[6px]" style={{ background: 'rgba(153,153,153,.03)', border: '1px solid rgba(153,153,153,.1)' }}>
                    <AlertTriangle className="w-[10px] h-[10px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-am)' }} />
                    <div className="text-[9px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
                      Only loan interest is deductible. Principal repayments are not a claimable expense.
                    </div>
                  </div>
                </>
              )}

              {purchase.ownershipType === 'Leased' && (
                <>
                  <SectionLabel>Lease Details</SectionLabel>
                  <FieldInput label="Lease Provider" value={purchase.leaseProvider} onChange={updPurch('leaseProvider')} placeholder="e.g. Toyota Fleet" testId="input-lease-provider" />
                  <FieldInput label="Lease Payment ($)" value={purchase.leasePaymentAmount} onChange={updPurch('leasePaymentAmount')} type="number" placeholder="e.g. 650" testId="input-lease-payment" />
                  <ChipSelect label="Payment Frequency" options={['Weekly', 'Fortnightly', 'Monthly']} value={purchase.leasePaymentFrequency} onChange={updPurch('leasePaymentFrequency')} testId="chip-lease-freq" />
                  <FieldInput label="Lease Start Date" value={purchase.leaseStartDate} onChange={updPurch('leaseStartDate')} type="date" testId="input-lease-start" />
                  {annualLeaseTotal > 0 && (
                    <div className="rounded-[8px] p-[8px_10px] mb-[6px]" style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.12)' }}>
                      <div className="font-data text-[7px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Estimated Annual Lease Total</div>
                      <div className="text-[14px] font-heading font-bold mt-[1px]" style={{ color: 'var(--wc-gr)' }}>${annualLeaseTotal.toLocaleString()}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Depreciation Details */}
            <div className="rounded-[12px] p-[14px] mt-[8px]" style={{ background: 'rgb(var(--wc-ink) / .015)', border: '1px solid rgb(var(--wc-ink) / .06)' }}>
              <div className="font-heading font-bold text-[11px] uppercase tracking-[.04em] mb-[8px]" style={{ color: 'var(--wc-text)' }}>Depreciation Details</div>

              <ChipSelect
                label="What best describes this vehicle?"
                options={['New vehicle', 'Previously claimed', "I'm not sure"]}
                value={purchase.vehicleHistoryStatus}
                onChange={updPurch('vehicleHistoryStatus')}
                testId="chip-vehicle-history"
              />

              {purchase.vehicleHistoryStatus === 'New vehicle' && (
                <div className="text-[11px] leading-[1.5] mb-[8px]" style={{ color: 'var(--wc-t3)' }}>
                  Depreciation starts from purchase date. First-year pro-rata is calculated automatically.
                </div>
              )}

              {purchase.vehicleHistoryStatus === 'Previously claimed' && (
                <>
                  <ChipSelect
                    label="How would you like to enter your claim position?"
                    options={['Enter current WDV', 'Enter previously claimed', 'Estimate it for me']}
                    value={
                      purchase.depreciationMode === 'enterWDV' ? 'Enter current WDV' :
                      purchase.depreciationMode === 'enterClaimed' ? 'Enter previously claimed' : 'Estimate it for me'
                    }
                    onChange={(v) => {
                      const mode = v === 'Enter current WDV' ? 'enterWDV' : v === 'Enter previously claimed' ? 'enterClaimed' : 'estimate';
                      updPurch('depreciationMode')(mode);
                    }}
                    testId="chip-dep-mode"
                  />
                  {purchase.depreciationMode === 'enterWDV' && (
                    <>
                      <FieldInput label="Current Written Down Value ($)" value={purchase.currentWDV} onChange={updPurch('currentWDV')} type="number" placeholder="e.g. 42000" testId="input-current-wdv" />
                      <FieldInput label="Year First Claimed (optional)" value={purchase.yearFirstClaimed} onChange={updPurch('yearFirstClaimed')} type="number" placeholder="e.g. 2022" testId="input-year-claimed" />
                    </>
                  )}
                  {purchase.depreciationMode === 'enterClaimed' && (
                    <>
                      <FieldInput label="Previously Claimed Amount ($)" value={purchase.previouslyClaimed} onChange={updPurch('previouslyClaimed')} type="number" placeholder="e.g. 12000" testId="input-previously-claimed" />
                      <FieldInput label="Year First Claimed (optional)" value={purchase.yearFirstClaimed} onChange={updPurch('yearFirstClaimed')} type="number" placeholder="e.g. 2021" testId="input-year-claimed-2" />
                    </>
                  )}
                  {purchase.depreciationMode === 'estimate' && (
                    <>
                      <FieldInput label="Approximate Years Used for Business" value={purchase.approxYearsBusinessUse} onChange={updPurch('approxYearsBusinessUse')} type="number" placeholder="e.g. 3" testId="input-approx-years-biz" />
                      <FieldInput label="Approximate Business Use (%)" value={purchase.approxBusinessUsePct} onChange={updPurch('approxBusinessUsePct')} type="number" placeholder="e.g. 70" testId="input-approx-biz-pct" />
                      <ChipSelect label="Prior Claims Made?" options={['Yes', 'No', 'Unsure']} value={purchase.priorClaimsMade} onChange={updPurch('priorClaimsMade')} testId="chip-prior-claims" />
                    </>
                  )}
                </>
              )}

              {purchase.vehicleHistoryStatus === "I'm not sure" && (
                <>
                  <div className="text-[11px] leading-[1.5] mb-[8px]" style={{ color: 'var(--wc-t3)' }}>
                    No worries — we'll estimate your depreciation position based on what you know.
                  </div>
                  <FieldInput label="Approximate Years Owned" value={purchase.approxYearsOwned} onChange={updPurch('approxYearsOwned')} type="number" placeholder="e.g. 4" testId="input-approx-years-owned" />
                  <FieldInput label="Approximate Years Used for Business" value={purchase.approxYearsBusinessUse} onChange={updPurch('approxYearsBusinessUse')} type="number" placeholder="e.g. 3" testId="input-approx-years-biz-2" />
                  <FieldInput label="Approximate Business Use (%)" value={purchase.approxBusinessUsePct} onChange={updPurch('approxBusinessUsePct')} type="number" placeholder="e.g. 65" testId="input-approx-biz-pct-2" />
                  <ChipSelect label="Have You Claimed This Vehicle Before?" options={['Yes', 'No', 'Not sure']} value={purchase.priorClaimsMade} onChange={updPurch('priorClaimsMade')} testId="chip-prior-claims-2" />
                </>
              )}

              {depCalc && (
                <>
                  <div className="grid grid-cols-2 gap-[6px] mt-[10px]">
                    <StatCell label="Purchase Price" value={rawPrice > 0 ? `$${rawPrice.toLocaleString()}` : '—'} />
                    <StatCell label="ATO Capped Value" value={`$${depCalc.cappedPrice.toLocaleString()}`} color="var(--wc-y)" />
                    <StatCell label="Current WDV" value={`$${depCalc.wdv.toLocaleString()}`} color="var(--wc-y)" estimated={depCalc.isEstimated} />
                    <StatCell label="WDV After This Year" value={`$${depCalc.wdvAfter.toLocaleString()}`} estimated={depCalc.isEstimated} />
                    <StatCell label="Annual Depreciation" value={`$${depCalc.annualDep.toLocaleString()}`} color="var(--wc-gr)" estimated={depCalc.isEstimated} />
                    <StatCell label="Current Year Dep." value={`$${depCalc.dep.toLocaleString()}`} color="var(--wc-gr)" estimated={depCalc.isEstimated} />
                  </div>
                  <div className="flex items-center gap-[6px] mt-[6px]">
                    <div className="w-[6px] h-[6px] rounded-full" style={{ background: depCalc.isEstimated ? 'var(--wc-am)' : 'var(--wc-gr)' }} />
                    <span className="font-data text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>
                      {depCalc.isEstimated ? 'Estimated*' : 'Based on entered values'} &middot; {depCalc.wdvSource}
                    </span>
                  </div>
                  {depCalc.prorata < 100 && (
                    <div className="text-[10px] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>
                      Prorated at {depCalc.prorata}% (Diminishing Value method)
                    </div>
                  )}
                  {depCalc.isEstimated && (
                    <div className="rounded-[8px] p-[8px_10px] mt-[8px] flex items-start gap-[6px]" style={{ background: 'rgba(153,153,153,.04)', border: '1px solid rgba(153,153,153,.12)' }}>
                      <AlertTriangle className="w-[10px] h-[10px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-am)' }} />
                      <div className="text-[9px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
                        *Estimated using purchase timing and prior-use inputs. Review with your tax agent.
                      </div>
                    </div>
                  )}
                </>
              )}

              {!depCalc && rawPrice <= 0 && (
                <div className="text-[11px] py-[8px]" style={{ color: 'var(--wc-t3)' }}>
                  Enter a purchase price in Basic Details to see depreciation estimates.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}
