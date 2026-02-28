import { useState } from "react";

interface VehicleDetailsProps {
  onNext: (data: { vehicleAge: string; vehicleType: string; finance: string; priceBand: string }) => void;
  onBack: () => void;
}

const AGE_OPTIONS = [
  { id: "0to6m", label: "0\u20136", sub: "months" },
  { id: "6to12m", label: "6\u201312", sub: "months" },
  { id: "0to2", label: "1\u20132", sub: "years" },
  { id: "3to5", label: "3\u20135", sub: "years" },
  { id: "6to9", label: "6\u20139", sub: "years" },
  { id: "10plus", label: "10+", sub: "years" },
];

const TYPE_OPTIONS = [
  {
    id: "ute-4x4",
    label: "Ute / Van 4\u00d74",
    sub: "HiLux, Ranger, LandCruiser",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.6" strokeLinecap="round">
        <rect x="1" y="11" width="22" height="6" rx="2"/>
        <path d="M1 14h22M5 17v2M19 17v2"/>
        <path d="M5 11V9l4-4h6l3 5"/>
        <circle cx="6" cy="17" r="1" fill="var(--wc-t2)"/>
        <circle cx="18" cy="17" r="1" fill="var(--wc-t2)"/>
      </svg>
    ),
  },
  {
    id: "ute-4x2",
    label: "Ute / Van 4\u00d72",
    sub: "Transit, Amarok, Navara 2WD",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.6" strokeLinecap="round">
        <rect x="1" y="11" width="22" height="6" rx="2"/>
        <path d="M1 14h22M5 17v2M19 17v2"/>
        <path d="M5 11V9l4-4h6l3 5"/>
      </svg>
    ),
  },
  {
    id: "suv-medium",
    label: "SUV / Wagon",
    sub: "RAV4, Prado, Forester",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.6" strokeLinecap="round">
        <rect x="1" y="12" width="22" height="5" rx="2"/>
        <path d="M1 15h22M5 17v2M19 17v2"/>
        <path d="M4 12V9l3-4h10l3 4v3"/>
      </svg>
    ),
  },
  {
    id: "suv-small",
    label: "Car / Small SUV",
    sub: "Corolla, CX-5, i30",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--wc-t2)" strokeWidth="1.6" strokeLinecap="round">
        <rect x="2" y="13" width="20" height="5" rx="2"/>
        <path d="M2 16h20M6 18v2M18 18v2"/>
        <path d="M5 13V11l3-4h8l3 4v2"/>
      </svg>
    ),
  },
];

const FINANCE_OPTIONS = [
  { id: "yes", label: "Yes", sub: "Loan / lease / novated" },
  { id: "no", label: "No", sub: "Owned outright" },
];

const PRICE_OPTIONS = [
  { id: "under30", label: "Under $30k", sub: "$20k mid" },
  { id: "30to50", label: "$30\u2013$50k", sub: "$40k mid" },
  { id: "50to70", label: "$50\u2013$70k", sub: "$60k mid" },
  { id: "over70", label: "$70k+", sub: "$85k mid" },
];

const ATO_CAR_LIMIT = 68108;
const DV_RATE = 0.25;

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

const RUNNING: Record<string, number> = {
  "ute-4x4": 12900,
  "ute-4x2": 9700,
  "suv-medium": 9700,
  "suv-small": 5900,
};

function calcDepreciation(age: string, priceBand: string) {
  const band = AGE_BANDS[age] || AGE_BANDS["0to2"];
  const price = PRICE_MID[priceBand] || 40000;
  const cohort = band.iawoCohort;
  const threshold = IAWO_THRESHOLD[cohort];
  const capped = Math.min(price, ATO_CAR_LIMIT);

  if (price <= threshold) {
    return {
      dep: 0,
      method: "iawo" as const,
      note: `Likely instant write-off \u2014 ${cohort === "covid" ? "$150k" : "$" + threshold.toLocaleString()} IAWO threshold applied`,
    };
  }
  const bookVal = capped * Math.pow(1 - DV_RATE, band.yrs);
  return {
    dep: Math.round(bookVal * DV_RATE),
    method: "dv" as const,
    note: `Diminishing value on $${capped.toLocaleString()} base (${band.yrs}yr)`,
  };
}

const INT_RATE = 0.08;

function estimateCostsLocal(vtype: string, fin: string, age: string, priceBand: string) {
  const seg = vtype || "ute-4x2";
  const { dep, method, note } = calcDepreciation(age || "3to5", priceBand || "30to50");
  const running = RUNNING[seg] || 9700;
  const price = PRICE_MID[priceBand] || 40000;
  const interest = fin === "yes" ? Math.round(Math.min(price, ATO_CAR_LIMIT) * INT_RATE) : 0;
  const annual = dep + running + interest;
  return { annual, dep, running, interest, method, note };
}

export default function VehicleDetails({ onNext, onBack }: VehicleDetailsProps) {
  const [vehicleAge, setVehicleAge] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [finance, setFinance] = useState<string | null>(null);
  const [priceBand, setPriceBand] = useState<string | null>(null);

  const allSelected = vehicleAge && vehicleType && finance && priceBand;

  let costPreview: { annual: number; method: string; note: string; dep: number } | null = null;
  if (allSelected) {
    const costs = estimateCostsLocal(vehicleType, finance, vehicleAge, priceBand);
    costPreview = { annual: costs.annual, method: costs.method, note: costs.note, dep: costs.dep };
  }

  return (
    <div className="ob-screen entering" style={{ paddingTop: 44 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "10px 20px 12px" }}>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button
              className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--wc-t3)" }}
              onClick={onBack}
              data-testid="button-back-q3"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--wc-y)", textTransform: "uppercase", letterSpacing: ".08em" }}>3 of 3</span>
              <div className="ob-pbar" style={{ width: 60 }}>
                <div className="ob-pbar-fill" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
          <div className="font-display" style={{ fontSize: 26, lineHeight: 1, marginBottom: 3 }}>
            Your <span style={{ color: "var(--wc-y)" }}>vehicle</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--wc-t3)", margin: 0 }}>4 quick picks to set your cost score</p>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>
            How old is your vehicle?
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
            {AGE_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className={`ob-sq-tile${vehicleAge === opt.id ? " selected" : ""}`}
                style={{ padding: "7px 4px", textAlign: "center" }}
                onClick={() => setVehicleAge(opt.id)}
                data-testid={`tile-age-${opt.id}`}
              >
                <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1 }}>{opt.label}</div>
                <div style={{ fontSize: 8, color: "var(--wc-t3)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".04em" }}>{opt.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>
            Vehicle type
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {TYPE_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className={`ob-sq-tile${vehicleType === opt.id ? " selected" : ""}`}
                style={{ padding: "8px 8px", textAlign: "center" }}
                onClick={() => setVehicleType(opt.id)}
                data-testid={`tile-type-${opt.id}`}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 3 }}>{opt.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700 }}>{opt.label}</div>
                <div style={{ fontSize: 8, color: "var(--wc-t3)", marginTop: 1 }}>{opt.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
          <div style={{ flex: "0 0 auto" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>
              Financed?
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {FINANCE_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  className={`ob-sq-tile${finance === opt.id ? " selected" : ""}`}
                  style={{ padding: "8px 14px", textAlign: "center" }}
                  onClick={() => setFinance(opt.id)}
                  data-testid={`tile-finance-${opt.id}`}
                >
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</div>
                  <div style={{ fontSize: 8, color: "var(--wc-t3)", marginTop: 1 }}>{opt.sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>
              Price band
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 5 }}>
              {PRICE_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  className={`ob-sq-tile${priceBand === opt.id ? " selected" : ""}`}
                  style={{ padding: "7px 4px", textAlign: "center" }}
                  onClick={() => setPriceBand(opt.id)}
                  data-testid={`tile-price-${opt.id}`}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, lineHeight: 1 }}>{opt.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {costPreview && (
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(245,196,0,.04)",
              border: "1px solid rgba(245,196,0,.14)",
              borderRadius: 10,
              marginBottom: 10,
            }}
            data-testid="cost-score-preview"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: "var(--wc-t2)" }}>
                {costPreview.method === "iawo" ? "Instant Write-Off" : "Diminishing Value"}
              </div>
              <span className="font-data" style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-y)" }}>
                {costPreview.dep > 0 ? `Dep $${costPreview.dep.toLocaleString()}/yr` : "Dep $0"}
              </span>
              <span className="font-data" style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>
                ~${costPreview.annual.toLocaleString()}/yr total
              </span>
            </div>
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          <button
            className="ob-btn ob-btn-y"
            disabled={!allSelected}
            style={{ opacity: allSelected ? 1 : 0.35, fontSize: 14, padding: "12px 0" }}
            onClick={() => {
              if (allSelected) {
                onNext({ vehicleAge: vehicleAge!, vehicleType: vehicleType!, finance: finance!, priceBand: priceBand! });
              }
            }}
            data-testid="button-see-recommendation"
          >
            See My Recommendation &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
