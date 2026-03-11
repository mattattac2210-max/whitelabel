/**
 * Recurring trip templates for Basic Book mode.
 * Users define route templates and apply them to date ranges to bulk-add trips.
 */

import type { Trip } from './trip-data';
import { CATEGORIES } from './trip-data';

const STORAGE_KEY = 'wc_recurring_trips_v1';

function normAddr(addr: string): string {
  return addr.toLowerCase().replace(/\s+/g, ' ').trim().split(',')[0] || '';
}

export interface RecurringTemplate {
  id: string;
  fromAddress: string;
  toAddress: string;
  km: number;
  duration: string;
  defaultTime: string; // "08:00" or "HH:mm"
  purposeIndex: number | null;
  label: string;
}

function load(): RecurringTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(data: RecurringTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded */
  }
}

export function getRecurringTemplates(): RecurringTemplate[] {
  return load();
}

export function addRecurringTemplate(
  template: Omit<RecurringTemplate, 'id'>
): RecurringTemplate {
  const templates = load();
  const newTemplate: RecurringTemplate = {
    ...template,
    id: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  };
  templates.push(newTemplate);
  persist(templates);
  return newTemplate;
}

export function updateRecurringTemplate(
  id: string,
  updates: Partial<Omit<RecurringTemplate, 'id'>>
): void {
  const templates = load();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx >= 0) {
    templates[idx] = { ...templates[idx], ...updates };
    persist(templates);
  }
}

export function deleteRecurringTemplate(id: string): void {
  const templates = load().filter((t) => t.id !== id);
  persist(templates);
}

/**
 * Check if a trip already exists for the given date and route.
 * Uses normalised from/to (first part of address) for comparison.
 */
export function hasExistingTripForDateAndRoute(
  trips: Trip[],
  date: Date,
  from: string,
  to: string
): boolean {
  const nFrom = normAddr(from);
  const nTo = normAddr(to);
  const dYear = date.getFullYear();
  const dMonth = date.getMonth();
  const dDay = date.getDate();

  return trips.some((t) => {
    if (t.year !== dYear || t.month !== dMonth || t.day !== dDay) return false;
    return normAddr(t.from + (t.fromSub ? ', ' + t.fromSub : '')) === nFrom
      && normAddr(t.to + (t.toSub ? ', ' + t.toSub : '')) === nTo;
  });
}

function extractFromAddress(addr: string): { main: string; sub: string } {
  const parts = addr.split(',').map((p) => p.trim());
  return {
    main: parts[0] || '',
    sub: parts.slice(1).join(', ').trim(),
  };
}

function formatTimeForDisplay(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr || '0', 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m} ${ampm}`;
}

export interface GenerateResult {
  trips: Trip[];
  skipped: number;
}

/**
 * Generate Trip[] from a template for the given date range.
 * - Only includes dates up to and including today (no future dates).
 * - Skips dates that already have a matching trip.
 * - If weekdaysOnly, only includes Mon–Fri.
 */
export function generateTripsFromTemplate(
  template: RecurringTemplate,
  startDate: Date,
  endDate: Date,
  weekdaysOnly: boolean,
  existingTrips: Trip[] = []
): GenerateResult {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  if (end > today) {
    end.setTime(today.getTime());
  }

  const fromParts = extractFromAddress(template.fromAddress);
  const toParts = extractFromAddress(template.toAddress);
  const timeStr = formatTimeForDisplay(template.defaultTime);
  const purposeLabel =
    template.purposeIndex != null && template.purposeIndex >= 0 && template.purposeIndex < CATEGORIES.length
      ? CATEGORIES[template.purposeIndex].label
      : null;

  const trips: Trip[] = [];
  let skipped = 0;

  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    if (weekdaysOnly) {
      const dow = cursor.getDay();
      if (dow === 0 || dow === 6) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
    }

    if (
      hasExistingTripForDateAndRoute(
        existingTrips,
        cursor,
        template.fromAddress,
        template.toAddress
      )
    ) {
      skipped++;
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const dateStr = `${dayNames[cursor.getDay()]}, ${cursor.getDate()} ${monthNames[cursor.getMonth()]}`;

    const trip: Trip = {
      id: `rec_${cursor.getTime()}_${trips.length}`,
      date: dateStr,
      day: cursor.getDate(),
      month: cursor.getMonth(),
      year: cursor.getFullYear(),
      time: timeStr,
      duration: template.duration || '',
      km: template.km,
      from: fromParts.main,
      fromSub: fromParts.sub,
      to: toParts.main,
      toSub: toParts.sub,
      type: null,
      verified: false,
      photo: false,
      odoReading: null,
      odoStartReading: null,
      purposeLabel,
      purposeIndex: template.purposeIndex,
      stops: [],
      notes: '',
    };

    trips.push(trip);
    cursor.setDate(cursor.getDate() + 1);
  }

  return { trips, skipped };
}
