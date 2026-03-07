import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { CollapsiblePanel, FieldInput, ChipSelect } from './collapsible-panel';

interface UserDetails {
  fullName: string;
  email: string;
  mobile: string;
  businessName: string;
  abn: string;
  residentialAddress: string;
  businessAddress: string;
  accountType: string;
  accountantName: string;
  accountantEmail: string;
  accountantPhone: string;
}

const DEFAULT: UserDetails = {
  fullName: '', email: '', mobile: '', businessName: '', abn: '',
  residentialAddress: '', businessAddress: '', accountType: 'Individual',
  accountantName: '', accountantEmail: '', accountantPhone: '',
};

function load(): UserDetails {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem('wc_user_details') || '{}') }; }
  catch { return DEFAULT; }
}

export function MyDetailsPanel() {
  const [d, setD] = useState<UserDetails>(load);
  const [showAccountant, setShowAccountant] = useState(false);

  useEffect(() => {
    localStorage.setItem('wc_user_details', JSON.stringify(d));
  }, [d]);

  const upd = (key: keyof UserDetails) => (v: string) => setD(prev => ({ ...prev, [key]: v }));

  return (
    <CollapsiblePanel title="My Details" icon={User} testId="panel-my-details">
      <div className="pt-[12px]">
        <FieldInput label="Full Name" value={d.fullName} onChange={upd('fullName')} placeholder="John Smith" testId="input-full-name" />
        <FieldInput label="Email" value={d.email} onChange={upd('email')} placeholder="john@example.com" type="email" testId="input-email" />
        <FieldInput label="Mobile Number" value={d.mobile} onChange={upd('mobile')} placeholder="0412 345 678" type="tel" testId="input-mobile" />
        <FieldInput label="Business Name (optional)" value={d.businessName} onChange={upd('businessName')} placeholder="Smith Plumbing Pty Ltd" testId="input-business-name" />
        <FieldInput label="ABN (optional)" value={d.abn} onChange={upd('abn')} placeholder="12 345 678 901" testId="input-abn" />
        <FieldInput label="Residential Address" value={d.residentialAddress} onChange={upd('residentialAddress')} placeholder="123 Main St, Melbourne VIC 3000" testId="input-res-address" />
        <FieldInput label="Business Address (optional)" value={d.businessAddress} onChange={upd('businessAddress')} placeholder="456 Work Rd, Clayton VIC 3168" testId="input-biz-address" />

        <ChipSelect label="Account Type" options={['Individual', 'Sole Trader', 'Business']} value={d.accountType} onChange={upd('accountType')} testId="chip-account-type" />

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
            <FieldInput label="Accountant Name" value={d.accountantName} onChange={upd('accountantName')} placeholder="Jane Doe" testId="input-accountant-name" />
            <FieldInput label="Accountant Email" value={d.accountantEmail} onChange={upd('accountantEmail')} placeholder="jane@accounting.com" type="email" testId="input-accountant-email" />
            <FieldInput label="Accountant Phone" value={d.accountantPhone} onChange={upd('accountantPhone')} placeholder="03 9876 5432" type="tel" testId="input-accountant-phone" />
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}
