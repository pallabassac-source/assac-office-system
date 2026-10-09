import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  CheckCircle2, 
  Sliders, 
  CheckSquare, 
  Square, 
  Printer, 
  FileCheck,
  Calendar,
  Database,
  RefreshCw,
  AlertCircle,
  Layers,
  ArrowRight,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { getDepartments, getExportExcelUrl, getExportPDFUrl, getAvailablePeriods, deleteAttendanceData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ExportsView({ 
  month: initialMonth = (new Date().getMonth() + 1), 
  year: initialYear = new Date().getFullYear() 
}) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  // Explicit Month & Year selector state for Export
  const [exportMonth, setExportMonth] = useState(initialMonth);
  const [exportYear, setExportYear] = useState(initialYear);
  
  // Available ingested months in database
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Delete Sheet Modal State
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    period: null,
    isDeleting: false
  });

  const isAuthorized = user.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.permissions?.super_admin === true ||
    user.permissions?.biometric_attendance === true
  );

  // PDF Export Customization Options
  const [pdfOptions, setPdfOptions] = useState({
    includeStats: true,
    includeWorkHours: true,
    includeOvertime: true,
    includeLateHours: true,
  });

  const fetchPeriodsAndDepts = async () => {
    setLoadingPeriods(true);
    try {
      const [periodsRes, deptRes] = await Promise.all([
        getAvailablePeriods(),
        getDepartments()
      ]);
      if (periodsRes.success) {
        const list = periodsRes.data || [];
        setAvailablePeriods(list);
        // If initial month not in available periods, default to first available
        if (list.length > 0 && !list.some(p => p.month === exportMonth && p.year === exportYear)) {
          setExportMonth(list[0].month);
          setExportYear(list[0].year);
        }
      }
      if (deptRes.success) setDepartments(deptRes.data);
    } catch (e) {
      console.error('Failed to load export metadata:', e);
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    fetchPeriodsAndDepts();
  }, []);

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Report Export Center"
        permissionKey="biometric_attendance"
        description="Access to export monthly Excel registers and PDF reports is restricted based on user level access permissions set by Super Admin."
        requiredRole="Office Admin"
      />
    );
  }

  const toggleOption = (key) => {
    setPdfOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenDelete = (e, period) => {
    e.stopPropagation();
    setDeleteModal({
      open: true,
      period: period,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.period) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      const res = await deleteAttendanceData({
        month: deleteModal.period.month,
        year: deleteModal.period.year
      });

      if (res.success) {
        const targetLabel = `${MONTH_NAMES[deleteModal.period.month]} ${deleteModal.period.year}`;
        setStatusMessage(`✓ Successfully deleted attendance dataset for ${targetLabel}.`);
        setDeleteModal({ open: false, period: null, isDeleting: false });
        
        // Refresh periods and update active export target if needed
        const periodsRes = await getAvailablePeriods();
        if (periodsRes.success) {
          const list = periodsRes.data || [];
          setAvailablePeriods(list);
          if (list.length > 0) {
            setExportMonth(list[0].month);
            setExportYear(list[0].year);
          }
        }
      } else {
        alert(res.error || 'Failed to delete attendance sheet');
        setDeleteModal(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Check if selected period exists in DB
  const selectedPeriodData = availablePeriods.find(
    p => p.month === Number(exportMonth) && p.year === Number(exportYear)
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-indigo-600 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono">
              <Download className="h-3 w-3 text-indigo-600" />
              Document Dispatch Desk
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Official Report & Register Export Center
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select any ingested monthly sheet to generate and download official government Excel attendance registers (.xlsx) or customizable printable PDF registers.
            </p>
          </div>
        </div>
      </div>

      {/* Success / Status Message Notification */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 font-medium animate-fadeIn">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="p-1 rounded text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Ingested Datasets Quick Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Step 1: Choose Particular Ingested Month Sheet to Export
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Click any sheet to designate it for download, or use the delete icon to remove outdated sheets.
              </p>
            </div>
          </div>
          <button
            onClick={fetchPeriodsAndDepts}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loadingPeriods ? 'animate-spin' : ''}`} />
            <span>Refresh Sheets List</span>
          </button>
        </div>

        {availablePeriods.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded-xl border border-slate-200">
            No monthly attendance spreadsheets found in the database. Please navigate to <strong>Excel Ingestion Hub</strong> to upload your sheets first.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {availablePeriods.map((p, idx) => {
              const isSelected = p.month === Number(exportMonth) && p.year === Number(exportYear);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setExportMonth(p.month);
                    setExportYear(p.year);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 group relative ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 shadow-xs ring-2 ring-indigo-600/20'
                      : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {p.month}
                      </div>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {MONTH_NAMES[p.month]} {p.year}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.employee_count} Staff
                      </span>

                      {/* Delete Sheet Action Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenDelete(e, p)}
                        className="p-1 rounded-md bg-white hover:bg-rose-100 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer ml-1"
                        title={`Delete ${MONTH_NAMES[p.month]} ${p.year} Sheet`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    Period: <span className="font-mono text-slate-700 font-bold">{p.report_period || `${MONTH_NAMES[p.month]} ${p.year}`}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-emerald-700 font-bold">{p.total_present} Present</span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-indigo-700 font-extrabold text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Active Target</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Click to select</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Target Scope & Custom Period Adjuster */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Month & Year Direct Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-extrabold text-slate-800">Export Month:</span>
            <select
              value={exportMonth}
              onChange={(e) => setExportMonth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {MONTH_NAMES.slice(1).map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m} ({idx + 1})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800">Year:</span>
            <select
              value={exportYear}
              onChange={(e) => setExportYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-extrabold text-slate-800">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="ALL">All Departments (Consolidated)</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Period Status Pill */}
        <div>
          {selectedPeriodData ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Ready to Export: {MONTH_NAMES[exportMonth]} {exportYear} ({selectedPeriodData.employee_count} Staff)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>No data for {MONTH_NAMES[exportMonth]} {exportYear}</span>
            </span>
          )}
        </div>

      </div>

      {/* Main Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Excel Export Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                .XLSX FORMAT
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Official Monthly Attendance Register
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                Standardized institutional layout with soft pastel color highlights for attendance codes and compact cell sizing matching ASSAC governance formats.
              </p>
            </div>

            {/* Target Details Box */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Selected Target Period:</span>
                <span className="font-extrabold text-emerald-800 font-mono">{MONTH_NAMES[exportMonth]} {exportYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Department Scope:</span>
                <span className="font-bold text-slate-800">{selectedDept === 'ALL' ? 'Full Organization' : selectedDept}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200/50">
                <span className="text-slate-500 font-medium">Download Filename:</span>
                <span className="font-mono text-slate-700 text-[11px]">Attendance_Report_{exportMonth}_{exportYear}.xlsx</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">Included Highlights:</div>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Soft pastel status coding (P: Soft Green, A: Soft Red, WO: Lavender, HL: Amber)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>3-row block per staff (Status row, 12-hour Arrival punch, Departure punch)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Official footer sign-off block with A.O. & Prepared By signature lines</span>
                </li>
              </ul>
            </div>
          </div>

          <a
            href={getExportExcelUrl(exportMonth, exportYear, selectedDept)}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download Excel Sheet for {MONTH_NAMES[exportMonth]} {exportYear}</span>
          </a>
        </div>

        {/* PDF Export Card with Custom Toggles */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                <FileText className="h-6 w-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                LANDSCAPE A4 .PDF
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Executive Attendance Summary Report
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                Clean printable report suitable for executive review, HR physical filing, and administrative sign-offs.
              </p>
            </div>

            {/* Target Details Box */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Selected Target Period:</span>
                <span className="font-extrabold text-indigo-800 font-mono">{MONTH_NAMES[exportMonth]} {exportYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Department Scope:</span>
                <span className="font-bold text-slate-800">{selectedDept === 'ALL' ? 'Full Organization' : selectedDept}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-indigo-200/50">
                <span className="text-slate-500 font-medium">Download Filename:</span>
                <span className="font-mono text-slate-700 text-[11px]">Attendance_Report_{exportMonth}_{exportYear}.pdf</span>
              </div>
            </div>

            {/* Interactive Column Toggles */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Customize Report Columns & Blocks:</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Click to toggle</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleOption('includeStats')}
                  className="flex items-center gap-2 text-left p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer text-slate-700"
                >
                  {pdfOptions.includeStats ? <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0" /> : <Square className="h-4 w-4 text-slate-400 shrink-0" />}
                  <span className="font-semibold text-xs">Top Metrics Summary Bar</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleOption('includeWorkHours')}
                  className="flex items-center gap-2 text-left p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer text-slate-700"
                >
                  {pdfOptions.includeWorkHours ? <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0" /> : <Square className="h-4 w-4 text-slate-400 shrink-0" />}
                  <span className="font-semibold text-xs">Total Work Hours Column</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleOption('includeOvertime')}
                  className="flex items-center gap-2 text-left p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer text-slate-700"
                >
                  {pdfOptions.includeOvertime ? <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0" /> : <Square className="h-4 w-4 text-slate-400 shrink-0" />}
                  <span className="font-semibold text-xs">Overtime Hours Column</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleOption('includeLateHours')}
                  className="flex items-center gap-2 text-left p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer text-slate-700"
                >
                  {pdfOptions.includeLateHours ? <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0" /> : <Square className="h-4 w-4 text-slate-400 shrink-0" />}
                  <span className="font-semibold text-xs">Late Arrival Hours Column</span>
                </button>
              </div>
            </div>
          </div>

          <a
            href={getExportPDFUrl(exportMonth, exportYear, selectedDept, pdfOptions)}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Generate & Print PDF Report ({MONTH_NAMES[exportMonth]} {exportYear})</span>
          </a>
        </div>

      </div>

      {/* Delete Sheet Confirmation Modal */}
      {deleteModal.open && deleteModal.period && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600 font-extrabold text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Delete Monthly Attendance Sheet</span>
              </div>
              <button
                onClick={() => setDeleteModal({ open: false, period: null, isDeleting: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-slate-700">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1">
                <div className="font-extrabold text-sm">
                  Target Sheet: {MONTH_NAMES[deleteModal.period.month]} {deleteModal.period.year}
                </div>
                <div className="text-xs font-medium">
                  This will delete all <strong>{deleteModal.period.employee_count} employee monthly summaries</strong> and all 31-day daily punch logs for this period from the database.
                </div>
                {deleteModal.period.report_period && (
                  <div className="text-[11px] font-mono text-rose-800">
                    Span: {deleteModal.period.report_period}
                  </div>
                )}
              </div>

              <p className="text-slate-500 text-[11px]">
                This action is immediate and will record an entry in the system security audit trail.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, period: null, isDeleting: false })}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteModal.isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {deleteModal.isDeleting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
