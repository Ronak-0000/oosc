import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RulebookSelector } from './components/RulebookSelector';
import { FilingWorkspace } from './components/FilingWorkspace';
import { MyFilingsDashboard } from './components/MyFilingsDashboard';
import { RulebooksModal } from './components/RulebooksModal';
import { AppealTrackerModal } from './components/AppealTrackerModal';
import { RevisionHistoryModal } from './components/RevisionHistoryModal';
import { ShareModal } from './components/ShareModal';
import { PDFExportModal } from './components/PDFExportModal';
import { LegalInfoModal } from './components/LegalInfoModal';
import { GuidedIntakeModal } from './components/GuidedIntakeModal';
import { RtiAuditorModal } from './components/RtiAuditorModal';
import { INITIAL_CASES, INITIAL_RULEBOOKS } from './data/mockData';
import { LegalCase, Rulebook, ExtractedFact } from './types';
import { AIAnalysisResponse } from './services/api';
import { useAuth } from './context/AuthContext';
import {
  subscribeToUserCases,
  saveUserCaseToFirestore,
  deleteUserCaseFromFirestore,
} from './firebase';

export default function App() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'workspace' | 'my-filings'>('home');
  const [cases, setCases] = useState<LegalCase[]>(INITIAL_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(INITIAL_CASES[0].id);
  const [rulebooks] = useState<Rulebook[]>(INITIAL_RULEBOOKS);
  const [selectedCity, setSelectedCity] = useState<string>('Delhi (NCR)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showRulebooksModal, setShowRulebooksModal] = useState(false);
  const [showAppealTracker, setShowAppealTracker] = useState(false);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [showGuidedIntake, setShowGuidedIntake] = useState(false);
  const [guidedIntakeCategory, setGuidedIntakeCategory] = useState<string | undefined>(undefined);
  const [showRtiAuditor, setShowRtiAuditor] = useState(false);
  const [caseToShare, setCaseToShare] = useState<LegalCase | null>(null);
  const [caseToPDF, setCaseToPDF] = useState<LegalCase | null>(null);
  const [legalModalType, setLegalModalType] = useState<
    'disclaimer' | 'accessibility' | 'rulebooks' | 'privacy' | null
  >(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time Firestore synchronization when user is signed in
  useEffect(() => {
    if (!user) {
      // If user logs out or is guest, retain in-memory state
      return;
    }

    // Subscribe to Firestore cases subcollection
    const unsubscribe = subscribeToUserCases(
      user.uid,
      (remoteCases) => {
        setCases(remoteCases);
        if (remoteCases.length > 0) {
          if (!remoteCases.some((c) => c.id === selectedCaseId)) {
            setSelectedCaseId(remoteCases[0].id);
          }
        }
      },
      (err) => {
        console.error('Real-time sync listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0] || INITIAL_CASES[0];

  const handleUpdateCase = (updatedCase: LegalCase) => {
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    if (user) {
      saveUserCaseToFirestore(user.uid, updatedCase).catch((err) =>
        console.error('Failed to sync updated case to Firestore:', err)
      );
    }
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentView('workspace');
  };

  const handleLaunchAICase = (aiData: AIAnalysisResponse, rawText: string) => {
    const newCaseId = `case-${Date.now()}`;
    const formattedFacts: ExtractedFact[] = aiData.facts.map((f, idx) => ({
      id: `fact-${Date.now()}-${idx}`,
      label: f.label,
      value: f.value,
    }));

    const formattedPii = (aiData.piiItems || []).map((p, idx) => ({
      id: `pii-${Date.now()}-${idx}`,
      original: p.original,
      type: p.type,
      masked: true,
    }));

    const todayStr = new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());

    const newCase: LegalCase = {
      id: newCaseId,
      caseNumber: `#CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: aiData.title,
      category: aiData.category,
      rulebookId: aiData.rulebookId,
      status: 'drafting',
      statusBadge: 'Assessed',
      statusType: 'success',
      deadlineText: `Reply required in ${aiData.daysRemaining} days`,
      filedDate: todayStr,
      description: aiData.formalLetter || aiData.legalDiagnosis,
      formalLetter: aiData.formalLetter,
      rawIntakeText: rawText,
      redactedText: aiData.redactedText,
      piiItems:
        formattedPii.length > 0
          ? formattedPii
          : [{ id: `pii-${Date.now()}-1`, original: 'Citizen Requester', type: 'Identity', masked: true }],
      facts:
        formattedFacts.length > 0
          ? formattedFacts
          : [{ id: `fact-${Date.now()}-1`, label: 'Primary Grievance', value: rawText }],
      officer: {
        name: aiData.officer.name,
        title: aiData.officer.title,
        department: aiData.officer.department,
        avatar: aiData.officer.avatar || 'PO',
        jurisdiction: aiData.officer.jurisdiction || selectedCity,
        email: aiData.officer.email,
        address: aiData.officer.address,
        portalUrl: aiData.officer.portalUrl,
        designationNote: aiData.officer.designationNote,
      },
      requestScope: aiData.requestScope,
      dateRange: aiData.dateRange || 'Past 90 Days',
      statute: aiData.statute,
      score: aiData.initialScore || 85,
      hasHardshipClause: false,
      autoRedactEnabled: true,
      autoEscalateEnabled: true,
      daysRemaining: aiData.daysRemaining || 18,
      revisionCount: 1,
      lastEdited: 'Just now',
      vulnerabilities: aiData.vulnerabilities,
      recommendedFixes: aiData.recommendedFixes,
      appellateStrategy: aiData.appellateStrategy,
      statutoryClauses: aiData.statutoryClauses,
      recommendedExhibits: aiData.recommendedExhibits,
    };

    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCaseId);

    if (user) {
      saveUserCaseToFirestore(user.uid, newCase)
        .then(() => showToast('Case saved and synced to your Firebase Cloud'))
        .catch((err) => console.error('Cloud save error:', err));
    }

    setCurrentView('workspace');
  };

  const handleLaunchCustomDraft = (draftText: string, caseTitle: string) => {
    const newCaseId = `case-${Date.now()}`;
    const todayStr = new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());

    const newCase: LegalCase = {
      id: newCaseId,
      caseNumber: `#CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: caseTitle || 'Right to Information Notice',
      category: 'Public Records (RTI)',
      rulebookId: 'rti',
      status: 'drafting',
      statusBadge: 'RTI Audited',
      statusType: 'success',
      deadlineText: 'Reply required in 30 days',
      filedDate: todayStr,
      description: draftText,
      formalLetter: draftText,
      rawIntakeText: draftText,
      redactedText: draftText,
      piiItems: [],
      facts: [{ id: `fact-1`, label: 'RTI Scope', value: 'Statutory inspection & certified records request.' }],
      officer: {
        name: 'Public Information Officer (PIO)',
        title: 'Designated CPIO / PIO',
        department: 'Public Authority Division',
        avatar: 'PIO',
        jurisdiction: selectedCity,
        email: 'rti.cell@nic.in',
        address: `${selectedCity} Central Government / Civic Complex`,
        portalUrl: 'https://rtionline.gov.in',
      },
      requestScope: 'Certified copies under Section 6(1) and Section 2(j) of RTI Act 2005.',
      dateRange: 'Relevant Financial Year',
      statute: 'Right to Information Act 2005 § 6(1)',
      score: 95,
      hasHardshipClause: false,
      autoRedactEnabled: true,
      autoEscalateEnabled: true,
      daysRemaining: 30,
      revisionCount: 1,
      lastEdited: 'Just now',
    };

    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCaseId);

    if (user) {
      saveUserCaseToFirestore(user.uid, newCase)
        .then(() => showToast('RTI Filing saved to Firebase Firestore'))
        .catch((err) => console.error('Cloud save error:', err));
    }

    setCurrentView('workspace');
  };

  const handleSaveAICaseToCloud = async (aiData: AIAnalysisResponse, rawText: string) => {
    const newCaseId = `case-${Date.now()}`;
    const formattedFacts: ExtractedFact[] = aiData.facts.map((f, idx) => ({
      id: `fact-${Date.now()}-${idx}`,
      label: f.label,
      value: f.value,
    }));

    const formattedPii = (aiData.piiItems || []).map((p, idx) => ({
      id: `pii-${Date.now()}-${idx}`,
      original: p.original,
      type: p.type,
      masked: true,
    }));

    const todayStr = new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());

    const newCase: LegalCase = {
      id: newCaseId,
      caseNumber: `#CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: aiData.title,
      category: aiData.category,
      rulebookId: aiData.rulebookId,
      status: 'drafting',
      statusBadge: 'Assessed',
      statusType: 'success',
      deadlineText: `Reply required in ${aiData.daysRemaining} days`,
      filedDate: todayStr,
      description: aiData.formalLetter || aiData.legalDiagnosis,
      formalLetter: aiData.formalLetter,
      rawIntakeText: rawText,
      redactedText: aiData.redactedText,
      piiItems: formattedPii,
      facts: formattedFacts,
      officer: {
        name: aiData.officer.name,
        title: aiData.officer.title,
        department: aiData.officer.department,
        avatar: aiData.officer.avatar || 'PO',
        jurisdiction: aiData.officer.jurisdiction || selectedCity,
        email: aiData.officer.email,
        address: aiData.officer.address,
        portalUrl: aiData.officer.portalUrl,
        designationNote: aiData.officer.designationNote,
      },
      requestScope: aiData.requestScope,
      dateRange: aiData.dateRange || 'Past 90 Days',
      statute: aiData.statute,
      score: aiData.initialScore || 85,
      hasHardshipClause: false,
      autoRedactEnabled: true,
      autoEscalateEnabled: true,
      daysRemaining: aiData.daysRemaining || 18,
      revisionCount: 1,
      lastEdited: 'Just now',
      vulnerabilities: aiData.vulnerabilities,
      recommendedFixes: aiData.recommendedFixes,
      appellateStrategy: aiData.appellateStrategy,
      statutoryClauses: aiData.statutoryClauses,
      recommendedExhibits: aiData.recommendedExhibits,
    };

    setCases((prev) => [newCase, ...prev]);

    if (user) {
      await saveUserCaseToFirestore(user.uid, newCase);
      showToast('Filing saved to Firebase Firestore Cloud');
    } else {
      showToast('Saved locally. Sign in to enable permanent cloud backup.');
    }
  };

  const handleSelectRulebook = (rulebookId: string, initialPrompt?: string) => {
    let title = 'New Filing Draft';
    let category = 'Public Records (RTI)';
    let scope = 'Certified copies of files, tender details, and official note sheets.';
    let statute = 'Right to Information Act 2005 § 6(1)';

    if (rulebookId === 'consumer') {
      title = 'Consumer Dispute - Defective Product & Deficient Service';
      category = 'Consumer Disputes';
      scope = 'Formal 15-day statutory notice for full refund and compensation.';
      statute = 'Consumer Protection Act 2019 § 35';
    } else if (rulebookId === 'tenancy') {
      title = 'Tenancy Dispute - Security Deposit Recovery';
      category = 'Tenancy Protections';
      scope = 'Statutory notice demanding immediate return of withheld security deposit with interest.';
      statute = 'State Tenancy & Rent Control Act';
    } else if (rulebookId === 'employment') {
      title = 'Wage Recovery & Final Settlement Demand';
      category = 'Labor & Employment Law';
      scope = 'Demand for immediate release of unpaid salary, F&F settlement, and relieving certificate.';
      statute = 'Payment of Wages Act 1936 § 15';
    }

    const newCaseId = `case-${Date.now()}`;
    const newCase: LegalCase = {
      ...currentCase,
      id: newCaseId,
      caseNumber: `#CL-2025-${Math.floor(1000 + Math.random() * 9000)}`,
      title: initialPrompt ? `Case: ${initialPrompt.slice(0, 45)}...` : title,
      category,
      rulebookId,
      requestScope: initialPrompt ? initialPrompt : scope,
      statute,
      filedDate: 'Current Filing',
      status: 'drafting',
      statusBadge: 'In Progress',
      statusType: 'warning',
      score: 85,
      hasHardshipClause: false,
      autoRedactEnabled: true,
      autoEscalateEnabled: false,
      daysRemaining: 30,
      lastEdited: 'Just now',
    };

    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCaseId);

    if (user) {
      saveUserCaseToFirestore(user.uid, newCase).catch((err) =>
        console.error('Error saving template case to cloud:', err)
      );
    }

    setCurrentView('workspace');
  };

  const handleDeleteCase = (caseId: string) => {
    setCases((prev) => prev.filter((c) => c.id !== caseId));
    if (user) {
      deleteUserCaseFromFirestore(user.uid, caseId)
        .then(() => showToast('Case filing deleted from cloud'))
        .catch((err) => console.error('Error deleting from Firestore:', err));
    } else {
      showToast('Case removed');
    }
  };

  const handleDuplicateCase = (legalCase: LegalCase) => {
    const duplicatedId = `case-${Date.now()}`;
    const duplicatedCase: LegalCase = {
      ...legalCase,
      id: duplicatedId,
      caseNumber: `#CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `${legalCase.title} (Copy)`,
      lastEdited: 'Just now',
      revisionCount: 1,
    };

    setCases((prev) => [duplicatedCase, ...prev]);
    if (user) {
      saveUserCaseToFirestore(user.uid, duplicatedCase)
        .then(() => showToast('Case duplicated and saved in Cloud'))
        .catch((err) => console.error('Error saving duplicate to Firestore:', err));
    } else {
      showToast('Case duplicated');
    }
  };

  const handleNewFiling = () => {
    setShowGuidedIntake(true);
  };

  const handleOpenGuidedIntakeWithCategory = (category?: string) => {
    setGuidedIntakeCategory(category);
    setShowGuidedIntake(true);
  };

  const handleDownloadPDF = (legalCase: LegalCase) => {
    setCaseToPDF(legalCase);
  };

  const handleShareCase = (legalCase: LegalCase) => {
    setCaseToShare(legalCase);
  };

  const handleOpenQuickAction = (action: 'appeal' | 'history' | 'rulebooks') => {
    if (action === 'appeal') setShowAppealTracker(true);
    if (action === 'history') setShowRevisionHistory(true);
    if (action === 'rulebooks') setShowRulebooksModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#191C1E] font-sans antialiased">
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-[13px] animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="material-symbols-outlined text-[#006c4a] text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TopNavBar Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        unreadNotifications={2}
        filingsCount={cases.length}
      />

      {/* Main View Router */}
      <main className="flex-grow flex flex-col">
        {currentView === 'home' && (
          <RulebookSelector
            rulebooks={rulebooks}
            selectedCity={selectedCity}
            onSelectRulebook={handleSelectRulebook}
            onLaunchAICase={handleLaunchAICase}
            onSaveAICaseToCloud={handleSaveAICaseToCloud}
            onViewAllRulebooks={() => setShowRulebooksModal(true)}
            onAnalyzePrompt={() => {}}
            onOpenGuidedIntake={handleOpenGuidedIntakeWithCategory}
            onOpenRtiAuditor={() => setShowRtiAuditor(true)}
          />
        )}

        {currentView === 'workspace' && (
          <FilingWorkspace
            currentCase={currentCase}
            onUpdateCase={handleUpdateCase}
            onNavigate={setCurrentView}
            onDownloadPDF={handleDownloadPDF}
          />
        )}

        {currentView === 'my-filings' && (
          <MyFilingsDashboard
            cases={cases}
            onSelectCase={handleSelectCase}
            onNewFiling={handleNewFiling}
            onDeleteCase={handleDeleteCase}
            onDuplicateCase={handleDuplicateCase}
            onDownloadPDF={handleDownloadPDF}
            onShareCase={handleShareCase}
            onOpenQuickAction={handleOpenQuickAction}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenLegal={(type) => {
          if (type === 'rulebooks') {
            setShowRulebooksModal(true);
          } else {
            setLegalModalType(type);
          }
        }}
      />

      {/* Modals */}
      {showGuidedIntake && (
        <GuidedIntakeModal
          initialCategory={guidedIntakeCategory}
          selectedCity={selectedCity}
          onClose={() => {
            setShowGuidedIntake(false);
            setGuidedIntakeCategory(undefined);
          }}
          onLaunchCase={handleLaunchAICase}
        />
      )}

      {showRtiAuditor && (
        <RtiAuditorModal
          selectedCity={selectedCity}
          onClose={() => setShowRtiAuditor(false)}
          onLaunchRtiCase={handleLaunchCustomDraft}
        />
      )}

      {showRulebooksModal && (
        <RulebooksModal
          rulebooks={rulebooks}
          onSelectRulebook={handleSelectRulebook}
          onClose={() => setShowRulebooksModal(false)}
        />
      )}

      {showAppealTracker && (
        <AppealTrackerModal
          onClose={() => setShowAppealTracker(false)}
          onOpenWorkspace={() => setCurrentView('workspace')}
        />
      )}

      {showRevisionHistory && (
        <RevisionHistoryModal onClose={() => setShowRevisionHistory(false)} />
      )}

      {caseToShare && (
        <ShareModal
          legalCase={caseToShare}
          onClose={() => setCaseToShare(null)}
        />
      )}

      {caseToPDF && (
        <PDFExportModal
          legalCase={caseToPDF}
          onClose={() => setCaseToPDF(null)}
        />
      )}

      {legalModalType && (
        <LegalInfoModal
          type={legalModalType}
          onClose={() => setLegalModalType(null)}
        />
      )}
    </div>
  );
}

