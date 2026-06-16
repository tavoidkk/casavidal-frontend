import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download, FileText, TrendingUp, Package, Users, Phone, ClipboardList, Truck, BarChart3, Target } from 'lucide-react';
import { reportsApi } from '../api/reports.api';
import { format } from 'date-fns';
import { drawHeader, drawFooter, drawKpiRow, drawDividerLine, PDF_CONFIG, PDF_COLORS } from '../utils/pdfLayout';
import { getLogoBase64 } from '../utils/pdfLogo';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#0ea5e9', '#84cc16'];
const CHART_HEIGHT = 350;

function getColumnStyles(type: string): { styles: Record<number, { cellWidth: number; halign?: string; fillColor?: number[] }>; tableWidth: number } | undefined {
  const def = (widths: number[]) => {
    const total = widths.reduce((s, w) => s + w, 0);
    const styles: Record<number, { cellWidth: number; halign?: string; fillColor?: number[] }> = Object.fromEntries(widths.map((w, i) => [i, { cellWidth: w }]));
    styles[0] = { ...styles[0], halign: 'right', fillColor: [245, 245, 250] };
    return { styles, tableWidth: total };
  };
  switch (type) {
    case 'rentabilidad':
      return def([54, 34, 22, 22, 22, 22]);
    case 'ventas':
      return def([11, 17, 33, 23, 21, 16, 15, 18]);
    case 'inventario':
      return def([42, 28, 34, 34, 36]);
    case 'top-productos':
      return def([11, 37, 20, 24, 16, 27, 27]);
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

function fmtLarge(v: number | string): string {
  const n = Number(v);
  return n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString();
}

function buildKpiCards(data: any, type: string): { value: string; label: string; valueColor?: [number, number, number] }[] {
  switch (type) {
    case 'ventas':
      return [
        { value: `$${fmtLarge(data.totalRevenue)}`, label: 'Total Ventas', valueColor: PDF_COLORS.primary },
        { value: String(data.totalSales ?? 0), label: 'Transacciones' },
        { value: `$${Number(data.avgTicket ?? 0).toFixed(2)}`, label: 'Ticket Promedio', valueColor: PDF_COLORS.green },
        { value: `$${Number(data.totalDiscount ?? 0).toFixed(2)}`, label: 'Descuentos', valueColor: PDF_COLORS.amber },
      ];
    case 'inventario':
      return [
        { value: String(data.totalProducts ?? 0), label: 'Total Productos', valueColor: PDF_COLORS.primary },
        { value: `$${fmtLarge(data.totalStockValue)}`, label: 'Valor Inventario', valueColor: PDF_COLORS.green },
        { value: String(data.lowStockCount ?? 0), label: 'Stock Bajo', valueColor: PDF_COLORS.amber },
        { value: String(data.outOfStockCount ?? 0), label: 'Sin Stock', valueColor: [239, 68, 68] },
      ];
    case 'clientes':
      return [
        { value: String(data.totalClients ?? 0), label: 'Total Clientes', valueColor: PDF_COLORS.primary },
        { value: `$${Number(data.avgLifetimeValue ?? 0).toFixed(2)}`, label: 'LTV Promedio', valueColor: PDF_COLORS.green },
        { value: String(data.highChurnClients ?? 0), label: 'Alto Riesgo', valueColor: [239, 68, 68] },
      ];
    case 'actividades':
      return [
        { value: String(data.total ?? 0), label: 'Total Actividades', valueColor: PDF_COLORS.primary },
        { value: String(data.overdue ?? 0), label: 'Vencidas', valueColor: [239, 68, 68] },
      ];
    case 'top-productos':
      return [
        { value: String(data.products?.length ?? 0), label: 'Productos', valueColor: PDF_COLORS.primary },
        { value: `$${fmtLarge(data.products?.reduce((s: number, p: any) => s + Number(p.revenue || 0), 0))}`, label: 'Ingresos Totales', valueColor: PDF_COLORS.green },
        { value: String(data.products?.reduce((s: number, p: any) => s + (p.quantity || 0), 0)), label: 'Unidades Vendidas' },
      ];
    case 'rentabilidad':
      return [
        { value: String(data.products?.length ?? 0), label: 'Productos', valueColor: PDF_COLORS.primary },
        { value: `${Math.round(data.products?.reduce((s: number, p: any) => s + Number(p.margin || 0), 0) / Math.max(1, data.products?.length ?? 1))}%`, label: 'Margen Promedio', valueColor: PDF_COLORS.green },
      ];
    case 'proveedores':
      return [
        { value: String(data.totalSuppliers ?? 0), label: 'Proveedores', valueColor: PDF_COLORS.primary },
        { value: `$${fmtLarge(data.totalPOSpent)}`, label: 'Gasto Total', valueColor: PDF_COLORS.amber },
        { value: `${data.onTimeRate ?? 0}%`, label: 'Entrega a Tiempo', valueColor: data.onTimeRate >= 80 ? PDF_COLORS.green : [239, 68, 68] },
      ];
    case 'pedidos-especiales':
      return [
        { value: String(data.totalOrders ?? 0), label: 'Total Pedidos', valueColor: PDF_COLORS.primary },
        { value: `${data.avgLifecycleDays ?? 0} días`, label: 'Ciclo Promedio' },
      ];
    case 'productividad':
      return [
        { value: String(data.users?.length ?? 0), label: 'Usuarios', valueColor: PDF_COLORS.primary },
        { value: String(data.users?.reduce((s: number, u: any) => s + (u.activities || 0), 0) ?? 0), label: 'Total Actividades' },
        { value: String(data.users?.reduce((s: number, u: any) => s + (u.sales || 0), 0) ?? 0), label: 'Ventas Realizadas', valueColor: PDF_COLORS.green },
      ];
    default:
      return [];
  }
}

function buildSummaryText(data: any, type: string): string {
  switch (type) {
    case 'ventas': {
      const count = data.totalSales ?? 0;
      const rev = Number(data.totalRevenue ?? 0);
      const avg = Number(data.avgTicket ?? 0);
      return `Durante el período analizado se realizaron ${count} transacciones por un monto total de $${rev.toLocaleString('es-VE', { minimumFractionDigits: 2 })}. El ticket promedio por transacción fue de $${avg.toFixed(2)}.`;
    }
    case 'inventario': {
      const total = data.totalProducts ?? 0;
      const val = Number(data.totalStockValue ?? 0);
      const low = data.lowStockCount ?? 0;
      return `El inventario cuenta con ${total} productos registrados con un valor total de $${val.toLocaleString('es-VE', { minimumFractionDigits: 2 })}. Actualmente ${low} productos tienen stock bajo y requieren atención.`;
    }
    case 'clientes': {
      const total = data.totalClients ?? 0;
      const ltv = Number(data.avgLifetimeValue ?? 0);
      const churn = data.highChurnClients ?? 0;
      return `La base de datos registra ${total} clientes activos con un valor de vida útil (LTV) promedio de $${ltv.toFixed(2)} por cliente. ${churn > 0 ? `${churn} cliente(s) presentan alto riesgo de fuga y requieren acciones de retención.` : 'No se detectaron clientes con alto riesgo de fuga en este período.'}`;
    }
    case 'actividades':
      return `Se han registrado ${data.total ?? 0} actividades en el CRM. De estas, ${data.overdue ?? 0} se encuentran vencidas y requieren seguimiento prioritario.`;
    case 'top-productos': {
      const top = data.products?.slice(0, 3).map((p: any) => p.name).join(', ') || '';
      return `Los productos más vendidos del período generaron ingresos significativos. Los 3 principales son: ${top}. Revise la tabla completa para más detalles.`;
    }
    case 'rentabilidad': {
      const avgMargin = data.products?.length
        ? Math.round(data.products.reduce((s: number, p: any) => s + Number(p.margin || 0), 0) / data.products.length)
        : 0;
      return `Se analizó la rentabilidad de ${data.products?.length ?? 0} productos. El margen de ganancia promedio es de ${avgMargin}%. Los productos con margen inferior al 15% deben revisarse para ajuste de precios.`;
    }
    case 'proveedores':
      return `Se gestionan ${data.totalSuppliers ?? 0} proveedores con un gasto total de $${Number(data.totalPOSpent ?? 0).toLocaleString()}. La tasa de entrega a tiempo es del ${data.onTimeRate ?? 0}%.`;
    case 'pedidos-especiales':
      return `Se registraron ${data.totalOrders ?? 0} pedidos especiales con un ciclo de vida promedio de ${data.avgLifecycleDays ?? 0} días desde la solicitud hasta la entrega.`;
    case 'productividad': {
      const totalActs = data.users?.reduce((s: number, u: any) => s + (u.activities || 0), 0) ?? 0;
      const totalSales = data.users?.reduce((s: number, u: any) => s + (u.sales || 0), 0) ?? 0;
      return `El equipo de ${data.users?.length ?? 0} usuarios registró ${totalActs} actividades y ${totalSales} ventas en el período. Revise el detalle por usuario en la tabla adjunta.`;
    }
    default:
      return '';
  }
}

function drawBarChart(doc: jsPDF, items: { label: string; values: { name: string; value: number; color: string }[] }[], x: number, y: number, w: number, h: number, title?: string) {
  if (!items.length) return y;
  const hasMultipleSeries = items[0]?.values.length > 1;
  const seriesCount = hasMultipleSeries ? items[0]!.values.length : 1;
  const marginL = 30;
  const marginR = 4;
  const marginT = title ? 18 : 4;
  const chartW = w - marginL - marginR;
  const chartH = h - marginT - 20;
  const chartX = x + marginL;
  const chartY = y + marginT;
  const barW = chartW;

  if (title) { doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60); doc.text(title, chartX + chartW / 2, y + 5, { align: 'center' }); }

  const maxVal = Math.max(...items.flatMap((i) => i.values.map((v) => v.value)));
  const roundedMax = Math.ceil(maxVal * 1.1 / (10 ** Math.floor(Math.log10(maxVal || 1)))) * (10 ** Math.floor(Math.log10(maxVal || 1))) || 1;
  const gridSteps = 4;

  doc.setDrawColor(220, 220, 220);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
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
      if (barHeight > 10) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(fmtVal(val.value), bx + Math.max(4, barItemW) / 2, by + 4.5, { align: 'center' });
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(fmtVal(val.value), bx + Math.max(4, barItemW) / 2, by - 3, { align: 'center' });
      }
    });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const label = item.label.length > 14 ? item.label.slice(0, 13) + '...' : item.label;
    doc.text(label, gx + groupWidth / 2, chartY + chartH + 10, { align: 'center' });
  });

  if (hasMultipleSeries) {
    const legendY = chartY + chartH + 20;
    items[0]!.values.forEach((val, si) => {
      const lx = x + 10 + si * 60;
      doc.setFillColor(parseInt(val.color.slice(1, 3), 16), parseInt(val.color.slice(3, 5), 16), parseInt(val.color.slice(5, 7), 16));
      doc.rect(lx, legendY, 10, 4, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(val.name, lx + 12, legendY + 4);
    });
    return legendY + 12;
  }

  return chartY + chartH + 28;
}

function drawLineChart(doc: jsPDF, points: { label: string; values: { name: string; value: number; color: string }[] }[], x: number, y: number, w: number, h: number, title?: string) {
  if (!points.length) return y;
  const marginL = 30;
  const marginR = 4;
  const marginT = title ? 18 : 4;
  const chartW = w - marginL - marginR;
  const chartH = h - marginT - 20;
  const chartX = x + marginL;
  const chartY = y + marginT;

  if (title) { doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60); doc.text(title, chartX + chartW / 2, y + 5, { align: 'center' }); }

  const maxVal = Math.max(...points.flatMap((p) => p.values.map((v) => v.value)));
  const roundedMax = Math.ceil(maxVal * 1.1 / (10 ** Math.floor(Math.log10(maxVal || 1)))) * (10 ** Math.floor(Math.log10(maxVal || 1))) || 1;
  const gridSteps = 4;

  doc.setDrawColor(220, 220, 220);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
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
    doc.setLineWidth(1.2);
    for (let j = 1; j < pts.length; j++) {
      doc.line(pts[j - 1]!.px, pts[j - 1]!.py, pts[j]!.px, pts[j]!.py);
    }

    pts.forEach((pt) => {
      doc.setFillColor(parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16));
      doc.circle(pt.px, pt.py, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(fmtVal(pt.val), pt.px, pt.py - 4, { align: 'center' });
    });

    const step = Math.max(1, Math.floor(points.length / 12));
    points.forEach((p, i) => {
      if (i % step === 0 || i === points.length - 1) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        const label = p.label.length > 10 ? p.label.slice(0, 9) + '...' : p.label;
        doc.text(label, chartX + i * (chartW / Math.max(1, points.length - 1)), chartY + chartH + 10, { align: 'center' });
      }
    });
  });

  if (seriesNames.length > 1) {
    const legendY = chartY + chartH + 20;
    seriesNames.forEach((name, si) => {
      const lx = x + 10 + si * 50;
      doc.setFillColor(parseInt(seriesColors[si % seriesColors.length]!.slice(1, 3), 16), parseInt(seriesColors[si % seriesColors.length]!.slice(3, 5), 16), parseInt(seriesColors[si % seriesColors.length]!.slice(5, 7), 16));
      doc.rect(lx, legendY, 10, 4, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(name, lx + 12, legendY + 4);
    });
    return legendY + 12;
  }

  return chartY + chartH + 28;
}

function drawPieAsBars(doc: jsPDF, items: { name: string; value: number }[], x: number, y: number, w: number, h: number, title?: string) {
  if (!items.length) return y;
  if (title) { doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60); doc.text(title, x + w / 2, y + 5, { align: 'center' }); y += 10; }
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total) return y + 10;
  const barH = 12;
  const labelW = 55;
  const barMaxW = w - labelW - 8;
  const maxVal = Math.max(...items.map((i) => i.value));

  items.forEach((item, idx) => {
    const by = y + idx * (barH + 5);
    const pct = ((item.value / total) * 100).toFixed(1);
    const bw = (item.value / maxVal) * barMaxW;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const label = item.name.length > 20 ? item.name.slice(0, 19) + '...' : item.name;
    doc.text(label, x, by + 8);

    doc.setFillColor(parseInt(COLORS[idx % COLORS.length]!.slice(1, 3), 16), parseInt(COLORS[idx % COLORS.length]!.slice(3, 5), 16), parseInt(COLORS[idx % COLORS.length]!.slice(5, 7), 16));
    doc.rect(x + labelW, by, Math.max(3, bw), barH, 'F');

    const valText = `${fmtVal(item.value)} (${pct}%)`;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    if (bw > 45) {
      doc.setTextColor(255, 255, 255);
      doc.text(valText, x + labelW + bw / 2, by + 8, { align: 'center' });
    } else {
      doc.setTextColor(80, 80, 80);
      doc.text(valText, x + labelW + bw + 4, by + 8);
    }
  });

  return y + items.length * (barH + 5) + 8;
}

// ----- Chart Card Wrapper -----
function drawChartCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  title: string,
  chartBodyH: number,
  drawContent: (d: jsPDF, cx: number, cy: number, cw: number, ch: number) => number,
  insight?: string,
  assessment?: { text: string; color: [number, number, number] }
): number {
  const headerH = 12;
  const pad = 6;
  const bodyY = y + headerH + pad;

  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(x, y, w, headerH, 'F');
  doc.setTextColor(...PDF_COLORS.primaryDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x + 4, y + 8);

  const chartEndY = drawContent(doc, x, bodyY, w, chartBodyH);

  const insightLines = insight ? doc.splitTextToSize(insight, w - 8) : [];
  const insightH = insightLines.length > 0 ? insightLines.length * 4.5 + 8 : 0;

  if (insightLines.length > 0) {
    const insightY = chartEndY + 4;
    doc.setTextColor(...PDF_COLORS.grayText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    insightLines.forEach((line: string, i: number) => {
      doc.text(line, x + 4, insightY + 4 + i * 4.5);
    });
  }

  let totalH = chartEndY - y + insightH + pad;

  if (assessment) {
    const ay = y + totalH + 2;
    const assessLines = doc.splitTextToSize(assessment.text, w - 16);
    const assessH = assessLines.length * 4.5 + 6;
    doc.setFillColor(...assessment.color);
    doc.rect(x + 4, ay, 4, 4, 'F');
    doc.setTextColor(...assessment.color);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    assessLines.forEach((line: string, i: number) => {
      doc.text(line, x + 11, ay + 3.5 + i * 4.5);
    });
    totalH += assessH;
  }

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.rect(x, y, w, totalH, 'S');

  return y + totalH + 8;
}

// ----- Insight text generators (descriptive + business impact) -----
function buildDayInsight(data: any): string {
  if (!data.byDay?.length) return '';
  const max = data.byDay.reduce((best: any, d: any) => Number(d.total) > Number(best.total) ? d : best);
  const total = data.byDay.reduce((s: number, d: any) => s + Number(d.total), 0);
  const avg = total / data.byDay.length;
  const count = data.byDay.reduce((s: number, d: any) => s + (d.count || 0), 0);
  return `Durante el periodo se registraron ${count} transacciones por un total de $${total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}. El dia de mayor actividad fue ${max.date} con $${Number(max.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}, superando significativamente el promedio diario de $${avg.toFixed(2)}. Esto permite proyectar el flujo de caja y anticipar picos de demanda para una mejor gestion del capital de trabajo.`;
}

function buildDayAssessment(data: any): { text: string; color: [number, number, number] } | null {
  if (!data.byDay?.length || data.byDay.length < 3) return null;
  const half = Math.floor(data.byDay.length / 2);
  const firstHalfAvg = data.byDay.slice(0, half).reduce((s: number, d: any) => s + Number(d.total), 0) / half;
  const secondHalfAvg = data.byDay.slice(half).reduce((s: number, d: any) => s + Number(d.total), 0) / (data.byDay.length - half);
  const change = ((secondHalfAvg - firstHalfAvg) / (firstHalfAvg || 1)) * 100;
  if (change > 5) return { text: `Tendencia de ventas positiva (${change > 0 ? '+' : ''}${change.toFixed(0)}%). El negocio muestra crecimiento sostenido.`, color: PDF_COLORS.green };
  if (change < -5) return { text: `Tendencia de ventas decreciente (${change.toFixed(0)}%). Se recomienda revisar estrategia comercial y promociones.`, color: PDF_COLORS.red };
  return { text: `Volumen de ventas estable (${change.toFixed(0)}%). Sin cambios significativos en el periodo.`, color: PDF_COLORS.amber };
}

function buildPaymentInsight(data: any): string {
  const methods = Object.entries(data.byPaymentMethod || {});
  if (!methods.length) return '';
  const sorted = methods.sort((a: any, b: any) => Number(b[1]) - Number(a[1]));
  const top = sorted[0];
  const topPct = ((Number(top[1]) / methods.reduce((s, m) => s + Number(m[1]), 0)) * 100).toFixed(0);
  return `Los clientes prefieren mayoritariamente "${top[0]}" como metodo de pago, concentrando el ${topPct}% de las transacciones. Conocer esta preferencia permite optimizar la gestion de cobranza y liquidez del negocio, ademas de identificar oportunidades para ofrecer beneficios especificos por medio de pago.`;
}

function buildPaymentAssessment(data: any): { text: string; color: [number, number, number] } | null {
  const methods = Object.entries(data.byPaymentMethod || {});
  if (methods.length < 2) return null;
  const topPct = Math.max(...methods.map((m) => Number(m[1]))) / methods.reduce((s, m) => s + Number(m[1]), 0) * 100;
  if (topPct > 80) return { text: 'Alta concentracion en un solo metodo de pago. Diversificar reduce riesgo operativo.', color: PDF_COLORS.amber };
  return { text: 'Distribucion de metodos de pago saludable. Menor dependencia de un solo canal.', color: PDF_COLORS.green };
}

function buildTopProductInsight(data: any): string {
  if (!data.products?.length) return '';
  const top = data.products[0];
  const total = data.products.reduce((s: number, p: any) => s + Number(p.revenue || 0), 0);
  const pct = total > 0 ? ((Number(top.revenue) / total) * 100).toFixed(0) : '0';
  return `El producto estrella del periodo es "${top.name}" con ${top.quantity} unidades vendidas y $${Number(top.revenue).toFixed(2)} en ingresos, representando el ${pct}% del total. Identificar los productos mas vendidos permite enfocar la estrategia de compras y marketing en lo que realmente genera demanda.`;
}

function buildTopProductAssessment(data: any): { text: string; color: [number, number, number] } | null {
  if (!data.products?.length) return null;
  const total = data.products.reduce((s: number, p: any) => s + Number(p.revenue || 0), 0);
  if (!total) return null;
  const topPct = (Number(data.products[0].revenue) / total) * 100;
  if (topPct > 30) return { text: `Alta concentracion en un producto (${topPct.toFixed(0)}% de ingresos). Diversificar la cartera reduce riesgo.`, color: PDF_COLORS.amber };
  return { text: `Cartera de productos equilibrada. El lider representa solo el ${topPct.toFixed(0)}% de los ingresos.`, color: PDF_COLORS.green };
}

function buildMarginInsight(data: any): string {
  if (!data.byCategory?.length) return '';
  const sorted = [...data.byCategory].sort((a: any, b: any) => Number(b.avgMargin) - Number(a.avgMargin));
  const avg = sorted.reduce((s, c) => s + Number(c.avgMargin), 0) / sorted.length;
  return `El margen de ganancia promedio del inventario es de ${avg.toFixed(0)}%. "${sorted[0].name}" destaca con el margen mas alto (${sorted[0].avgMargin}%), mientras que "${sorted[sorted.length - 1].name}" presenta el mas bajo (${sorted[sorted.length - 1].avgMargin}%). Monitorear estas diferencias permite ajustar precios y mejorar la rentabilidad global del negocio.`;
}

function buildMarginAssessment(data: any): { text: string; color: [number, number, number] } | null {
  if (!data.byCategory?.length) return null;
  const avg = data.byCategory.reduce((s: number, c: any) => s + Number(c.avgMargin), 0) / data.byCategory.length;
  if (avg > 30) return { text: `Margen promedio saludable (${avg.toFixed(0)}%). La rentabilidad del negocio es solida.`, color: PDF_COLORS.green };
  if (avg > 15) return { text: `Margen promedio aceptable (${avg.toFixed(0)}%). Revisar categorias de bajo rendimiento para mejorar.`, color: PDF_COLORS.amber };
  return { text: `Margen promedio bajo (${avg.toFixed(0)}%). Urge revisar estructura de costos y precios de venta.`, color: PDF_COLORS.red };
}

function buildCategoryInsight(data: any): string {
  if (!data.byCategory?.length) return '';
  const src = data.byCategory;
  const key = src[0]?.stockValue !== undefined ? 'stockValue' : src[0]?.avgMargin !== undefined ? 'avgMargin' : 'count';
  const top = src.reduce((best: any, c: any) => Number(c[key]) > Number(best[key]) ? c : best);
  const total = src.reduce((s: number, c: any) => s + Number(c[key]), 0);
  const pct = total > 0 ? ((Number(top[key]) / total) * 100).toFixed(0) : '0';
  return `"${top.name}" lidera con ${fmtLarge(top[key])} en valor, representando el ${pct}% del total. Una distribucion equilibrada entre categorias reduce el riesgo de desabastecimiento y optimiza el capital de trabajo, permitiendo una gestion de inventario mas eficiente.`;
}

function buildCategoryAssessment(data: any): { text: string; color: [number, number, number] } | null {
  if (!data.byCategory?.length) return null;
  const src = data.byCategory;
  const key = src[0]?.stockValue !== undefined ? 'stockValue' : 'count';
  const total = src.reduce((s: number, c: any) => s + Number(c[key]), 0);
  if (!total) return null;
  const topPct = (Number(src[0][key]) / total) * 100;
  if (topPct > 50) return { text: `Alta concentracion en "${src[0].name}" (${topPct.toFixed(0)}%). Monitorear para evitar riesgo de sobrestock.`, color: PDF_COLORS.amber };
  return { text: `Distribucion de inventario equilibrada entre categorias. Gestion de stock saludable.`, color: PDF_COLORS.green };
}

function buildSegmentInsight(data: any, key: string, label: string): string {
  const src = data[key] || [];
  if (!src.length || !src[0]?.count) return '';
  const top = src.reduce((best: any, s: any) => Number(s.count) > Number(best.count) ? s : best);
  const total = src.reduce((s: number, c: any) => s + Number(c.count), 0);
  const pct = ((Number(top.count) / total) * 100).toFixed(0);
  return `El segmento "${top.name}" agrupa la mayor cantidad de clientes (${top.count} registros, ${pct}% del total). Conocer la distribucion por ${label} permite enfocar esfuerzos de marketing y retencion donde hay mayor concentracion, maximizando el retorno de las acciones comerciales.`;
}

function buildSegmentAssessment(data: any, key: string): { text: string; color: [number, number, number] } | null {
  const src = data[key] || [];
  if (!src.length) return null;
  const total = src.reduce((s: number, c: any) => s + Number(c.count), 0);
  if (!total) return null;
  const topPct = (Number(src[0].count) / total) * 100;
  if (topPct > 60) return { text: `Alta concentracion en "${src[0].name}" (${topPct.toFixed(0)}%). Diversificar base de clientes reduce dependencia.`, color: PDF_COLORS.amber };
  return { text: `Base de ${key === 'bySource' ? 'origenes' : 'segmentos'} diversificada. Distribucion saludable de clientes.`, color: PDF_COLORS.green };
}

function buildActivityTypeInsight(data: any): string {
  if (!data.byType?.length) return '';
  const top = data.byType.reduce((best: any, t: any) => Number(t.count) > Number(best.count) ? t : best);
  const total = data.byType.reduce((s: number, t: any) => s + Number(t.count), 0);
  const pct = ((Number(top.count) / total) * 100).toFixed(0);
  return `Las actividades del tipo "${top.name}" son las mas frecuentes (${top.count} registros, ${pct}% del total). Esto refleja la dinamica operativa del equipo CRM. Identificar los tipos de actividad predominantes permite asignar recursos y tiempo de manera mas eficiente para maximizar la productividad del equipo.`;
}

function buildActivityTypeAssessment(data: any): { text: string; color: [number, number, number] } | null {
  if (!data.byType?.length) return null;
  const total = data.byType.reduce((s: number, t: any) => s + Number(t.count), 0);
  if (!total) return null;
  const topPct = (Number(data.byType[0].count) / total) * 100;
  if (topPct > 60) return { text: `Un solo tipo de actividad domina el flujo de trabajo (${topPct.toFixed(0)}%). Evaluar si refleja la prioridad correcta.`, color: PDF_COLORS.amber };
  return { text: `Distribucion de actividades equilibrada. El equipo aborda multiples tareas de forma balanceada.`, color: PDF_COLORS.green };
}

function buildUserInsight(data: any): string {
  if (!data.users?.length) return '';
  const top = data.users.reduce((best: any, u: any) => Number(u.activities || 0) > Number(best.activities || 0) ? u : best);
  const totalActs = data.users.reduce((s: number, u: any) => s + Number(u.activities || 0), 0);
  const pct = totalActs > 0 ? ((Number(top.activities) / totalActs) * 100).toFixed(0) : '0';
  return `${top.name} lidera la actividad del equipo con ${top.activities} acciones (${pct}% del total) y ${top.sales} ventas concretadas. Reconocer a los colaboradores mas productivos fomenta una cultura de alto rendimiento y permite identificar practicas exitosas que pueden replicarse en el resto del equipo.`;
}

function buildUserAssessment(data: any): { text: string; color: [number, number, number] } | null {
  if (!data.users?.length) return null;
  const totalActs = data.users.reduce((s: number, u: any) => s + Number(u.activities || 0), 0);
  if (!totalActs) return null;
  const topPct = (Number(data.users[0].activities || 0) / totalActs) * 100;
  if (topPct > 50) return { text: `Alta dependencia en "${data.users[0].name}" (${topPct.toFixed(0)}% de la carga). Distribuir tareas reduce riesgo operativo.`, color: PDF_COLORS.amber };
  return { text: `Carga de trabajo distribuida entre el equipo. No hay dependencia excesiva en un solo colaborador.`, color: PDF_COLORS.green };
}

function buildStatusInsight(data: any): string {
  if (!data.byStatus?.length) return '';
  const top = data.byStatus.reduce((best: any, s: any) => Number(s.count) > Number(best.count) ? s : best);
  const total = data.byStatus.reduce((s: number, st: any) => s + Number(st.count), 0);
  const pct = ((Number(top.count) / total) * 100).toFixed(0);
  return `La mayoria de los pedidos se encuentran en estado "${top.name}" (${top.count} registros, ${pct}% del total). Analizar la distribucion por estado permite identificar cuellos de botella en el proceso logistico y tomar acciones para agilizar los tiempos de entrega al cliente final.`;
}

function buildStatusAssessment(data: any): { text: string; color: [number, number, number] } | null {
  if (!data.byStatus?.length) return null;
  const pendingKeywords = ['pendiente', 'en proceso', 'procesando', 'espera'];
  const doneKeywords = ['completado', 'entregado', 'finalizado', 'cerrado'];
  const pendingCount = data.byStatus.filter((s: any) => pendingKeywords.some((k) => s.name?.toLowerCase().includes(k)))
    .reduce((sum: number, s: any) => sum + Number(s.count), 0);
  const doneCount = data.byStatus.filter((s: any) => doneKeywords.some((k) => s.name?.toLowerCase().includes(k)))
    .reduce((sum: number, s: any) => sum + Number(s.count), 0);
  const total = data.byStatus.reduce((s: number, st: any) => s + Number(st.count), 0);
  if (!total) return null;
  const pendingPct = (pendingCount / total) * 100;
  const donePct = (doneCount / total) * 100;
  if (pendingPct > 30) return { text: `Alto volumen de pedidos pendientes (${pendingPct.toFixed(0)}%). Revisar proceso logístico para agilizar entregas.`, color: PDF_COLORS.red };
  if (donePct > 70) return { text: `Buena tasa de resolucion (${donePct.toFixed(0)}% completados). Proceso logístico eficiente.`, color: PDF_COLORS.green };
  return { text: `Distribucion de pedidos dentro de parametros normales. Sin novedades relevantes.`, color: PDF_COLORS.amber };
}

function buildRatingInsight(data: any): string {
  if (!data.byRating?.length) return '';
  const totalVal = data.byRating.reduce((s: number, r: any) => s + Number(r.value) * Number(r.count), 0);
  const totalCount = data.byRating.reduce((s: number, r: any) => s + Number(r.count), 0);
  if (!totalCount) return '';
  const avg = (totalVal / totalCount);
  return `La calificacion promedio de los proveedores es de ${avg.toFixed(1)} estrellas. Mantener relaciones con proveedores bien calificados garantiza calidad, cumplimiento en las entregas y mejores condiciones comerciales, lo que impacta directamente en la satisfaccion de los clientes finales de la ferreteria.`;
}

function buildRatingAssessment(data: any): { text: string; color: [number, number, number] } | null {
  if (!data.byRating?.length) return null;
  const totalVal = data.byRating.reduce((s: number, r: any) => s + Number(r.value) * Number(r.count), 0);
  const totalCount = data.byRating.reduce((s: number, r: any) => s + Number(r.count), 0);
  if (!totalCount) return null;
  const avg = totalVal / totalCount;
  if (avg >= 4) return { text: `Proveedores con excelente calificacion (${avg.toFixed(1)} estrellas). Relaciones comerciales solidas.`, color: PDF_COLORS.green };
  if (avg >= 3) return { text: `Calificacion aceptable (${avg.toFixed(1)} estrellas). Oportunidad de mejora en relacion con proveedores.`, color: PDF_COLORS.amber };
  return { text: `Baja calificacion de proveedores (${avg.toFixed(1)} estrellas). Revisar relaciones comerciales y buscar alternativas.`, color: PDF_COLORS.red };
}

function buildProductivityInsight(data: any): string {
  if (!data.users?.length) return '';
  const best = data.users.reduce((b: any, u: any) => Number(u.sales || 0) > Number(b.sales || 0) ? u : b);
  const totalSales = data.users.reduce((s: number, u: any) => s + Number(u.sales || 0), 0);
  const totalActs = data.users.reduce((s: number, u: any) => s + Number(u.activities || 0), 0);
  const avgSales = totalSales / data.users.length;
  return `${best.name} lidera en ventas con ${best.sales} transacciones, superando el promedio del equipo de ${avgSales.toFixed(1)}. En total el equipo realizo ${totalActs} actividades y ${totalSales} ventas en el periodo. Analizar las practicas de los colaboradores mas destacados permite replicar su exito y elevar el rendimiento general del equipo comercial.`;
}

function buildProductivityAssessment(data: any): { text: string; color: [number, number, number] } | null {
  if (!data.users?.length) return null;
  const totalSales = data.users.reduce((s: number, u: any) => s + Number(u.sales || 0), 0);
  if (!totalSales) return null;
  const avgSales = totalSales / data.users.length;
  const maxSales = Math.max(...data.users.map((u: any) => Number(u.sales || 0)));
  const ratio = avgSales > 0 ? maxSales / avgSales : 1;
  if (ratio > 2.5) return { text: `Alta variabilidad en ventas (el lider vende ${ratio.toFixed(1)}x el promedio). Oportunidad de coaching para el equipo.`, color: PDF_COLORS.amber };
  return { text: 'Rendimiento del equipo equilibrado. Buen nivel de productividad general.', color: PDF_COLORS.green };
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

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.grayText);
    if (dateFrom || dateTo) {
      doc.text(`Periodo: ${dateFrom || 'inicio'} - ${dateTo || 'hoy'}`, PDF_CONFIG.margin, cursorY);
      cursorY += 6;
    }
    cursorY += 2;

    const summaryText = buildSummaryText(data, activeReport);
    if (summaryText) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_COLORS.grayText);
      const lines = doc.splitTextToSize(summaryText, PDF_CONFIG.contentWidth);
      lines.forEach((line: string) => {
        doc.text(line, PDF_CONFIG.margin, cursorY);
        cursorY += 4.5;
      });
      cursorY += 3;
    }

    const kpiCards = buildKpiCards(data, activeReport);
    if (kpiCards.length > 0) {
      cursorY = drawKpiRow(doc, cursorY, kpiCards);
      drawDividerLine(doc, cursorY - 3);
    }

    const pageW = PDF_CONFIG.contentWidth;
    const cx = PDF_CONFIG.margin;
    const pageBottom = doc.internal.pageSize.getHeight() - 20;

    if (activeReport === 'ventas') {
      if (data.byDay?.length > 0) {
        if (cursorY + 100 > pageBottom) { doc.addPage(); cursorY = 14; }
        const pts = data.byDay.map((d: any) => ({ label: d.date.slice(5), values: [{ name: 'Total', value: Number(d.total), color: '#6366f1' }, { name: 'Transacciones', value: d.count, color: '#10b981' }] }));
        cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Tendencia diaria', 48,
          (d, cx2, cy2, cw2, ch2) => drawLineChart(d, pts, cx2, cy2, cw2, ch2),
          buildDayInsight(data),
          buildDayAssessment(data)
        );
      }
      if (data.byPaymentMethod && Object.keys(data.byPaymentMethod).length > 0) {
        if (cursorY + 85 > pageBottom) { doc.addPage(); cursorY = 14; }
        const items = Object.entries(data.byPaymentMethod).map(([k, v]) => ({ name: k, value: Number(v) }));
        cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Por metodo de pago', items.length * 17 + 10,
          (d, cx2, cy2, cw2, ch2) => drawPieAsBars(d, items, cx2, cy2, cw2, ch2),
          buildPaymentInsight(data),
          buildPaymentAssessment(data)
        );
      }
    }

    if (activeReport === 'inventario' && data.byCategory?.length > 0) {
      if (cursorY + 100 > pageBottom) { doc.addPage(); cursorY = 14; }
      const items = data.byCategory.map((c: any) => ({ label: c.name, values: [{ name: 'Valor Inventario', value: Number(c.stockValue), color: '#6366f1' }, { name: 'Productos', value: c.count, color: '#10b981' }] }));
      cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Valor de inventario por categoria', 48,
        (d, cx2, cy2, cw2, ch2) => drawBarChart(d, items, cx2, cy2, cw2, ch2),
        buildCategoryInsight(data),
        buildCategoryAssessment(data)
      );
    }

    if (activeReport === 'clientes') {
      if (data.byCategory?.length > 0) {
        if (cursorY + 85 > pageBottom) { doc.addPage(); cursorY = 14; }
        cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Por categoria', data.byCategory.length * 17 + 10,
          (d, cx2, cy2, cw2, ch2) => drawPieAsBars(d, data.byCategory, cx2, cy2, cw2, ch2),
          buildSegmentInsight(data, 'byCategory', 'categoria'),
          buildSegmentAssessment(data, 'byCategory')
        );
      }
      if (data.byStage?.length > 0) {
        if (cursorY + 85 > pageBottom) { doc.addPage(); cursorY = 14; }
        cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Por etapa', data.byStage.length * 17 + 10,
          (d, cx2, cy2, cw2, ch2) => drawPieAsBars(d, data.byStage, cx2, cy2, cw2, ch2),
          buildSegmentInsight(data, 'byStage', 'etapa'),
          buildSegmentAssessment(data, 'byStage')
        );
      }
      if (data.bySource?.length > 0) {
        if (cursorY + 85 > pageBottom) { doc.addPage(); cursorY = 14; }
        cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Por fuente', data.bySource.length * 17 + 10,
          (d, cx2, cy2, cw2, ch2) => drawPieAsBars(d, data.bySource, cx2, cy2, cw2, ch2),
          buildSegmentInsight(data, 'bySource', 'fuente'),
          buildSegmentAssessment(data, 'bySource')
        );
      }
    }

    if (activeReport === 'actividades') {
      const ch = 42;
      if (data.byType?.length > 0) {
        if (cursorY + 95 > pageBottom) { doc.addPage(); cursorY = 14; }
        const items = data.byType.map((t: any) => ({ label: t.name, values: [{ name: 'Count', value: t.count, color: '#6366f1' }] }));
        cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Por tipo', ch,
          (d, cx2, cy2, cw2, ch2) => drawBarChart(d, items, cx2, cy2, cw2, ch2),
          buildActivityTypeInsight(data),
          buildActivityTypeAssessment(data)
        );
      }
      if (data.byUser?.length > 0) {
        if (cursorY + 95 > pageBottom) { doc.addPage(); cursorY = 14; }
        const items = data.byUser.map((u: any) => ({ label: u.name, values: [{ name: 'Total', value: u.count, color: '#6366f1' }, { name: 'Completadas', value: u.completed, color: '#10b981' }] }));
        cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Por usuario', ch,
          (d, cx2, cy2, cw2, ch2) => drawBarChart(d, items, cx2, cy2, cw2, ch2),
          buildUserInsight(data),
          buildUserAssessment(data)
        );
      }
    }

    if (activeReport === 'top-productos' && data.products?.length > 0) {
      if (cursorY + 100 > pageBottom) { doc.addPage(); cursorY = 14; }
      const items = data.products.slice(0, 10).map((p: any) => ({ label: p.name, values: [{ name: 'Ingresos', value: Number(p.revenue), color: '#6366f1' }, { name: 'Cantidad', value: p.quantity, color: '#10b981' }] }));
      cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Top productos por ingresos', 48,
        (d, cx2, cy2, cw2, ch2) => drawBarChart(d, items, cx2, cy2, cw2, ch2),
        buildTopProductInsight(data),
        buildTopProductAssessment(data)
      );
    }

    if (activeReport === 'rentabilidad' && data.byCategory?.length > 0) {
      if (cursorY + 100 > pageBottom) { doc.addPage(); cursorY = 14; }
      const items = data.byCategory.map((c: any) => ({ label: c.name, values: [{ name: 'Margen %', value: Number(c.avgMargin), color: '#6366f1' }] }));
      cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Margen promedio por categoria', 48,
        (d, cx2, cy2, cw2, ch2) => drawBarChart(d, items, cx2, cy2, cw2, ch2),
        buildMarginInsight(data),
        buildMarginAssessment(data)
      );
    }

    if (activeReport === 'pedidos-especiales' && data.byStatus?.length > 0) {
      if (cursorY + 100 > pageBottom) { doc.addPage(); cursorY = 14; }
      const items = data.byStatus.map((s: any) => ({ label: s.name, values: [{ name: 'Pedidos', value: s.count, color: '#6366f1' }] }));
      cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Por estado', 48,
        (d, cx2, cy2, cw2, ch2) => drawBarChart(d, items, cx2, cy2, cw2, ch2),
        buildStatusInsight(data),
        buildStatusAssessment(data)
      );
    }

    if (activeReport === 'productividad' && data.users?.length > 0) {
      if (cursorY + 100 > pageBottom) { doc.addPage(); cursorY = 14; }
      const items = data.users.map((u: any) => ({ label: u.name, values: [{ name: 'Actividades', value: u.activities, color: '#6366f1' }, { name: 'Completadas', value: u.completedActivities, color: '#10b981' }, { name: 'Ventas', value: u.sales, color: '#f59e0b' }] }));
      cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Comparativa del equipo', 48,
        (d, cx2, cy2, cw2, ch2) => drawBarChart(d, items, cx2, cy2, cw2, ch2),
        buildProductivityInsight(data),
        buildProductivityAssessment(data)
      );
    }

    if (activeReport === 'proveedores' && data.byRating?.length > 0) {
      if (cursorY + 85 > pageBottom) { doc.addPage(); cursorY = 14; }
      cursorY = drawChartCard(doc, cx, cursorY, pageW, 'Distribucion por rating', data.byRating.length * 17 + 10,
        (d, cx2, cy2, cw2, ch2) => drawPieAsBars(d, data.byRating, cx2, cy2, cw2, ch2),
        buildRatingInsight(data),
        buildRatingAssessment(data)
      );
    }

    // --- Table ---
    const rows = buildTableData();
    if (rows.length) {
      const colCfg = getColumnStyles(activeReport);
      const columnStyles = colCfg?.styles;
      const tableWidth = colCfg?.tableWidth;
      const startY = Math.min(cursorY, doc.internal.pageSize.height - 30);
      const opts: any = { startY, head: [rows[0]!], body: rows.slice(1) as any, styles: { fontSize: 9, cellPadding: 2 }, headStyles: { fillColor: [...PDF_COLORS.primary], textColor: [...PDF_COLORS.white], fontStyle: 'bold', fontSize: 10, cellPadding: 2.5 }, alternateRowStyles: { fillColor: [...PDF_COLORS.primaryLight] }, margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin }, columnStyles };
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


