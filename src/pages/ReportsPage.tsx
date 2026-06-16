import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download, FileText, TrendingUp, Package, Users, Phone, ClipboardList, Truck, BarChart3, Target } from 'lucide-react';
import { reportsApi } from '../api/reports.api';
import { format } from 'date-fns';
import { drawHeader, drawFooter, PDF_CONFIG, PDF_COLORS } from '../utils/pdfLayout';
import { getLogoBase64 } from '../utils/pdfLogo';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#0ea5e9', '#84cc16'];
const CHART_HEIGHT = 350;

function getColumnStyles(type: string): { styles: Record<number, { cellWidth: number }>; tableWidth: number } | undefined {
  const padPerCol = 2;
  const available = 190;
  const def = (widths: number[]) => {
    const total = widths.reduce((s, w) => s + w, 0);
    return { styles: Object.fromEntries(widths.map((w, i) => [i, { cellWidth: w }])), tableWidth: total };
  };
  switch (type) {
    case 'rentabilidad':
      return def([54, 34, 22, 22, 22, 22]);
    case 'ventas':
      return def([7, 18, 35, 25, 23, 17, 15, 18]);
    case 'inventario':
      return def([42, 28, 34, 34, 36]);
    case 'top-productos':
      return def([7, 38, 22, 24, 17, 27, 27]);
    case 'proveedores':
      return def([44, 17, 45, 28, 36]);
    case 'productividad':
      return def([30, 18, 20, 20, 12, 15, 24, 19]);
    case 'clientes':
    case 'actividades':
    case 'pedidos-especiales':
      return def([85, 85]);
    default:
      return undefined;
  }
}

function fmtVal(v: number): string {
  return v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v * 10) / 10);
}

function drawBarChart(doc: jsPDF, items: { label: string; values: { name: string; value: number; color: string }[] }[], x: number, y: number, w: number, h: number, title?: string) {
  if (!items.length) return y;
  const hasMultipleSeries = items[0]?.values.length > 1;
  const seriesCount = hasMultipleSeries ? items[0]!.values.length : 1;
  const marginL = 36;
  const marginR = 8;
  const marginT = title ? 14 : 4;
  const chartW = w - marginL - marginR;
  const chartH = h - marginT - 16;
  const chartX = x + marginL;
  const chartY = y + marginT;
  const barW = chartW;

  if (title) { doc.setFontSize(10); doc.setTextColor(80, 80, 80); doc.text(title, x + w / 2, y + 4, { align: 'center' }); }

  const maxVal = Math.max(...items.flatMap((i) => i.values.map((v) => v.value)));
  const roundedMax = Math.ceil(maxVal * 1.1 / (10 ** Math.floor(Math.log10(maxVal || 1)))) * (10 ** Math.floor(Math.log10(maxVal || 1))) || 1;
  const gridSteps = 4;

  doc.setDrawColor(220, 220, 220);
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  for (let i = 0; i <= gridSteps; i++) {
    const val = (roundedMax / gridSteps) * i;
    const gy = chartY + chartH - (chartH / gridSteps) * i;
    doc.line(chartX, gy, chartX + chartW, gy);
    doc.text(fmtVal(val), chartX - 3, gy + 2, { align: 'right' });
  }

  const barGap = 4;
  const groupWidth = items.length > 1 ? (barW - barGap * (items.length)) / items.length : barW / 2;
  const seriesGap = hasMultipleSeries ? Math.min(3, groupWidth / (seriesCount * 2)) : 0;
  const barItemW = hasMultipleSeries ? (groupWidth - seriesGap * (seriesCount + 1)) / seriesCount : groupWidth;

  items.forEach((item, i) => {
    const gx = chartX + (groupWidth + barGap) * i;
    item.values.forEach((val, si) => {
      const bx = gx + (hasMultipleSeries ? seriesGap + (barItemW + seriesGap) * si : (groupWidth - barItemW) / 2);
      const barHeight = (val.value / roundedMax) * chartH;
      const by = chartY + chartH - barHeight;
      doc.setFillColor(parseInt(val.color.slice(1, 3), 16), parseInt(val.color.slice(3, 5), 16), parseInt(val.color.slice(5, 7), 16));
      doc.rect(bx, by, Math.max(4, barItemW), barHeight, 'F');
      // Value label on top of bar
      if (barHeight > 8) {
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text(fmtVal(val.value), bx + Math.max(4, barItemW) / 2, by + 4, { align: 'center' });
      } else {
        doc.setFontSize(6);
        doc.setTextColor(80, 80, 80);
        doc.text(fmtVal(val.value), bx + Math.max(4, barItemW) / 2, by - 2, { align: 'center' });
      }
    });
    // X label
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    const label = item.label.length > 14 ? item.label.slice(0, 13) + '…' : item.label;
    doc.text(label, gx + groupWidth / 2, chartY + chartH + 8, { align: 'center' });
  });

  // Legend for multi-series
  if (hasMultipleSeries) {
    const legendY = chartY + chartH + 18;
    items[0]!.values.forEach((val, si) => {
      const lx = x + 10 + si * 60;
      doc.setFillColor(parseInt(val.color.slice(1, 3), 16), parseInt(val.color.slice(3, 5), 16), parseInt(val.color.slice(5, 7), 16));
      doc.rect(lx, legendY, 8, 4, 'F');
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.text(val.name, lx + 10, legendY + 4);
    });
    return legendY + 10;
  }

  return chartY + chartH + 26;
}

function drawLineChart(doc: jsPDF, points: { label: string; values: { name: string; value: number; color: string }[] }[], x: number, y: number, w: number, h: number, title?: string) {
  if (!points.length) return y;
  const marginL = 36;
  const marginR = 8;
  const marginT = title ? 14 : 4;
  const chartW = w - marginL - marginR;
  const chartH = h - marginT - 20;
  const chartX = x + marginL;
  const chartY = y + marginT;

  if (title) { doc.setFontSize(10); doc.setTextColor(80, 80, 80); doc.text(title, x + w / 2, y + 4, { align: 'center' }); }

  const maxVal = Math.max(...points.flatMap((p) => p.values.map((v) => v.value)));
  const roundedMax = Math.ceil(maxVal * 1.1 / (10 ** Math.floor(Math.log10(maxVal || 1)))) * (10 ** Math.floor(Math.log10(maxVal || 1))) || 1;
  const gridSteps = 4;

  doc.setDrawColor(220, 220, 220);
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  for (let i = 0; i <= gridSteps; i++) {
    const val = (roundedMax / gridSteps) * i;
    const gy = chartY + chartH - (chartH / gridSteps) * i;
    doc.line(chartX, gy, chartX + chartW, gy);
    doc.text(fmtVal(val), chartX - 3, gy + 2, { align: 'right' });
  }

  const seriesColors = ['#6366f1', '#10b981'];
  const seriesNames = points.length > 0 ? points[0]!.values.map((v) => v.name) : [];

  seriesNames.forEach((name, si) => {
    const color = seriesColors[si % seriesColors.length];
    const pts = points.map((p, idx) => ({
      px: chartX + idx * (chartW / Math.max(1, points.length - 1)),
      py: chartY + chartH - (p.values[si]?.value ?? 0) / roundedMax * chartH,
      val: p.values[si]?.value ?? 0,
    }));

    doc.setDrawColor(parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16));
    doc.setLineWidth(1);
    for (let j = 1; j < pts.length; j++) {
      doc.line(pts[j - 1]!.px, pts[j - 1]!.py, pts[j]!.px, pts[j]!.py);
    }

    pts.forEach((pt) => {
      doc.setFillColor(parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16));
      doc.circle(pt.px, pt.py, 1.5, 'F');
      // Value label above dot
      doc.setFontSize(6);
      doc.setTextColor(80, 80, 80);
      doc.text(fmtVal(pt.val), pt.px, pt.py - 3, { align: 'center' });
    });

    const step = Math.max(1, Math.floor(points.length / 12));
    points.forEach((p, i) => {
      if (i % step === 0 || i === points.length - 1) {
        doc.setFontSize(6);
        doc.setTextColor(80, 80, 80);
        const label = p.label.length > 8 ? p.label.slice(0, 7) + '…' : p.label;
        doc.text(label, chartX + i * (chartW / Math.max(1, points.length - 1)), chartY + chartH + 8, { align: 'center' });
      }
    });
  });

  if (seriesNames.length > 1) {
    const legendY = chartY + chartH + 18;
    seriesNames.forEach((name, si) => {
      const lx = x + 10 + si * 50;
      doc.setFillColor(parseInt(seriesColors[si % seriesColors.length]!.slice(1, 3), 16), parseInt(seriesColors[si % seriesColors.length]!.slice(3, 5), 16), parseInt(seriesColors[si % seriesColors.length]!.slice(5, 7), 16));
      doc.rect(lx, legendY, 8, 4, 'F');
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.text(name, lx + 10, legendY + 4);
    });
    return legendY + 10;
  }

  return chartY + chartH + 26;
}

function drawPieAsBars(doc: jsPDF, items: { name: string; value: number }[], x: number, y: number, w: number, h: number, title?: string) {
  if (!items.length) return y;
  if (title) { doc.setFontSize(10); doc.setTextColor(80, 80, 80); doc.text(title, x + w / 2, y + 4, { align: 'center' }); y += 8; }
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total) return y + 10;
  const barH = 10;
  const labelW = 60;
  const barMaxW = w - labelW - 14;
  const maxVal = Math.max(...items.map((i) => i.value));

  items.forEach((item, idx) => {
    const by = y + idx * (barH + 4);
    const pct = ((item.value / total) * 100).toFixed(1);
    const bw = (item.value / maxVal) * barMaxW;

    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    const label = item.name.length > 18 ? item.name.slice(0, 17) + '…' : item.name;
    doc.text(label, x, by + 7);

    doc.setFillColor(parseInt(COLORS[idx % COLORS.length]!.slice(1, 3), 16), parseInt(COLORS[idx % COLORS.length]!.slice(3, 5), 16), parseInt(COLORS[idx % COLORS.length]!.slice(5, 7), 16));
    doc.rect(x + labelW, by, Math.max(3, bw), barH, 'F');

    // Value label inside or after bar
    const valText = `${fmtVal(item.value)} (${pct}%)`;
    doc.setFontSize(6);
    if (bw > 40) {
      doc.setTextColor(255, 255, 255);
      doc.text(valText, x + labelW + bw / 2, by + 7, { align: 'center' });
    } else {
      doc.setTextColor(80, 80, 80);
      doc.text(valText, x + labelW + bw + 3, by + 7);
    }
  });

  return y + items.length * (barH + 4) + 6;
}

interface ReportTab { id: string; label: string; icon: any; group: string }
const reportTabs: ReportTab[] = [
  { id: 'ventas', label: 'Ventas', icon: TrendingUp, group: 'Ventas' },
  { id: 'top-productos', label: 'Top Productos', icon: BarChart3, group: 'Ventas' },
  { id: 'rentabilidad', label: 'Rentabilidad', icon: Target, group: 'Ventas' },
  { id: 'inventario', label: 'Inventario', icon: Package, group: 'Inventario' },
  { id: 'proveedores', label: 'Proveedores', icon: Truck, group: 'Inventario' },
  { id: 'clientes', label: 'Clientes', icon: Users, group: 'Clientes' },
  { id: 'actividades', label: 'Actividad CRM', icon: Phone, group: 'Clientes' },
  { id: 'pedidos-especiales', label: 'Pedidos Esp.', icon: ClipboardList, group: 'Operaciones' },
  { id: 'productividad', label: 'Productividad', icon: Users, group: 'Operaciones' },
];

function KpiCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1 min-w-[160px]">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900'}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function ExportButtons({ onPdf, onExcel }: { onPdf: () => void; onExcel: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onPdf} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
        <FileText className="w-4 h-4" /> PDF
      </button>
      <button onClick={onExcel} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
        <Download className="w-4 h-4" /> Excel
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('ventas');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [extraFilter, setExtraFilter] = useState<Record<string, string>>({});

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      Object.entries(extraFilter).forEach(([k, v]) => { if (v) params[k] = v; });
      const result = await reportsApi.getReport(activeReport, params);
      setData(result);
    } catch (err) {
      console.error('Error fetching report:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeReport, dateFrom, dateTo, extraFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportPDF = useCallback(async () => {
    const doc = new jsPDF();
    const tab = reportTabs.find((t) => t.id === activeReport);
    const logo = await getLogoBase64();
    const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");
    drawHeader(doc, `Reporte: ${tab?.label || activeReport}`, dateStr, logo ?? undefined);

    let cursorY = PDF_CONFIG.headerHeight + 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.grayText);
    if (dateFrom || dateTo) {
      doc.text(`Periodo: ${dateFrom || 'inicio'} - ${dateTo || 'hoy'}`, PDF_CONFIG.margin, cursorY);
      cursorY += 6;
    }
    cursorY += 4;

    const pageW = PDF_CONFIG.contentWidth;
    const chartH = 55;

    const cx = PDF_CONFIG.margin;
    if (activeReport === 'ventas') {
      if (data.byDay?.length > 0) {
        const pts = data.byDay.map((d: any) => ({ label: d.date.slice(5), values: [{ name: 'Total', value: Number(d.total), color: '#6366f1' }, { name: 'Transacciones', value: d.count, color: '#10b981' }] }));
        cursorY = drawLineChart(doc, pts, cx, cursorY, pageW, chartH, 'Tendencia diaria') + 6;
      }
      if (data.byPaymentMethod && Object.keys(data.byPaymentMethod).length > 0) {
        const items = Object.entries(data.byPaymentMethod).map(([k, v]) => ({ name: k, value: Number(v) }));
        cursorY = drawPieAsBars(doc, items, cx, cursorY, pageW, Math.min(50, items.length * 14 + 10), 'Por metodo de pago') + 6;
      }
    }

    if (activeReport === 'inventario' && data.byCategory?.length > 0) {
      const items = data.byCategory.map((c: any) => ({ label: c.name, values: [{ name: 'Valor Inventario', value: Number(c.stockValue), color: '#6366f1' }, { name: 'Productos', value: c.count, color: '#10b981' }] }));
      cursorY = drawBarChart(doc, items, cx, cursorY, pageW, chartH, 'Valor de inventario por categoria') + 6;
    }

    if (activeReport === 'clientes') {
      if (data.byCategory?.length > 0) cursorY = drawPieAsBars(doc, data.byCategory, cx, cursorY, pageW, data.byCategory.length * 14, 'Por categoria') + 6;
      if (data.byStage?.length > 0) cursorY = drawPieAsBars(doc, data.byStage, cx, cursorY, pageW, data.byStage.length * 14, 'Por etapa') + 6;
      if (data.bySource?.length > 0) cursorY = drawPieAsBars(doc, data.bySource, cx, cursorY, pageW, data.bySource.length * 14, 'Por fuente') + 6;
    }

    if (activeReport === 'actividades') {
      if (data.byType?.length > 0) {
        const items = data.byType.map((t: any) => ({ label: t.name, values: [{ name: 'Count', value: t.count, color: '#6366f1' }] }));
        cursorY = drawBarChart(doc, items, cx, cursorY, pageW, chartH, 'Por tipo') + 6;
      }
      if (data.byUser?.length > 0) {
        const items = data.byUser.map((u: any) => ({ label: u.name, values: [{ name: 'Total', value: u.count, color: '#6366f1' }, { name: 'Completadas', value: u.completed, color: '#10b981' }] }));
        cursorY = drawBarChart(doc, items, cx, cursorY, pageW, chartH, 'Por usuario') + 6;
      }
    }

    if (activeReport === 'top-productos' && data.products?.length > 0) {
      const items = data.products.slice(0, 10).map((p: any) => ({ label: p.name, values: [{ name: 'Ingresos', value: Number(p.revenue), color: '#6366f1' }, { name: 'Cantidad', value: p.quantity, color: '#10b981' }] }));
      cursorY = drawBarChart(doc, items, cx, cursorY, pageW, chartH, 'Top productos por ingresos') + 6;
    }

    if (activeReport === 'rentabilidad' && data.byCategory?.length > 0) {
      const items = data.byCategory.map((c: any) => ({ label: c.name, values: [{ name: 'Margen %', value: Number(c.avgMargin), color: '#6366f1' }] }));
      cursorY = drawBarChart(doc, items, cx, cursorY, pageW, chartH, 'Margen promedio por categoria') + 6;
    }

    if (activeReport === 'pedidos-especiales' && data.byStatus?.length > 0) {
      const items = data.byStatus.map((s: any) => ({ label: s.name, values: [{ name: 'Pedidos', value: s.count, color: '#6366f1' }] }));
      cursorY = drawBarChart(doc, items, cx, cursorY, pageW, chartH, 'Por estado') + 6;
    }

    if (activeReport === 'productividad' && data.users?.length > 0) {
      const items = data.users.map((u: any) => ({ label: u.name, values: [{ name: 'Actividades', value: u.activities, color: '#6366f1' }, { name: 'Completadas', value: u.completedActivities, color: '#10b981' }, { name: 'Ventas', value: u.sales, color: '#f59e0b' }] }));
      cursorY = drawBarChart(doc, items, cx, cursorY, pageW, chartH, 'Comparativa del equipo') + 6;
    }

    if (activeReport === 'proveedores' && data.byRating?.length > 0) {
      cursorY = drawPieAsBars(doc, data.byRating, cx, cursorY, pageW, data.byRating.length * 14, 'Distribucion por rating') + 6;
    }

    // --- Table ---
    const rows = buildTableData();
    if (rows.length) {
      const colCfg = getColumnStyles(activeReport);
      const columnStyles = colCfg?.styles;
      const tableWidth = colCfg?.tableWidth;
      const startY = Math.min(cursorY, doc.internal.pageSize.height - 30);
      const opts: any = { startY, head: [rows[0]!], body: rows.slice(1) as any, styles: { fontSize: 7, cellPadding: 1 }, headStyles: { fillColor: [...PDF_COLORS.primary], textColor: [...PDF_COLORS.white], fontSize: 7, cellPadding: 1 }, margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin }, columnStyles };
      if (tableWidth) opts.tableWidth = tableWidth;
      if (startY + rows.length * 5 > doc.internal.pageSize.height - 20) {
        doc.addPage();
        opts.startY = 14;
      }
      autoTable(doc, opts);
    }

    drawFooter(doc, `CasaVidal CRM · Reporte generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`);
    doc.save(`reporte-${activeReport}-${format(new Date(), 'yyyyMMdd')}.pdf`);
  }, [activeReport, dateFrom, dateTo, data]);

  const exportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const rows = buildTableData();
    if (rows.length) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    }
    XLSX.writeFile(wb, `reporte-${activeReport}-${format(new Date(), 'yyyyMMdd')}.xlsx`);
  }, [activeReport, data]);

  function buildTableData(): string[][] {
    if (!data) return [];
    const tab = activeReport;
    if (tab === 'ventas' && data.sales) {
      const header = ['#', 'Fecha', 'Cliente', 'Vendedor', 'Metodo Pago', 'Subtotal', 'Descuento', 'Total'];
      const rows = data.sales.map((s: any, i: number) => [
        String(i + 1), format(new Date(s.createdAt), 'dd/MM/yy'), s.client?.firstName ? `${s.client.firstName} ${s.client.lastName || ''}` : s.client?.companyName || '-',
        `${s.seller.firstName} ${s.seller.lastName}`, s.paymentMethod, String(Number(s.subtotal).toFixed(2)), String(Number(s.discount).toFixed(2)), String(Number(s.total).toFixed(2)),
      ]);
      return [header, ...rows];
    }
    if (tab === 'inventario' && data.lowStockProducts) {
      const header = ['Producto', 'SKU', 'Stock Actual', 'Stock Minimo', 'Categoria'];
      const rows = data.lowStockProducts.map((p: any) => [p.name, p.sku, String(p.currentStock), String(p.minStock), p.category || '']);
      return [header, ...rows];
    }
    if (tab === 'clientes') {
      const rows: string[][] = [['Categoria', 'Cantidad']];
      const src = data.byCategory || data.byStage || data.bySource || [];
      (src as any[]).forEach((c: any) => rows.push([c.name, String(c.count)]));
      if (rows.length === 1) rows.push(['(sin datos)', '0']);
      return rows;
    }
    if (tab === 'actividades') {
      const rows: string[][] = [['Tipo', 'Cantidad']];
      const src = data.byType || data.byStatus || [];
      (src as any[]).forEach((c: any) => rows.push([c.name, String(c.count)]));
      if (rows.length === 1) rows.push(['(sin datos)', '0']);
      return rows;
    }
    if (tab === 'top-productos' && data.products) {
      const header = ['#', 'Producto', 'SKU', 'Categoria', 'Cantidad', 'Ingresos', 'Margen %'];
      const rows = data.products.map((p: any, i: number) => [String(i + 1), p.name, p.sku, p.category, String(p.quantity), String(Number(p.revenue).toFixed(2)), String(p.margin)]);
      return [header, ...rows];
    }
    if (tab === 'rentabilidad' && data.products) {
      const header = ['Producto', 'SKU', 'Costo', 'Venta', 'Margen %', 'Stock'];
      const rows = data.products.map((p: any) => [p.name, p.sku, String(p.costPrice), String(p.salePrice), String(p.margin), String(p.stock)]);
      return [header, ...rows];
    }
    if (tab === 'proveedores' && data.suppliers) {
      const header = ['Nombre', 'Rating', 'Email', 'Productos', 'Ordenes'];
      const rows = data.suppliers.map((s: any) => [s.name, s.rating ? String(s.rating) : '-', s.email || '-', String(s.productCount), String(s.poCount)]);
      return [header, ...rows];
    }
    if (tab === 'pedidos-especiales') {
      const header = ['Estado', 'Cantidad'];
      const src = data.byStatus || [];
      const rows = (src as any[]).map((s: any) => [s.name, String(s.count)]);
      if (rows.length === 0) rows.push(['(sin datos)', '0']);
      return [header, ...rows];
    }
    if (tab === 'productividad' && data.users) {
      const header = ['Nombre', 'Rol', 'Actividades', 'Completadas', '%', 'Ventas', 'Total Ventas', 'Eventos'];
      const rows = data.users.map((u: any) => [u.name, u.role, String(u.activities), String(u.completedActivities), String(u.completionRate), String(u.sales), String(Number(u.salesTotal).toFixed(2)), String(u.events)]);
      return [header, ...rows];
    }
    return [];
  }

  function setFilter(name: string, value: string) {
    setExtraFilter((prev) => ({ ...prev, [name]: value }));
  }

  const activeTabInfo = reportTabs.find((t) => t.id === activeReport);

  return (
    <div className="flex h-full">
      {/* Sidebar de reportes */}
      <div className="w-56 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Reportes</h2>
        </div>
        {['Ventas', 'Inventario', 'Clientes', 'Operaciones'].map((group) => (
          <div key={group}>
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{group}</p>
            </div>
            {reportTabs.filter((t) => t.group === group).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${activeReport === tab.id ? 'bg-primary-50 text-primary-600 font-medium border-r-2 border-primary-500' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{activeTabInfo?.label || 'Reporte'}</h1>
            <p className="text-sm text-gray-500 mt-1">Reportes y analisis del sistema</p>
          </div>
          <ExportButtons onPdf={exportPDF} onExcel={exportExcel} />
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
            {activeReport === 'inventario' && (
              <label className="flex items-center gap-2 text-sm text-gray-600 pt-5">
                <input type="checkbox" checked={extraFilter.lowStockOnly === 'true'} onChange={(e) => setFilter('lowStockOnly', e.target.checked ? 'true' : '')} className="rounded" />
                Solo stock bajo
              </label>
            )}
            <button onClick={fetchReport} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Contenido del reporte */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : !data ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Sin datos disponibles</div>
        ) : (
          <div className="space-y-6">
            {activeReport === 'ventas' && <VentasReport data={data} />}
            {activeReport === 'inventario' && <InventarioReport data={data} />}
            {activeReport === 'clientes' && <ClientesReport data={data} />}
            {activeReport === 'actividades' && <ActividadesReport data={data} />}
            {activeReport === 'top-productos' && <TopProductosReport data={data} />}
            {activeReport === 'rentabilidad' && <RentabilidadReport data={data} />}
            {activeReport === 'proveedores' && <ProveedoresReport data={data} />}
            {activeReport === 'pedidos-especiales' && <PedidosEspecialesReport data={data} />}
            {activeReport === 'productividad' && <ProductividadReport data={data} />}
          </div>
        )}
      </div>
    </div>
  );
}

function VentasReport({ data }: { data: any }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard title="Total Ventas" value={`$${Number(data.totalRevenue).toLocaleString()}`} color="text-primary-600" />
        <KpiCard title="# Transacciones" value={data.totalSales} />
        <KpiCard title="Ticket Promedio" value={`$${Number(data.avgTicket).toFixed(2)}`} />
        <KpiCard title="Descuentos" value={`$${Number(data.totalDiscount).toFixed(2)}`} />
        <KpiCard title="Impuestos" value={`$${Number(data.totalTax).toFixed(2)}`} />
      </div>
      {data.byDay?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tendencia diaria</h3>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={data.byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Transacciones" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {Object.keys(data.byPaymentMethod || {}).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Por metodo de pago</h3>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie data={Object.entries(data.byPaymentMethod).map(([k, v]) => ({ name: k, value: v }))} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {Object.keys(data.byPaymentMethod).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Tabla detallada */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Transacciones</h3>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Vendedor</th>
                <th className="text-left px-4 py-3 font-medium">Metodo</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.sales?.slice(0, 50).map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{format(new Date(s.createdAt), 'dd/MM/yy')}</td>
                  <td className="px-4 py-3">{s.client?.firstName ? `${s.client.firstName} ${s.client.lastName || ''}` : s.client?.companyName || '-'}</td>
                  <td className="px-4 py-3">{s.seller.firstName} {s.seller.lastName}</td>
                  <td className="px-4 py-3">{s.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-medium">${Number(s.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function InventarioReport({ data }: { data: any }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Productos" value={data.totalProducts} />
        <KpiCard title="Valor Inventario" value={`$${Number(data.totalStockValue).toLocaleString()}`} color="text-primary-600" />
        <KpiCard title="Stock Bajo" value={data.lowStockCount} color="text-orange-500" />
        <KpiCard title="Sin Stock" value={data.outOfStockCount} color="text-red-500" />
      </div>
      {data.byCategory?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Valor de inventario por categoria</h3>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="stockValue" fill="#6366f1" name="Valor Inventario" />
              <Bar dataKey="count" fill="#10b981" name="Productos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.lowStockProducts?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Productos con stock bajo</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Producto</th>
                  <th className="text-left px-4 py-3 font-medium">SKU</th>
                  <th className="text-right px-4 py-3 font-medium">Stock Actual</th>
                  <th className="text-right px-4 py-3 font-medium">Stock Minimo</th>
                  <th className="text-left px-4 py-3 font-medium">Categoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.lowStockProducts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                    <td className={`px-4 py-3 text-right font-medium ${p.currentStock === 0 ? 'text-red-500' : 'text-orange-500'}`}>{p.currentStock}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.minStock}</td>
                    <td className="px-4 py-3">{p.category || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function ClientesReport({ data }: { data: any }) {
  const pieData = (arr: any[]) => arr.filter((i: any) => i.count > 0);
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Clientes" value={data.totalClients} />
        <KpiCard title="LTV Promedio" value={`$${Number(data.avgLifetimeValue).toFixed(2)}`} color="text-primary-600" />
        <KpiCard title="Alto Riesgo Churn" value={data.highChurnClients} color="text-red-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.byCategory?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Por categoria</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData(data.byCategory)} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData(data.byCategory).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {data.byStage?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Por etapa</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData(data.byStage)} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData(data.byStage).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {data.bySource?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Por fuente</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData(data.bySource)} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData(data.bySource).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}

function ActividadesReport({ data }: { data: any }) {
  const hasData = (arr: any[]) => arr && arr.length > 0;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard title="Total Actividades" value={data.total} />
        <KpiCard title="Vencidas" value={data.overdue} color="text-red-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hasData(data.byType) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Por tipo</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {hasData(data.byStatus) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Por estado</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.byStatus} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {hasData(data.byUser) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Por usuario</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byUser} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" name="Total" />
                <Bar dataKey="completed" fill="#10b981" name="Completadas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}

function TopProductosReport({ data }: { data: any }) {
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Top productos por ingresos</h3>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={(data.products || []).slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#6366f1" name="Ingresos" />
            <Bar dataKey="quantity" fill="#10b981" name="Cantidad" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Listado completo</h3>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Producto</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium">Categoria</th>
                <th className="text-right px-4 py-3 font-medium">Cantidad</th>
                <th className="text-right px-4 py-3 font-medium">Ingresos</th>
                <th className="text-right px-4 py-3 font-medium">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.products?.map((p: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3 text-right">{p.quantity}</td>
                  <td className="px-4 py-3 text-right font-medium">${Number(p.revenue).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{p.margin}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function RentabilidadReport({ data }: { data: any }) {
  return (
    <>
      {data.byCategory?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Margen promedio por categoria</h3>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgMargin" fill="#6366f1" name="Margen %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Rentabilidad por producto</h3>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Producto</th>
                <th className="text-right px-4 py-3 font-medium">Costo</th>
                <th className="text-right px-4 py-3 font-medium">Venta</th>
                <th className="text-right px-4 py-3 font-medium">Margen</th>
                <th className="text-right px-4 py-3 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.products?.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-right">${Number(p.costPrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${Number(p.salePrice).toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${p.margin >= 30 ? 'text-green-600' : p.margin >= 15 ? 'text-orange-500' : 'text-red-500'}`}>{p.margin}%</td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ProveedoresReport({ data }: { data: any }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard title="Total Proveedores" value={data.totalSuppliers} />
        <KpiCard title="Gasto Total" value={`$${Number(data.totalPOSpent).toLocaleString()}`} color="text-primary-600" />
        <KpiCard title="Entrega a Tiempo" value={`${data.onTimeRate}%`} color={data.onTimeRate >= 80 ? 'text-green-500' : 'text-orange-500'} />
      </div>
      {data.byRating?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribucion por rating</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.byRating} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.byRating.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Proveedores</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-center px-4 py-3 font-medium">Rating</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-right px-4 py-3 font-medium">Productos</th>
                <th className="text-right px-4 py-3 font-medium">Ordenes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.suppliers?.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-center">{s.rating ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{s.rating}</span> : '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.email || '-'}</td>
                  <td className="px-4 py-3 text-right">{s.productCount}</td>
                  <td className="px-4 py-3 text-right">{s.poCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function PedidosEspecialesReport({ data }: { data: any }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard title="Total Pedidos" value={data.totalOrders} />
        <KpiCard title="Ciclo Promedio" value={`${data.avgLifecycleDays} dias`} color="text-primary-600" />
      </div>
      {data.byStatus?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Por estado</h3>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data.byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" name="Pedidos">
                {data.byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}

function ProductividadReport({ data }: { data: any }) {
  return (
    <>
      {data.users?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Comparativa del equipo</h3>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data.users}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="activities" fill="#6366f1" name="Actividades" />
              <Bar dataKey="completedActivities" fill="#10b981" name="Completadas" />
              <Bar dataKey="sales" fill="#f59e0b" name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Productividad por usuario</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Rol</th>
                <th className="text-right px-4 py-3 font-medium">Actividades</th>
                <th className="text-right px-4 py-3 font-medium">Completadas</th>
                <th className="text-right px-4 py-3 font-medium">%</th>
                <th className="text-right px-4 py-3 font-medium">Ventas</th>
                <th className="text-right px-4 py-3 font-medium">Total Ventas</th>
                <th className="text-right px-4 py-3 font-medium">Eventos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3 text-right">{u.activities}</td>
                  <td className="px-4 py-3 text-right">{u.completedActivities}</td>
                  <td className="px-4 py-3 text-right">{u.completionRate}%</td>
                  <td className="px-4 py-3 text-right">{u.sales}</td>
                  <td className="px-4 py-3 text-right font-medium">${Number(u.salesTotal).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{u.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}


