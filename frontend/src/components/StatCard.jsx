import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorStyles = {
    indigo: {
      border: 'border-l-indigo-600',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accent: 'text-indigo-600'
    },
    blue: {
      border: 'border-l-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accent: 'text-blue-600'
    },
    emerald: {
      border: 'border-l-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'text-emerald-600'
    },
    amber: {
      border: 'border-l-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accent: 'text-amber-600'
    },
    rose: {
      border: 'border-l-rose-600',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accent: 'text-rose-600'
    },
    cyan: {
      border: 'border-l-cyan-600',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100',
      accent: 'text-cyan-600'
    }
  };

  const style = colorStyles[color] || colorStyles.indigo;

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200 border-l-4 ${style.border} shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>

        <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${style.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {subtitle && (
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium text-[11px] truncate">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
