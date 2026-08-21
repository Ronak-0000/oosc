// Base URL for your live Render backend
const BACKEND_BASE_URL = "https://caseloop.onrender.com";

export interface AIAnalysisResponse {
  title: string;
  category: string;
  rulebookId: string;
  daysRemaining: number;
  formalLetter: string;
  redactedText: string;
  legalDiagnosis: string;
  initialScore: number;
  officer: {
    name: string;
    title: string;
    department: string;
    avatar?: string;
    jurisdiction?: string;
    email?: string;
    address?: string;
    portalUrl?: string;
    designationNote?: string;
  };
  requestScope: string;
  dateRange?: string;
  statute: string;
  vulnerabilities?: string[];
  recommendedFixes?: string[];
  appellateStrategy?: string[];
  statutoryClauses?: string[];
  recommendedExhibits?: string[];
  facts: Array<{ label: string; value: string }>;
  piiItems: Array<{ original: string; type: string }>;
}

/**
 * Uploads a PDF file to your Render backend to extract plain-language takeaways.
 */
export async function simplifyPdfFile(file: File): Promise<string[]> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_BASE_URL}/simplify`, {
    method: "POST",
    body: formData,
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}: ${rawText.slice(0, 200)}`);
  }

  const data = JSON.parse(rawText);
  if (data.simplified_points && Array.isArray(data.simplified_points)) {
    return data.simplified_points;
  }
  throw new Error("Invalid response format received from server.");
}

/**
 * Sends a plain-language prompt to your Render backend to generate an RTI application draft.
 */
export async function draftRtiApplication(prompt: string): Promise<string> {
  const response = await fetch(`${BACKEND_BASE_URL}/draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}: ${rawText.slice(0, 200)}`);
  }

  const data = JSON.parse(rawText);
  if (data.draft) {
    return data.draft;
  }
  throw new Error("No draft text found in response.");
}
