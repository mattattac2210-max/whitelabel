import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { calcLogbookDeduction, getVehicleCosts } from '@/lib/trip-data';
import { BottomNav } from './bottom-nav';
import {
  Download, FileText, Check, ChevronDown, ChevronUp,
  XCircle, Layers, BarChart2, Clock,
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
  allTrips.sort((a: any, b: any) => {
    const pa = a.date.split('/');
    const pb = b.date.split('/');
    const da = new Date(parseInt(pa[2]), parseInt(pa[1]) - 1, parseInt(pa[0]));
    const db = new Date(parseInt(pb[2]), parseInt(pb[1]) - 1, parseInt(pb[0]));
    return da.getTime() - db.getTime();
  });
  const bizTrips = allTrips.filter((t: any) => t.type === 'business');
  const totalKm = allTrips.reduce((s: number, t: any) => s + t.km, 0);
  const bizKm = bizTrips.reduce((s: number, t: any) => s + t.km, 0);
  const perKm = totalKm - bizKm;
  const bizPct = totalKm > 0 ? ((bizKm / totalKm) * 100) : 0;
  const totalEst = calcLogbookDeduction(bizKm, totalKm);

  const odoStarts = reports.map(r => r.odoRangeStart).filter((v: any) => v != null);
  const odoEnds = reports.map(r => r.odoRangeEnd).filter((v: any) => v != null);
  const odoRangeStart = odoStarts.length > 0 ? Math.min(...odoStarts) : null;
  const odoRangeEnd = odoEnds.length > 0 ? Math.max(...odoEnds) : null;

  const avgAudit = reports.length > 0
    ? Math.round(reports.reduce((s, r) => s + (r.auditScore || 0), 0) / reports.length)
    : 0;

  const allAreas = reports.flatMap(r => r.areasToCheck || []);
  const uniqueAreas = [...new Set(allAreas)];

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

  const Y: [number, number, number] = [245, 196, 0];
  const GR: [number, number, number] = [26, 107, 58];
  const GY: [number, number, number] = [160, 120, 10];
  const BK: [number, number, number] = [17, 17, 17];
  const GG: [number, number, number] = [120, 120, 120];

  const allTrips = combined.trips;
  const bizTrips = allTrips.filter((t: any) => t.type === 'business');
  const totalKm = combined.totalKm;
  const bizKm = combined.bizKm;
  const bizPct = totalKm > 0 ? ((bizKm / totalKm) * 100).toFixed(2) : '0.00';
  const totalEst = combined.totalEst;
  const generatedAt = new Date().toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  function addPage() { doc.addPage(); y = MT; addFooter(); }
  function checkY(needed: number) { if (y + needed > PH - 16) addPage(); }
  function addFooter() {
    doc.setFontSize(7); doc.setTextColor(...GG);
    doc.text(`WorkCar \u00B7 workcar.com.au \u00B7 ATO FY 2024\u20132025 \u00B7 Combined (${combined.sessionCount} sessions) \u00B7 Generated ${generatedAt}`, PW / 2, PH - 8, { align: 'center' });
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
  doc.text('Work', ML, y + 6);
  const workW = doc.getTextWidth('Work');
  doc.setTextColor(...GY); doc.text('Car', ML + workW, y + 6);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GG);
  doc.text('workcar.com.au  \u00B7  ATO Compliant Vehicle Logbook', ML, y + 11);
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
    ['Car make and model', vehicle.make || '_______________', 'Car registration number', vehicle.registration || '_______________'],
    ['Engine capacity', vehicle.engineCapacity || '_______________', 'Year of manufacture', vehicle.year || '_______________'],
    ['Logbook start date', allTrips.length > 0 ? allTrips[0].date : '\u2014', 'Logbook end date', allTrips.length > 0 ? allTrips[allTrips.length - 1].date : '\u2014'],
    ['Odometer start (km)', combined.odoRangeStart != null ? combined.odoRangeStart.toLocaleString('en-AU') : '\u2014', 'Odometer end (km)', combined.odoRangeEnd != null ? combined.odoRangeEnd.toLocaleString('en-AU') : '\u2014'],
    ['Total kilometres', `${totalKm.toFixed(1)} km`, 'Percentage business km', `${bizPct}%`],
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

  const cols = ['Date','ODO start','ODO end','Type','Purpose','Notes','km','Biz km','Biz km'];
  const colW = [20, 18, 18, 15, 24, 30, 13, 13, 20];
  const hdrH = 6.5;

  doc.setFillColor(250, 246, 220); doc.rect(ML, y, CW, hdrH, 'F');
  doc.setDrawColor(210, 190, 80); doc.rect(ML, y, CW, hdrH, 'S');
  let cx = ML;
  cols.forEach((h, i) => {
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GY);
    doc.text(h, cx + 1.5, y + 4.5); cx += colW[i];
  });
  y += hdrH;

  allTrips.forEach((t: any) => {
    checkY(6);
    const isBiz = t.type === 'business';
    doc.setFillColor(isBiz ? 255 : 255, isBiz ? 253 : 255, isBiz ? 240 : 255);
    doc.rect(ML, y, CW, 5.8, 'F');
    doc.setDrawColor(235, 235, 235); doc.rect(ML, y, CW, 5.8, 'S');
    const purposeStr = isBiz && t.purposeLabel ? t.purposeLabel : '\u2014';
    const noteStr = t.notes ? (t.notes.length > 14 ? t.notes.slice(0, 13) + '\u2026' : t.notes) : '\u2014';
    const cells = [
      t.date,
      t.odoStart?.toLocaleString('en-AU') ?? '\u2014',
      t.odoEnd?.toLocaleString('en-AU') ?? '\u2014',
      isBiz ? 'Business' : 'Personal',
      purposeStr.length > 10 ? purposeStr.slice(0, 9) + '\u2026' : purposeStr,
      isBiz ? noteStr : '\u2014',
      t.km.toFixed(1),
      isBiz ? t.km.toFixed(1) : '',
      isBiz ? t.km.toFixed(1) : '0',
    ];
    let cx2 = ML;
    cells.forEach((cell, ci) => {
      doc.setFontSize(7); doc.setFont('helvetica', ci === 3 && isBiz ? 'bold' : 'normal');
      if (ci === 3) {
        if (isBiz) doc.setTextColor(...GY); else doc.setTextColor(...GG);
      } else if (ci === 4 && isBiz) {
        doc.setTextColor(...GY);
      } else if (ci === 5 && isBiz && t.notes) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...GG);
      } else if (ci === 8 && isBiz) {
        doc.setTextColor(...GR);
      } else {
        doc.setTextColor(...BK);
      }
      doc.text(String(cell), cx2 + 1.5, y + 4); cx2 += colW[ci];
    });

    y += 5.8;
  });

  checkY(7);
  doc.setFillColor(250, 246, 220); doc.rect(ML, y, CW, 6.5, 'F');
  doc.setDrawColor(210, 190, 80); doc.rect(ML, y, CW, 6.5, 'S');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BK);
  doc.text('Totals', ML + 1.5, y + 4.5);
  const totStart = colW.slice(0, 6).reduce((a, b) => a + b, 0);
  doc.text(totalKm.toFixed(1), ML + totStart + 1.5, y + 4.5);
  doc.setTextColor(...GY);
  doc.text(bizKm.toFixed(1), ML + totStart + colW[6] + 1.5, y + 4.5);
  doc.setTextColor(...GR);
  doc.text(`$${totalEst.toFixed(2)}`, ML + totStart + colW[6] + colW[7] + 1.5, y + 4.5);
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
  const discText = 'This report is produced by WorkCar (workcar.com.au) as a vehicle logbook record-keeping tool only. It does not constitute financial, tax, or legal advice. The accuracy of all trip classifications, odometer readings, business purposes, and deduction amounts is the sole legal responsibility of the taxpayer. Consult a registered tax agent (RTA) or licensed accountant for advice specific to your circumstances. All data is user-provided.';
  const discLines = doc.splitTextToSize(discText, CW - 8);
  checkY(discLines.length * 4 + 10);
  doc.rect(ML, y - 2, CW, discLines.length * 4 + 8, 'FD');
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 60, 60);
  doc.text(discLines, ML + 4, y + 3);
  y += discLines.length * 4 + 12;

  addFooter();
  const filename = `workcar-combined-logbook-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
}

function exportCombinedCSV(combined: any) {
  const allTrips = combined.trips;
  const headers = [
    'Start Date','End Date','ODO Start (km)','ODO End (km)',
    'Business/Personal','Purpose','Notes','Total Distance (km)',
    'Business km (autofilled)','Business km',
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
  a.download = `workcar-combined-logbook-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportScreen() {
  const { state } = useApp();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [vehicleModal, setVehicleModal] = useState(false);
  const [exportMode, setExportMode] = useState<'pdf' | 'csv'>('pdf');
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({ make: '', model: '', registration: '', engineCapacity: '', year: '' });
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

  function handleExport(mode: 'pdf' | 'csv') {
    if (!combined) return;
    if (mode === 'pdf') {
      setExportMode('pdf');
      setVehicleModal(true);
    } else {
      exportCombinedCSV(combined);
      const now = new Date();
      setExportLog(l => [{ ts: now.toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), type: 'CSV', count: selectedReports.length }, ...l]);
    }
  }

  function handleVehicleConfirm(v: VehicleDetails) {
    if (!combined) return;
    setVehicleDetails(v);
    setVehicleModal(false);
    generateCombinedPDF(combined, v);
    const now = new Date();
    setExportLog(l => [{ ts: now.toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), type: 'PDF', count: selectedReports.length }, ...l]);
  }

  return (
    <div className="flex flex-col h-full" data-testid="export-screen">
      <div className="flex items-center gap-[8px] px-4 pt-2 pb-[5px] flex-shrink-0">
        <Download className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
        <span className="font-heading font-extrabold text-[20px] uppercase tracking-[.04em] text-white">Export</span>
        <span className="ml-auto text-[11px] text-white">{activeReports.length} active report{activeReports.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex-1 px-[14px] flex flex-col gap-[10px] overflow-y-auto scrollbar-thin pb-2">

        {activeReports.length === 0 ? (
          <div className="py-[40px] text-center">
            <Layers className="w-[32px] h-[32px] mx-auto mb-[12px]" style={{ color: 'rgba(255,255,255,.15)' }} />
            <div className="text-[14px] text-white mb-[6px]">No reports to export yet</div>
            <div className="text-[12px] text-white/50">Complete a sort session and save your report first.</div>
          </div>
        ) : (
          <>
            <div className="rounded-[12px] p-[12px_14px]" style={{ background: 'rgba(245,196,0,.04)', border: '1px solid rgba(245,196,0,.15)' }}>
              <div className="flex items-center justify-between mb-[8px]">
                <span className="font-heading font-bold text-[13px] uppercase tracking-[.05em]" style={{ color: 'var(--wc-y)' }}>Select Reports to Combine</span>
                <button
                  className="font-heading font-bold text-[11px] uppercase tracking-[.04em] px-[10px] py-[4px] rounded-[6px]"
                  style={{ background: selected.size === activeReports.length ? 'rgba(245,196,0,.15)' : 'rgba(255,255,255,.06)', color: selected.size === activeReports.length ? 'var(--wc-y)' : 'white', border: '1px solid rgba(255,255,255,.1)' }}
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
                        background: isSelected ? 'rgba(245,196,0,.08)' : 'rgba(255,255,255,.02)',
                        border: isSelected ? '1.5px solid rgba(245,196,0,.35)' : '1px solid rgba(255,255,255,.06)',
                      }}
                      onClick={() => toggleReport(r.globalIdx)}
                      data-testid={`select-report-${r.globalIdx}`}
                    >
                      <div
                        className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center flex-shrink-0"
                        style={{ background: isSelected ? 'var(--wc-y)' : 'rgba(255,255,255,.06)', border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,.12)' }}
                      >
                        {isSelected && <Check className="w-[14px] h-[14px] text-black" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-bold text-[12px] text-white truncate">{label}</div>
                        <div className="font-data text-[10px] text-white/50">{r.timestamp}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-data text-[11px]" style={{ color: 'var(--wc-y)' }}>{bizTrips.length} biz</div>
                        <div className="font-data text-[10px] text-white/50">{totalKm.toFixed(0)} km</div>
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
                    ? <ChevronUp className="w-[16px] h-[16px] text-white" />
                    : <ChevronDown className="w-[16px] h-[16px] text-white" />
                  }
                </button>

                {previewOpen && (
                  <div className="px-[16px] pb-[14px]" style={{ borderTop: '1px solid var(--wc-border)' }}>
                    <div className="grid grid-cols-3 gap-[8px] mt-[12px]">
                      {[
                        { label: 'Total Trips', val: `${combined.trips.length}`, color: 'white' },
                        { label: 'Business', val: `${combined.bizCount}`, color: 'var(--wc-y)' },
                        { label: 'Personal', val: `${combined.perCount}`, color: 'white' },
                        { label: 'Total km', val: `${combined.totalKm.toFixed(0)}`, color: 'white' },
                        { label: 'Business km', val: `${combined.bizKm.toFixed(0)}`, color: 'var(--wc-y)' },
                        { label: 'Biz %', val: `${combined.bizPct.toFixed(1)}%`, color: 'var(--wc-y)' },
                      ].map((s, i) => (
                        <div key={i} className="rounded-[8px] p-[8px] text-center" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}>
                          <div className="font-heading font-bold text-[18px]" style={{ color: s.color }}>{s.val}</div>
                          <div className="font-data text-[9px] uppercase tracking-[.08em] text-white/50">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-[12px] rounded-[10px] p-[12px_14px] text-center" style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)' }}>
                      <div className="font-data text-[10px] uppercase tracking-[.08em] text-white/60 mb-[2px]">Estimated Deduction (Logbook Method)</div>
                      <div className="font-heading font-extrabold text-[28px]" style={{ color: 'var(--wc-gr)' }}>${combined.totalEst.toFixed(2)}</div>
                      <div className="font-data text-[10px] text-white/40 mt-[2px]">{combined.bizPct.toFixed(1)}% biz use &times; vehicle costs</div>
                    </div>

                    {combined.odoRangeStart != null && combined.odoRangeEnd != null && (
                      <div className="mt-[10px] flex gap-[10px]">
                        <div className="flex-1 rounded-[8px] p-[8px] text-center" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}>
                          <div className="font-data text-[9px] uppercase tracking-[.08em] text-white/50">Odo Start</div>
                          <div className="font-heading font-bold text-[14px] text-white">{combined.odoRangeStart.toLocaleString('en-AU')} km</div>
                        </div>
                        <div className="flex-1 rounded-[8px] p-[8px] text-center" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}>
                          <div className="font-data text-[9px] uppercase tracking-[.08em] text-white/50">Odo End</div>
                          <div className="font-heading font-bold text-[14px] text-white">{combined.odoRangeEnd.toLocaleString('en-AU')} km</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {exportLog.length > 0 && (
              <div className="rounded-[12px] p-[10px_14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
                <div className="font-heading font-bold text-[10px] uppercase tracking-[.05em] mb-[6px] text-white/60">Export History</div>
                {exportLog.slice(0, 5).map((e, i) => (
                  <div key={i} className="flex items-center gap-[7px] py-[4px]" style={{ borderBottom: i < exportLog.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                    <Clock className="w-[10px] h-[10px] flex-shrink-0 text-white/30" />
                    <span className="font-data text-[10px] flex-1 text-white/50">{e.ts}</span>
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
        <div className="flex-shrink-0 px-[14px] py-[10px] flex gap-[8px]" style={{ background: 'rgba(10,10,10,.97)', borderTop: '1px solid var(--wc-border)' }}>
          <button
            className="flex-1 flex items-center justify-center gap-[6px] rounded-[12px] py-[14px] font-heading font-extrabold text-[14px] uppercase tracking-[.05em] cursor-pointer"
            style={{ background: 'var(--wc-y)', color: '#000' }}
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

      <BottomNav />

      {vehicleModal && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center" style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)' }} onClick={() => setVehicleModal(false)}>
          <div className="w-full max-w-[390px] rounded-t-[20px] overflow-hidden" style={{ background: 'var(--wc-card)', border: '1.5px solid rgba(245,196,0,.25)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-[16px] py-[13px]" style={{ borderBottom: '1px solid var(--wc-border)' }}>
              <div className="flex items-center gap-[8px]">
                <FileText className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
                <span className="font-heading font-extrabold text-[15px] uppercase tracking-[.04em] text-white">Vehicle Details</span>
              </div>
              <button onClick={() => setVehicleModal(false)} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,.06)' }}>
                <XCircle className="w-[13px] h-[13px] text-white/40" />
              </button>
            </div>
            <div className="p-[14px_16px] flex flex-col gap-[8px]">
              <p className="text-[11px] leading-[1.5] text-white/50">
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
                  <div className="font-heading font-bold text-[10px] uppercase tracking-[.05em] mb-[4px] text-white/60">{f.label}</div>
                  <input
                    className="w-full rounded-[8px] px-[10px] py-[8px] font-heading text-[13px] text-white outline-none"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)' }}
                    placeholder={f.placeholder}
                    value={vehicleDetails[f.key]}
                    onChange={e => setVehicleDetails(v => ({ ...v, [f.key]: e.target.value }))}
                    data-testid={`input-export-vehicle-${f.key}`}
                  />
                </div>
              ))}
              <div className="flex gap-[8px] mt-[4px]">
                <button className="flex-1 rounded-[10px] py-[11px] font-heading font-extrabold text-[13px] uppercase tracking-[.05em] cursor-pointer text-black"
                  style={{ background: 'var(--wc-y)' }}
                  onClick={() => handleVehicleConfirm(vehicleDetails)}
                  data-testid="button-generate-combined-pdf">
                  Generate Combined PDF
                </button>
                <button className="rounded-[10px] px-[14px] py-[11px] font-heading font-bold text-[12px] uppercase cursor-pointer"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--wc-border)', color: 'white/60' }}
                  onClick={() => setVehicleModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}