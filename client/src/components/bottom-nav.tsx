import { useApp, type Screen } from '@/lib/app-context';
import { MapPin, LayoutGrid, Briefcase, FileText, User } from 'lucide-react';

const navItems: { screen: Screen; label: string; icon: typeof MapPin }[] = [
  { screen: 'sort', label: 'Sort', icon: MapPin },
  { screen: 'classify', label: 'Classify', icon: Briefcase },
  { screen: 'review', label: 'Review', icon: LayoutGrid },
  { screen: 'reports', label: 'Reports', icon: FileText },
];

export function BottomNav({ activeOverride }: { activeOverride?: Screen }) {
  const { state, dispatch } = useApp();
  const active = activeOverride || state.currentScreen;

  return (
    <div
      className="flex justify-around items-center px-[18px] pt-[9px] pb-[20px] border-t flex-shrink-0"
      style={{ background: 'rgba(10,10,10,.97)', borderColor: 'var(--wc-border)' }}
      data-testid="bottom-nav"
    >
      {navItems.map(item => {
        const isActive = active === item.screen;
        const Icon = item.icon;
        const hasSorted = state.trips.some(t => t.type !== null);
        const isLocked = (item.screen === 'classify' || item.screen === 'review') && !hasSorted;
        return (
          <button
            key={item.screen}
            className="flex flex-col items-center gap-[3px] transition-opacity"
            style={{ opacity: isActive ? 1 : isLocked ? 0.15 : 0.34, cursor: isLocked ? 'default' : 'pointer' }}
            onClick={() => {
              if (isLocked) return;
              if (item.screen === 'classify') {
                dispatch({ type: 'INIT_CLASSIFY' });
              } else {
                dispatch({ type: 'GO_SCREEN', screen: item.screen });
              }
            }}
            data-testid={`nav-${item.screen}`}
          >
            <Icon
              className="w-5 h-5"
              stroke={isActive ? 'var(--wc-y)' : 'currentColor'}
              strokeWidth={isActive ? 2 : 1.8}
            />
            <span
              className="font-heading font-semibold text-[10px] tracking-[.06em] uppercase"
              style={{ color: isActive ? 'var(--wc-y)' : 'var(--wc-t2)' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
