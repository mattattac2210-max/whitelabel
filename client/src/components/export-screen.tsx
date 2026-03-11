import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { calcLogbookDeduction, getVehicleCosts } from '@/lib/trip-data';
import { getLogbookStatus, getActivePeriod } from '@/lib/logbook-utils';
import {
  Download, FileText, Check, ChevronDown, ChevronUp,
  XCircle, Layers, BarChart2, Clock, ArrowLeft, Archive,
} from 'lucide-react';

const SESSION_LABELS: Record<string, string> = {
  batch1: 'Week 1 \u2014 24\u201327 Feb',
  batch2: 'Week 2 \u2014 28 Feb\u20132 Mar',
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

function combineReports(reports: any[]) {
  const allTrips = reports.flatMap(r => r.trips || []);
  function parseTripDate(d: string): number {
    if (d.includes('/')) {
      const p = d.split('/');
      return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
    }
    const t = Date.parse(d.replace(/^[A-Za-z]+,\s*/, '') + ' 2026');
    return isNaN(t) ? 0 : t;
  }
  allTrips.sort((a: any, b: any) => parseTripDate(a.date) - parseTripDate(b.date));
  const bizTrips = allTrips.filter((t: any) => t.type === 'business');
  const totalKm = allTrips.reduce((s: number, t: any) => s + t.km, 0);
  const bizKm = bizTrips.reduce((s: number, t: any) => s + t.km, 0);
  const perKm = totalKm - bizKm;
  const bizPct = totalKm > 0 ? ((bizKm / totalKm) * 100) : 0;
  const vehicleCosts = 0; // Combined reports - use first report's vehicle costs if needed
  const totalEst = calcLogbookDeduction(bizKm, totalKm, vehicleCosts);

  const odoStarts = reports.map(r => r.odoRangeStart).filter((v: any) => v != null);
  const odoEnds = reports.map(r => r.odoRangeEnd).filter((v: any) => v != null);
  const odoRangeStart = odoStarts.length > 0 ? Math.min(...odoStarts) : null;
  const odoRangeEnd = odoEnds.length > 0 ? Math.max(...odoEnds) : null;

  const avgAudit = reports.length > 0
    ? Math.round(reports.reduce((s, r) => s + (r.auditScore || 0), 0) / reports.length)
    : 0;

  const allAreas = reports.flatMap(r => r.areasToCheck || []);
  const uniqueAreas = Array.from(new Set(allAreas));

  return {
    trips: allTrips,
    bizCount: bizTrips.length,
    perCount: allTrips.length - bizTrips.length,
    totalKm,
    bizKm,
    perKm,
    bizPct,
    totalEst,
    odoRangeStart,
    odoRangeEnd,
    auditScore: avgAudit,
    areasToCheck: uniqueAreas,
    revision: reports.length,
    sessionCount: reports.length,
  };
}

async function generateCombinedPDF(combined: any, vehicle: VehicleDetails) {
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

  const allTrips = combined.trips;
  const bizTrips = allTrips.filter((t: any) => t.type === 'business');
  const totalKm = combined.totalKm;
  const bizKm = combined.bizKm;
  const bizPct = totalKm > 0 ? ((bizKm / totalKm) * 100) : 0;
  const totalEst = combined.totalEst;
  const generatedAt = new Date().toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  function addPage() { doc.addPage(); y = MT; addFooter(); }
  function checkY(needed: number) { if (y + needed > PH - 16) addPage(); }
  function addFooter() {
    doc.setFontSize(7); doc.setTextColor(...GG);
    doc.text(`Trip Logbook \u00B7 ATO FY 2024\u20132025 \u00B7 Combined (${combined.sessionCount} sessions) \u00B7 Generated ${generatedAt}`, PW / 2, PH - 8, { align: 'center' });
    doc.setDrawColor(230, 230, 230);
    doc.line(ML, PH - 11, PW - MR, PH - 11);
  }
  function sectionTitle(title: string) {
    checkY(10); y += 3;
    doc.setFillColor(...Y); doc.rect(ML, y, CW, 0.7, 'F'); y += 3;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BK);
    doc.text(title.toUpperCase(), ML, y); y += 5;
  }

  doc.setFillColor(...Y); doc.rect(ML, y, CW, 1.2, 'F'); y += 4;
  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BK);
  doc.text('Trip Logbook', ML, y + 6);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GG);
  doc.text('ATO Compliant Vehicle Logbook', ML, y + 11);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GR);
  doc.text(`COMBINED REPORT \u00B7 ${combined.sessionCount} SESSIONS`, ML, y + 16);

  const rightX = PW - MR;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...BK);
  doc.text('Combined Motor Vehicle Logbook', rightX, y + 5, { align: 'right' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GG);
  doc.text(`Generated: ${generatedAt}`, rightX, y + 10, { align: 'right' });
  doc.text('Financial Year: 2024\u20132025', rightX, y + 14.5, { align: 'right' });
  doc.setTextColor(...GY); doc.setFont('helvetica', 'bold');
  doc.text(`Avg Audit Score: ${combined.auditScore}%`, rightX, y + 19, { align: 'right' });

  y += 26;
  doc.setDrawColor(220, 220, 220); doc.line(ML, y, PW - MR, y); y += 6;

  sectionTitle('Vehicle & Logbook Details');

  const grid = [
    ['Car make and model', vehicle.model || vehicle.make || '_______________', 'Car registration number', vehicle.registration || '_______________'],
    ['Engine capacity', vehicle.engineCapacity || '_______________', 'Year of manufacture', vehicle.year || '_______________'],
    ['Logbook start date', allTrips.length > 0 ? allTrips[0].date : '\u2014', 'Logbook end date', allTrips.length > 0 ? allTrips[allTrips.length - 1].date : '\u2014'],
    ['Odometer start (km)', combined.odoRangeStart != null ? combined.odoRangeStart.toLocaleString('en-AU') : '\u2014', 'Odometer end (km)', combined.odoRangeEnd != null ? combined.odoRangeEnd.toLocaleString('en-AU') : '\u2014'],
    ['Total kilometres', `${totalKm.toFixed(1)} km`, 'Percentage business km', `${bizPct.toFixed(1)}%`],
  ];

  const cellH = 9, col1W = CW / 2;
  doc.setDrawColor(220, 220, 220);
  grid.forEach((row, ri) => {
    const rowY = y + ri * cellH;
    checkY(cellH);
    doc.setFillColor(ri % 2 === 0 ? 252 : 248, ri % 2 === 0 ? 252 : 250, ri % 2 === 0 ? 252 : 248);
    doc.rect(ML, rowY, col1W, cellH, 'F'); doc.rect(ML + col1W, rowY, col1W, cellH, 'F');
    doc.setDrawColor(225, 225, 225);
    doc.rect(ML, rowY, col1W, cellH, 'S'); doc.rect(ML + col1W, rowY, col1W, cellH, 'S');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GG);
    doc.text(row[0], ML + 2, rowY + 3.5); doc.text(row[2], ML + col1W + 2, rowY + 3.5);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
    if (ri === 4) { doc.setTextColor(...GY); } else { doc.setTextColor(...BK); }
    doc.text(row[1], ML + 2, rowY + 7.5);
    if (ri === 4) { doc.setTextColor(...GY); } else { doc.setTextColor(...BK); }
    doc.text(row[3], ML + col1W + 2, rowY + 7.5);
  });
  y += grid.length * cellH + 4;

  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GG);
  doc.text(`ATO Logbook Method 2024\u20132025: Business ${bizPct.toFixed(1)}% \u00D7 vehicle costs    \u00B7    Est. deduction: $${totalEst.toFixed(2)}`, ML, y);
  y += 7;

  sectionTitle('Combined Journey List');

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
    doc.setFillColor(240, 240, 240); doc.rect(ML, y, CW, hdrH, 'F');
    doc.setDrawColor(180, 180, 180); doc.rect(ML, y, CW, hdrH, 'S');
    let hx = ML;
    cols.forEach((h, i) => {
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GY);
      doc.text(h, hx + 1.5, y + 4.5); hx += colW[i];
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
    doc.setDrawColor(235, 235, 235); doc.rect(ML, y, CW, rowH, 'S');

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
      if (ci === notesIdx || ci === purposeIdx) { cx2 += colW[ci]; return; }
      doc.setFontSize(6.5); doc.setFont('helvetica', ci === 3 && isBiz ? 'bold' : 'normal');
      if (ci === 3) {
        if (isBiz) doc.setTextColor(...GY); else doc.setTextColor(...GG);
      } else if (ci === 7 && isBiz) {
        doc.setTextColor(...GR);
      } else {
        doc.setTextColor(...BK);
      }
      doc.text(String(cell), cx2 + 1.5, y + topPad + 0.8); cx2 += colW[ci];
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
  doc.setFillColor(240, 240, 240); doc.rect(ML, y, CW, 6.5, 'F');
  doc.setDrawColor(180, 180, 180); doc.rect(ML, y, CW, 6.5, 'S');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BK);
  doc.text('Totals', ML + 1.5, y + 4.5);
  const totKmX = ML + colW.slice(0, 6).reduce((a, b) => a + b, 0);
  doc.text(totalKm.toFixed(1), totKmX + 1.5, y + 4.5);
  doc.setTextColor(...GR);
  doc.text(`$${totalEst.toFixed(2)}`, totKmX + colW[6] + 1.5, y + 4.5);
  y += 10;

  sectionTitle('Compliance Notes');
  checkY(20);
  if (combined.areasToCheck.length > 0) {
    combined.areasToCheck.forEach((a: string) => {
      checkY(5);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      if (a.startsWith('All clear')) { doc.setTextColor(...GR); }
      else { doc.setTextColor(160, 88, 0); }
      doc.text(`${a.startsWith('All clear') ? '\u2713' : '\u2022'}  ${a}`, ML + 2, y);
      y += 5;
    });
  } else {
    doc.setFontSize(8); doc.setTextColor(...GR);
    doc.text('\u2713  All clear \u2014 looking good for ATO compliance', ML + 2, y);
    y += 5;
  }
  y += 5;

  checkY(30);
  sectionTitle('Legal Disclaimer');
  doc.setFillColor(255, 248, 248); doc.setDrawColor(220, 180, 180);
  const discText = 'This report is produced as a vehicle logbook record-keeping tool only. It does not constitute financial, tax, or legal advice. The accuracy of all trip classifications, odometer readings, business purposes, and deduction amounts is the sole legal responsibility of the taxpayer. Consult a registered tax agent (RTA) or licensed accountant for advice specific to your circumstances. All data is user-provided.';
  const discLines = doc.splitTextToSize(discText, CW - 8);
  checkY(discLines.length * 4 + 10);
  doc.rect(ML, y - 2, CW, discLines.length * 4 + 8, 'FD');
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 60, 60);
  doc.text(discLines, ML + 4, y + 3);
  y += discLines.length * 4 + 12;

  addFooter();
  const filename = `combined-logbook-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
}

function exportCombinedCSV(combined: any) {
  const allTrips = combined.trips;
  const headers = [
    'Start Date','End Date','ODO Start (km)','ODO End (km)',
    'Business/Personal','Purpose','Notes','Total Distance (km)',
    'Business km (autofilled)','Business km',
    'Verified'
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
    ];
  });
  const csv = [headers, ...rows]
    .map(r => r.map((v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `combined-logbook-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportScreen() {
  const { state, dispatch } = useApp();
  const [selected, setSelected] = useState<Set<number>>(() => {
    const active = state.savedReports
      .map((r, i) => ({ ...r, globalIdx: i }))
      .filter(r => !r.supersedes);
    return new Set(active.map(r => r.globalIdx));
  });
  const [vehicleModal, setVehicleModal] = useState(false);
  const [exportMode, setExportMode] = useState<'pdf' | 'csv'>('pdf');
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wc_vehicle_specs') || '{}');
      return {
        make: saved.make || '',
        model: [saved.make, saved.model, saved.variant].filter(Boolean).join(' ') || '',
        registration: saved.rego || '',
        engineCapacity: saved.engineCapacity || '',
        year: saved.year || '',
      };
    } catch { return { make: '', model: '', registration: '', engineCapacity: '', year: '' }; }
  });
  const [exportLog, setExportLog] = useState<{ ts: string; type: string; count: number }[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const activeReports = state.savedReports
    .map((r, i) => ({ ...r, globalIdx: i }))
    .filter(r => !r.supersedes);

  function toggleReport(idx: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) { next.delete(idx); } else { next.add(idx); }
      return next;
    });
  }

  function selectAll() {
    if (selected.size === activeReports.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(activeReports.map(r => r.globalIdx)));
    }
  }

  const selectedReports = activeReports.filter(r => selected.has(r.globalIdx));
  const combined = selectedReports.length > 0 ? combineReports(selectedReports) : null;

  const activePeriod = getActivePeriod(state.logbookPeriods);
  const logbookStatus = getLogbookStatus(activePeriod);
  const logbookExpired = logbookStatus.status === 'expired';
  const [autoArchived, setAutoArchived] = useState(false);

  function archiveAfterExport() {
    if (logbookExpired && !autoArchived) {
      dispatch({ type: 'ARCHIVE_LOGBOOK' });
      setAutoArchived(true);
    }
  }

  function handleExport(mode: 'pdf' | 'csv') {
    if (!combined) return;
    if (mode === 'pdf') {
      setExportMode('pdf');
      setVehicleModal(true);
    } else {
      exportCombinedCSV(combined);
      const now = new Date();
      setExportLog(l => [{ ts: now.toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), type: 'CSV', count: selectedReports.length }, ...l]);
      archiveAfterExport();
    }
  }

  function handleVehicleConfirm(v: VehicleDetails) {
    if (!combined) return;
    setVehicleDetails(v);
    setVehicleModal(false);
    generateCombinedPDF(combined, v);
    const now = new Date();
    setExportLog(l => [{ ts: now.toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), type: 'PDF', count: selectedReports.length }, ...l]);
    archiveAfterExport();
  }

  return (
    <div className="flex flex-col h-full" data-testid="export-screen">
      <div className="flex items-center justify-center px-4 pt-2 pb-[2px] flex-shrink-0">
        <div className="flex items-center gap-[5px]">
          <div className="w-[16px] h-[16px] rounded-full flex items-center justify-center font-heading text-[8px] font-bold" style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}>6</div>
          <span className="font-heading font-bold text-[11px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Step 6 <span style={{ color: 'var(--wc-t3)' }}>of 6</span></span>
        </div>
      </div>
      <div className="flex items-center gap-[8px] px-4 pb-[5px] flex-shrink-0">
        <button onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'documents' })} data-testid="button-back" style={{ color: 'var(--wc-text)' }}>
          <ArrowLeft className="w-[22px] h-[22px]" />
        </button>
        <Download className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Export</span>
        <span className="ml-auto text-[11px]" style={{ color: 'var(--wc-t2)' }}>{activeReports.length} active report{activeReports.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex-1 px-[14px] flex flex-col gap-[10px] overflow-y-auto scrollbar-thin pb-2">

        {activeReports.length === 0 ? (
          <div className="py-[40px] text-center">
            <Layers className="w-[32px] h-[32px] mx-auto mb-[12px]" style={{ color: 'rgb(var(--wc-ink) / .15)' }} />
            <div className="text-[14px] mb-[6px]" style={{ color: 'var(--wc-t2)' }}>No reports to export yet</div>
            <div className="text-[12px]">Complete a sort session and save your report first.</div>
          </div>
        ) : (
          <>
            <div className="rounded-[12px] p-[12px_14px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid rgb(var(--wc-ink) / .15)' }}>
              <div className="flex items-center justify-between mb-[8px]">
                <span className="font-heading font-bold text-[13px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-y)' }}>Select Reports to Combine</span>
                <button
                  className="font-heading font-bold text-[11px] uppercase tracking-[.04em] px-[10px] py-[4px] rounded-[6px]"
                  style={{ background: selected.size === activeReports.length ? 'rgb(var(--wc-ink) / .15)' : 'rgb(var(--wc-ink) / .06)', color: selected.size === activeReports.length ? 'var(--wc-y)' : 'white', border: '1px solid rgb(var(--wc-ink) / .1)' }}
                  onClick={selectAll}
                  data-testid="button-select-all"
                >
                  {selected.size === activeReports.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="flex flex-col gap-[6px]">
                {activeReports.map(r => {
                  const isSelected = selected.has(r.globalIdx);
                  const label = SESSION_LABELS[r.sessionId] || r.sessionId;
                  const allTrips = r.trips || [];
                  const bizTrips = allTrips.filter((t: any) => t.type === 'business');
                  const totalKm = allTrips.reduce((s: number, t: any) => s + t.km, 0);
                  return (
                    <button
                      key={r.globalIdx}
                      className="flex items-center gap-[10px] rounded-[10px] p-[10px_12px] text-left cursor-pointer transition-all"
                      style={{
                        background: isSelected ? 'rgb(var(--wc-ink) / .08)' : 'rgb(var(--wc-ink) / .02)',
                        border: isSelected ? '1.5px solid rgb(var(--wc-ink) / .35)' : '1px solid rgb(var(--wc-ink) / .06)',
                      }}
                      onClick={() => toggleReport(r.globalIdx)}
                      data-testid={`select-report-${r.globalIdx}`}
                    >
                      <div
                        className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center flex-shrink-0"
                        style={{ background: isSelected ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .06)', border: isSelected ? 'none' : '1.5px solid rgb(var(--wc-ink) / .12)' }}
                      >
                        {isSelected && <Check className="w-[14px] h-[14px]" style={{ color: 'var(--wc-bg)' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-bold text-[12px] truncate" style={{ color: 'var(--wc-text)' }}>{label}</div>
                        <div className="font-data text-[10px]">{r.timestamp}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-data text-[11px]" style={{ color: 'var(--wc-y)' }}>{bizTrips.length} biz</div>
                        <div className="font-data text-[10px]">{totalKm.toFixed(0)} km</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {combined && (
              <div className="rounded-[12px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
                <button
                  className="w-full flex items-center justify-between p-[14px_16px] cursor-pointer"
                  onClick={() => setPreviewOpen(!previewOpen)}
                  data-testid="button-toggle-preview"
                >
                  <div className="flex items-center gap-[8px]">
                    <BarChart2 className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
                    <span className="font-heading font-bold text-[13px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-y)' }}>Combined Preview</span>
                  </div>
                  {previewOpen
                    ? <ChevronUp className="w-[16px] h-[16px]" style={{ color: 'var(--wc-text)' }} />
                    : <ChevronDown className="w-[16px] h-[16px]" style={{ color: 'var(--wc-text)' }} />
                  }
                </button>

                {previewOpen && (
                  <div className="px-[16px] pb-[14px]" style={{ borderTop: '1px solid var(--wc-border)' }}>
                    <div className="grid grid-cols-3 gap-[8px] mt-[12px]">
                      {[
                        { label: 'Total Trips', val: `${combined.trips.length}`, color: 'var(--wc-text)' },
                        { label: 'Business', val: `${combined.bizCount}`, color: 'var(--wc-y)' },
                        { label: 'Personal', val: `${combined.perCount}`, color: 'var(--wc-text)' },
                        { label: 'Total km', val: `${combined.totalKm.toFixed(0)}`, color: 'var(--wc-text)' },
                        { label: 'Business km', val: `${combined.bizKm.toFixed(0)}`, color: 'var(--wc-y)' },
                        { label: 'Biz %', val: `${combined.bizPct.toFixed(1)}%`, color: 'var(--wc-y)' },
                      ].map((s, i) => (
                        <div key={i} className="rounded-[8px] p-[8px] text-center" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px solid rgb(var(--wc-ink) / .05)' }}>
                          <div className="font-heading font-bold text-[18px]" style={{ color: s.color }}>{s.val}</div>
                          <div className="font-data text-[9px] uppercase tracking-[.08em]">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-[12px] rounded-[10px] p-[12px_14px] text-center" style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)' }}>
                      <div className="font-data text-[10px] uppercase tracking-[.08em] mb-[2px]" style={{ color: 'var(--wc-t3)' }}>Estimated Deduction (Logbook Method)</div>
                      <div className="font-heading font-extrabold text-[28px]" style={{ color: 'var(--wc-gr)' }}>${combined.totalEst.toFixed(2)}</div>
                      <div className="font-data text-[10px] mt-[2px]" style={{ color: 'var(--wc-t3)' }}>{combined.bizPct.toFixed(1)}% biz use &times; vehicle costs</div>
                    </div>

                    {combined.odoRangeStart != null && combined.odoRangeEnd != null && (
                      <div className="mt-[10px] flex gap-[10px]">
                        <div className="flex-1 rounded-[8px] p-[8px] text-center" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px solid rgb(var(--wc-ink) / .05)' }}>
                          <div className="font-data text-[9px] uppercase tracking-[.08em]">Odo Start</div>
                          <div className="font-heading font-bold text-[14px]" style={{ color: 'var(--wc-text)' }}>{combined.odoRangeStart.toLocaleString('en-AU')} km</div>
                        </div>
                        <div className="flex-1 rounded-[8px] p-[8px] text-center" style={{ background: 'rgb(var(--wc-ink) / .02)', border: '1px solid rgb(var(--wc-ink) / .05)' }}>
                          <div className="font-data text-[9px] uppercase tracking-[.08em]">Odo End</div>
                          <div className="font-heading font-bold text-[14px]" style={{ color: 'var(--wc-text)' }}>{combined.odoRangeEnd.toLocaleString('en-AU')} km</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {exportLog.length > 0 && (
              <div className="rounded-[12px] p-[10px_14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
                <div className="font-heading font-bold text-[10px] uppercase tracking-[.05em] mb-[6px]">Export History</div>
                {exportLog.slice(0, 5).map((e, i) => (
                  <div key={i} className="flex items-center gap-[7px] py-[4px]" style={{ borderBottom: i < exportLog.length - 1 ? '1px solid rgb(var(--wc-ink) / .04)' : 'none' }}>
                    <Clock className="w-[10px] h-[10px] flex-shrink-0" />
                    <span className="font-data text-[10px] flex-1">{e.ts}</span>
                    <span className="font-heading font-bold text-[11px]" style={{ color: e.type === 'PDF' ? 'var(--wc-y)' : 'var(--wc-gr)' }}>
                      {e.type} \u00B7 {e.count} report{e.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {combined && (
        <div className="flex-shrink-0 px-[14px] py-[10px] flex gap-[8px]" style={{ background: 'var(--wc-nav-bg)', borderTop: '1px solid var(--wc-border)' }}>
          <button
            className="flex-1 flex items-center justify-center gap-[6px] rounded-[12px] py-[14px] font-heading font-extrabold text-[14px] uppercase tracking-[.05em] cursor-pointer"
            style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
            onClick={() => handleExport('pdf')}
            data-testid="button-combined-pdf"
          >
            <FileText className="w-[16px] h-[16px]" />
            Combined PDF
          </button>
          <button
            className="flex items-center justify-center gap-[6px] rounded-[12px] px-[18px] py-[14px] font-heading font-extrabold text-[13px] uppercase tracking-[.05em] cursor-pointer"
            style={{ background: 'rgba(34,197,94,.1)', border: '1.5px solid rgba(34,197,94,.3)', color: 'var(--wc-gr)' }}
            onClick={() => handleExport('csv')}
            data-testid="button-combined-csv"
          >
            <Download className="w-[14px] h-[14px]" />
            CSV
          </button>
        </div>
      )}

      {vehicleModal && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center" style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)' }} onClick={() => setVehicleModal(false)}>
          <div className="w-full max-w-[390px] rounded-t-[20px] overflow-hidden" style={{ background: 'var(--wc-card)', border: '1.5px solid rgb(var(--wc-ink) / .25)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-[16px] py-[13px]" style={{ borderBottom: '1px solid var(--wc-border)' }}>
              <div className="flex items-center gap-[8px]">
                <FileText className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
                <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-text)' }}>Vehicle Details</span>
              </div>
              <button onClick={() => setVehicleModal(false)} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgb(var(--wc-ink) / .06)' }}>
                <XCircle className="w-[13px] h-[13px]" />
              </button>
            </div>
            <div className="p-[14px_16px] flex flex-col gap-[8px]">
              <p className="text-[11px] leading-[1.5]">
                These details appear on your combined ATO logbook PDF.
              </p>
              {[
                { key: 'make' as const, label: 'Car make', placeholder: 'e.g. Toyota' },
                { key: 'model' as const, label: 'Car model', placeholder: 'e.g. HiLux SR5' },
                { key: 'registration' as const, label: 'Registration number', placeholder: 'e.g. ABC-123' },
                { key: 'engineCapacity' as const, label: 'Engine capacity', placeholder: 'e.g. 2.8L' },
                { key: 'year' as const, label: 'Year of manufacture', placeholder: 'e.g. 2022' },
              ].map(f => (
                <div key={f.key}>
                  <div className="font-heading font-bold text-[10px] uppercase tracking-[.05em] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>{f.label}</div>
                  <input
                    className="w-full rounded-[8px] px-[10px] py-[8px] font-heading text-[13px] outline-none"
                    style={{ color: 'var(--wc-text)', background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}
                    placeholder={f.placeholder}
                    value={vehicleDetails[f.key]}
                    onChange={e => setVehicleDetails(v => ({ ...v, [f.key]: e.target.value }))}
                    data-testid={`input-export-vehicle-${f.key}`}
                  />
                </div>
              ))}
              <div className="flex gap-[8px] mt-[4px]">
                <button className="flex-1 rounded-[10px] py-[11px] font-heading font-extrabold text-[13px] uppercase tracking-[.05em] cursor-pointer"
                  style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
                  onClick={() => handleVehicleConfirm(vehicleDetails)}
                  data-testid="button-generate-combined-pdf">
                  Generate Combined PDF
                </button>
                <button className="rounded-[10px] px-[14px] py-[11px] font-heading font-bold text-[12px] uppercase cursor-pointer"
                  style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)', color: 'var(--wc-t2)' }}
                  onClick={() => setVehicleModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {autoArchived && (
        <div className="flex-shrink-0 mx-[14px] mb-[8px] rounded-[12px] p-[12px_14px] flex items-center gap-[10px] animate-pop"
          style={{ background: 'rgba(34,197,94,.08)', border: '1.5px solid rgba(34,197,94,.25)' }}>
          <Archive className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'var(--wc-gr)' }} />
          <div>
            <div className="font-heading font-bold text-[12px] uppercase tracking-[.04em]" style={{ color: 'var(--wc-gr)' }}>Logbook Archived</div>
            <div className="text-[10px]" style={{ color: 'var(--wc-t2)' }}>Your 12-week logbook has been locked and archived.</div>
          </div>
        </div>
      )}
    </div>
  );
}