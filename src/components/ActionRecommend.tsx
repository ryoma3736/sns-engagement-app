'use client';

/**
 * ActionRecommend - アクション推奨コンポーネント
 * プラットフォームに好まれる行動を提案
 *
 * 核心戦略:
 * 「主宰者（プラットフォーム）にとっていい人」になるためのアクションを提示
 */

import React, { useState } from 'react';
import { ScoreRecommendation } from '../services/scoreCalculator';

interface ActionRecommendProps {
  recommendations: ScoreRecommendation[];
  maxItems?: number;
}

/**
 * 優先度に応じたスタイル
 */
const priorityStyles = {
  high: {
    bg: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
    border: 'border-red-500/30',
    icon: 'bg-red-500',
    badge: 'bg-red-500/20 text-red-400',
    badgeText: '高優先',
  },
  medium: {
    bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/30',
    icon: 'bg-yellow-500',
    badge: 'bg-yellow-500/20 text-yellow-400',
    badgeText: '中優先',
  },
  low: {
    bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    icon: 'bg-blue-500',
    badge: 'bg-blue-500/20 text-blue-400',
    badgeText: '低優先',
  },
};

/**
 * カテゴリに応じたアイコン
 */
const categoryIcons: Record<string, string> = {
  engagement: 'comment',
  consistency: 'calendar',
  trend: 'trending',
  community: 'users',
};

/**
 * アイコンコンポーネント
 */
function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'engagement':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'consistency':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'trend':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case 'community':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
}

/**
 * 期待効果のインジケーター
 */
function ImpactIndicator({ impact }: { impact: number }) {
  const bars = Math.min(5, Math.ceil(impact / 2));
  return (
    <div className="flex items-center gap-1">
      <span className="text-white/50 text-xs mr-1">効果</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-3 rounded-sm ${
            i <= bars ? 'bg-green-400' : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * 単一のレコメンデーションカード
 */
interface RecommendCardProps {
  recommendation: ScoreRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
}

function RecommendCard({ recommendation, isExpanded, onToggle }: RecommendCardProps) {
  const style = priorityStyles[recommendation.priority];

  return (
    <div
      className={`rounded-xl border ${style.border} ${style.bg} backdrop-blur-sm overflow-hidden transition-all duration-300`}
    >
      {/* ヘッダー */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-4 text-left hover:bg-white/5 transition-colors"
      >
        {/* アイコン */}
        <div className={`p-2 rounded-lg ${style.icon} text-white flex-shrink-0`}>
          <CategoryIcon category={recommendation.category} />
        </div>

        {/* コンテンツ */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold truncate">
              {recommendation.title}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
              {style.badgeText}
            </span>
          </div>
          <p className="text-white/60 text-sm line-clamp-2">
            {recommendation.description}
          </p>
        </div>

        {/* 展開/折りたたみアイコン */}
        <div className="flex-shrink-0 text-white/50">
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 展開時の詳細 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/10">
          {/* 効果インジケーター */}
          <div className="py-3 border-b border-white/10">
            <ImpactIndicator impact={recommendation.expectedImpact} />
            <p className="text-white/50 text-xs mt-1">
              予想スコア上昇: +{recommendation.expectedImpact}点
            </p>
          </div>

          {/* アクションアイテム */}
          <div className="pt-3">
            <h4 className="text-white/70 text-sm font-medium mb-2">
              具体的なアクション:
            </h4>
            <ul className="space-y-2">
              {recommendation.actionItems.map((action, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-white/80 text-sm"
                >
                  <span className="text-green-400 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* アクションボタン */}
          <button className="mt-4 w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors">
            このアクションを実践する
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * メインのアクション推奨コンポーネント
 */
export default function ActionRecommend({ recommendations, maxItems = 5 }: ActionRecommendProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayedRecommendations = showAll
    ? recommendations
    : recommendations.slice(0, maxItems);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">Great Job!</div>
        <p className="text-white/70">
          現在、特に改善が必要な点はありません。<br />
          この調子で続けましょう!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            プラットフォームに好まれるアクション
          </h2>
          <p className="text-white/50 text-sm">
            「主宰者に好かれる人」になるための具体的な行動
          </p>
        </div>
        {recommendations.length > maxItems && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            {showAll ? '折りたたむ' : `全て表示 (${recommendations.length}件)`}
          </button>
        )}
      </div>

      {/* レコメンデーションリスト */}
      <div className="space-y-3">
        {displayedRecommendations.map((rec) => (
          <RecommendCard
            key={rec.id}
            recommendation={rec}
            isExpanded={expandedId === rec.id}
            onToggle={() => handleToggle(rec.id)}
          />
        ))}
      </div>

      {/* サマリー */}
      {recommendations.length > 0 && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">Insight</span>
            <div>
              <h3 className="text-white font-medium mb-1">
                飲み会の例えで考えると...
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                「盛り上げようとしてくれる人」はプラットフォーム（主宰者）に好まれます。
                コメントやいいねで他者のコンテンツを盛り上げ、トレンドに参加することで
                「みんなのために動いてくれる人」と認識されます。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * コンパクト版のアクション推奨
 */
interface CompactRecommendProps {
  recommendations: ScoreRecommendation[];
  maxItems?: number;
}

export function CompactRecommend({ recommendations, maxItems = 3 }: CompactRecommendProps) {
  const topRecommendations = recommendations.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {topRecommendations.map((rec) => {
        const style = priorityStyles[rec.priority];
        return (
          <div
            key={rec.id}
            className={`p-3 rounded-lg border ${style.border} ${style.bg} flex items-center gap-3`}
          >
            <div className={`p-1.5 rounded-md ${style.icon} text-white`}>
              <CategoryIcon category={rec.category} />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {rec.title}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs ${style.badge}`}>
              +{rec.expectedImpact}
            </span>
          </div>
        );
      })}
    </div>
  );
}
