// ============================================================
// AUTH SCREENS
// Covers the full flow from the prototype:
// Splash → Signup → Signup2 → Verify → Login → Forgot
// → Setup Vehicle → Setup Tax → Setup Logbook → All Set
//
// Design: black/white/grey (no brand colours).
// Matches the phone-frame layout of the rest of the app.
// ============================================================

import { useState, useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { startLogbook, saveVehicle, updateProfile } from '@/lib/data-service';

// ── Shared layout pieces ─────────────────────────────────────

function PhoneNav({
  onBack,
  right,
}: {
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex-shrink-0 bg-gray-900 flex items-end justify-between px-5 pb-3 pt-12">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/60 font-semibold text-sm uppercase tracking-wider"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      ) : (
        <div />
      )}
      {right && <div>{right}</div>}
    </div>
  );
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-white/60 font-bold text-xs uppercase tracking-widest">
        STEP {step} OF {total}
      </span>
      <div className="w-20 h-0.5 bg-white/20 rounded overflow-hidden">
        <div
          className="h-full bg-white rounded transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
      {message}
    </div>
  );
}

function PrimaryBtn({
  children,
  onClick,
  loading,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 bg-gray-900 text-white font-bold text-sm uppercase tracking-widest rounded-xl disabled:opacity-50 active:scale-[0.98] transition-transform"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function OutlineBtn({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 bg-transparent text-gray-900 font-bold text-sm uppercase tracking-widest rounded-xl border-2 border-gray-200 active:scale-[0.98] transition-transform"
    >
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 bg-gray-100 text-gray-600 font-bold text-sm uppercase tracking-widest rounded-xl border border-gray-200 active:scale-[0.98] transition-transform"
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete={autoComplete}
      className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 text-lg placeholder-gray-300 focus:border-gray-900 focus:outline-none focus:ring-0 transition-colors"
    />
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-400 text-sm">
      <div className="flex-1 h-px bg-gray-200" />
      {label}
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function SocialBtn({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 active:border-gray-400 transition-colors"
    >
      {children}
    </button>
  );
}

// ── SPLASH ───────────────────────────────────────────────────

function SplashScreen() {
  const { goTo } = useAuth();
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-900 px-5 pb-5 pt-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 40px, white 40px, white 41px)',
          }}
        />
        <div className="relative z-10">
          <div className="text-2xl font-black text-white tracking-tight">Vehicle Logbook</div>
          <div className="text-white/50 text-sm font-semibold uppercase tracking-widest mt-1">
            ATO Compliant
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">
            Track Every
            <br />
            Business Trip
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Automatically record every business trip in a fully ATO-compliant logbook.
          </p>
        </div>

        {/* Feature tiles */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: '📍', label: 'Auto\nTrack' },
            { icon: '✅', label: 'ATO\nCompliant' },
            { icon: '📄', label: 'Expense\nRecords' },
          ].map(f => (
            <div key={f.label} className="bg-white border border-gray-200 border-t-4 border-t-gray-900 rounded-xl p-3 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight whitespace-pre-line">
                {f.label}
              </div>
            </div>
          ))}
        </div>

        {/* ATO notice */}
        <div className="bg-gray-100 border border-gray-200 border-l-4 border-l-gray-900 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">ATO Logbook Requirement</span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Under <strong>ITAA 1997 s8-1</strong>, work-related vehicle use must be substantiated with an ATO-compliant logbook.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <PrimaryBtn onClick={() => goTo('signup')}>Get Started →</PrimaryBtn>
          <OutlineBtn onClick={() => goTo('login')}>Sign In to My Account</OutlineBtn>
        </div>
      </div>
    </div>
  );
}

// ── SIGNUP STEP 1 ────────────────────────────────────────────

function SignupScreen() {
  const { goTo, signInWithGoogle, signInWithApple, setPendingEmail, setPendingPhone } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Store for step 2
  const handleContinue = () => {
    setPendingEmail(email);
    setPendingPhone(phone);
    goTo('signup2');
  };

  return (
    <div className="flex flex-col h-full">
      <PhoneNav onBack={() => goTo('splash')} right={<StepIndicator step={1} total={2} />} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Create Account</h1>
          <p className="text-gray-500 text-base mt-2 leading-relaxed">Let's get your logbook set up.</p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <Field label="First Name">
            <TextInput placeholder="Michael" value={firstName} onChange={setFirstName} autoComplete="given-name" />
          </Field>
          <Field label="Email Address">
            <TextInput type="email" placeholder="michael@example.com.au" value={email} onChange={setEmail} autoComplete="email" />
          </Field>
          <Field label="Mobile Number">
            <div className="flex bg-white border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-gray-900 transition-colors">
              <div className="px-4 py-4 bg-gray-50 border-r border-gray-200 text-gray-500 font-bold text-base flex items-center gap-1.5 flex-shrink-0">
                🇦🇺 +61
              </div>
              <input
                type="tel"
                placeholder="400 000 000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="flex-1 px-4 py-4 bg-transparent text-gray-900 text-lg placeholder-gray-300 focus:outline-none"
              />
            </div>
          </Field>
        </div>

        <div className="flex flex-col gap-3">
          <PrimaryBtn onClick={handleContinue} disabled={!firstName || !email}>
            Continue →
          </PrimaryBtn>
          <Divider label="or sign up with" />
          <div className="flex gap-2">
            <SocialBtn onClick={signInWithGoogle}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </SocialBtn>
            <SocialBtn onClick={signInWithApple}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a1a1a">
                <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-3.97 2.541-6.07 5.045-6.07 1.456 0 2.67.96 3.585.96.865 0 2.222-1.01 3.842-1.01.613 0 2.886.06 4.374 2.19z" />
              </svg>
              Apple
            </SocialBtn>
          </div>
          <p className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <button onClick={() => goTo('login')} className="text-gray-900 font-bold underline">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── SIGNUP STEP 2 ────────────────────────────────────────────

function Signup2Screen() {
  const { goTo, signUp, pendingEmail, pendingPhone, error, clearError } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleCreate = async () => {
    clearError();
    setLocalError('');
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setLocalError('Please agree to the Terms of Service.');
      return;
    }
    setLoading(true);
    await signUp(pendingEmail, password, '', pendingPhone);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <PhoneNav onBack={() => goTo('signup')} right={<StepIndicator step={2} total={2} />} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Almost There</h1>
          <p className="text-gray-500 text-base mt-2 leading-relaxed">Set your password and enter your activation code if you have one.</p>
        </div>

        {(error || localError) && (
          <div className="mb-4">
            <ErrorBanner message={error || localError} />
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          <Field label="Password">
            <TextInput type="password" placeholder="Min 8 characters" value={password} onChange={setPassword} autoComplete="new-password" />
          </Field>
          <Field label="Confirm Password">
            <TextInput type="password" placeholder="Re-enter password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </Field>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <label className="block font-bold text-xs uppercase tracking-widest text-gray-900 mb-2">
              Activation Code <span className="font-normal normal-case text-gray-400 text-sm">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. LOG-2024-XXXX"
              value={activationCode}
              onChange={e => setActivationCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-bold tracking-widest uppercase text-base focus:border-gray-900 focus:outline-none transition-colors"
            />
            <p className="text-gray-400 text-xs mt-2">Provided by your fleet manager or dealer</p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <button
              onClick={() => setAgreed(!agreed)}
              className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                agreed ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'
              }`}
            >
              {agreed && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <span className="text-gray-600 text-sm leading-relaxed">
              I agree to the{' '}
              <span className="text-gray-900 font-bold underline cursor-pointer">Terms of Service</span> and{' '}
              <span className="text-gray-900 font-bold underline cursor-pointer">Privacy Policy</span>. Data stored securely in Australia 🇦🇺
            </span>
          </label>
        </div>

        <PrimaryBtn onClick={handleCreate} loading={loading} disabled={!password || !confirm || !agreed}>
          Create Account →
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ── VERIFY OTP ───────────────────────────────────────────────

function VerifyScreen() {
  const { goTo, verifyOtp, pendingPhone, error, clearError } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    clearError();
    setLoading(true);
    await verifyOtp(code.join(''));
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <PhoneNav onBack={() => goTo('signup')} right={<span className="text-white/60 font-bold text-xs uppercase tracking-widest">Verification</span>} />
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.92 19.79 19.79 0 01.13 2.23a2 2 0 012-2.17h3a2 2 0 012 1.72c.13 1.08.37 2.13.7 3.15a2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c1.02.33 2.07.57 3.15.7a2 2 0 011.72 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Verify Your Number</h2>
        <p className="text-gray-500 text-sm text-center mb-1">6-digit code sent to</p>
        <p className="text-gray-900 font-bold text-sm mb-6">+61 {pendingPhone}</p>

        {error && (
          <div className="w-full mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-11 h-13 text-center bg-white border-2 rounded-lg text-gray-900 font-black text-xl focus:outline-none transition-colors ${
                digit ? 'border-gray-900' : 'border-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="w-full flex flex-col gap-3">
          <PrimaryBtn onClick={handleVerify} loading={loading} disabled={code.some(d => !d)}>
            Verify &amp; Continue →
          </PrimaryBtn>
          <p className="text-center text-gray-500 text-sm">
            Didn't receive it?{' '}
            <button className="text-gray-900 font-bold underline">Resend</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── LOGIN ────────────────────────────────────────────────────

function LoginScreen() {
  const { goTo, signIn, signInWithGoogle, signInWithApple, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    clearError();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <PhoneNav onBack={() => goTo('splash')} right={<span className="text-white/60 font-bold text-xs uppercase tracking-widest">Sign In</span>} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
        <div className="bg-gray-900 rounded-xl px-4 py-4 mb-5 flex items-center justify-between">
          <div className="text-xl font-black text-white tracking-tight">Vehicle Logbook</div>
          <div className="text-white/40 text-xs font-bold uppercase tracking-widest">ATO</div>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="flex flex-col gap-4 mb-5">
          <Field label="Email or Mobile">
            <TextInput type="email" placeholder="michael@example.com.au" value={email} onChange={setEmail} autoComplete="email" />
          </Field>
          <div>
            <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Password</label>
            <TextInput type="password" placeholder="Your password" value={password} onChange={setPassword} autoComplete="current-password" />
            <div className="text-right mt-1">
              <button onClick={() => goTo('forgot')} className="text-gray-500 font-semibold text-xs underline">
                Forgot password?
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <PrimaryBtn onClick={handleSignIn} loading={loading} disabled={!email || !password}>
            Sign In →
          </PrimaryBtn>
          <Divider label="or" />
          <div className="flex gap-2">
            <SocialBtn onClick={signInWithGoogle}>
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </SocialBtn>
            <SocialBtn onClick={signInWithApple}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#1a1a1a">
                <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-3.97 2.541-6.07 5.045-6.07 1.456 0 2.67.96 3.585.96.865 0 2.222-1.01 3.842-1.01.613 0 2.886.06 4.374 2.19z" />
              </svg>
              Apple
            </SocialBtn>
          </div>
          <p className="text-center text-gray-500 text-sm">
            New user?{' '}
            <button onClick={() => goTo('signup')} className="text-gray-900 font-bold underline">
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── FORGOT PASSWORD ──────────────────────────────────────────

function ForgotScreen() {
  const { goTo, resetPassword, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    clearError();
    setLoading(true);
    await resetPassword(email);
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <PhoneNav onBack={() => goTo('login')} />
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Reset Password</h2>
        <p className="text-gray-500 text-sm text-center max-w-xs mb-6 leading-relaxed">
          Enter your email and we'll send a secure reset link.
        </p>

        {error && (
          <div className="w-full mb-4">
            <ErrorBanner message={error} />
          </div>
        )}
        {sent && (
          <div className="w-full mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-medium">
            Reset link sent — check your inbox.
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <Field label="Email Address">
            <TextInput type="email" placeholder="michael@example.com.au" value={email} onChange={setEmail} autoComplete="email" />
          </Field>
          <PrimaryBtn onClick={handleReset} loading={loading} disabled={!email || sent}>
            Send Reset Link →
          </PrimaryBtn>
          <GhostBtn onClick={() => goTo('login')}>Back to Sign In</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ── SETUP: VEHICLE ───────────────────────────────────────────

function SetupVehicleScreen() {
  const { goTo, user } = useAuth();
  const [rego, setRego] = useState('');
  const [state, setState] = useState<'VIC' | 'NSW' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT'>('VIC');
  const [odo, setOdo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await saveVehicle({
        rego: rego.toUpperCase(),
        regoState: state,
        odometerAtStart: parseFloat(odo) || 0,
        status: 'active',
      });
      goTo('setup-tax');
    } catch {
      // Non-fatal — user can fill details in Account later
      goTo('setup-tax');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoVehicle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await saveVehicle({
        make: 'Toyota',
        model: 'HiLux',
        year: 2020,
        variant: 'SR5',
        rego: 'DEMO123',
        regoState: state,
        purchaseDate: '2023-07-01',
        purchasePrice: 55000,
        isNewAtPurchase: true,
        primaryUse: 'mixed',
        odometerAtStart: 84280,
        depreciationMethod: 'diminishing_value',
        effectiveLifeYears: 8,
        wdvAtStartOfFy: 45000,
        isWdvConfirmed: false,
        vehicleCategory: 'ute-4x4',
        bodyType: 'Ute',
        fuelConsumption: 10,
        status: 'active',
        metadata: {},
      });
      goTo('setup-tax');
    } catch {
      goTo('setup-tax');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PhoneNav onBack={() => goTo('verify')} right={<StepIndicator step={2} total={4} />} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
        <div className="mb-5">
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Add Your Vehicle</h1>
          <p className="text-gray-500 text-base mt-2 leading-relaxed">Enter your registration plate to get started.</p>
        </div>

        <div className="flex flex-col gap-4 mb-5">
          <Field label="Registration Plate">
            <div className="flex gap-2">
              <select
                value={state}
                onChange={e => setState(e.target.value as 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT')}
                className="px-3 py-4 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-900 text-sm focus:border-gray-900 focus:outline-none"
              >
                {['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="ABC 123"
                value={rego}
                onChange={e => setRego(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-black text-2xl uppercase tracking-widest text-center focus:border-gray-900 focus:outline-none transition-colors"
              />
            </div>
          </Field>

          <Field label="Current Odometer Reading (km)">
            <input
              type="number"
              placeholder="e.g. 18 402"
              value={odo}
              onChange={e => setOdo(e.target.value)}
              className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-black text-2xl tracking-wide focus:border-gray-900 focus:outline-none transition-colors"
            />
            <p className="text-gray-400 text-xs mt-1.5">Read directly from your dashboard — required for ATO records</p>
          </Field>
        </div>

        {/* ATO note */}
        <div className="bg-gray-100 border border-gray-200 border-l-4 border-l-gray-900 rounded-xl p-4 mb-5">
          <p className="text-gray-600 text-sm leading-relaxed">
            Vehicles over <strong>1 tonne GVM</strong> require an ATO logbook under <strong>ITAA 1997 s8-1</strong> to substantiate business use.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <PrimaryBtn onClick={handleConfirm} loading={loading} disabled={!rego || !odo}>
            Confirm Vehicle →
          </PrimaryBtn>
          <GhostBtn onClick={handleUseDemoVehicle}>Use demo vehicle</GhostBtn>
          <GhostBtn onClick={() => goTo('setup-tax')}>Skip for now</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ── SETUP: TAX / BUSINESS INFO ───────────────────────────────

const INDUSTRIES = [
  'Plumber',
  'Electrician',
  'Builder / Carpenter',
  'Painter',
  'Landscaper',
  'HVAC Technician',
  'Mechanic',
  'Nurse / Healthcare',
  'Sales Representative',
  'Real Estate Agent',
  'Accountant',
  'IT / Technology',
  'Delivery Driver',
  'Tradesperson (Other)',
  'Consultant',
  'Other',
];

function SetupTaxScreen() {
  const { goTo, user } = useAuth();
  const [industry, setIndustry] = useState('');
  const [abn, setAbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const filtered = INDUSTRIES.filter(i => i.toLowerCase().includes(industry.toLowerCase()));

  const handleContinue = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile({ occupation: industry, abn });
    } catch {
      /* non-fatal */
    }
    setLoading(false);
    goTo('setup-logbook');
  };

  return (
    <div className="flex flex-col h-full">
      <PhoneNav onBack={() => goTo('setup-vehicle')} right={<StepIndicator step={3} total={4} />} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
        <div className="mb-5">
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Business Info</h1>
          <p className="text-gray-500 text-base mt-2 leading-relaxed">Tell us about your work so we can configure your logbook correctly.</p>
        </div>

        <div className="flex flex-col gap-4 mb-5">
          <Field label="Business / Industry Type">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Plumber, Nurse, Accountant..."
                value={industry}
                onChange={e => {
                  setIndustry(e.target.value);
                  setShowList(true);
                }}
                onFocus={() => setShowList(true)}
                onBlur={() => setTimeout(() => setShowList(false), 200)}
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 text-base placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
              />
              {showList && filtered.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                  {filtered.map(opt => (
                    <button
                      key={opt}
                      onMouseDown={() => {
                        setIndustry(opt);
                        setShowList(false);
                      }}
                      className="w-full text-left px-4 py-3 text-gray-700 text-sm font-medium hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl border-b border-gray-100 last:border-0"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label="ABN (optional)">
            <TextInput placeholder="e.g. 51 824 753 556" value={abn} onChange={setAbn} />
          </Field>
        </div>

        <PrimaryBtn onClick={handleContinue} loading={loading}>
          Continue →
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ── SETUP: LOGBOOK START ─────────────────────────────────────

function SetupLogbookScreen() {
  const { goTo, user } = useAuth();
  const [startOption, setStartOption] = useState<'today' | 'later'>('today');
  const [trackExpenses, setTrackExpenses] = useState(true);
  const [syncGpsNow, setSyncGpsNow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (syncGpsNow) {
        localStorage.setItem('wc_wants_gps_sync', '1');
      }
      if (startOption === 'today') {
        // We need a vehicleId — this will be populated after setup-vehicle saves
        // For now we skip — app-context will handle starting logbook from dashboard
        void startLogbook; // placeholder to avoid unused import
      }
      void trackExpenses;
    } catch {
      /* non-fatal */
    }
    setLoading(false);
    goTo('all-set');
  };

  return (
    <div className="flex flex-col h-full">
      <PhoneNav onBack={() => goTo('setup-tax')} right={<StepIndicator step={4} total={4} />} />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
        <div className="mb-5">
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Logbook Settings</h1>
          <p className="text-gray-500 text-base mt-2 leading-relaxed">Set your logbook period and preferences.</p>
        </div>

        <div className="flex flex-col gap-4 mb-5">
          {/* ATO requirement */}
          <div className="bg-gray-100 border border-gray-200 border-l-4 border-l-gray-900 rounded-xl p-3 flex items-start gap-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <div className="font-bold text-gray-900 text-sm">ATO minimum: 12 continuous weeks</div>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Valid for 5 years while your business-use pattern stays consistent.</p>
            </div>
          </div>

          {/* Start date */}
          <div>
            <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">
              When do you want to start?
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setStartOption('today')}
                className={`flex-1 py-4 rounded-xl font-bold text-sm border-2 transition-colors ${
                  startOption === 'today' ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setStartOption('later')}
                className={`flex-1 py-4 rounded-xl font-bold text-sm border-2 transition-colors ${
                  startOption === 'later' ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                Start Later
              </button>
            </div>
            {startOption === 'later' && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm leading-relaxed">
                You can set your start date from the dashboard whenever you're ready. Trips are logged from your first drive — you won't miss any.
              </div>
            )}
          </div>

          {/* Track expenses toggle */}
          <div className="flex items-center justify-between bg-white border border-gray-200 border-l-4 border-l-gray-900 rounded-xl px-4 py-4">
            <div>
              <div className="font-bold text-gray-900 text-sm">Track All Deductible Expenses</div>
              <div className="text-gray-500 text-xs mt-0.5">Fuel, tolls, servicing &amp; parking receipts</div>
            </div>
            <button
              onClick={() => setTrackExpenses(!trackExpenses)}
              className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                trackExpenses ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  trackExpenses ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* GPS sync option */}
          <div>
            <label className="block font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">
              GPS device
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSyncGpsNow(true)}
                className={`flex-1 py-4 rounded-xl font-bold text-sm border-2 transition-colors ${
                  syncGpsNow ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                Sync now
              </button>
              <button
                onClick={() => setSyncGpsNow(false)}
                className={`flex-1 py-4 rounded-xl font-bold text-sm border-2 transition-colors ${
                  !syncGpsNow ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                I&apos;ll sync later
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2 leading-relaxed">
              {syncGpsNow ? 'You&apos;ll sync your Key Tag or tracker after setup.' : 'Sync from Add Trip anytime.'}
            </p>
          </div>
        </div>

        <PrimaryBtn onClick={handleContinue} loading={loading}>
          Continue →
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ── ALL SET ──────────────────────────────────────────────────

function AllSetScreen() {
  const { completeOnboarding } = useAuth();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-5 shadow-xl">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">You're All Set!</h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-xs mb-8">
          Your logbook is ready to go. Every trip will be tracked automatically — just sort them as you go.
        </p>

        <div className="w-full flex flex-col gap-3">
          {[
            { icon: '📍', text: 'Trips tracked automatically' },
            { icon: '✅', text: 'ATO-compliant from day one' },
            { icon: '💰', text: 'Tax deduction estimate as you go' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-gray-700 font-medium text-sm">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 p-5 bg-gray-50 border-t border-gray-200">
        <PrimaryBtn onClick={completeOnboarding}>Go to Dashboard →</PrimaryBtn>
      </div>
    </div>
  );
}

// ── Loading screen ───────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
      <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
      <div className="text-white/60 font-semibold text-sm uppercase tracking-widest">Loading</div>
    </div>
  );
}

// ── Root auth screen router ───────────────────────────────────

export function AuthScreens() {
  const { authScreen, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  switch (authScreen) {
    case 'splash':
      return <SplashScreen />;
    case 'signup':
      return <SignupScreen />;
    case 'signup2':
      return <Signup2Screen />;
    case 'verify':
      return <VerifyScreen />;
    case 'login':
      return <LoginScreen />;
    case 'forgot':
      return <ForgotScreen />;
    case 'setup-vehicle':
      return <SetupVehicleScreen />;
    case 'setup-tax':
      return <SetupTaxScreen />;
    case 'setup-logbook':
      return <SetupLogbookScreen />;
    case 'all-set':
      return <AllSetScreen />;
    default:
      return <SplashScreen />;
  }
}

