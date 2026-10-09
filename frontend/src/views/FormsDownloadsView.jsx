import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';
import { 
  getFormsList, 
  createFormApi, 
  updateFormApi, 
  deleteFormApi, 
  getFormDownloadUrl,
  getFormViewUrl
} from '../services/api';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  IndianRupee, 
  Building, 
  GraduationCap, 
  CheckCircle2, 
  FileSpreadsheet, 
  PlusCircle,
  X,
  Edit2,
  Trash2,
  UploadCloud,
  AlertCircle,
  Eye,
  FileArchive,
  RefreshCw,
  HardDrive
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'All Forms', icon: FileText },
  { id: 'Attendance & Leave', label: 'Leave & Attendance', icon: Calendar },
  { id: 'Finance & Claims', label: 'Finance & TA/DA', icon: IndianRupee },
  { id: 'Stores & Requisitions', label: 'Stores & Administrative', icon: Building },
  { id: 'Academic & Interns', label: 'Academic & Interns', icon: GraduationCap },
  { id: 'General Administration', label: 'General Administration', icon: Building }
];

export default function FormsDownloadsView() {
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals state
  const [downloadSuccessModal, setDownloadSuccessModal] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestedFormName, setRequestedFormName] = useState('');

  // Office Admin Management state
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [deleteConfirmForm, setDeleteConfirmForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formModalError, setFormModalError] = useState('');

  // Form inputs
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Attendance & Leave');
  const [formDescription, setFormDescription] = useState('');
  const [formFormat, setFormFormat] = useState('PDF');
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formSelectedFile, setFormSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  const canManageForms = user?.isAuthenticated && (
    user.role === 'Office Admin' || 
    user.role === 'Admin' || 
    user.role === 'Super Admin' ||
    user.permissions?.super_admin === true
  );

  // RBAC Gating
  const isAuthorized = user?.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.role === 'Office Admin' ||
    user.role === 'Admin' ||
    user.permissions?.forms_downloads ||
    user.permissions?.super_admin
  );

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getFormsList();
      if (res && res.success) {
        setForms(res.data || []);
      } else {
        setError(res?.error || 'Failed to load official forms repository.');
      }
    } catch (err) {
      console.error('Fetch forms error:', err);
      setError(err.message || 'Error connecting to forms repository.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchForms();
    }
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Official Forms & Downloads Repository"
        permissionKey="forms_downloads"
        description="Access to official office applications, leave formats, TA/DA claim vouchers, and administrative store requisition templates is restricted based on user level access permissions set by Super Admin."
        requiredRole="Employee"
      />
    );
  }

  // Filter forms
  const filteredForms = forms.filter(form => {
    const code = form.form_code || form.code || '';
    const title = form.title || '';
    const desc = form.description || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (form) => {
    const downloadUrl = getFormDownloadUrl(form.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = form.file_name || `${form.form_code || form.code}_${form.title}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Increment count locally
    setForms(prev => prev.map(f => f.id === form.id ? { ...f, download_count: (f.download_count || 0) + 1 } : f));
    setDownloadSuccessModal(form);
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedFormId(null);
    setFormCode(`ASSAC-HR-F-${String(forms.length + 1).padStart(2, '0')}`);
    setFormTitle('');
    setFormCategory('Attendance & Leave');
    setFormDescription('');
    setFormFormat('PDF');
    setFormIsPopular(false);
    setFormSelectedFile(null);
    setFormModalError('');
    setUploadProgress(0);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (form) => {
    setIsEditing(true);
    setSelectedFormId(form.id);
    setFormCode(form.form_code || form.code || '');
    setFormTitle(form.title || '');
    setFormCategory(form.category || 'Attendance & Leave');
    setFormDescription(form.description || '');
    setFormFormat((form.format || 'PDF').toUpperCase());
    setFormIsPopular(!!(form.is_popular || form.popular));
    setFormSelectedFile(null);
    setFormModalError('');
    setUploadProgress(0);
    setShowFormModal(true);
  };

  const handleFileChange = (file) => {
    if (!file) return;
    // 10 GB limit for file upload
    const maxSize = 10 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormModalError(`File is too large (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB). Maximum allowed is 10 GB.`);
      return;
    }
    setFormModalError('');
    setFormSelectedFile(file);

    // Auto-detect format from extension
    const ext = file.name.split('.').pop()?.toUpperCase();
    if (['PDF', 'DOCX', 'XLSX', 'XLS', 'DOC', 'ZIP'].includes(ext)) {
      setFormFormat(ext);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormModalError('Form title is required.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setFormModalError('');

    try {
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('form_code', formCode.trim().toUpperCase());
      formData.append('category', formCategory);
      formData.append('description', formDescription.trim());
      formData.append('format', formFormat);
      formData.append('is_popular', formIsPopular ? '1' : '0');
      formData.append('uploaded_by', user.name || user.fullName || 'Office Admin');

      if (formSelectedFile) {
        formData.append('file', formSelectedFile);
      }

      let res;
      if (isEditing) {
        res = await updateFormApi(selectedFormId, formData, (percent) => setUploadProgress(percent));
      } else {
        res = await createFormApi(formData, (percent) => setUploadProgress(percent));
      }

      if (res && res.success) {
        setShowFormModal(false);
        await fetchForms();
      } else {
        setFormModalError(res?.error || 'Operation failed. Please try again.');
      }
    } catch (err) {
      console.error('Form save error:', err);
      setFormModalError(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteForm = async () => {
    if (!deleteConfirmForm) return;
    try {
      setIsSubmitting(true);
      const res = await deleteFormApi(deleteConfirmForm.id);
      if (res && res.success) {
        setDeleteConfirmForm(null);
        await fetchForms();
      } else {
        alert(res?.error || 'Failed to delete form');
      }
    } catch (err) {
      console.error('Delete form error:', err);
      alert(err.response?.data?.error || err.message || 'Failed to delete form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    alert(`Requisition for custom format "${requestedFormName}" has been submitted to the Office Administration!`);
    setRequestedFormName('');
    setShowRequestModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-2 shadow-sm border-l-4 border-l-emerald-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                Official Document Desk
              </span>
              <span className="text-xs text-slate-500 font-medium font-mono">
                High-Capacity Storage (/data) • Max 10 GB
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Official Office Forms & Templates Desk
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl font-medium">
              Official office applications, leave formats, TA/DA vouchers, missed punch regularization slips, 
              store requisitions, and intern clearances. {canManageForms && 'Office Admin can create, upload, edit, and delete templates.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canManageForms ? (
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-amber-300" />
                <span>+ Upload / Create New Form</span>
              </button>
            ) : (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-amber-300" />
                <span>Request New Format</span>
              </button>
            )}

            <button
              onClick={fetchForms}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Refresh repository"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search form title, code (e.g. Leave, TA/DA, ASSAC-HR)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 text-xs">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading official forms repository...</p>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No official forms found</p>
          <p className="text-xs text-slate-400">Try adjusting your search criteria or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map((form) => {
            const isPopular = !!(form.is_popular || form.popular);
            const displayCode = form.form_code || form.code || `FORM-${form.id}`;
            const displaySize = form.formatted_size || form.size || (form.file_size ? `${(form.file_size / 1024).toFixed(0)} KB` : 'Template');
            const displayDate = form.updated_date || form.updatedDate || '2026';

            return (
              <div 
                key={form.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-400 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-2xs group relative"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700">
                      {displayCode}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isPopular && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                          Frequent
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        form.format === 'XLSX' || form.format === 'XLS' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                        form.format === 'DOCX' || form.format === 'DOC' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                        form.format === 'ZIP' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {form.format || 'PDF'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {form.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed font-medium">
                      {form.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Size: {displaySize}</span>
                    <span>Rev: {displayDate}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Office Admin Actions */}
                    {canManageForms ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(form)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer"
                          title="Edit form details or replace file"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmForm(form)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                          title="Delete form"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {form.download_count > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono font-medium ml-1">
                            {form.download_count} dl
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 font-medium">
                        {form.category}
                      </div>
                    )}

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(form)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-2xs transition-colors cursor-pointer ml-auto"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Download Success Modal */}
      {downloadSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-slate-200 text-center space-y-4 shadow-2xl relative text-xs">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Form Download Dispatched!</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                "{downloadSuccessModal.title}" is saved to your computer.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-left font-mono text-[11px] text-slate-600 space-y-1">
              <div><strong>Code:</strong> {downloadSuccessModal.form_code || downloadSuccessModal.code}</div>
              <div><strong>Format:</strong> {downloadSuccessModal.format || 'PDF'}</div>
              <div><strong>Category:</strong> {downloadSuccessModal.category}</div>
            </div>
            <button
              onClick={() => setDownloadSuccessModal(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Office Admin: Create / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 space-y-4 shadow-2xl relative text-xs max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => !isSubmitting && setShowFormModal(false)}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    Storage Disk (/data)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Max 10 GB</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isEditing ? 'Edit Official Office Form' : 'Create & Upload New Official Form'}
                </h3>
              </div>
            </div>

            {formModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formModalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Form Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ASSAC-HR-F-05"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="Attendance & Leave">Attendance & Leave</option>
                    <option value="Finance & Claims">Finance & Claims</option>
                    <option value="Stores & Requisitions">Stores & Requisitions</option>
                    <option value="Academic & Interns">Academic & Interns</option>
                    <option value="General Administration">General Administration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Form Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vehicle Requisition & Movement Approval Form"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Format</label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="PDF">PDF (Portable Document Format)</option>
                    <option value="DOCX">DOCX (Word Document)</option>
                    <option value="XLSX">XLSX (Excel Spreadsheet)</option>
                    <option value="ZIP">ZIP (Archive Dataset / Bundle)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsPopular}
                      onChange={(e) => setFormIsPopular(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Highlight as Frequent Form</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Detailed guidelines, approval prerequisites, and instructions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* File Attachment Drag & Drop Zone */}
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">
                  Attach Official File / Template (Up to 10 GB)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    className="hidden"
                  />

                  {formSelectedFile ? (
                    <div className="flex items-center justify-between text-left">
                      <div className="flex items-center gap-2.5">
                        <UploadCloud className="h-6 w-6 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs truncate max-w-xs">
                            {formSelectedFile.name}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-mono">
                            {(formSelectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for storage
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormSelectedFile(null);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="h-6 w-6 text-indigo-500 mx-auto" />
                      <p className="font-extrabold text-slate-800 text-xs">
                        Click to select official form file or drag & drop here
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {isEditing ? 'Leave empty to preserve existing file, or select new file to replace' : 'Supports PDF, Word, Excel, ZIP up to 10 GB (High Capacity disk)'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-600">
                    <span>Streaming to /data disk...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isEditing ? 'Save Changes' : 'Create & Upload Form'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Form Confirmation Modal */}
      {deleteConfirmForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">Delete Official Form?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Are you sure you want to remove <strong>{deleteConfirmForm.form_code || deleteConfirmForm.code}</strong>: "{deleteConfirmForm.title}"?
              </p>
              <p className="text-[11px] text-rose-600 mt-2 font-medium">
                The record and its file will be deleted from the /data storage volume.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeleteConfirmForm(null)}
                className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteForm}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold cursor-pointer transition-colors"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request New Format Modal (Employees) */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <PlusCircle className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Requisition for Custom Form/Format</h3>
                <p className="text-[11px] text-slate-500 font-medium">Request the Office Administration to add a new template</p>
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Required Form Title / Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Advance Application Format"
                  value={requestedFormName}
                  onChange={(e) => setRequestedFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Department Scope</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold">
                  <option>General Administration</option>
                  <option>HR & Establishment</option>
                  <option>Finance & Accounts</option>
                  <option>GIS & Remote Sensing</option>
                  <option>Stores & Purchase</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
