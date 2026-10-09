import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, KeyRound, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function SuperAdminSecureGate({ onBackToHub }) {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (onBackToHub) {
      onBackToHub();
    } else {
      navigate('/hub');
    }
  };

  const handleSuperAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (username.toLowerCase().trim() !== 'superadmin') {
      setError('Access Denied. Only Super Admin master accounts can access this secure route.');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Invalid Master Passkey. Access attempt logged.');
      } else {
        setError('');
        navigate('/superadmin', { replace: true });
      }
    } catch (err) {
      setError('Authentication error occurred. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl text-white space-y-6 relative overflow-hidden animate-fadeIn">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Intranet Hub</span>
        </button>

        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase">
          SECURE ROUTE
        </span>
      </div>

      <div className="text-center space-y-2">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400 shadow-lg">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">Super Admin Governance Gateway</h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Restricted Master Security Console. This portal is isolated from standard user logins.
        </p>
      </div>

      {error && (
        <div className="bg-rose-950/80 border border-rose-800 rounded-xl p-3.5 text-xs text-rose-300 flex items-center gap-2.5 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSuperAdminLogin} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-bold mb-1">Super Admin Account ID</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-amber-500/70" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="superadmin"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500 font-bold"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1">Master Passkey</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-amber-500/70" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter superadmin password (super123)"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 font-bold"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{isLoading ? 'Verifying Credentials...' : 'Unlock Super Admin Desk'}</span>
        </button>
      </form>

      <div className="pt-4 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
        ASSAC Internal Security Policy • Restricted Console Access
      </div>
    </div>
  );
}
