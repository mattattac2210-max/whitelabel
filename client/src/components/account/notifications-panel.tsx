import { CollapsiblePanel } from './collapsible-panel';
import { Bell } from 'lucide-react';

export function NotificationsPanel() {
  return (
    <CollapsiblePanel title="Notifications" icon={Bell} testId="notifications-panel">
      <div className="text-[13px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
        Notification preferences will appear here.
      </div>
    </CollapsiblePanel>
  );
}
