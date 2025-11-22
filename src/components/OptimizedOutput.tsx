'use client';

/**
 * OptimizedOutput Component
 *
 * 最適化されたコンテンツの表示とコピー機能
 * プラットフォーム別プレビュー対応
 */

import { useState, useCallback } from 'react';
import type { Platform, BuzzAnalysis, OptimizedContent, PostMode } from '../types/index';

interface OptimizedOutputProps {
  analysis: BuzzAnalysis | null;
  onOptimize: (
    analysis: BuzzAnalysis,
    platform: Platform,
    mode: PostMode
  ) => Promise<OptimizedContent>;
}

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  threads: {
    label: 'Threads',
    icon: '@',
    color: 'text-white',
    bgColor: 'bg-gradient-to-r from-gray-800 to-gray-900',
  },
  instagram: {
    label: 'Instagram',
    icon: 'IG',
    color: 'text-pink-400',
    bgColor: 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400',
  },
  twitter: {
    label: 'Twitter/X',
    icon: 'X',
    color: 'text-blue-400',
    bgColor: 'bg-black',
  },
};

export default function OptimizedOutput({
  analysis,
  onOptimize,
}: OptimizedOutputProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('threads');
  const [mode, setMode] = useState<PostMode>('impression');
  const [optimizedContent, setOptimizedContent] = useState<OptimizedContent | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!analysis) return;

    setIsOptimizing(true);
    setError(null);

    try {
      const result = await onOptimize(analysis, selectedPlatform, mode);
      setOptimizedContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!optimizedContent) return;

    const textToCopy = `${optimizedContent.content}\n\n${optimizedContent.hashtags
      .map((tag) => `#${tag}`)
      .join(' ')}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [optimizedContent]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!analysis) {
    return (
      <div className="glass rounded-2xl p-6 opacity-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-xl text-white/50">2</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white/50">
              プラットフォーム最適化
            </h2>
            <p className="text-white/30 text-sm">
              まず上でバズ投稿を分析してください
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
          <span className="text-xl">2</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            ガッチャンコして最適化
          </h2>
          <p className="text-white/60 text-sm">
            バズノウハウ x プラットフォーム最適な言い回し
          </p>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-300 mb-1">
              分析完了: ノウハウを抽出しました
            </h4>
            <p className="text-xs text-green-200/70 line-clamp-2">
              {analysis.transcript.substring(0, 100)}...
            </p>
          </div>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          最適化先プラットフォーム
        </label>
        <div className="flex gap-3">
          {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((platform) => {
            const config = PLATFORM_CONFIG[platform];
            return (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                disabled={isOptimizing}
                className={`flex-1 py-3 px-4 rounded-xl border transition flex items-center justify-center gap-2 ${
                  selectedPlatform === platform
                    ? 'bg-blue-500/30 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className={`font-mono text-sm ${config.color}`}>
                  {config.icon}
                </span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          投稿モード
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setMode('impression')}
            disabled={isOptimizing}
            className={`flex-1 py-3 px-4 rounded-xl border transition ${
              mode === 'impression'
                ? 'bg-purple-500/30 border-purple-500 text-white'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="text-left">
              <div className="font-medium">インプレッション重視</div>
              <div className="text-xs opacity-70">多くの人に届ける</div>
            </div>
          </button>
          <button
            onClick={() => setMode('expression')}
            disabled={isOptimizing}
            className={`flex-1 py-3 px-4 rounded-xl border transition ${
              mode === 'expression'
                ? 'bg-pink-500/30 border-pink-500 text-white'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="text-left">
              <div className="font-medium">自己表現重視</div>
              <div className="text-xs opacity-70">個性を出す</div>
            </div>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      )}

      {/* Optimize Button */}
      <button
        onClick={handleOptimize}
        disabled={isOptimizing}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 ${
          isOptimizing
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 glow-blue'
        }`}
      >
        {isOptimizing ? (
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
            <span>最適化中...</span>
          </>
        ) : (
          <>
            <span>ガッチャンコ!</span>
            <span className="text-xl">-&gt;</span>
            <span>{PLATFORM_CONFIG[selectedPlatform].label}用に変換</span>
          </>
        )}
      </button>

      {/* Optimized Content Output */}
      {optimizedContent && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              最適化されたコンテンツ
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span>推定インプレッション:</span>
              <span className="text-green-400 font-medium">
                {optimizedContent.expectedImpressions.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Platform Preview */}
          <div
            className={`rounded-xl p-4 ${PLATFORM_CONFIG[optimizedContent.targetPlatform].bgColor}`}
          >
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/20">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm font-bold">
                  {PLATFORM_CONFIG[optimizedContent.targetPlatform].icon}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {PLATFORM_CONFIG[optimizedContent.targetPlatform].label}
                  {' '}Preview
                </div>
                <div className="text-xs text-white/60">
                  {optimizedContent.mode === 'impression'
                    ? 'Impression Mode'
                    : 'Expression Mode'}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="text-white whitespace-pre-wrap text-sm leading-relaxed">
              {optimizedContent.content}
            </div>

            {/* Hashtags */}
            {optimizedContent.hashtags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <div className="flex flex-wrap gap-2">
                  {optimizedContent.hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-blue-300 hover:text-blue-200 cursor-pointer text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-green-500/30 border border-green-500 text-green-300'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {copied ? (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
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
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>

            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="py-3 px-4 rounded-xl font-medium bg-white/10 border border-white/20 text-white hover:bg-white/20 transition flex items-center gap-2"
            >
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Regenerate</span>
            </button>
          </div>

          {/* Best Post Time */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-xs text-yellow-300/70">
                おすすめの投稿時間
              </div>
              <div className="text-sm font-medium text-yellow-200">
                {formatDate(optimizedContent.bestPostTime)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
