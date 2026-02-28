import { useState } from "react";

interface VehicleDetailsProps {
  onNext: (data: { vehicleAge: string; vehicleType: string; finance: string }) => void;
  onBack: () => void;
}

const AGE_OPTIONS = [
  { id: "0to2", label: "0\u20132", sub: "years" },
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

function estimateCostsLocal(vtype: string, fin: string, age: string) {
  const seg = vtype || "ute-4x2";
  const cpp = RACQ_CPK[seg] || RACQ_CPK["ute-4x2"];
  const totalKm = ABS_TOTAL_KM[seg] || 15000;
  const fMult = FIN_MULT[fin] || 1.0;
  const aMult = AGE_MULT[age] || 1.0;
  const annual = cpp * totalKm * fMult * aMult;
  return { annual: Math.round(annual), cpp, totalKm, fMult, aMult };
}

export default function VehicleDetails({ onNext, onBack }: VehicleDetailsProps) {
  const [vehicleAge, setVehicleAge] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [finance, setFinance] = useState<string | null>(null);

  const allSelected = vehicleAge && vehicleType && finance;

  let costPreview: { annual: number; tier: string; label: string; color: string; filled: number } | null = null;
  if (allSelected) {
    const costs = estimateCostsLocal(vehicleType, finance, vehicleAge);
    const annual = costs.annual;
    const tier = annual < 10000 ? "low" : annual < 16000 ? "medium" : "high";
    const tiers: Record<string, { label: string; color: string; filled: number }> = {
      low: { label: "Lower cost", color: "#38BDF8", filled: 1 },
      medium: { label: "Mid-range", color: "#F59E0B", filled: 2 },
      high: { label: "High cost", color: "#22C55E", filled: 3 },
    };
    costPreview = { annual, tier, ...tiers[tier] };
  }

  return (
    <div className="ob-screen entering" style={{ paddingTop: 44 }}>
      <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain", padding: "20px 22px 40px" }}>

        <div className="ob-a1" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button
              className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--wc-t3)" }}
              onClick={onBack}
              data-testid="button-back-q3"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-y)", textTransform: "uppercase", letterSpacing: ".08em" }}>3 of 3</span>
              <div className="ob-pbar" style={{ width: 80 }}>
                <div className="ob-pbar-fill" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
          <div className="font-display" style={{ fontSize: 34, lineHeight: 1, marginBottom: 6 }}>
            Tell us about<br />your <span style={{ color: "var(--wc-y)" }}>vehicle</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--wc-t3)" }}>3 quick questions — this sets your cost score</p>
        </div>

        <div className="ob-a2" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--wc-t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
            How old is your vehicle?
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {AGE_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className={`ob-sq-tile${vehicleAge === opt.id ? " selected" : ""}`}
                onClick={() => setVehicleAge(opt.id)}
                data-testid={`tile-age-${opt.id}`}
              >
                <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{opt.label}</div>
                <div style={{ fontSize: 9, color: "var(--wc-t3)", marginTop: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>{opt.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ob-a3" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--wc-t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
            Vehicle type
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {TYPE_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className={`ob-sq-tile${vehicleType === opt.id ? " selected" : ""}`}
                style={{ padding: "12px 10px", textAlign: "center" }}
                onClick={() => setVehicleType(opt.id)}
                data-testid={`tile-type-${opt.id}`}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>{opt.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{opt.label}</div>
                <div style={{ fontSize: 9, color: "var(--wc-t3)", marginTop: 2 }}>{opt.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ob-a4" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--wc-t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
            Is the vehicle financed or leased?
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {FINANCE_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className={`ob-sq-tile${finance === opt.id ? " selected" : ""}`}
                style={{ flex: 1, padding: "13px 10px", textAlign: "center" }}
                onClick={() => setFinance(opt.id)}
                data-testid={`tile-finance-${opt.id}`}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</div>
                <div style={{ fontSize: 9, color: "var(--wc-t3)", marginTop: 2 }}>{opt.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {costPreview && (
          <div
            style={{
              display: "flex",
              padding: "12px 14px",
              background: "rgba(245,196,0,.04)",
              border: "1px solid rgba(245,196,0,.14)",
              borderRadius: 14,
              marginBottom: 16,
              justifyContent: "space-between",
              alignItems: "center",
            }}
            data-testid="cost-score-preview"
          >
            <div style={{ fontSize: 11, color: "var(--wc-t2)" }}>Cost intensity score</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: i < costPreview!.filled ? costPreview!.color : "rgba(255,255,255,.1)",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 11, color: "var(--wc-t3)", fontWeight: 500 }}>
                ~${costPreview.annual.toLocaleString()}/yr
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: costPreview.color, marginLeft: 4 }}>
                {costPreview.label}
              </span>
            </div>
          </div>
        )}

        <div className="ob-a5">
          <button
            className="ob-btn ob-btn-y"
            disabled={!allSelected}
            style={{ opacity: allSelected ? 1 : 0.35, fontSize: 15 }}
            onClick={() => {
              if (allSelected) {
                onNext({ vehicleAge: vehicleAge!, vehicleType: vehicleType!, finance: finance! });
              }
            }}
            data-testid="button-see-recommendation"
          >
            See My Recommendation →
          </button>
        </div>
      </div>
    </div>
  );
}
