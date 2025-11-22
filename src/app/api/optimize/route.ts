/**
 * Optimize API Route
 *
 * ガッチャンコ機能: バズノウハウ x プラットフォーム最適化
 * - Claude claude-sonnet-4-20250514を使用
 * - プラットフォーム別の言い回し最適化
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ClaudeClient,
  ClaudeAPIError,
  getApiKeyFromEnv,
} from '../../../lib/claude';
import type {
  Platform,
  BuzzAnalysis,
  PostMode,
  OptimizedContent,
  AnalysisResponse,
} from '../../../types/index';

/**
 * 最適化リクエストボディ
 */
interface OptimizeRequestBody {
  analysis: BuzzAnalysis;
  targetPlatform: Platform;
  mode?: PostMode;
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
 * BuzzAnalysisのバリデーション
 */
function validateAnalysis(analysis: unknown): analysis is BuzzAnalysis {
  if (!analysis || typeof analysis !== 'object') {
    return false;
  }

  const a = analysis as Record<string, unknown>;

  // 必須フィールドのチェック
  if (typeof a.transcript !== 'string' || a.transcript.trim().length === 0) {
    return false;
  }

  if (!Array.isArray(a.keyPoints) || a.keyPoints.length === 0) {
    return false;
  }

  if (!a.structure || typeof a.structure !== 'object') {
    return false;
  }

  const structure = a.structure as Record<string, unknown>;
  if (
    typeof structure.hook !== 'string' ||
    !Array.isArray(structure.mainPoints) ||
    typeof structure.cta !== 'string' ||
    !Array.isArray(structure.emotionalTriggers)
  ) {
    return false;
  }

  return true;
}

/**
 * POST: ガッチャンコ機能
 *
 * バズ分析結果をターゲットプラットフォーム向けに最適化します。
 * Claude claude-sonnet-4-20250514を使用して、プラットフォーム固有の言い回しに変換。
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // リクエストボディのパース
    let body: OptimizeRequestBody;
    try {
      body = await request.json();
    } catch {
      return validationError('Invalid JSON in request body');
    }

    const { analysis, targetPlatform, mode } = body;

    // バリデーション: 分析データ
    if (!validateAnalysis(analysis)) {
      return validationError(
        'Invalid analysis data: must include transcript, keyPoints, and complete structure (hook, mainPoints, cta, emotionalTriggers)'
      );
    }

    // バリデーション: プラットフォーム
    const validPlatforms: Platform[] = ['threads', 'instagram', 'twitter'];
    if (!targetPlatform || !validPlatforms.includes(targetPlatform)) {
      return validationError(
        'Valid target platform is required (threads, instagram, twitter)'
      );
    }

    // モードのデフォルト値設定
    const validMode: PostMode =
      mode === 'expression' ? 'expression' : 'impression';

    // APIキー取得
    const apiKey = getApiKeyFromEnv();
    if (!apiKey) {
      return serverError(
        'Claude API key is not configured. Please set ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable.',
        500
      );
    }

    // Claude APIクライアント初期化と最適化実行
    const client = new ClaudeClient({ apiKey });
    const optimizedContent = await client.optimizeForPlatform(
      analysis,
      targetPlatform,
      validMode
    );

    const processingTime = Date.now() - startTime;

    // 成功レスポンス
    const response: AnalysisResponse<OptimizedContent> = {
      success: true,
      data: optimizedContent,
      processingTime,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Optimization error:', error);

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

      // レート制限の場合はRetry-Afterヘッダーを追加
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
 * GET: API情報
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message: 'Content Optimize API (Gatchanko)',
      version: '2.0',
      model: 'claude-sonnet-4-20250514',
      description:
        'Combines buzz content know-how with platform-specific expressions',
      usage: {
        method: 'POST',
        body: {
          analysis: 'BuzzAnalysis object (required) - Result from /api/analyze',
          targetPlatform: '"threads" | "instagram" | "twitter" (required)',
          mode: '"impression" | "expression" (optional, default: "impression")',
        },
        response: {
          success: 'boolean',
          data: 'OptimizedContent object on success',
          error: 'string on failure',
          processingTime: 'number (milliseconds)',
        },
      },
      modes: {
        impression:
          'Prioritizes reach - uses universal expressions that appeal to wider audience',
        expression:
          'Prioritizes personality - uses unique perspective and distinctive wording',
      },
      features: [
        'Platform-specific optimization',
        'Hashtag generation',
        'Best post time calculation',
        'Impression prediction',
        'Rate limiting support',
      ],
    },
    { status: 200 }
  );
}
