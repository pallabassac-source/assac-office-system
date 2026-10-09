import React, { useState, useRef } from 'react';
import { createInternDocument } from '../services/api';
import { 
  UploadCloud, 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileArchive, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  HardDrive 
} from 'lucide-react';

export default function FileUploadModal({
  isOpen,
  onClose,
  onSuccess,
  internsList = [],
  internProfile = null,
  isInternSelfUpload = false,
  user = {}
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Project Deliverable');
  const [selectedInternId, setSelectedInternId] = useState(internProfile ? internProfile.id : '');
  const [selectedInternName, setSelectedInternName] = useState(internProfile ? internProfile.name : '');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    if (!file) return;

    // 10 GB maximum limit
    const maxSize = 10 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB). Maximum allowed size is 10 GB.`);
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    if (!title.trim()) {
      // Auto-fill title from clean filename
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(cleanName);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className="h-8 w-8 text-amber-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'tif', 'tiff'].includes(ext)) {
      return <ImageIcon className="h-8 w-8 text-purple-500" />;
    }
    return <FileText className="h-8 w-8 text-indigo-500" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Deliverable title is required.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());

      if (isInternSelfUpload && internProfile) {
        formData.append('intern_id', internProfile.id);
        formData.append('intern_name', internProfile.name);
        formData.append('uploaded_by', internProfile.name);
      } else {
        formData.append('intern_id', selectedInternId || '');
        formData.append('intern_name', selectedInternName || 'General Project Archive');
        formData.append('uploaded_by', user.name || user.fullName || 'IMS Officer');
      }

      const res = await createInternDocument(formData, (percent) => {
        setUploadProgress(percent);
      });

      if (res && res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setErrorMessage(res?.error || 'Upload failed. Please check network connection.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInternSelectChange = (e) => {
    const id = e.target.value;
    setSelectedInternId(id);
    if (!id) {
      setSelectedInternName('General Project Archive');
    } else {
      const match = internsList.find(i => String(i.id) === String(id));
      if (match) {
        setSelectedInternName(match.name);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 space-y-4 shadow-2xl relative text-xs">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                Storage Disk (/data)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Max 10 GB (High Capacity)</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {isInternSelfUpload ? 'Upload Project Deliverable' : 'Archive IMS Deliverable to Storage Vault'}
            </h3>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Drag & Drop File Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-indigo-400'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3 text-left">
                {getFileIcon(selectedFile.name)}
                <div className="overflow-hidden">
                  <span className="font-extrabold text-slate-900 block text-xs truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold font-mono">
                    {formatFileSize(selectedFile.size)} • Ready for transfer
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 ml-auto cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <UploadCloud className="h-8 w-8 text-indigo-500 mx-auto" />
                <p className="font-extrabold text-slate-800 text-xs">
                  Click to select file or drag & drop here
                </p>
                <p className="text-[10px] text-slate-500">
                  Supports PDF, Word, Excel, PowerPoint, ZIP Archives, Large Datasets (up to 10 GB)
                </p>
              </div>
            )}
          </div>

          {/* Deliverable Title */}
          <div>
            <label className="block text-slate-800 font-extrabold mb-1">
              Deliverable Title / Document Label *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sentinel-1 SAR Final Project Report & Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category & Associated Intern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-extrabold mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="Project Deliverable">Project Deliverable</option>
                <option value="Technical Documentation">Technical Specs & Documentation</option>
                <option value="Research Data">Research Dataset / Code Artifacts</option>
                <option value="Interim Report">Interim Progress Report</option>
                <option value="Final Thesis">Final Thesis / Dissertation</option>
                <option value="Presentation">Slide Deck / Presentation</option>
                <option value="Completion Certificate">Completion Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold mb-1">
                {isInternSelfUpload ? 'Student Intern' : 'Associated Intern Scholar'}
              </label>
              {isInternSelfUpload ? (
                <input
                  type="text"
                  disabled
                  value={internProfile?.name || user.name || 'Intern Scholar'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold"
                />
              ) : (
                <select
                  value={selectedInternId}
                  onChange={handleInternSelectChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">General Project Archive (All)</option>
                  {internsList.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.intern_code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Remarks / Description */}
          <div>
            <label className="block text-slate-800 font-extrabold mb-1">
              Description / Research Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add summary notes or dataset scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="flex items-center justify-between text-xs font-extrabold text-indigo-900">
                <span className="flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4 animate-bounce text-indigo-600" />
                  Transferring to Storage Volume (/data)...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              disabled={isUploading}
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <UploadCloud className="h-4 w-4" />
              <span>{isUploading ? `Uploading (${uploadProgress}%)...` : 'Store in Vault'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
