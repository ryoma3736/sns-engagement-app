/**
 * useStrategy Hook
 *
 * Zustandを使用したエンゲージメント戦略の状態管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  EngagementStrategy,
  CommentStrategy,
  PostMode,
  Platform,
} from '../types/index';
import {
  DEFAULT_STRATEGY,
  DAY_LABELS,
  MODE_DESCRIPTIONS,
  StrategyManager,
  WeeklyScheduleItem,
  RatioHealthCheck,
  OptimalPostTime,
} from '../services/strategyManager';

/**
 * 戦略ストアの状態型
 */
interface StrategyState {
  // 状態
  strategy: EngagementStrategy;
  isLoading: boolean;
  lastUpdated: Date | null;

  // 計算された値
  weeklySchedule: WeeklyScheduleItem[];
  ratioHealth: RatioHealthCheck;
  commentAdvice: string[];

  // アクション
  setImpressionRatio: (ratio: number) => void;
  setExpressionDays: (days: number[]) => void;
  toggleExpressionDay: (day: number) => void;
  updateCommentStrategy: (updates: Partial<CommentStrategy>) => void;
  resetToDefault: () => void;
  getRecommendedMode: (date?: Date) => PostMode;
  getOptimalPostTimes: (platform: Platform) => OptimalPostTime[];
  refreshSchedule: () => void;
}

/**
 * 戦略管理のZustandストア
 */
export const useStrategy = create<StrategyState>()(
  persist(
    (set, get) => {
      // 初期のStrategyManagerインスタンス
      const manager = new StrategyManager(DEFAULT_STRATEGY);

      return {
        // 初期状態
        strategy: DEFAULT_STRATEGY,
        isLoading: false,
        lastUpdated: null,
        weeklySchedule: manager.generateWeeklySchedule(),
        ratioHealth: manager.isRatioHealthy(),
        commentAdvice: manager.getCommentAdvice(),

        // インプレッション比率を設定
        setImpressionRatio: (ratio: number) => {
          const clampedRatio = Math.max(0.5, Math.min(1, ratio));
          const newStrategy: EngagementStrategy = {
            ...get().strategy,
            impressionRatio: clampedRatio,
            expressionRatio: 1 - clampedRatio,
          };

          const newManager = new StrategyManager(newStrategy);

          set({
            strategy: newStrategy,
            ratioHealth: newManager.isRatioHealthy(),
            lastUpdated: new Date(),
          });
        },

        // 自己表現の曜日を設定
        setExpressionDays: (days: number[]) => {
          const validDays = days.filter(d => d >= 0 && d <= 6);
          const newStrategy: EngagementStrategy = {
            ...get().strategy,
            weeklyExpressionDays: validDays,
          };

          const newManager = new StrategyManager(newStrategy);

          set({
            strategy: newStrategy,
            weeklySchedule: newManager.generateWeeklySchedule(),
            lastUpdated: new Date(),
          });
        },

        // 自己表現の曜日をトグル
        toggleExpressionDay: (day: number) => {
          const currentDays = get().strategy.weeklyExpressionDays;
          const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];

          get().setExpressionDays(newDays);
        },

        // コメント戦略を更新
        updateCommentStrategy: (updates: Partial<CommentStrategy>) => {
          const newStrategy: EngagementStrategy = {
            ...get().strategy,
            commentStrategy: {
              ...get().strategy.commentStrategy,
              ...updates,
            },
          };

          const newManager = new StrategyManager(newStrategy);

          set({
            strategy: newStrategy,
            commentAdvice: newManager.getCommentAdvice(),
            lastUpdated: new Date(),
          });
        },

        // デフォルトにリセット
        resetToDefault: () => {
          const newManager = new StrategyManager(DEFAULT_STRATEGY);

          set({
            strategy: DEFAULT_STRATEGY,
            weeklySchedule: newManager.generateWeeklySchedule(),
            ratioHealth: newManager.isRatioHealthy(),
            commentAdvice: newManager.getCommentAdvice(),
            lastUpdated: new Date(),
          });
        },

        // 推奨モードを取得
        getRecommendedMode: (date?: Date) => {
          const manager = new StrategyManager(get().strategy);
          return manager.getRecommendedMode(date);
        },

        // 最適な投稿時間を取得
        getOptimalPostTimes: (platform: Platform) => {
          const manager = new StrategyManager(get().strategy);
          return manager.getOptimalPostTimes(platform);
        },

        // スケジュールをリフレッシュ
        refreshSchedule: () => {
          const manager = new StrategyManager(get().strategy);
          set({
            weeklySchedule: manager.generateWeeklySchedule(),
          });
        },
      };
    },
    {
      name: 'sns-engagement-strategy',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        strategy: state.strategy,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

/**
 * 比率をパーセンテージで取得するヘルパー
 */
export function useRatioPercentages() {
  const strategy = useStrategy((state) => state.strategy);

  return {
    impressionPercent: Math.round(strategy.impressionRatio * 100),
    expressionPercent: Math.round(strategy.expressionRatio * 100),
  };
}

/**
 * モード情報を取得するヘルパー
 */
export function useModeInfo(mode: PostMode) {
  return MODE_DESCRIPTIONS[mode];
}

/**
 * 曜日ラベルを取得するヘルパー
 */
export function getDayLabels() {
  return DAY_LABELS;
}

/**
 * 現在のモードを取得するヘルパー
 */
export function useCurrentMode() {
  const getRecommendedMode = useStrategy((state) => state.getRecommendedMode);
  return getRecommendedMode(new Date());
}

/**
 * 戦略の概要を取得するヘルパー
 */
export function useStrategySummary() {
  const strategy = useStrategy((state) => state.strategy);
  const ratioHealth = useStrategy((state) => state.ratioHealth);

  const impressionPercent = Math.round(strategy.impressionRatio * 100);
  const expressionPercent = Math.round(strategy.expressionRatio * 100);
  const expressionDays = strategy.weeklyExpressionDays
    .map(d => DAY_LABELS[d])
    .join('、');

  return {
    impressionPercent,
    expressionPercent,
    expressionDays: expressionDays || 'なし',
    healthStatus: ratioHealth.status,
    healthMessage: ratioHealth.message,
    commentEnabled: strategy.commentStrategy.enabled,
    maxComments: strategy.commentStrategy.maxCommentsPerDay,
  };
}
