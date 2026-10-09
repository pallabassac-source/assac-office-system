import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Award, Clock, AlertTriangle, TrendingUp, Building, BarChart3, Users, CheckCircle2 } from 'lucide-react';
import { getAnalytics } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';

export default function AnalyticsView({ month, year }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthorized = user.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.role === 'Office Admin' ||
    user.role === 'Admin' ||
    user.permissions?.biometric_attendance
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Attendance Analytics Desk"
        permissionKey="biometric_attendance"
        description="Access to attendance analytics and trend reports is restricted based on user level access permissions set by Super Admin."
        requiredRole="Office Admin"
      />
    );
  }

  useEffect(() => {
    setLoading(true);
    getAnalytics(month, year)
      .then(res => {
        if (res.success) setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [month, year]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3 shadow-2xs my-6">
        <div className="h-10 w-10 mx-auto rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 animate-spin">
          <BarChart3 className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Aggregating Department Analytics...</h3>
        <p className="text-xs text-slate-400">Processing metrics for Period {month}/{year}</p>
      </div>
    );
  }

  if (!data || !data.department_analytics || data.department_analytics.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3 shadow-2xs my-6">
        <div className="h-12 w-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900">No Analytics Data Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
          Analytics reports and department breakdowns will automatically populate once attendance records are ingested.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-indigo-600 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono">
              <BarChart3 className="h-3 w-3 text-indigo-600" />
              Department Intelligence
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Attendance & Department Performance Analytics
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Comparative department breakdown, overtime distribution, and late arrival watchlist for Period {month}/{year}
            </p>
          </div>
        </div>
      </div>

      {/* Chart: Department Attendance Comparison */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-600" />
              <span>Department Attendance & Leave Comparison</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Cumulative present, absent, and leave distribution across sections</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.department_analytics} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="department" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
              <YAxis stroke="#64748b" fontSize={11} />
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
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="total_present" name="Present Days" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total_absent" name="Absent Days" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total_leave" name="Leave Days" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Breakdown Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Building className="h-4 w-4 text-indigo-600" />
            <span>Departmental Attendance Ledger Summary</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200 font-mono">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Staff Count</th>
                <th className="py-3 px-4 text-center">Present</th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th className="py-3 px-4 text-center">Leave</th>
                <th className="py-3 px-4 text-center">Total Work Hours</th>
                <th className="py-3 px-4 text-center">Overtime</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.department_analytics.map((dept, i) => (
                <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{dept.department}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">{dept.emp_count}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">{dept.total_present}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-rose-700">{dept.total_absent}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-sky-700">{dept.total_leave}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{dept.work_hours}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">{dept.overtime_hours}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold font-mono text-[11px]">
                      {dept.attendance_percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaderboards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Overtime Leaderboard */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              <span>Top Overtime Contributors</span>
            </h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
              {data.overtime_leaderboard.length} Staff
            </span>
          </div>

          <div className="space-y-2.5">
            {data.overtime_leaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No overtime recorded for this period</p>
            ) : (
              data.overtime_leaderboard.map((emp, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-amber-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`h-7 w-7 rounded-lg text-xs font-bold font-mono flex items-center justify-center shadow-2xs ${
                      i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-300 text-slate-800' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      #{i + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{emp.name}</h4>
                      <p className="text-[11px] text-slate-500">{emp.designation || 'Staff'} • Code: {emp.emp_code}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-amber-700 font-mono">{emp.overtime_hours}</span>
                    <p className="text-[10px] text-slate-400">Total OT</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Late Arrival Leaderboard */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-rose-600" />
              <span>Late Arrival Watchlist</span>
            </h3>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono">
              {data.late_arrivals.length} Staff
            </span>
          </div>

          <div className="space-y-2.5">
            {data.late_arrivals.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Zero late hours recorded</p>
            ) : (
              data.late_arrivals.map((emp, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-rose-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold font-mono flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{emp.name}</h4>
                      <p className="text-[11px] text-slate-500">{emp.designation || 'Staff'} • Code: {emp.emp_code}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-rose-700 font-mono">{emp.late_hours}</span>
                    <p className="text-[10px] text-slate-400">Late Punch</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
