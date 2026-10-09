import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  IndianRupee, 
  Building, 
  GraduationCap, 
  CheckCircle2, 
  FileSpreadsheet, 
  PlusCircle,
  X
} from 'lucide-react';

const OFFICE_FORMS = [
  // Category 1: Attendance & Leave Forms
  {
    id: 'FORM-ATT-01',
    title: 'Standard Leave Application Form (CL / EL / ML)',
    category: 'Attendance & Leave',
    code: 'ASSAC-HR-F-01',
    format: 'PDF',
    size: '145 KB',
    updatedDate: '15 Jan 2026',
    description: 'Official application format for applying Casual Leave (CL), Earned Leave (EL), and Medical Leave (ML). Requires HOD signature.',
    popular: true,
  },
  {
    id: 'FORM-ATT-02',
    title: 'Biometric Missed Punch & Regularization Form',
    category: 'Attendance & Leave',
    code: 'ASSAC-HR-F-02',
    format: 'PDF',
    size: '110 KB',
    updatedDate: '01 Feb 2026',
    description: 'Form for regularizing missed biometric clock-in or clock-out times due to official duty, machine error, or field work.',
    popular: true,
  },
  {
    id: 'FORM-ATT-03',
    title: 'Station Leave Clearance Certificate',
    category: 'Attendance & Leave',
    code: 'ASSAC-HR-F-03',
    format: 'PDF',
    size: '125 KB',
    updatedDate: '10 Jan 2026',
    description: 'Prior permission format required before leaving district headquarters during weekends, holidays, or official leave.',
    popular: false,
  },
  {
    id: 'FORM-ATT-04',
    title: 'Field Duty & Outstation Tour Order Approval',
    category: 'Attendance & Leave',
    code: 'ASSAC-HR-F-04',
    format: 'DOCX',
    size: '85 KB',
    updatedDate: '20 Feb 2026',
    description: 'Requisition format for official outstation field surveys, satellite ground truth validation, and departmental tours.',
    popular: false,
  },
  {
    id: 'FORM-ATT-05',
    title: 'Official Govt of Assam Holiday Roster 2026 (GAD Notification)',
    category: 'Attendance & Leave',
    code: 'ASSAC-GAD-2026',
    format: 'PDF',
    size: '345 KB',
    updatedDate: '01 Jan 2026',
    description: 'Official Notification (e-file No. 221561/440) detailing Gazetted, Half Holiday, Restricted, and Special Casual Leave schedule.',
    popular: true,
    pdfUrl: '/api/holidays/pdf'
  },

  // Category 2: Finance & Claims Formats
  {
    id: 'FORM-FIN-01',
    title: 'Travelling Allowance (TA/DA) Claim Voucher Format',
    category: 'Finance & Claims',
    code: 'ASSAC-FIN-V-01',
    format: 'XLSX',
    size: '220 KB',
    updatedDate: '05 Mar 2026',
    description: 'Itemized Excel spreadsheet format for claiming daily allowance, hotel stay, railway/flight tickets, and tour expenses.',
    popular: true,
  },
  {
    id: 'FORM-FIN-02',
    title: 'Local Conveyance Reimbursement Claim Slip',
    category: 'Finance & Claims',
    code: 'ASSAC-FIN-V-02',
    format: 'PDF',
    size: '95 KB',
    updatedDate: '12 Feb 2026',
    description: 'Voucher for claiming official local taxi, auto-rickshaw, or mileage expenses within city limits.',
    popular: false,
  },
  {
    id: 'FORM-FIN-03',
    title: 'Medical Expense Reimbursement Application',
    category: 'Finance & Claims',
    code: 'ASSAC-FIN-V-03',
    format: 'PDF',
    size: '180 KB',
    updatedDate: '18 Jan 2026',
    description: 'Official form for submitting medical treatment bills, hospital summary, and pharmacy receipts for reimbursement.',
    popular: false,
  },

  // Category 3: Administrative & Store Requisitions
  {
    id: 'FORM-ADM-01',
    title: 'Office Stationery & IT Store Requisition Slip',
    category: 'Stores & Requisitions',
    code: 'ASSAC-STR-R-01',
    format: 'PDF',
    size: '115 KB',
    updatedDate: '14 Feb 2026',
    description: 'Indent format for requesting office stationery, printer cartridges, desk accessories, and computer consumables.',
    popular: true,
  },
  {
    id: 'FORM-ADM-02',
    title: 'Temporary Equipment Loan & Issue Slip (GPS / Laptops)',
    category: 'Stores & Requisitions',
    code: 'ASSAC-STR-R-02',
    format: 'PDF',
    size: '130 KB',
    updatedDate: '28 Jan 2026',
    description: 'Issue voucher for borrowing lab instruments, survey GPS units, drone kits, or laptops for field projects.',
    popular: false,
  },
  {
    id: 'FORM-ADM-03',
    title: 'Visitor Gate Pass & Security Clearance Format',
    category: 'Stores & Requisitions',
    code: 'ASSAC-SEC-G-01',
    format: 'PDF',
    size: '90 KB',
    updatedDate: '02 Mar 2026',
    description: 'Pre-authorization pass format for official visitors, research scholars, and contractors entering office premises.',
    popular: false,
  },

  // Category 4: Academic & Intern Formats
  {
    id: 'FORM-ACA-01',
    title: 'Intern Onboarding & Verification Checklist Format',
    category: 'Academic & Interns',
    code: 'ASSAC-INT-F-01',
    format: 'PDF',
    size: '160 KB',
    updatedDate: '10 Feb 2026',
    description: 'Mandatory onboarding format for research interns, university students, and project fellows joining ASSAC.',
    popular: true,
  },
  {
    id: 'FORM-ACA-02',
    title: 'Intern Internship Final Project Cover Page Format',
    category: 'Academic & Interns',
    code: 'ASSAC-INT-F-02',
    format: 'DOCX',
    size: '75 KB',
    updatedDate: '01 Mar 2026',
    description: 'Standard institutional title page format for bound internship project reports and thesis submissions.',
    popular: false,
  },
  {
    id: 'FORM-ACA-03',
    title: 'No-Dues Clearance Form for Certificate Issuance',
    category: 'Academic & Interns',
    code: 'ASSAC-INT-F-03',
    format: 'PDF',
    size: '105 KB',
    updatedDate: '22 Feb 2026',
    description: 'Clearance certificate required from Library, IT, and Mentor before issuing internship completion certificate.',
    popular: true,
  }
];

export default function FormsDownloadsView() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [downloadSuccessModal, setDownloadSuccessModal] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestedFormName, setRequestedFormName] = useState('');

  // RBAC Gating
  const isAuthorized = user.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.permissions?.forms_downloads
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Official Forms & Downloads Repository"
        permissionKey="forms_downloads"
        description="Access to official office applications, leave formats, TA/DA claim vouchers, and administrative store requisition templates is restricted based on user level access permissions set by Super Admin."
        requiredRole="Employee"
      />
    );
  }

  // Filter forms
  const filteredForms = OFFICE_FORMS.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          form.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          form.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (form) => {
    if (form.pdfUrl) {
      window.open(form.pdfUrl, '_blank');
      setDownloadSuccessModal(form);
      return;
    }

    const fileContent = `================================================================
ASSAM STATE SPACE APPLICATION CENTRE (ASSAC)
OFFICE INTERNAL MANAGEMENT SYSTEM
================================================================
FORM TITLE: ${form.title.toUpperCase()}
FORM CODE : ${form.code}
CATEGORY  : ${form.category}
VERSION   : 2026.1 (REV 3)
DATE      : ${form.updatedDate}
================================================================

INSTRUCTIONS FOR EMPLOYEE:
1. Please print this form or fill in clear block letters.
2. Submit the completed hard copy to the respective Section Officer / HOD.
3. For digital submission, scan and upload via the ASSAC Intranet Portal.

[SECTION 1: APPLICANT DETAILS]
- Employee Code / Roll ID : __________________________________________
- Full Name              : __________________________________________
- Designation            : __________________________________________
- Department / Division  : __________________________________________

[SECTION 2: DETAILS OF REQUEST]
- Purpose / Reason       : __________________________________________
- Effective Period / Date : From __________________ To _______________
- Days / Count           : _________ Days

[SECTION 3: APPROVAL & SIGNATURES]

________________________                   ________________________
Signature of Applicant                      Signature of Controlling HOD

Date: _____ / _____ / 2026                 Date: _____ / _____ / 2026

================================================================
Assam State Space Application Centre • Internal Security Clearance
LAN Network Portal • http://192.168.10.117
================================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.code}_${form.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessModal(form);
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    alert(`Requisition for custom format "${requestedFormName}" has been submitted to the Administrative Officer!`);
    setRequestedFormName('');
    setShowRequestModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner - Lite Theme */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-2 shadow-sm border-l-4 border-l-emerald-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                Official Document Desk
              </span>
              <span className="text-xs text-slate-500 font-medium">Internal LAN Repository</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Employee Forms & Formats Download Desk
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl font-medium">
              Download official office applications, leave formats, TA/DA vouchers, missed punch regularization slips, 
              and store requisitions formatted according to organizational standards.
            </p>
          </div>

          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-amber-300" />
            <span>Request New Format</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search form title, code (e.g. Leave, TA/DA, ASSAC-HR)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 text-xs">
          {[
            { id: 'ALL', label: 'All Forms', icon: FileText },
            { id: 'Attendance & Leave', label: 'Leave & Attendance', icon: Calendar },
            { id: 'Finance & Claims', label: 'Finance & TA/DA', icon: IndianRupee },
            { id: 'Stores & Requisitions', label: 'Stores & Administrative', icon: Building },
            { id: 'Academic & Interns', label: 'Academic & Interns', icon: GraduationCap }
          ].map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredForms.map((form) => (
          <div 
            key={form.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-400 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-2xs group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700">
                  {form.code}
                </span>

                <div className="flex items-center gap-1.5">
                  {form.popular && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                      Frequent
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    form.format === 'XLSX' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                    form.format === 'DOCX' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                    'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {form.format}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {form.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed font-medium">
                  {form.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-[11px] text-slate-500 font-mono">
                <span>Size: {form.size}</span>
                <span className="mx-1.5">•</span>
                <span>Rev: {form.updatedDate}</span>
              </div>

              <button
                onClick={() => handleDownload(form)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Request New Format Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <PlusCircle className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Requisition for Custom Form/Format</h3>
                <p className="text-[11px] text-slate-500 font-medium">Request the Administrative Officer to add a new template</p>
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Required Form Title / Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Advance Application Format"
                  value={requestedFormName}
                  onChange={(e) => setRequestedFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Department Scope</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold">
                  <option>General Administration</option>
                  <option>HR & Establishment</option>
                  <option>Finance & Accounts</option>
                  <option>GIS & Remote Sensing</option>
                  <option>Stores & Purchase</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
