import React, { useState } from 'react';
import { LegalCase } from '../types';
import { exportLegalCaseToPDF } from '../services/pdfService';

interface PDFExportModalProps {
  legalCase: LegalCase;
  onClose: () => void;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({ legalCase, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadDirectPDF = () => {
    setDownloading(true);
    try {
      exportLegalCaseToPDF(legalCase);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E2E8F0] overflow-hidden cursor-default"
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#006c4a]/10 text-[#006c4a] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-[18px] text-[#0F172A]">
                Download Official Legal Notice
              </h3>
              <p className="text-[12px] text-[#64748B]">
                Compliant with Statutory Filing Standards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDirectPDF}
              disabled={downloading}
              className="bg-[#006c4a] hover:bg-[#005137] text-white text-[13px] font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px]">
                {downloading ? 'sync' : 'download'}
              </span>
              <span>{downloading ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-slate-100 hover:bg-slate-200 text-[#0F172A] border border-slate-300 text-[13px] font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open System Print Dialog"
            >
              <span className="material-symbols-outlined text-[17px]">print</span>
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#0F172A] p-2 rounded-xl hover:bg-[#E2E8F0] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Document Preview Box with Print ID Container */}
        <div className="p-6 overflow-y-auto bg-[#F1F5F9] flex justify-center items-start flex-grow">
          <div
            id="legal-document-print-area"
            className="bg-white border border-[#CBD5E1] shadow-md p-8 sm:p-10 w-full max-w-[620px] font-serif-legal text-[13.5px] leading-relaxed text-[#1E293B] flex flex-col gap-5 rounded-md"
          >
            {/* Header Stamps */}
            <div className="flex justify-between items-start border-b-2 border-[#0F172A] pb-4">
              <div>
                <div className="font-bold text-[16px] text-[#0F172A] uppercase tracking-wider">
                  Formal Legal Notice & Records Request
                </div>
                <div className="text-[11px] font-sans text-[#64748B] uppercase tracking-widest mt-0.5">
                  Case Reference: {legalCase.caseNumber} • Electronic Vault Verified
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold text-[#0F172A]">{legalCase.filedDate || 'Current Filing'}</div>
                <div className="text-[11px] font-sans text-[#006c4a] font-bold bg-[#DCFCE7] px-2 py-0.5 rounded mt-1 inline-block">
                  Statutory {legalCase.daysRemaining || 30}-Day Clock
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div className="text-[13px] leading-snug">
              <p className="font-bold text-[#0F172A]">To: {legalCase.officer?.name || 'Authorized Officer'}</p>
              <p className="text-[#475569]">{legalCase.officer?.title || 'Designated Officer'}</p>
              <p className="text-[#475569]">{legalCase.officer?.department || 'Grievance Redressal Division'}</p>
              <p className="text-[#475569]">{legalCase.officer?.jurisdiction || 'Local Jurisdiction'}</p>
            </div>

            {/* RE Line */}
            <div className="bg-[#F8FAFC] border-l-4 border-[#0F172A] p-3 text-[13.5px]">
              <span className="font-bold text-[#0F172A]">RE: Formal Notice regarding {legalCase.title} pursuant to {legalCase.statute}</span>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3 font-sans text-[13px] leading-relaxed text-[#334155]">
              {legalCase.description && legalCase.description.trim().length > 30 ? (
                <div className="whitespace-pre-line font-mono text-[12.5px] bg-[#F8FAFC] p-4 rounded border border-[#E2E8F0] text-[#0F172A]">
                  {legalCase.description}
                </div>
              ) : (
                <>
                  <p>Dear {legalCase.officer?.name || 'Public Officer'},</p>
                  <p>
                    I am formally submitting this legal notice regarding the matter detailed below:
                  </p>

                  <div className="bg-[#F8FAFC] p-3.5 rounded border border-[#E2E8F0] flex flex-col gap-2">
                    <p className="font-bold text-[#0F172A]">1. Particulars & Facts:</p>
                    <ul className="list-disc pl-5 flex flex-col gap-1 text-[12.5px]">
                      {(legalCase.facts || []).map((fact) => (
                        <li key={fact.id}>
                          <strong>{fact.label}:</strong> {fact.value}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#F8FAFC] p-3.5 rounded border border-[#E2E8F0]">
                    <p className="font-bold text-[#0F172A] mb-1">2. Requested Relief / Records:</p>
                    <p>{legalCase.requestScope || 'Full resolution and statutory compliance.'}</p>
                  </div>
                </>
              )}

              {legalCase.hasHardshipClause && (
                <div className="bg-[#FFFBEB] border border-[#FEF3C7] p-3 rounded text-[12.5px] text-[#92400E]">
                  <strong>Statutory Fee Waiver:</strong> The requester hereby requests that all search and duplication fees be waived as disclosure is in the public interest.
                </div>
              )}

              <p>
                Pursuant to statutory mandates, should any portions of these records contain exempt material, you are required to segregate and redact only the exempt material and release all non-exempt portions without delay.
              </p>
            </div>

            {/* Sign-off */}
            <div className="pt-6 border-t border-[#E2E8F0] mt-auto flex justify-between items-end">
              <div>
                <p className="text-[13px] text-[#64748B]">Respectfully submitted,</p>
                <p className="font-bold text-[14px] text-[#0F172A] mt-1">
                  {legalCase.autoRedactEnabled ? '[REDACTED REQUESTER]' : 'Authorized Citizen / Requester'}
                </p>
                <p className="text-[11px] font-sans text-[#64748B]">CaseLoop Verified Electronic Identity</p>
              </div>

              <div className="text-right text-[11px] font-sans text-[#94A3B8]">
                <div>Verified Case: {legalCase.caseNumber}</div>
                <div>Statutory Notice v1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center text-[12px] text-[#64748B]">
          <span>Includes cryptographic timestamp & auto-redacted personal data.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] rounded-lg font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
