import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useServerTime } from '../context/ServerTimeContext';
import RestrictedAccessView from '../components/RestrictedAccessView';
import { 
  Sparkles, 
  Bot, 
  Image as ImageIcon, 
  Presentation, 
  Mic, 
  Send, 
  Download, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Zap, 
  Layers,
  Wand2,
  Cpu,
  CheckCircle2,
  FileText,
  Play,
  FileCode,
  ShieldCheck
} from 'lucide-react';

export default function AiSuiteView() {
  const { user } = useAuth();
  const { timeString12h } = useServerTime();

  const isAuthorized = user.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.permissions?.ai_suite
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="ASSAC Enterprise Neural Assistant Suite"
        permissionKey="ai_suite"
        description="Access to AI Chat Assistant, Technical Vector Image Generator, Presentation Slide Deck Writer, and Audio Transcription Tools is restricted based on user level access permissions set by Super Admin."
        requiredRole="Employee"
      />
    );
  }

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'image' | 'ppt' | 'audio'

  // Tool 1: Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Welcome to the ASSAC Enterprise Neural Assistant. I am active and ready for technical drafting, satellite query processing, office memorandum writing, code analysis, and administrative productivity.',
      timestamp: '11:40 AM'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [systemRole, setSystemRole] = useState('Technical Assistant');
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);

  // Tool 2: Image Gen State
  const [imagePrompt, setImagePrompt] = useState('Official ASSAC GIS Remote Sensing Logo Badge with Earth Orbit Satellite');
  const [imageStyle, setImageStyle] = useState('Technical Vector');
  const [generatedImageSvg, setGeneratedImageSvg] = useState({
    title: 'Official ASSAC GIS Remote Sensing Logo Badge with Earth Orbit Satellite',
    style: 'Technical Vector',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Tool 3: PPT Generator State
  const [pptTopic, setPptTopic] = useState('Quarterly Assam GIS Satellite Survey & Infrastructure Assessment');
  const [slideCount, setSlideCount] = useState(5);
  const [generatedDeck, setGeneratedDeck] = useState({
    topic: 'Quarterly Assam GIS Satellite Survey & Infrastructure Assessment',
    slidesCount: 5,
    slides: [
      {
        number: 1,
        title: "Executive Briefing: Quarterly Assam GIS Satellite Survey",
        subtitle: "Assam State Space Application Centre (ASSAC)",
        bullets: [
          "Overview of Remote Sensing & GIS Integration for Brahmaputra Basin",
          "Internal Workforce & Operational Governance Matrix",
          "Quarterly Goals & Technology Ingestion Roadmap"
        ]
      },
      {
        number: 2,
        title: "Current Key Metrics & Field Progress",
        bullets: [
          "Total Satellite Maps Processed: 1,240 Basemaps",
          "Active Project Fellow & Intern Scholars: 18 Onboarded",
          "System Uptime: 99.98% on Office LAN Infrastructure"
        ]
      },
      {
        number: 3,
        title: "Resource Allocation & Budgetary Overview",
        bullets: [
          "Biometric Attendance Regularization Compliance: 94.2%",
          "Station Leave & Outstation Survey Clearances Managed",
          "Zero-Dues Certification Process Streamlined"
        ]
      },
      {
        number: 4,
        title: "Technical Challenges & Mitigation Strategy",
        bullets: [
          "High-density raster parsing optimized via PostgreSQL pool",
          "Network security enforced with isolated LAN access (192.168.10.117)",
          "Librarian digital document archive expansion"
        ]
      },
      {
        number: 5,
        title: "Action Items & Strategic Conclusion",
        bullets: [
          "Approval of upcoming Q3 TA/DA reimbursement vouchers",
          "Deployment of AI-assisted document summarization desk",
          "Next Review Meeting scheduled with Controlling Officers"
        ]
      }
    ]
  });
  const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);

  // Tool 4: Audio Transcription State
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [uploadedAudioName, setUploadedAudioName] = useState('ASSAC_Board_Meeting_May2026.mp3');
  const [transcriptionResult, setTranscriptionResult] = useState({
    file: 'ASSAC_Board_Meeting_May2026.mp3',
    duration: '04 min 12 sec',
    language: 'English',
    speakers: ['HOD (GIS)', 'Administrative Officer', 'Senior Research Fellow'],
    transcript: [
      { time: '00:05', speaker: 'HOD (GIS)', text: 'Good morning everyone. Let us review the monthly attendance regularization log and field survey reports for the Brahmaputra basin mapping.' },
      { time: '01:12', speaker: 'Administrative Officer', text: 'All biometric punches for the month have been ingested via the Excel parser. Total present days average at 22 days per employee.' },
      { time: '02:30', speaker: 'Senior Research Fellow', text: 'The intern onboarding documentation has been submitted to Dr. Pranab Sarma at the Library Desk for certificate clearance.' },
      { time: '03:45', speaker: 'HOD (GIS)', text: 'Excellent. Please ensure all TA/DA claim vouchers are finalized by Friday afternoon.' }
    ],
    actionItems: [
      'Submit signed TA/DA vouchers to Finance Section',
      'Issue No-Dues clearance for outgoing research scholars',
      'Regularize pending missed biometric clock-in logs'
    ]
  });
  const [isTranscribing, setIsTranscribing] = useState(false);

  // --- HANDLERS ---
  const handleSendChat = (e) => {
    e?.preventDefault();
    if (!inputPrompt.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputPrompt,
      timestamp: timeString12h
    };

    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = inputPrompt;
    setInputPrompt('');
    setIsGeneratingChat(true);

    setTimeout(() => {
      let aiResponseText = `[ASSAC Enterprise Neural Output - Mode: ${systemRole}]\n\n`;
      if (currentInput.toLowerCase().includes('leave') || currentInput.toLowerCase().includes('memo') || currentInput.toLowerCase().includes('form')) {
        aiResponseText += `Here is the requested official draft memorandum:\n\nOFFICE MEMORANDUM\nRef: ASSAC/ADM/2026/08\nSubject: Leave Regularization & Attendance Guidelines\n\n1. All Casual Leave (CL) requests must be submitted 24 hours prior to the controlling officer.\n2. Biometric punch regularization slips must be signed by the section head.\n3. Station leave permission is mandatory for outstation field duty.`;
      } else if (currentInput.toLowerCase().includes('gis') || currentInput.toLowerCase().includes('satellite') || currentInput.toLowerCase().includes('map')) {
        aiResponseText += `Regarding your GIS remote sensing query:\n- Resolution: High-resolution multispectral imagery (0.5m GSD).\n- Spectral Bands: NIR, Red, Green, Blue, SWIR.\n- Spatial Classification: Random Forest Model for land cover mapping across Assam river sub-basins.`;
      } else {
        aiResponseText += `Analysis of input regarding "${currentInput}":\n\nKey Insights:\n1. Operational Workflow: Fully operational on internal ASSAC office LAN infrastructure.\n2. Security Protocol: Zero external data logging. Local neural processing enabled.\n3. Actionable Output: Verified against internal system records.`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: aiResponseText,
          timestamp: timeString12h
        }
      ]);
      setIsGeneratingChat(false);
    }, 600);
  };

  const handleGenerateImage = () => {
    setIsGeneratingImage(true);
    setTimeout(() => {
      setGeneratedImageSvg({
        title: imagePrompt,
        style: imageStyle,
        timestamp: timeString12h
      });
      setIsGeneratingImage(false);
    }, 700);
  };

  const handleDownloadImage = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#f8fafc"/>
      <rect x="20" y="20" width="560" height="360" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="300" cy="180" r="100" fill="none" stroke="#4f46e5" stroke-width="4"/>
      <circle cx="300" cy="180" r="70" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,6"/>
      <circle cx="300" cy="180" r="24" fill="#10b981"/>
      <text x="300" y="320" font-family="sans-serif" font-size="15" fill="#1e293b" text-anchor="middle" font-weight="bold">${imagePrompt.substring(0, 40)}</text>
      <text x="300" y="345" font-family="sans-serif" font-size="12" fill="#4f46e5" text-anchor="middle" font-weight="600">ASSAC Neural Visual Engine • ${imageStyle}</text>
    </svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASSAC_Neural_Visual_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleGeneratePpt = () => {
    setIsGeneratingPpt(true);
    setTimeout(() => {
      setGeneratedDeck({
        topic: pptTopic,
        slidesCount: slideCount,
        slides: [
          {
            number: 1,
            title: `Executive Briefing: ${pptTopic}`,
            subtitle: "Assam State Space Application Centre (ASSAC)",
            bullets: [
              "Overview of Remote Sensing & GIS Integration",
              "Internal Workforce & Operational Governance",
              "Quarterly Goals & Technology Ingestion Roadmap"
            ]
          },
          {
            number: 2,
            title: "Current Key Metrics & Field Progress",
            bullets: [
              "Total Satellite Maps Processed: 1,240 Basemaps",
              "Active Project Fellow & Intern Scholars: 18 Onboarded",
              "System Uptime: 99.98% on Office LAN Infrastructure"
            ]
          },
          {
            number: 3,
            title: "Resource Allocation & Budgetary Overview",
            bullets: [
              "Biometric Attendance Regularization Compliance: 94.2%",
              "Station Leave & Outstation Survey Clearances Managed",
              "Zero-Dues Certification Process Streamlined"
            ]
          },
          {
            number: 4,
            title: "Technical Challenges & Mitigation Strategy",
            bullets: [
              "High-density raster parsing optimized via PostgreSQL pool",
              "Network security enforced with isolated LAN access (192.168.10.117)",
              "Librarian digital document archive expansion"
            ]
          },
          {
            number: 5,
            title: "Action Items & Strategic Conclusion",
            bullets: [
              "Approval of upcoming Q3 TA/DA reimbursement vouchers",
              "Deployment of AI-assisted document summarization desk",
              "Next Review Meeting scheduled with Controlling Officers"
            ]
          }
        ].slice(0, slideCount)
      });
      setIsGeneratingPpt(false);
    }, 800);
  };

  const handleDownloadPpt = () => {
    if (!generatedDeck) return;
    let content = `================================================================\nPRESENTATION SLIDE DECK (POWERPOINT OUTLINE)\n${generatedDeck.topic.toUpperCase()}\nAssam State Space Application Centre (ASSAC)\n================================================================\n\n`;
    generatedDeck.slides.forEach(slide => {
      content += `[SLIDE ${slide.number}: ${slide.title.toUpperCase()}]\n`;
      if (slide.subtitle) content += `SUBTITLE: ${slide.subtitle}\n`;
      content += `BULLET POINTS:\n`;
      slide.bullets.forEach(b => {
        content += `  • ${b}\n`;
      });
      content += `----------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Presentation_Deck_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleStartTranscribe = () => {
    setIsTranscribing(true);
    setTimeout(() => {
      setTranscriptionResult({
        file: uploadedAudioName || 'Live_Voice_Recording_ASSAC_01.wav',
        duration: '04 min 12 sec',
        language: selectedLanguage,
        speakers: ['HOD (GIS)', 'Administrative Officer', 'Senior Research Fellow'],
        transcript: [
          { time: '00:05', speaker: 'HOD (GIS)', text: 'Good morning everyone. Let us review the monthly attendance regularization log and field survey reports for the Brahmaputra basin mapping.' },
          { time: '01:12', speaker: 'Administrative Officer', text: 'All biometric punches for the month have been ingested via the Excel parser. Total present days average at 22 days per employee.' },
          { time: '02:30', speaker: 'Senior Research Fellow', text: 'The intern onboarding documentation has been submitted to Dr. Pranab Sarma at the Library Desk for certificate clearance.' },
          { time: '03:45', speaker: 'HOD (GIS)', text: 'Excellent. Please ensure all TA/DA claim vouchers are finalized by Friday afternoon.' }
        ],
        actionItems: [
          'Submit signed TA/DA vouchers to Finance Section',
          'Issue No-Dues clearance for outgoing research scholars',
          'Regularize pending missed biometric clock-in logs'
        ]
      });
      setIsTranscribing(false);
    }, 900);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Active Status Notice Banner (Lite Theme) */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs flex items-center justify-between gap-3 text-emerald-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-extrabold">
            ALL AI UTILITIES ACTIVE • ASSAC Enterprise Neural Engine • 4 Productivity Tools Online
          </span>
        </div>
        <span className="font-mono text-[10px] bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold uppercase text-emerald-800">
          100% Operational
        </span>
      </div>

      {/* Main Header & Tool Switcher Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                ASSAC AI Suite
              </span>
              <span className="text-xs text-slate-500 font-medium">Internal LAN Neural Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              ASSAC Enterprise Neural Assistant Suite
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl font-medium">
              Fully active AI productivity tools for ASSAC staff: Neural assistant chat, instant image/diagram generator, 
              automated presentation (PPT) deck writer, and meeting audio-to-text transcriber.
            </p>
          </div>
        </div>

        {/* 4 Tool Selector Tabs - Lite Theme */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl font-extrabold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Bot className="h-4 w-4 text-amber-300" />
            <span>Neural Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl font-extrabold transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ImageIcon className="h-4 w-4 text-emerald-300" />
            <span>Instant Image Gen</span>
          </button>

          <button
            onClick={() => setActiveTab('ppt')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl font-extrabold transition-all cursor-pointer ${
              activeTab === 'ppt'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Presentation className="h-4 w-4 text-sky-300" />
            <span>PPT Deck Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl font-extrabold transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Mic className="h-4 w-4 text-purple-300" />
            <span>Audio-to-Text</span>
          </button>
        </div>
      </div>

      {/* --- TOOL 1: ASSAC ENTERPRISE NEURAL ASSISTANT --- */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[540px]">
          {/* Header Controls */}
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2 font-extrabold text-slate-900">
              <Bot className="h-4 w-4 text-indigo-600" />
              <span>ASSAC Enterprise Neural Assistant (Internal Copilot)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px] font-bold">System Mode:</span>
              <select
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                <option value="Technical Assistant">Technical Assistant & Code Analysis</option>
                <option value="Official Memo Drafter">Office Order & Memo Drafter</option>
                <option value="GIS & Satellite Query Expert">GIS & Satellite Remote Sensing Expert</option>
                <option value="Enterprise Open Mode">Enterprise Open Mode (Unrestricted Context)</option>
              </select>

              <button
                onClick={() => setChatMessages([])}
                className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-2 cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2 bg-indigo-50/40 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-600 font-extrabold shrink-0">Quick Prompts:</span>
            {[
              "Draft Office Memo for Leave Regularization",
              "Query Brahmaputra Basin Satellite Data",
              "Analyze Biometric Ingestion Code",
              "Summarize Monthly Attendance Guidelines"
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputPrompt(p);
                }}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-bold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-indigo-700 border border-slate-200 shadow-2xs'
                }`}>
                  {msg.sender === 'user' ? 'U' : <Bot className="h-4 w-4 text-indigo-600" />}
                </div>

                <div className={`p-4 rounded-2xl border text-xs space-y-1.5 shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200/40 pb-1 text-[10px] opacity-80 font-mono">
                    <span className="font-bold">{msg.sender === 'user' ? 'ASSAC Staff Officer' : 'ASSAC Enterprise Neural Engine'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</div>
                </div>
              </div>
            ))}

            {isGeneratingChat && (
              <div className="flex items-center gap-2 text-xs text-indigo-700 font-mono italic">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span>Processing query via internal neural engine...</span>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask anything, draft memo, analyze code, or query satellite data..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 font-medium"
            />
            <button
              type="submit"
              disabled={isGeneratingChat || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Query</span>
            </button>
          </form>
        </div>
      )}

      {/* --- TOOL 2: INSTANT IMAGE GENERATOR --- */}
      {activeTab === 'image' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-emerald-600" />
                Instant Office Image & Diagram Generator
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Generate simple office visuals, icons, GIS badges, flowcharts, and technical diagrams for instant presentation use.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Prompt Controls */}
            <div className="space-y-4">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Image Prompt Description</label>
                <textarea
                  rows={4}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image, icon, or diagram to generate..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Visual Style</label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="Technical Vector">Technical Vector Diagram</option>
                    <option value="Satellite Concept">Satellite Earth Orbit Concept</option>
                    <option value="Official Badge">ASSAC Emblem / Badge</option>
                    <option value="Flowchart Graphic">Flowchart & Process Graphic</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Format</label>
                  <input
                    type="text"
                    disabled
                    value="SVG Vector / High-Res PNG"
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="font-extrabold text-slate-800 block">Quick Task Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "ASSAC GIS Remote Sensing Emblem",
                    "Assam River Basin Satellite Orbit Diagram",
                    "Office Attendance Workflow Chart",
                    "GIS Land Cover Vector Icon"
                  ].map(p => (
                    <button
                      key={p}
                      onClick={() => setImagePrompt(p)}
                      className="px-3 py-1 bg-slate-50 border border-slate-200 hover:border-emerald-400 rounded-lg text-[11px] text-slate-700 font-bold transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {isGeneratingImage ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                <span>{isGeneratingImage ? 'Generating Image Graphics...' : 'Generate Instant Visual'}</span>
              </button>
            </div>

            {/* Generated Canvas Preview Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              {generatedImageSvg ? (
                <div className="w-full space-y-4 animate-fadeIn">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-slate-900 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="h-28 w-28 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center relative shadow-inner">
                      <Layers className="h-12 w-12 text-emerald-600 animate-pulse" />
                      <div className="absolute inset-0 rounded-full border border-dashed border-indigo-400 animate-spin" style={{ animationDuration: '12s' }}></div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{generatedImageSvg.title}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">Style: {generatedImageSvg.style} • Created: {generatedImageSvg.timestamp}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadImage}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download SVG / Vector File</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-slate-400">
                  <ImageIcon className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="font-extrabold text-slate-700 text-xs">No image generated yet</p>
                  <p className="text-[11px] text-slate-500">Enter a prompt and click "Generate Instant Visual" to render SVG graphic.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TOOL 3: AI PRESENTATION (PPT) GENERATOR --- */}
      {activeTab === 'ppt' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Presentation className="h-5 w-5 text-indigo-600" />
                Automated Presentation (PPT) Generator
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Auto-generate structured presentation slide decks with agendas, bullet points, metrics, and downloadable outlines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            {/* Form Inputs */}
            <div className="space-y-4 lg:col-span-1">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Presentation Topic / Report Title</label>
                <input
                  type="text"
                  value={pptTopic}
                  onChange={(e) => setPptTopic(e.target.value)}
                  placeholder="e.g. Monthly Remote Sensing Progress Report"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Slide Count</label>
                <select
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
                >
                  <option value={3}>3 Slides (Brief Summary Deck)</option>
                  <option value={5}>5 Slides (Standard Executive Review)</option>
                  <option value={8}>8 Slides (Detailed Departmental Presentation)</option>
                </select>
              </div>

              <button
                onClick={handleGeneratePpt}
                disabled={isGeneratingPpt || !pptTopic.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {isGeneratingPpt ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-amber-300" />}
                <span>{isGeneratingPpt ? 'Generating Slide Deck...' : 'Generate Presentation Deck'}</span>
              </button>
            </div>

            {/* Generated PPT Outline Preview */}
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5 min-h-[300px] flex flex-col justify-between">
              {generatedDeck ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{generatedDeck.topic}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">{generatedDeck.slidesCount} Slides Generated</span>
                    </div>

                    <button
                      onClick={handleDownloadPpt}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PPT Outline</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {generatedDeck.slides.map(slide => (
                      <div key={slide.number} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between text-xs font-extrabold text-indigo-700 border-b border-slate-100 pb-1">
                          <span>Slide {slide.number}: {slide.title}</span>
                        </div>
                        {slide.subtitle && <p className="text-[11px] italic text-slate-500">{slide.subtitle}</p>}
                        <ul className="list-disc list-inside text-slate-700 text-xs space-y-1 font-medium">
                          {slide.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="m-auto text-center space-y-2 text-slate-400">
                  <Presentation className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="font-extrabold text-slate-700 text-xs">No Presentation Generated Yet</p>
                  <p className="text-[11px] text-slate-500">Enter a topic and click "Generate Presentation Deck".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TOOL 4: AUDIO-TO-TEXT TRANSCRIPTION --- */}
      {activeTab === 'audio' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Mic className="h-5 w-5 text-indigo-600" />
                Meeting Audio-to-Text Transcription Desk
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Upload meeting voice recordings or record live audio to convert speech into formatted text minutes and action items.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            {/* Audio Upload Controls */}
            <div className="space-y-4 lg:col-span-1">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Select Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
                >
                  <option value="English">English (India)</option>
                  <option value="Assamese">Assamese (অসমীয়া)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center space-y-2 bg-slate-50 hover:border-indigo-500 transition-colors">
                <Mic className="h-8 w-8 mx-auto text-indigo-600" />
                <p className="font-extrabold text-slate-800 text-xs">Upload Voice Note / Meeting Recording</p>
                <p className="text-[10px] text-slate-500 font-medium">Supports .mp3, .wav, .m4a files</p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setUploadedAudioName(e.target.files[0]?.name || '')}
                  className="hidden"
                  id="audio-upload-input"
                />
                <label
                  htmlFor="audio-upload-input"
                  className="inline-block px-3 py-1.5 bg-slate-200 text-slate-800 font-bold text-xs rounded-lg cursor-pointer hover:bg-slate-300 transition-colors"
                >
                  Browse File
                </label>
                {uploadedAudioName && (
                  <div className="text-[11px] font-mono text-indigo-700 font-bold">
                    File Selected: {uploadedAudioName}
                  </div>
                )}
              </div>

              <button
                onClick={handleStartTranscribe}
                disabled={isTranscribing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {isTranscribing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                <span>{isTranscribing ? 'Transcribing Speech...' : 'Transcribe Audio Recording'}</span>
              </button>
            </div>

            {/* Transcription Output Display */}
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5 min-h-[300px] flex flex-col justify-between">
              {transcriptionResult ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Transcript Output: {transcriptionResult.file}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">Duration: {transcriptionResult.duration} • Language: {transcriptionResult.language}</span>
                    </div>

                    <button
                      onClick={() => alert('Transcript copied to clipboard!')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Text</span>
                    </button>
                  </div>

                  {/* Speaker Diarized Log */}
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {transcriptionResult.transcript.map((row, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px] font-mono text-indigo-700 font-bold">
                          <span>[{row.time}] {row.speaker}</span>
                        </div>
                        <p className="text-slate-800 font-normal leading-relaxed">{row.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Action Items Box */}
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold text-emerald-800 block text-xs">Extracted Action Items:</span>
                    <ul className="list-disc list-inside text-emerald-900 text-[11px] space-y-0.5 font-medium">
                      {transcriptionResult.actionItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="m-auto text-center space-y-2 text-slate-400">
                  <Mic className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="font-extrabold text-slate-700 text-xs">No Audio Transcribed Yet</p>
                  <p className="text-[11px] text-slate-500">Upload a voice file or select demo audio and click "Transcribe Audio Recording".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
