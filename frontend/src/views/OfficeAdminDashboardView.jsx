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
  ChevronRight
} from 'lucide-react';

const TAB_TITLES = {
  dashboard: { title: 'Executive Overview & Trends', desc: 'Real-time workforce metrics, punch distribution & summary cards' },
  records: { title: 'Biometric Attendance Ledger', desc: 'Detailed 31-day biometric punch logs, overtime & status records' },
  employees: { title: 'Employee Directory & Credentials', desc: 'Staff directory, account provisioning, department assignment & password resets' },
  interns: { title: 'Intern Scholar Onboarding Desk', desc: 'Register research interns, supervisors, academic degree, scope & duration' },
  certificates: { title: 'E-Certificate Issuance & Softcopy Mail Desk', desc: 'Official completion certificates with automatic PDF generation & mail delivery' },
  upload: { title: 'Monthly Excel Ingestion Hub', desc: 'Ingest monthly biometric Excel workbooks with automatic period extraction' },
  analytics: { title: 'Analytics & Leaderboards', desc: 'Overtime rankings, punctuality indices & department attendance rates' },
  exports: { title: 'Report & Register Export Center', desc: 'Download official Excel registers & printable executive PDF summaries' },
  audit: { title: 'System Security Audit Trail', desc: 'Traceability logs for HR modifications, credential updates & ingestion events' }
};

export default function OfficeAdminDashboardView({ month, year, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, onRefresh }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // RBAC Gating
  const isAuthorized = user.isAuthenticated && (
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

  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Streamlined Active Module Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs border-l-4 border-l-indigo-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-900 border border-indigo-200 uppercase tracking-wider font-mono">
              Office Admin Operations
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-xs font-extrabold text-indigo-700 font-mono uppercase">
              {currentTabInfo.title}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {currentTabInfo.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-3xl">
            {currentTabInfo.desc}
          </p>
        </div>

        {/* Top Quick Action Shortcuts */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('interns')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'interns'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Onboard Intern</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'certificates'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Issue Certificate</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5 text-indigo-300" />
            <span>Ingest Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('exports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'exports'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>Export Center</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
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

        {activeTab === 'audit' && (
          <AuditLogsView />
        )}
      </div>

    </div>
  );
}
