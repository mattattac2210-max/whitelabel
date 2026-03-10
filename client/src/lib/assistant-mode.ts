// ============================================================
// ASSISTANT MODE
// Toggle and guides for the in-app assistant banner.
// ============================================================

import type { Screen } from './app-context';

const STORAGE_KEY = 'wc_assistant_mode';

export interface ScreenGuide {
  title: string;
  description: string;
  tip: string;
}

export function getAssistantMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAssistantMode(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    window.dispatchEvent(new CustomEvent('wc-assistant-changed', { detail: on }));
  } catch {}
}

export const screenGuides: Partial<Record<Screen, ScreenGuide>> = {
  dashboard: {
    title: 'Dashboard',
    description: 'Your logbook overview. See progress, recent trips, and quick actions.',
    tip: 'Tap a trip card to view details.',
  },
  sort: {
    title: 'Sort Trips',
    description: 'Classify each trip as business or personal. Swipe or tap to sort.',
    tip: 'Complete all trips to unlock the deduction estimate.',
  },
  classify: {
    title: 'Classify',
    description: 'Assign a purpose to each business trip for better records.',
    tip: 'Adding a purpose improves your audit score.',
  },
  review: {
    title: 'Review',
    description: 'Check your trips and verify odometer readings before finalising.',
    tip: 'Verified readings strengthen your logbook.',
  },
  reports: {
    title: 'Documents',
    description: 'View and manage your saved logbook reports.',
    tip: 'Export reports for your accountant.',
  },
  export: {
    title: 'Export',
    description: 'Generate PDF reports for tax time.',
    tip: 'Combine multiple sessions into one report.',
  },
  input: {
    title: 'Add Trip',
    description: 'Record a new trip with start and end locations.',
    tip: 'Use the map to confirm your route.',
  },
  expenses: {
    title: 'Expenses',
    description: 'Log vehicle expenses like fuel, registration, and maintenance.',
    tip: 'Expenses feed into your deduction estimate.',
  },
  stats: {
    title: 'Stats',
    description: 'See your business use percentage and deduction breakdown.',
    tip: 'Keep business use between 55–75% for ATO expectations.',
  },
  account: {
    title: 'Account',
    description: 'Manage your profile, vehicle, and settings.',
    tip: 'Complete your profile for accurate estimates.',
  },
};

export const sessionCompleteGuide: ScreenGuide = {
  title: 'Session Complete',
  description: 'Your logbook session is saved. You can archive or export when ready.',
  tip: 'Archive completed logs to keep them for tax time.',
};

export interface SessionCompleteGuideExtended extends ScreenGuide {
  intro: string;
  options: { label: string; description: string }[];
  warning: string;
}

export const sessionCompleteGuideExtended: SessionCompleteGuideExtended = {
  ...sessionCompleteGuide,
  intro: 'Your logbook session is saved. Here are your next steps:',
  options: [
    { label: 'Generate Report', description: 'Create a PDF or CSV of your trips for tax records' },
    { label: 'Archive', description: 'Lock your logbook when complete to preserve it for 5 years' },
    { label: 'View Stats', description: 'See your business use percentage and deduction estimate' },
  ],
  warning: 'Keep your exported reports in a safe place. Your logbook data is valid for 5 years of ATO tax deductions.',
};
