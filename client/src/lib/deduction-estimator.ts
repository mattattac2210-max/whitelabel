export type DeductionState = 'locked' | 'partial' | 'active';

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

const ATO_CAR_LIMIT = 68108;
const DV_RATE = 0.25;

export function getReadinessChecks(hasBizTrips?: boolean): ReadinessCheck {
  let taxProfileComplete = false;
  try {
    const profile = JSON.parse(localStorage.getItem('wc_tax_profile') || '{}');
    taxProfileComplete = !!(profile.salary && parseFloat(profile.salary) > 0);
  } catch {}

  let vehiclePurchaseComplete = false;
  let wdvEntered = false;
  let purchasePriceEntered = false;
  let depreciationAvailable = false;
  let vehicleHistorySet = false;
  let financeInterestAvailable = false;

  try {
    const purchase = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
    purchasePriceEntered = !!(purchase.purchasePrice && parseFloat(purchase.purchasePrice) > 0);
    wdvEntered = !!(purchase.currentWDV && parseFloat(purchase.currentWDV) > 0);
    vehiclePurchaseComplete = purchasePriceEntered && !!purchase.purchaseDate;

    const status = purchase.vehicleHistoryStatus || '';
    vehicleHistorySet = status === 'New vehicle' || status === 'Previously claimed' || status === "I'm not sure";

    depreciationAvailable = purchasePriceEntered && (
      wdvEntered ||
      !!purchase.purchaseDate ||
      (parseFloat(purchase.approxYearsOwned) || 0) > 0 ||
      (parseFloat(purchase.approxYearsBusinessUse) || 0) > 0 ||
      (parseFloat(purchase.previouslyClaimed) || 0) > 0
    );

    const ownership = purchase.ownershipType || 'Owned';
    if (ownership === 'Financed') {
      const simpleInterest = parseFloat(purchase.estimatedAnnualInterest) || 0;
      const loanAmt = parseFloat(purchase.loanAmount) || 0;
      const rate = parseFloat(purchase.interestRate) || 0;
      financeInterestAvailable = simpleInterest > 0 || (loanAmt > 0 && rate > 0);
    } else if (ownership === 'Leased') {
      financeInterestAvailable = (parseFloat(purchase.leasePaymentAmount) || 0) > 0;
    } else {
      financeInterestAvailable = true;
    }
  } catch {}

  let someExpensesEntered = false;
  try {
    const expenses = JSON.parse(localStorage.getItem('wc_expenses') || '[]');
    someExpensesEntered = Array.isArray(expenses) && expenses.length > 0;
  } catch {}

  const businessUseEstablished = hasBizTrips ?? false;

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
  };
}

export function getDeductionState(checks: ReadinessCheck, showDeductionEstimates: boolean): DeductionState {
  if (!showDeductionEstimates) return 'locked';

  const canEstimate = (checks.purchasePriceEntered && checks.depreciationAvailable) || checks.businessUseEstablished;
  if (!canEstimate) return 'locked';

  const allComplete =
    checks.taxProfileComplete &&
    checks.vehiclePurchaseComplete &&
    checks.vehicleHistorySet &&
    checks.depreciationAvailable &&
    checks.businessUseEstablished &&
    checks.someExpensesEntered &&
    checks.financeInterestAvailable;

  if (allComplete) return 'active';
  return 'partial';
}

export function getMissingItems(checks: ReadinessCheck): MissingItem[] {
  const items: MissingItem[] = [];
  if (!checks.taxProfileComplete) {
    items.push({ label: 'Tax profile (income details)', screen: 'account' });
  }
  if (!checks.vehiclePurchaseComplete) {
    items.push({ label: 'Vehicle purchase details', screen: 'account' });
  }
  if (!checks.purchasePriceEntered) {
    items.push({ label: 'Vehicle purchase price', screen: 'account' });
  }
  if (!checks.vehicleHistorySet) {
    items.push({ label: 'Vehicle history status', screen: 'account' });
  }
  if (!checks.depreciationAvailable) {
    items.push({ label: 'Depreciation details (WDV, purchase date, or estimate)', screen: 'account' });
  }
  if (!checks.financeInterestAvailable) {
    items.push({ label: 'Finance / lease interest details', screen: 'account' });
  }
  if (!checks.businessUseEstablished) {
    items.push({ label: 'Classify trips to establish business use', screen: 'sort' });
  }
  if (!checks.someExpensesEntered) {
    items.push({ label: 'Vehicle running expenses', screen: 'expenses' });
  }
  return items;
}

export function getIncludedItems(checks: ReadinessCheck): IncludedItem[] {
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

export function getEstimateDisclaimer(state: DeductionState): string {
  switch (state) {
    case 'locked':
      return 'Complete your profile to unlock deduction estimates.';
    case 'partial':
      return '*Estimate based on current usage and available inputs only. This is not a full representation of your tax situation.';
    case 'active':
      return 'Planning estimate only. Final outcomes depend on your full tax position and should be reviewed by a registered tax agent.';
  }
}

export function getReadinessLabel(state: DeductionState): string {
  switch (state) {
    case 'locked':
      return 'Incomplete';
    case 'partial':
      return 'Basic estimate available';
    case 'active':
      return 'More accurate estimate available';
  }
}

function getCurrentFY(): { start: Date; end: Date; daysInFY: number } {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(fyStartYear, 6, 1);
  const end = new Date(fyStartYear + 1, 5, 30);
  const daysInFY = Math.round((end.getTime() - start.getTime()) / 86400000);
  return { start, end, daysInFY };
}

function estimateWDVFromPurchase(cappedPrice: number, purchaseDate: string | null, yearsUsed: number): number {
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

function calculateDepreciation(): { amount: number; isEstimated: boolean } {
  try {
    const purchase = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
    const purchasePrice = parseFloat(purchase.purchasePrice) || 0;
    if (purchasePrice <= 0) return { amount: 0, isEstimated: false };

    const cappedPrice = Math.min(purchasePrice, ATO_CAR_LIMIT);
    const status = purchase.vehicleHistoryStatus || 'New vehicle';
    const mode = purchase.depreciationMode || 'enterWDV';
    let wdv = 0;
    let isEstimated = false;

    if (status === 'New vehicle') {
      wdv = cappedPrice;
    } else if (status === 'Previously claimed') {
      if (mode === 'enterWDV') {
        const userWDV = parseFloat(purchase.currentWDV) || 0;
        wdv = userWDV > 0 ? userWDV : cappedPrice;
        isEstimated = userWDV <= 0;
      } else if (mode === 'enterClaimed') {
        const claimed = parseFloat(purchase.previouslyClaimed) || 0;
        wdv = Math.max(0, cappedPrice - claimed);
      } else {
        const yearsUsed = parseFloat(purchase.approxYearsBusinessUse) || parseFloat(purchase.approxYearsOwned) || 0;
        wdv = estimateWDVFromPurchase(cappedPrice, purchase.purchaseDate || null, yearsUsed);
        isEstimated = true;
      }
    } else {
      const yearsOwned = parseFloat(purchase.approxYearsOwned) || 0;
      const yearsUsed = parseFloat(purchase.approxYearsBusinessUse) || yearsOwned;
      wdv = estimateWDVFromPurchase(cappedPrice, purchase.purchaseDate || null, yearsUsed);
      isEstimated = true;
    }

    if (wdv <= 0) return { amount: 0, isEstimated };

    const { start: fyStart, end: fyEnd, daysInFY } = getCurrentFY();
    const startDate = purchase.dateFirstUsed ? new Date(purchase.dateFirstUsed) : purchase.purchaseDate ? new Date(purchase.purchaseDate) : null;
    let daysOwned = daysInFY;
    if (startDate && startDate > fyStart) {
      daysOwned = Math.max(0, Math.min(Math.round((fyEnd.getTime() - startDate.getTime()) / 86400000), daysInFY));
    }
    const proRataFraction = daysOwned / daysInFY;
    const amount = Math.round(wdv * DV_RATE * proRataFraction * 100) / 100;
    return { amount, isEstimated };
  } catch {
    return { amount: 0, isEstimated: false };
  }
}

function getFinanceInterest(): number {
  try {
    const purchase = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
    const ownership = purchase.ownershipType || purchase.financeType || 'Owned';
    if (ownership === 'Financed') {
      if (purchase.financeInputMode === 'Advanced') {
        const loan = parseFloat(purchase.loanAmount) || 0;
        const rate = parseFloat(purchase.interestRate) || 0;
        if (loan > 0 && rate > 0) return Math.round(loan * (rate / 100) * 100) / 100;
      }
      return parseFloat(purchase.estimatedAnnualInterest) || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

function getLeasePayments(): number {
  try {
    const purchase = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
    const ownership = purchase.ownershipType || purchase.financeType || 'Owned';
    if (ownership === 'Leased') {
      const amt = parseFloat(purchase.leasePaymentAmount) || 0;
      if (amt <= 0) return 0;
      const freq = purchase.leasePaymentFrequency || 'Monthly';
      if (freq === 'Weekly') return Math.round(amt * 52 * 100) / 100;
      if (freq === 'Fortnightly') return Math.round(amt * 26 * 100) / 100;
      return Math.round(amt * 12 * 100) / 100;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function getVehicleCostsDetailed(): VehicleCostsDetailed {
  const missingCategories: string[] = [];

  let manual = 0;
  try {
    const exps = JSON.parse(localStorage.getItem('wc_expenses') || '[]');
    manual = exps.filter((e: any) => !e.estimated).reduce((s: number, e: any) => s + (e.amount || 0), 0);
  } catch {}

  if (manual === 0) {
    missingCategories.push('Registration');
    missingCategories.push('Insurance');
    missingCategories.push('Repairs & maintenance');
  }

  let fuelConsumption = 10;
  try {
    const fc = parseFloat(localStorage.getItem('wc_fuel_consumption') || '');
    if (fc > 0) fuelConsumption = fc;
  } catch {}

  let avgFuelPrice = 1.95;
  try {
    const settings = JSON.parse(localStorage.getItem('wc_settings') || '{}');
    const p = parseFloat(settings.avgFuelPrice);
    if (p > 0) avgFuelPrice = p;
  } catch {}

  const totalAnnualKm = 15000;
  const fuelEstimate = Math.round(totalAnnualKm / 100 * fuelConsumption * avgFuelPrice * 100) / 100;

  const depResult = calculateDepreciation();
  const depreciation = depResult.amount;

  if (depreciation === 0) {
    missingCategories.push('Depreciation (needs purchase price or WDV)');
  }

  const financeInterest = getFinanceInterest();
  const leasePayments = getLeasePayments();

  try {
    const purchase = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
    const ownership = purchase.ownershipType || purchase.financeType || 'Owned';
    if (ownership === 'Financed' && financeInterest === 0) {
      missingCategories.push('Loan interest');
    }
    if (ownership === 'Leased' && leasePayments === 0) {
      missingCategories.push('Lease payments');
    }
  } catch {}

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
