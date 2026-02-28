interface SplashProps {
  onNext: () => void;
  onLogin: () => void;
}

export function SplashScreen({ onNext, onLogin }: SplashProps) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 110% 50% at 50% -5%, rgba(245,196,0,.15) 0%, transparent 60%), var(--wc-bg)',
        }}
      />
      <div
        className="relative z-[1] flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center"
        style={{ padding: '0 28px 40px' }}
      >
        <div className="ob-a1 mb-8 text-center">
          <div
            className="ob-glow flex items-center justify-center mx-auto mb-4"
            style={{
              width: 96,
              height: 96,
              borderRadius: 30,
              background: 'rgba(245,196,0,.07)',
              border: '1.5px solid rgba(245,196,0,.22)',
            }}
            data-testid="logo-icon"
          >
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <path d="M26 4C15 4 7 13 7 21C7 35 26 48 26 48C26 48 45 35 45 21C45 13 37 4 26 4Z" stroke="#F5C400" strokeWidth="2.2" fill="none" />
              <circle cx="26" cy="21" r="7" stroke="#F5C400" strokeWidth="2.2" fill="none" />
              <path d="M19 17L22 25L26 19L30 25L33 17" stroke="#F5C400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="font-display" style={{ fontSize: 46, lineHeight: 1, letterSpacing: '.05em' }}>
            WORK<span style={{ color: 'var(--wc-y)' }}>CAR</span>
          </div>
          <div className="font-data" style={{ fontSize: 9, color: 'var(--wc-t3)', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 4 }}>
            workcar.com.au
          </div>
        </div>

        <div className="ob-a2 text-center mb-9">
          <h1 style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 700, marginBottom: 10 }}>
            Your work car.<br />Your tax back.<br /><span style={{ color: 'var(--wc-y)' }}>Done properly.</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--wc-t2)', lineHeight: 1.65, maxWidth: 270, margin: '0 auto' }}>
            ATO-compliant vehicle logbook built for Australian tradies. Takes 30 seconds a day.
          </p>
        </div>

        <div
          className="ob-a3 flex w-full mb-9"
          style={{
            border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <div className="flex-1 text-center" style={{ padding: '14px 10px', borderRight: '1px solid rgba(255,255,255,.06)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round" style={{ marginBottom: 6, display: 'inline-block' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--wc-t3)', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1.4 }}>
              Auto<br />Track
            </div>
          </div>
          <div className="flex-1 text-center" style={{ padding: '14px 10px', borderRight: '1px solid rgba(255,255,255,.06)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round" style={{ marginBottom: 6, display: 'inline-block' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--wc-t3)', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1.4 }}>
              Swipe<br />Classify
            </div>
          </div>
          <div className="flex-1 text-center" style={{ padding: '14px 10px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round" style={{ marginBottom: 6, display: 'inline-block' }}>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--wc-t3)', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1.4 }}>
              Max<br />Claim
            </div>
          </div>
        </div>

        <div className="ob-a4 flex flex-col gap-[10px] w-full">
          <button
            className="ob-btn ob-btn-y"
            style={{ fontSize: 15, padding: 18 }}
            onClick={onNext}
            data-testid="button-get-started"
          >
            Get Started →
          </button>
          <button
            className="ob-btn ob-btn-ghost"
            onClick={onLogin}
            data-testid="button-already-have-account"
          >
            Already have an account
          </button>
        </div>
      </div>
    </div>
  );
}
