
export enum VisaType {
  VISITOR = 'Visitor Visa',
  SUPER = 'Super Visa',
  STUDY = 'Study Permit',
  WORK = 'Work Permit',
  EXPRESS_ENTRY = 'Express Entry'
}

export enum Severity {
  MUST_FIX = 'MUST_FIX',
  RECOMMENDED = 'RECOMMENDED',
  OPTIONAL = 'OPTIONAL'
}

// Legacy Issue Type (kept for backward compatibility if needed, though mapped)
export interface AuditIssue {
  id: string;
  type: string;
  severity: Severity;
  documents: string[];
  description: string;
  whyItMatters: string;
  howToFix: string;
}

export interface ReadinessScore {
  overall: number;
  breakdown: {
    identity: number;
    financials: number;
    eligibility: number;
    risk: number;
  };
}

// New Audit Schema Types
export interface AuditCheck {
  category: string;
  status: 'Pass' | 'Warning' | 'Fail' | 'Not Provided';
  issues: string[];
  notes: string;
}

export interface AuditResult {
  visaType: string;
  overallRisk: 'Low' | 'Medium' | 'High';
  summary: string;
  checks: AuditCheck[];
  missingDocuments: string[];
  recommendations: string[];
  groundingSources?: { title?: string; uri: string }[];
}

export interface ApplicantContext {
  countryOfResidence: string;
  
  // Visitor / Standard fields
  travelDuration?: number;
  startDate?: string;
  endDate?: string;
  purpose?: string;

  // Study Permit specific fields
  levelOfStudy?: string;
  programName?: string;
  institutionName?: string;
  studyDuration?: string;
  intake?: string;
  previousBackground?: string;
  careerObjective?: string;

  // Work Permit specific fields
  workPermitType?: string;
  jobTitle?: string;
  employerName?: string;
  workLocation?: string;
  employmentDuration?: string;
  lmiaStatus?: string;
  experienceSummary?: string;
  postWorkIntent?: string;

  // Express Entry specific fields
  totalWorkYears?: string;
  canadianWorkMonths?: string;
  nocCode?: string;
  isSkilledTrade?: string; // "Yes" | "No"
  hasJobOffer?: string; // "Yes" | "No"
  hasTradeCertificate?: string; // "Yes" | "No"
  hasProvincialNomination?: string; // "Yes" | "No"
  highestEducation?: string;
  prGoal?: string;
}

export interface UserApplication {
  id: string;
  visaType: VisaType;
  status: 'In Progress' | 'Audited' | 'Submitted';
  progress: number;
  readinessScore?: ReadinessScore; // Calculated from Risk
  issues?: AuditIssue[]; // Mapped from checks
  auditResult?: AuditResult; // New full result
  context?: ApplicantContext;
  updatedAt: string;
}

export interface DocumentRequirement {
  id: string;
  label: string;
  category: string;
  description: string;
  required: boolean;
  group?: string; // Support for grouping requirements (e.g., Proof of Funds dropdown)
}

export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
  color: string;
}
