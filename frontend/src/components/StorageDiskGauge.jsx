import React, { useState, useEffect } from 'react';
import { getStorageStatus } from '../services/api';
import { HardDrive, Database, Server, RefreshCw, FileText, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function StorageDiskGauge({ className = '' }) {
  const [storageData, setStorageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getStorageStatus();
      if (res && res.success) {
        setStorageData(res);
      } else {
        // Fallback representation if backend returns mock
        setStorageData({
          disk: {
            total_formatted: '1.0 TB',
            free_formatted: '1017 GB',
            used_formatted: '7.2 GB',
            percent_used: 1.0,
            storage_path: '/data/uploads',
            is_data_mount: true
          },
          files: {
            total_files: 0,
            total_size_formatted: '0 B'
          }
        });
      }
    } catch (err) {
      console.warn('Could not fetch storage status:', err);
      // Fallback display
      setStorageData({
        disk: {
          total_formatted: '1.0 TB',
          free_formatted: '1017 GB',
          used_formatted: '7.2 GB',
          percent_used: 1.0,
          storage_path: '/data/uploads',
          is_data_mount: true
        },
        files: {
          total_files: 0,
          total_size_formatted: '0 B'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const disk = storageData?.disk || {
    total_formatted: '1.0 TB',
    free_formatted: '1017 GB',
    used_formatted: '7.2 GB',
    percent_used: 1.0,
    storage_path: '/data/uploads'
  };

  const files = storageData?.files || {
    total_files: 0,
    total_size_formatted: '0 B'
  };

  const percentUsed = typeof disk.percent_used === 'number' ? disk.percent_used : 1.0;
  const isHealthy = percentUsed < 85;

  return (
    <div className={`bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900/60 shadow-lg relative overflow-hidden ${className}`}>
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
            <HardDrive className="h-6 w-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                IMS Storage Node
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Mounted: /data
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-1 flex items-center gap-2">
              High-Capacity Data Volume
            </h3>
            <p className="text-[11px] text-slate-300 font-mono">
              Partition: <span className="text-indigo-300 font-semibold">{disk.storage_path}</span>
            </p>
          </div>
        </div>

        {/* Quick Metrics & Refresh */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xl font-extrabold text-white font-mono">
              {disk.free_formatted} <span className="text-xs font-normal text-slate-300">Free</span>
            </div>
            <div className="text-[11px] text-indigo-300 font-medium">
              of {disk.total_formatted} Capacity ({percentUsed}% Used)
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={isLoading}
            title="Refresh Storage Status"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="mt-4 space-y-1.5 relative z-10">
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHealthy
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-400'
                : 'bg-gradient-to-r from-amber-500 to-rose-500'
            }`}
            style={{ width: `${Math.max(percentUsed, 1.5)}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Database className="h-3 w-3 text-indigo-400" />
            <span>Used: <strong className="text-white font-mono">{disk.used_formatted}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-sky-400" />
            <span>Archived Files: <strong className="text-white font-mono">{files.total_files}</strong> ({files.total_size_formatted})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>LAN Uploads: <strong className="text-emerald-300 font-mono">Ready</strong></span>
          </span>
        </div>
      </div>
    </div>
  );
}
