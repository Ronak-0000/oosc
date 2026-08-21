import React, { useState, useRef, useEffect } from 'react';
import { analyzeIssueApi, analyzeDocumentApi, AIAnalysisResponse } from '../services/api';

interface GuidedIntakeModalProps {
  initialCategory?: string;
  initialPrompt?: string;
  selectedCity: string;
  onClose: () => void;
  onLaunchCase?: (aiAnalysis: AIAnalysisResponse, rawText: string) => void;
  onProceedToDrafting?: (aiAnalysis: AIAnalysisResponse, rawText: string) => void;
}

const CATEGORY_TEMPLATES: Record<
  string,
  {
    title: string;
    description: string;
    icon: string;
    statute: string;
    quickPrompts: string[];
    defaultScope: string;
    defaultParty: string;
    placeholder: string;
  }
> = {
  rti: {
    title: 'Right to Information (RTI)',
    description: 'Demand certified public records, inspection of files, tender details, or status reports from government bodies.',
    icon: 'description',
    statute: 'Right to Information Act 2005 § 6(1)',
    quickPrompts: [
      'Demand daily progress report, measurement book (MB) entries, and asphalt test reports for road work in my ward.',
      'Request certified copy of file movement and reason for delay on my pending building sanction application.',
      'Seek certified action-taken report and officer investigation log on my filed police complaint.',
    ],
    defaultScope: 'Certified copies of all file notesheets, order sheets, progress logs, and correspondence.',
    defaultParty: 'Public Information Officer (PIO) & Head of Department',
    placeholder: 'e.g. Demand daily progress report, measurement book (MB) entries, and asphalt test reports for road work in my ward...',
  },
  consumer: {
    title: 'Consumer Dispute & Refund Notice',
    description: 'Demand full refund, replacement, or compensation for defective products or deficient services.',
    icon: 'shopping_bag',
    statute: 'Consumer Protection Act 2019 § 35',
    quickPrompts: [
      'Delivered defective laptop with dead motherboard; seller and authorized service center refused replacement.',
      'Flight cancelled arbitrarily by airline; refund of ₹24,000 withheld for over 45 days.',
      'Real estate builder delayed flat handover by 18 months and demanding illegal escalation charges.',
    ],
    defaultScope: 'Immediate 100% refund of transaction amount with 18% p.a. statutory interest plus compensation for mental agony.',
    defaultParty: 'Managing Director & Head of Customer Grievances',
    placeholder: 'e.g. Delivered defective laptop with dead motherboard; seller and authorized service center refused replacement...',
  },
  tenancy: {
    title: 'Tenancy & Security Deposit Recovery',
    description: 'Demand immediate return of rental security deposit unlawfully withheld without legitimate itemized deductions.',
    icon: 'home_work',
    statute: 'State Tenancy & Rent Control Act / Transfer of Property Act § 106',
    quickPrompts: [
      'Vacated apartment with signed clean handover checklist; landlord refusing to return ₹1,40,000 security deposit.',
      'Landlord deducted ₹45,000 for routine painting and wear-and-tear without providing invoices or receipts.',
      'Arbitrary eviction threat without the mandatory 30-day statutory notice period.',
    ],
    defaultScope: 'Immediate refund of complete security deposit of ₹1,40,000 with 12% p.a. interest from the handover date.',
    defaultParty: 'Property Owner / Landlord',
    placeholder: 'e.g. Vacated apartment with signed clean handover checklist; landlord refusing to return security deposit...',
  },
  employment: {
    title: 'Wage Recovery & Settlement Notice',
    description: 'Demand unpaid salary, withheld full & final (F&F) settlement, gratuity, and relieving certificates from employers.',
    icon: 'badge',
    statute: 'Payment of Wages Act 1936 § 15 / Payment of Gratuity Act § 7',
    quickPrompts: [
      'Employer withheld 2 months salary and ₹1,80,000 full & final settlement post-resignation.',
      'Company refusing to issue Relieving Letter and Experience Certificate after full notice period served.',
      'Statutory gratuity payment delayed beyond 30 days after 5 years of continuous service.',
    ],
    defaultScope: 'Immediate clearance of all unpaid wages, F&F settlement, and release of statutory employment certificates.',
    defaultParty: 'Managing Director & Head of Human Resources',
    placeholder: 'e.g. Employer withheld 2 months salary and full & final settlement post-resignation without valid grounds...',
  },
  cybercrime: {
    title: 'Digital Fraud & Banking Chargeback',
    description: 'Statutory notices for unauthorized credit card / UPI fraud invoking RBI Zero-Liability directives.',
    icon: 'lock',
    statute: 'RBI Customer Protection Directive (Zero Liability) / IT Act § 43A',
    quickPrompts: [
      'Unauthorized debit of ₹50,000 from credit card without OTP; reported to bank within 2 hours.',
      'Fraudulent UPI payment debit; bank refusing chargeback despite immediate intimation.',
    ],
    defaultScope: 'Immediate reversal of unauthorized transaction with zero liability under RBI directives.',
    defaultParty: 'Principal Nodal Officer & Banking Ombudsman',
    placeholder: 'e.g. Unauthorized debit of ₹50,000 from bank account without OTP; reported to branch within 2 hours...',
  },
};

export const GuidedIntakeModal: React.FC<GuidedIntakeModalProps> = ({
  initialCategory = 'rti',
  initialPrompt = '',
  selectedCity,
  onClose,
  onLaunchCase,
  onProceedToDrafting,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'rti');
  const [whatHappened, setWhatHappened] = useState<string>(initialPrompt || '');
  
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Step 2 details
  const [opposingParty, setOpposingParty] = useState<string>('');
  const [specificNeed, setSpecificNeed] = useState<string>('');
  const [amountOrRef, setAmountOrRef] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>('');

  // Document Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const activeTemplate = CATEGORY_TEMPLATES[selectedCategory] || CATEGORY_TEMPLATES.rti;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedMimeType(file.type || 'application/pdf');
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      setUploadedBase64(base64Data);
      setIsProcessingFile(false);

      // Auto-extract and populate situation
      try {
        setAnalyzing(true);
        const analysis = await analyzeDocumentApi({
          fileBase64: base64Data,
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
          jurisdiction: selectedCity,
        });

        if (analysis) {
          setAiAnalysis(analysis);
          if (analysis.legalDiagnosis) {
            setWhatHappened(analysis.legalDiagnosis);
          }
          if (analysis.officer?.department) {
            setOpposingParty(`${analysis.officer.name} (${analysis.officer.department})`);
          }
          if (analysis.requestScope) {
            setSpecificNeed(analysis.requestScope);
          }
          setStep(2);
        }
      } catch (err: any) {
        console.error('File parsing error:', err);
        setWhatHappened((prev) => prev || `Uploaded document: ${file.name}. Please review details.`);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    const combinedGrievance = `
Category: ${activeTemplate.title}
Grievance Description: ${whatHappened}
Opposing Authority / Company: ${opposingParty || activeTemplate.defaultParty}
Outcome / Remedy Desired: ${specificNeed || activeTemplate.defaultScope}
Transaction / Reference / Amount: ${amountOrRef || 'Not specified'}
Incident / Period: ${incidentDate || 'Recent'}
Location: ${selectedCity}
`.trim();

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      let analysis: AIAnalysisResponse;

      if (uploadedBase64 && uploadedMimeType) {
        analysis = await analyzeDocumentApi({
          fileBase64: uploadedBase64,
          mimeType: uploadedMimeType,
          fileName: uploadedFileName || 'uploaded_document',
          textContent: combinedGrievance,
          jurisdiction: selectedCity,
        });
      } else {
        analysis = await analyzeIssueApi(combinedGrievance, selectedCity);
      }

      setAiAnalysis(analysis);
      setStep(3);
    } catch (err: any) {
      console.error('Failed to analyze user intake:', err);
      setAnalysisError(err?.message || 'Could not analyze your details. Please check connection and retry.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOpenWorkspace = () => {
    if (!aiAnalysis) return;
    if (onLaunchCase) {
      onLaunchCase(aiAnalysis, whatHappened);
    } else if (onProceedToDrafting) {
      onProceedToDrafting(aiAnalysis, whatHappened);
    }
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#CBD5E1] overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006c4a]/10 text-[#006c4a] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">{activeTemplate.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-bold text-[18px] sm:text-[20px] text-[#0F172A]">
                  New Filing Assessment
                </h2>
                <span className="text-[11px] font-bold text-[#006c4a] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                  Step {step} of 3
                </span>
              </div>
              <p className="text-[12.5px] text-[#64748B]">
                {step === 1 && 'Tell us what happened so we can match the right statutory law'}
                {step === 2 && 'Clarify the opposing party and your exact required remedy'}
                {step === 3 && 'Review legal diagnosis and extracted facts before drafting'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 border-b border-[#E2E8F0] text-center text-[12px] font-semibold">
          <button
            onClick={() => setStep(1)}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              step === 1
                ? 'bg-white text-[#006c4a] border-b-2 border-[#006c4a] font-bold'
                : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#006c4a] text-white flex items-center justify-center text-[11px]">
              1
            </span>
            <span>What Happened?</span>
          </button>

          <button
            onClick={() => {
              if (whatHappened.trim()) setStep(2);
            }}
            disabled={!whatHappened.trim()}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              step === 2
                ? 'bg-white text-[#006c4a] border-b-2 border-[#006c4a] font-bold'
                : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-[11px]">
              2
            </span>
            <span>Key Details & Relief</span>
          </button>

          <button
            onClick={() => {
              if (aiAnalysis) setStep(3);
            }}
            disabled={!aiAnalysis}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              step === 3
                ? 'bg-white text-[#006c4a] border-b-2 border-[#006c4a] font-bold'
                : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#166534] text-white flex items-center justify-center text-[11px]">
              3
            </span>
            <span>Legal Standing</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-5">
          {/* STEP 1: WHAT HAPPENED */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              {/* Category Pills */}
              <div>
                <label className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                  Select Notice Category:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(CATEGORY_TEMPLATES).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedCategory(key);
                        // Do not overwrite user text; light placeholder updates automatically
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        selectedCategory === key
                          ? 'border-[#006c4a] bg-[#F0FDF4] text-[#006c4a] font-semibold shadow-xs'
                          : 'border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] shrink-0">{item.icon}</span>
                      <span className="text-[12px] truncate">{item.title.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input with Light Placeholder */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#0F172A] flex items-center justify-between">
                  <span>Describe what happened in your own words:</span>
                  <span className="text-[11.5px] font-normal text-[#64748B]">Plain language is fine</span>
                </label>
                <textarea
                  value={whatHappened}
                  onChange={(e) => setWhatHappened(e.target.value)}
                  rows={4}
                  placeholder={activeTemplate.placeholder || activeTemplate.quickPrompts[0]}
                  className="w-full p-3.5 rounded-xl border border-[#CBD5E1] focus:border-[#006c4a] focus:ring-2 focus:ring-[#006c4a]/15 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal outline-none shadow-inner"
                />
              </div>

              {/* Quick Prompt Suggestions */}
              <div>
                <span className="text-[12px] font-semibold text-[#64748B] block mb-2">
                  Or select a common scenario:
                </span>
                <div className="flex flex-col gap-1.5">
                  {activeTemplate.quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setWhatHappened(prompt)}
                      className="text-left text-[12.5px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] p-2.5 rounded-lg text-[#334155] transition-colors cursor-pointer flex items-start gap-2"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#006c4a] mt-0.5 shrink-0">
                        arrow_right
                      </span>
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: KEY DETAILS & RELIEF */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="bg-[#F0FDF4] border border-[#86EFAC] p-3.5 rounded-xl text-[13px] text-[#166534]">
                <strong>Statutory Context: </strong>
                {activeTemplate.statute} in {selectedCity}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12.5px] font-bold text-[#0F172A] block mb-1">
                    Who is the opposing party / department?
                  </label>
                  <input
                    type="text"
                    value={opposingParty}
                    onChange={(e) => setOpposingParty(e.target.value)}
                    placeholder={`e.g. ${activeTemplate.defaultParty}`}
                    className="w-full p-2.5 rounded-lg border border-[#CBD5E1] text-[13px] outline-none focus:border-[#006c4a]"
                  />
                </div>

                <div>
                  <label className="text-[12.5px] font-bold text-[#0F172A] block mb-1">
                    Disputed Amount / Transaction / File Reference:
                  </label>
                  <input
                    type="text"
                    value={amountOrRef}
                    onChange={(e) => setAmountOrRef(e.target.value)}
                    placeholder="e.g. ₹64,990 / Order #OD8812903 / Ward 150 Road Tender"
                    className="w-full p-2.5 rounded-lg border border-[#CBD5E1] text-[13px] outline-none focus:border-[#006c4a]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12.5px] font-bold text-[#0F172A] block mb-1">
                  What specific outcome / relief do you want?
                </label>
                <textarea
                  value={specificNeed}
                  onChange={(e) => setSpecificNeed(e.target.value)}
                  rows={2}
                  placeholder={`e.g. ${activeTemplate.defaultScope}`}
                  className="w-full p-2.5 rounded-lg border border-[#CBD5E1] text-[13px] outline-none focus:border-[#006c4a]"
                />
              </div>

              <div>
                <label className="text-[12.5px] font-bold text-[#0F172A] block mb-1">
                  Relevant Date / Period:
                </label>
                <input
                  type="text"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  placeholder="e.g. October 2024 / Past 60 Days / Continuous since August"
                  className="w-full p-2.5 rounded-lg border border-[#CBD5E1] text-[13px] outline-none focus:border-[#006c4a]"
                />
              </div>

              {analysisError && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] p-3 rounded-lg text-[#991B1B] text-[13px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{analysisError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: AI DIAGNOSIS & REVIEW */}
          {step === 3 && aiAnalysis && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="bg-white border-2 border-[#86EFAC] rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {aiAnalysis.category}
                    </span>
                    <h3 className="font-headline font-bold text-[18px] text-[#0F172A] mt-1">
                      {aiAnalysis.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-bold text-[#166534] bg-[#F0FDF4] border border-[#86EFAC] px-2.5 py-1 rounded-lg">
                      Viability: {aiAnalysis.initialScore || 88}%
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-[#334155] leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] mb-3">
                  <strong className="text-[#0F172A]">Legal Standing: </strong>
                  {aiAnalysis.legalDiagnosis}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                  <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                    <span className="font-bold text-[#0F172A] block mb-1">
                      Routing Officer / Authority:
                    </span>
                    <p className="text-[#334155] font-semibold">{aiAnalysis.officer.name}</p>
                    <p className="text-[11.5px] text-[#64748B]">{aiAnalysis.officer.title}</p>
                    <p className="text-[11.5px] text-[#64748B]">{aiAnalysis.officer.department}</p>
                  </div>

                  <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                    <span className="font-bold text-[#0F172A] block mb-1">
                      Statutory Act & Timeline:
                    </span>
                    <p className="text-[#006c4a] font-semibold">{aiAnalysis.statute}</p>
                    <p className="text-[11.5px] text-[#64748B] mt-1">
                      Statutory Reply Clock: {aiAnalysis.daysRemaining || 30} Days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          {step === 1 ? (
            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#0F172A] text-[13px] font-medium px-3 py-2 cursor-pointer"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
              className="text-[#475569] hover:text-[#0F172A] text-[13px] font-medium px-3 py-2 cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                onClick={() => {
                  if (whatHappened.trim()) setStep(2);
                }}
                disabled={!whatHappened.trim()}
                className="bg-[#006c4a] hover:bg-[#005137] text-white font-bold text-[13.5px] px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="bg-[#006c4a] hover:bg-[#005137] text-white font-bold text-[13.5px] px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-75 shadow-sm"
              >
                {analyzing ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    <span>Analyzing Legal Rights...</span>
                  </>
                ) : (
                  <>
                    <span>Diagnose Legal Standing</span>
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                  </>
                )}
              </button>
            )}

            {step === 3 && aiAnalysis && (
              <button
                onClick={handleOpenWorkspace}
                className="bg-[#006c4a] hover:bg-[#005137] text-white font-bold text-[14px] px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
              >
                <span>Open Notice Workspace</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
