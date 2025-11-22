'use client';

/**
 * ScoreGauge - 円形スコアゲージコンポーネント
 * プラットフォーム好感度スコアを視覚的に表示
 */

import React, { useEffect, useState } from 'react';
import { getScoreRank } from '../services/scoreCalculator';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showRank?: boolean;
  label?: string;
  animated?: boolean;
}

export default function ScoreGauge({
  score,
  size = 'md',
  showRank = true,
  label,
  animated = true,
}: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const [isAnimating, setIsAnimating] = useState(animated);

  // サイズ設定
  const sizeConfig = {
    sm: { width: 120, strokeWidth: 8, fontSize: 24, rankSize: 14 },
    md: { width: 200, strokeWidth: 12, fontSize: 48, rankSize: 18 },
    lg: { width: 280, strokeWidth: 16, fontSize: 64, rankSize: 24 },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // スコアに基づく色の取得
  const getScoreColor = (value: number): string => {
    if (value >= 80) return '#00FF88';  // 緑
    if (value >= 60) return '#00BFFF';  // 青
    if (value >= 40) return '#FFD700';  // 黄
    if (value >= 20) return '#FFA500';  // オレンジ
    return '#FF4444';                    // 赤
  };

  // グラデーション用の色
  const getGradientColors = (value: number): { start: string; end: string } => {
    if (value >= 80) return { start: '#00FF88', end: '#00BFFF' };
    if (value >= 60) return { start: '#00BFFF', end: '#8B5CF6' };
    if (value >= 40) return { start: '#FFD700', end: '#FFA500' };
    if (value >= 20) return { start: '#FFA500', end: '#FF6B6B' };
    return { start: '#FF6B6B', end: '#FF4444' };
  };

  const scoreColor = getScoreColor(displayScore);
  const gradientColors = getGradientColors(displayScore);
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;
  const { rank, color: rankColor, label: rankLabel } = getScoreRank(displayScore);

  // アニメーション処理
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    setIsAnimating(true);
    const duration = 1500;
    const startTime = Date.now();
    const startScore = displayScore;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // イージング関数 (ease-out-cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const currentScore = Math.round(startScore + (score - startScore) * easeOutCubic);
      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  const gradientId = `scoreGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-white/60 text-sm font-medium">{label}</span>
      )}

      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          className="transform -rotate-90"
          width={config.width}
          height={config.width}
        >
          {/* グラデーション定義 */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>
          </defs>

          {/* 背景の円 */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={config.strokeWidth}
          />

          {/* スコア表示の円 */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: isAnimating ? 'none' : 'stroke-dashoffset 0.5s ease-out',
              filter: `drop-shadow(0 0 ${config.strokeWidth}px ${scoreColor}40)`,
            }}
          />
        </svg>

        {/* 中央のスコア表示 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-white"
            style={{
              fontSize: config.fontSize,
              textShadow: `0 0 20px ${scoreColor}80`,
            }}
          >
            {displayScore}
          </span>

          {showRank && (
            <div className="flex flex-col items-center gap-1">
              <span
                className="font-bold"
                style={{
                  fontSize: config.rankSize + 4,
                  color: rankColor,
                  textShadow: `0 0 10px ${rankColor}80`,
                }}
              >
                {rank}
              </span>
              <span
                className="text-white/60"
                style={{ fontSize: config.rankSize - 2 }}
              >
                {rankLabel}
              </span>
            </div>
          )}
        </div>

        {/* グロー効果 */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${scoreColor}40 0%, transparent 70%)`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * ミニスコアゲージ - コンパクトな表示用
 */
interface MiniScoreGaugeProps {
  score: number;
  label: string;
  color?: string;
}

export function MiniScoreGauge({ score, label, color }: MiniScoreGaugeProps) {
  const scoreColor = color || (
    score >= 80 ? '#00FF88' :
    score >= 60 ? '#00BFFF' :
    score >= 40 ? '#FFD700' :
    score >= 20 ? '#FFA500' :
    '#FF4444'
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="transform -rotate-90" width="64" height="64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="4"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={scoreColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={28 * 2 * Math.PI}
            strokeDashoffset={28 * 2 * Math.PI * (1 - score / 100)}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-out',
              filter: `drop-shadow(0 0 4px ${scoreColor}60)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{score}</span>
        </div>
      </div>
      <span className="text-white/60 text-xs text-center">{label}</span>
    </div>
  );
}

/**
 * スコアバー - 横向きのスコア表示
 */
interface ScoreBarProps {
  score: number;
  label: string;
  maxScore?: number;
}

export function ScoreBar({ score, label, maxScore = 100 }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;
  const scoreColor =
    percentage >= 80 ? '#00FF88' :
    percentage >= 60 ? '#00BFFF' :
    percentage >= 40 ? '#FFD700' :
    percentage >= 20 ? '#FFA500' :
    '#FF4444';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-white/70 text-sm">{label}</span>
        <span className="text-white font-medium text-sm">{score}/{maxScore}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${scoreColor}CC, ${scoreColor})`,
            boxShadow: `0 0 8px ${scoreColor}60`,
          }}
        />
      </div>
    </div>
  );
}
