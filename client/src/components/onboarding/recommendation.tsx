import { useState, useMemo, useCallback } from "react";

interface RecommendationProps {
  kmBand: string;
  vehicleAge: string;
  vehicleType: string;
  finance: string;
  priceBand: string;
  trade: string;
  initialWeeklyKm?: number;
  personalWeeklyKm?: number;
  onNext: (data: { plan: string }) => void;
  onBack: () => void;
}

const CPK = 0.88;
const CENTS_CAP = 5000;
const ATO_CAR_LIMIT = 68108;
const DV_RATE = 0.25;

const INT_RATE = 0.08;

const PROF_DEFAULTS: Record<string, { bizPct: number; kmBand: string }> = {
  electrician: { bizPct: 0.85, kmBand: "5kto10k" },
  plumber: { bizPct: 0.82, kmBand: "5kto10k" },
  builder: { bizPct: 0.78, kmBand: "5kto10k" },
  carpenter: { bizPct: 0.76, kmBand: "5kto10k" },
  painter: { bizPct: 0.75, kmBand: "5kto10k" },
  hvac: { bizPct: 0.80, kmBand: "5kto10k" },
  landscaper: { bizPct: 0.72, kmBand: "5kto10k" },
  other: { bizPct: 0.75, kmBand: "2kto5k" },
  "real-estate": { bizPct: 0.65, kmBand: "5kto10k" },
  "sales-rep": { bizPct: 0.78, kmBand: "over10k" },
  delivery: { bizPct: 0.92, kmBand: "over10k" },
  healthcare: { bizPct: 0.55, kmBand: "2kto5k" },
  consultant: { bizPct: 0.45, kmBand: "2kto5k" },
  mechanic: { bizPct: 0.70, kmBand: "2kto5k" },
  cleaner: { bizPct: 0.68, kmBand: "5kto10k" },
  photography: { bizPct: 0.60, kmBand: "2kto5k" },
  "aged-care": { bizPct: 0.72, kmBand: "2kto5k" },
  "not-listed": { bizPct: 0.50, kmBand: "2kto5k" },
  "not-tradie": { bizPct: 0.50, kmBand: "2kto5k" },
};

const RUNNING: Record<string, number> = {
  "ute-4x4": 12900,
  "ute-4x2": 9700,
  "suv-medium": 9700,
  "suv-small": 5900,
};

const ABS_TOTAL_KM: Record<string, number> = {
  "ute-4x4": 15300,
  "ute-4x2": 15300,
  "suv-medium": 11100,
  "suv-small": 11100,
};

const AGE_BANDS: Record<string, { yrs: number; iawoCohort: string }> = {
  "0to6m": { yrs: 0.25, iawoCohort: "new" },
  "6to12m": { yrs: 0.75, iawoCohort: "new" },
  "0to2": { yrs: 1.5, iawoCohort: "new" },
  "3to5": { yrs: 4, iawoCohort: "covid" },
  "6to9": { yrs: 7, iawoCohort: "pre" },
  "10plus": { yrs: 12, iawoCohort: "old" },
};

const IAWO_THRESHOLD: Record<string, number> = {
  new: 20000,
  covid: 150000,
  pre: 25000,
  old: 0,
};

const PRICE_MID: Record<string, number> = {
  under30: 20000,
  "30to50": 40000,
  "50to70": 60000,
  over70: 85000,
};

const PRICE_RANGE: Record<string, { lo: number; hi: number }> = {
  under30: { lo: 10000, hi: 30000 },
  "30to50": { lo: 30000, hi: 50000 },
  "50to70": { lo: 50000, hi: 70000 },
  over70: { lo: 70000, hi: 100000 },
};

const KM_MID: Record<string, number> = { "0to2k": 1000, "2kto5k": 3500, "5kto10k": 7500, "over10k": 12000 };

const SEG_LABEL: Record<string, string> = {
  "ute-4x4": "4\u00d74 ute/van",
  "ute-4x2": "4\u00d72 ute/van",
  "suv-medium": "SUV/wagon",
  "suv-small": "small car/SUV",
};

const TRADE_LABEL: Record<string, string> = {
  electrician: "Electrical",
  plumber: "Plumbing",
  builder: "Construction",
  carpenter: "Carpentry",
  painter: "Painting",
  hvac: "HVAC",
  landscaper: "Landscaping",
  other: "Trade",
  "real-estate": "Real Estate",
  "sales-rep": "Sales",
  delivery: "Delivery",
  healthcare: "Healthcare",
  consultant: "Consulting",
  mechanic: "Mechanical",
  cleaner: "Cleaning",
  photography: "Photography",
  "aged-care": "Aged Care",
  "not-listed": "Other",
  "not-tradie": "Other",
};

export function calcDepreciation(age: string, priceBand: string) {
  const band = AGE_BANDS[age] || AGE_BANDS["0to2"];
  const price = PRICE_MID[priceBand] || 40000;
  const cohort = band.iawoCohort;
  const threshold = IAWO_THRESHOLD[cohort];
  const capped = Math.min(price, ATO_CAR_LIMIT);

  if (price <= threshold) {
    return { dep: 0, method: "iawo" as const, note: `Instant write-off applied` };
  }
  const bookVal = capped * Math.pow(1 - DV_RATE, band.yrs);
  return { dep: Math.round(bookVal * DV_RATE), method: "dv" as const, note: `Diminishing value` };
}

export function estimateCosts(vtype: string, fin: string, age: string, priceBand: string, actualTotalKm?: number | null) {
  const seg = vtype || "ute-4x2";
  const baselineKm = ABS_TOTAL_KM[seg] || 15000;
  const totalKm = (actualTotalKm && actualTotalKm > 0) ? actualTotalKm : baselineKm;
  const { dep, method, note } = calcDepreciation(age || "3to5", priceBand || "30to50");
  const baseRunning = RUNNING[seg] || 9700;
  const kmScale = totalKm / baselineKm;
  const running = Math.round(baseRunning * kmScale);
  const price = PRICE_MID[priceBand] || 40000;
  const interest = fin === "yes" ? Math.round(Math.min(price, ATO_CAR_LIMIT) * INT_RATE) : 0;
  const annual = dep + running + interest;
  return { annual, dep, running, interest, method, note, totalKm };
}

export function calcCentsPerKm(businessKm: number) {
  return Math.round(Math.min(businessKm, CENTS_CAP) * CPK);
}

export function calcLogbook(businessKm: number, costs: { totalKm: number; annual: number }, trade: string, personalAnnualKm?: number | null) {
  let effectiveTotal: number;
  if (personalAnnualKm != null && personalAnnualKm > 0) {
    effectiveTotal = businessKm + personalAnnualKm;
  } else {
    const profPct = (PROF_DEFAULTS[trade] || { bizPct: 0.70 }).bizPct;
    const derivedTotal = businessKm / profPct;
    effectiveTotal = Math.max(derivedTotal, costs.totalKm);
  }
  const pct = Math.min(businessKm / effectiveTotal, 1.0);
  return { amount: Math.round(costs.annual * pct), pct: Math.round(pct * 100) };
}

function runAlgorithm(kmBand: string, age: string, fin: string, vtype: string, priceBand: string, trade: string, personalAnnualKm?: number | null) {
  const bizKm = KM_MID[kmBand] || 3500;
  const actualTotal = (personalAnnualKm && personalAnnualKm > 0) ? bizKm + personalAnnualKm : null;
  const costs = estimateCosts(vtype, fin, age, priceBand, actualTotal);
  const centsAmt = calcCentsPerKm(bizKm);
  const { amount: logAmt, pct } = calcLogbook(bizKm, costs, trade, personalAnnualKm);
  const diff = logAmt - centsAmt;
  const diff5yr = diff * 5;
  const segName = SEG_LABEL[vtype] || "vehicle";
  const isCapped = bizKm >= CENTS_CAP;
  const isIAWO = costs.method === "iawo";

  let method: string, headline: string, reason: string, nextText: string, confidence: string;
  let color = "var(--wc-y)";

  if (diff <= 0) {
    method = "Cents Per Kilometre";
    confidence = Math.abs(diff) > 1000 ? "High Confidence" : "Medium Confidence";
    color = "#38BDF8";
    headline = isIAWO
      ? "Cents per km wins \u2014 your depreciation is written off."
      : "Cents per km is your best option.";
    reason = isIAWO
      ? `Your vehicle was likely fully written off under the instant asset write-off \u2014 so there's no depreciation to claim via logbook. At ${pct}% business use, running costs alone (~$${logAmt.toLocaleString()}/yr) don't beat the 88c/km rate. Keep it simple.`
      : `At ~${bizKm.toLocaleString()} km/yr for work, your ${segName}'s total running costs don't push the logbook past the 88c/km rate. No receipts, no 12-week period needed.`;
    nextText = "Track your kilometres. WorkCar tallies your cents-per-km claim automatically \u2014 export a one-page ATO summary at tax time for $19.";
  } else if (diff < 500) {
    method = "Logbook Method";
    headline = "Logbook edges ahead.";
    confidence = "Medium Confidence";
    color = "#F59E0B";
    reason = isIAWO
      ? `Even with your depreciation written off, running costs alone at ${pct}% business use produce ~$${logAmt.toLocaleString()}/yr \u2014 $${diff.toLocaleString()} more than cents per km. Modest margin, but $${diff5yr.toLocaleString()} over 5 years.`
      : `Based on RACQ cost averages for a ${segName}, logbook produces ~$${diff.toLocaleString()} more per year. That's $${diff5yr.toLocaleString()} over 5 years for 12 weeks of tracking.`;
    nextText = "Start a 12-week logbook. WorkCar auto-tracks every trip. Pay nothing until you export at Week 12.";
  } else if (diff < 3000) {
    method = "Logbook Method";
    headline = isCapped ? "Logbook wins \u2014 cents is capped." : "Logbook clearly ahead.";
    confidence = diff > 1500 ? "High Confidence" : "Medium Confidence";
    reason = isCapped
      ? `Cents per km is stuck at $4,400 regardless of how far you drive. Your ${segName} at ${pct}% business use produces ~$${logAmt.toLocaleString()}/yr \u2014 that's $${diff.toLocaleString()} more every year.`
      : `For your ${segName} at ~${pct}% business use, logbook produces ~$${logAmt.toLocaleString()}/yr vs $${centsAmt.toLocaleString()} cents per km. That's $${diff.toLocaleString()}/yr \u2014 $${diff5yr.toLocaleString()} over 5 years.`;
    nextText = "Start your 12-week logbook now \u2014 WorkCar handles GPS tracking automatically. Just swipe to mark trips as business or personal.";
  } else {
    method = "Logbook Method";
    headline = diff > 8000 ? "Logbook wins by a mile." : "Logbook wins by a lot.";
    confidence = "High Confidence";
    color = "#22C55E";
    const depNote = !isIAWO && costs.dep > 0 ? ` including $${costs.dep.toLocaleString()} in depreciation` : "";
    reason = `Your ${segName} has significant running costs${fin === "yes" ? " and finance charges" : ""}${depNote}. At ${pct}% business use, logbook produces ~$${logAmt.toLocaleString()}/yr \u2014 $${diff.toLocaleString()} more than the $4,400 cents cap. Over 5 years that's $${diff5yr.toLocaleString()} left on the table.`;
    nextText = "Start your 12-week logbook now. At this difference, every week you delay is costing you real money.";
  }

  return {
    method, headline, reason, nextText, confidence,
    centsAmt, logAmt, diff, diff5yr, pct, isCapped, isIAWO,
    color, costs, segName,
  };
}

const AGE_LABEL: Record<string, string> = { "0to6m": "0\u20136 mths", "6to12m": "6\u201312 mths", "0to2": "1\u20132 yrs", "3to5": "3\u20135 yrs", "6to9": "6\u20139 yrs", "10plus": "10+ yrs" };
const FIN_LABEL: Record<string, string> = { yes: "Yes (financed)", no: "No (owned outright)" };
const KMBAND_LABEL: Record<string, string> = { "0to2k": "Under 2,000 km", "2kto5k": "2,000\u20135,000 km", "5kto10k": "5,000\u201310,000 km", "over10k": "Over 10,000 km" };
const PRICE_LABEL: Record<string, string> = { under30: "Under $30k", "30to50": "$30\u2013$50k", "50to70": "$50\u2013$70k", over70: "$70k+" };

function CalcBreakdownModal({ onClose, kmBand, vehicleAge, vehicleType, finance, priceBand, trade, result, costs, personalAnnualKm }: {
  onClose: () => void;
  kmBand: string;
  vehicleAge: string;
  vehicleType: string;
  finance: string;
  priceBand: string;
  trade: string;
  result: ReturnType<typeof runAlgorithm>;
  costs: ReturnType<typeof estimateCosts>;
  personalAnnualKm?: number | null;
}) {
  const bizKm = KM_MID[kmBand] || 3500;
  const segName = SEG_LABEL[vehicleType] || "vehicle";
  const { pct } = calcLogbook(bizKm, costs, trade, personalAnnualKm);

  const range = PRICE_RANGE[priceBand] || PRICE_RANGE["30to50"];
  const priceLo = range.lo;
  const priceHi = range.hi;
  const cappedLo = Math.min(priceLo, ATO_CAR_LIMIT);
  const cappedHi = Math.min(priceHi, ATO_CAR_LIMIT);

  const interestLo = finance === "yes" ? Math.round(cappedLo * INT_RATE) : 0;
  const interestHi = finance === "yes" ? Math.round(cappedHi * INT_RATE) : 0;

  const band = AGE_BANDS[vehicleAge] || AGE_BANDS["3to5"];
  const cohort = band.iawoCohort;
  const threshold = IAWO_THRESHOLD[cohort];
  const isIawoLo = priceLo <= threshold;
  const isIawoHi = priceHi <= threshold;
  const depValLo = isIawoLo ? 0 : Math.round(cappedLo * Math.pow(1 - DV_RATE, band.yrs) * DV_RATE);
  const depValHi = isIawoHi ? 0 : Math.round(cappedHi * Math.pow(1 - DV_RATE, band.yrs) * DV_RATE);

  const annualLo = depValLo + costs.running + interestLo;
  const annualHi = depValHi + costs.running + interestHi;
  const showRange = Math.abs(annualHi - annualLo) > 500;

  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,.85)",
        display: "flex", flexDirection: "column",
      }}
      onClick={onClose}
    >
      <div
        style={{
          flex: 1, overflow: "auto",
          padding: "60px 22px 40px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-y)", textTransform: "uppercase", letterSpacing: ".09em" }}>
            How this was calculated
          </div>
          <button
            onClick={onClose}
            data-testid="button-close-calc"
            style={{
              background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8, width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#fff" }}>Your inputs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Vehicle type", value: segName },
              { label: "Vehicle age", value: AGE_LABEL[vehicleAge] || vehicleAge },
              { label: "Finance", value: FIN_LABEL[finance] || finance },
              { label: "Price band", value: PRICE_LABEL[priceBand] || priceBand },
              { label: "Annual business km", value: KMBAND_LABEL[kmBand] || kmBand },
              { label: "Business use %", value: `${pct}%`, highlight: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between" style={{ padding: "8px 12px", background: (row as any).highlight ? "rgba(245,196,0,.06)" : "rgba(255,255,255,.04)", borderRadius: 10, border: `1px solid ${(row as any).highlight ? "rgba(245,196,0,.2)" : "rgba(255,255,255,.06)"}` }}>
                <span style={{ fontSize: 11, color: (row as any).highlight ? "var(--wc-y)" : "var(--wc-t3)" }}>{row.label}</span>
                <span className="font-data" style={{ fontSize: 12, fontWeight: 600, color: (row as any).highlight ? "var(--wc-y)" : "#fff" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#fff" }}>Cost estimate breakdown</div>
          <div style={{ padding: 14, background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="flex justify-between" style={{ fontSize: 11 }}>
                <span style={{ color: "var(--wc-t3)" }}>Running costs ({segName})</span>
                <span className="font-data" style={{ color: "#fff" }}>${costs.running.toLocaleString()}/yr</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: 11 }}>
                <span style={{ color: "var(--wc-t3)" }}>Depreciation ({costs.method === "iawo" ? "IAWO" : "DV"})</span>
                <span className="font-data" style={{ color: "#fff" }}>
                  {showRange && depValLo !== depValHi
                    ? (depValLo === 0 && depValHi === 0 ? "$0 (written off)" : `$${Math.min(depValLo, depValHi).toLocaleString()}–$${Math.max(depValLo, depValHi).toLocaleString()}/yr`)
                    : (costs.dep > 0 ? `$${costs.dep.toLocaleString()}/yr` : "$0 (written off)")
                  }
                </span>
              </div>
              {(costs.interest > 0 || interestHi > 0) && (
                <div className="flex justify-between" style={{ fontSize: 11 }}>
                  <span style={{ color: "var(--wc-t3)" }}>Finance interest (8%)</span>
                  <span className="font-data" style={{ color: "#fff" }}>
                    {showRange && interestLo !== interestHi
                      ? `$${interestLo.toLocaleString()}–$${interestHi.toLocaleString()}/yr`
                      : `$${costs.interest.toLocaleString()}/yr`
                    }
                  </span>
                </div>
              )}
              <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />
              <div className="flex justify-between" style={{ fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>Est. annual vehicle costs</span>
                <span className="font-data" style={{ fontWeight: 800, color: "var(--wc-y)" }}>
                  {showRange
                    ? `$${Math.min(annualLo, annualHi).toLocaleString()}–$${Math.max(annualLo, annualHi).toLocaleString()}`
                    : `$${costs.annual.toLocaleString()}`
                  }
                </span>
              </div>
              {showRange && (
                <div style={{ fontSize: 9, color: "var(--wc-t3)", textAlign: "right", marginTop: -2 }}>
                  Range based on {PRICE_LABEL[priceBand]} price band
                </div>
              )}
              <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />
              <div className="flex justify-between" style={{ fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: "var(--wc-y)" }}>Your {pct}% business portion</span>
                <span className="font-data" style={{ fontWeight: 800, color: "var(--wc-y)" }}>
                  {showRange
                    ? `~$${Math.round(Math.min(annualLo, annualHi) * pct / 100).toLocaleString()}–$${Math.round(Math.max(annualLo, annualHi) * pct / 100).toLocaleString()}`
                    : `~$${Math.round(costs.annual * pct / 100).toLocaleString()}`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#fff" }}>Method comparison</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, padding: 14, background: "rgba(56,189,248,.04)", borderRadius: 12, border: "1px solid rgba(56,189,248,.15)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Cents/km</div>
              <div className="font-data" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>${result.centsAmt.toLocaleString()}</div>
              <div style={{ fontSize: 9, color: "var(--wc-t3)", lineHeight: 1.4 }}>
                {Math.min(bizKm, CENTS_CAP).toLocaleString()} km x $0.88
                {bizKm > CENTS_CAP ? " (capped)" : ""}
              </div>
            </div>
            <div style={{ flex: 1, padding: 14, background: "rgba(245,196,0,.04)", borderRadius: 12, border: "1px solid rgba(245,196,0,.15)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--wc-y)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Logbook</div>
              <div className="font-data" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>~${result.logAmt.toLocaleString()}</div>
              <div style={{ fontSize: 9, color: "var(--wc-t3)", lineHeight: 1.4 }}>
                {pct}% of ${costs.annual.toLocaleString()}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8, padding: "10px 14px", background: result.diff > 0 ? "rgba(245,196,0,.05)" : "rgba(56,189,248,.05)", borderRadius: 10, border: `1px solid ${result.diff > 0 ? "rgba(245,196,0,.15)" : "rgba(56,189,248,.15)"}`, textAlign: "center" }}>
            <span style={{ fontSize: 11, color: "var(--wc-t3)" }}>Difference: </span>
            <span className="font-data" style={{ fontSize: 14, fontWeight: 800, color: result.diff > 0 ? "var(--wc-y)" : "#38BDF8" }}>
              {result.diff >= 0 ? "+" : ""}${Math.abs(result.diff).toLocaleString()}/yr
            </span>
            <span style={{ fontSize: 11, color: "var(--wc-t3)" }}> = </span>
            <span className="font-data" style={{ fontSize: 14, fontWeight: 800, color: result.diff > 0 ? "var(--wc-y)" : "#38BDF8" }}>
              {result.diff5yr >= 0 ? "+" : ""}${Math.abs(result.diff5yr).toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: "var(--wc-t3)" }}> over 5 yrs</span>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Data sources</div>
          <div style={{ fontSize: 10, color: "var(--wc-t3)", lineHeight: 1.6 }}>
            Vehicle running costs are based on <strong style={{ color: "var(--wc-t2)" }}>RACQ vehicle running cost survey</strong> averages.
            Depreciation uses <strong style={{ color: "var(--wc-t2)" }}>ATO diminishing value</strong> or <strong style={{ color: "var(--wc-t2)" }}>IAWO</strong> thresholds.
            The ATO cents-per-km rate of <strong style={{ color: "var(--wc-t2)" }}>$0.88</strong> applies for the 2024-25 financial year.
          </div>
        </div>

        <div style={{
          padding: 14, borderRadius: 12,
          background: "rgba(239,68,68,.06)",
          border: "1px solid rgba(239,68,68,.2)",
        }}>
          <div className="flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--wc-re)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontSize: 10, color: "var(--wc-t2)", lineHeight: 1.6 }}>
              <strong>Important:</strong> This estimate is based on industry averages and the information you provided.
              Always consult a registered tax professional before making tax decisions.
              WorkCar is not a tax agent and does not provide financial advice.
            </div>
          </div>
        </div>

        <button
          className="ob-btn ob-btn-ghost"
          style={{ marginTop: 20, width: "100%" }}
          onClick={onClose}
          data-testid="button-calc-got-it"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default function Recommendation({ kmBand, vehicleAge, vehicleType, finance, priceBand, trade, initialWeeklyKm, personalWeeklyKm, onNext, onBack }: RecommendationProps) {
  const personalAnnualKm = personalWeeklyKm ? personalWeeklyKm * 48 : null;

  const initialResult = useMemo(
    () => runAlgorithm(kmBand, vehicleAge, finance, vehicleType, priceBand, trade, personalAnnualKm),
    [kmBand, vehicleAge, finance, vehicleType, priceBand, trade, personalAnnualKm]
  );

  const initWkly = useMemo(() => {
    if (initialWeeklyKm && initialWeeklyKm > 0) return initialWeeklyKm;
    return Math.round((KM_MID[kmBand] || 6000) / 48);
  }, [kmBand, initialWeeklyKm]);
  const [weeklyKm, setWeeklyKm] = useState(initWkly);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showLogbookModal, setShowLogbookModal] = useState(false);

  const costs = useMemo(() => {
    const annKm = weeklyKm * 48;
    const actualTotal = (personalAnnualKm && personalAnnualKm > 0) ? annKm + personalAnnualKm : null;
    return estimateCosts(vehicleType || "ute-4x2", finance || "yes", vehicleAge || "3to5", priceBand || "30to50", actualTotal);
  }, [vehicleType, finance, vehicleAge, priceBand, weeklyKm, personalAnnualKm]);

  const sliderCalc = useMemo(() => {
    const annKm = weeklyKm * 48;
    const cents = calcCentsPerKm(annKm);
    const { amount: log, pct } = calcLogbook(annKm, costs, trade, personalAnnualKm);
    const diff = log - cents;
    const diff5 = diff * 5;
    const isCapped = annKm >= CENTS_CAP;
    return { annKm, cents, log, diff, diff5, isCapped, pct };
  }, [weeklyKm, costs, trade, personalAnnualKm]);

  const sliderPct = ((weeklyKm - 20) / (400 - 20)) * 100;

  const currentMethodIsLogbook = sliderCalc.diff >= 0;

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWeeklyKm(parseInt(e.target.value));
  }, []);

  const diffColor = sliderCalc.diff >= 0 ? initialResult.color : "var(--wc-t2)";

  const prof = PROF_DEFAULTS[trade] || { bizPct: 0.70 };
  const profPct = Math.round(prof.bizPct * 100);
  const tradeLabel = TRADE_LABEL[trade] || "your profession";

  const actionTiles = currentMethodIsLogbook
    ? [
        {
          primary: true,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          ),
          title: "Start 12-week logbook",
          sub: "Free to start \u2014 $97 one-time when you export at Week 12",
          weeks: "12 weeks",
          plan: "c2",
        },
        {
          primary: false,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          ),
          title: "I already have a logbook",
          sub: "Under 5 years old and travel pattern unchanged \u2014 reuse your %",
          weeks: null,
          plan: "c2",
          hasLogbookPopup: true,
        },
      ]
    : [
        {
          primary: true,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          ),
          title: "Use cents per km",
          sub: "Track km now \u2014 $19 one-page ATO summary at tax time",
          weeks: null,
          plan: "c1",
        },
        {
          primary: false,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          ),
          title: "Run both for 30 days",
          sub: "WorkCar tracks your actual pattern and confirms which method wins",
          weeks: "30 days",
          plan: "c3",
        },
      ];

  return (
    <div className="ob-screen entering" style={{ paddingTop: 44 }}>
      <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain", padding: "20px 22px 44px" }}>

        <div className="ob-a1" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button
              className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--wc-t3)" }}
              onClick={onBack}
              data-testid="button-back-recommendation"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 16,
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".07em",
                background: initialResult.confidence === "High Confidence" ? "rgba(34,197,94,.12)" : "rgba(245,158,11,.12)",
                color: initialResult.confidence === "High Confidence" ? "#22C55E" : "#F59E0B",
                border: `1px solid ${initialResult.confidence === "High Confidence" ? "rgba(34,197,94,.28)" : "rgba(245,158,11,.28)"}`,
              }}
              data-testid="badge-confidence"
            >
              {initialResult.confidence}
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-t3)", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 6 }}>
            WorkCar Recommends
          </div>
          <div className="font-display" style={{ fontSize: 34, lineHeight: 1.05, marginBottom: 6, color: initialResult.color }} data-testid="text-recommendation-method">
            {initialResult.method}
          </div>
          <p style={{ fontSize: 12, color: "var(--wc-t2)", lineHeight: 1.55 }} data-testid="text-recommendation-reason">
            {initialResult.reason}
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              padding: "5px 10px",
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 20,
            }}
            data-testid="badge-profession"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t3)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: 10, color: "var(--wc-t3)" }}>
              Based on {profPct}% average business use for {tradeLabel}
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => setShowCalcModal(true)}
              data-testid="button-how-calculated"
              className="inline-flex items-center gap-1.5"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--wc-y)",
                padding: 0,
                opacity: 0.85,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              How was this calculated?
            </button>
          </div>
        </div>

        <div
          className="ob-a2"
          style={{
            borderRadius: 14,
            border: "1.5px solid rgba(245,196,0,.3)",
            background: "rgba(245,196,0,.04)",
            overflow: "hidden",
            marginBottom: 14,
          }}
          data-testid="card-comparison"
        >
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "var(--wc-t3)", textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 700 }}>
                Business km / week
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <div className="font-data" style={{ fontSize: 22, fontWeight: 800, color: "var(--wc-y)", lineHeight: 1 }} data-testid="text-weekly-km">
                  {weeklyKm}
                </div>
                <div style={{ fontSize: 10, color: "var(--wc-t3)" }}>km/wk</div>
                <div style={{ fontSize: 10, color: "var(--wc-t3)", marginLeft: 4 }}>{"\u2248"}</div>
                <div className="font-data" style={{ fontSize: 13, fontWeight: 700, color: "var(--wc-t2)" }} data-testid="text-annual-km">
                  {sliderCalc.annKm.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: "var(--wc-t3)" }}>yr</div>
              </div>
            </div>

            <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center" }}>
              <input
                type="range"
                className="ob-slider"
                min={20}
                max={400}
                step={5}
                value={weeklyKm}
                onChange={handleSliderChange}
                style={{
                  background: `linear-gradient(90deg, var(--wc-y) ${sliderPct}%, rgba(255,255,255,.12) ${sliderPct}%)`,
                }}
                data-testid="slider-weekly-km"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <div style={{ fontSize: 8, color: "var(--wc-t3)" }}>
                20 km/wk<br /><span style={{ color: "rgba(255,255,255,.3)" }}>~1k/yr</span>
              </div>
              <div style={{ fontSize: 8, color: "var(--wc-t3)", textAlign: "center" }}>
                ~5,000<br /><span style={{ fontSize: 7, color: "rgba(245,196,0,.5)" }}>c/km cap</span>
              </div>
              <div style={{ fontSize: 8, color: "var(--wc-t3)", textAlign: "right" }}>
                400 km/wk<br /><span style={{ color: "rgba(255,255,255,.3)" }}>~20k/yr</span>
              </div>
            </div>
          </div>

          <div style={{ padding: "14px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "end", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--wc-t3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>Cents/km</div>
                <div className="font-data" style={{ fontSize: 20, fontWeight: 800, color: sliderCalc.isCapped ? "var(--wc-t2)" : "#fff" }} data-testid="text-cents-amount">
                  ${sliderCalc.cents.toLocaleString()}
                </div>
                <div style={{ fontSize: 8, color: "var(--wc-t3)", marginTop: 2 }} data-testid="text-cents-note">
                  {sliderCalc.isCapped ? "capped at 5,000 km" : `${weeklyKm} km/wk \u00d7 $0.88`}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--wc-t3)", paddingBottom: 4 }}>vs</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "var(--wc-t3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>Logbook</div>
                <div className="font-data" style={{ fontSize: 26, fontWeight: 800, color: diffColor }} data-testid="text-logbook-amount">
                  ~${sliderCalc.log.toLocaleString()}
                </div>
                <div style={{ fontSize: 8, color: "var(--wc-t3)", marginTop: 2 }}>
                  {sliderCalc.pct}% of ~${costs.annual.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,.07)", marginBottom: 10 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ padding: "10px 12px", background: "rgba(0,0,0,.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 8, color: "var(--wc-t3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Extra this year</div>
                <div className="font-data" style={{ fontSize: 18, fontWeight: 800, color: diffColor }} data-testid="text-diff-year">
                  {sliderCalc.diff >= 0 ? "+" : ""}${Math.abs(sliderCalc.diff).toLocaleString()}
                </div>
              </div>
              <div style={{ padding: "10px 12px", background: "rgba(0,0,0,.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 8, color: "var(--wc-t3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Over 5 years</div>
                <div className="font-data" style={{ fontSize: 18, fontWeight: 800, color: diffColor }} data-testid="text-diff-5year">
                  {sliderCalc.diff5 >= 0 ? "+" : ""}${Math.abs(sliderCalc.diff5).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ob-a3" style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-t3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
            Your next step &mdash; tap to start
          </div>
        </div>

        <div className="ob-a4" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {actionTiles.map((tile, i) => (
            <div
              key={i}
              className={`ob-action-tile${tile.primary ? " primary" : ""}`}
              onClick={() => {
                if (tile.hasLogbookPopup) {
                  setShowLogbookModal(true);
                } else {
                  onNext({ plan: tile.plan });
                }
              }}
              data-testid={`tile-action-${i}`}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: tile.primary ? "rgba(245,196,0,.1)" : "rgba(255,255,255,.05)",
                  border: `1.5px solid ${tile.primary ? "rgba(245,196,0,.25)" : "rgba(255,255,255,.06)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {tile.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: tile.primary ? "#fff" : "var(--wc-t2)" }}>
                  {tile.title}
                </div>
                <div style={{ fontSize: 10, color: "var(--wc-t3)", marginTop: 3, lineHeight: 1.4 }}>
                  {tile.sub}
                </div>
              </div>
              {tile.weeks && (
                <div
                  style={{
                    flexShrink: 0,
                    padding: "4px 8px",
                    background: tile.primary ? "rgba(245,196,0,.15)" : "rgba(255,255,255,.06)",
                    borderRadius: 6,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: tile.primary ? "var(--wc-y)" : "var(--wc-t3)" }}>
                    {tile.weeks}
                  </div>
                </div>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tile.primary ? "rgba(245,196,0,.6)" : "var(--wc-t3)"} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          ))}
        </div>
      </div>

      {showCalcModal && (
        <CalcBreakdownModal
          onClose={() => setShowCalcModal(false)}
          kmBand={kmBand}
          vehicleAge={vehicleAge}
          vehicleType={vehicleType}
          finance={finance}
          priceBand={priceBand}
          trade={trade}
          result={initialResult}
          costs={costs}
          personalAnnualKm={personalAnnualKm}
        />
      )}

      {showLogbookModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowLogbookModal(false)}
          data-testid="modal-logbook-existing"
        >
          <div
            className="ob-a1"
            style={{
              width: "calc(100% - 40px)",
              maxWidth: 350,
              padding: 24,
              background: "#141414",
              border: "1.5px solid rgba(245,196,0,.25)",
              borderRadius: 18,
              boxShadow: "0 0 40px rgba(245,196,0,.08), inset 0 0 30px rgba(245,196,0,.02)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(245,196,0,.1)", border: "1.5px solid rgba(245,196,0,.25)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="font-display" style={{ fontSize: 22, lineHeight: 1.1 }}>
                Trust <span style={{ color: "var(--wc-y)" }}>your</span> numbers
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--wc-t2)", lineHeight: 1.65, marginBottom: 14 }}>
              You know your deductions better than we do. These results are based on <strong style={{ color: "#fff" }}>averages</strong>, not your individual circumstances.
            </p>
            <p style={{ fontSize: 13, color: "var(--wc-t2)", lineHeight: 1.65, marginBottom: 20 }}>
              If your logbook is <strong style={{ color: "#fff" }}>expiring soon</strong>, this could be the right time to sort out the next <strong style={{ color: "var(--wc-y)" }}>5 years</strong> based on how you actually drive now.
            </p>

            <div style={{
              padding: "12px 14px", background: "rgba(245,196,0,.04)",
              border: "1px solid rgba(245,196,0,.14)", borderRadius: 12, marginBottom: 18,
            }}>
              <div style={{ fontSize: 11, color: "var(--wc-t2)", lineHeight: 1.55 }}>
                <strong style={{ color: "var(--wc-y)" }}>Tip:</strong> A new 12-week logbook locks in your <em>current</em> driving pattern for 5 years. If your work has changed since your last logbook, a fresh one could mean a bigger claim.
              </div>
            </div>

            <button
              className="ob-btn ob-btn-y"
              style={{ width: "100%", marginBottom: 10 }}
              onClick={() => { setShowLogbookModal(false); onNext({ plan: "c2" }); }}
              data-testid="button-logbook-start-fresh"
            >
              Start a fresh 12-week logbook
            </button>
            <button
              className="ob-btn ob-btn-ghost"
              style={{ width: "100%" }}
              onClick={() => { setShowLogbookModal(false); onNext({ plan: "c2" }); }}
              data-testid="button-logbook-reuse"
            >
              Continue with existing logbook
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
