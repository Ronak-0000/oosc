export interface ExtractedFact {
  id: string;
  label: string;
  value: string;
}

export interface OfficerRoute {
  name: string;
  title: string;
  department: string;
  avatar: string;
  jurisdiction: string;
  email?: string;
  address?: string;
  portalUrl?: string;
  designationNote?: string;
}

export interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  category: string;
  rulebookId: string;
  status: 'drafting' | 'awaiting_reply' | 'stress_tested' | 'filed' | 'completed';
  statusBadge: string;
  statusType: 'urgent' | 'success' | 'warning' | 'neutral';
  deadlineText?: string;
  filedDate?: string;
  description: string;
  formalLetter?: string;
  rawIntakeText: string;
  redactedText: string;
  piiItems: Array<{ id: string; original: string; type: string; masked: boolean }>;
  facts: ExtractedFact[];
  officer: OfficerRoute;
  requestScope: string;
  dateRange: string;
  statute: string;
  score: number;
  hasHardshipClause: boolean;
  autoRedactEnabled: boolean;
  autoEscalateEnabled: boolean;
  daysRemaining: number;
  revisionCount: number;
  lastEdited: string;
  vulnerabilities?: string[];
  recommendedFixes?: string[];
  appellateStrategy?: string;
  statutoryClauses?: string[];
  recommendedExhibits?: string[];
}

export interface Rulebook {
  id: string;
  title: string;
  category: string;
  tag: string;
  status: 'active' | 'coming_soon';
  statusLabel: string;
  description: string;
  estMinutes: number;
  icon: string;
  jurisdictions: string[];
  samplePrompts: string[];
  keyStatute: string;
  steps: string[];
}

export interface DecodedResponse {
  departmentStatement: string;
  actualMeaning: string;
  severity: 'low' | 'medium' | 'high';
  recommendedAction: string;
  appealDeadlineDays: number;
}
