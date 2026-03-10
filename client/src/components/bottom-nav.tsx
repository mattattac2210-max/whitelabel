import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp, type Screen } from '@/lib/app-context';
import { Home, MapPin, Plus, FileText, Settings, Route, Receipt, X } from 'lucide-react';
import { isLogbookArchived, getActivePeriod } from '@/lib/logbook-utils';

const navItems: { screen: Screen; label: string; icon: typeof MapPin; isAdd?: boolean }[] = [
  { screen: 'dashboard', label: 'Home', icon: Home },
  { screen: 'sort', label: 'Sort', icon: MapPin },
  { screen: 'input', label: 'Add', icon: Plus, isAdd: true },
  { screen: 'documents', label: 'Documents', icon: FileText },
  { screen: 'account', label: 'Settings', icon: Settings },
];

const addMenuItems: { screen: Screen; label: string; icon: typeof Route; desc: string }[] = [
  { screen: 'input', label: 'Trip', icon: Route, desc: 'Record a new trip' },
  { screen: 'expenses', label: 'Expense', icon: Receipt, desc: 'Log a vehicle expense' },
];

export function BottomNav({ activeOverride }: { activeOverride?: Screen }) {
  const { state, dispatch } = useApp();
  const active = activeOverride || state.currentScreen;
  const [showAddMenu, setShowAddMenu] = useState(false);
  const activePeriod = getActivePeriod(state.logbookPeriods);
  const archived = isLogbookArchived(activePeriod);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showAddMenu) return;
    const handleBack = (e: PopStateEvent) => {
      e.preventDefault();
      setShowAddMenu(false);
    };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [showAddMenu]);

  return (
    <>
      <div
        className="grid grid-cols-5 items-end px-[10px] pt-[8px] pb-[20px] border-t flex-shrink-0"
        style={{ background: 'var(--wc-nav-bg)', borderColor: 'var(--wc-border)' }}
        data-testid="bottom-nav"
      >
        {navItems.map(item => {
          const isActive = active === item.screen;
          const Icon = item.icon;
          return (
            <button
              key={item.screen}
              ref={item.isAdd ? addBtnRef : undefined}
              className="flex flex-col items-center gap-[3px] transition-opacity justify-end"
              style={{ opacity: archived && (item.isAdd || item.screen === 'sort') ? 0.15 : item.isAdd ? 1 : isActive ? 1 : 0.34, cursor: archived && (item.isAdd || item.screen === 'sort') ? 'default' : 'pointer' }}
              onClick={() => {
                if (archived && (item.isAdd || item.screen === 'sort')) return;
                if (item.isAdd) {
                  setShowAddMenu(prev => !prev);
                } else {
                  setShowAddMenu(false);
                  dispatch({ type: 'GO_SCREEN', screen: item.screen });
                }
              }}
              data-testid={`nav-${item.screen}`}
            >
              {item.isAdd ? (
                <div
                  className="w-[42px] h-[42px] rounded-full flex items-center justify-center -mt-[14px] transition-transform"
                  style={{
                    background: showAddMenu ? 'rgb(var(--wc-ink) / .12)' : 'var(--wc-y)',
                    boxShadow: showAddMenu ? 'none' : '0 2px 10px rgba(0,0,0,.15)',
                    transform: showAddMenu ? 'rotate(45deg)' : 'none',
                  }}
                >
                  <Icon
                    className="w-[22px] h-[22px]"
                    stroke={showAddMenu ? 'rgb(var(--wc-ink))' : 'var(--wc-bg)'}
                    strokeWidth={2.5}
                  />
                </div>
              ) : (
                <Icon
                  className="w-5 h-5"
                  stroke={isActive ? 'var(--wc-y)' : 'currentColor'}
                  strokeWidth={isActive ? 2 : 1.8}
                />
              )}
              <span
                className="font-heading font-semibold text-[10px] tracking-[.06em] uppercase"
                style={{ color: item.isAdd ? 'var(--wc-t2)' : isActive ? 'var(--wc-y)' : 'var(--wc-t2)' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {showAddMenu && createPortal(
        <div
          className="fixed inset-0 z-[9998]"
          style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setShowAddMenu(false)}
          data-testid="add-menu-overlay"
        >
          <div
            className="fixed inset-0 flex items-center justify-center px-[30px]"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="w-full max-w-[320px] rounded-[18px] overflow-hidden animate-slide-up"
              style={{
                background: 'var(--wc-card)',
                border: '1.5px solid var(--wc-border)',
                boxShadow: '0 12px 40px rgba(0,0,0,.35)',
              }}
              data-testid="add-menu-popup"
            >
              <div className="px-[18px] pt-[16px] pb-[10px]">
                <div className="font-heading font-black text-[16px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>What would you like to add?</div>
              </div>
              {addMenuItems.map((menuItem, i) => {
                const MIcon = menuItem.icon;
                return (
                  <button
                    key={menuItem.screen}
                    className="w-full flex items-center gap-[14px] px-[18px] py-[16px] cursor-pointer transition-all active:opacity-70"
                    style={{
                      borderTop: '1px solid rgb(var(--wc-ink) / .06)',
                    }}
                    onClick={() => {
                      setShowAddMenu(false);
                      dispatch({ type: 'GO_SCREEN', screen: menuItem.screen });
                    }}
                    data-testid={`add-menu-${menuItem.screen}`}
                  >
                    <div
                      className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid rgb(var(--wc-ink) / .1)' }}
                    >
                      <MIcon className="w-[22px] h-[22px]" style={{ color: 'var(--wc-t2)' }} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-heading font-bold text-[15px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>
                        {menuItem.label}
                      </div>
                      <div className="text-[11px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>
                        {menuItem.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="px-[18px] pb-[16px] pt-[8px]">
                <button
                  className="w-full rounded-[10px] py-[10px] font-heading font-bold text-[12px] uppercase tracking-[.05em] cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: 'rgb(var(--wc-ink) / .05)', border: '1px solid rgb(var(--wc-ink) / .1)', color: 'var(--wc-t2)' }}
                  onClick={() => setShowAddMenu(false)}
                  data-testid="add-menu-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
