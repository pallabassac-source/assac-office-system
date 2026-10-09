import React, { useEffect, useState } from 'react';
import { X, User, Calendar, Clock, CheckCircle2, AlertCircle, Award, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { getEmployeeDetail } from '../services/api';
import { formatTime12Hour } from '../utils/formatters';

export default function EmployeeDetailModal({ employeeId, month, year, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      setLoading(true);
      getEmployeeDetail(employeeId, month, year)
        .then(res => {
          if (res.success) setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [employeeId, month, year]);

  if (!employeeId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col border border-slate-200 shadow-2xl">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {data ? data.employee.name : 'Loading Employee Profile...'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Code: <span className="font-mono font-bold text-indigo-700">{data?.employee.emp_code}</span> • {data?.employee.designation || 'Staff'} • <span className="font-bold text-slate-700">{data?.employee.department || 'General'}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading employee punch log...</p>
          </div>
        ) : data ? (
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Monthly Summary Metric Grid */}
            {data.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 uppercase font-extrabold font-mono block">Present</span>
                  <p className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">{data.summary.present_days}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-center">
                  <span className="text-[10px] text-rose-800 uppercase font-extrabold font-mono block">Absent</span>
                  <p className="text-xl font-extrabold text-rose-700 font-mono mt-0.5">{data.summary.absent_days}</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 text-center">
                  <span className="text-[10px] text-indigo-800 uppercase font-extrabold font-mono block">Weekly Off</span>
                  <p className="text-xl font-extrabold text-indigo-700 font-mono mt-0.5">{data.summary.weekly_off_days}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                  <span className="text-[10px] text-amber-800 uppercase font-extrabold font-mono block">Holiday</span>
                  <p className="text-xl font-extrabold text-amber-700 font-mono mt-0.5">{data.summary.holiday_days}</p>
                </div>
                <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200 text-center">
                  <span className="text-[10px] text-sky-800 uppercase font-extrabold font-mono block">Leave</span>
                  <p className="text-xl font-extrabold text-sky-700 font-mono mt-0.5">{data.summary.leave_days}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-700 uppercase font-extrabold font-mono block">Paid Days</span>
                  <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{data.summary.paid_days}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-700 uppercase font-extrabold font-mono block">Work Hours</span>
                  <p className="text-base font-extrabold text-slate-900 font-mono mt-1">{data.summary.total_work_hours}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                  <span className="text-[10px] text-amber-800 uppercase font-extrabold font-mono block">Overtime</span>
                  <p className="text-base font-extrabold text-amber-700 font-mono mt-1">{data.summary.overtime_hours}</p>
                </div>
              </div>
            )}

            {/* Daily Attendance Grid */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>Daily Punch Logs & Shifts • {data.summary?.report_period || `Period ${month}/${year}`}</span>
                </h3>
              </div>

              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider bg-slate-100/70 font-mono sticky top-0">
                      <th className="px-3.5 py-2.5">Date & Day</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                      <th className="px-3.5 py-2.5">Arrival Punch</th>
                      <th className="px-3.5 py-2.5">Departure Punch</th>
                      <th className="px-3.5 py-2.5 text-center">Working Hours</th>
                      <th className="px-3.5 py-2.5 text-center">Overtime</th>
                      <th className="px-3.5 py-2.5 text-center">Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.daily.map((d) => {
                      const dObj = d.date ? new Date(d.date + 'T00:00:00') : null;
                      const dateStr = dObj && !isNaN(dObj.getTime())
                        ? dObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                        : `Day ${d.day_num}`;
                      const dayName = dObj && !isNaN(dObj.getTime())
                        ? dObj.toLocaleDateString('en-US', { weekday: 'short' })
                        : '';

                      return (
                        <tr key={d.id || d.date || d.day_num} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-3.5 py-2 font-mono text-slate-700">
                            <div className="font-bold text-slate-800">{dateStr}</div>
                            {dayName && <div className="text-[10px] text-slate-500 font-medium">{dayName}</div>}
                          </td>
                        <td className="px-3.5 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] font-mono ${
                            d.status === 'P' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            d.status === 'A' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            d.status === 'WO' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            d.status === 'HL' || d.status === 'RH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}>
                            {d.status === 'P' ? 'P' : d.status === 'A' ? 'A' : d.status === 'WO' ? 'WO' : d.status === 'HL' ? 'HL' : d.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-slate-800 font-mono text-xs">
                          {formatTime12Hour(d.arrival_time) || '—'}
                        </td>
                        <td className="px-3.5 py-2 text-slate-800 font-mono text-xs">
                          {formatTime12Hour(d.departure_time) || '—'}
                        </td>
                        <td className="px-3.5 py-2 text-center text-slate-800 font-mono font-bold">{d.work_hours || '00:00'}</td>
                        <td className="px-3.5 py-2 text-center text-amber-700 font-mono font-bold">{d.overtime_hours || '00:00'}</td>
                        <td className="px-3.5 py-2 text-center text-slate-500 font-mono">{d.shift || 'G'}</td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">Failed to load employee details</div>
        )}

      </div>
    </div>
  );
}
