import { useState, useEffect, useCallback } from 'react';
import { User } from 'lucide-react';
import { CollapsiblePanel, FieldInput, ChipSelect } from './collapsible-panel';
import { useApp } from '@/lib/app-context';
import { updateProfile } from '@/lib/data-service';

export function MyDetailsPanel() {
  const { state } = useApp();
  const p = state.profile;

  // Local form state — mirrors profile shape
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [abn, setAbn] = useState('');
  const [accountType, setAccountType] = useState('Individual');
  const [accountantName, setAccountantName] = useState('');
  const [accountantEmail, setAccountantEmail] = useState('');
  const [accountantPhone, setAccountantPhone] = useState('');
  const [showAccountant, setShowAccountant] = useState(false);

  // Populate form when profile loads from Supabase
  useEffect(() => {
    if (!p) return;
    setFirstName(p.firstName || '');
    setLastName(p.lastName || '');
    setPhone(p.phone || '');
    setBusinessName(p.businessName || '');
    setAbn(p.abn || '');
    setAccountType(p.employmentStatus || 'Individual');
    setAccountantName(p.accountantName || '');
    setAccountantEmail(p.accountantEmail || '');
    setAccountantPhone(p.accountantPhone || '');
    if (p.accountantName || p.accountantEmail || p.accountantPhone) {
      setShowAccountant(true);
    }
  }, [p?.id]); // only re-populate when profile ID changes (initial load)

  // Save to Supabase on blur — fire-and-forget
  const save = useCallback((patch: Parameters<typeof updateProfile>[0]) => {
    updateProfile(patch).catch(err => console.warn('Profile save failed:', err));
  }, []);

  return (
    <CollapsiblePanel title="My Details" icon={User} testId="panel-my-details">
      <div className="pt-[12px]">
        <FieldInput
          label="First Name"
          value={firstName}
          onChange={setFirstName}
          placeholder="John"
          testId="input-first-name"
          onBlur={() => save({ firstName })}
        />
        <FieldInput
          label="Last Name"
          value={lastName}
          onChange={setLastName}
          placeholder="Smith"
          testId="input-last-name"
          onBlur={() => save({ lastName })}
        />
        <FieldInput
          label="Mobile Number"
          value={phone}
          onChange={setPhone}
          placeholder="0412 345 678"
          type="tel"
          testId="input-mobile"
          onBlur={() => save({ phone })}
        />
        <FieldInput
          label="Business Name (optional)"
          value={businessName}
          onChange={setBusinessName}
          placeholder="Smith Plumbing Pty Ltd"
          testId="input-business-name"
          onBlur={() => save({ businessName })}
        />
        <FieldInput
          label="ABN (optional)"
          value={abn}
          onChange={setAbn}
          placeholder="12 345 678 901"
          testId="input-abn"
          onBlur={() => save({ abn })}
        />

        <ChipSelect
          label="Account Type"
          options={['Individual', 'Sole Trader', 'Business']}
          value={accountType}
          onChange={(v) => {
            setAccountType(v);
            save({ employmentStatus: v });
          }}
          testId="chip-account-type"
        />

        <button
          className="mt-[6px] mb-[4px] text-[12px] font-heading font-bold uppercase tracking-[.04em] cursor-pointer"
          style={{ color: 'var(--wc-y)' }}
          onClick={() => setShowAccountant(!showAccountant)}
          data-testid="toggle-accountant-section"
        >
          {showAccountant ? '- Hide' : '+'} Accountant Details
        </button>

        {showAccountant && (
          <div className="mt-[8px] rounded-[10px] p-[12px]" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px solid var(--wc-border)' }}>
            <FieldInput
              label="Accountant Name"
              value={accountantName}
              onChange={setAccountantName}
              placeholder="Jane Doe"
              testId="input-accountant-name"
              onBlur={() => save({ accountantName })}
            />
            <FieldInput
              label="Accountant Email"
              value={accountantEmail}
              onChange={setAccountantEmail}
              placeholder="jane@accounting.com"
              type="email"
              testId="input-accountant-email"
              onBlur={() => save({ accountantEmail })}
            />
            <FieldInput
              label="Accountant Phone"
              value={accountantPhone}
              onChange={setAccountantPhone}
              placeholder="03 9876 5432"
              type="tel"
              testId="input-accountant-phone"
              onBlur={() => save({ accountantPhone })}
            />
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}