import { LegalCase } from '../types';

export interface AIAnalysisResponse {
  category: string;
  rulebookId: string;
  title: string;
  statute: string;
  officer: {
    name: string;
    title: string;
    department: string;
    avatar: string;
    jurisdiction: string;
    email: string;
    address?: string;
    portalUrl?: string;
    designationNote?: string;
  };
  facts: Array<{ label: string; value: string }>;
  requestScope: string;
  dateRange: string;
  piiItems: Array<{ original: string; type: string; masked: boolean }>;
  redactedText: string;
  daysRemaining: number;
  initialScore: number;
  legalDiagnosis: string;
  formalLetter: string;
  vulnerabilities: string[];
  recommendedFixes: string[];
  appellateStrategy: string;
  statutoryClauses?: string[];
  recommendedExhibits?: string[];
}

export interface AIFilingDraftResponse {
  formalLetter: string;
  subjectLine?: string;
  recipientBlock?: string;
  statutoryClauses: string[];
  recommendedExhibits: string[];
}

export interface AIStressTestResponse {
  score: number;
  grade: string;
  vulnerabilities: Array<{
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    fixAvailable: boolean;
    fixActionText: string;
  }>;
  strengths: string[];
  recommendedFixes?: string[];
  appellateStrategy: string;
}

export interface AIDecodedResponse {
  departmentStatement: string;
  actualMeaning: string;
  bureaucraticTactic: string;
  severity: 'low' | 'medium' | 'high';
  recommendedAction: string;
  appealDeadlineDays: number;
  suggestedRebuttal: string;
  plainEnglish?: string;
  recommendedNextStep?: string;
}

export interface AuthoritySearchResult {
  department: string;
  officerTitle: string;
  nodalEmail: string;
  officeAddress: string;
  grievancePortal: string;
  helpline: string;
  statute: string;
  searchSummary: string;
}

export async function analyzeIssueApi(
  issueText: string,
  jurisdiction: string = 'Bengaluru'
): Promise<AIAnalysisResponse> {
  const response = await fetch('/api/analyze-issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issueText, jurisdiction }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to analyze issue (${response.status})`);
  }

  return response.json();
}

export async function searchOfficerApi(
  query: string,
  city: string = 'Bengaluru'
): Promise<AuthoritySearchResult> {
  const response = await fetch('/api/search-officer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, city }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to search directory (${response.status})`);
  }

  return response.json();
}

export async function generateFilingDraftApi(
  caseData: LegalCase,
  instructions?: string
): Promise<AIFilingDraftResponse> {
  const response = await fetch('/api/generate-filing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseData, instructions }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate draft (${response.status})`);
  }

  return response.json();
}

export async function stressTestApi(
  caseData: LegalCase
): Promise<AIStressTestResponse> {
  const response = await fetch('/api/stress-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseData }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to stress test filing (${response.status})`);
  }

  return response.json();
}

export interface RtiAuditChecklistItem {
  item: string;
  rule: string;
  status: 'pass' | 'warning' | 'fail';
  finding: string;
  statutoryFix: string;
}

export interface RtiAuditResponse {
  score: number;
  grade: string;
  verdictSummary: string;
  checklist: RtiAuditChecklistItem[];
  vulnerabilities: string[];
  exemptionsRiskAnalysis: string;
  optimizedRtiDraft: string;
  estimatedSuccessRate: number;
}

export async function analyzeDocumentApi(params: {
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
  textContent?: string;
  jurisdiction?: string;
}): Promise<AIAnalysisResponse> {
  const response = await fetch('/api/analyze-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to analyze document (${response.status})`);
  }

  return response.json();
}

export async function interpretResponseApi(
  departmentStatement: string,
  caseContext?: string
): Promise<AIDecodedResponse> {
  const response = await fetch('/api/interpret-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ departmentStatement, caseContext }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to interpret response (${response.status})`);
  }

  return response.json();
}

export async function auditRtiApi(
  rtiText: string,
  jurisdiction: string = 'Delhi (NCR)'
): Promise<RtiAuditResponse> {
  const response = await fetch('/api/audit-rti', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rtiText, jurisdiction }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to audit RTI (${response.status})`);
  }

  return response.json();
}

export async function simplifyPdfFastApi(file: File): Promise<{ simplified_points: string[] }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://caseloop.onrender.com/simplify', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `FastAPI server responded with status ${response.status}`);
  }

  return response.json();
}

export async function draftRtiFastApi(prompt: string): Promise<{ draft: string }> {
  const response = await fetch('https://caseloop.onrender.com/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `FastAPI server responded with status ${response.status}`);
  }

  return response.json();
}

