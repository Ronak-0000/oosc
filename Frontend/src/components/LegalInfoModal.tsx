import React from 'react';

interface LegalInfoModalProps {
  type: 'disclaimer' | 'accessibility' | 'rulebooks' | 'privacy';
  onClose: () => void;
}

export const LegalInfoModal: React.FC<LegalInfoModalProps> = ({ type, onClose }) => {
  const contentMap = {
    disclaimer: {
      title: 'Legal Disclaimers & Civic Tech Notice',
      subtitle: 'Information clarity for citizens and legal self-representation',
      body: (
        <div className="flex flex-col gap-3 text-[13.5px] text-[#475569] leading-relaxed">
          <p>
            CaseLoop is a civic-technology platform designed to facilitate automated drafting of statutory legal notices, public records requests, and consumer dispute frameworks.
          </p>
          <div className="bg-[#FFFBEB] border border-[#FEF3C7] p-3.5 rounded-lg text-[#92400E]">
            <strong>Notice:</strong> CaseLoop does not provide legal advice and is not a law firm. Using CaseLoop does not establish an attorney-client relationship. If you are facing complex civil litigation or criminal charges, consider consulting an accredited legal aid clinic or licensed attorney.
          </div>
          <p>
            All generated documents are compiled according to public statutory statutes (such as Sunshine Laws, RTI Act 2005, and the Consumer Protection Act). Users retain complete control over fact accuracy and submission.
          </p>
        </div>
      ),
    },
    accessibility: {
      title: 'Accessibility Statement (WCAG AAA)',
      subtitle: 'Engineered for high readability in high-stress citizen situations',
      body: (
        <div className="flex flex-col gap-3 text-[13.5px] text-[#475569] leading-relaxed">
          <p>
            CaseLoop adheres strictly to Web Content Accessibility Guidelines (WCAG 2.1) Level AAA standards for color contrast, screen reader compatibility, and keyboard navigation.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Minimum 7:1 contrast ratio on all primary reading text surfaces.</li>
            <li>Full ARIA label landmarks and keyboard shortcut traversal (Tab, Enter, Escape).</li>
            <li>Zero disruptive animations; motion respects prefers-reduced-motion.</li>
            <li>Plain English translation layers for dense bureaucratic legalese.</li>
          </ul>
        </div>
      ),
    },
    rulebooks: {
      title: 'Civic Rulebooks & Statutory Sources',
      subtitle: 'Open-source statutory codifications powering automated drafting',
      body: (
        <div className="flex flex-col gap-3 text-[13.5px] text-[#475569] leading-relaxed">
          <p>
            Each CaseLoop Rulebook represents a verified legal procedural tree covering statutory deadlines, mandatory elements of claim, and public record officer routing.
          </p>
          <p>
            Rulebooks are audited quarterly against municipal ordinance updates, appellate court precedents, and government department organizational charts.
          </p>
        </div>
      ),
    },
    privacy: {
      title: 'Privacy & Automated Redaction Policy',
      subtitle: 'Zero-knowledge PII vault and client-side redaction',
      body: (
        <div className="flex flex-col gap-3 text-[13.5px] text-[#475569] leading-relaxed">
          <p>
            Your privacy is our primary engineering requirement. Personal Identifiable Information (PII) including physical addresses, personal email addresses, phone numbers, and financial instruments are auto-redacted before any public drafting or export.
          </p>
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3.5 rounded-lg text-[#166534]">
            <strong>Zero Telemetry:</strong> Case filings and citizen grievance descriptions are stored in your secure local session and are never sold or shared with data brokers.
          </div>
        </div>
      ),
    },
  };

  const current = contentMap[type] || contentMap.disclaimer;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E2E8F0] flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="font-headline font-bold text-[18px] text-[#0F172A]">
              {current.title}
            </h3>
            <p className="text-[12px] text-[#64748B]">{current.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-[#F1F5F9]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="py-2">{current.body}</div>

        <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-2 rounded-lg text-[13px] font-medium cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
