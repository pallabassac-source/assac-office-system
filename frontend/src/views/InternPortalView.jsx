import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getInterns, 
  getInternDocuments, 
  createInternDocument, 
  getInternCertificatePdfUrl, 
  resendInternCertificateEmail 
} from '../services/api';
import CertificatePreviewModal from '../components/CertificatePreviewModal';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Download, 
  UploadCloud, 
  User, 
  Building2, 
  Mail, 
  Calendar, 
  Sparkles, 
  FileCheck, 
  X, 
  RefreshCw, 
  Layers, 
  FolderOpen,
  Eye
} from 'lucide-react';


export default function InternPortalView() {
  const { user } = useAuth();
  const [internProfile, setInternProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [previewCertModal, setPreviewCertModal] = useState(false);
  const [submission, setSubmission] = useState({
    title: '',
    category: 'Project Deliverable'
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [internsRes, docsRes] = await Promise.all([
        getInterns(),
        getInternDocuments()
      ]);

      if (internsRes && internsRes.data) {
        // Find matching intern profile by email, username, or name
        const match = internsRes.data.find(
          i => (i.email && i.email.toLowerCase() === user.email?.toLowerCase()) ||
               (i.user_login && i.user_login.toLowerCase() === user.username?.toLowerCase()) ||
               (i.name && i.name.toLowerCase().includes(user.name?.toLowerCase() || ''))
        ) || internsRes.data[0];
        setInternProfile(match);

        if (docsRes && docsRes.data && match) {
          const myDocs = docsRes.data.filter(
            d => (d.intern_name && d.intern_name.toLowerCase().includes(match.name.toLowerCase())) ||
                 d.intern_id === match.id
          );
          setDocuments(myDocs.length > 0 ? myDocs : docsRes.data.slice(0, 4));
        }
      }
    } catch (err) {
      console.warn('Error loading intern scholar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!submission.title.trim()) return;

    try {
      const payload = {
        title: submission.title.trim(),
        category: submission.category,
        intern_name: internProfile ? internProfile.name : user.name,
        intern_id: internProfile ? internProfile.id : null,
        uploaded_by: user.name || 'Intern Scholar',
        file_path: `uploads/submissions/${Date.now()}_${submission.title.replace(/\s+/g, '_')}.pdf`
      };

      const res = await createInternDocument(payload);
      if (res && res.success) {
        alert(`Success: Deliverable "${submission.title}" submitted to IMS Admin!`);
        setShowSubmitModal(false);
        setSubmission({ title: '', category: 'Project Deliverable' });
        loadData();
      }
    } catch (err) {
      alert('Failed to submit deliverable: ' + (err.response?.data?.error || err.message));
    }
  };

  const academicFormats = [
    { title: 'Intern Onboarding & Verification Checklist Format', code: 'ASSAC-INT-F-01', format: 'PDF', size: '160 KB' },
    { title: 'Internship Final Project Report Cover Page Template', code: 'ASSAC-INT-F-02', format: 'DOCX', size: '75 KB' },
    { title: 'No-Dues Clearance Form for Certificate Issuance', code: 'ASSAC-INT-F-03', format: 'PDF', size: '105 KB' },
    { title: 'Weekly Research Log & Mentor Review Sheet', code: 'ASSAC-INT-F-04', format: 'PDF', size: '120 KB' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Scholar Header Profile Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-amber-300 text-2xl shadow-inner shrink-0">
              {(internProfile?.name || user.name || 'S').charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-400 text-indigo-950 uppercase tracking-wider">
                  Research Scholar Workspace
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-white/10 text-indigo-200 border border-white/20">
                  ID: {internProfile?.intern_code || 'INT-2026'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome, {internProfile?.name || user.name}
              </h1>
              <p className="text-xs text-indigo-200 font-medium">
                {internProfile?.university || 'Affiliated University'} • {internProfile?.degree || 'Research Scholar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-indigo-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Submit Project Deliverable</span>
            </button>
          </div>
        </div>

        {/* Academic Profile Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider font-mono">Assigned Department</span>
            <span className="text-sm font-extrabold text-white block">{internProfile?.department || 'GIS & Remote Sensing'}</span>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider font-mono">Assigned Supervisor / Scientist</span>
            <span className="text-sm font-extrabold text-white block">{internProfile?.mentor || 'Assigned Scientist-SF'}</span>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider font-mono">Biometric Attendance Log</span>
            <span className="text-sm font-extrabold text-emerald-300 font-mono block">{internProfile?.attendance_rate || 100}% Logged</span>
          </div>
        </div>
      </div>

      {/* Grid Row: Research Scope & Completion Certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        
        {/* Research Project Scope Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase tracking-wider">
                Assigned Research Scope
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Joining Date: <strong className="text-slate-800">{internProfile?.joining_date || '15 Jan 2026'}</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              {internProfile?.project_title || 'Automated Wetland Inundation Analysis using Sentinel-1 SAR & Earth Observation'}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Research investigation, satellite image analysis, ground truth verification, and computational geospatial modeling under the mentorship of senior scientists at the Assam State Space Application Centre.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Official Email</span>
              <span className="font-mono font-bold text-slate-900 block text-[11px]">{internProfile?.email || user.email}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Internship Duration</span>
              <span className="font-bold text-slate-900 block text-[11px]">{internProfile?.duration_months || 6} Months (Major Project)</span>
            </div>
          </div>
        </div>

        {/* Completion Certificate Status Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
              <Award className="h-5 w-5 text-indigo-600" />
              <span>Completion Certificate</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Official institutional certificate signed by the Administrative Officer & Mentor.
            </p>
          </div>

          <div className="py-4 text-center space-y-2">
            {internProfile?.certificate_issued ? (
              <div className="space-y-3">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <Award className="h-8 w-8" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs inline-block">
                    E-Certificate Issued & Verified
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Verified on {internProfile?.certificate_date || '2026-05-10'}</p>
                  <p className="text-[10px] text-emerald-700 font-medium">✓ Softcopy sent to {internProfile?.email || user.email}</p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <a
                    href={getInternCertificatePdfUrl(internProfile.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF Softcopy</span>
                  </a>

                  <button
                    onClick={() => setPreviewCertModal(true)}
                    className="w-full py-2 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-indigo-600" />
                    <span>Preview E-Certificate</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await resendInternCertificateEmail(internProfile.id);
                        alert(`Softcopy PDF dispatched to ${internProfile.email || 'your registered email'}!`);
                      } catch (e) {
                        alert('Notice: ' + e.message);
                      }
                    }}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold block mx-auto cursor-pointer"
                  >
                    Resend Softcopy to my email
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs inline-block">
                    Internship In Progress
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Certificate will be issued by Office Admin upon milestone completion, and a softcopy will be emailed to your account.</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono text-center">
            ASSAC Academic Clearance Office
          </div>
        </div>
      </div>

      {/* Grid Row: My Project Deliverables & Academic Formats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        
        {/* Deliverables Vault */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span>My Project Deliverables & Submissions</span>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              + Submit File
            </button>
          </div>

          <div className="p-4 space-y-2.5">
            {documents.length > 0 ? (
              documents.map(doc => (
                <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-extrabold text-slate-900 block truncate">{doc.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{doc.category} • DOC-#{doc.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Downloading "${doc.title}"...`)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shrink-0 ml-2"
                    title="Download File"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 font-medium">
                No deliverables submitted yet. Click "+ Submit File" to archive your project report.
              </div>
            )}
          </div>
        </div>

        {/* Academic & Verification Formats Download */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              <span>Official Academic & Intern Formats</span>
            </div>
          </div>

          <div className="p-4 space-y-2.5">
            {academicFormats.map(fmt => (
              <div key={fmt.code} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs hover:border-indigo-300 transition-colors">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-900 block">{fmt.title}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span>{fmt.code}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">{fmt.format}</span>
                    <span>•</span>
                    <span>{fmt.size}</span>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Downloading ${fmt.title}...`)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Submit Project Deliverable Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            <button 
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <UploadCloud className="h-6 w-6 text-indigo-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Submit Project Deliverable</h3>
                <p className="text-xs text-slate-500 font-medium">Archive your thesis, report, or datasets in IMS Vault</p>
              </div>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-3">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Deliverable Title / Report Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sentinel-1 SAR Final Project Report.pdf"
                  value={submission.title}
                  onChange={(e) => setSubmission({...submission, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Deliverable Category</label>
                <select
                  value={submission.category}
                  onChange={(e) => setSubmission({...submission, category: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Project Deliverable">Project Deliverable / Thesis Report</option>
                  <option value="Technical Documentation">Technical Specs & Documentation</option>
                  <option value="Research Data">Research Dataset / Code Artifacts</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Submit Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Certificate Preview Modal */}
      {previewCertModal && internProfile && (
        <CertificatePreviewModal
          intern={internProfile}
          onClose={() => setPreviewCertModal(false)}
        />
      )}

    </div>
  );
}

