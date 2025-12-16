import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2, Settings } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (content: string, name: string, episodeCount: number) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const [episodeCount, setEpisodeCount] = useState<number>(40);
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileUpload(text, file.name, episodeCount);
    };
    reader.readAsText(file);
  }, [onFileUpload, episodeCount]);

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 100) {
      setEpisodeCount(val);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 p-8 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-4 bg-indigo-500/10 rounded-full">
          {isLoading ? (
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-indigo-400" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">上传小说文件</h3>
          <p className="text-slate-400 max-w-md">
            请选择包含小说内容的 .txt 文件。AI 将自动分析剧情并拆解为剧本大纲。
          </p>
        </div>

        {/* Episode Count Input */}
        <div className="flex items-center space-x-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">生成集数:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={episodeCount}
            onChange={handleCountChange}
            disabled={isLoading}
            className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <span className="text-sm text-slate-500">集</span>
        </div>

        <label className={`relative inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input 
            type="file" 
            accept=".txt" 
            onChange={handleFileChange} 
            disabled={isLoading}
            className="hidden" 
          />
          <FileText className="w-5 h-5 mr-2" />
          {isLoading ? '正在分析中...' : '选择文件'}
        </label>
        
        <p className="text-xs text-slate-500">
          支持 .txt 格式，建议文件大小不超过 10MB
        </p>
      </div>
    </div>
  );
};