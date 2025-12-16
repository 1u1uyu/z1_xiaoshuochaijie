import React from 'react';
import { EpisodeOutline, GeneratedScript } from '../types';
import { FileText, CheckCircle2, PlayCircle, Loader2, Sparkles, Download } from 'lucide-react';

interface EpisodeGridProps {
  outline: EpisodeOutline[];
  scripts: Record<number, GeneratedScript>;
  onSelectEpisode: (episode: EpisodeOutline) => void;
  onExport: () => void;
}

export const EpisodeGrid: React.FC<EpisodeGridProps> = ({ outline, scripts, onSelectEpisode, onExport }) => {
  return (
    <div className="pb-20 px-4">
      {/* Grid Header with Export Button */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">剧集大纲</h2>
          <p className="text-slate-400 mt-1">
            共 {outline.length} 集 • 每集约 2-3 分钟
          </p>
        </div>
        <button
          onClick={onExport}
          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
        >
          <Download className="w-4 h-4 mr-2" />
          导出剧情大纲 (Word)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {outline.map((ep) => {
          const scriptStatus = scripts[ep.episodeNumber];
          const hasScript = scriptStatus && scriptStatus.content && !scriptStatus.isGenerating;
          const isGenerating = scriptStatus && scriptStatus.isGenerating;

          return (
            <div 
              key={ep.episodeNumber}
              onClick={() => onSelectEpisode(ep)}
              className={`
                relative group cursor-pointer border rounded-xl p-5 transition-all duration-300 flex flex-col h-full justify-between
                ${hasScript 
                  ? 'bg-slate-800/90 border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : isGenerating
                    ? 'bg-slate-800/60 border-indigo-500/50 animate-pulse'
                    : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-indigo-400 hover:shadow-lg'}
              `}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`
                    text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider
                    ${hasScript ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}
                  `}>
                    第 {ep.episodeNumber} 集
                  </span>
                  {hasScript && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isGenerating && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                </div>
                
                <h4 className="text-lg font-bold text-slate-100 mb-2 line-clamp-2 leading-tight">
                  {ep.title}
                </h4>
                
                <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                  {ep.synopsis}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center text-sm font-medium">
                {hasScript ? (
                  <span className="text-emerald-400 flex items-center group-hover:underline">
                    <FileText className="w-4 h-4 mr-2" />
                    查看剧本
                  </span>
                ) : isGenerating ? (
                  <span className="text-indigo-400 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    创作中...
                  </span>
                ) : (
                  <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    生成分镜
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};