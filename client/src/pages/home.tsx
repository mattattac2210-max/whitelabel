import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import { OnboardingScreen } from '@/components/onboarding-screen';
import { GuideScreen } from '@/components/guide-screen';
import { AssistantBanner } from '@/components/assistant-banner';
import { EditModal, ATOModal, SummaryModal } from '@/components/modals';
import { BottomNav } from '@/components/bottom-nav';
import type { Screen } from '@/lib/app-context';

function LogbookLaunchSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const [bars, setBars] = useState(0);
  const [flash, setFlash] = useState(false);

  // Timing — edit these to tune speed
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 300),   // LOGBOOK slams in
      setTimeout(() => setPhase(2), 1400),  // subtitle fades up
      setTimeout(() => setPhase(3), 2500),  // bars start filling
      setTimeout(() => setPhase(4), 5000),  // TRACKING LIVE badge
      setTimeout(() => { setPhase(5); setFlash(true); }, 6000), // white-out
      setTimeout(onComplete, 6800),         // hand back to app
    ];
    return () => ts.forEach(clearTimeout);
  }, [onComplete]);

  // Fill bars one at a time, 200 ms apart
  useEffect(() => {
    if (phase < 3) return;
    let n = 0;
    const iv = setInterval(() => { n++; setBars(n); if (n >= 12) clearInterval(iv); }, 200);
    return () => clearInterval(iv);
  }, [phase]);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:99999,
      background:'#070709',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      overflow:'hidden',
      opacity: flash ? 0 : 1,
      transition: flash ? 'opacity 900ms ease' : 'none',
    }}>
      <style>{`
        @keyframes lb-slam {
          0%   { transform:scale(2.6) translateY(-18px); opacity:0; filter:blur(14px); }
          55%  { transform:scale(0.97) translateY(1px);  opacity:1; filter:blur(0); }
          75%  { transform:scale(1.03); }
          100% { transform:scale(1); opacity:1; }
        }
        @keyframes lb-sub {
          0%   { opacity:0; transform:translateY(8px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes lb-bar-in {
          0%   { transform:scaleX(0); }
          100% { transform:scaleX(1); }
        }
        @keyframes lb-go {
          0%   { transform:scale(0.7); opacity:0; filter:blur(6px); }
          60%  { transform:scale(1.05); opacity:1; filter:blur(0); }
          100% { transform:scale(1); }
        }
        @keyframes lb-scan {
          0%   { transform:translateY(-100%); }
          100% { transform:translateY(110vh); }
        }
        @keyframes lb-fade-in {
          0%   { opacity:0; }
          100% { opacity:1; }
        }
        @keyframes lb-dot-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.45; transform:scale(0.8); }
        }
      `}</style>

      {/* Scanline sweep */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:'100px',
        background:'linear-gradient(to bottom, transparent, rgba(255,255,255,0.04), transparent)',
        animation:'lb-scan 3.5s linear infinite',
        pointerEvents:'none',
      }} />

      {/* Dot-grid overlay */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize:'28px 28px',
        animation:'lb-fade-in 1.2s ease forwards',
        opacity:0,
      }} />

      {/* Corner brackets */}
      {(['top','bottom'] as const).flatMap(v =>
        (['left','right'] as const).map(h => (
          <div key={v+h} style={{
            position:'absolute', width:32, height:32, [v]:28, [h]:28,
            borderTop:    v==='top'    ? '2px solid rgba(255,255,255,0.3)' : undefined,
            borderBottom: v==='bottom' ? '2px solid rgba(255,255,255,0.3)' : undefined,
            borderLeft:   h==='left'   ? '2px solid rgba(255,255,255,0.3)' : undefined,
            borderRight:  h==='right'  ? '2px solid rgba(255,255,255,0.3)' : undefined,
            opacity: phase >= 1 ? 1 : 0,
            transition:'opacity 600ms ease',
          }} />
        ))
      )}

      {/* Content — clamped for phone screens */}
      <div style={{ textAlign:'center', padding:'0 28px', width:'100%', maxWidth:'350px', boxSizing:'border-box' }}>

        {/* LOGBOOK */}
        {phase >= 1 && (
          <div style={{
            fontFamily:'var(--font-heading,system-ui)',
            fontWeight:900,
            fontSize:'clamp(42px,13vw,58px)',
            lineHeight:1,
            letterSpacing:'0.05em',
            textTransform:'uppercase',
            color:'#ffffff',
            animation:'lb-slam 800ms cubic-bezier(.34,1.4,.64,1) both',
            textShadow:'0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(255,255,255,0.18)',
            marginBottom:'6px',
          }}>
            LOGBOOK
          </div>
        )}

        {/* Subtitle */}
        {phase >= 2 && (
          <div style={{
            fontFamily:'var(--font-data,monospace)',
            fontWeight:600,
            fontSize:'11px',
            letterSpacing:'0.22em',
            textTransform:'uppercase',
            color:'rgba(255,255,255,0.55)',
            animation:'lb-sub 600ms ease both',
            marginBottom:'32px',
          }}>
            MISSION ACTIVE · 12 WEEKS · 84 DAYS
          </div>
        )}

        {/* 12-week bar segments */}
        {phase >= 3 && (
          <div style={{ marginBottom:'28px' }}>
            <div style={{
              fontFamily:'var(--font-data,monospace)',
              fontSize:'8px',
              letterSpacing:'0.2em',
              color:'rgba(255,255,255,0.3)',
              marginBottom:'10px',
              textTransform:'uppercase',
            }}>
              INITIALISING WEEK SEGMENTS
            </div>
            <div style={{ display:'flex', gap:'4px' }}>
              {Array.from({ length:12 }).map((_,i) => (
                <div key={i} style={{
                  flex:1, height:'32px', borderRadius:'5px',
                  background: i < bars ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${i < bars ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.12)'}`,
                  boxShadow: i < bars ? '0 0 10px rgba(255,255,255,0.35)' : 'none',
                  transformOrigin:'left',
                  animation: i < bars ? 'lb-bar-in 180ms ease both' : 'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {i < bars && (
                    <span style={{
                      fontFamily:'var(--font-data,monospace)',
                      fontSize:'7px', fontWeight:700,
                      color:'#070709',
                    }}>
                      {i + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div style={{
              display:'flex', justifyContent:'space-between',
              marginTop:'7px',
              fontFamily:'var(--font-data,monospace)',
              fontSize:'8px',
              color:'rgba(255,255,255,0.25)',
              letterSpacing:'0.1em',
            }}>
              <span>WK 1</span><span>WK 6</span><span>WK 12</span>
            </div>
          </div>
        )}

        {/* TRACKING LIVE */}
        {phase >= 4 && (
          <div style={{ animation:'lb-go 700ms cubic-bezier(.34,1.4,.64,1) both' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'10px',
              background:'rgba(255,255,255,0.08)',
              border:'1.5px solid rgba(255,255,255,0.35)',
              borderRadius:'14px',
              padding:'12px 26px',
            }}>
              <div style={{
                width:9, height:9, borderRadius:'50%',
                background:'#ffffff',
                boxShadow:'0 0 10px rgba(255,255,255,0.8)',
                animation:'lb-dot-pulse 900ms ease infinite',
              }} />
              <span style={{
                fontFamily:'var(--font-heading,system-ui)',
                fontWeight:900, fontSize:'15px',
                letterSpacing:'0.1em', textTransform:'uppercase',
                color:'#ffffff',
              }}>
                TRACKING LIVE
              </span>
            </div>
            <div style={{
              fontFamily:'var(--font-data,monospace)',
              fontSize:'10px',
              color:'rgba(255,255,255,0.28)',
              marginTop:'14px',
              letterSpacing:'0.14em',
              textTransform:'uppercase',
            }}>
              Your journey begins now
            </div>
          </div>
        )}
      </div>

      {/* Flash out */}
      {flash && (
        <div style={{
          position:'absolute', inset:0,
          background:'white',
          animation:'lb-fade-in 120ms ease both',
          pointerEvents:'none',
        }} />
      )}
    </div>
  );
}

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
  onboarding: <OnboardingScreen />,
  guide: <GuideScreen />,
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
    guide: 'dashboard',
    onboarding: 'dashboard',
    classify: 'sort',
    review: 'sort',
    export: 'documents',
    expenses: 'documents',
    reports: 'documents',
    stats: 'documents',
    'find-keys': 'account',
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

function GpsSyncRedirect() {
  const { state, dispatch } = useApp();
  useEffect(() => {
    if (!state.isInitialised || state.isLoading) return;
    if (localStorage.getItem('wc_wants_gps_sync') === '1') {
      dispatch({ type: 'GO_SCREEN', screen: 'input' });
    }
  }, [state.isInitialised, state.isLoading, dispatch]);
  return null;
}

function OnboardingRedirect() {
  const { state, dispatch } = useApp();
  useEffect(() => {
    if (!state.isInitialised || state.isLoading) return;
    if (!localStorage.getItem('wc_onboarded') && state.currentScreen === 'dashboard') {
      dispatch({ type: 'GO_SCREEN', screen: 'onboarding' });
    }
  }, [state.isInitialised, state.isLoading, dispatch, state.currentScreen]);
  return null;
}

export default function Home() {
  const { state, dispatch } = useApp();
  const showScreenContent = !state.isLoading && !state.error;
  const [alive, setAlive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAlive(true), 60); return () => clearTimeout(t); }, []);

  const [showLaunch, setShowLaunch] = useState(false);
  const handleLaunchComplete = useCallback(() => {
    setShowLaunch(false);
    dispatch({ type: 'GO_SCREEN', screen: 'dashboard' });
    window.dispatchEvent(new CustomEvent('wc:logbook-launched'));
  }, [dispatch]);
  useEffect(() => {
    const handler = () => setShowLaunch(true);
    window.addEventListener('wc:logbook-launch', handler);
    return () => window.removeEventListener('wc:logbook-launch', handler);
  }, []);

  return (
    <div
      className="flex flex-col min-h-[100dvh] w-full"
      style={{
        background: 'var(--wc-bg)',
        opacity: alive ? 1 : 0,
        transition: 'opacity 600ms cubic-bezier(.4,0,.2,1)',
      }}
      data-testid="app-root"
      data-layout="full-viewport"
    >
      <div className="flex-1 flex flex-col min-h-0 max-w-[390px] w-full mx-auto">
        <StatusBar />
        {showScreenContent && <GpsSyncRedirect />}
        {showScreenContent && <OnboardingRedirect />}
        {showScreenContent && <ScreenContent />}
        <ScreenContainer />
      </div>
      {showScreenContent && <AssistantBanner screen={state.currentScreen as Screen} />}
      <EditModal />
      <ATOModal />
      <SummaryModal />
      {showLaunch && createPortal(<LogbookLaunchSequence onComplete={handleLaunchComplete} />, document.body)}
    </div>
  );
}
