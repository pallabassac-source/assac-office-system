import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  Server, 
  HelpCircle, 
  X
} from 'lucide-react';

export default function InternalNetworkBar() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      {/* Official ASSAC Internal Security Banner - Lite Theme */}
      <div className="bg-slate-100 text-slate-700 text-[11px] px-4 py-1.5 border-b border-slate-200 flex items-center justify-between font-mono shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-indigo-700 font-bold tracking-wider uppercase text-[10px]">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>ASSAC Internal Network • Office LAN Portal</span>
          </div>

          <span className="hidden sm:inline text-slate-300">|</span>

          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Server className="h-3.5 w-3.5 text-emerald-600" />
            <span>LAN Endpoint:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
              http://192.168.10.117
            </span>
          </div>

          <span className="hidden md:inline text-slate-300">|</span>

          <div className="hidden md:flex items-center gap-1 text-slate-500 font-sans">
            <span>Latency: &lt;1 ms</span>
            <span>• Restricted Office Access</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="?route=superadmin"
            className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-sans font-bold text-[11px] transition-colors shrink-0"
            title="Super Admin Master Governance Gateway (Restricted Route)"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            <span>Super Admin Gate</span>
          </a>

          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-sans font-medium text-[11px] underline underline-offset-2 transition-colors shrink-0 cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>LAN Setup Guide</span>
          </button>
        </div>
      </div>

      {/* LAN Access Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-6 rounded-lg border border-slate-300 dark:border-slate-800 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="h-9 w-9 rounded bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-400">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">ASSAC Office LAN Access Guide</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Connecting desktop & mobile devices over office network</p>
              </div>
            </div>

            <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">1. Office Network Connection</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Ensure your device is connected to the official ASSAC LAN Ethernet cable or office Wi-Fi network.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">2. Open Browser Endpoint</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Enter the internal IP URL in your web browser:
                </p>
                <div className="font-mono font-bold text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800 text-xs">
                  http://192.168.10.117
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
