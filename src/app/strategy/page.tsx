'use client';

/**
 * Strategy Page
 *
 * エンゲージメント戦略を管理するページ
 * 核心戦略: 「他人が聞きたいことを9割、自分が言いたいことを1割」
 */

import React, { useState } from 'react';
import { ModeRatioSlider } from '../../components/ModeRatioSlider';
import { WeeklyScheduler } from '../../components/WeeklyScheduler';
import { useStrategy, useStrategySummary, useCurrentMode } from '../../hooks/useStrategy';
import { MODE_DESCRIPTIONS } from '../../services/strategyManager';

export default function StrategyPage() {
  const [activeTab, setActiveTab] = useState<'ratio' | 'schedule' | 'comment'>('ratio');
  const strategy = useStrategy((state) => state.strategy);
  const updateCommentStrategy = useStrategy((state) => state.updateCommentStrategy);
  const resetToDefault = useStrategy((state) => state.resetToDefault);
  const commentAdvice = useStrategy((state) => state.commentAdvice);
  const summary = useStrategySummary();
  const currentMode = useCurrentMode();

  return (
    <div className="space-y-8">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          戦略設定
        </h1>
        <p className="text-white/60">
          エンゲージメント戦略を最適化して、インプレッションを最大化しましょう。
        </p>
      </div>

      {/* 核心戦略カード */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/50 to-emerald-900/50 border border-white/10">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/10">
            <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">核心戦略</h2>
            <blockquote className="text-white/80 italic border-l-4 border-yellow-400 pl-4 mb-4">
              「自分の言いたいことを喋らない」こと。「他人の聞きたいことを喋る」んです。
            </blockquote>
            <p className="text-white/60 text-sm">
              目指すのは、他人が聞きたいことを発信するのを9割にとどめるっていうのと、
              「主宰者にとって都合のいい行動」をすること。
            </p>
          </div>
        </div>
      </div>

      {/* 現在のモードダッシュボード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 今日のモード */}
        <div className={`p-4 rounded-xl ${
          currentMode === 'impression'
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-purple-500/10 border border-purple-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              currentMode === 'impression' ? 'bg-emerald-500' : 'bg-purple-500'
            }`} />
            <span className="text-sm text-white/70">今日のモード</span>
          </div>
          <div className={`text-xl font-bold ${
            currentMode === 'impression' ? 'text-emerald-400' : 'text-purple-400'
          }`}>
            {MODE_DESCRIPTIONS[currentMode].label}
          </div>
        </div>

        {/* 現在の比率 */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm text-white/70">現在の比率</span>
          </div>
          <div className="text-xl font-bold text-white">
            <span className="text-emerald-400">{summary.impressionPercent}%</span>
            <span className="text-white/30 mx-2">:</span>
            <span className="text-purple-400">{summary.expressionPercent}%</span>
          </div>
        </div>

        {/* ヘルスステータス */}
        <div className={`p-4 rounded-xl border ${
          summary.healthStatus === 'healthy'
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : summary.healthStatus === 'acceptable'
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-white/70">ステータス</span>
          </div>
          <div className={`text-xl font-bold ${
            summary.healthStatus === 'healthy'
              ? 'text-emerald-400'
              : summary.healthStatus === 'acceptable'
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}>
            {summary.healthStatus === 'healthy' ? '理想的' :
             summary.healthStatus === 'acceptable' ? '許容範囲' :
             summary.healthStatus === 'warning' ? '注意' : '要改善'}
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('ratio')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'ratio'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          比率設定
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'schedule'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          週間スケジュール
        </button>
        <button
          onClick={() => setActiveTab('comment')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'comment'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          コメント戦略
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="p-6 rounded-2xl bg-slate-800/30 border border-white/10">
        {activeTab === 'ratio' && (
          <ModeRatioSlider showTips={true} />
        )}

        {activeTab === 'schedule' && (
          <WeeklyScheduler showPostTimes={true} />
        )}

        {activeTab === 'comment' && (
          <CommentStrategySection
            strategy={strategy}
            commentAdvice={commentAdvice}
            updateCommentStrategy={updateCommentStrategy}
          />
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <button
          onClick={resetToDefault}
          className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          デフォルトに戻す
        </button>
        <button
          className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600
            text-white font-medium rounded-lg hover:from-emerald-600 hover:to-emerald-700
            transition-all shadow-lg shadow-emerald-500/25"
        >
          設定を保存
        </button>
      </div>
    </div>
  );
}

/**
 * コメント戦略セクション
 */
interface CommentStrategySectionProps {
  strategy: {
    commentStrategy: {
      enabled: boolean;
      targetTrendingPosts: boolean;
      maxCommentsPerDay: number;
      avoidNegative: boolean;
    };
  };
  commentAdvice: string[];
  updateCommentStrategy: (updates: Partial<{
    enabled: boolean;
    targetTrendingPosts: boolean;
    maxCommentsPerDay: number;
    avoidNegative: boolean;
  }>) => void;
}

function CommentStrategySection({
  strategy,
  commentAdvice,
  updateCommentStrategy,
}: CommentStrategySectionProps) {
  const cs = strategy.commentStrategy;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">コメント戦略</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={cs.enabled}
            onChange={(e) => updateCommentStrategy({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer
            peer-checked:after:translate-x-full peer-checked:after:border-white
            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
            after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
            peer-checked:bg-emerald-600" />
          <span className="ml-3 text-sm text-white/70">
            {cs.enabled ? '有効' : '無効'}
          </span>
        </label>
      </div>

      {cs.enabled && (
        <>
          {/* オプション */}
          <div className="space-y-4">
            {/* トレンド投稿へのコメント */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/10">
              <div>
                <div className="text-sm font-medium text-white">トレンド投稿へのコメント</div>
                <div className="text-xs text-white/50">人気投稿にコメントして露出を増やす</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs.targetTrendingPosts}
                  onChange={(e) => updateCommentStrategy({ targetTrendingPosts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer
                  peer-checked:after:translate-x-full peer-checked:after:border-white
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                  after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                  peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* ネガティブコメント回避 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/10">
              <div>
                <div className="text-sm font-medium text-white">ネガティブコメントを避ける</div>
                <div className="text-xs text-white/50">プラットフォームからの評価を維持</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs.avoidNegative}
                  onChange={(e) => updateCommentStrategy({ avoidNegative: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer
                  peer-checked:after:translate-x-full peer-checked:after:border-white
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                  after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                  peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* 1日の最大コメント数 */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-white">1日の最大コメント数</div>
                  <div className="text-xs text-white/50">スパム判定を避けるため適切な数に設定</div>
                </div>
                <span className="text-2xl font-bold text-emerald-400">{cs.maxCommentsPerDay}</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={cs.maxCommentsPerDay}
                onChange={(e) => updateCommentStrategy({ maxCommentsPerDay: parseInt(e.target.value, 10) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700"
              />
              <div className="flex justify-between mt-2 text-xs text-white/50">
                <span>1</span>
                <span className="text-yellow-400">推奨: 5-15</span>
                <span>50</span>
              </div>
            </div>
          </div>

          {/* アドバイス */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <h4 className="text-sm font-medium text-emerald-400 mb-3">アドバイス</h4>
            <ul className="space-y-2">
              {commentAdvice.map((advice, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-white/70">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{advice}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {!cs.enabled && (
        <div className="p-6 rounded-xl bg-slate-800/30 border border-white/10 text-center">
          <svg className="w-12 h-12 text-white/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-white/50">
            コメント戦略が無効になっています。<br />
            コミュニティへの参加はインプレッション獲得に効果的です。
          </p>
        </div>
      )}
    </div>
  );
}
