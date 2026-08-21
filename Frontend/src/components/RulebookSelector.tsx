import React, { useState } from 'react';
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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [savedToCloudFeedback, setSavedToCloudFeedback] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  const handleAnalyze = async (textToAnalyze?: string) => {
    let text = (textToAnalyze ?? searchQuery).trim();
    if (!text) {
      text = SAMPLE_SCENARIOS[0];
      setSearchQuery(text);
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAiAnalysis(null);
    setSavedToCloudFeedback(false);

    try {
      const result = await analyzeIssueApi(text, selectedCity);
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

EXTRACTED FACTS:
${aiAnalysis.facts.map((f) => `• ${f.label}: ${f.value}`).join('\n')}

LEGAL ASSESSMENT:
${aiAnalysis.legalDiagnosis}

DEFENSE ADVISORY:
${aiAnalysis.vulnerabilities?.map((v) => `• ${v}`).join('\n') || 'None identified'}`;

    navigator.clipboard.writeText(briefText);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const handleSaveToCloud = async () => {
    if (!aiAnalysis || !onSaveAICaseToCloud) return;
    try {
      await onSaveAICaseToCloud(aiAnalysis, searchQuery || SAMPLE_SCENARIOS[0]);
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

        {/* Search & Issue Description Bar */}
        <div className="w-full relative group mt-3">
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
            className="w-full pl-12 pr-36 py-4 rounded-xl bg-white border border-[#CBD5E1] focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10 text-[15px] sm:text-[16px] text-[#0F172A] shadow-sm transition-all duration-200"
          />

          {!searchQuery && !isInputFocused && (
            <div className="absolute inset-y-0 left-12 right-36 flex items-center pointer-events-none text-[#64748B] text-[14px] sm:text-[15.5px] truncate overflow-hidden">
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

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-32 sm:right-36 px-2 text-[#94A3B8] hover:text-[#0F172A] flex items-center cursor-pointer z-20"
              title="Clear text"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}

          <button
            onClick={() => handleAnalyze()}
            disabled={analyzing}
            className="absolute inset-y-2 right-2 px-5 sm:px-6 bg-[#006c4a] hover:bg-[#005137] text-white rounded-lg font-semibold text-[14px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-75 z-20"
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

        {/* User-Friendly Comprehensive AI Analysis Results Panel */}
        {aiAnalysis && (
          <div className="w-full text-left bg-white border-2 border-[#86EFAC] rounded-2xl p-6 sm:p-7 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
            {/* Top Badge Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-[#166534] bg-[#DCFCE7] px-3 py-1 rounded-full border border-[#BBF7D0]">
                  <span className="material-symbols-outlined text-[15px]">gavel</span>
                  <span>{aiAnalysis.category}</span>
                </span>
                <span className="inline-flex items-center text-[12px] font-bold text-[#0F172A] bg-[#F1F5F9] px-3 py-1 rounded-full border border-[#CBD5E1]">
                  Statute: {aiAnalysis.statute}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] px-3 py-1 rounded-full text-[12px] font-semibold">
                  <span className="material-symbols-outlined text-[15px]">hourglass_top</span>
                  <span>Statutory Clock: {aiAnalysis.daysRemaining} Days</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] px-3 py-1 rounded-full text-[12px] font-bold">
                  <span className="material-symbols-outlined text-[15px]">health_and_safety</span>
                  <span>Viability: {aiAnalysis.initialScore || 85}%</span>
                </div>
              </div>
            </div>

            {/* Case Title & Legal Diagnosis */}
            <div className="py-4 border-b border-[#F1F5F9]">
              <h2 className="font-headline text-[22px] sm:text-[24px] font-bold text-[#0F172A]">
                {aiAnalysis.title}
              </h2>
              <p className="text-[14.5px] text-[#475569] mt-2 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <strong className="text-[#0F172A] font-semibold">Legal Assessment: </strong>
                {aiAnalysis.legalDiagnosis}
              </p>
            </div>

            {/* 3-Column Structured Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-[#F1F5F9]">
              {/* Column 1: Extracted Legal Facts */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[#166534] font-semibold text-[13px]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">fact_check</span>
                    Extracted Legal Facts
                  </span>
                  <span className="text-[11px] bg-white px-2 py-0.5 rounded-full border border-[#CBD5E1] text-[#475569]">
                    {aiAnalysis.facts.length} Verified
                  </span>
                </div>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {aiAnalysis.facts.map((f, i) => (
                    <div key={i} className="text-[12.5px] bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      <span className="font-bold text-[#0F172A] block text-[11.5px] uppercase tracking-wide">
                        {f.label}:
                      </span>
                      <span className="text-[#334155] leading-tight block mt-0.5">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Public Routing & Officer */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[#006c4a] font-semibold text-[13px]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">account_box</span>
                    Routing Authority
                  </span>
                  <span className="text-[11px] bg-white px-2 py-0.5 rounded-full border border-[#CBD5E1] text-[#475569]">
                    {aiAnalysis.officer.jurisdiction || selectedCity}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] flex flex-col gap-1 text-[13px]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#006c4a] text-white flex items-center justify-center font-bold text-[12px]">
                      {aiAnalysis.officer.avatar || 'AO'}
                    </div>
                    <div>
                      <p className="font-bold text-[#0F172A] leading-tight">{aiAnalysis.officer.name}</p>
                      <p className="text-[11.5px] text-[#64748B]">{aiAnalysis.officer.title}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-[12px] text-[#475569] flex flex-col gap-0.5 border-t border-[#F1F5F9] pt-2">
                    <p>
                      <strong>Dept:</strong> {aiAnalysis.officer.department}
                    </p>
                    {aiAnalysis.officer.email && (
                      <p className="truncate">
                        <strong>Official Email:</strong> {aiAnalysis.officer.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 3: PII & Protections */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[#0F172A] font-semibold text-[13px]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#059669]">shield</span>
                    Privacy & Protections
                  </span>
                  <span className="text-[11px] bg-[#DCFCE7] text-[#166534] font-bold px-2 py-0.5 rounded-full">
                    Auto-Masked
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] flex flex-col gap-2 text-[12.5px]">
                  <div>
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Detected PII Entities ({aiAnalysis.piiItems?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {aiAnalysis.piiItems && aiAnalysis.piiItems.length > 0 ? (
                        aiAnalysis.piiItems.map((p, i) => (
                          <span
                            key={i}
                            className="bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] px-2 py-0.5 rounded text-[11px] font-medium"
                          >
                            🔒 {p.type}: {p.original}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#64748B] italic text-[11.5px]">No sensitive PII exposed.</span>
                      )}
                    </div>
                  </div>

                  {aiAnalysis.vulnerabilities && aiAnalysis.vulnerabilities.length > 0 && (
                    <div className="border-t border-[#F1F5F9] pt-2">
                      <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block mb-0.5">
                        Defensive Advisory
                      </span>
                      <p className="text-[11.5px] text-[#78350F] leading-tight line-clamp-2">
                        {aiAnalysis.vulnerabilities[0]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyBrief}
                  className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-medium text-[13px] px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-[#CBD5E1] shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedBrief ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedBrief ? 'Brief Copied!' : 'Copy Brief'}</span>
                </button>

                {onSaveAICaseToCloud && (
                  <button
                    onClick={handleSaveToCloud}
                    className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#006c4a] font-medium text-[13px] px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-[#86EFAC] shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {savedToCloudFeedback ? 'done_all' : 'cloud_upload'}
                    </span>
                    <span>{savedToCloudFeedback ? 'Saved to Cloud!' : 'Save to Cloud'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setAiAnalysis(null);
                    setSearchQuery('');
                  }}
                  className="text-[#64748B] hover:text-[#0F172A] text-[13px] font-medium px-3 py-2 cursor-pointer transition-colors"
                >
                  Clear & New Query
                </button>

                <button
                  onClick={() => {
                    onAnalyzePrompt(searchQuery || SAMPLE_SCENARIOS[0]);
                    if (onLaunchAICase) {
                      onLaunchAICase(aiAnalysis, searchQuery || SAMPLE_SCENARIOS[0]);
                    } else {
                      onSelectRulebook(aiAnalysis.rulebookId, searchQuery || SAMPLE_SCENARIOS[0]);
                    }
                  }}
                  className="bg-[#006c4a] hover:bg-[#005137] text-white font-bold text-[14px] px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01] w-full sm:w-auto"
                >
                  <span>Launch Live Drafting Workspace</span>
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

