'use client';

/**
 * StatCard - 統計カードコンポーネント
 *
 * ダッシュボードで使用する統計情報表示カード
 * - グラデーション背景
 * - アイコン表示
 * - 数値と変化率
 * - ホバーエフェクト
 */

import React from 'react';

export type GradientType =
  | 'purple'
  | 'blue'
  | 'green'
  | 'pink'
  | 'orange'
  | 'cyan';

interface StatCardProps {
  /** カードのタイトル */
  title: string;
  /** 表示する数値 */
  value: string | number;
  /** 変化率（%） */
  changePercent?: number;
  /** アイコン（SVGパスまたはReactNode） */
  icon: React.ReactNode;
  /** グラデーションタイプ */
  gradient?: GradientType;
  /** サブテキスト */
  subtitle?: string;
  /** 単位 */
  unit?: string;
}

const gradientStyles: Record<GradientType, { bg: string; border: string; glow: string }> = {
  purple: {
    bg: 'from-purple-500/20 via-purple-600/10 to-transparent',
    border: 'border-purple-500/30',
    glow: 'group-hover:shadow-purple-500/20',
  },
  blue: {
    bg: 'from-blue-500/20 via-blue-600/10 to-transparent',
    border: 'border-blue-500/30',
    glow: 'group-hover:shadow-blue-500/20',
  },
  green: {
    bg: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
    border: 'border-emerald-500/30',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  pink: {
    bg: 'from-pink-500/20 via-pink-600/10 to-transparent',
    border: 'border-pink-500/30',
    glow: 'group-hover:shadow-pink-500/20',
  },
  orange: {
    bg: 'from-orange-500/20 via-orange-600/10 to-transparent',
    border: 'border-orange-500/30',
    glow: 'group-hover:shadow-orange-500/20',
  },
  cyan: {
    bg: 'from-cyan-500/20 via-cyan-600/10 to-transparent',
    border: 'border-cyan-500/30',
    glow: 'group-hover:shadow-cyan-500/20',
  },
};

const iconGradients: Record<GradientType, string> = {
  purple: 'from-purple-500 to-violet-500',
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-emerald-500 to-teal-500',
  pink: 'from-pink-500 to-rose-500',
  orange: 'from-orange-500 to-amber-500',
  cyan: 'from-cyan-500 to-blue-500',
};

export default function StatCard({
  title,
  value,
  changePercent,
  icon,
  gradient = 'purple',
  subtitle,
  unit,
}: StatCardProps) {
  const styles = gradientStyles[gradient];
  const iconGradient = iconGradients[gradient];

  const isPositive = changePercent !== undefined && changePercent >= 0;
  const changeColor = isPositive ? 'text-emerald-400' : 'text-red-400';
  const changeIcon = isPositive ? (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ) : (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl
        bg-gradient-to-br ${styles.bg}
        border ${styles.border}
        backdrop-blur-xl
        p-6
        transition-all duration-300
        hover:scale-[1.02] hover:shadow-xl ${styles.glow}
        cursor-default
      `}
    >
      {/* 背景グロー効果 */}
      <div
        className={`
          absolute -top-12 -right-12 w-32 h-32
          bg-gradient-to-br ${iconGradient}
          rounded-full opacity-10 blur-2xl
          group-hover:opacity-20 transition-opacity duration-300
        `}
      />

      {/* コンテンツ */}
      <div className="relative z-10">
        {/* ヘッダー: アイコンとタイトル */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`
              w-12 h-12 rounded-xl
              bg-gradient-to-br ${iconGradient}
              flex items-center justify-center
              shadow-lg
              group-hover:scale-110 transition-transform duration-300
            `}
          >
            {icon}
          </div>

          {changePercent !== undefined && (
            <div className={`flex items-center gap-1 ${changeColor} text-sm font-medium`}>
              {changeIcon}
              <span>{Math.abs(changePercent)}%</span>
            </div>
          )}
        </div>

        {/* 数値 */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="text-lg text-white/60">{unit}</span>}
          </div>

          <p className="text-sm font-medium text-white/70">{title}</p>

          {subtitle && (
            <p className="text-xs text-white/50 mt-2">{subtitle}</p>
          )}
        </div>
      </div>

      {/* ホバー時のボーダーグロー */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          pointer-events-none
        `}
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, 0.1)`,
        }}
      />
    </div>
  );
}

/**
 * MiniStatCard - コンパクトな統計カード
 */
interface MiniStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function MiniStatCard({ label, value, icon, trend }: MiniStatCardProps) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-white/60',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs text-white/50">{label}</p>
        <p className={`text-sm font-semibold ${trend ? trendColors[trend] : 'text-white'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}
