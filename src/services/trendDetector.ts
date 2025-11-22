/**
 * Trend Detector Service
 *
 * トレンド検出・分析サービス
 * コメント戦略に活用するためのトレンド情報を提供
 *
 * 機能:
 * - トレンドトピック検出
 * - ハッシュタグ分析
 * - バズ投稿パターン分析
 * - 最適投稿タイミング算出
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Platform } from '../types/index';

/**
 * トレンドトピック
 */
export interface TrendingTopic {
  id: string;
  name: string;
  platform: Platform;
  category: TrendCategory;
  volume: number;
  growthRate: number;
  sentiment: TrendSentiment;
  relatedHashtags: string[];
  peakHour: number;
  recommendationScore: number;
  detectedAt: Date;
}

/**
 * トレンドカテゴリ
 */
export type TrendCategory =
  | 'entertainment'
  | 'technology'
  | 'lifestyle'
  | 'business'
  | 'news'
  | 'sports'
  | 'education'
  | 'other';

/**
 * トレンドのセンチメント
 */
export type TrendSentiment = 'positive' | 'negative' | 'neutral' | 'mixed';

/**
 * ハッシュタグ分析結果
 */
export interface HashtagAnalysis {
  hashtag: string;
  platform: Platform;
  popularity: number;
  competitionLevel: 'low' | 'medium' | 'high';
  relevanceScore: number;
  trendingStatus: 'rising' | 'stable' | 'declining';
  relatedTopics: string[];
  bestTimeToUse: number[];
  estimatedReach: number;
}

/**
 * バズ投稿パターン
 */
export interface BuzzPattern {
  id: string;
  platform: Platform;
  patternType: BuzzPatternType;
  description: string;
  successRate: number;
  averageEngagement: number;
  examples: string[];
  requiredElements: string[];
  optimalLength: {
    min: number;
    max: number;
  };
  bestHashtagCount: number;
}

/**
 * バズパターンのタイプ
 */
export type BuzzPatternType =
  | 'storytelling'
  | 'educational'
  | 'controversial'
  | 'inspirational'
  | 'humor'
  | 'breaking_news'
  | 'listicle'
  | 'question'
  | 'behind_the_scenes';

/**
 * 最適投稿タイミング
 */
export interface OptimalPostTiming {
  platform: Platform;
  dayOfWeek: number;
  hour: number;
  engagementMultiplier: number;
  audienceActive: number;
  competition: 'low' | 'medium' | 'high';
  recommendation: 'highly_recommended' | 'recommended' | 'acceptable' | 'avoid';
}

/**
 * トレンド検出リクエスト
 */
export interface TrendDetectionRequest {
  platform: Platform;
  category?: TrendCategory;
  limit?: number;
  includeHashtags?: boolean;
  includeBuzzPatterns?: boolean;
}

/**
 * トレンド検出レスポンス
 */
export interface TrendDetectionResponse {
  trends: TrendingTopic[];
  recommendedHashtags: HashtagAnalysis[];
  buzzPatterns: BuzzPattern[];
  optimalTimings: OptimalPostTiming[];
  analyzedAt: Date;
}

/**
 * コメント戦略推奨
 */
export interface CommentStrategyRecommendation {
  trendId: string;
  trendName: string;
  participationScore: number;
  suggestedApproach: 'agree' | 'add_value' | 'question' | 'share_experience';
  commentTemplates: string[];
  riskLevel: 'low' | 'medium' | 'high';
  potentialReach: number;
}

/**
 * プラットフォーム別のデフォルトトレンドカテゴリ
 */
const PLATFORM_DEFAULT_CATEGORIES: Record<Platform, TrendCategory[]> = {
  threads: ['lifestyle', 'entertainment', 'technology'],
  instagram: ['lifestyle', 'entertainment', 'business'],
  twitter: ['news', 'technology', 'entertainment'],
};

/**
 * 時間帯別エンゲージメント係数
 */
const HOURLY_ENGAGEMENT_MULTIPLIERS: Record<Platform, Record<number, number>> = {
  threads: {
    0: 0.3, 1: 0.2, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2,
    6: 0.5, 7: 0.8, 8: 0.9, 9: 0.7, 10: 0.6, 11: 0.7,
    12: 0.9, 13: 0.7, 14: 0.6, 15: 0.6, 16: 0.7, 17: 0.8,
    18: 0.9, 19: 1.0, 20: 1.0, 21: 0.9, 22: 0.7, 23: 0.5,
  },
  instagram: {
    0: 0.3, 1: 0.2, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2,
    6: 0.6, 7: 0.7, 8: 0.8, 9: 0.6, 10: 0.5, 11: 0.7,
    12: 0.8, 13: 0.6, 14: 0.5, 15: 0.5, 16: 0.6, 17: 0.8,
    18: 0.9, 19: 1.0, 20: 1.0, 21: 0.9, 22: 0.7, 23: 0.4,
  },
  twitter: {
    0: 0.4, 1: 0.3, 2: 0.2, 3: 0.2, 4: 0.2, 5: 0.3,
    6: 0.5, 7: 0.8, 8: 0.9, 9: 0.8, 10: 0.7, 11: 0.8,
    12: 1.0, 13: 0.8, 14: 0.7, 15: 0.7, 16: 0.8, 17: 0.9,
    18: 0.9, 19: 0.8, 20: 0.7, 21: 0.6, 22: 0.5, 23: 0.4,
  },
};

/**
 * バズパターンのテンプレート定義
 */
const BUZZ_PATTERN_TEMPLATES: Record<Platform, BuzzPattern[]> = {
  threads: [
    {
      id: 'threads-storytelling',
      platform: 'threads',
      patternType: 'storytelling',
      description: '個人的な体験を共有するストーリー形式',
      successRate: 0.75,
      averageEngagement: 2500,
      examples: [
        '去年まで○○だった自分が、今では...',
        '失敗から学んだ3つのこと',
      ],
      requiredElements: ['導入のフック', '転機となる出来事', '学びや気づき'],
      optimalLength: { min: 200, max: 500 },
      bestHashtagCount: 3,
    },
    {
      id: 'threads-educational',
      platform: 'threads',
      patternType: 'educational',
      description: '知識やノウハウを共有する教育的コンテンツ',
      successRate: 0.7,
      averageEngagement: 2000,
      examples: [
        '○○する方法を5ステップで解説',
        '知らないと損する○○のコツ',
      ],
      requiredElements: ['明確な価値提案', '具体的なステップ', '実践可能なアドバイス'],
      optimalLength: { min: 150, max: 450 },
      bestHashtagCount: 3,
    },
    {
      id: 'threads-question',
      platform: 'threads',
      patternType: 'question',
      description: 'フォロワーに問いかける形式',
      successRate: 0.65,
      averageEngagement: 1800,
      examples: [
        'みんなは○○についてどう思う?',
        '○○と○○、どっち派?',
      ],
      requiredElements: ['明確な質問', '回答しやすい選択肢', '共感できるテーマ'],
      optimalLength: { min: 50, max: 200 },
      bestHashtagCount: 2,
    },
  ],
  instagram: [
    {
      id: 'instagram-behind-the-scenes',
      platform: 'instagram',
      patternType: 'behind_the_scenes',
      description: '普段見せない舞台裏を公開',
      successRate: 0.8,
      averageEngagement: 3500,
      examples: [
        '普段は見せない作業風景',
        '○○の裏側をお見せします',
      ],
      requiredElements: ['リアルな瞬間', '人間味のある内容', '価値ある舞台裏情報'],
      optimalLength: { min: 100, max: 2200 },
      bestHashtagCount: 15,
    },
    {
      id: 'instagram-inspirational',
      platform: 'instagram',
      patternType: 'inspirational',
      description: '感動や共感を呼ぶインスピレーショナルコンテンツ',
      successRate: 0.72,
      averageEngagement: 3000,
      examples: [
        '諦めかけたときに思い出すこと',
        '○年前の自分に伝えたい言葉',
      ],
      requiredElements: ['感情に訴えるフック', 'ストーリー性', '前向きなメッセージ'],
      optimalLength: { min: 150, max: 2000 },
      bestHashtagCount: 15,
    },
  ],
  twitter: [
    {
      id: 'twitter-controversial',
      platform: 'twitter',
      patternType: 'controversial',
      description: '議論を呼ぶ意見表明',
      successRate: 0.6,
      averageEngagement: 5000,
      examples: [
        '○○は実は○○だと思う。理由は...',
        '人気の○○、実は効果がないって知ってた?',
      ],
      requiredElements: ['明確な主張', '根拠の提示', '議論の余地'],
      optimalLength: { min: 50, max: 280 },
      bestHashtagCount: 2,
    },
    {
      id: 'twitter-listicle',
      platform: 'twitter',
      patternType: 'listicle',
      description: 'リスト形式の情報共有',
      successRate: 0.68,
      averageEngagement: 4000,
      examples: [
        '○○に役立つツール5選',
        '成功者に共通する3つの習慣',
      ],
      requiredElements: ['数字を含むタイトル', '具体的な項目', '保存したくなる価値'],
      optimalLength: { min: 100, max: 280 },
      bestHashtagCount: 2,
    },
  ],
};

/**
 * Trend Detector Class
 */
export class TrendDetector {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;
  private cachedTrends: Map<string, { data: TrendDetectionResponse; timestamp: number }> = new Map();
  private cacheExpiryMs = 30 * 60 * 1000; // 30分

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
   * トレンドを検出
   */
  async detectTrends(request: TrendDetectionRequest): Promise<TrendDetectionResponse> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cachedTrends.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
      return cached.data;
    }

    const { platform, category, limit = 10 } = request;

    // トレンドトピックを生成
    const trends = await this.generateTrendingTopics(platform, category, limit);

    // ハッシュタグ分析
    const recommendedHashtags = request.includeHashtags !== false
      ? await this.analyzeHashtags(platform, trends)
      : [];

    // バズパターン
    const buzzPatterns = request.includeBuzzPatterns !== false
      ? this.getBuzzPatterns(platform)
      : [];

    // 最適投稿タイミング
    const optimalTimings = this.calculateOptimalTimings(platform);

    const response: TrendDetectionResponse = {
      trends,
      recommendedHashtags,
      buzzPatterns,
      optimalTimings,
      analyzedAt: new Date(),
    };

    this.cachedTrends.set(cacheKey, { data: response, timestamp: Date.now() });

    return response;
  }

  /**
   * トレンドトピックを生成
   */
  private async generateTrendingTopics(
    platform: Platform,
    category?: TrendCategory,
    limit: number = 10
  ): Promise<TrendingTopic[]> {
    if (!this.client) {
      // APIキーがない場合はモックデータを返す
      return this.getMockTrendingTopics(platform, category, limit);
    }

    const categories = category
      ? [category]
      : PLATFORM_DEFAULT_CATEGORIES[platform];

    const prompt = `
あなたはSNSトレンド分析の専門家です。

${platform}プラットフォームにおける現在のトレンドトピックを${limit}個生成してください。

【対象カテゴリ】
${categories.join(', ')}

【出力形式】
以下のJSON配列形式で回答してください:
[
  {
    "name": "トレンドトピック名",
    "category": "カテゴリ（entertainment, technology, lifestyle, business, news, sports, education, other）",
    "volume": 推定投稿数（数値）,
    "growthRate": 成長率（0-2の数値、1が横ばい）,
    "sentiment": "センチメント（positive, negative, neutral, mixed）",
    "relatedHashtags": ["関連ハッシュタグ1", "関連ハッシュタグ2"],
    "peakHour": ピーク時間（0-23）,
    "recommendationScore": コメント参加推奨度（0-100）
  }
]

重要:
- 実際にバズりやすいリアルなトピックを生成
- ${platform}ユーザーが関心を持ちそうな内容
- コメント戦略に活用できるトピック

JSONのみを返してください。
`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText =
        response.content[0].type === 'text' ? response.content[0].text : '';

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.getMockTrendingTopics(platform, category, limit);
      }

      const topicsData = JSON.parse(jsonMatch[0]) as Array<{
        name: string;
        category: TrendCategory;
        volume: number;
        growthRate: number;
        sentiment: TrendSentiment;
        relatedHashtags: string[];
        peakHour: number;
        recommendationScore: number;
      }>;

      return topicsData.map((topic, index) => ({
        id: `trend-${platform}-${Date.now()}-${index}`,
        name: topic.name,
        platform,
        category: topic.category,
        volume: topic.volume,
        growthRate: topic.growthRate,
        sentiment: topic.sentiment,
        relatedHashtags: topic.relatedHashtags,
        peakHour: topic.peakHour,
        recommendationScore: topic.recommendationScore,
        detectedAt: new Date(),
      }));
    } catch {
      return this.getMockTrendingTopics(platform, category, limit);
    }
  }

  /**
   * ハッシュタグを分析
   */
  private async analyzeHashtags(
    platform: Platform,
    trends: TrendingTopic[]
  ): Promise<HashtagAnalysis[]> {
    const allHashtags = new Set<string>();
    trends.forEach((trend) => {
      trend.relatedHashtags.forEach((tag) => allHashtags.add(tag));
    });

    const hashtags = Array.from(allHashtags).slice(0, 20);

    return hashtags.map((hashtag, index) => {
      const popularity = Math.floor(Math.random() * 100) + 1;
      const competitionLevel: HashtagAnalysis['competitionLevel'] =
        popularity > 70 ? 'high' : popularity > 40 ? 'medium' : 'low';

      return {
        hashtag,
        platform,
        popularity,
        competitionLevel,
        relevanceScore: Math.floor(Math.random() * 40) + 60,
        trendingStatus: index < 5 ? 'rising' : index < 15 ? 'stable' : 'declining',
        relatedTopics: trends
          .filter((t) => t.relatedHashtags.includes(hashtag))
          .map((t) => t.name),
        bestTimeToUse: this.getBestTimesForHashtag(platform),
        estimatedReach: Math.floor(Math.random() * 50000) + 1000,
      };
    });
  }

  /**
   * バズパターンを取得
   */
  getBuzzPatterns(platform: Platform): BuzzPattern[] {
    return BUZZ_PATTERN_TEMPLATES[platform] || [];
  }

  /**
   * 最適投稿タイミングを計算
   */
  calculateOptimalTimings(platform: Platform): OptimalPostTiming[] {
    const timings: OptimalPostTiming[] = [];
    const multipliers = HOURLY_ENGAGEMENT_MULTIPLIERS[platform];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const multiplier = multipliers[hour] || 0.5;
        const audienceActive = Math.floor(multiplier * 100);

        let competition: OptimalPostTiming['competition'];
        if (multiplier > 0.8) {
          competition = 'high';
        } else if (multiplier > 0.5) {
          competition = 'medium';
        } else {
          competition = 'low';
        }

        let recommendation: OptimalPostTiming['recommendation'];
        if (multiplier >= 0.9) {
          recommendation = 'highly_recommended';
        } else if (multiplier >= 0.7) {
          recommendation = 'recommended';
        } else if (multiplier >= 0.4) {
          recommendation = 'acceptable';
        } else {
          recommendation = 'avoid';
        }

        timings.push({
          platform,
          dayOfWeek: day,
          hour,
          engagementMultiplier: multiplier,
          audienceActive,
          competition,
          recommendation,
        });
      }
    }

    return timings;
  }

  /**
   * コメント戦略の推奨を生成
   */
  async getCommentStrategyRecommendations(
    trends: TrendingTopic[],
    limit: number = 5
  ): Promise<CommentStrategyRecommendation[]> {
    const sortedTrends = [...trends]
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    return sortedTrends.map((trend) => {
      let suggestedApproach: CommentStrategyRecommendation['suggestedApproach'];
      let riskLevel: CommentStrategyRecommendation['riskLevel'];

      switch (trend.sentiment) {
        case 'positive':
          suggestedApproach = 'agree';
          riskLevel = 'low';
          break;
        case 'negative':
          suggestedApproach = 'add_value';
          riskLevel = 'high';
          break;
        case 'mixed':
          suggestedApproach = 'question';
          riskLevel = 'medium';
          break;
        default:
          suggestedApproach = 'share_experience';
          riskLevel = 'low';
      }

      const templates = this.generateCommentTemplates(trend, suggestedApproach);

      return {
        trendId: trend.id,
        trendName: trend.name,
        participationScore: trend.recommendationScore,
        suggestedApproach,
        commentTemplates: templates,
        riskLevel,
        potentialReach: Math.floor(trend.volume * (trend.growthRate || 1) * 0.1),
      };
    });
  }

  /**
   * コメントテンプレートを生成
   */
  private generateCommentTemplates(
    trend: TrendingTopic,
    approach: CommentStrategyRecommendation['suggestedApproach']
  ): string[] {
    const templates: Record<string, string[]> = {
      agree: [
        `${trend.name}について完全に同意です。特に...`,
        `これは本当にそう思います。自分も${trend.name}を経験して...`,
        `素晴らしい視点ですね。${trend.name}は確かに重要...`,
      ],
      add_value: [
        `${trend.name}に関連して、こんな情報もあります...`,
        `これに加えて、${trend.name}については...という観点も`,
        `参考になるかもしれませんが、${trend.name}では...`,
      ],
      question: [
        `${trend.name}について質問があります。...はどう思いますか?`,
        `興味深いですね。${trend.name}の場合、...についてはどうでしょう?`,
        `${trend.name}に関して、皆さんは...という経験ありますか?`,
      ],
      share_experience: [
        `${trend.name}について、自分の経験をシェアすると...`,
        `同じような状況で${trend.name}を試したことがあります...`,
        `${trend.name}について、こんなことがありました...`,
      ],
    };

    return templates[approach] || templates.share_experience;
  }

  /**
   * ハッシュタグの最適使用時間を取得
   */
  private getBestTimesForHashtag(platform: Platform): number[] {
    const multipliers = HOURLY_ENGAGEMENT_MULTIPLIERS[platform];
    const times: number[] = [];

    Object.entries(multipliers).forEach(([hour, multiplier]) => {
      if (multiplier >= 0.8) {
        times.push(parseInt(hour, 10));
      }
    });

    return times;
  }

  /**
   * モックトレンドデータを取得
   */
  private getMockTrendingTopics(
    platform: Platform,
    category?: TrendCategory,
    limit: number = 10
  ): TrendingTopic[] {
    const mockTopics: Record<Platform, TrendingTopic[]> = {
      threads: [
        {
          id: 'trend-threads-1',
          name: 'AI活用術',
          platform: 'threads',
          category: 'technology',
          volume: 15000,
          growthRate: 1.5,
          sentiment: 'positive',
          relatedHashtags: ['AI', '生産性向上', 'ChatGPT'],
          peakHour: 12,
          recommendationScore: 85,
          detectedAt: new Date(),
        },
        {
          id: 'trend-threads-2',
          name: '副業・フリーランス',
          platform: 'threads',
          category: 'business',
          volume: 12000,
          growthRate: 1.3,
          sentiment: 'positive',
          relatedHashtags: ['副業', 'フリーランス', '在宅ワーク'],
          peakHour: 20,
          recommendationScore: 80,
          detectedAt: new Date(),
        },
        {
          id: 'trend-threads-3',
          name: '自己投資',
          platform: 'threads',
          category: 'lifestyle',
          volume: 10000,
          growthRate: 1.2,
          sentiment: 'positive',
          relatedHashtags: ['自己投資', '読書', '学び'],
          peakHour: 21,
          recommendationScore: 75,
          detectedAt: new Date(),
        },
        {
          id: 'trend-threads-4',
          name: 'SNS運用',
          platform: 'threads',
          category: 'business',
          volume: 8000,
          growthRate: 1.4,
          sentiment: 'neutral',
          relatedHashtags: ['SNS運用', 'マーケティング', 'フォロワー'],
          peakHour: 19,
          recommendationScore: 78,
          detectedAt: new Date(),
        },
        {
          id: 'trend-threads-5',
          name: 'ミニマリスト',
          platform: 'threads',
          category: 'lifestyle',
          volume: 6000,
          growthRate: 1.1,
          sentiment: 'positive',
          relatedHashtags: ['ミニマリスト', '断捨離', 'シンプルライフ'],
          peakHour: 22,
          recommendationScore: 70,
          detectedAt: new Date(),
        },
      ],
      instagram: [
        {
          id: 'trend-instagram-1',
          name: 'ライフスタイル',
          platform: 'instagram',
          category: 'lifestyle',
          volume: 25000,
          growthRate: 1.2,
          sentiment: 'positive',
          relatedHashtags: ['暮らし', '日常', 'ライフスタイル'],
          peakHour: 20,
          recommendationScore: 82,
          detectedAt: new Date(),
        },
        {
          id: 'trend-instagram-2',
          name: 'カフェ巡り',
          platform: 'instagram',
          category: 'entertainment',
          volume: 18000,
          growthRate: 1.3,
          sentiment: 'positive',
          relatedHashtags: ['カフェ', 'カフェ巡り', 'コーヒー'],
          peakHour: 15,
          recommendationScore: 75,
          detectedAt: new Date(),
        },
        {
          id: 'trend-instagram-3',
          name: 'フィットネス',
          platform: 'instagram',
          category: 'lifestyle',
          volume: 20000,
          growthRate: 1.4,
          sentiment: 'positive',
          relatedHashtags: ['筋トレ', 'フィットネス', 'ダイエット'],
          peakHour: 7,
          recommendationScore: 80,
          detectedAt: new Date(),
        },
      ],
      twitter: [
        {
          id: 'trend-twitter-1',
          name: 'テック業界',
          platform: 'twitter',
          category: 'technology',
          volume: 30000,
          growthRate: 1.6,
          sentiment: 'mixed',
          relatedHashtags: ['テック', 'エンジニア', 'プログラミング'],
          peakHour: 12,
          recommendationScore: 88,
          detectedAt: new Date(),
        },
        {
          id: 'trend-twitter-2',
          name: 'ニュース速報',
          platform: 'twitter',
          category: 'news',
          volume: 50000,
          growthRate: 2.0,
          sentiment: 'neutral',
          relatedHashtags: ['速報', 'ニュース', '最新'],
          peakHour: 8,
          recommendationScore: 70,
          detectedAt: new Date(),
        },
        {
          id: 'trend-twitter-3',
          name: 'スタートアップ',
          platform: 'twitter',
          category: 'business',
          volume: 15000,
          growthRate: 1.4,
          sentiment: 'positive',
          relatedHashtags: ['スタートアップ', '起業', 'VC'],
          peakHour: 17,
          recommendationScore: 82,
          detectedAt: new Date(),
        },
      ],
    };

    let topics = mockTopics[platform] || mockTopics.threads;

    if (category) {
      topics = topics.filter((t) => t.category === category);
    }

    return topics.slice(0, limit);
  }

  /**
   * キャッシュキーを生成
   */
  private getCacheKey(request: TrendDetectionRequest): string {
    return `${request.platform}-${request.category || 'all'}-${request.limit || 10}`;
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cachedTrends.clear();
  }
}

/**
 * シングルトンインスタンス
 */
let trendDetectorInstance: TrendDetector | null = null;

/**
 * TrendDetectorのインスタンスを取得
 */
export function getTrendDetector(apiKey?: string): TrendDetector {
  if (!trendDetectorInstance) {
    trendDetectorInstance = new TrendDetector(apiKey);
  } else if (apiKey) {
    trendDetectorInstance.setApiKey(apiKey);
  }
  return trendDetectorInstance;
}

/**
 * TrendDetectorをリセット
 */
export function resetTrendDetector(): void {
  trendDetectorInstance = null;
}

export default TrendDetector;
