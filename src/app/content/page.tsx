'use client';

/**
 * Content Optimization Page
 *
 * バズ投稿を分析し、プラットフォーム別に最適化するページ
 *
 * 核心戦略:
 * - ノウハウはバズっているものから抽出
 * - プラットフォーム用の言い回しに変換
 * - ガッチャンコして載せるだけ
 */

import { useState, useCallback } from 'react';
import ContentAnalyzer from '../../components/ContentAnalyzer';
import OptimizedOutput from '../../components/OptimizedOutput';
import type { Platform, BuzzAnalysis, OptimizedContent, PostMode } from '../../types/index';

export default function ContentPage() {
  const [currentAnalysis, setCurrentAnalysis] = useState<BuzzAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<BuzzAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalysisComplete = useCallback((analysis: BuzzAnalysis) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory((prev) => [analysis, ...prev.slice(0, 9)]); // Keep last 10
  }, []);

  const handleOptimize = useCallback(
    async (
      analysis: BuzzAnalysis,
      platform: Platform,
      mode: PostMode
    ): Promise<OptimizedContent> => {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          targetPlatform: platform,
          mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Optimization failed');
      }

      return response.json();
    },
    []
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">
          Content Optimizer
        </h1>
        <p className="text-white/60 text-lg">
          バズ投稿のノウハウを抽出し、あなたのプラットフォームに最適化
        </p>
      </div>

      {/* Strategy Banner */}
      <div className="glass rounded-2xl p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">
              ガッチャンコ戦略
            </h3>
            <p className="text-white/70 text-sm leading-relaxed">
              <span className="text-purple-300 font-medium">
                バズっているノウハウ
              </span>{' '}
              x{' '}
              <span className="text-pink-300 font-medium">
                プラットフォーム最適な言い回し
              </span>{' '}
              = 最大インプレッション
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 text-xs rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/30">
                Step 1: バズ投稿を見つける
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-pink-500/30 text-pink-200 border border-pink-500/30">
                Step 2: ノウハウを抽出
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-blue-500/30 text-blue-200 border border-blue-500/30">
                Step 3: 言い回しを変換
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-green-500/30 text-green-200 border border-green-500/30">
                Step 4: そのまま投稿
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Analysis Input */}
        <ContentAnalyzer
          onAnalysisComplete={handleAnalysisComplete}
          isLoading={isLoading}
        />

        {/* Right: Optimization Output */}
        <OptimizedOutput analysis={currentAnalysis} onOptimize={handleOptimize} />
      </div>

      {/* Analysis Details (when available) */}
      {currentAnalysis && (
        <div className="glass rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              分析結果の詳細
            </h3>
            <span className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
              Analysis Complete
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transcript */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                抽出された台本
              </h4>
              <div className="p-4 bg-white/5 rounded-xl text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {currentAnalysis.transcript}
              </div>
            </div>

            {/* Key Points */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                バズった要因
              </h4>
              <div className="space-y-2">
                {currentAnalysis.keyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/5 rounded-xl text-sm text-white/80 flex items-start gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0 text-xs text-yellow-300">
                      {index + 1}
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Structure */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
              コンテンツ構造
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Hook */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div className="text-xs text-purple-300 mb-2 font-medium">
                  Hook (フック)
                </div>
                <div className="text-sm text-white/80">
                  {currentAnalysis.structure.hook}
                </div>
              </div>

              {/* Main Points */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="text-xs text-blue-300 mb-2 font-medium">
                  Main Points
                </div>
                <ul className="text-sm text-white/80 space-y-1">
                  {currentAnalysis.structure.mainPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-blue-400">-</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="text-xs text-green-300 mb-2 font-medium">
                  CTA
                </div>
                <div className="text-sm text-white/80">
                  {currentAnalysis.structure.cta}
                </div>
              </div>

              {/* Emotional Triggers */}
              <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                <div className="text-xs text-pink-300 mb-2 font-medium">
                  Emotional Triggers
                </div>
                <div className="flex flex-wrap gap-1">
                  {currentAnalysis.structure.emotionalTriggers.map(
                    (trigger, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded bg-pink-500/20 text-pink-200"
                      >
                        {trigger}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {currentAnalysis.impressions.toLocaleString()}
                </div>
                <div className="text-xs text-white/50">推定Imp</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {currentAnalysis.engagement}%
                </div>
                <div className="text-xs text-white/50">Engagement</div>
              </div>
            </div>
            <div className="text-xs text-white/40">
              分析日時:{' '}
              {new Date(currentAnalysis.analyzedAt).toLocaleString('ja-JP')}
            </div>
          </div>
        </div>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 1 && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            最近の分析履歴
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisHistory.slice(1).map((analysis) => (
              <button
                key={analysis.id}
                onClick={() => setCurrentAnalysis(analysis)}
                className="p-4 bg-white/5 rounded-xl text-left hover:bg-white/10 transition group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/60">
                    {analysis.platform}
                  </span>
                  <span className="text-xs text-white/40">
                    {new Date(analysis.analyzedAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="text-sm text-white/80 line-clamp-2 group-hover:text-white transition">
                  {analysis.transcript.substring(0, 80)}...
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
