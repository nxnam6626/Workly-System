'use client';

import React, { useState, useRef } from 'react';
import { 
  Beaker, 
  Send, 
  FileText, 
  Key, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  Code,
  Zap,
  ChevronRight,
  Loader2,
  Copy
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const DEFAULT_PROMPT = `Bạn là một chuyên gia phân tích dữ liệu tuyển dụng (ATS Parser) cho hệ thống AI Matching. 
Nhiệm vụ của bạn là đọc nội dung CV được cung cấp và trích xuất thông tin thành một đối tượng JSON duy nhất.

LƯU Ý: Trích xuất thông tin cá nhân, kỹ năng (hard_skills, soft_skills), kinh nghiệm (total_months, roles), học vấn.
Trả về định dạng JSON hợp lệ.`;

const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (Preview)', desc: 'Thế hệ mới nhất, thông minh & nhanh' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash (Latest Stable)', desc: 'Bản ổn định nhất, cân bằng nhất' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash-Lite', desc: 'Siêu nhẹ, siêu nhanh (Experimental)' },
];

export default function AiLabPage() {
  const [model, setModel] = useState(MODELS[0].id);
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'raw'>('console');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const runTest = async () => {
    setIsLoading(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append('model', model);
    formData.append('prompt', prompt);
    if (apiKey) formData.append('apiKey', apiKey);
    if (file) formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3001/ai-lab/test', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult(response.data);
      if (response.data.success) {
        toast.success('AI Mission Completed!');
      } else {
        toast.error('Mission Failed: ' + response.data.error);
      }
    } catch (error: any) {
      toast.error('Network Error: ' + error.message);
      setResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-6 md:p-10 font-sans selection:bg-blue-500/30">
      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3">
              <Beaker className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                WORKLY AI LAB <span className="text-blue-500 text-lg">v2.0</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                <Activity size={12} className="text-green-500 animate-pulse" />
                Independent Diagnostics & Tuning Center
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="text-xs font-bold text-slate-300 uppercase letter tracking-widest">System Online</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT PANEL: CONFIG */}
          <div className="lg:col-span-4 space-y-6">
            {/* CONFIG CARD */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Zap size={18} className="text-yellow-500" />
                Mission Configuration
              </h2>

              <div className="space-y-6">
                {/* MODEL SELECTION */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Neural Model</label>
                  <div className="grid gap-2">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setModel(m.id)}
                        className={`text-left p-3 rounded-2xl border transition-all duration-300 ${
                          model === m.id 
                          ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/30' 
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[13px] font-bold ${model === m.id ? 'text-blue-400' : 'text-slate-300'}`}>{m.name}</span>
                          {model === m.id && <ChevronRight size={14} className="text-blue-400" />}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* API KEY */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Custom API Key (Optional)</label>
                  <div className="relative group">
                    <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="password"
                      placeholder="Enter Key override..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* FILE UPLOAD */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Real-world Data (CV File)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                      file ? 'bg-indigo-600/5 border-indigo-500/50' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      accept=".pdf,.docx"
                    />
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${file ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      {file ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-300">{file ? file.name : 'Drop PDF/Word here'}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Direct Binary Analysis Only'}</p>
                    </div>
                  </div>
                  {file && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-[10px] text-red-400 mt-2 hover:underline ml-1"
                    >
                      Remove file
                    </button>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={runTest}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center gap-3 text-white font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                    {isLoading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                    <span className="uppercase tracking-widest text-sm">Execute AI Mission</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SPECS CARD */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
              <h3 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-tight">Active Protocol Specs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Max Output</p>
                  <p className="text-sm font-black text-white">8,192 <span className="text-[9px] font-normal text-slate-500">TOKENS</span></p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Extraction</p>
                  <p className="text-sm font-black text-white">Direct <span className="text-[9px] font-normal text-slate-500">BINARY</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: PLAYGROUND & RESULTS */}
          <div className="lg:col-span-8 space-y-6">
            {/* PROMPT BOX */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
              <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                  <Code size={16} className="text-blue-500" />
                  Mission Prompt (Instruction)
                </h2>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setPrompt(DEFAULT_PROMPT)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest px-2 py-1 bg-slate-800 rounded-lg"
                   >
                     Reset to ATS Parser
                   </button>
                </div>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your instruction for the AI..."
                className="w-full bg-slate-950/30 min-h-[180px] p-6 text-sm text-slate-300 focus:outline-none focus:bg-slate-950/50 transition-all font-mono leading-relaxed"
              />
            </div>

            {/* RESULTS VIEW */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden min-h-[400px] flex flex-col shadow-2xl">
              <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => setActiveTab('console')}
                    className={`text-xs font-bold transition-all px-3 py-1.5 rounded-xl ${activeTab === 'console' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Console
                   </button>
                   <button 
                    onClick={() => setActiveTab('raw')}
                    className={`text-xs font-bold transition-all px-3 py-1.5 rounded-xl ${activeTab === 'raw' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Raw JSON
                   </button>
                </div>
                {result?.data?.text && (
                  <button 
                    onClick={() => copyToClipboard(result.data.text)}
                    className="text-slate-500 hover:text-blue-400 transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>

              <div className="flex-1 bg-slate-950/50 p-6 overflow-auto font-mono text-sm leading-relaxed relative">
                {!result && !isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-40 select-none">
                    <Zap size={64} className="mb-4 stroke-[1]" />
                    <p className="font-bold tracking-widest uppercase">Waiting for Mission Start</p>
                  </div>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                    <p className="text-slate-400 animate-pulse text-xs tracking-widest font-bold uppercase">Processing Quantum Neural Patterns...</p>
                  </div>
                )}

                {result && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {result.success ? (
                      <div className="space-y-6">
                        {/* PERFORMANCE STATS */}
                        <div className="flex flex-wrap gap-4 mb-6">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black text-green-400 uppercase tracking-widest">
                            <CheckCircle2 size={12} /> Execution Successful
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest">
                            <Activity size={12} /> Latency: {result.data.metadata.durationMs}ms
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                            <Zap size={12} /> Est. {Math.round(result.data.metadata.tokenEstimate)} Tokens
                          </div>
                        </div>

                        {/* RESPONSE CONTENT */}
                        <pre className="whitespace-pre-wrap text-slate-300">
                          {activeTab === 'console' ? result.data.text : JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl">
                        <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                        <div>
                          <p className="text-red-400 font-black text-sm uppercase tracking-widest mb-2">Protocol Termination: ERROR</p>
                          <p className="text-red-500/80 text-sm leading-relaxed">{result.error}</p>
                          {result.metadata && (
                            <p className="text-red-900/40 text-[10px] mt-4 font-mono">Timestamp: {result.metadata.timestamp}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
