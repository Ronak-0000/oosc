import React from 'react';

interface FooterProps {
  onOpenLegal: (type: 'disclaimer' | 'accessibility' | 'rulebooks' | 'privacy') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer className="bg-[#F1F5F9] border-t border-[#E2E8F0] w-full mt-auto">
      <div className="w-full py-8 px-4 sm:px-8 md:px-10 max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="font-headline font-bold text-[16px] text-[#0F172A] flex items-center gap-1.5">
            <span className="material-symbols-outlined fill text-[#006c4a] text-[18px]">gavel</span>
            CaseLoop
          </div>
          <p className="text-[14px] text-[#64748B] text-center md:text-left">
            © 2024 CaseLoop Civic-Tech. All rights reserved. Built for legal empowerment.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-[13px] text-[#64748B]">
          <button
            onClick={() => onOpenLegal('disclaimer')}
            className="hover:text-[#0F172A] underline underline-offset-4 transition-colors cursor-pointer"
          >
            Legal Disclaimers
          </button>
          <button
            onClick={() => onOpenLegal('accessibility')}
            className="hover:text-[#0F172A] underline underline-offset-4 transition-colors cursor-pointer"
          >
            Accessibility Statement
          </button>
          <button
            onClick={() => onOpenLegal('rulebooks')}
            className="hover:text-[#0F172A] underline underline-offset-4 transition-colors cursor-pointer"
          >
            Rulebooks
          </button>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-[#0F172A] underline underline-offset-4 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
        </nav>
      </div>
    </footer>
  );
};
