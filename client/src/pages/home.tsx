import { useApp } from '@/lib/app-context';
import { SortScreen } from '@/components/sort-screen';
import { ClassifyScreen } from '@/components/classify-screen';
import { ReviewScreen } from '@/components/review-screen';
import { OdometerScreen } from '@/components/odometer-screen';
import { ReportsScreen } from '@/components/reports-screen';
import { EditModal, ATOModal, SummaryModal } from '@/components/modals';

function StatusBar() {
  return (
    <div className="absolute top-0 left-0 right-0 z-[90] flex justify-between items-center px-[26px] pt-[14px] pointer-events-none">
      <span className="font-heading font-bold text-[16px] text-white">9:41</span>
      <div className="flex gap-[5px] items-center">
        <svg width="15" height="11" viewBox="0 0 24 18" fill="none">
          <path d="M1 4C7-1 17-1 23 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 8c4-4 12-4 16 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 12c2-2 6-2 8 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1.5" fill="white" />
        </svg>
        <svg width="22" height="12" viewBox="0 0 22 12">
          <rect x="0" y="1" width="18" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
          <rect x="2" y="3" width="10" height="6" rx="1" fill="white" />
          <path d="M20 4v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function ScreenContainer() {
  const { state } = useApp();

  const screens: Record<string, JSX.Element> = {
    sort: <SortScreen />,
    classify: <ClassifyScreen />,
    review: <ReviewScreen />,
    odometer: <OdometerScreen />,
    reports: <ReportsScreen />,
  };

  return (
    <div className="relative flex-1 flex flex-col pt-[40px] overflow-hidden">
      {screens[state.currentScreen]}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex justify-center items-center min-h-screen overflow-hidden" style={{ background: '#050505' }}>
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '390px',
          height: '844px',
          background: 'var(--wc-bg)',
          borderRadius: '50px',
          border: '1px solid rgba(255,255,255,.10)',
          boxShadow: '0 0 0 6px #0A0A0A, 0 0 0 7px rgba(255,255,255,.07), 0 50px 130px rgba(0,0,0,.95)',
        }}
        data-testid="phone-frame"
      >
        <StatusBar />
        <ScreenContainer />
        <EditModal />
        <ATOModal />
        <SummaryModal />
      </div>
    </div>
  );
}
