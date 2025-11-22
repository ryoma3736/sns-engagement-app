/**
 * StrategyManager Service Tests
 *
 * Tests for engagement strategy management and ratio calculations
 */

import {
  StrategyManager,
  DEFAULT_STRATEGY,
  DAY_LABELS,
  MODE_DESCRIPTIONS,
  getStrategyManager,
  resetStrategyManager,
  WeeklyScheduleItem,
  RatioHealthCheck,
  PostClassification,
  OptimalPostTime,
} from '../strategyManager';
import type { EngagementStrategy, CommentStrategy, Platform } from '../../types/index';

describe('StrategyManager', () => {
  let manager: StrategyManager;

  beforeEach(() => {
    manager = new StrategyManager();
    resetStrategyManager();
  });

  describe('constructor', () => {
    it('should initialize with default strategy', () => {
      const newManager = new StrategyManager();
      const strategy = newManager.getStrategy();

      expect(strategy.impressionRatio).toBe(DEFAULT_STRATEGY.impressionRatio);
      expect(strategy.expressionRatio).toBe(DEFAULT_STRATEGY.expressionRatio);
    });

    it('should merge custom strategy with defaults', () => {
      const customStrategy: Partial<EngagementStrategy> = {
        impressionRatio: 0.85,
        expressionRatio: 0.15,
      };
      const customManager = new StrategyManager(customStrategy);
      const strategy = customManager.getStrategy();

      expect(strategy.impressionRatio).toBe(0.85);
      expect(strategy.expressionRatio).toBe(0.15);
      expect(strategy.commentStrategy).toEqual(DEFAULT_STRATEGY.commentStrategy);
    });

    it('should normalize ratios if they do not sum to 1', () => {
      const invalidRatios: Partial<EngagementStrategy> = {
        impressionRatio: 0.6,
        expressionRatio: 0.6,
      };
      const normalizedManager = new StrategyManager(invalidRatios);
      const strategy = normalizedManager.getStrategy();

      expect(strategy.impressionRatio + strategy.expressionRatio).toBeCloseTo(1, 5);
    });
  });

  describe('getStrategy', () => {
    it('should return a copy of the strategy', () => {
      const strategy1 = manager.getStrategy();
      const strategy2 = manager.getStrategy();

      expect(strategy1).toEqual(strategy2);
      expect(strategy1).not.toBe(strategy2); // Should be different objects
    });
  });

  describe('setImpressionRatio', () => {
    it('should set impression ratio and calculate expression ratio', () => {
      manager.setImpressionRatio(0.8);
      const strategy = manager.getStrategy();

      expect(strategy.impressionRatio).toBe(0.8);
      expect(strategy.expressionRatio).toBeCloseTo(0.2, 10);
    });

    it('should clamp ratio to minimum 0.5', () => {
      manager.setImpressionRatio(0.3);
      const strategy = manager.getStrategy();

      expect(strategy.impressionRatio).toBe(0.5);
      expect(strategy.expressionRatio).toBe(0.5);
    });

    it('should clamp ratio to maximum 1.0', () => {
      manager.setImpressionRatio(1.5);
      const strategy = manager.getStrategy();

      expect(strategy.impressionRatio).toBe(1);
      expect(strategy.expressionRatio).toBe(0);
    });

    it('should handle boundary values correctly', () => {
      manager.setImpressionRatio(0.5);
      expect(manager.getStrategy().impressionRatio).toBe(0.5);

      manager.setImpressionRatio(1.0);
      expect(manager.getStrategy().impressionRatio).toBe(1.0);
    });
  });

  describe('setExpressionDays', () => {
    it('should set valid expression days', () => {
      manager.setExpressionDays([0, 6]); // Sunday and Saturday
      const strategy = manager.getStrategy();

      expect(strategy.weeklyExpressionDays).toEqual([0, 6]);
    });

    it('should filter out invalid day numbers', () => {
      manager.setExpressionDays([-1, 0, 7, 6, 10]);
      const strategy = manager.getStrategy();

      expect(strategy.weeklyExpressionDays).toEqual([0, 6]);
    });

    it('should handle empty array', () => {
      manager.setExpressionDays([]);
      const strategy = manager.getStrategy();

      expect(strategy.weeklyExpressionDays).toEqual([]);
    });

    it('should accept all valid days 0-6', () => {
      manager.setExpressionDays([0, 1, 2, 3, 4, 5, 6]);
      const strategy = manager.getStrategy();

      expect(strategy.weeklyExpressionDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });

  describe('updateCommentStrategy', () => {
    it('should update comment strategy partially', () => {
      manager.updateCommentStrategy({ enabled: false });
      const strategy = manager.getStrategy();

      expect(strategy.commentStrategy.enabled).toBe(false);
      expect(strategy.commentStrategy.maxCommentsPerDay).toBe(
        DEFAULT_STRATEGY.commentStrategy.maxCommentsPerDay
      );
    });

    it('should update multiple properties', () => {
      manager.updateCommentStrategy({
        maxCommentsPerDay: 20,
        targetTrendingPosts: false,
      });
      const strategy = manager.getStrategy();

      expect(strategy.commentStrategy.maxCommentsPerDay).toBe(20);
      expect(strategy.commentStrategy.targetTrendingPosts).toBe(false);
    });

    it('should preserve existing properties when updating', () => {
      const originalAvoidNegative = DEFAULT_STRATEGY.commentStrategy.avoidNegative;
      manager.updateCommentStrategy({ enabled: true });
      const strategy = manager.getStrategy();

      expect(strategy.commentStrategy.avoidNegative).toBe(originalAvoidNegative);
    });
  });

  describe('getRecommendedMode', () => {
    it('should return expression mode for expression days', () => {
      manager.setExpressionDays([0, 6]); // Sunday and Saturday

      // Create a Sunday date
      const sunday = new Date('2024-01-07'); // This is a Sunday
      expect(manager.getRecommendedMode(sunday)).toBe('expression');
    });

    it('should return impression mode for non-expression days', () => {
      manager.setExpressionDays([0, 6]);

      // Create a Monday date
      const monday = new Date('2024-01-08'); // This is a Monday
      expect(manager.getRecommendedMode(monday)).toBe('impression');
    });

    it('should use current date when no date provided', () => {
      manager.setExpressionDays([]);
      expect(manager.getRecommendedMode()).toBe('impression');
    });
  });

  describe('generateWeeklySchedule', () => {
    it('should generate 7 days of schedule', () => {
      const schedule = manager.generateWeeklySchedule();
      expect(schedule).toHaveLength(7);
    });

    it('should include correct day labels', () => {
      const schedule = manager.generateWeeklySchedule();
      schedule.forEach((item) => {
        expect(DAY_LABELS).toContain(item.dayLabel);
      });
    });

    it('should mark expression days correctly', () => {
      manager.setExpressionDays([0, 6]);
      const schedule = manager.generateWeeklySchedule(new Date('2024-01-07')); // Sunday

      // First day is Sunday (expression day)
      expect(schedule[0].isExpressionDay).toBe(true);
      expect(schedule[0].recommendedMode).toBe('expression');

      // Monday should be impression
      expect(schedule[1].isExpressionDay).toBe(false);
      expect(schedule[1].recommendedMode).toBe('impression');
    });

    it('should generate consecutive dates', () => {
      const startDate = new Date('2024-01-01');
      const schedule = manager.generateWeeklySchedule(startDate);

      for (let i = 0; i < 6; i++) {
        const currentDate = schedule[i].date.getTime();
        const nextDate = schedule[i + 1].date.getTime();
        const dayDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24);
        expect(dayDiff).toBe(1);
      }
    });
  });

  describe('isRatioHealthy', () => {
    it('should return healthy for ratios 0.8-0.95', () => {
      manager.setImpressionRatio(0.9);
      const health = manager.isRatioHealthy();

      expect(health.status).toBe('healthy');
      expect(health.message).toContain('理想的');
    });

    it('should return healthy for boundary value 0.8', () => {
      manager.setImpressionRatio(0.8);
      const health = manager.isRatioHealthy();

      expect(health.status).toBe('healthy');
    });

    it('should return warning for ratios > 0.95', () => {
      manager.setImpressionRatio(0.98);
      const health = manager.isRatioHealthy();

      expect(health.status).toBe('warning');
      expect(health.message).toContain('自己表現が少なすぎ');
    });

    it('should return critical for ratios < 0.7', () => {
      manager.setImpressionRatio(0.6);
      const health = manager.isRatioHealthy();

      expect(health.status).toBe('critical');
      expect(health.message).toContain('自己表現が多すぎ');
    });

    it('should return acceptable for ratios 0.7-0.8', () => {
      manager.setImpressionRatio(0.75);
      const health = manager.isRatioHealthy();

      expect(health.status).toBe('acceptable');
      expect(health.message).toContain('許容範囲');
    });
  });

  describe('getCommentAdvice', () => {
    it('should provide advice when comments are enabled', () => {
      manager.updateCommentStrategy({ enabled: true });
      const advice = manager.getCommentAdvice();

      expect(advice.length).toBeGreaterThan(0);
      expect(advice.some((a) => a.includes('コメント機能が有効'))).toBe(true);
    });

    it('should warn about disabled comments', () => {
      manager.updateCommentStrategy({ enabled: false });
      const advice = manager.getCommentAdvice();

      expect(advice.some((a) => a.includes('コメント機能が無効'))).toBe(true);
    });

    it('should warn about excessive daily comments', () => {
      manager.updateCommentStrategy({
        enabled: true,
        maxCommentsPerDay: 25,
      });
      const advice = manager.getCommentAdvice();

      expect(advice.some((a) => a.includes('スパム判定'))).toBe(true);
    });

    it('should mention trending posts when targeting is enabled', () => {
      manager.updateCommentStrategy({
        enabled: true,
        targetTrendingPosts: true,
      });
      const advice = manager.getCommentAdvice();

      expect(advice.some((a) => a.includes('トレンド投稿'))).toBe(true);
    });

    it('should mention negative comment avoidance when enabled', () => {
      manager.updateCommentStrategy({
        enabled: true,
        avoidNegative: true,
      });
      const advice = manager.getCommentAdvice();

      expect(advice.some((a) => a.includes('ネガティブコメントを避ける'))).toBe(true);
    });
  });

  describe('classifyPost', () => {
    it('should classify impression-focused content', () => {
      const content = 'これは初心者向けの方法を解説します。ノウハウをまとめました。';
      const classification = manager.classifyPost(content);

      expect(classification.suggestedMode).toBe('impression');
      expect(classification.impressionScore).toBeGreaterThan(0);
    });

    it('should classify expression-focused content', () => {
      const content = '個人的に私は思う。好きなことについて雑談します。';
      const classification = manager.classifyPost(content);

      expect(classification.suggestedMode).toBe('expression');
      expect(classification.expressionScore).toBeGreaterThan(0);
    });

    it('should handle mixed content', () => {
      const content = '個人的なおすすめ方法を紹介します。';
      const classification = manager.classifyPost(content);

      expect(['impression', 'expression']).toContain(classification.suggestedMode);
    });

    it('should calculate confidence based on score difference', () => {
      const strongImpressionContent = '方法を解説！コツとポイントをまとめてノウハウを紹介';
      const classification = manager.classifyPost(strongImpressionContent);

      expect(classification.confidence).toBeGreaterThan(0);
    });

    it('should handle content with no keywords', () => {
      const neutralContent = 'Hello world';
      const classification = manager.classifyPost(neutralContent);

      expect(classification.suggestedMode).toBe('impression');
      expect(classification.confidence).toBe(0);
    });
  });

  describe('getOptimalPostTimes', () => {
    it('should return optimal times for threads', () => {
      const times = manager.getOptimalPostTimes('threads');

      expect(times.length).toBeGreaterThan(0);
      times.forEach((time) => {
        expect(time.hour).toBeGreaterThanOrEqual(0);
        expect(time.hour).toBeLessThan(24);
        expect(time.engagement).toBeGreaterThan(0);
        expect(time.engagement).toBeLessThanOrEqual(1);
      });
    });

    it('should return different times for different platforms', () => {
      const threadsTimes = manager.getOptimalPostTimes('threads');
      const twitterTimes = manager.getOptimalPostTimes('twitter');

      // They might have some overlap but should not be identical
      const threadsHours = threadsTimes.map((t) => t.hour);
      const twitterHours = twitterTimes.map((t) => t.hour);

      expect(threadsHours).not.toEqual(twitterHours);
    });

    it('should include engagement scores', () => {
      const times = manager.getOptimalPostTimes('instagram');

      times.forEach((time) => {
        expect(time).toHaveProperty('engagement');
        expect(typeof time.engagement).toBe('number');
      });
    });

    it('should include descriptions', () => {
      const times = manager.getOptimalPostTimes('threads');

      times.forEach((time) => {
        expect(time).toHaveProperty('description');
        expect(time.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('exportStrategy', () => {
    it('should return valid JSON string', () => {
      const json = manager.exportStrategy();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all strategy properties', () => {
      const json = manager.exportStrategy();
      const parsed = JSON.parse(json) as EngagementStrategy;

      expect(parsed).toHaveProperty('impressionRatio');
      expect(parsed).toHaveProperty('expressionRatio');
      expect(parsed).toHaveProperty('weeklyExpressionDays');
      expect(parsed).toHaveProperty('commentStrategy');
    });

    it('should be formatted with indentation', () => {
      const json = manager.exportStrategy();
      expect(json).toContain('\n'); // Has line breaks
      expect(json).toContain('  '); // Has indentation
    });
  });

  describe('importStrategy', () => {
    it('should import valid strategy JSON', () => {
      const customStrategy: EngagementStrategy = {
        impressionRatio: 0.85,
        expressionRatio: 0.15,
        weeklyExpressionDays: [5, 6],
        commentStrategy: {
          enabled: true,
          targetTrendingPosts: false,
          maxCommentsPerDay: 5,
          avoidNegative: true,
        },
      };

      manager.importStrategy(JSON.stringify(customStrategy));
      const imported = manager.getStrategy();

      expect(imported.impressionRatio).toBe(0.85);
      expect(imported.weeklyExpressionDays).toEqual([5, 6]);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => manager.importStrategy('invalid json')).toThrow(
        '無効な戦略データです'
      );
    });

    it('should merge with defaults for partial import', () => {
      const partialStrategy = { impressionRatio: 0.8, expressionRatio: 0.2 };
      manager.importStrategy(JSON.stringify(partialStrategy));
      const imported = manager.getStrategy();

      expect(imported.impressionRatio).toBe(0.8);
      expect(imported.expressionRatio).toBe(0.2);
      expect(imported.commentStrategy).toBeDefined();
    });

    it('should normalize ratios after import', () => {
      const invalidRatios = {
        impressionRatio: 0.6,
        expressionRatio: 0.6,
      };
      manager.importStrategy(JSON.stringify(invalidRatios));
      const imported = manager.getStrategy();

      expect(imported.impressionRatio + imported.expressionRatio).toBeCloseTo(1, 5);
    });
  });
});

describe('Constants and Exports', () => {
  describe('DEFAULT_STRATEGY', () => {
    it('should have 9:1 ratio as recommended', () => {
      expect(DEFAULT_STRATEGY.impressionRatio).toBe(0.9);
      expect(DEFAULT_STRATEGY.expressionRatio).toBe(0.1);
    });

    it('should have weekend as default expression days', () => {
      expect(DEFAULT_STRATEGY.weeklyExpressionDays).toContain(0); // Sunday
      expect(DEFAULT_STRATEGY.weeklyExpressionDays).toContain(6); // Saturday
    });

    it('should have comment strategy enabled by default', () => {
      expect(DEFAULT_STRATEGY.commentStrategy.enabled).toBe(true);
    });
  });

  describe('DAY_LABELS', () => {
    it('should have 7 day labels', () => {
      expect(DAY_LABELS).toHaveLength(7);
    });

    it('should start with Sunday', () => {
      expect(DAY_LABELS[0]).toBe('日');
    });

    it('should end with Saturday', () => {
      expect(DAY_LABELS[6]).toBe('土');
    });
  });

  describe('MODE_DESCRIPTIONS', () => {
    it('should have impression mode description', () => {
      expect(MODE_DESCRIPTIONS.impression).toBeDefined();
      expect(MODE_DESCRIPTIONS.impression.label).toContain('インプレッション');
      expect(MODE_DESCRIPTIONS.impression.tips.length).toBeGreaterThan(0);
    });

    it('should have expression mode description', () => {
      expect(MODE_DESCRIPTIONS.expression).toBeDefined();
      expect(MODE_DESCRIPTIONS.expression.label).toContain('自己表現');
      expect(MODE_DESCRIPTIONS.expression.tips.length).toBeGreaterThan(0);
    });

    it('should have distinct colors for each mode', () => {
      expect(MODE_DESCRIPTIONS.impression.color).not.toBe(
        MODE_DESCRIPTIONS.expression.color
      );
    });
  });
});

describe('Singleton getStrategyManager', () => {
  beforeEach(() => {
    resetStrategyManager();
  });

  it('should return same instance on multiple calls', () => {
    const manager1 = getStrategyManager();
    const manager2 = getStrategyManager();

    expect(manager1).toBe(manager2);
  });

  it('should initialize with custom strategy', () => {
    const manager = getStrategyManager({ impressionRatio: 0.8, expressionRatio: 0.2 });
    const strategy = manager.getStrategy();

    // The strategy manager normalizes ratios and applies custom values
    expect(strategy.impressionRatio).toBe(0.8);
    expect(strategy.expressionRatio).toBe(0.2);
  });

  it('should be resetable', () => {
    const manager1 = getStrategyManager();
    resetStrategyManager();
    const manager2 = getStrategyManager();

    expect(manager1).not.toBe(manager2);
  });
});

describe('Ratio calculations edge cases', () => {
  let manager: StrategyManager;

  beforeEach(() => {
    manager = new StrategyManager();
  });

  it('should handle floating point precision', () => {
    manager.setImpressionRatio(0.85);
    const strategy = manager.getStrategy();

    expect(strategy.impressionRatio + strategy.expressionRatio).toBeCloseTo(1, 10);
  });

  it('should maintain ratio integrity through multiple updates', () => {
    for (let i = 0; i < 10; i++) {
      manager.setImpressionRatio(0.5 + Math.random() * 0.5);
    }

    const strategy = manager.getStrategy();
    expect(strategy.impressionRatio + strategy.expressionRatio).toBeCloseTo(1, 10);
  });
});
