/**
 * Strategy Manager Service
 *
 * エンゲージメント戦略の管理を担当
 * 核心戦略: 「他人が聞きたいことを喋る」を9割、「自分が言いたいこと」を1割
 */

import {
  EngagementStrategy,
  CommentStrategy,
  PostMode,
  PostSchedule,
  Platform,
} from '../types/index';

/**
 * デフォルトの戦略設定
 * 推奨比率: インプレッション獲得 9:1 自己表現
 */
export const DEFAULT_STRATEGY: EngagementStrategy = {
  impressionRatio: 0.9,
  expressionRatio: 0.1,
  weeklyExpressionDays: [0, 6], // 週末（日曜・土曜）を自己表現の日に
  commentStrategy: {
    enabled: true,
    targetTrendingPosts: true,
    maxCommentsPerDay: 10,
    avoidNegative: true,
  },
};

/**
 * 曜日のラベル
 */
export const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/**
 * 投稿モードの説明
 */
export const MODE_DESCRIPTIONS = {
  impression: {
    label: 'インプレッション獲得モード',
    description: '他人が聞きたいことを発信する。プラットフォームに好まれる行動を取る。',
    tips: [
      'トレンドに乗った内容を投稿',
      'コミュニティが求める価値を提供',
      '主宰者（プラットフォーム）に都合の良い行動',
      'エンゲージメントを意識した構成',
    ],
    color: 'emerald',
  },
  expression: {
    label: '自己表現モード',
    description: '自分の言いたいことを発信する。本当の自分を表現する時間。',
    tips: [
      '個人的な意見や感想',
      '好きなことについて語る',
      '自分のペースで投稿',
      'インプレッションを気にしない',
    ],
    color: 'purple',
  },
} as const;

/**
 * 戦略マネージャークラス
 */
export class StrategyManager {
  private strategy: EngagementStrategy;

  constructor(strategy?: Partial<EngagementStrategy>) {
    this.strategy = { ...DEFAULT_STRATEGY, ...strategy };
    this.normalizeRatios();
  }

  /**
   * 比率を正規化（合計が1になるように）
   */
  private normalizeRatios(): void {
    const total = this.strategy.impressionRatio + this.strategy.expressionRatio;
    if (total !== 1) {
      this.strategy.impressionRatio = this.strategy.impressionRatio / total;
      this.strategy.expressionRatio = this.strategy.expressionRatio / total;
    }
  }

  /**
   * 現在の戦略を取得
   */
  getStrategy(): EngagementStrategy {
    return { ...this.strategy };
  }

  /**
   * インプレッション比率を設定
   */
  setImpressionRatio(ratio: number): void {
    const clampedRatio = Math.max(0.5, Math.min(1, ratio)); // 最低50%はインプレッション獲得
    this.strategy.impressionRatio = clampedRatio;
    this.strategy.expressionRatio = 1 - clampedRatio;
  }

  /**
   * 自己表現の曜日を設定
   */
  setExpressionDays(days: number[]): void {
    this.strategy.weeklyExpressionDays = days.filter(d => d >= 0 && d <= 6);
  }

  /**
   * コメント戦略を更新
   */
  updateCommentStrategy(updates: Partial<CommentStrategy>): void {
    this.strategy.commentStrategy = {
      ...this.strategy.commentStrategy,
      ...updates,
    };
  }

  /**
   * 指定した日時に推奨されるモードを取得
   */
  getRecommendedMode(date: Date = new Date()): PostMode {
    const dayOfWeek = date.getDay();

    // 自己表現の日として設定されている場合
    if (this.strategy.weeklyExpressionDays.includes(dayOfWeek)) {
      return 'expression';
    }

    return 'impression';
  }

  /**
   * 週間スケジュールを生成
   */
  generateWeeklySchedule(startDate: Date = new Date()): WeeklyScheduleItem[] {
    const schedule: WeeklyScheduleItem[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const dayOfWeek = date.getDay();
      const isExpressionDay = this.strategy.weeklyExpressionDays.includes(dayOfWeek);

      schedule.push({
        date,
        dayOfWeek,
        dayLabel: DAY_LABELS[dayOfWeek],
        recommendedMode: isExpressionDay ? 'expression' : 'impression',
        isExpressionDay,
      });
    }

    return schedule;
  }

  /**
   * 現在の比率が推奨範囲内かチェック
   */
  isRatioHealthy(): RatioHealthCheck {
    const impressionRatio = this.strategy.impressionRatio;

    if (impressionRatio >= 0.8 && impressionRatio <= 0.95) {
      return {
        status: 'healthy',
        message: '理想的な比率です。他人が聞きたいことを中心に発信しつつ、自己表現の時間も確保できています。',
      };
    }

    if (impressionRatio > 0.95) {
      return {
        status: 'warning',
        message: '自己表現が少なすぎます。燃え尽きを防ぐため、少し自分の好きなことも発信しましょう。',
      };
    }

    if (impressionRatio < 0.7) {
      return {
        status: 'critical',
        message: '自己表現が多すぎます。インプレッション獲得には「他人が聞きたいこと」を増やしましょう。',
      };
    }

    return {
      status: 'acceptable',
      message: '許容範囲ですが、改善の余地があります。',
    };
  }

  /**
   * コメント戦略のアドバイスを生成
   */
  getCommentAdvice(): string[] {
    const advice: string[] = [];
    const cs = this.strategy.commentStrategy;

    if (cs.enabled) {
      advice.push('コメント機能が有効です。積極的にコミュニティに参加しましょう。');

      if (cs.targetTrendingPosts) {
        advice.push('トレンド投稿へのコメントで、自分の存在をアピールしましょう。');
      }

      if (cs.avoidNegative) {
        advice.push('ネガティブコメントを避けることで、プラットフォームからの評価を維持できます。');
      }

      if (cs.maxCommentsPerDay > 20) {
        advice.push('1日のコメント数が多すぎると、スパム判定される可能性があります。');
      }
    } else {
      advice.push('コメント機能が無効です。コミュニティ参加はインプレッション獲得に効果的です。');
    }

    return advice;
  }

  /**
   * 投稿を分類（モード別）
   */
  classifyPost(content: string): PostClassification {
    // 簡易的なキーワードベースの分類
    const expressionKeywords = [
      '個人的', '私は', '思う', '感じる', '好き', '嫌い',
      '日記', '雑談', 'つぶやき', '独り言',
    ];

    const impressionKeywords = [
      '方法', 'コツ', 'ポイント', '解説', '紹介',
      'おすすめ', 'まとめ', 'ランキング', 'トレンド',
      '知識', '情報', 'ノウハウ', 'tips',
    ];

    const expressionScore = expressionKeywords.filter(kw =>
      content.includes(kw)
    ).length;

    const impressionScore = impressionKeywords.filter(kw =>
      content.includes(kw)
    ).length;

    const suggestedMode: PostMode = impressionScore >= expressionScore
      ? 'impression'
      : 'expression';

    return {
      suggestedMode,
      confidence: Math.abs(impressionScore - expressionScore) / 5,
      expressionScore,
      impressionScore,
    };
  }

  /**
   * 最適な投稿時間を提案
   */
  getOptimalPostTimes(platform: Platform): OptimalPostTime[] {
    // プラットフォーム別の最適投稿時間（一般的な統計に基づく）
    const platformTimes: Record<Platform, OptimalPostTime[]> = {
      threads: [
        { hour: 7, description: '通勤時間帯', engagement: 0.8 },
        { hour: 12, description: 'ランチタイム', engagement: 0.85 },
        { hour: 19, description: '帰宅後', engagement: 0.9 },
        { hour: 21, description: 'リラックスタイム', engagement: 0.95 },
      ],
      instagram: [
        { hour: 8, description: '朝の時間', engagement: 0.75 },
        { hour: 12, description: 'ランチタイム', engagement: 0.8 },
        { hour: 17, description: '仕事終わり', engagement: 0.85 },
        { hour: 20, description: '夜のゴールデンタイム', engagement: 0.95 },
      ],
      twitter: [
        { hour: 7, description: '朝の情報収集', engagement: 0.85 },
        { hour: 12, description: 'ランチタイム', engagement: 0.9 },
        { hour: 18, description: '帰宅時間', engagement: 0.85 },
        { hour: 22, description: '夜の時間帯', engagement: 0.8 },
      ],
    };

    return platformTimes[platform] || platformTimes.threads;
  }

  /**
   * 戦略をJSONとしてエクスポート
   */
  exportStrategy(): string {
    return JSON.stringify(this.strategy, null, 2);
  }

  /**
   * JSONから戦略をインポート
   */
  importStrategy(json: string): void {
    try {
      const parsed = JSON.parse(json) as EngagementStrategy;
      this.strategy = { ...DEFAULT_STRATEGY, ...parsed };
      this.normalizeRatios();
    } catch {
      throw new Error('無効な戦略データです');
    }
  }
}

/**
 * 週間スケジュールのアイテム
 */
export interface WeeklyScheduleItem {
  date: Date;
  dayOfWeek: number;
  dayLabel: string;
  recommendedMode: PostMode;
  isExpressionDay: boolean;
}

/**
 * 比率の健全性チェック結果
 */
export interface RatioHealthCheck {
  status: 'healthy' | 'acceptable' | 'warning' | 'critical';
  message: string;
}

/**
 * 投稿の分類結果
 */
export interface PostClassification {
  suggestedMode: PostMode;
  confidence: number;
  expressionScore: number;
  impressionScore: number;
}

/**
 * 最適な投稿時間
 */
export interface OptimalPostTime {
  hour: number;
  description: string;
  engagement: number;
}

/**
 * シングルトンインスタンスの取得
 */
let strategyManagerInstance: StrategyManager | null = null;

export function getStrategyManager(strategy?: Partial<EngagementStrategy>): StrategyManager {
  if (!strategyManagerInstance) {
    strategyManagerInstance = new StrategyManager(strategy);
  }
  return strategyManagerInstance;
}

/**
 * 戦略マネージャーをリセット
 */
export function resetStrategyManager(): void {
  strategyManagerInstance = null;
}
