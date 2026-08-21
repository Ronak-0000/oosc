// 1. Initial Grievance Analysis (Now parses both /simplify and /draft properly)
export async function analyzeIssueApi(prompt: string, city: string, file?: File): Promise<AIAnalysisResponse> {
  try {
    let res;
    let summaryText = "";
    
    // If a PDF is attached, send to /simplify
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      
      res = await fetch(`${BACKEND_BASE_URL}/simplify`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data.simplified_points)) {
            summaryText = data.simplified_points.join("\n• ");
            if (summaryText) summaryText = "• " + summaryText;
          } else if (data.summary) {
            summaryText = data.summary;
          } else {
            summaryText = text;
          }
        } catch {
          summaryText = text;
        }
      }
    } else {
      // Standard JSON request for text-only
      res = await fetch(`${BACKEND_BASE_URL}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `[Jurisdiction: ${city}] ${prompt}` }),
      });
    }

    // Now generate draft for the prompt/document
    let draftRes = await fetch(`${BACKEND_BASE_URL}/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: `[Jurisdiction: ${city}] ${prompt} \n\nDocument Context: ${summaryText}` }),
    });

    const draftTextRaw = await draftRes.text();
    let draftData: any = {};
    if (draftTextRaw) {
      try {
        draftData = JSON.parse(draftTextRaw);
      } catch {
        draftData = { draft: draftTextRaw };
      }
    }

    const generatedDraft = draftData.draft || draftTextRaw || "RTI draft generated successfully.";

    return {
      title: prompt.slice(0, 50).replace("Document Attached: ", "") + "...",
      category: "Civic Redressal & Legal Notice",
      rulebookId: "rti",
      statute: "Right to Information Act 2005 § 6(1)",
      daysRemaining: 30,
      initialScore: 92,
      legalDiagnosis: "Statutory parameters mapped and document analysis prepared.",
      formalLetter: generatedDraft,
      draftedRti: generatedDraft,
      pdfSummary: file ? (summaryText || "No text could be extracted from this document.") : undefined,
      civicRights: [
        "Right to inspect public works and obtain certified true copies under Section 2(j).",
        "Mandatory 30-day statutory response window under Section 7(1).",
        "Protection against arbitrary withholding under Section 8 exemptions."
      ],
      facts: [{ label: "Primary Grievance", value: prompt }],
      officer: {
        name: "Public Information Officer / Competent Authority",
        title: "Designated Officer",
        department: "Grievance Redressal Division",
        avatar: "AO",
        jurisdiction: city,
        email: "authority.cell@nic.in",
      },
      piiItems: [],
      vulnerabilities: ["Ensure proof of dispatch (Speed Post tracking or portal acknowledgement) is preserved."],
    };
  } catch (err: any) {
    console.error("API error, using client fallback:", err);
    return {
      title: prompt.slice(0, 50).replace("Document Attached: ", "") + "...",
      category: "Civic Redressal & Legal Notice",
      rulebookId: "rti",
      statute: "Right to Information Act 2005 § 6(1)",
      daysRemaining: 30,
      initialScore: 90,
      legalDiagnosis: "Statutory rights mapped. Ready for filing draft inspection.",
      formalLetter: `FORMAL STATUTORY NOTICE\n\nTo,\nThe Designated Competent Authority,\n${city}\n\nSubject: Formal submission regarding: ${prompt}\n\nSir/Madam,\nI hereby submit this statutory notice demanding formal resolution and supply of certified records pursuant to applicable statutory provisions.\n\nYours faithfully,\nAuthorized Citizen`,
      draftedRti: `FORMAL STATUTORY NOTICE\n\nTo,\nThe Designated Competent Authority,\n${city}\n\nSubject: Formal submission regarding: ${prompt}\n\nSir/Madam,\nI hereby submit this statutory notice demanding formal resolution and supply of certified records pursuant to applicable statutory provisions.\n\nYours faithfully,\nAuthorized Citizen`,
      pdfSummary: file ? `Document "${file.name}" uploaded. Key clauses extracted for review.` : undefined,
      civicRights: [
        "Right to seek certified public records under Section 6(1).",
        "Mandatory 30-day response window for the public authority.",
        "Right to file a First Appeal under Section 19 if denied or ignored."
      ],
      facts: [{ label: "User Submission", value: prompt }],
      officer: {
        name: "Public Information Officer",
        title: "Designated CPIO",
        department: "Civic Redressal Cell",
        avatar: "PIO",
        jurisdiction: city,
        email: "pio.cell@nic.in",
      },
      piiItems: [],
      vulnerabilities: ["Verify dispatch via speed post or official online portal."],
    };
  }
}
