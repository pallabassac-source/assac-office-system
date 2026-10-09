import React, { useState } from 'react';
import { 
  Building2, 
  Clock, 
  GraduationCap, 
  Database, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  FileText, 
  Users, 
  ChevronRight, 
  Bell, 
  ExternalLink,
  Award,
  Zap
} from 'lucide-react';

export default function GovtHubView({ onNavigatePortal, onNavigateTab }) {
  const [accessRequested, setAccessRequested] = useState(false);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Official Government Welcome Header Banner */}
      <div className="relative rounded-3xl govt-gold-border govt-grid-bg bg-slate-900/90 p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Ambient Lighting & Decorative Crest Overlay */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold govt-badge tracking-wider uppercase">
                <Award className="h-3.5 w-3.5 text-amber-400" />
                Govt. State Space Command Hub
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                State Network Connected (SSL Secured)
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Outfit']">
              Assam State Space Application Centre <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent">
                Central Multi-Portal Executive Dashboard
              </span>
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              Unified digital gateway for managing state biometric attendance intelligence, intern research programs, 
              geospatial asset monitoring, and administrative compliance desks across state space divisions.
            </p>
          </div>

          {/* Quick Hub Metric Card */}
          <div className="shrink-0 bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 w-full md:w-auto shadow-xl text-center md:text-right">
            <div className="text-xs text-amber-300 font-semibold uppercase tracking-wider mb-1">Total Portal Workforce</div>
            <div className="text-3xl font-extrabold text-white font-['Outfit'] flex items-center justify-center md:justify-end gap-2">
              <Users className="h-6 w-6 text-amber-400" />
              <span>43 Active</span>
            </div>
            <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-center md:justify-end gap-2">
              <span className="text-indigo-400 font-semibold">25 Staff</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">18 Interns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Portals Section Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-400" />
              Integrated Portals & Service Gateways
            </h2>
            <p className="text-xs text-gray-400">Select a portal to access specialized management dashboards</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-gray-300">
            2 Portals Live • 3 Upcoming
          </span>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Portal 1: Attendance Intelligence System */}
          <div 
            onClick={() => onNavigatePortal('attendance')}
            className="group relative glass-card rounded-2xl p-6 border border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10"
          >
            <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-indigo-500/30">
              Active Portal
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 p-2.5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-7 w-7 text-indigo-400" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors font-['Outfit']">
                  Attendance Intelligence System
                </h3>
                <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                  Biometric attendance logs, Excel sheet parser engine, present/absent matrix, late entry analytics, and automated monthly reports.
                </p>
              </div>

              {/* Live Mini Stats */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 rounded-xl p-3 border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block">Total Employees</span>
                  <span className="font-bold text-white text-sm">25 Staff</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Avg Attendance</span>
                  <span className="font-bold text-emerald-400 text-sm">94.2%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
              <span>Launch Attendance Portal</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Portal 2: Interns Management System */}
          <div 
            onClick={() => onNavigatePortal('interns')}
            className="group relative glass-card rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10"
          >
            <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/30">
              Active Portal
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 p-2.5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="h-7 w-7 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors font-['Outfit']">
                  Interns Management System
                </h3>
                <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                  Intern directory, university allocations, stipend disbursements, mentor assignments, project submissions, and completion certificates.
                </p>
              </div>

              {/* Live Mini Stats */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 rounded-xl p-3 border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block">Active Interns</span>
                  <span className="font-bold text-white text-sm">18 Scholars</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Monthly Stipend</span>
                  <span className="font-bold text-amber-400 text-sm">₹1,44,000</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Launch Interns Portal</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Portal 3: Geospatial Asset & Satellite Data Desk (Upcoming) */}
          <div className="relative glass-card rounded-2xl p-6 border border-amber-500/20 opacity-90 flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/30">
              Upcoming Service
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-2.5 flex items-center justify-center">
                <Database className="h-7 w-7 text-amber-400" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  Geospatial Asset & Resource Desk
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  High-resolution satellite imagery repository, GIS data cluster management, and UAV hardware inventory tracking.
                </p>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-3 border border-amber-500/20 text-xs">
                <div className="text-[11px] text-amber-300/80 font-medium">Status: In Final Beta Testing (Release: Q4 2026)</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <button 
                onClick={() => setAccessRequested(!accessRequested)}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
              >
                {accessRequested ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Access Priority Registered
                  </span>
                ) : (
                  <span>Request Priority Access →</span>
                )}
              </button>
            </div>
          </div>

          {/* Portal 4: Visitor Clearance & E-Pass Gateway (Upcoming) */}
          <div className="relative glass-card rounded-2xl p-6 border border-cyan-500/20 opacity-80 flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-cyan-500/30">
              In Development
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 p-2.5 flex items-center justify-center">
                <Lock className="h-7 w-7 text-cyan-400" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  Visitor Clearance & E-Pass Gateway
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Automated security clearance desk for visiting scientists, research scholars, and government delegation gate passes.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-gray-500">
              Integrating with Biometric Gate Protocol
            </div>
          </div>

          {/* Portal 5: E-Governance Project Tracker (Upcoming) */}
          <div className="relative glass-card rounded-2xl p-6 border border-purple-500/20 opacity-80 flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-purple-500/30">
              Planned Service
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 p-2.5 flex items-center justify-center">
                <FileText className="h-7 w-7 text-purple-400" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  E-Governance Project & Budget Desk
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Inter-departmental space application project tracking, fund utilization monitoring, and government milestone reports.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-gray-500">
              Scheduled Phase 3 Rollout
            </div>
          </div>
        </div>
      </div>

      {/* Central Executive Metrics & Quick Action Launchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health & Executive Overview (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                Live State Multi-Portal System Matrix
              </h3>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                100% Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[11px] text-gray-400 font-medium">Database Node Sync</span>
                <div className="text-lg font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>SQLite Online</span>
                </div>
                <span className="text-[10px] text-gray-500 block">Latency: 1.2ms</span>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[11px] text-gray-400 font-medium">Monthly Active Period</span>
                <div className="text-lg font-bold text-amber-300">
                  May 2026
                </div>
                <span className="text-[10px] text-gray-500 block">Current Cycle Active</span>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[11px] text-gray-400 font-medium">Security & Integrity</span>
                <div className="text-lg font-bold text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  <span>ISO 27001</span>
                </div>
                <span className="text-[10px] text-gray-500 block">Role Access Active</span>
              </div>
            </div>

            {/* Governance Bulletins List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-amber-400" />
                Recent Portal Directives & Announcements
              </h4>
              
              <div className="space-y-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold text-white block">Interns Management Portal v1.0 Activated</span>
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      Intern directory, stipend disbursement engine, and project tracking now synchronized with central dashboard.
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono shrink-0">Today</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold text-white block">Biometric Attendance Log May 2026 Processing Complete</span>
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      Monthly Excel ingest verified for 25 staff members with zero errors.
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Executive Launchpad (1 Column) */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-amber-500/20 space-y-4">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Executive Quick Launchpad
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigatePortal('attendance')}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-900 transition-all flex items-center justify-between text-xs font-semibold text-gray-200 hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>View Attendance Records & Audit</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>

              <button
                onClick={() => onNavigatePortal('interns')}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/50 hover:bg-slate-900 transition-all flex items-center justify-between text-xs font-semibold text-gray-200 hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-emerald-400" />
                  <span>Intern Directory & Stipend Register</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>

              <button
                onClick={() => onNavigatePortal('attendance')}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-amber-500/50 hover:bg-slate-900 transition-all flex items-center justify-between text-xs font-semibold text-gray-200 hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <span>Export Consolidated Govt Report</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
