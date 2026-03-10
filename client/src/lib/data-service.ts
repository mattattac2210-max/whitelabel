// ============================================================
// DATA SERVICE LAYER
// Bridge between your app components and Supabase.
// All field name translation happens here.
// ============================================================

import { supabase } from './supabase';
import type {
  DbProfile, DbVehicle, DbVehicleFinance, DbTrip, DbExpense,
  DbReceipt, DbLogbookPeriod, DbReport, DbBrandingConfig,
  AppProfile, AppVehicle, AppVehicleFinance, AppTrip, AppExpense,
  AppLogbookPeriod, AppReport,
  TripClassification, ExpenseCategory, ReportType, FinanceType,
  LogbookStatus, EstimatorMode,
} from '@shared/types';
import { getCurrentFY } from '@shared/types';
import { CATEGORIES } from './trip-data';


// ════════════════════════════════════════════════════════════
// MAPPERS: Convert between DB rows and App shapes
// ════════════════════════════════════════════════════════════

// ── Profile ──

function mapDbToAppProfile(db: DbProfile): AppProfile {
  return {
    id: db.id,
    partnerId: db.partner_id,
    companyId: db.company_id,
    role: db.role,
    firstName: db.first_name,
    lastName: db.last_name,
    phone: db.phone,
    state: db.state,
    onboardingState: db.onboarding_state,
    incomeBracket: db.income_bracket,
    employmentStatus: db.employment_status,
    occupation: db.occupation,
    industry: db.industry,
    estimatorMode: db.estimator_mode,
    settings: db.settings || {},
    businessName: db.business_name,
    abn: db.abn,
    accountantName: db.accountant_name,
    accountantEmail: db.accountant_email,
    accountantPhone: db.accountant_phone,
  };
}

// ── Vehicle ──

function mapDbToAppVehicle(db: DbVehicle): AppVehicle {
  return {
    id: db.id,
    make: db.make,
    model: db.model,
    year: db.year,
    variant: db.variant,
    rego: db.rego,
    regoState: db.rego_state,
    purchaseDate: db.purchase_date,
    purchasePrice: db.purchase_price,
    isNewAtPurchase: db.is_new_at_purchase,
    primaryUse: db.primary_use,
    odometerAtStart: db.odometer_at_start,
    depreciationMethod: db.depreciation_method,
    effectiveLifeYears: db.effective_life_years,
    wdvAtStartOfFy: db.wdv_at_start_of_fy,
    isWdvConfirmed: db.is_wdv_confirmed,
    vehicleCategory: db.vehicle_category,
    bodyType: db.body_type,
    fuelConsumption: db.fuel_consumption,
    vehicleHistoryStatus: db.vehicle_history_status,
    depreciationInputMode: db.depreciation_input_mode,
    priorDepreciationClaimed: db.prior_depreciation_claimed,
    dateFirstBusinessUse: db.date_first_business_use,
    approxYearsOwned: db.approx_years_owned,
    approxYearsBusinessUse: db.approx_years_business_use,
    status: db.status,
    metadata: db.metadata || {},
  };
}

function mapAppToDbVehicle(app: Partial<AppVehicle>): Record<string, any> {
  const map: Record<string, any> = {};
  if (app.make !== undefined) map.make = app.make;
  if (app.model !== undefined) map.model = app.model;
  if (app.year !== undefined) map.year = app.year;
  if (app.variant !== undefined) map.variant = app.variant;
  if (app.rego !== undefined) map.rego = app.rego;
  if (app.regoState !== undefined) map.rego_state = app.regoState;
  if (app.purchaseDate !== undefined) map.purchase_date = app.purchaseDate;
  if (app.purchasePrice !== undefined) map.purchase_price = app.purchasePrice;
  if (app.isNewAtPurchase !== undefined) map.is_new_at_purchase = app.isNewAtPurchase;
  if (app.primaryUse !== undefined) map.primary_use = app.primaryUse;
  if (app.odometerAtStart !== undefined) map.odometer_at_start = app.odometerAtStart;
  if (app.depreciationMethod !== undefined) map.depreciation_method = app.depreciationMethod;
  if (app.effectiveLifeYears !== undefined) map.effective_life_years = app.effectiveLifeYears;
  if (app.wdvAtStartOfFy !== undefined) map.wdv_at_start_of_fy = app.wdvAtStartOfFy;
  if (app.isWdvConfirmed !== undefined) map.is_wdv_confirmed = app.isWdvConfirmed;
  if (app.vehicleCategory !== undefined) map.vehicle_category = app.vehicleCategory;
  if (app.bodyType !== undefined) map.body_type = app.bodyType;
  if (app.fuelConsumption !== undefined) map.fuel_consumption = app.fuelConsumption;
  if (app.vehicleHistoryStatus !== undefined) map.vehicle_history_status = app.vehicleHistoryStatus;
  if (app.depreciationInputMode !== undefined) map.depreciation_input_mode = app.depreciationInputMode;
  if (app.priorDepreciationClaimed !== undefined) map.prior_depreciation_claimed = app.priorDepreciationClaimed;
  if (app.dateFirstBusinessUse !== undefined) map.date_first_business_use = app.dateFirstBusinessUse;
  if (app.approxYearsOwned !== undefined) map.approx_years_owned = app.approxYearsOwned;
  if (app.approxYearsBusinessUse !== undefined) map.approx_years_business_use = app.approxYearsBusinessUse;
  if (app.status !== undefined) map.status = app.status;
  if (app.metadata !== undefined) map.metadata = app.metadata;
  return map;
}

// ── Vehicle Finance ──

function mapDbToAppFinance(db: DbVehicleFinance): AppVehicleFinance {
  return {
    id: db.id,
    vehicleId: db.vehicle_id,
    financeType: db.finance_type,
    lender: db.lender,
    loanAmount: db.loan_amount,
    interestRate: db.interest_rate,
    termMonths: db.term_months,
    startDate: db.start_date,
    monthlyPayment: db.monthly_payment,
    interestYtd: db.interest_ytd,
    isInterestConfirmed: db.is_interest_confirmed,
    balloonAmount: db.balloon_amount,
    financeInputMode: db.finance_input_mode,
    leasePaymentFrequency: db.lease_payment_frequency,
  };
}

function mapAppToDbFinance(app: Partial<AppVehicleFinance>): Record<string, any> {
  const map: Record<string, any> = {};
  if (app.financeType !== undefined) map.finance_type = app.financeType;
  if (app.lender !== undefined) map.lender = app.lender;
  if (app.loanAmount !== undefined) map.loan_amount = app.loanAmount;
  if (app.interestRate !== undefined) map.interest_rate = app.interestRate;
  if (app.termMonths !== undefined) map.term_months = app.termMonths;
  if (app.startDate !== undefined) map.start_date = app.startDate;
  if (app.monthlyPayment !== undefined) map.monthly_payment = app.monthlyPayment;
  if (app.interestYtd !== undefined) map.interest_ytd = app.interestYtd;
  if (app.isInterestConfirmed !== undefined) map.is_interest_confirmed = app.isInterestConfirmed;
  if (app.balloonAmount !== undefined) map.balloon_amount = app.balloonAmount;
  if (app.financeInputMode !== undefined) map.finance_input_mode = app.financeInputMode;
  if (app.leasePaymentFrequency !== undefined) map.lease_payment_frequency = app.leasePaymentFrequency;
  return map;
}

// ── Trip ──

function formatTripDate(dateStr: string | null): { date: string; day: number; month: number; year: number } {
  if (!dateStr) return { date: '', day: 0, month: 0, year: 0 };
  const d = new Date(dateStr);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    date: `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`,
    day: d.getDate(),
    month: d.getMonth(),
    year: d.getFullYear(),
  };
}

function formatTripTime(startStr: string | null, endStr: string | null): string {
  if (!startStr) return '';
  const s = new Date(startStr);
  const fmt = (d: Date) => d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (!endStr) return fmt(s);
  const e = new Date(endStr);
  return `${fmt(s)}\u2013${fmt(e)}`;
}

function formatDuration(startStr: string | null, endStr: string | null, durationMin: number | null): string {
  if (durationMin) return `${durationMin} min`;
  if (!startStr || !endStr) return '';
  const mins = Math.round((new Date(endStr).getTime() - new Date(startStr).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

function purposeLabelToIndex(label: string | null): number | null {
  if (!label) return null;
  const idx = CATEGORIES.findIndex(c => c.label === label);
  return idx >= 0 ? idx : null;
}

function mapDbToAppTrip(db: DbTrip): AppTrip {
  const dateInfo = formatTripDate(db.start_time);
  const classification = db.classification === 'unclassified' ? null : db.classification;
  return {
    id: db.id,
    vehicleId: db.vehicle_id,
    dbId: db.id,
    date: dateInfo.date,
    day: dateInfo.day,
    month: dateInfo.month,
    year: dateInfo.year,
    time: formatTripTime(db.start_time, db.end_time),
    duration: formatDuration(db.start_time, db.end_time, db.duration_minutes),
    km: db.distance_km,
    from: db.start_location || '',
    fromSub: db.start_address || '',
    to: db.end_location || '',
    toSub: db.end_address || '',
    type: classification as 'business' | 'personal' | null,
    verified: db.odo_verified,
    photo: db.has_photo,
    odoReading: db.odo_end,
    odoStartReading: db.odo_start,
    purposeLabel: db.purpose_category,
    purposeIndex: purposeLabelToIndex(db.purpose_category),
    stops: db.stops || [],
    notes: db.notes || '',
    autoGenerated: db.is_auto_generated,
    gapConfirmed: db.is_gap_confirmed,
    logbookPeriodId: db.logbook_period_id,
    fy: db.fy,
  };
}

function mapAppToDbTrip(app: Partial<AppTrip> & { startTime?: string; endTime?: string }): Record<string, any> {
  const map: Record<string, any> = {};
  if (app.km !== undefined) map.distance_km = app.km;
  if (app.from !== undefined) map.start_location = app.from;
  if (app.fromSub !== undefined) map.start_address = app.fromSub;
  if (app.to !== undefined) map.end_location = app.to;
  if (app.toSub !== undefined) map.end_address = app.toSub;
  if (app.type !== undefined) map.classification = app.type || 'unclassified';
  if (app.purposeLabel !== undefined) map.purpose_category = app.purposeLabel;
  if (app.verified !== undefined) map.odo_verified = app.verified;
  if (app.photo !== undefined) map.has_photo = app.photo;
  if (app.odoReading !== undefined) map.odo_end = app.odoReading;
  if (app.odoStartReading !== undefined) map.odo_start = app.odoStartReading;
  if (app.notes !== undefined) map.notes = app.notes;
  if (app.stops !== undefined) map.stops = app.stops;
  if (app.autoGenerated !== undefined) map.is_auto_generated = app.autoGenerated;
  if (app.gapConfirmed !== undefined) map.is_gap_confirmed = app.gapConfirmed;
  if (app.startTime !== undefined) map.start_time = app.startTime;
  if (app.endTime !== undefined) map.end_time = app.endTime;
  if (app.logbookPeriodId !== undefined) map.logbook_period_id = app.logbookPeriodId;
  if (app.fy !== undefined) map.fy = app.fy;
  return map;
}

// ── Expense ──

function mapDbToAppExpense(db: DbExpense): AppExpense {
  return {
    id: db.id,
    vehicleId: db.vehicle_id,
    category: db.category,
    amount: db.amount,
    gstAmount: db.gst_amount,
    date: db.date,
    description: db.description,
    vendor: db.vendor,
    isConfirmed: db.is_confirmed,
    isEstimated: db.is_estimated,
    fy: db.fy,
    receiptId: null,
  };
}

function mapAppToDbExpense(app: Partial<AppExpense>): Record<string, any> {
  const map: Record<string, any> = {};
  if (app.category !== undefined) map.category = app.category;
  if (app.amount !== undefined) map.amount = app.amount;
  if (app.gstAmount !== undefined) map.gst_amount = app.gstAmount;
  if (app.date !== undefined) map.date = app.date;
  if (app.description !== undefined) map.description = app.description;
  if (app.vendor !== undefined) map.vendor = app.vendor;
  if (app.isConfirmed !== undefined) map.is_confirmed = app.isConfirmed;
  if (app.isEstimated !== undefined) map.is_estimated = app.isEstimated;
  if (app.fy !== undefined) map.fy = app.fy;
  return map;
}

// ── Logbook ──

function mapDbToAppLogbook(db: DbLogbookPeriod): AppLogbookPeriod {
  return {
    id: db.id,
    vehicleId: db.vehicle_id,
    startDate: db.start_date,
    endDate: db.end_date,
    status: db.status,
    businessPercentage: db.business_percentage,
    totalKms: db.total_kms,
    businessKms: db.business_kms,
    fy: db.fy,
  };
}

// ── Report ──

function mapDbToAppReport(db: DbReport): AppReport {
  return {
    id: db.id,
    vehicleId: db.vehicle_id,
    reportType: db.report_type,
    fy: db.fy,
    isSnapshot: db.is_snapshot,
    dataSnapshot: db.data_snapshot,
    title: db.title,
    generatedAt: db.generated_at,
  };
}


// ════════════════════════════════════════════════════════════
// PROFILE
// ════════════════════════════════════════════════════════════

export async function getProfile(): Promise<AppProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return mapDbToAppProfile(data as DbProfile);
}

export async function updateProfile(updates: Partial<AppProfile>): Promise<AppProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUpdates: Record<string, any> = {};
  if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
  if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.state !== undefined) dbUpdates.state = updates.state;
  if (updates.incomeBracket !== undefined) dbUpdates.income_bracket = updates.incomeBracket;
  if (updates.employmentStatus !== undefined) dbUpdates.employment_status = updates.employmentStatus;
  if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;
  if (updates.industry !== undefined) dbUpdates.industry = updates.industry;
  if (updates.estimatorMode !== undefined) dbUpdates.estimator_mode = updates.estimatorMode;
  if (updates.settings !== undefined) dbUpdates.settings = updates.settings;
  if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
  if (updates.abn !== undefined) dbUpdates.abn = updates.abn;
  if (updates.accountantName !== undefined) dbUpdates.accountant_name = updates.accountantName;
  if (updates.accountantEmail !== undefined) dbUpdates.accountant_email = updates.accountantEmail;
  if (updates.accountantPhone !== undefined) dbUpdates.accountant_phone = updates.accountantPhone;
  if (updates.onboardingState !== undefined) dbUpdates.onboarding_state = updates.onboardingState;

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', user.id)
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToAppProfile(data as DbProfile);
}

export async function updateSettings(settings: Record<string, any>): Promise<boolean> {
  const profile = await getProfile();
  if (!profile) return false;

  const merged = { ...profile.settings, ...settings };
  const result = await updateProfile({ settings: merged });
  return result !== null;
}


// ════════════════════════════════════════════════════════════
// VEHICLES
// ════════════════════════════════════════════════════════════

export async function getVehicles(): Promise<AppVehicle[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(v => mapDbToAppVehicle(v as DbVehicle));
}

export async function getVehicle(id: string): Promise<AppVehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapDbToAppVehicle(data as DbVehicle);
}

export async function saveVehicle(vehicle: Partial<AppVehicle>): Promise<AppVehicle | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbData = { user_id: user.id, ...mapAppToDbVehicle(vehicle) };

  const { data, error } = await supabase
    .from('vehicles')
    .insert(dbData)
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToAppVehicle(data as DbVehicle);
}

export async function updateVehicle(id: string, updates: Partial<AppVehicle>): Promise<AppVehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .update(mapAppToDbVehicle(updates))
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToAppVehicle(data as DbVehicle);
}

export async function deleteVehicle(id: string): Promise<boolean> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  return !error;
}


// ════════════════════════════════════════════════════════════
// VEHICLE FINANCE
// ════════════════════════════════════════════════════════════

export async function getVehicleFinance(vehicleId: string): Promise<AppVehicleFinance | null> {
  const { data, error } = await supabase
    .from('vehicle_finance')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .single();

  if (error || !data) return null;
  return mapDbToAppFinance(data as DbVehicleFinance);
}

export async function saveVehicleFinance(vehicleId: string, finance: Partial<AppVehicleFinance>): Promise<AppVehicleFinance | null> {
  const dbData = { vehicle_id: vehicleId, ...mapAppToDbFinance(finance) };

  // Upsert: insert or update if exists
  const { data, error } = await supabase
    .from('vehicle_finance')
    .upsert(dbData, { onConflict: 'vehicle_id' })
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToAppFinance(data as DbVehicleFinance);
}


// ════════════════════════════════════════════════════════════
// TRIPS
// ════════════════════════════════════════════════════════════

export async function getTrips(vehicleId: string, fy?: string): Promise<AppTrip[]> {
  let query = supabase
    .from('trips')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('start_time', { ascending: true });

  if (fy) query = query.eq('fy', fy);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(t => mapDbToAppTrip(t as DbTrip));
}

export async function getAllTrips(fy?: string): Promise<AppTrip[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true });

  if (fy) query = query.eq('fy', fy);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(t => mapDbToAppTrip(t as DbTrip));
}

/** Build ISO start_time from day/month/year and time string (e.g. "9:30 AM") */
function buildStartTimeFromTrip(trip: { day?: number; month?: number; year?: number; time?: string }): string | null {
  const { day, month, year, time } = trip;
  if (day == null || month == null || year == null || !time) return null;
  const m = time.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'AM' && hour === 12) hour = 0;
  if (ampm === 'PM' && hour !== 12) hour += 12;
  const d = new Date(year, month, day, hour, min);
  return d.toISOString();
}

export async function saveTrip(
  vehicleId: string,
  trip: Partial<AppTrip> & { startTime?: string; endTime?: string; day?: number; month?: number; year?: number; time?: string }
): Promise<AppTrip | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Build start_time from date/time when missing (Add Existing flow)
  const tripForDb = { ...trip };
  if (!tripForDb.startTime && trip.day != null && trip.month != null && trip.year != null && trip.time) {
    const built = buildStartTimeFromTrip(trip);
    if (built) tripForDb.startTime = built;
  }

  const dbData = {
    vehicle_id: vehicleId,
    user_id: user.id,
    fy: tripForDb.fy || getCurrentFY(),
    ...mapAppToDbTrip(tripForDb),
  };

  const { data, error } = await supabase
    .from('trips')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('[saveTrip] Supabase insert failed:', error);
    return null;
  }
  if (!data) return null;
  return mapDbToAppTrip(data as DbTrip);
}

export async function updateTrip(id: string, updates: Partial<AppTrip> & { startTime?: string; endTime?: string }): Promise<AppTrip | null> {
  const { data, error } = await supabase
    .from('trips')
    .update(mapAppToDbTrip(updates))
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToAppTrip(data as DbTrip);
}

export async function classifyTrip(id: string, type: 'business' | 'personal'): Promise<boolean> {
  const { error } = await supabase
    .from('trips')
    .update({ classification: type })
    .eq('id', id);

  return !error;
}

export async function setTripPurpose(id: string, purposeLabel: string): Promise<boolean> {
  const { error } = await supabase
    .from('trips')
    .update({ purpose_category: purposeLabel, purpose: purposeLabel })
    .eq('id', id);

  return !error;
}

export async function deleteTrip(id: string): Promise<boolean> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  return !error;
}


// ════════════════════════════════════════════════════════════
// EXPENSES
// ════════════════════════════════════════════════════════════

export async function getExpenses(vehicleId: string, fy?: string): Promise<AppExpense[]> {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('date', { ascending: false });

  if (fy) query = query.eq('fy', fy);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(e => mapDbToAppExpense(e as DbExpense));
}

export async function getAllExpenses(fy?: string): Promise<AppExpense[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (fy) query = query.eq('fy', fy);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(e => mapDbToAppExpense(e as DbExpense));
}

export async function saveExpense(vehicleId: string, expense: Partial<AppExpense>): Promise<AppExpense | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbData = {
    vehicle_id: vehicleId,
    user_id: user.id,
    fy: expense.fy || getCurrentFY(),
    ...mapAppToDbExpense(expense),
  };

  const { data, error } = await supabase
    .from('expenses')
    .insert(dbData)
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToAppExpense(data as DbExpense);
}

export async function updateExpense(id: string, updates: Partial<AppExpense>): Promise<AppExpense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .update(mapAppToDbExpense(updates))
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToAppExpense(data as DbExpense);
}

export async function deleteExpense(id: string): Promise<boolean> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  return !error;
}


// ════════════════════════════════════════════════════════════
// RECEIPTS
// ════════════════════════════════════════════════════════════

export async function uploadReceipt(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const fileName = `${user.id}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file);

  if (error || !data) return null;

  const { data: urlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function saveReceipt(expenseId: string | null, imageUrl: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('receipts')
    .insert({
      expense_id: expenseId,
      user_id: user.id,
      image_url: imageUrl,
      extraction_status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function confirmReceipt(id: string, confirmedData: Record<string, any>): Promise<boolean> {
  const { error } = await supabase
    .from('receipts')
    .update({
      confirmed_data: confirmedData,
      extraction_status: 'confirmed',
    })
    .eq('id', id);

  return !error;
}


// ════════════════════════════════════════════════════════════
// LOGBOOK PERIODS
// ════════════════════════════════════════════════════════════

export async function getLogbookPeriods(vehicleId: string): Promise<AppLogbookPeriod[]> {
  const { data, error } = await supabase
    .from('logbook_periods')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('start_date', { ascending: false });

  if (error || !data) return [];
  return data.map(l => mapDbToAppLogbook(l as DbLogbookPeriod));
}

export async function getActiveLogbook(vehicleId: string): Promise<AppLogbookPeriod | null> {
  const { data, error } = await supabase
    .from('logbook_periods')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'active')
    .single();

  if (error || !data) return null;
  return mapDbToAppLogbook(data as DbLogbookPeriod);
}

export async function startLogbook(vehicleId: string): Promise<AppLogbookPeriod | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('logbook_periods')
    .insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      fy: getCurrentFY(),
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToAppLogbook(data as DbLogbookPeriod);
}

export async function completeLogbook(id: string, stats: { businessPercentage: number; totalKms: number; businessKms: number }): Promise<boolean> {
  const { error } = await supabase
    .from('logbook_periods')
    .update({
      status: 'completed' as LogbookStatus,
      business_percentage: stats.businessPercentage,
      total_kms: stats.totalKms,
      business_kms: stats.businessKms,
    })
    .eq('id', id);

  return !error;
}


// ════════════════════════════════════════════════════════════
// REPORTS
// ════════════════════════════════════════════════════════════

export async function getReports(fy?: string): Promise<AppReport[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false });

  if (fy) query = query.eq('fy', fy);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(r => mapDbToAppReport(r as DbReport));
}

export async function saveReport(
  vehicleId: string,
  reportType: ReportType,
  snapshot: Record<string, any>,
  title?: string
): Promise<AppReport | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      report_type: reportType,
      fy: getCurrentFY(),
      is_snapshot: true,
      data_snapshot: snapshot,
      title: title || null,
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapDbToAppReport(data as DbReport);
}

export async function deleteReport(id: string): Promise<boolean> {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  return !error;
}


// ════════════════════════════════════════════════════════════
// BRANDING (read-only for app, managed by admin)
// ════════════════════════════════════════════════════════════

export async function getBranding(partnerId: string): Promise<DbBrandingConfig | null> {
  const { data, error } = await supabase
    .from('branding_configs')
    .select('*')
    .eq('partner_id', partnerId)
    .single();

  if (error || !data) return null;
  return data as DbBrandingConfig;
}

export async function getBrandingBySlug(slug: string): Promise<DbBrandingConfig | null> {
  const { data: partner, error: pError } = await supabase
    .from('partners')
    .select('id')
    .eq('slug', slug)
    .single();

  if (pError || !partner) return null;
  return getBranding(partner.id);
}


// ════════════════════════════════════════════════════════════
// AUDIT LOG (write-only from app)
// ════════════════════════════════════════════════════════════

export async function logAuditEvent(
  entityType: string,
  entityId: string | null,
  action: string,
  changes?: Record<string, any>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('audit_logs').insert({
    actor_id: user?.id || null,
    actor_role: null, // Will be set when we have role info cached
    entity_type: entityType,
    entity_id: entityId,
    action,
    changes_json: changes || null,
  });
  // Fire and forget — don't block on audit log writes
}
