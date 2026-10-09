import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HolidayCalendarWidget from '../components/HolidayCalendarWidget';
import StorageDiskGauge from '../components/StorageDiskGauge';
import { 
  Building2, 
  Clock, 
  GraduationCap, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  UserCheck, 
  BookOpen, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function InternalHubView() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* ASSAC Internal Intranet Hub Header Banner - Lite Theme */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4 shadow-sm border-l-4 border-l-indigo-600">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                ASSAC Intranet Gateway
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                OFFICIAL LAN GATEWAY • IP: 192.168.10.117
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ASSAC Internal Operations & Workforce Governance Hub
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              Centralized administrative portal for Biometric Attendance Register processing, Official Employee Forms Desk, 
              Research Intern Onboarding, IMS System Clearance, and ASSAC Enterprise Neural Assistant Suite.
            </p>
          </div>

          {/* Active Session Card */}
          <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3.5 w-full md:w-auto text-xs font-mono shadow-2xs">
            <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-1">Active Operator Session</div>
            <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2 font-sans">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              <span>{user?.name || 'Visitor'}</span>
            </div>
            <div className="mt-1 text-slate-600 font-medium flex items-center gap-1.5 text-[11px]">
              <span>Role:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold font-sans">
                {user?.role || 'Guest'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Capacity Intranet Storage Volume (/data 1TB) */}
      <StorageDiskGauge />

      {/* Official Holiday & Current Month Calendar Widget */}
      <HolidayCalendarWidget />

      {/* Core Intranet Gateway Desks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Departmental Operational Desks
            </h2>
            <p className="text-xs text-slate-500 font-medium">Select module to access specific administrative services</p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            {[
              user?.isAuthenticated && (user?.role === 'Super Admin' || user?.permissions?.super_admin || user?.permissions?.biometric_attendance === true),
              user?.isAuthenticated && (user?.permissions?.intern_onboarding || user?.role === 'Super Admin' || user?.role === 'IMS Admin'),
              true,
              true,
              true
            ].filter(Boolean).length} Services Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Sensitive Service Desk 1: Biometric Attendance System */}
          {user?.isAuthenticated && (user?.role === 'Super Admin' || user?.permissions?.super_admin || user?.permissions?.biometric_attendance === true) && (
            <div 
              onClick={() => navigate('/office-admin')}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between cursor-pointer group shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all duration-200"
            >
              <div>
                <div className="bg-indigo-50/70 px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
                  <span className="text-indigo-700 font-mono font-extrabold text-xs">DESK-01 • ATTENDANCE</span>
                  <Clock className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="p-5 space-y-2 text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    Biometric Attendance Register
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-normal">
                    Monthly Excel log parsing, present/absent matrix, late hours, and departmental summary.
                  </p>
                  <div className="pt-2 text-[11px] font-mono text-slate-500 flex justify-between border-t border-slate-100">
                    <span>Scope: 25 Officers</span>
                    <span className="font-bold text-indigo-700">HR / Admin</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>Open Attendance Log</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-indigo-600" />
              </div>
            </div>
          )}

          {/* Service Desk 2: Employee Forms Repository */}
          <div 
            onClick={() => navigate('/forms')}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between cursor-pointer group shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all duration-200"
          >
            <div>
              <div className="bg-emerald-50/70 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between">
                <span className="text-emerald-800 font-mono font-extrabold text-xs">DESK-02 • FORMS & REPOSITORY</span>
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="p-5 space-y-2 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                  Forms & Formats Download Desk
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed font-normal">
                  Official office application formats: Leave (CL/EL/ML), TA/DA claim vouchers, missed punch slips.
                </p>
                <div className="pt-2 text-[11px] font-mono text-slate-500 flex justify-between border-t border-slate-100">
                  <span>Count: 14 Formats</span>
                  <span className="font-bold text-emerald-700">All Employees</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Open Download Desk</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-emerald-600" />
            </div>
          </div>

          {/* Sensitive Service Desk 3: Intern Onboarding Desk */}
          {user?.isAuthenticated && user?.permissions?.intern_onboarding && (
            <div 
              onClick={() => navigate('/ims-admin')}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between cursor-pointer group shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all duration-200"
            >
              <div>
                <div className="bg-indigo-50/70 px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
                  <span className="text-indigo-800 font-mono font-extrabold text-xs">DESK-03 • INTERN ACADEMICS</span>
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="p-5 space-y-2 text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                    Student Scholar Onboarding & Directory
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-normal">
                    Student onboarding, university verification, mentor allocation, research project scopes, and completion clearances.
                  </p>
                  <div className="pt-2 text-[11px] font-mono text-slate-500 flex justify-between border-t border-slate-100">
                    <span>Scholars: 18 Active</span>
                    <span className="font-bold text-indigo-700">Admin Officer</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>Open Intern Portal</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-indigo-600" />
              </div>
            </div>
          )}

          {/* Service Desk 4: IMS Document Clearance & Archive */}
          <div 
            onClick={() => navigate('/ims-admin')}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between cursor-pointer group shadow-2xs hover:shadow-md hover:border-sky-400 transition-all duration-200"
          >
            <div>
              <div className="bg-sky-50/70 px-4 py-2.5 border-b border-sky-100 flex items-center justify-between">
                <span className="text-sky-800 font-mono font-extrabold text-xs">DESK-04 • IMS MANAGEMENT SYSTEM</span>
                <BookOpen className="h-4 w-4 text-sky-600" />
              </div>
              <div className="p-5 space-y-2 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                  IMS Document & Clearance Desk
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed font-normal">
                  Internal Management System clearance for intern research archives, university verification logs, and certificate approvals.
                </p>
                <div className="pt-2 text-[11px] font-mono text-slate-500 flex justify-between border-t border-slate-100">
                  <span>Archive: 42 Files</span>
                  <span className="font-bold text-sky-700">IMS Officer</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-sky-700">
              <span>Open IMS Desk</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-sky-600" />
            </div>
          </div>

          {/* Service Desk 5: Internal AI Employee Utility Suite */}
          <div 
            onClick={() => navigate('/ai')}
            className="bg-white rounded-2xl border border-amber-300 overflow-hidden flex flex-col justify-between cursor-pointer group shadow-2xs hover:shadow-md hover:border-amber-400 transition-all duration-200 col-span-1 sm:col-span-2 lg:col-span-1"
          >
            <div>
              <div className="bg-amber-500 px-4 py-2.5 border-b border-amber-400 flex items-center justify-between text-indigo-950">
                <span className="font-mono font-extrabold text-xs">DESK-05 • AI UTILITY SUITE</span>
                <Sparkles className="h-4 w-4 text-indigo-950" />
              </div>
              <div className="p-5 space-y-2 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
                  <span>ASSAC Enterprise Neural Desk</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">FREE USE</span>
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed font-normal">
                  ASSAC Neural Assistant, instant office image generator, presentation deck writer, meeting transcriber.
                </p>
                <div className="pt-2 text-[11px] font-mono text-slate-500 flex justify-between border-t border-slate-100">
                  <span>Tools: 4 AI Utilities</span>
                  <span className="font-bold text-amber-700">All Employees</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs font-bold text-amber-800">
              <span>Open AI Utility Desk</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-amber-700" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
