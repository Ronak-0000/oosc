import jsPDF from 'jspdf';
import { LegalCase } from '../types';

export function exportLegalCaseToPDF(legalCase: LegalCase): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  // 1. Header & Case Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text('FORMAL LEGAL NOTICE & STATUTORY FILING', margin, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // #64748B
  const dateText = legalCase.filedDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  doc.text(`CASE REF: ${legalCase.caseNumber}   |   DATE: ${dateText}   |   JURISDICTION: ${legalCase.officer?.jurisdiction || 'STATUTORY JURISDICTION'}`, margin, cursorY);
  cursorY += 4;

  // Horizontal divider
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY, margin + contentWidth, cursorY);
  cursorY += 8;

  // 2. Addressee Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TO / DESIGNATED OFFICER:', margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const officerLines = [
    `${legalCase.officer?.name || 'Public Information / Grievance Officer'}, ${legalCase.officer?.title || 'Authorized Officer'}`,
    legalCase.officer?.department || 'Grievance Redressal Division',
    `Jurisdiction: ${legalCase.officer?.jurisdiction || 'Local Office'}`,
    `Official Email: ${legalCase.officer?.email || 'records.intake@civic-gateway.gov'}`,
  ];

  officerLines.forEach((line) => {
    doc.text(line, margin, cursorY);
    cursorY += 4.5;
  });

  cursorY += 3;

  // 3. Subject Box
  doc.setFillColor(241, 245, 249); // #F1F5F9
  doc.roundedRect(margin, cursorY, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const subjectText = `SUBJECT: ${legalCase.title.toUpperCase()} (UNDER ${legalCase.statute || 'STATUTORY RULES'})`;
  const subjectWrapped = doc.splitTextToSize(subjectText, contentWidth - 8);
  doc.text(subjectWrapped, margin + 4, cursorY + 7);
  cursorY += 16;

  // 4. Case Body / Notice Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const noticeBody =
    legalCase.description && legalCase.description.trim().length > 30
      ? legalCase.description
      : `Sir / Madam,

I am formally submitting this statutory notice regarding: ${legalCase.title}.

1. STATEMENT OF FACTS & GROUNDS:
${(legalCase.facts || []).map((f, i) => `   (${String.fromCharCode(97 + i)}) ${f.label}: ${f.value}`).join('\n') || '   (a) Particulars of the matter as filed.'}

2. RELIEF / RECORDS SOUGHT:
${legalCase.requestScope || 'Comprehensive records, full resolution, and required statutory compliance.'}

3. STATUTORY TIMELINE FOR COMPLIANCE:
Pursuant to ${legalCase.statute || 'the governing statute'}, you are respectfully requested to fulfill this notice and provide written response within ${legalCase.daysRemaining || 30} days of receipt.

4. SEVERABILITY & REDACTION MANDATE:
Should any portion of requested information be considered exempt under statutory provisions, please segregate and release all non-exempt portions in accordance with law.`;

  const bodyParagraphs = noticeBody.split('\n');

  for (const para of bodyParagraphs) {
    if (para.trim() === '') {
      cursorY += 3.5;
      continue;
    }
    const lines = doc.splitTextToSize(para, contentWidth);
    checkPageBreak(lines.length * 4.8);
    doc.text(lines, margin, cursorY);
    cursorY += lines.length * 4.8;
  }

  // 5. Hardship / Fee Waiver Clause (if present)
  if (legalCase.hasHardshipClause) {
    cursorY += 4;
    checkPageBreak(22);
    doc.setFillColor(254, 243, 199); // light amber
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, cursorY, contentWidth, 18, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(146, 64, 14);
    doc.text('STATUTORY FEE WAIVER / HARDSHIP PROVISION:', margin + 4, cursorY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const waiverText = 'The requester requests that search and duplication fees be fully waived as disclosure serves the public interest and prevents undue economic hardship.';
    doc.text(doc.splitTextToSize(waiverText, contentWidth - 8), margin + 4, cursorY + 11);
    cursorY += 22;
  }

  // 6. Signature Section
  checkPageBreak(35);
  cursorY += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, margin + contentWidth, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Respectfully submitted,', margin, cursorY);
  cursorY += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const signName = legalCase.autoRedactEnabled ? '[REDACTED CITIZEN / REQUESTER]' : 'Authorized Citizen / Requester';
  doc.text(signName, margin, cursorY);
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Digital Verification ID: ${legalCase.caseNumber} • Electronic Vault Timestamp`, margin, cursorY);

  // Clean filename
  const cleanTitle = (legalCase.title || 'Legal-Filing')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const filename = `${cleanTitle}_${legalCase.caseNumber.replace(/#/g, '')}.pdf`;

  // Download directly
  doc.save(filename);
}
