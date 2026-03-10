// ============================================================
// DEDUCTION ESTIMATOR
// Pure functions only — no localStorage reads anywhere.
// All data is passed in as parameters.
// ============================================================

export type DeductionState = 'locked' | 'partial' | 'active';
export type EstimateMode = 'industry' | 'personalised';

export interface ReadinessCheck {
  taxProfileComplete: boolean;
  vehiclePurchaseComplete: boolean;
  wdvEntered: boolean;
  purchasePriceEntered: boolean;
  businessUseEstablished: boolean;
  someExpensesEntered: boolean;
  depreciationAvailable: boolean;
  vehicleHistorySet: boolean;
  financeInterestAvailable: boolean;
  basicDetailsComplete: boolean;
}

export interface MissingItem {
  label: string;
  screen: string;
}

export interface IncludedItem {
  label: string;
}

export interface VehicleCostsDetailed {
  manual: number;
  fuelEstimate: number;
  depreciation: number;
  financeInterest: number;
  leasePayments: number;
  total: number;
  missingCategories: string[];
  isDepreciationEstimated: boolean;
}

// ── Input shapes (replaces localStorage reads) ──────────────

export interface VehicleSpecs {
  vehicleCategory?: string;
  bodyType?: string;
  fuelConsumption?: string | number;
}

export interface VehiclePurchase {
  purchasePrice?: string | number;
  purchaseDate?: string;
  currentWDV?: string | number;
  vehicleHistoryStatus?: string;
  depreciationMode?: string;
  depreciationInputMode?: string;
  previouslyClaimed?: string | number;
  approxYearsOwned?: string | number;
  approxYearsBusinessUse?: string | number;
  ownershipType?: string;
  financeType?: string;
  financeInputMode?: string;
  loanAmount?: string | number;
  interestRate?: string | number;
  estimatedAnnualInterest?: string | number;
  leasePaymentAmount?: string | number;
  leasePaymentFrequency?: string;
  dateFirstUsed?: string;
}

export interface TaxProfile {
  salary?: string | number;
}

export interface AppSettings {
  useIndustryAverages?: boolean;
  avgFuelPrice?: string | number;
}

export interface ExpenseRecord {
  amount: number;
  isEstimated?: boolean;
  estimated?: boolean;
}

// ── Constants ────────────────────────────────────────────────

const ATO_CAR_LIMIT = 68108;
const DV_RATE = 0.25;

const INDUSTRY_RUNNING_COSTS: Record<string, number> = {
  'ute-4x4': 12900,
  'ute-4x2': 9700,
  'suv-medium': 9700,
  'suv-small': 5900,
  'sedan': 7200,
  'van': 10500,
  'default': 9200,
};

// ── Mode resolver ────────────────────────────────────────────

export function getEstimateMode(settings?: AppSettings): EstimateMode {
  if (settings?.useIndustryAverages === false) return 'personalised';
  return 'industry';
}

// ── Category resolver ────────────────────────────────────────

function getVehicleCategory(specs?: VehicleSpecs): string {
  if (!specs) return 'default';
  const cat = (specs.vehicleCategory || '').toLowerCase();
  if (cat.includes('4x4') || cat.includes('4wd')) return 'ute-4x4';
  if (cat.includes('4x2') || cat.includes('2wd')) return 'ute-4x2';
  if (cat.includes('suv') && cat.includes('small')) return 'suv-small';
  if (cat.includes('suv')) return 'suv-medium';
  if (cat.includes('van')) return 'van';
  if (cat.includes('sedan')) return 'sedan';
  const body = (specs.bodyType || '').toLowerCase();
  if (body.includes('util') || body.includes('ute')) return 'ute-4x4';
  if (body.includes('van')) return 'van';
  if (body.includes('suv') || body.includes('wagon')) return 'suv-medium';
  if (body.includes('sedan') || body.includes('hatch')) return 'sedan';
  return 'default';
}

function getIndustryRunningCost(specs?: VehicleSpecs): number {
  const cat = getVehicleCategory(specs);
  return INDUSTRY_RUNNING_COSTS[cat] || INDUSTRY_RUNNING_COSTS['default'];
}

function getIndustryDepreciation(purchase?: VehiclePurchase): number {
  const price = parseFloat(String(purchase?.purchasePrice ?? 0)) || 0;
  if (price > 0) {
    const capped = Math.min(price, ATO_CAR_LIMIT);
    return Math.round(capped * DV_RATE * 100) / 100;
  }
  return Math.round(45000 * DV_RATE * 100) / 100;
}

// ── Readiness checks ─────────────────────────────────────────

export function getReadinessChecks(params: {
  taxProfile?: TaxProfile;
  vehiclePurchase?: VehiclePurchase;
  vehicleSpecs?: VehicleSpecs;
  expenses?: ExpenseRecord[];
  hasBizTrips?: boolean;
}): ReadinessCheck {
  const { taxProfile, vehiclePurchase, vehicleSpecs, expenses = [], hasBizTrips = false } = params;

  const taxProfileComplete = !!(taxProfile?.salary && parseFloat(String(taxProfile.salary)) > 0);

  const purchasePriceEntered = !!(
    vehiclePurchase?.purchasePrice &&
    parseFloat(String(vehiclePurchase.purchasePrice)) > 0
  );
  const wdvEntered = !!(
    vehiclePurchase?.currentWDV &&
    parseFloat(String(vehiclePurchase.currentWDV)) > 0
  );
  const vehiclePurchaseComplete = purchasePriceEntered && !!vehiclePurchase?.purchaseDate;

  const status = vehiclePurchase?.vehicleHistoryStatus || '';
  const vehicleHistorySet =
    status === 'New vehicle' || status === 'Previously claimed' || status === "I'm not sure";

  const depreciationAvailable =
    purchasePriceEntered &&
    (
      wdvEntered ||
      !!vehiclePurchase?.purchaseDate ||
      (parseFloat(String(vehiclePurchase?.approxYearsOwned ?? 0)) || 0) > 0 ||
      (parseFloat(String(vehiclePurchase?.approxYearsBusinessUse ?? 0)) || 0) > 0 ||
      (parseFloat(String(vehiclePurchase?.previouslyClaimed ?? 0)) || 0) > 0
    );

  const ownership = vehiclePurchase?.ownershipType || vehiclePurchase?.financeType || 'Owned';
  let financeInterestAvailable = false;
  if (ownership === 'Financed') {
    const simpleInterest = parseFloat(String(vehiclePurchase?.estimatedAnnualInterest ?? 0)) || 0;
    const loanAmt = parseFloat(String(vehiclePurchase?.loanAmount ?? 0)) || 0;
    const rate = parseFloat(String(vehiclePurchase?.interestRate ?? 0)) || 0;
    financeInterestAvailable = simpleInterest > 0 || (loanAmt > 0 && rate > 0);
  } else if (ownership === 'Leased') {
    financeInterestAvailable = (parseFloat(String(vehiclePurchase?.leasePaymentAmount ?? 0)) || 0) > 0;
  } else {
    financeInterestAvailable = true;
  }

  const someExpensesEntered = Array.isArray(expenses) && expenses.length > 0;
  const businessUseEstablished = hasBizTrips;

  const vehicleTypeSet = !!(vehicleSpecs?.vehicleCategory || vehicleSpecs?.bodyType);
  const basicDetailsComplete = purchasePriceEntered && vehicleTypeSet;

  return {
    taxProfileComplete,
    vehiclePurchaseComplete,
    wdvEntered,
    purchasePriceEntered,
    businessUseEstablished,
    someExpensesEntered,
    depreciationAvailable,
    vehicleHistorySet,
    financeInterestAvailable,
    basicDetailsComplete,
  };
}

export function getDeductionState(
  checks: ReadinessCheck,
  showDeductionEstimates: boolean,
  settings?: AppSettings
): DeductionState {
  if (!showDeductionEstimates) return 'locked';

  const mode = getEstimateMode(settings);

  if (mode === 'industry') {
    return checks.basicDetailsComplete ? 'partial' : 'locked';
  }

  const canEstimate =
    (checks.purchasePriceEntered && checks.depreciationAvailable) ||
    checks.businessUseEstablished;
  if (!canEstimate) return 'locked';

  const allComplete =
    checks.taxProfileComplete &&
    checks.vehiclePurchaseComplete &&
    checks.vehicleHistorySet &&
    checks.depreciationAvailable &&
    checks.businessUseEstablished &&
    checks.someExpensesEntered &&
    checks.financeInterestAvailable;

  return allComplete ? 'active' : 'partial';
}

export function getMissingItems(
  checks: ReadinessCheck,
  vehicleSpecs?: VehicleSpecs,
  settings?: AppSettings
): MissingItem[] {
  const mode = getEstimateMode(settings);

  if (mode === 'industry') {
    if (checks.basicDetailsComplete) return [];
    const items: MissingItem[] = [];
    if (!checks.purchasePriceEntered) items.push({ label: 'Vehicle purchase price', screen: 'account' });
    if (!vehicleSpecs?.vehicleCategory && !vehicleSpecs?.bodyType) {
      items.push({ label: 'Vehicle type', screen: 'account' });
    }
    return items;
  }

  const items: MissingItem[] = [];
  if (!checks.taxProfileComplete) items.push({ label: 'Tax profile (income details)', screen: 'account' });
  if (!checks.vehiclePurchaseComplete) items.push({ label: 'Vehicle purchase details', screen: 'account' });
  if (!checks.purchasePriceEntered) items.push({ label: 'Vehicle purchase price', screen: 'account' });
  if (!checks.vehicleHistorySet) items.push({ label: 'Vehicle history status', screen: 'account' });
  if (!checks.depreciationAvailable) items.push({ label: 'Depreciation details (WDV, purchase date, or estimate)', screen: 'account' });
  if (!checks.financeInterestAvailable) items.push({ label: 'Finance / lease interest details', screen: 'account' });
  if (!checks.businessUseEstablished) items.push({ label: 'Classify trips to establish business use', screen: 'sort' });
  if (!checks.someExpensesEntered) items.push({ label: 'Vehicle running expenses', screen: 'expenses' });
  return items;
}

export function getIncludedItems(
  checks: ReadinessCheck,
  vehicleSpecs?: VehicleSpecs,
  settings?: AppSettings
): IncludedItem[] {
  const mode = getEstimateMode(settings);

  if (mode === 'industry') {
    const items: IncludedItem[] = [{ label: 'Industry average running costs' }];
    if (checks.businessUseEstablished) items.push({ label: 'Business use from your trips' });
    if (checks.purchasePriceEntered) items.push({ label: 'Your purchase price for depreciation' });
    if (vehicleSpecs?.vehicleCategory || vehicleSpecs?.bodyType) {
      items.push({ label: 'Vehicle type used for cost estimate' });
    }
    if (vehicleSpecs?.fuelConsumption) items.push({ label: 'Your fuel consumption data' });
    return items;
  }

  const items: IncludedItem[] = [];
  if (checks.taxProfileComplete) items.push({ label: 'Tax profile complete' });
  if (checks.vehiclePurchaseComplete) items.push({ label: 'Vehicle purchase details entered' });
  if (checks.wdvEntered) items.push({ label: 'Written Down Value entered' });
  if (checks.purchasePriceEntered) items.push({ label: 'Purchase price entered' });
  if (checks.depreciationAvailable) items.push({ label: 'Depreciation data available' });
  if (checks.vehicleHistorySet) items.push({ label: 'Vehicle history status set' });
  if (checks.financeInterestAvailable) items.push({ label: 'Finance details complete' });
  if (checks.businessUseEstablished) items.push({ label: 'Business use established from trips' });
  if (checks.someExpensesEntered) items.push({ label: 'Vehicle expenses recorded' });
  return items;
}

export function getEstimateDisclaimer(state: DeductionState, settings?: AppSettings): string {
  const mode = getEstimateMode(settings);
  if (mode === 'industry') {
    return '*Estimate based on industry averages and current usage only. This is not a full representation of your tax situation.';
  }
  switch (state) {
    case 'locked':
      return 'Complete your profile to unlock deduction estimates.';
    case 'partial':
      return '*Estimate based on current usage and available inputs only. This is not a full representation of your tax situation.';
    case 'active':
      return 'Planning estimate only. Final outcomes depend on your full tax position and should be reviewed by a registered tax agent.';
  }
}

export function getReadinessLabel(state: DeductionState, settings?: AppSettings): string {
  const mode = getEstimateMode(settings);
  if (mode === 'industry') return 'Industry average estimate';
  switch (state) {
    case 'locked': return 'Incomplete';
    case 'partial': return 'Basic estimate available';
    case 'active': return 'Personalised estimate';
  }
}

// ── FY helpers ───────────────────────────────────────────────

function getCurrentFY(): { start: Date; end: Date; daysInFY: number } {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(fyStartYear, 6, 1);
  const end = new Date(fyStartYear + 1, 5, 30);
  const daysInFY = Math.round((end.getTime() - start.getTime()) / 86400000);
  return { start, end, daysInFY };
}

function estimateWDVFromPurchase(
  cappedPrice: number,
  purchaseDate: string | null,
  yearsUsed: number
): number {
  if (cappedPrice <= 0) return 0;
  let wdv = cappedPrice;
  const pd = purchaseDate ? new Date(purchaseDate) : null;
  const now = new Date();
  const actualYears = pd
    ? Math.max(0, (now.getTime() - pd.getTime()) / (365.25 * 86400000))
    : yearsUsed;
  const years = Math.max(0, Math.floor(actualYears));
  if (years === 0) return wdv;

  const firstYearFraction = pd
    ? (() => {
        const fyStart = new Date(
          pd.getMonth() >= 6 ? pd.getFullYear() : pd.getFullYear() - 1,
          6, 1
        );
        const fyEnd = new Date(fyStart.getFullYear() + 1, 5, 30);
        const daysInFY = Math.round((fyEnd.getTime() - fyStart.getTime()) / 86400000);
        const daysOwned = Math.max(
          0,
          Math.min(Math.round((fyEnd.getTime() - pd.getTime()) / 86400000), daysInFY)
        );
        return daysOwned / daysInFY;
      })()
    : 1;

  wdv -= wdv * DV_RATE * firstYearFraction;
  for (let i = 1; i < years; i++) wdv -= wdv * DV_RATE;
  return Math.round(Math.max(0, wdv) * 100) / 100;
}

function calculateDepreciation(purchase?: VehiclePurchase): { amount: number; isEstimated: boolean } {
  if (!purchase) return { amount: 0, isEstimated: false };

  const purchasePrice = parseFloat(String(purchase.purchasePrice ?? 0)) || 0;
  if (purchasePrice <= 0) return { amount: 0, isEstimated: false };

  const cappedPrice = Math.min(purchasePrice, ATO_CAR_LIMIT);
  const status = purchase.vehicleHistoryStatus || 'New vehicle';
  const mode = purchase.depreciationMode || purchase.depreciationInputMode || 'enterWDV';
  let wdv = 0;
  let isEstimated = false;

  if (status === 'New vehicle') {
    wdv = cappedPrice;
  } else if (status === 'Previously claimed') {
    if (mode === 'enterWDV') {
      const userWDV = parseFloat(String(purchase.currentWDV ?? 0)) || 0;
      wdv = userWDV > 0 ? userWDV : cappedPrice;
      isEstimated = userWDV <= 0;
    } else if (mode === 'enterClaimed') {
      const claimed = parseFloat(String(purchase.previouslyClaimed ?? 0)) || 0;
      wdv = Math.max(0, cappedPrice - claimed);
    } else {
      const yearsUsed =
        parseFloat(String(purchase.approxYearsBusinessUse ?? 0)) ||
        parseFloat(String(purchase.approxYearsOwned ?? 0)) ||
        0;
      wdv = estimateWDVFromPurchase(cappedPrice, purchase.purchaseDate || null, yearsUsed);
      isEstimated = true;
    }
  } else {
    const yearsOwned = parseFloat(String(purchase.approxYearsOwned ?? 0)) || 0;
    const yearsUsed =
      parseFloat(String(purchase.approxYearsBusinessUse ?? 0)) || yearsOwned;
    wdv = estimateWDVFromPurchase(cappedPrice, purchase.purchaseDate || null, yearsUsed);
    isEstimated = true;
  }

  if (wdv <= 0) return { amount: 0, isEstimated };

  const { start: fyStart, end: fyEnd, daysInFY } = getCurrentFY();
  const startDate =
    purchase.dateFirstUsed
      ? new Date(purchase.dateFirstUsed)
      : purchase.purchaseDate
        ? new Date(purchase.purchaseDate)
        : null;

  let daysOwned = daysInFY;
  if (startDate && startDate > fyStart) {
    daysOwned = Math.max(
      0,
      Math.min(Math.round((fyEnd.getTime() - startDate.getTime()) / 86400000), daysInFY)
    );
  }

  const proRataFraction = daysOwned / daysInFY;
  const amount = Math.round(wdv * DV_RATE * proRataFraction * 100) / 100;
  return { amount, isEstimated };
}

function getFinanceInterest(purchase?: VehiclePurchase): number {
  if (!purchase) return 0;
  const ownership = purchase.ownershipType || purchase.financeType || 'Owned';
  if (ownership !== 'Financed') return 0;
  if (purchase.financeInputMode === 'Advanced') {
    const loan = parseFloat(String(purchase.loanAmount ?? 0)) || 0;
    const rate = parseFloat(String(purchase.interestRate ?? 0)) || 0;
    if (loan > 0 && rate > 0) return Math.round(loan * (rate / 100) * 100) / 100;
  }
  return parseFloat(String(purchase.estimatedAnnualInterest ?? 0)) || 0;
}

function getLeasePayments(purchase?: VehiclePurchase): number {
  if (!purchase) return 0;
  const ownership = purchase.ownershipType || purchase.financeType || 'Owned';
  if (ownership !== 'Leased') return 0;
  const amt = parseFloat(String(purchase.leasePaymentAmount ?? 0)) || 0;
  if (amt <= 0) return 0;
  const freq = purchase.leasePaymentFrequency || 'Monthly';
  if (freq === 'Weekly') return Math.round(amt * 52 * 100) / 100;
  if (freq === 'Fortnightly') return Math.round(amt * 26 * 100) / 100;
  return Math.round(amt * 12 * 100) / 100;
}

// ── Main cost calculation ────────────────────────────────────

export function getVehicleCostsDetailed(params: {
  vehicleSpecs?: VehicleSpecs;
  vehiclePurchase?: VehiclePurchase;
  expenses?: ExpenseRecord[];
  settings?: AppSettings;
  fuelConsumptionOverride?: number;
}): VehicleCostsDetailed {
  const mode = getEstimateMode(params.settings);
  return mode === 'industry'
    ? getIndustryAverageCosts(params)
    : getPersonalisedCosts(params);
}

function getIndustryAverageCosts(params: {
  vehicleSpecs?: VehicleSpecs;
  vehiclePurchase?: VehiclePurchase;
  settings?: AppSettings;
  fuelConsumptionOverride?: number;
}): VehicleCostsDetailed {
  const industryRunning = getIndustryRunningCost(params.vehicleSpecs);
  const industryDep = getIndustryDepreciation(params.vehiclePurchase);

  const fuelConsumption =
    params.fuelConsumptionOverride ||
    parseFloat(String(params.vehicleSpecs?.fuelConsumption ?? 0)) ||
    10;

  const avgFuelPrice =
    parseFloat(String(params.settings?.avgFuelPrice ?? 0)) ||
    1.95;

  const fuelEstimate = Math.round(15000 / 100 * fuelConsumption * avgFuelPrice * 100) / 100;
  const total = industryRunning + industryDep + fuelEstimate;

  return {
    manual: industryRunning,
    fuelEstimate,
    depreciation: industryDep,
    financeInterest: 0,
    leasePayments: 0,
    total,
    missingCategories: [],
    isDepreciationEstimated: true,
  };
}

function getPersonalisedCosts(params: {
  vehicleSpecs?: VehicleSpecs;
  vehiclePurchase?: VehiclePurchase;
  expenses?: ExpenseRecord[];
  settings?: AppSettings;
  fuelConsumptionOverride?: number;
}): VehicleCostsDetailed {
  const missingCategories: string[] = [];
  const expenses = params.expenses || [];

  const manual = expenses
    .filter(e => !e.isEstimated && !e.estimated)
    .reduce((s, e) => s + (e.amount || 0), 0);

  if (manual === 0) {
    missingCategories.push('Registration');
    missingCategories.push('Insurance');
    missingCategories.push('Repairs & maintenance');
  }

  const fuelConsumption =
    params.fuelConsumptionOverride ||
    parseFloat(String(params.vehicleSpecs?.fuelConsumption ?? 0)) ||
    10;

  const avgFuelPrice =
    parseFloat(String(params.settings?.avgFuelPrice ?? 0)) ||
    1.95;

  const fuelEstimate = Math.round(15000 / 100 * fuelConsumption * avgFuelPrice * 100) / 100;

  const depResult = calculateDepreciation(params.vehiclePurchase);
  const depreciation = depResult.amount;

  if (depreciation === 0) {
    missingCategories.push('Depreciation (needs purchase price or WDV)');
  }

  const financeInterest = getFinanceInterest(params.vehiclePurchase);
  const leasePayments = getLeasePayments(params.vehiclePurchase);

  const ownership =
    params.vehiclePurchase?.ownershipType ||
    params.vehiclePurchase?.financeType ||
    'Owned';

  if (ownership === 'Financed' && financeInterest === 0) {
    missingCategories.push('Loan interest');
  }
  if (ownership === 'Leased' && leasePayments === 0) {
    missingCategories.push('Lease payments');
  }

  const total = manual + fuelEstimate + depreciation + financeInterest + leasePayments;

  return {
    manual,
    fuelEstimate,
    depreciation,
    financeInterest,
    leasePayments,
    total,
    missingCategories,
    isDepreciationEstimated: depResult.isEstimated,
  };
}
