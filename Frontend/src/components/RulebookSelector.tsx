import React, { useState, useRef } from 'react';
import { Rulebook } from '../types';
import { FoldText } from './animations/FoldText';
import { RotatingText } from './animations/RotatingText';
import { TextType } from './animations/TextType';
import { analyzeIssueApi, AIAnalysisResponse } from '../services/api';

interface RulebookSelectorProps {
  rulebooks: Rulebook[];
  selectedCity?: string;
  onSelectRulebook: (rulebookId: string, initialPrompt?: string) => void;
  onLaunchAICase?: (aiData: AIAnalysisResponse, rawText: string) => void;
  onSaveAICaseToCloud?: (aiData: AIAnalysisResponse, rawText: string) => Promise<void>;
  onViewAllRulebooks: () => void;
  onAnalyzePrompt: (prompt: string) => void;
  onOpenGuidedIntake?: (category?: string) => void;
  onOpenRtiAuditor?: () => void;
}

const SAMPLE_SCENARIOS = [
  'Landlord refusing to refund ₹1,40,000 security deposit after clean handover',
  'Municipal corporation tender expenditure and quality audit for Ward 150 road work',
  'E-commerce seller delivered defective laptop and refused refund of ₹64,990',
  'Employer withholding 2 months salary and ₹1,80,000 F&F settlement after resignation',
  'Bank refusing chargeback for ₹50,000 unauthorized credit card transaction',
];

export const RulebookSelector: React.FC<RulebookSelectorProps> = ({
  rulebooks,
  selectedCity = 'Delhi (NCR)',
  onSelectRulebook,
  onLaunchAICase,
  onSaveAICaseToCloud,
  onViewAllRulebooks,
  onAnalyzePrompt,
  onOpenGuidedIntake,
  onOpenRtiAuditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [savedToCloudFeedback, setSavedToCloudFeedback] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [copiedRtiDraft, setCopiedRtiDraft] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedPdf(file);
        if (!searchQuery.trim()) {
          setSearchQuery(`Document Attached: ${file.name}`);
        }
      } else {
        alert('Please select a valid PDF file.');
      }
    }
  };

  const handleRemovePdf = () => {
    setSelectedPdf(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (searchQuery.startsWith('Document Attached:')) {
      setSearchQuery('');
    }
  };

  const handleAnalyze = async (textToAnalyze?: string) => {
    let text = (textToAnalyze ?? searchQuery).trim();
    if (!text && !selectedPdf) {
      text = SAMPLE_SCENARIOS[0];
      setSearchQuery(text);
    } else if (!text && selectedPdf) {
      text = `Analyze attached document: ${selectedPdf.name}`;
      setSearchQuery(text);
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAiAnalysis(null);
    setSavedToCloudFeedback(false);

    try {
      const result = await analyzeIssueApi(text, selectedCity, selectedPdf || undefined);
      setAiAnalysis(result);
    } catch (err: any) {
      console.error('Error analyzing grievance:', err);
      setAnalysisError(err?.message || 'Failed to reach AI analysis engine. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyBrief = () => {
    if (!aiAnalysis) return;
    const briefText = `CASE BRIEF:
Title: ${aiAnalysis.title}
Statute: ${aiAnalysis.statute}
Category: ${aiAnalysis.category}
Authority: ${aiAnalysis.officer.name} (${aiAnalysis.officer.title}, ${aiAnalysis.officer.department})
Statutory Window: ${aiAnalysis.daysRemaining} days

CIVIC RIGHTS:
${aiAnalysis.civicRights?.map((r) => `• ${r}`).join('\n') || 'N/A'}

${aiAnalysis.pdfSummary ? `DOCUMENT SUMMARY:\n${aiAnalysis.pdfSummary}\n\n` : ''}DRAFTED RTI APPLICATION:
${aiAnalysis.draftedRti || aiAnalysis.formalLetter}

LEGAL ASSESSMENT:
${aiAnalysis.legalDiagnosis}`;

    navigator.clipboard.writeText(briefText);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const handleCopyRtiDraft = () => {
    if (!aiAnalysis) return;
    const textToCopy = aiAnalysis.draftedRti || aiAnalysis.formalLetter;
    navigator.clipboard.writeText(textToCopy);
    setCopiedRtiDraft(true);
    setTimeout(() => setCopiedRtiDraft(false), 2500);
  };

  const handleSaveToCloud = async () => {
    if (!aiAnalysis || !onSaveAICaseToCloud) return;
    try {
      await onSaveAICaseToCloud(aiAnalysis, searchQuery || selectedPdf?.name || SAMPLE_SCENARIOS[0]);
      setSavedToCloudFeedback(true);
      setTimeout(() => setSavedToCloudFeedback(false), 3000);
    } catch (err) {
      console.error('Failed to save to cloud:', err);
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center max-w-[1280px] mx-auto px-4 sm:px-8 md:px-10 py-6 sm:py-8">
      {/* Hero Section */}
      <section className="w-full max-w-4xl flex flex-col items-center text-center gap-5 mb-10 mt-2">
        <h1 className="font-headline text-[34px] sm:text-[44px] font-bold text-[#0F172A] tracking-tight leading-tight">
          <FoldText
            text="What issue are you facing?"
            hoverEffect={false}
            stagger={0.03}
            duration={0.65}
            perspective={1000}
            foldDirection="top"
          />
        </h1>

        {/* Subheading with Badge Box */}
        <div className="text-[15px] sm:text-[17px] text-[#475569] leading-normal flex flex-wrap items-center justify-center gap-2 max-w-3xl">
          <span>Generate statutory legal notices and filings for</span>
          <div className="inline-flex items-center justify-center min-h-[38px] px-3.5 py-1 rounded-lg bg-white text-[#006c4a] border border-[#CBD5E1] shadow-xs">
            <RotatingText
              texts={[
                'Right to Information (RTI)',
                'Consumer Refunds & Deficiencies',
                'Tenancy & Deposit Disputes',
                'Unpaid Salary & Labor Dues',
                'Banking Fraud & Chargebacks',
              ]}
              rotationInterval={2800}
              staggerDuration={0.02}
              elementLevelClassName="text-[#006c4a] font-bold font-headline text-[14.5px] sm:text-[16px]"
            />
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            onClick={() => onOpenGuidedIntake && onOpenGuidedIntake('consumer')}
            className="bg-[#006c4a] hover:bg-[#005137] text-white text-[13px] font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[17px]">add_circle</span>
            <span>New Filing Draft</span>
          </button>

          <button
            onClick={() => onOpenRtiAuditor && onOpenRtiAuditor()}
            className="bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#006c4a] text-[#0F172A] text-[13px] font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[17px] text-[#006c4a]">verified</span>
            <span>Audit RTI Strength & PDFs</span>
          </button>
        </div>

        {/* Search & Issue Description Bar with Integrated PDF Upload */}
        <div className="w-full flex flex-col gap-2 mt-3">
          <div className="w-full relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#64748B] z-20">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAnalyze();
              }}
              placeholder={selectedPdf ? `Attached: ${selectedPdf.name}` : ''}
              className="w-full pl-12 pr-48 py-4 rounded-xl bg-white border border-[#CBD5E1] focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10 text-[15px] sm:text-[16px] text-[#0F172A] shadow-sm transition-all duration-200"
            />

            {!searchQuery && !selectedPdf && !isInputFocused && (
              <div className="absolute inset-y-0 left-12 right-48 flex items-center pointer-events-none text-[#64748B] text-[14px] sm:text-[15.5px] truncate overflow-hidden">
                <span className="text-[#94A3B8] mr-1.5 shrink-0 hidden sm:inline">e.g.</span>
                <TextType
                  text={SAMPLE_SCENARIOS}
                  typingSpeed={35}
                  deletingSpeed={18}
                  pauseDuration={2400}
                  cursor="▍"
                  cursorClassName="text-[#006c4a] font-normal"
                  className="text-[#64748B] truncate"
                />
              </div>
            )}

            {/* Clear Text button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-44 sm:right-48 px-2 text-[#94A3B8] hover:text-[#0F172A] flex items-center cursor-pointer z-20"
                title="Clear text"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}

            {/* Action Group: PDF Upload Button + Analyze Button */}
            <div className="absolute inset-y-2 right-2 flex items-center gap-1.5 z-20">
              {/* PDF File Input (Hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                id="pdfUploadInput"
                accept=".pdf,application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />

              {/* PDF Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`h-full px-3 rounded-lg border text-[13px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  selectedPdf
                    ? 'bg-[#ECFDF5] border-[#86EFAC] text-[#006c4a]'
                    : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#CBD5E1] text-[#475569]'
                }`}
                title="Upload RTI or Legal PDF document for analysis"
              >
                <span className="material-symbols-outlined text-[18px] text-[#006c4a]">
                  {selectedPdf ? 'task' : 'upload_file'}
                </span>
                <span className="hidden sm:inline">{selectedPdf ? 'PDF Attached' : 'Attach PDF'}</span>
              </button>

              {/* Analyze Button */}
              <button
                onClick={() => handleAnalyze()}
                disabled={analyzing}
                className="h-full px-4 sm:px-5 bg-[#006c4a] hover:bg-[#005137] text-white rounded-lg font-semibold text-[14px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-75"
              >
                {analyzing ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    <span className="hidden sm:inline">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Selected PDF Badge Bar */}
          {selectedPdf && (
            <div className="flex items-center justify-between bg-[#F0FDF4] border border-[#BBF7D0] px-3.5 py-1.5 rounded-lg text-[13px] text-[#166534] animate-in fade-in duration-200">
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-[18px] text-[#006c4a]">picture_as_pdf</span>
                <span className="font-semibold truncate">{selectedPdf.name}</span>
                <span className="text-[11.5px] text-[#15803D]">({(selectedPdf.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                type="button"
                onClick={handleRemovePdf}
                className="text-[#15803D] hover:text-[#DC2626] flex items-center gap-0.5 text-[12px] font-semibold ml-2 cursor-pointer transition-colors"
                title="Remove attached PDF"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Scenario Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[12px] text-[#64748B]">
          <span className="font-semibold text-[#475569]">Quick Scenarios:</span>
          {SAMPLE_SCENARIOS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSearchQuery(prompt);
                handleAnalyze(prompt);
              }}
              className="bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#475569] px-3 py-1 rounded-full text-left transition-colors cursor-pointer shadow-2xs"
            >
              {prompt.length > 40 ? `${prompt.slice(0, 40)}...` : prompt}
            </button>
          ))}
        </div>

        {/* Error message */}
        {analysisError && (
          <div className="w-full text-left bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 text-[#991B1B] text-[14px] flex items-start gap-3 shadow-xs">
            <span className="material-symbols-outlined text-[20px] text-[#DC2626] shrink-0 mt-0.5">error</span>
            <div className="flex-grow">
              <p className="font-semibold">Analysis Notice</p>
              <p className="text-[13px] mt-0.5">{analysisError}</p>
              <button
                onClick={() => handleAnalyze(SAMPLE_SCENARIOS[0])}
                className="mt-2 bg-[#DC2626] text-white text-[12px] font-semibold px-3 py-1 rounded-md cursor-pointer hover:bg-[#B91C1C] transition-colors inline-flex items-center gap-1"
              >
                <span>Retry with Standard Scenario</span>
              </button>
            </div>
          </div>
        )}

        {/* Redesigned, Simplified AI Analysis Results Panel */}
        {aiAnalysis && (
          <div className="w-full text-left bg-white border border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-md animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col gap-5">
            {/* Header: Clean Summary & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#006c4a] bg-[#ECFDF5] px-3 py-1 rounded-full border border-[#A7F3D0]">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  <span>{aiAnalysis.category}</span>
                </span>
                <span className="inline-flex items-center text-[12px] font-medium text-[#475569] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                  Statute: {aiAnalysis.statute}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] px-3 py-1 rounded-full text-[12px] font-semibold">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  <span>Statutory Clock: {aiAnalysis.daysRemaining} Days</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#ECFDF5] border border-[#86EFAC] text-[#166534] px-3 py-1 rounded-full text-[12px] font-bold">
                  <span className="material-symbols-outlined text-[15px]">thumb_up</span>
                  <span>Viability: {aiAnalysis.initialScore || 88}%</span>
                </div>
              </div>
            </div>

            {/* Case Title & Legal Assessment */}
            <div>
              <h2 className="font-headline text-[21px] sm:text-[23px] font-bold text-[#0F172A]">
                {aiAnalysis.title}
              </h2>
              <p className="text-[14px] text-[#334155] mt-2 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <strong className="text-[#0F172A] font-semibold">Legal Assessment: </strong>
                {aiAnalysis.legalDiagnosis}
              </p>
            </div>

            {/* 1. Civic Rights Box (Replaces old Extracted Legal Facts) */}
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-[15.5px] font-bold text-[#166534] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006c4a] text-[20px]">balance</span>
                  <span>Your Civic Rights & Legal Standing</span>
                </h3>
                <span className="text-[11.5px] font-bold text-[#15803D] bg-white px-2.5 py-0.5 rounded-full border border-[#86EFAC]">
                  Statutory Entitlements
                </span>
              </div>

              <ul className="flex flex-col gap-2 pt-1">
                {aiAnalysis.civicRights && aiAnalysis.civicRights.length > 0 ? (
                  aiAnalysis.civicRights.map((right, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-[13.5px] text-[#14532D] leading-relaxed">
                      <span className="material-symbols-outlined text-[#006c4a] text-[18px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{right}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[13px] text-[#15803D]">
                    You have the right to seek information, demand accountability, and obtain verified responses under statutory laws.
                  </li>
                )}
              </ul>
            </div>

            {/* 2. Document Summary Box (Shown IF user uploaded a PDF or pdfSummary is available) */}
            {(aiAnalysis.pdfSummary || selectedPdf) && (
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 sm:p-5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline text-[15px] font-bold text-[#1E40AF] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2563EB] text-[20px]">description</span>
                    <span>Document Summary (Plain English)</span>
                  </h3>
                  <span className="text-[11.5px] font-semibold text-[#1E40AF] bg-white px-2.5 py-0.5 rounded-full border border-[#93C5FD]">
                    {selectedPdf ? selectedPdf.name : 'Analyzed Document'}
                  </span>
                </div>
                <div className="text-[13.5px] text-[#1E3A8A] leading-relaxed whitespace-pre-line bg-white/70 p-3 rounded-lg border border-[#DBEAFE]">
                  {aiAnalysis.pdfSummary || `Uploaded file "${selectedPdf?.name}" was analyzed and distilled into actionable civic rights and RTI queries.`}
                </div>
              </div>
            )}

            {/* 3. Drafted RTI Application Box (Prominent) */}
            <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 sm:p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-headline text-[15.5px] font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006c4a] text-[20px]">edit_document</span>
                  <span>Drafted RTI Application</span>
                </h3>

                <button
                  type="button"
                  onClick={handleCopyRtiDraft}
                  className="bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] text-[12px] font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#006c4a]">
                    {copiedRtiDraft ? 'done' : 'content_copy'}
                  </span>
                  <span>{copiedRtiDraft ? 'Draft Copied!' : 'Copy RTI Draft'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-[12.5px] sm:text-[13px] text-[#0F172A] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto select-text">
                  {aiAnalysis.draftedRti || aiAnalysis.formalLetter}
                </pre>
              </div>
            </div>

            {/* Routing Authority & Protections Bar (Streamlined) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#006c4a] flex items-center justify-center font-bold text-[13px] shrink-0">
                  {aiAnalysis.officer.avatar || 'AO'}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase text-[#64748B] block">Routing Authority</span>
                  <p className="text-[13px] font-bold text-[#0F172A] truncate">{aiAnalysis.officer.name}</p>
                  <p className="text-[11.5px] text-[#64748B] truncate">{aiAnalysis.officer.department}</p>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">shield</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase text-[#64748B] block">Privacy & Security</span>
                  <p className="text-[13px] font-bold text-[#0F172A]">PII Masking Active</p>
                  <p className="text-[11.5px] text-[#64748B]">Personal details auto-redacted before submission</p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyBrief}
                  className="bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] font-medium text-[13px] px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-[#CBD5E1] shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedBrief ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedBrief ? 'Brief Copied!' : 'Copy Summary'}</span>
                </button>

                {onSaveAICaseToCloud && (
                  <button
                    onClick={handleSaveToCloud}
                    className="bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#006c4a] font-medium text-[13px] px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-[#86EFAC] shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {savedToCloudFeedback ? 'done_all' : 'cloud_upload'}
                    </span>
                    <span>{savedToCloudFeedback ? 'Saved to Cloud!' : 'Save Case'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setAiAnalysis(null);
                    setSearchQuery('');
                    handleRemovePdf();
                  }}
                  className="text-[#64748B] hover:text-[#0F172A] text-[13px] font-medium px-3 py-2 cursor-pointer transition-colors"
                >
                  Clear
                </button>

                <button
                  onClick={() => {
                    const promptToUse = searchQuery || selectedPdf?.name || SAMPLE_SCENARIOS[0];
                    onAnalyzePrompt(promptToUse);
                    if (onLaunchAICase) {
                      onLaunchAICase(aiAnalysis, promptToUse);
                    } else {
                      onSelectRulebook(aiAnalysis.rulebookId, promptToUse);
                    }
                  }}
                  className="bg-[#006c4a] hover:bg-[#005137] text-white font-bold text-[14px] px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01] w-full sm:w-auto"
                >
                  <span>Open Full Drafting Workspace</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Statutory Filing Templates Catalog */}
      <section className="w-full mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h2 className="font-headline text-[28px] sm:text-[32px] font-bold text-[#0F172A] tracking-tight mb-1">
              Statutory Filing Templates
            </h2>
            <p className="text-[15px] text-[#64748B]">
              Select a statutory template to assess your rights and draft a legally binding notice.
            </p>
          </div>

          <button
            onClick={onViewAllRulebooks}
            className="flex items-center gap-1.5 text-[#0F172A] hover:text-[#006c4a] font-semibold text-[14px] transition-colors cursor-pointer group"
          >
            <span>View All Templates</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: RTI */}
          <div
            onClick={() => onOpenGuidedIntake ? onOpenGuidedIntake('rti') : onSelectRulebook('rti')}
            className="bg-white border border-[#CBD5E1] rounded-xl p-6 flex flex-col gap-4 hover:border-[#006c4a] hover:shadow-md transition-all duration-200 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-lg bg-[#0F172A]/5 flex items-center justify-center border border-[#0F172A]/10 text-[#0F172A] group-hover:bg-[#006c4a] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <div>
                  <h3 className="font-headline text-[20px] font-bold text-[#0F172A] group-hover:text-[#006c4a] transition-colors">
                    Right to Information (RTI)
                  </h3>
                  <span className="text-[11px] font-bold text-[#006c4a] bg-[#DCFCE7] px-2 py-0.5 rounded uppercase tracking-wider">
                    ACTIVE TEMPLATE
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[14px] text-[#475569] leading-relaxed flex-grow">
              File formal requests to access certified records, file notesheets, tender expenditures, or status reports held by public authorities under RTI Act 2005.
            </p>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#64748B] text-[13px]">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>Est. 15 mins to draft</span>
              </div>
              <button className="bg-[#0F172A] group-hover:bg-[#006c4a] text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5">
                <span>Start Filing</span>
                <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
              </button>
            </div>
          </div>

          {/* Card 2: Consumer Disputes */}
          <div
            onClick={() => onOpenGuidedIntake ? onOpenGuidedIntake('consumer') : onSelectRulebook('consumer')}
            className="bg-white border border-[#CBD5E1] rounded-xl p-6 flex flex-col gap-4 hover:border-[#006c4a] hover:shadow-md transition-all duration-200 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-lg bg-[#0F172A]/5 flex items-center justify-center border border-[#0F172A]/10 text-[#0F172A] group-hover:bg-[#006c4a] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
                </div>
                <div>
                  <h3 className="font-headline text-[20px] font-bold text-[#0F172A] group-hover:text-[#006c4a] transition-colors">
                    Consumer Disputes & Refunds
                  </h3>
                  <span className="text-[11px] font-bold text-[#006c4a] bg-[#DCFCE7] px-2 py-0.5 rounded uppercase tracking-wider">
                    ACTIVE TEMPLATE
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[14px] text-[#475569] leading-relaxed flex-grow">
              Demand full refunds, replacements, or damages from sellers, airlines, or service providers for defective goods and service deficiencies under Consumer Protection Act 2019.
            </p>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#64748B] text-[13px]">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>Est. 20 mins to draft</span>
              </div>
              <button className="bg-[#0F172A] group-hover:bg-[#006c4a] text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5">
                <span>Start Filing</span>
                <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
              </button>
            </div>
          </div>

          {/* Card 3: Tenancy Notice */}
          <div
            onClick={() => onOpenGuidedIntake ? onOpenGuidedIntake('tenancy') : onSelectRulebook('tenancy')}
            className="bg-white border border-[#CBD5E1] rounded-xl p-6 flex flex-col gap-4 hover:border-[#006c4a] hover:shadow-md transition-all duration-200 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-lg bg-[#0F172A]/5 flex items-center justify-center border border-[#0F172A]/10 text-[#0F172A] group-hover:bg-[#006c4a] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[24px]">home_work</span>
                </div>
                <div>
                  <h3 className="font-headline text-[20px] font-bold text-[#0F172A] group-hover:text-[#006c4a] transition-colors">
                    Tenancy & Security Deposit Notice
                  </h3>
                  <span className="text-[11px] font-bold text-[#006c4a] bg-[#DCFCE7] px-2 py-0.5 rounded uppercase tracking-wider">
                    ACTIVE TEMPLATE
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[14px] text-[#475569] leading-relaxed flex-grow">
              Statutory pre-litigation notices for landlords unlawfully withholding rental deposits, arbitrary deductions, or illegal eviction notices under Tenancy Acts.
            </p>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#64748B] text-[13px]">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>Est. 15 mins to draft</span>
              </div>
              <button className="bg-[#0F172A] group-hover:bg-[#006c4a] text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5">
                <span>Start Filing</span>
                <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
              </button>
            </div>
          </div>

          {/* Card 4: Wage Recovery */}
          <div
            onClick={() => onOpenGuidedIntake ? onOpenGuidedIntake('employment') : onSelectRulebook('employment')}
            className="bg-white border border-[#CBD5E1] rounded-xl p-6 flex flex-col gap-4 hover:border-[#006c4a] hover:shadow-md transition-all duration-200 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-lg bg-[#0F172A]/5 flex items-center justify-center border border-[#0F172A]/10 text-[#0F172A] group-hover:bg-[#006c4a] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[24px]">payments</span>
                </div>
                <div>
                  <h3 className="font-headline text-[20px] font-bold text-[#0F172A] group-hover:text-[#006c4a] transition-colors">
                    Wage Recovery & Labor Settlement
                  </h3>
                  <span className="text-[11px] font-bold text-[#006c4a] bg-[#DCFCE7] px-2 py-0.5 rounded uppercase tracking-wider">
                    ACTIVE TEMPLATE
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[14px] text-[#475569] leading-relaxed flex-grow">
              Formal demand notices for unpaid salary, withheld full & final settlement (F&F), gratuity, and relieving certificates under Payment of Wages and Labor laws.
            </p>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#64748B] text-[13px]">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>Est. 18 mins to draft</span>
              </div>
              <button className="bg-[#0F172A] group-hover:bg-[#006c4a] text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5">
                <span>Start Filing</span>
                <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
