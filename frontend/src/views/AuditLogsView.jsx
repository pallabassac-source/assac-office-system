import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, User, FileSpreadsheet, RefreshCw, Layers } from 'lucide-react';
import { getAuditLogs } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';

export default function AuditLogsView() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role === 'Super Admin' || user?.permissions?.super_admin === true;
  const isAuthorized = user?.isAuthenticated && (
    isSuperAdmin ||
    ((user.role === 'Office Admin' || user.role === 'Admin') && user?.permissions?.biometric_attendance === true) ||
    ((user.role === 'IMS Admin' || user.role === 'IMS Officer') && user?.permissions?.ims_access === true)
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="System Activity Audit Logs"
        permissionKey="super_admin"
        description="Access to security audit trails and system activity logs is restricted to authorized administrative officers."
        requiredRole="Office Admin"
      />
    );
  }

  const fetchLogs = () => {
    setLoading(true);
    getAuditLogs()
      .then(res => {
        if (res.success) setLogs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-indigo-600 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono">
            <ShieldAlert className="h-3 w-3 text-indigo-600" />
            Security & Governance Trail
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            System Activity & Ingestion Audit Ledger
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Immutable log trail of workbook ingestions, record deletions, and administrative operations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title="Refresh Audit Trail"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 uppercase text-[11px] font-extrabold bg-slate-100/80 font-mono sticky top-0">
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Operator</th>
                <th className="px-4 py-3.5">Action Code</th>
                <th className="px-4 py-3.5">Operation Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-slate-500 font-semibold">
                    Loading audit trail logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-slate-500 font-medium">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </td>
                    <td className="px-4 py-3.5 text-slate-900 font-bold flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{log.username || 'System Admin'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold font-mono text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
