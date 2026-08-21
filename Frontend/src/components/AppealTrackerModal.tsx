import React from 'react';

interface AppealTrackerModalProps {
  onClose: () => void;
  onOpenWorkspace: () => void;
}

export const AppealTrackerModal: React.FC<AppealTrackerModalProps> = ({
  onClose,
  onOpenWorkspace,
}) => {
  const milestones = [
    {
      title: 'Formal Filing Submitted',
      date: 'Oct 24, 2024 • 10:14 AM',
      description: 'Request dispatched to Sgt. Amanda Reyes via electronic statutory gateway.',
      status: 'completed',
    },
    {
      title: 'Agency Acknowledgement & Tracking ID',
      date: 'Oct 24, 2024 • 02:40 PM',
      description: 'Formal confirmation received. Reference ID: #SPD-REC-8932.',
      status: 'completed',
    },
    {
      title: 'PIO Records Custodian Review',
      date: 'In Progress • 18 Days Remaining',
      description: 'Records Division reviewing bodycam video timestamps for redactions.',
      status: 'current',
    },
    {
      title: 'Release of Non-Exempt Records',
      date: 'Est. Nov 11, 2024',
      description: 'Electronic PDF/MP4 link generation and delivery to requester vault.',
      status: 'upcoming',
    },
    {
      title: 'First Appellate Authority Escalation (If Delayed)',
      date: 'Automated if no response by Day 20',
      description: 'Automatic generation of Section 19 First Appeal petition.',
      status: 'upcoming',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c4a] text-[24px]">track_changes</span>
              <h2 className="font-headline font-bold text-[20px] text-[#0F172A]">
                Appeal & Filing Tracker
              </h2>
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Case #CL-2024-8932 • Public Records Request
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Timeline body */}
        <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-6">
          <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#006c4a] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0F172A]">
                  Statutory Clock: On Schedule
                </div>
                <div className="text-[12px] text-[#166534]">
                  Agency response window expires in 18 calendar days.
                </div>
              </div>
            </div>
            <span className="bg-[#DCFCE7] text-[#166534] font-bold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">
              Healthy
            </span>
          </div>

          <div className="relative pl-6 border-l-2 border-[#E2E8F0] ml-3 flex flex-col gap-6">
            {milestones.map((m, idx) => {
              const isCompleted = m.status === 'completed';
              const isCurrent = m.status === 'current';

              return (
                <div key={idx} className="relative">
                  {/* Step icon dot */}
                  <div
                    className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      isCompleted
                        ? 'bg-[#006c4a] text-white'
                        : isCurrent
                        ? 'bg-[#0F172A] text-white ring-4 ring-[#DAE2FD]'
                        : 'bg-[#E2E8F0] text-[#94A3B8]'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-headline font-bold text-[15px] text-[#0F172A]">
                        {m.title}
                      </h4>
                      <span className="text-[12px] text-[#64748B] font-mono">{m.date}</span>
                    </div>
                    <p className="text-[13px] text-[#475569] mt-1">{m.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#64748B] hover:bg-[#E2E8F0] rounded-lg cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenWorkspace();
            }}
            className="px-4 py-2 text-[13px] font-medium bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-lg cursor-pointer flex items-center gap-1"
          >
            <span>Open Case in Workspace</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
