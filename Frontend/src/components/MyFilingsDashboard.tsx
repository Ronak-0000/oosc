import React, { useState } from 'react';
import { LegalCase } from '../types';
import { useAuth } from '../context/AuthContext';

interface MyFilingsDashboardProps {
  cases: LegalCase[];
  onSelectCase: (caseId: string) => void;
  onNewFiling: () => void;
  onDeleteCase?: (caseId: string) => void;
  onDuplicateCase?: (legalCase: LegalCase) => void;
  onDownloadPDF: (legalCase: LegalCase) => void;
  onShareCase: (legalCase: LegalCase) => void;
  onOpenQuickAction: (action: 'appeal' | 'history' | 'rulebooks') => void;
}

export const MyFilingsDashboard: React.FC<MyFilingsDashboardProps> = ({
  cases,
  onSelectCase,
  onNewFiling,
  onDeleteCase,
  onDuplicateCase,
  onDownloadPDF,
  onShareCase,
  onOpenQuickAction,
}) => {
  const { user, signIn } = useAuth();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activeCasesCount = cases.length;
  const stressTestedCount = cases.filter((c) => c.score >= 85 || c.status === 'stress_tested').length;
  const upcomingDeadlinesCount = cases.filter((c) => c.statusType === 'urgent' || c.daysRemaining <= 7).length;

  const filteredCases = cases.filter((c) => {
    const matchesCategory =
      filterCategory === 'all' ||
      c.category.toLowerCase().includes(filterCategory.toLowerCase()) ||
      c.rulebookId.toLowerCase().includes(filterCategory.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'urgent' && (c.statusType === 'urgent' || c.daysRemaining <= 7)) ||
      (filterStatus === 'drafting' && c.status === 'drafting') ||
      (filterStatus === 'tested' && c.score >= 85);

    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.statute && c.statute.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full flex-grow max-w-[1280px] mx-auto px-4 sm:px-8 md:px-10 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {user ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                Cloud Synced (Firebase)
              </span>
            ) : (
              <button
                onClick={() => signIn()}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[12px] font-semibold transition-all duration-150 cursor-pointer border border-slate-200"
              >
                <span className="material-symbols-outlined text-[15px] text-[#006c4a]">account_circle</span>
                <span>Sign in to save filings across devices</span>
                <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              </button>
            )}
          </div>
          <h1 className="font-headline text-[28px] sm:text-[36px] font-bold text-[#0F172A] tracking-tight">
            My Filings
          </h1>
          <p className="text-[14.5px] text-[#64748B] mt-1">
            Your saved legal notices, deadlines, and letters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNewFiling}
            className="bg-[#006c4a] hover:bg-[#005137] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.01] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>New Case Filing</span>
          </button>
        </div>
      </section>

      {/* Bento Grid Dashboard */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Summary Stats (12 cols) */}
        <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Active Cases */}
          <div className="bg-white border border-[#CBD5E1] rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-[#94A3B8] transition-colors">
            <div className="w-12 h-12 bg-[#DAE2FD] rounded-xl flex items-center justify-center text-[#131B2E]">
              <span className="material-symbols-outlined filled text-[24px]">folder_open</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Active Cases</p>
              <p className="font-headline text-[26px] font-bold text-[#0F172A]">{activeCasesCount}</p>
            </div>
          </div>

          {/* Stress-Tested */}
          <div className="bg-white border border-[#CBD5E1] rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-[#94A3B8] transition-colors">
            <div className="w-12 h-12 bg-[#DCFCE7] rounded-xl flex items-center justify-center text-[#166534]">
              <span className="material-symbols-outlined filled text-[24px]">health_and_safety</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">High-Viability Filings</p>
              <p className="font-headline text-[26px] font-bold text-[#166534]">{stressTestedCount}</p>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white border border-[#CBD5E1] rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-[#94A3B8] transition-colors">
            <div className="w-12 h-12 bg-[#FFDAD6] rounded-xl flex items-center justify-center text-[#93000A]">
              <span className="material-symbols-outlined filled text-[24px]">timer</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Upcoming Deadlines</p>
              <p className="font-headline text-[26px] font-bold text-[#BA1A1A]">{upcomingDeadlinesCount}</p>
            </div>
          </div>
        </div>

        {/* Active Filings List (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
            <h2 className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">
              Saved Case Filings ({filteredCases.length})
            </h2>

            {/* Quick search/filter within active filings */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Filter by title, statute..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-[12px] bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-[#1E293B] focus:border-[#0F172A] outline-none"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-[12px] bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-[#475569] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="drafting">In Drafting</option>
                <option value="tested">High Viability (≥85%)</option>
                <option value="urgent">Urgent Clocks (≤7d)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {filteredCases.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#CBD5E1] rounded-2xl p-10 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                  <span className="material-symbols-outlined text-[28px]">description</span>
                </div>
                <h3 className="font-headline font-bold text-[18px] text-[#0F172A]">No Filings Found</h3>
                <p className="text-[13.5px] text-[#64748B] max-w-sm">
                  {searchQuery || filterStatus !== 'all'
                    ? 'No cases match your active search filters. Try clearing your search.'
                    : 'Start your first case filing or analyze a civic grievance on the home screen.'}
                </p>
                <button
                  onClick={onNewFiling}
                  className="mt-2 bg-[#006c4a] hover:bg-[#005137] text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Create New Filing
                </button>
              </div>
            ) : (
              filteredCases.map((legalCase) => {
                const isUrgent = legalCase.statusType === 'urgent' || legalCase.daysRemaining <= 7;
                const isSafe = legalCase.score >= 85 || legalCase.statusType === 'success';

                return (
                  <div
                    key={legalCase.id}
                    className="bg-white border border-[#CBD5E1] rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group hover:border-[#006c4a] hover:shadow-md transition-all duration-200"
                  >
                    {/* Color Accent Indicator Left Bar */}
                    <div
                      className={`absolute top-0 left-0 w-1.5 h-full ${
                        isUrgent ? 'bg-[#BA1A1A]' : isSafe ? 'bg-[#006c4a]' : 'bg-[#0F172A]'
                      }`}
                    ></div>

                    {/* Header Row */}
                    <div className="flex flex-wrap justify-between items-start gap-2 pl-2">
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="bg-[#F1F5F9] text-[#475569] text-[11px] font-medium px-2 py-1 rounded-md flex items-center gap-1 border border-[#E2E8F0]">
                          <span className="material-symbols-outlined text-[13px]">gavel</span>
                          <span>{legalCase.category}</span>
                        </span>

                        <span className="bg-white text-[#0F172A] text-[11px] font-semibold px-2 py-1 rounded-md border border-[#CBD5E1]">
                          {legalCase.caseNumber}
                        </span>

                        {isUrgent && (
                          <span className="bg-[#BA1A1A]/10 text-[#BA1A1A] text-[11px] font-bold px-2 py-1 rounded-md">
                            {legalCase.statusBadge || 'Urgent'}
                          </span>
                        )}

                        {isSafe && (
                          <span className="bg-[#006c4a]/10 text-[#006c4a] text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] fill">check_circle</span>
                            <span>Score: {legalCase.score}%</span>
                          </span>
                        )}
                      </div>

                      {/* Statutory Deadline Pill */}
                      <span className="bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] text-[12px] font-medium px-3 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>{legalCase.daysRemaining} Days Window</span>
                      </span>
                    </div>

                    {/* Case Content */}
                    <div className="mt-1 pl-2">
                      <h3 className="font-headline text-[18px] font-bold text-[#0F172A] group-hover:text-[#006c4a] transition-colors mb-1">
                        {legalCase.title}
                      </h3>
                      <p className="text-[13.5px] text-[#475569] line-clamp-2 leading-relaxed">
                        {legalCase.description || legalCase.requestScope}
                      </p>
                      {legalCase.statute && (
                        <p className="text-[12px] text-[#64748B] mt-1">
                          <strong className="text-[#334155]">Statutory Hook:</strong> {legalCase.statute}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-2 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 pl-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectCase(legalCase.id)}
                          className="bg-[#006c4a] hover:bg-[#005137] text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Open Workspace</span>
                        </button>

                        <button
                          onClick={() => onDownloadPDF(legalCase)}
                          className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-[13px] font-medium px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-[#CBD5E1]"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          <span>PDF</span>
                        </button>

                        {onDuplicateCase && (
                          <button
                            onClick={() => onDuplicateCase(legalCase)}
                            className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] text-[13px] font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Duplicate Case Filing"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            <span className="hidden sm:inline">Duplicate</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onShareCase(legalCase)}
                          className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] text-[13px] font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Share filing"
                        >
                          <span className="material-symbols-outlined text-[16px]">share</span>
                          <span>Share</span>
                        </button>

                        {onDeleteCase && (
                          deleteConfirmId === legalCase.id ? (
                            <div className="flex items-center gap-1 bg-[#FEF2F2] p-1 rounded-lg border border-[#FECACA]">
                              <button
                                onClick={() => {
                                  onDeleteCase(legalCase.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="bg-[#DC2626] text-white text-[11px] font-bold px-2 py-1 rounded cursor-pointer"
                              >
                                Confirm Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[#64748B] text-[11px] px-1.5 py-1 hover:text-[#0F172A] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(legalCase.id)}
                              className="text-[#94A3B8] hover:text-[#DC2626] p-2 rounded-lg hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                              title="Delete Filing"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Side Panel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <h2 className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider pb-2 border-b border-[#E2E8F0]">
            Civic Legal Utilities
          </h2>

          <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-sm">
            <ul className="flex flex-col">
              {/* Action 1: Track Appeal Status */}
              <li
                onClick={() => onOpenQuickAction('appeal')}
                className="py-3 border-b border-[#F1F5F9] last:border-0 flex items-center justify-between group cursor-pointer hover:bg-[#F8FAFC] transition-colors rounded-lg px-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#F1F5F9] flex items-center justify-center text-[#64748B] group-hover:text-[#006c4a] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">track_changes</span>
                  </div>
                  <span className="text-[14px] text-[#0F172A] font-medium">Track Statutory Appeal Status</span>
                </div>
                <span className="material-symbols-outlined text-[#94A3B8] group-hover:text-[#0F172A] transition-colors">
                  chevron_right
                </span>
              </li>

              {/* Action 2: Review Revision History */}
              <li
                onClick={() => onOpenQuickAction('history')}
                className="py-3 border-b border-[#F1F5F9] last:border-0 flex items-center justify-between group cursor-pointer hover:bg-[#F8FAFC] transition-colors rounded-lg px-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#F1F5F9] flex items-center justify-center text-[#64748B] group-hover:text-[#006c4a] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">history</span>
                  </div>
                  <span className="text-[14px] text-[#0F172A] font-medium">Revision History & Audits</span>
                </div>
                <span className="material-symbols-outlined text-[#94A3B8] group-hover:text-[#0F172A] transition-colors">
                  chevron_right
                </span>
              </li>

              {/* Action 3: Access Rulebooks */}
              <li
                onClick={() => onOpenQuickAction('rulebooks')}
                className="py-3 border-b border-[#F1F5F9] last:border-0 flex items-center justify-between group cursor-pointer hover:bg-[#F8FAFC] transition-colors rounded-lg px-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#F1F5F9] flex items-center justify-center text-[#64748B] group-hover:text-[#006c4a] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">gavel</span>
                  </div>
                  <span className="text-[14px] text-[#0F172A] font-medium">Statutory Rulebooks Catalog</span>
                </div>
                <span className="material-symbols-outlined text-[#94A3B8] group-hover:text-[#0F172A] transition-colors">
                  chevron_right
                </span>
              </li>
            </ul>
          </div>

          {/* Real-time Cloud Status Banner */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-5 relative overflow-hidden shadow-xs">
            <div className="absolute -right-4 -top-4 opacity-5 text-[#0F172A] pointer-events-none">
              <span className="material-symbols-outlined text-[130px]">cloud_sync</span>
            </div>

            <h3 className="font-headline font-bold text-[16px] text-[#0F172A] mb-2 relative z-10">
              Cloud Persistence
            </h3>

            <div className="flex items-center gap-2 text-[#006c4a] text-[13px] font-medium relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse"></div>
              <span>Firebase Firestore Real-Time Active</span>
            </div>

            <p className="text-[12px] text-[#64748B] mt-2 relative z-10 leading-relaxed">
              Every draft revision, extracted fact, PII mask, and stress-test audit is automatically saved to your cloud profile.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
