import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';
import DashboardView from './DashboardView';
import AttendanceRecordsView from './AttendanceRecordsView';
import EmployeeManagementView from './EmployeeManagementView';
import InternManagementView from './InternManagementView';
import ExcelUploadView from './ExcelUploadView';
import AnalyticsView from './AnalyticsView';
import ExportsView from './ExportsView';
import AuditLogsView from './AuditLogsView';
import FormsDownloadsView from './FormsDownloadsView';
import { 
  OFFICE_ADMIN_NAV_GROUPS, 
  getOfficeAdminTabInfo 
} from '../config/navigationGroups';
import { 
  Building2, 
  Users, 
  Clock, 
  UploadCloud, 
  BarChart3, 
  Download, 
  ShieldAlert, 
  LayoutDashboard, 
  UserPlus, 
  FileSpreadsheet,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Award,
  GraduationCap,
  Briefcase,
  ChevronRight,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function OfficeAdminDashboardView({ 
  month, 
  year, 
  selectedMonth, 
  selectedYear, 
  setSelectedMonth, 
  setSelectedYear, 
  onRefresh 
}) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Strict RBAC & Granular Permissions Gating
  const isSuperAdmin = user?.role === 'Super Admin' || user?.permissions?.super_admin === true;
  const hasBiometricAccess = isSuperAdmin || user?.permissions?.biometric_attendance === true;
  const hasInternAccess = isSuperAdmin || user?.permissions?.intern_onboarding === true;
  const hasFormsAccess = isSuperAdmin || user?.permissions?.forms_downloads === true;
  const hasAuditAccess = isSuperAdmin;

  // User must possess at least one granted permission to enter Office Admin workspace
  const isAuthorized = user?.isAuthenticated && (
    isSuperAdmin ||
    hasBiometricAccess ||
    hasInternAccess ||
    hasFormsAccess ||
    hasAuditAccess
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Office Operations & Administrative Workspace"
        permissionKey="biometric_attendance"
        description="Access to the Office Administration Portal has been restricted. Your account does not have active module permissions granted by Super Admin."
        requiredRole="Office Admin"
      />
    );
  }

  const { tab: currentTabInfo, group: currentGroup } = getOfficeAdminTabInfo(activeTab);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Group Selector / Domain Navigation Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest px-2 hidden sm:inline">
            OPERATIONAL DOMAIN:
          </span>

          {OFFICE_ADMIN_NAV_GROUPS.map((group) => {
            const isGroupActive = group.id === currentGroup.id;
            const GroupIcon = group.icon;
            const isBiometrics = group.id === 'biometrics';

            return (
              <button
                key={group.id}
                onClick={() => setActiveTab(group.tabs[0].id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                  isGroupActive
                    ? isBiometrics
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                      : 'bg-slate-900 text-white shadow-xs'
                    : isBiometrics
                    ? 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <GroupIcon className="h-3.5 w-3.5" />
                <span>{group.shortLabel}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isGroupActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  {group.tabs.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Streamlined Active Module Header Card */}
      <div className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs border-l-4 ${currentGroup.borderAccent} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wider font-mono">
              Office Admin Operations
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase text-white ${currentGroup.badgeBg}`}>
              {currentGroup.badgeText}
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-xs font-extrabold text-slate-900 font-mono uppercase">
              {currentTabInfo.label}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {currentTabInfo.label}
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-3xl">
            {currentTabInfo.desc}
          </p>
        </div>

        {/* Top Quick Action Shortcuts - Biometric & HR Core */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'records'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
            title="Biometric Attendance Ledger"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Punch Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            title="Ingest Monthly Biometric Excel"
          >
            <UploadCloud className="h-3.5 w-3.5 text-indigo-300" />
            <span>Ingest Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="Attendance Analytics & Overtime"
          >
            <BarChart3 className="h-3.5 w-3.5 text-slate-600" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'forms'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
            title="Official Office Forms & Templates"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Official Forms</span>
          </button>

          <button
            onClick={() => setActiveTab('exports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'exports'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="Export Center"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>Exports</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-Tabs for Current Active Group */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-2">
          {currentGroup.badgeText} MODULES:
        </span>
        {currentGroup.tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isCurrentTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer shrink-0 ${
                isCurrentTab
                  ? currentGroup.id === 'biometrics'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Main View Area with Granular Permission Enforcement */}
      <div className="space-y-6">
        {/* Biometrics Suite (requires biometric_attendance) */}
        {activeTab === 'dashboard' && (
          hasBiometricAccess ? (
            <DashboardView
              month={month || selectedMonth || (new Date().getMonth() + 1)}
              year={year || selectedYear || new Date().getFullYear()}
              onNavigateToRecords={() => setActiveTab('records')}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          ) : (
            <RestrictedAccessView
              moduleName="Executive Workforce & Attendance Dashboard"
              permissionKey="biometric_attendance"
              description="Access to executive workforce metrics and biometric attendance indicators has been disabled for your account by Super Admin."
              requiredRole="Office Admin"
            />
          )
        )}

        {activeTab === 'records' && (
          hasBiometricAccess ? (
            <AttendanceRecordsView
              month={month || selectedMonth || (new Date().getMonth() + 1)}
              year={year || selectedYear || new Date().getFullYear()}
            />
          ) : (
            <RestrictedAccessView
              moduleName="Biometric Attendance Ledger"
              permissionKey="biometric_attendance"
              description="Access to employee punch records, biometric ledger, and overtime tracking has been disabled for your account by Super Admin."
              requiredRole="Office Admin"
            />
          )
        )}

        {activeTab === 'upload' && (
          hasBiometricAccess ? (
            <ExcelUploadView
              onIngestSuccess={() => {
                if (onRefresh) onRefresh();
                setActiveTab('exports');
              }}
            />
          ) : (
            <RestrictedAccessView
              moduleName="Monthly Excel Ingestion Hub"
              permissionKey="biometric_attendance"
              description="Access to monthly biometric workbook ingestion and period processing has been disabled for your account by Super Admin."
              requiredRole="Office Admin"
            />
          )
        )}

        {activeTab === 'analytics' && (
          hasBiometricAccess ? (
            <AnalyticsView
              month={month || selectedMonth || (new Date().getMonth() + 1)}
              year={year || selectedYear || new Date().getFullYear()}
            />
          ) : (
            <RestrictedAccessView
              moduleName="Attendance Analytics & Trends"
              permissionKey="biometric_attendance"
              description="Access to attendance analytics, overtime leaderboards, and punctuality indices has been disabled for your account by Super Admin."
              requiredRole="Office Admin"
            />
          )
        )}

        {activeTab === 'exports' && (
          hasBiometricAccess ? (
            <ExportsView
              month={month || selectedMonth || (new Date().getMonth() + 1)}
              year={year || selectedYear || new Date().getFullYear()}
            />
          ) : (
            <RestrictedAccessView
              moduleName="Report & Register Export Center"
              permissionKey="biometric_attendance"
              description="Access to official Excel registers and printable PDF attendance summaries has been disabled for your account by Super Admin."
              requiredRole="Office Admin"
            />
          )
        )}

        {activeTab === 'employees' && (
          hasBiometricAccess ? (
            <EmployeeManagementView />
          ) : (
            <RestrictedAccessView
              moduleName="Staff Directory & HR Provisioning"
              permissionKey="biometric_attendance"
              description="Access to staff records, employee creation, department assignment, and credential resets has been disabled for your account by Super Admin."
              requiredRole="Office Admin"
            />
          )
        )}

        {/* Intern Suite (requires intern_onboarding) */}
        {activeTab === 'interns' && (
          hasInternAccess ? (
            <InternManagementView defaultTab="directory" />
          ) : (
            <RestrictedAccessView
              moduleName="Intern Scholar Onboarding Desk"
              permissionKey="intern_onboarding"
              description="Access to research intern registrations, supervisors, and academic records has been disabled for your account by Super Admin."
              requiredRole="Office Admin"
            />
          )
        )}

        {activeTab === 'certificates' && (
          hasInternAccess ? (
            <InternManagementView defaultTab="certificates" />
          ) : (
            <RestrictedAccessView
              moduleName="E-Certificate Issuance Desk"
              permissionKey="intern_onboarding"
              description="Access to completion e-certificate generation, verification, and email dispatch has been disabled for your account by Super Admin."
              requiredRole="Office Admin"
            />
          )
        )}

        {/* Forms Suite (requires forms_downloads) */}
        {activeTab === 'forms' && (
          hasFormsAccess ? (
            <FormsDownloadsView />
          ) : (
            <RestrictedAccessView
              moduleName="Official Forms & Formats Desk"
              permissionKey="forms_downloads"
              description="Access to official office applications, requisition formats, and template management has been disabled for your account by Super Admin."
              requiredRole="Office Admin"
            />
          )
        )}

        {/* Audit Suite (requires super_admin) */}
        {activeTab === 'audit' && (
          hasAuditAccess ? (
            <AuditLogsView />
          ) : (
            <RestrictedAccessView
              moduleName="System Security Audit Trail"
              permissionKey="super_admin"
              description="Access to administrative trace logs and system modification history is strictly restricted to Super Admin."
              requiredRole="Super Admin"
            />
          )
        )}
      </div>

    </div>
  );
}
