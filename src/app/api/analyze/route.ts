/**
 * Analyze API Route
 *
 * バズ投稿を分析してノウハウを抽出するエンドポイント
 * - Claude claude-sonnet-4-20250514を使用
 * - 台本抽出、バズ要因分析
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ClaudeClient,
  ClaudeAPIError,
  getApiKeyFromEnv,
} from '../../../lib/claude';
import type { Platform, AnalysisResponse, BuzzAnalysis } from '../../../types/index';

/**
 * 分析リクエストボディ
 */
interface AnalyzeRequestBody {
  url?: string;
  content: string;
  platform: Platform;
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
 * POST: バズ投稿分析
 *
 * Claude claude-sonnet-4-20250514を使用して、バズ投稿の構造を分析し、
 * 台本抽出とバズ要因を特定します。
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // リクエストボディのパース
    let body: AnalyzeRequestBody;
    try {
      body = await request.json();
    } catch {
      return validationError('Invalid JSON in request body');
    }

    const { url, content, platform } = body;

    // バリデーション: コンテンツ
    if (!content || typeof content !== 'string') {
      return validationError('Content is required and must be a string');
    }

    if (content.trim().length === 0) {
      return validationError('Content cannot be empty');
    }

    if (content.length > 10000) {
      return validationError('Content exceeds maximum length of 10000 characters');
    }

    // バリデーション: プラットフォーム
    const validPlatforms: Platform[] = ['threads', 'instagram', 'twitter'];
    if (!platform || !validPlatforms.includes(platform)) {
      return validationError(
        'Valid platform is required (threads, instagram, twitter)'
      );
    }

    // APIキー取得
    const apiKey = getApiKeyFromEnv();
    if (!apiKey) {
      return serverError(
        'Claude API key is not configured. Please set ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable.',
        500
      );
    }

    // Claude APIクライアント初期化と分析実行
    const client = new ClaudeClient({ apiKey });
    const analysis = await client.analyzeBuzzContent(
      url || 'manual-input',
      content,
      platform
    );

    const processingTime = Date.now() - startTime;

    // 成功レスポンス
    const response: AnalysisResponse<BuzzAnalysis> = {
      success: true,
      data: analysis,
      processingTime,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Analysis error:', error);

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
      message: 'Content Analyze API',
      version: '2.0',
      model: 'claude-sonnet-4-20250514',
      usage: {
        method: 'POST',
        body: {
          url: 'string (optional) - Original post URL',
          content: 'string (required) - Post content to analyze',
          platform: '"threads" | "instagram" | "twitter" (required)',
        },
        response: {
          success: 'boolean',
          data: 'BuzzAnalysis object on success',
          error: 'string on failure',
          processingTime: 'number (milliseconds)',
        },
      },
      features: [
        'Transcript extraction',
        'Buzz factor analysis',
        'Content structure analysis',
        'Emotional trigger detection',
        'Rate limiting support',
      ],
    },
    { status: 200 }
  );
}
