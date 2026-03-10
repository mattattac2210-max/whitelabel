import { CollapsiblePanel } from './collapsible-panel';
import { MapPin } from 'lucide-react';

export function TrackingPanel() {
  return (
    <CollapsiblePanel title="Trip Tracking" icon={MapPin} testId="tracking-panel">
      <div className="text-[13px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
        Trip tracking settings and preferences will appear here.
      </div>
    </CollapsiblePanel>
  );
}
