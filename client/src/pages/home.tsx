import { useApp } from '@/lib/app-context';
import { SortScreen } from '@/components/sort-screen';
import { ClassifyScreen } from '@/components/classify-screen';
import { ReviewScreen } from '@/components/review-screen';
import { OdometerScreen } from '@/components/odometer-screen';
import { ReportsScreen } from '@/components/reports-screen';
import { DocumentsScreen } from '@/components/documents-screen';
import { ExportScreen } from '@/components/export-screen';
import { InputScreen } from '@/components/input-screen';
import { DashboardScreen } from '@/components/dashboard-screen';
import { NotesScreen } from '@/components/notes-screen';
import { ExpensesScreen } from '@/components/expenses-screen';
import { StatsScreen } from '@/components/stats-screen';
import { FindKeysScreen } from '@/components/find-keys-screen';
import { AccountScreen } from '@/components/account-screen';
import { EditModal, ATOModal, SummaryModal } from '@/components/modals';
import { BottomNav } from '@/components/bottom-nav';
import type { Screen } from '@/lib/app-context';

function StatusBar() {
  return (
    <div className="flex-shrink-0 flex justify-between items-center px-[26px] pt-[14px] pb-[10px] pointer-events-none" style={{ color: 'var(--wc-status-text)' }}>
      <span className="font-heading font-bold text-[16px]">9:41</span>
      <div className="flex gap-[5px] items-center">
        <svg width="15" height="11" viewBox="0 0 24 18" fill="none">
          <path d="M1 4C7-1 17-1 23 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 8c4-4 12-4 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 12c2-2 6-2 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </svg>
        <svg width="22" height="12" viewBox="0 0 22 12">
          <rect x="0" y="1" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="2" y="3" width="10" height="6" rx="1" fill="currentColor" />
          <path d="M20 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

const screens: Record<string, JSX.Element> = {
  dashboard: <DashboardScreen />,
  sort: <SortScreen />,
  classify: <ClassifyScreen />,
  review: <ReviewScreen />,
  notes: <NotesScreen />,
  odometer: <OdometerScreen />,
  reports: <ReportsScreen />,
  documents: <DocumentsScreen />,
  export: <ExportScreen />,
  input: <InputScreen />,
  expenses: <ExpensesScreen />,
  stats: <StatsScreen />,
  'find-keys': <FindKeysScreen />,
  account: <AccountScreen />,
};

function ScreenContent() {
  const { state } = useApp();
  return (
    <div className="flex-1 min-h-0 overflow-auto pt-2">
      {screens[state.currentScreen]}
    </div>
  );
}

function ScreenContainer() {
  const { state } = useApp();

  const navActiveOverride: Record<string, Screen> = {
    notes: 'dashboard',
    odometer: 'dashboard',
    classify: 'sort',
    review: 'sort',
    export: 'documents',
    expenses: 'documents',
    reports: 'documents',
    stats: 'documents',
    'find-keys': 'dashboard',
  };
  const activeOverride = navActiveOverride[state.currentScreen];

  if (state.isLoading && !state.isInitialised) {
    return (
      <div className="relative flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-2 min-h-0 overflow-auto">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[14px] uppercase" style={{ color: 'var(--wc-t3)' }}>Loading...</span>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="relative flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 pt-2 min-h-0 overflow-auto">
          <span className="font-heading font-bold text-[14px] uppercase text-center" style={{ color: 'var(--wc-re)' }}>{state.error}</span>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <BottomNav activeOverride={activeOverride} />
    </div>
  );
}

export default function Home() {
  const { state } = useApp();
  const showScreenContent = !state.isLoading && !state.error;

  return (
    <div
      className="flex flex-col min-h-[100dvh] w-full"
      style={{ background: 'var(--wc-bg)' }}
      data-testid="app-root"
      data-layout="full-viewport"
    >
      <div className="flex-1 flex flex-col min-h-0 max-w-[390px] w-full mx-auto">
        <StatusBar />
        {showScreenContent && <ScreenContent />}
        <ScreenContainer />
      </div>
      <EditModal />
      <ATOModal />
      <SummaryModal />
    </div>
  );
}
