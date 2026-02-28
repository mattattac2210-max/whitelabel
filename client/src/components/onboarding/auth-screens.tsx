import { useState, useRef, useEffect } from "react";

interface AuthScreenProps {
  onNext: (data?: Record<string, string>) => void;
  onBack: () => void;
  recommendation?: string;
}

const BackArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-3.97 2.541-6.07 5.045-6.07 1.456 0 2.67.96 3.585.96.865 0 2.222-1.01 3.842-1.01.613 0 2.886.06 4.374 2.19z" />
  </svg>
);

export function SignupScreen({ onNext, onBack, recommendation }: AuthScreenProps) {
  const [agreed, setAgreed] = useState(false);
  const isLogbook = recommendation === "logbook";

  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ padding: "16px 22px 40px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 22 }}>
          <button
            className="inline-flex items-center gap-[5px] bg-transparent border-none cursor-pointer text-[11px] font-bold uppercase tracking-[.06em]"
            style={{ color: "var(--wc-t3)" }}
            onClick={onBack}
            data-testid="button-signup-back"
          >
            <BackArrow />Back
          </button>
          <div
            className="inline-flex items-center gap-[6px] py-1 px-3 rounded-2xl text-[10px] font-bold uppercase tracking-[.07em]"
            style={isLogbook ? {
              background: "rgba(245,196,0,.10)",
              color: "var(--wc-y)",
              border: "1px solid rgba(245,196,0,.25)"
            } : {
              background: "rgba(56,189,248,.1)",
              color: "#38BDF8",
              border: "1px solid rgba(56,189,248,.22)"
            }}
            data-testid="badge-signup-path"
          >
            {isLogbook ? "Logbook Sprinter" : "Cents-per-Km"}
          </div>
        </div>

        <div className="ob-a1" style={{ marginBottom: 24 }}>
          <div className="font-display" style={{ fontSize: 34, lineHeight: 1.05, marginBottom: 6 }}>
            Create<br /><span style={{ color: "var(--wc-y)" }}>your account</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--wc-t3)" }}>Free to start — no credit card needed</p>
        </div>

        <div className="ob-a2 flex flex-col gap-[10px]" style={{ marginBottom: 20 }}>
          <button
            className="ob-btn"
            style={{ background: "#fff", color: "#111", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "none", padding: 16 }}
            onClick={() => onNext()}
            data-testid="button-signup-google"
          >
            <GoogleLogo />
            Continue with Google
          </button>
          <button
            className="ob-btn"
            style={{ background: "#000", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "1px solid rgba(255,255,255,.15)", padding: 16 }}
            onClick={() => onNext()}
            data-testid="button-signup-apple"
          >
            <AppleLogo />
            Continue with Apple
          </button>
        </div>

        <div className="flex items-center gap-3" style={{ marginBottom: 20, color: "var(--wc-t3)", fontSize: 11 }}>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.06)" }} />
          or sign up with email
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.06)" }} />
        </div>

        <div className="ob-a4 flex flex-col gap-3" style={{ marginBottom: 20 }}>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[.1em] mb-[6px]" style={{ color: "var(--wc-t3)" }}>Email</label>
            <input className="ob-inp" type="email" placeholder="mick@tradie.com.au" data-testid="input-signup-email" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[.1em] mb-[6px]" style={{ color: "var(--wc-t3)" }}>Mobile</label>
            <div className="flex items-center gap-2">
              <input className="ob-inp" style={{ width: 64, flexShrink: 0, textAlign: "center", padding: "14px 8px" }} value="+61" readOnly data-testid="input-signup-country-code" />
              <input className="ob-inp" style={{ flex: 1 }} type="tel" placeholder="04XX XXX XXX" data-testid="input-signup-mobile" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[.1em] mb-[6px]" style={{ color: "var(--wc-t3)" }}>Password</label>
            <input className="ob-inp" type="password" placeholder="Min 8 characters" data-testid="input-signup-password" />
          </div>
        </div>

        <div className="ob-a5" style={{ padding: "12px 14px", background: "rgba(245,196,0,.05)", border: "1px solid rgba(245,196,0,.18)", borderRadius: 14, marginBottom: 20 }}>
          <div className="flex items-center gap-[6px]" style={{ marginBottom: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: "var(--wc-y)" }}>Referral Code (optional)</span>
          </div>
          <input className="ob-inp" style={{ background: "rgba(0,0,0,.2)", marginBottom: 8 }} type="text" placeholder="e.g. BOLT-7T5KT9" data-testid="input-signup-referral" />
          <div className="flex gap-[14px]">
            <div className="flex items-start gap-[5px]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--wc-gr)" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
              <div style={{ fontSize: 10, color: "var(--wc-t3)", lineHeight: 1.4 }}>Your mate earns <strong style={{ color: "var(--wc-y)" }}>1 Bolt</strong> when you become a paying customer</div>
            </div>
            <div className="flex items-start gap-[5px]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--wc-gr)" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
              <div style={{ fontSize: 10, color: "var(--wc-t3)", lineHeight: 1.4 }}>If they've unlocked crew half-price, you get it too</div>
            </div>
          </div>
        </div>

        <div className="ob-a6" style={{ marginBottom: 20 }}>
          <label className="flex items-start gap-[10px] cursor-pointer py-[2px]">
            <div
              onClick={() => setAgreed(!agreed)}
              style={{
                width: 20, height: 20, borderRadius: 5,
                border: "1.5px solid rgba(245,196,0,.38)",
                flexShrink: 0, marginTop: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: agreed ? "var(--wc-y)" : "rgba(245,196,0,.08)",
                transition: "all .2s"
              }}
              data-testid="checkbox-signup-terms"
            >
              {agreed && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={agreed ? "#000" : "var(--wc-y)"} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </div>
            <span style={{ fontSize: 11, color: "var(--wc-t2)", lineHeight: 1.6 }}>
              I agree to the <span style={{ color: "var(--wc-y)", cursor: "pointer" }}>Terms of Service</span> and <span style={{ color: "var(--wc-y)", cursor: "pointer" }}>Privacy Policy</span>. Data stored in Australia.
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-[10px]">
          <button className="ob-btn ob-btn-y" style={{ fontSize: 15 }} onClick={() => onNext()} data-testid="button-signup-create">
            Create Account →
          </button>
          <p className="text-center" style={{ fontSize: 11, color: "var(--wc-t3)" }}>
            Already have an account?{" "}
            <span style={{ color: "var(--wc-y)", cursor: "pointer" }} onClick={onBack} data-testid="link-signup-signin">Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginScreen({ onNext, onBack }: AuthScreenProps & { onForgot?: () => void; onPin?: () => void; onSignup?: () => void }) {
  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ padding: "16px 22px 40px" }}>
        <button
          className="inline-flex items-center gap-[5px] bg-transparent border-none cursor-pointer text-[11px] font-bold uppercase tracking-[.06em]"
          style={{ color: "var(--wc-t3)", marginBottom: 24 }}
          onClick={onBack}
          data-testid="button-login-back"
        >
          <BackArrow />Back
        </button>

        <div className="ob-a1">
          <div className="font-display" style={{ fontSize: 36, marginBottom: 4 }}>
            Welcome<br /><span style={{ color: "var(--wc-y)" }}>back</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--wc-t3)", marginBottom: 26 }}>Sign in to your WorkCar account</p>
        </div>

        <div className="ob-a2 flex flex-col gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[.1em] mb-[6px]" style={{ color: "var(--wc-t3)" }}>Email or Mobile</label>
            <input className="ob-inp" type="text" placeholder="mick@tradie.com.au" data-testid="input-login-email" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[.1em] mb-[6px]" style={{ color: "var(--wc-t3)" }}>Password</label>
            <input className="ob-inp" type="password" placeholder="Your password" data-testid="input-login-password" />
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <span
                style={{ fontSize: 11, color: "var(--wc-y)", cursor: "pointer" }}
                onClick={() => onNext({ action: "forgot" })}
                data-testid="link-login-forgot"
              >
                Forgot password?
              </span>
            </div>
          </div>
        </div>

        <div className="ob-a3 flex flex-col gap-[10px]" style={{ marginTop: 22 }}>
          <button className="ob-btn ob-btn-y" onClick={() => onNext({ action: "signin" })} data-testid="button-login-signin">
            Sign In →
          </button>
          <button
            className="ob-btn ob-btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => onNext({ action: "pin" })}
            data-testid="button-login-pin"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Sign in with PIN / Face ID
          </button>

          <div className="flex items-center gap-3" style={{ color: "var(--wc-t3)", fontSize: 11 }}>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.06)" }} />
            or continue with
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.06)" }} />
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-[13px] rounded-[14px] font-bold text-[12px] tracking-[.04em] cursor-pointer"
              style={{ background: "rgba(255,255,255,.05)", border: "1.5px solid rgba(255,255,255,.11)", color: "var(--wc-t2)" }}
              onClick={() => onNext({ action: "signin" })}
              data-testid="button-login-google"
            >
              <GoogleLogo />Google
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-[13px] rounded-[14px] font-bold text-[12px] tracking-[.04em] cursor-pointer"
              style={{ background: "rgba(255,255,255,.05)", border: "1.5px solid rgba(255,255,255,.11)", color: "var(--wc-t2)" }}
              onClick={() => onNext({ action: "signin" })}
              data-testid="button-login-apple"
            >
              <AppleLogo />Apple
            </button>
          </div>

          <p className="text-center" style={{ fontSize: 11, color: "var(--wc-t3)" }}>
            New here?{" "}
            <span style={{ color: "var(--wc-y)", cursor: "pointer" }} onClick={() => onNext({ action: "signup" })} data-testid="link-login-create">Create account</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function VerifyScreen({ onNext, onBack }: AuthScreenProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div style={{ padding: "16px 28px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div
          className="ob-a1 ob-glow"
          style={{
            width: 76, height: 76, borderRadius: 24,
            background: "rgba(245,196,0,.10)",
            border: "1.5px solid rgba(245,196,0,.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.92 19.79 19.79 0 01.13 2.23a2 2 0 012-2.17h3a2 2 0 012 1.72c.13 1.08.37 2.13.7 3.15a2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c1.02.33 2.07.57 3.15.7a2 2 0 011.72 2z" />
          </svg>
        </div>

        <div className="ob-a2 text-center" style={{ marginBottom: 30 }}>
          <div className="font-display" style={{ fontSize: 30, marginBottom: 8 }}>Verify your number</div>
          <p style={{ fontSize: 13, color: "var(--wc-t2)" }}>6-digit code sent to</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--wc-y)", marginTop: 4 }}>+61 04XX XXX XXX</p>
        </div>

        <div className="ob-a3 flex items-center gap-2" style={{ marginBottom: 30 }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className="ob-otp-box"
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              data-testid={`input-otp-${i}`}
            />
          ))}
        </div>

        <div className="ob-a4 flex flex-col gap-[10px]" style={{ width: "100%" }}>
          <button className="ob-btn ob-btn-y" onClick={() => onNext()} data-testid="button-verify-continue">
            Verify & Continue →
          </button>
          <p className="text-center" style={{ fontSize: 11, color: "var(--wc-t3)" }}>
            Didn't get it? <span style={{ color: "var(--wc-y)", cursor: "pointer" }} data-testid="link-verify-resend">Resend in 0:45</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function ForgotScreen({ onNext, onBack }: AuthScreenProps) {
  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div style={{ padding: "16px 28px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div
          style={{
            width: 76, height: 76, borderRadius: 24,
            background: "rgba(245,196,0,.10)",
            border: "1.5px solid rgba(245,196,0,.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <div className="font-display" style={{ fontSize: 28, marginBottom: 8 }}>Reset password</div>
        <p style={{ fontSize: 12, color: "var(--wc-t2)", textAlign: "center", maxWidth: 240, marginBottom: 28, lineHeight: 1.65 }}>
          Enter your email and we'll send a reset link
        </p>

        <div className="flex flex-col gap-3" style={{ width: "100%" }}>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[.1em] mb-[6px]" style={{ color: "var(--wc-t3)" }}>Email Address</label>
            <input className="ob-inp" type="email" placeholder="mick@tradie.com.au" data-testid="input-forgot-email" />
          </div>
          <button className="ob-btn ob-btn-y" onClick={() => onNext({ action: "reset" })} data-testid="button-forgot-send">
            Send Reset Link →
          </button>
          <button className="ob-btn ob-btn-ghost" onClick={onBack} data-testid="button-forgot-back">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export function PinScreen({ onNext, onBack }: AuthScreenProps) {
  const [pin, setPin] = useState<string[]>([]);

  const handleKey = (key: string) => {
    if (key === "delete") {
      setPin((prev) => prev.slice(0, -1));
    } else if (key === "face") {
      onNext();
    } else {
      const newPin = [...pin, key];
      setPin(newPin);
      if (newPin.length >= 4) {
        setTimeout(() => onNext(), 200);
      }
    }
  };

  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div style={{ padding: "16px 28px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div
          className="ob-a1"
          style={{
            width: 76, height: 76, borderRadius: 24,
            background: "rgba(245,196,0,.10)",
            border: "1.5px solid rgba(245,196,0,.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <div className="ob-a2 text-center" style={{ marginBottom: 28 }}>
          <div className="font-display" style={{ fontSize: 28, marginBottom: 6 }}>Enter PIN</div>
          <p style={{ fontSize: 12, color: "var(--wc-t3)" }}>Or use Face ID / Touch ID</p>
        </div>

        <div className="ob-a3 flex items-center gap-[14px] justify-center" style={{ marginBottom: 36 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 15, height: 15, borderRadius: "50%",
                ...(i < pin.length
                  ? { background: "var(--wc-y)" }
                  : { border: "2px solid rgba(255,255,255,.11)" })
              }}
              data-testid={`pin-dot-${i}`}
            />
          ))}
        </div>

        <div
          className="ob-a4"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxWidth: 260, margin: "0 auto", marginBottom: 24 }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
            <button
              key={key}
              className="ob-nkey"
              onClick={() => handleKey(key)}
              data-testid={`button-pin-${key}`}
            >
              {key}
            </button>
          ))}
          <button
            className="ob-nkey ob-nkey-y"
            onClick={() => handleKey("face")}
            data-testid="button-pin-faceid"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 9h.01M15 9h.01M9.5 14c.83.9 2.13 1 2.5 1s1.67-.1 2.5-1M22 12A10 10 0 1112 2a10 10 0 0110 10z" />
            </svg>
          </button>
          <button
            className="ob-nkey"
            onClick={() => handleKey("0")}
            data-testid="button-pin-0"
          >
            0
          </button>
          <button
            className="ob-nkey"
            onClick={() => handleKey("delete")}
            data-testid="button-pin-delete"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>

        <p style={{ fontSize: 11, color: "var(--wc-t3)" }}>
          Use password instead?{" "}
          <span style={{ color: "var(--wc-y)", cursor: "pointer" }} onClick={onBack} data-testid="link-pin-login">Sign in</span>
        </p>
      </div>
    </div>
  );
}
