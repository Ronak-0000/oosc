import React, { useState } from 'react';
import { LegalCase } from '../types';

interface ShareModalProps {
  legalCase: LegalCase;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ legalCase, onClose }) => {
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view');
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://caseloop.civic.internal/f/${legalCase.id}?token=sec_7f991b`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] flex flex-col gap-5">
        <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c4a] text-[22px]">share</span>
            <h3 className="font-headline font-bold text-[18px] text-[#0F172A]">
              Share Secure Legal Filing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="text-[13px] text-[#475569]">
          Generate an encrypted access link for legal co-counsel, legal aid clinics, or ombudsman review.
        </div>

        {/* Case preview pill */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#0F172A] text-white flex items-center justify-center text-[13px] font-bold">
            CL
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-headline font-bold text-[14px] text-[#0F172A] truncate">
              {legalCase.title}
            </div>
            <div className="text-[11px] text-[#64748B]">
              {legalCase.caseNumber} • {legalCase.category}
            </div>
          </div>
        </div>

        {/* Access level */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
            Permission Level
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAccessLevel('view')}
              className={`p-2.5 rounded-lg border text-left text-[12.5px] transition-colors cursor-pointer ${
                accessLevel === 'view'
                  ? 'border-[#0F172A] bg-[#F1F5F9] font-semibold text-[#0F172A]'
                  : 'border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>View & Verify</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-1 font-normal">
                Can inspect draft & verify statutory citations
              </p>
            </button>

            <button
              onClick={() => setAccessLevel('edit')}
              className={`p-2.5 rounded-lg border text-left text-[12.5px] transition-colors cursor-pointer ${
                accessLevel === 'edit'
                  ? 'border-[#0F172A] bg-[#F1F5F9] font-semibold text-[#0F172A]'
                  : 'border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Co-Drafting</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-1 font-normal">
                Can add clauses, adjust facts & export PDF
              </p>
            </button>
          </div>
        </div>

        {/* Link box */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 text-[12px] text-[#334155] font-mono select-all"
          />
          <button
            onClick={handleCopy}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-medium px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[#059669]">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span>Link expires in 72 hours. All PII masked by default.</span>
        </div>
      </div>
    </div>
  );
};
