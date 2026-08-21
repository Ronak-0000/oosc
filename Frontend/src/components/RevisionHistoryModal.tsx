import React from 'react';

interface RevisionHistoryModalProps {
  onClose: () => void;
}

export const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({ onClose }) => {
  const revisions = [
    {
      id: 'rev-3',
      version: 'v1.3 (Current)',
      time: '35 minutes ago',
      author: 'Automated Stress-Tester',
      change: 'Injected Public Interest Hardship Waiver Clause to mitigate fee stall tactics.',
      scoreChange: '+12% (84% -> 96%)',
      badge: 'Optimized',
    },
    {
      id: 'rev-2',
      version: 'v1.2',
      time: '2 hours ago',
      author: 'Privacy Redaction Engine',
      change: 'Masked Street Address (124 Main St) and Email (j.doe@email.com) in public draft.',
      scoreChange: 'PII Protected',
      badge: 'Secured',
    },
    {
      id: 'rev-1',
      version: 'v1.0',
      time: 'Oct 24, 2024 • 09:30 AM',
      author: 'Citizen Intake',
      change: 'Initial grievance ingestion and statutory framework mapping to Sunshine Law § 119.07.',
      scoreChange: 'Initial Base',
      badge: 'Created',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c4a] text-[24px]">history</span>
              <h2 className="font-headline font-bold text-[20px] text-[#0F172A]">
                Revision History & Audit Log
              </h2>
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Cryptographic integrity log for legal drafting and stress test iterations
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-4">
          {revisions.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-[#CBD5E1] rounded-xl p-4 flex flex-col gap-2 hover:border-[#0F172A] transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-[14px] text-[#0F172A]">
                    {rev.version}
                  </span>
                  <span className="text-[11px] bg-[#E2E8F0] text-[#334155] px-2 py-0.5 rounded font-mono">
                    {rev.time}
                  </span>
                </div>

                <span className="text-[11px] font-bold text-[#006c4a] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                  {rev.scoreChange}
                </span>
              </div>

              <p className="text-[13.5px] text-[#475569] leading-relaxed">{rev.change}</p>

              <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 pt-1 border-t border-[#F1F5F9]">
                <span className="material-symbols-outlined text-[13px]">person</span>
                <span>Triggered by: {rev.author}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
