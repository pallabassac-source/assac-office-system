import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Clock, 
  BookOpen, 
  UserCheck, 
  GraduationCap, 
  Lock, 
  User, 
  KeyRound, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const ROLE_OPTIONS = [
  {
    id: 'admin',
    title: 'Office Admin',
    subtitle: 'HR & Biometric Attendance',
    icon: Clock,
    color: 'indigo',
    badge: 'Operations & Staff Credentials',
    borderActive: 'border-indigo-600 bg-indigo-50/90 text-indigo-900',
    iconBg: 'bg-indigo-100 text-indigo-700',
    targetRoute: '#/office-admin'
  },
  {
    id: 'ims',
    title: 'IMS Admin',
    subtitle: 'Interns & Documents Vault',
    icon: BookOpen,
    color: 'sky',
    badge: 'Student Onboarding & Certificates',
    borderActive: 'border-sky-600 bg-sky-50/90 text-sky-900',
    iconBg: 'bg-sky-100 text-sky-700',
    targetRoute: '#/ims-admin'
  },
  {
    id: 'employee',
    title: 'Employee Staff',
    subtitle: 'Punch Logs & Forms',
    icon: UserCheck,
    color: 'emerald',
    badge: 'Self-Service Staff Portal',
    borderActive: 'border-emerald-600 bg-emerald-50/90 text-emerald-900',
    iconBg: 'bg-emerald-100 text-emerald-700',
    targetRoute: '#/employee-portal'
  },
  {
    id: 'intern',
    title: 'Intern Scholar',
    subtitle: 'Research & Certificates',
    icon: GraduationCap,
    color: 'purple',
    badge: 'Research Scholar Portal',
    borderActive: 'border-purple-600 bg-purple-50/90 text-purple-900',
    iconBg: 'bg-purple-100 text-purple-700',
    targetRoute: '#/intern-portal'
  }
];

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, login, targetRole, loginError, setLoginError } = useAuth();
  
  const navigate = useNavigate();
  const [selectedRoleId, setSelectedRoleId] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetRole) {
      if (targetRole === 'Admin' || targetRole === 'Office Admin') {
        selectRole('admin');
      } else if (targetRole === 'IMS Officer' || targetRole === 'IMS Admin' || targetRole === 'IMS') {
        selectRole('ims');
      } else if (targetRole === 'Employee') {
        selectRole('employee');
      } else if (targetRole === 'Intern') {
        selectRole('intern');
      }
    }
  }, [targetRole]);

  if (!isLoginModalOpen) return null;

  const selectRole = (roleId) => {
    const roleObj = ROLE_OPTIONS.find(r => r.id === roleId);
    if (roleObj) {
      setSelectedRoleId(roleId);
      if (setLoginError) setLoginError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await login(username, password);
      if (success) {
        setUsername('');
        setPassword('');
        setIsLoginModalOpen(false);
        
        // Dynamic Role-Based Redirection with React Router
        const key = username.toLowerCase().trim();
        if (key === 'superadmin') {
          navigate('/superadmin');
        } else if (selectedRoleId === 'admin' || key === 'admin') {
          navigate('/office-admin');
        } else if (selectedRoleId === 'ims' || key === 'ims') {
          navigate('/ims-admin');
        } else if (selectedRoleId === 'employee' || key === 'employee') {
          navigate('/employee-portal');
        } else if (selectedRoleId === 'intern' || key === 'intern') {
          navigate('/intern-portal');
        } else {
          // Default role check from saved active user
          const activeUser = JSON.parse(localStorage.getItem('assac_active_user') || '{}');
          if (activeUser.role === 'Super Admin') navigate('/superadmin');
          else if (activeUser.role === 'Office Admin' || activeUser.role === 'Admin') navigate('/office-admin');
          else if (activeUser.role === 'IMS Admin' || activeUser.role === 'IMS Officer') navigate('/ims-admin');
          else if (activeUser.role === 'Employee') navigate('/employee-portal');
          else if (activeUser.role === 'Intern') navigate('/intern-portal');
          else navigate('/hub');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRoleObj = ROLE_OPTIONS.find(r => r.id === selectedRoleId) || ROLE_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="bg-indigo-600 text-white p-5 flex items-center justify-between relative shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-amber-300 shrink-0 shadow-2xs">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-100 uppercase tracking-wider block">
                ASSAC INTRANET GATEWAY
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                Account Sign-In & Workspace Portal
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">

          {/* Section 1: Choose Account Role */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
              1. Select Your Portal Role:
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {ROLE_OPTIONS.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRoleId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRole(r.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                      isSelected
                        ? `${r.borderActive} shadow-xs font-extrabold`
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-700 font-bold'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className={`p-1.5 rounded-lg shrink-0 ${r.iconBg}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                      )}
                    </div>

                    <div>
                      <div className="font-extrabold text-xs text-slate-900">
                        {r.title}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                        {r.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Notice */}
          {loginError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2.5 shadow-2xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="font-bold">{loginError}</span>
            </div>
          )}

          {/* Section 2: Enter Credentials */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 pb-1 border-b border-slate-200">
              <span>2. Enter Credentials:</span>
              <span className="text-[11px] font-mono text-indigo-600 font-bold">
                Workspace: {currentRoleObj.title}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Username / ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter ID / Username"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Access Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>Sign In & Open {currentRoleObj.title} Workspace</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            ASSAC Office LAN Authenticated Portal
          </span>
          <button
            type="button"
            className="text-amber-700 font-bold hover:underline cursor-pointer"
            onClick={() => {
              setIsLoginModalOpen(false);
              navigate('/superadmin');
            }}
          >
            Super Admin Gate →
          </button>
        </div>

      </div>
    </div>
  );
}
