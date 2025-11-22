/**
 * Score API Route
 *
 * 好感度スコア計算APIエンドポイント
 * - プラットフォーム好感度スコア計算
 * - AI分析によるレコメンデーション生成
 * - Claude claude-sonnet-4-20250514を使用
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ClaudeClient,
  ClaudeAPIError,
  getApiKeyFromEnv,
} from '../../../lib/claude';
import {
  calculatePlatformScore,
  generateSampleBehaviorData,
  getScoreRank,
  type UserBehaviorData,
  type ScoreCalculationResult,
  type ScoreRecommendation,
} from '../../../services/scoreCalculator';
import type { Platform, AnalysisResponse, PlatformScore } from '../../../types/index';

/**
 * スコア計算リクエストボディ
 */
interface ScoreRequestBody {
  platform: Platform;
  behaviorData?: UserBehaviorData;
  includeAiAnalysis?: boolean;
}

/**
 * スコア計算レスポンス
 */
interface ScoreResponseData {
  score: PlatformScore;
  rank: {
    rank: string;
    color: string;
    label: string;
  };
  recommendations: ScoreRecommendation[];
  aiInsights?: {
    aiInsight: string;
    strengths: string[];
    improvements: string[];
    priorityAction: string;
    estimatedGrowthPotential: number;
  };
}

/**
 * バリデーションエラーを返す
 */
function validationError(message: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      processingTime: 0,
    } as AnalysisResponse<never>,
    { status: 400 }
  );
}

/**
 * サーバーエラーを返す
 */
function serverError(message: string, statusCode: number = 500): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      processingTime: 0,
    } as AnalysisResponse<never>,
    { status: statusCode }
  );
}

/**
 * UserBehaviorDataのバリデーション
 */
function validateBehaviorData(data: unknown): data is Partial<UserBehaviorData> {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as Record<string, unknown>;

  // 数値フィールドのバリデーション
  const numericFields = [
    'likesGiven',
    'commentsGiven',
    'sharesGiven',
    'repliesReceived',
    'postsThisWeek',
    'postsLastWeek',
    'averagePostsPerWeek',
    'trendingHashtagsUsed',
    'trendingTopicsEngaged',
    'earlyTrendEngagement',
    'followersGained',
    'mentionsReceived',
    'savedByOthers',
    'profileVisits',
  ];

  for (const field of numericFields) {
    if (field in d && typeof d[field] !== 'number') {
      return false;
    }
    if (field in d && (d[field] as number) < 0) {
      return false;
    }
  }

  // postTimingsは数値配列
  if ('postTimings' in d) {
    if (!Array.isArray(d.postTimings)) {
      return false;
    }
    for (const timing of d.postTimings as unknown[]) {
      if (typeof timing !== 'number' || timing < 0 || timing > 23) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 部分的なbehaviorDataを完全なものにマージ
 */
function mergeBehaviorData(partial: Partial<UserBehaviorData>): UserBehaviorData {
  const defaults = generateSampleBehaviorData();
  return {
    likesGiven: partial.likesGiven ?? defaults.likesGiven,
    commentsGiven: partial.commentsGiven ?? defaults.commentsGiven,
    sharesGiven: partial.sharesGiven ?? defaults.sharesGiven,
    repliesReceived: partial.repliesReceived ?? defaults.repliesReceived,
    postsThisWeek: partial.postsThisWeek ?? defaults.postsThisWeek,
    postsLastWeek: partial.postsLastWeek ?? defaults.postsLastWeek,
    averagePostsPerWeek: partial.averagePostsPerWeek ?? defaults.averagePostsPerWeek,
    postTimings: partial.postTimings ?? defaults.postTimings,
    trendingHashtagsUsed: partial.trendingHashtagsUsed ?? defaults.trendingHashtagsUsed,
    trendingTopicsEngaged: partial.trendingTopicsEngaged ?? defaults.trendingTopicsEngaged,
    earlyTrendEngagement: partial.earlyTrendEngagement ?? defaults.earlyTrendEngagement,
    followersGained: partial.followersGained ?? defaults.followersGained,
    mentionsReceived: partial.mentionsReceived ?? defaults.mentionsReceived,
    savedByOthers: partial.savedByOthers ?? defaults.savedByOthers,
    profileVisits: partial.profileVisits ?? defaults.profileVisits,
  };
}

/**
 * POST: 好感度スコア計算
 *
 * ユーザーの行動データからプラットフォーム好感度スコアを計算し、
 * 改善レコメンデーションを生成します。
 * オプションでClaude AIによる詳細分析も提供。
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // リクエストボディのパース
    let body: ScoreRequestBody;
    try {
      body = await request.json();
    } catch {
      return validationError('Invalid JSON in request body');
    }

    const { platform, behaviorData, includeAiAnalysis = false } = body;

    // バリデーション: プラットフォーム
    const validPlatforms: Platform[] = ['threads', 'instagram', 'twitter'];
    if (!platform || !validPlatforms.includes(platform)) {
      return validationError(
        'Valid platform is required (threads, instagram, twitter)'
      );
    }

    // 行動データの準備
    let fullBehaviorData: UserBehaviorData;
    if (behaviorData) {
      if (!validateBehaviorData(behaviorData)) {
        return validationError(
          'Invalid behavior data: numeric fields must be non-negative numbers, postTimings must be array of hours (0-23)'
        );
      }
      fullBehaviorData = mergeBehaviorData(behaviorData);
    } else {
      // サンプルデータを使用
      fullBehaviorData = generateSampleBehaviorData();
    }

    // スコア計算
    const scoreResult: ScoreCalculationResult = calculatePlatformScore(
      platform,
      fullBehaviorData
    );

    // ランク取得
    const rank = getScoreRank(scoreResult.score.overallScore);

    // レスポンスデータの構築
    const responseData: ScoreResponseData = {
      score: scoreResult.score,
      rank,
      recommendations: scoreResult.recommendations,
    };

    // AI分析が要求された場合
    if (includeAiAnalysis) {
      const apiKey = getApiKeyFromEnv();
      if (!apiKey) {
        return serverError(
          'Claude API key is not configured. Please set ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable.',
          500
        );
      }

      try {
        const client = new ClaudeClient({ apiKey });
        const aiInsights = await client.analyzeScore(platform, {
          likesGiven: fullBehaviorData.likesGiven,
          commentsGiven: fullBehaviorData.commentsGiven,
          sharesGiven: fullBehaviorData.sharesGiven,
          postsThisWeek: fullBehaviorData.postsThisWeek,
          trendingHashtagsUsed: fullBehaviorData.trendingHashtagsUsed,
          followersGained: fullBehaviorData.followersGained,
        });
        responseData.aiInsights = aiInsights;
      } catch (aiError) {
        // AI分析のエラーはログに記録するが、スコア結果は返す
        console.error('AI analysis error:', aiError);
        // aiInsightsは undefined のまま
      }
    }

    const processingTime = Date.now() - startTime;

    // 成功レスポンス
    const response: AnalysisResponse<ScoreResponseData> = {
      success: true,
      data: responseData,
      processingTime,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Score calculation error:', error);

    // ClaudeAPIErrorの処理
    if (error instanceof ClaudeAPIError) {
      const statusCode =
        error.type === 'auth_error'
          ? 401
          : error.type === 'rate_limit'
            ? 429
            : error.type === 'invalid_request'
              ? 400
              : 500;

      const response: AnalysisResponse<never> = {
        success: false,
        error: error.message,
        processingTime,
      };

      if (error.type === 'rate_limit' && error.retryAfter) {
        return NextResponse.json(response, {
          status: statusCode,
          headers: {
            'Retry-After': String(Math.ceil(error.retryAfter / 1000)),
          },
        });
      }

      return NextResponse.json(response, { status: statusCode });
    }

    // 一般的なエラー
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    const response: AnalysisResponse<never> = {
      success: false,
      error: errorMessage,
      processingTime,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * GET: API情報とサンプルスコア
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;

  // プラットフォームが指定された場合はサンプルスコアを返す
  if (platform && ['threads', 'instagram', 'twitter'].includes(platform)) {
    const sampleData = generateSampleBehaviorData();
    const scoreResult = calculatePlatformScore(platform, sampleData);
    const rank = getScoreRank(scoreResult.score.overallScore);

    return NextResponse.json(
      {
        message: 'Sample score for ' + platform,
        score: scoreResult.score,
        rank,
        recommendations: scoreResult.recommendations.slice(0, 3),
        note: 'This is a sample score. POST with actual behavior data for accurate results.',
      },
      { status: 200 }
    );
  }

  // API情報を返す
  return NextResponse.json(
    {
      message: 'Platform Score API',
      version: '1.0',
      model: 'claude-sonnet-4-20250514 (optional AI analysis)',
      description:
        'Calculates platform favorability score and generates improvement recommendations',
      usage: {
        method: 'POST',
        body: {
          platform: '"threads" | "instagram" | "twitter" (required)',
          behaviorData: 'UserBehaviorData object (optional, uses sample data if not provided)',
          includeAiAnalysis: 'boolean (optional, default: false)',
        },
        response: {
          success: 'boolean',
          data: {
            score: 'PlatformScore object',
            rank: '{ rank, color, label }',
            recommendations: 'ScoreRecommendation[]',
            aiInsights: 'AI analysis (if requested)',
          },
          error: 'string on failure',
          processingTime: 'number (milliseconds)',
        },
      },
      behaviorDataSchema: {
        likesGiven: 'number - Likes given to others',
        commentsGiven: 'number - Comments given to others',
        sharesGiven: 'number - Shares/reposts',
        repliesReceived: 'number - Replies received',
        postsThisWeek: 'number - Posts this week',
        postsLastWeek: 'number - Posts last week',
        averagePostsPerWeek: 'number - Average posts per week',
        postTimings: 'number[] - Post hours (0-23)',
        trendingHashtagsUsed: 'number - Trending hashtags used',
        trendingTopicsEngaged: 'number - Trending topics engaged',
        earlyTrendEngagement: 'number - Early trend engagement count',
        followersGained: 'number - New followers gained',
        mentionsReceived: 'number - Mentions received',
        savedByOthers: 'number - Times saved by others',
        profileVisits: 'number - Profile visits',
      },
      scoreCategories: {
        engagementScore: 'Contribution to platform engagement (likes, comments, shares)',
        consistencyScore: 'Posting consistency and timing optimization',
        trendScore: 'Participation in trending topics',
        communityScore: 'Community building and influence',
      },
      ranks: {
        S: '90+: Platform favorite',
        A: '80-89: Well liked',
        B: '70-79: On track',
        C: '50-69: Room for improvement',
        D: '<50: Needs work',
      },
      features: [
        'Multi-factor score calculation',
        'Personalized recommendations',
        'Score history tracking',
        'AI-powered insights (optional)',
        'Platform-specific optimization',
      ],
      sampleEndpoint: 'GET /api/score?platform=threads',
    },
    { status: 200 }
  );
}
