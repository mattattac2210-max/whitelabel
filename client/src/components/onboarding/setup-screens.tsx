import { useState } from "react";

interface SetupScreenProps {
  onNext: (data?: any) => void;
  onBack: () => void;
  userData?: {
    trade?: string;
    kmBand?: string;
    recommendation?: string;
  };
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function CheckIcon({ size = 10, stroke = "var(--wc-y)", strokeWidth = 3 }: { size?: number; stroke?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#484848" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function SetupVehicleScreen({ onNext, onBack }: SetupScreenProps) {
  const [gpsTag, setGpsTag] = useState(true);
  const [formData, setFormData] = useState({
    businessName: "",
    make: "",
    model: "",
    year: "",
    engine: "",
    registration: "",
    odometer: "18402",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ padding: "16px 22px 40px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#484848", textTransform: "uppercase", letterSpacing: ".07em" }}>Vehicle Setup</div>
          <div className="flex flex-col items-end gap-1">
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-y)", textTransform: "uppercase", letterSpacing: ".08em" }}>Step 1 of 3</span>
            <div className="ob-pbar" style={{ width: 90 }}><div className="ob-pbar-fill" style={{ width: "33%" }} /></div>
          </div>
        </div>

        <div className="ob-a1">
          <div className="font-display" style={{ fontSize: 32, lineHeight: 1, marginBottom: 6 }}>Your <span style={{ color: "var(--wc-y)" }}>vehicle</span></div>
          <p style={{ fontSize: 11, color: "#484848", marginBottom: 22 }}>Required for ATO-compliant logbook records</p>
        </div>

        <div className="ob-a2 flex flex-col" style={{ gap: 12 }}>
          <div>
            <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 6 }}>Business / Company Name</label>
            <input
              data-testid="input-business-name"
              className="ob-inp"
              type="text"
              placeholder="Holding Company Pty Ltd"
              value={formData.businessName}
              onChange={(e) => updateField("businessName", e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 6 }}>Make</label>
              <input data-testid="input-make" className="ob-inp" type="text" placeholder="Toyota" value={formData.make} onChange={(e) => updateField("make", e.target.value)} />
            </div>
            <div>
              <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 6 }}>Model</label>
              <input data-testid="input-model" className="ob-inp" type="text" placeholder="HiLux SR5" value={formData.model} onChange={(e) => updateField("model", e.target.value)} />
            </div>
            <div>
              <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 6 }}>Year</label>
              <input data-testid="input-year" className="ob-inp" type="text" placeholder="2022" value={formData.year} onChange={(e) => updateField("year", e.target.value)} />
            </div>
            <div>
              <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 6 }}>Engine</label>
              <input data-testid="input-engine" className="ob-inp" type="text" placeholder="2.8L Diesel" value={formData.engine} onChange={(e) => updateField("engine", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 6 }}>Registration Plate</label>
            <input data-testid="input-registration" className="ob-inp" type="text" placeholder="ABC-123 (VIC)" value={formData.registration} onChange={(e) => updateField("registration", e.target.value)} />
          </div>

          <div>
            <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 6 }}>Odometer Reading (km)</label>
            <input
              data-testid="input-odometer"
              className="ob-inp font-data"
              type="number"
              style={{ fontSize: 20, fontWeight: 700 }}
              value={formData.odometer}
              onChange={(e) => updateField("odometer", e.target.value)}
            />
            <p style={{ fontSize: 9, color: "#484848", marginTop: 5 }}>Read directly from dashboard. Required for ATO.</p>
          </div>

          <div className="flex items-center justify-between" style={{ padding: "13px 14px", background: "#141414", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>GPS Key Tag</div>
              <div style={{ fontSize: 10, color: "#484848", marginTop: 2 }}>Auto-detects trips when you start driving</div>
            </div>
            <button
              data-testid="toggle-gps-tag"
              className={`ob-tog ${gpsTag ? "on" : ""}`}
              onClick={() => setGpsTag(!gpsTag)}
            />
          </div>
        </div>

        <button data-testid="button-setup-vehicle-next" className="ob-btn ob-btn-y ob-a3" style={{ marginTop: 22 }} onClick={() => onNext(formData)}>
          Next <span style={{ marginLeft: 4 }}>&rarr;</span>
        </button>
      </div>
    </div>
  );
}

export function SetupTaxScreen({ onNext, onBack, userData }: SetupScreenProps) {
  const kmBandOptions = [
    { id: "0to2k", label: "Under 2,000 km", desc: "Occasional work trips" },
    { id: "2kto5k", label: "2,000 \u2013 5,000 km", desc: "Regular job site travel" },
    { id: "5kto10k", label: "5,000 \u2013 10,000 km", desc: "Heavy work travel, multiple sites" },
    { id: "over10k", label: "Over 10,000 km", desc: "On the road most days" },
  ];

  const initialKmBand = userData?.kmBand && kmBandOptions.some(o => o.id === userData.kmBand)
    ? userData.kmBand
    : null;

  const [kmBand, setKmBand] = useState<string | null>(initialKmBand);
  const [method, setMethod] = useState<string>(
    userData?.recommendation === "cents" ? "cents" : "logbook"
  );

  const tradeLabel = userData?.trade
    ? userData.trade.charAt(0).toUpperCase() + userData.trade.slice(1).replace(/-/g, ' ')
    : "Construction";

  const showRecommendation = kmBand && (kmBand === "5kto10k" || kmBand === "over10k");

  const getDeductionEstimate = () => {
    if (method === "cents") {
      return { value: "~$4,400", note: "5,000 km \u00D7 $0.88 (ATO rate)" };
    }
    const weeklyKm = kmBand === "over10k" ? 250 : kmBand === "5kto10k" ? 155 : kmBand === "2kto5k" ? 70 : 20;
    const annual = weeklyKm * 48;
    const deduction = Math.round(annual * 0.88);
    return { value: `~$${deduction.toLocaleString()}`, note: `~${weeklyKm} km/wk \u00D7 48 wks \u00D7 $0.88` };
  };

  const est = getDeductionEstimate();

  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ padding: "16px 22px 40px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 22 }}>
          <button data-testid="button-setup-tax-back" className="inline-flex items-center gap-1 bg-transparent border-none cursor-pointer" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#484848" }} onClick={onBack}>
            <BackArrow />Back
          </button>
          <div className="flex flex-col items-end gap-1">
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-y)", textTransform: "uppercase", letterSpacing: ".08em" }}>Step 2 of 3</span>
            <div className="ob-pbar" style={{ width: 90 }}><div className="ob-pbar-fill" style={{ width: "66%" }} /></div>
          </div>
        </div>

        <div className="ob-a1">
          <div className="font-display" style={{ fontSize: 32, lineHeight: 1, marginBottom: 6 }}><span style={{ color: "var(--wc-y)" }}>Tax</span> settings</div>
          <p style={{ fontSize: 11, color: "#484848", marginBottom: 22 }}>Helps WorkCar calculate your best deduction</p>
        </div>

        <div className="ob-a2 flex flex-col" style={{ gap: 14 }}>
          <div>
            <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 6 }}>Business Type</label>
            <div className="flex items-center justify-between" style={{ padding: "13px 14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, cursor: "pointer" }}>
              <span data-testid="text-business-type" style={{ fontSize: 14 }}>{tradeLabel}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#484848" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848" }}>Annual Business KM</label>
              {initialKmBand && (
                <span style={{ fontSize: 9, color: 'var(--wc-y)', opacity: 0.7 }}>From your earlier answer</span>
              )}
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {kmBandOptions.map((opt) => (
                <div
                  key={opt.id}
                  data-testid={`radio-km-${opt.id}`}
                  className={`ob-ropt ${kmBand === opt.id ? "selected" : ""}`}
                  onClick={() => setKmBand(opt.id)}
                >
                  <div className="ob-rdot">
                    {kmBand === opt.id && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: kmBand === opt.id ? "#fff" : "#AAA" }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: "#484848", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showRecommendation && (
            <div data-testid="card-tax-recommendation" style={{ padding: "14px 16px", borderRadius: 14, border: "1.5px solid rgba(245,196,0,.3)", background: "rgba(245,196,0,.04)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 8, color: "var(--wc-y)" }}>We Recommend</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Logbook Method</div>
              <div style={{ fontSize: 11, lineHeight: 1.55, color: "#AAA" }}>Based on your km range, the logbook method maximises your deduction.</div>
              <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(245,196,0,.16)", background: "rgba(245,196,0,.04)" }}>
                <div style={{ fontSize: 10, color: "#484848", marginBottom: 4 }}>Your estimated difference</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontSize: 9, color: "#484848" }}>Cents per km</div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>$4,400/yr</div>
                  </div>
                  <div style={{ fontSize: 18, color: "#484848" }}>&rarr;</div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "#484848" }}>Logbook estimate</div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>$9,200/yr</div>
                  </div>
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 10, color: "#484848" }}>Potential extra over 5 years</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--wc-gr)" }}>$24,000</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 6 }}>Deduction Method</label>
            <div className="flex flex-col" style={{ gap: 8 }}>
              <div
                data-testid="radio-method-logbook"
                className={`ob-ropt ${method === "logbook" ? "selected" : ""}`}
                onClick={() => setMethod("logbook")}
              >
                <div className="ob-rdot">
                  {method === "logbook" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Logbook Method</div>
                  <div style={{ fontSize: 10, color: "#484848", marginTop: 2 }}>Claim % of all car expenses. Best when business km &gt; 5,000/yr.</div>
                </div>
              </div>
              <div
                data-testid="radio-method-cents"
                className={`ob-ropt ${method === "cents" ? "selected" : ""}`}
                onClick={() => setMethod("cents")}
              >
                <div className="ob-rdot">
                  {method === "cents" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: method === "cents" ? "#fff" : "#AAA" }}>Cents Per Kilometre</div>
                  <div style={{ fontSize: 10, color: "#484848", marginTop: 2 }}>$0.88/km up to 5,000 km. Simple. No receipts needed.</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "14px 16px", background: "rgba(245,196,0,.04)", border: "1px solid rgba(245,196,0,.16)", borderRadius: 14 }}>
            <div style={{ fontSize: 10, color: "#484848", marginBottom: 4 }}>Estimated annual deduction:</div>
            <div data-testid="text-deduction-value" className="font-display" style={{ fontSize: 32, color: "var(--wc-y)" }}>{est.value}</div>
            <div style={{ fontSize: 10, color: "#484848" }}>{est.note}</div>
          </div>
        </div>

        <button data-testid="button-setup-tax-next" className="ob-btn ob-btn-y ob-a3" style={{ marginTop: 22 }} onClick={() => onNext({ kmBand, method })}>
          Next <span style={{ marginLeft: 4 }}>&rarr;</span>
        </button>
      </div>
    </div>
  );
}

export function TrackingMethodScreen({ onNext, onBack }: SetupScreenProps) {
  const [motionDetection, setMotionDetection] = useState(true);
  const [gpsKeyTag, setGpsKeyTag] = useState(true);
  const [whenTrack, setWhenTrack] = useState("always");
  const [tripDefault, setTripDefault] = useState("match");

  const whenTrackOptions = [
    { id: "always", label: "Always", desc: "All days, all times" },
    { id: "workdays", label: "Work Days Only", desc: "Mon\u2013Fri, pauses weekends" },
    { id: "custom", label: "Set My Own Hours", desc: "Custom days and time windows" },
  ];

  const tripDefaultOptions = [
    { id: "match", label: "Match Previous Trip", desc: "Inherits last trip\u2019s business/personal tag" },
    { id: "business", label: "Always Business", desc: "Mark all trips business by default" },
    { id: "timebased", label: "Time-Based Rules", desc: "Auto-tag based on time of day" },
  ];

  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ padding: "16px 22px 40px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 22 }}>
          <button data-testid="button-tracking-back" className="inline-flex items-center gap-1 bg-transparent border-none cursor-pointer" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#484848" }} onClick={onBack}>
            <BackArrow />Back
          </button>
          <div className="flex flex-col items-end gap-1">
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--wc-y)", textTransform: "uppercase", letterSpacing: ".08em" }}>Step 2b of 3</span>
            <div className="ob-pbar" style={{ width: 90 }}><div className="ob-pbar-fill" style={{ width: "75%" }} /></div>
          </div>
        </div>

        <div className="ob-a1">
          <div className="font-display" style={{ fontSize: 32, lineHeight: 1, marginBottom: 6 }}><span style={{ color: "var(--wc-y)" }}>Tracking</span> setup</div>
          <p style={{ fontSize: 11, color: "#484848", marginBottom: 22 }}>How WorkCar detects your trips</p>
        </div>

        <div className="ob-a2 flex flex-col" style={{ gap: 12 }}>
          <div style={{ padding: "14px 16px", background: "#141414", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14 }}>
            <div className="flex items-center justify-between">
              <div style={{ flex: 1, paddingRight: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Motion Detection</div>
                <div style={{ fontSize: 11, color: "#484848", marginTop: 3, lineHeight: 1.5 }}>Auto-starts when phone detects driving speed</div>
              </div>
              <button data-testid="toggle-motion" className={`ob-tog ${motionDetection ? "on" : ""}`} onClick={() => setMotionDetection(!motionDetection)} />
            </div>
          </div>

          <div style={{ padding: "14px 16px", background: "#141414", border: "1px solid rgba(245,196,0,.25)", borderRadius: 14 }}>
            <div className="flex items-start gap-3" style={{ marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  GPS Key Tag{" "}
                  <span className="ob-chip ob-chip-y" style={{ marginLeft: 4 }}>Recommended</span>
                </div>
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 3, lineHeight: 1.5 }}>Bluetooth device in your car \u2014 most reliable, zero manual effort</div>
              </div>
              <button data-testid="toggle-gps-keytag" className={`ob-tog ${gpsKeyTag ? "on" : ""}`} onClick={() => setGpsKeyTag(!gpsKeyTag)} />
            </div>

            <div style={{ background: "rgba(245,196,0,.04)", border: "1px solid rgba(245,196,0,.14)", borderRadius: 8, padding: 14, textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,0,0,.3)", border: "1.5px solid rgba(245,196,0,.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 2v2M12 20v2" />
                </svg>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--wc-y)" }}>WorkCar GPS Key Tag</div>
              <div style={{ fontSize: 10, color: "#484848", marginTop: 3 }}>Clips to keys. Logbook starts when you get in.</div>
              <button data-testid="button-order-keytag" style={{ marginTop: 10, padding: "7px 16px", background: "rgba(245,196,0,.10)", border: "1px solid rgba(245,196,0,.25)", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "var(--wc-y)", cursor: "pointer", letterSpacing: ".05em", textTransform: "uppercase" }}>
                Order Key Tag &rarr;
              </button>
            </div>
          </div>

          <div>
            <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 10 }}>When to track</label>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {whenTrackOptions.map((opt) => (
                <div
                  key={opt.id}
                  data-testid={`radio-when-${opt.id}`}
                  className={`ob-ropt ${whenTrack === opt.id ? "selected" : ""}`}
                  onClick={() => setWhenTrack(opt.id)}
                >
                  <div className="ob-rdot">
                    {whenTrack === opt.id && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: whenTrack === opt.id ? "#fff" : "#AAA" }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: "#484848", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#484848", marginBottom: 10 }}>Default trip type</label>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {tripDefaultOptions.map((opt) => (
                <div
                  key={opt.id}
                  data-testid={`radio-trip-${opt.id}`}
                  className={`ob-ropt ${tripDefault === opt.id ? "selected" : ""}`}
                  onClick={() => setTripDefault(opt.id)}
                >
                  <div className="ob-rdot">
                    {tripDefault === opt.id && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: tripDefault === opt.id ? "#fff" : "#AAA" }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: "#484848", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button data-testid="button-tracking-next" className="ob-btn ob-btn-y ob-a3" style={{ marginTop: 22 }} onClick={() => onNext({ motionDetection, gpsKeyTag, whenTrack, tripDefault })}>
          Next <span style={{ marginLeft: 4 }}>&rarr;</span>
        </button>
      </div>
    </div>
  );
}

function FeatureCheck({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5" style={{ padding: "5px 0", fontSize: 13, color: "#AAA" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(245,196,0,.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <CheckIcon />
      </div>
      <span>{text}</span>
    </div>
  );
}

function MilestoneRow({ num, title, desc, color = "var(--wc-y)", bgColor = "rgba(245,196,0,.12)" }: { num: string; title: string; desc: string; color?: string; bgColor?: string }) {
  return (
    <div className="flex gap-2.5 items-start" style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
      <div className="font-display" style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, letterSpacing: ".06em", background: bgColor, color }}>
        {num}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: num === "12" ? color : "#fff" }}>{title}</div>
        <div style={{ fontSize: 10, color: "#484848" }}>{desc}</div>
      </div>
    </div>
  );
}

export function PlanSelectScreen({ onNext, onBack, userData }: SetupScreenProps) {
  const recommendation = userData?.recommendation || "logbook";

  const getPlanType = () => {
    if (recommendation === "cents") return "c1";
    if (recommendation === "logbook") return "c2";
    return "c3";
  };

  const planType = getPlanType();

  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ padding: "16px 20px 44px" }}>
        {planType === "c1" && (
          <>
            <div className="ob-a1" style={{ marginBottom: 20 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 16, fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", background: "rgba(56,189,248,.1)", color: "#38BDF8", border: "1px solid rgba(56,189,248,.22)", marginBottom: 10 }}>
                <CheckIcon size={10} stroke="currentColor" strokeWidth={2.5} />
                Cents-per-Km Method
              </div>
              <div className="font-display" style={{ fontSize: 30, lineHeight: 1, marginBottom: 6 }}>Simple.<br />No logbook needed.</div>
              <p style={{ fontSize: 12, color: "#484848" }}>Your business travel is under 5,000 km/yr. The cents-per-km method is your easiest path to a solid claim.</p>
            </div>

            <div className="ob-a2" style={{ padding: 16, background: "rgba(56,189,248,.05)", border: "1px solid rgba(56,189,248,.18)", borderRadius: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#38BDF8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Your maximum claim</div>
              <div className="font-display" style={{ fontSize: 36, color: "#38BDF8" }}>$4,400</div>
              <div style={{ fontSize: 11, color: "#484848", marginTop: 4 }}>5,000 km x $0.88 (2024\u201325 ATO rate)</div>
            </div>

            <div className="ob-a3" style={{ padding: 20, background: "#141414", border: "1px solid rgba(245,196,0,.3)", borderRadius: 14, boxShadow: "0 0 28px rgba(245,196,0,.07),inset 0 0 24px rgba(245,196,0,.02)", marginBottom: 12 }}>
              <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--wc-y)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Easy Track</div>
                  <div className="font-display" style={{ fontSize: 36, color: "var(--wc-y)" }}>Free</div>
                  <div style={{ fontSize: 11, color: "#484848" }}>1 month trial, then $19 once at tax time</div>
                </div>
                <button data-testid="button-start-free-c1" className="ob-btn ob-btn-y" style={{ width: "auto", padding: "12px 18px", fontSize: 12 }} onClick={() => onNext({ plan: "c1" })}>Start Free &rarr;</button>
              </div>
              <FeatureCheck text="GPS km counter \u2014 business vs personal" />
              <FeatureCheck text="Running cents-per-km tally" />
              <FeatureCheck text="Year-end one-page ATO summary \u2014 $19" />
              <FeatureCheck text="Accountant share link" />
            </div>

            <div className="ob-a4" style={{ padding: "12px 14px", background: "rgba(245,196,0,.04)", border: "1px solid rgba(245,196,0,.14)", borderRadius: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#AAA", lineHeight: 1.55 }}>
                <strong style={{ color: "var(--wc-y)" }}>Heads up:</strong> If you cross 5,000 km of business travel, the logbook method can add <strong style={{ color: "#fff" }}>$3,000\u2013$8,000</strong> more to your claim. WorkCar will tell you exactly when that crossover happens.
              </div>
            </div>

            <BoltsCard onNext={onNext} />
          </>
        )}

        {planType === "c2" && (
          <>
            <div className="ob-a1" style={{ marginBottom: 18 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 16, fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", background: "rgba(245,196,0,.10)", color: "var(--wc-y)", border: "1px solid rgba(245,196,0,.25)", marginBottom: 10 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--wc-y)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                12-Week Logbook Sprint
              </div>
              <div className="font-display" style={{ fontSize: 30, lineHeight: 1, marginBottom: 6 }}>Complete once.<br />Claim for <span style={{ color: "var(--wc-y)" }}>5 years.</span></div>
              <p style={{ fontSize: 12, color: "#484848" }}>12 continuous weeks is all the ATO requires. Do it once, lock in your deduction rate for five financial years.</p>
            </div>

            <div className="ob-a2" style={{ padding: "14px 16px", background: "#141414", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, marginBottom: 14 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#AAA", textTransform: "uppercase", letterSpacing: ".07em" }}>Your 12-Week Logbook</div>
                <div className="font-data" style={{ fontSize: 11, color: "var(--wc-y)" }}>Week 1 of 12</div>
              </div>
              <div className="flex gap-[3px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`ob-wpip ${i === 0 ? "now" : ""}`} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#484848", marginTop: 7, textAlign: "center" }}>Complete &rarr; <strong style={{ color: "#AAA" }}>5 years of deductions locked in</strong></div>
            </div>

            <div className="ob-a3" style={{ padding: 20, background: "#141414", border: "1px solid rgba(245,196,0,.3)", borderRadius: 14, boxShadow: "0 0 28px rgba(245,196,0,.07),inset 0 0 24px rgba(245,196,0,.02)", marginBottom: 12, position: "relative" }}>
              <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", background: "var(--wc-y)", borderRadius: 16, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#000", letterSpacing: ".07em", textTransform: "uppercase" }}>Kickstart</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <div className="flex items-start justify-between" style={{ marginBottom: 6 }}>
                  <div>
                    <div className="font-display" style={{ fontSize: 36, color: "var(--wc-y)" }}>$97</div>
                    <div style={{ fontSize: 11, color: "#484848" }}>One-time \u00B7 paid at Week 12</div>
                  </div>
                  <button data-testid="button-start-free-c2" className="ob-btn ob-btn-y" style={{ width: "auto", padding: "12px 18px", fontSize: 12 }} onClick={() => onNext({ plan: "c2" })}>Start Free &rarr;</button>
                </div>

                <div style={{ background: "rgba(245,196,0,.03)", border: "1px solid rgba(245,196,0,.1)", borderRadius: 8, padding: 12, margin: "12px 0" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--wc-y)", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 8 }}>Your Roadmap</div>
                  <MilestoneRow num="1" title="Auto-track every trip" desc="GPS logs start, end, km \u2014 no manual entry" />
                  <MilestoneRow num="4" title="Swipe to classify" desc="Business vs personal in one flick" />
                  <MilestoneRow num="8" title="Deduction estimate confirmed" desc="Live ATO calc shows your dollar-for-dollar claim" />
                  <MilestoneRow num="12" title="Logbook certified" desc="ATO PDF unlocked for $97 \u2014 valid 5 years" color="var(--wc-gr)" bgColor="rgba(34,197,94,.12)" />
                </div>

                <FeatureCheck text="Unlimited GPS-logged trips" />
                <FeatureCheck text="Swipe-to-classify" />
                <FeatureCheck text="Live ATO deduction estimates" />
                <FeatureCheck text="Expense tracking + receipts" />
                <FeatureCheck text="ATO PDF at Week 12 \u2014 $97 once" />
                <FeatureCheck text="Accountant share link" />
              </div>
            </div>

            <BoltsCard onNext={onNext} />
          </>
        )}

        {planType === "c3" && (
          <>
            <div className="ob-a1" style={{ marginBottom: 18 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 16, fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", background: "rgba(34,197,94,.1)", color: "var(--wc-gr)", border: "1px solid rgba(34,197,94,.2)", marginBottom: 10 }}>
                <CheckIcon size={10} stroke="currentColor" strokeWidth={2.5} />
                30-Day Discovery Trial
              </div>
              <div className="font-display" style={{ fontSize: 30, lineHeight: 1, marginBottom: 6 }}>We'll figure out<br />your <span style={{ color: "var(--wc-y)" }}>best claim</span><br />together.</div>
              <p style={{ fontSize: 12, color: "#484848" }}>You don't need to know your numbers yet. 30 days of free tracking and we'll tell you exactly which ATO method wins for you.</p>
            </div>

            <div className="ob-a2" style={{ padding: 20, background: "#141414", border: "1px solid rgba(245,196,0,.3)", borderRadius: 14, boxShadow: "0 0 28px rgba(245,196,0,.07),inset 0 0 24px rgba(245,196,0,.02)", marginBottom: 12 }}>
              <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--wc-gr)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Discovery Mode</div>
                  <div className="font-display" style={{ fontSize: 36, color: "var(--wc-gr)" }}>Free</div>
                  <div style={{ fontSize: 11, color: "#484848" }}>30-day trial \u2014 no card, no obligation</div>
                </div>
                <button data-testid="button-start-free-c3" className="ob-btn ob-btn-y" style={{ width: "auto", padding: "12px 18px", fontSize: 12 }} onClick={() => onNext({ plan: "c3" })}>Start Free &rarr;</button>
              </div>

              <div style={{ background: "rgba(34,197,94,.04)", border: "1px solid rgba(34,197,94,.14)", borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--wc-gr)", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 8 }}>What happens in 30 days</div>
                <MilestoneRow num="1" title="Auto-track all trips" desc="GPS runs silently in background" color="var(--wc-gr)" bgColor="rgba(34,197,94,.1)" />
                <MilestoneRow num="2" title="Classify as you go" desc="Swipe business or personal each trip" color="var(--wc-gr)" bgColor="rgba(34,197,94,.1)" />
                <MilestoneRow num="30" title="Your recommendation" desc="We tell you which method wins + exactly how much more you can claim" color="var(--wc-gr)" bgColor="rgba(34,197,94,.1)" />
              </div>

              <FeatureCheck text="GPS auto-tracking" />
              <FeatureCheck text="Swipe-to-classify" />
              <FeatureCheck text="Running deduction estimate" />
              <FeatureCheck text="Personalised method recommendation at Day 30" />

              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(56,189,248,.05)", borderRadius: 8, border: "1px solid rgba(56,189,248,.14)" }}>
                <div style={{ fontSize: 10, color: "#38BDF8", lineHeight: 1.55 }}>
                  At Day 30 you'll get a notification: <em style={{ color: "#fff" }}>"Based on your trips, the logbook method would get you $X,XXX more than cents-per-km."</em>
                </div>
              </div>
            </div>

            <BoltsCard onNext={onNext} />
          </>
        )}
      </div>
    </div>
  );
}

function BoltsCard({ onNext }: { onNext: (data?: any) => void }) {
  return (
    <div className="ob-a4">
      <div
        data-testid="card-bolts-referral"
        className="ob-gold-card"
        style={{ padding: "14px 16px", cursor: "pointer" }}
        onClick={() => onNext({ goToMatesRates: true })}
      >
        <div className="flex items-center gap-2.5" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(245,196,0,.1)", border: "1.5px solid rgba(245,196,0,.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--wc-y)" }}>Bolts</div>
            <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>Refer paying mates &rarr; earn Bolts &rarr; gift logbooks</div>
          </div>
          <ChevronRight />
        </div>
      </div>
    </div>
  );
}

function PersonDot({ type }: { type: "paying" | "free" | "empty" }) {
  if (type === "paying") {
    return (
      <div title="Paying customer \u2014 1 Bolt" style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(245,196,0,.15)", border: "1.5px solid rgba(245,196,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--wc-y)" stroke="none"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a4 4 0 018 0v2" /></svg>
      </div>
    );
  }
  if (type === "free") {
    return (
      <div title="Free Google signup \u2014 0.1 Bolts" style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(245,196,0,.05)", border: "1.5px solid rgba(245,196,0,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(245,196,0,.4)" stroke="none"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a4 4 0 018 0v2" /></svg>
      </div>
    );
  }
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.03)", border: "1.5px dashed rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(255,255,255,.15)" stroke="none"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a4 4 0 018 0v2" /></svg>
    </div>
  );
}

export function MotionPermScreen({ onNext, onBack }: SetupScreenProps) {
  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: "0 28px 40px" }}>
        <button data-testid="button-motion-back" className="absolute top-[56px] left-[22px] inline-flex items-center gap-1 bg-transparent border-none cursor-pointer" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#484848", zIndex: 2 }} onClick={onBack}>
          <BackArrow />Back
        </button>

        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(245,196,0,.07)", border: "1.5px solid rgba(245,196,0,.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, animation: "ob-glow 3s ease-in-out infinite" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        <div className="font-display text-center" style={{ fontSize: 30, lineHeight: 1.1, marginBottom: 8 }}>
          Motion &<br /><span style={{ color: "var(--wc-y)" }}>Fitness</span>
        </div>
        <p style={{ fontSize: 13, color: "#AAA", textAlign: "center", lineHeight: 1.6, maxWidth: 280, marginBottom: 24 }}>
          WorkCar uses motion sensors to detect when you're driving. This lets us auto-start trip logging without draining your battery.
        </p>

        <div style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#AAA", lineHeight: 1.6 }}>
            <strong style={{ color: "#fff" }}>Why we need this:</strong> Detects vehicle acceleration vs walking so we only log real trips.
          </div>
        </div>

        <button data-testid="button-allow-motion" className="ob-btn ob-btn-y" style={{ marginBottom: 10 }} onClick={() => onNext()}>
          Allow Motion Access
        </button>
        <button data-testid="button-skip-motion" className="ob-btn ob-btn-ghost" onClick={() => onNext()}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

export function LocationPermScreen({ onNext, onBack }: SetupScreenProps) {
  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: "0 28px 40px" }}>
        <button data-testid="button-location-back" className="absolute top-[56px] left-[22px] inline-flex items-center gap-1 bg-transparent border-none cursor-pointer" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#484848", zIndex: 2 }} onClick={onBack}>
          <BackArrow />Back
        </button>

        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(34,197,94,.07)", border: "1.5px solid rgba(34,197,94,.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, animation: "ob-glow 3s ease-in-out infinite" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--wc-gr)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>

        <div className="font-display text-center" style={{ fontSize: 30, lineHeight: 1.1, marginBottom: 8 }}>
          Location<br /><span style={{ color: "var(--wc-gr)" }}>Always</span>
        </div>
        <p style={{ fontSize: 13, color: "#AAA", textAlign: "center", lineHeight: 1.6, maxWidth: 280, marginBottom: 14 }}>
          To log trips in the background while you drive, WorkCar needs "Always" location access. We never sell or share your data.
        </p>

        <div style={{ width: "100%", padding: "14px 16px", background: "rgba(34,197,94,.04)", border: "1px solid rgba(34,197,94,.14)", borderRadius: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="flex items-start gap-2.5">
              <CheckIcon size={12} stroke="var(--wc-gr)" strokeWidth={2.5} />
              <span style={{ fontSize: 11, color: "#AAA" }}>Auto-logs trip start and end points</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckIcon size={12} stroke="var(--wc-gr)" strokeWidth={2.5} />
              <span style={{ fontSize: 11, color: "#AAA" }}>Measures distance accurately via GPS</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckIcon size={12} stroke="var(--wc-gr)" strokeWidth={2.5} />
              <span style={{ fontSize: 11, color: "#AAA" }}>Works in background without opening app</span>
            </div>
          </div>
        </div>

        <div style={{ width: "100%", padding: "10px 14px", background: "rgba(239,68,68,.04)", border: "1px solid rgba(239,68,68,.14)", borderRadius: 10, marginBottom: 20, textAlign: "center" }}>
          <span style={{ fontSize: 10, color: "var(--wc-t2)" }}>
            Select <strong style={{ color: "#fff" }}>"Allow Always"</strong> when prompted. "While Using" won't track background trips.
          </span>
        </div>

        <button data-testid="button-allow-location" className="ob-btn ob-btn-y" style={{ marginBottom: 10 }} onClick={() => onNext()}>
          Allow Location Access
        </button>
        <button data-testid="button-skip-location" className="ob-btn ob-btn-ghost" onClick={() => onNext()}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

export function AllSetScreen({ onNext, onBack }: SetupScreenProps) {
  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 120% 50% at 50% -5%, rgba(245,196,0,.12) 0%, transparent 55%), var(--wc-bg)',
        }}
      />
      <div className="relative z-[1] flex-1 flex flex-col items-center justify-center" style={{ padding: "0 28px 40px" }}>

        <div className="ob-glow" style={{ width: 96, height: 96, borderRadius: 30, background: "rgba(34,197,94,.07)", border: "1.5px solid rgba(34,197,94,.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--wc-gr)" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="font-display text-center" style={{ fontSize: 34, lineHeight: 1, marginBottom: 8 }}>
          WORK<span style={{ color: "var(--wc-y)" }}>CAR</span><br />
          <span style={{ fontSize: 28, color: "var(--wc-gr)" }}>is live!</span>
        </div>
        <p style={{ fontSize: 13, color: "#AAA", textAlign: "center", lineHeight: 1.6, maxWidth: 280, marginBottom: 24 }}>
          Everything is set up. Your logbook is recording. Just drive and we'll handle the rest.
        </p>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {[
            { icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z", text: "GPS tracking active", color: "var(--wc-gr)" },
            { icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", text: "Motion detection on", color: "var(--wc-y)" },
            { icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", text: "12-week logbook started", color: "var(--wc-y)" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3" style={{ padding: "12px 14px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}12`, border: `1px solid ${item.color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="1.8" strokeLinecap="round">
                  <path d={item.icon} />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{item.text}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--wc-gr)" strokeWidth="3" strokeLinecap="round" style={{ marginLeft: "auto" }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ))}
        </div>

        <button data-testid="button-all-set-continue" className="ob-btn ob-btn-y" onClick={() => onNext()}>
          Choose Your Plan &rarr;
        </button>
      </div>
    </div>
  );
}

export function MatesRatesScreen({ onNext, onBack }: SetupScreenProps) {
  return (
    <div style={{ paddingTop: 44 }} className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ padding: 0 }}>
        <div className="ob-gold-card" style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", padding: "24px 22px 20px", textAlign: "center" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <button data-testid="button-mates-back" className="inline-flex items-center gap-1 bg-transparent border-none cursor-pointer" style={{ position: "absolute", top: 0, left: 0, fontSize: 11, fontWeight: 700, color: "#AAA" }} onClick={onBack}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(245,196,0,.1)", border: "1.5px solid rgba(245,196,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", animation: "ob-glow 3s ease-in-out infinite" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            </div>
            <div className="font-display" style={{ fontSize: 30, marginBottom: 6 }}>Bolts</div>
            <p style={{ fontSize: 13, color: "#AAA", lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>Refer your mates. Earn Bolts. Hit 10 and you can gift a logbook or get your whole crew sorted at half price.</p>
          </div>
        </div>

        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 16, background: "#141414", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#AAA", textTransform: "uppercase", letterSpacing: ".07em" }}>Your Bolts</div>
              <div className="flex items-baseline gap-1">
                <div className="font-display" style={{ fontSize: 28, color: "var(--wc-y)", lineHeight: 1 }}>5.3</div>
                <div style={{ fontSize: 11, color: "#484848" }}>/ 10</div>
              </div>
            </div>

            <div style={{ height: 6, background: "rgba(255,255,255,.07)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: "53%", background: "linear-gradient(90deg,var(--wc-y),#D4A800)", borderRadius: 3, transition: "width .5s" }} />
            </div>

            <div className="flex flex-wrap gap-[5px]" style={{ marginBottom: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => <PersonDot key={`p${i}`} type="paying" />)}
              {Array.from({ length: 3 }).map((_, i) => <PersonDot key={`f${i}`} type="free" />)}
              {Array.from({ length: 2 }).map((_, i) => <PersonDot key={`e${i}`} type="empty" />)}
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--wc-y)" }} />
                <div style={{ fontSize: 9, color: "#484848" }}>Paying customer = 1 Bolt</div>
              </div>
              <div className="flex items-center gap-1">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(245,196,0,.35)" }} />
                <div style={{ fontSize: 9, color: "#484848" }}>Google signup = 0.1 Bolt</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: "#484848", textTransform: "uppercase", letterSpacing: ".08em" }}>Unlock at 10 Bolts \u2014 choose one</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: "14px 12px", background: "rgba(245,196,0,.05)", border: "1.5px solid rgba(245,196,0,.2)", borderRadius: 14, textAlign: "center", opacity: 0.55 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245,196,0,.1)", border: "1.5px solid rgba(245,196,0,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M20 12v10H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                </svg>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Gift a Logbook</div>
              <div style={{ fontSize: 9, color: "#484848", lineHeight: 1.4 }}>Nominate any person. They get the full 12-week logbook free. Worth $97.</div>
              <div style={{ marginTop: 8, padding: "4px 8px", background: "rgba(245,196,0,.08)", borderRadius: 4, display: "inline-block" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--wc-y)" }}>4.7 Bolts to go</div>
              </div>
            </div>

            <div style={{ padding: "14px 12px", background: "rgba(245,196,0,.05)", border: "1.5px solid rgba(245,196,0,.2)", borderRadius: 14, textAlign: "center", opacity: 0.55 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245,196,0,.1)", border: "1.5px solid rgba(245,196,0,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--wc-y)" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Crew Half-Price</div>
              <div style={{ fontSize: 9, color: "#484848", lineHeight: 1.4 }}>Up to 4 crew get the logbook for $48.50 each. They sign up, you share the code.</div>
              <div style={{ marginTop: 8, padding: "4px 8px", background: "rgba(245,196,0,.08)", borderRadius: 4, display: "inline-block" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--wc-y)" }}>4.7 Bolts to go</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "14px 16px", background: "#141414", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 12, color: "#fff" }}>How Bolts work</div>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {[
                { num: "1", title: "Share your link", desc: "Mate signs in with Google \u2192 you earn 0.1 Bolt immediately" },
                { num: "2", title: "They become a paying customer", desc: "Pays for any WorkCar product \u2192 you earn 1 full Bolt. Bolts reset after you redeem." },
                { num: "3", title: "Hit 10 \u2192 choose your reward", desc: "Gift one full logbook, or unlock half-price for up to 4 crew. More rewards coming." },
              ].map((step) => (
                <div key={step.num} className="flex gap-3 items-start">
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(245,196,0,.12)", border: "1px solid rgba(245,196,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "var(--wc-y)" }}>{step.num}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{step.title}</div>
                    <div style={{ fontSize: 10, color: "#484848", marginTop: 2 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "10px 14px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#484848", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".08em" }}>Your invite link</div>
            <div className="flex items-center gap-2">
              <div data-testid="text-referral-link" className="font-data" style={{ flex: 1, fontSize: 12, color: "#fff" }}>workcar.com/?ref=7T5kT9</div>
              <button data-testid="button-copy-link" style={{ padding: "6px 12px", background: "rgba(245,196,0,.10)", border: "1px solid rgba(245,196,0,.25)", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "var(--wc-y)", cursor: "pointer", letterSpacing: ".04em" }}>COPY</button>
            </div>
          </div>

          <button data-testid="button-invite-mates" className="ob-btn ob-btn-y" style={{ background: "linear-gradient(135deg,#F5C400,#D4A800)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            Invite Mates
          </button>

          <button data-testid="button-continue-workcar" className="ob-btn ob-btn-ghost" onClick={() => onNext()}>
            Continue to WorkCar &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
