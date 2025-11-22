'use client';

/**
 * TrendingTopics Component
 *
 * リアルタイムトレンド一覧・ハッシュタグ推奨・参加推奨度を表示するコンポーネント
 * コメント戦略に活用できるトレンド情報を提供
 */

import { useState, useEffect, useCallback } from 'react';
import type { Platform } from '../types/index';
import type {
  TrendingTopic,
  HashtagAnalysis,
  BuzzPattern,
  TrendDetectionResponse,
  CommentStrategyRecommendation,
} from '../services/trendDetector';

/**
 * TrendingTopicsコンポーネントのProps
 */
interface TrendingTopicsProps {
  platform: Platform;
  onTrendSelect?: (trend: TrendingTopic) => void;
  onHashtagSelect?: (hashtag: HashtagAnalysis) => void;
  showCommentStrategy?: boolean;
  refreshInterval?: number;
}

/**
 * タブの種類
 */
type TabType = 'trends' | 'hashtags' | 'patterns' | 'comments';

/**
 * プラットフォームオプション
 */
const PLATFORM_OPTIONS: { value: Platform; label: string; icon: string }[] = [
  { value: 'threads', label: 'Threads', icon: '@' },
  { value: 'instagram', label: 'Instagram', icon: 'IG' },
  { value: 'twitter', label: 'Twitter/X', icon: 'X' },
];

/**
 * センチメントの表示設定
 */
const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  positive: { label: 'ポジティブ', color: 'text-green-400', icon: '+' },
  negative: { label: 'ネガティブ', color: 'text-red-400', icon: '-' },
  neutral: { label: 'ニュートラル', color: 'text-gray-400', icon: '=' },
  mixed: { label: 'ミックス', color: 'text-yellow-400', icon: '~' },
};

/**
 * 推奨度のカラー取得
 */
function getRecommendationColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * 推奨度のラベル取得
 */
function getRecommendationLabel(score: number): string {
  if (score >= 80) return '強く推奨';
  if (score >= 60) return '推奨';
  if (score >= 40) return '検討可';
  return '慎重に';
}

/**
 * 成長率のフォーマット
 */
function formatGrowthRate(rate: number): string {
  const percentage = ((rate - 1) * 100).toFixed(0);
  return rate >= 1 ? `+${percentage}%` : `${percentage}%`;
}

/**
 * 数値の短縮表示
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default function TrendingTopics({
  platform: initialPlatform,
  onTrendSelect,
  onHashtagSelect,
  showCommentStrategy = true,
  refreshInterval = 0,
}: TrendingTopicsProps) {
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [activeTab, setActiveTab] = useState<TabType>('trends');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendDetectionResponse | null>(null);
  const [commentStrategies, setCommentStrategies] = useState<CommentStrategyRecommendation[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * トレンドデータを取得
   */
  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trends?platform=${platform}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch trends');
      }

      const data: TrendDetectionResponse = await response.json();
      setTrendData(data);
      setLastUpdated(new Date());

      // コメント戦略も取得
      if (showCommentStrategy && data.trends.length > 0) {
        const strategiesResponse = await fetch(
          `/api/trends?platform=${platform}&action=comment-strategies`
        );
        if (strategiesResponse.ok) {
          const strategies: CommentStrategyRecommendation[] = await strategiesResponse.json();
          setCommentStrategies(strategies);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [platform, showCommentStrategy]);

  /**
   * 初回ロードと定期更新
   */
  useEffect(() => {
    fetchTrends();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchTrends, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTrends, refreshInterval]);

  /**
   * プラットフォーム変更時
   */
  useEffect(() => {
    fetchTrends();
  }, [platform, fetchTrends]);

  /**
   * トレンドカードをレンダリング
   */
  const renderTrendCard = (trend: TrendingTopic) => {
    const sentimentConfig = SENTIMENT_CONFIG[trend.sentiment];

    return (
      <div
        key={trend.id}
        onClick={() => onTrendSelect?.(trend)}
        className={`p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition cursor-pointer ${
          onTrendSelect ? 'hover:border-purple-500/50' : ''
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="text-white font-medium">{trend.name}</h4>
            <span className="text-xs text-white/50 capitalize">{trend.category}</span>
          </div>
          <div className={`text-sm font-bold ${getRecommendationColor(trend.recommendationScore)}`}>
            {trend.recommendationScore}点
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${sentimentConfig.color}`}>
            {sentimentConfig.icon} {sentimentConfig.label}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full bg-white/10 ${
              trend.growthRate >= 1 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatGrowthRate(trend.growthRate)}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-blue-400">
            {formatNumber(trend.volume)} posts
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {trend.relatedHashtags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs text-white/50">
          <span>ピーク: {trend.peakHour}:00</span>
          <span className={getRecommendationColor(trend.recommendationScore)}>
            {getRecommendationLabel(trend.recommendationScore)}
          </span>
        </div>
      </div>
    );
  };

  /**
   * ハッシュタグカードをレンダリング
   */
  const renderHashtagCard = (hashtag: HashtagAnalysis) => {
    const statusColors = {
      rising: 'text-green-400',
      stable: 'text-yellow-400',
      declining: 'text-red-400',
    };

    const competitionColors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-red-400',
    };

    return (
      <div
        key={hashtag.hashtag}
        onClick={() => onHashtagSelect?.(hashtag)}
        className={`p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition cursor-pointer ${
          onHashtagSelect ? 'hover:border-blue-500/50' : ''
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-lg font-medium text-white">#{hashtag.hashtag}</span>
          <span className={`text-sm ${statusColors[hashtag.trendingStatus]}`}>
            {hashtag.trendingStatus === 'rising'
              ? 'UP'
              : hashtag.trendingStatus === 'stable'
                ? '-'
                : 'DOWN'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/50">人気度</div>
            <div className="text-white font-medium">{hashtag.popularity}/100</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/50">競合</div>
            <div className={competitionColors[hashtag.competitionLevel]}>
              {hashtag.competitionLevel === 'low'
                ? '低'
                : hashtag.competitionLevel === 'medium'
                  ? '中'
                  : '高'}
            </div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/50">関連度</div>
            <div className="text-white font-medium">{hashtag.relevanceScore}%</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/50">推定リーチ</div>
            <div className="text-white font-medium">{formatNumber(hashtag.estimatedReach)}</div>
          </div>
        </div>

        <div className="text-xs text-white/50">
          <span>推奨時間: </span>
          {hashtag.bestTimeToUse.slice(0, 3).map((hour, i) => (
            <span key={hour}>
              {hour}:00{i < Math.min(hashtag.bestTimeToUse.length, 3) - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      </div>
    );
  };

  /**
   * バズパターンカードをレンダリング
   */
  const renderPatternCard = (pattern: BuzzPattern) => {
    return (
      <div
        key={pattern.id}
        className="p-4 bg-white/5 border border-white/10 rounded-xl"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-white font-medium capitalize">
              {pattern.patternType.replace('_', ' ')}
            </h4>
            <p className="text-xs text-white/60 mt-1">{pattern.description}</p>
          </div>
          <span className="text-sm font-bold text-green-400">
            {Math.floor(pattern.successRate * 100)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/50">平均エンゲージメント</div>
            <div className="text-white font-medium">{formatNumber(pattern.averageEngagement)}</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/50">推奨文字数</div>
            <div className="text-white font-medium">
              {pattern.optimalLength.min}-{pattern.optimalLength.max}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-white/50 mb-1">必要な要素:</div>
          <div className="flex flex-wrap gap-1">
            {pattern.requiredElements.map((element, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded"
              >
                {element}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-white/50 mb-1">例:</div>
          <ul className="text-xs text-white/70 space-y-1">
            {pattern.examples.map((example, i) => (
              <li key={i} className="italic">
                &ldquo;{example}&rdquo;
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  /**
   * コメント戦略カードをレンダリング
   */
  const renderCommentStrategyCard = (strategy: CommentStrategyRecommendation) => {
    const approachLabels = {
      agree: '同意する',
      add_value: '価値を追加',
      question: '質問する',
      share_experience: '経験を共有',
    };

    const riskColors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-red-400',
    };

    return (
      <div
        key={strategy.trendId}
        className="p-4 bg-white/5 border border-white/10 rounded-xl"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-white font-medium">{strategy.trendName}</h4>
            <span className="text-xs text-white/50">
              推奨アプローチ: {approachLabels[strategy.suggestedApproach]}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold ${getRecommendationColor(strategy.participationScore)}`}>
              {strategy.participationScore}点
            </div>
            <div className={`text-xs ${riskColors[strategy.riskLevel]}`}>
              リスク: {strategy.riskLevel === 'low' ? '低' : strategy.riskLevel === 'medium' ? '中' : '高'}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-white/50 mb-1">コメントテンプレート:</div>
          <div className="space-y-2">
            {strategy.commentTemplates.map((template, i) => (
              <div
                key={i}
                className="text-xs p-2 bg-white/5 rounded text-white/80 italic"
              >
                &ldquo;{template}&rdquo;
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-white/50">
          潜在リーチ: {formatNumber(strategy.potentialReach)}
        </div>
      </div>
    );
  };

  /**
   * タブコンテンツをレンダリング
   */
  const renderTabContent = () => {
    if (loading && !trendData) {
      return (
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-8 w-8 text-purple-500"
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
          <span className="ml-3 text-white/60">トレンドを分析中...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      );
    }

    if (!trendData) {
      return (
        <div className="text-center py-12 text-white/50">
          データがありません
        </div>
      );
    }

    switch (activeTab) {
      case 'trends':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {trendData.trends.map(renderTrendCard)}
          </div>
        );

      case 'hashtags':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {trendData.recommendedHashtags.map(renderHashtagCard)}
          </div>
        );

      case 'patterns':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {trendData.buzzPatterns.map(renderPatternCard)}
          </div>
        );

      case 'comments':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {commentStrategies.length > 0 ? (
              commentStrategies.map(renderCommentStrategyCard)
            ) : (
              <div className="col-span-2 text-center py-8 text-white/50">
                コメント戦略を生成するには、トレンドデータが必要です
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">トレンド分析</h2>
            <p className="text-white/60 text-sm">
              リアルタイムのトレンド情報とコメント戦略
            </p>
          </div>
        </div>

        {lastUpdated && (
          <div className="text-xs text-white/40">
            更新: {lastUpdated.toLocaleTimeString('ja-JP')}
          </div>
        )}
      </div>

      {/* Platform Selection */}
      <div className="flex gap-3">
        {PLATFORM_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setPlatform(option.value)}
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-xl border transition flex items-center justify-center gap-2 ${
              platform === option.value
                ? 'bg-blue-500/30 border-blue-500 text-white'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="font-mono text-sm">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: 'trends' as TabType, label: 'トレンド', icon: 'chart' },
          { id: 'hashtags' as TabType, label: 'ハッシュタグ', icon: 'hashtag' },
          { id: 'patterns' as TabType, label: 'バズパターン', icon: 'pattern' },
          ...(showCommentStrategy
            ? [{ id: 'comments' as TabType, label: 'コメント戦略', icon: 'comment' }]
            : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === tab.id
                ? 'text-blue-400 border-blue-400'
                : 'text-white/50 border-transparent hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">{renderTabContent()}</div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchTrends}
          disabled={loading}
          className="px-6 py-2 text-sm bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition flex items-center gap-2"
        >
          {loading ? (
            <svg
              className="animate-spin h-4 w-4"
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
          ) : (
            <svg
              className="w-4 h-4"
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
          )}
          <span>更新</span>
        </button>
      </div>

      {/* Tips */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h4 className="text-sm font-medium text-blue-300 mb-2">
          コメント戦略のコツ
        </h4>
        <ul className="text-xs text-blue-200/80 space-y-1">
          <li>- 参加推奨度が高いトレンドに優先的にコメント</li>
          <li>- ポジティブなセンチメントのトピックは同意アプローチが効果的</li>
          <li>- ピーク時間帯に合わせてコメントすると露出が増加</li>
          <li>- ハッシュタグは競合が低〜中のものを選ぶと発見されやすい</li>
        </ul>
      </div>
    </div>
  );
}
