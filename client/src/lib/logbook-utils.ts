// ============================================================
// LOGBOOK UTILS
// Pure helper functions for logbook period calculations.
// All data is passed as parameters — no localStorage reads.
// ============================================================

import type { AppLogbookPeriod } from '@shared/types';

// ── Types ────────────────────────────────────────────────────

export type LogbookStatusDisplay =
  | 'not-started'
  | 'in-progress'
  | 'expiring-soon'
  | 'completed'
  | 'expired'
  | 'archived';

export interface LogbookSummary {
  status: LogbookStatusDisplay;
  statusLabel: string;
  daysRemaining: number | null;
  daysElapsed: number | null;
  totalDays: number | null;
  progressPct: number;
  businessPct: number | null;
  isValid: boolean;
  validUntil: string | null;
  canArchive: boolean;
  warningMessage: string | null;
}

export interface TripDateValidation {
  isWithinPeriod: boolean;
  isBeforePeriod: boolean;
  isAfterPeriod: boolean;
  message: string | null;
}

// ── Constants ────────────────────────────────────────────────

/** ATO minimum logbook period in days */
const MIN_LOGBOOK_DAYS = 12 * 7; // 12 weeks = 84 days

/** Days before end date when we show "expiring soon" warning */
const EXPIRING_SOON_THRESHOLD_DAYS = 14;

/** How many years a completed logbook is valid */
const LOGBOOK_VALID_YEARS = 5;

// ── Date helpers ─────────────────────────────────────────────

function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Core status calculator ───────────────────────────────────

/**
 * Compute a full display summary for a logbook period.
 * Pass the period and an optional reference date (defaults to today).
 */
export function getLogbookSummary(
  period: AppLogbookPeriod | null | undefined,
  referenceDate: Date = new Date()
): LogbookSummary {
  const empty: LogbookSummary = {
    status: 'not-started',
    statusLabel: 'Not started',
    daysRemaining: null,
    daysElapsed: null,
    totalDays: null,
    progressPct: 0,
    businessPct: null,
    isValid: false,
    validUntil: null,
    canArchive: false,
    warningMessage: null,
  };

  if (!period) return empty;

  const start = parseDate(period.startDate);
  const end = parseDate(period.endDate);

  if (!start) return empty;

  const totalDays = end ? daysBetween(start, end) : MIN_LOGBOOK_DAYS;
  const daysElapsed = Math.max(0, Math.min(daysBetween(start, referenceDate), totalDays));
  const daysRemaining = end ? Math.max(0, daysBetween(referenceDate, end)) : null;
  const progressPct = totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;
  const businessPct = period.businessPercentage ?? null;

  // Completed logbook — check 5-year validity
  if (period.status === 'completed') {
    const completedAt = end ?? start;
    const validUntilDate = new Date(completedAt);
    validUntilDate.setFullYear(validUntilDate.getFullYear() + LOGBOOK_VALID_YEARS);
    const isStillValid = referenceDate < validUntilDate;
    return {
      status: isStillValid ? 'completed' : 'expired',
      statusLabel: isStillValid ? 'Complete' : 'Expired',
      daysRemaining: isStillValid ? Math.max(0, daysBetween(referenceDate, validUntilDate)) : 0,
      daysElapsed,
      totalDays,
      progressPct: 100,
      businessPct,
      isValid: isStillValid,
      validUntil: formatDate(validUntilDate),
      canArchive: true,
      warningMessage: isStillValid
        ? null
        : `This logbook expired on ${formatDate(validUntilDate)} and must be renewed.`,
    };
  }

  // Archived
  if (period.status === 'archived') {
    return {
      ...empty,
      status: 'archived',
      statusLabel: 'Archived',
      daysElapsed,
      totalDays,
      progressPct,
      businessPct,
      canArchive: false,
    };
  }

  // Active
  if (period.status === 'active') {
    if (!end || referenceDate <= end) {
      const expiringSoon = daysRemaining !== null && daysRemaining <= EXPIRING_SOON_THRESHOLD_DAYS;
      return {
        status: expiringSoon ? 'expiring-soon' : 'in-progress',
        statusLabel: expiringSoon ? 'Finishing soon' : 'In progress',
        daysRemaining,
        daysElapsed,
        totalDays,
        progressPct,
        businessPct,
        isValid: false, // Not valid until completed
        validUntil: null,
        canArchive: false,
        warningMessage: expiringSoon
          ? `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left — complete your logbook soon.`
          : null,
      };
    }

    // Past the end date but not marked complete
    return {
      status: 'expired',
      statusLabel: 'Overdue',
      daysRemaining: 0,
      daysElapsed,
      totalDays,
      progressPct: 100,
      businessPct,
      isValid: false,
      validUntil: null,
      canArchive: true,
      warningMessage: 'Your logbook period has ended. Mark it as complete to lock in your business percentage.',
    };
  }

  return empty;
}

// ── Trip date validation ─────────────────────────────────────

/**
 * Check whether a trip date falls within a logbook period.
 * tripDate: ISO date string or Date object.
 */
export function validateTripDate(
  tripDate: string | Date,
  period: AppLogbookPeriod | null | undefined
): TripDateValidation {
  const noCheck: TripDateValidation = {
    isWithinPeriod: true,
    isBeforePeriod: false,
    isAfterPeriod: false,
    message: null,
  };

  if (!period) return noCheck;

  const start = parseDate(period.startDate);
  const end = parseDate(period.endDate);
  const trip = typeof tripDate === 'string' ? parseDate(tripDate) : tripDate;

  if (!start || !trip) return noCheck;

  const isBeforePeriod = trip < start;
  const isAfterPeriod = end ? trip > end : false;
  const isWithinPeriod = !isBeforePeriod && !isAfterPeriod;

  return {
    isWithinPeriod,
    isBeforePeriod,
    isAfterPeriod,
    message: isBeforePeriod
      ? `This trip is before the logbook period (started ${formatDate(start)}).`
      : isAfterPeriod
        ? `This trip is after the logbook period ended (${end ? formatDate(end) : 'unknown'}).`
        : null,
  };
}

// ── Archive check ───────────────────────────────────────────

/**
 * Determine whether a logbook period is eligible to be archived.
 * A period can be archived once it is completed or its end date has passed.
 */
export function canArchiveLogbook(
  period: AppLogbookPeriod | null | undefined,
  referenceDate: Date = new Date()
): boolean {
  if (!period) return false;
  if (period.status === 'completed' || period.status === 'expired') return true;
  if (period.status === 'archived') return false;
  const end = parseDate(period.endDate);
  return end ? referenceDate > end : false;
}

// ── Business % calculator ───────────────────────────────────

/**
 * Calculate business use percentage from raw km figures.
 * Pass in the trips for the period.
 */
export function calcBusinessPercentage(
  businessKm: number,
  totalKm: number
): number {
  if (totalKm <= 0) return 0;
  return Math.round((businessKm / totalKm) * 10000) / 100; // 2 decimal places
}

// ── Period progress label ───────────────────────────────────

/**
 * Return a human-readable progress string for use in UI badges.
 * e.g. "Week 6 of 12" or "Day 42 of 84"
 */
export function getLogbookProgressLabel(
  period: AppLogbookPeriod | null | undefined,
  referenceDate: Date = new Date()
): string {
  if (!period) return '';
  const start = parseDate(period.startDate);
  if (!start) return '';

  const elapsed = Math.max(0, daysBetween(start, referenceDate));
  const totalDays = period.endDate
    ? daysBetween(start, new Date(period.endDate))
    : MIN_LOGBOOK_DAYS;

  const weekElapsed = Math.min(Math.floor(elapsed / 7) + 1, 12);
  const weekTotal = Math.round(totalDays / 7);

  if (period.status === 'completed') return 'Complete';
  if (period.status === 'archived') return 'Archived';
  return `Week ${weekElapsed} of ${weekTotal}`;
}

// ── Active period finder ──────────────────────────────────────

/**
 * Find the most relevant logbook period from a list.
 * Priority: active > most recently started.
 */
export function getActivePeriod(
  periods: AppLogbookPeriod[]
): AppLogbookPeriod | null {
  if (!periods.length) return null;
  const active = periods.find(p => p.status === 'active');
  if (active) return active;
  return [...periods].sort((a, b) => {
    const da = parseDate(a.startDate)?.getTime() ?? 0;
    const db = parseDate(b.startDate)?.getTime() ?? 0;
    return db - da;
  })[0] ?? null;
}

// ── Convenience wrappers (take period for context-aware consumers) ──

/** Returns the status display for a logbook period, with start/end dates for display. */
export function getLogbookStatus(
  period: AppLogbookPeriod | null | undefined,
  referenceDate: Date = new Date()
): LogbookSummary & { startDate: Date | null; endDate: Date | null; expired?: boolean; graceActive?: boolean } {
  const summary = getLogbookSummary(period, referenceDate);
  return {
    ...summary,
    startDate: period ? parseDate(period.startDate) : null,
    endDate: period ? parseDate(period.endDate) : null,
    expired: summary.status === 'expired',
    graceActive: false,
  };
}

/** Returns true if the period is archived. */
export function isLogbookArchived(
  period: AppLogbookPeriod | null | undefined
): boolean {
  return period?.status === 'archived';
}

/** Validates a restart code string. */
export function validateRestartCode(code: string): boolean {
  const trimmed = code.trim().toUpperCase();
  return trimmed === 'RESTART' || trimmed === 'RESET';
}
