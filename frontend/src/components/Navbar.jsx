import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useServerTime } from '../context/ServerTimeContext';
import { 
  Building2, 
  Clock, 
  GraduationCap, 
  LayoutDashboard, 
  UploadCloud, 
  RefreshCw, 
  FileText,
  Calendar,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles,
  Layers,
  LogOut,
  UserCheck,
  LogIn,
  Users,
  Award,
  BarChart3,
  Download,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { getAvailablePeriods } from '../services/api';

const OFFICE_ADMIN_TABS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'records', label: 'Attendance Ledger', icon: Clock },
  { id: 'employees', label: 'Staff Directory', icon: Users },
  { id: 'interns', label: 'Intern Onboarding', icon: GraduationCap },
  { id: 'certificates', label: 'E-Certificates', icon: Award },
  { id: 'forms', label: 'Forms Desk', icon: FileText },
  { id: 'upload', label: 'Excel Ingestion', icon: UploadCloud },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'exports', label: 'Report Export Center', icon: Download },
  { id: 'audit', label: 'Audit Trail', icon: ShieldAlert }
];

export default function Navbar({ 
  onRefresh, 
  selectedMonth, 
  selectedYear, 
  setSelectedMonth, 
  setSelectedYear 
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, setIsLoginModalOpen, theme, toggleTheme } = useAuth();
  const { timeString12h, isSynced } = useServerTime();

  const [availablePeriods, setAvailablePeriods] = useState([]);

  useEffect(() => {
    getAvailablePeriods()
      .then(res => {
        if (res.success && res.data) setAvailablePeriods(res.data);
      })
      .catch(() => {});
  }, []);

  const currentPath = location.pathname;
  const officeAdminActiveTab = searchParams.get('tab') || 'dashboard';

  const handlePortalClick = (targetPath) => {
    navigate(targetPath);
  };

  const handleOfficeAdminTabClick = (tabId) => {
    navigate(`/office-admin?tab=${tabId}`);
  };

  const handleBrandClick = () => {
    if (user.role === 'Super Admin') navigate('/superadmin');
    else if (user.role === 'Office Admin' || user.role === 'Admin') navigate('/office-admin');
    else if (user.role === 'IMS Admin' || user.role === 'IMS Officer') navigate('/ims-admin');
    else if (user.role === 'Employee') navigate('/employee-portal');
    else if (user.role === 'Intern') navigate('/intern-portal');
    else navigate('/hub');
  };

  const handleLogout = () => {
    logout();
    navigate('/hub');
  };

  const isOfficeAdminRoute = currentPath === '/office-admin';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b-2 border-indigo-600 text-slate-900 shadow-xs sticky top-0 z-40">
      
      {/* 1. Main Header Branding & Controls Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200">
        
        {/* ASSAC Emblem & Title */}
        <div 
          className="flex items-center gap-3 cursor-pointer group shrink-0" 
          onClick={handleBrandClick}
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-extrabold shadow-sm shrink-0 border border-indigo-500 group-hover:scale-105 transition-transform">
            <Layers className="h-4 w-4 text-amber-300" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest block bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                ASSAC INTRANET PORTAL
              </span>
            </div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
              ASSAM STATE SPACE APPLICATION CENTRE
            </h1>
          </div>
        </div>

        {/* Right Tools: Clock, User Badge, Theme & Period */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Live Synchronized Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-700 font-bold shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-indigo-600" />
            <span>{timeString12h} IST</span>
            {isSynced && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Synchronized with Server Clock"></span>
            )}
          </div>

          {/* Period Selector (Month/Year with Ingested Counts) */}
          {(user.role === 'Super Admin' || user.role === 'Office Admin' || user.role === 'Admin') && (
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-300 text-xs shadow-2xs">
              <span className="text-slate-500 font-medium hidden sm:inline text-[11px]">Period:</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer text-xs"
              >
                {[
                  { m: 1, label: 'Jan' },
                  { m: 2, label: 'Feb' },
                  { m: 3, label: 'Mar' },
                  { m: 4, label: 'Apr' },
                  { m: 5, label: 'May' },
                  { m: 6, label: 'Jun' },
                  { m: 7, label: 'Jul' },
                  { m: 8, label: 'Aug' },
                  { m: 9, label: 'Sep' },
                  { m: 10, label: 'Oct' },
                  { m: 11, label: 'Nov' },
                  { m: 12, label: 'Dec' },
                ].map(({ m, label }) => {
                  const hasData = availablePeriods.some(p => p.month === m && p.year === selectedYear);
                  return (
                    <option key={m} value={m}>
                      {label} {hasData ? '●' : ''}
                    </option>
                  );
                })}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer text-xs"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
              <button 
                onClick={onRefresh}
                className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                title="Refresh System Data"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
          </button>

          {/* User Session & Logout */}
          <div className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-bold text-slate-900 hidden sm:inline">{user.name}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase font-mono">
              {user.role}
            </span>

            {user.isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="ml-1 px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                title="Sign Out Session"
              >
                <LogOut className="h-3 w-3" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="ml-1 px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <LogIn className="h-3 w-3" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Primary Portal Sub-bar */}
      <div className="px-4 sm:px-6 py-1.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* General Intranet Hub */}
          <button
            onClick={() => handlePortalClick('/hub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold uppercase text-[11px] tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentPath === '/hub' || currentPath === '/'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-700 hover:bg-white border border-transparent hover:border-slate-200'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Intranet Hub</span>
          </button>

          {/* SUPER ADMIN SPECIFIC TAB */}
          {user.role === 'Super Admin' && (
            <button
              onClick={() => handlePortalClick('/superadmin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold uppercase text-[11px] tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                currentPath === '/superadmin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>Super Admin Desk</span>
            </button>
          )}

          {/* OFFICE ADMIN MAIN ROUTE TAB */}
          {(user.role === 'Super Admin' || user.role === 'Office Admin' || user.role === 'Admin') && (
            <button
              onClick={() => handlePortalClick('/office-admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold uppercase text-[11px] tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                currentPath === '/office-admin'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-indigo-700 hover:bg-white border border-transparent hover:border-slate-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Office Admin Suite</span>
            </button>
          )}

          {/* IMS ADMIN SPECIFIC TAB */}
          {(user.role === 'Super Admin' || user.role === 'IMS Admin' || user.role === 'IMS Officer') && (
            <button
              onClick={() => handlePortalClick('/ims-admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold uppercase text-[11px] tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                currentPath === '/ims-admin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white border border-transparent hover:border-slate-200'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>IMS Scholar Governance</span>
            </button>
          )}

          {/* EMPLOYEE TAB */}
          {user.role === 'Employee' && (
            <button
              onClick={() => handlePortalClick('/employee-portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold uppercase text-[11px] tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                currentPath === '/employee-portal'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white border border-transparent hover:border-slate-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>My Staff Workspace</span>
            </button>
          )}

          {/* INTERN TAB */}
          {user.role === 'Intern' && (
            <button
              onClick={() => handlePortalClick('/intern-portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold uppercase text-[11px] tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                currentPath === '/intern-portal'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white border border-transparent hover:border-slate-200'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>My Scholar Workspace</span>
            </button>
          )}

          {/* Forms & Downloads */}
          <button
            onClick={() => handlePortalClick('/forms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold uppercase text-[11px] tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentPath === '/forms'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-700 hover:bg-white border border-transparent hover:border-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Employee Forms</span>
          </button>

          {/* AI Suite */}
          <button
            onClick={() => handlePortalClick('/ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold uppercase text-[11px] tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentPath === '/ai'
                ? 'bg-amber-500 text-indigo-950 shadow-xs font-extrabold'
                : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200 border border-amber-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>AI Utility Suite</span>
          </button>
        </div>
      </div>

      {/* 3. REPOSITIONED OFFICE ADMIN TOP SUB-NAV BAR (Active when on /office-admin) */}
      {isOfficeAdminRoute && (
        <div className="px-4 sm:px-6 py-2 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md flex items-center justify-between gap-3 overflow-x-auto border-t border-indigo-700">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest pr-2 border-r border-indigo-600 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              OFFICE ADMIN
            </span>

            {OFFICE_ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = officeAdminActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleOfficeAdminTabClick(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white text-indigo-950 shadow-sm ring-2 ring-amber-400 font-black'
                      : 'text-indigo-100 hover:bg-indigo-700/60 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-indigo-300'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </header>
  );
}
