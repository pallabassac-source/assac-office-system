import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Database, 
  ArrowRight,
  RefreshCw,
  FileCheck,
  Layers,
  Info,
  Calendar,
  Clock,
  Users,
  Check,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { uploadExcelFile, ingestParsedData, getAvailablePeriods, deleteAttendanceData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ExcelUploadView({ onIngestSuccess }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [parsedPayload, setParsedPayload] = useState(null);
  const [targetMonth, setTargetMonth] = useState(5);
  const [targetYear, setTargetYear] = useState(2026);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  // Deletion State & Modal
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    period: null, // { month, year, employee_count, report_period } or { clearAll: true }
    isDeleting: false
  });

  const isAuthorized = user.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.role === 'Office Admin' ||
    user.role === 'Admin' ||
    user.permissions?.excel_upload ||
    user.permissions?.biometric_attendance
  );

  const fetchPeriods = async () => {
    setLoadingPeriods(true);
    try {
      const res = await getAvailablePeriods();
      if (res.success) {
        setAvailablePeriods(res.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch available periods:', e);
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Excel Ingestion Hub"
        permissionKey="excel_upload"
        description="Access to upload and ingest monthly biometric attendance spreadsheets is restricted based on user level access permissions set by Super Admin."
        requiredRole="Office Admin"
      />
    );
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setParsedPayload(null);
      setSuccessMessage(null);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setParsedPayload(null);
      setSuccessMessage(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadExcelFile(file);
      if (res.success && res.data) {
        const payload = res.data;
        setParsedPayload(payload);
        // Initialize target month and year from detected metadata
        if (payload.meta) {
          if (payload.meta.month) setTargetMonth(Number(payload.meta.month));
          if (payload.meta.year) setTargetYear(Number(payload.meta.year));
        }
      } else {
        setError(res.error || 'Failed to parse workbook');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmIngest = async () => {
    if (!parsedPayload) return;
    setIngesting(true);
    setError(null);
    try {
      // Apply selected target month and year to payload before dispatching
      const updatedPayload = {
        ...parsedPayload,
        meta: {
          ...parsedPayload.meta,
          month: Number(targetMonth),
          year: Number(targetYear),
          period_from: parsedPayload.meta.period_from || `01-${String(targetMonth).padStart(2, '0')}-${targetYear}`,
          period_to: parsedPayload.meta.period_to || `30-${String(targetMonth).padStart(2, '0')}-${targetYear}`
        }
      };

      const res = await ingestParsedData(updatedPayload);
      if (res.success) {
        setSuccessMessage(res.message);
        fetchPeriods();
        if (onIngestSuccess) {
          setTimeout(() => {
            onIngestSuccess();
          }, 1200);
        }
      } else {
        setError(res.error || 'Ingestion failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIngesting(false);
    }
  };

  const handleOpenDeleteSheet = (period) => {
    setDeleteModal({
      open: true,
      period: period,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.period) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    setError(null);

    try {
      let res;
      if (deleteModal.period.clearAll) {
        res = await deleteAttendanceData({ clear_all: true });
      } else {
        res = await deleteAttendanceData({
          month: deleteModal.period.month,
          year: deleteModal.period.year
        });
      }

      if (res.success) {
        const deletedLabel = deleteModal.period.clearAll 
          ? 'all historical attendance datasets' 
          : `${MONTH_NAMES[deleteModal.period.month]} ${deleteModal.period.year}`;
        setSuccessMessage(`✓ Successfully deleted attendance sheet for ${deletedLabel}.`);
        setDeleteModal({ open: false, period: null, isDeleting: false });
        fetchPeriods();
        if (onIngestSuccess) onIngestSuccess();
      } else {
        setError(res.error || 'Failed to delete sheet');
        setDeleteModal(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Check if targetMonth/targetYear is already in database
  const isPeriodExisting = availablePeriods.some(
    p => p.month === Number(targetMonth) && p.year === Number(targetYear)
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-indigo-600 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono">
              <UploadCloud className="h-3 w-3 text-indigo-600" />
              Biometric Ingestion Desk
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Monthly Biometric Excel Ingestion Hub
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upload biometric performance sheets (.xls / .xlsx) with automatic month extraction, target period confirmation, and full sheet deletion management.
            </p>
          </div>
        </div>
      </div>

      {/* Main Upload & Configuration Area */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        
        {/* Drag & Drop Zone */}
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
            file 
              ? 'border-indigo-400 bg-indigo-50/30' 
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20'
          }`}
        >
          <input 
            type="file" 
            accept=".xls,.xlsx" 
            onChange={handleFileChange}
            className="hidden" 
            id="excel-file-input"
          />
          <label htmlFor="excel-file-input" className="cursor-pointer space-y-3 block">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <FileSpreadsheet className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-extrabold text-slate-900">
                {file ? file.name : 'Click to select or drag & drop Monthly Excel file'}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Supports <strong className="text-slate-700">.xls</strong> (Biometric Machine Performance Reports) and <strong className="text-slate-700">.xlsx</strong> (Attendance Matrices) up to 20MB
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs font-mono">
                ✨ Automatic Month Extraction
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs font-mono">
                Auto 2nd/4th Sat Holiday Rule
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs font-mono">
                100% In-Memory Parsing
              </span>
            </div>
          </label>
        </div>

        {/* Action Button for Parsing */}
        {file && !parsedPayload && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleUploadAndParse}
              disabled={uploading}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Scanning & Parsing Workbook...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Parse Workbook & Detect Period</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 font-medium">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}
      </div>

      {/* Target Period Confirmation & Live Dry-Run Inspection Preview */}
      {parsedPayload && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-5 p-6 animate-fadeIn">
          
          {/* Target Period Verification Box */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-600 text-white font-mono">
                    STEP 2
                  </span>
                  <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                    Confirm & Designate Target Ingestion Period
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Verify or select the exact month and year for this dataset before committing to the SQLite database.
                </p>
                {parsedPayload.meta?.detected_period_label && (
                  <div className="flex items-center gap-2 pt-1 text-xs text-indigo-800 font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Auto-extracted: <strong>{parsedPayload.meta.detected_period_label}</strong></span>
                    {parsedPayload.meta.detected_source && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                        {parsedPayload.meta.detected_source}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Target Month & Year Pickers */}
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-extrabold text-slate-800">Target Month:</span>
                  <select
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-extrabold text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
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
                    value={targetYear}
                    onChange={(e) => setTargetYear(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-extrabold text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Overwrite Notice if period already exists */}
            {isPeriodExisting && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Notice:</strong> An attendance sheet for <strong>{MONTH_NAMES[targetMonth]} {targetYear}</strong> is already ingested. Ingesting will update and refresh employee logs for this period.
                </span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider font-mono">
                ✓ Ready to Ingest
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                {parsedPayload.total_employees} Employee Records → Destination: {MONTH_NAMES[targetMonth]} {targetYear}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Organization: <strong className="text-slate-700">{parsedPayload.meta.org}</strong> • Period: <span className="font-mono font-bold text-slate-800">{parsedPayload.meta.period_from || `${MONTH_NAMES[targetMonth]} ${targetYear}`}</span> to <span className="font-mono font-bold text-slate-800">{parsedPayload.meta.period_to || `${MONTH_NAMES[targetMonth]} ${targetYear}`}</span>
              </p>
            </div>

            <button
              onClick={handleConfirmIngest}
              disabled={ingesting}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              {ingesting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Committing {MONTH_NAMES[targetMonth]} {targetYear} to SQLite...</span>
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  <span>Confirm & Ingest to {MONTH_NAMES[targetMonth]} {targetYear}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Employee Preview Table */}
          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700 uppercase text-[11px] font-extrabold bg-slate-100/80 font-mono sticky top-0">
                  <th className="px-3.5 py-2.5">Code</th>
                  <th className="px-3.5 py-2.5">Name</th>
                  <th className="px-3.5 py-2.5">Department</th>
                  <th className="px-3.5 py-2.5">Designation</th>
                  <th className="px-3 py-2.5 text-center">Present</th>
                  <th className="px-3 py-2.5 text-center">Absent</th>
                  <th className="px-3 py-2.5 text-center">Weekly Off</th>
                  <th className="px-3.5 py-2.5 text-center">Work Hours</th>
                  <th className="px-3.5 py-2.5 text-center">Overtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedPayload.employees.map((emp, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono font-bold text-indigo-700">{emp.emp_code}</td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-900">{emp.name}</td>
                    <td className="px-3.5 py-2.5 text-slate-600">{emp.department || 'General'}</td>
                    <td className="px-3.5 py-2.5 text-slate-600">{emp.designation || 'Staff'}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-emerald-700 font-mono">{emp.summary.present}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-rose-700 font-mono">{emp.summary.absent}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-indigo-700 font-mono">{emp.summary.weekly_off}</td>
                    <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-800">{emp.summary.work_hours}</td>
                    <td className="px-3.5 py-2.5 text-center font-mono font-bold text-amber-700">{emp.summary.overtime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available Uploaded Datasets in System with Deletion Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Ingested Monthly Attendance Datasets in Database
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Manage all uploaded month sheets stored in SQLite. Click the delete icon to remove any individual sheet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchPeriods}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingPeriods ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {availablePeriods.length > 0 && (
              <button
                onClick={() => handleOpenDeleteSheet({ clearAll: true })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold transition-colors cursor-pointer"
                title="Purge all attendance records in database"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Purge All Datasets</span>
              </button>
            )}
          </div>
        </div>

        {availablePeriods.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded-xl border border-slate-200">
            No attendance datasets ingested yet. Upload your first Excel file above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {availablePeriods.map((p, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3 text-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                      {p.month}
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {MONTH_NAMES[p.month]} {p.year}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 font-mono">
                    {p.employee_count} Staff
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  Period: <span className="font-mono text-slate-700 font-bold">{p.report_period || `${MONTH_NAMES[p.month]} ${p.year}`}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-emerald-700 font-bold">{p.total_present || 0} P</span>
                    <span>•</span>
                    <span className="text-rose-700 font-bold">{p.total_absent || 0} A</span>
                  </div>

                  <button
                    onClick={() => handleOpenDeleteSheet(p)}
                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    title={`Delete ${MONTH_NAMES[p.month]} ${p.year} Sheet`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Sheet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Sheet Confirmation Modal */}
      {deleteModal.open && deleteModal.period && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600 font-extrabold text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>
                  {deleteModal.period.clearAll ? 'Purge All Attendance Datasets' : 'Delete Monthly Attendance Sheet'}
                </span>
              </div>
              <button
                onClick={() => setDeleteModal({ open: false, period: null, isDeleting: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-slate-700">
              {deleteModal.period.clearAll ? (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 leading-relaxed font-medium">
                  <strong>Warning:</strong> You are about to permanently purge <strong>all uploaded attendance records</strong> across all months from the SQLite database.
                </div>
              ) : (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-extrabold text-sm">
                    Target: {MONTH_NAMES[deleteModal.period.month]} {deleteModal.period.year}
                  </div>
                  <div className="text-xs font-medium">
                    This will delete all <strong>{deleteModal.period.employee_count} employee monthly summaries</strong> and all 31-day daily punch logs for this period.
                  </div>
                  {deleteModal.period.report_period && (
                    <div className="text-[11px] font-mono text-rose-800">
                      Span: {deleteModal.period.report_period}
                    </div>
                  )}
                </div>
              )}

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
