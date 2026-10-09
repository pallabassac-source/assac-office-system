import React, { useState } from 'react';
import { ShieldCheck, PhoneCall, Globe, Type, Bell } from 'lucide-react';

export default function GovtTopBar() {
  const [fontSize, setFontSize] = useState('normal'); // 'small' | 'normal' | 'large'
  const [language, setLanguage] = useState('ENG');

  return (
    <div className="bg-[#050810] border-b border-amber-500/20 text-xs text-gray-300 py-1.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-md relative z-50">
      {/* Left side: Official Certification Tag & Helpline */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold tracking-wide border-r border-white/10 pr-3">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>GOVT. OF ASSAM • STATE SPACE APPLICATION CENTRE (ASSAC)</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-gray-400">
          <PhoneCall className="h-3 w-3 text-emerald-400" />
          <span>Portal Helpline: <strong className="text-gray-200">+91 (0361) 2237000</strong></span>
        </div>
      </div>

      {/* Center: Live News / Announcement Ticker */}
      <div className="hidden md:flex items-center flex-1 max-w-xl overflow-hidden bg-slate-900/90 border border-amber-500/20 rounded-full px-3 py-0.5">
        <div className="flex items-center gap-1 text-amber-400 font-bold shrink-0 mr-2 text-[10px] uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
          <Bell className="h-3 w-3 animate-pulse" />
          <span>Notice</span>
        </div>
        <div className="overflow-hidden relative w-full text-[11px] text-gray-300 font-medium">
          <div className="animate-ticker space-x-8">
            <span>🏛️ Unified Government Multi-Portal Dashboard Operational</span>
            <span>•</span>
            <span>🎓 Interns Management System Portal Integrated</span>
            <span>•</span>
            <span>⏱️ Biometric Attendance Engine Active (v3.2)</span>
            <span>•</span>
            <span>🔒 ISO 27001 Security Audit Passed</span>
            <span>•</span>
            <span>🏛️ Unified Government Multi-Portal Dashboard Operational</span>
            <span>•</span>
            <span>🎓 Interns Management System Portal Integrated</span>
          </div>
        </div>
      </div>

      {/* Right side: Accessibility Controls & Language Selector */}
      <div className="flex items-center gap-3">
        {/* Font Size Adjuster */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[11px]">
          <Type className="h-3 w-3 text-gray-400 mr-1" />
          <button 
            onClick={() => setFontSize('small')}
            className={`px-1 rounded hover:text-white ${fontSize === 'small' ? 'text-amber-400 font-bold' : 'text-gray-400'}`}
            title="Decrease Font Size"
          >
            A-
          </button>
          <span className="text-gray-600">|</span>
          <button 
            onClick={() => setFontSize('normal')}
            className={`px-1 rounded hover:text-white ${fontSize === 'normal' ? 'text-amber-400 font-bold' : 'text-gray-400'}`}
            title="Default Font Size"
          >
            A
          </button>
          <span className="text-gray-600">|</span>
          <button 
            onClick={() => setFontSize('large')}
            className={`px-1 rounded hover:text-white ${fontSize === 'large' ? 'text-amber-400 font-bold' : 'text-gray-400'}`}
            title="Increase Font Size"
          >
            A+
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[11px]">
          <Globe className="h-3 w-3 text-cyan-400" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-gray-200 font-semibold focus:outline-none cursor-pointer text-[11px]"
          >
            <option value="ENG" className="bg-slate-900 text-white">English</option>
            <option value="ASM" className="bg-slate-900 text-white">অসমীয়া (Assamese)</option>
            <option value="HIN" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
