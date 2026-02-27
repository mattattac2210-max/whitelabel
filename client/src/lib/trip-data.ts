export const RATE = 0.88;
export const BIZ_PCT = 0.70;
export const ODO_START = 84280;

export const CATEGORIES = [
  { icon: 'Wrench', label: 'Tool Run' },
  { icon: 'Building2', label: 'Job Site' },
  { icon: 'Package', label: 'Pickup / Delivery' },
  { icon: 'ClipboardList', label: 'Quote / Inspect' },
  { icon: 'Handshake', label: 'Client Meeting' },
  { icon: 'Store', label: 'Supplier / Trade' },
  { icon: 'Zap', label: 'Emergency Call' },
  { icon: 'FileText', label: 'Admin / Office' },
  { icon: 'GraduationCap', label: 'Training' },
  { icon: 'Landmark', label: 'Council / Permit' },
] as const;

export interface Trip {
  id: number;
  date: string;
  day: number;
  month: number;
  year: number;
  time: string;
  duration: string;
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
}

export const initialTrips: Trip[] = [
  { id: 0, date: 'Thu, 27 Feb', day: 27, month: 1, year: 2026, time: '9:02\u20139:50 AM', duration: '48 min', km: 16.2, from: '15 Smith St', fromSub: 'Fitzroy VIC 3065', to: 'Bunnings Warehouse', toSub: '123 King Rd, Sunshine VIC', type: null, verified: false, photo: false, odoReading: null, odoStartReading: null, purposeLabel: null, purposeIndex: null },
  { id: 1, date: 'Thu, 27 Feb', day: 27, month: 1, year: 2026, time: '11:15\u201312:02 PM', duration: '47 min', km: 14.8, from: 'Bunnings Warehouse', fromSub: 'Sunshine VIC 3020', to: '44 Acacia Ave', toSub: 'Williamstown VIC 3016', type: null, verified: false, photo: false, odoReading: null, odoStartReading: null, purposeLabel: null, purposeIndex: null },
  { id: 2, date: 'Wed, 26 Feb', day: 26, month: 1, year: 2026, time: '7:45\u20138:30 AM', duration: '45 min', km: 12.4, from: 'Home', fromSub: 'Spotswood VIC 3015', to: 'Job Site \u2014 Altona', toSub: '15 Industry Rd, Altona VIC', type: null, verified: false, photo: false, odoReading: null, odoStartReading: null, purposeLabel: null, purposeIndex: null },
  { id: 3, date: 'Wed, 26 Feb', day: 26, month: 1, year: 2026, time: '3:30\u20134:10 PM', duration: '40 min', km: 18.6, from: 'Job Site \u2014 Altona', fromSub: 'Altona VIC 3018', to: 'Reece Plumbing', toSub: '45 Parker St, Footscray VIC', type: null, verified: false, photo: false, odoReading: null, odoStartReading: null, purposeLabel: null, purposeIndex: null },
  { id: 4, date: 'Tue, 25 Feb', day: 25, month: 1, year: 2026, time: '8:10\u20139:05 AM', duration: '55 min', km: 22.1, from: 'Home', fromSub: 'Spotswood VIC 3015', to: 'Newport Client', toSub: '77 Bay Rd, Newport VIC', type: null, verified: false, photo: false, odoReading: null, odoStartReading: null, purposeLabel: null, purposeIndex: null },
  { id: 5, date: 'Tue, 25 Feb', day: 25, month: 1, year: 2026, time: '2:00\u20132:35 PM', duration: '35 min', km: 9.8, from: 'Newport Client', fromSub: 'Newport VIC 3015', to: 'Trade Depot', toSub: '88 Williamstown Rd, VIC', type: null, verified: false, photo: false, odoReading: null, odoStartReading: null, purposeLabel: null, purposeIndex: null },
  { id: 6, date: 'Mon, 24 Feb', day: 24, month: 1, year: 2026, time: '7:30\u20138:22 AM', duration: '52 min', km: 19.4, from: 'Home', fromSub: 'Spotswood VIC 3015', to: 'Commercial Job \u2014 CBD', toSub: '123 Collins St, Melbourne VIC', type: null, verified: false, photo: false, odoReading: null, odoStartReading: null, purposeLabel: null, purposeIndex: null },
  { id: 7, date: 'Mon, 24 Feb', day: 24, month: 1, year: 2026, time: '4:45\u20135:30 PM', duration: '45 min', km: 21.2, from: 'Commercial Job \u2014 CBD', fromSub: 'Melbourne VIC 3000', to: 'Home', toSub: 'Spotswood VIC 3015', type: null, verified: false, photo: false, odoReading: null, odoStartReading: null, purposeLabel: null, purposeIndex: null },
];

export function getTripOdoStart(trips: Trip[], idx: number, baseOdo?: number | null): number {
  if (trips[idx].odoStartReading != null) return trips[idx].odoStartReading!;
  for (let i = idx - 1; i >= 0; i--) {
    if (trips[i].odoReading != null) {
      let o = trips[i].odoReading!;
      for (let j = i + 1; j < idx; j++) o += trips[j].km;
      return o;
    }
  }
  const base = baseOdo ?? ODO_START;
  let o = base;
  for (let i = 0; i < idx; i++) o += trips[i].km;
  return o;
}

export function getTripOdoEnd(trips: Trip[], idx: number, baseOdo?: number | null): number {
  if (trips[idx].odoReading != null) return trips[idx].odoReading!;
  return getTripOdoStart(trips, idx, baseOdo) + trips[idx].km;
}
