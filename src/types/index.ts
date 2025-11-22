// SNS Engagement App - Core Types

/**
 * 投稿モード
 */
export type PostMode = 'impression' | 'expression';

/**
 * SNSプラットフォーム
 */
export type Platform = 'threads' | 'instagram' | 'twitter';

/**
 * バズコンテンツの分析結果
 */
export interface BuzzAnalysis {
  id: string;
  platform: Platform;
  originalUrl: string;
  impressions: number;
  engagement: number;
  transcript: string;
  keyPoints: string[];
  structure: ContentStructure;
  analyzedAt: Date;
}

/**
 * コンテンツ構造
 */
export interface ContentStructure {
  hook: string;           // 冒頭のフック
  mainPoints: string[];   // 主要ポイント
  cta: string;           // Call to Action
  emotionalTriggers: string[];
}

/**
 * 最適化されたコンテンツ
 */
export interface OptimizedContent {
  id: string;
  originalAnalysisId: string;
  targetPlatform: Platform;
  content: string;
  hashtags: string[];
  bestPostTime: Date;
  expectedImpressions: number;
  mode: PostMode;
  createdAt: Date;
}

/**
 * 投稿スケジュール
 */
export interface PostSchedule {
  id: string;
  content: OptimizedContent;
  scheduledAt: Date;
  mode: PostMode;
  status: 'pending' | 'posted' | 'failed';
}

/**
 * エンゲージメント戦略設定
 */
export interface EngagementStrategy {
  impressionRatio: number;  // 0-1 (推奨: 0.8-0.9)
  expressionRatio: number;  // 0-1 (推奨: 0.1-0.2)
  weeklyExpressionDays: number[];  // 0=日曜, 6=土曜
  commentStrategy: CommentStrategy;
}

/**
 * コメント戦略
 */
export interface CommentStrategy {
  enabled: boolean;
  targetTrendingPosts: boolean;
  maxCommentsPerDay: number;
  avoidNegative: boolean;
}

/**
 * プラットフォーム好感度スコア
 */
export interface PlatformScore {
  id: string;
  platform: Platform;
  overallScore: number;      // 0-100
  engagementScore: number;   // エンゲージメントへの貢献度
  consistencyScore: number;  // 投稿の一貫性
  trendScore: number;        // トレンドへの参加度
  communityScore: number;    // コミュニティ貢献度
  calculatedAt: Date;
  factors: ScoreFactor[];
}

/**
 * スコア要因
 */
export interface ScoreFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

/**
 * ユーザー設定
 */
export interface UserSettings {
  id: string;
  platforms: Platform[];
  strategy: EngagementStrategy;
  targetAudience: string[];
  contentCategories: string[];
  apiKeys: {
    claude?: string;
    instagram?: string;
    threads?: string;
    twitter?: string;
  };
}

/**
 * ダッシュボード統計
 */
export interface DashboardStats {
  totalImpressions: number;
  totalEngagement: number;
  averageScore: number;
  postsThisWeek: number;
  impressionModeRatio: number;
  trendingTopics: string[];
  recommendedActions: string[];
}

/**
 * AI分析リクエスト
 */
export interface AnalysisRequest {
  url?: string;
  content?: string;
  platform: Platform;
  analysisType: 'buzz' | 'optimize' | 'score';
}

/**
 * AI分析レスポンス
 */
export interface AnalysisResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
}
