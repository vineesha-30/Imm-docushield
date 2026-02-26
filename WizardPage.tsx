
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VisaType, UserApplication, ApplicantContext, Severity, DocumentRequirement } from '../types';
import { VISA_PROGRAMS } from '../constants';
import { runDocumentAudit } from '../services/geminiService';
import JSZip from 'jszip';

const WizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedProgram, setSelectedProgram] = useState<typeof VISA_PROGRAMS[0] | null>(null);
  
  // Visitor Specific State
  const [visitorType, setVisitorType] = useState<'TOURISM' | 'INVITATION'>('TOURISM');

  // Segregated Files State for ZIP Mode
  const [segregatedFiles, setSegregatedFiles] = useState<{
    current: string[];
    refusal: string[];
    supporting: string[];
  }>({ current: [], refusal: [], supporting: [] });

  // Context State initialized with defaults
  const [context, setContext] = useState<ApplicantContext>({
    countryOfResidence: '',
    // Visitor defaults
    travelDuration: 14,
    startDate: '',
    endDate: '',
    purpose: '',
    // Study defaults
    levelOfStudy: '',
    programName: '',
    institutionName: '',
    studyDuration: '',
    intake: '',
    previousBackground: '',
    careerObjective: '',
    // Work defaults
    workPermitType: '',
    jobTitle: '',
    employerName: '',
    workLocation: '',
    employmentDuration: '',
    lmiaStatus: '',
    experienceSummary: '',
    postWorkIntent: '',
    // Express Entry defaults
    totalWorkYears: '',
    canadianWorkMonths: '',
    nocCode: '',
    isSkilledTrade: '',
    hasJobOffer: '',
    hasTradeCertificate: '',
    hasProvincialNomination: '',
    highestEducation: '',
    prGoal: ''
  });

  const [files, setFiles] = useState<{ [key: string]: { file: File, text: string } }>({});
  const [isAuditing, setIsAuditing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const handleProgramSelect = (program: typeof VISA_PROGRAMS[0]) => {
    setSelectedProgram(program);
    setStep(2); // Move directly to Upload Step
  };

  const handleFileUpload = async (reqId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Check if this is the ZIP Upload requirement
    if (reqId === 'v_zip_upload' && file.name.endsWith('.zip')) {
       await handleZipProcess(file);
    } else {
      // Standard single file upload
      setFiles({ 
        ...files, 
        [reqId]: { file: file, text: '' } 
      });
    }
  };

  // Improved Classification Logic
  const classifyFile = (fileName: string): 'current' | 'refusal' | 'supporting' => {
    const name = fileName.toLowerCase();
    
    // 1. Refusal / History (Highest Priority)
    // Catches: "Refusal Letter", "Rejection", "Explanation of Refusal"
    if (name.match(/refusal|reject|denied|previous|explanation|history|adverse|procedural/)) return 'refusal';

    // 2. Mandatory Core (Current Submission)
    
    // Forms
    if (name.match(/imm|application|form|schedule|family|representative|use of rep|info/)) return 'current';
    
    // Identity & Status
    if (name.match(/passport|photo|digital|pic|id|aadhar|birth|marriage|certificate|pr card|status|license/)) return 'current';
    
    // Financials (Strong keywords for Proof of Funds)
    // Catches: "Bank Statement", "Payslip", "Funds", "Balance", "Tax", "NOA", "T4", "Salary"
    if (name.match(/bank|statement|fund|balance|account|profile|net worth|ca report|evaluation|asset|property|valuation|tax|noa|t4|pay|salary|slip|income|gic|loan|scholarship/)) return 'current';
    
    // Employment & Ties
    // Catches: "Offer Letter", "Employment Letter", "Experience", "Contract"
    if (name.match(/job|offer|letter|employ|work|experience|contract|reference|leave|noc|company/)) return 'current';
    
    // Purpose / Travel
    // Catches: "Itinerary", "Ticket", "Invitation", "SOP"
    if (name.match(/itinerary|ticket|booking|flight|hotel|invitation|purpose|travel|plan|sop|study plan|letter of acceptance|loa|host/)) return 'current';
    
    // Official / Medical / Police
    if (name.match(/medical|police|pcc|clearance|ielts|celpip|language|transcript|degree|diploma/)) return 'current';

    // 3. Everything else -> Supporting
    // Examples: "Affidavit", "Cover Letter" (often supportive), "Client Info"
    return 'supporting';
  };

  const handleZipProcess = async (zipFile: File) => {
    setIsExtracting(true);
    setExtractionStatus('Initializing extraction...');
    setFiles({ ...files, 'v_zip_upload': { file: zipFile, text: 'ZIP Processed' } });
    
    try {
      const zip = new JSZip();
      await zip.loadAsync(zipFile);
      
      const currentList: string[] = [];
      const refusalList: string[] = [];
      const supportingList: string[] = [];

      let fileCount = 0;

      zip.forEach((relativePath: string, zipEntry: any) => {
        if (zipEntry.dir) return; // Skip directories
        
        // Flatten structure: Get just the filename, ignoring folders
        const cleanName = zipEntry.name.split('/').pop();
        
        if (!cleanName || cleanName.startsWith('.') || cleanName.startsWith('__')) return; // Skip hidden/system files

        fileCount++;
        const category = classifyFile(cleanName);
        
        // Add full relative path for context if needed, but display clean name
        // We stick to cleanName for categorization simplicity
        if (category === 'refusal') refusalList.push(cleanName);
        else if (category === 'current') currentList.push(cleanName);
        else supportingList.push(cleanName);
      });

      setExtractionStatus(`Scanned ${fileCount} files... Segregating...`);
      
      // Small artificial delay to show the user "Scanning" is happening
      await new Promise(r => setTimeout(r, 800));

      setSegregatedFiles({
        current: currentList,
        refusal: refusalList,
        supporting: supportingList
      });

    } catch (err) {
      console.error("ZIP Error", err);
      setError("Failed to extract ZIP file. Please ensure it is a valid archive.");
    } finally {
      setIsExtracting(false);
      setExtractionStatus('');
    }
  };

  const handleTextChange = (reqId: string, text: string) => {
    if (files[reqId]) {
      setFiles({
        ...files,
        [reqId]: { ...files[reqId], text }
      });
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Sync visitor purpose to context
  useEffect(() => {
    if (selectedProgram?.id === VisaType.VISITOR) {
      setContext(prev => ({
        ...prev,
        purpose: visitorType === 'TOURISM' ? 'Tourism / Sightseeing' : 'Visiting Family / Friends (Invitation-Based)'
      }));
    }
  }, [visitorType, selectedProgram]);

  const groupedChecklist = useMemo(() => {
    if (!selectedProgram) return [];
    
    let checklist = [...selectedProgram.checklist];

    // Dynamic filtering for Visitor Visa based on toggle
    if (selectedProgram.id === VisaType.VISITOR) {
       // Only show the ZIP upload, ignore others for now as we are in ZIP mode
       checklist = checklist.filter(item => item.id === 'v_zip_upload');
    }

    const groups: { type: 'single' | 'group', data: DocumentRequirement | { name: string, items: DocumentRequirement[] } }[] = [];
    const processedGroups = new Set<string>();

    checklist.forEach(req => {
      if (req.group) {
        if (!processedGroups.has(req.group)) {
          const groupItems = checklist.filter(r => r.group === req.group);
          groups.push({ type: 'group', data: { name: req.group, items: groupItems } });
          processedGroups.add(req.group);
        }
      } else {
        groups.push({ type: 'single', data: req });
      }
    });
    return groups;
  }, [selectedProgram, visitorType]);

  const startAudit = async () => {
    if (!selectedProgram) return;
    setIsAuditing(true);
    setError(null);

    try {
      let docsToAudit: { id: string, name: string, text: string }[] = [];

      // If Visitor Visa (ZIP Mode), construct virtual folder documents
      if (selectedProgram.id === VisaType.VISITOR) {
         docsToAudit = [
           { 
             id: 'v_folder_current', 
             name: 'Mandatory / Current Submission', 
             text: `SCANNED FILE LIST:\n${segregatedFiles.current.join('\n')}\n\n(AI Context: These files contain Forms, Financials, Identity, and Employment Documents.)` 
           },
           { 
             id: 'v_folder_refusal', 
             name: 'Refusal History', 
             text: `SCANNED FILE LIST:\n${segregatedFiles.refusal.join('\n')}` 
           },
           { 
             id: 'v_folder_support', 
             name: 'Supporting Documents', 
             text: `SCANNED FILE LIST:\n${segregatedFiles.supporting.join('\n')}` 
           }
         ];
      } else {
        // Standard Audit
        docsToAudit = Object.entries(files).map(([id, data]) => {
          const fileData = data as { file: File, text: string };
          return {
            id: id,
            name: selectedProgram.checklist.find(r => r.id === id)?.label || id,
            text: fileData.text
          };
        });
      }

      const result = await runDocumentAudit(selectedProgram.id as VisaType, context, docsToAudit);

      // Map new Result to Legacy Fields for Dashboard Compatibility
      let calculatedScore = 50;
      if (result.overallRisk === 'Low') calculatedScore = 95;
      if (result.overallRisk === 'Medium') calculatedScore = 72;
      if (result.overallRisk === 'High') calculatedScore = 45;

      const mappedIssues = result.checks
        .filter(c => c.status === 'Fail' || c.status === 'Warning')
        .flatMap((c, idx) => c.issues.map((issueDesc, i) => ({
          id: `issue_${idx}_${i}`,
          type: c.category,
          severity: c.status === 'Fail' ? Severity.MUST_FIX : Severity.RECOMMENDED,
          documents: [],
          description: issueDesc,
          whyItMatters: c.notes,
          howToFix: "See detailed recommendations."
        })));

      const newApp: UserApplication = {
        id: `audit_${Date.now()}`,
        visaType: selectedProgram.id as VisaType,
        status: 'Audited',
        progress: 100,
        context: context,
        readinessScore: {
          overall: calculatedScore,
          breakdown: {
            identity: result.checks.find(c => c.category.includes('Identity'))?.status === 'Pass' ? 100 : 50,
            financials: result.checks.find(c => c.category.includes('Financial'))?.status === 'Pass' ? 100 : 50,
            eligibility: 80, // generic
            risk: calculatedScore
          }
        },
        issues: mappedIssues as any, // Legacy typing mapping
        auditResult: result,
        updatedAt: new Date().toISOString()
      };

      // Persist locally
      const existing = JSON.parse(localStorage.getItem('ds_applications') || '[]');
      localStorage.setItem('ds_applications', JSON.stringify([newApp, ...existing]));

      navigate(`/audit/${newApp.id}`, { state: { application: newApp } });
    } catch (err: any) {
      console.error(err);
      setError("The DocuShield engine encountered a logic error. Please check your API configuration or try again.");
      setIsAuditing(false);
    }
  };

  const renderSingleRequirement = (req: DocumentRequirement) => (
    <div key={req.id} className="p-6 border border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-white transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${files[req.id] ? 'bg-green-100 text-green-600' : 'bg-white text-slate-400 border border-slate-100'}`}>
            {files[req.id] ? '✓' : '📄'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h5 className="font-bold text-slate-900">{req.label}</h5>
              {req.required && <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{req.category}</p>
          </div>
        </div>
        <label className={`cursor-pointer px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${files[req.id] ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-900'}`}>
          {files[req.id] ? 'Change File' : 'Upload ZIP'}
          <input 
            type="file" 
            className="hidden" 
            accept={req.id === 'v_zip_upload' ? ".zip" : "*"} 
            onChange={(e) => handleFileUpload(req.id, e)} 
          />
        </label>
      </div>

      {files[req.id] && req.id !== 'v_zip_upload' && (
        <div className="mt-4 animate-fadeIn">
          <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-[0.1em]">OCR Simulation: Paste Document Text Content</label>
          <textarea 
            value={files[req.id].text}
            onChange={(e) => handleTextChange(req.id, e.target.value)}
            placeholder="e.g. Passport Number, Dates, Employer Name, etc."
            className="w-full h-24 bg-white border border-slate-100 rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2"></div>
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${step >= s ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
              {s}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 animate-fadeIn">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Choose Your Pathway</h2>
            <p className="text-slate-500 mb-10">Select your intended visa program to load the specialized audit ruleset.</p>
            <div className="grid grid-cols-1 gap-4">
              {VISA_PROGRAMS.map((program) => (
                <button
                  key={program.id}
                  onClick={() => handleProgramSelect(program)}
                  className="group text-left p-6 border border-slate-100 rounded-[2rem] hover:border-red-500 hover:bg-red-50/50 transition-all flex justify-between items-center"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-red-100 group-hover:text-red-600 transition">
                      {program.id === VisaType.VISITOR ? '✈️' : program.id === VisaType.STUDY ? '🎓' : program.id === VisaType.WORK ? '👷' : '🍁'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-red-700">{program.label}</h4>
                      <p className="text-sm text-slate-500">{program.description}</p>
                    </div>
                  </div>
                  <span className="text-slate-300 group-hover:text-red-500 translate-x-0 group-hover:translate-x-2 transition font-black text-xl">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Uploads */}
        {step === 2 && selectedProgram && (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Build Your Vault</h2>
              <p className="text-slate-500">Upload documents and paste text for your <span className="font-bold text-red-600">{selectedProgram.label}</span> audit.</p>
            </div>

            {/* Visitor Visa Toggle */}
            {selectedProgram.id === VisaType.VISITOR && (
              <div className="mb-8 p-1.5 bg-slate-100 rounded-2xl flex">
                <button 
                  onClick={() => setVisitorType('TOURISM')}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
                    visitorType === 'TOURISM'
                    ? 'text-white bg-red-600 shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>✈️ Tourism</span>
                </button>
                <button 
                  onClick={() => setVisitorType('INVITATION')}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
                    visitorType === 'INVITATION' 
                    ? 'text-white bg-red-600 shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>🏠 Visiting Family / Friends (Invitation-Based)</span>
                </button>
              </div>
            )}
            
            <div className="space-y-6">
              {groupedChecklist.map((entry, index) => {
                if (entry.type === 'single') {
                   return renderSingleRequirement(entry.data as DocumentRequirement);
                } else {
                   // Group Logic
                   const groupName = (entry.data as any).name;
                   const items = (entry.data as any).items as DocumentRequirement[];
                   const isExpanded = expandedGroups[groupName];
                   const uploadedCount = items.filter(i => files[i.id]).length;
                   const totalCount = items.length;
                   const isRequired = items.some(i => i.required);
                   
                   return (
                     <div key={`group-${index}`} className="border border-slate-100 rounded-[2rem] overflow-hidden transition-all bg-slate-50/30">
                       <button 
                         onClick={() => toggleGroup(groupName)}
                         className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-all text-left"
                       >
                         <div className="flex items-center space-x-4">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${uploadedCount > 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                             {uploadedCount > 0 ? '📂' : '📁'}
                           </div>
                           <div>
                             <div className="flex items-center space-x-2">
                               <h5 className="font-bold text-slate-900">{groupName}</h5>
                               {isRequired && <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
                             </div>
                             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{uploadedCount}/{totalCount} items uploaded</p>
                           </div>
                         </div>
                         <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                           ▼
                         </div>
                       </button>
                       
                       {isExpanded && (
                         <div className="p-4 space-y-4 bg-slate-50/50 border-t border-slate-100 animate-fadeIn">
                           {items.map(req => renderSingleRequirement(req))}
                         </div>
                       )}
                     </div>
                   );
                }
              })}
            </div>

            {/* ZIP SEGREGATION DISPLAY */}
            {selectedProgram.id === VisaType.VISITOR && (segregatedFiles.current.length > 0 || segregatedFiles.refusal.length > 0 || segregatedFiles.supporting.length > 0) && (
               <div className="mt-8 space-y-4 animate-fadeIn">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-xl">📦</span>
                    <h4 className="text-xl font-black text-slate-900">AI Auto-Segregation Results</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {/* Current */}
                     <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-bl-full -mr-8 -mt-8"></div>
                        <h5 className="font-black text-green-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                           <span>📂</span> Mandatory Documents
                           <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-[10px]">{segregatedFiles.current.length}</span>
                        </h5>
                        <ul className="text-xs text-green-700 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-200">
                           {segregatedFiles.current.map((f, i) => (
                             <li key={i} className="flex items-center space-x-2">
                               <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></span>
                               <span className="truncate" title={f}>{f}</span>
                             </li>
                           ))}
                           {segregatedFiles.current.length === 0 && <li className="text-green-400 italic">No mandatory files detected.</li>}
                        </ul>
                     </div>
                     
                     {/* Refusal */}
                     <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-bl-full -mr-8 -mt-8"></div>
                        <h5 className="font-black text-red-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                           <span>⚠️</span> Refusal History
                           <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded-full text-[10px]">{segregatedFiles.refusal.length}</span>
                        </h5>
                         <ul className="text-xs text-red-700 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-200">
                           {segregatedFiles.refusal.map((f, i) => (
                             <li key={i} className="flex items-center space-x-2">
                               <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                               <span className="truncate" title={f}>{f}</span>
                             </li>
                           ))}
                           {segregatedFiles.refusal.length === 0 && <li className="text-red-400 italic">No refusal history detected.</li>}
                        </ul>
                     </div>

                     {/* Supporting */}
                     <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-bl-full -mr-8 -mt-8"></div>
                        <h5 className="font-black text-blue-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                           <span>📎</span> Supporting Docs
                           <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-[10px]">{segregatedFiles.supporting.length}</span>
                        </h5>
                         <ul className="text-xs text-blue-700 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-200">
                           {segregatedFiles.supporting.map((f, i) => (
                             <li key={i} className="flex items-center space-x-2">
                               <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                               <span className="truncate" title={f}>{f}</span>
                             </li>
                           ))}
                           {segregatedFiles.supporting.length === 0 && <li className="text-blue-400 italic">No supporting files.</li>}
                        </ul>
                     </div>
                  </div>
                  <p className="text-center text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">
                    Files are automatically classified. Please review before proceeding.
                  </p>
               </div>
            )}
            
            {isExtracting && (
              <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                 <div className="w-6 h-6 border-2 border-slate-200 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
                 <p className="text-slate-500 font-bold text-sm animate-pulse">{extractionStatus}</p>
              </div>
            )}

            <div className="mt-12 flex justify-between items-center">
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Back to Selection</button>
              <button 
                onClick={() => setStep(3)} 
                disabled={Object.keys(files).length === 0 || isExtracting}
                className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-red-100 transition-all"
              >
                Continue to Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Audit (Formerly Step 4) */}
        {step === 3 && (
          <div className="bg-white p-16 rounded-[3rem] shadow-xl border border-slate-100 text-center animate-fadeIn">
            {isAuditing ? (
              <div className="py-12">
                <div className="relative w-24 h-24 mx-auto mb-10">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-red-600">DS</span>
                  </div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">AI Engine Running...</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-10">Auditing documents against immigration requirements.</p>
                <div className="max-w-xs mx-auto space-y-3">
                   {['Identity Verification', 'Financial Sufficiency', 'Intent Analysis'].map((label, i) => (
                     <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
                        <span className="text-[10px] font-black uppercase text-slate-900 animate-pulse">Analyzing</span>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <>
                <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-10 shadow-inner">🛡️</div>
                <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Final Verification</h2>
                {selectedProgram?.id === VisaType.VISITOR && segregatedFiles.current.length > 0 ? (
                   <p className="text-slate-500 mb-8 max-w-md mx-auto">
                     Ready to audit <span className="font-bold text-slate-900">{segregatedFiles.current.length + segregatedFiles.refusal.length + segregatedFiles.supporting.length} files</span> from your ZIP package.
                   </p>
                ) : (
                   <p className="text-slate-500 mb-8 max-w-md mx-auto">We've received your data for {Object.keys(files).length} documents. Launching the specialized audit engine.</p>
                )}
                
                {error && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl">
                    {error}
                  </div>
                )}

                <div className="flex flex-col space-y-4">
                  <button 
                    onClick={startAudit} 
                    className="bg-red-600 text-white py-5 rounded-2xl font-black hover:bg-red-700 shadow-2xl shadow-red-200 transform hover:-translate-y-1 transition-all"
                  >
                    🚀 Launch Real AI Audit
                  </button>
                  <button onClick={() => setStep(2)} className="text-slate-400 font-bold hover:text-slate-600 text-sm transition">Back to uploads</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WizardPage;
