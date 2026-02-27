import { useState, Fragment } from 'react';
import { useApp } from '@/lib/app-context';
import { RATE } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import {
  ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Check,
  Archive, ShieldAlert, ArrowUpCircle, Link2, Trash2, Plus, Pause,
  Download, FileText, Calendar, List, BarChart2, Shield, Info,
  ChevronRight, XCircle, Clock, HelpCircle,
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
  const borderColor = color === 'y' ? 'rgba(245,196,0,.2)' : color === 'gr' ? 'rgba(34,197,94,.15)' : color === 'am' ? 'rgba(245,158,11,.2)' : color === 're' ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.07)';
  const titleColor = color === 'y' ? 'var(--wc-y)' : color === 'gr' ? 'var(--wc-gr)' : color === 'am' ? 'var(--wc-am)' : color === 're' ? '#EF4444' : 'var(--wc-t2)';
  return (
    <div className="rounded-[10px] p-[10px_12px]" style={{ background: 'rgba(255,255,255,.02)', border: `1px solid ${borderColor}` }}>
      <div className="font-heading font-bold text-[11px] uppercase tracking-[.05em] mb-[5px]" style={{ color: titleColor }}>{title}</div>
      <div className="text-[10px] leading-[1.55]" style={{ color: 'var(--wc-t2)' }}>{children}</div>
    </div>
  );
}

function TableRow({ label, val, highlight }: { label: string; val: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-[3px]" style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
      <span className="text-[9px]" style={{ color: 'var(--wc-t3)' }}>{label}</span>
      <span className="text-[10px]" style={{ color: highlight ? 'var(--wc-y)' : 'var(--wc-t2)', fontWeight: highlight ? 700 : 400 }}>{val}</span>
    </div>
  );
}

async function generatePDF(report: any, vehicle: VehicleDetails) {
  const JsPDF = await loadJsPDF();
  if (!JsPDF) { alert('Failed to load PDF library. Check your connection.'); return; }

  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297;
  const ML = 14, MR = 14, MT = 14;
  const CW = PW - ML - MR;
  let y = MT;

  const Y: [number, number, number] = [245, 196, 0];
  const GR: [number, number, number] = [26, 107, 58];
  const GY: [number, number, number] = [160, 120, 10];
  const BK: [number, number, number] = [17, 17, 17];
  const GG: [number, number, number] = [120, 120, 120];

  const allTrips = report.trips || [];
  const bizTrips = allTrips.filter((t: any) => t.type === 'business');
  const totalKm = allTrips.reduce((s: number, t: any) => s + t.km, 0);
  const bizKm = bizTrips.reduce((s: number, t: any) => s + t.km, 0);
  const bizPct = totalKm > 0 ? ((bizKm / totalKm) * 100).toFixed(2) : '0.00';
  const totalEst = bizTrips.reduce((s: number, t: any) => s + t.km * RATE, 0);
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
    doc.text(`WorkCar \u00B7 workcar.com.au \u00B7 ATO FY 2024\u20132025 \u00B7 Rev ${report.revision} \u00B7 Generated ${generatedAt}`, PW / 2, PH - 8, { align: 'center' });
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
  doc.text('Work', ML, y + 6);
  const workW = doc.getTextWidth('Work');
  doc.setTextColor(...GY);
  doc.text('Car', ML + workW, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GG);
  doc.text('workcar.com.au  \u00B7  ATO Compliant Vehicle Logbook', ML, y + 11);

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
  doc.text(`ATO cents per kilometre rate 2024\u20132025: $${RATE.toFixed(2)}    \u00B7    Total estimated deduction (c/km): $${totalEst.toFixed(2)}`, ML, y);
  y += 7;

  sectionTitle('Journey List');

  const cols = ['Start date','End date','ODO start','ODO end','Type','km','Biz km','Reimburse'];
  const colW = [22, 22, 22, 22, 18, 14, 14, 22];
  const hdrH = 6.5;

  doc.setFillColor(250, 246, 220);
  doc.rect(ML, y, CW, hdrH, 'F');
  doc.setDrawColor(210, 190, 80);
  doc.rect(ML, y, CW, hdrH, 'S');
  let cx = ML;
  cols.forEach((h, i) => {
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GY);
    doc.text(h, cx + 1.5, y + 4.5);
    cx += colW[i];
  });
  y += hdrH;

  allTrips.forEach((t: any) => {
    checkY(6);
    const isBiz = t.type === 'business';
    doc.setFillColor(isBiz ? 255 : 255, isBiz ? 253 : 255, isBiz ? 240 : 255);
    doc.rect(ML, y, CW, 5.8, 'F');
    doc.setDrawColor(235, 235, 235);
    doc.rect(ML, y, CW, 5.8, 'S');

    const cells = [
      t.date, t.date,
      t.odoStart?.toLocaleString('en-AU') ?? '\u2014',
      t.odoEnd?.toLocaleString('en-AU') ?? '\u2014',
      isBiz ? 'Business' : 'Personal',
      t.km.toFixed(1),
      isBiz ? t.km.toFixed(1) : '',
      isBiz ? `$${(t.km * RATE).toFixed(2)}` : '$0.00',
    ];

    let cx2 = ML;
    cells.forEach((cell, ci) => {
      doc.setFontSize(7.5); doc.setFont('helvetica', ci === 4 && isBiz ? 'bold' : 'normal');
      if (ci === 4) {
        if (isBiz) doc.setTextColor(...GY);
        else doc.setTextColor(...GG);
      } else if (ci === 7 && isBiz) {
        doc.setTextColor(...GR);
      } else {
        doc.setTextColor(...BK);
      }
      doc.text(String(cell), cx2 + 1.5, y + 4);
      cx2 += colW[ci];
    });
    y += 5.8;
  });

  checkY(7);
  doc.setFillColor(250, 246, 220);
  doc.rect(ML, y, CW, 6.5, 'F');
  doc.setDrawColor(210, 190, 80);
  doc.rect(ML, y, CW, 6.5, 'S');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BK);
  doc.text('Totals', ML + 1.5, y + 4.5);
  const totStart = colW.slice(0, 5).reduce((a, b) => a + b, 0);
  doc.text(totalKm.toFixed(1), ML + totStart + 1.5, y + 4.5);
  doc.setTextColor(...GY);
  doc.text(bizKm.toFixed(1), ML + totStart + colW[5] + 1.5, y + 4.5);
  doc.setTextColor(...GR);
  doc.text(`$${totalEst.toFixed(2)}`, ML + totStart + colW[5] + colW[6] + 1.5, y + 4.5);
  y += 10;

  sectionTitle('WorkCar Audit Score & Compliance Notes');
  checkY(30);

  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GY);
  doc.text(`${report.auditScore}%`, ML, y + 7);
  const scoreW = doc.getTextWidth(`${report.auditScore}%`);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GG);
  doc.text('WorkCar Pre-Audit Score', ML + scoreW + 3, y + 6);

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
  const whyNot = 'Why isn\'t the score 100%? The WorkCar audit score measures automatically verifiable data only \u2014 odometer confirmation, photo evidence, and classification completeness. It cannot verify actual business purposes, vehicle engine capacity, pro-rata holding periods, or your individual tax situation. 100% is intentionally unachievable to reflect real-world compliance nuance.';
  const lines = doc.splitTextToSize(whyNot, CW - 4);
  checkY(lines.length * 4 + 2);
  doc.text(lines, ML + 2, y);
  y += lines.length * 4 + 4;

  sectionTitle('Tax Information \u2014 Claiming Motor Vehicle Deductions');
  checkY(50);

  const taxBlocks = [
    ['Logbook Method', 'Claim the business-use % of all car expenses (fuel, rego, insurance, depreciation, loan interest, servicing). No km cap. Requires 12-week continuous logbook renewed every 5 years. Record odometer at start and end of every income year.'],
    ['Cents per Kilometre Method', `Claim $${RATE.toFixed(2)}/km (2024\u201325) up to 5,000 km/year without receipts. Cannot also claim fuel/depreciation separately.`],
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
  const discText = 'This report is produced by WorkCar (workcar.com.au) as a vehicle logbook record-keeping tool only. It does not constitute financial, tax, or legal advice. The accuracy of all trip classifications, odometer readings, business purposes, and deduction amounts is the sole legal responsibility of the taxpayer. For advice specific to your circumstances \u2014 including pro-rata adjustments, depreciation schedules, and edge cases \u2014 consult a registered tax agent (RTA) or licensed accountant. False or inflated deduction claims are a serious offence under the Income Tax Assessment Act 1997 and may result in penalties, interest charges, or prosecution. WorkCar does not warrant that this report satisfies all ATO record-keeping obligations. All data is user-provided.';
  const discLines = doc.splitTextToSize(discText, CW - 8);
  checkY(discLines.length * 4 + 10);
  doc.rect(ML, y - 2, CW, discLines.length * 4 + 8, 'FD');
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 60, 60);
  doc.text(discLines, ML + 4, y + 3);
  y += discLines.length * 4 + 12;

  addFooter();

  const filename = `workcar-logbook-rev${report.revision}-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
}

function exportCSV(report: any) {
  const allTrips = report.trips || [];
  const headers = [
    'Start Date','End Date','ODO Start (km)','ODO End (km)',
    'Business/Personal','Purpose','Total Distance (km)',
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
      t.km.toFixed(1),
      isBiz ? t.km.toFixed(1) : '0',
      isBiz ? (t.km * RATE).toFixed(2) : '0.00',
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
  a.download = `workcar-logbook-rev${report.revision}-${new Date().toISOString().slice(0,10)}.csv`;
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
  const latestTrip = allDates.length > 0
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : new Date();

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
        <span className="font-data text-[11px] text-white">Active reports only</span>
      </div>

      <div className="flex gap-[3px] mb-[4px]">
        {weeks.map((_, i) => (
          <div key={i} className="flex-1 font-data text-[10px] text-center text-white">
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
                background: isCurrent && !covered ? 'rgba(245,196,0,.12)' : 'rgba(255,255,255,.05)',
                border: isCurrent ? '1.5px solid rgba(245,196,0,.35)' : 'none',
              }}>
              {covered && (
                <div className="absolute left-0 top-0 bottom-0 rounded-[4px]"
                  style={{
                    width: `${fillPct}%`,
                    background: 'var(--wc-y)',
                    boxShadow: '0 0 8px rgba(245,196,0,.2)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-[3px] mb-[10px]">
        {weeks.map((_, i) => (
          <div key={i} className="flex-1 font-data text-[9px] text-center text-white">W{i+1}</div>
        ))}
      </div>

      <div className="flex gap-[14px] flex-wrap">
        {[
          { label: 'Full week', custom: <div className="w-[12px] h-[12px] rounded-[3px]" style={{ background: 'var(--wc-y)' }} /> },
          { label: 'Partial', custom: <div className="w-[12px] h-[12px] rounded-[3px] overflow-hidden relative" style={{ background: 'rgba(255,255,255,.05)' }}><div className="absolute left-0 top-0 bottom-0" style={{ width: '50%', background: 'var(--wc-y)' }} /></div> },
          { label: 'This week', custom: <div className="w-[12px] h-[12px] rounded-[3px]" style={{ background: 'rgba(245,196,0,.12)', border: '1.5px solid rgba(245,196,0,.35)' }} /> },
          { label: 'No data', custom: <div className="w-[12px] h-[12px] rounded-[3px]" style={{ background: 'rgba(255,255,255,.05)' }} /> },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-[6px]">
            {l.custom}
            <span className="font-data text-[11px] text-white">{l.label}</span>
          </div>
        ))}
      </div>

      {activeReports.length > 0 && (
        <>
          <div className="mt-[14px] pt-[12px] flex gap-[16px]" style={{ borderTop: '1px solid var(--wc-border)' }}>
            <div className="flex-1">
              <div className="font-data text-[10px] uppercase tracking-[.08em] text-white">Start date</div>
              <div className="font-heading font-bold text-[16px]" style={{ color: 'var(--wc-y)' }}>{fmtDateShort(earliestTrip)}</div>
            </div>
            <div className="flex-1">
              <div className="font-data text-[10px] uppercase tracking-[.08em] text-white">End date</div>
              <div className="font-heading font-bold text-[16px]" style={{ color: 'var(--wc-y)' }}>{fmtDateShort(latestTrip)}</div>
            </div>
          </div>
          <div className="mt-[8px] flex gap-[16px]">
            <div>
              <div className="font-data text-[10px] uppercase tracking-[.08em] text-white">Sessions saved</div>
              <div className="font-heading font-bold text-[22px]" style={{ color: 'var(--wc-y)' }}>{activeReports.length}</div>
            </div>
            <div>
              <div className="font-data text-[10px] uppercase tracking-[.08em] text-white">Weeks covered</div>
              <div className="font-heading font-bold text-[22px]" style={{ color: 'var(--wc-y)' }}>{weeks.filter(w => weekHasCoverage(w.start, w.end)).length}</div>
            </div>
            <div>
              <div className="font-data text-[10px] uppercase tracking-[.08em] text-white">Total biz km</div>
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
      <div className="w-full max-w-[390px] rounded-t-[20px] overflow-hidden" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,196,0,.25)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-[16px] py-[13px]" style={{ borderBottom: '1px solid var(--wc-border)' }}>
          <div className="flex items-center gap-[8px]">
            <FileText className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
            <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em] text-white">Vehicle Details</span>
          </div>
          <button onClick={onClose} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,.06)' }}>
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
                className="w-full rounded-[8px] px-[10px] py-[8px] font-heading text-[13px] text-white outline-none"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={update(f.key)}
                data-testid={`input-vehicle-${f.key}`}
              />
            </div>
          ))}

          <div className="flex gap-[8px] mt-[4px]">
            <button className="flex-1 rounded-[10px] py-[11px] font-heading font-extrabold text-[13px] uppercase tracking-[.05em] cursor-pointer text-black"
              style={{ background: 'var(--wc-y)' }}
              onClick={() => onConfirm(form)}
              data-testid="button-generate-pdf">
              Generate PDF
            </button>
            <button className="rounded-[10px] px-[14px] py-[11px] font-heading font-bold text-[12px] uppercase cursor-pointer"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
              onClick={onClose}
              data-testid="button-cancel-vehicle">
              Cancel
            </button>
          </div>

          <p className="text-[8.5px] text-center" style={{ color: 'rgba(255,255,255,.18)' }}>
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
      color: ri % 2 === 0 ? 'rgba(245,196,0,.18)' : 'rgba(34,197,94,.14)',
      borderColor: ri % 2 === 0 ? 'rgba(245,196,0,.45)' : 'rgba(34,197,94,.35)',
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
        <button onClick={prevMonth} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,.06)' }} data-testid="button-cal-prev">
          <ArrowLeft className="w-[12px] h-[12px]" style={{ color: 'var(--wc-t2)' }} />
        </button>
        <span className="font-heading font-bold text-[14px] text-white">{fullMonths[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,.06)' }} data-testid="button-cal-next">
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
              cellBg = 'rgba(245,196,0,.2)';
              borderRadius = '6px';
              cellBorder = '1.5px solid rgba(245,196,0,.55)';
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
                  style={{ color: tod ? 'var(--wc-y)' : hasTrips ? 'var(--wc-t2)' : inCoverage ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.2)' }}>
                  {day}
                </span>

                {hasTrips && (
                  <div className="flex gap-[2px] mt-[2px]">
                    {biz > 0 && <div className="w-[4px] h-[4px] rounded-full" style={{ background: 'var(--wc-y)', boxShadow: '0 0 3px rgba(245,196,0,.6)' }} />}
                    {per > 0 && <div className="w-[4px] h-[4px] rounded-full" style={{ background: 'rgba(255,255,255,.3)' }} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-[12px] py-[8px] mt-[4px] flex flex-wrap gap-x-[10px] gap-y-[4px]" style={{ borderTop: '1px solid var(--wc-border)' }}>
        {[
          { el: <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--wc-y)', boxShadow: '0 0 3px rgba(245,196,0,.5)' }} />, label: 'Business trip' },
          { el: <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'rgba(255,255,255,.3)' }} />, label: 'Personal trip' },
          { el: <div className="w-[14px] h-[8px] rounded-[2px]" style={{ background: 'rgba(245,196,0,.18)', border: '1px solid rgba(245,196,0,.45)' }} />, label: 'Report coverage' },
          { el: <div className="w-[7px] h-[7px] rounded-full flex items-center justify-center" style={{ background: 'var(--wc-gr)' }}><Download style={{ width: '4px', height: '4px', color: '#fff' }} /></div>, label: 'Exported' },
          { el: <div className="w-[10px] h-[10px] rounded-[3px]" style={{ background: 'rgba(245,196,0,.2)', border: '1.5px solid rgba(245,196,0,.55)' }} />, label: 'Today' },
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
  const allTrips = report.trips || [];
  const bizTrips = allTrips.filter((t: any) => t.type === 'business');
  const verified = bizTrips.filter((t: any) => t.verified).length;
  const withPurpose = bizTrips.filter((t: any) => t.purposeLabel).length;
  const withPhoto = bizTrips.filter((t: any) => t.photo).length;
  const hasOdo = !!report.lastOdoReading;

  const checks = [
    { label: 'All trips sorted (business vs personal)', desc: `${allTrips.length} trips classified`, pass: allTrips.length > 0, required: true },
    { label: 'Business trip purposes labelled', desc: `${withPurpose} of ${bizTrips.length} have a purpose`, pass: withPurpose === bizTrips.length && bizTrips.length > 0, required: true },
    { label: 'Odometer reading recorded', desc: hasOdo ? `${report.lastOdoReading?.toLocaleString('en-AU')} km verified` : 'No odometer reading saved', pass: hasOdo, required: true },
    { label: 'Logbook covers a continuous period', desc: 'WorkCar records trips as they occur in real-time', pass: true, required: true },
    { label: 'Odometer verified on business trips', desc: `${verified} of ${bizTrips.length} trips odometer-verified`, pass: verified === bizTrips.length && bizTrips.length > 0, required: false },
    { label: 'Photo evidence attached to trips', desc: `${withPhoto} of ${bizTrips.length} trips have photos`, pass: withPhoto > 0, required: false },
    { label: 'Vehicle details on file', desc: 'Make, model, registration — add in your tax return', pass: false, required: false },
  ];

  const passCount = checks.filter(c => c.pass).length;
  const requiredFails = checks.filter(c => c.required && !c.pass).length;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full max-w-[390px] rounded-t-[20px] overflow-hidden" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,196,0,.2)', maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-[16px] py-[13px]" style={{ borderBottom: '1px solid var(--wc-border)' }}>
          <div className="flex items-center gap-[8px]">
            <Shield className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
            <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em] text-white">Pre-Audit Checklist</span>
          </div>
          <button onClick={onClose} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,.06)' }} data-testid="button-close-audit">
            <XCircle className="w-[13px] h-[13px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        </div>

        <div className="overflow-y-auto p-[12px_16px] flex flex-col gap-[8px]" style={{ maxHeight: 'calc(88vh - 58px)' }}>

          <div className="rounded-[10px] p-[10px_12px]" style={{ background: requiredFails > 0 ? 'rgba(245,158,11,.06)' : 'rgba(34,197,94,.05)', border: `1px solid ${requiredFails > 0 ? 'rgba(245,158,11,.25)' : 'rgba(34,197,94,.2)'}` }}>
            <div className="flex items-center justify-between mb-[5px]">
              <span className="font-heading font-bold text-[13px] text-white">{passCount}/{checks.length} checks passed</span>
              <span className="font-heading font-bold text-[10px] px-[7px] py-[2px] rounded-[5px]"
                style={{ background: requiredFails > 0 ? 'rgba(245,158,11,.15)' : 'rgba(34,197,94,.12)', color: requiredFails > 0 ? 'var(--wc-am)' : 'var(--wc-gr)' }}>
                {requiredFails > 0 ? `${requiredFails} required issue${requiredFails > 1 ? 's' : ''}` : 'Ready to export'}
              </span>
            </div>
            <div className="h-[5px] rounded-full w-full" style={{ background: 'rgba(255,255,255,.08)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(passCount / checks.length) * 100}%`, background: requiredFails > 0 ? 'var(--wc-am)' : 'var(--wc-gr)' }} />
            </div>
          </div>

          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-[10px] rounded-[10px] p-[9px_12px]"
              style={{ background: c.pass ? 'rgba(34,197,94,.03)' : 'rgba(255,255,255,.02)', border: `1px solid ${c.pass ? 'rgba(34,197,94,.12)' : 'rgba(255,255,255,.06)'}` }}>
              <div className="w-[17px] h-[17px] rounded-full flex items-center justify-center flex-shrink-0 mt-[1px]"
                style={{ background: c.pass ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.06)' }}>
                {c.pass
                  ? <Check className="w-[9px] h-[9px]" style={{ color: 'var(--wc-gr)' }} />
                  : <XCircle className="w-[9px] h-[9px]" style={{ color: c.required ? 'var(--wc-am)' : 'var(--wc-t3)' }} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-[5px] flex-wrap">
                  <span className="font-heading font-bold text-[11px] text-white">{c.label}</span>
                  {c.required && !c.pass && (
                    <span className="font-data text-[7px] uppercase tracking-[.06em] px-[4px] py-[1px] rounded-[3px]" style={{ background: 'rgba(245,158,11,.15)', color: 'var(--wc-am)' }}>Required</span>
                  )}
                </div>
                <span className="text-[9px]" style={{ color: 'var(--wc-t3)' }}>{c.desc}</span>
              </div>
            </div>
          ))}

          <div className="rounded-[10px] p-[10px_12px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
            <div className="flex items-center gap-[5px] mb-[5px]">
              <HelpCircle className="w-[11px] h-[11px]" style={{ color: 'var(--wc-t3)' }} />
              <span className="font-heading font-bold text-[10px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-t2)' }}>Why isn't the Audit Score 100%?</span>
            </div>
            <p className="text-[9.5px] leading-[1.55]" style={{ color: 'var(--wc-t3)' }}>
              The score measures only what WorkCar can verify automatically — odometer readings, photo evidence, and classification completeness. It <strong className="text-white">cannot verify</strong> the actual business purpose of each trip, engine capacity, pro-rata holding periods, or your individual tax situation. A score of 100% is intentionally unachievable to reflect real-world compliance nuance. Your accountant provides the missing context.
            </p>
          </div>

          <div className="rounded-[10px] p-[10px_12px] mb-[4px]" style={{ background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.1)' }}>
            <div className="flex items-start gap-[5px]">
              <AlertTriangle className="w-[11px] h-[11px] flex-shrink-0 mt-[1px]" style={{ color: 'rgba(239,68,68,.6)' }} />
              <p className="text-[9px] leading-[1.55]" style={{ color: 'rgba(239,68,68,.7)' }}>
                <strong style={{ color: 'rgba(239,68,68,.9)' }}>Legal responsibility.</strong> You are solely responsible for the accuracy of all claims. WorkCar provides record-keeping tools only — not tax advice. For discretionary or edge-case deductions, seek advice from a <strong style={{ color: 'rgba(239,68,68,.9)' }}>registered tax agent (RTA)</strong> or licensed accountant. Refer to ATO TR 2021/1 and PCG 2021/3. False or inflated claims are a serious offence under the <em>Income Tax Assessment Act 1997</em>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxInfoModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'rules' | 'prorata' | 'methods'>('rules');
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full max-w-[390px] rounded-t-[20px] overflow-hidden" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,196,0,.2)', maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-[16px] py-[13px]" style={{ borderBottom: '1px solid var(--wc-border)' }}>
          <div className="flex items-center gap-[8px]">
            <Info className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
            <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em] text-white">Tax Information</span>
          </div>
          <button onClick={onClose} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,.06)' }} data-testid="button-close-tax-info">
            <XCircle className="w-[13px] h-[13px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        </div>

        <div className="flex" style={{ borderBottom: '1px solid var(--wc-border)' }}>
          {(['rules','prorata','methods'] as const).map(t => (
            <button key={t} className="flex-1 py-[8px] font-heading font-bold text-[10px] uppercase tracking-[.05em]"
              style={{ borderBottom: tab === t ? '2px solid var(--wc-y)' : '2px solid transparent', color: tab === t ? 'var(--wc-y)' : 'var(--wc-t3)', marginBottom: '-1px' }}
              onClick={() => setTab(t)}
              data-testid={`tab-${t}`}>
              {t === 'rules' ? 'Rules' : t === 'prorata' ? 'Pro-rata' : 'Methods'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-[12px_16px] flex flex-col gap-[8px]" style={{ maxHeight: 'calc(88vh - 108px)' }}>
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
              WorkCar calculates estimates using the cents-per-km method. For the full logbook method — which can yield a higher deduction — provide this report as logbook evidence to your registered tax agent or accountant.
            </InfoBlock>
          </>)}

          {tab === 'prorata' && (<>
            <InfoBlock title="When does pro-rata apply?" color="am">
              Pro-rata applies when you didn't hold the vehicle for the full income year (1 Jul – 30 Jun): purchased mid-year, sold mid-year, car written off, or used only part of the year.
            </InfoBlock>

            <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid rgba(245,196,0,.2)' }}>
              <div className="px-[12px] py-[8px]" style={{ background: 'rgba(245,196,0,.07)', borderBottom: '1px solid rgba(245,196,0,.2)' }}>
                <span className="font-heading font-bold text-[11px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-y)' }}>Example — Mid-Year Purchase</span>
              </div>
              <div className="p-[10px_12px] flex flex-col gap-[3px]">
                <TableRow label="Purchased" val="1 Jan 2025" />
                <TableRow label="Days owned in FY2025" val="181 of 365 days" />
                <TableRow label="Total car expenses" val="$8,000" />
                <TableRow label="Business use %" val="65%" highlight />
                <TableRow label="Pro-rata factor" val="181 \u00F7 365 = 0.496" />
                <TableRow label="Deductible amount" val="$8,000 \u00D7 65% \u00D7 0.496 = $2,579" highlight />
                <p className="text-[8.5px] mt-[4px]" style={{ color: 'var(--wc-t3)' }}>* Simplified. Depreciation, fuel, insurance each have separate treatment. Consult a registered tax agent.</p>
              </div>
            </div>

            <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid rgba(34,197,94,.15)' }}>
              <div className="px-[12px] py-[8px]" style={{ background: 'rgba(34,197,94,.05)', borderBottom: '1px solid rgba(34,197,94,.15)' }}>
                <span className="font-heading font-bold text-[11px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-gr)' }}>Example — Full Year Logbook Method</span>
              </div>
              <div className="p-[10px_12px] flex flex-col gap-[3px]">
                <TableRow label="Total km driven (FY)" val="22,000 km" />
                <TableRow label="Business km (from logbook)" val="11,440 km" />
                <TableRow label="Business use %" val="52%" highlight />
                <TableRow label="Total car expenses" val="$12,000" />
                <TableRow label="Deductible amount" val="$12,000 \u00D7 52% = $6,240" highlight />
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
            <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--wc-border)' }}>
              <div className="px-[12px] py-[7px]" style={{ background: 'rgba(255,255,255,.03)', borderBottom: '1px solid var(--wc-border)' }}>
                <span className="font-heading font-bold text-[10px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-t2)' }}>Quick Comparison</span>
              </div>
              <table className="w-full font-data text-[9px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                    <th className="p-[5px_10px] text-left" style={{ color: 'var(--wc-t3)', borderBottom: '1px solid var(--wc-border)' }}> </th>
                    <th className="p-[5px_10px] text-center" style={{ color: 'var(--wc-y)', borderBottom: '1px solid var(--wc-border)' }}>Logbook</th>
                    <th className="p-[5px_10px] text-center" style={{ color: 'var(--wc-gr)', borderBottom: '1px solid var(--wc-border)' }}>c/km</th>
                  </tr>
                </thead>
                <tbody>
                  {[['Km cap','None','5,000 km'],['Logbook required','Yes','No'],['Receipts needed','Yes','No'],['Claim fuel/rego','Yes (% of total)','No'],['Best for','High use / costs','Simple / low use']].map(([l,lb,ck],i)=>(
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <td className="p-[4px_10px]" style={{ color: 'var(--wc-t3)' }}>{l}</td>
                      <td className="p-[4px_10px] text-center" style={{ color: 'var(--wc-y)' }}>{lb}</td>
                      <td className="p-[4px_10px] text-center" style={{ color: 'var(--wc-gr)' }}>{ck}</td>
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
    <div className="rounded-[10px] p-[10px_12px] text-center" style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)' }}>
      <span className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>No exports yet this session</span>
    </div>
  );
  return (
    <div className="rounded-[12px] p-[10px_12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
      <div className="font-heading font-bold text-[10px] uppercase tracking-[.05em] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>Export Log</div>
      {log.slice(0, 10).map((e, i) => (
        <div key={i} className="flex items-center gap-[7px] py-[4px]" style={{ borderBottom: i < log.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
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
    generatePDF(r, v);
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
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
            onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'sort' })} data-testid="button-back-reports">
            <ArrowLeft className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
          </button>
        )}
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">Reports</span>
        <div className="ml-auto flex items-center gap-[6px]">
          <button className="flex items-center gap-[5px] rounded-[8px] px-[10px] py-[6px]"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
            onClick={() => setTaxInfoOpen(true)}
            data-testid="button-tax-info">
            <Info className="w-[13px] h-[13px]" style={{ color: 'var(--wc-y)' }} />
            <span className="font-heading font-bold text-[12px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-y)' }}>Tax Info</span>
          </button>
          <span className="text-[11px] text-white">{state.savedReports.length} report{state.savedReports.length !== 1 ? 's' : ''}</span>
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
              background: view === id ? 'rgba(245,196,0,.12)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${view === id ? 'rgba(245,196,0,.35)' : 'var(--wc-border)'}`,
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
            <div className="py-[30px] text-center text-[13px] text-white">
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
                  style={isLinked ? { border: '2px solid rgba(245,196,0,.4)', background: 'rgba(245,196,0,.03)' } : {}}
                  data-testid={`session-group-${group.sessionId}`}>

                  {isLinked && (
                    <div className="flex flex-col gap-[5px] px-[6px] pt-[2px] pb-[2px]">
                      <div className="flex items-center gap-[6px]">
                        <Link2 className="w-[11px] h-[11px]" style={{ color: 'var(--wc-y)' }} />
                        <span className="font-heading font-bold text-[9px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-y)' }}>Linked Reports</span>
                        <span className="font-data text-[8px] text-white">{label}</span>
                      </div>
                      <button
                        className="flex items-center gap-[6px] rounded-[8px] p-[5px_8px] cursor-pointer text-left"
                        style={{ background: hasActive ? 'rgba(34,197,94,.06)' : 'rgba(245,158,11,.1)', border: `1px solid ${hasActive ? 'rgba(34,197,94,.2)' : 'rgba(245,158,11,.3)'}` }}
                        onClick={() => setConflictSessionId(group.sessionId)}
                        data-testid={`button-resolve-${group.sessionId}`}>
                        {hasActive
                          ? <><Check className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-gr)' }} /><span className="flex-1 text-[9px] text-white"><span style={{ color: 'var(--wc-gr)' }}>Resolved</span> — tap to change active report</span></>
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
                    const totalEst = bizTrips.reduce((s: number, t: any) => s + t.km * RATE, 0);

                    return (
                      <div key={i} className="rounded-[13px] overflow-hidden"
                        style={{
                          background: 'var(--wc-card)',
                          border: isLinked
                            ? `1.5px solid ${!r.supersedes ? 'rgba(34,197,94,.35)' : 'var(--wc-border)'}`
                            : `1px solid ${isOpen ? 'rgba(245,196,0,.25)' : 'var(--wc-border)'}`,
                          opacity: r.supersedes ? 0.62 : 1,
                        }}
                        data-testid={`report-${i}`}>

                        <button className="w-full p-[12px_14px] text-left cursor-pointer" style={{ background: 'transparent' }}
                          onClick={() => setExpandedIdx(isOpen ? null : i)} data-testid={`report-toggle-${i}`}>
                          <div className="flex items-start justify-between mb-[2px]">
                            <div className="flex items-center gap-[6px] flex-wrap">
                              <div className="font-data text-[9px] uppercase tracking-[.08em] text-white">{r.timestamp}</div>
                              {!r.supersedes && (
                                <span className="inline-flex items-center gap-[4px] font-heading font-bold text-[10px] uppercase tracking-[.05em] px-[8px] py-[3px] rounded-[6px]"
                                  style={{ background: 'rgba(34,197,94,.12)', border: '1.5px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}>
                                  <Check className="w-[11px] h-[11px]" />Active \u00B7 Rev {r.revision}
                                </span>
                              )}
                              {r.supersedes && isLinked && (
                                <span className="inline-flex items-center gap-[4px] font-heading font-bold text-[10px] uppercase tracking-[.05em] px-[8px] py-[3px] rounded-[6px] cursor-pointer"
                                  style={{ background: 'rgba(245,196,0,.15)', border: '1.5px solid rgba(245,196,0,.4)', color: 'var(--wc-y)' }}
                                  onClick={e => { e.stopPropagation(); dispatch({ type: 'PROMOTE_REPORT', reportIndex: i }); }}
                                  data-testid={`badge-make-active-${i}`}>
                                  <ArrowUpCircle className="w-[11px] h-[11px]" />Make Active
                                </span>
                              )}
                              {r.supersedes && !isLinked && (
                                <span className="inline-flex items-center gap-[3px] font-heading font-bold text-[8px] uppercase tracking-[.06em] px-[5px] py-[1px] rounded-[4px]"
                                  style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)', color: '#fff' }}>
                                  <Archive className="w-[8px] h-[8px]" />Archived
                                </span>
                              )}
                            </div>
                            {isOpen ? <ChevronUp className="w-[16px] h-[16px] mt-1 flex-shrink-0 text-white" />
                              : <ChevronDown className="w-[16px] h-[16px] mt-1 flex-shrink-0 text-white" />}
                          </div>
                          <div className="font-heading font-bold text-[15px] text-white mb-[5px]">
                            {r.supersedes ? 'Archived' : 'Active'} Report — {r.bizCount + r.perCount} trips
                          </div>
                          <div className="flex gap-[8px] flex-wrap">
                            {[
                              { val: `${r.bizCount}`, label: 'biz', color: 'var(--wc-y)' },
                              { val: `${r.perCount}`, label: 'personal', color: 'white' },
                              { val: r.est, label: 'est.', color: 'var(--wc-y)' },
                              { val: `${r.totalKm} km`, label: '', color: 'var(--wc-y)' },
                              { val: `${r.auditScore}%`, label: 'audit', color: 'var(--wc-y)' },
                            ].map((item, idx) => (
                              <span key={idx} className="text-[11px] text-white">
                                <strong style={{ color: item.color }}>{item.val}</strong>{item.label ? ` ${item.label}` : ''}
                              </span>
                            ))}
                          </div>
                          {r.lastOdoVerifiedAt && (
                            <div className="mt-[4px] text-[11px] text-white">
                              Odo: <strong style={{ color: 'var(--wc-am)' }}>{r.lastOdoReading?.toLocaleString('en-AU')} km</strong>
                              <span className="text-white"> \u00B7 verified {r.lastOdoVerifiedAt}</span>
                            </div>
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-[14px] pb-[14px]" style={{ borderTop: '1px solid var(--wc-border)' }}>

                            {!r.supersedes && (
                              <div className="flex gap-[5px] mt-[10px] mb-[8px]">
                                <button className="flex-1 flex items-center justify-center gap-[5px] rounded-[9px] py-[9px] font-heading font-bold text-[11px] uppercase tracking-[.04em] cursor-pointer"
                                  style={{ background: 'rgba(245,196,0,.1)', border: '1.5px solid rgba(245,196,0,.3)', color: 'var(--wc-y)' }}
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
                                  style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                                  onClick={() => setAuditReport(r)}
                                  data-testid={`button-audit-check-${i}`}>
                                  <Shield className="w-[11px] h-[11px]" />Check
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-[5px] mb-[8px] rounded-[7px] p-[6px_10px]"
                              style={{ background: state.sessionId === r.sessionId && state.trips.length > 0 ? 'var(--wc-y)' : 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)' }}>
                              <Archive className="w-[11px] h-[11px] flex-shrink-0" style={{ color: state.sessionId === r.sessionId && state.trips.length > 0 ? '#000' : 'var(--wc-t3)' }} />
                              <span className="text-[9px] font-bold" style={{ color: state.sessionId === r.sessionId && state.trips.length > 0 ? '#000' : 'var(--wc-t3)' }}>
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
                                        <td className="p-[4px_8px] text-white" style={{ width: '50%' }}>{l1}</td>
                                        <td className="p-[4px_8px] text-white">{l2}</td>
                                      </tr>
                                      <tr style={{ borderBottom: ri < 2 ? '1px solid var(--wc-border)' : 'none' }}>
                                        <td className="p-[2px_8px_6px] font-bold text-white">{v1}</td>
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
                                  <tr style={{ background: 'rgba(245,196,0,.07)' }}>
                                    {['Date','ODO Start','ODO End','Type','km','Biz km','Est $'].map(h => (
                                      <th key={h} className="p-[4px_6px] text-left font-bold" style={{ color: 'var(--wc-y)', borderBottom: '1px solid var(--wc-border)' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allTrips.map((t: any, ti: number) => {
                                    const isBiz = t.type === 'business';
                                    return (
                                      <tr key={ti} style={{ borderBottom: ti < allTrips.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', background: isBiz ? 'rgba(245,196,0,.025)' : 'transparent' }}>
                                        <td className="p-[3px_6px] text-white">{t.date}</td>
                                        <td className="p-[3px_6px] text-white">{t.odoStart?.toLocaleString('en-AU') ?? '\u2014'}</td>
                                        <td className="p-[3px_6px] text-white">{t.odoEnd?.toLocaleString('en-AU') ?? '\u2014'}</td>
                                        <td className="p-[3px_6px]" style={{ color: isBiz ? 'var(--wc-y)' : '#fff' }}>{isBiz ? 'Biz' : 'Per'}</td>
                                        <td className="p-[3px_6px] text-white">{t.km.toFixed(1)}</td>
                                        <td className="p-[3px_6px]" style={{ color: isBiz ? 'var(--wc-y)' : '#fff' }}>{isBiz ? t.km.toFixed(1) : ''}</td>
                                        <td className="p-[3px_6px]" style={{ color: isBiz ? 'var(--wc-gr)' : '#fff' }}>{isBiz ? `$${(t.km * RATE).toFixed(2)}` : '$0.00'}</td>
                                      </tr>
                                    );
                                  })}
                                  <tr style={{ borderTop: '1px solid var(--wc-border)', background: 'rgba(245,196,0,.06)' }}>
                                    <td colSpan={4} className="p-[4px_6px] font-bold" style={{ color: 'var(--wc-y)' }}>Totals</td>
                                    <td className="p-[4px_6px] font-bold text-white">{totalKm.toFixed(1)}</td>
                                    <td className="p-[4px_6px] font-bold" style={{ color: 'var(--wc-y)' }}>{bizKm.toFixed(1)}</td>
                                    <td className="p-[4px_6px] font-bold" style={{ color: 'var(--wc-gr)' }}>${totalEst.toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {r.areasToCheck && r.areasToCheck.length > 0 && (
                              <div className="rounded-[10px] p-[9px_12px] mb-[8px]" style={{ background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.14)' }}>
                                <div className="flex items-center gap-[5px] mb-[5px]">
                                  <AlertTriangle className="w-[11px] h-[11px]" style={{ color: 'var(--wc-am)' }} />
                                  <span className="font-heading font-bold text-[10px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-am)' }}>Compliance Notes</span>
                                </div>
                                {r.areasToCheck.map((a: string, ai: number) => (
                                  <div key={ai} className="flex items-start gap-[5px] mb-[2px]">
                                    <span style={{ color: a.startsWith('All clear') ? 'var(--wc-gr)' : 'var(--wc-am)' }}>
                                      {a.startsWith('All clear') ? '\u2713' : '\u00B7'}
                                    </span>
                                    <span className="text-[10px] text-white">{a}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {r.auditLog && r.auditLog.length > 0 && (
                              <div className="mb-[8px]">
                                <div className="font-heading font-bold text-[9px] uppercase tracking-[.05em] mb-[4px] text-white">Audit Log</div>
                                <div className="rounded-[8px] p-[6px_10px]" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
                                  {r.auditLog.slice(0, 8).map((e: any, ei: number) => (
                                    <div key={ei} className="flex items-start gap-[5px] py-[2px]" style={{ borderBottom: ei < 7 && ei < r.auditLog.length - 1 ? '1px solid rgba(255,255,255,.03)' : 'none' }}>
                                      <Clock className="w-[9px] h-[9px] flex-shrink-0 mt-[2px] text-white" />
                                      <span className="font-data text-[8px] flex-shrink-0 text-white">{e.time}</span>
                                      <span className="text-[9px] flex-1 text-white">{e.desc}</span>
                                    </div>
                                  ))}
                                  {r.auditLog.length > 8 && <div className="text-[8px] mt-[3px] text-white">+{r.auditLog.length - 8} more entries</div>}
                                </div>
                              </div>
                            )}

                            {isLinked && r.supersedes && (
                              <button className="w-full rounded-[8px] py-[7px] mb-[8px] font-heading font-bold text-[11px] tracking-[.05em] uppercase cursor-pointer flex items-center justify-center gap-[5px]"
                                style={{ background: 'rgba(245,196,0,.07)', border: '1.5px solid rgba(245,196,0,.28)', color: 'var(--wc-y)' }}
                                onClick={() => dispatch({ type: 'PROMOTE_REPORT', reportIndex: i })}
                                data-testid={`button-promote-${i}`}>
                                <ArrowUpCircle className="w-[12px] h-[12px]" />
                                Make This the Active Report
                              </button>
                            )}

                            <div className="rounded-[8px] p-[8px_10px]" style={{ background: 'rgba(255,255,255,.015)', border: '1px dashed rgba(255,255,255,.07)' }}>
                              <div className="flex items-center gap-[5px]">
                                <Plus className="w-[10px] h-[10px]" style={{ color: 'rgba(255,255,255,.2)' }} />
                                <span className="font-heading font-bold text-[9px] uppercase tracking-[.05em]" style={{ color: 'rgba(255,255,255,.2)' }}>Expense Claims — Coming Soon</span>
                              </div>
                              <p className="text-[8.5px] mt-[2px]" style={{ color: 'rgba(255,255,255,.12)' }}>Attach fuel receipts, tolls &amp; parking to this report period</p>
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
        <div className="flex-shrink-0 px-[14px] py-[10px] flex flex-col gap-[8px]" style={{ background: 'rgba(10,10,10,.97)', borderTop: '1px solid var(--wc-border)' }}>
          <div className="font-data text-[8px] uppercase tracking-[.1em] mb-[-2px] text-white">Session Actions</div>
          <div className="relative">
            <button
              className="w-full rounded-[12px] py-[14px] px-[16px] font-heading font-extrabold text-[15px] tracking-[.06em] uppercase cursor-pointer transition-all flex items-center justify-between animate-flash-yellow"
              style={{ background: 'var(--wc-y)', border: '2px solid var(--wc-y)', color: '#000' }}
              onClick={() => setActionMenuOpen(!actionMenuOpen)} data-testid="button-action-menu">
              <span>Choose an action...</span>
              <ChevronDown className={`w-[18px] h-[18px] transition-transform ${actionMenuOpen ? 'rotate-180' : ''}`} style={{ color: '#000' }} />
            </button>

            {actionMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-[6px] rounded-[12px] overflow-hidden animate-pop"
                style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,196,0,.3)', boxShadow: '0 -10px 40px rgba(0,0,0,.5)' }}
                data-testid="action-menu-dropdown">
                {[
                  { Icon: Plus, label: 'Create Another Report', desc: 'Re-sort trips and save a new revision', color: 'var(--wc-y)', bg: 'rgba(245,196,0,.1)', action: () => { setActionMenuOpen(false); dispatch({ type: 'GO_SCREEN', screen: 'review' }); } },
                  { Icon: Pause, label: 'Come Back Later', desc: 'Session stays active. No other cards sortable until finalised.', color: 'white', bg: 'rgba(255,255,255,.04)', action: () => { setActionMenuOpen(false); dispatch({ type: 'COME_BACK_LATER' }); } },
                  { Icon: Trash2, label: 'Done — Delete Sort Cards', desc: 'Locks reports. No further revisions. Reports are kept.', color: 'white', bg: '#fff', action: () => { setActionMenuOpen(false); setConfirmDelete(true); } },
                ].map(({ Icon, label, desc, color, bg, action }) => (
                  <button key={label} className="w-full p-[12px_14px] text-left cursor-pointer transition-all flex items-center gap-[10px]"
                    style={{ background: bg, borderBottom: '1px solid var(--wc-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = label === 'Done — Delete Sort Cards' ? '#f0f0f0' : 'rgba(255,255,255,.09)')}
                    onMouseLeave={e => (e.currentTarget.style.background = bg)}
                    onClick={action}
                    data-testid={`action-${label.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                    <Icon className="w-[15px] h-[15px] flex-shrink-0" style={{ color: label === 'Done — Delete Sort Cards' ? '#222' : color }} />
                    <div>
                      <div className="font-heading font-bold text-[13px] uppercase tracking-[.04em]" style={{ color: label === 'Done — Delete Sort Cards' ? '#111' : color }}>{label}</div>
                      <div className="text-[10px] mt-[1px]" style={{ color: label === 'Done — Delete Sort Cards' ? '#444' : 'white' }}>{desc}</div>
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
                    <span className="text-[8.5px] leading-[1.4] text-white">Not recommended. Create a new revision and set it as active instead.</span>
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
            <div className="mx-5 w-full max-w-[360px] rounded-[16px] p-[20px_16px] animate-pop" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,158,11,.35)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} onClick={e => e.stopPropagation()} data-testid="modal-conflict">
              <div className="flex flex-col items-center gap-[8px] mb-[14px]">
                <ShieldAlert className="w-[26px] h-[26px]" style={{ color: 'var(--wc-am)' }} />
                <div className="font-heading font-black text-[18px] uppercase text-white text-center">Select Active Report</div>
                <div className="text-[11px] text-center text-white">Only one report can be active for your ATO submission.</div>
              </div>
              <div className="flex flex-col gap-[8px] mb-[12px]">
                {groupReports.map(r => (
                  <div key={r.globalIdx} className="rounded-[10px] p-[10px_12px] cursor-pointer" style={{ background: !r.supersedes ? 'rgba(34,197,94,.06)' : 'rgba(255,255,255,.03)', border: `1.5px solid ${!r.supersedes ? 'rgba(34,197,94,.3)' : 'var(--wc-border)'}` }}
                    onClick={() => dispatch({ type: 'PROMOTE_REPORT', reportIndex: r.globalIdx })} data-testid={`conflict-select-${r.globalIdx}`}>
                    <div className="flex items-center gap-[6px] mb-[3px]">
                      <div className="w-[15px] h-[15px] rounded-full flex items-center justify-center" style={{ background: !r.supersedes ? 'var(--wc-gr)' : 'transparent', border: `2px solid ${!r.supersedes ? 'var(--wc-gr)' : 'var(--wc-border)'}` }}>
                        {!r.supersedes && <Check className="w-[9px] h-[9px] text-black" />}
                      </div>
                      <span className="font-heading font-bold text-[13px] text-white">Rev {r.revision}</span>
                      {!r.supersedes && <span className="font-heading font-bold text-[8px] px-[4px] py-[1px] rounded-[3px]" style={{ background: 'rgba(34,197,94,.15)', color: 'var(--wc-gr)' }}>Active</span>}
                    </div>
                    <div className="flex gap-[8px] flex-wrap text-[10px] text-white">
                      <span><strong style={{ color: 'var(--wc-y)' }}>{r.bizCount}</strong> biz</span>
                      <span>Est. <strong style={{ color: 'var(--wc-y)' }}>{r.est}</strong></span>
                      <span><strong style={{ color: 'var(--wc-y)' }}>{r.totalKm}</strong> km</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full rounded-[11px] py-[11px] font-heading font-bold text-[14px] uppercase cursor-pointer text-black" style={{ background: 'var(--wc-y)' }} onClick={() => setConflictSessionId(null)} data-testid="button-conflict-done">Done</button>
            </div>
          </div>
        );
      })()}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDelete(false)}>
          <div className="mx-6 w-full max-w-[340px] rounded-[16px] p-[20px_18px] animate-pop" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(239,68,68,.35)', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} onClick={e => e.stopPropagation()} data-testid="modal-delete-confirm">
            <div className="flex flex-col items-center gap-[10px] mb-[12px]">
              <Trash2 className="w-[26px] h-[26px]" style={{ color: '#EF4444' }} />
              <div className="font-heading font-black text-[18px] uppercase text-white text-center">Delete All Sort Cards?</div>
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
            <div className="font-heading font-black text-[18px] uppercase text-white text-center mb-[10px]">Delete {SESSION_LABELS[confirmDeleteSession] || confirmDeleteSession}?</div>
            <div className="flex items-start gap-[8px] rounded-[10px] p-[9px_12px] mb-[14px]" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
              <AlertTriangle className="w-[14px] h-[14px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-am)' }} />
              <span className="text-[11px] leading-[1.5] text-white">This deletes all saved reports for this session. Trip data reloads so you can re-sort anytime. <br /><br /><span style={{ color: 'var(--wc-t3)' }}>Recommended: create a new revision and set it as active instead.</span></span>
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
