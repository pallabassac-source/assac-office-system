import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAttendanceRecords, getEmployeeDetail } from '../services/api';
import FormsDownloadsView from './FormsDownloadsView';
import HolidayCalendarWidget from '../components/HolidayCalendarWidget';
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Briefcase, 
  Building2, 
  Mail, 
  Phone, 
  FileSpreadsheet,
  Download,
  AlertCircle,
  Eye,
  RefreshCw,
  Sun,
  ShieldCheck
} from 'lucide-react';

export default function EmployeePortalView({ selectedMonth, selectedYear }) {
  const { user } = useAuth();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'forms' | 'holidays'
  const [month, setMonth] = useState(selectedMonth || currentMonth);
  const [year, setYear] = useState(selectedYear || currentYear);
  const [myRecord, setMyRecord] = useState(null);
  const [myDetail, setMyDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedMonth) setMonth(selectedMonth);
    if (selectedYear) setYear(selectedYear);
  }, [selectedMonth, selectedYear]);

  // Load employee's own record from backend
  const loadMyData = async () => {
    setIsLoading(true);
    try {
      // Find matching employee record by username or name
      const res = await getAttendanceRecords({ month, year, search: user.username });
      let matched = null;
      if (res.success && res.data && res.data.length > 0) {
        matched = res.data.find(
          r => r.emp_code.toLowerCase() === user.username.toLowerCase() ||
               r.name.toLowerCase().includes(user.name?.toLowerCase() || '')
        ) || res.data[0];
      }

      setMyRecord(matched);

      if (matched && matched.employee_id) {
        const detailRes = await getEmployeeDetail(matched.employee_id, month, year);
        if (detailRes && detailRes.success) {
          setMyDetail(detailRes.data);
        }
      }
    } catch (err) {
      console.warn('Error loading personal employee data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyData();
  }, [month, year, user]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Employee Welcome Profile Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-l-4 border-l-indigo-600 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-extrabold text-xl shadow-xs shrink-0">
              {(user.name || 'E').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                  Employee Self-Service Desk
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active Staff
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                Welcome, {user.name || 'Staff Member'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Official Staff Profile • Code: <strong className="font-mono text-indigo-700">{myRecord?.emp_code || user.username}</strong> • {myRecord?.designation || user.designation || 'Staff Officer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <span className="text-slate-500 font-medium text-[11px]">Period:</span>
              <select 
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value={1}>Jan</option>
                <option value={2}>Feb</option>
                <option value={3}>Mar</option>
                <option value={4}>Apr</option>
                <option value={5}>May</option>
                <option value={6}>Jun</option>
                <option value={7}>Jul</option>
                <option value={8}>Aug</option>
                <option value={9}>Sep</option>
                <option value={10}>Oct</option>
                <option value={11}>Nov</option>
                <option value={12}>Dec</option>
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
              <button 
                onClick={loadMyData}
                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                title="Refresh My Punch Data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>My Attendance & Punch Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer ${
              activeTab === 'forms'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Official Forms & Formats Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('holidays')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer ${
              activeTab === 'holidays'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Govt Holiday Roster 2026</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MY ATTENDANCE & PUNCH LOGS */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Monthly KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Present Days</span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono block">
                {myRecord?.present_days || 0}
              </span>
              <span className="text-[10px] text-slate-500">Biometric clocked</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Absent Days</span>
              <span className="text-xl font-extrabold text-rose-600 font-mono block">
                {myRecord?.absent_days || 0}
              </span>
              <span className="text-[10px] text-slate-500">Unpunched</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Weekly Offs</span>
              <span className="text-xl font-extrabold text-indigo-600 font-mono block">
                {myRecord?.weekly_off_days || 0}
              </span>
              <span className="text-[10px] text-slate-500">Sundays & 2nd/4th Sat</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Approved Leaves</span>
              <span className="text-xl font-extrabold text-sky-600 font-mono block">
                {myRecord?.leave_days || 0}
              </span>
              <span className="text-[10px] text-slate-500">CL / EL / ML</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total Work Hours</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono block">
                {myRecord?.total_work_hours || '00:00'}
              </span>
              <span className="text-[10px] text-slate-500">Logged in period</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Overtime Hours</span>
              <span className="text-xl font-extrabold text-amber-600 font-mono block">
                {myRecord?.overtime_hours || '00:00'}
              </span>
              <span className="text-[10px] text-slate-500">Accumulated OT</span>
            </div>
          </div>

          {/* 31-Day Punch Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span>31-Day Biometric Daily Punch Register</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Daily clock-in, clock-out, and shift breakdown for Period {month}/{year}</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200 sticky top-0 font-mono">
                    <th className="py-2.5 px-4 text-center">Day</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-center">Arrival (In)</th>
                    <th className="py-2.5 px-4 text-center">Departure (Out)</th>
                    <th className="py-2.5 px-4 text-center">Work Duration</th>
                    <th className="py-2.5 px-4 text-center">Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {myDetail && myDetail.daily && myDetail.daily.length > 0 ? (
                    myDetail.daily.map((d) => (
                      <tr key={d.day_num} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-500">{d.day_num}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-700">{d.date}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${
                            d.status === 'P' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            d.status === 'A' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            d.status === 'WO' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                            d.status === 'HL' || d.status === 'H' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-sky-100 text-sky-800 border border-sky-300'
                          }`}>
                            {d.status === 'P' ? 'Present' : d.status === 'A' ? 'Absent' : d.status === 'WO' ? 'Weekend Off' : d.status === 'HL' || d.status === 'H' ? 'Holiday' : d.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">{d.arrival_time || '--:--'}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">{d.departure_time || '--:--'}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-extrabold text-slate-800">{d.work_hours || '00:00'}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-extrabold text-amber-700">{d.overtime_hours || '00:00'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                        {isLoading ? 'Loading daily punch logs...' : 'No daily punch records found for this period.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OFFICIAL FORMS & FORMATS DESK */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <FormsDownloadsView />
        </div>
      )}

      {/* TAB 3: HOLIDAY CALENDAR */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          <HolidayCalendarWidget />
        </div>
      )}

    </div>
  );
}
