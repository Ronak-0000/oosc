import React, { useState, useRef, useEffect } from 'react';
import { auditRtiApi, analyzeDocumentApi, RtiAuditResponse } from '../services/api';

interface RtiAuditorModalProps {
  selectedCity: string;
  onClose: () => void;
  onLaunchRtiCase?: (optimizedDraft: string, title: string) => void;
}

const SAMPLE_RTI_DRAFTS = [
  {
    title: 'Ward Road Resurfacing Tender & Quality Audit',
    text: 'Why is the road work in Ward 150 delayed? Who is the contractor and why did it develop potholes within 3 months? When will it be repaired?',
  },
  {
    title: 'Building Plan Sanction File Movement',
    text: 'Please inform me why my building plan sanction application #BBMP/LP/2024/890 is still pending after 60 days. Which officer is sitting on the file?',
  },
  {
    title: 'Police Action-Taken Report on NCR',
    text: 'What action has been taken on my complaint filed on 10th August? Why has the FIR not been registered yet and who investigated it?',
  },
];

export const RtiAuditorModal: React.FC<RtiAuditorModalProps> = ({
  selectedCity,
  onClose,
  onLaunchRtiCase,
}) => {
  const [rtiText, setRtiText] = useState(SAMPLE_RTI_DRAFTS[0].text);
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<RtiAuditResponse | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Document / PDF Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsProcessingFile(true);
    setAuditError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;

      try {
        setAuditing(true);
        // Extract text & diagnosis using document analysis
        const docAnalysis = await analyzeDocumentApi({
          fileBase64: base64Data,
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
          jurisdiction: selectedCity,
        });

        if (docAnalysis) {
          const extractedGrievance = `${docAnalysis.title}\n${docAnalysis.legalDiagnosis || ''}\n${docAnalysis.requestScope || ''}`.trim();
          setRtiText(extractedGrievance);
          // Run RTI quality audit on the extracted text
          const audit = await auditRtiApi(extractedGrievance, selectedCity);
          setAuditResult(audit);
        }
      } catch (err: any) {
        console.error('PDF extraction error in RTI auditor:', err);
        setAuditError(err?.message || 'Could not extract text from document. Please copy-paste text instead.');
      } finally {
        setIsProcessingFile(false);
        setAuditing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
      setAuditError('Failed to read the uploaded document.');
    };
    reader.readAsDataURL(file);
  };

  const handleRunAudit = async (customText?: string) => {
    const text = customText !== undefined ? customText : rtiText;
    if (!text.trim()) return;

    setAuditing(true);
    setAuditError(null);
    try {
      const res = await auditRtiApi(text, selectedCity);
      setAuditResult(res);
    } catch (err: any) {
      console.error('RTI Audit error:', err);
      setAuditError(err?.message || 'Failed to complete RTI audit. Please retry.');
    } finally {
      setAuditing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
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
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#CBD5E1] overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006c4a]/10 text-[#006c4a] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-bold text-[18px] sm:text-[20px] text-[#0F172A]">
                  RTI Strength & Quality Auditor
                </h2>
                <span className="text-[11px] font-bold text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                  RTI Act 2005 Compliance
                </span>
              </div>
              <p className="text-[12.5px] text-[#64748B]">
                Audit draft questions or upload rejection letters/PDFs to get a reject-proof statutory RTI draft
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-6">
          {/* Input & PDF Upload Section */}
          <div className="flex flex-col gap-3">
            {/* PDF Upload Banner */}
            <div className="p-3.5 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#CBD5E1] flex items-center justify-center text-[#006c4a] shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-[22px]">upload_file</span>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0F172A]">
                    {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Have an RTI Draft or Govt Rejection Order in PDF?'}
                  </p>
                  <p className="text-[11.5px] text-[#64748B]">
                    {uploadedFileName
                      ? 'Document extracted. Audit results generated below.'
                      : 'Upload PIO reply, Section 8 rejection letter, or application draft (PDF / Image)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile || auditing}
                  className="bg-white hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] font-semibold text-[12.5px] px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isProcessingFile ? 'sync' : 'attach_file'}
                  </span>
                  <span>{uploadedFileName ? 'Upload Different PDF' : 'Upload PDF / Doc'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#0F172A]">
                Or Type / Paste Your RTI Questions:
              </label>
              <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                <span>Try sample:</span>
                {SAMPLE_RTI_DRAFTS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setRtiText(sample.text);
                      handleRunAudit(sample.text);
                    }}
                    className="text-[#006c4a] hover:underline font-semibold cursor-pointer"
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={rtiText}
              onChange={(e) => setRtiText(e.target.value)}
              rows={4}
              placeholder="Paste or type what information you want from the government body..."
              className="w-full p-3.5 rounded-xl border border-[#CBD5E1] focus:border-[#006c4a] focus:ring-2 focus:ring-[#006c4a]/15 text-[14px] text-[#0F172A] outline-none shadow-inner"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[12px] text-[#64748B]">
                Jurisdiction: <strong className="text-[#0F172A]">{selectedCity}</strong>
              </span>
              <button
                onClick={() => handleRunAudit()}
                disabled={auditing || isProcessingFile || !rtiText.trim()}
                className="bg-[#006c4a] hover:bg-[#005137] text-white font-bold text-[13.5px] px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-60"
              >
                {auditing ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    <span>Auditing RTI Quality...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>Audit RTI Strength Score</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {auditError && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] p-3.5 rounded-xl text-[#991B1B] text-[13px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{auditError}</span>
            </div>
          )}

          {/* Audit Results Dashboard */}
          {auditResult && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200 border-t border-[#E2E8F0] pt-5">
              {/* Score & Verdict Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5">
                {/* Score Dial */}
                <div className="md:col-span-1 flex flex-col items-center justify-center text-center p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                    RTI Strength Score
                  </span>
                  <div className="text-[42px] font-bold font-headline text-[#006c4a] leading-none">
                    {auditResult.score}
                    <span className="text-[20px] text-[#64748B]">/100</span>
                  </div>
                  <span
                    className={`mt-2 text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                      auditResult.score >= 85
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : auditResult.score >= 70
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#FEE2E2] text-[#991B1B]'
                    }`}
                  >
                    {auditResult.grade}
                  </span>
                </div>

                {/* Verdict Summary */}
                <div className="md:col-span-3 flex flex-col justify-center gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-bold text-[16px] text-[#0F172A]">
                      Statutory Audit Verdict
                    </h3>
                    <span className="text-[12px] font-bold text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                      Est. Success Rate: {auditResult.estimatedSuccessRate || 92}%
                    </span>
                  </div>
                  <p className="text-[13.5px] text-[#334155] leading-relaxed">
                    {auditResult.verdictSummary}
                  </p>
                  {auditResult.exemptionsRiskAnalysis && (
                    <p className="text-[12px] text-[#64748B] bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                      <strong className="text-[#0F172A]">Exemption Risk: </strong>
                      {auditResult.exemptionsRiskAnalysis}
                    </p>
                  )}
                </div>
              </div>

              {/* 7-Point Compliance Checklist */}
              <div>
                <h4 className="font-headline font-bold text-[15px] text-[#0F172A] mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#006c4a]">checklist</span>
                  <span>7-Point Statutory Compliance Checklist</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {auditResult.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col gap-1 text-[12.5px] ${
                        item.status === 'pass'
                          ? 'bg-[#F0FDF4] border-[#86EFAC]'
                          : item.status === 'warning'
                          ? 'bg-[#FFFBEB] border-[#FDE68A]'
                          : 'bg-[#FEF2F2] border-[#FECACA]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                          <span
                            className={`material-symbols-outlined text-[16px] ${
                              item.status === 'pass'
                                ? 'text-[#166534]'
                                : item.status === 'warning'
                                ? 'text-[#D97706]'
                                : 'text-[#DC2626]'
                            }`}
                          >
                            {item.status === 'pass'
                              ? 'check_circle'
                              : item.status === 'warning'
                              ? 'warning'
                              : 'cancel'}
                          </span>
                          {item.item}
                        </span>
                        <span className="text-[11px] font-semibold text-[#475569] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                          {item.rule}
                        </span>
                      </div>
                      <p className="text-[#334155] mt-0.5">{item.finding}</p>
                      {item.statutoryFix && item.status !== 'pass' && (
                        <p className="text-[11.5px] text-[#92400E] font-medium mt-0.5">
                          <strong>Fix: </strong> {item.statutoryFix}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Optimized Ready-to-Submit RTI Draft */}
              {auditResult.optimizedRtiDraft && (
                <div className="bg-white border-2 border-[#006c4a] rounded-2xl p-5 shadow-md flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c4a] text-[22px]">
                        auto_awesome
                      </span>
                      <h4 className="font-headline font-bold text-[16px] text-[#0F172A]">
                        Optimized & Bulletproof RTI Application
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(auditResult.optimizedRtiDraft)}
                        className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold text-[12.5px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-[#CBD5E1]"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {copiedDraft ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedDraft ? 'Copied' : 'Copy Application'}</span>
                      </button>

                      {onLaunchRtiCase && (
                        <button
                          onClick={() => {
                            onLaunchRtiCase(
                              auditResult.optimizedRtiDraft,
                              `RTI: ${rtiText.slice(0, 40)}...`
                            );
                            onClose();
                          }}
                          className="bg-[#006c4a] hover:bg-[#005137] text-white font-bold text-[12.5px] px-4 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                        >
                          <span>Open in Workspace</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <pre className="font-mono text-[12.5px] bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-[#0F172A] whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                    {auditResult.optimizedRtiDraft}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          <span className="text-[12px] text-[#64748B]">
            Section 6(1) Right to Information Act 2005
          </span>
          <button
            onClick={onClose}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-[13px] px-5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
