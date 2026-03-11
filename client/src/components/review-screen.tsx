import { useMemo, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { getTripsWithConnectors } from '@/lib/trip-data';
import { ArrowLeft, Check, ChevronDown, Home, AlertCircle, Pencil } from 'lucide-react';

export function ReviewScreen() {
  const { state, dispatch } = useApp();
  const [expandedTrip, setExpandedTrip] = useState<number | string | null>(null);

  const listWithConnectors = useMemo(
    () => getTripsWithConnectors(state.trips),
    [state.trips]
  );
  const biz = listWithConnectors.filter(({ trip }) => trip.type === 'business').length;
  const per = listWithConnectors.filter(({ trip, isConnector }) => trip.type === 'personal' && !isConnector).length;
  const gapCount = listWithConnectors.filter(({ isConnector }) => isConnector).length;

  return (
    <div className="flex flex-col h-full" data-testid="review-screen">
      <div className="flex items-center justify-center px-[14px] pt-[6px] pb-[2px] flex-shrink-0">
        <div className="flex items-center gap-[5px]">
          <div className="w-[16px] h-[16px] rounded-full flex items-center justify-center font-heading text-[8px] font-bold" style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}>3</div>
          <span className="font-heading font-bold text-[11px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Step 3 <span style={{ color: 'var(--wc-t3)' }}>of 6</span></span>
        </div>
      </div>
      <div className="flex items-center gap-[8px] px-[14px] pb-[4px] flex-shrink-0">
        <button
          className="w-[28px] h-[28px] rounded-lg flex items-center justify-center"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'sort' })}
          data-testid="button-back-review"
        >
          <ArrowLeft className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-extrabold text-[18px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Review</span>
        <div className="ml-auto flex gap-[8px] items-center">
          <span className="font-data text-[11px] font-bold" style={{ color: 'var(--wc-y)' }}>{biz} biz</span>
          <span className="font-data text-[11px]" style={{ color: 'var(--wc-t3)' }}>{per} per</span>
          {gapCount > 0 && (
            <span className="font-data text-[10px] px-[6px] py-[2px] rounded" style={{ color: 'var(--wc-am)', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)' }}>
              {gapCount} gap{gapCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="font-data text-[11px] font-bold" style={{ color: 'var(--wc-gr)' }}>${Math.round(state.dedTotal).toLocaleString('en-AU')}</span>
        </div>
      </div>

      <div className="flex-1 px-[14px] flex flex-col overflow-y-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
        {listWithConnectors.map(({ trip: t, isConnector, origIndex }, listIdx) => {
          const itemKey = isConnector ? `connector-${t.id}` : origIndex;
          const isExpanded = expandedTrip === itemKey;
          const isBiz = t.type === 'business';

          return (
            <div
              key={itemKey ?? listIdx}
              className="flex flex-col cursor-pointer transition-all flex-1"
              style={{
                maxHeight: isExpanded ? 'none' : '90px',
                borderBottom: listIdx < listWithConnectors.length - 1 ? '1px solid var(--wc-border)' : 'none',
                borderLeft: isConnector ? '3px solid rgba(245,158,11,.4)' : isBiz ? '3px solid rgb(var(--wc-ink) / .5)' : '3px solid rgba(180,180,180,.2)',
                background: isConnector ? 'rgba(245,158,11,.04)' : isBiz ? 'rgb(var(--wc-ink) / .04)' : 'transparent',
              }}
              data-testid={isConnector ? `review-connector-${listIdx}` : `review-trip-${origIndex}`}
            >
              <div
                className="flex items-center gap-[10px] px-[14px] py-[14px]"
                onClick={() => setExpandedTrip(isExpanded ? null : itemKey)}
              >
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-[17px] leading-[1.3] ${isExpanded ? '' : 'truncate'}`} style={{ color: 'var(--wc-text)' }}>
                    {t.from} &rarr; {t.to}
                  </div>
                  <div className="text-[14px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>
                    {t.date}
                    {!isConnector && <> &middot; {t.km} km &middot; {t.duration}</>}
                    {isConnector && <> &middot; Gap trip</>}
                  </div>
                </div>
                <span
                  className="font-heading font-bold text-[13px] px-[12px] py-[5px] rounded-[7px] uppercase tracking-[.04em] flex-shrink-0"
                  style={{
                    background: isConnector ? 'rgba(245,158,11,.12)' : isBiz ? 'var(--wc-yd)' : 'rgba(180,180,180,.08)',
                    color: isConnector ? 'var(--wc-am)' : isBiz ? 'var(--wc-y)' : 'rgba(180,180,180,.7)',
                    border: isConnector ? '1px solid rgba(245,158,11,.25)' : isBiz ? '1px solid rgb(var(--wc-ink) / .22)' : '1px solid rgba(180,180,180,.15)',
                  }}
                >
                  {isConnector ? 'Gap' : isBiz ? 'Biz' : 'Per'}
                </span>
                <ChevronDown className="w-[18px] h-[18px] flex-shrink-0 transition-transform" style={{ color: 'var(--wc-t3)', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
              </div>
              {isExpanded && (
                <div className="px-[14px] pb-[12px] flex flex-col gap-[8px] border-t" style={{ borderColor: 'var(--wc-border)' }}>
                  {isConnector ? (
                    <>
                      <div className="flex items-start gap-[8px] pt-[10px] rounded-[8px] p-[10px_12px]" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)' }}>
                        <AlertCircle className="w-[18px] h-[18px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-am)' }} />
                        <div className="text-[13px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
                          <strong style={{ color: 'var(--wc-text)' }}>Gap trip</strong> — This fills the geographic gap between your previous trip (ended at {t.from}) and your next trip (started at {t.to}). Add a real trip in the Input screen if you drove this leg.
                        </div>
                      </div>
                      <div className="text-[14px] leading-[1.7]" style={{ color: 'var(--wc-t2)' }}>
                        <strong style={{ color: 'var(--wc-text)' }}>From:</strong> {t.from}{t.fromSub ? `, ${t.fromSub}` : ''}<br />
                        <strong style={{ color: 'var(--wc-text)' }}>To:</strong> {t.to}{t.toSub ? `, ${t.toSub}` : ''}
                      </div>
                      <button
                        className="flex items-center justify-center gap-[8px] py-[10px] rounded-[10px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all"
                        style={{ border: '1px solid var(--wc-border)', background: 'rgb(var(--wc-ink) / .04)', color: 'var(--wc-t2)' }}
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'ADD_GAP_TRIP_AND_EDIT', connector: t }); }}
                        data-testid="edit-gap-trip"
                      >
                        <Pencil className="w-[14px] h-[14px]" />
                        Edit trip details
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-[14px] leading-[1.7] pt-[10px]" style={{ color: 'var(--wc-t2)' }}>
                        <strong style={{ color: 'var(--wc-text)' }}>From:</strong> {t.from}, {t.fromSub}<br />
                        <strong style={{ color: 'var(--wc-text)' }}>To:</strong> {t.to}, {t.toSub}<br />
                        <strong style={{ color: 'var(--wc-text)' }}>Time:</strong> {t.time} &middot; {t.duration}
                      </div>
                      {t.purposeLabel && (
                        <div className="text-[14px] italic" style={{ color: 'var(--wc-gr)' }}>Purpose: {t.purposeLabel}</div>
                      )}
                      {t.notes && (
                        <div className="text-[13px] rounded-[8px] p-[8px_12px]" style={{ background: 'rgb(var(--wc-ink) / .03)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}>
                          <span className="font-data text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>Notes: </span>{t.notes}
                        </div>
                      )}
                      <div className="flex gap-[6px]">
                        <button
                          className="flex-1 py-[10px] rounded-[10px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all"
                          style={{ color: 'rgba(180,180,180,.7)', background: t.type === 'personal' ? 'rgba(180,180,180,.1)' : 'transparent', border: '1.5px solid rgba(180,180,180,.25)' }}
                          onClick={(e) => { e.stopPropagation(); origIndex !== null && dispatch({ type: 'RECLASSIFY', tripIndex: origIndex, tripType: 'personal' }); }}
                          data-testid={`reclassify-personal-${origIndex}`}
                        >
                          &larr; Personal
                        </button>
                        <button
                          className="flex-1 py-[10px] rounded-[10px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all"
                          style={{ color: 'var(--wc-y)', background: 'var(--wc-yd)', border: '1.5px solid rgb(var(--wc-ink) / .4)' }}
                          onClick={(e) => { e.stopPropagation(); origIndex !== null && dispatch({ type: 'RECLASSIFY', tripIndex: origIndex, tripType: 'business' }); }}
                          data-testid={`reclassify-business-${origIndex}`}
                        >
                          Business &rarr;
                        </button>
                        <button
                          className="py-[10px] px-[12px] rounded-[10px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all"
                          style={{ border: '1px solid var(--wc-border)', background: 'rgb(var(--wc-ink) / .04)', color: 'var(--wc-t2)' }}
                          onClick={(e) => { e.stopPropagation(); origIndex !== null && dispatch({ type: 'OPEN_EDIT', tripIndex: origIndex }); }}
                          data-testid={`edit-trip-${origIndex}`}
                        >
                          Edit
                        </button>
                        <button
                          className="py-[10px] px-[12px] rounded-[10px] font-heading font-bold text-[13px] tracking-[.05em] uppercase cursor-pointer transition-all"
                          style={{ border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: 'var(--wc-re)' }}
                          onClick={(e) => { e.stopPropagation(); if (origIndex !== null && window.confirm('Delete this trip? Use if it didn\'t happen or is a duplicate.')) dispatch({ type: 'DELETE_TRIP', tripIndex: origIndex }); }}
                          data-testid={`delete-trip-${origIndex}`}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-[14px] py-[6px] flex-shrink-0">
        <button
          className="w-full rounded-[12px] py-[13px] font-heading font-black text-[16px] tracking-[.07em] uppercase flex items-center justify-center gap-2 transition-all"
          style={{
            background: 'var(--wc-y)',
            color: 'var(--wc-bg)',
            boxShadow: '0 4px 20px rgb(var(--wc-ink) / .25)',
            cursor: 'pointer',
          }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'notes' })}
          data-testid="button-done-review"
        >
          <Check className="w-[17px] h-[17px]" strokeWidth={2.5} />
          Continue to Notes &rarr;
        </button>
      </div>

      <div
        className="flex items-center justify-center px-[16px] pt-[10px] pb-[22px] border-t flex-shrink-0"
        style={{ background: 'var(--wc-nav-bg)', borderColor: 'var(--wc-border)' }}
      >
        <button
          className="flex items-center gap-[6px] px-[16px] py-[8px] rounded-full cursor-pointer transition-all active:scale-[.97]"
          style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid rgb(var(--wc-ink) / .1)' }}
          onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          data-testid="review-nav-home"
        >
          <Home className="w-[14px] h-[14px]" style={{ color: 'var(--wc-t2)' }} />
          <span className="font-heading font-bold text-[11px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-t2)' }}>
            Back to Home
          </span>
        </button>
      </div>
    </div>
  );
}
