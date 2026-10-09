import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useServerTime } from '../context/ServerTimeContext';
import RestrictedAccessView from '../components/RestrictedAccessView';
import { 
  getAiModels, 
  getAiStatus, 
  sendAiChat, 
  generateAiImage, 
  generateAiPresentation 
} from '../services/api';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  ChevronDown, 
  Plus, 
  Search, 
  MessageSquare, 
  Image as ImageIcon, 
  Presentation, 
  Code, 
  Terminal, 
  Zap, 
  ExternalLink, 
  Download, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ArrowUp, 
  PanelLeftClose, 
  PanelLeft, 
  Clock,
  Settings,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';

const DEFAULT_SYSTEM_PROMPT = `You are ASSAC-LLM (Assam State Space Application Centre Neural AI), created and developed by Pallab Jyoti Gohain from Morigaon.
You assist scientific officers, technical analysts, administrative staff, and intern scholars across ASSAC.
Your core capabilities include:
1. Remote Sensing & GIS analysis (satellite data, NDVI calculations, GeoTIFF processing, QGIS, ArcGIS, python spatial libraries).
2. Official Assam State governance (memorandums, administrative circulars, biometric attendance rules).
3. Software engineering & data pipelines (Python, Node.js, SQL, REST APIs, bash scripting).
When asked about your creator, developer, or origin, clearly state that you were created and developed by Pallab Jyoti Gohain from Morigaon.
Provide direct, highly accurate, structured, and helpful responses. Use markdown for code blocks and formatted tables.`;

const PROMPT_SUGGESTIONS = [
  {
    title: "Satellite NDVI Analysis",
    desc: "Calculate vegetation index for Brahmaputra valley",
    prompt: "Write a Python script using rasterio and numpy to calculate NDVI from Sentinel-2 Red (Band 4) and NIR (Band 8) GeoTIFF imagery."
  },
  {
    title: "Official Office Memo",
    desc: "Biometric attendance punch compliance directive",
    prompt: "Draft an official ASSAC Office Memorandum reminding all permanent staff and project fellows regarding mandatory daily biometric punch compliance and late hour regularization."
  },
  {
    title: "QGIS Automation Script",
    desc: "Batch reproject shapefiles to EPSG:32646 (UTM 46N)",
    prompt: "Create a PyQGIS script to batch reproject all shapefiles in an input folder to UTM Zone 46N (EPSG:32646) and export summary attribute tables."
  },
  {
    title: "Executive Attendance Summary",
    desc: "Analyze employee punctuality indices",
    prompt: "What are the standard operational metrics and best practices for evaluating monthly employee biometric attendance registers in government departments?"
  }
];

export default function AiSuiteView() {
  const { user } = useAuth();
  const { timeString12h } = useServerTime();

  // Authorization check
  const isSuperAdmin = user?.role === 'Super Admin' || user?.permissions?.super_admin === true;
  const isAuthorized = user?.isAuthenticated && (
    isSuperAdmin ||
    user?.permissions?.ai_suite === true
  );

  // Layout & Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMode, setActiveMode] = useState('chat'); // 'chat' | 'image' | 'presentation'
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Neural AI Model State
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('assac-llm-1.0');
  const [aiStatus, setAiStatus] = useState({ online: true, engine: 'ASSAC Enterprise Neural AI', creator: 'Pallab Jyoti Gohain, Morigaon' });

  // Map model IDs to branded enterprise names
  const getModelDisplayName = (modelId) => {
    const found = availableModels.find(m => m.id === modelId);
    if (found) return found.displayName || found.name;
    if (modelId === 'assac-llm-1.0' || modelId === '@cf/meta/llama-3.1-8b-instruct') return 'ASSAC-LLM 1.0';
    if (modelId === 'assac-llm-fast' || modelId === '@cf/meta/llama-3-8b-instruct') return 'ASSAC-LLM Fast';
    if (modelId === 'assac-reasoning-core' || modelId === '@cf/mistral/mistral-7b-instruct-v0.1') return 'ASSAC-Reasoning Core';
    if (modelId === 'assac-code-spatial' || modelId === '@cf/qwen/qwen1.5-7b-chat-awq') return 'ASSAC-Code & Spatial';
    if (modelId === 'assac-math-analytics' || modelId === '@cf/deepseek-ai/deepseek-math-7b-instruct') return 'ASSAC-Math & Analytics';
    if (modelId === 'assac-vision-engine' || modelId === '@cf/stabilityai/stable-diffusion-xl-base-1.0') return 'ASSAC-Vision Diffusion Engine';
    return 'ASSAC-LLM';
  };

  // Chat Parameters
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState(0.6);
  const [maxTokens, setMaxTokens] = useState(2048);

  // Conversations History (Open WebUI Multi-Chat Storage)
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('assac_ai_conversations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'chat-default',
        title: 'New Chat',
        createdAt: new Date().toISOString(),
        messages: []
      }
    ];
  });
  const [activeChatId, setActiveChatId] = useState(() => {
    try {
      const savedId = localStorage.getItem('assac_ai_active_chat_id');
      if (savedId) return savedId;
    } catch {}
    return 'chat-default';
  });
  const [searchFilter, setSearchFilter] = useState('');

  // Current Chat Input State
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('Technical Vector');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState(() => {
    try {
      const saved = localStorage.getItem('assac_ai_images');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Presentation State
  const [pptTopic, setPptTopic] = useState('');
  const [pptSlideCount, setPptSlideCount] = useState(5);
  const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);
  const [currentDeck, setCurrentDeck] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('assac_ai_conversations', JSON.stringify(conversations));
      localStorage.setItem('assac_ai_active_chat_id', activeChatId);
    } catch {}
  }, [conversations, activeChatId]);

  // Sync images to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('assac_ai_images', JSON.stringify(generatedImages));
    } catch {}
  }, [generatedImages]);

  // Load Models & Status on Mount
  useEffect(() => {
    getAiModels()
      .then(res => {
        if (res.success && res.data) setAvailableModels(res.data);
      })
      .catch(() => {});

    getAiStatus()
      .then(res => {
        if (res.success && res.data) setAiStatus(res.data);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeChatId, isGenerating]);

  // Current active conversation
  const activeConversation = conversations.find(c => c.id === activeChatId) || conversations[0] || {
    id: 'chat-default',
    title: 'New Chat',
    messages: []
  };

  // Create New Chat
  const handleCreateNewChat = () => {
    const newChat = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      messages: []
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setActiveMode('chat');
  };

  // Delete Conversation
  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== chatId);
      if (filtered.length === 0) {
        const replacement = {
          id: `chat-${Date.now()}`,
          title: 'New Chat',
          createdAt: new Date().toISOString(),
          messages: []
        };
        setActiveChatId(replacement.id);
        return [replacement];
      }
      if (activeChatId === chatId) {
        setActiveChatId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Send Message
  const handleSendMessage = async (textToSend = inputMessage) => {
    const text = textToSend.trim();
    if (!text || isGenerating) return;

    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
    };

    // Update conversation title if this is the first message
    const isFirstMessage = activeConversation.messages.length === 0;
    const newTitle = isFirstMessage ? (text.length > 32 ? text.slice(0, 32) + '...' : text) : activeConversation.title;

    const updatedMessages = [...activeConversation.messages, userMessage];

    setConversations(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          title: newTitle,
          messages: updatedMessages
        };
      }
      return c;
    }));

    setIsGenerating(true);

    try {
      const res = await sendAiChat({
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        model: selectedModel,
        systemPrompt,
        temperature,
        maxTokens
      });

      const assistantMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: res.text || 'No response generated.',
        model: res.model || selectedModel,
        timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
      };

      setConversations(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...c.messages, assistantMessage]
          };
        }
        return c;
      }));
    } catch (err) {
      const errorMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        isError: true,
        content: `Error: Unable to connect to ASSAC Neural Engine (${err.message}). Verify server status and network connection.`,
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
      };

      setConversations(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...c.messages, errorMessage]
          };
        }
        return c;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcut in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle textarea auto-resize
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  // Copy message text to clipboard
  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Handle Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);

    try {
      const res = await generateAiImage({
        prompt: imagePrompt.trim(),
        model: 'assac-vision-engine',
        style: imageStyle
      });

      if (res.success && res.dataUrl) {
        const newImg = {
          id: `img-${Date.now()}`,
          prompt: res.prompt,
          style: res.style,
          dataUrl: res.dataUrl,
          createdAt: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
        };
        setGeneratedImages(prev => [newImg, ...prev]);
      }
    } catch (err) {
      alert(`Image generation failed: ${err.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle Presentation Generation
  const handleGenerateDeck = async () => {
    if (!pptTopic.trim() || isGeneratingPpt) return;
    setIsGeneratingPpt(true);

    try {
      const res = await generateAiPresentation({
        topic: pptTopic.trim(),
        slideCount: pptSlideCount
      });

      if (res.success && res.deck) {
        setCurrentDeck(res.deck);
      }
    } catch (err) {
      alert(`Presentation generation failed: ${err.message}`);
    } finally {
      setIsGeneratingPpt(false);
    }
  };

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="ASSAC Enterprise Neural Assistant Suite"
        permissionKey="ai_suite"
        description="Access to AI Chat Assistant, Technical Image Generator, and Slide Deck Writer is restricted."
        requiredRole="Employee"
      />
    );
  }

  // Filtered conversations for sidebar search
  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-5.5rem)] rounded-2xl overflow-hidden border border-slate-700/60 bg-[#0d1117] text-slate-100 shadow-2xl relative font-sans animate-fadeIn">
      
      {/* ============================================================ */}
      {/* 1. OPEN WEBUI COLLAPSIBLE SIDEBAR */}
      {/* ============================================================ */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } transition-all duration-300 ease-in-out shrink-0 bg-[#161b22] border-r border-slate-800 flex flex-col overflow-hidden z-20`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white tracking-tight">Open WebUI</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  ASSAC AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">ASSAC Neural Hub</p>
            </div>
          </div>

          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleCreateNewChat}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm hover:shadow-indigo-500/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-700/60 px-1.5 py-0.5 rounded text-indigo-200">
              Ctrl+K
            </span>
          </button>
        </div>

        {/* Search Chats Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0d1117] border border-slate-800 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Conversations ({filteredConversations.length})
          </div>

          {filteredConversations.map(chat => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  setActiveMode('chat');
                }}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{chat.title || 'Untitled Conversation'}</span>
                </div>

                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-all shrink-0 cursor-pointer"
                  title="Delete Conversation"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer: Engine Status & Parameters */}
        <div className="p-3 border-t border-slate-800/80 bg-[#11161d] space-y-2">
          {/* Neural Engine Connectivity Pill */}
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-[#0d1117] border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-slate-300">ASSAC Neural Engine</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400">Online</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center font-bold text-xs text-indigo-200">
                {user.name ? user.name[0] : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user.name || user.username}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{user.role}</p>
              </div>
            </div>

            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Assistant Parameters & System Instructions"
            >
              <Sliders className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN OPEN WEBUI PLAYGROUND AREA */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] relative">
        
        {/* Top Open WebUI Control Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-[#161b22]/90 backdrop-blur-md px-4 flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}

            {/* Model Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 shadow-2xs hover:border-slate-700 transition-colors">
              <Cpu className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer text-xs pr-1"
              >
                {availableModels.length > 0 ? (
                  availableModels
                    .filter(m => m.id !== '@cf/stabilityai/stable-diffusion-xl-base-1.0')
                    .map(m => (
                      <option key={m.id} value={m.id} className="bg-[#161b22] text-white">
                        {m.name || m.displayName}
                      </option>
                    ))
                ) : (
                  <>
                    <option value="assac-llm-1.0" className="bg-[#161b22] text-white">
                      ASSAC-LLM 1.0 (Flagship)
                    </option>
                    <option value="assac-llm-fast" className="bg-[#161b22] text-white">
                      ASSAC-LLM Fast
                    </option>
                    <option value="assac-reasoning-core" className="bg-[#161b22] text-white">
                      ASSAC-Reasoning Core
                    </option>
                    <option value="assac-code-spatial" className="bg-[#161b22] text-white">
                      ASSAC-Code &amp; Spatial
                    </option>
                    <option value="assac-math-analytics" className="bg-[#161b22] text-white">
                      ASSAC-Math &amp; Analytics
                    </option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Mode Switcher Tabs (Chat / Image Studio / Slide Deck) */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'chat'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            <button
              onClick={() => setActiveMode('image')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'image'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Image Studio</span>
            </button>

            <button
              onClick={() => setActiveMode('presentation')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'presentation'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Presentation className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Presentation Deck</span>
            </button>
          </div>

          {/* Right Header Status */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-[#0d1117] border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5 text-indigo-400" />
              <span>Params</span>
            </button>
          </div>
        </header>

        {/* ============================================================ */}
        {/* MODE A: CONVERSATIONAL CHAT (OPEN WEBUI) */}
        {/* ============================================================ */}
        {activeMode === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
              
              {/* Empty State Banner (Open WebUI Home) */}
              {activeConversation.messages.length === 0 && (
                <div className="max-w-3xl mx-auto py-10 md:py-16 text-center space-y-6 animate-fadeIn">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-indigo-500/10">
                    <div className="w-full h-full bg-[#161b22] rounded-2xl flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-cyan-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      How can I help you today?
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
                      Powered by <span className="text-indigo-400 font-semibold">ASSAC-LLM</span> developed by <span className="font-semibold text-cyan-300">Pallab Jyoti Gohain from Morigaon</span>. Dedicated neural intelligence for Assam State Space Application Centre.
                    </p>
                  </div>

                  {/* Suggestion Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left max-w-2xl mx-auto">
                    {PROMPT_SUGGESTIONS.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSendMessage(item.prompt)}
                        className="p-3.5 rounded-xl bg-[#161b22] hover:bg-[#1f242d] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group shadow-2xs"
                      >
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors flex items-center justify-between">
                          <span>{item.title}</span>
                          <ArrowUp className="h-3 w-3 rotate-45 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Message Bubbles */}
              {activeConversation.messages.map(msg => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="h-8 w-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-cyan-300 mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div className={`space-y-1.5 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all ${
                          isUser
                            ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/10'
                            : msg.isError
                            ? 'bg-rose-950/40 border border-rose-800 text-rose-200 rounded-bl-xs'
                            : 'bg-[#161b22] text-slate-200 border border-slate-800 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words font-sans">
                          {msg.content}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className={`flex items-center gap-2 text-[10px] text-slate-500 px-1 font-mono ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span>{msg.timestamp}</span>
                        {!isUser && !msg.isError && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{getModelDisplayName(msg.model)}</span>
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="p-1 hover:text-slate-300 rounded transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedMessageId === msg.id ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isUser && (
                      <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-white font-bold text-xs mt-0.5">
                        {user.name ? user.name[0] : 'U'}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Generating Animation */}
              {isGenerating && (
                <div className="flex gap-3 max-w-4xl mx-auto justify-start animate-fadeIn">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-cyan-300">
                    <Sparkles className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#161b22] border border-slate-800 text-slate-300 text-xs flex items-center gap-2.5 shadow-2xs">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                    <span className="font-mono text-slate-400">
                      ASSAC Neural Engine processing with {getModelDisplayName(selectedModel)}...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Open WebUI Floating Input Bar */}
            <div className="p-4 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/90 to-transparent">
              <div className="max-w-4xl mx-auto relative bg-[#161b22] border border-slate-800 rounded-2xl p-2 shadow-xl focus-within:border-indigo-500/70 transition-colors">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${getModelDisplayName(selectedModel)}... (Shift+Enter for new line)`}
                  className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs sm:text-sm p-2 focus:outline-none resize-none max-h-48 overflow-y-auto"
                />

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 px-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-[#0d1117] border border-slate-800 text-slate-300 text-[10px]">
                      {getModelDisplayName(selectedModel)}
                    </span>
                    <span className="hidden sm:inline">• Developed by Pallab Jyoti Gohain, Morigaon</span>
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isGenerating}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      inputMessage.trim() && !isGenerating
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 text-center mt-2 font-mono">
                ASSAC Enterprise Neural AI Suite • Developed by Pallab Jyoti Gohain, Morigaon • ASSAC Intranet
              </p>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* MODE B: IMAGE STUDIO (STABLE DIFFUSION XL) */}
        {/* ============================================================ */}
        {activeMode === 'image' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
            <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">ASSAC-Vision Diffusion Studio</h3>
                    <p className="text-xs text-slate-400 font-mono">ASSAC-Vision Engine • 1024x1024 Native Visual Synthesis</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  1024x1024 Native
                </span>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Prompt Description</label>
                <textarea
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image to synthesize (e.g. Official ASSAC GIS Remote Sensing Logo Badge with Earth Orbit Satellite, 8k resolution, vector details...)"
                  className="w-full p-3 rounded-xl bg-[#0d1117] border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Style Presets */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Style Preset:</span>
                  {['Technical Vector', 'Photorealistic', 'Orbital View'].map(st => (
                    <button
                      key={st}
                      onClick={() => setImageStyle(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        imageStyle === st
                          ? 'bg-cyan-600 text-white'
                          : 'bg-[#0d1117] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || isGeneratingImage}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    imagePrompt.trim() && !isGeneratingImage
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isGeneratingImage ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Synthesizing (10-15s)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Synthesize with ASSAC-Vision</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Image Gallery */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Generated Gallery ({generatedImages.length})
              </h3>

              {generatedImages.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#161b22]/40 text-slate-500 text-xs">
                  No images synthesized yet. Enter a prompt above and click Synthesize.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map(img => (
                    <div key={img.id} className="bg-[#161b22] border border-slate-800 rounded-2xl overflow-hidden group shadow-2xs">
                      <div className="relative aspect-square bg-[#0d1117] overflow-hidden">
                        <img 
                          src={img.dataUrl} 
                          alt={img.prompt} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" 
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={img.dataUrl}
                            download={`ASSAC_AI_${img.id}.png`}
                            className="p-2 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur-md transition-colors"
                            title="Download High-Res PNG"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <p className="text-xs font-bold text-white line-clamp-2">{img.prompt}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">{img.style}</span>
                          <span>{img.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE C: PRESENTATION DECK GENERATOR */}
        {/* ============================================================ */}
        {activeMode === 'presentation' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
            <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Presentation className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">ASSAC Executive Slide Deck Generator</h3>
                    <p className="text-xs text-slate-400 font-mono">Structured JSON Output via ASSAC-LLM</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-slate-300">Presentation Topic / Project Directive</label>
                  <input
                    type="text"
                    value={pptTopic}
                    onChange={(e) => setPptTopic(e.target.value)}
                    placeholder="e.g. Quarterly Assam GIS Satellite Survey & Infrastructure Assessment"
                    className="w-full p-2.5 rounded-xl bg-[#0d1117] border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Slide Count</label>
                  <select
                    value={pptSlideCount}
                    onChange={(e) => setPptSlideCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0d1117] border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {[3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n} Slides</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateDeck}
                disabled={!pptTopic.trim() || isGeneratingPpt}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  pptTopic.trim() && !isGeneratingPpt
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isGeneratingPpt ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Structuring Slide Deck...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Presentation Slides</span>
                  </>
                )}
              </button>
            </div>

            {/* Rendered Slide Deck */}
            {currentDeck && currentDeck.slides && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white">
                    {currentDeck.topic} ({currentDeck.slides.length} Slides)
                  </h3>
                  <button
                    onClick={() => {
                      const text = JSON.stringify(currentDeck, null, 2);
                      navigator.clipboard.writeText(text);
                      alert('Slide Deck JSON copied to clipboard!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#1f242d] border border-slate-800 text-xs text-slate-300 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy JSON</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentDeck.slides.map(slide => (
                    <div 
                      key={slide.number}
                      className="p-5 rounded-2xl bg-[#161b22] border border-slate-800 shadow-2xs space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          Slide #{slide.number}
                        </span>
                        <Presentation className="h-4 w-4 text-slate-600" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-white">{slide.title}</h4>
                        {slide.subtitle && (
                          <p className="text-xs text-amber-400 font-medium">{slide.subtitle}</p>
                        )}
                      </div>

                      {slide.bullets && slide.bullets.length > 0 && (
                        <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                          {slide.bullets.map((b, bi) => (
                            <li key={bi} className="flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ============================================================ */}
      {/* 3. ASSISTANT PARAMETERS & SETTINGS MODAL */}
      {/* ============================================================ */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161b22] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-400" />
                <h3 className="font-extrabold text-base text-white">Neural Assistant Parameters</h3>
              </div>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Custom System Instructions</label>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0d1117] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[10px] text-slate-400">Directs the persona and knowledge boundaries of the model.</p>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Temperature</span>
                <span className="font-mono text-indigo-400 font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.0 (Precise / Analytical)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Max Tokens</span>
                <span className="font-mono text-cyan-400 font-bold">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="512"
                max="4096"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Reset Default
              </button>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
