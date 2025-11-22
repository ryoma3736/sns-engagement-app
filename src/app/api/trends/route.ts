/**
 * Trends API Route
 *
 * トレンド検出・分析エンドポイント
 * コメント戦略に活用するためのトレンド情報を提供
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  TrendDetector,
  TrendDetectionRequest,
  TrendCategory,
} from '../../../services/trendDetector';
import type { Platform } from '../../../types/index';

/**
 * バリデーション: プラットフォーム
 */
function isValidPlatform(platform: string): platform is Platform {
  return ['threads', 'instagram', 'twitter'].includes(platform);
}

/**
 * バリデーション: カテゴリ
 */
function isValidCategory(category: string): category is TrendCategory {
  return [
    'entertainment',
    'technology',
    'lifestyle',
    'business',
    'news',
    'sports',
    'education',
    'other',
  ].includes(category);
}

/**
 * GET /api/trends
 *
 * トレンドデータを取得
 *
 * Query Parameters:
 * - platform: Platform (required) - 対象プラットフォーム
 * - category: TrendCategory (optional) - フィルタするカテゴリ
 * - limit: number (optional, default: 10) - 取得件数
 * - includeHashtags: boolean (optional, default: true) - ハッシュタグ分析を含めるか
 * - includeBuzzPatterns: boolean (optional, default: true) - バズパターンを含めるか
 * - action: string (optional) - 特別なアクション ('comment-strategies')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // プラットフォームの取得とバリデーション
    const platform = searchParams.get('platform');
    if (!platform || !isValidPlatform(platform)) {
      return NextResponse.json(
        {
          error:
            'Valid platform is required (threads, instagram, twitter)',
        },
        { status: 400 }
      );
    }

    // オプショナルパラメータの取得
    const category = searchParams.get('category');
    const limitParam = searchParams.get('limit');
    const includeHashtags = searchParams.get('includeHashtags') !== 'false';
    const includeBuzzPatterns = searchParams.get('includeBuzzPatterns') !== 'false';
    const action = searchParams.get('action');

    // カテゴリのバリデーション
    if (category && !isValidCategory(category)) {
      return NextResponse.json(
        {
          error:
            'Invalid category. Valid values: entertainment, technology, lifestyle, business, news, sports, education, other',
        },
        { status: 400 }
      );
    }

    // limitのバリデーション
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 50' },
        { status: 400 }
      );
    }

    // API keyの取得
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    // TrendDetectorのインスタンス化
    const detector = new TrendDetector(apiKey);

    // コメント戦略アクションの処理
    if (action === 'comment-strategies') {
      const detectionRequest: TrendDetectionRequest = {
        platform,
        category: category as TrendCategory | undefined,
        limit,
        includeHashtags: false,
        includeBuzzPatterns: false,
      };

      const trendData = await detector.detectTrends(detectionRequest);
      const strategies = await detector.getCommentStrategyRecommendations(
        trendData.trends,
        5
      );

      return NextResponse.json(strategies);
    }

    // 通常のトレンド検出
    const detectionRequest: TrendDetectionRequest = {
      platform,
      category: category as TrendCategory | undefined,
      limit,
      includeHashtags,
      includeBuzzPatterns,
    };

    const result = await detector.detectTrends(detectionRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Trends API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trends
 *
 * トレンドデータを取得（リクエストボディで詳細な設定が可能）
 *
 * Request Body:
 * {
 *   platform: Platform (required)
 *   category?: TrendCategory
 *   limit?: number
 *   includeHashtags?: boolean
 *   includeBuzzPatterns?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // プラットフォームのバリデーション
    if (!body.platform || !isValidPlatform(body.platform)) {
      return NextResponse.json(
        {
          error:
            'Valid platform is required (threads, instagram, twitter)',
        },
        { status: 400 }
      );
    }

    // カテゴリのバリデーション
    if (body.category && !isValidCategory(body.category)) {
      return NextResponse.json(
        {
          error:
            'Invalid category. Valid values: entertainment, technology, lifestyle, business, news, sports, education, other',
        },
        { status: 400 }
      );
    }

    // limitのバリデーション
    const limit = body.limit || 10;
    if (typeof limit !== 'number' || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 50' },
        { status: 400 }
      );
    }

    // API keyの取得
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    // TrendDetectorのインスタンス化
    const detector = new TrendDetector(apiKey);

    // トレンド検出リクエストの作成
    const detectionRequest: TrendDetectionRequest = {
      platform: body.platform,
      category: body.category,
      limit,
      includeHashtags: body.includeHashtags !== false,
      includeBuzzPatterns: body.includeBuzzPatterns !== false,
    };

    const result = await detector.detectTrends(detectionRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Trends API error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * API情報を返す
 */
export async function OPTIONS() {
  return NextResponse.json({
    endpoints: {
      GET: {
        description: 'Get trending topics and analysis',
        parameters: {
          platform: {
            type: 'string',
            required: true,
            values: ['threads', 'instagram', 'twitter'],
          },
          category: {
            type: 'string',
            required: false,
            values: [
              'entertainment',
              'technology',
              'lifestyle',
              'business',
              'news',
              'sports',
              'education',
              'other',
            ],
          },
          limit: {
            type: 'number',
            required: false,
            default: 10,
            min: 1,
            max: 50,
          },
          includeHashtags: {
            type: 'boolean',
            required: false,
            default: true,
          },
          includeBuzzPatterns: {
            type: 'boolean',
            required: false,
            default: true,
          },
          action: {
            type: 'string',
            required: false,
            values: ['comment-strategies'],
          },
        },
      },
      POST: {
        description: 'Get trending topics with detailed configuration',
        body: {
          platform: 'string (required)',
          category: 'string (optional)',
          limit: 'number (optional, default: 10)',
          includeHashtags: 'boolean (optional, default: true)',
          includeBuzzPatterns: 'boolean (optional, default: true)',
        },
      },
    },
    response: {
      trends: 'TrendingTopic[]',
      recommendedHashtags: 'HashtagAnalysis[]',
      buzzPatterns: 'BuzzPattern[]',
      optimalTimings: 'OptimalPostTiming[]',
      analyzedAt: 'Date',
    },
  });
}
