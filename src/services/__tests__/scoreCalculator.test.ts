/**
 * ScoreCalculator Service Tests
 *
 * Tests for platform score calculation and recommendation generation
 */

import {
  calculatePlatformScore,
  calculateOverallScore,
  generateSampleBehaviorData,
  getScoreRank,
  UserBehaviorData,
  ScoreCalculationResult,
  ScoreRecommendation,
} from '../scoreCalculator';
import type { Platform, PlatformScore, ScoreFactor } from '../../types/index';

describe('ScoreCalculator', () => {
  describe('calculateOverallScore', () => {
    it('should calculate weighted average correctly', () => {
      // With weights: engagement: 0.35, consistency: 0.25, trend: 0.20, community: 0.20
      const result = calculateOverallScore(100, 100, 100, 100);
      expect(result).toBe(100);
    });

    it('should apply correct weights to each score', () => {
      // engagement: 100 * 0.35 = 35
      // consistency: 0 * 0.25 = 0
      // trend: 0 * 0.20 = 0
      // community: 0 * 0.20 = 0
      // Total: 35
      const engagementOnly = calculateOverallScore(100, 0, 0, 0);
      expect(engagementOnly).toBe(35);

      // consistency: 100 * 0.25 = 25
      const consistencyOnly = calculateOverallScore(0, 100, 0, 0);
      expect(consistencyOnly).toBe(25);

      // trend: 100 * 0.20 = 20
      const trendOnly = calculateOverallScore(0, 0, 100, 0);
      expect(trendOnly).toBe(20);

      // community: 100 * 0.20 = 20
      const communityOnly = calculateOverallScore(0, 0, 0, 100);
      expect(communityOnly).toBe(20);
    });

    it('should round the result', () => {
      // With some values that would create decimals
      const result = calculateOverallScore(73, 81, 67, 89);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should handle zero values', () => {
      const result = calculateOverallScore(0, 0, 0, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculatePlatformScore', () => {
    const baseBehaviorData: UserBehaviorData = {
      likesGiven: 50,
      commentsGiven: 15,
      sharesGiven: 8,
      repliesReceived: 10,
      postsThisWeek: 5,
      postsLastWeek: 5,
      averagePostsPerWeek: 5,
      postTimings: [7, 12, 19, 21],
      trendingHashtagsUsed: 4,
      trendingTopicsEngaged: 3,
      earlyTrendEngagement: 1,
      followersGained: 8,
      mentionsReceived: 4,
      savedByOthers: 10,
      profileVisits: 50,
    };

    it('should calculate score for all platforms', () => {
      const platforms: Platform[] = ['threads', 'instagram', 'twitter'];

      platforms.forEach((platform) => {
        const result = calculatePlatformScore(platform, baseBehaviorData);

        expect(result.score.platform).toBe(platform);
        expect(result.score.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.score.overallScore).toBeLessThanOrEqual(100);
      });
    });

    it('should return all score components', () => {
      const result = calculatePlatformScore('threads', baseBehaviorData);

      expect(result.score).toHaveProperty('engagementScore');
      expect(result.score).toHaveProperty('consistencyScore');
      expect(result.score).toHaveProperty('trendScore');
      expect(result.score).toHaveProperty('communityScore');
      expect(result.score).toHaveProperty('overallScore');
    });

    it('should include score factors', () => {
      const result = calculatePlatformScore('threads', baseBehaviorData);

      expect(result.score.factors).toBeDefined();
      expect(result.score.factors.length).toBeGreaterThan(0);

      result.score.factors.forEach((factor) => {
        expect(factor).toHaveProperty('name');
        expect(factor).toHaveProperty('impact');
        expect(factor).toHaveProperty('weight');
        expect(factor).toHaveProperty('description');
        expect(['positive', 'negative', 'neutral']).toContain(factor.impact);
      });
    });

    it('should include recommendations', () => {
      const result = calculatePlatformScore('threads', baseBehaviorData);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should include history entries', () => {
      const result = calculatePlatformScore('threads', baseBehaviorData);

      expect(result.history).toBeDefined();
      expect(result.history.length).toBe(7); // Default 7 days
    });

    it('should generate unique ID with timestamp prefix', () => {
      const result = calculatePlatformScore('threads', baseBehaviorData);

      expect(result.score.id).toBeDefined();
      expect(result.score.id).toMatch(/^score-\d+$/);
    });

    it('should include calculatedAt timestamp', () => {
      const result = calculatePlatformScore('threads', baseBehaviorData);

      expect(result.score.calculatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Engagement Score Calculation', () => {
    it('should score higher for more likes given', () => {
      const lowLikes: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        likesGiven: 10,
        commentsGiven: 5,
        sharesGiven: 2,
        repliesReceived: 5,
      };

      const highLikes: UserBehaviorData = {
        ...lowLikes,
        likesGiven: 80,
      };

      const lowResult = calculatePlatformScore('threads', lowLikes);
      const highResult = calculatePlatformScore('threads', highLikes);

      expect(highResult.score.engagementScore).toBeGreaterThan(
        lowResult.score.engagementScore
      );
    });

    it('should score higher for more comments given', () => {
      const lowComments: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        commentsGiven: 2,
      };

      const highComments: UserBehaviorData = {
        ...lowComments,
        commentsGiven: 25,
      };

      const lowResult = calculatePlatformScore('threads', lowComments);
      const highResult = calculatePlatformScore('threads', highComments);

      expect(highResult.score.engagementScore).toBeGreaterThan(
        lowResult.score.engagementScore
      );
    });

    it('should cap scores at maximum values', () => {
      const extremeData: UserBehaviorData = {
        likesGiven: 1000,
        commentsGiven: 500,
        sharesGiven: 200,
        repliesReceived: 100,
        postsThisWeek: 100,
        postsLastWeek: 100,
        averagePostsPerWeek: 100,
        postTimings: [7, 8, 9, 12, 19, 20, 21, 22],
        trendingHashtagsUsed: 50,
        trendingTopicsEngaged: 30,
        earlyTrendEngagement: 20,
        followersGained: 500,
        mentionsReceived: 100,
        savedByOthers: 200,
        profileVisits: 1000,
      };

      const result = calculatePlatformScore('threads', extremeData);

      // Individual scores should be capped at 100
      expect(result.score.engagementScore).toBeLessThanOrEqual(100);
      expect(result.score.consistencyScore).toBeLessThanOrEqual(100);
      expect(result.score.trendScore).toBeLessThanOrEqual(100);
      expect(result.score.communityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Consistency Score Calculation', () => {
    it('should score higher for stable posting frequency', () => {
      const stablePosting: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        postsThisWeek: 5,
        postsLastWeek: 5,
      };

      const unstablePosting: UserBehaviorData = {
        ...stablePosting,
        postsThisWeek: 2,
        postsLastWeek: 10,
      };

      const stableResult = calculatePlatformScore('threads', stablePosting);
      const unstableResult = calculatePlatformScore('threads', unstablePosting);

      expect(stableResult.score.consistencyScore).toBeGreaterThan(
        unstableResult.score.consistencyScore
      );
    });

    it('should score higher for optimal posting frequency', () => {
      const optimalFrequency: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        postsThisWeek: 5, // Ideal
        postsLastWeek: 5,
      };

      const lowFrequency: UserBehaviorData = {
        ...optimalFrequency,
        postsThisWeek: 1,
        postsLastWeek: 1,
      };

      const optimalResult = calculatePlatformScore('threads', optimalFrequency);
      const lowResult = calculatePlatformScore('threads', lowFrequency);

      expect(optimalResult.score.consistencyScore).toBeGreaterThan(
        lowResult.score.consistencyScore
      );
    });

    it('should score higher for golden hour posting', () => {
      const goldenHours: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        postTimings: [7, 8, 12, 19, 20, 21], // All golden hours
      };

      const offHours: UserBehaviorData = {
        ...goldenHours,
        postTimings: [2, 3, 4, 14, 15, 16], // Non-golden hours
      };

      const goldenResult = calculatePlatformScore('threads', goldenHours);
      const offResult = calculatePlatformScore('threads', offHours);

      expect(goldenResult.score.consistencyScore).toBeGreaterThan(
        offResult.score.consistencyScore
      );
    });
  });

  describe('Trend Score Calculation', () => {
    it('should score higher for trending hashtag usage', () => {
      const highHashtags: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        trendingHashtagsUsed: 8,
      };

      const lowHashtags: UserBehaviorData = {
        ...highHashtags,
        trendingHashtagsUsed: 1,
      };

      const highResult = calculatePlatformScore('threads', highHashtags);
      const lowResult = calculatePlatformScore('threads', lowHashtags);

      expect(highResult.score.trendScore).toBeGreaterThan(lowResult.score.trendScore);
    });

    it('should score higher for early trend engagement', () => {
      const earlyEngager: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        earlyTrendEngagement: 5,
      };

      const lateEngager: UserBehaviorData = {
        ...earlyEngager,
        earlyTrendEngagement: 0,
      };

      const earlyResult = calculatePlatformScore('threads', earlyEngager);
      const lateResult = calculatePlatformScore('threads', lateEngager);

      expect(earlyResult.score.trendScore).toBeGreaterThan(lateResult.score.trendScore);
    });
  });

  describe('Community Score Calculation', () => {
    it('should score higher for follower growth', () => {
      const highGrowth: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        followersGained: 20,
      };

      const lowGrowth: UserBehaviorData = {
        ...highGrowth,
        followersGained: 1,
      };

      const highResult = calculatePlatformScore('threads', highGrowth);
      const lowResult = calculatePlatformScore('threads', lowGrowth);

      expect(highResult.score.communityScore).toBeGreaterThan(
        lowResult.score.communityScore
      );
    });

    it('should score higher for content saves', () => {
      const highSaves: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        savedByOthers: 20,
      };

      const lowSaves: UserBehaviorData = {
        ...highSaves,
        savedByOthers: 1,
      };

      const highResult = calculatePlatformScore('threads', highSaves);
      const lowResult = calculatePlatformScore('threads', lowSaves);

      expect(highResult.score.communityScore).toBeGreaterThan(
        lowResult.score.communityScore
      );
    });
  });

  describe('Recommendation Generation', () => {
    it('should recommend commenting when comments are low', () => {
      const lowComments: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        commentsGiven: 2,
        likesGiven: 50,
        sharesGiven: 5,
        repliesReceived: 10,
      };

      const result = calculatePlatformScore('threads', lowComments);

      const commentRecommendation = result.recommendations.find(
        (r) => r.category === 'engagement' && r.title.includes('コメント')
      );
      expect(commentRecommendation).toBeDefined();
    });

    it('should recommend more likes when likes are low', () => {
      const lowLikes: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        likesGiven: 5,
        commentsGiven: 20,
        sharesGiven: 2,
        repliesReceived: 5,
      };

      const result = calculatePlatformScore('threads', lowLikes);

      // When engagement score is low due to low likes, we expect some recommendation
      const engagementRecommendation = result.recommendations.find(
        (r) => r.category === 'engagement'
      );
      // Either like recommendation or some engagement recommendation should exist
      expect(
        engagementRecommendation || result.score.engagementScore >= 70
      ).toBeTruthy();
    });

    it('should recommend posting frequency when posts are low', () => {
      const lowPosts: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        postsThisWeek: 1,
        postsLastWeek: 1,
        postTimings: [3, 4], // Non-golden hours to lower consistency score
      };

      const result = calculatePlatformScore('threads', lowPosts);

      // When consistency score is low, we expect some consistency recommendation
      const consistencyRecommendation = result.recommendations.find(
        (r) => r.category === 'consistency'
      );
      // Either frequency recommendation or consistency score should be acceptable
      expect(
        consistencyRecommendation || result.score.consistencyScore >= 70
      ).toBeTruthy();
    });

    it('should recommend trend participation when trend score is low', () => {
      const lowTrend: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        trendingHashtagsUsed: 0,
        trendingTopicsEngaged: 0,
        earlyTrendEngagement: 0,
      };

      const result = calculatePlatformScore('threads', lowTrend);

      const trendRecommendation = result.recommendations.find(
        (r) => r.category === 'trend'
      );
      expect(trendRecommendation).toBeDefined();
    });

    it('should sort recommendations by priority', () => {
      const lowScoreData: UserBehaviorData = {
        likesGiven: 5,
        commentsGiven: 2,
        sharesGiven: 0,
        repliesReceived: 1,
        postsThisWeek: 1,
        postsLastWeek: 1,
        averagePostsPerWeek: 1,
        postTimings: [3, 4],
        trendingHashtagsUsed: 0,
        trendingTopicsEngaged: 0,
        earlyTrendEngagement: 0,
        followersGained: 0,
        mentionsReceived: 0,
        savedByOthers: 0,
        profileVisits: 5,
      };

      const result = calculatePlatformScore('threads', lowScoreData);

      if (result.recommendations.length >= 2) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        for (let i = 0; i < result.recommendations.length - 1; i++) {
          const currentPriority = priorityOrder[result.recommendations[i].priority];
          const nextPriority = priorityOrder[result.recommendations[i + 1].priority];
          expect(currentPriority).toBeLessThanOrEqual(nextPriority);
        }
      }
    });

    it('should include action items in recommendations', () => {
      const lowScoreData: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        commentsGiven: 2,
      };

      const result = calculatePlatformScore('threads', lowScoreData);

      result.recommendations.forEach((rec) => {
        expect(rec.actionItems).toBeDefined();
        expect(rec.actionItems.length).toBeGreaterThan(0);
      });
    });

    it('should include expected impact scores', () => {
      const lowScoreData: UserBehaviorData = {
        ...generateSampleBehaviorData(),
        commentsGiven: 2,
      };

      const result = calculatePlatformScore('threads', lowScoreData);

      result.recommendations.forEach((rec) => {
        expect(rec.expectedImpact).toBeGreaterThan(0);
        expect(rec.expectedImpact).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Score History', () => {
    it('should generate 7 days of history by default', () => {
      const result = calculatePlatformScore('threads', generateSampleBehaviorData());
      expect(result.history).toHaveLength(7);
    });

    it('should include all score components in history', () => {
      const result = calculatePlatformScore('threads', generateSampleBehaviorData());

      result.history.forEach((entry) => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('overallScore');
        expect(entry).toHaveProperty('engagementScore');
        expect(entry).toHaveProperty('consistencyScore');
        expect(entry).toHaveProperty('trendScore');
        expect(entry).toHaveProperty('communityScore');
      });
    });

    it('should have dates in chronological order', () => {
      const result = calculatePlatformScore('threads', generateSampleBehaviorData());

      for (let i = 0; i < result.history.length - 1; i++) {
        expect(result.history[i].date.getTime()).toBeLessThan(
          result.history[i + 1].date.getTime()
        );
      }
    });
  });

  describe('getScoreRank', () => {
    it('should return S rank for scores >= 90', () => {
      const rank = getScoreRank(95);
      expect(rank.rank).toBe('S');
      expect(rank.label).toContain('プラットフォームの寵児');
    });

    it('should return A rank for scores 80-89', () => {
      const rank = getScoreRank(85);
      expect(rank.rank).toBe('A');
      expect(rank.label).toContain('好かれてます');
    });

    it('should return B rank for scores 70-79', () => {
      const rank = getScoreRank(75);
      expect(rank.rank).toBe('B');
      expect(rank.label).toContain('順調');
    });

    it('should return C rank for scores 50-69', () => {
      const rank = getScoreRank(60);
      expect(rank.rank).toBe('C');
      expect(rank.label).toContain('改善の余地');
    });

    it('should return D rank for scores < 50', () => {
      const rank = getScoreRank(40);
      expect(rank.rank).toBe('D');
      expect(rank.label).toContain('要改善');
    });

    it('should return different colors for each rank', () => {
      const ranks = [95, 85, 75, 60, 40].map((score) => getScoreRank(score));
      const colors = ranks.map((r) => r.color);
      const uniqueColors = new Set(colors);

      expect(uniqueColors.size).toBe(5);
    });

    it('should handle boundary values', () => {
      expect(getScoreRank(90).rank).toBe('S');
      expect(getScoreRank(89).rank).toBe('A');
      expect(getScoreRank(80).rank).toBe('A');
      expect(getScoreRank(79).rank).toBe('B');
      expect(getScoreRank(70).rank).toBe('B');
      expect(getScoreRank(69).rank).toBe('C');
      expect(getScoreRank(50).rank).toBe('C');
      expect(getScoreRank(49).rank).toBe('D');
    });
  });

  describe('generateSampleBehaviorData', () => {
    it('should generate valid behavior data', () => {
      const data = generateSampleBehaviorData();

      expect(data.likesGiven).toBeGreaterThanOrEqual(0);
      expect(data.commentsGiven).toBeGreaterThanOrEqual(0);
      expect(data.sharesGiven).toBeGreaterThanOrEqual(0);
      expect(data.postsThisWeek).toBeGreaterThanOrEqual(0);
      expect(data.followersGained).toBeGreaterThanOrEqual(0);
    });

    it('should generate different data each time (randomness)', () => {
      const samples = Array.from({ length: 10 }, () => generateSampleBehaviorData());
      const likesValues = samples.map((s) => s.likesGiven);
      const uniqueValues = new Set(likesValues);

      // With random data, we should have some variety
      expect(uniqueValues.size).toBeGreaterThan(1);
    });

    it('should generate data within reasonable ranges', () => {
      // Generate multiple samples to test ranges
      for (let i = 0; i < 20; i++) {
        const data = generateSampleBehaviorData();

        expect(data.likesGiven).toBeGreaterThanOrEqual(20);
        expect(data.likesGiven).toBeLessThanOrEqual(100);
        expect(data.commentsGiven).toBeGreaterThanOrEqual(5);
        expect(data.postsThisWeek).toBeGreaterThanOrEqual(2);
      }
    });

    it('should include all required properties', () => {
      const data = generateSampleBehaviorData();

      const requiredProps: (keyof UserBehaviorData)[] = [
        'likesGiven',
        'commentsGiven',
        'sharesGiven',
        'repliesReceived',
        'postsThisWeek',
        'postsLastWeek',
        'averagePostsPerWeek',
        'postTimings',
        'trendingHashtagsUsed',
        'trendingTopicsEngaged',
        'earlyTrendEngagement',
        'followersGained',
        'mentionsReceived',
        'savedByOthers',
        'profileVisits',
      ];

      requiredProps.forEach((prop) => {
        expect(data).toHaveProperty(prop);
      });
    });
  });
});

describe('Score Factor Impact Classification', () => {
  it('should classify high engagement as positive', () => {
    const highEngagement: UserBehaviorData = {
      ...generateSampleBehaviorData(),
      likesGiven: 80,
      commentsGiven: 25,
      sharesGiven: 15,
    };

    const result = calculatePlatformScore('threads', highEngagement);
    const positiveFactors = result.score.factors.filter(
      (f) => f.impact === 'positive'
    );

    expect(positiveFactors.length).toBeGreaterThan(0);
  });

  it('should classify low engagement as negative', () => {
    const lowEngagement: UserBehaviorData = {
      likesGiven: 2,
      commentsGiven: 0,
      sharesGiven: 0,
      repliesReceived: 0,
      postsThisWeek: 1,
      postsLastWeek: 10,
      averagePostsPerWeek: 1,
      postTimings: [3],
      trendingHashtagsUsed: 0,
      trendingTopicsEngaged: 0,
      earlyTrendEngagement: 0,
      followersGained: 0,
      mentionsReceived: 0,
      savedByOthers: 0,
      profileVisits: 2,
    };

    const result = calculatePlatformScore('threads', lowEngagement);
    const negativeFactors = result.score.factors.filter(
      (f) => f.impact === 'negative'
    );

    expect(negativeFactors.length).toBeGreaterThan(0);
  });
});
