'use client';

/**
 * ModeRatioSlider Component
 *
 * インプレッション獲得モードと自己表現モードの比率を設定するスライダー
 * 核心戦略: 「他人が聞きたいことを9割、自分が言いたいことを1割」
 */

import React, { useCallback, useMemo } from 'react';
import { useStrategy, useRatioPercentages } from '../hooks/useStrategy';
import { MODE_DESCRIPTIONS } from '../services/strategyManager';

interface ModeRatioSliderProps {
  className?: string;
  showTips?: boolean;
  compact?: boolean;
}

export function ModeRatioSlider({
  className = '',
  showTips = true,
  compact = false,
}: ModeRatioSliderProps) {
  const setImpressionRatio = useStrategy((state) => state.setImpressionRatio);
  const ratioHealth = useStrategy((state) => state.ratioHealth);
  const { impressionPercent, expressionPercent } = useRatioPercentages();

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      setImpressionRatio(value / 100);
    },
    [setImpressionRatio]
  );

  // ヘルスステータスに基づく色
  const healthColors = useMemo(() => {
    switch (ratioHealth.status) {
      case 'healthy':
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          icon: 'text-emerald-400',
        };
      case 'acceptable':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
          icon: 'text-yellow-400',
        };
      case 'warning':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
          icon: 'text-orange-400',
        };
      case 'critical':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          text: 'text-red-400',
          icon: 'text-red-400',
        };
      default:
        return {
          bg: 'bg-slate-500/20',
          border: 'border-slate-500/50',
          text: 'text-slate-400',
          icon: 'text-slate-400',
        };
    }
  }, [ratioHealth.status]);

  // ステータスアイコン
  const statusIcon = useMemo(() => {
    switch (ratioHealth.status) {
      case 'healthy':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  }, [ratioHealth.status]);

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">比率</span>
          <span className="text-sm font-medium text-white">
            {impressionPercent}:{expressionPercent}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="100"
          value={impressionPercent}
          onChange={handleSliderChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-gradient-to-r from-purple-600 via-emerald-500 to-emerald-600"
          style={{
            background: `linear-gradient(to right,
              rgb(147, 51, 234) 0%,
              rgb(147, 51, 234) ${100 - impressionPercent}%,
              rgb(16, 185, 129) ${100 - impressionPercent}%,
              rgb(16, 185, 129) 100%)`,
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">投稿モード比率</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${healthColors.bg} ${healthColors.border} border`}>
          <span className={healthColors.icon}>{statusIcon}</span>
          <span className={`text-sm ${healthColors.text}`}>
            {ratioHealth.status === 'healthy' ? '理想的' :
             ratioHealth.status === 'acceptable' ? '許容範囲' :
             ratioHealth.status === 'warning' ? '注意' : '要改善'}
          </span>
        </div>
      </div>

      {/* 比率表示 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* インプレッション獲得モード */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-white/70">インプレッション獲得</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400">
            {impressionPercent}%
          </div>
          <p className="text-xs text-white/50 mt-2">
            他人が聞きたいことを発信
          </p>
        </div>

        {/* 自己表現モード */}
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-white/70">自己表現</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">
            {expressionPercent}%
          </div>
          <p className="text-xs text-white/50 mt-2">
            自分が言いたいことを発信
          </p>
        </div>
      </div>

      {/* スライダー */}
      <div className="mb-6">
        <div className="relative">
          {/* スライダーバックグラウンド */}
          <div className="h-4 rounded-full overflow-hidden bg-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-200"
              style={{ width: `${impressionPercent}%` }}
            />
          </div>

          {/* カスタムスライダー */}
          <input
            type="range"
            min="50"
            max="100"
            value={impressionPercent}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-4 opacity-0 cursor-pointer"
            aria-label="インプレッション獲得比率"
          />

          {/* スライダーサム */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg
              border-2 border-emerald-500 pointer-events-none transition-all duration-200"
            style={{ left: `calc(${impressionPercent}% - 12px)` }}
          />
        </div>

        {/* ラベル */}
        <div className="flex justify-between mt-2 text-xs text-white/50">
          <span>50% (バランス)</span>
          <span>推奨: 80-90%</span>
          <span>100% (全てIMP)</span>
        </div>
      </div>

      {/* ヘルスメッセージ */}
      <div className={`p-4 rounded-xl ${healthColors.bg} border ${healthColors.border} mb-6`}>
        <p className={`text-sm ${healthColors.text}`}>
          {ratioHealth.message}
        </p>
      </div>

      {/* Tips */}
      {showTips && (
        <div className="grid grid-cols-2 gap-4">
          {/* インプレッション獲得のTips */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
            <h4 className="text-sm font-medium text-emerald-400 mb-3">
              {MODE_DESCRIPTIONS.impression.label}
            </h4>
            <ul className="space-y-2">
              {MODE_DESCRIPTIONS.impression.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-white/60">
                  <span className="text-emerald-500 mt-0.5">*</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 自己表現のTips */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
            <h4 className="text-sm font-medium text-purple-400 mb-3">
              {MODE_DESCRIPTIONS.expression.label}
            </h4>
            <ul className="space-y-2">
              {MODE_DESCRIPTIONS.expression.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-white/60">
                  <span className="text-purple-500 mt-0.5">*</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeRatioSlider;
