import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { type Trip, getTripOdoEnd, getInsertIndexForNewTrip, getGapBetweenTrips, ODO_START, sortTripsChronologically } from '@/lib/trip-data';
import { AddressInput, preloadGoogleMaps, loadGoogleMaps } from './address-input';
import { getTopRoutes, getTopPlaces, recordPlace, recordRoute, getShortcuts, addShortcut, deleteShortcut, type SavedRoute, type SavedPlace, type SavedShortcut, type ShortcutSymbol } from '@/lib/place-memory';
import { getRecurringTemplates, addRecurringTemplate, updateRecurringTemplate, deleteRecurringTemplate, generateTripsFromTemplate, type RecurringTemplate } from '@/lib/recurring-trips';
import { MapPin, Check, Calendar, Clock, ArrowLeft, ArrowRight, ArrowLeftRight, Gauge, Navigation, Navigation2, Square, Car, History, Crosshair, Pause, Play, DollarSign, Fuel, StickyNote, Route, Briefcase, ChevronLeft, ChevronRight, Home, Building2, Store, Landmark, Heart, FileText, GraduationCap, Plus, Trash2, Bluetooth, Pencil, Repeat } from 'lucide-react';

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#444' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#333' }] },
  { featureType: 'road', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#777' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#666' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e1a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const LIGHT_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#999999' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#bbbbbb' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#222222' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#dddddd' }] },
  { featureType: 'road', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#111111' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0e8ef' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#f4f4f4' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eef2e8' }] },
];

function getMapStyles() {
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES;
}

function calcBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const toRad = (d: number) => d * Math.PI / 180;
  const toDeg = (r: number) => r * 180 / Math.PI;
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function getMarkerColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return isDark
    ? { fill: '#FFFFFF', stroke: '#000000', polyline: '#FFFFFF' }
    : { fill: '#000000', stroke: '#FFFFFF', polyline: '#000000' };
}

function getEstimatedDeduction(km: number): number {
  return Math.round(km * 0.88 * 100) / 100;
}

function getEstimatedFuelCost(km: number): number {
  let fuelConsumption = 10;
  let fuelPrice = 1.95;
  try {
    const specs = JSON.parse(localStorage.getItem('wc_vehicle_specs') || '{}');
    const fc = parseFloat(specs.fuelConsumption);
    if (fc > 0) fuelConsumption = fc;
    const ft = (specs.fuelType || '').toLowerCase();
    if (ft === 'diesel') fuelPrice = 1.89;
    else if (ft === 'premium') fuelPrice = 2.15;
    else if (ft === 'lpg') fuelPrice = 1.05;
  } catch {}
  return Math.round(km / 100 * fuelConsumption * fuelPrice * 100) / 100;
}

let nextManualId = 8000;

type InputMode = 'choose' | 'when' | 'existing' | 'live' | 'shortcuts' | 'odometerConfirm' | 'gap' | 'gps' | 'preferences' | 'recurring' | 'recurringApply';

interface PendingTripData {
  from: string;
  to: string;
  km: number;
  date: string;
  dateObj: { day: number; month: number; year: number };
  time: string;
  duration: string;
  notes: string;
  stops: string[];
  suggestedOdoStart: number;
  suggestedOdoEnd: number;
}

const SHORTCUT_SYMBOLS: { symbol: ShortcutSymbol; label: string; Icon: typeof Home }[] = [
  { symbol: 'Home', label: 'Home', Icon: Home },
  { symbol: 'Briefcase', label: 'Work / Clients', Icon: Briefcase },
  { symbol: 'Building2', label: 'Office', Icon: Building2 },
  { symbol: 'Store', label: 'Supplier', Icon: Store },
  { symbol: 'Landmark', label: 'Council', Icon: Landmark },
  { symbol: 'MapPin', label: 'Other', Icon: MapPin },
  { symbol: 'Heart', label: 'Personal', Icon: Heart },
  { symbol: 'Car', label: 'Garage', Icon: Car },
  { symbol: 'FileText', label: 'Admin', Icon: FileText },
  { symbol: 'GraduationCap', label: 'Training', Icon: GraduationCap },
];

const SYMBOL_MAP = Object.fromEntries(SHORTCUT_SYMBOLS.map(s => [s.symbol, s.Icon]));

function ShortcutsScreen({ onBack, onPreferences }: { onBack: () => void; onPreferences: () => void }) {
  const [shortcuts, setShortcuts] = useState<SavedShortcut[]>(() => getShortcuts());
  const [showAdd, setShowAdd] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newSymbol, setNewSymbol] = useState<ShortcutSymbol>('MapPin');

  useEffect(() => {
    setShortcuts(getShortcuts());
  }, [showAdd]);

  const handleAdd = () => {
    const addr = newAddress.trim();
    const label = newLabel.trim() || addr.split(',')[0].trim();
    if (addr.length < 3) return;
    addShortcut({ address: addr, label, symbol: newSymbol });
    recordPlace(addr);
    setNewAddress('');
    setNewLabel('');
    setNewSymbol('MapPin');
    setShowAdd(false);
    setShortcuts(getShortcuts());
  };

  const handleDelete = (id: string) => {
    deleteShortcut(id);
    setShortcuts(getShortcuts());
  };

  return (
    <div className="flex flex-col h-full" data-testid="shortcuts-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-shortcuts"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Shortcuts</span>
        <button
          className="ml-auto w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={() => setShowAdd(true)}
          data-testid="button-add-shortcut"
          title="Add shortcut"
        >
          <Plus className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[6px] pb-[20px]">
        {showAdd && (
          <div className="rounded-[16px] p-[18px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)' }}>
            <div className="font-heading font-bold text-[14px] mb-[10px]" style={{ color: 'var(--wc-text)' }}>Add destination</div>
            <div className="mb-[10px]">
              <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Address</label>
              <AddressInput
                className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
                value={newAddress}
                onChange={setNewAddress}
                placeholder="Enter address"
              />
            </div>
            <div className="mb-[10px]">
              <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Label (optional)</label>
              <input
                type="text"
                className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Client office"
              />
            </div>
            <div className="mb-[12px]">
              <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[6px]" style={{ color: 'var(--wc-t3)' }}>Symbol</label>
              <div className="flex flex-wrap gap-[8px]">
                {SHORTCUT_SYMBOLS.map(({ symbol, label, Icon }) => (
                  <button
                    key={symbol}
                    type="button"
                    className="rounded-[10px] p-[8px_12px] flex items-center gap-[6px] transition-all"
                    style={{
                      background: newSymbol === symbol ? 'rgb(var(--wc-y) / .2)' : 'rgb(var(--wc-ink) / .05)',
                      border: `1.5px solid ${newSymbol === symbol ? 'var(--wc-y)' : 'var(--wc-border)'}`,
                      color: newSymbol === symbol ? 'var(--wc-y)' : 'var(--wc-t2)',
                    }}
                    onClick={() => setNewSymbol(symbol)}
                  >
                    <Icon className="w-[14px] h-[14px]" />
                    <span className="font-heading font-semibold text-[11px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-[8px]">
              <button
                className="flex-1 rounded-[10px] p-[10px] font-heading font-semibold text-[12px] cursor-pointer"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={() => { setShowAdd(false); setNewAddress(''); setNewLabel(''); }}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-[10px] p-[10px] font-heading font-semibold text-[12px] cursor-pointer"
                style={{ background: 'var(--wc-y)', border: 'none', color: 'var(--wc-bg)' }}
                onClick={handleAdd}
                disabled={newAddress.trim().length < 3}
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[8px]" style={{ color: 'var(--wc-t3)' }}>
          Your shortcuts ({shortcuts.length})
        </div>
        {shortcuts.length === 0 && !showAdd ? (
          <div className="rounded-[16px] p-[24px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px dashed var(--wc-border)' }}>
            <MapPin className="w-[32px] h-[32px] mx-auto mb-[8px] opacity-50" style={{ color: 'var(--wc-t3)' }} />
            <div className="font-heading font-bold text-[14px] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>No shortcuts yet</div>
            <div className="font-data text-[11px] mb-[12px]" style={{ color: 'var(--wc-t3)' }}>Add destinations to quickly fill From/To when logging trips.</div>
            <button
              className="rounded-[10px] px-[16px] py-[8px] font-heading font-semibold text-[12px] cursor-pointer"
              style={{ background: 'var(--wc-y)', border: 'none', color: 'var(--wc-bg)' }}
              onClick={() => setShowAdd(true)}
            >
              Add shortcut
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-[8px]">
            {shortcuts.map((s) => {
              const Icon = SYMBOL_MAP[s.symbol] || MapPin;
              return (
                <div
                  key={s.id}
                  className="rounded-[12px] p-[12px_14px] flex items-center gap-[12px]"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)' }}
                >
                  <div className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .08)' }}>
                    <Icon className="w-[20px] h-[20px]" style={{ color: 'var(--wc-y)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-[13px] truncate" style={{ color: 'var(--wc-text)' }}>{s.label}</div>
                    <div className="font-data text-[10px] truncate mt-[2px]" style={{ color: 'var(--wc-t3)' }}>{s.address}</div>
                  </div>
                  <button
                    type="button"
                    className="rounded-[8px] p-[6px] flex-shrink-0"
                    style={{ background: 'rgb(var(--wc-re) / .1)', color: 'var(--wc-re)' }}
                    onClick={() => handleDelete(s.id)}
                    title="Remove shortcut"
                  >
                    <Trash2 className="w-[14px] h-[14px]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-[16px] mt-[20px]">
          <button
            className="text-[12px] font-heading font-semibold uppercase tracking-[.05em] cursor-pointer transition-opacity hover:opacity-80"
            style={{ color: 'var(--wc-t3)' }}
            onClick={onPreferences}
            data-testid="shortcuts-trip-preferences"
          >
            Trip preferences
          </button>
        </div>
      </div>
    </div>
  );
}

function ChooseScreen({ onSelect }: { onSelect: (mode: 'existing' | 'live' | 'shortcuts' | 'gps' | 'recurring') => void }) {
  const { dispatch } = useApp();
  const logbookStream = useMemo(() => {
    try {
      const s = JSON.parse(localStorage.getItem('wc_settings') || '{}');
      return s.logbookStream || 'hybrid';
    } catch { return 'hybrid'; }
  }, []);
  const showLive = logbookStream !== 'basic';
  const showGps = logbookStream === 'gps';
  useEffect(() => { preloadGoogleMaps(); }, []);
  return (
    <div className="flex flex-col h-full" data-testid="input-choose-screen">
      <div className="flex items-center gap-[8px] px-4 pt-2 pb-[4px] flex-shrink-0">
        <button
          className="w-[28px] h-[28px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="button-back-choose"
        >
          <ArrowLeft className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[18px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Add Trip</span>
      </div>

      <div className="flex-1 px-[18px] flex flex-col justify-center gap-[10px] pb-[40px]">
        {showLive && (
          <button
            className="rounded-xl p-[14px_16px] cursor-pointer transition-all text-left"
            style={{ background: 'rgb(var(--wc-ink) / .06)', border: '2px solid rgb(var(--wc-ink) / .25)' }}
            onClick={() => onSelect('live')}
            data-testid="choose-start-new"
          >
            <div className="flex items-center gap-[10px]">
              <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .12)', border: '1px solid rgb(var(--wc-ink) / .3)' }}>
                <Navigation className="w-[20px] h-[20px]" style={{ color: 'var(--wc-y)' }} />
              </div>
              <div>
                <div className="font-heading font-bold text-[14px] uppercase tracking-[.04em] leading-none mb-[4px]" style={{ color: 'var(--wc-y)' }}>Start New Trip</div>
                <div className="text-[12px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>Use current location or enter start point. Live map, real-time distance and timer.</div>
              </div>
            </div>
          </button>
        )}

        <button
          className="rounded-xl p-[14px_16px] cursor-pointer transition-all text-left"
          style={{ background: logbookStream === 'basic' ? 'rgb(var(--wc-ink) / .06)' : 'rgb(var(--wc-ink) / .03)', border: logbookStream === 'basic' ? '2px solid rgb(var(--wc-ink) / .25)' : '2px solid var(--wc-border)' }}
          onClick={() => onSelect('existing')}
          data-testid="choose-add-existing"
        >
          <div className="flex items-center gap-[10px]">
            <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}>
              <History className="w-[20px] h-[20px]" style={{ color: 'var(--wc-t2)' }} />
            </div>
            <div>
              <div className="font-heading font-bold text-[14px] uppercase tracking-[.04em] leading-none mb-[4px]" style={{ color: 'var(--wc-text)' }}>Add Existing Trip</div>
              <div className="text-[12px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>Log a trip you already made. Fill in the details and send it to sort.</div>
            </div>
          </div>
        </button>

        {(logbookStream === 'basic' || logbookStream === 'hybrid') && (
          <button
            className="rounded-xl p-[14px_16px] cursor-pointer transition-all text-left"
            style={{ background: logbookStream === 'basic' ? 'rgb(var(--wc-ink) / .06)' : 'rgb(var(--wc-ink) / .03)', border: logbookStream === 'basic' ? '2px solid rgb(var(--wc-ink) / .25)' : '2px solid var(--wc-border)' }}
            onClick={() => onSelect('recurring')}
            data-testid="choose-add-recurring"
          >
            <div className="flex items-center gap-[10px]">
              <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}>
                <Repeat className="w-[20px] h-[20px]" style={{ color: 'var(--wc-y)' }} />
              </div>
              <div>
                <div className="font-heading font-bold text-[14px] uppercase tracking-[.04em] leading-none mb-[4px]" style={{ color: 'var(--wc-text)' }}>Add Recurring Trips</div>
                <div className="text-[12px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>Define routes you drive regularly. Add trips for a date range in one go.</div>
              </div>
            </div>
          </button>
        )}

        <button
          className="rounded-xl p-[14px_16px] cursor-pointer transition-all text-left"
          style={{ background: 'rgb(var(--wc-ink) / .03)', border: '2px solid var(--wc-border)' }}
          onClick={() => onSelect('shortcuts')}
          data-testid="choose-add-shortcuts"
        >
          <div className="flex items-center gap-[10px]">
            <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}>
              <MapPin className="w-[20px] h-[20px]" style={{ color: 'var(--wc-t2)' }} />
            </div>
            <div>
              <div className="font-heading font-bold text-[14px] uppercase tracking-[.04em] leading-none mb-[4px]" style={{ color: 'var(--wc-text)' }}>Add Shortcuts</div>
              <div className="text-[12px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>Save destinations with symbols like Home, Clients, Office. Quick-fill From/To when logging trips.</div>
            </div>
          </div>
        </button>

        {showGps && (
          <button
            className="rounded-xl p-[14px_16px] cursor-pointer transition-all text-left"
            style={{ background: 'rgb(var(--wc-ink) / .03)', border: '2px solid var(--wc-border)' }}
            onClick={() => onSelect('gps')}
            data-testid="choose-gps-device"
          >
            <div className="flex items-center gap-[10px]">
              <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}>
                <Bluetooth className="w-[20px] h-[20px]" style={{ color: 'var(--wc-t2)' }} />
              </div>
              <div>
                <div className="font-heading font-bold text-[14px] uppercase tracking-[.04em] leading-none mb-[4px]" style={{ color: 'var(--wc-text)' }}>GPS Device</div>
                <div className="text-[12px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>Connect your Key Tag or tracker. Trips sync automatically.</div>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

function GpsDeviceScreen({ onBack }: { onBack: () => void }) {
  const { dispatch } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = useCallback(() => {
    setSyncing(true);
    setTimeout(() => {
      const today = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]}`;
      const mockTrips: Trip[] = [
        {
          id: nextManualId++,
          date: dateStr,
          day: today.getDate(),
          month: today.getMonth(),
          year: today.getFullYear(),
          time: '9:00 AM',
          duration: '25 min',
          km: 12,
          from: 'Home',
          fromSub: '',
          to: 'Office',
          toSub: '',
          type: null,
          verified: false,
          photo: false,
          odoReading: null,
          odoStartReading: null,
          purposeLabel: null,
          purposeIndex: null,
          stops: [],
          notes: 'Synced from GPS device',
        },
        {
          id: nextManualId++,
          date: dateStr,
          day: today.getDate(),
          month: today.getMonth(),
          year: today.getFullYear(),
          time: '2:30 PM',
          duration: '18 min',
          km: 8,
          from: 'Office',
          fromSub: '',
          to: 'Client Site',
          toSub: '',
          type: null,
          verified: false,
          photo: false,
          odoReading: null,
          odoStartReading: null,
          purposeLabel: null,
          purposeIndex: null,
          stops: [],
          notes: 'Synced from GPS device',
        },
      ];
      mockTrips.forEach(t => {
        dispatch({ type: 'ADD_TRIP', trip: t });
        dispatch({ type: 'ADD_LOG', desc: `GPS sync: ${t.from} → ${t.to} (${t.km} km)`, hasPhoto: false });
      });
      setSyncing(false);
      setSynced(true);
      setTimeout(() => {
        dispatch({ type: 'GO_SCREEN', screen: 'sort' });
      }, 800);
    }, 1200);
  }, [dispatch]);

  return (
    <div className="flex flex-col h-full" data-testid="gps-device-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-gps"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>GPS Device</span>
      </div>

      <div className="flex-1 px-[18px] flex flex-col justify-center gap-[20px] pb-[40px]">
        <div className="rounded-[16px] p-[24px] flex flex-col items-center text-center" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '2px solid var(--wc-border)' }}>
          <div className="w-[80px] h-[80px] rounded-[20px] flex items-center justify-center mb-[16px]" style={{ background: 'rgb(var(--wc-ink) / .1)', border: '1px solid var(--wc-border)' }}>
            <Bluetooth className="w-[40px] h-[40px]" style={{ color: 'var(--wc-y)' }} />
          </div>
          <div className="font-heading font-black text-[20px] uppercase tracking-[.04em] mb-[8px]" style={{ color: 'var(--wc-text)' }}>Connect your GPS Key Tag</div>
          <div className="text-[14px] leading-[1.5] mb-[20px]" style={{ color: 'var(--wc-t2)' }}>
            Pair your Bluetooth Key Tag or tracker to sync trips automatically. Device API coming soon — try a demo sync below.
          </div>
          <button
            className="rounded-[12px] px-[28px] py-[14px] font-heading font-bold text-[14px] uppercase tracking-[.04em] cursor-pointer transition-all active:scale-[.98] disabled:opacity-60"
            style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)', border: 'none' }}
            onClick={handleSync}
            disabled={syncing || synced}
            data-testid="button-sync-trips"
          >
            {syncing ? 'Syncing...' : synced ? 'Synced!' : 'Sync trips (demo)'}
          </button>
        </div>
      </div>
    </div>
  );
}

const LOGBOOK_PREFS_KEY = 'wc_logbook_prefs';

interface LogbookPrefs {
  minimalLogbookMode: boolean;
  showLast3Context: boolean;
  showMockWhenEmpty: boolean;
  gapDetectorEnabled: boolean;
}

const DEFAULT_PREFS: LogbookPrefs = {
  minimalLogbookMode: false,
  showLast3Context: true,
  showMockWhenEmpty: true,
  gapDetectorEnabled: true,
};

function loadLogbookPrefs(): LogbookPrefs {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(LOGBOOK_PREFS_KEY) || '{}') };
  } catch {
    return DEFAULT_PREFS;
  }
}

function saveLogbookPrefs(prefs: LogbookPrefs) {
  localStorage.setItem(LOGBOOK_PREFS_KEY, JSON.stringify(prefs));
}

function PreferencesScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<LogbookPrefs>(loadLogbookPrefs);

  useEffect(() => {
    saveLogbookPrefs(prefs);
  }, [prefs]);

  const upd = (key: keyof LogbookPrefs) => (v: boolean) => setPrefs(p => ({ ...p, [key]: v }));

  return (
    <div className="flex flex-col h-full" data-testid="preferences-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-preferences"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Trip preferences</span>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] pt-[6px] pb-[40px]">
        <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mb-[12px]" style={{ color: 'var(--wc-t2)' }}>Logbook</div>
        <div className="flex flex-col gap-[10px]">
          <label className="flex items-start gap-[12px] cursor-pointer rounded-[12px] p-[14px] transition-colors" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <input type="checkbox" checked={prefs.minimalLogbookMode} onChange={e => upd('minimalLogbookMode')(e.target.checked)} className="mt-[4px]" />
            <div>
              <div className="font-heading font-bold text-[13px]" style={{ color: 'var(--wc-text)' }}>Minimal logbook mode (Australia)</div>
              <div className="text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Fewer fields when adding trips. Log business trips only — we detect gaps and prompt you to add personal km. Reclassify in Sort.</div>
            </div>
          </label>
          <label className="flex items-start gap-[12px] cursor-pointer rounded-[12px] p-[14px] transition-colors" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <input type="checkbox" checked={prefs.gapDetectorEnabled} onChange={e => upd('gapDetectorEnabled')(e.target.checked)} className="mt-[4px]" />
            <div>
              <div className="font-heading font-bold text-[13px]" style={{ color: 'var(--wc-text)' }}>Gap detector</div>
              <div className="text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Prompt when there's unexplained km between business trips.</div>
            </div>
          </label>
          <label className="flex items-start gap-[12px] cursor-pointer rounded-[12px] p-[14px] transition-colors" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <input type="checkbox" checked={prefs.showLast3Context} onChange={e => upd('showLast3Context')(e.target.checked)} className="mt-[4px]" />
            <div>
              <div className="font-heading font-bold text-[13px]" style={{ color: 'var(--wc-text)' }}>Show last 3 trips for context</div>
              <div className="text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Display recent trips when confirming odometer.</div>
            </div>
          </label>
          <label className="flex items-start gap-[12px] cursor-pointer rounded-[12px] p-[14px] transition-colors" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <input type="checkbox" checked={prefs.showMockWhenEmpty} onChange={e => upd('showMockWhenEmpty')(e.target.checked)} className="mt-[4px]" />
            <div>
              <div className="font-heading font-bold text-[13px]" style={{ color: 'var(--wc-text)' }}>Show placeholder when no trips</div>
              <div className="text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Display sample context during setup.</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

function RecurringTripsScreen({ onBack, onApply }: { onBack: () => void; onApply: (template: RecurringTemplate) => void }) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>(() => getRecurringTemplates());
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [km, setKm] = useState('');
  const [duration, setDuration] = useState('');
  const [defaultTime, setDefaultTime] = useState('08:00');
  const [label, setLabel] = useState('');
  const [purposeIndex, setPurposeIndex] = useState<number | null>(null);
  const [calcStatus, setCalcStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const calcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = useCallback(() => {
    setFrom('');
    setTo('');
    setKm('');
    setDuration('');
    setDefaultTime('08:00');
    setLabel('');
    setPurposeIndex(null);
    setCalcStatus('idle');
    setShowAdd(false);
    setEditingId(null);
  }, []);

  useEffect(() => {
    if (!showAdd) return;
    preloadGoogleMaps();
  }, [showAdd]);

  useEffect(() => {
    if (calcTimerRef.current) clearTimeout(calcTimerRef.current);
    if (editingId || !from || !to || from.length < 5 || to.length < 5) {
      setCalcStatus('idle');
      return;
    }

    calcTimerRef.current = setTimeout(() => {
      loadGoogleMaps().then(() => {
        if (!window._gmapsLoaded) return;
        setCalcStatus('loading');
        const ds = new window.google.maps.DirectionsService();
        ds.route({
          origin: from,
          destination: to,
          travelMode: window.google.maps.TravelMode.DRIVING,
          region: 'au',
        }, (result: any, status: string) => {
          if (status === 'OK' && result?.routes?.[0]) {
            let totalM = 0, totalSec = 0;
            result.routes[0].legs.forEach((leg: any) => {
              totalM += leg.distance?.value || 0;
              totalSec += leg.duration?.value || 0;
            });
            const calcKm = totalM / 1000;
            const mins = Math.round(totalSec / 60);
            const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
            setKm(calcKm.toFixed(1));
            setDuration(durStr);
            setCalcStatus('done');
          } else {
            setCalcStatus('error');
          }
        });
      });
    }, 800);

    return () => { if (calcTimerRef.current) clearTimeout(calcTimerRef.current); };
  }, [from, to, showAdd, editingId]);

  const handleSave = useCallback(() => {
    const parsedKm = parseFloat(km) || 0;
    if (!from.trim() || !to.trim() || parsedKm < 1) return;
    if (editingId) {
      updateRecurringTemplate(editingId, {
        fromAddress: from.trim(),
        toAddress: to.trim(),
        km: parsedKm,
        duration: duration.trim(),
        defaultTime,
        label: label.trim() || from.split(',')[0].trim() + ' \u2192 ' + to.split(',')[0].trim(),
        purposeIndex,
      });
    } else {
      addRecurringTemplate({
        fromAddress: from.trim(),
        toAddress: to.trim(),
        km: parsedKm,
        duration: duration.trim(),
        defaultTime,
        label: label.trim() || from.split(',')[0].trim() + ' \u2192 ' + to.split(',')[0].trim(),
        purposeIndex,
      });
    }
    setTemplates(getRecurringTemplates());
    resetForm();
  }, [from, to, km, duration, defaultTime, label, purposeIndex, editingId, resetForm]);

  const handleEdit = useCallback((t: RecurringTemplate) => {
    setEditingId(t.id);
    setFrom(t.fromAddress);
    setTo(t.toAddress);
    setKm(t.km.toString());
    setDuration(t.duration);
    setDefaultTime(t.defaultTime);
    setLabel(t.label);
    setPurposeIndex(t.purposeIndex);
    setCalcStatus('idle');
    setShowAdd(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteRecurringTemplate(id);
    setTemplates(getRecurringTemplates());
    if (editingId === id) resetForm();
  }, [editingId, resetForm]);

  return (
    <div className="flex flex-col h-full" data-testid="recurring-trips-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-recurring"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Recurring Trips</span>
        <button
          className="ml-auto w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={() => { resetForm(); setShowAdd(true); }}
          data-testid="button-add-recurring-template"
          title="Add template"
        >
          <Plus className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[6px] pb-[20px]">
        {showAdd && (
          <div className="rounded-[16px] p-[18px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)' }}>
            <div className="font-heading font-bold text-[14px] mb-[10px]" style={{ color: 'var(--wc-text)' }}>{editingId ? 'Edit template' : 'Add template'}</div>
            <div className="mb-[10px]">
              <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>From</label>
              <AddressInput
                className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
                value={from}
                onChange={setFrom}
                placeholder="Start address"
              />
            </div>
            <div className="mb-[10px]">
              <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>To</label>
              <AddressInput
                className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
                value={to}
                onChange={setTo}
                placeholder="Destination"
              />
            </div>
            {calcStatus === 'loading' && (
              <div className="rounded-[10px] p-[8px_12px] mb-[10px] flex items-center gap-[8px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
                <Route className="w-[12px] h-[12px] animate-pulse" style={{ color: 'var(--wc-y)' }} />
                <span className="font-data text-[10px]" style={{ color: 'var(--wc-t2)' }}>Calculating route...</span>
              </div>
            )}
            {calcStatus === 'error' && (
              <div className="rounded-[10px] p-[8px_12px] mb-[10px] flex items-center gap-[6px]" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)' }}>
                <span className="text-[10px]" style={{ color: 'var(--wc-re)' }}>Could not calculate route. Enter distance manually.</span>
              </div>
            )}
            <div className="flex gap-[10px] mb-[10px]">
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Km {calcStatus === 'done' && '\u00b7 auto'}</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
                  value={km}
                  onChange={e => setKm(e.target.value)}
                  placeholder={calcStatus === 'done' ? undefined : 'Auto when from/to entered'}
                />
              </div>
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Time</label>
                <input
                  type="time"
                  className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
                  value={defaultTime}
                  onChange={e => setDefaultTime(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-[10px]">
              <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Duration (optional)</label>
              <input
                type="text"
                className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="e.g. 25 min"
              />
            </div>
            <div className="mb-[10px]">
              <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Label (optional)</label>
              <input
                type="text"
                className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Home to Job Site"
              />
            </div>
            <div className="flex gap-[8px] mt-[12px]">
              <button
                className="flex-1 rounded-[10px] py-[10px] font-heading font-bold text-[12px] uppercase tracking-[.05em] cursor-pointer transition-all"
                style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                onClick={handleSave}
                data-testid="button-save-recurring-template"
              >
                {editingId ? 'Update' : 'Add'}
              </button>
              <button
                className="rounded-[10px] px-[14px] py-[10px] font-heading font-bold text-[12px] uppercase tracking-[.05em] cursor-pointer transition-all"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {templates.length === 0 && !showAdd ? (
          <div className="rounded-[16px] p-[24px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <Repeat className="w-[40px] h-[40px] mx-auto mb-[12px]" style={{ color: 'var(--wc-t3)' }} />
            <div className="font-heading font-bold text-[14px] mb-[8px]" style={{ color: 'var(--wc-text)' }}>No recurring templates yet</div>
            <div className="text-[12px] mb-[16px]" style={{ color: 'var(--wc-t2)' }}>Add a template for routes you drive regularly, then apply it to a date range to add multiple trips at once.</div>
            <button
              className="rounded-[12px] px-[20px] py-[10px] font-heading font-bold text-[13px] uppercase tracking-[.04em] cursor-pointer transition-all"
              style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
              onClick={() => setShowAdd(true)}
            >
              Add template
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {templates.map((t) => (
              <div
                key={t.id}
                className="rounded-[12px] p-[14px] flex items-center gap-[12px]"
                style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1.5px solid var(--wc-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-bold text-[13px] truncate" style={{ color: 'var(--wc-text)' }}>{t.label || t.fromAddress.split(',')[0] + ' \u2192 ' + t.toAddress.split(',')[0]}</div>
                  <div className="font-data text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>{t.km.toFixed(1)} km{t.duration ? ` \u00b7 ${t.duration}` : ''}</div>
                </div>
                <div className="flex gap-[6px] flex-shrink-0">
                  <button
                    className="rounded-[8px] px-[10px] py-[6px] font-heading font-bold text-[10px] uppercase tracking-[.05em] cursor-pointer transition-all"
                    style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                    onClick={() => onApply(t)}
                    data-testid="button-apply-recurring"
                  >
                    Add for dates
                  </button>
                  <button
                    className="rounded-[8px] p-[6px] cursor-pointer transition-all"
                    style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
                    onClick={() => handleEdit(t)}
                    title="Edit"
                  >
                    <Pencil className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t2)' }} />
                  </button>
                  <button
                    className="rounded-[8px] p-[6px] cursor-pointer transition-all"
                    style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
                    onClick={() => handleDelete(t.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-[14px] h-[14px]" style={{ color: 'var(--wc-re)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApplyRecurringScreen({ template, onBack, onConfirm }: { template: RecurringTemplate; onBack: () => void; onConfirm: (trips: Trip[], skipped: number) => void }) {
  const { state } = useApp();
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);

  const result = useMemo(() => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    if (start > end) return { trips: [], skipped: 0 };
    const endCapped = new Date(end);
    const todayObj = new Date();
    todayObj.setHours(23, 59, 59, 999);
    if (endCapped > todayObj) endCapped.setTime(todayObj.getTime());
    return generateTripsFromTemplate(template, start, endCapped, weekdaysOnly, state.trips);
  }, [template, startDate, endDate, weekdaysOnly, state.trips]);

  const handleConfirm = useCallback(() => {
    if (result.trips.length === 0) return;
    onConfirm(result.trips, result.skipped);
  }, [result, onConfirm]);

  return (
    <div className="flex flex-col h-full" data-testid="apply-recurring-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-apply-recurring"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Add for date range</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[6px] pb-[20px]">
        <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)' }}>
          <div className="font-heading font-bold text-[13px]" style={{ color: 'var(--wc-text)' }}>{template.label || template.fromAddress.split(',')[0] + ' \u2192 ' + template.toAddress.split(',')[0]}</div>
          <div className="font-data text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>{template.km.toFixed(1)} km</div>
        </div>

        <div className="mb-[12px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Start date</label>
          <input
            type="date"
            className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
            style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
            value={startDate}
            max={today}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="mb-[12px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>End date (max: today)</label>
          <input
            type="date"
            className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
            style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
            value={endDate}
            max={today}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <label className="flex items-start gap-[12px] cursor-pointer rounded-[12px] p-[14px] mb-[14px] transition-colors" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
          <input type="checkbox" checked={weekdaysOnly} onChange={e => setWeekdaysOnly(e.target.checked)} className="mt-[4px]" />
          <div>
            <div className="font-heading font-bold text-[13px]" style={{ color: 'var(--wc-text)' }}>Weekdays only</div>
            <div className="text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>Skip weekends when adding trips.</div>
          </div>
        </label>

        <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)' }}>
          <div className="font-heading font-bold text-[14px]" style={{ color: 'var(--wc-text)' }}>
            {result.trips.length} trip{result.trips.length === 1 ? '' : 's'} will be added
            {result.skipped > 0 && ` (${result.skipped} date${result.skipped === 1 ? '' : 's'} skipped — already have trips)`}
          </div>
        </div>

        <button
          className="w-full rounded-[12px] py-[14px] font-heading font-bold text-[14px] uppercase tracking-[.04em] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
          onClick={handleConfirm}
          disabled={result.trips.length === 0}
          data-testid="button-confirm-apply-recurring"
        >
          Add {result.trips.length} trip{result.trips.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  );
}

function LiveTripScreen({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp();
  const [startAddress, setStartAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [phase, setPhase] = useState<'setup' | 'driving' | 'paused' | 'ended'>('setup');
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [pausedElapsed, setPausedElapsed] = useState(0);
  const [endAddress, setEndAddress] = useState('');
  const [tripKm, setTripKm] = useState(0);
  const [tripDuration, setTripDuration] = useState('');
  const [saved, setSaved] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [tripNotes, setTripNotes] = useState('');
  const [tripStops, setTripStops] = useState<string[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tripType, setTripType] = useState<'business' | 'personal' | null>(null);
  const [navInfo, setNavInfo] = useState<{ nextStep: string; remainingKm: number; etaMins: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState<'start' | 'dest' | null>(null);
  const mapPickerRef = useRef<HTMLDivElement>(null);
  const mapPickerInstanceRef = useRef<any>(null);
  const mapPickerMarkerRef = useRef<any>(null);
  const pickedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const positionMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const directionsStepsRef = useRef<any[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const destCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pathRef = useRef<{ lat: number; lng: number }[]>([]);
  const polylineRef = useRef<any>(null);
  const snapTimerRef = useRef<number | null>(null);
  const snappedPathRef = useRef<any[]>([]);
  const liveKmRef = useRef(0);

  useEffect(() => {
    if (phase !== 'driving') return;
    timerRef.current = setInterval(() => {
      setElapsed(pausedElapsed + Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, startTime, pausedElapsed]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const fmtElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const createLabelMarker = useCallback((map: any, position: { lat: number; lng: number }, label: string, bgColor: string, textColor: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
      <path d="M20 51C20 51 38 33 38 20C38 10.1 29.9 2 20 2C10.1 2 2 10.1 2 20C2 33 20 51 20 51Z" fill="${bgColor}" stroke="${textColor}" stroke-width="2"/>
      <text x="20" y="25" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="18" fill="${textColor}">${label}</text>
    </svg>`;
    return new window.google.maps.Marker({
      position,
      map,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new window.google.maps.Size(40, 52),
        anchor: new window.google.maps.Point(20, 52),
      },
    });
  }, []);

  const snapToRoad = useCallback((pos: { lat: number; lng: number }, callback: (snapped: { lat: number; lng: number }) => void) => {
    if (!window._gmapsLoaded) { callback(pos); return; }
    const offset = 0.001;
    const nearby = { lat: pos.lat + offset, lng: pos.lng };
    const ds = new window.google.maps.DirectionsService();
    ds.route(
      { origin: pos, destination: nearby, travelMode: window.google.maps.TravelMode.DRIVING, region: 'au' },
      (result: any, status: string) => {
        if (status === 'OK' && result?.routes?.[0]?.legs?.[0]) {
          const loc = result.routes[0].legs[0].start_location;
          callback({ lat: loc.lat(), lng: loc.lng() });
        } else {
          callback(pos);
        }
      }
    );
  }, []);

  const initMap = useCallback((lat: number, lng: number) => {
    if (!mapRef.current || !window._gmapsLoaded) return;
    const rawPos = { lat, lng };
    const isDark = document.documentElement.classList.contains('dark');
    const map = new window.google.maps.Map(mapRef.current, {
      center: rawPos,
      zoom: 17,
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: 'greedy',
      styles: getMapStyles(),
    });
    mapInstanceRef.current = map;
    setMapLoaded(true);

    const markerBg = isDark ? '#FFFFFF' : '#000000';
    const markerText = isDark ? '#000000' : '#FFFFFF';
    const marker = createLabelMarker(map, rawPos, 'A', markerBg, markerText);
    markerRef.current = marker;

    const posMarker = new window.google.maps.Marker({
      position: rawPos,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: isDark ? '#FFFFFF' : '#000000',
        fillOpacity: 1,
        strokeColor: isDark ? '#000000' : '#FFFFFF',
        strokeWeight: 2.5,
      },
      zIndex: 10,
    });
    positionMarkerRef.current = posMarker;

    const polylineOutline = new window.google.maps.Polyline({
      path: [rawPos],
      geodesic: true,
      strokeColor: '#1a73e8',
      strokeOpacity: 0.35,
      strokeWeight: 8,
      map,
      zIndex: 3,
    });
    const polylineInner = new window.google.maps.Polyline({
      path: [rawPos],
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 0.85,
      strokeWeight: 4,
      map,
      zIndex: 4,
    });
    polylineRef.current = [polylineOutline, polylineInner];

    snapToRoad(rawPos, (snapped) => {
      marker.setPosition(snapped);
      posMarker.setPosition(snapped);
      map.panTo(snapped);
      startCoordsRef.current = snapped;
      pathRef.current = [snapped];
      polylineOutline.setPath([snapped]);
      polylineInner.setPath([snapped]);
    });
  }, [createLabelMarker, snapToRoad]);

  const loadDirectionsRoute = useCallback((map: any, origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    if (!window._gmapsLoaded) return;
    const isDark = document.documentElement.classList.contains('dark');
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
      (result: any, status: string) => {
        if (status !== 'OK' || !result?.routes?.[0]) return;
        const route = result.routes[0];
        const leg = route.legs[0];

        let routePath: any[] = [];
        if (route.overview_path && route.overview_path.length > 0) {
          routePath = route.overview_path;
        } else {
          try {
            const encoded = typeof route.overview_polyline === 'string' ? route.overview_polyline : route.overview_polyline?.points || route.overview_polyline;
            routePath = window.google.maps.geometry.encoding.decodePath(encoded);
          } catch { /* fallback below */ }
        }
        if (routePath.length === 0) {
          route.legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
              if (step.path) routePath = routePath.concat(step.path);
            });
          });
        }
        if (routePolylineRef.current) {
          if (Array.isArray(routePolylineRef.current)) routePolylineRef.current.forEach((p: any) => p.setMap(null));
          else routePolylineRef.current.setMap(null);
        }
        const routeOutline = new window.google.maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#1a73e8',
          strokeOpacity: 0.35,
          strokeWeight: 10,
          map,
          zIndex: 1,
        });
        const routeInner = new window.google.maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#4285F4',
          strokeOpacity: 0.85,
          strokeWeight: 5,
          map,
          zIndex: 2,
        });
        routePolylineRef.current = [routeOutline, routeInner];

        directionsStepsRef.current = leg.steps.map((s: any) => ({
          instruction: s.instructions?.replace(/<[^>]*>/g, '') || '',
          endLat: s.end_location.lat(),
          endLng: s.end_location.lng(),
          distanceM: s.distance?.value || 0,
        }));

        const markerBg = isDark ? '#FFFFFF' : '#000000';
        const markerText = isDark ? '#000000' : '#FFFFFF';
        if (endMarkerRef.current) endMarkerRef.current.setMap(null);
        const bMarker = createLabelMarker(map, destination, 'B', markerBg, markerText);
        endMarkerRef.current = bMarker;

        setNavInfo({
          nextStep: directionsStepsRef.current[0]?.instruction || 'Head to destination',
          remainingKm: Math.round((leg.distance?.value || 0) / 100) / 10,
          etaMins: Math.round((leg.duration?.value || 0) / 60),
        });
      }
    );
  }, [createLabelMarker]);

  const updateNavInfo = useCallback((currentPos: { lat: number; lng: number }) => {
    if (!directionsStepsRef.current.length) return;
    const steps = directionsStepsRef.current;
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < steps.length; i++) {
      const d = haversineKm(currentPos, { lat: steps[i].endLat, lng: steps[i].endLng });
      if (d < closestDist) { closestDist = d; closestIdx = i; }
    }
    if (closestDist < 0.05 && closestIdx < steps.length - 1) closestIdx++;
    let remainingM = 0;
    for (let i = closestIdx; i < steps.length; i++) remainingM += steps[i].distanceM;
    const remainingKm = Math.round(remainingM / 100) / 10;
    const avgSpeedKmh = 40;
    const etaMins = Math.max(1, Math.round((remainingKm / avgSpeedKmh) * 60));
    setNavInfo({
      nextStep: steps[closestIdx]?.instruction || 'Continue to destination',
      remainingKm,
      etaMins,
    });
  }, []);

  useEffect(() => {
    if (phase !== 'driving' || mapLoaded || mapError) return;
    if (!mapRef.current || !window._gmapsLoaded) return;
    if (startCoordsRef.current) {
      initMap(startCoordsRef.current.lat, startCoordsRef.current.lng);
    }
  }, [phase, mapLoaded, mapError, initMap]);

  const startGeoTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (pathRef.current.length > 0) {
          const last = pathRef.current[pathRef.current.length - 1];
          const segKm = haversineKm(last, newPos);
          if (segKm > 0.01) {
            liveKmRef.current += segKm;
            setTripKm(Math.round(liveKmRef.current * 10) / 10);
            pathRef.current.push(newPos);
          }
        } else {
          pathRef.current.push(newPos);
        }

        if (mapInstanceRef.current) {
          if (pathRef.current.length >= 2) {
            const prev = pathRef.current[pathRef.current.length - 2];
            const heading = calcBearing(prev, newPos);
            const camCenter = snappedPathRef.current.length > 0
              ? snappedPathRef.current[snappedPathRef.current.length - 1]
              : newPos;
            try {
              mapInstanceRef.current.moveCamera({ center: camCenter, heading });
            } catch {
              mapInstanceRef.current.panTo(camCenter);
              mapInstanceRef.current.setHeading(heading);
            }
          } else {
            mapInstanceRef.current.panTo(newPos);
          }
        }
        if (pathRef.current.length >= 2 && window._gmapsLoaded) {
          const now = Date.now();
          if (!snapTimerRef.current || now - snapTimerRef.current > 4000) {
            snapTimerRef.current = now;
            const pts = pathRef.current;
            const origin = pts[0];
            const current = pts[pts.length - 1];
            if (haversineKm(origin, current) > 0.005 || pts.length >= 3) {
              const waypoints: any[] = [];
              if (pts.length > 2) {
                const maxWp = 8;
                const step = Math.max(1, Math.floor((pts.length - 2) / maxWp));
                for (let i = 1; i < pts.length - 1; i += step) {
                  if (waypoints.length >= maxWp) break;
                  waypoints.push({ location: pts[i], stopover: false });
                }
              }
              const ds = new window.google.maps.DirectionsService();
              ds.route(
                {
                  origin,
                  destination: current,
                  waypoints,
                  travelMode: window.google.maps.TravelMode.DRIVING,
                  region: 'au',
                  optimizeWaypoints: false,
                },
                (result: any, status: string) => {
                  if (status !== 'OK' || !result?.routes?.[0]) return;
                  const route = result.routes[0];
                  let roadPath: any[] = [];
                  if (route.overview_path && route.overview_path.length > 0) {
                    roadPath = route.overview_path;
                  } else {
                    route.legs.forEach((leg: any) => {
                      leg.steps.forEach((step: any) => {
                        if (step.path) roadPath = roadPath.concat(step.path);
                      });
                    });
                  }
                  if (roadPath.length > 0 && polylineRef.current && Array.isArray(polylineRef.current)) {
                    snappedPathRef.current = roadPath;
                    polylineRef.current.forEach((p: any) => p.setPath(roadPath));
                    const lastRoadPt = roadPath[roadPath.length - 1];
                    const snappedEnd = {
                      lat: typeof lastRoadPt.lat === 'function' ? lastRoadPt.lat() : lastRoadPt.lat,
                      lng: typeof lastRoadPt.lng === 'function' ? lastRoadPt.lng() : lastRoadPt.lng,
                    };
                    if (positionMarkerRef.current) {
                      positionMarkerRef.current.setPosition(snappedEnd);
                    }
                  }
                }
              );
            }
          }
        }
        if (!positionMarkerRef.current || snappedPathRef.current.length === 0) {
          if (positionMarkerRef.current) {
            positionMarkerRef.current.setPosition(newPos);
          }
        }
        if (directionsStepsRef.current.length > 0) {
          updateNavInfo(newPos);
        }
      },
      (err) => {
        if (err.code === 1) {
          stopGeoTracking();
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, []);

  const stopGeoTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (window._gmapsLoaded) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
            if (status === 'OK' && results?.[0]) {
              const geo = results[0].geometry.location;
              const snappedLat = typeof geo.lat === 'function' ? geo.lat() : geo.lat;
              const snappedLng = typeof geo.lng === 'function' ? geo.lng() : geo.lng;
              setStartAddress(results[0].formatted_address);
              startCoordsRef.current = { lat: snappedLat, lng: snappedLng };
              setGeoStatus('done');
            } else {
              setStartAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
              startCoordsRef.current = { lat, lng };
              setGeoStatus('done');
            }
          });
        } else {
          setStartAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          startCoordsRef.current = { lat, lng };
          setGeoStatus('done');
        }
      },
      () => {
        setGeoStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resolveDestCoords = useCallback(() => {
    if (!destAddress || !window._gmapsLoaded) return;
    if (destCoordsRef.current) {
      if (mapInstanceRef.current && startCoordsRef.current) {
        loadDirectionsRoute(mapInstanceRef.current, startCoordsRef.current, destCoordsRef.current);
      }
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: destAddress, region: 'au' }, (results: any, status: string) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        destCoordsRef.current = { lat: loc.lat(), lng: loc.lng() };
        if (mapInstanceRef.current && startCoordsRef.current) {
          loadDirectionsRoute(mapInstanceRef.current, startCoordsRef.current, destCoordsRef.current);
        }
      }
    });
  }, [destAddress, loadDirectionsRoute]);

  useEffect(() => {
    if (!mapLoaded || !destAddress) return;
    resolveDestCoords();
  }, [mapLoaded, destAddress, resolveDestCoords]);

  useEffect(() => {
    if (!showMapPicker || !mapPickerRef.current || !window._gmapsLoaded) return;
    const defaultCenter = startCoordsRef.current || { lat: -33.8688, lng: 151.2093 };
    const isDark = document.documentElement.classList.contains('dark');
    const map = new window.google.maps.Map(mapPickerRef.current, {
      center: defaultCenter,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: getMapStyles(),
    });
    mapPickerInstanceRef.current = map;

    const markerBg = isDark ? '#FFFFFF' : '#000000';
    const markerText = isDark ? '#000000' : '#FFFFFF';
    const marker = createLabelMarker(map, defaultCenter, showMapPicker === 'start' ? 'A' : 'B', markerBg, markerText);
    mapPickerMarkerRef.current = marker;
    pickedCoordsRef.current = defaultCenter;

    let routeLines: any[] = [];
    let pickerRenderer: any = null;
    const drawPickerRoute = (origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) => {
      routeLines.forEach((l: any) => l.setMap(null));
      routeLines = [];
      if (pickerRenderer) { pickerRenderer.setMap(null); pickerRenderer = null; }
      const ds = new window.google.maps.DirectionsService();
      ds.route(
        { origin, destination: dest, travelMode: window.google.maps.TravelMode.DRIVING, region: 'au' },
        (result: any, status: string) => {
          if (status !== 'OK' || !result?.routes?.[0]) return;
          const route = result.routes[0];
          let path: any[] = [];
          if (route.overview_path && route.overview_path.length > 0) {
            path = route.overview_path;
          } else {
            route.legs.forEach((leg: any) => {
              leg.steps.forEach((step: any) => {
                if (step.path) path = path.concat(step.path);
              });
            });
          }
          if (path.length > 0) {
            const outline = new window.google.maps.Polyline({ path, geodesic: true, strokeColor: '#1a73e8', strokeOpacity: 0.35, strokeWeight: 10, map, zIndex: 1 });
            const inner = new window.google.maps.Polyline({ path, geodesic: true, strokeColor: '#4285F4', strokeOpacity: 0.85, strokeWeight: 5, map, zIndex: 2 });
            routeLines = [outline, inner];
          } else {
            const renderer = new window.google.maps.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: '#4285F4', strokeOpacity: 0.85, strokeWeight: 5 } });
            renderer.setDirections(result);
            pickerRenderer = renderer;
          }
          const bounds = new window.google.maps.LatLngBounds();
          route.legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          map.fitBounds(bounds, 50);
        }
      );
    };

    if (showMapPicker === 'dest' && startCoordsRef.current) {
      const startMarkerBg = isDark ? '#FFFFFF' : '#000000';
      const startMarkerText = isDark ? '#000000' : '#FFFFFF';
      createLabelMarker(map, startCoordsRef.current, 'A', startMarkerBg, startMarkerText);
    }

    map.addListener('click', (e: any) => {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      marker.setPosition(pos);
      pickedCoordsRef.current = pos;
      if (showMapPicker === 'dest' && startCoordsRef.current) {
        drawPickerRoute(startCoordsRef.current, pos);
      }
    });

    return () => {
      routeLines.forEach((l: any) => l.setMap(null));
      if (pickerRenderer) pickerRenderer.setMap(null);
      mapPickerInstanceRef.current = null;
      mapPickerMarkerRef.current = null;
    };
  }, [showMapPicker, createLabelMarker]);

  const handleMapPickerConfirm = () => {
    if (!pickedCoordsRef.current || !window._gmapsLoaded) { setShowMapPicker(null); return; }
    const coords = pickedCoordsRef.current;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results: any, status: string) => {
      const addr = status === 'OK' && results?.[0] ? results[0].formatted_address : `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      if (showMapPicker === 'start') {
        setStartAddress(addr);
        startCoordsRef.current = coords;
        setGeoStatus('done');
      } else {
        setDestAddress(addr);
        destCoordsRef.current = coords;
      }
      setShowMapPicker(null);
    });
  };

  const handleCommence = () => {
    if (!startAddress) return;
    setPhase('driving');
    setStartTime(Date.now());
    setPausedElapsed(0);
    pathRef.current = [];
    liveKmRef.current = 0;
    if (destAddress) setEndAddress(destAddress);

    if (startCoordsRef.current) {
      pathRef.current.push(startCoordsRef.current);
      if (!window._gmapsLoaded) {
        setMapError(true);
      }
      startGeoTracking();
    } else if (window._gmapsLoaded) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: startAddress, region: 'au' }, (results: any, status: string) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          startCoordsRef.current = { lat, lng };
          pathRef.current.push({ lat, lng });
        } else {
          startCoordsRef.current = { lat: -33.8688, lng: 151.2093 };
        }
        if (mapRef.current && !mapLoaded) {
          initMap(startCoordsRef.current!.lat, startCoordsRef.current!.lng);
        }
        startGeoTracking();
      });
    } else {
      setMapError(true);
      startGeoTracking();
    }
  };

  const handlePause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPausedElapsed(elapsed);
    stopGeoTracking();
    setPhase('paused');
  };

  const handleResume = () => {
    setStartTime(Date.now());
    setPhase('driving');
    startGeoTracking();
  };

  const handleEndTrip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopGeoTracking();
    const totalSec = phase === 'paused' ? pausedElapsed : elapsed;
    const mins = Math.round(totalSec / 60);
    const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins || 1} min`;
    setTripDuration(durStr);

    if (liveKmRef.current > 0) {
      setTripKm(Math.round(liveKmRef.current * 10) / 10);
    }

    if (destAddress && !endAddress) {
      setEndAddress(destAddress);
    }

    if (window._gmapsLoaded && pathRef.current.length > 0) {
      const lastPos = pathRef.current[pathRef.current.length - 1];
      const isDark = document.documentElement.classList.contains('dark');
      const markerBg = isDark ? '#FFFFFF' : '#000000';
      const markerText = isDark ? '#000000' : '#FFFFFF';
      if (mapInstanceRef.current) {
        const bMarker = createLabelMarker(mapInstanceRef.current, lastPos, 'B', markerBg, markerText);
        endMarkerRef.current = bMarker;
        if (markerRef.current && startCoordsRef.current) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(startCoordsRef.current);
          bounds.extend(lastPos);
          mapInstanceRef.current.fitBounds(bounds, 60);
        }
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: lastPos }, (results: any, status: string) => {
        if (status === 'OK' && results?.[0]) {
          setEndAddress(results[0].formatted_address);
        } else if (!endAddress && !destAddress) {
          setEndAddress(`${lastPos.lat.toFixed(5)}, ${lastPos.lng.toFixed(5)}`);
        }
      });
    } else if (!endAddress && !destAddress && startCoordsRef.current) {
      setEndAddress(startAddress);
    }

    setPhase('ended');
  };

  const canSendToSort = startAddress.length > 2 && endAddress.length > 2 && tripKm > 0;

  const handleSendToSort = () => {
    if (!startAddress || !endAddress || tripKm <= 0) return;
    const startD = new Date(startTime || Date.now());
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${dayNames[startD.getDay()]}, ${startD.getDate()} ${monthNames[startD.getMonth()]}`;
    const h = startD.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const timeStr = `${h12}:${String(startD.getMinutes()).padStart(2, '0')} ${ampm}`;
    const fromParts = startAddress.split(',');
    const toParts = endAddress.split(',');

    const trip: Trip = {
      id: nextManualId++,
      date: dateStr,
      day: startD.getDate(),
      month: startD.getMonth(),
      year: startD.getFullYear(),
      time: timeStr,
      duration: tripDuration,
      km: tripKm,
      from: fromParts[0].trim(),
      fromSub: fromParts.slice(1).join(',').trim(),
      to: toParts[0].trim(),
      toSub: toParts.slice(1).join(',').trim(),
      type: tripType,
      verified: false,
      photo: false,
      odoReading: null,
      odoStartReading: null,
      purposeLabel: null,
      purposeIndex: null,
      stops: tripStops.filter(s => s.length > 2),
      notes: tripNotes,
    };

    dispatch({ type: 'ADD_TRIP', trip });
    dispatch({ type: 'ADD_LOG', desc: `Live trip ended: ${trip.from} → ${trip.to} (${tripKm} km) — sent to sort`, hasPhoto: false });
    setSaved(true);
    setTimeout(() => {
      dispatch({ type: 'GO_SCREEN', screen: 'sort' });
    }, 1200);
  };

  if (phase === 'setup') {
    return (
      <div className="flex flex-col h-full relative" data-testid="live-setup-screen">
        <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
          <button
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
            style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
            onClick={onBack}
            data-testid="button-back-live"
          >
            <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
          </button>
          <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Start Trip</span>
        </div>

        <div className="flex-1 px-[18px] flex flex-col justify-center pb-[40px]">
          <div className="rounded-[16px] p-[20px] mb-[16px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
            <div className="flex items-center gap-[10px] mb-[14px]">
              <Navigation className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-heading font-bold text-[14px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>Where are you starting?</span>
            </div>

            <button
              className="w-full rounded-[10px] p-[11px_14px] mb-[10px] flex items-center gap-[10px] cursor-pointer transition-all"
              style={{
                background: geoStatus === 'done' ? 'rgba(34,197,94,.08)' : 'rgb(var(--wc-ink) / .05)',
                border: geoStatus === 'done' ? '1.5px solid rgba(34,197,94,.3)' : '1.5px solid var(--wc-border)',
              }}
              onClick={handleUseCurrentLocation}
              disabled={geoStatus === 'loading'}
              data-testid="button-use-location"
            >
              <Crosshair className="w-[16px] h-[16px] flex-shrink-0" style={{ color: geoStatus === 'done' ? 'var(--wc-gr)' : 'var(--wc-y)' }} />
              <span className="text-[12px] font-bold" style={{ color: geoStatus === 'done' ? 'var(--wc-gr)' : 'var(--wc-t2)' }}>
                {geoStatus === 'loading' ? 'Getting location...' : geoStatus === 'done' ? 'Location found' : geoStatus === 'error' ? 'Location unavailable' : 'Use Current Location'}
              </span>
              {geoStatus === 'done' && <Check className="w-[14px] h-[14px] ml-auto" style={{ color: 'var(--wc-gr)' }} />}
            </button>

            {geoStatus === 'error' && (
              <div className="text-[10px] mb-[8px] px-[4px]" style={{ color: 'var(--wc-re)' }}>
                Could not get location. Please enable location permissions or enter an address below.
              </div>
            )}

            <div className="flex items-center gap-[8px] mb-[10px]">
              <div className="flex-1 h-[1px]" style={{ background: 'var(--wc-border)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.15em]" style={{ color: 'var(--wc-t3)' }}>or enter address</span>
              <div className="flex-1 h-[1px]" style={{ background: 'var(--wc-border)' }} />
            </div>

            <div className="flex gap-[8px] mt-[8px]">
              <AddressInput
                className="rounded-[10px] p-[12px_14px] text-[13px] outline-none transition-all"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
                value={startAddress}
                onChange={(v) => { setStartAddress(v); if (geoStatus === 'done') setGeoStatus('idle'); startCoordsRef.current = null; }}
                placeholder="Enter starting address"
                data-testid="live-start-address"
              />
              <button
                className="rounded-[10px] px-[10px] flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)' }}
                onClick={() => setShowMapPicker('start')}
                data-testid="button-map-pick-start"
              >
                <MapPin className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
              </button>
            </div>
          </div>

          <div className="rounded-[16px] p-[20px] mb-[16px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
            <div className="flex items-center gap-[10px] mb-[14px]">
              <MapPin className="w-[18px] h-[18px]" style={{ color: 'var(--wc-t2)' }} />
              <span className="font-heading font-bold text-[14px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-t2)' }}>Where are you going?</span>
              <span className="ml-auto font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Optional</span>
            </div>

            <div className="flex gap-[8px]">
              <AddressInput
                className="rounded-[10px] p-[12px_14px] text-[13px] outline-none transition-all"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
                value={destAddress}
                onChange={(v) => { setDestAddress(v); destCoordsRef.current = null; }}
                placeholder="Enter destination address"
                data-testid="live-dest-address"
              />
              <button
                className="rounded-[10px] px-[10px] flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)' }}
                onClick={() => setShowMapPicker('dest')}
                data-testid="button-map-pick-dest"
              >
                <MapPin className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
              </button>
            </div>
            <div className="text-[10px] mt-[8px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>
              {destAddress ? 'We\'ll show turn-by-turn directions and ETA while you drive.' : 'Add a destination for navigation assistance, or leave blank to just record.'}
            </div>
          </div>

          <button
            className="w-full rounded-[14px] py-[16px] font-heading font-black text-[18px] tracking-[.07em] uppercase flex items-center justify-center gap-[8px] transition-all"
            style={{
              background: startAddress.length > 3 ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
              color: startAddress.length > 3 ? 'var(--wc-bg)' : 'rgb(var(--wc-ink) / .4)',
              cursor: startAddress.length > 3 ? 'pointer' : 'not-allowed',
            }}
            onClick={handleCommence}
            disabled={startAddress.length <= 3}
            data-testid="button-commence"
          >
            <Car className="w-[20px] h-[20px]" strokeWidth={2.5} />
            Start Trip
          </button>
        </div>

        {showMapPicker && (
          <div className="absolute inset-0 z-50 flex flex-col" style={{ background: 'var(--wc-bg)' }} data-testid="map-picker-overlay">
            <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
              <button
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center cursor-pointer"
                style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
                onClick={() => setShowMapPicker(null)}
                data-testid="button-map-picker-cancel"
              >
                <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
              </button>
              <span className="font-heading font-extrabold text-[16px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>
                {showMapPicker === 'start' ? 'Pick Start' : 'Pick Destination'}
              </span>
            </div>
            <div className="px-[14px] pb-[6px] flex-shrink-0">
              <div className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>Tap the map to place your pin</div>
            </div>
            <div className="flex-1 mx-[14px] rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--wc-border)' }}>
              <div ref={mapPickerRef} className="w-full h-full" style={{ minHeight: '300px' }} data-testid="map-picker-map" />
            </div>
            <div className="px-[14px] pt-[10px] pb-[8px] flex-shrink-0">
              <button
                className="w-full rounded-[14px] py-[14px] font-heading font-black text-[16px] tracking-[.06em] uppercase flex items-center justify-center gap-[8px] cursor-pointer transition-all"
                style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                onClick={handleMapPickerConfirm}
                data-testid="button-map-picker-confirm"
              >
                <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
                Confirm Location
              </button>
            </div>
          </div>
        )}
  
      </div>
    );
  }

  if (phase === 'driving' || phase === 'paused') {
    const isPaused = phase === 'paused';
    const liveDeduction = getEstimatedDeduction(tripKm);
    return (
      <div className="flex flex-col h-full" data-testid="live-driving-screen">
        <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
          <div className="w-[8px] h-[8px] rounded-full" style={{ background: isPaused ? 'var(--wc-am)' : 'var(--wc-gr)', animation: isPaused ? 'none' : 'pulse 2s infinite' }} />
          <span className="font-heading font-extrabold text-[14px] uppercase tracking-[.04em]" style={{ color: isPaused ? 'var(--wc-am)' : 'var(--wc-gr)' }}>
            {isPaused ? 'Paused' : 'Recording'}
          </span>
          {destAddress ? (
            <span className="ml-auto text-[10px] truncate" style={{ color: 'var(--wc-t3)', maxWidth: '55%' }}>→ {destAddress.length > 30 ? destAddress.slice(0, 28) + '…' : destAddress}</span>
          ) : (
            <span className="ml-auto text-[10px] truncate" style={{ color: 'var(--wc-t3)', maxWidth: '55%' }}>{startAddress.length > 35 ? startAddress.slice(0, 33) + '…' : startAddress}</span>
          )}
        </div>

        <div className="flex-1 mx-[14px] rounded-[14px] overflow-hidden relative" style={{ border: '1px solid var(--wc-border)', background: 'var(--wc-card)', minHeight: '200px', perspective: '800px' }}>
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '200px', transform: 'rotateX(25deg) scale(1.15)', transformOrigin: 'center 60%' }} data-testid="live-map" />
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[8px]" style={{ background: 'var(--wc-card)' }}>
              <Navigation className="w-[28px] h-[28px] animate-pulse" style={{ color: 'var(--wc-y)' }} />
              <span className="font-heading text-[12px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>Loading map...</span>
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[8px]" style={{ background: 'var(--wc-card)' }}>
              <Navigation className="w-[28px] h-[28px]" style={{ color: 'var(--wc-t3)' }} />
              <span className="font-heading text-[12px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>Map unavailable</span>
              <span className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>Trip still recording — {tripKm.toFixed(1)} km</span>
            </div>
          )}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.45)' }}>
              <div className="rounded-[12px] p-[16px_24px] text-center" style={{ background: 'rgba(153,153,153,.1)', border: '1.5px solid rgba(153,153,153,.3)' }}>
                <Pause className="w-[24px] h-[24px] mx-auto mb-[6px]" style={{ color: 'var(--wc-am)' }} />
                <div className="font-heading font-bold text-[14px] uppercase" style={{ color: 'var(--wc-am)' }}>Paused</div>
              </div>
            </div>
          )}
        </div>

        <div className="px-[14px] pt-[8px] flex-shrink-0">
          {navInfo && (
            <div className="rounded-[10px] p-[8px_12px] mb-[8px] flex items-center gap-[10px]" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }} data-testid="nav-directions-bar">
              <Navigation2 className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate leading-tight" style={{ color: 'var(--wc-text)' }} data-testid="text-nav-step">{navInfo.nextStep}</div>
                <div className="flex items-center gap-[8px] mt-[2px]">
                  <span className="font-data text-[9px] uppercase" style={{ color: 'var(--wc-t3)' }}>{navInfo.remainingKm} km left</span>
                  <span className="font-data text-[9px]" style={{ color: 'var(--wc-t3)' }}>·</span>
                  <span className="font-data text-[9px] uppercase" style={{ color: 'var(--wc-t3)' }}>{navInfo.etaMins} min</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-[6px] mb-[8px]">
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Distance</div>
              <div className="font-display text-[20px] leading-none" style={{ color: 'var(--wc-y)' }} data-testid="text-live-km">{tripKm.toFixed(1)}</div>
              <div className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>km</div>
            </div>
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Time</div>
              <div className="font-display text-[20px] leading-none" style={{ color: 'var(--wc-text)' }} data-testid="text-live-time">{fmtElapsed(elapsed)}</div>
              <div className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>elapsed</div>
            </div>
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Est. Claim</div>
              <div className="font-display text-[20px] leading-none" style={{ color: tripType === 'business' ? 'var(--wc-gr)' : 'var(--wc-t2)' }} data-testid="text-live-deduction">${liveDeduction.toFixed(2)}</div>
              <div className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>{tripType === 'business' ? 'claimable' : 'if business'}</div>
            </div>
          </div>

          <div className="flex gap-[6px] mb-[8px]">
            <button
              className="flex-1 rounded-[10px] py-[9px] font-heading font-bold text-[11px] tracking-[.05em] uppercase flex items-center justify-center gap-[5px] cursor-pointer transition-all"
              style={{
                background: tripType === 'business' ? 'rgba(34,197,94,.1)' : 'rgb(var(--wc-ink) / .04)',
                border: tripType === 'business' ? '1.5px solid rgba(34,197,94,.4)' : '1.5px solid var(--wc-border)',
                color: tripType === 'business' ? 'var(--wc-gr)' : 'var(--wc-t2)',
              }}
              onClick={() => setTripType(tripType === 'business' ? null : 'business')}
              data-testid="button-trip-business"
            >
              <Briefcase className="w-[13px] h-[13px]" />
              Business
            </button>
            <button
              className="flex-1 rounded-[10px] py-[9px] font-heading font-bold text-[11px] tracking-[.05em] uppercase flex items-center justify-center gap-[5px] cursor-pointer transition-all"
              style={{
                background: tripType === 'personal' ? 'rgb(var(--wc-ink) / .1)' : 'rgb(var(--wc-ink) / .04)',
                border: tripType === 'personal' ? '1.5px solid rgb(var(--wc-ink) / .4)' : '1.5px solid var(--wc-border)',
                color: tripType === 'personal' ? 'var(--wc-text)' : 'var(--wc-t2)',
              }}
              onClick={() => setTripType(tripType === 'personal' ? null : 'personal')}
              data-testid="button-trip-personal"
            >
              <Car className="w-[13px] h-[13px]" />
              Personal
            </button>
          </div>

          <div className="flex gap-[8px] pb-[6px]">
            <button
              className="flex-1 rounded-[12px] py-[12px] font-heading font-black text-[14px] tracking-[.05em] uppercase flex items-center justify-center gap-[6px] transition-all cursor-pointer"
              style={{
                background: isPaused ? 'rgba(34,197,94,.12)' : 'rgba(153,153,153,.08)',
                border: isPaused ? '2px solid rgba(34,197,94,.3)' : '2px solid rgba(153,153,153,.25)',
                color: isPaused ? 'var(--wc-gr)' : 'var(--wc-am)',
              }}
              onClick={isPaused ? handleResume : handlePause}
              data-testid={isPaused ? 'button-resume' : 'button-pause'}
            >
              {isPaused ? <Play className="w-[15px] h-[15px]" strokeWidth={2.5} /> : <Pause className="w-[15px] h-[15px]" strokeWidth={2.5} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              className="flex-1 rounded-[12px] py-[12px] font-heading font-black text-[14px] tracking-[.05em] uppercase flex items-center justify-center gap-[6px] transition-all cursor-pointer"
              style={{
                background: 'var(--wc-re)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(239,68,68,.25)',
              }}
              onClick={handleEndTrip}
              data-testid="button-end-trip"
            >
              <Square className="w-[13px] h-[13px]" fill="currentColor" strokeWidth={0} />
              End Trip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="live-ended-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Trip Complete</span>
      </div>

      <div className="flex-1 px-[18px] pt-[6px] overflow-y-auto scrollbar-thin pb-[10px]">
        <div className="rounded-[14px] p-[16px] mb-[12px]" style={{ background: 'rgba(34,197,94,.05)', border: '1.5px solid rgba(34,197,94,.2)' }}>
          <div className="flex items-center gap-[8px] mb-[10px]">
            <Check className="w-[16px] h-[16px]" style={{ color: 'var(--wc-gr)' }} />
            <span className="font-heading font-bold text-[14px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-gr)' }}>Trip Recorded</span>
          </div>
          <div className="flex flex-col gap-[6px] text-[12px]" style={{ color: 'var(--wc-t2)' }}>
            <div><strong style={{ color: 'var(--wc-text)' }}>From:</strong> {startAddress}</div>
            {endAddress && <div><strong style={{ color: 'var(--wc-text)' }}>To:</strong> {endAddress}</div>}
            <div><strong style={{ color: 'var(--wc-text)' }}>Duration:</strong> {tripDuration}</div>
            <div><strong style={{ color: 'var(--wc-text)' }}>Distance:</strong> <span className="font-data font-bold" style={{ color: 'var(--wc-y)' }}>{tripKm.toFixed(1)} km</span></div>
          </div>
        </div>

        <div className="flex gap-[8px] mb-[12px]">
          <div className="flex-1 rounded-[12px] p-[12px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <div className="flex items-center gap-[6px] mb-[4px]">
              <DollarSign className="w-[12px] h-[12px]" style={{ color: 'var(--wc-y)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Est. Deduction</span>
            </div>
            <div className="font-display text-[22px] leading-none" style={{ color: 'var(--wc-y)' }} data-testid="text-est-deduction">
              ${getEstimatedDeduction(tripKm).toFixed(2)}
            </div>
            <div className="font-data text-[8px] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>if business trip</div>
          </div>
          <div className="flex-1 rounded-[12px] p-[12px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <div className="flex items-center gap-[6px] mb-[4px]">
              <Fuel className="w-[12px] h-[12px]" style={{ color: 'var(--wc-t2)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Est. Fuel Cost</span>
            </div>
            <div className="font-display text-[22px] leading-none" style={{ color: 'var(--wc-text)' }} data-testid="text-est-fuel">
              ${getEstimatedFuelCost(tripKm).toFixed(2)}
            </div>
            <div className="font-data text-[8px] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>this trip</div>
          </div>
        </div>

        {!endAddress && (
          <div className="mb-[10px]">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Destination</label>
            <AddressInput
              className="w-full rounded-[10px] p-[10px_12px] text-[12px] outline-none transition-all"
              style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
              value={endAddress}
              onChange={setEndAddress}
              placeholder="Enter destination"
              data-testid="live-end-address"
            />
          </div>
        )}

        <div className="rounded-[10px] p-[10px_14px] mb-[10px]" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid var(--wc-border)' }}>
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Distance (km)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            className="w-full rounded-lg p-[8px_11px] text-[13px] outline-none font-data"
            style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
            value={tripKm || ''}
            onChange={e => setTripKm(parseFloat(e.target.value) || 0)}
            placeholder="Min 1"
            data-testid="live-manual-km"
          />
        </div>

        {tripStops.map((s, i) => (
          <div key={i} className="flex items-center gap-[5px] mb-[6px]">
            <AddressInput
              className="w-full rounded-[8px] p-[7px_10px] text-[12px] outline-none"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
              placeholder={`Stop ${i + 1}`}
              value={s}
              onChange={v => { const n = [...tripStops]; n[i] = v; setTripStops(n); }}
            />
            <button className="rounded-[6px] p-[5px_7px] text-[11px] cursor-pointer" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--wc-re)' }} onClick={() => { const n = [...tripStops]; n.splice(i, 1); setTripStops(n); }}>X</button>
          </div>
        ))}

        <button
          className="w-full rounded-[8px] p-[7px_10px] mb-[10px] font-heading font-semibold text-[10px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center justify-center gap-[5px]"
          style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px dashed var(--wc-border)', color: 'var(--wc-t2)' }}
          onClick={() => setTripStops([...tripStops, ''])}
          data-testid="live-add-stop"
        >
          <Route className="w-[11px] h-[11px]" />
          + Add Stop
        </button>

        <div className="mb-[10px]">
          <div className="flex items-center gap-[6px] mb-[4px]">
            <StickyNote className="w-[11px] h-[11px]" style={{ color: 'var(--wc-t3)' }} />
            <label className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>Notes</label>
          </div>
          <textarea
            className="w-full rounded-[10px] p-[9px_12px] text-[12px] outline-none resize-none h-[50px]"
            style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
            value={tripNotes}
            onChange={e => setTripNotes(e.target.value)}
            placeholder="Add notes about this trip (optional)"
            data-testid="live-notes"
          />
        </div>

        {saved ? (
          <div
            className="w-full rounded-[14px] py-[15px] font-heading font-extrabold text-[16px] tracking-[.06em] uppercase flex items-center justify-center gap-2 transition-all"
            style={{ background: 'rgba(34,197,94,.12)', border: '2px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}
            data-testid="live-saved-confirm"
          >
            <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Sent to Sort
          </div>
        ) : (
          <button
            className="w-full rounded-[14px] py-[15px] font-heading font-black text-[17px] tracking-[.07em] uppercase transition-all flex items-center justify-center gap-[8px]"
            style={{
              background: canSendToSort ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
              color: 'var(--wc-bg)',
              opacity: canSendToSort ? 1 : 0.5,
              boxShadow: canSendToSort ? '0 4px 20px rgb(var(--wc-ink) / .25)' : 'none',
              cursor: canSendToSort ? 'pointer' : 'not-allowed',
            }}
            onClick={handleSendToSort}
            disabled={!canSendToSort}
            data-testid="button-send-to-sort"
          >
            <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Send to Sort
          </button>
        )}
      </div>


    </div>
  );
}

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
})();

function getMonthDays(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const rows: (Date | null)[][] = [];
  let row: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) row.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    row.push(new Date(year, month, d));
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

function WhenWasTripScreen({ onBack, onContinue, initialDate, initialTime, unsortedCount, onSendToSort }: { onBack: () => void; onContinue: (date: string, time: string) => void; initialDate?: string; initialTime?: string; unsortedCount?: number; onSendToSort?: () => void }) {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const getInitialDate = () => {
    let d: Date;
    if (initialDate) {
      const [y, m, day] = initialDate.split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(todayDate);
    }
    return d > todayDate ? todayDate : d;
  };
  const getInitialTime = () => {
    if (initialTime) {
      const [h, m] = initialTime.split(':').map(Number);
      const rounded = Math.floor(m / 15) * 15;
      return `${String(h).padStart(2, '0')}:${String(rounded).padStart(2, '0')}`;
    }
    const h = today.getHours();
    const m = Math.floor(today.getMinutes() / 15) * 15;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const [viewMonth, setViewMonth] = useState(() => {
    const d = getInitialDate();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);
  const [time, setTime] = useState(getInitialTime);
  const timeScrollRef = useRef<HTMLDivElement>(null);

  const setToday = useCallback(() => {
    const now = new Date();
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    setViewMonth({ year: now.getFullYear(), month: now.getMonth() });
    const m = Math.floor(now.getMinutes() / 15) * 15;
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    const el = timeScrollRef.current;
    if (!el) return;
    const idx = TIME_SLOTS.indexOf(time);
    if (idx >= 0) {
      const item = el.querySelector(`[data-time="${time}"]`);
      item?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [time]);

  const monthDays = useMemo(() => getMonthDays(viewMonth.year, viewMonth.month), [viewMonth.year, viewMonth.month]);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handleContinue = useCallback(() => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    onContinue(dateStr, time);
  }, [selectedDate, time, onContinue]);

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const isSelected = (d: Date) =>
    d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  const isFutureDate = (d: Date) => {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return day > todayDate;
  };
  const canGoNextMonth = viewMonth.year > today.getFullYear() || (viewMonth.year === today.getFullYear() && viewMonth.month < today.getMonth());

  return (
    <div className="flex flex-col h-full" data-testid="when-was-trip-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          type="button"
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center cursor-pointer"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-when"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>
          When was this trip?
        </span>
        {unsortedCount != null && unsortedCount > 0 && onSendToSort && (
          <button
            type="button"
            className="ml-auto rounded-[8px] px-[10px] py-[5px] font-heading font-bold text-[10px] uppercase tracking-[.05em] flex items-center gap-[4px] cursor-pointer transition-all"
            style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
            onClick={onSendToSort}
            data-testid="button-send-to-sort-when"
          >
            <ArrowRight className="w-[12px] h-[12px]" strokeWidth={2.5} />
            Send to sort ({unsortedCount})
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[6px] pb-[10px]">
        <button
          type="button"
          className="w-full rounded-[12px] py-[12px] mb-[14px] font-heading font-bold text-[14px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center justify-center gap-[8px]"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '2px solid var(--wc-border)', color: 'var(--wc-text)' }}
          onClick={setToday}
          data-testid="button-today"
        >
          <Calendar className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
          Today
        </button>

        <div className="flex gap-[14px] mb-[16px]">
          <div className="flex-1">
            <div className="font-data text-[9px] uppercase tracking-[.12em] mb-[8px]" style={{ color: 'var(--wc-t3)' }}>
              Date
            </div>
            <div className="rounded-[14px] p-[14px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="flex items-center justify-between mb-[10px]">
                <button
                  type="button"
                  className="w-[32px] h-[32px] rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgb(var(--wc-ink) / .08)', border: '1px solid var(--wc-border)' }}
                  onClick={() => setViewMonth(m => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t2)' }} />
                </button>
                <span className="font-heading font-bold text-[14px]" style={{ color: 'var(--wc-text)' }}>
                  {monthNames[viewMonth.month]} {viewMonth.year}
                </span>
                <button
                  type="button"
                  className="w-[32px] h-[32px] rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgb(var(--wc-ink) / .08)', border: '1px solid var(--wc-border)' }}
                  onClick={() => setViewMonth(m => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }))}
                  disabled={!canGoNextMonth}
                  data-testid="button-next-month"
                  title={!canGoNextMonth ? 'Cannot add trips for future dates' : undefined}
                >
                  <ChevronRight className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t2)' }} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-[4px]">
                {dayNames.map((d, i) => (
                  <div key={i} className="text-center font-data text-[9px] font-semibold py-[4px]" style={{ color: 'var(--wc-t3)' }}>
                    {d}
                  </div>
                ))}
                {monthDays.flat().map((d, i) => (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    {d ? (
                      <button
                        type="button"
                        className="w-full h-full rounded-lg font-heading font-bold text-[13px] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: isSelected(d) ? 'var(--wc-y)' : isToday(d) ? 'rgb(var(--wc-ink) / .12)' : 'transparent',
                          color: isSelected(d) ? 'var(--wc-bg)' : isFutureDate(d) ? 'var(--wc-t3)' : 'var(--wc-text)',
                          border: isToday(d) && !isSelected(d) ? '2px solid var(--wc-y)' : 'none',
                        }}
                        onClick={() => !isFutureDate(d) && setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                        disabled={isFutureDate(d)}
                        data-testid={isSelected(d) ? 'day-selected' : undefined}
                        title={isFutureDate(d) ? 'Cannot add trips for future dates' : undefined}
                      >
                        {d.getDate()}
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-[100px] flex-shrink-0">
            <div className="font-data text-[9px] uppercase tracking-[.12em] mb-[8px]" style={{ color: 'var(--wc-t3)' }}>
              Time
            </div>
            <div
              ref={timeScrollRef}
              className="rounded-[14px] overflow-y-auto scrollbar-thin h-[200px] py-[6px] snap-y snap-mandatory"
              style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}
              data-testid="time-scroll"
            >
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  data-time={t}
                  className="w-full py-[8px] font-data text-[13px] cursor-pointer transition-all block text-center rounded-[6px] mx-[4px] snap-center"
                  style={{
                    background: time === t ? 'var(--wc-y)' : 'transparent',
                    color: time === t ? 'var(--wc-bg)' : 'var(--wc-text)',
                  }}
                  onClick={() => setTime(t)}
                >
                  {(() => {
                    const [h, m] = t.split(':').map(Number);
                    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
                  })()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-[14px] py-[16px] font-heading font-black text-[18px] tracking-[.07em] uppercase flex items-center justify-center gap-[8px] cursor-pointer transition-all"
          style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
          onClick={handleContinue}
          data-testid="button-when-continue"
        >
          <ArrowRight className="w-[20px] h-[20px]" strokeWidth={2.5} />
          Continue
        </button>
      </div>
    </div>
  );
}

function ExistingTripScreen({
  onBack,
  initialDate,
  initialTime,
  onPrepareForOdometerConfirm,
}: {
  onBack: () => void;
  initialDate?: string;
  initialTime?: string;
  onPrepareForOdometerConfirm?: (data: PendingTripData) => void;
}) {
  const { state, dispatch } = useApp();

  const lastTripTo = useMemo(() => {
    if (state.trips.length === 0) return '';
    const last = state.trips[state.trips.length - 1];
    return [last.to, last.toSub].filter(Boolean).join(', ');
  }, [state.trips]);

  const [from, setFrom] = useState(lastTripTo);
  const [fromEdited, setFromEdited] = useState(false);
  const [to, setTo] = useState('');
  const [km, setKm] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(() => initialDate ?? new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    if (initialTime) return initialTime;
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calcStatus, setCalcStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const [frequentRoutes, setFrequentRoutes] = useState<SavedRoute[]>([]);
  const [shortcuts, setShortcuts] = useState<SavedShortcut[]>([]);
  const [shortcutUsedForFrom, setShortcutUsedForFrom] = useState(false);
  const [suggestedPlaces, setSuggestedPlaces] = useState<SavedPlace[]>([]);
  const calcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMapPicker, setShowMapPicker] = useState<'from' | 'to' | null>(null);
  const mapPickerRef = useRef<HTMLDivElement>(null);
  const mapPickerInstanceRef = useRef<any>(null);
  const mapPickerMarkerRef = useRef<any>(null);
  const pickedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setFrequentRoutes(getTopRoutes(3));
    setShortcuts(getShortcuts());
    setSuggestedPlaces(getTopPlaces(from, 3));
    preloadGoogleMaps();
  }, []);

  useEffect(() => {
    setSuggestedPlaces(getTopPlaces(from, 3));
  }, [from]);

  // Auto-calculate route when both addresses are filled
  useEffect(() => {
    if (calcTimerRef.current) clearTimeout(calcTimerRef.current);
    if (!from || !to || from.length < 5 || to.length < 5) return;

    calcTimerRef.current = setTimeout(() => {
      if (!window._gmapsLoaded) return;
      setCalcStatus('loading');
      const validStops = stops.filter(s => s.length > 3);
      const waypoints = validStops.map(s => ({ location: s, stopover: true }));
      const ds = new window.google.maps.DirectionsService();
      ds.route({
        origin: from,
        destination: to,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'au',
      }, (result: any, status: string) => {
        if (status === 'OK' && result?.routes?.[0]) {
          let totalM = 0, totalSec = 0;
          result.routes[0].legs.forEach((leg: any) => {
            totalM += leg.distance?.value || 0;
            totalSec += leg.duration?.value || 0;
          });
          const calcKm = totalM / 1000;
          const mins = Math.round(totalSec / 60);
          const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
          setKm(calcKm.toFixed(1));
          setDuration(durStr);
          setCalcStatus('done');
        } else {
          setCalcStatus('error');
        }
      });
    }, 800);

    return () => { if (calcTimerRef.current) clearTimeout(calcTimerRef.current); };
  }, [from, to, stops]);

  useEffect(() => {
    if (calcStatus === 'error') setShowDetails(true);
  }, [calcStatus]);

  useEffect(() => {
    if (!showMapPicker || !mapPickerRef.current || !window._gmapsLoaded) return;
    const defaultCenter = { lat: -33.8688, lng: 151.2093 };
    const isDark = document.documentElement.classList.contains('dark');
    const map = new window.google.maps.Map(mapPickerRef.current, {
      center: defaultCenter,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: getMapStyles(),
    });
    mapPickerInstanceRef.current = map;
    const marker = new window.google.maps.Marker({
      position: defaultCenter,
      map,
      draggable: true,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: isDark ? '#FFFFFF' : '#000000',
        fillOpacity: 1,
        strokeColor: '#EAB308',
        strokeWeight: 3,
      },
    });
    mapPickerMarkerRef.current = marker;
    pickedCoordsRef.current = defaultCenter;
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) pickedCoordsRef.current = { lat: pos.lat(), lng: pos.lng() };
    });
    map.addListener('click', (e: any) => {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      marker.setPosition(pos);
      pickedCoordsRef.current = pos;
    });
    return () => {
      mapPickerInstanceRef.current = null;
      mapPickerMarkerRef.current = null;
    };
  }, [showMapPicker]);

  const handleMapPickerConfirm = useCallback(() => {
    if (!pickedCoordsRef.current || !window._gmapsLoaded) {
      setShowMapPicker(null);
      return;
    }
    const coords = pickedCoordsRef.current;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results: any, status: string) => {
      const addr = status === 'OK' && results?.[0] ? results[0].formatted_address : `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      if (showMapPicker === 'from') {
        setFrom(addr);
        setFromEdited(true);
      } else {
        setTo(addr);
      }
      setShowMapPicker(null);
    });
  }, [showMapPicker]);

  const openMapPicker = useCallback((which: 'from' | 'to') => {
    loadGoogleMaps()
      .then(() => setShowMapPicker(which))
      .catch(() => {});
  }, []);

  const odoStart = useMemo(() => {
    const insertIdx = getInsertIndexForNewTrip(state.trips, date, time);
    if (insertIdx === 0) return state.baseOdo ?? ODO_START;
    return getTripOdoEnd(state.trips, insertIdx - 1, state.baseOdo);
  }, [state.trips, state.baseOdo, date, time]);

  const parsedKm = parseFloat(km) || 0;
  const odoEnd = Math.round(odoStart + parsedKm);
  const isAutoFilled = !fromEdited && from === lastTripTo && lastTripTo.length > 0;

  const handleFromChange = useCallback((v: string) => {
    setFrom(v);
    setFromEdited(true);
  }, []);

  const handleQuickAdd = useCallback((route: SavedRoute, reverse = false) => {
    const fromAddr = reverse ? route.toAddress : route.fromAddress;
    const toAddr = reverse ? route.fromAddress : route.toAddress;
    setFrom(fromAddr);
    setTo(toAddr);
    setFromEdited(true);
    if (route.km > 0) {
      setKm(route.km.toFixed(1));
      setDuration(route.duration || '');
    }
  }, []);

  const handleShortcutSelect = useCallback((shortcut: SavedShortcut) => {
    if (!shortcutUsedForFrom) {
      setFrom(shortcut.address);
      setFromEdited(true);
      setShortcutUsedForFrom(true);
    } else {
      setTo(shortcut.address);
    }
  }, [shortcutUsedForFrom]);

  const handleSave = () => {
    if (!from || !to || parsedKm < 1) return;

    if (onPrepareForOdometerConfirm) {
      const d = new Date(date + 'T00:00:00');
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [hStr, mStr] = time.split(':');
      const h = parseInt(hStr);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      onPrepareForOdometerConfirm({
        from,
        to,
        km: parsedKm,
        date: `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`,
        dateObj: { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() },
        time: `${h12}:${mStr} ${ampm}`,
        duration: duration || '',
        notes: notes || '',
        stops: stops.filter(s => s.length > 3),
        suggestedOdoStart: Math.round(odoStart),
        suggestedOdoEnd: odoEnd,
      });
      return;
    }

    recordPlace(from);
    recordPlace(to);
    recordRoute(from, to, parsedKm, duration);

    const d = new Date(date + 'T00:00:00');
    const fromParts = from.split(',');
    const toParts = to.split(',');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;

    const [hStr2, mStr2] = time.split(':');
    const h2 = parseInt(hStr2);
    const ampm2 = h2 >= 12 ? 'PM' : 'AM';
    const h122 = h2 === 0 ? 12 : h2 > 12 ? h2 - 12 : h2;
    const timeStr = `${h122}:${mStr2} ${ampm2}`;

    const trip: Trip = {
      id: nextManualId++,
      date: dateStr,
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      time: timeStr,
      duration: duration || '',
      km: parsedKm,
      from: fromParts[0].trim(),
      fromSub: fromParts.slice(1).join(',').trim(),
      to: toParts[0].trim(),
      toSub: toParts.slice(1).join(',').trim(),
      type: null,
      verified: false,
      photo: false,
      odoReading: odoEnd,
      odoStartReading: Math.round(odoStart),
      purposeLabel: null,
      purposeIndex: null,
      stops: stops.filter(s => s.length > 3),
      notes: notes || '',
    };

    dispatch({ type: 'ADD_TRIP', trip });
    dispatch({ type: 'ADD_LOG', desc: `Trip added: ${trip.from} → ${trip.to} (${parsedKm} km) — sent to sort`, hasPhoto: false });
    setSaved(true);
    setTimeout(() => {
      dispatch({ type: 'GO_SCREEN', screen: 'sort' });
    }, 1200);
  };

  const canSave = from.length > 2 && to.length > 2 && parsedKm >= 1;

  const dateObj = new Date(date + 'T00:00:00');
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const displayDate = `${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`;
  const [hh, mm] = time.split(':');
  const hr = parseInt(hh);
  const displayTime = `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${mm} ${hr >= 12 ? 'PM' : 'AM'}`;

  return (
    <div className="flex flex-col h-full relative" data-testid="existing-trip-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-existing"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Add Trip</span>
        {state.trips.filter(t => t.type === null).length > 0 ? (
          <button
            type="button"
            className="ml-auto rounded-[8px] px-[10px] py-[5px] font-heading font-bold text-[10px] uppercase tracking-[.05em] flex items-center gap-[4px] cursor-pointer transition-all"
            style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
            onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'sort' })}
            data-testid="button-send-to-sort-existing"
          >
            <ArrowRight className="w-[12px] h-[12px]" strokeWidth={2.5} />
            Send to sort ({state.trips.filter(t => t.type === null).length})
          </button>
        ) : (
          <span className="ml-auto font-data text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>sends to sort</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[6px] pb-[10px]">

        {frequentRoutes.length > 0 && (
          <div className="mb-[14px]">
            <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[6px] flex items-center gap-[5px]" style={{ color: 'var(--wc-t3)' }}>
              <Route className="w-[10px] h-[10px]" />
              Your trips
            </div>
            <div className="flex gap-[8px] overflow-x-auto pb-[4px] scrollbar-thin">
              {frequentRoutes.map((route, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-[12px] p-[10px_14px] transition-all text-left relative"
                  style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1.5px solid var(--wc-border)', minWidth: '120px' }}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => handleQuickAdd(route)}
                  >
                    <div className="font-heading font-bold text-[11px] truncate leading-tight" style={{ color: 'var(--wc-text)', maxWidth: '130px' }}>
                      {route.fromLabel}
                    </div>
                    <div className="font-heading font-bold text-[11px] truncate leading-tight mt-[2px]" style={{ color: 'var(--wc-y)', maxWidth: '130px' }}>
                      → {route.toLabel}
                    </div>
                    <div className="font-data text-[9px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>
                      {route.km.toFixed(1)} km{route.duration ? ` · ${route.duration}` : ''}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="absolute top-[8px] right-[8px] z-10 rounded-[6px] p-[4px] opacity-60 hover:opacity-100 transition-opacity"
                    style={{ background: 'rgb(var(--wc-ink) / .1)' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuickAdd(route, true);
                    }}
                    title="Create reverse trip"
                    data-testid="button-reverse-trip"
                  >
                    <ArrowLeftRight className="w-[12px] h-[12px]" style={{ color: 'var(--wc-y)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {shortcuts.length > 0 && (
          <div className="mb-[14px]">
            <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[6px] flex items-center gap-[5px]" style={{ color: 'var(--wc-t3)' }}>
              <MapPin className="w-[10px] h-[10px]" />
              Shortcuts
            </div>
            <div className="flex gap-[8px] overflow-x-auto pb-[4px] scrollbar-thin">
              {shortcuts.map((s) => {
                const Icon = SYMBOL_MAP[s.symbol] || MapPin;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className="flex-shrink-0 rounded-[12px] p-[10px_14px] cursor-pointer transition-all text-left flex items-center gap-[8px]"
                    style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1.5px solid var(--wc-border)', minWidth: '100px' }}
                    onClick={() => handleShortcutSelect(s)}
                    title={shortcutUsedForFrom ? `Set as destination: ${s.label}` : `Set as start: ${s.label}`}
                  >
                    <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--wc-ink) / .08)' }}>
                      <Icon className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
                    </div>
                    <span className="font-heading font-bold text-[11px] truncate" style={{ color: 'var(--wc-text)', maxWidth: '80px' }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-[12px] rounded-[12px] p-[12px_14px] flex items-center gap-[10px]" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)' }}>
          <Calendar className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
          <div>
            <div className="font-heading font-bold text-[14px]" style={{ color: 'var(--wc-text)' }}>{displayDate}</div>
            <div className="font-data text-[11px]" style={{ color: 'var(--wc-t3)' }}>{displayTime}</div>
          </div>
        </div>

        <div className="mb-[10px]">
          <div className="flex items-center gap-[6px] mb-[4px]">
            <label className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>From</label>
            {isAutoFilled && (
              <span className="font-data text-[7px] tracking-[.05em]" style={{ color: 'var(--wc-y)' }}>· from last trip</span>
            )}
          </div>
          <div className="flex gap-[8px]">
            <AddressInput
              className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none transition-all"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: isAutoFilled ? '1.5px solid rgb(var(--wc-ink) / .25)' : '1.5px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
              value={from}
              onChange={handleFromChange}
              placeholder="Start address"
              data-testid="input-from"
            />
            <button
              type="button"
              className="rounded-lg px-[10px] flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)' }}
              onClick={() => openMapPicker('from')}
              data-testid="button-map-pick-from"
              title="Select on map"
            >
              <MapPin className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
            </button>
          </div>
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Where to?</label>
          <div className="flex gap-[8px]">
            <AddressInput
              className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none transition-all"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
              value={to}
              onChange={setTo}
              placeholder="Destination"
              data-testid="input-to"
            />
            <button
              type="button"
              className="rounded-lg px-[10px] flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)' }}
              onClick={() => openMapPicker('to')}
              data-testid="button-map-pick-to"
              title="Select on map"
            >
              <MapPin className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
            </button>
          </div>

          {suggestedPlaces.length > 0 && to.length < 3 && (
            <div className="flex gap-[6px] mt-[6px] flex-wrap">
              {suggestedPlaces.map((place, i) => (
                <button
                  key={i}
                  className="rounded-[8px] p-[5px_10px] cursor-pointer transition-all flex items-center gap-[4px]"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                  onClick={() => setTo(place.address)}
                >
                  <MapPin className="w-[10px] h-[10px]" style={{ color: 'var(--wc-y)' }} />
                  <span className="font-heading font-semibold text-[10px]">{place.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {calcStatus === 'loading' && (
          <div className="rounded-[10px] p-[8px_12px] mb-[10px] flex items-center gap-[8px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <Route className="w-[12px] h-[12px] animate-pulse" style={{ color: 'var(--wc-y)' }} />
            <span className="font-data text-[10px]" style={{ color: 'var(--wc-t3)' }}>Calculating route...</span>
          </div>
        )}

        {calcStatus === 'error' && (
          <div className="rounded-[10px] p-[8px_12px] mb-[10px] flex items-center gap-[6px]" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)' }}>
            <span className="text-[10px]" style={{ color: 'var(--wc-re)' }}>Could not calculate route. Enter distance below.</span>
          </div>
        )}

        {parsedKm > 0 && (
          <div className="flex gap-[6px] mb-[10px]">
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Distance</div>
              <div className="font-display text-[20px] leading-none" style={{ color: 'var(--wc-y)' }}>{km}</div>
              <div className="font-data text-[7px] uppercase" style={{ color: 'var(--wc-t3)' }}>km</div>
            </div>
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Date</div>
              <div className="font-data text-[13px] font-bold leading-none" style={{ color: 'var(--wc-text)' }}>{displayDate}</div>
              <div className="font-data text-[7px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>{displayTime}</div>
            </div>
            <div className="flex-1 rounded-[10px] p-[8px_10px] text-center" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
              <div className="font-data text-[7px] uppercase tracking-[.1em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Odometer</div>
              <div className="font-data text-[11px] font-bold leading-tight" style={{ color: 'var(--wc-text)' }}>{Math.round(odoStart).toLocaleString()}</div>
              <div className="font-data text-[9px]" style={{ color: 'var(--wc-y)' }}>→ {odoEnd.toLocaleString()}</div>
            </div>
          </div>
        )}

        <button
          className="w-full rounded-[8px] p-[8px] mb-[8px] font-heading font-semibold text-[11px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center justify-center gap-[5px]"
          style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
          onClick={() => setShowDetails(!showDetails)}
        >
          <span style={{ fontSize: '8px' }}>{showDetails ? '▲' : '▼'}</span>
          {showDetails ? 'Less' : 'More'} details
        </button>

        {showDetails && (
          <div className="rounded-[12px] p-[14px] mb-[10px]" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid var(--wc-border)' }}>
            <div className="flex gap-[6px] mb-[8px]">
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Date</label>
                <div className="relative">
                  <Calendar className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
                  <input
                    type="date"
                    className="w-full rounded-lg p-[7px_8px_7px_24px] text-[11px] outline-none"
                    style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    data-testid="input-date"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Time</label>
                <div className="relative">
                  <Clock className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
                  <input
                    type="time"
                    className="w-full rounded-lg p-[7px_8px_7px_24px] text-[11px] outline-none"
                    style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    data-testid="input-time"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-[6px] mb-[8px]">
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  className="w-full rounded-lg p-[7px_10px] text-[12px] outline-none font-data"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                  value={km}
                  onChange={e => setKm(e.target.value)}
                  placeholder="Min 1"
                  data-testid="input-km"
                />
              </div>
              <div className="flex-1">
                <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Duration</label>
                <input
                  className="w-full rounded-lg p-[7px_10px] text-[12px] outline-none"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 25 min"
                  data-testid="input-duration"
                />
              </div>
            </div>

            {stops.map((s, i) => (
              <div key={i} className="flex items-center gap-[5px] mb-[6px]">
                <AddressInput
                  className="w-full rounded-[7px] p-[6px_9px] text-[12px] outline-none"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
                  placeholder={`Stop ${i + 1}`}
                  value={s}
                  onChange={v => { const n = [...stops]; n[i] = v; setStops(n); }}
                />
                <button className="rounded-[6px] p-[5px_7px] text-[11px] cursor-pointer" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--wc-re)' }} onClick={() => { const n = [...stops]; n.splice(i, 1); setStops(n); }}>✕</button>
              </div>
            ))}
            <button
              className="w-full rounded-[7px] p-[5px_8px] mb-[8px] font-heading font-semibold text-[10px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center justify-center gap-[4px]"
              style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px dashed var(--wc-border)', color: 'var(--wc-t2)' }}
              onClick={() => setStops([...stops, ''])}
              data-testid="input-add-stop"
            >
              <Route className="w-[10px] h-[10px]" />
              + Add Stop
            </button>

            <div className="mb-[6px]">
              <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[3px]" style={{ color: 'var(--wc-t3)' }}>Notes</label>
              <textarea
                className="w-full rounded-lg p-[7px_10px] text-[11px] outline-none resize-none h-[40px]"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional"
                data-testid="input-notes"
              />
            </div>

            <div className="flex items-center gap-[6px]">
              <Gauge className="w-[11px] h-[11px]" style={{ color: 'var(--wc-t3)' }} />
              <span className="font-data text-[8px] uppercase tracking-[.1em]" style={{ color: 'var(--wc-t3)' }}>
                Odo: {Math.round(odoStart).toLocaleString()} → {parsedKm > 0 ? odoEnd.toLocaleString() : '—'} km (auto)
              </span>
            </div>
          </div>
        )}

        {saved ? (
          <div
            className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase flex items-center justify-center gap-2 transition-all mb-[6px]"
            style={{ background: 'rgba(34,197,94,.12)', border: '2px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}
            data-testid="input-saved-confirm"
          >
            <Check className="w-[16px] h-[16px]" strokeWidth={2.5} />
            Sent to Sort
          </div>
        ) : (
          <button
            className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase cursor-pointer transition-all mb-[6px] flex items-center justify-center gap-[6px]"
            style={{
              background: canSave ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
              color: 'var(--wc-bg)',
              opacity: canSave ? 1 : 0.5,
              boxShadow: canSave ? '0 4px 20px rgb(var(--wc-ink) / .25)' : 'none',
            }}
            onClick={handleSave}
            disabled={!canSave}
            data-testid="input-save-trip"
          >
            <ArrowRight className="w-[16px] h-[16px]" strokeWidth={2.5} />
            {onPrepareForOdometerConfirm ? 'Set Odometer Reading' : 'Send to Sort'}
          </button>
        )}
      </div>

      {showMapPicker && (
        <div className="absolute inset-0 z-50 flex flex-col" style={{ background: 'var(--wc-bg)' }} data-testid="map-picker-overlay-existing">
          <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
            <button
              type="button"
              className="w-[30px] h-[30px] rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
              onClick={() => setShowMapPicker(null)}
              data-testid="button-map-picker-cancel-existing"
            >
              <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
            </button>
            <span className="font-heading font-extrabold text-[16px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>
              {showMapPicker === 'from' ? 'Pick Start Address' : 'Pick Destination'}
            </span>
          </div>
          <div className="px-[14px] pb-[6px] flex-shrink-0">
            <div className="text-[11px]" style={{ color: 'var(--wc-t3)' }}>Tap the map to place your pin, or drag the marker</div>
          </div>
          <div className="flex-1 mx-[14px] rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--wc-border)' }}>
            <div ref={mapPickerRef} className="w-full h-full" style={{ minHeight: '300px' }} data-testid="map-picker-map-existing" />
          </div>
          <div className="px-[14px] pt-[10px] pb-[8px] flex-shrink-0">
            <button
              type="button"
              className="w-full rounded-[14px] py-[14px] font-heading font-black text-[16px] tracking-[.06em] uppercase flex items-center justify-center gap-[8px] cursor-pointer transition-all"
              style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
              onClick={handleMapPickerConfirm}
              data-testid="button-map-picker-confirm-existing"
            >
              <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
              Confirm Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface GapInfo {
  from: string;
  fromSub: string;
  to: string;
  toSub: string;
}

interface GapContext {
  prevDate: string;
  nextDate: string;
}

type GapCompleteData =
  | { single: true; date: string; dateObj: { day: number; month: number; year: number }; time: string; km: number; duration: string; stops: string[] }
  | { single: false; legs: { from: string; fromSub: string; to: string; toSub: string; km: number; duration: string; date: string; dateObj: { day: number; month: number; year: number }; time: string }[] };

function GapTripScreen({
  gapInfo,
  gapContext,
  onComplete,
  onBack,
}: {
  gapInfo: GapInfo;
  gapContext?: GapContext | null;
  onComplete: (data: GapCompleteData) => void;
  onBack: () => void;
}) {
  const fromAddr = gapInfo.from + (gapInfo.fromSub ? ', ' + gapInfo.fromSub : '');
  const toAddr = gapInfo.to + (gapInfo.toSub ? ', ' + gapInfo.toSub : '');

  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
  const [km, setKm] = useState('');
  const [duration, setDuration] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [minKm, setMinKm] = useState(1);
  const [calcStatus, setCalcStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [legsCalc, setLegsCalc] = useState<{ from: string; to: string; km: number; duration: string }[]>([]);

  useEffect(() => {
    if (!fromAddr || !toAddr || fromAddr.length < 5 || toAddr.length < 5) return;
    loadGoogleMaps().then(() => {
      if (!window._gmapsLoaded) return;
      setCalcStatus('loading');
      const ds = new window.google.maps.DirectionsService();
      ds.route({
        origin: fromAddr,
        destination: toAddr,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'au',
      }, (result: any, status: string) => {
        if (status === 'OK' && result?.routes?.[0]) {
          let totalM = 0, totalSec = 0;
          result.routes[0].legs.forEach((leg: any) => {
            totalM += leg.distance?.value || 0;
            totalSec += leg.duration?.value || 0;
          });
          const calcKm = Math.round((totalM / 1000) * 10) / 10;
          const mins = Math.round(totalSec / 60);
          const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
          setMinKm(Math.max(1, calcKm));
          setKm(calcKm.toFixed(1));
          setDuration(durStr);
          setCalcStatus('done');
        } else {
          setCalcStatus('error');
        }
      });
    }).catch(() => setCalcStatus('error'));
  }, [fromAddr, toAddr]);

  useEffect(() => {
    if (confirmed !== false) return;
    loadGoogleMaps().then(() => {
      if (!window._gmapsLoaded) return;
      setCalcStatus('loading');
      const waypoints = stops.filter(s => s.length > 3);
      const ds = new window.google.maps.DirectionsService();
      ds.route({
        origin: fromAddr,
        destination: toAddr,
        waypoints: waypoints.length > 0 ? waypoints.map(w => ({ location: w, stopover: true })) : [],
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'au',
      }, (result: any, status: string) => {
        if (status === 'OK' && result?.routes?.[0]) {
          const legs: { from: string; to: string; km: number; duration: string }[] = [];
          result.routes[0].legs.forEach((leg: any) => {
            const legKm = Math.round(((leg.distance?.value || 0) / 1000) * 10) / 10;
            const legSec = leg.duration?.value || 0;
            const mins = Math.round(legSec / 60);
            const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
            legs.push({
              from: leg.start_address || fromAddr,
              to: leg.end_address || toAddr,
              km: legKm,
              duration: durStr,
            });
          });
          setLegsCalc(legs);
          setCalcStatus('done');
        } else {
          setCalcStatus('error');
        }
      });
    }).catch(() => setCalcStatus('error'));
  }, [confirmed, fromAddr, toAddr, stops]);

  const parsedKm = parseFloat(km) || 0;
  const canSaveYes = date.length > 0 && parsedKm >= minKm;
  const canSaveNo = legsCalc.length > 0;

  const handleSaveYes = () => {
    if (!canSaveYes) return;
    const d = new Date(date + 'T00:00:00');
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr || '0', 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const timeDisplay = `${h12}:${(mStr || '00').padStart(2, '0')} ${ampm}`;
    onComplete({
      single: true,
      date: `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}, ${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`,
      dateObj: { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() },
      time: timeDisplay,
      km: parsedKm,
      duration: duration || '',
      stops: [],
    });
  };

  const handleSaveNo = () => {
    if (!canSaveNo || legsCalc.length === 0) return;
    const d = new Date(date + 'T00:00:00');
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr || '0', 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const timeDisplay = `${h12}:${(mStr || '00').padStart(2, '0')} ${ampm}`;
    const dateStr = `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}, ${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
    const dateObj = { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
    onComplete({
      single: false,
      legs: legsCalc.map((leg, i) => {
        const fromParts = leg.from.split(',');
        const toParts = leg.to.split(',');
        return {
          from: fromParts[0].trim(),
          fromSub: fromParts.slice(1).join(',').trim(),
          to: toParts[0].trim(),
          toSub: toParts.slice(1).join(',').trim(),
          km: leg.km,
          duration: leg.duration,
          date: dateStr,
          dateObj,
          time: timeDisplay,
        };
      }),
    });
  };

  return (
    <div className="flex flex-col h-full" data-testid="gap-trip-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-gap"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[16px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>We're detecting unresolved trips</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[6px] pb-[20px]">
        {confirmed === null ? (
        <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[6px]" style={{ color: 'var(--wc-t3)' }}>Was this correct?</div>
          <div className="text-[11px] mb-[8px] leading-[1.45]" style={{ color: 'var(--wc-t2)' }}>
            {gapContext ? (
              <>We detected a gap between your trip ending in {gapInfo.from} on <strong style={{ color: 'var(--wc-text)' }}>{gapContext.prevDate}</strong> and your trip starting in {gapInfo.to} on <strong style={{ color: 'var(--wc-text)' }}>{gapContext.nextDate}</strong>. The logbook needs the missing trip to connect them.</>
            ) : (
              <>We detected a gap between your trips. The logbook needs the missing trip to connect them.</>
            )}
          </div>
          <div className="font-heading font-bold text-[14px] mb-[2px]" style={{ color: 'var(--wc-text)' }}>{fromAddr}</div>
          <div className="font-data text-[10px] mb-[4px]" style={{ color: 'var(--wc-t3)' }}>↓</div>
          <div className="font-heading font-bold text-[14px] mb-[10px]" style={{ color: 'var(--wc-text)' }}>{toAddr}</div>
          <div className="flex gap-[10px]">
            <button
              type="button"
              className="flex-1 rounded-[10px] py-[10px] font-heading font-bold text-[13px] uppercase cursor-pointer transition-all"
              style={{ background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}
              onClick={() => setConfirmed(true)}
              data-testid="gap-yes"
            >
              Yes
            </button>
            <button
              type="button"
              className="flex-1 rounded-[10px] py-[10px] font-heading font-bold text-[13px] uppercase cursor-pointer transition-all"
              style={{ background: 'rgb(var(--wc-ink) / .08)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
              onClick={() => setConfirmed(false)}
              data-testid="gap-no"
            >
              No
            </button>
          </div>
        </div>
        ) : confirmed === true ? (
        <>
        <button type="button" className="text-[11px] mb-[8px]" style={{ color: 'var(--wc-t3)' }} onClick={() => setConfirmed(null)}>← Back</button>
        <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[6px]" style={{ color: 'var(--wc-t3)' }}>Fill in the missing trip</div>
          <div className="font-heading font-bold text-[14px] mb-[2px]" style={{ color: 'var(--wc-text)' }}>{fromAddr}</div>
          <div className="font-data text-[10px] mb-[4px]" style={{ color: 'var(--wc-t3)' }}>↓</div>
          <div className="font-heading font-bold text-[14px]" style={{ color: 'var(--wc-text)' }}>{toAddr}</div>
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Date (required)</label>
          <div className="relative">
            <Calendar className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
            <input
              type="date"
              className="w-full rounded-lg p-[10px_8px_10px_28px] text-[13px] outline-none"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
              value={date}
              onChange={e => setDate(e.target.value)}
              data-testid="gap-input-date"
            />
          </div>
        </div>

        {calcStatus === 'loading' && (
          <div className="rounded-[10px] p-[8px_12px] mb-[10px] flex items-center gap-[8px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <Route className="w-[12px] h-[12px] animate-pulse" style={{ color: 'var(--wc-y)' }} />
            <span className="font-data text-[10px]" style={{ color: 'var(--wc-t3)' }}>Calculating route between destinations...</span>
          </div>
        )}
        {calcStatus === 'error' && (
          <div className="rounded-[10px] p-[8px_12px] mb-[10px] flex items-center gap-[6px]" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)' }}>
            <span className="text-[10px]" style={{ color: 'var(--wc-re)' }}>Could not calculate route. Enter distance manually (min 1 km).</span>
          </div>
        )}
        <div className="flex gap-[10px] mb-[10px]">
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>
              Distance (km) (required) {calcStatus === 'done' && `· min ${minKm} km`}
            </label>
            <input
              type="number"
              step="0.1"
              min={minKm}
              className="w-full rounded-lg p-[10px_12px] text-[14px] outline-none font-data"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
              value={km}
              onChange={e => setKm(e.target.value)}
              placeholder={calcStatus === 'done' ? `${minKm} km (route)` : 'e.g. 85'}
              data-testid="gap-input-km"
            />
          </div>
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Time</label>
            <div className="relative">
              <Clock className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
              <input
                type="time"
                className="w-full rounded-lg p-[10px_8px_10px_28px] text-[13px] outline-none"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
                value={time}
                onChange={e => setTime(e.target.value)}
                data-testid="gap-input-time"
              />
            </div>
          </div>
        </div>

        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Duration</label>
          <input
            className="w-full rounded-lg p-[10px_12px] text-[13px] outline-none"
            style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="e.g. 1h 15m"
            data-testid="gap-input-duration"
          />
        </div>

        <button
          className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
          style={{
            background: canSaveYes ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
            color: 'var(--wc-bg)',
            opacity: canSaveYes ? 1 : 0.5,
            boxShadow: canSaveYes ? '0 4px 20px rgb(var(--wc-ink) / .25)' : 'none',
          }}
          onClick={handleSaveYes}
          disabled={!canSaveYes}
          data-testid="gap-save-trip"
        >
          <ArrowRight className="w-[16px] h-[16px]" strokeWidth={2.5} />
          Add Gap & Continue
        </button>
        </>
        ) : (
        <>
        <button type="button" className="text-[11px] mb-[8px]" style={{ color: 'var(--wc-t3)' }} onClick={() => { setConfirmed(null); setStops([]); setLegsCalc([]); }}>← Back</button>
        <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[6px]" style={{ color: 'var(--wc-t3)' }}>Add stops between {gapInfo.from} and {gapInfo.to}</div>
          <div className="font-heading font-bold text-[12px] mb-[4px]" style={{ color: 'var(--wc-text)' }}>{fromAddr}</div>
          {stops.map((s, i) => (
            <div key={i} className="flex items-center gap-[5px] my-[6px]">
              <AddressInput
                className="w-full rounded-[7px] p-[6px_9px] text-[12px] outline-none"
                style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)', flex: 1 }}
                placeholder={`Stop ${i + 1}`}
                value={s}
                onChange={v => { const n = [...stops]; n[i] = v; setStops(n); }}
              />
              <button type="button" className="rounded-[6px] p-[5px_7px] text-[11px] cursor-pointer" style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--wc-re)' }} onClick={() => { const n = [...stops]; n.splice(i, 1); setStops(n); }}>✕</button>
            </div>
          ))}
          <button
            type="button"
            className="w-full rounded-[7px] p-[5px_8px] font-heading font-semibold text-[10px] uppercase tracking-[.04em] cursor-pointer transition-all flex items-center justify-center gap-[4px]"
            style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px dashed var(--wc-border)', color: 'var(--wc-t2)' }}
            onClick={() => setStops([...stops, ''])}
            data-testid="gap-input-add-stop"
          >
            <Route className="w-[10px] h-[10px]" />
            + Add Stop
          </button>
          <div className="font-heading font-bold text-[12px] mt-[6px]" style={{ color: 'var(--wc-text)' }}>{toAddr}</div>
        </div>
        {calcStatus === 'loading' && (
          <div className="rounded-[10px] p-[8px_12px] mb-[10px] flex items-center gap-[8px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <Route className="w-[12px] h-[12px] animate-pulse" style={{ color: 'var(--wc-y)' }} />
            <span className="font-data text-[10px]" style={{ color: 'var(--wc-t3)' }}>Calculating legs...</span>
          </div>
        )}
        {legsCalc.length > 0 && (
          <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[8px]" style={{ color: 'var(--wc-t3)' }}>{legsCalc.length} trip{legsCalc.length !== 1 ? 's' : ''} for sort cards</div>
            {legsCalc.map((leg, i) => (
              <div key={i} className="font-heading font-bold text-[11px] py-[4px] flex justify-between" style={{ color: 'var(--wc-text)' }}>
                <span className="truncate flex-1 mr-2">{leg.from.split(',')[0]} → {leg.to.split(',')[0]}</span>
                <span style={{ color: 'var(--wc-t3)' }}>{leg.km} km</span>
              </div>
            ))}
          </div>
        )}
        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Date (required)</label>
          <div className="relative">
            <Calendar className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
            <input
              type="date"
              className="w-full rounded-lg p-[10px_8px_10px_28px] text-[13px] outline-none"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
              value={date}
              onChange={e => setDate(e.target.value)}
              data-testid="gap-input-date-no"
            />
          </div>
        </div>
        <div className="mb-[10px]">
          <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Time</label>
          <div className="relative">
            <Clock className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
            <input
              type="time"
              className="w-full rounded-lg p-[10px_8px_10px_28px] text-[13px] outline-none"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}
              value={time}
              onChange={e => setTime(e.target.value)}
              data-testid="gap-input-time-no"
            />
          </div>
        </div>
        <button
          className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase cursor-pointer transition-all flex items-center justify-center gap-[6px]"
          style={{
            background: canSaveNo ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
            color: 'var(--wc-bg)',
            opacity: canSaveNo ? 1 : 0.5,
            boxShadow: canSaveNo ? '0 4px 20px rgb(var(--wc-ink) / .25)' : 'none',
          }}
          onClick={handleSaveNo}
          disabled={!canSaveNo}
          data-testid="gap-save-trips"
        >
          <ArrowRight className="w-[16px] h-[16px]" strokeWidth={2.5} />
          Add {legsCalc.length} Trip{legsCalc.length !== 1 ? 's' : ''} & Continue
        </button>
        </>
        )}
      </div>
    </div>
  );
}

function OdometerConfirmScreen({
  pendingTrip,
  onBack,
  onSendToSort,
  onSaveAndAddMore,
}: {
  pendingTrip: PendingTripData;
  onBack: () => void;
  onSendToSort: (odoStart: number, odoEnd: number) => void;
  onSaveAndAddMore: (odoStart: number, odoEnd: number) => void;
}) {
  const { state } = useApp();
  const tripKm = pendingTrip.km;
  const [odoStart, setOdoStart] = useState(String(pendingTrip.suggestedOdoStart));
  const [odoEnd, setOdoEnd] = useState(String(pendingTrip.suggestedOdoEnd));

  const odoStartNum = parseInt(odoStart.replace(/\D/g, ''), 10) || 0;
  const odoEndNum = parseInt(odoEnd.replace(/\D/g, ''), 10) || 0;
  const canSave = odoStartNum > 0 && odoEndNum >= odoStartNum;
  const unsortedCount = state.trips.filter(t => t.type === null).length;

  const handleOdoBeforeChange = useCallback((val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
    setOdoStart(val);
    if (num > 0 && tripKm > 0) {
      setOdoEnd(String(Math.round(num + tripKm)));
    }
  }, [tripKm]);

  const handleOdoAfterChange = useCallback((val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
    setOdoEnd(val);
    if (num > 0 && tripKm > 0) {
      setOdoStart(String(Math.round(num - tripKm)));
    }
  }, [tripKm]);

  const prefs = useMemo(() => loadLogbookPrefs(), []);
  const recentTrips = useMemo(() => {
    const filtered = state.trips.filter(t => t.type !== null);
    const sorted = sortTripsChronologically(filtered);
    const count = prefs.showLast3Context ? 3 : 5;
    return sorted.slice(-count).reverse();
  }, [state.trips, prefs.showLast3Context]);

  const handleSaveAndAddMore = () => {
    if (!canSave) return;
    onSaveAndAddMore(odoStartNum, odoEndNum);
  };

  const handleSendToSort = () => {
    if (!canSave) return;
    onSendToSort(odoStartNum, odoEndNum);
  };

  const fromLabel = pendingTrip.from.split(',')[0].trim();
  const toLabel = pendingTrip.to.split(',')[0].trim();

  return (
    <div className="flex flex-col h-full" data-testid="odometer-confirm-screen">
      <div className="flex items-center gap-[10px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <button
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={onBack}
          data-testid="button-back-odo-confirm"
        >
          <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Odometer</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-[18px] pt-[6px] pb-[20px]">
        <div className="rounded-[12px] p-[14px] mb-[14px]" style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[6px]" style={{ color: 'var(--wc-t3)' }}>This trip</div>
          <div className="font-heading font-bold text-[14px]" style={{ color: 'var(--wc-text)' }}>{fromLabel} → {toLabel}</div>
          <div className="font-data text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>{pendingTrip.km} km · {pendingTrip.date} {pendingTrip.time}</div>
        </div>

        <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[8px]" style={{ color: 'var(--wc-t3)' }}>
          You need a known odometer reading for this trip
        </div>

        <div className="flex gap-[10px] mb-[14px]">
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Odometer before</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full rounded-[10px] p-[12px_14px] text-[16px] font-data font-bold outline-none"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
              value={odoStart}
              onChange={e => handleOdoBeforeChange(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 84280"
              data-testid="input-odo-before"
            />
            {odoStartNum > 0 && tripKm > 0 && (
              <div className="font-data text-[9px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>
                +{tripKm} km → {Math.round(odoStartNum + tripKm).toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="font-data text-[8px] uppercase tracking-[.1em] block mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Odometer after</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full rounded-[10px] p-[12px_14px] text-[16px] font-data font-bold outline-none"
              style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1.5px solid var(--wc-border)', color: 'var(--wc-text)' }}
              value={odoEnd}
              onChange={e => handleOdoAfterChange(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 84412"
              data-testid="input-odo-after"
            />
            {odoEndNum > 0 && tripKm > 0 && (
              <div className="font-data text-[9px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>
                −{tripKm} km → {Math.round(odoEndNum - tripKm).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {(recentTrips.length > 0 || prefs.showMockWhenEmpty) && (
          <div className="mb-[14px]">
            <div className="font-data text-[8px] uppercase tracking-[.12em] mb-[6px]" style={{ color: 'var(--wc-t3)' }}>
              Was it after this? Recent trips for context
            </div>
            <div className="flex flex-col gap-[6px]">
              {recentTrips.length > 0 ? (
                recentTrips.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-[10px] p-[10px_12px] flex items-center gap-[10px]"
                    style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-bold text-[11px] truncate" style={{ color: t.type === 'business' ? 'var(--wc-y)' : 'var(--wc-t2)' }}>
                        {t.from} → {t.to}
                      </div>
                      <div className="font-data text-[9px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>
                        {t.date} · {t.km} km{t.odoReading != null ? ` · odo ${t.odoReading.toLocaleString()}` : ''}
                      </div>
                    </div>
                    <span
                      className="rounded-[6px] px-[6px] py-[2px] font-heading font-semibold text-[9px] uppercase"
                      style={{
                        background: t.type === 'business' ? 'rgba(34,197,94,.15)' : 'rgb(var(--wc-ink) / .1)',
                        color: t.type === 'business' ? 'var(--wc-gr)' : 'var(--wc-t2)',
                      }}
                    >
                      {t.type === 'business' ? 'Business' : 'Personal'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-[10px] p-[10px_12px] flex flex-col gap-[6px]" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px dashed var(--wc-border)' }}>
                  <div className="font-heading font-bold text-[11px]" style={{ color: 'var(--wc-t3)' }}>Your recent trips will appear here once you add some.</div>
                  <div className="flex flex-col gap-[4px]">
                    {[
                      { from: 'Home', to: 'Office', km: 12, date: 'Sample' },
                      { from: 'Office', to: 'Client', km: 8, date: 'Sample' },
                    ].map((m, i) => (
                      <div key={i} className="font-data text-[9px]" style={{ color: 'var(--wc-t3)' }}>{m.from} → {m.to} · {m.km} km</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          className="w-full rounded-[14px] py-[16px] font-heading font-black text-[18px] tracking-[.07em] uppercase flex items-center justify-center gap-[8px] cursor-pointer transition-all mb-[10px]"
          style={{
            background: canSave ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
            color: 'var(--wc-bg)',
            opacity: canSave ? 1 : 0.6,
          }}
          onClick={handleSaveAndAddMore}
          disabled={!canSave}
          data-testid="button-save-and-add-more"
        >
          <Plus className="w-[20px] h-[20px]" strokeWidth={2.5} />
          Save and Add More
        </button>

        <button
          type="button"
          className="w-full rounded-[12px] py-[12px] font-heading font-bold text-[14px] tracking-[.05em] uppercase flex items-center justify-center gap-[8px] cursor-pointer transition-all"
          style={{
            background: 'rgb(var(--wc-ink) / .08)',
            border: '1px solid var(--wc-border)',
            color: 'var(--wc-text)',
          }}
          onClick={handleSendToSort}
          disabled={!canSave}
          data-testid="button-send-to-sort-odo"
        >
          <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
          Send to Sort{unsortedCount > 0 ? ` (${unsortedCount + 1} trips ready)` : ''}
        </button>
      </div>
    </div>
  );
}

function parseTimeToHHMM(time: string): string {
  const m = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return '00:00';
  let h = parseInt(m[1], 10);
  const min = (m[2] || '00').padStart(2, '0');
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

export function InputScreen() {
  const { state, dispatch } = useApp();
  const [mode, setMode] = useState<InputMode>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('wc_wants_gps_sync') === '1') {
      localStorage.removeItem('wc_wants_gps_sync');
      return 'gps';
    }
    return 'choose';
  });
  const [whenData, setWhenData] = useState<{ date: string; time: string } | null>(null);
  const [pendingTripData, setPendingTripData] = useState<PendingTripData | null>(null);
  const [gapInfo, setGapInfo] = useState<GapInfo | null>(null);
  const [gapContext, setGapContext] = useState<GapContext | null>(null);
  const [pendingOdo, setPendingOdo] = useState<{ odoStart: number; odoEnd: number } | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<RecurringTemplate | null>(null);

  const handleSendToSort = useCallback((odoStart: number, odoEnd: number) => {
    if (!pendingTripData) return;

    const sortedTrips = sortTripsChronologically(state.trips);
    const dateStr = `${pendingTripData.dateObj.year}-${String(pendingTripData.dateObj.month + 1).padStart(2, '0')}-${String(pendingTripData.dateObj.day).padStart(2, '0')}`;
    const timeStr = parseTimeToHHMM(pendingTripData.time);
    const insertIdx = getInsertIndexForNewTrip(sortedTrips, dateStr, timeStr);
    const newFromFull = pendingTripData.from;
    const newToFull = pendingTripData.to;

    if (insertIdx > 0) {
      const prevTrip = sortedTrips[insertIdx - 1];
      const prevToFull = prevTrip.to + (prevTrip.toSub ? ', ' + prevTrip.toSub : '');
      const geoGap = getGapBetweenTrips(
        { to: prevToFull, toSub: '' },
        { from: newFromFull, fromSub: '' }
      );
      if (geoGap) {
        setGapInfo(geoGap);
        setGapContext({ prevDate: prevTrip.date, nextDate: pendingTripData.date });
        setPendingOdo({ odoStart, odoEnd });
        setMode('gap');
        return;
      }
    }
    if (insertIdx < sortedTrips.length) {
      const nextTrip = sortedTrips[insertIdx];
      const nextFromFull = nextTrip.from + (nextTrip.fromSub ? ', ' + nextTrip.fromSub : '');
      const geoGap = getGapBetweenTrips(
        { to: newToFull, toSub: '' },
        { from: nextFromFull, fromSub: '' }
      );
      if (geoGap) {
        setGapInfo(geoGap);
        setGapContext({ prevDate: pendingTripData.date, nextDate: nextTrip.date });
        setPendingOdo({ odoStart, odoEnd });
        setMode('gap');
        return;
      }
    }

    const fromParts = pendingTripData.from.split(',');
    const toParts = pendingTripData.to.split(',');

    recordPlace(pendingTripData.from);
    recordPlace(pendingTripData.to);
    recordRoute(pendingTripData.from, pendingTripData.to, pendingTripData.km, pendingTripData.duration);

    const trip: Trip = {
      id: nextManualId++,
      date: pendingTripData.date,
      day: pendingTripData.dateObj.day,
      month: pendingTripData.dateObj.month,
      year: pendingTripData.dateObj.year,
      time: pendingTripData.time,
      duration: pendingTripData.duration || '',
      km: pendingTripData.km,
      from: fromParts[0].trim(),
      fromSub: fromParts.slice(1).join(',').trim(),
      to: toParts[0].trim(),
      toSub: toParts.slice(1).join(',').trim(),
      type: null,
      verified: false,
      photo: false,
      odoReading: odoEnd,
      odoStartReading: odoStart,
      purposeLabel: null,
      purposeIndex: null,
      stops: pendingTripData.stops,
      notes: pendingTripData.notes || '',
    };

    dispatch({ type: 'ADD_TRIP', trip });
    dispatch({ type: 'ADD_LOG', desc: `Trip added: ${trip.from} → ${trip.to} (${pendingTripData.km} km) — sent to sort`, hasPhoto: false });

    setPendingTripData(null);
    dispatch({ type: 'GO_SCREEN', screen: 'sort' });
  }, [pendingTripData, dispatch, state.trips]);

  const handleSaveAndAddMore = useCallback((odoStart: number, odoEnd: number) => {
    if (!pendingTripData) return;

    const fromParts = pendingTripData.from.split(',');
    const toParts = pendingTripData.to.split(',');

    recordPlace(pendingTripData.from);
    recordPlace(pendingTripData.to);
    recordRoute(pendingTripData.from, pendingTripData.to, pendingTripData.km, pendingTripData.duration);

    const trip: Trip = {
      id: nextManualId++,
      date: pendingTripData.date,
      day: pendingTripData.dateObj.day,
      month: pendingTripData.dateObj.month,
      year: pendingTripData.dateObj.year,
      time: pendingTripData.time,
      duration: pendingTripData.duration || '',
      km: pendingTripData.km,
      from: fromParts[0].trim(),
      fromSub: fromParts.slice(1).join(',').trim(),
      to: toParts[0].trim(),
      toSub: toParts.slice(1).join(',').trim(),
      type: null,
      verified: false,
      photo: false,
      odoReading: odoEnd,
      odoStartReading: odoStart,
      purposeLabel: null,
      purposeIndex: null,
      stops: pendingTripData.stops,
      notes: pendingTripData.notes || '',
    };

    dispatch({ type: 'ADD_TRIP', trip });
    dispatch({ type: 'ADD_LOG', desc: `Trip added: ${trip.from} → ${trip.to} (${pendingTripData.km} km)`, hasPhoto: false });

    setPendingTripData(null);
    setMode('when');
  }, [pendingTripData, dispatch]);

  const handleGapComplete = useCallback((data: GapCompleteData) => {
    if (!gapInfo || !pendingTripData) return;

    if (data.single) {
      const gapTrip: Trip = {
        id: nextManualId++,
        date: data.date,
        day: data.dateObj.day,
        month: data.dateObj.month,
        year: data.dateObj.year,
        time: data.time,
        duration: data.duration || '',
        km: data.km,
        from: gapInfo.from,
        fromSub: gapInfo.fromSub,
        to: gapInfo.to,
        toSub: gapInfo.toSub,
        type: null,
        verified: false,
        photo: false,
        odoReading: null,
        odoStartReading: null,
        purposeLabel: null,
        purposeIndex: null,
        stops: data.stops,
        notes: '',
      };
      dispatch({ type: 'ADD_TRIP', trip: gapTrip });
      dispatch({ type: 'ADD_LOG', desc: `Gap trip added: ${gapTrip.from} → ${gapTrip.to} (${data.km} km)`, hasPhoto: false });
    } else {
      data.legs.forEach((leg) => {
        const trip: Trip = {
          id: nextManualId++,
          date: leg.date,
          day: leg.dateObj.day,
          month: leg.dateObj.month,
          year: leg.dateObj.year,
          time: leg.time,
          duration: leg.duration || '',
          km: leg.km,
          from: leg.from,
          fromSub: leg.fromSub,
          to: leg.to,
          toSub: leg.toSub,
          type: null,
          verified: false,
          photo: false,
          odoReading: null,
          odoStartReading: null,
          purposeLabel: null,
          purposeIndex: null,
          stops: [],
          notes: '',
        };
        dispatch({ type: 'ADD_TRIP', trip });
        dispatch({ type: 'ADD_LOG', desc: `Gap leg added: ${trip.from} → ${trip.to} (${leg.km} km)`, hasPhoto: false });
      });
    }

    setGapInfo(null);
    setGapContext(null);

    if (pendingOdo) {
      recordPlace(pendingTripData.from);
      recordPlace(pendingTripData.to);
      recordRoute(pendingTripData.from, pendingTripData.to, pendingTripData.km, pendingTripData.duration);

      const fromParts = pendingTripData.from.split(',');
      const toParts = pendingTripData.to.split(',');
      const trip: Trip = {
        id: nextManualId++,
        date: pendingTripData.date,
        day: pendingTripData.dateObj.day,
        month: pendingTripData.dateObj.month,
        year: pendingTripData.dateObj.year,
        time: pendingTripData.time,
        duration: pendingTripData.duration || '',
        km: pendingTripData.km,
        from: fromParts[0].trim(),
        fromSub: fromParts.slice(1).join(',').trim(),
        to: toParts[0].trim(),
        toSub: toParts.slice(1).join(',').trim(),
        type: null,
        verified: false,
        photo: false,
        odoReading: pendingOdo.odoEnd,
        odoStartReading: pendingOdo.odoStart,
        purposeLabel: null,
        purposeIndex: null,
        stops: pendingTripData.stops,
        notes: pendingTripData.notes || '',
      };
      dispatch({ type: 'ADD_TRIP', trip });
      dispatch({ type: 'ADD_LOG', desc: `Trip added: ${trip.from} → ${trip.to} (${pendingTripData.km} km) — sent to sort`, hasPhoto: false });

      setPendingOdo(null);
      setPendingTripData(null);
      dispatch({ type: 'GO_SCREEN', screen: 'sort' });
    } else {
      setMode('odometerConfirm');
    }
  }, [gapInfo, pendingTripData, pendingOdo, dispatch]);

  const handlePrepareForOdometerConfirm = useCallback((data: PendingTripData) => {
    setPendingTripData(data);
    const sortedTrips = sortTripsChronologically(state.trips);
    const dateStr = `${data.dateObj.year}-${String(data.dateObj.month + 1).padStart(2, '0')}-${String(data.dateObj.day).padStart(2, '0')}`;
    const timeStr = parseTimeToHHMM(data.time);
    const insertIdx = getInsertIndexForNewTrip(sortedTrips, dateStr, timeStr);
    const newFromFull = data.from;
    const newToFull = data.to;

    // Gap before: previous trip ends somewhere, new trip starts somewhere — must connect
    if (insertIdx > 0) {
      const prevTrip = sortedTrips[insertIdx - 1];
      const prevToFull = prevTrip.to + (prevTrip.toSub ? ', ' + prevTrip.toSub : '');
      const geoGap = getGapBetweenTrips(
        { to: prevToFull, toSub: '' },
        { from: newFromFull, fromSub: '' }
      );
      if (geoGap) {
        setGapInfo(geoGap);
        setGapContext({ prevDate: prevTrip.date, nextDate: data.date });
        setPendingOdo(null);
        setMode('gap');
        return;
      }
    }

    // Gap after: new trip ends somewhere, next trip starts somewhere — must connect
    if (insertIdx < sortedTrips.length) {
      const nextTrip = sortedTrips[insertIdx];
      const nextFromFull = nextTrip.from + (nextTrip.fromSub ? ', ' + nextTrip.fromSub : '');
      const geoGap = getGapBetweenTrips(
        { to: newToFull, toSub: '' },
        { from: nextFromFull, fromSub: '' }
      );
      if (geoGap) {
        setGapInfo(geoGap);
        setGapContext({ prevDate: data.date, nextDate: nextTrip.date });
        setPendingOdo(null);
        setMode('gap');
        return;
      }
    }

    setMode('odometerConfirm');
  }, [state.trips]);

  const handleRecurringApplyConfirm = useCallback((trips: Trip[], skipped: number) => {
    dispatch({ type: 'ADD_TRIPS_BATCH', trips });
    if (skipped > 0) {
      dispatch({ type: 'ADD_LOG', desc: `Recurring: ${trips.length} trips added, ${skipped} dates skipped (already had trips)`, hasPhoto: false });
    } else {
      dispatch({ type: 'ADD_LOG', desc: `Recurring: ${trips.length} trips added — sent to sort`, hasPhoto: false });
    }
    setApplyTemplate(null);
    dispatch({ type: 'GO_SCREEN', screen: 'sort' });
  }, [dispatch]);

  if (mode === 'when') {
    const unsortedCount = state.trips.filter((t) => t.type === null).length;
    return (
      <WhenWasTripScreen
        onBack={() => { setWhenData(null); setMode('choose'); }}
        onContinue={(date, time) => {
          setWhenData({ date, time });
          setMode('existing');
        }}
        initialDate={whenData?.date}
        initialTime={whenData?.time}
        unsortedCount={unsortedCount}
        onSendToSort={() => dispatch({ type: 'GO_SCREEN', screen: 'sort' })}
      />
    );
  }
  if (mode === 'existing') {
    return (
      <ExistingTripScreen
        onBack={() => setMode('when')}
        initialDate={whenData?.date}
        initialTime={whenData?.time}
        onPrepareForOdometerConfirm={handlePrepareForOdometerConfirm}
      />
    );
  }
  if (mode === 'odometerConfirm' && pendingTripData) {
    return (
      <OdometerConfirmScreen
        pendingTrip={pendingTripData}
        onBack={() => { setPendingTripData(null); setMode('existing'); }}
        onSendToSort={handleSendToSort}
        onSaveAndAddMore={handleSaveAndAddMore}
      />
    );
  }
  if (mode === 'gap' && gapInfo && pendingTripData) {
    return (
      <GapTripScreen
        gapInfo={gapInfo}
        gapContext={gapContext}
        onBack={() => {
          setGapInfo(null);
          setGapContext(null);
          setMode(pendingOdo ? 'odometerConfirm' : 'existing');
          if (!pendingOdo) setPendingTripData(null);
        }}
        onComplete={handleGapComplete}
      />
    );
  }
  if (mode === 'live') return <LiveTripScreen onBack={() => setMode('choose')} />;
  if (mode === 'shortcuts') return <ShortcutsScreen onBack={() => setMode('choose')} onPreferences={() => setMode('preferences')} />;
  if (mode === 'gps') return <GpsDeviceScreen onBack={() => setMode('choose')} />;
  if (mode === 'preferences') return <PreferencesScreen onBack={() => setMode('shortcuts')} />;
  if (mode === 'recurring') {
    return (
      <RecurringTripsScreen
        onBack={() => setMode('choose')}
        onApply={(t) => { setApplyTemplate(t); setMode('recurringApply'); }}
      />
    );
  }
  if (mode === 'recurringApply' && applyTemplate) {
    return (
      <ApplyRecurringScreen
        template={applyTemplate}
        onBack={() => { setApplyTemplate(null); setMode('recurring'); }}
        onConfirm={handleRecurringApplyConfirm}
      />
    );
  }
  return <ChooseScreen onSelect={(m) => setMode(m === 'existing' ? 'when' : m)} />;
}
