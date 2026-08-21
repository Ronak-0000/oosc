import { jsPDF } from 'jspdf';
import { LegalCase } from '../types';

export function exportLegalCaseToPDF(legalCase: LegalCase) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("CASELOOP CIVIC INTELLIGENCE SUITE", 14, 20);
  doc.setFontSize(12);
  doc.text(`Case Reference: ${legalCase.caseNumber}`, 14, 30);
  doc.text(`Title: ${legalCase.title}`, 14, 40);
  doc.text(`Statute: ${legalCase.statute || 'RTI Act 2005 § 6(1)'}`, 14, 50);

  const splitText = doc.splitTextToSize(legalCase.formalLetter || legalCase.description || "No draft content.", 180);
  doc.text(splitText, 14, 65);

  doc.save(`${legalCase.caseNumber || 'caseloop-draft'}.pdf`);
}
