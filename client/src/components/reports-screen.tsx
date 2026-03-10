import { useState, Fragment, useMemo } from 'react';
import { useApp, getEstimatorParamsFromState } from '@/lib/app-context';
import { calcLogbookDeduction } from '@/lib/trip-data';
import { getVehicleCostsDetailed } from '@/lib/deduction-estimator';
import { BottomNav } from './bottom-nav';
import {
  ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Check,
  Archive, ShieldAlert, ArrowUpCircle, Link2, Trash2, Plus, Pause,
  Download, FileText, Calendar, List, BarChart2, Shield, Info,
  ChevronRight, XCircle, Clock, HelpCircle, Camera,
} from 'lucide-react';

const SESSION_LABELS: Record<string, string> = {
  batch1: 'Week 1 — 24\u201327 Feb',
  batch2: 'Week 2 — 28 Feb\u20132 Mar',
};

interface VehicleDetails {
  make: string;
  model: string;
  registration: string;
  engineCapacity: string;
  year: string;
}

let jsPDFLib: any = null;

async function loadJsPDF(): Promise<any> {
  if (jsPDFLib) return jsPDFLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      jsPDFLib = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
      resolve(jsPDFLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function InfoBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const borderColor = color === 'y' ? 'rgb(var(--wc-ink) / .2)' : color === 'gr' ? 'rgba(34,197,94,.15)' : color === 'am' ? 'rgba(153,153,153,.2)' : color === 're' ? 'rgba(239,68,68,.15)' : 'rgb(var(--wc-ink) / .07)';
  const titleColor = color === 'y' ? 'var(--wc-y)' : color === 'gr' ? 'var(--wc-gr)' : color === 'am' ? 'var(--wc-am)' : color === 're' ? '#EF4444' : 'var(--wc-text)';
  return (
    <div className="rounded-[12px] p-[14px_16px]" style={{ background: 'rgb(var(--wc-ink) / .02)', border: `1px solid ${borderColor}` }}>
      <div className="font-heading font-bold text-[14px] uppercase tracking-[.05em] mb-[6px]" style={{ color: titleColor }}>{title}</div>
      <div className="text-[13px] leading-[1.6]" style={{ color: 'var(--wc-text)' }}>{children}</div>
    </div>
  );
}

function TableRow({ label, val, highlight, tip }: { label: string; val: string; highlight?: boolean; tip?: string }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="flex flex-col py-[5px] relative" style={{ borderBottom: '1px solid rgb(var(--wc-ink) / .04)' }}>
      <div className="flex items-center gap-[6px]">
        <span className="text-[11px] mb-[2px]" style={{ color: 'var(--wc-t2)' }}>{label}</span>
        {tip && (
          <button
            className="w-[16px] h-[16px] rounded-full flex items-center justify-center flex-shrink-0 mb-[2px]"
            style={{ background: 'rgb(var(--wc-ink) / .08)', border: '1px solid rgb(var(--wc-ink) / .12)' }}
            onClick={() => setShowTip(!showTip)}
            data-testid={`tip-${label.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <HelpCircle className="w-[10px] h-[10px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        )}
      </div>
      <span className="text-[14px] font-data" style={{ color: highlight ? 'var(--wc-y)' : 'var(--wc-text)', fontWeight: highlight ? 700 : 400 }}>{val}</span>
      {showTip && tip && (
        <div className="mt-[4px] rounded-[8px] p-[8px_10px] text-[11px] leading-[1.5]" style={{ color: 'rgb(var(--wc-ink) / .8)', background: 'rgb(var(--wc-ink) / .08)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
          {tip}
        </div>
      )}
    </div>
  );
}

async function generatePDF(report: any, vehicle: VehicleDetails, vehicleCosts: number) {
  const JsPDF = await loadJsPDF();
  if (!JsPDF) { alert('Failed to load PDF library. Check your connection.'); return; }

  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297;
  const ML = 14, MR = 14, MT = 14;
  const CW = PW - ML - MR;
  let y = MT;

  const Y: [number, number, number] = [120, 120, 120];
  const GR: [number, number, number] = [26, 107, 58];
  const GY: [number, number, number] = [100, 100, 100];
  const BK: [number, number, number] = [17, 17, 17];
  const GG: [number, number, number] = [120, 120, 120];

  const allTrips = report.trips || [];
  const bizTrips = allTrips.filter((t: any) => t.type === 'business');
  const totalKm = allTrips.reduce((s: number, t: any) => s + t.km, 0);
  const bizKm = bizTrips.reduce((s: number, t: any) => s + t.km, 0);
  const bizPct = totalKm > 0 ? ((bizKm / totalKm) * 100).toFixed(2) : '0.00';
  const totalEst = calcLogbookDeduction(bizKm, totalKm, vehicleCosts);
  const generatedAt = new Date().toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  function addPage() {
    doc.addPage();
    y = MT;
    addFooter();
  }

  function checkY(needed: number) {
    if (y + needed > PH - 16) addPage();
  }

  function addFooter() {
    doc.setFontSize(7);
    doc.setTextColor(...GG);
    doc.text(`Trip Logbook \u00B7 ATO FY 2024\u20132025 \u00B7 Rev ${report.revision} \u00B7 Generated ${generatedAt}`, PW / 2, PH - 8, { align: 'center' });
    doc.setDrawColor(230, 230, 230);
    doc.line(ML, PH - 11, PW - MR, PH - 11);
  }

  function sectionTitle(title: string) {
    checkY(10);
    y += 3;
    doc.setFillColor(...Y);
    doc.rect(ML, y, CW, 0.7, 'F');
    y += 3;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BK);
    doc.text(title.toUpperCase(), ML, y);
    y += 5;
  }

  doc.setFillColor(...Y);
  doc.rect(ML, y, CW, 1.2, 'F');
  y += 4;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BK);
  doc.text('Trip Logbook', ML, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GG);
  doc.text('ATO Compliant Vehicle Logbook', ML, y + 11);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GR);
  doc.text(`ACTIVE REPORT \u00B7 REV ${report.revision}`, ML, y + 16);

  const rightX = PW - MR;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BK);
  doc.text('Motor Vehicle Logbook', rightX, y + 5, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GG);
  doc.text(`Generated: ${generatedAt}`, rightX, y + 10, { align: 'right' });
  doc.text('Financial Year: 2024\u20132025', rightX, y + 14.5, { align: 'right' });
  doc.setTextColor(...GY);
  doc.setFont('helvetica', 'bold');
  doc.text(`Audit Score: ${report.auditScore}%`, rightX, y + 19, { align: 'right' });

  y += 26;
  doc.setDrawColor(220, 220, 220);
  doc.line(ML, y, PW - MR, y);
  y += 6;

  sectionTitle('Vehicle & Logbook Details');

  const grid = [
    ['Car make and model', vehicle.make || '_______________', 'Car registration number', vehicle.registration || '_______________'],
    ['Engine capacity', vehicle.engineCapacity || '_______________', 'Year of manufacture', vehicle.year || '_______________'],
    ['Logbook start date', allTrips.length > 0 ? allTrips[allTrips.length - 1].date : '\u2014', 'Logbook end date', allTrips.length > 0 ? allTrips[0].date : '\u2014'],
    ['Odometer start (km)', report.odoRangeStart != null ? report.odoRangeStart.toLocaleString('en-AU') : '\u2014', 'Odometer end (km)', report.odoRangeEnd != null ? report.odoRangeEnd.toLocaleString('en-AU') : '\u2014'],
    ['Total kilometres', `${totalKm.toFixed(1)} km`, 'Percentage business km', `${bizPct}%`],
  ];

  const cellH = 9, col1W = CW / 2;
  doc.setDrawColor(220, 220, 220);
  grid.forEach((row, ri) => {
    const rowY = y + ri * cellH;
    checkY(cellH);
    doc.setFillColor(ri % 2 === 0 ? 252 : 248, ri % 2 === 0 ? 252 : 250, ri % 2 === 0 ? 252 : 248);
    doc.rect(ML, rowY, col1W, cellH, 'F');
    doc.rect(ML + col1W, rowY, col1W, cellH, 'F');
    doc.setDrawColor(225, 225, 225);
    doc.rect(ML, rowY, col1W, cellH, 'S');
    doc.rect(ML + col1W, rowY, col1W, cellH, 'S');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GG);
    doc.text(row[0], ML + 2, rowY + 3.5);
    doc.text(row[2], ML + col1W + 2, rowY + 3.5);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
    if (ri === 4) { doc.setTextColor(...GY); } else { doc.setTextColor(...BK); }
    doc.text(row[1], ML + 2, rowY + 7.5);
    if (ri === 4) { doc.setTextColor(...GY); } else { doc.setTextColor(...BK); }
    doc.text(row[3], ML + col1W + 2, rowY + 7.5);
  });
  y += grid.length * cellH + 4;

  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GG);
  doc.text(`ATO Logbook Method 2024\u20132025: Business ${bizPct}% \u00D7 vehicle costs    \u00B7    Est. deduction: $${totalEst.toFixed(2)}`, ML, y);
  y += 7;

  sectionTitle('Journey List');

  const cols = ['Date','ODO Start','ODO End','Type','Purpose','Notes','km','Biz $'];
  const colW = [20, 17, 17, 14, 28, 52, 14, 20];
  const hdrH = 6.5;
  const minRowH = 5.8;
  const lineH = 3.4;
  const topPad = 3;
  const notesIdx = 5;
  const purposeIdx = 4;
  const notesCW = colW[notesIdx] - 3;
  const purposeCW = colW[purposeIdx] - 3;

  function drawTableHeader() {
    doc.setFillColor(240, 240, 240);
    doc.rect(ML, y, CW, hdrH, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.rect(ML, y, CW, hdrH, 'S');
    let hx = ML;
    cols.forEach((h, i) => {
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GY);
      doc.text(h, hx + 1.5, y + 4.5);
      hx += colW[i];
    });
    y += hdrH;
  }

  function checkYTable(needed: number) {
    if (y + needed > PH - 16) {
      addPage();
      drawTableHeader();
    }
  }

  drawTableHeader();

  allTrips.forEach((t: any) => {
    const isBiz = t.type === 'business';
    const purposeStr = isBiz && t.purposeLabel ? t.purposeLabel : '\u2014';
    const noteStr = isBiz && t.notes ? t.notes : '\u2014';

    doc.setFontSize(6.5);
    const wrappedNotes = doc.splitTextToSize(String(noteStr), notesCW);
    const wrappedPurpose = doc.splitTextToSize(String(purposeStr), purposeCW);
    const maxLines = Math.max(wrappedNotes.length, wrappedPurpose.length, 1);
    const rowH = Math.max(minRowH, maxLines * lineH + topPad + 1);

    checkYTable(rowH);

    doc.setFillColor(isBiz ? 255 : 255, isBiz ? 253 : 255, isBiz ? 240 : 255);
    doc.rect(ML, y, CW, rowH, 'F');
    doc.setDrawColor(235, 235, 235);
    doc.rect(ML, y, CW, rowH, 'S');

    const cells = [
      t.date,
      t.odoStart?.toLocaleString('en-AU') ?? '\u2014',
      t.odoEnd?.toLocaleString('en-AU') ?? '\u2014',
      isBiz ? 'Business' : 'Personal',
      null,
      null,
      t.km.toFixed(1),
      isBiz ? t.km.toFixed(1) : '0',
    ];

    let cx2 = ML;
    cells.forEach((cell, ci) => {
      if (ci === notesIdx || ci === purposeIdx) {
        cx2 += colW[ci];
        return;
      }
      doc.setFontSize(6.5); doc.setFont('helvetica', ci === 3 && isBiz ? 'bold' : 'normal');
      if (ci === 3) {
        if (isBiz) doc.setTextColor(...GY);
        else doc.setTextColor(...GG);
      } else if (ci === 7 && isBiz) {
        doc.setTextColor(...GR);
      } else {
        doc.setTextColor(...BK);
      }
      doc.text(String(cell), cx2 + 1.5, y + topPad + 0.8);
      cx2 += colW[ci];
    });

    const purposeX = ML + colW.slice(0, purposeIdx).reduce((a, b) => a + b, 0) + 1.5;
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GY);
    wrappedPurpose.forEach((line: string, li: number) => {
      doc.text(line, purposeX, y + topPad + 0.8 + li * lineH);
    });

    const notesX = ML + colW.slice(0, notesIdx).reduce((a, b) => a + b, 0) + 1.5;
    doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...GG);
    wrappedNotes.forEach((line: string, li: number) => {
      doc.text(line, notesX, y + topPad + 0.8 + li * lineH);
    });

    y += rowH;
  });

  checkY(7);
  doc.setFillColor(240, 240, 240);
  doc.rect(ML, y, CW, 6.5, 'F');
  doc.setDrawColor(180, 180, 180);
  doc.rect(ML, y, CW, 6.5, 'S');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BK);
  doc.text('Totals', ML + 1.5, y + 4.5);
  const totKmX = ML + colW.slice(0, 6).reduce((a, b) => a + b, 0);
  doc.text(totalKm.toFixed(1), totKmX + 1.5, y + 4.5);
  doc.setTextColor(...GR);
  doc.text(`$${totalEst.toFixed(2)}`, totKmX + colW[6] + 1.5, y + 4.5);
  y += 10;

  sectionTitle('Audit Score & Compliance Notes');
  checkY(30);

  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GY);
  doc.text(`${report.auditScore}%`, ML, y + 7);
  const scoreW = doc.getTextWidth(`${report.auditScore}%`);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GG);
  doc.text('Pre-Audit Score', ML + scoreW + 3, y + 6);

  y += 10;
  (report.areasToCheck || ['All clear \u2014 looking good for ATO compliance']).forEach((a: string) => {
    checkY(5);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    if (a.startsWith('All clear')) {
      doc.setTextColor(...GR);
    } else {
      doc.setTextColor(160, 88, 0);
    }
    doc.text(`${a.startsWith('All clear') ? '\u2713' : '\u2022'}  ${a}`, ML + 2, y);
    y += 5;
  });

  y += 3;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...GG);
  const whyNot = 'This is an independent review of the information you have provided. It does not replace financial or institutional recommendations and does not guarantee compliance. The score is a weighted assessment of classification completeness (35%), odometer verification (30%), business use ratio vs industry benchmarks (24%), and photo evidence (10%). It aligns with the integrity of what the ATO requires for compliance documentation. 100% is intentionally unachievable \u2014 please seek certified financial advice if you require further assistance.';
  const lines = doc.splitTextToSize(whyNot, CW - 4);
  checkY(lines.length * 4 + 2);
  doc.text(lines, ML + 2, y);
  y += lines.length * 4 + 4;

  sectionTitle('Tax Information \u2014 Claiming Motor Vehicle Deductions');
  checkY(50);

  const taxBlocks = [
    ['Logbook Method', 'Claim the business-use % of all car expenses (fuel, rego, insurance, depreciation, loan interest, servicing). No km cap. Requires 12-week continuous logbook renewed every 5 years. Record odometer at start and end of every income year.'],
    ['Cents per Kilometre Method', `Claim $0.88/km (2024\u201325) up to 5,000 km/year without receipts. Cannot also claim fuel/depreciation separately. Note: This report uses the logbook method.`],
    ['Pro-rata (partial year)', `If you didn't hold the vehicle for the full income year, deductions are pro-rated by days held. Example: purchased 1 Jan 2025 (181 of 365 days), $8,000 expenses, 65% business use = $8,000 \u00D7 65% \u00D7 (181\u00F7365) = $2,579 deductible.`],
    ['Key ATO References', 'TR 2021/1 \u2014 Car expenses  \u00B7  PCG 2021/3 \u2014 Logbook record-keeping  \u00B7  s.25-10 ITAA 1997. Seek advice from a registered tax agent (RTA) or licensed accountant for edge cases.'],
  ];

  taxBlocks.forEach(([title, body]) => {
    checkY(18);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GY);
    doc.text(title, ML, y);
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...BK);
    const bodyLines = doc.splitTextToSize(body, CW - 4);
    doc.text(bodyLines, ML + 2, y);
    y += bodyLines.length * 4 + 3;
  });

  checkY(30);
  sectionTitle('Legal Disclaimer');

  doc.setFillColor(255, 248, 248);
  doc.setDrawColor(220, 180, 180);
  const discText = 'This report is produced as a vehicle logbook record-keeping tool only. It does not constitute financial, tax, or legal advice. The accuracy of all trip classifications, odometer readings, business purposes, and deduction amounts is the sole legal responsibility of the taxpayer. For advice specific to your circumstances \u2014 including pro-rata adjustments, depreciation schedules, and edge cases \u2014 consult a registered tax agent (RTA) or licensed accountant. False or inflated deduction claims are a serious offence under the Income Tax Assessment Act 1997 and may result in penalties, interest charges, or prosecution. This application does not warrant that this report satisfies all ATO record-keeping obligations. All data is user-provided.';
  const discLines = doc.splitTextToSize(discText, CW - 8);
  checkY(discLines.length * 4 + 10);
  doc.rect(ML, y - 2, CW, discLines.length * 4 + 8, 'FD');
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 60, 60);
  doc.text(discLines, ML + 4, y + 3);
  y += discLines.length * 4 + 12;

  addFooter();

  const filename = `logbook-rev${report.revision}-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
}

function exportCSV(report: any) {
  const allTrips = report.trips || [];
  const headers = [
    'Start Date','End Date','ODO Start (km)','ODO End (km)',
    'Business/Personal','Purpose','Notes','Total Distance (km)',
    'Business km (autofilled)','Reimbursement (autofilled)',
    'Verified','Photo Evidence'
  ];
  const rows = allTrips.map((t: any) => {
    const isBiz = t.type === 'business';
    return [
      t.date, t.date,
      t.odoStart ?? '', t.odoEnd ?? '',
      isBiz ? 'Business' : 'Personal',
      t.purposeLabel ?? '',
      t.notes ?? '',
      t.km.toFixed(1),
      isBiz ? t.km.toFixed(1) : '0',
      isBiz ? t.km.toFixed(1) : '0',
      t.verified ? 'Yes' : 'No',
      t.photo ? 'Yes' : 'No',
    ];
  });
  const csv = [headers, ...rows]
    .map(r => r.map((v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logbook-rev${report.revision}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function TwelveWeekTimeline({ savedReports }: { savedReports: any[] }) {
  const activeReports = savedReports.filter(r => !r.supersedes);

  function parseAUDate(dateStr: string): Date | null {
    const parts = dateStr?.split('/');
    if (!parts || parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }

  const allDates = activeReports.flatMap(r =>
    (r.trips || []).map((t: any) => parseAUDate(t.date)).filter(Boolean) as Date[]
  );
  const earliestTrip = allDates.length > 0
    ? new Date(Math.min(...allDates.map(d => d.getTime())))
    : new Date();
  const logbookEnd = new Date(earliestTrip);
  logbookEnd.setDate(logbookEnd.getDate() + 12 * 7 - 1);

  function fmtDateShort(d: Date) {
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  const weekStart = new Date(earliestTrip);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

  const weeks = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(weekStart);
    start.setDate(weekStart.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  });

  const today = new Date();

  function weekHasCoverage(wStart: Date, wEnd: Date) {
    return activeReports.some(r => {
      const dates = (r.trips || []).map((t: any) => parseAUDate(t.date)).filter(Boolean) as Date[];
      if (!dates.length) return false;
      const minD = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxD = new Date(Math.max(...dates.map(d => d.getTime())));
      return minD <= wEnd && maxD >= wStart;
    });
  }

  function weekCoverageFraction(wStart: Date, wEnd: Date): number {
    const coveredDays = new Set<string>();
    for (const r of activeReports) {
      const dates = (r.trips || []).map((t: any) => parseAUDate(t.date)).filter(Boolean) as Date[];
      for (const d of dates) {
        if (d >= wStart && d <= wEnd) {
          coveredDays.add(d.toDateString());
        }
      }
    }
    return coveredDays.size / 7;
  }

  const monthLabels: string[] = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const m = w.start.getMonth();
    if (m !== lastMonth) { monthLabels[i] = w.start.toLocaleString('en-AU', { month: 'short' }); lastMonth = m; }
    else monthLabels[i] = '';
  });

  return (
    <div className="rounded-[14px] p-[16px_18px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
      <div className="flex items-center justify-between mb-[14px]">
        <div className="flex items-center gap-[8px]">
          <BarChart2 className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[15px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-y)' }}>12-Week Coverage</span>
        </div>
        <span className="font-data text-[11px]" style={{ color: 'var(--wc-t2)' }}>Active reports only</span>
      </div>

      <div className="flex gap-[3px] mb-[4px]">
        {weeks.map((_, i) => (
          <div key={i} className="flex-1 font-data text-[10px] text-center" style={{ color: 'var(--wc-t3)' }}>
            {monthLabels[i]}
          </div>
        ))}
      </div>

      <div className="flex gap-[3px] mb-[5px]">
        {weeks.map((w, i) => {
          const fraction = weekCoverageFraction(w.start, w.end);
          const covered = fraction > 0;
          const isCurrent = today >= w.start && today <= w.end;
          const fillPct = Math.min(fraction * 100, 100);
          return (
            <div key={i} className="flex-1 rounded-[4px] overflow-hidden relative"
              style={{
                height: '32px',
                background: isCurrent && !covered ? 'rgb(var(--wc-ink) / .12)' : 'rgb(var(--wc-ink) / .05)',
                border: isCurrent ? '1.5px solid rgb(var(--wc-ink) / .35)' : 'none',
              }}>
              {covered && (
                <div className="absolute left-0 top-0 bottom-0 rounded-[4px]"
                  style={{
                    width: `${fillPct}%`,
                    background: 'var(--wc-y)',
                    boxShadow: '0 0 8px rgb(var(--wc-ink) / .2)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-[3px] mb-[10px]">
        {weeks.map((_, i) => (
          <div key={i} className="flex-1 font-data text-[9px] text-center" style={{ color: 'var(--wc-t3)' }}>W{i+1}</div>
        ))}
      </div>

      <div className="flex gap-[14px] flex-wrap">
        {[
          { label: 'Full week', custom: <div className="w-[12px] h-[12px] rounded-[3px]" style={{ background: 'var(--wc-y)' }} /> },
          { label: 'Partial', custom: <div className="w-[12px] h-[12px] rounded-[3px] overflow-hidden relative" style={{ background: 'rgb(var(--wc-ink) / .05)' }}><div className="absolute left-0 top-0 bottom-0" style={{ width: '50%', background: 'var(--wc-y)' }} /></div> },
          { label: 'This week', custom: <div className="w-[12px] h-[12px] rounded-[3px]" style={{ background: 'rgb(var(--wc-ink) / .12)', border: '1.5px solid rgb(var(--wc-ink) / .35)' }} /> },
          { label: 'No data', custom: <div className="w-[12px] h-[12px] rounded-[3px]" style={{ background: 'rgb(var(--wc-ink) / .05)' }} /> },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-[6px]">
            {l.custom}
            <span className="font-data text-[11px]" style={{ color: 'var(--wc-t2)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {activeReports.length > 0 && (
        <>
          <div className="mt-[14px] pt-[12px] flex gap-[16px]" style={{ borderTop: '1px solid var(--wc-border)' }}>
            <div className="flex-1">
              <div className="font-data text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t2)' }}>Start date</div>
              <div className="font-heading font-bold text-[16px]" style={{ color: 'var(--wc-y)' }}>{fmtDateShort(earliestTrip)}</div>
            </div>
            <div className="flex-1">
              <div className="font-data text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t2)' }}>End date</div>
              <div className="font-heading font-bold text-[16px]" style={{ color: 'var(--wc-y)' }}>{fmtDateShort(logbookEnd)}</div>
            </div>
          </div>
          <div className="mt-[8px] flex gap-[16px]">
            <div>
              <div className="font-data text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t2)' }}>Sessions saved</div>
              <div className="font-heading font-bold text-[22px]" style={{ color: 'var(--wc-y)' }}>{activeReports.length}</div>
            </div>
            <div>
              <div className="font-data text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t2)' }}>Weeks covered</div>
              <div className="font-heading font-bold text-[22px]" style={{ color: 'var(--wc-y)' }}>{weeks.filter(w => weekHasCoverage(w.start, w.end)).length}</div>
            </div>
            <div>
              <div className="font-data text-[10px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t2)' }}>Total biz km</div>
              <div className="font-heading font-bold text-[22px]" style={{ color: 'var(--wc-y)' }}>
                {activeReports.reduce((s, r) => s + (r.trips || []).filter((t: any) => t.type === 'business').reduce((ss: number, t: any) => ss + t.km, 0), 0).toFixed(0)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VehicleDetailsModal({
  initial,
  onConfirm,
  onClose,
}: {
  initial: VehicleDetails;
  onConfirm: (v: VehicleDetails) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<VehicleDetails>(initial);
  const update = (k: keyof VehicleDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const fields: { key: keyof VehicleDetails; label: string; placeholder: string }[] = [
    { key: 'make', label: 'Car make', placeholder: 'e.g. Toyota' },
    { key: 'model', label: 'Car model', placeholder: 'e.g. HiLux SR5' },
    { key: 'registration', label: 'Registration number', placeholder: 'e.g. ABC-123' },
    { key: 'engineCapacity', label: 'Engine capacity', placeholder: 'e.g. 2.8L' },
    { key: 'year', label: 'Year of manufacture', placeholder: 'e.g. 2022' },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center" style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full max-w-[390px] rounded-t-[20px] overflow-hidden" style={{ background: 'var(--wc-card)', border: '1.5px solid rgb(var(--wc-ink) / .25)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-[16px] py-[13px]" style={{ borderBottom: '1px solid var(--wc-border)' }}>
          <div className="flex items-center gap-[8px]">
            <FileText className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
            <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Vehicle Details</span>
          </div>
          <button onClick={onClose} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
            <XCircle className="w-[13px] h-[13px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        </div>

        <div className="p-[14px_16px] flex flex-col gap-[8px]">
          <p className="text-[10px] leading-[1.5]" style={{ color: 'var(--wc-t3)' }}>
            These details appear on your ATO logbook. Saved for this session — you can update before each export.
          </p>

          {fields.map(f => (
            <div key={f.key}>
              <div className="font-heading font-bold text-[10px] uppercase tracking-[.05em] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>{f.label}</div>
              <input
                className="w-full rounded-[8px] px-[10px] py-[8px] font-heading text-[13px] outline-none"
                style={{ color: 'var(--wc-text)', background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={update(f.key)}
                data-testid={`input-vehicle-${f.key}`}
              />
            </div>
          ))}

          <div className="flex gap-[8px] mt-[4px]">
            <button className="flex-1 rounded-[10px] py-[11px] font-heading font-extrabold text-[13px] uppercase tracking-[.05em] cursor-pointer"
              style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
              onClick={() => onConfirm(form)}
              data-testid="button-generate-pdf">
              Generate PDF
            </button>
            <button className="rounded-[10px] px-[14px] py-[11px] font-heading font-bold text-[12px] uppercase cursor-pointer"
              style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
              onClick={onClose}
              data-testid="button-cancel-vehicle">
              Cancel
            </button>
          </div>

          <p className="text-[8.5px] text-center" style={{ color: 'rgb(var(--wc-ink) / .18)' }}>
            Fields left blank will appear as lines on the PDF — fill in before giving to your accountant.
          </p>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ savedReports, exportLog }: { savedReports: any[]; exportLog: { ts: string; type: string; rev: number; dateStr?: string }[] }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = ['M','T','W','T','F','S','S'];
  const first = new Date(viewYear, viewMonth, 1).getDay();
  const off = first === 0 ? 6 : first - 1;
  const dim = new Date(viewYear, viewMonth + 1, 0).getDate();

  function parseAU(s: string): Date | null {
    const p = s?.split('/');
    if (!p || p.length !== 3) return null;
    return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  }

  const activeReports = savedReports.filter(r => !r.supersedes);
  const coverageRanges = activeReports.map((r, ri) => {
    const dates = (r.trips || []).map((t: any) => parseAU(t.date)).filter(Boolean) as Date[];
    if (!dates.length) return null;
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime()))),
      color: ri % 2 === 0 ? 'rgb(var(--wc-ink) / .18)' : 'rgba(34,197,94,.14)',
      borderColor: ri % 2 === 0 ? 'rgb(var(--wc-ink) / .45)' : 'rgba(34,197,94,.35)',
    };
  }).filter(Boolean);

  function toDateStr(day: number) {
    return `${String(day).padStart(2,'0')}/${String(viewMonth+1).padStart(2,'0')}/${viewYear}`;
  }

  function getDayData(day: number) {
    const dateStr = toDateStr(day);
    const d = new Date(viewYear, viewMonth, day);
    let biz = 0, per = 0;
    const inCoverage = coverageRanges.find(r => r && d >= r.start && d <= r.end);
    const isRangeStart = coverageRanges.find(r => r && d.toDateString() === r.start.toDateString());
    const isRangeEnd = coverageRanges.find(r => r && d.toDateString() === r.end.toDateString());

    activeReports.forEach(r => {
      (r.trips || []).forEach((t: any) => {
        if (t.date === dateStr) {
          if (t.type === 'business') biz++;
          else per++;
        }
      });
    });

    const hasExport = exportLog.some(e => e.dateStr === dateStr);

    return { biz, per, inCoverage, isRangeStart, isRangeEnd, hasExport };
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };
  const isToday = (d: number) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <div className="rounded-[12px] overflow-hidden" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
      <div className="flex items-center justify-between px-[14px] py-[10px]" style={{ borderBottom: '1px solid var(--wc-border)' }}>
        <button onClick={prevMonth} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .06)' }} data-testid="button-cal-prev">
          <ArrowLeft className="w-[12px] h-[12px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-bold text-[14px]" style={{ color: 'var(--wc-text)' }}>{fullMonths[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .06)' }} data-testid="button-cal-next">
          <ChevronRight className="w-[12px] h-[12px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
      </div>

      <div className="px-[8px] pt-[8px]">
        <div className="grid grid-cols-7 mb-[2px]">
          {days.map((d, i) => (
            <div key={i} className="font-data text-[9px] text-center py-[1px]" style={{ color: 'var(--wc-t3)' }}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: off }).map((_, i) => <div key={`e${i}`} className="h-[36px]" />)}
          {Array.from({ length: dim }).map((_, i) => {
            const day = i + 1;
            const { biz, per, inCoverage, isRangeStart, isRangeEnd, hasExport } = getDayData(day);
            const tod = isToday(day);
            const hasTrips = biz > 0 || per > 0;

            let cellBg = 'transparent';
            let borderRadius = '5px';
            let cellBorder = 'none';

            if (inCoverage) {
              cellBg = inCoverage.color;
              borderRadius = isRangeStart && isRangeEnd ? '6px'
                : isRangeStart ? '6px 0 0 6px'
                : isRangeEnd ? '0 6px 6px 0'
                : '0';
              if (isRangeStart || isRangeEnd) cellBorder = `1px solid ${inCoverage.borderColor}`;
            }
            if (tod) {
              cellBg = 'rgb(var(--wc-ink) / .2)';
              borderRadius = '6px';
              cellBorder = '1.5px solid rgb(var(--wc-ink) / .55)';
            }

            return (
              <div key={day}
                className="flex flex-col items-center pt-[3px] pb-[4px] relative"
                style={{ background: cellBg, borderRadius, border: cellBorder, minHeight: '36px' }}>

                {hasExport && (
                  <div className="absolute top-[2px] right-[2px] w-[7px] h-[7px] rounded-full flex items-center justify-center"
                    style={{ background: 'var(--wc-gr)' }}>
                    <Download style={{ width: '4px', height: '4px', color: '#fff' }} />
                  </div>
                )}

                <span className="font-heading font-semibold text-[10px] leading-none"
                  style={{ color: tod ? 'var(--wc-y)' : hasTrips ? 'var(--wc-t2)' : inCoverage ? 'rgb(var(--wc-ink) / .55)' : 'rgb(var(--wc-ink) / .2)' }}>
                  {day}
                </span>

                {hasTrips && (
                  <div className="flex gap-[2px] mt-[2px]">
                    {biz > 0 && <div className="w-[4px] h-[4px] rounded-full" style={{ background: 'var(--wc-y)', boxShadow: '0 0 3px rgb(var(--wc-ink) / .6)' }} />}
                    {per > 0 && <div className="w-[4px] h-[4px] rounded-full" style={{ background: 'rgb(var(--wc-ink) / .3)' }} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-[12px] py-[8px] mt-[4px] flex flex-wrap gap-x-[10px] gap-y-[4px]" style={{ borderTop: '1px solid var(--wc-border)' }}>
        {[
          { el: <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--wc-y)', boxShadow: '0 0 3px rgb(var(--wc-ink) / .5)' }} />, label: 'Business trip' },
          { el: <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'rgb(var(--wc-ink) / .3)' }} />, label: 'Personal trip' },
          { el: <div className="w-[14px] h-[8px] rounded-[2px]" style={{ background: 'rgb(var(--wc-ink) / .18)', border: '1px solid rgb(var(--wc-ink) / .45)' }} />, label: 'Report coverage' },
          { el: <div className="w-[7px] h-[7px] rounded-full flex items-center justify-center" style={{ background: 'var(--wc-gr)' }}><Download style={{ width: '4px', height: '4px', color: '#fff' }} /></div>, label: 'Exported' },
          { el: <div className="w-[10px] h-[10px] rounded-[3px]" style={{ background: 'rgb(var(--wc-ink) / .2)', border: '1.5px solid rgb(var(--wc-ink) / .55)' }} />, label: 'Today' },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-[4px]">
            {l.el}
            <span className="font-data text-[8px]" style={{ color: 'var(--wc-t3)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreAuditChecklist({ report, onClose }: { report: any; onClose: () => void }) {
  const [showOdoInfo, setShowOdoInfo] = useState(false);
  const allTrips = report.trips || [];
  const bizTrips = allTrips.filter((t: any) => t.type === 'business');
  const verified = bizTrips.filter((t: any) => t.verified).length;
  const withPurpose = bizTrips.filter((t: any) => t.purposeLabel).length;
  const withNotes = bizTrips.filter((t: any) => t.notes && t.notes.length > 0).length;
  const withPhoto = bizTrips.filter((t: any) => t.photo).length;
  const hasOdo = !!report.lastOdoReading;

  const checks = [
    { label: 'All trips sorted (business vs personal)', desc: `${allTrips.length} trips classified`, pass: allTrips.length > 0, required: true },
    { label: 'Business trip purposes labelled', desc: `${withPurpose} of ${bizTrips.length} have a purpose`, pass: withPurpose === bizTrips.length && bizTrips.length > 0, required: true },
    { label: 'Business trip notes added', desc: `${withNotes} of ${bizTrips.length} have notes (client/site details)`, pass: withNotes === bizTrips.length && bizTrips.length > 0, required: false },
    { label: 'Odometer reading recorded', desc: hasOdo ? `${report.lastOdoReading?.toLocaleString('en-AU')} km verified` : 'No odometer reading saved', pass: hasOdo, required: true },
    { label: 'Logbook covers a continuous period', desc: 'Trips are recorded as they occur in real-time', pass: true, required: true },
    { label: 'Odometer verified on business trips', desc: `${verified} of ${bizTrips.length} trips odometer-verified`, pass: verified === bizTrips.length && bizTrips.length > 0, required: false },
    { label: 'Photo evidence attached to trips', desc: `${withPhoto} of ${bizTrips.length} trips have photos`, pass: withPhoto > 0, required: false },
    { label: 'Vehicle details on file', desc: 'Make, model, registration — add in your tax return', pass: false, required: false },
  ];

  const passCount = checks.filter(c => c.pass).length;
  const requiredFails = checks.filter(c => c.required && !c.pass).length;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full max-w-[390px] rounded-t-[20px] overflow-hidden" style={{ background: 'var(--wc-card)', border: '1.5px solid rgb(var(--wc-ink) / .2)', maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-[16px] py-[13px]" style={{ borderBottom: '1px solid var(--wc-border)' }}>
          <div className="flex items-center gap-[8px]">
            <Shield className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
            <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Pre-Audit Checklist</span>
          </div>
          <button onClick={onClose} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .06)' }} data-testid="button-close-audit">
            <XCircle className="w-[13px] h-[13px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        </div>

        <div className="overflow-y-auto p-[12px_16px] flex flex-col gap-[8px]" style={{ maxHeight: 'calc(88vh - 58px)' }}>

          <div className="rounded-[10px] p-[10px_12px]" style={{ background: requiredFails > 0 ? 'rgba(153,153,153,.06)' : 'rgba(34,197,94,.05)', border: `1px solid ${requiredFails > 0 ? 'rgba(153,153,153,.25)' : 'rgba(34,197,94,.2)'}` }}>
            <div className="flex items-center justify-between mb-[5px]">
              <span className="font-heading font-bold text-[13px]" style={{ color: 'var(--wc-text)' }}>{passCount}/{checks.length} checks passed</span>
              <span className="font-heading font-bold text-[10px] px-[7px] py-[2px] rounded-[5px]"
                style={{ background: requiredFails > 0 ? 'rgba(153,153,153,.15)' : 'rgba(34,197,94,.12)', color: requiredFails > 0 ? 'var(--wc-am)' : 'var(--wc-gr)' }}>
                {requiredFails > 0 ? `${requiredFails} required issue${requiredFails > 1 ? 's' : ''}` : 'Ready to export'}
              </span>
            </div>
            <div className="h-[5px] rounded-full w-full" style={{ background: 'rgb(var(--wc-ink) / .08)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(passCount / checks.length) * 100}%`, background: requiredFails > 0 ? 'var(--wc-am)' : 'var(--wc-gr)' }} />
            </div>
          </div>

          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-[10px] rounded-[10px] p-[9px_12px]"
              style={{ background: c.pass ? 'rgba(34,197,94,.03)' : 'rgb(var(--wc-ink) / .02)', border: `1px solid ${c.pass ? 'rgba(34,197,94,.12)' : 'rgb(var(--wc-ink) / .06)'}` }}>
              <div className="w-[17px] h-[17px] rounded-full flex items-center justify-center flex-shrink-0 mt-[1px]"
                style={{ background: c.pass ? 'rgba(34,197,94,.15)' : 'rgb(var(--wc-ink) / .06)' }}>
                {c.pass
                  ? <Check className="w-[9px] h-[9px]" style={{ color: 'var(--wc-gr)' }} />
                  : <XCircle className="w-[9px] h-[9px]" style={{ color: c.required ? 'var(--wc-am)' : 'var(--wc-t3)' }} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-[5px] flex-wrap">
                  <span className="font-heading font-bold text-[11px]" style={{ color: 'var(--wc-text)' }}>{c.label}</span>
                  {c.required && !c.pass && (
                    <span className="font-data text-[7px] uppercase tracking-[.06em] px-[4px] py-[1px] rounded-[3px]" style={{ background: 'rgba(153,153,153,.15)', color: 'var(--wc-am)' }}>Required</span>
                  )}
                </div>
                <div className="flex items-center gap-[6px]">
                  <span className="text-[9px]" style={{ color: 'var(--wc-t3)' }}>{c.desc}</span>
                  {(c.label === 'Photo evidence attached to trips' || c.label === 'Odometer verified on business trips') && (
                    <button
                      className="font-heading font-bold text-[8px] uppercase tracking-[.05em] px-[6px] py-[2px] rounded-[4px] flex-shrink-0 cursor-pointer transition-all active:scale-95"
                      style={{ background: 'rgb(var(--wc-ink) / .1)', border: '1px solid rgb(var(--wc-ink) / .25)', color: 'var(--wc-y)' }}
                      onClick={() => setShowOdoInfo(true)}
                      data-testid="button-see-more-odo"
                    >
                      See More
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-[10px] p-[10px_12px]" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px solid rgb(var(--wc-ink) / .06)' }}>
            <div className="flex items-center gap-[5px] mb-[5px]">
              <HelpCircle className="w-[11px] h-[11px]" style={{ color: 'var(--wc-t3)' }} />
              <span className="font-heading font-bold text-[10px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-t2)' }}>Why isn't the Audit Score 100%?</span>
            </div>
            <p className="text-[9.5px] leading-[1.55]" style={{ color: 'var(--wc-t3)' }}>
              This is an independent review of the information you have provided. It <strong className="" style={{ color: 'var(--wc-text)' }}>does not replace</strong> financial or institutional recommendations and does not guarantee compliance. The score is a weighted assessment of classification (35%), odometer verification (30%), business use ratio vs industry benchmarks (24%), and photo evidence (10%). It aligns with the integrity of what the ATO requires for compliance documentation. Please seek certified financial advice if you require further assistance.
            </p>
          </div>

          <div className="rounded-[10px] p-[10px_12px] mb-[4px]" style={{ background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.1)' }}>
            <div className="flex items-start gap-[5px]">
              <AlertTriangle className="w-[11px] h-[11px] flex-shrink-0 mt-[1px]" style={{ color: 'rgba(239,68,68,.6)' }} />
              <p className="text-[9px] leading-[1.55]" style={{ color: 'rgba(239,68,68,.7)' }}>
                <strong style={{ color: 'rgba(239,68,68,.9)' }}>Legal responsibility.</strong> You are solely responsible for the accuracy of all claims. This application provides record-keeping tools only — not tax advice. For discretionary or edge-case deductions, seek advice from a <strong style={{ color: 'rgba(239,68,68,.9)' }}>registered tax agent (RTA)</strong> or licensed accountant. Refer to ATO TR 2021/1 and PCG 2021/3. False or inflated claims are a serious offence under the <em>Income Tax Assessment Act 1997</em>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showOdoInfo && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.88)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowOdoInfo(false)}
          data-testid="odo-info-overlay"
        >
          <div
            className="w-[360px] max-h-[80vh] rounded-[18px] overflow-hidden flex flex-col"
            style={{ background: 'var(--wc-card)', border: '1.5px solid rgb(var(--wc-ink) / .3)', boxShadow: '0 8px 40px rgba(0,0,0,.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-[16px] py-[14px] flex-shrink-0" style={{ borderBottom: '1px solid var(--wc-border)' }}>
              <div className="flex items-center gap-[8px]">
                <Shield className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
                <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Odometer Accuracy</span>
              </div>
              <button
                className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center"
                style={{ background: 'rgb(var(--wc-ink) / .06)' }}
                onClick={() => setShowOdoInfo(false)}
                data-testid="button-close-odo-info"
              >
                <XCircle className="w-[13px] h-[13px]" style={{ color: 'var(--wc-t3)' }} />
              </button>
            </div>

            <div className="overflow-y-auto p-[16px] flex flex-col gap-[14px]">
              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid rgb(var(--wc-ink) / .2)' }}>
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <Camera className="w-[14px] h-[14px]" style={{ color: 'var(--wc-y)' }} />
                  <span className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>About Photo Evidence</span>
                </div>
                <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--wc-text)' }}>
                  Photo evidence for all trips may not be achievable in practice. That's okay. What matters most is keeping <strong style={{ color: 'var(--wc-y)' }}>accurate and consistent odometer readings</strong> across all your trips, regardless of whether they are personal or business.
                </p>
              </div>

              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.15)' }}>
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <Check className="w-[14px] h-[14px]" style={{ color: 'var(--wc-gr)' }} />
                  <span className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-gr)' }}>Why Odometer Readings Matter</span>
                </div>
                <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--wc-text)' }}>
                  Accurate odometer records are essential for creating a compliant logbook under ATO guidelines. Your odometer readings establish the total kilometres driven and the business-use percentage that determines your deduction.
                </p>
              </div>

              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(153,153,153,.05)', border: '1px solid rgba(153,153,153,.15)' }}>
                <div className="flex items-center gap-[6px] mb-[8px]">
                  <Clock className="w-[14px] h-[14px]" style={{ color: 'var(--wc-am)' }} />
                  <span className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-am)' }}>Periodic Odometer Updates</span>
                </div>
                <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--wc-text)' }}>
                  We have created a feature where you can periodically check, update, and upload your most recent odometer reading to ensure the records we generate for you remain accurate to the information you provide.
                </p>
              </div>

              <div className="rounded-[12px] p-[14px]" style={{ background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.12)' }}>
                <div className="flex items-start gap-[6px]">
                  <AlertTriangle className="w-[13px] h-[13px] flex-shrink-0 mt-[2px]" style={{ color: 'rgba(239,68,68,.7)' }} />
                  <p className="text-[11px] leading-[1.55]" style={{ color: 'rgba(239,68,68,.8)' }}>
                    <strong style={{ color: 'rgba(239,68,68,.95)' }}>Your responsibility.</strong> This application is not liable for keeping odometer readings accurate. You must verify the readings for all trips you wish to disclose to the ATO to calculate your logbook deductions. Always ensure the information you provide is truthful and complete.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-[16px] py-[12px] flex-shrink-0" style={{ borderTop: '1px solid var(--wc-border)' }}>
              <button
                className="w-full rounded-[12px] py-[12px] font-heading font-extrabold text-[14px] tracking-[.05em] uppercase cursor-pointer transition-all active:scale-[.97]"
                style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)', boxShadow: '0 2px 12px rgb(var(--wc-ink) / .25)' }}
                onClick={() => setShowOdoInfo(false)}
                data-testid="button-got-it-odo"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaxInfoModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'rules' | 'prorata' | 'methods'>('rules');
  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: 'var(--wc-card)' }} onClick={onClose}>
      <div className="flex flex-col h-full w-full max-w-[390px] mx-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-[16px] py-[14px] flex-shrink-0" style={{ borderBottom: '1px solid var(--wc-border)' }}>
          <div className="flex items-center gap-[8px]">
            <Info className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
            <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Tax Information</span>
          </div>
          <button onClick={onClose} className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .06)' }} data-testid="button-close-tax-info">
            <XCircle className="w-[16px] h-[16px]" style={{ color: 'var(--wc-text)' }} />
          </button>
        </div>

        <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid var(--wc-border)' }}>
          {(['rules','prorata','methods'] as const).map(t => (
            <button key={t} className="flex-1 py-[12px] font-heading font-bold text-[14px] uppercase tracking-[.05em]"
              style={{ borderBottom: tab === t ? '3px solid var(--wc-y)' : '3px solid transparent', color: tab === t ? 'var(--wc-y)' : 'white', marginBottom: '-1px' }}
              onClick={() => setTab(t)}
              data-testid={`tab-${t}`}>
              {t === 'rules' ? 'Rules' : t === 'prorata' ? 'Pro-rata' : 'Methods'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-[16px] flex flex-col gap-[12px]">
          {tab === 'rules' && (<>
            <InfoBlock title="What's deductible?" color="y">
              Car expenses when you use your vehicle for work: travelling between job sites, visiting client locations, carrying tools too bulky to store elsewhere, or making work deliveries. <strong style={{ color: '#EF4444' }}>Home-to-work travel is not deductible</strong> unless you carry bulky equipment with no secure storage at work.
            </InfoBlock>
            <InfoBlock title="Logbook Method — Requirements" color="gr">
              <div className="flex flex-col gap-[3px]">
                {[
                  '12-week continuous logbook (renewed every 5 years)',
                  'Each entry: date, destination, km, business purpose',
                  'Odometer readings at start + end of every income year',
                  'Business use % = Business km \u00F7 Total km \u00D7 100',
                  'Claim that % of ALL actual car expenses',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-[5px]">
                    <span style={{ color: 'var(--wc-gr)' }}>\u00B7</span><span>{item}</span>
                  </div>
                ))}
              </div>
            </InfoBlock>
            <InfoBlock title="ATO References" color="t2">
              TR 2021/1 — Car expenses (primary ruling)<br />
              PCG 2021/3 — Logbook record-keeping<br />
              s.25-10 ITAA 1997 — Motor vehicle expenses
            </InfoBlock>
            <InfoBlock title="Always seek professional advice" color="am">
              This app calculates estimates using the logbook method (business use % &times; total vehicle running costs). Provide this report as logbook evidence to your registered tax agent or accountant for final deduction calculation.
            </InfoBlock>
          </>)}

          {tab === 'prorata' && (<>
            <InfoBlock title="When does pro-rata apply?" color="am">
              Pro-rata applies when you didn't hold the vehicle for the full income year (1 Jul – 30 Jun): purchased mid-year, sold mid-year, car written off, or used only part of the year.
            </InfoBlock>

            <div className="rounded-[12px]" style={{ border: '1px solid rgb(var(--wc-ink) / .2)' }}>
              <div className="px-[14px] py-[10px] rounded-t-[12px]" style={{ background: 'rgb(var(--wc-ink) / .07)', borderBottom: '1px solid rgb(var(--wc-ink) / .2)' }}>
                <span className="font-heading font-bold text-[14px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-y)' }}>Example — Mid-Year Purchase</span>
              </div>
              <div className="p-[14px_16px] flex flex-col gap-[3px] overflow-y-auto" style={{ maxHeight: '320px' }}>
                <TableRow label="Purchased" val="1 Jan 2025" tip="The date you bought or started using the car for work. This determines how many days you held the vehicle in the financial year." />
                <TableRow label="Days owned in FY2025" val="181 of 365 days" tip="The financial year runs 1 Jul to 30 Jun (365 days). You only owned the car from 1 Jan, so 181 days out of 365." />
                <TableRow label="Total car expenses" val="$8,000" tip="All your car running costs added up: fuel, rego, insurance, servicing, depreciation, loan interest, etc." />
                <TableRow label="Business use %" val="65%" highlight tip="The percentage of your total driving that was for work purposes, based on your logbook records." />
                <TableRow label="Pro-rata factor" val="181 \u00F7 365 = 0.496" tip="Because you only owned the car for part of the year, the ATO scales your claim down. 181 days divided by 365 = 0.496 (about half the year)." />
                <TableRow label="Deductible amount" val="$8,000 \u00D7 65% \u00D7 0.496 = $2,579" highlight tip="Your total expenses ($8,000) multiplied by your business use (65%) and then by the pro-rata factor (0.496) gives you the amount you can claim as a tax deduction." />
                <p className="text-[11px] mt-[6px]" style={{ color: 'var(--wc-text)' }}>* Simplified. Depreciation, fuel, insurance each have separate treatment. Consult a registered tax agent.</p>
              </div>
            </div>

            <div className="rounded-[12px]" style={{ border: '1px solid rgba(34,197,94,.15)' }}>
              <div className="px-[14px] py-[10px] rounded-t-[12px]" style={{ background: 'rgba(34,197,94,.05)', borderBottom: '1px solid rgba(34,197,94,.15)' }}>
                <span className="font-heading font-bold text-[14px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-gr)' }}>Example — Full Year Logbook Method</span>
              </div>
              <div className="p-[14px_16px] flex flex-col gap-[3px] overflow-y-auto" style={{ maxHeight: '320px' }}>
                <TableRow label="Total km driven (FY)" val="22,000 km" tip="The total kilometres you drove the car during the full financial year (1 Jul to 30 Jun), for all purposes combined." />
                <TableRow label="Business km (from logbook)" val="11,440 km" tip="The kilometres your 12-week logbook recorded as work-related trips. This sets your business use percentage." />
                <TableRow label="Business use %" val="52%" highlight tip="Business km divided by total km: 11,440 / 22,000 = 52%. This percentage applies to all your car expenses for the year." />
                <TableRow label="Total car expenses" val="$12,000" tip="All your car running costs for the year: fuel, rego, insurance, servicing, depreciation, loan interest, etc. You need receipts for all of these." />
                <TableRow label="Deductible amount" val="$12,000 \u00D7 52% = $6,240" highlight tip="Your total expenses ($12,000) multiplied by your business use percentage (52%) gives you the amount you can claim as a tax deduction." />
              </div>
            </div>
          </>)}

          {tab === 'methods' && (<>
            <InfoBlock title="Logbook Method" color="y">
              Best for high business use or expensive cars. Keep a 12-week logbook, then claim that % of ALL car costs — fuel, rego, insurance, depreciation, loan interest, servicing. No km cap. Receipts required. Valid 5 years.
            </InfoBlock>
            <InfoBlock title="Cents Per Kilometre" color="gr">
              No logbook needed. Claim $0.88/km (2024–25) up to 5,000 km/year. You must be able to explain how you estimated work-related km. Cannot also claim fuel, depreciation etc. separately.
            </InfoBlock>
            <div className="rounded-[12px]" style={{ border: '1px solid var(--wc-border)' }}>
              <div className="px-[14px] py-[10px] rounded-t-[12px]" style={{ background: 'rgb(var(--wc-ink) / .03)', borderBottom: '1px solid var(--wc-border)' }}>
                <span className="font-heading font-bold text-[14px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-text)' }}>Quick Comparison</span>
              </div>
              <table className="w-full font-data text-[12px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgb(var(--wc-ink) / .02)' }}>
                    <th className="p-[8px_12px] text-left" style={{ color: 'var(--wc-text)', borderBottom: '1px solid var(--wc-border)' }}> </th>
                    <th className="p-[8px_12px] text-center" style={{ color: 'var(--wc-y)', borderBottom: '1px solid var(--wc-border)' }}>Logbook</th>
                    <th className="p-[8px_12px] text-center" style={{ color: 'var(--wc-gr)', borderBottom: '1px solid var(--wc-border)' }}>c/km</th>
                  </tr>
                </thead>
                <tbody>
                  {[['Km cap','None','5,000 km'],['Logbook required','Yes','No'],['Receipts needed','Yes','No'],['Claim fuel/rego','Yes (% of total)','No'],['Best for','High use / costs','Simple / low use']].map(([l,lb,ck],i)=>(
                    <tr key={i} style={{ borderBottom: '1px solid rgb(var(--wc-ink) / .04)' }}>
                      <td className="p-[6px_12px]" style={{ color: 'var(--wc-text)' }}>{l}</td>
                      <td className="p-[6px_12px] text-center" style={{ color: 'var(--wc-y)' }}>{lb}</td>
                      <td className="p-[6px_12px] text-center" style={{ color: 'var(--wc-gr)' }}>{ck}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InfoBlock title="Not tax advice" color="re">
              The right method depends on your situation. A registered tax agent can calculate which approach maximises your deduction. This is general information only.
            </InfoBlock>
          </>)}
        </div>
      </div>
    </div>
  );
}

function ExportLogPanel({ log }: { log: { ts: string; type: string; rev: number }[] }) {
  if (!log.length) return (
    <div className="rounded-[10px] p-[10px_12px] text-center" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px dashed rgb(var(--wc-ink) / .08)' }}>
      <span className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>No exports yet this session</span>
    </div>
  );
  return (
    <div className="rounded-[12px] p-[10px_12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
      <div className="font-heading font-bold text-[10px] uppercase tracking-[.05em] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>Export Log</div>
      {log.slice(0, 10).map((e, i) => (
        <div key={i} className="flex items-center gap-[7px] py-[4px]" style={{ borderBottom: i < log.length - 1 ? '1px solid rgb(var(--wc-ink) / .04)' : 'none' }}>
          <Download className="w-[9px] h-[9px] flex-shrink-0" style={{ color: 'var(--wc-t3)' }} />
          <span className="font-data text-[8px] flex-1" style={{ color: 'var(--wc-t3)' }}>{e.ts}</span>
          <span className="font-heading font-bold text-[9px]" style={{ color: e.type === 'PDF' ? 'var(--wc-y)' : 'var(--wc-gr)' }}>{e.type} \u00B7 Rev {e.rev}</span>
        </div>
      ))}
    </div>
  );
}

export function ReportsScreen() {
  const { state, dispatch } = useApp();
  const [view, setView] = useState<'list' | 'calendar' | 'timeline'>('list');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [conflictSessionId, setConflictSessionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteSession, setConfirmDeleteSession] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [auditReport, setAuditReport] = useState<any | null>(null);
  const [taxInfoOpen, setTaxInfoOpen] = useState(false);
  const [exportLog, setExportLog] = useState<{ ts: string; type: string; rev: number; dateStr?: string }[]>([]);
  const [vehicleModal, setVehicleModal] = useState<{ report: any } | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({ make: '', model: '', registration: '', engineCapacity: '', year: '' });

  const hasBizTrips = state.bizCount > 0;
  const estimatorParams = useMemo(() => getEstimatorParamsFromState(state, hasBizTrips), [state, hasBizTrips]);
  const vehicleCosts = useMemo(
    () => getVehicleCostsDetailed({
      vehicleSpecs: estimatorParams.vehicleSpecs,
      vehiclePurchase: estimatorParams.vehiclePurchase,
      expenses: estimatorParams.expenses,
      settings: estimatorParams.settings,
    }).total,
    [estimatorParams]
  );

  const locked = !state.freshSession && state.savedReports.length > 0;
  const sessionIds = [...new Set(state.savedReports.map(r => r.sessionId))];
  const sessionGroups = sessionIds.map(sid => ({
    sessionId: sid,
    reports: state.savedReports.map((r, i) => ({ ...r, globalIdx: i })).filter(r => r.sessionId === sid),
  }));

  function handleExportPDF(report: any) {
    setVehicleModal({ report });
  }
  function handleVehicleConfirm(v: VehicleDetails) {
    if (!vehicleModal) return;
    setVehicleDetails(v);
    setVehicleModal(null);
    const r = vehicleModal.report;
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    generatePDF(r, v, vehicleCosts);
    setExportLog(l => [{ ts: today.toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), type: 'PDF', rev: r.revision, dateStr }, ...l]);
  }
  function handleExportCSV(report: any) {
    exportCSV(report);
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    setExportLog(l => [{ ts: today.toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), type: 'CSV', rev: report.revision, dateStr }, ...l]);
  }

  return (
    <div className="flex flex-col h-full" data-testid="reports-screen">
      <div className="flex items-center gap-[8px] px-4 pt-2 pb-[5px] flex-shrink-0">
        {!locked && (
          <button className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
            style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
            onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'sort' })} data-testid="button-back-reports">
            <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
          </button>
        )}
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Reports</span>
        <div className="ml-auto flex items-center gap-[6px]">
          <button className="flex items-center gap-[5px] rounded-[8px] px-[10px] py-[6px]"
            style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
            onClick={() => setTaxInfoOpen(true)}
            data-testid="button-tax-info">
            <Info className="w-[13px] h-[13px]" style={{ color: 'var(--wc-y)' }} />
            <span className="font-heading font-bold text-[12px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>Tax Info</span>
          </button>
          <span className="text-[11px]" style={{ color: 'var(--wc-t2)' }}>{state.savedReports.length} report{state.savedReports.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="flex gap-[4px] px-[14px] pb-[6px] flex-shrink-0">
        {([
          { id: 'list', label: 'List', Icon: List },
          { id: 'calendar', label: 'Calendar', Icon: Calendar },
          { id: 'timeline', label: '12-Week', Icon: BarChart2 },
        ] as const).map(({ id, label, Icon }) => (
          <button key={id}
            className="flex items-center gap-[4px] flex-1 justify-center rounded-[8px] py-[5px] font-heading font-bold uppercase tracking-[.04em] transition-all text-[18px]"
            style={{
              background: view === id ? 'rgb(var(--wc-ink) / .12)' : 'rgb(var(--wc-ink) / .03)',
              border: `1px solid ${view === id ? 'rgb(var(--wc-ink) / .35)' : 'var(--wc-border)'}`,
              color: view === id ? 'var(--wc-y)' : 'var(--wc-t3)',
            }}
            onClick={() => setView(id)}
            data-testid={`view-${id}`}>
            <Icon className="w-[10px] h-[10px]" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 px-[14px] flex flex-col gap-[10px] overflow-y-auto scrollbar-thin pb-2">

        {view === 'timeline' && (
          <>
            <TwelveWeekTimeline savedReports={state.savedReports} />
            <ExportLogPanel log={exportLog} />
          </>
        )}

        {view === 'calendar' && <CalendarView savedReports={state.savedReports} exportLog={exportLog} />}

        {view === 'list' && (
          state.savedReports.length === 0 ? (
            <div className="py-[30px] text-center text-[13px]" style={{ color: 'var(--wc-t2)' }}>
              No sessions saved yet.<br />Complete your first sort session to see reports here.
            </div>
          ) : (
            sessionGroups.map(group => {
              const isLinked = group.reports.length > 1;
              const hasActive = group.reports.some(r => !r.supersedes);
              const label = SESSION_LABELS[group.sessionId] || group.sessionId;

              return (
                <div key={group.sessionId}
                  className={isLinked ? 'rounded-[16px] p-[8px] flex flex-col gap-[6px]' : 'flex flex-col gap-[6px]'}
                  style={isLinked ? { border: '2px solid rgb(var(--wc-ink) / .4)', background: 'rgb(var(--wc-ink) / .03)' } : {}}
                  data-testid={`session-group-${group.sessionId}`}>

                  {isLinked && (
                    <div className="flex flex-col gap-[5px] px-[6px] pt-[2px] pb-[2px]">
                      <div className="flex items-center gap-[6px]">
                        <Link2 className="w-[11px] h-[11px]" style={{ color: 'var(--wc-y)' }} />
                        <span className="font-heading font-bold text-[9px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-y)' }}>Linked Reports</span>
                        <span className="font-data text-[8px]" style={{ color: 'var(--wc-text)' }}>{label}</span>
                      </div>
                      <button
                        className="flex items-center gap-[6px] rounded-[8px] p-[5px_8px] cursor-pointer text-left"
                        style={{ background: hasActive ? 'rgba(34,197,94,.06)' : 'rgba(153,153,153,.1)', border: `1px solid ${hasActive ? 'rgba(34,197,94,.2)' : 'rgba(153,153,153,.3)'}` }}
                        onClick={() => setConflictSessionId(group.sessionId)}
                        data-testid={`button-resolve-${group.sessionId}`}>
                        {hasActive
                          ? <><Check className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-gr)' }} /><span className="flex-1 text-[9px]"><span style={{ color: 'var(--wc-gr)' }}>Resolved</span> — tap to change active report</span></>
                          : <><ShieldAlert className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-am)' }} /><span className="flex-1 text-[9px]" style={{ color: 'var(--wc-am)' }}>Tap to select active report</span></>
                        }
                      </button>
                    </div>
                  )}

                  {group.reports.map(r => {
                    const i = r.globalIdx;
                    const isOpen = expandedIdx === i;
                    const allTrips = r.trips || [];
                    const bizTrips = allTrips.filter((t: any) => t.type === 'business');
                    const totalKm = allTrips.reduce((s: number, t: any) => s + t.km, 0);
                    const bizKm = bizTrips.reduce((s: number, t: any) => s + t.km, 0);
                    const bizPct = totalKm > 0 ? ((bizKm / totalKm) * 100).toFixed(2) : '0.00';
                    const totalEst = calcLogbookDeduction(bizKm, totalKm, vehicleCosts);

                    return (
                      <div key={i} className="rounded-[13px] overflow-hidden"
                        style={{
                          background: 'var(--wc-card)',
                          border: isLinked
                            ? `1.5px solid ${!r.supersedes ? 'rgba(34,197,94,.35)' : 'var(--wc-border)'}`
                            : `1px solid ${isOpen ? 'rgb(var(--wc-ink) / .25)' : 'var(--wc-border)'}`,
                          opacity: r.supersedes ? 0.62 : 1,
                        }}
                        data-testid={`report-${i}`}>

                        <button className="w-full p-[12px_14px] text-left cursor-pointer" style={{ background: 'transparent' }}
                          onClick={() => setExpandedIdx(isOpen ? null : i)} data-testid={`report-toggle-${i}`}>
                          <div className="flex items-start justify-between mb-[2px]">
                            <div className="flex items-center gap-[6px] flex-wrap">
                              <div className="font-data text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t2)' }}>{r.timestamp}</div>
                              {!r.supersedes && (
                                <span className="inline-flex items-center gap-[4px] font-heading font-bold text-[10px] uppercase tracking-[.05em] px-[8px] py-[3px] rounded-[6px]"
                                  style={{ background: 'rgba(34,197,94,.12)', border: '1.5px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}>
                                  <Check className="w-[11px] h-[11px]" />Active \u00B7 Rev {r.revision}
                                </span>
                              )}
                              {r.supersedes && isLinked && (
                                <span className="inline-flex items-center gap-[4px] font-heading font-bold text-[10px] uppercase tracking-[.05em] px-[8px] py-[3px] rounded-[6px] cursor-pointer"
                                  style={{ background: 'rgb(var(--wc-ink) / .15)', border: '1.5px solid rgb(var(--wc-ink) / .4)', color: 'var(--wc-y)' }}
                                  onClick={e => { e.stopPropagation(); dispatch({ type: 'PROMOTE_REPORT', reportIndex: i }); }}
                                  data-testid={`badge-make-active-${i}`}>
                                  <ArrowUpCircle className="w-[11px] h-[11px]" />Make Active
                                </span>
                              )}
                              {r.supersedes && !isLinked && (
                                <span className="inline-flex items-center gap-[3px] font-heading font-bold text-[8px] uppercase tracking-[.06em] px-[5px] py-[1px] rounded-[4px]"
                                  style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)', color: 'var(--wc-text)' }}>
                                  <Archive className="w-[8px] h-[8px]" />Archived
                                </span>
                              )}
                            </div>
                            {isOpen ? <ChevronUp className="w-[16px] h-[16px] mt-1 flex-shrink-0" style={{ color: 'var(--wc-text)' }} />
                              : <ChevronDown className="w-[16px] h-[16px] mt-1 flex-shrink-0" style={{ color: 'var(--wc-text)' }} />}
                          </div>
                          <div className="font-heading font-bold text-[15px] mb-[5px]" style={{ color: 'var(--wc-text)' }}>
                            {r.supersedes ? 'Archived' : 'Active'} Report — {r.bizCount + r.perCount} trips
                          </div>
                          <div className="flex gap-[8px] flex-wrap">
                            {[
                              { val: `${r.bizCount}`, label: 'biz', color: 'var(--wc-y)' },
                              { val: `${r.perCount}`, label: 'personal', color: 'var(--wc-text)' },
                              { val: r.est, label: 'est.', color: 'var(--wc-y)' },
                              { val: `${r.totalKm} km`, label: '', color: 'var(--wc-y)' },
                              { val: `${r.auditScore}%`, label: 'audit', color: 'var(--wc-y)' },
                            ].map((item, idx) => (
                              <span key={idx} className="text-[11px]" style={{ color: 'var(--wc-text)' }}>
                                <strong style={{ color: item.color }}>{item.val}</strong>{item.label ? ` ${item.label}` : ''}
                              </span>
                            ))}
                          </div>
                          {r.lastOdoVerifiedAt && (
                            <div className="mt-[4px] text-[11px]" style={{ color: 'var(--wc-t2)' }}>
                              Odo: <strong style={{ color: 'var(--wc-am)' }}>{r.lastOdoReading?.toLocaleString('en-AU')} km</strong>
                              <span className="" style={{ color: 'var(--wc-text)' }}> \u00B7 verified {r.lastOdoVerifiedAt}</span>
                            </div>
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-[14px] pb-[14px]" style={{ borderTop: '1px solid var(--wc-border)' }}>

                            {!r.supersedes && (
                              <div className="flex gap-[5px] mt-[10px] mb-[8px]">
                                <button className="flex-1 flex items-center justify-center gap-[5px] rounded-[9px] py-[9px] font-heading font-bold text-[11px] uppercase tracking-[.04em] cursor-pointer"
                                  style={{ background: 'rgb(var(--wc-ink) / .1)', border: '1.5px solid rgb(var(--wc-ink) / .3)', color: 'var(--wc-y)' }}
                                  onClick={() => handleExportPDF(r)}
                                  data-testid={`button-export-pdf-${i}`}>
                                  <FileText className="w-[12px] h-[12px]" />PDF
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-[5px] rounded-[9px] py-[9px] font-heading font-bold text-[11px] uppercase tracking-[.04em] cursor-pointer"
                                  style={{ background: 'rgba(34,197,94,.07)', border: '1.5px solid rgba(34,197,94,.22)', color: 'var(--wc-gr)' }}
                                  onClick={() => handleExportCSV(r)}
                                  data-testid={`button-export-csv-${i}`}>
                                  <Download className="w-[12px] h-[12px]" />CSV
                                </button>
                                <button className="flex items-center justify-center gap-[4px] rounded-[9px] px-[10px] py-[9px] font-heading font-bold text-[10px] uppercase tracking-[.04em] cursor-pointer"
                                  style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                                  onClick={() => setAuditReport(r)}
                                  data-testid={`button-audit-check-${i}`}>
                                  <Shield className="w-[11px] h-[11px]" />Check
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-[5px] mb-[8px] rounded-[7px] p-[6px_10px]"
                              style={{ background: state.sessionId === r.sessionId && state.trips.length > 0 ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .06)', border: '1px solid rgb(var(--wc-ink) / .08)' }}>
                              <Archive className="w-[11px] h-[11px] flex-shrink-0" style={{ color: state.sessionId === r.sessionId && state.trips.length > 0 ? 'var(--wc-bg)' : 'var(--wc-t3)' }} />
                              <span className="text-[9px] font-bold" style={{ color: state.sessionId === r.sessionId && state.trips.length > 0 ? 'var(--wc-bg)' : 'var(--wc-t3)' }}>
                                {state.sessionId === r.sessionId && state.trips.length > 0 ? 'Read-only snapshot. Go back to create a new report.' : 'Read-only. Sort cards deleted — data cannot be modified.'}
                              </span>
                            </div>

                            <div className="rounded-[8px] overflow-hidden mb-[10px]" style={{ border: '1px solid var(--wc-border)' }}>
                              <table className="w-full font-data text-[9px]" style={{ borderCollapse: 'collapse' }}>
                                <tbody>
                                  {[
                                    ['Logbook start', allTrips.length > 0 ? allTrips[allTrips.length - 1].date : '\u2014', 'Logbook end', allTrips.length > 0 ? allTrips[0].date : '\u2014'],
                                    ['Odo start', r.odoRangeStart != null ? r.odoRangeStart.toLocaleString('en-AU') + ' km' : '\u2014', 'Odo end', r.odoRangeEnd != null ? r.odoRangeEnd.toLocaleString('en-AU') + ' km' : '\u2014'],
                                    ['Total km', totalKm.toFixed(1), 'Business %', bizPct + '%'],
                                  ].map(([l1,v1,l2,v2], ri) => (
                                    <Fragment key={ri}>
                                      <tr style={{ borderBottom: '1px solid var(--wc-border)' }}>
                                        <td className="p-[4px_8px]" style={{ color: 'var(--wc-text)', width: '50%' }}>{l1}</td>
                                        <td className="p-[4px_8px]" style={{ color: 'var(--wc-text)' }}>{l2}</td>
                                      </tr>
                                      <tr style={{ borderBottom: ri < 2 ? '1px solid var(--wc-border)' : 'none' }}>
                                        <td className="p-[2px_8px_6px] font-bold" style={{ color: 'var(--wc-text)' }}>{v1}</td>
                                        <td className="p-[2px_8px_6px] font-bold" style={{ color: ri === 2 ? 'var(--wc-y)' : 'white' }}>{v2}</td>
                                      </tr>
                                    </Fragment>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="font-heading font-bold text-[10px] uppercase tracking-[.05em] mb-[5px]" style={{ color: 'var(--wc-y)' }}>Journey List</div>
                            <div className="rounded-[8px] overflow-x-auto mb-[10px]" style={{ border: '1px solid var(--wc-border)' }}>
                              <table className="w-full font-data text-[8px]" style={{ borderCollapse: 'collapse', minWidth: '420px' }}>
                                <thead>
                                  <tr style={{ background: 'rgb(var(--wc-ink) / .07)' }}>
                                    {['Date','ODO Start','ODO End','Type','km','Biz km','Est $'].map(h => (
                                      <th key={h} className="p-[4px_6px] text-left font-bold" style={{ color: 'var(--wc-y)', borderBottom: '1px solid var(--wc-border)' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allTrips.map((t: any, ti: number) => {
                                    const isBiz = t.type === 'business';
                                    return (
                                      <tr key={ti} style={{ borderBottom: ti < allTrips.length - 1 ? '1px solid rgb(var(--wc-ink) / .04)' : 'none', background: isBiz ? 'rgb(var(--wc-ink) / .025)' : 'transparent' }}>
                                        <td className="p-[3px_6px]" style={{ color: 'var(--wc-text)' }}>{t.date}</td>
                                        <td className="p-[3px_6px]" style={{ color: 'var(--wc-text)' }}>{t.odoStart?.toLocaleString('en-AU') ?? '\u2014'}</td>
                                        <td className="p-[3px_6px]" style={{ color: 'var(--wc-text)' }}>{t.odoEnd?.toLocaleString('en-AU') ?? '\u2014'}</td>
                                        <td className="p-[3px_6px]" style={{ color: isBiz ? 'var(--wc-y)' : '#fff' }}>{isBiz ? 'Biz' : 'Per'}</td>
                                        <td className="p-[3px_6px]" style={{ color: 'var(--wc-text)' }}>{t.km.toFixed(1)}</td>
                                        <td className="p-[3px_6px]" style={{ color: isBiz ? 'var(--wc-y)' : '#fff' }}>{isBiz ? t.km.toFixed(1) : ''}</td>
                                        <td className="p-[3px_6px]" style={{ color: isBiz ? 'var(--wc-gr)' : '#fff' }}>{isBiz ? `${t.km.toFixed(1)}` : '\u2014'}</td>
                                      </tr>
                                    );
                                  })}
                                  <tr style={{ borderTop: '1px solid var(--wc-border)', background: 'rgb(var(--wc-ink) / .06)' }}>
                                    <td colSpan={4} className="p-[4px_6px] font-bold" style={{ color: 'var(--wc-y)' }}>Totals</td>
                                    <td className="p-[4px_6px] font-bold" style={{ color: 'var(--wc-text)' }}>{totalKm.toFixed(1)}</td>
                                    <td className="p-[4px_6px] font-bold" style={{ color: 'var(--wc-y)' }}>{bizKm.toFixed(1)}</td>
                                    <td className="p-[4px_6px] font-bold" style={{ color: 'var(--wc-gr)' }}>${totalEst.toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {r.areasToCheck && r.areasToCheck.length > 0 && (
                              <div className="rounded-[10px] p-[9px_12px] mb-[8px]" style={{ background: 'rgba(153,153,153,.05)', border: '1px solid rgba(153,153,153,.14)' }}>
                                <div className="flex items-center gap-[5px] mb-[5px]">
                                  <AlertTriangle className="w-[11px] h-[11px]" style={{ color: 'var(--wc-am)' }} />
                                  <span className="font-heading font-bold text-[10px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-am)' }}>Compliance Notes</span>
                                </div>
                                {r.areasToCheck.map((a: string, ai: number) => (
                                  <div key={ai} className="flex items-start gap-[5px] mb-[2px]">
                                    <span style={{ color: a.startsWith('All clear') ? 'var(--wc-gr)' : 'var(--wc-am)' }}>
                                      {a.startsWith('All clear') ? '\u2713' : '\u00B7'}
                                    </span>
                                    <span className="text-[10px]" style={{ color: 'var(--wc-text)' }}>{a}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {r.auditLog && r.auditLog.length > 0 && (
                              <div className="mb-[8px]">
                                <div className="font-heading font-bold text-[9px] uppercase tracking-[.05em] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>Audit Log</div>
                                <div className="rounded-[8px] p-[6px_10px]" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px solid rgb(var(--wc-ink) / .04)' }}>
                                  {r.auditLog.slice(0, 8).map((e: any, ei: number) => (
                                    <div key={ei} className="flex items-start gap-[5px] py-[2px]" style={{ borderBottom: ei < 7 && ei < r.auditLog.length - 1 ? '1px solid rgb(var(--wc-ink) / .03)' : 'none' }}>
                                      <Clock className="w-[9px] h-[9px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--wc-text)' }} />
                                      <span className="font-data text-[8px] flex-shrink-0" style={{ color: 'var(--wc-text)' }}>{e.time}</span>
                                      <span className="text-[9px] flex-1" style={{ color: 'var(--wc-text)' }}>{e.desc}</span>
                                    </div>
                                  ))}
                                  {r.auditLog.length > 8 && <div className="text-[8px] mt-[3px]" style={{ color: 'var(--wc-t3)' }}>+{r.auditLog.length - 8} more entries</div>}
                                </div>
                              </div>
                            )}

                            {isLinked && r.supersedes && (
                              <button className="w-full rounded-[8px] py-[7px] mb-[8px] font-heading font-bold text-[11px] tracking-[.05em] uppercase cursor-pointer flex items-center justify-center gap-[5px]"
                                style={{ background: 'rgb(var(--wc-ink) / .07)', border: '1.5px solid rgb(var(--wc-ink) / .28)', color: 'var(--wc-y)' }}
                                onClick={() => dispatch({ type: 'PROMOTE_REPORT', reportIndex: i })}
                                data-testid={`button-promote-${i}`}>
                                <ArrowUpCircle className="w-[12px] h-[12px]" />
                                Make This the Active Report
                              </button>
                            )}

                            <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgb(var(--wc-ink) / .015)', border: '1px dashed rgb(var(--wc-ink) / .07)' }}>
                              <div className="flex items-center gap-[5px]">
                                <Plus className="w-[10px] h-[10px]" style={{ color: 'rgb(var(--wc-ink) / .2)' }} />
                                <span className="font-heading font-bold text-[9px] uppercase tracking-[.05em]" style={{ color: 'rgb(var(--wc-ink) / .2)' }}>Expense Claims — Coming Soon</span>
                              </div>
                              <p className="text-[8.5px] mt-[2px]" style={{ color: 'rgb(var(--wc-ink) / .12)' }}>Attach fuel receipts, tolls &amp; parking to this report period</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )
        )}
      </div>
      {locked ? (
        <div className="flex-shrink-0 px-[14px] py-[10px] flex flex-col gap-[8px]" style={{ background: 'var(--wc-nav-bg)', borderTop: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[-2px]" style={{ color: 'var(--wc-t3)' }}>Session Actions</div>
          <div className="relative">
            <button
              className="w-full rounded-[12px] py-[14px] px-[16px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase cursor-pointer transition-all flex items-center justify-between animate-flash-yellow"
              style={{ background: 'var(--wc-y)', border: '2px solid var(--wc-y)', color: 'var(--wc-bg)' }}
              onClick={() => setActionMenuOpen(!actionMenuOpen)} data-testid="button-action-menu">
              <span>Choose an action...</span>
              <ChevronDown className={`w-[18px] h-[18px] transition-transform ${actionMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--wc-bg)' }} />
            </button>

            {actionMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-[6px] rounded-[12px] overflow-hidden animate-pop"
                style={{ background: 'var(--wc-card)', border: '1.5px solid rgb(var(--wc-ink) / .3)', boxShadow: '0 -10px 40px rgba(0,0,0,.5)' }}
                data-testid="action-menu-dropdown">
                {[
                  { Icon: Plus, label: 'Create Another Report', desc: 'Re-sort trips and save a new revision', color: 'var(--wc-y)', bg: 'rgb(var(--wc-ink) / .1)', action: () => { setActionMenuOpen(false); dispatch({ type: 'GO_SCREEN', screen: 'review' }); } },
                  { Icon: Pause, label: 'Come Back Later', desc: 'Session stays active. No other cards sortable until finalised.', color: 'var(--wc-text)', bg: 'rgb(var(--wc-ink) / .04)', action: () => { setActionMenuOpen(false); dispatch({ type: 'COME_BACK_LATER' }); } },
                  { Icon: Trash2, label: 'Done — Delete Sort Cards', desc: 'Locks reports. No further revisions. Reports are kept.', color: 'var(--wc-text)', bg: 'var(--wc-card)', action: () => { setActionMenuOpen(false); setConfirmDelete(true); } },
                ].map(({ Icon, label, desc, color, bg, action }) => (
                  <button key={label} className="w-full p-[12px_14px] text-left cursor-pointer transition-all flex items-center gap-[10px]"
                    style={{ background: bg, borderBottom: '1px solid var(--wc-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = label === 'Done — Delete Sort Cards' ? 'rgb(var(--wc-ink) / .06)' : 'rgb(var(--wc-ink) / .09)')}
                    onMouseLeave={e => (e.currentTarget.style.background = bg)}
                    onClick={action}
                    data-testid={`action-${label.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                    <Icon className="w-[15px] h-[15px] flex-shrink-0" style={{ color: label === 'Done — Delete Sort Cards' ? 'var(--wc-text)' : color }} />
                    <div>
                      <div className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: label === 'Done — Delete Sort Cards' ? 'var(--wc-text)' : color }}>{label}</div>
                      <div className="text-[10px] mt-[1px]" style={{ color: label === 'Done — Delete Sort Cards' ? 'var(--wc-t2)' : 'var(--wc-text)' }}>{desc}</div>
                    </div>
                  </button>
                ))}

                <div className="p-[10px_14px_8px]">
                  <div className="flex items-center gap-[5px] mb-[5px]">
                    <Trash2 className="w-[11px] h-[11px]" style={{ color: '#EF4444' }} />
                    <span className="font-heading font-bold text-[10px] uppercase tracking-[.04em]" style={{ color: '#EF4444' }}>Delete a Session</span>
                  </div>
                  {sessionIds.map(sid => (
                    <button key={sid} className="w-full rounded-[7px] p-[7px_10px] mb-[4px] text-left cursor-pointer flex items-center gap-[7px]"
                      style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.14)' }}
                      onClick={() => { setActionMenuOpen(false); setConfirmDeleteSession(sid); }}
                      data-testid={`action-delete-session-${sid}`}>
                      <Trash2 className="w-[11px] h-[11px]" style={{ color: '#EF4444' }} />
                      <span className="font-heading font-bold text-[11px] uppercase" style={{ color: '#EF4444' }}>{SESSION_LABELS[sid] || sid}</span>
                    </button>
                  ))}
                  <div className="flex items-start gap-[4px]">
                    <AlertTriangle className="w-[9px] h-[9px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-am)' }} />
                    <span className="text-[8.5px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>Not recommended. Create a new revision and set it as active instead.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <BottomNav activeOverride="reports" />
      )}
      {auditReport && <PreAuditChecklist report={auditReport} onClose={() => setAuditReport(null)} />}
      {taxInfoOpen && <TaxInfoModal onClose={() => setTaxInfoOpen(false)} />}
      {vehicleModal && (
        <VehicleDetailsModal
          initial={vehicleDetails}
          onConfirm={handleVehicleConfirm}
          onClose={() => setVehicleModal(null)}
        />
      )}
      {conflictSessionId && (() => {
        const groupReports = state.savedReports.map((r, i) => ({ ...r, globalIdx: i })).filter(r => r.sessionId === conflictSessionId);
        if (groupReports.length < 2) return null;
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)' }} onClick={() => setConflictSessionId(null)}>
            <div className="mx-5 w-full max-w-[360px] rounded-[16px] p-[20px_16px] animate-pop" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(153,153,153,.35)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} onClick={e => e.stopPropagation()} data-testid="modal-conflict">
              <div className="flex flex-col items-center gap-[8px] mb-[14px]">
                <ShieldAlert className="w-[26px] h-[26px]" style={{ color: 'var(--wc-am)' }} />
                <div className="font-heading font-black text-[18px] uppercase text-center" style={{ color: 'var(--wc-text)' }}>Select Active Report</div>
                <div className="text-[11px] text-center" style={{ color: 'var(--wc-text)' }}>Only one report can be active for your ATO submission.</div>
              </div>
              <div className="flex flex-col gap-[8px] mb-[12px]">
                {groupReports.map(r => (
                  <div key={r.globalIdx} className="rounded-[10px] p-[10px_12px] cursor-pointer" style={{ background: !r.supersedes ? 'rgba(34,197,94,.06)' : 'rgb(var(--wc-ink) / .03)', border: `1.5px solid ${!r.supersedes ? 'rgba(34,197,94,.3)' : 'var(--wc-border)'}` }}
                    onClick={() => dispatch({ type: 'PROMOTE_REPORT', reportIndex: r.globalIdx })} data-testid={`conflict-select-${r.globalIdx}`}>
                    <div className="flex items-center gap-[6px] mb-[3px]">
                      <div className="w-[15px] h-[15px] rounded-full flex items-center justify-center" style={{ background: !r.supersedes ? 'var(--wc-gr)' : 'transparent', border: `2px solid ${!r.supersedes ? 'var(--wc-gr)' : 'var(--wc-border)'}` }}>
                        {!r.supersedes && <Check className="w-[9px] h-[9px]" style={{ color: 'var(--wc-bg)' }} />}
                      </div>
                      <span className="font-heading font-bold text-[13px]" style={{ color: 'var(--wc-text)' }}>Rev {r.revision}</span>
                      {!r.supersedes && <span className="font-heading font-bold text-[8px] px-[4px] py-[1px] rounded-[3px]" style={{ background: 'rgba(34,197,94,.15)', color: 'var(--wc-gr)' }}>Active</span>}
                    </div>
                    <div className="flex gap-[8px] flex-wrap text-[10px]" style={{ color: 'var(--wc-text)' }}>
                      <span><strong style={{ color: 'var(--wc-y)' }}>{r.bizCount}</strong> biz</span>
                      <span>Est. <strong style={{ color: 'var(--wc-y)' }}>{r.est}</strong></span>
                      <span><strong style={{ color: 'var(--wc-y)' }}>{r.totalKm}</strong> km</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full rounded-[11px] py-[11px] font-heading font-bold text-[14px] uppercase cursor-pointer" style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }} onClick={() => setConflictSessionId(null)} data-testid="button-conflict-done">Done</button>
            </div>
          </div>
        );
      })()}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDelete(false)}>
          <div className="mx-6 w-full max-w-[340px] rounded-[16px] p-[20px_18px] animate-pop" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(239,68,68,.35)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} onClick={e => e.stopPropagation()} data-testid="modal-delete-confirm">
            <div className="flex flex-col items-center gap-[10px] mb-[12px]">
              <Trash2 className="w-[26px] h-[26px]" style={{ color: '#EF4444' }} />
              <div className="font-heading font-black text-[18px] uppercase text-center" style={{ color: 'var(--wc-text)' }}>Delete All Sort Cards?</div>
            </div>
            <div className="flex items-start gap-[8px] rounded-[10px] p-[9px_12px] mb-[14px]" style={{ background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.18)' }}>
              <AlertTriangle className="w-[14px] h-[14px] flex-shrink-0 mt-[1px]" style={{ color: '#EF4444' }} />
              <span className="text-[11px] leading-[1.5]" style={{ color: 'rgba(239,68,68,.8)' }}><strong>This locks in your reports.</strong> No further revisions possible. Your saved reports are kept, but original sort cards are removed.</span>
            </div>
            <div className="flex flex-col gap-[8px]">
              <button className="w-full rounded-[11px] py-[11px] font-heading font-bold text-[14px] uppercase cursor-pointer"
                style={{ background: 'rgba(239,68,68,.15)', border: '1.5px solid rgba(239,68,68,.4)', color: '#EF4444' }}
                onClick={() => { dispatch({ type: 'DELETE_ALL_TRIPS' }); setConfirmDelete(false); dispatch({ type: 'GO_SCREEN', screen: 'sort' }); }}
                data-testid="button-confirm-delete-reports">Yes, Delete All Cards</button>
              <button className="w-full rounded-[11px] py-[10px] font-heading font-bold text-[13px] uppercase cursor-pointer"
                style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={() => setConfirmDelete(false)} data-testid="button-cancel-delete-reports">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteSession && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDeleteSession(null)}>
          <div className="mx-6 w-full max-w-[340px] rounded-[16px] p-[20px_18px] animate-pop" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(239,68,68,.35)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} onClick={e => e.stopPropagation()} data-testid="modal-delete-session">
            <div className="font-heading font-black text-[18px] uppercase text-center mb-[10px]" style={{ color: 'var(--wc-text)' }}>Delete {SESSION_LABELS[confirmDeleteSession] || confirmDeleteSession}?</div>
            <div className="flex items-start gap-[8px] rounded-[10px] p-[9px_12px] mb-[14px]" style={{ background: 'rgba(153,153,153,.06)', border: '1px solid rgba(153,153,153,.2)' }}>
              <AlertTriangle className="w-[14px] h-[14px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-am)' }} />
              <span className="text-[11px] leading-[1.5]">This deletes all saved reports for this session. Trip data reloads so you can re-sort anytime. <br /><br /><span style={{ color: 'var(--wc-t3)' }}>Recommended: create a new revision and set it as active instead.</span></span>
            </div>
            <div className="flex flex-col gap-[8px]">
              <button className="w-full rounded-[11px] py-[11px] font-heading font-bold text-[14px] uppercase cursor-pointer"
                style={{ background: 'rgba(239,68,68,.15)', border: '1.5px solid rgba(239,68,68,.4)', color: '#EF4444' }}
                onClick={() => { dispatch({ type: 'DELETE_SESSION', sessionId: confirmDeleteSession }); setConfirmDeleteSession(null); dispatch({ type: 'GO_SCREEN', screen: 'sort' }); }}
                data-testid="button-confirm-delete-session">Yes, Delete Session</button>
              <button className="w-full rounded-[11px] py-[10px] font-heading font-bold text-[13px] uppercase cursor-pointer"
                style={{ background: 'transparent', border: '1.5px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                onClick={() => setConfirmDeleteSession(null)} data-testid="button-cancel-delete-session">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
