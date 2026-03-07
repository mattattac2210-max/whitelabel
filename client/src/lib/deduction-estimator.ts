export type DeductionState = 'locked' | 'partial' | 'active';

export interface ReadinessCheck {
  taxProfileComplete: boolean;
  vehiclePurchaseComplete: boolean;
  wdvEntered: boolean;
  purchasePriceEntered: boolean;
  businessUseEstablished: boolean;
  someExpensesEntered: boolean;
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
  total: number;
  missingCategories: string[];
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
  try {
    const purchase = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
    purchasePriceEntered = !!(purchase.purchasePrice && parseFloat(purchase.purchasePrice) > 0);
    wdvEntered = !!(purchase.currentWDV && parseFloat(purchase.currentWDV) > 0);
    vehiclePurchaseComplete = purchasePriceEntered && !!purchase.purchaseDate;
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
  };
}

export function getDeductionState(checks: ReadinessCheck, showDeductionEstimates: boolean): DeductionState {
  if (!showDeductionEstimates) return 'locked';

  const hasPriceOrWDV = checks.purchasePriceEntered || checks.wdvEntered;
  if (!hasPriceOrWDV && !checks.businessUseEstablished) return 'locked';

  const allComplete =
    checks.taxProfileComplete &&
    checks.vehiclePurchaseComplete &&
    (checks.wdvEntered || checks.purchasePriceEntered) &&
    checks.businessUseEstablished &&
    checks.someExpensesEntered;

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
  if (!checks.purchasePriceEntered && !checks.wdvEntered) {
    items.push({ label: 'Vehicle purchase price or WDV', screen: 'account' });
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
  if (checks.taxProfileComplete) {
    items.push({ label: 'Tax profile complete' });
  }
  if (checks.vehiclePurchaseComplete) {
    items.push({ label: 'Vehicle purchase details entered' });
  }
  if (checks.wdvEntered) {
    items.push({ label: 'Written Down Value entered' });
  }
  if (checks.purchasePriceEntered) {
    items.push({ label: 'Purchase price entered' });
  }
  if (checks.businessUseEstablished) {
    items.push({ label: 'Business use locations set' });
  }
  if (checks.someExpensesEntered) {
    items.push({ label: 'Vehicle expenses recorded' });
  }
  return items;
}

export function getEstimateDisclaimer(state: DeductionState): string {
  switch (state) {
    case 'locked':
      return 'Complete your profile to unlock deduction estimates.';
    case 'partial':
      return 'Estimate is approximate — add more details for a more accurate figure. Not tax advice.';
    case 'active':
      return 'This is an indicative estimate only and does not constitute tax advice. Consult a registered tax agent.';
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

function calculateDepreciation(): number {
  try {
    const purchase = JSON.parse(localStorage.getItem('wc_vehicle_purchase') || '{}');
    const purchasePrice = parseFloat(purchase.purchasePrice) || 0;
    const currentWDV = parseFloat(purchase.currentWDV) || 0;
    const previouslyClaimed = parseFloat(purchase.previouslyClaimed) || 0;

    const cappedPrice = Math.min(purchasePrice, ATO_CAR_LIMIT);

    let base: number;
    if (currentWDV > 0) {
      base = currentWDV;
    } else if (cappedPrice > 0) {
      base = cappedPrice - previouslyClaimed;
    } else {
      return 0;
    }

    if (base <= 0) return 0;

    const { start: fyStart, end: fyEnd, daysInFY } = getCurrentFY();

    let daysOwned = daysInFY;
    const dateFirstUsed = purchase.dateFirstUsed ? new Date(purchase.dateFirstUsed) : null;
    const purchaseDate = purchase.purchaseDate ? new Date(purchase.purchaseDate) : null;

    const effectiveStartDate = dateFirstUsed || purchaseDate;

    if (effectiveStartDate && effectiveStartDate > fyStart) {
      daysOwned = Math.max(0, Math.min(
        Math.round((fyEnd.getTime() - effectiveStartDate.getTime()) / 86400000),
        daysInFY
      ));
    }

    const proRataFraction = daysOwned / daysInFY;
    return Math.round(base * DV_RATE * proRataFraction * 100) / 100;
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
    missingCategories.push('Vehicle running expenses (insurance, rego, servicing, etc.)');
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

  const depreciation = calculateDepreciation();

  if (depreciation === 0) {
    missingCategories.push('Vehicle depreciation (needs purchase price or WDV)');
  }

  const total = manual + fuelEstimate + depreciation;

  return {
    manual,
    fuelEstimate,
    depreciation,
    total,
    missingCategories,
  };
}
