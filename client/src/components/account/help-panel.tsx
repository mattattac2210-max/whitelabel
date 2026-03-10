import { CollapsiblePanel } from './collapsible-panel';
import { HelpCircle } from 'lucide-react';

export function HelpPanel() {
  return (
    <CollapsiblePanel title="Help & Support" icon={HelpCircle} testId="help-panel">
      <div className="text-[13px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
        Help and support resources will appear here.
      </div>
    </CollapsiblePanel>
  );
}
