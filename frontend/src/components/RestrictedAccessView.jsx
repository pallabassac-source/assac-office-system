import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, KeyRound, ArrowRight, UserCheck, CheckCircle2, XCircle, User, Shield } from 'lucide-react';

export default function RestrictedAccessView({ 
  moduleName = 'Enterprise Intranet Module', 
  permissionKey = '',
  description = 'Access to this intranet module is restricted based on user level permissions set by Super Admin.',
  requiredRole = 'Admin / Authorized Officer'
}) {
  const navigate = useNavigate();
  const { user, openLoginForRole } = useAuth();

  const MODULE_PERMISSION_LABELS = [
    { key: 'biometric_attendance', label: 'Biometric Attendance Register' },
    { key: 'forms_downloads', label: 'Employee Forms & Formats Desk' },
    { key: 'intern_onboarding', label: 'Student Scholar Onboarding & Clearance Desk' },
    { key: 'ims_access', label: 'IMS Document Archival & Clearances' },
    { key: 'ai_suite', label: 'ASSAC AI Utility Assistant Desk' },
    { key: 'excel_upload', label: 'Biometric Excel Data Ingest' },
    { key: 'super_admin', label: 'Super Admin Governance Panel' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 relative overflow-hidden">
        
        {/* Top Security Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-600"></div>

        {/* Security Shield Badge */}
        <div className="relative inline-block">
          <div className="h-24 w-24 rounded-3xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-xl shadow-md border border-white dark:border-slate-900">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        {/* Warning Title & Module Identification */}
        <div className="space-y-2 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800/80 uppercase tracking-widest">
            <Lock className="h-3.5 w-3.5" /> MODULE ACCESS RESTRICTED
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Inaccessible Module for Current User Access Level
          </h2>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Assam State Space Application Centre • <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{moduleName}</span>
          </p>
        </div>

        {/* Governance Security Protocol Message & User Level Details */}
        <div className="bg-slate-50 dark:bg-slate-950/70 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left max-w-2xl mx-auto space-y-4 shadow-sm">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Current Session User Level
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 font-extrabold text-xs border border-indigo-200 dark:border-indigo-800">
              {user.name} ({user.role})
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>

          <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 font-medium flex items-start gap-2.5">
            <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block mb-0.5">Super Admin Permission Restriction:</span>
              Super Admin has not enabled access to <strong>{moduleName}</strong> for your account level 
              (<code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono font-bold">@{user.username || 'guest'}</code>). 
              If you require access to this module, please request Super Admin to update your account permissions.
            </div>
          </div>

          {/* User's Granted vs Restricted Module Permission Matrix */}
          {user.isAuthenticated && (
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                Your Configured Module Permissions Overview:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {MODULE_PERMISSION_LABELS.map(item => {
                  const hasAccess = user.role === 'Super Admin' || !!user.permissions?.[item.key];
                  return (
                    <div 
                      key={item.key}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border font-bold text-xs ${
                        hasAccess 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 opacity-80'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {hasAccess ? (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 shrink-0 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                          <CheckCircle2 className="h-3 w-3" /> Accessible
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-700 dark:text-rose-400 shrink-0 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                          <XCircle className="h-3 w-3" /> Inaccessible
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={() => openLoginForRole(requiredRole)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <UserCheck className="h-4 w-4 text-amber-300" />
            <span>Login as Authorized Account</span>
          </button>
          
          <button
            onClick={() => navigate('/hub')}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Return to Intranet Hub</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
