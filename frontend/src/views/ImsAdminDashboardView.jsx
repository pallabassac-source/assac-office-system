import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';
import InternsPortalView from './InternsPortalView';
import InternManagementView from './InternManagementView';
import FormsDownloadsView from './FormsDownloadsView';
import AuditLogsView from './AuditLogsView';
import StorageDiskGauge from '../components/StorageDiskGauge';
import { 
  IMS_ADMIN_NAV_GROUPS, 
  getImsAdminTabInfo 
} from '../config/navigationGroups';
import { 
  GraduationCap, 
  Users, 
  UserPlus, 
  BookOpen, 
  HardDrive, 
  Award, 
  FileCheck, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  Building2, 
  UploadCloud, 
  ChevronRight, 
  RefreshCw, 
  Layers, 
  ExternalLink 
} from 'lucide-react';

export default function ImsAdminDashboardView() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'directory';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // RBAC Gating
  const isAuthorized = user?.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.role === 'IMS Admin' ||
    user.role === 'IMS Officer' ||
    user.role === 'Office Admin' ||
    user.role === 'Admin' ||
    user.permissions?.ims_access === true ||
    user.permissions?.intern_onboarding === true ||
    user.permissions?.super_admin === true
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Intern Management System (IMS) Admin Desk"
        permissionKey="ims_access"
        description="Access to the IMS Governance Workspace, Student Onboarding Desk, Credential Generation, and Deliverable Clearance Vault is restricted to IMS Admin & Officers."
        requiredRole="IMS Admin"
      />
    );
  }

  const { tab: currentTabInfo, group: currentGroup } = getImsAdminTabInfo(activeTab);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Group Selector / Domain Navigation Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest px-2 hidden sm:inline">
            IMS GOVERNANCE DOMAIN:
          </span>

          {IMS_ADMIN_NAV_GROUPS.map((group) => {
            const isGroupActive = group.id === currentGroup.id;
            const GroupIcon = group.icon;
            const isVault = group.id === 'vault';

            return (
              <button
                key={group.id}
                onClick={() => setActiveTab(group.tabs[0].id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                  isGroupActive
                    ? isVault
                      ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                      : 'bg-indigo-950 text-white shadow-xs'
                    : isVault
                    ? 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
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
              IMS Scholar Governance
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

        {/* Top Quick Action Shortcuts - Scholar & 10 GB Vault Core */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('onboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'onboard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
            title="Register New Research Scholar"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>+ Onboard Scholar</span>
          </button>

          <button
            onClick={() => setActiveTab('deliverables')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'deliverables'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
            }`}
            title="Upload Project Deliverable or Thesis (Up to 10 GB)"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>+ Vault Upload (10 GB)</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'certificates'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
            title="E-Certificate Issuance Desk"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Issue Certificate</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="Storage Disk Partition Status (/data)"
          >
            <HardDrive className="h-3.5 w-3.5 text-slate-600" />
            <span>Disk (/data)</span>
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
                  ? currentGroup.id === 'vault'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-indigo-950 text-white shadow-xs'
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
        {/* Scholar Registry */}
        {activeTab === 'directory' && (
          <InternsPortalView defaultTab="directory" />
        )}

        {/* Onboard Scholar Desk */}
        {activeTab === 'onboard' && (
          <InternsPortalView defaultTab="directory" autoOpenOnboard={true} />
        )}

        {/* Academic Departments */}
        {activeTab === 'departments' && (
          <InternsPortalView defaultTab="directory" autoOpenAddDept={true} />
        )}

        {/* Project Deliverables Vault (10 GB) */}
        {activeTab === 'deliverables' && (
          <InternsPortalView defaultTab="documents" autoOpenDocUpload={false} />
        )}

        {/* Storage Disk Partition Status & Network Hub */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <StorageDiskGauge />
            <InternsPortalView defaultTab="documents" />
          </div>
        )}

        {/* E-Certificate Issuance Desk */}
        {activeTab === 'certificates' && (
          <InternManagementView defaultTab="certificates" />
        )}

        {/* Student Clearance & Verification */}
        {activeTab === 'clearance' && (
          <InternsPortalView defaultTab="onboarding" />
        )}

        {/* Academic Forms Desk */}
        {activeTab === 'forms' && (
          <FormsDownloadsView />
        )}

        {/* IMS Security Audit Trail */}
        {activeTab === 'audit' && (
          <AuditLogsView />
        )}
      </div>

    </div>
  );
}
