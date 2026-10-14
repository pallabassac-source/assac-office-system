import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  uploadTransferFile, 
  getTransferInfo, 
  getTransferDownloadUrl, 
  getTransferDirectDownloadUrl,
  getTransferPortalUrl,
  getActiveTransfers, 
  deleteTransferApi, 
  triggerTransferCleanup,
  getStorageStatus 
} from '../services/api';
import { 
  ArrowLeftRight, 
  UploadCloud, 
  Download, 
  Key, 
  Clock, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  File, 
  FileText, 
  FileArchive, 
  FileSpreadsheet, 
  ShieldCheck, 
  RefreshCw, 
  Trash2, 
  Share2, 
  Info,
  Timer,
  Zap,
  Lock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function FileTransferView() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'send' or 'receive'
  const initialMode = searchParams.get('mode') === 'send' ? 'send' : (searchParams.get('key') ? 'receive' : 'send');
  const [activeTab, setActiveTab] = useState(initialMode);

  // SENDER STATE
  const [selectedFile, setSelectedFile] = useState(null);
  const [senderName, setSenderName] = useState(user?.name || user?.full_name || 'Staff Member');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccessData, setUploadSuccessData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const fileInputRef = useRef(null);

  // RECEIVER STATE
  const [inputKey, setInputKey] = useState(searchParams.get('key') || '');
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [receiverFile, setReceiverFile] = useState(null);
  const [receiverError, setReceiverError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ACTIVE TRANSFERS (SESSION / SYSTEM)
  const [activeTransfers, setActiveTransfers] = useState([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Sync sender name when user context loads
  useEffect(() => {
    if (user && user.isAuthenticated && (!senderName || senderName === 'Staff Member')) {
      setSenderName(user.name || user.full_name || user.username);
    }
  }, [user]);

  // Handle URL query key auto-lookup
  useEffect(() => {
    const keyFromUrl = searchParams.get('key');
    if (keyFromUrl) {
      const shouldAutoDownload = searchParams.get('download') === '1' || searchParams.get('auto') === '1';
      setInputKey(keyFromUrl);
      setActiveTab('receive');
      lookupFileByKey(keyFromUrl, shouldAutoDownload);
    }
  }, [searchParams]);

  // Fetch active transfers
  const fetchActiveTransfers = async () => {
    setIsLoadingTransfers(true);
    try {
      const res = await getActiveTransfers();
      if (res && res.success) {
        setActiveTransfers(res.data || []);
      }
    } catch (err) {
      console.warn('Error fetching active transfers:', err);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  useEffect(() => {
    fetchActiveTransfers();
  }, []);

  // SENDER METHODS
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose or drag a file to transfer.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sender_name', senderName);
      formData.append('notes', notes);

      const res = await uploadTransferFile(formData, (percent) => {
        setUploadProgress(percent);
      });

      if (res && res.success) {
        setUploadSuccessData(res.data);
        setSelectedFile(null);
        setNotes('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchActiveTransfers();
      } else {
        setUploadError(res.error || 'Failed to complete file upload.');
      }
    } catch (err) {
      setUploadError(err.response?.data?.error || err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text, type = 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } else if (type === 'direct') {
      setCopiedDirectLink(true);
      setTimeout(() => setCopiedDirectLink(false), 2500);
    } else if (type === 'portal') {
      setCopiedPortalLink(true);
      setTimeout(() => setCopiedPortalLink(false), 2500);
    }
  };

  // RECEIVER METHODS
  const handleKeyInputChange = (val) => {
    // Only accept numeric characters up to 3 digits
    const cleaned = val.replace(/\D/g, '').slice(0, 3);
    setInputKey(cleaned);
    setReceiverError(null);

    if (cleaned.length === 3) {
      lookupFileByKey(cleaned);
    } else {
      setReceiverFile(null);
    }
  };

  const lookupFileByKey = async (key, autoDownload = false) => {
    if (!key || key.length !== 3) {
      setReceiverError('Please enter a 3-digit key (e.g. 742).');
      return;
    }

    setIsCheckingKey(true);
    setReceiverError(null);
    setReceiverFile(null);

    try {
      const res = await getTransferInfo(key);
      if (res && res.success && res.data) {
        setReceiverFile(res.data);
        if (autoDownload) {
          handleDownloadFile(key);
        }
      } else {
        setReceiverError(res?.error || 'Invalid or expired key. Files are kept for 24 hours only.');
      }
    } catch (err) {
      setReceiverError(
        err.response?.data?.error || 
        'No active file found for this 3-digit key. It may have expired (24-hour buffer elapsed) or was removed.'
      );
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleDownloadFile = (key) => {
    if (!key) return;
    setIsDownloading(true);
    const url = getTransferDownloadUrl(key);
    
    // Direct location assignment triggers native browser download
    // because server sends Content-Disposition: attachment
    window.location.href = url;

    setTimeout(() => {
      setIsDownloading(false);
      // Refresh count
      fetchActiveTransfers();
    }, 2000);
  };

  const handleDeleteTransfer = async (key) => {
    if (!window.confirm(`Are you sure you want to permanently purge transfer key "${key}" from the server?`)) {
      return;
    }

    try {
      const res = await deleteTransferApi(key);
      if (res && res.success) {
        setStatusMessage(`Transfer key "${key}" has been permanently purged.`);
        setTimeout(() => setStatusMessage(null), 4000);
        fetchActiveTransfers();
        if (receiverFile && receiverFile.transfer_key === key) {
          setReceiverFile(null);
        }
        if (uploadSuccessData && uploadSuccessData.transfer_key === key) {
          setUploadSuccessData(null);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete transfer.');
    }
  };

  const handleTriggerCleanup = async () => {
    try {
      const res = await triggerTransferCleanup();
      if (res && res.success) {
        setStatusMessage(res.message);
        setTimeout(() => setStatusMessage(null), 4000);
        fetchActiveTransfers();
      }
    } catch (err) {
      alert('Error triggering cleanup.');
    }
  };

  // Helper to determine file icon
  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive className="h-8 w-8 text-amber-500" />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return <FileText className="h-8 w-8 text-sky-500" />;
    return <File className="h-8 w-8 text-indigo-500" />;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-6xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-l-4 border-l-indigo-600">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600" />
                File Transfer Desk
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Timer className="h-3.5 w-3.5 text-amber-600" />
                24-Hour Buffer Retention
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              File Transfer & Key Exchange
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium max-w-3xl">
              Send documents and files directly to colleagues. Upon upload, a <strong>3 unique number key</strong> is generated by the system.
              The receiver enters this key to download the file. Files are automatically deleted after a <strong>24-hour buffer time</strong>.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0 text-xs font-mono shadow-2xs space-y-1">
            <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Retention & Security</div>
            <div className="flex items-center gap-1.5 text-slate-800 font-sans font-bold">
              <Lock className="h-3.5 w-3.5 text-indigo-600" />
              <span>3-Digit Key Protection</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              Auto-deleted after: <strong>24 Hours</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Transfer Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-inner">
          <button
            onClick={() => {
              setActiveTab('send');
              setSearchParams({ mode: 'send' });
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'send'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-700 hover:text-indigo-900 hover:bg-slate-100'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>1. Send a File (Generate Key)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('receive');
              setSearchParams({ mode: 'receive' });
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'receive'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 hover:text-emerald-900 hover:bg-slate-100'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>2. Receive a File (Enter Key)</span>
          </button>
        </div>
      </div>

      {/* 3. MODE: SEND FILE */}
      {activeTab === 'send' && (
        <div className="space-y-6">
          {/* If upload completed successfully: Show 3 Unique Digit Key Screen */}
          {uploadSuccessData ? (
            <div className="bg-white rounded-2xl border-2 border-indigo-400 p-6 md:p-8 shadow-md text-center space-y-6 animate-scaleUp">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  File Uploaded Successfully
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Share this 3-Digit Key with Receiver
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                  The receiver needs to enter these 3 unique numbers on the receive tab or visit the direct link below to start downloading.
                </p>
              </div>

              {/* 3 UNIQUE DIGIT DISPLAY */}
              <div className="py-4">
                <div className="inline-flex items-center justify-center gap-3 p-4 bg-slate-900 rounded-2xl border border-indigo-500 shadow-xl">
                  {uploadSuccessData.transfer_key.split('').map((digit, idx) => (
                    <div 
                      key={idx}
                      className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-xl flex items-center justify-center text-4xl sm:text-5xl font-mono font-black text-amber-300 shadow-md border-2 border-amber-400/40 select-all"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-2 font-bold uppercase tracking-wider">
                  System Generated Unique 3-Digit Security Key
                </div>
              </div>

              {/* Action Buttons: Copy Key, Direct Download Link & Web Link */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => copyToClipboard(uploadSuccessData.transfer_key, 'key')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  {copiedKey ? <Check className="h-4 w-4 text-amber-300" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedKey ? 'Key Copied!' : `Copy 3-Digit Key (${uploadSuccessData.transfer_key})`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const directUrl = getTransferDirectDownloadUrl(uploadSuccessData.transfer_key);
                    copyToClipboard(directUrl, 'direct');
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all cursor-pointer"
                  title="Direct URL that automatically downloads the file in browser"
                >
                  {copiedDirectLink ? <Check className="h-4 w-4 text-white" /> : <Download className="h-4 w-4" />}
                  <span>{copiedDirectLink ? 'Direct Link Copied!' : 'Copy Direct Download Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const portalUrl = getTransferPortalUrl(uploadSuccessData.transfer_key);
                    copyToClipboard(portalUrl, 'portal');
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold border border-slate-300 shadow-2xs transition-all cursor-pointer"
                  title="Web link to open the portal with key pre-filled"
                >
                  {copiedPortalLink ? <Check className="h-4 w-4 text-indigo-600" /> : <Share2 className="h-4 w-4" />}
                  <span>{copiedPortalLink ? 'Portal Link Copied!' : 'Copy Web Portal Link'}</span>
                </button>
              </div>

              {/* Retention & Expiration Summary Card */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 max-w-xl mx-auto text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>24-Hour Buffer Timer Activated</span>
                </div>
                <p className="text-amber-800 leading-relaxed font-normal">
                  This file will remain available for download for exactly <strong>24 hours</strong>.
                  After 24 hours, the file will be <strong>automatically deleted</strong> from the server.
                </p>
                <div className="pt-2 border-t border-amber-200/80 flex justify-between font-mono text-[11px] text-amber-900">
                  <span>Uploaded: {new Date(uploadSuccessData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-bold">Expires: {new Date(uploadSuccessData.expires_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Uploaded File Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-xl mx-auto flex items-center justify-between text-left text-xs">
                <div className="flex items-center gap-3 overflow-hidden">
                  {getFileIcon(uploadSuccessData.file_name)}
                  <div className="truncate">
                    <div className="font-extrabold text-slate-900 truncate">{uploadSuccessData.file_name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      Size: {uploadSuccessData.file_size_formatted} • By: {uploadSuccessData.sender_name}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadFile(uploadSuccessData.transfer_key)}
                  className="shrink-0 ml-3 p-2 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 text-indigo-600 transition-colors shadow-2xs"
                  title="Test Download File"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>

              {/* Reset to Send Another */}
              <div className="pt-2">
                <button
                  onClick={() => setUploadSuccessData(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold underline cursor-pointer"
                >
                  + Transfer Another File
                </button>
              </div>
            </div>
          ) : (
            /* Upload Form */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-indigo-600" />
                  Select File to Transfer
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select or drop a file to transfer. The system will generate a 3 unique number key for the receiver.
                </p>
              </div>

              {uploadError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                
                {/* Drag and drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    selectedFile 
                      ? 'border-indigo-500 bg-indigo-50/40' 
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600">
                        {getFileIcon(selectedFile.name)}
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to Transfer
                      </div>
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-indigo-600 hover:underline">
                          Click to choose a different file
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                        <UploadCloud className="h-7 w-7 text-indigo-600" />
                      </div>
                      <div>
                        <span className="font-extrabold text-indigo-600 hover:underline text-sm">
                          Click to select a file
                        </span>
                        <span className="text-slate-600 text-sm"> or drag and drop here</span>
                      </div>
                      <p className="text-slate-400 text-xs">
                        Accepts any file type: Documents, PDFs, Excel spreadsheets, ZIP archives, Images, and Datasets
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Transfer Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sender Name / Department (Optional)
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Office Admin / Ananya (GIS Dept)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Note for Receiver (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Final attendance audit register for Dec-Jan"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Buffer Policy Notice */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">24-Hour Buffer Retention:</span>
                    <span className="font-medium ml-1">
                      Files are temporarily stored on the server for 24 hours. After 24 hours, 
                      the file is automatically deleted.
                    </span>
                  </div>
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono font-bold text-slate-700">
                      <span>Uploading file...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm text-white transition-all shadow-md cursor-pointer ${
                      isUploading || !selectedFile
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Uploading File ({uploadProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 text-amber-300" />
                        <span>Upload & Generate 3-Digit Key</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      )}

      {/* 4. MODE: RECEIVE FILE */}
      {activeTab === 'receive' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-4 text-center max-w-xl mx-auto">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 mb-2">
                <Key className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Enter 3-Digit Key to Download
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Enter the unique 3 numbers provided by the sender. Files are held on the server for 24 hours before automatic deletion.
              </p>
            </div>

            {/* 3-Digit Key Input */}
            <div className="max-w-xs mx-auto space-y-3">
              <div className="relative">
                <input
                  type="text"
                  maxLength={3}
                  value={inputKey}
                  onChange={(e) => handleKeyInputChange(e.target.value)}
                  placeholder="e.g. 742"
                  autoFocus
                  className="w-full text-center text-4xl sm:text-5xl font-mono font-black tracking-[0.5em] px-4 py-3 rounded-2xl border-2 border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 text-indigo-950 bg-slate-50 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                <span>Must be 3 unique digits</span>
                <span className="font-mono font-bold text-indigo-600">{inputKey.length} / 3 Digits</span>
              </div>

              <button
                onClick={() => lookupFileByKey(inputKey)}
                disabled={inputKey.length !== 3 || isCheckingKey}
                className={`w-full py-2.5 rounded-xl font-extrabold text-xs text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                  inputKey.length === 3 && !isCheckingKey
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {isCheckingKey ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying Key...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span>Retrieve File</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Display */}
            {receiverError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl max-w-lg mx-auto text-xs space-y-1 animate-fadeIn">
                <div className="font-extrabold flex items-center gap-1.5 text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Transfer Lookup Failed</span>
                </div>
                <p className="text-rose-800 leading-relaxed font-normal">
                  {receiverError}
                </p>
              </div>
            )}

            {/* VERIFIED FILE RESULT CARD */}
            {receiverFile && (
              <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-2xl border-2 border-emerald-400 p-6 max-w-xl mx-auto shadow-md space-y-5 animate-scaleUp">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    KEY VERIFIED: {receiverFile.transfer_key}
                  </span>

                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    Downloads: {receiverFile.download_count}
                  </span>
                </div>

                {/* File Header */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0">
                    {getFileIcon(receiverFile.file_name)}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 break-words">
                      {receiverFile.file_name}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono">
                      File Size: <strong className="text-slate-800">{receiverFile.file_size_formatted}</strong>
                    </div>
                    <div className="text-xs text-slate-600">
                      Sent by: <strong className="text-indigo-700">{receiverFile.sender_name}</strong>
                    </div>
                    {receiverFile.notes && (
                      <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 italic">
                        "{receiverFile.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Remaining Buffer Timer Progress */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-800 font-bold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span>24-Hour Buffer Time Remaining:</span>
                    </span>
                    <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {receiverFile.time_remaining_formatted}
                    </span>
                  </div>

                  {/* Progress bar of 24h retention */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${Math.max(5, receiverFile.percent_remaining)}%` }}
                    ></div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Uploaded: {new Date(receiverFile.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>Deletes: {new Date(receiverFile.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Download CTA */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href={getTransferDownloadUrl(receiverFile.transfer_key)}
                    download={receiverFile.file_name}
                    onClick={() => {
                      setIsDownloading(true);
                      setTimeout(() => {
                        setIsDownloading(false);
                        fetchActiveTransfers();
                      }, 2000);
                    }}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download File Now ({receiverFile.file_size_formatted})</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const directUrl = getTransferDirectDownloadUrl(receiverFile.transfer_key);
                      copyToClipboard(directUrl, 'direct');
                    }}
                    className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    title="Copy direct download link that triggers file download in browser"
                  >
                    {copiedDirectLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedDirectLink ? 'Link Copied!' : 'Copy Direct Download URL'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ACTIVE TRANSFERS REGISTRY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-600" />
              Active Transfers (24-Hour Retention)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Files currently available for download. Each file is automatically deleted after 24 hours.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerCleanup}
              title="Purge expired files immediately"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Purge Expired</span>
            </button>

            <button
              onClick={fetchActiveTransfers}
              disabled={isLoadingTransfers}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Refresh Transfers"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingTransfers ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {activeTransfers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs space-y-2">
            <Clock className="h-8 w-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No active files in the 24-hour transfer buffer.</p>
            <p className="text-[11px]">Upload a file above to generate a 3 unique number key.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-3">3-Digit Key</th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Sender</th>
                  <th className="py-2.5 px-3">Buffer Remaining</th>
                  <th className="py-2.5 px-3">Downloads</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTransfers.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    {/* Key badge */}
                    <td className="py-2.5 px-3 font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-amber-300 font-black text-xs shadow-2xs">
                        {item.transfer_key}
                      </span>
                    </td>

                    {/* File Name */}
                    <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        {getFileIcon(item.file_name)}
                        <span className="truncate">{item.file_name}</span>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {item.file_size_formatted}
                    </td>

                    {/* Sender */}
                    <td className="py-2.5 px-3 text-slate-700">
                      {item.sender_name}
                    </td>

                    {/* Buffer Remaining */}
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                        <Clock className="h-3 w-3 text-amber-600" />
                        {item.time_remaining_formatted}
                      </span>
                    </td>

                    {/* Downloads */}
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {item.download_count}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyToClipboard(item.transfer_key, 'key')}
                          title="Copy Key"
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setInputKey(item.transfer_key);
                            setActiveTab('receive');
                            lookupFileByKey(item.transfer_key);
                          }}
                          title="Load in Receiver"
                          className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>

                        <a
                          href={getTransferDownloadUrl(item.transfer_key)}
                          download={item.file_name}
                          onClick={() => {
                            setTimeout(fetchActiveTransfers, 2000);
                          }}
                          title="Download File directly"
                          className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>

                        <button
                          onClick={() => copyToClipboard(getTransferDirectDownloadUrl(item.transfer_key), 'direct')}
                          title="Copy Direct Download URL"
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>

                        {(user?.role === 'Super Admin' || user?.role === 'Office Admin' || user?.role === 'IMS Admin') && (
                          <button
                            onClick={() => handleDeleteTransfer(item.transfer_key)}
                            title="Purge File Early"
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
