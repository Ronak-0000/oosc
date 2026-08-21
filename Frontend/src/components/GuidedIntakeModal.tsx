import React, { useState } from 'react';
import { analyzeIssueApi, AIAnalysisResponse } from '../services/api';

interface GuidedIntakeModalProps {
  initialCategory?: string;
  selectedCity: string;
  onClose: () => void;
  onLaunchCase: (aiData: AIAnalysisResponse, rawText: string) => void;
}

export const GuidedIntakeModal: React.FC<GuidedIntakeModalProps> = ({
  initialCategory = 'rti',
  selectedCity,
  onClose,
  onLaunchCase,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(initialCategory);
  const [grievanceText, setGrievanceText] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!grievanceText.trim() && !attachedFile) return;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeIssueApi(
        grievanceText || `Document Analysis: ${attachedFile?.name}`,
        selectedCity,
        attachedFile || undefined
      );
      onLaunchCase(result, grievanceText || attachedFile?.name || 'New Filing');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#CBD5E1] flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="font-headline font-bold text-[18px] text-[#0F172A]">
              Create Legal Notice / RTI
            </h3>
            <p className="text-[12px] text-[#64748B]">Jurisdiction: {selectedCity}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg hover:bg-[#F1F5F9] cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Input 1: Model Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
            1. Select Model / Framework
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'rti', label: 'RTI Request', icon: 'description' },
              { id: 'consumer', label: 'Consumer', icon: 'shopping_bag' },
              { id: 'tenancy', label: 'Tenancy / Salary', icon: 'home_work' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-[12.5px] font-semibold transition-all cursor-pointer ${
                  selectedModel === m.id
                    ? 'border-[#006c4a] bg-[#ECFDF5] text-[#006c4a]'
                    : 'border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input 2: Grievance Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
            2. Describe Your Grievance / Requirements
          </label>
          <textarea
            value={grievanceText}
            onChange={(e) => setGrievanceText(e.target.value)}
            rows={4}
            placeholder="State your problem clearly (e.g., Landlord withheld deposit, road repair expenditure records)..."
            className="w-full p-3 rounded-xl border border-[#CBD5E1] focus:border-[#006c4a] focus:ring-1 focus:ring-[#006c4a] text-[13.5px] text-[#0F172A] outline-none"
          />
        </div>

        {/* Input 3: PDF Attachment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
            3. Attach PDF Document (Optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="intakeModalPdf"
              accept=".pdf,application/pdf"
              onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label
              htmlFor="intakeModalPdf"
              className="px-3.5 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-[12.5px] font-semibold text-[#475569] flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#006c4a]">upload_file</span>
              <span>{attachedFile ? attachedFile.name : 'Select PDF File'}</span>
            </label>
            {attachedFile && (
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-[#DC2626] text-[12px] font-semibold hover:underline cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[12px] text-[#991B1B]">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProcess}
            disabled={loading || (!grievanceText.trim() && !attachedFile)}
            className="px-5 py-2 bg-[#006c4a] hover:bg-[#005137] text-white rounded-xl text-[13px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span>Generating Draft...</span>
              </>
            ) : (
              <>
                <span>Generate Filing</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
