import { useState, useMemo, useCallback } from "react";

interface RecommendationProps {
  kmBand: string;
  vehicleAge: string;
  vehicleType: string;
  finance: string;
  onNext: (data: { plan: string }) => void;
  onBack: () => void;
}

const CPK = 0.88;
const CENTS_CAP = 5000;

const RACQ_CPK: Record<string, number> = {
  "ute-4x4": 22932.94 / 15000,
  "ute-4x2": 14663.89 / 15000,
  "suv-medium": 15673.57 / 15000,
  "suv-small": 12464.64 / 15000,
};

const ABS_TOTAL_KM: Record<string, number> = {
  "ute-4x4": 15300,
  "ute-4x2": 15300,
  "suv-medium": 11100,
  "suv-small": 11100,
};

const FIN_MULT: Record<string, number> = { yes: 1.15, no: 0.90 };
const AGE_MULT: Record<string, number> = { "0to2": 1.10, "3to5": 1.00, "6to9": 0.85, "10plus": 0.85 };
const KM_MID: Record<string, number> = { "0to2k": 1000, "2kto5k": 3500, "5kto10k": 7500, "over10k": 12000 };
const SEG_LABEL: Record<string, string> = {
  "ute-4x4": "4\u00d74 ute/van",
  "ute-4x2": "4\u00d72 ute/van",
  "suv-medium": "SUV/wagon",
  "suv-small": "small car/SUV",
};

function estimateCosts(vtype: string, fin: string, age: string) {
  const seg = vtype || "ute-4x2";
  const cpp = RACQ_CPK[seg] || RACQ_CPK["ute-4x2"];
  const totalKm = ABS_TOTAL_KM[seg] || 15000;
  const fMult = FIN_MULT[fin] || 1.0;
  const aMult = AGE_MULT[age] || 1.0;
  const annual = cpp * totalKm * fMult * aMult;
  return { annual: Math.round(annual), cpp, totalKm, fMult, aMult };
}

function calcCentsPerKm(businessKm: number) {
  return Math.round(Math.min(businessKm, CENTS_CAP) * CPK);
}

function calcLogbook(businessKm: number, costs: { totalKm: number; annual: number }) {
  const pct = Math.min(businessKm / costs.totalKm, 1.0);
  return Math.round(pct * costs.annual);
}

function runAlgorithm(kmBand: string, age: string, fin: string, vtype: string) {
  const bizKm = KM_MID[kmBand] || 3500;
  const costs = estimateCosts(vtype, fin, age);
  const centsAmt = calcCentsPerKm(bizKm);
  const logAmt = calcLogbook(bizKm, costs);
  const diff = logAmt - centsAmt;
  const diff5yr = diff * 5;
  const pct = Math.round((bizKm / costs.totalKm) * 100);
  const segName = SEG_LABEL[vtype] || "vehicle";
  const isCapped = bizKm >= CENTS_CAP;

  let method: string, headline: string, reason: string, nextText: string, confidence: string;
  let color = "var(--wc-y)";

  if (diff <= 0) {
    method = "Cents Per Kilometre";
    confidence = Math.abs(diff) > 1000 ? "High Confidence" : "Medium Confidence";
    color = "#38BDF8";
    if (!isCapped) {
      headline = "Cents per km is your best option.";
      reason = `At ~${bizKm.toLocaleString()} km/yr for work, your ${segName}'s total running costs (~$${costs.annual.toLocaleString()}/yr) don't push the logbook past the 88c/km rate. Keep it simple \u2014 no receipts, no 12-week period needed.`;
    } else {
      headline = "Cents per km still wins.";
      reason = `Even though you're over 5,000 km, your ${segName}'s running costs at ${pct}% business use (~$${logAmt.toLocaleString()}/yr logbook) don't beat the $${centsAmt.toLocaleString()} cents-per-km claim. Stick with cents.`;
    }
    nextText = "Track your kilometres. WorkCar tallies your cents-per-km claim automatically and exports a one-page ATO summary at tax time \u2014 $19 once.";
  } else if (diff < 500) {
    method = "Logbook Method";
    headline = "Logbook edges ahead.";
    confidence = "Medium Confidence";
    reason = `Based on RACQ cost averages for a ${segName}, the logbook method produces ~$${diff.toLocaleString()} more per year than cents per km. The margin is modest \u2014 but that's $${diff5yr.toLocaleString()} over 5 years, and it only takes 12 weeks to lock in.`;
    nextText = "Start a 12-week logbook. WorkCar auto-tracks every trip. Nothing to pay until you export the certified PDF at Week 12.";
    color = "#F59E0B";
  } else if (diff < 3000) {
    method = "Logbook Method";
    headline = isCapped ? "Logbook wins \u2014 cents is capped." : "Logbook clearly ahead.";
    confidence = diff > 1500 ? "High Confidence" : "Medium Confidence";
    reason = isCapped
      ? `Cents per km is stuck at $4,400 \u2014 you've driven past the cap. Your ${segName} at ${pct}% business use produces ~$${logAmt.toLocaleString()}/yr under the logbook method. That's $${diff.toLocaleString()} more every year.`
      : `For a ${segName} at ~${pct}% business use, the logbook method produces ~$${logAmt.toLocaleString()}/yr vs cents per km's $${centsAmt.toLocaleString()}. That's $${diff.toLocaleString()}/yr extra \u2014 $${diff5yr.toLocaleString()} over 5 years.`;
    nextText = "Start your 12-week logbook now \u2014 WorkCar handles GPS tracking automatically. Just swipe to mark trips as business or personal.";
  } else {
    method = "Logbook Method";
    headline = diff > 8000 ? "Logbook wins by a mile." : "Logbook wins by a lot.";
    confidence = "High Confidence";
    reason = `Your ${segName} has high running costs${fin === "yes" ? " and finance charges" : ""}. At ${pct}% business use, the logbook method produces ~$${logAmt.toLocaleString()}/yr \u2014 $${diff.toLocaleString()} more than the $4,400 cents-per-km ceiling. Over 5 years that's $${diff5yr.toLocaleString()} left on the table if you don't switch.`;
    nextText = "Start your 12-week logbook now. At this difference, every week you delay is costing you real money.";
    color = "#22C55E";
  }

  return {
    method, headline, reason, nextText, confidence,
    centsAmt, logAmt, diff, diff5yr, pct, isCapped,
    color, costs, segName,
  };
}

const AGE_LABEL: Record<string, string> = { "0to2": "0–2 yrs", "3to5": "3–5 yrs", "6to9": "6–9 yrs", "10plus": "10+ yrs" };
const FIN_LABEL: Record<string, string> = { yes: "Yes (financed)", no: "No (owned outright)", "not-sure": "Not sure" };
const KMBAND_LABEL: Record<string, string> = { "0to2k": "Under 2,000 km", "2kto5k": "2,000–5,000 km", "5kto10k": "5,000–10,000 km", "over10k": "Over 10,000 km" };

function CalcBreakdownModal({ onClose, kmBand, vehicleAge, vehicleType, finance, result, costs }: {
  onClose: () => void;
  kmBand: string;
  vehicleAge: string;
  vehicleType: string;
  finance: string;
  result: ReturnType<typeof runAlgorithm>;
  costs: ReturnType<typeof estimateCosts>;
}) {
  const bizKm = KM_MID[kmBand] || 3500;
  const segName = SEG_LABEL[vehicleType] || "vehicle";
  const pct = Math.round((bizKm / costs.totalKm) * 100);

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
              { label: "Annual business km", value: KMBAND_LABEL[kmBand] || kmBand },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between" style={{ padding: "8px 12px", background: "rgba(255,255,255,.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)" }}>
                <span style={{ fontSize: 11, color: "var(--wc-t3)" }}>{row.label}</span>
                <span className="font-data" style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#fff" }}>Cost estimate breakdown</div>
          <div style={{ padding: 14, background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="flex justify-between" style={{ fontSize: 11 }}>
                <span style={{ color: "var(--wc-t3)" }}>RACQ base cost/km ({segName})</span>
                <span className="font-data" style={{ color: "#fff" }}>${costs.cpp.toFixed(2)}/km</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: 11 }}>
                <span style={{ color: "var(--wc-t3)" }}>ABS avg total km/yr ({segName})</span>
                <span className="font-data" style={{ color: "#fff" }}>{costs.totalKm.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: 11 }}>
                <span style={{ color: "var(--wc-t3)" }}>Age adjustment</span>
                <span className="font-data" style={{ color: "#fff" }}>{costs.aMult.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: 11 }}>
                <span style={{ color: "var(--wc-t3)" }}>Finance adjustment</span>
                <span className="font-data" style={{ color: "#fff" }}>{costs.fMult.toFixed(2)}x</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />
              <div className="flex justify-between" style={{ fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>Est. annual running costs</span>
                <span className="font-data" style={{ fontWeight: 800, color: "var(--wc-y)" }}>${costs.annual.toLocaleString()}</span>
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
            Vehicle running costs are based on <strong style={{ color: "var(--wc-t2)" }}>RACQ vehicle running cost survey</strong> averages
            for your vehicle segment. Total annual kilometres use <strong style={{ color: "var(--wc-t2)" }}>ABS Survey of Motor Vehicle Use</strong> figures.
            The ATO cents-per-km rate of <strong style={{ color: "var(--wc-t2)" }}>$0.88</strong> applies for the 2024–25 financial year.
            Finance and age adjustments use industry averages.
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
              It does not take into account your individual circumstances, actual vehicle expenses, or specific
              tax situation. Always consult a registered tax professional before making tax decisions.
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

export default function Recommendation({ kmBand, vehicleAge, vehicleType, finance, onNext, onBack }: RecommendationProps) {
  const initialResult = useMemo(
    () => runAlgorithm(kmBand, vehicleAge, finance, vehicleType),
    [kmBand, vehicleAge, finance, vehicleType]
  );

  const initWkly = useMemo(() => Math.round((KM_MID[kmBand] || 6000) / 52), [kmBand]);
  const [weeklyKm, setWeeklyKm] = useState(initWkly);
  const [showCalcModal, setShowCalcModal] = useState(false);

  const costs = useMemo(
    () => estimateCosts(vehicleType || "ute-4x2", finance || "yes", vehicleAge || "3to5"),
    [vehicleType, finance, vehicleAge]
  );

  const sliderCalc = useMemo(() => {
    const annKm = weeklyKm * 52;
    const cents = calcCentsPerKm(annKm);
    const log = calcLogbook(annKm, costs);
    const diff = log - cents;
    const diff5 = diff * 5;
    const isCapped = annKm >= CENTS_CAP;
    const pct = Math.round((annKm / costs.totalKm) * 100);
    return { annKm, cents, log, diff, diff5, isCapped, pct };
  }, [weeklyKm, costs]);

  const sliderPct = ((weeklyKm - 20) / (400 - 20)) * 100;

  const isLogbook = useMemo(() => {
    return sliderCalc.diff >= 0 ? initialResult.method.includes("Logbook") || sliderCalc.diff > 0 : false;
  }, [sliderCalc.diff, initialResult.method]);

  const currentMethodIsLogbook = sliderCalc.diff >= 0;

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWeeklyKm(parseInt(e.target.value));
  }, []);

  const diffColor = sliderCalc.diff >= 0 ? initialResult.color : "var(--wc-t2)";

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
          <button
            onClick={() => setShowCalcModal(true)}
            data-testid="button-how-calculated"
            className="inline-flex items-center gap-1.5"
            style={{
              marginTop: 10,
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
            Your next step — tap to start
          </div>
        </div>

        <div className="ob-a4" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {actionTiles.map((tile, i) => (
            <div
              key={i}
              className={`ob-action-tile${tile.primary ? " primary" : ""}`}
              onClick={() => onNext({ plan: tile.plan })}
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
          result={initialResult}
          costs={costs}
        />
      )}
    </div>
  );
}
