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

  // RBAC Gating
  const isAuthorized = user?.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.role === 'Office Admin' ||
    user.role === 'Admin' ||
    user.permissions?.super_admin ||
    user.permissions?.biometric_attendance === true ||
    user.permissions?.intern_onboarding === true
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Office Operations & Administrative Workspace"
        permissionKey="biometric_attendance"
        description="Access to the Office Administration Portal, Biometric Attendance Engine, Employee Management, Intern Onboarding & E-Certificate Issuance Desk is restricted to Office Admin."
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

      {/* 4. Main View Area */}
      <div className="space-y-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            month={month || selectedMonth || (new Date().getMonth() + 1)}
            year={year || selectedYear || new Date().getFullYear()}
            onNavigateToRecords={() => setActiveTab('records')}
            onNavigateToUpload={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'records' && (
          <AttendanceRecordsView
            month={month || selectedMonth || (new Date().getMonth() + 1)}
            year={year || selectedYear || new Date().getFullYear()}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeManagementView />
        )}

        {activeTab === 'interns' && (
          <InternManagementView defaultTab="directory" />
        )}

        {activeTab === 'certificates' && (
          <InternManagementView defaultTab="certificates" />
        )}

        {activeTab === 'upload' && (
          <ExcelUploadView
            onIngestSuccess={() => {
              if (onRefresh) onRefresh();
              setActiveTab('exports');
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            month={month || selectedMonth || (new Date().getMonth() + 1)}
            year={year || selectedYear || new Date().getFullYear()}
          />
        )}

        {activeTab === 'exports' && (
          <ExportsView
            month={month || selectedMonth || (new Date().getMonth() + 1)}
            year={year || selectedYear || new Date().getFullYear()}
          />
        )}

        {activeTab === 'forms' && (
          <FormsDownloadsView />
        )}

        {activeTab === 'audit' && (
          <AuditLogsView />
        )}
      </div>

    </div>
  );
}
