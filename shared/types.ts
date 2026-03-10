// ============================================================
// DATABASE TYPES
// These match the Supabase tables exactly.
// Used by the data service layer.
// ============================================================

// ── Enums ──

export type UserRole = 'platform_owner' | 'internal_admin' | 'partner_admin' | 'company_admin' | 'driver';
export type OnboardingState = 'started' | 'vehicle_pending' | 'logbook_pending' | 'active' | 'dormant' | 'churned';
export type PartnerStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type CompanyStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type VehicleStatus = 'active' | 'sold' | 'disposed';
export type VehicleUse = 'business' | 'mixed' | 'personal';
export type VehicleDataSource = 'manual' | 'lookup' | 'imported';
export type FinanceType = 'none' | 'chattel_mortgage' | 'lease' | 'hire_purchase' | 'loan' | 'cash';
export type DepreciationMethod = 'diminishing_value' | 'prime_cost';
export type TripClassification = 'business' | 'personal' | 'unclassified';
export type TripSource = 'manual' | 'auto_gps' | 'imported';
export type ExpenseCategory = 'fuel' | 'insurance' | 'registration' | 'maintenance' | 'finance_interest' | 'tolls' | 'parking' | 'other';
export type ExtractionStatus = 'pending' | 'processing' | 'extracted' | 'confirmed' | 'failed';
export type ReportType = 'expense_report' | 'logbook_report' | 'deduction_estimate' | 'trip_log';
export type LogbookStatus = 'active' | 'completed' | 'expired' | 'cancelled';
export type AttributionSourceType = 'partner_link' | 'qr_code' | 'referral' | 'direct' | 'company_invite' | 'organic' | 'campaign';
export type DeviceType = 'ios' | 'android' | 'web';
export type EstimatorMode = 'industry' | 'personalised';
export type AuState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

// ── Database Row Types (what Supabase returns) ──

export interface DbProfile {
  id: string;
  partner_id: string;
  company_id: string | null;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  state: AuState | null;
  onboarding_state: OnboardingState;
  income_bracket: string | null;
  employment_status: string | null;
  occupation: string | null;
  industry: string | null;
  estimator_mode: EstimatorMode;
  settings: Record<string, any>;
  business_name: string | null;
  abn: string | null;
  accountant_name: string | null;
  accountant_email: string | null;
  accountant_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number | null;
  variant: string | null;
  rego: string | null;
  rego_state: AuState | null;
  vin: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  is_new_at_purchase: boolean | null;
  primary_use: VehicleUse;
  odometer_at_start: number | null;
  depreciation_method: DepreciationMethod;
  effective_life_years: number | null;
  wdv_at_start_of_fy: number | null;
  is_wdv_confirmed: boolean;
  data_source: VehicleDataSource;
  status: VehicleStatus;
  sold_date: string | null;
  sold_price: number | null;
  // App-specific columns
  vehicle_category: string | null;
  body_type: string | null;
  fuel_consumption: number | null;
  vehicle_history_status: string | null;
  depreciation_input_mode: string | null;
  prior_depreciation_claimed: number | null;
  date_first_business_use: string | null;
  approx_years_owned: number | null;
  approx_years_business_use: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DbVehicleFinance {
  id: string;
  vehicle_id: string;
  finance_type: FinanceType;
  lender: string | null;
  loan_amount: number | null;
  interest_rate: number | null;
  term_months: number | null;
  start_date: string | null;
  monthly_payment: number | null;
  interest_ytd: number | null;
  is_interest_confirmed: boolean;
  balloon_amount: number | null;
  finance_input_mode: string | null;
  lease_payment_frequency: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DbTrip {
  id: string;
  vehicle_id: string;
  user_id: string;
  start_location: string | null;
  end_location: string | null;
  start_address: string | null;
  end_address: string | null;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  start_time: string | null;
  end_time: string | null;
  distance_km: number;
  classification: TripClassification;
  purpose: string | null;
  source: TripSource;
  logbook_period_id: string | null;
  fy: string | null;
  // App-specific columns
  notes: string | null;
  odo_start: number | null;
  odo_end: number | null;
  odo_verified: boolean;
  has_photo: boolean;
  purpose_category: string | null;
  is_auto_generated: boolean;
  is_gap_confirmed: boolean;
  stops: string[];
  duration_minutes: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DbExpense {
  id: string;
  vehicle_id: string;
  user_id: string;
  category: ExpenseCategory;
  amount: number;
  gst_amount: number | null;
  date: string;
  description: string | null;
  vendor: string | null;
  is_confirmed: boolean;
  is_estimated: boolean;
  fy: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbReceipt {
  id: string;
  expense_id: string | null;
  user_id: string;
  image_url: string;
  image_thumbnail_url: string | null;
  extracted_data: Record<string, any> | null;
  confirmed_data: Record<string, any> | null;
  extraction_status: ExtractionStatus;
  extraction_confidence: number | null;
  extraction_errors: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface DbLogbookPeriod {
  id: string;
  user_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string | null;
  status: LogbookStatus;
  business_percentage: number | null;
  total_kms: number | null;
  business_kms: number | null;
  fy: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbReport {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  report_type: ReportType;
  fy: string;
  is_snapshot: boolean;
  data_snapshot: Record<string, any> | null;
  title: string | null;
  notes: string | null;
  generated_at: string;
  exported_at: string | null;
  export_format: string | null;
  created_at: string;
}

export interface DbPartner {
  id: string;
  name: string;
  slug: string;
  status: PartnerStatus;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBrandingConfig {
  id: string;
  partner_id: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  display_name: string | null;
  support_email: string | null;
  support_phone: string | null;
  splash_url: string | null;
  favicon_url: string | null;
  custom_css: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DbAttributionRecord {
  id: string;
  user_id: string;
  source_type: AttributionSourceType;
  source_id: string | null;
  partner_id: string | null;
  company_id: string | null;
  campaign: string | null;
  channel: string | null;
  referral_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  landing_url: string | null;
  device: DeviceType | null;
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  changes_json: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ── App-Level Types (what your components use) ──
// These map from DB types to the shapes your app expects.

export interface AppTrip {
  id: string;
  vehicleId: string;
  date: string;           // Formatted display date, e.g. "Mon, 24 Feb"
  day: number;
  month: number;
  year: number;
  time: string;           // e.g. "7:30–8:22 AM"
  duration: string;       // e.g. "52 min"
  km: number;
  from: string;
  fromSub: string;
  to: string;
  toSub: string;
  type: 'business' | 'personal' | null;
  verified: boolean;
  photo: boolean;
  odoReading: number | null;
  odoStartReading: number | null;
  purposeLabel: string | null;
  purposeIndex: number | null;
  stops: string[];
  notes: string;
  autoGenerated: boolean;
  gapConfirmed: boolean;
  // DB reference
  dbId: string;
  logbookPeriodId: string | null;
  fy: string | null;
}

export interface AppExpense {
  id: string;
  vehicleId: string;
  category: string;
  amount: number;
  gstAmount: number | null;
  date: string;
  description: string | null;
  vendor: string | null;
  isConfirmed: boolean;
  isEstimated: boolean;
  fy: string | null;
  receiptId: string | null;
}

export interface AppVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  variant: string | null;
  rego: string | null;
  regoState: AuState | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  isNewAtPurchase: boolean | null;
  primaryUse: VehicleUse;
  odometerAtStart: number | null;
  depreciationMethod: DepreciationMethod;
  effectiveLifeYears: number | null;
  wdvAtStartOfFy: number | null;
  isWdvConfirmed: boolean;
  // App-specific
  vehicleCategory: string | null;
  bodyType: string | null;
  fuelConsumption: number | null;
  vehicleHistoryStatus: string | null;
  depreciationInputMode: string | null;
  priorDepreciationClaimed: number | null;
  dateFirstBusinessUse: string | null;
  approxYearsOwned: number | null;
  approxYearsBusinessUse: number | null;
  status: VehicleStatus;
  metadata: Record<string, any>;
}

export interface AppVehicleFinance {
  id: string;
  vehicleId: string;
  financeType: FinanceType;
  lender: string | null;
  loanAmount: number | null;
  interestRate: number | null;
  termMonths: number | null;
  startDate: string | null;
  monthlyPayment: number | null;
  interestYtd: number | null;
  isInterestConfirmed: boolean;
  balloonAmount: number | null;
  financeInputMode: string | null;
  leasePaymentFrequency: string | null;
}

export interface AppLogbookPeriod {
  id: string;
  vehicleId: string;
  startDate: string;
  endDate: string | null;
  status: LogbookStatus;
  businessPercentage: number | null;
  totalKms: number | null;
  businessKms: number | null;
  fy: string | null;
}

export interface AppReport {
  id: string;
  vehicleId: string | null;
  reportType: ReportType;
  fy: string;
  isSnapshot: boolean;
  dataSnapshot: Record<string, any> | null;
  title: string | null;
  generatedAt: string;
}

export interface AppProfile {
  id: string;
  partnerId: string;
  companyId: string | null;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  state: AuState | null;
  onboardingState: OnboardingState;
  incomeBracket: string | null;
  employmentStatus: string | null;
  occupation: string | null;
  industry: string | null;
  estimatorMode: EstimatorMode;
  settings: Record<string, any>;
  businessName: string | null;
  abn: string | null;
  accountantName: string | null;
  accountantEmail: string | null;
  accountantPhone: string | null;
}

// ── Helper: Financial Year ──

export function getCurrentFY(): string {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${fyStartYear}-${fyStartYear + 1}`;
}
