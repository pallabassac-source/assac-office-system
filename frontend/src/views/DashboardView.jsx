import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Award, 
  Building,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Calendar,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard';
import { getDashboardStats, getAnalytics, getDepartments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';

export default function DashboardView({ month, year, onNavigateToRecords, onNavigateToUpload }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const isAuthorized = user.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.permissions?.super_admin ||
    user.permissions?.biometric_attendance === true
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Biometric Attendance Register"
        permissionKey="biometric_attendance"
        description="Inaccessible Module for Current User Access Level. Access to the Biometric Attendance Register, Monthly Staff Punch Records, and Analytics is strictly restricted. Contact Super Admin to grant module access."
        requiredRole="Office Admin"
      />
    );
  }

  useEffect(() => {
    getDepartments().then(res => {
      if (res.success) setDepartments(res.data);
    }).catch(console.error);
  }, []);

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      getDashboardStats(month, year, selectedDept),
      getAnalytics(month, year)
    ])
      .then(([statsRes, analyticsRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboardData();
  }, [month, year, selectedDept]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3 shadow-2xs my-6">
        <div className="h-10 w-10 mx-auto rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 animate-spin">
          <Clock className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Compiling Monthly Attendance Ledger...</h3>
        <p className="text-xs text-slate-400">Loading metrics for Period {month}/{year}</p>
      </div>
    );
  }

  if (!stats || !stats.total_employees || stats.total_employees === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-4 shadow-2xs my-6">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
          <FileSpreadsheet className="h-7 w-7" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-extrabold text-slate-900">No Attendance Records for Period {month}/{year}</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            No biometric attendance data has been ingested for this month. Upload your monthly biometric Excel report (.xls / .xlsx) to generate dashboard metrics, punch charts, and export registers.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onNavigateToUpload}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 mx-auto cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Open Excel Ingestion Desk</span>
          </button>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Present', value: stats.total_present, color: '#10b981' },
    { name: 'Absent', value: stats.total_absent, color: '#f43f5e' },
    { name: 'Weekly Off', value: stats.total_weekly_off, color: '#6366f1' },
    { name: 'Holiday', value: stats.total_holidays, color: '#f59e0b' },
    { name: 'Leave', value: stats.total_leave, color: '#0ea5e9' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-indigo-600 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono">
              <Layers className="h-3 w-3 text-indigo-600" />
              ASSAC Biometric Core
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Ingestion Status: Operational
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Monthly Biometric Attendance Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Assam State Space Application Centre • Period: <span className="font-bold text-slate-800 font-mono">{month}/{year}</span>
          </p>
        </div>

        {/* Department Filter Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs shadow-2xs w-full sm:w-auto">
          <Building className="h-4 w-4 text-indigo-600 shrink-0" />
          <span className="text-slate-500 font-bold">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer flex-1 sm:flex-initial"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Staff"
          value={stats.total_employees}
          subtitle={`Department Scope: ${selectedDept}`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Present Days"
          value={stats.total_present}
          subtitle={`Paid Days: ${stats.total_paid_days}`}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Absent Days"
          value={stats.total_absent}
          subtitle={`Approved Leaves: ${stats.total_leave}`}
          icon={UserX}
          color="rose"
        />
        <StatCard
          title="Total Work Hours"
          value={stats.total_work_hours}
          subtitle={`Avg: ${stats.avg_work_hours} / employee`}
          icon={Clock}
          color="cyan"
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Total Overtime</span>
            <h4 className="text-2xl font-extrabold text-amber-600 font-mono tracking-tight">{stats.total_overtime}</h4>
            <p className="text-xs text-slate-500 font-medium">Average {stats.avg_overtime} / employee</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Late Punch Hours</span>
            <h4 className="text-2xl font-extrabold text-rose-600 font-mono tracking-tight">{stats.total_late_hours}</h4>
            <p className="text-xs text-slate-500 font-medium">Accumulated late arrival duration</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Perfect Attendance</span>
            <h4 className="text-2xl font-extrabold text-emerald-600 font-mono tracking-tight">{stats.perfect_attendance_count} Officers</h4>
            <p className="text-xs text-slate-500 font-medium">Zero absent days recorded</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Breakdown Donut Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
              <span>Attendance Status Distribution</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Ratio of monthly attendance days across staff</p>
          </div>

          <div className="h-60 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    color: '#ffffff', 
                    borderColor: '#334155', 
                    borderRadius: '10px', 
                    fontSize: '12px',
                    fontWeight: 600 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs pt-2 border-t border-slate-100">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                <span className="text-slate-700">{d.name}: <strong className="font-mono text-slate-900">{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Attendance Trend Line */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 lg:col-span-2 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span>Daily Staff Presence vs Absence Trend</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Day-by-day attendance punch tracking over 31 days</p>
          </div>

          <div className="h-64 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics ? analytics.daily_trend : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day_num" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    color: '#ffffff', 
                    borderColor: '#334155', 
                    borderRadius: '10px', 
                    fontSize: '12px',
                    fontWeight: 600 
                  }} 
                />
                <Area type="monotone" dataKey="P" name="Present Staff" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="A" name="Absent Staff" stroke="#f43f5e" fillOpacity={1} fill="url(#colorAbsent)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-end gap-4 text-xs pt-2 border-t border-slate-100 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-600">Absent</span>
            </div>
          </div>
        </div>

      </div>

      {/* Perfect Attendance Roll of Honor Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Perfect Attendance Roll of Honor</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Staff members with 100% active presence and zero absent days</p>
          </div>

          <button
            onClick={onNavigateToRecords}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200 font-mono">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Officer Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Present Days</th>
                <th className="py-3 px-4 text-center">Total Work Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.perfect_employees || stats?.perfect_attendance || []).slice(0, 6).map((emp, i) => (
                <tr key={emp.employee_id || emp.emp_code || i} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{emp.emp_code || emp.employee_id}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">{emp.name || emp.employee_name}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{emp.designation || 'Staff'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px]">
                      {emp.department || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold font-mono">
                      {emp.present_days || 0} Days
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-extrabold text-slate-800 font-mono">
                    {emp.work_hours || '00:00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
