/**
 * Claude API Client
 *
 * Anthropic Claude APIのラッパークライアント
 * - エラーハンドリング
 * - レート制限対応
 * - プロンプト生成
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  Platform,
  BuzzAnalysis,
  ContentStructure,
  OptimizedContent,
  PostMode,
} from '../types/index.js';

/**
 * Claude API設定
 */
export interface ClaudeConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * APIエラーの種類
 */
export type ClaudeErrorType =
  | 'auth_error'
  | 'rate_limit'
  | 'invalid_request'
  | 'server_error'
  | 'parse_error'
  | 'unknown';

/**
 * Claude APIエラー
 */
export class ClaudeAPIError extends Error {
  public readonly type: ClaudeErrorType;
  public readonly statusCode?: number;
  public readonly retryAfter?: number;

  constructor(
    message: string,
    type: ClaudeErrorType,
    statusCode?: number,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'ClaudeAPIError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

/**
 * プラットフォーム別最適化ルール
 */
interface PlatformRules {
  maxLength: number;
  hashtagCount: number;
  tone: string;
  formatting: string[];
  bestPractices: string[];
}

/**
 * プラットフォームルール定義
 */
const PLATFORM_RULES: Record<Platform, PlatformRules> = {
  threads: {
    maxLength: 500,
    hashtagCount: 3,
    tone: '会話的でカジュアル、親しみやすい',
    formatting: ['短い段落', '絵文字適度に使用', '質問で終わる'],
    bestPractices: [
      '最初の1行で興味を引く',
      '読者に語りかける口調',
      '共感を誘う表現',
      'シンプルな言葉選び',
    ],
  },
  instagram: {
    maxLength: 2200,
    hashtagCount: 15,
    tone: 'ビジュアル重視、感情的なストーリーテリング',
    formatting: ['改行を多用', '絵文字をセクション分けに使用', 'CTAを明確に'],
    bestPractices: [
      'フック(最初の125文字)が重要',
      'ストーリー形式で展開',
      'ハッシュタグは最後にまとめる',
      '保存したくなる価値を提供',
    ],
  },
  twitter: {
    maxLength: 280,
    hashtagCount: 2,
    tone: 'シャープで簡潔、インパクト重視',
    formatting: ['1文1ツイート感覚', '数字を効果的に使用', 'スレッド形式も検討'],
    bestPractices: [
      '最初の数語で勝負',
      '反論を呼ぶ主張',
      'リツイートしたくなる価値',
      '議論を促す問いかけ',
    ],
  },
};

/**
 * レート制限管理
 */
class RateLimiter {
  private requestTimes: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 50) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * リクエスト可能かチェック
   */
  canRequest(): boolean {
    this.cleanup();
    return this.requestTimes.length < this.maxRequests;
  }

  /**
   * リクエストを記録
   */
  recordRequest(): void {
    this.requestTimes.push(Date.now());
  }

  /**
   * 次にリクエスト可能になるまでの時間（ミリ秒）
   */
  getWaitTime(): number {
    if (this.canRequest()) return 0;
    this.cleanup();
    if (this.requestTimes.length === 0) return 0;
    const oldestRequest = this.requestTimes[0];
    return Math.max(0, oldestRequest + this.windowMs - Date.now());
  }

  /**
   * 古いリクエスト記録を削除
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.requestTimes = this.requestTimes.filter((time) => time > cutoff);
  }
}

/**
 * Claude APIクライアント
 */
export class ClaudeClient {
  private client: Anthropic;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly rateLimiter: RateLimiter;

  constructor(config: ClaudeConfig) {
    if (!config.apiKey) {
      throw new ClaudeAPIError(
        'API key is required',
        'auth_error'
      );
    }

    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 0.7;
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Claude APIにメッセージを送信
   */
  private async sendMessage(prompt: string): Promise<string> {
    // レート制限チェック
    if (!this.rateLimiter.canRequest()) {
      const waitTime = this.rateLimiter.getWaitTime();
      throw new ClaudeAPIError(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        'rate_limit',
        429,
        waitTime
      );
    }

    try {
      this.rateLimiter.recordRequest();

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new ClaudeAPIError(
          'Unexpected response format',
          'parse_error'
        );
      }

      return content.text;
    } catch (error) {
      if (error instanceof ClaudeAPIError) {
        throw error;
      }

      // Anthropic SDKエラーを処理
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('authentication') || errorMessage.includes('api key')) {
          throw new ClaudeAPIError(
            'Invalid API key',
            'auth_error',
            401
          );
        }

        if (errorMessage.includes('rate limit')) {
          throw new ClaudeAPIError(
            'Rate limit exceeded',
            'rate_limit',
            429
          );
        }

        if (errorMessage.includes('invalid')) {
          throw new ClaudeAPIError(
            error.message,
            'invalid_request',
            400
          );
        }

        throw new ClaudeAPIError(
          error.message,
          'server_error',
          500
        );
      }

      throw new ClaudeAPIError(
        'Unknown error occurred',
        'unknown'
      );
    }
  }

  /**
   * JSONレスポンスを抽出・パース
   */
  private parseJsonResponse<T>(text: string): T {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new ClaudeAPIError(
        'Failed to parse JSON response',
        'parse_error'
      );
    }

    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      throw new ClaudeAPIError(
        'Invalid JSON in response',
        'parse_error'
      );
    }
  }

  /**
   * ユニークIDを生成
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * バズ投稿分析プロンプトを生成
   */
  private buildAnalysisPrompt(
    url: string,
    content: string,
    platform: Platform
  ): string {
    return `
あなたはSNSバズコンテンツの専門アナリストです。

以下のバズ投稿を分析し、なぜバズったのかを構造的に解析してください。

【投稿URL】
${url}

【投稿内容】
${content}

【プラットフォーム】
${platform}

以下のJSON形式で回答してください:
{
  "transcript": "投稿の本質的なメッセージ・ノウハウを台本形式で抽出（そのまま使える形式で）",
  "keyPoints": ["バズった要因1", "バズった要因2", "バズった要因3"],
  "structure": {
    "hook": "冒頭のフック（最初に読者を引き込んだ部分）",
    "mainPoints": ["主要ポイント1", "主要ポイント2", "主要ポイント3"],
    "cta": "Call to Action（行動を促す部分）",
    "emotionalTriggers": ["感情トリガー1", "感情トリガー2"]
  },
  "estimatedImpressions": 推定インプレッション数（数値のみ）,
  "estimatedEngagement": 推定エンゲージメント率（0-100の数値）
}

JSONのみを返してください。説明は不要です。
`;
  }

  /**
   * 最適化プロンプトを生成
   */
  private buildOptimizationPrompt(
    analysis: BuzzAnalysis,
    targetPlatform: Platform,
    mode: PostMode
  ): string {
    const rules = PLATFORM_RULES[targetPlatform];
    const modeGuidance =
      mode === 'impression'
        ? 'インプレッション最大化を優先。多くの人に届く普遍的な表現を使用。'
        : '自己表現を優先。個性的な視点と独自の言葉選びを重視。';

    return `
あなたはSNSコンテンツ最適化のプロです。

【ガッチャンコ作業】
以下のバズったノウハウを、${targetPlatform}用に言い回しを変換してください。

【元のバズコンテンツの台本】
${analysis.transcript}

【バズった要因】
${analysis.keyPoints.join('\n')}

【コンテンツ構造】
- フック: ${analysis.structure.hook}
- 主要ポイント: ${analysis.structure.mainPoints.join(', ')}
- CTA: ${analysis.structure.cta}
- 感情トリガー: ${analysis.structure.emotionalTriggers.join(', ')}

【${targetPlatform}の最適化ルール】
- 最大文字数: ${rules.maxLength}文字
- トーン: ${rules.tone}
- フォーマット: ${rules.formatting.join(', ')}
- ベストプラクティス: ${rules.bestPractices.join(', ')}

【モード】
${modeGuidance}

以下のJSON形式で最適化されたコンテンツを返してください:
{
  "content": "最適化されたコンテンツ本文（${rules.maxLength}文字以内）",
  "hashtags": ["関連ハッシュタグ1", "関連ハッシュタグ2", "関連ハッシュタグ3"],
  "expectedImpressions": 期待されるインプレッション数（数値のみ）
}

重要:
- 元のバズ要因を保ちながら、${targetPlatform}に最適な表現に変換
- ${targetPlatform}ユーザーが好む言い回しを使用
- そのまま投稿できる完成形で出力

JSONのみを返してください。
`;
  }

  /**
   * スコア分析プロンプトを生成
   */
  private buildScoreAnalysisPrompt(
    platform: Platform,
    behaviorData: {
      likesGiven: number;
      commentsGiven: number;
      sharesGiven: number;
      postsThisWeek: number;
      trendingHashtagsUsed: number;
      followersGained: number;
    }
  ): string {
    return `
あなたはSNSマーケティングの専門家です。

以下のユーザー行動データを分析し、プラットフォームからの評価を予測してください。

【プラットフォーム】
${platform}

【ユーザー行動データ】
- 他者へのいいね数: ${behaviorData.likesGiven}
- 他者へのコメント数: ${behaviorData.commentsGiven}
- シェア/リポスト数: ${behaviorData.sharesGiven}
- 今週の投稿数: ${behaviorData.postsThisWeek}
- トレンドタグ使用数: ${behaviorData.trendingHashtagsUsed}
- 獲得フォロワー数: ${behaviorData.followersGained}

以下のJSON形式で回答してください:
{
  "aiInsight": "AIによる総合的な分析コメント（100-200文字）",
  "strengths": ["強み1", "強み2", "強み3"],
  "improvements": ["改善点1", "改善点2"],
  "priorityAction": "最も効果的な次のアクション",
  "estimatedGrowthPotential": 成長ポテンシャル（0-100の数値）
}

JSONのみを返してください。
`;
  }

  /**
   * バズ投稿を分析
   */
  async analyzeBuzzContent(
    url: string,
    content: string,
    platform: Platform
  ): Promise<BuzzAnalysis> {
    const prompt = this.buildAnalysisPrompt(url, content, platform);
    const responseText = await this.sendMessage(prompt);

    interface AnalysisData {
      transcript: string;
      keyPoints: string[];
      structure: ContentStructure;
      estimatedImpressions: number;
      estimatedEngagement: number;
    }

    const data = this.parseJsonResponse<AnalysisData>(responseText);

    return {
      id: this.generateId(),
      platform,
      originalUrl: url,
      impressions: data.estimatedImpressions,
      engagement: data.estimatedEngagement,
      transcript: data.transcript,
      keyPoints: data.keyPoints,
      structure: data.structure,
      analyzedAt: new Date(),
    };
  }

  /**
   * プラットフォーム別に最適化
   */
  async optimizeForPlatform(
    analysis: BuzzAnalysis,
    targetPlatform: Platform,
    mode: PostMode = 'impression'
  ): Promise<OptimizedContent> {
    const prompt = this.buildOptimizationPrompt(analysis, targetPlatform, mode);
    const responseText = await this.sendMessage(prompt);

    interface OptimizationData {
      content: string;
      hashtags: string[];
      expectedImpressions: number;
    }

    const data = this.parseJsonResponse<OptimizationData>(responseText);
    const rules = PLATFORM_RULES[targetPlatform];

    return {
      id: this.generateId(),
      originalAnalysisId: analysis.id,
      targetPlatform,
      content: data.content,
      hashtags: data.hashtags.slice(0, rules.hashtagCount),
      bestPostTime: this.calculateBestPostTime(targetPlatform),
      expectedImpressions: data.expectedImpressions,
      mode,
      createdAt: new Date(),
    };
  }

  /**
   * AIによるスコア分析
   */
  async analyzeScore(
    platform: Platform,
    behaviorData: {
      likesGiven: number;
      commentsGiven: number;
      sharesGiven: number;
      postsThisWeek: number;
      trendingHashtagsUsed: number;
      followersGained: number;
    }
  ): Promise<{
    aiInsight: string;
    strengths: string[];
    improvements: string[];
    priorityAction: string;
    estimatedGrowthPotential: number;
  }> {
    const prompt = this.buildScoreAnalysisPrompt(platform, behaviorData);
    const responseText = await this.sendMessage(prompt);

    interface ScoreAnalysisData {
      aiInsight: string;
      strengths: string[];
      improvements: string[];
      priorityAction: string;
      estimatedGrowthPotential: number;
    }

    return this.parseJsonResponse<ScoreAnalysisData>(responseText);
  }

  /**
   * 最適な投稿時間を計算
   */
  private calculateBestPostTime(platform: Platform): Date {
    const times: Record<Platform, { hour: number; minute: number }[]> = {
      threads: [
        { hour: 7, minute: 0 },
        { hour: 12, minute: 0 },
        { hour: 20, minute: 0 },
      ],
      instagram: [
        { hour: 6, minute: 0 },
        { hour: 11, minute: 0 },
        { hour: 19, minute: 0 },
      ],
      twitter: [
        { hour: 8, minute: 0 },
        { hour: 12, minute: 30 },
        { hour: 17, minute: 0 },
      ],
    };

    const platformTimes = times[platform];
    const now = new Date();

    // 今日の残りの最適時間を探す
    for (const time of platformTimes) {
      const candidate = new Date(now);
      candidate.setHours(time.hour, time.minute, 0, 0);

      if (candidate > now) {
        return candidate;
      }
    }

    // 今日の最適時間が全て過ぎていたら、明日の最初の最適時間
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(platformTimes[0].hour, platformTimes[0].minute, 0, 0);

    return tomorrow;
  }

  /**
   * プラットフォームルールを取得
   */
  getPlatformRules(platform: Platform): PlatformRules {
    return PLATFORM_RULES[platform];
  }
}

/**
 * シングルトンインスタンス
 */
let clientInstance: ClaudeClient | null = null;

/**
 * ClaudeClientのインスタンスを取得
 */
export function getClaudeClient(apiKey?: string): ClaudeClient {
  if (!clientInstance && apiKey) {
    clientInstance = new ClaudeClient({ apiKey });
  } else if (apiKey && clientInstance) {
    // 新しいAPIキーが提供された場合は再作成
    clientInstance = new ClaudeClient({ apiKey });
  } else if (!clientInstance && !apiKey) {
    throw new ClaudeAPIError(
      'API key is required to create client',
      'auth_error'
    );
  }
  return clientInstance!;
}

/**
 * APIキーを環境変数から取得
 */
export function getApiKeyFromEnv(): string | undefined {
  return process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
}

export default ClaudeClient;
