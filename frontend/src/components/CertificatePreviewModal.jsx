import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Mail, 
  Printer, 
  CheckCircle2, 
  Award, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { getInternCertificatePdfUrl, resendInternCertificateEmail } from '../services/api';

export default function CertificatePreviewModal({ intern, onClose, onEmailSent }) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState('');

  if (!intern) return null;

  const issueDate = intern.certificate_date || new Date().toISOString().split('T')[0];
  const certYear = new Date(issueDate).getFullYear();
  const certNo = `ASSAC/IMS/CERT/${intern.intern_code || 'INT'}/${certYear}`;

  const handleDownloadPdf = () => {
    const url = getInternCertificatePdfUrl(intern.id);
    window.open(url, '_blank');
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatusMessage('');
    try {
      const res = await resendInternCertificateEmail(intern.id, intern.email);
      if (res && res.success) {
        setEmailStatusMessage(`Softcopy PDF dispatched to ${intern.email || 'student email'}`);
        if (onEmailSent) onEmailSent();
      }
    } catch (err) {
      setEmailStatusMessage(`Notice: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white max-w-4xl w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative my-8">
        
        {/* Modal Top Control Bar */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Award className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm text-white">Official E-Certificate Softcopy Preview</h3>
              <p className="text-[11px] text-slate-400 font-mono">Serial: {certNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Download Softcopy PDF */}
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
              title="Download official PDF softcopy"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF Softcopy</span>
            </button>

            {/* Email Softcopy to Student */}
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
              title="Send e-certificate softcopy to student email"
            >
              {isSendingEmail ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              <span>{isSendingEmail ? 'Sending...' : 'Mail Softcopy'}</span>
            </button>

            {/* Print Certificate */}
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Print Certificate"
            >
              <Printer className="h-4 w-4" />
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {emailStatusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {emailStatusMessage}
            </span>
            <button onClick={() => setEmailStatusMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs font-bold">Dismiss</button>
          </div>
        )}

        {/* Certificate Display Paper Canvas */}
        <div className="p-6 md:p-8 bg-slate-100 flex justify-center items-center">
          <div className="bg-[#fafbfe] w-full max-w-3xl rounded-xl border-4 border-[#1e3a8a] p-6 sm:p-8 shadow-md relative text-slate-900 space-y-4">
            
            {/* Inner Gold Border */}
            <div className="absolute inset-2 border-2 border-amber-600 pointer-events-none rounded-lg"></div>

            {/* Corner Decorative Dots */}
            <div className="absolute top-2.5 left-2.5 w-3 h-3 bg-[#1e3a8a]"></div>
            <div className="absolute top-2.5 right-2.5 w-3 h-3 bg-[#1e3a8a]"></div>
            <div className="absolute bottom-2.5 left-2.5 w-3 h-3 bg-[#1e3a8a]"></div>
            <div className="absolute bottom-2.5 right-2.5 w-3 h-3 bg-[#1e3a8a]"></div>

            {/* Header / Government Crest */}
            <div className="text-center space-y-1 relative z-10 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-extrabold uppercase font-mono">
                Official Government Internship E-Certificate
              </div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#1e3a8a] tracking-tight font-serif uppercase">
                Assam State Space Application Centre
              </h1>
              <p className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
                Science, Technology & Climate Change Department • Government of Assam
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Guwahati, Assam - 781024 • Intranet Research & Internship Management Portal
              </p>
              <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent mx-auto my-2"></div>
            </div>

            {/* Certificate Ribbon */}
            <div className="text-center relative z-10">
              <div className="inline-block bg-[#1e3a8a] text-white px-6 py-1.5 rounded-md shadow-xs">
                <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase font-serif">
                  Certificate of Internship Completion
                </span>
              </div>
              <p className="text-[10px] font-mono font-bold text-slate-500 mt-2">
                Certificate No: <strong className="text-slate-800">{certNo}</strong> • Student Roll ID: <strong className="text-indigo-700">{intern.intern_code}</strong>
              </p>
            </div>

            {/* Certificate Body */}
            <div className="text-center space-y-3 relative z-10 px-2 sm:px-6 text-slate-700">
              <p className="text-xs font-medium italic text-slate-500">
                This is to certify that
              </p>
              
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-serif tracking-tight underline decoration-amber-500 decoration-2 underline-offset-4">
                {intern.name}
              </h2>

              <p className="text-xs font-bold text-slate-700">
                from <span className="text-indigo-950 font-extrabold">{intern.university}</span> ({intern.degree || 'Degree Program'})
              </p>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal max-w-2xl mx-auto">
                has successfully completed the official research internship in the Department of <strong className="text-slate-900 font-bold">{intern.department}</strong> for a duration of <strong className="text-slate-900 font-bold">{intern.duration_months || 6} Months</strong> (commencing from <strong className="text-slate-900 font-bold">{intern.joining_date || '2026-01-01'}</strong>).
              </p>

              {/* Project Title Scope */}
              <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3 max-w-2xl mx-auto">
                <span className="text-[10px] font-extrabold text-[#1e3a8a] uppercase tracking-wider block mb-0.5">
                  Research Project Scope & Title:
                </span>
                <p className="text-xs sm:text-sm font-serif italic font-bold text-slate-900">
                  "{intern.project_title || 'Assigned Research Project Scope'}"
                </p>
              </div>

              {/* Evaluation and Supervisor */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600 pt-1">
                <span>Supervised by: <strong className="text-slate-900">{intern.mentor || 'Assigned Scientist'}</strong></span>
                <span>•</span>
                <span>Biometric Attendance: <strong className="text-emerald-700 font-bold">{intern.attendance_rate || 100}%</strong></span>
                <span>•</span>
                <span>Grade: <strong className="text-indigo-700 font-bold">Outstanding (A+)</strong></span>
              </div>
            </div>

            {/* Bottom Footer: Signatures & Digital Seal */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10">
              {/* Left: Issue Date & Verification */}
              <div className="text-left space-y-0.5">
                <span className="text-[11px] font-bold text-slate-800 block">Date of Issue: {issueDate}</span>
                <span className="text-[10px] text-slate-500 block">Issued by ASSAC Office Administration Desk</span>
                <span className="text-[9px] font-mono text-indigo-700 block">Verification: assac.internal/verify/{intern.intern_code}</span>
              </div>

              {/* Center: Official Seal Badge */}
              <div className="h-16 w-16 rounded-full border-2 border-[#1e3a8a] flex flex-col items-center justify-center text-[7px] font-extrabold text-[#1e3a8a] uppercase bg-amber-50/50 shadow-xs text-center p-1">
                <span>ASSAC</span>
                <span className="text-[6px] text-amber-700">Govt of Assam</span>
                <span className="text-[5.5px] text-slate-500">Official Seal</span>
              </div>

              {/* Right: Signature */}
              <div className="text-center sm:text-right space-y-0.5">
                <div className="w-36 h-0.5 bg-slate-400 mx-auto sm:ml-auto my-1"></div>
                <span className="font-extrabold text-slate-900 text-xs block">Administrative Officer / Director</span>
                <span className="text-[10px] text-slate-600 block">Assam State Space Application Centre</span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <Mail className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>Student Email: <strong className="text-slate-900 font-mono">{intern.email || 'No email registered'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isSendingEmail ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              <span>{isSendingEmail ? 'Dispatching Mail...' : 'Send Softcopy to Student'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF Softcopy</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
