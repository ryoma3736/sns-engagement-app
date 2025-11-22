'use client';

/**
 * ContentAnalyzer Component
 *
 * バズ投稿のURL入力と分析結果を表示するコンポーネント
 */

import { useState, useCallback } from 'react';
import type { Platform, BuzzAnalysis } from '../types/index';

interface ContentAnalyzerProps {
  onAnalysisComplete: (analysis: BuzzAnalysis) => void;
  isLoading?: boolean;
}

interface AnalysisFormData {
  url: string;
  content: string;
  platform: Platform;
}

const PLATFORM_OPTIONS: { value: Platform; label: string; icon: string }[] = [
  { value: 'threads', label: 'Threads', icon: '@' },
  { value: 'instagram', label: 'Instagram', icon: 'IG' },
  { value: 'twitter', label: 'Twitter/X', icon: 'X' },
];

export default function ContentAnalyzer({
  onAnalysisComplete,
  isLoading = false,
}: ContentAnalyzerProps) {
  const [formData, setFormData] = useState<AnalysisFormData>({
    url: '',
    content: '',
    platform: 'threads',
  });
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleInputChange = useCallback(
    (field: keyof AnalysisFormData, value: string | Platform) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setError(null);
    },
    []
  );

  const handleAnalyze = async () => {
    if (!formData.content.trim()) {
      setError('バズ投稿の内容を入力してください');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.url || 'manual-input',
          content: formData.content,
          platform: formData.platform,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const analysis: BuzzAnalysis = await response.json();
      onAnalysisComplete(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAnalyzing(false);
    }
  };

  const isProcessing = analyzing || isLoading;

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-xl">1</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">バズ投稿を分析</h2>
          <p className="text-white/60 text-sm">
            バズっている投稿のノウハウを抽出します
          </p>
        </div>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          投稿URL（オプション）
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => handleInputChange('url', e.target.value)}
          placeholder="https://threads.net/..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          disabled={isProcessing}
        />
      </div>

      {/* Platform Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          プラットフォーム
        </label>
        <div className="flex gap-3">
          {PLATFORM_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleInputChange('platform', option.value)}
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-xl border transition flex items-center justify-center gap-2 ${
                formData.platform === option.value
                  ? 'bg-purple-500/30 border-purple-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="font-mono text-sm">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          バズ投稿の内容 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="バズっている投稿の内容をここに貼り付けてください...

例:
「副業で月100万稼げるようになった話。

1年前、貯金0円だった自分が...」"
          rows={8}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
          disabled={isProcessing}
        />
        <p className="text-xs text-white/40">
          {formData.content.length} 文字
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={isProcessing || !formData.content.trim()}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 ${
          isProcessing || !formData.content.trim()
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 glow-purple'
        }`}
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>AIが分析中...</span>
          </>
        ) : (
          <>
            <span>バズ要因を分析する</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </>
        )}
      </button>

      {/* Tips */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h4 className="text-sm font-medium text-blue-300 mb-2">
          効果的な分析のコツ
        </h4>
        <ul className="text-xs text-blue-200/80 space-y-1">
          <li>
            - 実際にバズった投稿（いいね1000+など）を選ぶと精度が上がります
          </li>
          <li>- 投稿全文をコピーしてください（省略しないこと）</li>
          <li>- 同じジャンルの複数投稿を分析するとパターンが見えてきます</li>
        </ul>
      </div>
    </div>
  );
}
