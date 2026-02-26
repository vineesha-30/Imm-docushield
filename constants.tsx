
import { VisaType, PricingPlan, DocumentRequirement } from './types';

export const VISA_PROGRAMS = [
  { 
    id: VisaType.VISITOR, 
    label: 'Visitor Visa', 
    description: 'For tourism, visiting family, or short-term business.',
    checklist: [
      { 
        id: 'v_zip_upload', 
        label: 'Full Application Package (ZIP)', 
        category: 'Bulk Upload', 
        description: 'Upload a single ZIP file containing all your documents. We will extract and segregate them automatically.', 
        required: true 
      }
    ]
  },
  { 
    id: VisaType.STUDY, 
    label: 'Study Permit', 
    description: 'For international students admitted to DLIs.',
    checklist: [
      { id: 's_form_app', label: 'IMM 1294 (Application)', category: 'Forms', description: 'Application for Study Permit made outside of Canada.', required: true },
      { id: 's_form_fam', label: 'IMM 5645 (Family Info)', category: 'Forms', description: 'Details about immediate family members.', required: true },
      { id: 's_loa', label: 'Letter of Acceptance', category: 'Eligibility', description: 'Original LOA from a Designated Learning Institution (DLI).', required: true },
      { id: 's_sop', label: 'Statement of Purpose', category: 'Purpose', description: 'Study plan explaining why you want to study in Canada and your future goals.', required: true },
      
      // Financials (Standard)
      { id: 's_fin_bank', label: 'Bank Statements', category: 'Financials', description: 'Personal or sponsor bank statements (past 4 months).', required: true, group: 'Proof of Funds' },
      { id: 's_fin_gic', label: 'GIC (Mandatory for SDS)', category: 'Financials', description: 'Guaranteed Investment Certificate (e.g., $20,635).', required: false, group: 'Proof of Funds' },
      { id: 's_fin_loan', label: 'Education Loan Approval', category: 'Financials', description: 'Sanction letter from a financial institution.', required: false, group: 'Proof of Funds' },
      { id: 's_fin_scholar', label: 'Scholarship / Funding Letter', category: 'Financials', description: 'Proof of scholarship or financial aid awards.', required: false, group: 'Proof of Funds' },
      { id: 's_fin_parent', label: 'Parent Income Documents', category: 'Financials', description: 'Sponsor’s employment proof, pay slips, or ITR.', required: false, group: 'Proof of Funds' },

      { id: 's_id', label: 'Passport Bio-page', category: 'Identity', description: 'Must be valid for the duration of your study.', required: true },
      { id: 's_photo', label: 'Digital Photo', category: 'Identity', description: 'Meeting IRCC photo specifications.', required: true },
      
      { id: 's_lang', label: 'Language Results', category: 'Education', description: 'IELTS/CELPIP/PTE (Required for SDS, Conditional for others).', required: true },
      
      // Added Items (Moved from Work Permit)
      { id: 's_acad_docs', label: 'Academic Documents', category: 'Education', description: 'Transcripts, diplomas, and mark sheets.', required: false },
      { id: 's_eca', label: 'ECA Report', category: 'Education', description: 'Educational Credential Assessment (if applicable).', required: false },

      { id: 's_police', label: 'Police Certificates', category: 'Background', description: 'From countries where you lived >6 months (Conditional).', required: false },
      { id: 's_med', label: 'Medical Exam', category: 'Background', description: 'Upfront medical exam e-Medical sheet (if applicable).', required: false },
      
      // Added Item (Moved from Work Permit)
      { id: 's_bg_refusal', label: 'Previous Refusal Letters', category: 'Background', description: 'Letters explaining any previous visa refusals (if applicable).', required: false }
    ]
  },
  { 
    id: VisaType.WORK, 
    label: 'Work Permit', 
    description: 'For various employment authorization streams.',
    checklist: [
      { id: 'w_form_app', label: 'IMM 1295 (Application)', category: 'Forms', description: 'Application for Work Permit made outside of Canada.', required: true },
      { id: 'w_form_fam', label: 'IMM 5645 (Family Info)', category: 'Forms', description: 'Details about immediate family members.', required: true },
      { id: 'w_id', label: 'Passport Bio-page', category: 'Identity', description: 'Clear scan of passport identity page.', required: true },
      { id: 'w_photo', label: 'Digital Photo', category: 'Identity', description: 'Photo meeting IRCC specifications.', required: true },
      
      // Employment & Eligibility
      { id: 'w_cont', label: 'Job Contract', category: 'Employment', description: 'Signed offer letter or contract.', required: true },
      { id: 'w_lmia', label: 'LMIA / Exemption', category: 'Eligibility', description: 'Labour market impact assessment copy or Offer of Employment number.', required: true },
      { id: 'w_exp', label: 'Proof of Experience', category: 'Employment', description: 'Reference letters from past employers.', required: true },
      
      // Financials (Detailed Grouping)
      { id: 'w_fin_bank', label: 'Bank Statements', category: 'Financials', description: 'Personal bank statements (past 6 months).', required: true, group: 'Proof of Funds' },
      { id: 'w_fin_letter', label: 'Bank Balance Certificate', category: 'Financials', description: 'Bank letter showing liquid funds (e.g., 20 Lakhs).', required: false, group: 'Proof of Funds' },
      { id: 'w_fin_ca', label: 'CA Net Worth Letter', category: 'Financials', description: 'Chartered Accountant summary of assets.', required: false, group: 'Proof of Funds' },

      // Education & Language
      // Removed Academic Documents and ECA Report as requested
      { id: 'w_lang', label: 'Language Results', category: 'Education', description: 'IELTS/CELPIP/PTE results.', required: false },
      { id: 'w_cert', label: 'Professional Certs', category: 'Eligibility', description: 'Degrees or licenses required for role (Conditional).', required: false },

      // Background & Ties
      { id: 'w_ties', label: 'Proof of Ties', category: 'Intent', description: 'Evidence of assets/family home to prove temporary intent.', required: false },
      // Added Marriage Certificate
      { id: 'w_marriage', label: 'Marriage Certificate', category: 'Civil Status', description: 'Required if you are married.', required: false },
      // Removed Previous Refusal Letters as requested
      { id: 'w_police', label: 'Police Certificates', category: 'Background', description: 'From countries where you lived >6 months (Conditional).', required: false },
      { id: 'w_med', label: 'Upfront Medical Exam', category: 'Background', description: 'E-Medical information sheet (Mandatory).', required: true }
    ]
  },
  { 
    id: VisaType.EXPRESS_ENTRY, 
    label: 'Express Entry', 
    description: 'Permanent residency via Skilled Worker paths.',
    checklist: [
      // Application & Declarations
      { id: 'e_form_app', label: 'Express Entry App (Online)', category: 'Forms', description: 'Copy of online application summary.', required: true },
      { id: 'e_form_sch_a', label: 'Schedule A (IMM 5669)', category: 'Forms', description: 'Background / Declaration form.', required: true },
      { id: 'e_form_fam', label: 'Family Information (IMM 5406)', category: 'Forms', description: 'Additional Family Information.', required: true },
      { id: 'e_form_travel', label: 'Travel History', category: 'Forms', description: 'IMM 5562 - Supplementary Information.', required: true },

      // Identity
      { id: 'e_id', label: 'Passport Bio-page', category: 'Identity', description: 'Valid passport (bio page + stamped pages).', required: true },
      { id: 'e_photo', label: 'Digital Photo', category: 'Identity', description: 'Meeting PR specifications.', required: true },
      { id: 'e_birth', label: 'Birth Certificate', category: 'Identity', description: 'Proof of birth / age.', required: true },

      // Language
      { id: 'e_lang', label: 'Language Results', category: 'Eligibility', description: 'Valid IELTS / CELPIP / TEF / TCF.', required: true },

      // Education
      { id: 'e_eca', label: 'ECA Report', category: 'Education', description: 'Educational Credential Assessment (for foreign education).', required: true },
      { id: 'e_degree', label: 'Degree/Diploma', category: 'Education', description: 'Copies of certificates.', required: true },
      { id: 'e_transcripts', label: 'Transcripts', category: 'Education', description: 'Academic transcripts/mark sheets.', required: true },

      // Work Experience
      { id: 'e_ref_letter', label: 'Reference Letters', category: 'Work Experience', description: 'Employer letters (NOC-aligned duties).', required: true },
      { id: 'e_emp_proof', label: 'Employment Proof', category: 'Work Experience', description: 'Payslips, contracts, tax docs.', required: true },

      // Police & Medical
      { id: 'e_police', label: 'Police Certificates', category: 'Background', description: 'For all countries lived ≥6 months > age 18.', required: true },
      { id: 'e_med', label: 'Medical Exam (IME)', category: 'Background', description: 'Upfront medical examination sheet.', required: true },

      // Stream Specific (Mandatory for some)
      { id: 'e_funds', label: 'Proof of Funds', category: 'Financials', description: 'Settlement funds (Mandatory for FSW/FST).', required: false, group: 'Stream Specific' },

      // Optional/Conditional
      { id: 'e_marriage', label: 'Marriage Certificate', category: 'Civil Status', description: 'If married.', required: false, group: 'Civil Status' },
      { id: 'e_divorce', label: 'Divorce/Death Cert', category: 'Civil Status', description: 'If applicable.', required: false, group: 'Civil Status' },
      { id: 'e_dep_docs', label: 'Dependent Documents', category: 'Civil Status', description: 'Passports/Birth certs for dependents.', required: false, group: 'Civil Status' },
      
      { id: 'e_pnp', label: 'Provincial Nomination', category: 'Stream Specific', description: 'Nomination Certificate (PNP).', required: false, group: 'Stream Specific' },
      { id: 'e_trade_cert', label: 'Trade Certificate', category: 'Stream Specific', description: 'Certificate of Qualification (FST).', required: false, group: 'Stream Specific' },
      { id: 'e_offer', label: 'Job Offer', category: 'Employment', description: 'Valid Canadian job offer (LMIA/Exempt).', required: false },
      { id: 'e_cec_docs', label: 'CEC Tax Docs', category: 'Employment', description: 'T4s, NOAs, Work Permits (CEC).', required: false },
      
      { id: 'e_rep', label: 'IMM 5476 (Rep)', category: 'Representation', description: 'Use of a Representative form.', required: false },
      { id: 'e_loe', label: 'Letter of Explanation', category: 'Other', description: 'Explain gaps, refusals, discrepancies.', required: false },
      { id: 'e_name_change', label: 'Name Change Affidavit', category: 'Identity', description: 'If applicable.', required: false },
      { id: 'e_custody', label: 'Custody Documents', category: 'Civil Status', description: 'Adoption/Custody papers.', required: false }
    ]
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Basic Shield',
    price: '$49',
    color: 'bg-green-600',
    features: [
      'Checklist verification',
      'Missing file detection',
      'Format & typo check',
      '1 audit run'
    ]
  },
  {
    name: 'Smart Shield',
    price: '$99',
    color: 'bg-blue-600',
    popular: true,
    features: [
      'Full consistency engine',
      'Risk-based categorization',
      'Detailed audit report',
      'Unlimited re-audits'
    ]
  },
  {
    name: 'Complete Shield',
    price: '$199',
    color: 'bg-red-600',
    features: [
      'Everything in Smart Shield',
      'NOC / CRS calculation',
      'Letter of Explanation drafts',
      'Family support'
    ]
  }
];
