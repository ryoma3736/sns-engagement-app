/**
 * 通知ユーティリティ
 *
 * 通知条件判定とメッセージ生成を行うユーティリティ関数群
 */

import { AlertData, AlertSeverity, AlertCategory } from '../components/AlertBanner';
import { PlatformScore, EngagementStrategy, Platform } from '../types/index';

/**
 * ユニークIDを生成
 */
function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// 比率関連の通知
// =============================================================================

/**
 * 比率ヘルスチェック結果
 */
export interface RatioHealthResult {
  isHealthy: boolean;
  severity: AlertSeverity | null;
  message: string;
  recommendation: string;
}

/**
 * 比率の健全性をチェック
 * 推奨比率: インプレッション 80-95%、自己表現 5-20%
 */
export function checkRatioHealth(
  impressionRatio: number,
  expressionRatio: number
): RatioHealthResult {
  // 9:1 を基準として判定
  const idealImpressionMin = 0.80;
  const idealImpressionMax = 0.95;

  if (impressionRatio >= idealImpressionMin && impressionRatio <= idealImpressionMax) {
    return {
      isHealthy: true,
      severity: null,
      message: '比率は適正範囲内です',
      recommendation: 'このままのペースを維持しましょう',
    };
  }

  if (impressionRatio < idealImpressionMin) {
    // 自己表現が多すぎる
    const severity: AlertSeverity = impressionRatio < 0.7 ? 'warning' : 'info';
    return {
      isHealthy: false,
      severity,
      message: `自己表現モードが${Math.round(expressionRatio * 100)}%と多めです`,
      recommendation: '「他人が聞きたいこと」を中心に発信すると、プラットフォームに好まれます',
    };
  }

  // インプレッションモードが多すぎる
  return {
    isHealthy: false,
    severity: 'info',
    message: 'インプレッションモードに偏っています',
    recommendation: 'たまには自己表現も大切です。週1回は自分の想いを発信しましょう',
  };
}

/**
 * 比率アラートを生成
 */
export function createRatioAlert(
  impressionRatio: number,
  onAction?: () => void
): AlertData | null {
  const expressionRatio = 1 - impressionRatio;
  const health = checkRatioHealth(impressionRatio, expressionRatio);

  if (health.isHealthy || !health.severity) {
    return null;
  }

  return {
    id: generateAlertId(),
    severity: health.severity,
    category: 'ratio',
    title: health.message,
    message: health.recommendation,
    actionLabel: '戦略を調整する',
    onAction,
    dismissible: true,
  };
}

// =============================================================================
// スコア関連の通知
// =============================================================================

/**
 * スコア変化の分析結果
 */
export interface ScoreChangeAnalysis {
  trend: 'improving' | 'stable' | 'declining';
  severity: AlertSeverity | null;
  change: number;
  message: string;
  recommendations: string[];
}

/**
 * スコア変化を分析
 */
export function analyzeScoreChange(
  currentScore: number,
  previousScore: number,
  threshold: number = 5
): ScoreChangeAnalysis {
  const change = currentScore - previousScore;

  if (change >= threshold) {
    return {
      trend: 'improving',
      severity: 'success',
      change,
      message: `スコアが${change}ポイント上昇しました`,
      recommendations: ['この調子で継続しましょう', '成功パターンを分析して再現しましょう'],
    };
  }

  if (change <= -threshold) {
    const isSerious = change <= -10;
    return {
      trend: 'declining',
      severity: isSerious ? 'critical' : 'warning',
      change,
      message: `スコアが${Math.abs(change)}ポイント低下しました`,
      recommendations: [
        'エンゲージメント活動を増やしましょう',
        'トレンドトピックに参加しましょう',
        '投稿頻度を見直しましょう',
      ],
    };
  }

  return {
    trend: 'stable',
    severity: null,
    change,
    message: 'スコアは安定しています',
    recommendations: ['現在の活動を維持しましょう'],
  };
}

/**
 * スコアアラートを生成
 */
export function createScoreAlert(
  currentScore: number,
  previousScore: number,
  onAction?: () => void
): AlertData | null {
  const analysis = analyzeScoreChange(currentScore, previousScore);

  // 安定している場合はアラートなし
  if (analysis.trend === 'stable') {
    return null;
  }

  // 上昇している場合は成功通知
  if (analysis.trend === 'improving') {
    return {
      id: generateAlertId(),
      severity: 'success',
      category: 'score',
      title: 'スコアが上昇しています',
      message: `${analysis.message}。この調子で継続しましょう。`,
      dismissible: true,
    };
  }

  // 低下している場合は警告
  return {
    id: generateAlertId(),
    severity: analysis.severity ?? 'warning',
    category: 'score',
    title: analysis.message,
    message: analysis.recommendations.join(' '),
    actionLabel: '改善策を見る',
    onAction,
    dismissible: true,
  };
}

/**
 * スコアに基づいたアクション推奨を生成
 */
export function generateScoreRecommendations(score: PlatformScore): AlertData[] {
  const alerts: AlertData[] = [];

  // エンゲージメントスコアが低い場合
  if (score.engagementScore < 50) {
    alerts.push({
      id: generateAlertId(),
      severity: 'warning',
      category: 'action',
      title: 'エンゲージメント活動を増やしましょう',
      message: '他の投稿へのいいねやコメントを増やすと、プラットフォームに好かれます。',
      dismissible: true,
    });
  }

  // 一貫性スコアが低い場合
  if (score.consistencyScore < 50) {
    alerts.push({
      id: generateAlertId(),
      severity: 'info',
      category: 'action',
      title: '投稿頻度を安定させましょう',
      message: '定期的な投稿がプラットフォームの評価を上げます。週3-5回を目標に。',
      dismissible: true,
    });
  }

  // トレンドスコアが低い場合
  if (score.trendScore < 50) {
    alerts.push({
      id: generateAlertId(),
      severity: 'info',
      category: 'action',
      title: 'トレンドに参加しましょう',
      message: 'トレンドハッシュタグを活用すると、露出が増えます。',
      dismissible: true,
    });
  }

  // コミュニティスコアが低い場合
  if (score.communityScore < 50) {
    alerts.push({
      id: generateAlertId(),
      severity: 'info',
      category: 'action',
      title: 'コミュニティとの交流を増やしましょう',
      message: '他のユーザーとの対話を増やすと、フォロワー獲得につながります。',
      dismissible: true,
    });
  }

  return alerts;
}

// =============================================================================
// システム通知
// =============================================================================

/**
 * システムアナウンスを生成
 */
export function createAnnouncement(
  title: string,
  message: string,
  options?: {
    severity?: AlertSeverity;
    actionLabel?: string;
    onAction?: () => void;
    expiresAt?: Date;
  }
): AlertData {
  return {
    id: generateAlertId(),
    severity: options?.severity ?? 'info',
    category: 'announcement',
    title,
    message,
    actionLabel: options?.actionLabel,
    onAction: options?.onAction,
    expiresAt: options?.expiresAt,
    dismissible: true,
  };
}

// =============================================================================
// 通知メッセージテンプレート
// =============================================================================

/**
 * 成功メッセージテンプレート
 */
export const successMessages = {
  contentAnalyzed: 'コンテンツの分析が完了しました',
  contentOptimized: 'コンテンツが最適化されました',
  strategySaved: '戦略設定を保存しました',
  scheduleUpdated: 'スケジュールを更新しました',
  scoreCalculated: 'スコアを計算しました',
  postScheduled: '投稿をスケジュールしました',
};

/**
 * エラーメッセージテンプレート
 */
export const errorMessages = {
  analysisError: 'コンテンツの分析に失敗しました',
  optimizationError: '最適化処理に失敗しました',
  networkError: 'ネットワークエラーが発生しました',
  apiError: 'APIエラーが発生しました',
  validationError: '入力内容に問題があります',
  unknownError: '予期しないエラーが発生しました',
};

/**
 * 警告メッセージテンプレート
 */
export const warningMessages = {
  ratioUnbalanced: '投稿比率が推奨範囲外です',
  scoreDeclining: 'スコアが低下傾向にあります',
  lowEngagement: 'エンゲージメントが少なくなっています',
  inactivityDetected: 'しばらく活動がありません',
};

/**
 * 情報メッセージテンプレート
 */
export const infoMessages = {
  newFeature: '新機能が利用可能です',
  tip: 'ヒント',
  recommendation: 'おすすめ',
  update: 'アップデート情報',
};

// =============================================================================
// 通知条件判定ユーティリティ
// =============================================================================

/**
 * 投稿頻度が低いかどうかを判定
 */
export function isPostingFrequencyLow(
  postsThisWeek: number,
  threshold: number = 2
): boolean {
  return postsThisWeek < threshold;
}

/**
 * エンゲージメントが低いかどうかを判定
 */
export function isEngagementLow(
  likesGiven: number,
  commentsGiven: number,
  threshold: { likes: number; comments: number } = { likes: 10, comments: 3 }
): boolean {
  return likesGiven < threshold.likes || commentsGiven < threshold.comments;
}

/**
 * スコアが危険ゾーンかどうかを判定
 */
export function isScoreInDangerZone(score: number, threshold: number = 40): boolean {
  return score < threshold;
}

/**
 * 連続したスコア低下を検出
 */
export function detectConsecutiveDecline(
  scoreHistory: number[],
  consecutiveDays: number = 3
): boolean {
  if (scoreHistory.length < consecutiveDays) return false;

  const recentScores = scoreHistory.slice(-consecutiveDays);
  for (let i = 1; i < recentScores.length; i++) {
    if (recentScores[i] >= recentScores[i - 1]) {
      return false;
    }
  }
  return true;
}

// =============================================================================
// ローカルストレージ管理
// =============================================================================

const DISMISSED_ALERTS_KEY = 'sns-engagement-dismissed-alerts';

/**
 * 非表示にしたアラートを保存
 */
export function saveDismissedAlert(alertId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const dismissed = getDismissedAlerts();
    dismissed.push({
      id: alertId,
      dismissedAt: new Date().toISOString(),
    });
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed));
  } catch (error) {
    console.error('Failed to save dismissed alert:', error);
  }
}

/**
 * 非表示にしたアラートを取得
 */
export function getDismissedAlerts(): Array<{ id: string; dismissedAt: string }> {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(DISMISSED_ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get dismissed alerts:', error);
    return [];
  }
}

/**
 * アラートが非表示にされているかチェック
 */
export function isAlertDismissed(alertId: string): boolean {
  const dismissed = getDismissedAlerts();
  return dismissed.some((item) => item.id === alertId);
}

/**
 * 古い非表示記録をクリーンアップ（7日以上前のもの）
 */
export function cleanupDismissedAlerts(daysToKeep: number = 7): void {
  if (typeof window === 'undefined') return;

  try {
    const dismissed = getDismissedAlerts();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filtered = dismissed.filter(
      (item) => new Date(item.dismissedAt) > cutoffDate
    );
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to cleanup dismissed alerts:', error);
  }
}
