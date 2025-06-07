import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PaymentScheduleEntry } from '../types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function exportToPDF(
  schedule: PaymentScheduleEntry[],
  summaryText: string,
  strategy: string,
  currency: string,
  chartCanvas?: HTMLCanvasElement
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Title and summary
  doc.setFontSize(16);
  doc.text('Debt Payoff Report', 14, 15);
  doc.setFontSize(10);
  doc.text(`Strategy: ${strategy}`, 14, 22);
  doc.text(summaryText, 14, 29);

  let currentY = 37;

  // Add chart if available
  if (chartCanvas) {
    try {
      const chartImageBase64 = chartCanvas.toDataURL('image/png', 1.0);
      const imgProps = doc.getImageProperties(chartImageBase64);
      const pdfChartWidth = doc.internal.pageSize.getWidth() - 28;
      const pdfChartHeight = (imgProps.height * pdfChartWidth) / imgProps.width;
      const maxHeight = 75;
      const finalChartHeight = Math.min(pdfChartHeight, maxHeight);
      doc.addImage(chartImageBase64, 'PNG', 14, currentY, pdfChartWidth, finalChartHeight);
      currentY += finalChartHeight + 8;
    } catch (e) {
      console.error('Error adding chart to PDF:', e);
      currentY += 5;
    }
  }

  if (currentY > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    currentY = 15;
  }

  // Payment schedule table
  doc.setFontSize(11);
  doc.text('Payment Schedule', 14, currentY);
  currentY += 6;

  const head = [['Month', 'Year', 'Debt Name', 'Payment', 'Interest', 'Principal', 'Rem. Bal.', 'Total Debt Rem.']];
  const body = schedule.map(entry => [
    new Date(0, entry.month - 1).toLocaleString('default', { month: 'short' }),
    entry.year.toString(),
    entry.debtName,
    currency + entry.payment.toFixed(2),
    currency + entry.interestPaid.toFixed(2),
    currency + entry.principalPaid.toFixed(2),
    currency + entry.remainingBalance.toFixed(2),
    entry.totalDebtRemaining !== undefined ? currency + entry.totalDebtRemaining.toFixed(2) : '-'
  ]);

  doc.autoTable({
    head: head,
    body: body,
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 15 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' },
      7: { cellWidth: 30, halign: 'right' }
    },
    didDrawPage: (data: any) => {
      doc.setFontSize(8);
      doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.height - 6);
    }
  });

  doc.save('debt_payoff_report.pdf');
}

export function exportToCSV(schedule: PaymentScheduleEntry[], currency: string): void {
  const headers = ['Month', 'Year', 'Debt Name', 'Payment', 'Interest Paid', 'Principal Paid', 'Remaining Balance', 'Total Debt Remaining'];
  let csvContent = headers.join(',') + '\n';

  schedule.forEach(entry => {
    const monthName = new Date(0, entry.month - 1).toLocaleString('default', { month: 'long' });
    const row = [
      monthName,
      entry.year,
      `"${entry.debtName.replace(/"/g, '""')}"`,
      currency + entry.payment.toFixed(2),
      currency + entry.interestPaid.toFixed(2),
      currency + entry.principalPaid.toFixed(2),
      currency + entry.remainingBalance.toFixed(2),
      entry.totalDebtRemaining !== undefined ? currency + entry.totalDebtRemaining.toFixed(2) : '-'
    ];
    csvContent += row.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'debt_payoff_schedule.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    alert('CSV export not supported by your browser.');
  }
}