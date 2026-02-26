import { GoogleGenAI, Type } from "@google/genai";
import { VisaType, ApplicantContext, AuditResult, AuditCheck } from "../types";

export async function runDocumentAudit(
  visaType: VisaType,
  context: ApplicantContext,
  documents: { id: string; name: string; text: string }[],
): Promise<AuditResult> {
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  });
  // Helper to get text for specific placeholders
  const getDocText = (ids: string[]) => {
    const doc = documents.find((d) => ids.includes(d.id));
    return doc ? doc.text : "NOT PROVIDED";
  };

  // Helper to safely parse JSON from potentially markdown-wrapped text
  const parseResponse = (text: string) => {
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n|\n```|```/g, "").trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      throw new Error("AI response format error");
    }
  };

  // Helper to extract grounding sources
  const extractGrounding = (response: any) => {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return chunks.map((c: any) => (c.web?.uri ? { title: c.web.title, uri: c.web.uri } : null)).filter(Boolean);
  };

  // --- VISITOR VISA SPECIFIC LOGIC (FOLDER BASED ZIP SIMULATION) ---
  if (visaType === VisaType.VISITOR) {
    // Mandatory / Current Submission Folder
    const folder1Text = getDocText(["v_folder_current"]);
    // Refusal Folder
    const folder2Text = getDocText(["v_folder_refusal"]);
    // Supporting Docs Folder
    const folder3Text = getDocText(["v_folder_support"]);

    const prompt = `
You are DocuShield, an expert immigration document auditor. 
You are given lists of files extracted from a user's ZIP package for a Visitor Visa application.

The files have been auto-categorized into three lists.

1) "Mandatory / Current Submission" List:
${folder1Text}
   - Expect: IMM Forms, Passports, Photos, Proof of Funds (Bank, Tax, Pay), Employment Letters, Itineraries.

2) "Refusal History" List:
${folder2Text}
   - Expect: Previous refusal letters.

3) "Supporting Documents" List:
${folder3Text}
   - Expect: Additional documents.

YOUR TASK:
Scan the filenames provided in ALL lists to determine if the application is complete. 

STEP 1: Verify Mandatory Documents
Look for these specific items (by filename keywords):
- Application Form: Keywords "IMM", "5257", "Application"
- Family Information: Keywords "IMM", "5645", "Family"
- Passport: Keywords "Passport"
- Proof of Funds: Keywords "Bank", "Statement", "Fund", "Balance", "Account", "Asset", "Tax", "Pay", "Salary", "GIC"
- Proof of Employment/Ties: Keywords "Job", "Offer", "Letter", "Employment", "Work", "Experience"
- Purpose: Keywords "Itinerary", "Ticket", "Invitation", "SOP", "Letter"

RULE: If a mandatory document is missing from the "Mandatory" list but present in "Supporting Documents", mark it as PRESENT.

STEP 2: Financial Assessment
- Do filenames suggest strong financials (e.g. "Bank Statement", "CA Report")? 
- If no financial documents are found in ANY list, mark as WEAK/MISSING.

STEP 3: Output strictly in JSON:

{
  "visa_type": "Visitor Visa",
  "sub_type": "Tourism | Invitation-Based",
  "mandatory_documents_status": {
    "complete": true | false,
    "missing": ["List of missing mandatory docs"]
  },
  "financial_assessment": {
    "status": "Strong | Adequate | Weak | Missing",
    "notes": "brief explanation based on filenames"
  },
  "ties_assessment": {
    "status": "Strong | Moderate | Weak",
    "notes": "brief explanation based on filenames"
  },
  "previous_refusal_analysis": {
    "has_refusal": true | false,
    "issues_addressed": true | false,
    "notes": "brief explanation"
  },
  "overall_risk_factors": ["Risk 1", "Risk 2"],
  "approval_chance": "High | Medium | Low",
  "recommended_actions": ["Action 1", "Action 2"]
}

Important:
- Base your audit purely on the filenames provided.
- Be generous with filename matching (e.g., "stmt.pdf" likely means Statement).
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction:
            "You are DocuShield. You audit file lists for visa compliance. Output strictly valid JSON.",
          thinkingConfig: { thinkingBudget: 15000 },
        },
      });

      const json = parseResponse(response.text || "{}");
      const groundingSources = extractGrounding(response);

      const approvalToRisk = (chance: string) => {
        if (chance === "High") return "Low";
        if (chance === "Medium") return "Medium";
        return "High";
      };

      const checks: AuditCheck[] = [
        {
          category: "Mandatory Documents",
          status: json.mandatory_documents_status?.complete ? "Pass" : "Fail",
          issues: json.mandatory_documents_status?.missing || [],
          notes: json.mandatory_documents_status?.complete
            ? "All core documents identified."
            : "Missing mandatory documents.",
        },
        {
          category: "Financial Assessment",
          status:
            json.financial_assessment?.status === "Strong" || json.financial_assessment?.status === "Adequate"
              ? "Pass"
              : "Fail",
          issues: [],
          notes: json.financial_assessment?.notes || "No financial docs detected.",
        },
        {
          category: "Ties & Employment",
          status:
            json.ties_assessment?.status === "Strong" || json.ties_assessment?.status === "Moderate"
              ? "Pass"
              : "Warning",
          issues: [],
          notes: json.ties_assessment?.notes || "Weak proof of ties.",
        },
      ];

      if (json.previous_refusal_analysis?.has_refusal) {
        checks.push({
          category: "Refusal History",
          status: json.previous_refusal_analysis.issues_addressed ? "Pass" : "Fail",
          issues: [],
          notes: json.previous_refusal_analysis.notes,
        });
      }

      if (json.overall_risk_factors && json.overall_risk_factors.length > 0) {
        checks.push({
          category: "Risk Factors",
          status: "Warning",
          issues: json.overall_risk_factors,
          notes: "Potential risks identified.",
        });
      }

      return {
        visaType: VisaType.VISITOR,
        overallRisk: approvalToRisk(json.approval_chance),
        summary: `Audit complete. Approval Chance: ${json.approval_chance}.`,
        checks: checks,
        missingDocuments: json.mandatory_documents_status?.missing || [],
        recommendations: json.recommended_actions || [],
        groundingSources,
      };
    } catch (error) {
      console.error("DocuShield Visitor Audit Error:", error);
      throw error;
    }
  }

  // --- STUDY PERMIT SPECIFIC LOGIC ---
  if (visaType === VisaType.STUDY) {
    // Extract Documents
    const forms = getDocText(["s_form_app", "s_form_fam"]);
    const loa = getDocText(["s_loa"]);
    const sop = getDocText(["s_sop"]);
    const identity = getDocText(["s_id", "s_photo"]);

    const financials = getDocText(["s_fin_bank", "s_fin_gic", "s_fin_loan", "s_fin_scholar", "s_fin_parent"]);
    const academics = getDocText(["s_acad_docs", "s_eca", "s_lang"]);
    const background = getDocText(["s_police", "s_med", "s_bg_refusal"]);

    const contextString = `
    - Country of residence: ${context.countryOfResidence || "Determine from documents"}
    - Level of Study: ${context.levelOfStudy || "Determine from documents"}
    - Program: ${context.programName || "Determine from documents"}
    - Institution: ${context.institutionName || "Determine from documents"}
    - Intake: ${context.intake || "Determine from documents"}
    - Previous Background: ${context.previousBackground || "Determine from documents"}
    `;

    const prompt = `
Audit the following Canadian Study Permit application.
Use Google Search to verify DLI status, program eligibility for PGWP, or specific country requirements (SDS) if relevant.

APPLICATION TYPE:
- Study Permit
- Stream: SDS or Non-SDS

APPLICANT CONTEXT:
${contextString}

DOCUMENTS PROVIDED (Text Extracted):

1. Forms (IMM 1294, 5645):
${forms}

2. Letter of Acceptance (LOA):
${loa}

3. Statement of Purpose (SOP):
${sop}

4. Identity (Passport, Photo):
${identity}

5. Academic & Language (Transcripts, Degrees, IELTS/PTE, ECA):
${academics}

6. Financials (Bank, GIC, Loan, Scholarships, Parent Income):
${financials}

7. Background (Refusal Letters, Police, Medical):
${background}

MANDATORY DOCUMENTS (ALL STUDY PERMITS):
- IMM 1294 (Study Permit Application)
- IMM 5645 (Family Information)
- Letter of Acceptance (from a DLI-approved institution)
- Statement of Purpose (Study Plan)
- Passport Bio-page
- Digital Photograph
- Language Test Results
- Academic Documents (degrees, diplomas, transcripts)
- Proof of Funds (at least one strong source)

ACADEMIC RULES:
- Academic documents must support logical study progression
- ECA is REQUIRED only if:
  - Education is from outside Canada AND
  - Officer needs equivalency clarification
- Missing or inconsistent academics increase refusal risk

PROOF OF FUNDS – ACCEPTABLE DOCUMENTS:
- Bank Statements (last 6 months) – Mandatory
- GIC (Mandatory for SDS)
- Education Loan Approval (if applicable)
- Scholarship / Funding Letter (if applicable)
- Parent Income Documents (if sponsored)

FINANCIAL RULES:
- SDS applications MUST include GIC
- Funds must reasonably cover tuition + living expenses
- Multiple weak documents do NOT replace a strong financial source

BACKGROUND & HISTORY DOCUMENTS:
- Previous Refusal Letters (MANDATORY if any past refusal exists)
- Police Clearance Certificate (if requested / applicable)
- Medical Examination (upfront or when requested)

RISK EVALUATION TASKS:
1. Verify presence of all mandatory documents
2. Identify SDS vs Non-SDS compliance
3. Validate consistency between:
   - Letter of Acceptance
   - Statement of Purpose
   - Academic background
   - Financial capacity
4. Review previous refusal reasons and check if addressed
5. Identify gaps, inconsistencies, or unexplained changes
6. Assess refusal risk based on:
   - Weak SOP
   - Weak or unclear finances
   - Poor academic progression
   - Unaddressed previous refusals

OUTPUT STRICTLY IN THIS JSON FORMAT:

{
  "application_type": "Study Permit",
  "stream": "SDS | Non-SDS",
  "overall_risk_level": "Low | Medium | High",
  "mandatory_documents_status": {
    "complete": true | false,
    "missing_documents": []
  },
  "academic_assessment": {
    "status": "Strong | Moderate | Weak",
    "issues": []
  },
  "financial_assessment": {
    "status": "Strong | Moderate | Weak",
    "issues": []
  },
  "statement_of_purpose_assessment": {
    "status": "Clear | Weak | Inconsistent",
    "issues": []
  },
  "previous_refusal_review": {
    "has_previous_refusal": true | false,
    "addressed_properly": true | false,
    "issues": []
  },
  "background_checks": {
    "medical_exam": "Provided | Pending | Not Required Yet",
    "police_certificate": "Provided | Pending | Not Required Yet"
  },
  "key_risk_factors": [],
  "audit_recommendations": [],
  "final_audit_summary": "Short, neutral audit conclusion"
}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction:
            "You are DocuShield, a conservative immigration document auditor. Always output strictly valid JSON.",
          thinkingConfig: { thinkingBudget: 15000 },
        },
      });

      const json = parseResponse(response.text || "{}");
      const groundingSources = extractGrounding(response);

      // Map Study Permit JSON to generic AuditResult
      const mapStatus = (status: string): "Pass" | "Warning" | "Fail" => {
        if (["Strong", "Clear", "Provided"].includes(status)) return "Pass";
        if (["Moderate", "Pending"].includes(status)) return "Warning";
        return "Fail";
      };

      const checks: AuditCheck[] = [
        {
          category: "Academic Assessment",
          status: mapStatus(json.academic_assessment?.status),
          issues: json.academic_assessment?.issues || [],
          notes: `Assessment: ${json.academic_assessment?.status}`,
        },
        {
          category: "Financial Assessment",
          status: mapStatus(json.financial_assessment?.status),
          issues: json.financial_assessment?.issues || [],
          notes: `Assessment: ${json.financial_assessment?.status}`,
        },
        {
          category: "Statement of Purpose",
          status: mapStatus(json.statement_of_purpose_assessment?.status),
          issues: json.statement_of_purpose_assessment?.issues || [],
          notes: `Clarity: ${json.statement_of_purpose_assessment?.status}`,
        },
        {
          category: "Background Checks",
          status:
            json.background_checks?.medical_exam === "Provided" ||
            json.background_checks?.medical_exam === "Not Required Yet"
              ? "Pass"
              : "Warning",
          issues: [],
          notes: `Medical: ${json.background_checks?.medical_exam}, Police: ${json.background_checks?.police_certificate}`,
        },
      ];

      // Add Refusal Review check only if applicable
      if (json.previous_refusal_review?.has_previous_refusal) {
        checks.push({
          category: "Previous Refusal Analysis",
          status: json.previous_refusal_review.addressed_properly ? "Pass" : "Fail",
          issues: json.previous_refusal_review.issues || [],
          notes: json.previous_refusal_review.addressed_properly
            ? "Refusal addressed properly."
            : "Refusal NOT adequately addressed.",
        });
      }

      // Add Key Risk Factors as a check if any
      if (json.key_risk_factors && json.key_risk_factors.length > 0) {
        checks.unshift({
          category: "Key Risk Factors",
          status: json.overall_risk_level === "High" ? "Fail" : "Warning",
          issues: json.key_risk_factors,
          notes: "Critical risks identified impacting the decision.",
        });
      }

      return {
        visaType: VisaType.STUDY,
        overallRisk: json.overall_risk_level as "High" | "Medium" | "Low",
        summary: `${json.final_audit_summary} (Stream: ${json.stream})`,
        checks: checks,
        missingDocuments: json.mandatory_documents_status?.missing_documents || [],
        recommendations: json.audit_recommendations || [],
        groundingSources,
      };
    } catch (error) {
      console.error("DocuShield Study Audit Error:", error);
      throw error;
    }
  }

  // --- WORK PERMIT SPECIFIC LOGIC ---
  if (visaType === VisaType.WORK) {
    const forms = getDocText(["w_form_app", "w_form_fam"]);
    const identity = getDocText(["w_id", "w_photo"]);
    const employment = getDocText(["w_cont", "w_lmia", "w_exp"]);
    const financials = getDocText(["w_fin_bank", "w_fin_letter", "w_fin_ca"]);
    // w_lang, w_cert, w_ties, w_marriage, w_police, w_med
    const conditional = getDocText(["w_lang", "w_cert", "w_ties", "w_marriage", "w_police", "w_med"]);

    const contextString = `
    - Country of residence: ${context.countryOfResidence || "Determine from documents"}
    - Work Permit Type: ${context.workPermitType || "Determine from documents"}
    - Job Title: ${context.jobTitle || "Determine from documents"}
    - Employer: ${context.employerName || "Determine from documents"}
    - LMIA Status: ${context.lmiaStatus || "Determine from documents"}
    `;

    const prompt = `
Audit the following Canadian Work Permit application.
Use Google Search to verify current LMIA exemption codes (e.g., C50, C11) or specific country requirements if relevant.

APPLICANT CONTEXT:
${contextString}

DOCUMENTS PROVIDED (Text Extracted):

1. Forms (IMM 1295, 5645):
${forms}

2. Identity (Passport, Photo):
${identity}

3. Employment (Contract, LMIA/Exemption, Experience):
${employment}

4. Financials (Bank, Assets):
${financials}

5. Conditional/Support (Language, Certs, Ties, Marriage, Police, Medical):
${conditional}

MANDATORY DOCUMENTS:
- IMM 1295 (Application)
- IMM 5645 (Family Information)
- Passport Bio-page
- Digital Photo
- Job Contract / Offer Letter
- LMIA OR LMIA Exemption proof
- Proof of Work Experience

CONDITIONAL / OPTIONAL DOCUMENTS:
- Proof of Funds (supporting only)
- Language Test Results (if provided)
- Professional Certificates (if job requires)
- Proof of Ties (optional, intent support)
- Marriage Certificate (if applicable)
- Police Certificates (if requested)
- Upfront Medical Exam (only if job/country requires)

AUDIT TASKS:
1. Verify presence of all mandatory documents
2. Confirm LMIA OR valid exemption is provided
3. Check alignment between:
   - Job offer
   - Applicant experience
   - Professional qualifications
4. Identify missing or weak mandatory documents
5. Assess risk based on:
   - Job–experience mismatch
   - Missing authorization (LMIA/exemption)
   - Weak intent explanation (if provided)

OUTPUT STRICTLY IN THIS JSON FORMAT:

{
  "application_type": "Work Permit",
  "overall_risk_level": "Low | Medium | High",
  "mandatory_documents_status": {
    "complete": true | false,
    "missing_documents": []
  },
  "employment_assessment": {
    "job_offer_valid": true | false,
    "experience_match": "Strong | Moderate | Weak",
    "issues": []
  },
  "authorization_status": {
    "lmia_or_exemption_provided": true | false,
    "issues": []
  },
  "background_checks": {
    "medical_exam": "Provided | Not Required | Pending",
    "police_certificate": "Provided | Not Required | Pending"
  },
  "key_risk_factors": [],
  "audit_recommendations": [],
  "final_audit_summary": "Short, neutral audit conclusion"
}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction:
            "You are DocuShield, a conservative immigration document auditor. Always output strictly valid JSON.",
          thinkingConfig: { thinkingBudget: 15000 },
        },
      });

      const json = parseResponse(response.text || "{}");
      const groundingSources = extractGrounding(response);

      const checks: AuditCheck[] = [
        {
          category: "Employment Assessment",
          status:
            json.employment_assessment?.job_offer_valid && json.employment_assessment?.experience_match === "Strong"
              ? "Pass"
              : "Warning",
          issues: json.employment_assessment?.issues || [],
          notes: `Job Match: ${json.employment_assessment?.experience_match}`,
        },
        {
          category: "Authorization (LMIA/Exemption)",
          status: json.authorization_status?.lmia_or_exemption_provided ? "Pass" : "Fail",
          issues: json.authorization_status?.issues || [],
          notes: json.authorization_status?.lmia_or_exemption_provided
            ? "Authorization Present"
            : "Missing LMIA or Exemption Proof",
        },
        {
          category: "Background Checks",
          status: "Pass", // Usually passive unless flagged
          issues: [],
          notes: `Medical: ${json.background_checks?.medical_exam}, Police: ${json.background_checks?.police_certificate}`,
        },
      ];

      if (json.key_risk_factors && json.key_risk_factors.length > 0) {
        checks.unshift({
          category: "Key Risk Factors",
          status: json.overall_risk_level === "High" ? "Fail" : "Warning",
          issues: json.key_risk_factors,
          notes: "Critical risks identified.",
        });
      }

      return {
        visaType: VisaType.WORK,
        overallRisk: json.overall_risk_level as "High" | "Medium" | "Low",
        summary: json.final_audit_summary,
        checks: checks,
        missingDocuments: json.mandatory_documents_status?.missing_documents || [],
        recommendations: json.audit_recommendations || [],
        groundingSources,
      };
    } catch (error) {
      console.error("DocuShield Work Permit Audit Error:", error);
      throw error;
    }
  }

  // --- LEGACY LOGIC FOR EXPRESS ENTRY ---

  // Mappings based on constants.tsx IDs for Express Entry
  const passportText = getDocText(["e_id"]);

  const fundsIds = ["e_funds"];
  const fundsDocs = documents.filter((d) => fundsIds.includes(d.id));
  const fundsText = fundsDocs.length > 0 ? fundsDocs.map((d) => `[${d.name}]: ${d.text}`).join("\n\n") : "NOT PROVIDED";

  // Job Details, Education, etc. for EE
  const purposeText = getDocText([
    "e_offer",
    "e_pnp",
    "e_trade_cert",
    "e_ref_letter",
    "e_emp_proof",
    "e_degree",
    "e_transcripts",
    "e_eca",
    "e_lang",
    "e_cec_docs",
  ]);

  // Background docs for EE
  const tiesText = getDocText([
    "e_police",
    "e_med",
    "e_form_travel",
    "e_form_sch_a",
    "e_marriage",
    "e_divorce",
    "e_birth",
    "e_dep_docs",
  ]);

  // Exclude explicit mapped IDs from "Other Documents"
  const mappedIds = [
    "e_id",
    ...fundsIds,
    "e_offer",
    "e_pnp",
    "e_trade_cert",
    "e_ref_letter",
    "e_emp_proof",
    "e_degree",
    "e_transcripts",
    "e_eca",
    "e_lang",
    "e_cec_docs",
    "e_police",
    "e_med",
    "e_form_travel",
    "e_form_sch_a",
    "e_marriage",
    "e_divorce",
    "e_birth",
    "e_dep_docs",
  ];

  let specificInstructions = `
    CRITICAL INSTRUCTION: DETERMINE APPLICABLE EXPRESS ENTRY STREAM (FSW | CEC | FST).
    
    Decision Rules (Strictly Follow):
    1. If Canadian skilled work experience (in 'Work History' or 'Job Offer' context) is 12 months or more → CEC
    2. Else if occupation is a skilled trade AND (valid job offer OR trade certificate exists) → FST
    3. Else → FSW

    You must:
    - Analyze the 'Other Documents' (specifically Work History / Reference Letters) and 'Purpose/Job Details' sections.
    - Explicitly state the determined stream in the 'summary' field (e.g., "Stream Determination: CEC").
    - Add a Check item with category "Program Eligibility" containing the status "Pass" (if eligible) or "Fail" and reasoning.
  `;

  const contextString = `
    - Country of residence: ${context.countryOfResidence}
    - Total skilled work experience: ${context.totalWorkYears} years
    - Skilled work experience in Canada: ${context.canadianWorkMonths} months
    - Current occupation / NOC: ${context.nocCode}
    - Is skilled trade?: ${context.isSkilledTrade}
    - Valid Canadian job offer?: ${context.hasJobOffer}
    - Canadian trade certificate?: ${context.hasTradeCertificate}
    - Provincial nomination?: ${context.hasProvincialNomination}
    - Highest level of education: ${context.highestEducation}
    - Intended Express Entry goal: ${context.prGoal}
  `;

  const prompt = `
Audit the following documents for Express Entry.
Use Google Search to verify current official requirements, CRS trends, or specific stream criteria (FSW/CEC/FST).

Applicant Context:
${contextString}

${specificInstructions}

Uploaded Documents (extracted text only):

1. Passport Bio Page:
${passportText}

2. Proof of Funds:
${fundsText}

3. Education, Work Experience & Language:
${purposeText}

4. Civil Documents & Background:
${tiesText}

5. Other Documents (merged):
${documents
  .filter((d) => !mappedIds.includes(d.id))
  .map((d) => `[${d.name}]: ${d.text}`)
  .join("\n")}

Audit Instructions:
- Evaluate documents strictly for Express Entry
- Do not assume approval or refusal authority
- Identify missing, weak, inconsistent, or risky elements
- Use conservative reasoning aligned with common IRCC assessment factors
- Base conclusions only on provided document content
- If a document is MISSING (content says NOT PROVIDED), flag it in missingDocuments or checks.

Return the audit strictly in the following JSON format (no markdown, no extra text):
{
  "visaType": "Express Entry",
  "overallRisk": "Low | Medium | High",
  "summary": "Executive summary string...",
  "checks": [
    {
      "category": "Identity Verification",
      "status": "Pass | Warning | Fail",
      "issues": ["Issue 1", "Issue 2"],
      "notes": "Observation notes"
    },
    ... (include Financial Sufficiency, Program Eligibility, Background)
  ],
  "missingDocuments": ["Doc Name 1", ...],
  "recommendations": ["Rec 1", ...]
}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          "You are DocuShield, a conservative immigration document auditor. You parse document text and applicant context to identify refusal risks based on IRCC guidelines. You output strictly valid JSON.",
        thinkingConfig: { thinkingBudget: 15000 },
      },
    });

    const json = parseResponse(response.text || "{}");
    const groundingSources = extractGrounding(response);

    return { ...json, groundingSources } as AuditResult;
  } catch (error) {
    console.error("DocuShield Express Entry Audit Error:", error);
    throw error;
  }
}
