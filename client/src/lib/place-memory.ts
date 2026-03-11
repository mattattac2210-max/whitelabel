const PLACES_KEY = 'wc_places_v1';
const ROUTES_KEY = 'wc_routes_v1';

export interface SavedPlace {
  address: string;
  label: string;
  count: number;
  lastUsed: number;
}

export interface SavedRoute {
  fromAddress: string;
  fromLabel: string;
  toAddress: string;
  toLabel: string;
  km: number;
  duration: string;
  count: number;
  lastUsed: number;
}

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function persist<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch { /* quota exceeded — silently ignore */ }
}

function extractLabel(address: string): string {
  return address.split(',')[0].trim();
}

function norm(addr: string): string {
  return addr.toLowerCase().replace(/\s+/g, ' ').trim();
}

function rankScore(count: number, lastUsed: number): number {
  const daysAgo = (Date.now() - lastUsed) / 86_400_000;
  return count * 10 + Math.max(0, 30 - daysAgo);
}

export function recordPlace(address: string): void {
  if (!address || address.length < 3) return;
  const places = load<SavedPlace>(PLACES_KEY);
  const n = norm(address);
  const idx = places.findIndex(p => norm(p.address) === n);
  if (idx >= 0) {
    places[idx].count++;
    places[idx].lastUsed = Date.now();
    if (!places[idx].label) places[idx].label = extractLabel(address);
  } else {
    places.push({ address, label: extractLabel(address), count: 1, lastUsed: Date.now() });
  }
  persist(PLACES_KEY, places.slice(0, 50));
}

export function recordRoute(from: string, to: string, km: number, duration: string): void {
  if (!from || !to || from.length < 3 || to.length < 3) return;
  const routes = load<SavedRoute>(ROUTES_KEY);
  const nf = norm(from);
  const nt = norm(to);
  const idx = routes.findIndex(r => norm(r.fromAddress) === nf && norm(r.toAddress) === nt);
  if (idx >= 0) {
    routes[idx].count++;
    routes[idx].lastUsed = Date.now();
    routes[idx].km = km;
    if (duration) routes[idx].duration = duration;
  } else {
    routes.push({
      fromAddress: from, fromLabel: extractLabel(from),
      toAddress: to, toLabel: extractLabel(to),
      km, duration: duration || '', count: 1, lastUsed: Date.now(),
    });
  }
  persist(ROUTES_KEY, routes.slice(0, 30));
}

export function getTopRoutes(limit = 3): SavedRoute[] {
  return load<SavedRoute>(ROUTES_KEY)
    .sort((a, b) => rankScore(b.count, b.lastUsed) - rankScore(a.count, a.lastUsed))
    .slice(0, limit);
}

export function getTopPlaces(exclude?: string, limit = 3): SavedPlace[] {
  const ex = exclude ? norm(exclude) : '';
  return load<SavedPlace>(PLACES_KEY)
    .filter(p => !ex || norm(p.address) !== ex)
    .sort((a, b) => rankScore(b.count, b.lastUsed) - rankScore(a.count, a.lastUsed))
    .slice(0, limit);
}
