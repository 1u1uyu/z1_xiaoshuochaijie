import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileUpload } from './components/FileUpload';
import { EpisodeGrid } from './components/EpisodeGrid';
import { ScriptViewer } from './components/ScriptViewer';
import { generateOutline, generateEpisodeScript } from './services/geminiService';
import { generateOutlineDocx } from './services/exportService';
import { AppState, EpisodeOutline, GeneratedScript } from './types';
import { Clapperboard, BookOpen, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'upload',
    fileContent: null,
    fileName: null,
    episodeCount: 40,
    outline: [],
    scripts: {},
    isGeneratingOutline: false,
    loadingStatus: '',
    error: null,
  });

  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeOutline | null>(null);

  const handleFileUpload = async (content: string, name: string, episodeCount: number) => {
    setState(prev => ({ 
      ...prev, 
      fileContent: content, 
      fileName: name,
      episodeCount: episodeCount,
      isGeneratingOutline: true,
      loadingStatus: '正在读取小说内容...',
      error: null 
    }));

    try {
      const outline = await generateOutline(content, episodeCount, (status) => {
        setState(prev => ({ ...prev, loadingStatus: status }));
      });
      
      setState(prev => ({
        ...prev,
        step: 'outline',
        outline,
        isGeneratingOutline: false,
        loadingStatus: ''
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGeneratingOutline: false,
        loadingStatus: '',
        error: "生成大纲失败。小说篇幅可能过长，或者网络繁忙，请稍后再试。"
      }));
    }
  };

  const handleGenerateScript = async () => {
    if (!selectedEpisode || !state.fileContent) return;
    
    const epNum = selectedEpisode.episodeNumber;

    // Set generating state
    setState(prev => ({
      ...prev,
      scripts: {
        ...prev.scripts,
        [epNum]: { episodeNumber: epNum, content: '', isGenerating: true }
      }
    }));

    try {
      // Optional: Get previous episode summary context (simple lookback)
      const prevEp = state.outline.find(e => e.episodeNumber === epNum - 1);
      
      const scriptContent = await generateEpisodeScript(
        state.fileContent,
        selectedEpisode,
        state.episodeCount, // Pass total episodes for window calculation
        prevEp?.synopsis
      );

      setState(prev => ({
        ...prev,
        scripts: {
          ...prev.scripts,
          [epNum]: { episodeNumber: epNum, content: scriptContent, isGenerating: false }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        scripts: {
          ...prev.scripts,
          [epNum]: { ...prev.scripts[epNum], isGenerating: false, content: '生成剧本时发生错误，请重试。' }
        }
      }));
    }
  };

  const handleExportDocx = async () => {
    if (!state.outline.length) return;
    try {
      const blob = await generateOutlineDocx(state.outline, state.fileName?.replace('.txt', '') || '小说');
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.fileName?.replace('.txt', '') || '小说'}_短剧分集大纲.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      setState(prev => ({...prev, error: "导出 Word 文档失败，请重试。"}));
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Clapperboard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              短剧剧本生成器
            </h1>
          </div>
          {state.fileName && (
            <div className="flex items-center text-sm text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
              <BookOpen className="w-4 h-4 mr-2" />
              {state.fileName}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 w-full py-8">
        
        {state.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            {state.error}
          </div>
        )}

        {state.step === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4">小说一键转短剧</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                上传小说文本，AI 智能拆解剧情，为您生成包含详细分镜和对话的爆款短剧剧本。
              </p>
            </div>
            <FileUpload 
              onFileUpload={handleFileUpload} 
              isLoading={state.isGeneratingOutline} 
            />
            {/* Show Loading Status */}
            {state.isGeneratingOutline && state.loadingStatus && (
              <div className="mt-8 flex flex-col items-center animate-pulse">
                <div className="h-1 w-64 bg-slate-700 rounded-full overflow-hidden mb-3">
                   <div className="h-full bg-indigo-500 w-1/2 animate-[shimmer_2s_infinite]"></div>
                </div>
                <div className="text-indigo-300 font-medium">
                  {state.loadingStatus}
                </div>
              </div>
            )}
          </div>
        )}

        {state.step === 'outline' && (
          <EpisodeGrid 
            outline={state.outline} 
            scripts={state.scripts}
            onSelectEpisode={setSelectedEpisode}
            onExport={handleExportDocx}
          />
        )}
      </main>

      {/* Script Viewer Modal */}
      {selectedEpisode && (
        <ScriptViewer
          episode={selectedEpisode}
          script={state.scripts[selectedEpisode.episodeNumber]}
          onClose={() => setSelectedEpisode(null)}
          onGenerate={handleGenerateScript}
          isGenerating={state.scripts[selectedEpisode.episodeNumber]?.isGenerating || false}
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);