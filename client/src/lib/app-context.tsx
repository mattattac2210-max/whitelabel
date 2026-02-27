import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { type Trip, initialTrips, RATE } from './trip-data';

export type Screen = 'sort' | 'classify' | 'review' | 'odometer' | 'reports';

interface SavedReport {
  timestamp: string;
  bizCount: number;
  perCount: number;
  classified: number;
  unclassified: number;
  est: string;
  totalKm: string;
  auditScore: number;
}

interface AppState {
  trips: Trip[];
  currentScreen: Screen;
  currentIndex: number;
  dedTotal: number;
  bizCount: number;
  perCount: number;
  lastAction: { idx: number; type: string; ded: number } | null;
  verifiedSet: Set<number>;
  auditLog: { time: string; desc: string; hasPhoto: boolean }[];
  savedReports: SavedReport[];
  classifyStep: number;
  classifyBizTrips: number[];
  sessionStartTime: number;
  editModalOpen: boolean;
  editTripIndex: number;
  atoModalOpen: boolean;
  summaryModalOpen: boolean;
}

type Action =
  | { type: 'CLASSIFY_TRIP'; tripType: 'business' | 'personal' }
  | { type: 'UNDO_LAST' }
  | { type: 'GO_SCREEN'; screen: Screen }
  | { type: 'SET_PURPOSE'; tripIndex: number; purposeLabel: string; purposeIndex: number | null }
  | { type: 'CLASSIFY_NEXT' }
  | { type: 'INIT_CLASSIFY' }
  | { type: 'RECLASSIFY'; tripIndex: number; tripType: 'business' | 'personal' }
  | { type: 'VERIFY_TRIP'; tripIndex: number; startReading: number; reading: number; photo: boolean }
  | { type: 'ADD_PHOTO'; tripIndex: number }
  | { type: 'UPDATE_TRIP'; tripIndex: number; updates: Partial<Trip> }
  | { type: 'OPEN_EDIT'; tripIndex: number }
  | { type: 'CLOSE_EDIT' }
  | { type: 'OPEN_ATO' }
  | { type: 'CLOSE_ATO' }
  | { type: 'OPEN_SUMMARY' }
  | { type: 'CLOSE_SUMMARY' }
  | { type: 'SAVE_SESSION' }
  | { type: 'ADD_LOG'; desc: string; hasPhoto: boolean }
  | { type: 'RESET_DEMO' };

function nowStr(): string {
  const n = new Date();
  return n.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }) + ' ' + n.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

const initialState: AppState = {
  trips: initialTrips.map(t => ({ ...t })),
  currentScreen: 'sort',
  currentIndex: 0,
  dedTotal: 0,
  bizCount: 0,
  perCount: 0,
  lastAction: null,
  verifiedSet: new Set(),
  auditLog: [],
  savedReports: [],
  classifyStep: 0,
  classifyBizTrips: [],
  sessionStartTime: Date.now(),
  editModalOpen: false,
  editTripIndex: 0,
  atoModalOpen: false,
  summaryModalOpen: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CLASSIFY_TRIP': {
      const trip = state.trips[state.currentIndex];
      if (!trip) return state;
      const newTrips = [...state.trips];
      newTrips[state.currentIndex] = { ...trip, type: action.tripType };
      const isBiz = action.tripType === 'business';
      const earned = isBiz ? trip.km * RATE : 0;
      return {
        ...state,
        trips: newTrips,
        dedTotal: state.dedTotal + earned,
        bizCount: state.bizCount + (isBiz ? 1 : 0),
        perCount: state.perCount + (isBiz ? 0 : 1),
        lastAction: { idx: state.currentIndex, type: action.tripType, ded: earned },
        currentIndex: state.currentIndex + 1,
      };
    }
    case 'UNDO_LAST': {
      if (!state.lastAction) return state;
      const { idx, type, ded } = state.lastAction;
      const newTrips = [...state.trips];
      newTrips[idx] = { ...newTrips[idx], type: null };
      return {
        ...state,
        trips: newTrips,
        currentIndex: idx,
        dedTotal: state.dedTotal - ded,
        bizCount: state.bizCount - (type === 'business' ? 1 : 0),
        perCount: state.perCount - (type === 'personal' ? 1 : 0),
        lastAction: null,
      };
    }
    case 'GO_SCREEN':
      return { ...state, currentScreen: action.screen };
    case 'SET_PURPOSE': {
      const newTrips = [...state.trips];
      newTrips[action.tripIndex] = {
        ...newTrips[action.tripIndex],
        purposeLabel: action.purposeLabel,
        purposeIndex: action.purposeIndex,
      };
      return { ...state, trips: newTrips };
    }
    case 'INIT_CLASSIFY': {
      const bizTrips = state.trips.map((t, i) => i).filter(i => state.trips[i].type === 'business');
      return { ...state, classifyStep: 0, classifyBizTrips: bizTrips, currentScreen: 'classify' };
    }
    case 'CLASSIFY_NEXT': {
      const nextStep = state.classifyStep + 1;
      if (nextStep >= state.classifyBizTrips.length) {
        return { ...state, classifyStep: nextStep, currentScreen: 'review' };
      }
      return { ...state, classifyStep: nextStep };
    }
    case 'RECLASSIFY': {
      const newTrips = [...state.trips];
      const trip = newTrips[action.tripIndex];
      const oldType = trip.type;
      let newDed = state.dedTotal;
      let newBiz = state.bizCount;
      let newPer = state.perCount;
      if (oldType === 'business') { newDed -= trip.km * RATE; newBiz--; }
      else if (oldType === 'personal') { newPer--; }
      newTrips[action.tripIndex] = { ...trip, type: action.tripType };
      if (action.tripType === 'business') { newDed += trip.km * RATE; newBiz++; }
      else { newPer++; }
      return { ...state, trips: newTrips, dedTotal: newDed, bizCount: newBiz, perCount: newPer };
    }
    case 'VERIFY_TRIP': {
      const newTrips = [...state.trips];
      newTrips[action.tripIndex] = {
        ...newTrips[action.tripIndex],
        verified: true,
        odoStartReading: action.startReading,
        odoReading: action.reading,
        photo: action.photo || newTrips[action.tripIndex].photo,
      };
      const newVerified = new Set(state.verifiedSet);
      newVerified.add(action.tripIndex);
      return {
        ...state,
        trips: newTrips,
        verifiedSet: newVerified,
        auditLog: [{ time: nowStr(), desc: `Trip verified: ${newTrips[action.tripIndex].from} \u2192 ${newTrips[action.tripIndex].to}`, hasPhoto: action.photo }, ...state.auditLog],
      };
    }
    case 'ADD_PHOTO': {
      const newTrips = [...state.trips];
      newTrips[action.tripIndex] = { ...newTrips[action.tripIndex], photo: true };
      return {
        ...state,
        trips: newTrips,
        auditLog: [{ time: nowStr(), desc: `Photo added: ${newTrips[action.tripIndex].from} \u2192 ${newTrips[action.tripIndex].to}`, hasPhoto: true }, ...state.auditLog],
      };
    }
    case 'UPDATE_TRIP': {
      const newTrips = [...state.trips];
      newTrips[action.tripIndex] = { ...newTrips[action.tripIndex], ...action.updates };
      return { ...state, trips: newTrips };
    }
    case 'OPEN_EDIT':
      return { ...state, editModalOpen: true, editTripIndex: action.tripIndex };
    case 'CLOSE_EDIT':
      return { ...state, editModalOpen: false };
    case 'OPEN_ATO':
      return { ...state, atoModalOpen: true };
    case 'CLOSE_ATO':
      return { ...state, atoModalOpen: false };
    case 'OPEN_SUMMARY':
      return { ...state, summaryModalOpen: true };
    case 'CLOSE_SUMMARY':
      return { ...state, summaryModalOpen: false };
    case 'SAVE_SESSION': {
      const biz = state.trips.filter(t => t.type === 'business');
      const per = state.trips.filter(t => t.type === 'personal');
      const classified = biz.filter(t => t.purposeLabel).length;
      const now = new Date();
      const ts = now.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) +
        ' \u00B7 ' + now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
      const report: SavedReport = {
        timestamp: ts,
        bizCount: biz.length,
        perCount: per.length,
        classified,
        unclassified: biz.length - classified,
        est: '$' + Math.round(state.dedTotal).toLocaleString('en-AU'),
        totalKm: biz.reduce((s, t) => s + t.km, 0).toFixed(1),
        auditScore: Math.min(100, 50 + state.verifiedSet.size * 2),
      };
      return {
        ...state,
        savedReports: [report, ...state.savedReports],
        summaryModalOpen: false,
        currentScreen: 'sort',
      };
    }
    case 'ADD_LOG':
      return {
        ...state,
        auditLog: [{ time: nowStr(), desc: action.desc, hasPhoto: action.hasPhoto }, ...state.auditLog],
      };
    case 'RESET_DEMO':
      return {
        ...initialState,
        trips: initialTrips.map(t => ({ ...t })),
        savedReports: state.savedReports,
        sessionStartTime: Date.now(),
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useComputedStats() {
  const { state } = useApp();
  const bizKm = state.trips.slice(0, state.currentIndex).filter(x => x.type === 'business').reduce((a, x) => a + x.km, 0);
  const totKm = state.trips.slice(0, state.currentIndex).reduce((a, x) => a + x.km, 0);
  const bizPct = totKm > 0 ? (bizKm / totKm * 100) : 0;
  const remaining = state.trips.length - state.currentIndex;
  const progress = state.trips.length > 0 ? (state.currentIndex / state.trips.length * 100) : 0;
  const auditScore = Math.min(99, 50 + state.trips.filter(t => t.photo).length * 2 + state.trips.filter(t => t.verified && !t.photo).length + Math.min(state.verifiedSet.size, 20));
  return { bizKm, totKm, bizPct, remaining, progress, auditScore };
}
