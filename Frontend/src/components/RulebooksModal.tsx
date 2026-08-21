import React, { useState } from 'react';
import { Rulebook } from '../types';

interface RulebooksModalProps {
  rulebooks: Rulebook[];
  onSelectRulebook: (rulebookId: string) => void;
  onClose: () => void;
}

export const RulebooksModal: React.FC<RulebooksModalProps> = ({
  rulebooks,
  onSelectRulebook,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'coming_soon'>('all');
  const [search, setSearch] = useState('');

  const filtered = rulebooks.filter((rb) => {
    const matchesTab =
      activeTab === 'all' ? true : rb.status === activeTab;
    const matchesSearch =
      rb.title.toLowerCase().includes(search.toLowerCase()) ||
      rb.description.toLowerCase().includes(search.toLowerCase()) ||
      rb.keyStatute.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c4a] text-[24px]">gavel</span>
              <h2 className="font-headline font-bold text-[20px] text-[#0F172A]">
                CaseLoop Statutory Templates Catalog
              </h2>
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Standard legal templates, auto-redaction protections, and filing pathways
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row gap-3 justify-between items-center bg-white">
          <div className="flex gap-2 text-[12px]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              All Templates ({rulebooks.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-[#006c4a] text-white'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              Active ({rulebooks.filter((r) => r.status === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab('coming_soon')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'coming_soon'
                  ? 'bg-[#475569] text-white'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              In Development ({rulebooks.filter((r) => r.status === 'coming_soon').length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Search statutes, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-[13px] border border-[#CBD5E1] rounded-lg px-3 py-1.5 w-full sm:w-60 focus:border-[#0F172A] outline-none"
          />
        </div>

        {/* Templates List */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 flex-grow">
          {filtered.map((rb) => {
            const isActive = rb.status === 'active';
            return (
              <div
                key={rb.id}
                className={`p-5 rounded-xl border transition-all ${
                  isActive
                    ? 'border-[#CBD5E1] bg-white hover:border-[#0F172A] hover:shadow-sm'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isActive
                          ? 'bg-[#0F172A]/5 text-[#0F172A]'
                          : 'bg-[#E2E8F0] text-[#94A3B8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{rb.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-[16px] text-[#0F172A]">
                        {rb.title}
                      </h3>
                      <span className="text-[11px] text-[#64748B]">{rb.category}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : 'bg-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    {rb.statusLabel}
                  </span>
                </div>

                <p className="text-[13.5px] text-[#475569] leading-relaxed mb-3">
                  {rb.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9] text-[12px]">
                  <div className="text-[#64748B]">
                    <span className="font-semibold text-[#1E293B]">Key Statute:</span> {rb.keyStatute}
                  </div>

                  {isActive ? (
                    <button
                      onClick={() => {
                        onSelectRulebook(rb.id);
                        onClose();
                      }}
                      className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Draft with this Template</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  ) : (
                    <span className="text-[#94A3B8] font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      Template in validation
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
