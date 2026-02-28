import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { type Trip, initialTrips, batch2Trips, RATE, ODO_START, getTripOdoStart, getTripOdoEnd } from './trip-data';

export type Screen = 'sort' | 'classify' | 'review' | 'odometer' | 'reports' | 'export';

interface SavedTripSummary {
  from: string;
  to: string;
  km: number;
  date: string;
  time: string;
  type: 'business' | 'personal' | null;
  purposeLabel: string | null;
  verified: boolean;
  photo: boolean;
  odoStart: number;
  odoEnd: number;
}

interface SavedReport {
  sessionId: string;
  timestamp: string;
  bizCount: number;
  perCount: number;
  classified: number;
  unclassified: number;
  est: string;
  totalKm: string;
  auditScore: number;
  lastOdoReading: number | null;
  lastOdoVerifiedAt: string | null;
  odoRangeStart: number;
  odoRangeEnd: number;
  trips: SavedTripSummary[];
  auditLog: { time: string; desc: string }[];
  areasToCheck: string[];
  revision: number;
  supersedes: boolean;
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
  lastOdoReading: number | null;
  lastOdoVerifiedAt: string | null;
  classifyStep: number;
  classifyBizTrips: number[];
  sessionStartTime: number;
  editModalOpen: boolean;
  editTripIndex: number;
  atoModalOpen: boolean;
  summaryModalOpen: boolean;
  conflictResolved: boolean;
  freshSession: boolean;
  pendingFinalise: boolean;
  sessionId: string;
  baseOdo: number;
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
  | { type: 'SET_MANUAL_ODO'; reading: number }
  | { type: 'RESET_DEMO' }
  | { type: 'LOAD_BATCH2' }
  | { type: 'DELETE_ALL_TRIPS' }
  | { type: 'DELETE_SESSION'; sessionId: string }
  | { type: 'PROMOTE_REPORT'; reportIndex: number }
  | { type: 'COME_BACK_LATER' }
  | { type: 'RESUME_SORTING' };

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
  lastOdoReading: null,
  lastOdoVerifiedAt: null,
  classifyStep: 0,
  classifyBizTrips: [],
  sessionStartTime: Date.now(),
  editModalOpen: false,
  editTripIndex: 0,
  atoModalOpen: false,
  summaryModalOpen: false,
  conflictResolved: false,
  freshSession: true,
  pendingFinalise: false,
  sessionId: 'batch1',
  baseOdo: ODO_START,
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
        freshSession: true,
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
      const reclassDesc = `Reclassified "${trip.from} \u2192 ${trip.to}" from ${oldType || 'unsorted'} to ${action.tripType}`;
      return {
        ...state,
        trips: newTrips,
        dedTotal: newDed,
        bizCount: newBiz,
        perCount: newPer,
        auditLog: [{ time: nowStr(), desc: reclassDesc, hasPhoto: false }, ...state.auditLog],
      };
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
        lastOdoReading: action.reading,
        lastOdoVerifiedAt: nowStr(),
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
      const sortedTrips = state.trips.filter(t => t.type !== null);
      const tripSummaries: SavedTripSummary[] = sortedTrips.map(t => {
        const origIdx = state.trips.indexOf(t);
        return {
          from: t.from, to: t.to, km: t.km, date: t.date, time: t.time,
          type: t.type, purposeLabel: t.purposeLabel, verified: t.verified, photo: t.photo,
          odoStart: getTripOdoStart(state.trips, origIdx, state.baseOdo),
          odoEnd: getTripOdoEnd(state.trips, origIdx, state.baseOdo),
        };
      });
      const areas: string[] = [];
      const unverifiedBiz = biz.filter(t => !t.verified);
      if (unverifiedBiz.length > 0) areas.push(`${unverifiedBiz.length} business trip${unverifiedBiz.length > 1 ? 's' : ''} not odometer-verified`);
      const noPurpose = biz.filter(t => !t.purposeLabel);
      if (noPurpose.length > 0) areas.push(`${noPurpose.length} business trip${noPurpose.length > 1 ? 's' : ''} missing purpose category`);
      const noPhoto = biz.filter(t => !t.photo);
      if (noPhoto.length > 0) areas.push(`${noPhoto.length} business trip${noPhoto.length > 1 ? 's' : ''} without photo evidence`);
      if (!state.lastOdoReading) areas.push('No odometer reading recorded for this session');
      const unsorted = state.trips.filter(t => t.type === null);
      if (unsorted.length > 0) areas.push(`${unsorted.length} trip${unsorted.length > 1 ? 's' : ''} not sorted yet`);
      if (areas.length === 0) areas.push('All clear \u2014 looking good for ATO compliance');
      const sameSessionReports = state.savedReports.filter(r => r.sessionId === state.sessionId);
      const revisionNum = sameSessionReports.length + 1;
      const isRevision = sameSessionReports.length > 0;
      if (isRevision) {
        areas.unshift('This is a revised report \u2014 verify changes against previous version');
      }
      const report: SavedReport = {
        sessionId: state.sessionId,
        timestamp: ts,
        bizCount: biz.length,
        perCount: per.length,
        classified,
        unclassified: biz.length - classified,
        est: '$' + Math.round(state.dedTotal).toLocaleString('en-AU'),
        totalKm: biz.reduce((s, t) => s + t.km, 0).toFixed(1),
        auditScore: (() => {
          const st = state.trips.filter(t => t.type !== null);
          const tot = st.length;
          if (tot === 0) return 0;
          const cp = 100;
          const vp = (state.verifiedSet.size / tot) * 100;
          const pp = (state.trips.filter(t => t.photo).length / tot) * 100;
          return Math.min(99, Math.round(cp * 0.40 + vp * 0.35 + pp * 0.24));
        })(),
        lastOdoReading: state.lastOdoReading,
        lastOdoVerifiedAt: state.lastOdoVerifiedAt,
        odoRangeStart: getTripOdoStart(state.trips, 0, state.baseOdo),
        odoRangeEnd: getTripOdoEnd(state.trips, state.trips.length - 1, state.baseOdo),
        trips: tripSummaries,
        auditLog: state.auditLog.map(e => ({ time: e.time, desc: e.desc })),
        areasToCheck: areas,
        revision: revisionNum,
        supersedes: false,
      };
      const updatedPrevious = state.savedReports.map(r =>
        r.sessionId === state.sessionId ? { ...r, supersedes: true } : r
      );
      return {
        ...state,
        savedReports: [report, ...updatedPrevious],
        summaryModalOpen: false,
        conflictResolved: false,
        freshSession: false,
        currentScreen: 'reports',
      };
    }
    case 'SET_MANUAL_ODO':
      return {
        ...state,
        lastOdoReading: action.reading,
        lastOdoVerifiedAt: nowStr(),
        auditLog: [{ time: nowStr(), desc: `Odometer manually set to ${action.reading.toLocaleString('en-AU')} km`, hasPhoto: false }, ...state.auditLog],
      };
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
    case 'LOAD_BATCH2': {
      const prevActive = state.savedReports.filter(r => !r.supersedes && r.sessionId !== 'batch2');
      const prevOdoEnd = prevActive.length > 0
        ? Math.max(...prevActive.map(r => r.odoRangeEnd ?? ODO_START))
        : ODO_START;
      return {
        ...initialState,
        trips: batch2Trips.map(t => ({ ...t })),
        savedReports: state.savedReports,
        sessionStartTime: Date.now(),
        sessionId: 'batch2',
        baseOdo: prevOdoEnd,
      };
    }
    case 'DELETE_ALL_TRIPS':
      return {
        ...initialState,
        trips: [],
        savedReports: state.savedReports,
        sessionStartTime: Date.now(),
        auditLog: [{ time: nowStr(), desc: 'All sort cards deleted by user', hasPhoto: false }, ...state.auditLog],
      };
    case 'DELETE_SESSION': {
      const remaining = state.savedReports.filter(r => r.sessionId !== action.sessionId);
      const isCurrentSession = state.sessionId === action.sessionId;
      return {
        ...initialState,
        trips: isCurrentSession ? [] : state.trips,
        savedReports: remaining,
        sessionId: isCurrentSession ? state.sessionId : state.sessionId,
        baseOdo: isCurrentSession ? initialState.baseOdo : state.baseOdo,
        sessionStartTime: Date.now(),
        freshSession: true,
        auditLog: [{ time: nowStr(), desc: `Session "${action.sessionId}" deleted — reports removed. Can be re-sorted anytime.`, hasPhoto: false }, ...state.auditLog],
      };
    }
    case 'COME_BACK_LATER':
      return {
        ...state,
        pendingFinalise: true,
        currentScreen: 'sort' as Screen,
        auditLog: [{ time: nowStr(), desc: 'User paused session — will return to finalise', hasPhoto: false }, ...state.auditLog],
      };
    case 'RESUME_SORTING':
      return {
        ...state,
        pendingFinalise: false,
        auditLog: [{ time: nowStr(), desc: 'User resumed sorting session', hasPhoto: false }, ...state.auditLog],
      };
    case 'PROMOTE_REPORT': {
      const idx = action.reportIndex;
      const targetSessionId = state.savedReports[idx].sessionId;
      const updated = state.savedReports.map((r, i) => ({
        ...r,
        supersedes: r.sessionId === targetSessionId ? i !== idx : r.supersedes,
      }));
      return {
        ...state,
        savedReports: updated,
        conflictResolved: true,
        auditLog: [{ time: nowStr(), desc: `Report Rev ${state.savedReports[idx].revision} promoted to active`, hasPhoto: false }, ...state.auditLog],
      };
    }
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
  const currentBizKm = state.trips.slice(0, state.currentIndex).filter(x => x.type === 'business').reduce((a, x) => a + x.km, 0);
  const currentTotKm = state.trips.slice(0, state.currentIndex).reduce((a, x) => a + x.km, 0);
  const currentSessionHasReport = state.savedReports.some(r => r.sessionId === state.sessionId && !r.supersedes);
  const savedBizKm = state.savedReports
    .filter(r => !r.supersedes)
    .reduce((a, r) => a + (r.trips || []).filter(t => t.type === 'business').reduce((s, t) => s + t.km, 0), 0);
  const savedTotKm = state.savedReports
    .filter(r => !r.supersedes)
    .reduce((a, r) => a + (r.trips || []).reduce((s, t) => s + t.km, 0), 0);
  const bizKm = savedBizKm + (currentSessionHasReport ? 0 : currentBizKm);
  const totKm = savedTotKm + (currentSessionHasReport ? 0 : currentTotKm);
  const bizPct = totKm > 0 ? (bizKm / totKm * 100) : 0;
  const remaining = state.trips.length - state.currentIndex;
  const progress = state.trips.length > 0 ? (state.currentIndex / state.trips.length * 100) : 0;
  const sortedTrips = state.trips.filter(t => t.type !== null);
  const totalTrips = sortedTrips.length;
  const classifiedPct = totalTrips > 0 ? 100 : 0;
  const verifiedCount = state.verifiedSet.size;
  const verifiedPct = totalTrips > 0 ? (verifiedCount / totalTrips) * 100 : 0;
  const photoCount = state.trips.filter(t => t.photo).length;
  const photoPct = totalTrips > 0 ? (photoCount / totalTrips) * 100 : 0;
  const auditScore = totalTrips > 0
    ? Math.min(99, Math.round(classifiedPct * 0.40 + verifiedPct * 0.35 + photoPct * 0.24))
    : 0;
  return { bizKm, totKm, bizPct, remaining, progress, auditScore };
}
