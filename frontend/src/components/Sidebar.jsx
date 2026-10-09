import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Users, 
  BarChart3, 
  Download, 
  ShieldAlert,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', description: 'Real-time overview & metrics', icon: LayoutDashboard },
    { id: 'records', label: 'Attendance Ledger', description: 'Search & filter punch records', icon: Users },
    { id: 'upload', label: 'Excel Ingestion Desk', description: 'Upload biometric workbooks', icon: Upload, reqExcel: true },
    { id: 'analytics', label: 'Analytics & Trends', description: 'Department breakdowns & OT', icon: BarChart3 },
    { id: 'exports', label: 'Report Export Center', description: 'Download Excel & PDF reports', icon: Download },
    { id: 'audit', label: 'System Audit Logs', description: 'Security & ingestion trail', icon: ShieldAlert, reqAdmin: true },
  ];

  const canAccess = (item) => {
    if (user.role === 'Super Admin' || user.permissions?.super_admin) return true;

    if (item.reqExcel) {
      return !!(user.permissions?.biometric_attendance && user.permissions?.excel_upload);
    }
    if (item.reqAdmin) {
      return !!(user.permissions?.super_admin || user.role === 'Super Admin');
    }

    return !!user.permissions?.biometric_attendance;
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between hidden md:flex shrink-0 min-h-[calc(100vh-65px)]">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
          Attendance Workspace
        </div>
        
        {navItems.filter(i => canAccess(i)).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-50/90 text-indigo-900 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                isActive ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-bold leading-tight ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Banner & Status */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-[11px]">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Biometric Core Active</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal font-medium">
            Fast in-memory parsing with automatic 2nd/4th Saturday holiday resolution.
          </p>
        </div>

        {user.isAuthenticated && (
          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500 hover:text-rose-600" />
            <span>Sign Out ({user.role})</span>
          </button>
        )}
      </div>
    </aside>
  );
}
