import React, { useState } from 'react';
import { LegalCase, ExtractedFact } from '../types';
import { DECODED_RESPONSES } from '../data/mockData';
import {
  generateFilingDraftApi,
  stressTestApi,
  interpretResponseApi,
  searchOfficerApi,
  AIStressTestResponse,
  AIDecodedResponse,
  AuthoritySearchResult,
} from '../services/api';

interface FilingWorkspaceProps {
  currentCase: LegalCase;
  onUpdateCase: (updatedCase: LegalCase) => void;
  onNavigate: (view: 'home' | 'workspace' | 'my-filings') => void;
  onDownloadPDF: (legalCase: LegalCase) => void;
}

export const FilingWorkspace: React.FC<FilingWorkspaceProps> = ({
  currentCase,
  onUpdateCase,
  onNavigate,
  onDownloadPDF,
}) => {
  // Step Tabs: 1 to 6
  const [activeStep, setActiveStep] = useState<number>(4);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // AI draft state
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftNoticeText, setDraftNoticeText] = useState<string>(
    currentCase.formalLetter ||
      (currentCase.description?.includes('To:') || currentCase.description?.includes('NOTICE')
        ? currentCase.description
        : `LEGAL NOTICE & STATUTORY DEMAND
Pursuant to ${currentCase.statute || 'Statutory Code of Procedure'}

To:
${currentCase.officer?.name || 'Public Information Officer / Authorized Officer'}
${currentCase.officer?.title || 'Designated Public Officer'}
${currentCase.officer?.department || 'Grievance Redressal Division'}
${currentCase.officer?.address || `${currentCase.officer?.jurisdiction || 'Local'} Administrative Complex`}
Email: ${currentCase.officer?.email || 'records.intake@civic-gateway.gov'}

Date: ${currentCase.filedDate || new Intl.DateTimeFormat('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}
Case Reference: ${currentCase.caseNumber}

SUBJECT: STATUTORY DEMAND NOTICE IN THE MATTER OF: ${currentCase.title.toUpperCase()}

Sir / Madam,

Under instructions from and on behalf of the Requester, this formal statutory notice is served upon you regarding the following matter:

1. STATEMENT OF MATERIAL FACTS:
${(currentCase.facts || []).map((f, i) => `(${String.fromCharCode(97 + i)}) ${f.label}: ${f.value}`).join('\n') || `(a) Core Matter: ${currentCase.rawIntakeText || currentCase.description}`}

2. STATUTORY GROUNDS & APPLICABLE LAWS:
(a) The failure to address this matter violates the mandatory provisions of ${currentCase.statute}.
(b) You are statutorily required to resolve the grievance, furnish certified records, and ensure complete compliance without arbitrary delay.

3. SPECIFIC DEMANDS & REMEDIES:
(i) ${currentCase.requestScope || 'Take immediate remedial action and resolve the grievance in full.'}
(ii) Provide complete written reasons and certified copies of file notesheets concerning the action taken.
(iii) Respond within the mandatory statutory period of ${currentCase.daysRemaining || 30} days from receipt.

4. NOTICE OF LEGAL ACTION & COST LIABILITY:
Take notice that in default of compliance within the stipulated period, the Requester shall initiate appropriate appellate and judicial proceedings before the competent Forum / Commission / Court, holding you liable for all costs and statutory interest.

Yours faithfully,
${currentCase.autoRedactEnabled ? '[REDACTED_REQUESTER]' : 'Authorized Requester'}`)
  );

  // Custom Prompt for re-drafting
  const [customDraftPrompt, setCustomDraftPrompt] = useState('');

  // Stress test state
  const [stressTesting, setStressTesting] = useState(false);
  const [stressResult, setStressResult] = useState<AIStressTestResponse | null>(
    currentCase.vulnerabilities
      ? {
          score: currentCase.score || 88,
          grade: (currentCase.score || 88) >= 90 ? 'A+' : 'A',
          vulnerabilities: (currentCase.vulnerabilities || []).map((v) => ({
            title: 'Potential Opposition Maneuver',
            description: v,
            impact: 'medium',
            fixAvailable: true,
            fixActionText: 'Apply Statutory Counter-Clause',
          })),
          strengths: [
            `Clear statutory basis established under ${currentCase.statute}`,
            'Structured chronological statement of facts',
            'Specific demand and compliance timeline served',
          ],
          recommendedFixes: currentCase.recommendedFixes || [],
          appellateStrategy: currentCase.appellateStrategy || 'First Appeal before First Appellate Authority / Consumer Commission',
        }
      : null
  );

  // Agency Response Decoder state
  const [customAgencyText, setCustomAgencyText] = useState('');
  const [decodingResponse, setDecodingResponse] = useState(false);
  const [decodedResult, setDecodedResult] = useState<AIDecodedResponse | null>(null);
  const [selectedPresetIndex] = useState<number>(0);

  // Facts state
  const [showAddFact, setShowAddFact] = useState(false);
  const [newFactLabel, setNewFactLabel] = useState('');
  const [newFactValue, setNewFactValue] = useState('');

  // Officer Directory Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingOfficer, setSearchingOfficer] = useState(false);
  const [searchResult, setSearchResult] = useState<AuthoritySearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Generate / Re-draft AI Notice
  const handleGenerateAIDraft = async (specialInstruction?: string) => {
    setGeneratingDraft(true);
    try {
      const instructions = specialInstruction || customDraftPrompt || undefined;
      const res = await generateFilingDraftApi(currentCase, instructions);
      if (res.formalLetter) {
        setDraftNoticeText(res.formalLetter);
        onUpdateCase({
          ...currentCase,
          formalLetter: res.formalLetter,
          description: res.formalLetter,
          statutoryClauses: res.statutoryClauses,
          recommendedExhibits: res.recommendedExhibits,
        });
      }
    } catch (err) {
      console.error('Failed to generate AI draft:', err);
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Run AI Stress Test
  const handleRunStressTest = async () => {
    setStressTesting(true);
    try {
      const res = await stressTestApi(currentCase);
      setStressResult(res);
      if (res.score) {
        onUpdateCase({
          ...currentCase,
          score: res.score,
          vulnerabilities: res.vulnerabilities?.map((v) => v.description),
          recommendedFixes: res.recommendedFixes,
          appellateStrategy: res.appellateStrategy,
        });
      }
    } catch (err) {
      console.error('Failed to run AI stress test:', err);
    } finally {
      setStressTesting(false);
    }
  };

  // Search Live Authority Directory
  const handleSearchDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchingOfficer(true);
    setSearchError(null);
    try {
      const res = await searchOfficerApi(
        searchQuery.trim(),
        currentCase.officer?.jurisdiction || 'Bengaluru'
      );
      setSearchResult(res);
    } catch (err: any) {
      console.error('Directory search error:', err);
      setSearchError('Could not find contacts for this department. Please refine your search.');
    } finally {
      setSearchingOfficer(false);
    }
  };

  // Apply Discovered Authority Contacts to Case
  const handleApplyDiscoveredOfficer = () => {
    if (!searchResult) return;

    const updatedOfficer = {
      ...currentCase.officer,
      name: searchResult.officerTitle.split('&')[0]?.trim() || currentCase.officer?.name || 'Designated Public Officer',
      title: searchResult.officerTitle,
      department: searchResult.department,
      email: searchResult.nodalEmail,
      address: searchResult.officeAddress,
      portalUrl: searchResult.grievancePortal,
    };

    const updatedCase = {
      ...currentCase,
      officer: updatedOfficer,
      statute: searchResult.statute || currentCase.statute,
    };

    onUpdateCase(updatedCase);

    // Also update draft notice recipient header if possible
    const updatedDraft = draftNoticeText.replace(
      /To:[\s\S]*?Date:/i,
      `To:\n${updatedOfficer.name}\n${updatedOfficer.title}, ${updatedOfficer.department}\n${updatedOfficer.address}\nEmail: ${updatedOfficer.email}\n\nDate:`
    );
    setDraftNoticeText(updatedDraft);
  };

  // Decode Agency Response
  const handleDecodeResponse = async () => {
    const textToDecode = customAgencyText.trim() || DECODED_RESPONSES[selectedPresetIndex]?.departmentStatement || '';
    if (!textToDecode) return;

    setDecodingResponse(true);
    try {
      const res = await interpretResponseApi(textToDecode, currentCase.category);
      setDecodedResult(res);
    } catch (err) {
      console.error('Failed to decode response:', err);
    } finally {
      setDecodingResponse(false);
    }
  };

  // Copy Draft Notice
  const handleCopyDraft = () => {
    navigator.clipboard.writeText(draftNoticeText);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  // Toggle PII mask
  const togglePiiMask = (id: string) => {
    const updated = (currentCase.piiItems || []).map((item) =>
      item.id === id ? { ...item, masked: !item.masked } : item
    );
    onUpdateCase({ ...currentCase, piiItems: updated });
  };

  // Toggle Hardship clause
  const toggleHardshipClause = () => {
    const nextVal = !currentCase.hasHardshipClause;
    const newScore = nextVal ? Math.min(98, (currentCase.score || 84) + 12) : Math.max(70, (currentCase.score || 84) - 12);
    onUpdateCase({
      ...currentCase,
      hasHardshipClause: nextVal,
      score: newScore,
    });
  };

  // Add Fact
  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactLabel.trim() || !newFactValue.trim()) return;

    const newFact: ExtractedFact = {
      id: `fact-${Date.now()}`,
      label: newFactLabel.trim(),
      value: newFactValue.trim(),
    };

    onUpdateCase({
      ...currentCase,
      facts: [...(currentCase.facts || []), newFact],
    });

    setNewFactLabel('');
    setNewFactValue('');
    setShowAddFact(false);
  };

  // Remove Fact
  const handleRemoveFact = (id: string) => {
    onUpdateCase({
      ...currentCase,
      facts: (currentCase.facts || []).filter((f) => f.id !== id),
    });
  };

  // Step definition
  const STEPS = [
    { num: 1, label: 'Hide Private Info', icon: 'shield' },
    { num: 2, label: 'Who to Send It To', icon: 'account_box' },
    { num: 3, label: 'What Happened', icon: 'fact_check' },
    { num: 4, label: 'Official Letter', icon: 'edit_document' },
    { num: 5, label: 'Check Weak Points', icon: 'health_and_safety' },
    { num: 6, label: 'Translate Official Reply', icon: 'translate' },
  ];

  return (
    <div className="w-full flex-grow max-w-[1280px] mx-auto px-4 sm:px-8 md:px-10 py-6 flex flex-col gap-6">
      {/* Top Breadcrumb & Status Header */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[12.5px] text-[#64748B]">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-[#006c4a] flex items-center gap-1 cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>Home</span>
            </button>
            <span>/</span>
            <button
              onClick={() => onNavigate('my-filings')}
              className="hover:text-[#006c4a] cursor-pointer font-medium"
            >
              My Filings
            </button>
            <span>/</span>
            <span className="text-[#0F172A] font-bold font-mono">{currentCase.caseNumber}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
            <h1 className="font-headline text-[22px] sm:text-[24px] font-bold text-[#0F172A]">
              {currentCase.title}
            </h1>
            <span className="bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] text-[11.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {currentCase.category}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#475569]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#006c4a]">account_balance</span>
              <span>Law: {currentCase.statute}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#006c4a]">location_on</span>
              <span>{currentCase.officer?.jurisdiction || 'Local Jurisdiction'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#92400E] font-medium bg-[#FEF3C7] px-2 py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span>{currentCase.daysRemaining || 30} Days to Reply</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl text-[12.5px] font-bold text-[#166534]">
            <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
            <span>Strength: {currentCase.score || 88}%</span>
          </div>

          <button
            onClick={() => onDownloadPDF({ ...currentCase, formalLetter: draftNoticeText, description: draftNoticeText })}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Step Tabs Navigation Bar */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-2 shadow-sm flex overflow-x-auto no-scrollbar gap-1.5">
        {STEPS.map((step) => {
          const isActive = activeStep === step.num;
          return (
            <button
              key={step.num}
              onClick={() => setActiveStep(step.num)}
              className={`flex-1 min-w-[130px] py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#006c4a] text-white shadow-sm'
                  : 'bg-transparent text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
              <span className="whitespace-nowrap">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: HIDE PRIVATE INFO */}
      {activeStep === 1 && (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="font-headline text-[20px] font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c4a]">shield</span>
                <span>Hide Private Information</span>
              </h2>
              <p className="text-[14px] text-[#64748B] mt-0.5">
                Automatically masks your phone number, bank details, and personal address to keep your filing secure.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-[#DCFCE7] text-[#166534] text-[12px] font-bold px-3 py-1 rounded-full border border-[#BBF7D0]">
                {(currentCase.piiItems || []).filter((p) => p.masked).length} of {(currentCase.piiItems || []).length} Hidden
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
                Private details detected:
              </span>
              <div className="flex flex-col gap-2.5">
                {(currentCase.piiItems || []).length === 0 ? (
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13.5px] text-[#64748B]">
                    No sensitive financial or personal identity details detected in this filing.
                  </div>
                ) : (
                  (currentCase.piiItems || []).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[11px] font-bold uppercase text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                          {item.type}
                        </span>
                        <p className="text-[14px] font-medium text-[#0F172A] mt-1">{item.original}</p>
                      </div>
                      <button
                        onClick={() => togglePiiMask(item.id)}
                        className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          item.masked
                            ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                            : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                        }`}
                      >
                        {item.masked ? '🔒 Hidden' : '👁️ Visible'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-3">
              <span className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
                Protected Text Preview:
              </span>
              <p className="text-[14px] text-[#334155] leading-relaxed bg-white p-4 rounded-lg border border-[#E2E8F0]">
                {currentCase.redactedText || currentCase.rawIntakeText || currentCase.description}
              </p>
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[12.5px] text-[#1E40AF] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Protected tokens (e.g. [REDACTED_REQUESTER]) ensure your private data is shielded when notices are served.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: WHO TO SEND IT TO */}
      {activeStep === 2 && (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="font-headline text-[20px] font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c4a]">account_box</span>
                <span>Who to Send It To</span>
              </h2>
              <p className="text-[14px] text-[#64748B] mt-0.5">
                Real, designated public authority, grievance nodal officer, or corporate legal cell in {currentCase.officer?.jurisdiction || 'your city'}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Officer Card */}
            <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#006c4a] text-white font-bold flex items-center justify-center text-[16px] shadow-xs">
                  {currentCase.officer?.avatar || 'PO'}
                </div>
                <div>
                  <h3 className="font-headline font-bold text-[17px] text-[#0F172A]">
                    {currentCase.officer?.name || 'Public Information Officer'}
                  </h3>
                  <p className="text-[13px] text-[#006c4a] font-semibold">{currentCase.officer?.title || 'Designated Nodal Officer'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-3 border-t border-[#E2E8F0] text-[13.5px]">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[#64748B] whitespace-nowrap">Department:</span>
                  <span className="font-semibold text-[#0F172A] text-right">{currentCase.officer?.department || 'Civic Grievance Redressal Division'}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[#64748B] whitespace-nowrap">Jurisdiction / Area:</span>
                  <span className="font-semibold text-[#0F172A] text-right">{currentCase.officer?.jurisdiction || 'Local Office'}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[#64748B] whitespace-nowrap">Official Email:</span>
                  <span className="font-semibold text-[#0F172A] text-right font-mono text-[12.5px]">{currentCase.officer?.email || 'records.intake@civic-gateway.gov'}</span>
                </div>
                {currentCase.officer?.address && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[#64748B] whitespace-nowrap">Office Address:</span>
                    <span className="font-medium text-[#334155] text-right text-[12.5px]">{currentCase.officer.address}</span>
                  </div>
                )}
                {currentCase.officer?.portalUrl && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[#64748B] whitespace-nowrap">Online Portal:</span>
                    <a
                      href={currentCase.officer.portalUrl.startsWith('http') ? currentCase.officer.portalUrl : `https://${currentCase.officer.portalUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#006c4a] hover:underline font-semibold text-right text-[12.5px] flex items-center gap-1"
                    >
                      <span>{currentCase.officer.portalUrl}</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-2 p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg text-[12.5px] text-[#166534] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Designated officer & legal timeline ({currentCase.daysRemaining || 30} days) active for this statutory filing.</span>
              </div>
            </div>

            {/* Live Indian Authority Directory Search */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 flex flex-col gap-4">
              <div>
                <span className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#006c4a] text-[18px]">search</span>
                  <span>Search Real Department Directory</span>
                </span>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">
                  Look up real public authorities, consumer forums, police nodal cells, or municipal offices in {currentCase.officer?.jurisdiction || 'your city'}.
                </p>
              </div>

              <form onSubmit={handleSearchDirectory} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. BBMP Solid Waste, Consumer Forum, BESCOM, Police PIO"
                  className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] text-[#0F172A] outline-none focus:border-[#006c4a]"
                />
                <button
                  type="submit"
                  disabled={searchingOfficer || !searchQuery.trim()}
                  className="bg-[#006c4a] hover:bg-[#005137] text-white px-3.5 py-2 rounded-xl text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {searchingOfficer ? 'sync' : 'search'}
                  </span>
                  <span>{searchingOfficer ? 'Finding...' : 'Search'}</span>
                </button>
              </form>

              {searchError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[12.5px] text-[#991B1B]">
                  {searchError}
                </div>
              )}

              {searchResult && (
                <div className="p-4 bg-white border border-[#CBD5E1] rounded-xl flex flex-col gap-2.5 text-[13px]">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[#0F172A]">{searchResult.department}</span>
                    <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[11px] px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#006c4a] font-medium">{searchResult.officerTitle}</p>
                  <p className="text-[12px] text-[#475569]">
                    <span className="font-semibold">Email:</span> <span className="font-mono">{searchResult.nodalEmail}</span>
                  </p>
                  <p className="text-[12px] text-[#475569]">
                    <span className="font-semibold">Address:</span> {searchResult.officeAddress}
                  </p>
                  {searchResult.grievancePortal && (
                    <p className="text-[12px] text-[#475569]">
                      <span className="font-semibold">Portal:</span> {searchResult.grievancePortal}
                    </p>
                  )}
                  <button
                    onClick={handleApplyDiscoveredOfficer}
                    className="mt-1 w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-1.5 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>Use This Authority for My Notice</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: WHAT HAPPENED */}
      {activeStep === 3 && (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="font-headline text-[20px] font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c4a]">fact_check</span>
                <span>What Happened (Chronological Facts)</span>
              </h2>
              <p className="text-[14px] text-[#64748B] mt-0.5">
                Gemini synthesized your narrative into legally structured, chronological facts. You can edit or add points.
              </p>
            </div>
            <button
              onClick={() => setShowAddFact(true)}
              className="bg-[#006c4a] hover:bg-[#005137] text-white text-[12.5px] font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Detail</span>
            </button>
          </div>

          {/* Add Fact Form */}
          {showAddFact && (
            <form onSubmit={handleAddFact} className="p-4 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1">Fact Category</label>
                  <input
                    type="text"
                    value={newFactLabel}
                    onChange={(e) => setNewFactLabel(e.target.value)}
                    placeholder="e.g. Transaction Ref / Incident Date / Disputed Amount"
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] outline-none focus:border-[#006c4a]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#475569] mb-1">Fact Description</label>
                  <input
                    type="text"
                    value={newFactValue}
                    onChange={(e) => setNewFactValue(e.target.value)}
                    placeholder="e.g. ₹1,40,000 security deposit withheld despite clean exit handover on Jan 15"
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] outline-none focus:border-[#006c4a]"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFact(false)}
                  className="px-3 py-1.5 text-[12px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer"
                >
                  Save Point
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(currentCase.facts || []).map((fact) => (
              <div
                key={fact.id}
                className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start justify-between gap-3"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c4a] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    {fact.label}
                  </span>
                  <p className="text-[14px] font-medium text-[#0F172A] mt-1.5 leading-relaxed">{fact.value}</p>
                </div>
                <button
                  onClick={() => handleRemoveFact(fact.id)}
                  className="text-[#94A3B8] hover:text-[#DC2626] cursor-pointer p-1"
                  title="Remove detail"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-2">
            <span className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
              Specific Relief / Remedy Demanded:
            </span>
            <textarea
              value={currentCase.requestScope}
              onChange={(e) => onUpdateCase({ ...currentCase, requestScope: e.target.value })}
              rows={3}
              placeholder="e.g. Immediate refund of deposit with 12% p.a. interest or certified copies of notesheets within 30 days."
              className="w-full bg-white border border-[#CBD5E1] rounded-xl p-3 text-[14px] text-[#0F172A] outline-none focus:border-[#006c4a]"
            />
          </div>
        </div>
      )}

      {/* STEP 4: OFFICIAL LETTER (READY TO SEND) */}
      {activeStep === 4 && (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="font-headline text-[20px] font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c4a]">edit_document</span>
                <span>Official Statutory Notice Letter</span>
              </h2>
              <p className="text-[14px] text-[#64748B] mt-0.5">
                AI-analyzed, formally drafted legal notice with statutory citations, factual chronology, and penalty clauses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleGenerateAIDraft()}
                disabled={generatingDraft}
                className="bg-[#006c4a] hover:bg-[#005137] text-white px-3.5 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {generatingDraft ? 'sync' : 'auto_fix_high'}
                </span>
                <span>{generatingDraft ? 'Drafting with Gemini...' : 'Rewrite with AI'}</span>
              </button>

              <button
                onClick={handleCopyDraft}
                className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#CBD5E1] px-3.5 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedDraft ? 'check' : 'content_copy'}
                </span>
                <span>{copiedDraft ? 'Copied!' : 'Copy Letter'}</span>
              </button>
            </div>
          </div>

          {/* Quick Legal Tuning & Informal-to-Formal AI Refinement */}
          <div className="flex flex-col gap-3 bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mr-1">Quick Legal Presets:</span>
              <button
                onClick={() => handleGenerateAIDraft('Make notice more assertive, citing specific statutory penalties and personal cost liability.')}
                disabled={generatingDraft}
                className="bg-white hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#0F172A] px-2.5 py-1 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
              >
                ⚖️ High Assertiveness & Costs
              </button>
              <button
                onClick={() => handleGenerateAIDraft('Add explicit Section 10 Severability clause and certified inspection demand.')}
                disabled={generatingDraft}
                className="bg-white hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#0F172A] px-2.5 py-1 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
              >
                📑 Section 10 Severability
              </button>
              <button
                onClick={() => handleGenerateAIDraft('Include 48-Hour Urgent Life & Liberty notice invocation.')}
                disabled={generatingDraft}
                className="bg-white hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#0F172A] px-2.5 py-1 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
              >
                ⚡ 48-Hour Urgency Clause
              </button>
            </div>

            {/* Custom Informal-to-Formal Instruction Box */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#E2E8F0]">
              <input
                type="text"
                value={customDraftPrompt}
                onChange={(e) => setCustomDraftPrompt(e.target.value)}
                placeholder="Tell AI in plain words what to add or change (e.g. 'tell them I am a student, demand ₹25k mental agony compensation and 18% interest')..."
                className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] text-[#0F172A] outline-none focus:border-[#006c4a]"
              />
              <button
                type="button"
                onClick={() => handleGenerateAIDraft()}
                disabled={generatingDraft || !customDraftPrompt.trim()}
                className="bg-[#006c4a] hover:bg-[#005137] text-white px-4 py-2 rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {generatingDraft ? 'sync' : 'auto_fix_high'}
                </span>
                <span>{generatingDraft ? 'Drafting...' : 'Translate to Legal Letter'}</span>
              </button>
            </div>
          </div>

          {/* Large, Clean Full-Text Notice Area */}
          <div className="flex flex-col gap-2">
            <textarea
              value={draftNoticeText}
              onChange={(e) => setDraftNoticeText(e.target.value)}
              rows={18}
              className="w-full bg-[#F8FAFC] border-2 border-[#CBD5E1] focus:border-[#006c4a] focus:bg-white rounded-xl p-4 sm:p-5 font-mono text-[13.5px] sm:text-[14px] text-[#0F172A] leading-relaxed outline-none transition-colors shadow-inner"
              placeholder="Your statutory notice text..."
            />

            <div className="flex flex-wrap items-center justify-between text-[12px] text-[#64748B] px-1 gap-2">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#006c4a]">verified</span>
                <span>Ready to serve via Registered Speed Post AD, Official Email, or Portal.</span>
              </span>
              <button
                onClick={() => onDownloadPDF({ ...currentCase, formalLetter: draftNoticeText, description: draftNoticeText })}
                className="text-[#006c4a] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                <span>Download as Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: CHECK WEAK POINTS */}
      {activeStep === 5 && (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="font-headline text-[20px] font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c4a]">health_and_safety</span>
                <span>Adversarial Stress Test & Weak Points Scrutiny</span>
              </h2>
              <p className="text-[14px] text-[#64748B] mt-0.5">
                Gemini rigorously tests your filing for opposing party defenses, delay tactics, and exemption loopholes.
              </p>
            </div>

            <button
              onClick={handleRunStressTest}
              disabled={stressTesting}
              className="bg-[#006c4a] hover:bg-[#005137] text-white px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                {stressTesting ? 'sync' : 'security'}
              </span>
              <span>{stressTesting ? 'Analyzing weak points...' : 'Re-Run Stress Test'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vulnerabilities Detected */}
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-5 flex flex-col gap-3">
              <span className="text-[13px] font-bold text-[#991B1B] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                Opposition Defenses & Bureaucratic Excuses:
              </span>
              <ul className="flex flex-col gap-2.5 text-[13.5px] text-[#7F1D1D] list-disc list-inside">
                {stressResult?.vulnerabilities?.map((vuln, idx) => (
                  <li key={idx} className="leading-snug">
                    <span className="font-semibold">{vuln.title ? `${vuln.title}: ` : ''}</span>
                    <span>{vuln.description || (vuln as any)}</span>
                  </li>
                )) || (
                  <>
                    <li>Authority may claim that records involve third-party commercial confidence under Section 8(1)(d).</li>
                    <li>Department may claim search & duplication fees to delay disclosure.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Recommended Safeguards */}
            <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-5 flex flex-col gap-3">
              <span className="text-[13px] font-bold text-[#166534] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Statutory Safeguards & Loophole Fixes:
              </span>
              <ul className="flex flex-col gap-2.5 text-[13.5px] text-[#14532D] list-disc list-inside">
                {stressResult?.recommendedFixes?.map((fix, idx) => (
                  <li key={idx} className="leading-snug">{fix}</li>
                )) || (
                  <>
                    <li>Demand certified segregation of non-exempt portions under Section 10(1).</li>
                    <li>Cite mandatory 5-day Section 6(3) departmental transfer duty.</li>
                  </>
                )}
              </ul>

              <div className="mt-2 pt-3 border-t border-[#BBF7D0] flex items-center justify-between">
                <span className="text-[12.5px] font-bold text-[#166534]">Public Interest Fee Waiver Clause</span>
                <button
                  onClick={toggleHardshipClause}
                  className={`text-[12px] font-bold px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                    currentCase.hasHardshipClause
                      ? 'bg-[#166534] text-white'
                      : 'bg-white text-[#166534] border border-[#166534]'
                  }`}
                >
                  {currentCase.hasHardshipClause ? '✓ Applied (+12 Score)' : '+ Apply Fix'}
                </button>
              </div>
            </div>
          </div>

          {/* Appellate Strategy */}
          {stressResult?.appellateStrategy && (
            <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex flex-col gap-1.5">
              <span className="text-[12.5px] font-bold text-[#1E40AF] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">alt_route</span>
                <span>Statutory Appellate Strategy</span>
              </span>
              <p className="text-[13.5px] text-[#1E3A8A] leading-relaxed">
                {stressResult.appellateStrategy}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP 6: TRANSLATE OFFICIAL REPLY */}
      {activeStep === 6 && (
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="font-headline text-[20px] font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c4a]">translate</span>
                <span>Translate Official Reply</span>
              </h2>
              <p className="text-[14px] text-[#64748B] mt-0.5">
                Received a vague, rejecting, or bureaucratic letter? Paste it here to uncover what it actually means and get a ready rebuttal.
              </p>
            </div>

            <button
              onClick={handleDecodeResponse}
              disabled={decodingResponse}
              className="bg-[#006c4a] hover:bg-[#005137] text-white px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                {decodingResponse ? 'sync' : 'bolt'}
              </span>
              <span>{decodingResponse ? 'Translating...' : 'Translate Reply'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
              Paste the letter or message you received:
            </label>
            <textarea
              value={customAgencyText}
              onChange={(e) => setCustomAgencyText(e.target.value)}
              placeholder="e.g. 'The requested records cannot be provided under Section 8(1)(h) pending ongoing inquiry, and your refund request cannot be entertained at this time...'"
              rows={3}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#006c4a] rounded-xl p-3 text-[14px] text-[#0F172A] outline-none"
            />
          </div>

          {/* Decoded Output */}
          <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-4">
            <span className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
              Plain English Legal Analysis:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0]">
                <p className="text-[12px] font-bold text-[#DC2626] uppercase">What They Actually Mean</p>
                <p className="text-[14px] text-[#334155] mt-1 font-medium leading-relaxed">
                  {decodedResult?.plainEnglish || decodedResult?.actualMeaning || 'They are using standard bureaucratic delay excuses hoping you miss the 30-day appeal deadline.'}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0]">
                <p className="text-[12px] font-bold text-[#006c4a] uppercase">What You Should Do Next</p>
                <p className="text-[14px] text-[#334155] mt-1 font-medium leading-relaxed">
                  {decodedResult?.recommendedNextStep || decodedResult?.recommendedAction || 'Serve a 48-hour Demand for Segregation or immediately file a First Appeal before the First Appellate Authority.'}
                </p>
              </div>
            </div>

            {decodedResult?.suggestedRebuttal && (
              <div className="p-4 bg-white border border-[#CBD5E1] rounded-xl flex flex-col gap-2">
                <span className="text-[12px] font-bold text-[#0F172A] uppercase">Ready-to-Send Statutory Rebuttal:</span>
                <p className="text-[13.5px] font-mono text-[#334155] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  {decodedResult.suggestedRebuttal}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
