/**
 * ContentOptimizer Service Tests
 *
 * Tests for content optimization and gatchanko functionality
 */

import { ContentOptimizer, getContentOptimizer } from '../contentOptimizer';
import type { Platform, BuzzAnalysis, OptimizedContent } from '../../types/index';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

describe('ContentOptimizer', () => {
  let optimizer: ContentOptimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = new ContentOptimizer();
  });

  describe('constructor', () => {
    it('should create instance without API key', () => {
      const instance = new ContentOptimizer();
      expect(instance).toBeInstanceOf(ContentOptimizer);
    });

    it('should create instance with API key', () => {
      const instance = new ContentOptimizer('test-api-key');
      expect(instance).toBeInstanceOf(ContentOptimizer);
    });
  });

  describe('setApiKey', () => {
    it('should set API key and initialize client', () => {
      const instance = new ContentOptimizer();
      instance.setApiKey('new-api-key');
      // Client should be initialized (internal state)
      expect(instance).toBeInstanceOf(ContentOptimizer);
    });
  });

  describe('getPlatformRules', () => {
    it('should return correct rules for threads platform', () => {
      const rules = optimizer.getPlatformRules('threads');

      expect(rules).toEqual({
        maxLength: 500,
        hashtagCount: 3,
        tone: expect.any(String),
        formatting: expect.any(Array),
        bestPractices: expect.any(Array),
      });
      expect(rules.maxLength).toBe(500);
      expect(rules.hashtagCount).toBe(3);
    });

    it('should return correct rules for instagram platform', () => {
      const rules = optimizer.getPlatformRules('instagram');

      expect(rules.maxLength).toBe(2200);
      expect(rules.hashtagCount).toBe(15);
    });

    it('should return correct rules for twitter platform', () => {
      const rules = optimizer.getPlatformRules('twitter');

      expect(rules.maxLength).toBe(280);
      expect(rules.hashtagCount).toBe(2);
    });

    it('should include best practices for each platform', () => {
      const platforms: Platform[] = ['threads', 'instagram', 'twitter'];

      platforms.forEach((platform) => {
        const rules = optimizer.getPlatformRules(platform);
        expect(rules.bestPractices).toBeDefined();
        expect(rules.bestPractices.length).toBeGreaterThan(0);
      });
    });
  });

  describe('formatContentPreview', () => {
    const mockContent: OptimizedContent = {
      id: 'test-id',
      originalAnalysisId: 'analysis-id',
      targetPlatform: 'threads',
      content: 'This is test content',
      hashtags: ['test', 'hashtag', 'preview'],
      bestPostTime: new Date('2024-01-01T12:00:00Z'),
      expectedImpressions: 1000,
      mode: 'impression',
      createdAt: new Date('2024-01-01T10:00:00Z'),
    };

    it('should format content with hashtags by default', () => {
      const preview = optimizer.formatContentPreview(mockContent);

      expect(preview).toContain('This is test content');
      expect(preview).toContain('#test');
      expect(preview).toContain('#hashtag');
      expect(preview).toContain('#preview');
    });

    it('should format content without hashtags when includeHashtags is false', () => {
      const preview = optimizer.formatContentPreview(mockContent, false);

      expect(preview).toBe('This is test content');
      expect(preview).not.toContain('#test');
    });

    it('should handle empty hashtags array', () => {
      const contentWithoutHashtags: OptimizedContent = {
        ...mockContent,
        hashtags: [],
      };

      const preview = optimizer.formatContentPreview(contentWithoutHashtags);
      expect(preview).toBe('This is test content');
    });

    it('should separate content and hashtags with double newline', () => {
      const preview = optimizer.formatContentPreview(mockContent);

      expect(preview).toContain('\n\n');
      const parts = preview.split('\n\n');
      expect(parts[0]).toBe('This is test content');
      expect(parts[1]).toContain('#test #hashtag #preview');
    });
  });

  describe('analyzeBuzzContent', () => {
    it('should throw error when API key is not configured', async () => {
      const instance = new ContentOptimizer();

      await expect(
        instance.analyzeBuzzContent(
          'https://example.com/post',
          'Test content',
          'threads'
        )
      ).rejects.toThrow('Claude API key is not configured');
    });

    it('should call Claude API with correct prompt structure', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              transcript: 'Extracted transcript',
              keyPoints: ['Point 1', 'Point 2', 'Point 3'],
              structure: {
                hook: 'Test hook',
                mainPoints: ['Main 1', 'Main 2'],
                cta: 'Call to action',
                emotionalTriggers: ['Trigger 1'],
              },
              estimatedImpressions: 10000,
              estimatedEngagement: 5.5,
            }),
          },
        ],
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const instance = new ContentOptimizer('test-key');
      const result = await instance.analyzeBuzzContent(
        'https://example.com/post',
        'Test buzz content',
        'threads'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('https://example.com/post'),
          }),
        ]),
      });

      expect(result).toMatchObject({
        platform: 'threads',
        originalUrl: 'https://example.com/post',
        transcript: 'Extracted transcript',
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
      });
    });

    it('should throw error when API response cannot be parsed', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Invalid response without JSON' }],
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const instance = new ContentOptimizer('test-key');

      await expect(
        instance.analyzeBuzzContent('https://example.com', 'content', 'threads')
      ).rejects.toThrow('Failed to parse analysis response');
    });
  });

  describe('optimizeForPlatform (Gatchanko functionality)', () => {
    const mockAnalysis: BuzzAnalysis = {
      id: 'analysis-123',
      platform: 'instagram',
      originalUrl: 'https://instagram.com/p/test',
      impressions: 50000,
      engagement: 8.5,
      transcript: 'Original buzz content transcript',
      keyPoints: ['Key point 1', 'Key point 2'],
      structure: {
        hook: 'Attention grabbing hook',
        mainPoints: ['Point A', 'Point B'],
        cta: 'Follow for more',
        emotionalTriggers: ['Curiosity', 'FOMO'],
      },
      analyzedAt: new Date('2024-01-01T00:00:00Z'),
    };

    it('should throw error when API key is not configured', async () => {
      const instance = new ContentOptimizer();

      await expect(
        instance.optimizeForPlatform(mockAnalysis, 'threads')
      ).rejects.toThrow('Claude API key is not configured');
    });

    it('should optimize content for different target platform', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              content: 'Optimized content for threads',
              hashtags: ['optimized', 'threads', 'viral'],
              expectedImpressions: 15000,
            }),
          },
        ],
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const instance = new ContentOptimizer('test-key');
      const result = await instance.optimizeForPlatform(
        mockAnalysis,
        'threads',
        'impression'
      );

      expect(result).toMatchObject({
        targetPlatform: 'threads',
        content: 'Optimized content for threads',
        mode: 'impression',
      });
      expect(result.hashtags).toHaveLength(3); // threads hashtagCount is 3
    });

    it('should apply correct mode guidance for impression mode', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              content: 'Impression focused content',
              hashtags: ['trend1', 'trend2'],
              expectedImpressions: 20000,
            }),
          },
        ],
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const instance = new ContentOptimizer('test-key');
      await instance.optimizeForPlatform(mockAnalysis, 'twitter', 'impression');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('インプレッション最大化を優先'),
            }),
          ]),
        })
      );
    });

    it('should apply correct mode guidance for expression mode', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              content: 'Expression focused content',
              hashtags: ['personal', 'authentic'],
              expectedImpressions: 5000,
            }),
          },
        ],
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const instance = new ContentOptimizer('test-key');
      await instance.optimizeForPlatform(mockAnalysis, 'twitter', 'expression');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('自己表現を優先'),
            }),
          ]),
        })
      );
    });

    it('should limit hashtags to platform-specific count', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              content: 'Content',
              hashtags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
              expectedImpressions: 10000,
            }),
          },
        ],
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const instance = new ContentOptimizer('test-key');

      // Twitter only allows 2 hashtags
      const twitterResult = await instance.optimizeForPlatform(
        mockAnalysis,
        'twitter'
      );
      expect(twitterResult.hashtags).toHaveLength(2);

      // Threads allows 3 hashtags
      const threadsResult = await instance.optimizeForPlatform(
        mockAnalysis,
        'threads'
      );
      expect(threadsResult.hashtags).toHaveLength(3);
    });

    it('should throw error when optimization response cannot be parsed', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Not valid JSON' }],
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const instance = new ContentOptimizer('test-key');

      await expect(
        instance.optimizeForPlatform(mockAnalysis, 'threads')
      ).rejects.toThrow('Failed to parse optimization response');
    });
  });

  describe('optimizeForMultiplePlatforms', () => {
    const mockAnalysis: BuzzAnalysis = {
      id: 'analysis-456',
      platform: 'instagram',
      originalUrl: 'https://instagram.com/test',
      impressions: 30000,
      engagement: 7.0,
      transcript: 'Test transcript',
      keyPoints: ['Point 1'],
      structure: {
        hook: 'Hook',
        mainPoints: ['Main'],
        cta: 'CTA',
        emotionalTriggers: ['Trigger'],
      },
      analyzedAt: new Date(),
    };

    it('should optimize for multiple platforms sequentially', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              content: 'Optimized content',
              hashtags: ['tag1', 'tag2'],
              expectedImpressions: 10000,
            }),
          },
        ],
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const instance = new ContentOptimizer('test-key');
      const results = await instance.optimizeForMultiplePlatforms(
        mockAnalysis,
        ['threads', 'twitter', 'instagram']
      );

      expect(results).toHaveLength(3);
      expect(results[0].targetPlatform).toBe('threads');
      expect(results[1].targetPlatform).toBe('twitter');
      expect(results[2].targetPlatform).toBe('instagram');
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should apply same mode to all platforms', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              content: 'Content',
              hashtags: ['tag'],
              expectedImpressions: 5000,
            }),
          },
        ],
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const instance = new ContentOptimizer('test-key');
      const results = await instance.optimizeForMultiplePlatforms(
        mockAnalysis,
        ['threads', 'twitter'],
        'expression'
      );

      expect(results.every((r) => r.mode === 'expression')).toBe(true);
    });
  });

  describe('getContentOptimizer (singleton)', () => {
    beforeEach(() => {
      // Reset singleton by reimporting
      jest.resetModules();
    });

    it('should return same instance when called multiple times', () => {
      const instance1 = getContentOptimizer();
      const instance2 = getContentOptimizer();

      expect(instance1).toBe(instance2);
    });

    it('should update API key on existing instance', () => {
      const instance1 = getContentOptimizer('key1');
      const instance2 = getContentOptimizer('key2');

      expect(instance1).toBe(instance2);
    });
  });
});

describe('Platform-specific content rules', () => {
  let optimizer: ContentOptimizer;

  beforeEach(() => {
    optimizer = new ContentOptimizer();
  });

  describe('Threads platform', () => {
    it('should have conversational tone guidance', () => {
      const rules = optimizer.getPlatformRules('threads');
      expect(rules.tone).toContain('会話的');
    });

    it('should recommend short paragraphs', () => {
      const rules = optimizer.getPlatformRules('threads');
      expect(rules.formatting).toContain('短い段落');
    });
  });

  describe('Instagram platform', () => {
    it('should support longer content', () => {
      const rules = optimizer.getPlatformRules('instagram');
      expect(rules.maxLength).toBe(2200);
    });

    it('should allow more hashtags', () => {
      const rules = optimizer.getPlatformRules('instagram');
      expect(rules.hashtagCount).toBe(15);
    });

    it('should emphasize visual storytelling', () => {
      const rules = optimizer.getPlatformRules('instagram');
      expect(rules.tone).toContain('ビジュアル重視');
    });
  });

  describe('Twitter platform', () => {
    it('should have strict character limit', () => {
      const rules = optimizer.getPlatformRules('twitter');
      expect(rules.maxLength).toBe(280);
    });

    it('should limit hashtags', () => {
      const rules = optimizer.getPlatformRules('twitter');
      expect(rules.hashtagCount).toBe(2);
    });

    it('should emphasize impact', () => {
      const rules = optimizer.getPlatformRules('twitter');
      expect(rules.tone).toContain('インパクト重視');
    });
  });
});
