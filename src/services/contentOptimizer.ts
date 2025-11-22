/**
 * Content Optimizer Service
 *
 * バズ投稿の分析とプラットフォーム別最適化を行うサービス
 *
 * 核心戦略:
 * - ノウハウはバズっているものから抽出
 * - プラットフォーム用の言い回しに変換
 * - ガッチャンコして載せるだけ
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  Platform,
  BuzzAnalysis,
  OptimizedContent,
  ContentStructure,
  PostMode,
} from '../types/index.js';

/**
 * プラットフォーム別の最適化ルール
 */
interface PlatformOptimizationRules {
  maxLength: number;
  hashtagCount: number;
  tone: string;
  formatting: string[];
  bestPractices: string[];
}

/**
 * プラットフォーム別最適化ルール定義
 */
const PLATFORM_RULES: Record<Platform, PlatformOptimizationRules> = {
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
 * ベストな投稿時間（プラットフォーム別）
 */
const BEST_POST_TIMES: Record<Platform, { hour: number; minute: number }[]> = {
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

/**
 * Content Optimizer Class
 */
export class ContentOptimizer {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  /**
   * API Keyを設定
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = new Anthropic({ apiKey });
  }

  /**
   * バズ投稿を分析して台本を抽出
   */
  async analyzeBuzzContent(
    url: string,
    content: string,
    platform: Platform
  ): Promise<BuzzAnalysis> {
    if (!this.client) {
      throw new Error('Claude API key is not configured');
    }

    const prompt = `
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

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // JSON部分を抽出
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse analysis response');
    }

    const analysisData = JSON.parse(jsonMatch[0]) as {
      transcript: string;
      keyPoints: string[];
      structure: ContentStructure;
      estimatedImpressions: number;
      estimatedEngagement: number;
    };

    const analysis: BuzzAnalysis = {
      id: this.generateId(),
      platform,
      originalUrl: url,
      impressions: analysisData.estimatedImpressions,
      engagement: analysisData.estimatedEngagement,
      transcript: analysisData.transcript,
      keyPoints: analysisData.keyPoints,
      structure: analysisData.structure,
      analyzedAt: new Date(),
    };

    return analysis;
  }

  /**
   * ガッチャンコ機能: バズノウハウ × プラットフォーム最適化
   *
   * 核心戦略の実装:
   * 1. バズっているコンテンツからノウハウを抽出（analyzeBuzzContentで完了済み）
   * 2. ターゲットプラットフォーム用の言い回しに変換
   * 3. 組み合わせて最適化されたコンテンツを生成
   */
  async optimizeForPlatform(
    analysis: BuzzAnalysis,
    targetPlatform: Platform,
    mode: PostMode = 'impression'
  ): Promise<OptimizedContent> {
    if (!this.client) {
      throw new Error('Claude API key is not configured');
    }

    const rules = PLATFORM_RULES[targetPlatform];
    const modeGuidance =
      mode === 'impression'
        ? 'インプレッション最大化を優先。多くの人に届く普遍的な表現を使用。'
        : '自己表現を優先。個性的な視点と独自の言葉選びを重視。';

    const prompt = `
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

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse optimization response');
    }

    const optimizationData = JSON.parse(jsonMatch[0]) as {
      content: string;
      hashtags: string[];
      expectedImpressions: number;
    };

    const bestTime = this.calculateBestPostTime(targetPlatform);

    const optimizedContent: OptimizedContent = {
      id: this.generateId(),
      originalAnalysisId: analysis.id,
      targetPlatform,
      content: optimizationData.content,
      hashtags: optimizationData.hashtags.slice(0, rules.hashtagCount),
      bestPostTime: bestTime,
      expectedImpressions: optimizationData.expectedImpressions,
      mode,
      createdAt: new Date(),
    };

    return optimizedContent;
  }

  /**
   * 複数プラットフォーム向けに一括最適化
   */
  async optimizeForMultiplePlatforms(
    analysis: BuzzAnalysis,
    platforms: Platform[],
    mode: PostMode = 'impression'
  ): Promise<OptimizedContent[]> {
    const results: OptimizedContent[] = [];

    for (const platform of platforms) {
      const optimized = await this.optimizeForPlatform(analysis, platform, mode);
      results.push(optimized);
    }

    return results;
  }

  /**
   * プラットフォーム別最適化ルールを取得
   */
  getPlatformRules(platform: Platform): PlatformOptimizationRules {
    return PLATFORM_RULES[platform];
  }

  /**
   * 最適な投稿時間を計算
   */
  private calculateBestPostTime(platform: Platform): Date {
    const times = BEST_POST_TIMES[platform];
    const now = new Date();

    // 今日の残りの最適時間を探す
    for (const time of times) {
      const candidate = new Date(now);
      candidate.setHours(time.hour, time.minute, 0, 0);

      if (candidate > now) {
        return candidate;
      }
    }

    // 今日の最適時間が全て過ぎていたら、明日の最初の最適時間
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(times[0].hour, times[0].minute, 0, 0);

    return tomorrow;
  }

  /**
   * ユニークIDを生成
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * コンテンツをプレビュー形式で整形
   */
  formatContentPreview(
    content: OptimizedContent,
    includeHashtags: boolean = true
  ): string {
    let preview = content.content;

    if (includeHashtags && content.hashtags.length > 0) {
      preview += '\n\n' + content.hashtags.map((tag) => `#${tag}`).join(' ');
    }

    return preview;
  }
}

/**
 * シングルトンインスタンス
 */
let optimizerInstance: ContentOptimizer | null = null;

/**
 * ContentOptimizerのインスタンスを取得
 */
export function getContentOptimizer(apiKey?: string): ContentOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new ContentOptimizer(apiKey);
  } else if (apiKey) {
    optimizerInstance.setApiKey(apiKey);
  }
  return optimizerInstance;
}

export default ContentOptimizer;
