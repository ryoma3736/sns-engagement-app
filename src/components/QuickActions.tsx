'use client';

/**
 * QuickActions - クイックアクションコンポーネント
 *
 * ダッシュボードからの主要アクションへのショートカット
 * - コンテンツ作成
 * - 戦略確認
 * - スコア確認
 */

import React from 'react';
import Link from 'next/link';

interface ActionItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
  hoverGlow: string;
}

const defaultActions: ActionItem[] = [
  {
    id: 'content',
    label: 'コンテンツ作成',
    description: 'バズ投稿を分析して最適化',
    href: '/content',
    gradient: 'from-purple-500 to-pink-500',
    hoverGlow: 'hover:shadow-purple-500/30',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'strategy',
    label: '戦略確認',
    description: '投稿モードと配分を調整',
    href: '/strategy',
    gradient: 'from-blue-500 to-cyan-500',
    hoverGlow: 'hover:shadow-blue-500/30',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'score',
    label: 'スコア確認',
    description: 'プラットフォーム好感度を確認',
    href: '/score',
    gradient: 'from-emerald-500 to-teal-500',
    hoverGlow: 'hover:shadow-emerald-500/30',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

interface QuickActionsProps {
  /** カスタムアクションリスト */
  actions?: ActionItem[];
  /** タイトル表示 */
  showTitle?: boolean;
  /** レイアウト */
  layout?: 'grid' | 'row';
}

export default function QuickActions({
  actions = defaultActions,
  showTitle = true,
  layout = 'grid',
}: QuickActionsProps) {
  const gridClass = layout === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
    : 'flex flex-wrap gap-4';

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <span className="text-xs text-white/40">主要アクション</span>
        </div>
      )}

      <div className={gridClass}>
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`
              group relative overflow-hidden
              rounded-2xl p-5
              bg-white/5 backdrop-blur-xl
              border border-white/10
              transition-all duration-300
              hover:scale-[1.02] hover:bg-white/10 hover:border-white/20
              hover:shadow-xl ${action.hoverGlow}
            `}
          >
            {/* 背景グラデーションホバー効果 */}
            <div
              className={`
                absolute inset-0 opacity-0 group-hover:opacity-10
                bg-gradient-to-br ${action.gradient}
                transition-opacity duration-300
              `}
            />

            {/* コンテンツ */}
            <div className="relative z-10 flex items-start gap-4">
              {/* アイコン */}
              <div
                className={`
                  w-12 h-12 rounded-xl
                  bg-gradient-to-br ${action.gradient}
                  flex items-center justify-center
                  shadow-lg
                  group-hover:scale-110 group-hover:shadow-xl
                  transition-all duration-300
                `}
              >
                {action.icon}
              </div>

              {/* テキスト */}
              <div className="flex-1">
                <h4 className="text-base font-semibold text-white group-hover:text-white transition-colors">
                  {action.label}
                </h4>
                <p className="text-sm text-white/50 group-hover:text-white/70 transition-colors mt-1">
                  {action.description}
                </p>
              </div>

              {/* 矢印アイコン */}
              <div className="self-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * QuickActionButton - 単一のクイックアクションボタン
 */
interface QuickActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  gradient?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function QuickActionButton({
  label,
  icon,
  onClick,
  gradient = 'from-purple-500 to-pink-500',
  size = 'md',
}: QuickActionButtonProps) {
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-2
        ${sizeStyles[size]}
        bg-gradient-to-r ${gradient}
        rounded-xl font-medium text-white
        shadow-lg hover:shadow-xl
        transition-all duration-300
        hover:scale-105 active:scale-95
      `}
    >
      <span className={`${iconSizes[size]} transition-transform group-hover:scale-110`}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
