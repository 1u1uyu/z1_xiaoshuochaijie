import React from 'react';
import { X, Copy, RefreshCw, Download, FileText } from 'lucide-react';
import { GeneratedScript, EpisodeOutline } from '../types';

interface ScriptViewerProps {
  episode: EpisodeOutline | null;
  script: GeneratedScript | undefined;
  onClose: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({ 
  episode, 
  script, 
  onClose, 
  onGenerate,
  isGenerating
}) => {
  if (!episode) return null;

  const handleCopy = () => {
    if (script?.content) {
      navigator.clipboard.writeText(script.content);
    }
  };

  const handleDownload = () => {
    if (!script?.content) return;
    const blob = new Blob([script.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Episode-${episode.episodeNumber}-${episode.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div>
            <span className="text-indigo-400 text-sm font-bold tracking-wider uppercase">
              第 {episode.episodeNumber} 集
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">{episode.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#0B1120] custom-scrollbar">
          {!script || (!script.content && !isGenerating) ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-500" />
              </div>
              <div>
                <p className="text-slate-300 text-lg font-medium">准备创作</p>
                <p className="text-slate-500 max-w-sm mt-2">
                  点击下方按钮，AI 将根据大纲为本集生成包含详细分镜、运镜指导和人物对话的剧本。
                </p>
              </div>
              <button
                onClick={onGenerate}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
              >
                生成剧本
              </button>
            </div>
          ) : (
            <div className="prose prose-invert prose-lg max-w-none">
              {isGenerating && !script.content ? (
                <div className="flex items-center space-x-3 text-indigo-400 animate-pulse">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>AI 正在撰写剧本中...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-serif text-slate-300 leading-relaxed">
                  {script.content}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {script?.content && (
          <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
            <div className="flex space-x-3">
              <button 
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                重新生成
              </button>
            </div>
            <div className="flex space-x-3">
               <button 
                onClick={handleCopy}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制文本
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Download className="w-4 h-4 mr-2" />
                导出 Markdown
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};